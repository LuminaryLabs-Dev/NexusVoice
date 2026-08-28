#include "nexusvoice.h"

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <fstream>
#include <iostream>
#include <set>
#include <string>

namespace {
void write_u16(std::ofstream& stream, uint16_t value) {
    stream.put(static_cast<char>(value & 0xff));
    stream.put(static_cast<char>((value >> 8) & 0xff));
}

void write_u32(std::ofstream& stream, uint32_t value) {
    write_u16(stream, static_cast<uint16_t>(value & 0xffff));
    write_u16(stream, static_cast<uint16_t>((value >> 16) & 0xffff));
}

bool write_wave(const char* filename, const NexusVoiceBuffer& audio) {
    std::ofstream stream(filename, std::ios::binary);
    if (!stream) {
        return false;
    }

    const uint32_t data_size = static_cast<uint32_t>(audio.sample_count * 2);
    stream.write("RIFF", 4);
    write_u32(stream, 36 + data_size);
    stream.write("WAVEfmt ", 8);
    write_u32(stream, 16);
    write_u16(stream, 1);
    write_u16(stream, 1);
    write_u32(stream, static_cast<uint32_t>(audio.sample_rate));
    write_u32(stream, static_cast<uint32_t>(audio.sample_rate * 2));
    write_u16(stream, 2);
    write_u16(stream, 16);
    stream.write("data", 4);
    write_u32(stream, data_size);

    for (int32_t index = 0; index < audio.sample_count; ++index) {
        const float value = std::clamp(audio.samples[index], -1.0f, 1.0f);
        const auto pcm = static_cast<int16_t>(std::lround(value * 32767.0f));
        write_u16(stream, static_cast<uint16_t>(pcm));
    }
    return stream.good();
}
}

int main(int argc, char** argv) {
    if (argc != 3) {
        std::cerr << "Usage: nexusvoice_native_smoke MODEL_DIRECTORY OUTPUT_WAV\n";
        return 1;
    }

    NexusVoiceRuntime* runtime = nullptr;
    NexusVoiceBuffer buffer{};
    if (nexusvoice_synthesize(runtime, "hello", "af_heart", 1.0f, &buffer)
        != NEXUSVOICE_ERROR_INVALID_ARGUMENT) {
        std::cerr << "Synthesis accepted a missing runtime.\n";
        return 2;
    }

    if (nexusvoice_create("/nexusvoice/path/that/does/not/exist", &runtime)
        != NEXUSVOICE_ERROR_MODEL) {
        std::cerr << "Creation accepted a missing model directory.\n";
        return 3;
    }
    if (std::strlen(nexusvoice_last_error(nullptr)) == 0) {
        std::cerr << "Creation failure did not expose an error.\n";
        return 4;
    }

    if (nexusvoice_create(argv[1], &runtime) != NEXUSVOICE_OK || !runtime) {
        std::cerr << "Native runtime creation failed: "
                  << nexusvoice_last_error(runtime) << "\n";
        return 5;
    }

    if (std::strstr(nexusvoice_runtime_version(), "0.1.0-preview.1") == nullptr) {
        std::cerr << "Native runtime reports the wrong package version.\n";
        nexusvoice_destroy(runtime);
        return 6;
    }

    const std::set<std::string> required_voices = {
        "af_heart", "af_bella", "af_nicole", "am_michael",
        "am_fenrir", "bf_emma", "bm_george"
    };
    std::set<std::string> available_voices;
    for (int32_t index = 0; index < nexusvoice_voice_count(runtime); ++index) {
        const char* id = nexusvoice_voice_id(runtime, index);
        if (id) {
            available_voices.emplace(id);
        }
    }
    for (const std::string& id : required_voices) {
        if (available_voices.count(id) == 0) {
            std::cerr << "Native runtime is missing voice: " << id << "\n";
            nexusvoice_destroy(runtime);
            return 7;
        }
    }

    const char* text =
        "The voice engine asked for a raise. Apparently it has been working text to speech.";
    const int32_t status = nexusvoice_synthesize(
        runtime, text, "af_heart", 0.96f, &buffer);
    if (status != NEXUSVOICE_OK) {
        std::cerr << "Native synthesis failed: " << nexusvoice_last_error(runtime) << "\n";
        nexusvoice_destroy(runtime);
        return 8;
    }

    if (!buffer.samples || buffer.sample_count < 12000 || buffer.sample_rate != 24000) {
        std::cerr << "Native synthesis returned an invalid audio buffer.\n";
        nexusvoice_free_buffer(&buffer);
        nexusvoice_destroy(runtime);
        return 9;
    }

    double squared_sum = 0.0;
    float peak = 0.0f;
    for (int32_t index = 0; index < buffer.sample_count; ++index) {
        const float sample = buffer.samples[index];
        if (!std::isfinite(sample)) {
            std::cerr << "Native synthesis returned non-finite audio.\n";
            nexusvoice_free_buffer(&buffer);
            nexusvoice_destroy(runtime);
            return 10;
        }
        peak = std::max(peak, std::abs(sample));
        squared_sum += static_cast<double>(sample) * sample;
    }
    const double rms = std::sqrt(squared_sum / buffer.sample_count);
    if (peak < 0.01f || peak > 1.01f || rms < 0.001) {
        std::cerr << "Native synthesis failed its signal checks.\n";
        nexusvoice_free_buffer(&buffer);
        nexusvoice_destroy(runtime);
        return 11;
    }

    if (!write_wave(argv[2], buffer)) {
        std::cerr << "Could not write native smoke WAV.\n";
        nexusvoice_free_buffer(&buffer);
        nexusvoice_destroy(runtime);
        return 12;
    }
    nexusvoice_free_buffer(&buffer);

    if (nexusvoice_synthesize(runtime, "hello", "missing_voice", 1.0f, &buffer)
        != NEXUSVOICE_ERROR_VOICE) {
        std::cerr << "Native synthesis accepted an unknown voice.\n";
        nexusvoice_destroy(runtime);
        return 13;
    }

    nexusvoice_reset_cancel(runtime);
    nexusvoice_cancel(runtime);
    if (nexusvoice_synthesize(runtime, "This request should cancel.", "af_heart", 1.0f, &buffer)
        != NEXUSVOICE_ERROR_CANCELLED) {
        std::cerr << "Native synthesis did not honor cancellation.\n";
        nexusvoice_free_buffer(&buffer);
        nexusvoice_destroy(runtime);
        return 14;
    }

    nexusvoice_free_buffer(&buffer);
    nexusvoice_destroy(runtime);
    std::cout << "NexusVoice native Kokoro smoke test passed: "
              << available_voices.size() << " voices, peak " << peak
              << ", RMS " << rms << ".\n";
    return 0;
}
