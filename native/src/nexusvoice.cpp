#include "nexusvoice.h"

#include <cstdlib>

const char* nexusvoice_runtime_version(void) {
    return "0.1.0-preview.native-boundary";
}

int nexusvoice_synthesize(const char*, const char*, float, NexusVoiceBuffer* output) {
    if (output) {
        output->samples = nullptr;
        output->sample_count = 0;
        output->sample_rate = 24000;
    }
    return -1;
}

void nexusvoice_free_buffer(NexusVoiceBuffer* output) {
    if (output) {
        std::free(const_cast<float*>(output->samples));
        output->samples = nullptr;
        output->sample_count = 0;
    }
}
