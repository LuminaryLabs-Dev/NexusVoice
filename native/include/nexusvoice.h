#pragma once

#ifdef _WIN32
  #ifdef NEXUSVOICE_BUILDING
    #define NEXUSVOICE_API __declspec(dllexport)
  #else
    #define NEXUSVOICE_API __declspec(dllimport)
  #endif
#else
  #define NEXUSVOICE_API __attribute__((visibility("default")))
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef struct NexusVoiceBuffer {
    const float* samples;
    int sample_count;
    int sample_rate;
} NexusVoiceBuffer;

NEXUSVOICE_API const char* nexusvoice_runtime_version(void);
NEXUSVOICE_API int nexusvoice_initialize(const char* model_directory);
NEXUSVOICE_API int nexusvoice_synthesize(const char* text, const char* voice, float speed, NexusVoiceBuffer* output);
NEXUSVOICE_API const char* nexusvoice_last_error(void);
NEXUSVOICE_API void nexusvoice_free_buffer(NexusVoiceBuffer* output);
NEXUSVOICE_API void nexusvoice_shutdown(void);

#ifdef __cplusplus
}
#endif
