#include "nexusvoice.h"
#include "kokoro_runtime.h"

#include <cstdlib>
#include <cstring>
#include <memory>
#include <new>
#include <string>

struct NexusVoiceRuntime {
    KokoroRuntime kokoro;
    std::string last_error;
};

namespace {
thread_local std::string startup_error;

void clear_buffer(NexusVoiceBuffer* output) {
    if (output) {
        output->samples = nullptr;
        output->sample_count = 0;
        output->sample_rate = 24000;
    }
}
}

const char* nexusvoice_runtime_version(void) {
    return "0.1.0-preview.1+sherpa-onnx-1.13.6";
}

int32_t nexusvoice_create(
    const char* model_directory,
    NexusVoiceRuntime** output_runtime) {
    startup_error.clear();
    if (!output_runtime) {
        startup_error = "NexusVoice runtime output is required.";
        return NEXUSVOICE_ERROR_INVALID_ARGUMENT;
    }
    *output_runtime = nullptr;
    if (!model_directory || model_directory[0] == '\0') {
        startup_error = "NexusVoice model directory is required.";
        return NEXUSVOICE_ERROR_INVALID_ARGUMENT;
    }

    std::unique_ptr<NexusVoiceRuntime> candidate(new (std::nothrow) NexusVoiceRuntime());
    if (!candidate) {
        startup_error = "NexusVoice could not allocate its native runtime.";
        return NEXUSVOICE_ERROR_MEMORY;
    }

    if (!candidate->kokoro.initialize(model_directory, candidate->last_error)) {
        startup_error = candidate->last_error;
        return NEXUSVOICE_ERROR_MODEL;
    }

    *output_runtime = candidate.release();
    return NEXUSVOICE_OK;
}

int32_t nexusvoice_synthesize(
    NexusVoiceRuntime* runtime,
    const char* text,
    const char* voice,
    float speed,
    NexusVoiceBuffer* output) {
    clear_buffer(output);
    if (!runtime || !output) {
        startup_error = "NexusVoice runtime and output buffer are required.";
        return NEXUSVOICE_ERROR_INVALID_ARGUMENT;
    }
    runtime->last_error.clear();
    if (!text || text[0] == '\0') {
        runtime->last_error = "NexusVoice speech text is required.";
        return NEXUSVOICE_ERROR_INVALID_ARGUMENT;
    }
    if (std::strlen(text) > 8192) {
        runtime->last_error = "NexusVoice speech text exceeds 8192 UTF-8 bytes.";
        return NEXUSVOICE_ERROR_INVALID_ARGUMENT;
    }
    if (!voice || voice[0] == '\0') {
        runtime->last_error = "NexusVoice voice id is required.";
        return NEXUSVOICE_ERROR_INVALID_ARGUMENT;
    }
    if (speed < 0.5f || speed > 1.5f) {
        runtime->last_error = "NexusVoice speed must be between 0.5 and 1.5.";
        return NEXUSVOICE_ERROR_INVALID_ARGUMENT;
    }

    return runtime->kokoro.synthesize(
        text,
        voice,
        speed,
        output,
        runtime->last_error);
}

void nexusvoice_cancel(NexusVoiceRuntime* runtime) {
    if (runtime) {
        runtime->kokoro.cancel();
    }
}

void nexusvoice_reset_cancel(NexusVoiceRuntime* runtime) {
    if (runtime) {
        runtime->kokoro.reset_cancel();
    }
}

int32_t nexusvoice_voice_count(const NexusVoiceRuntime* runtime) {
    return runtime ? runtime->kokoro.voice_count() : 0;
}

const char* nexusvoice_voice_id(
    const NexusVoiceRuntime* runtime,
    int32_t index) {
    return runtime ? runtime->kokoro.voice_id(index) : nullptr;
}

const char* nexusvoice_last_error(const NexusVoiceRuntime* runtime) {
    return runtime ? runtime->last_error.c_str() : startup_error.c_str();
}

void nexusvoice_free_buffer(NexusVoiceBuffer* output) {
    if (output) {
        std::free(const_cast<float*>(output->samples));
        clear_buffer(output);
    }
}

void nexusvoice_destroy(NexusVoiceRuntime* runtime) {
    delete runtime;
}
