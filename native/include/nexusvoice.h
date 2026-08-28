#pragma once

#include <stdint.h>

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

typedef struct NexusVoiceRuntime NexusVoiceRuntime;

typedef struct NexusVoiceBuffer {
    const float* samples;
    int32_t sample_count;
    int32_t sample_rate;
} NexusVoiceBuffer;

typedef enum NexusVoiceStatus {
    NEXUSVOICE_OK = 0,
    NEXUSVOICE_ERROR_INVALID_ARGUMENT = -1,
    NEXUSVOICE_ERROR_NOT_INITIALIZED = -2,
    NEXUSVOICE_ERROR_MODEL = -3,
    NEXUSVOICE_ERROR_VOICE = -4,
    NEXUSVOICE_ERROR_GENERATION = -5,
    NEXUSVOICE_ERROR_MEMORY = -6,
    NEXUSVOICE_ERROR_CANCELLED = -7
} NexusVoiceStatus;

NEXUSVOICE_API const char* nexusvoice_runtime_version(void);
NEXUSVOICE_API int32_t nexusvoice_create(
    const char* model_directory,
    NexusVoiceRuntime** output_runtime);
NEXUSVOICE_API int32_t nexusvoice_synthesize(
    NexusVoiceRuntime* runtime,
    const char* text,
    const char* voice,
    float speed,
    NexusVoiceBuffer* output);
NEXUSVOICE_API void nexusvoice_reset_cancel(NexusVoiceRuntime* runtime);
NEXUSVOICE_API void nexusvoice_cancel(NexusVoiceRuntime* runtime);
NEXUSVOICE_API int32_t nexusvoice_voice_count(const NexusVoiceRuntime* runtime);
NEXUSVOICE_API const char* nexusvoice_voice_id(
    const NexusVoiceRuntime* runtime,
    int32_t index);
NEXUSVOICE_API const char* nexusvoice_last_error(
    const NexusVoiceRuntime* runtime);
NEXUSVOICE_API void nexusvoice_free_buffer(NexusVoiceBuffer* output);
NEXUSVOICE_API void nexusvoice_destroy(NexusVoiceRuntime* runtime);

#ifdef __cplusplus
}
#endif
