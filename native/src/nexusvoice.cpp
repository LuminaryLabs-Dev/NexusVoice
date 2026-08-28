#include "nexusvoice.h"
#include "kokoro_runtime.h"

#include <cstdlib>
#include <memory>
#include <mutex>
#include <string>

namespace {
std::mutex runtime_mutex;
std::unique_ptr<KokoroRuntime> runtime;
thread_local std::string last_error;

void clear_buffer(NexusVoiceBuffer* output) {
    if (output) {
        output->samples = nullptr;
        output->sample_count = 0;
        output->sample_rate = 24000;
    }
}
}

const char* nexusvoice_runtime_version(void) {
    return "0.0.1-preview.1-native-boundary";
}

int nexusvoice_initialize(const char* model_directory) {
    std::lock_guard<std::mutex> guard(runtime_mutex);
    last_error.clear();

    if (!model_directory || model_directory[0] == '\0') {
        last_error = "NexusVoice model directory is required.";
        return -1;
    }

    auto candidate = std::make_unique<KokoroRuntime>();
    if (!candidate->initialize(model_directory, last_error)) {
        return -2;
    }

    runtime = std::move(candidate);
    return 0;
}

int nexusvoice_synthesize(const char* text, const char* voice, float speed, NexusVoiceBuffer* output) {
    std::lock_guard<std::mutex> guard(runtime_mutex);
    clear_buffer(output);
    last_error.clear();

    if (!output) {
        last_error = "NexusVoice output buffer is required.";
        return -1;
    }
    if (!runtime) {
        last_error = "NexusVoice native runtime is not initialized.";
        return -2;
    }
    if (!text || text[0] == '\0') {
        last_error = "NexusVoice speech text is required.";
        return -3;
    }
    if (!voice || voice[0] == '\0') {
        last_error = "NexusVoice voice id is required.";
        return -4;
    }
    if (speed < 0.5f || speed > 1.5f) {
        last_error = "NexusVoice speed must be between 0.5 and 1.5.";
        return -5;
    }

    return runtime->synthesize(text, voice, speed, output, last_error) ? 0 : -6;
}

const char* nexusvoice_last_error(void) {
    return last_error.c_str();
}

void nexusvoice_free_buffer(NexusVoiceBuffer* output) {
    if (output) {
        std::free(const_cast<float*>(output->samples));
        output->samples = nullptr;
        output->sample_count = 0;
    }
}

void nexusvoice_shutdown(void) {
    std::lock_guard<std::mutex> guard(runtime_mutex);
    runtime.reset();
    last_error.clear();
}
