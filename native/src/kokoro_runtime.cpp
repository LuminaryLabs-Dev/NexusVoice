#include "kokoro_runtime.h"

#include "sherpa-onnx/c-api/c-api.h"

#include <array>
#include <cmath>
#include <cstdlib>
#include <cstring>

namespace {
constexpr int32_t sample_rate = 24000;
constexpr std::array<const char*, 5> required_files = {
    "model.onnx",
    "voices.bin",
    "tokens.txt",
    "lexicon-us-en.txt",
    "espeak-ng-data"
};

constexpr std::array<const char*, 53> voice_ids = {
    "af_alloy", "af_aoede", "af_bella", "af_heart", "af_jessica",
    "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
    "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael",
    "am_onyx", "am_puck", "am_santa", "bf_alice", "bf_emma", "bf_isabella",
    "bf_lily", "bm_daniel", "bm_fable", "bm_george", "bm_lewis", "ef_dora",
    "em_alex", "ff_siwis", "hf_alpha", "hf_beta", "hm_omega", "hm_psi",
    "if_sara", "im_nicola", "jf_alpha", "jf_gongitsune", "jf_nezumi",
    "jf_tebukuro", "jm_kumo", "pf_dora", "pm_alex", "pm_santa", "zf_xiaobei",
    "zf_xiaoni", "zf_xiaoxiao", "zf_xiaoyi", "zm_yunjian", "zm_yunxi",
    "zm_yunxia", "zm_yunyang"
};
}

KokoroRuntime::~KokoroRuntime() {
    shutdown();
}

bool KokoroRuntime::initialize(
    const std::filesystem::path& model_directory,
    std::string& error) {
    shutdown();

    if (!std::filesystem::is_directory(model_directory)) {
        error = "NexusVoice model directory does not exist: " + model_directory.string();
        return false;
    }

    for (const char* filename : required_files) {
        const auto required_path = model_directory / filename;
        const bool exists = std::strcmp(filename, "espeak-ng-data") == 0
            ? std::filesystem::is_directory(required_path)
            : std::filesystem::is_regular_file(required_path);
        if (!exists) {
            error = "NexusVoice model asset is missing: " + required_path.string();
            return false;
        }
    }

    model_directory_ = std::filesystem::absolute(model_directory);
    model_path_ = (model_directory_ / "model.onnx").string();
    voices_path_ = (model_directory_ / "voices.bin").string();
    tokens_path_ = (model_directory_ / "tokens.txt").string();
    data_path_ = (model_directory_ / "espeak-ng-data").string();
    lexicon_path_ = (model_directory_ / "lexicon-us-en.txt").string();

    SherpaOnnxOfflineTtsConfig config{};
    config.model.kokoro.model = model_path_.c_str();
    config.model.kokoro.voices = voices_path_.c_str();
    config.model.kokoro.tokens = tokens_path_.c_str();
    config.model.kokoro.data_dir = data_path_.c_str();
    config.model.kokoro.lexicon = lexicon_path_.c_str();
    config.model.kokoro.lang = "en-us";
    config.model.kokoro.length_scale = 1.0f;
    config.model.num_threads = 2;
    config.model.debug = 0;
    config.model.provider = "cpu";
    config.max_num_sentences = 1;
    config.silence_scale = 0.2f;

    tts_ = SherpaOnnxCreateOfflineTts(&config);
    if (!tts_) {
        error = "Sherpa-ONNX could not initialize the Kokoro model pack.";
        return false;
    }

    const int32_t actual_sample_rate = SherpaOnnxOfflineTtsSampleRate(tts_);
    const int32_t actual_voice_count = SherpaOnnxOfflineTtsNumSpeakers(tts_);
    if (actual_sample_rate != sample_rate
        || actual_voice_count != static_cast<int32_t>(voice_ids.size())) {
        error = "The Kokoro model metadata is incompatible with this NexusVoice runtime.";
        shutdown();
        return false;
    }

    cancelled_.store(false, std::memory_order_release);
    return true;
}

int32_t KokoroRuntime::synthesize(
    const char* text,
    const char* voice,
    float speed,
    NexusVoiceBuffer* output,
    std::string& error) {
    std::lock_guard<std::mutex> guard(generation_mutex_);
    if (!tts_) {
        error = "NexusVoice native runtime is not initialized.";
        return NEXUSVOICE_ERROR_NOT_INITIALIZED;
    }

    const int32_t sid = speaker_id(voice);
    if (sid < 0) {
        error = "NexusVoice does not recognize voice id: " + std::string(voice);
        return NEXUSVOICE_ERROR_VOICE;
    }

    SherpaOnnxGenerationConfig config{};
    config.silence_scale = 0.2f;
    config.speed = speed;
    config.sid = sid;
    config.extra = "{\"lang\":\"en-us\"}";

    const SherpaOnnxGeneratedAudio* generated =
        SherpaOnnxOfflineTtsGenerateWithConfig(
            tts_, text, &config, &KokoroRuntime::progress, this);

    if (cancelled_.load(std::memory_order_acquire)) {
        if (generated) {
            SherpaOnnxDestroyOfflineTtsGeneratedAudio(generated);
        }
        error = "NexusVoice generation was cancelled.";
        return NEXUSVOICE_ERROR_CANCELLED;
    }

    if (!generated || !generated->samples || generated->n <= 0
        || generated->sample_rate != sample_rate) {
        if (generated) {
            SherpaOnnxDestroyOfflineTtsGeneratedAudio(generated);
        }
        error = "Sherpa-ONNX returned no valid Kokoro audio.";
        return NEXUSVOICE_ERROR_GENERATION;
    }

    double sum = 0.0;
    int32_t rail_count = 0;
    for (int32_t index = 0; index < generated->n; ++index) {
        const float sample = generated->samples[index];
        if (!std::isfinite(sample)) {
            SherpaOnnxDestroyOfflineTtsGeneratedAudio(generated);
            error = "Kokoro generated non-finite audio samples.";
            return NEXUSVOICE_ERROR_GENERATION;
        }
        sum += sample;
        if (std::abs(sample) >= 0.9995f) {
            ++rail_count;
        }
    }

    const double dc_offset = std::abs(sum / generated->n);
    const double rail_ratio = static_cast<double>(rail_count) / generated->n;
    if (dc_offset > 0.5 || rail_ratio > 0.25) {
        SherpaOnnxDestroyOfflineTtsGeneratedAudio(generated);
        error = "Kokoro generated an unsafe clipped audio buffer.";
        return NEXUSVOICE_ERROR_GENERATION;
    }

    const size_t byte_count = static_cast<size_t>(generated->n) * sizeof(float);
    float* samples = static_cast<float*>(std::malloc(byte_count));
    if (!samples) {
        SherpaOnnxDestroyOfflineTtsGeneratedAudio(generated);
        error = "NexusVoice could not allocate the generated audio buffer.";
        return NEXUSVOICE_ERROR_MEMORY;
    }

    std::memcpy(samples, generated->samples, byte_count);
    output->samples = samples;
    output->sample_count = generated->n;
    output->sample_rate = generated->sample_rate;
    SherpaOnnxDestroyOfflineTtsGeneratedAudio(generated);
    return NEXUSVOICE_OK;
}

void KokoroRuntime::cancel() {
    cancelled_.store(true, std::memory_order_release);
}

void KokoroRuntime::reset_cancel() {
    cancelled_.store(false, std::memory_order_release);
}

int32_t KokoroRuntime::voice_count() const {
    return static_cast<int32_t>(voice_ids.size());
}

const char* KokoroRuntime::voice_id(int32_t index) const {
    return index >= 0 && index < static_cast<int32_t>(voice_ids.size())
        ? voice_ids[static_cast<size_t>(index)]
        : nullptr;
}

int32_t KokoroRuntime::progress(
    const float*,
    int32_t,
    float,
    void* context) {
    const auto* runtime = static_cast<KokoroRuntime*>(context);
    return runtime->cancelled_.load(std::memory_order_acquire) ? 0 : 1;
}

int32_t KokoroRuntime::speaker_id(const char* voice) const {
    for (size_t index = 0; index < voice_ids.size(); ++index) {
        if (std::strcmp(voice_ids[index], voice) == 0) {
            return static_cast<int32_t>(index);
        }
    }
    return -1;
}

void KokoroRuntime::shutdown() {
    if (tts_) {
        SherpaOnnxDestroyOfflineTts(tts_);
        tts_ = nullptr;
    }
}
