#pragma once

#include "nexusvoice.h"

#include <atomic>
#include <filesystem>
#include <mutex>
#include <string>

struct SherpaOnnxOfflineTts;

class KokoroRuntime {
public:
    KokoroRuntime() = default;
    ~KokoroRuntime();

    KokoroRuntime(const KokoroRuntime&) = delete;
    KokoroRuntime& operator=(const KokoroRuntime&) = delete;

    bool initialize(const std::filesystem::path& model_directory, std::string& error);
    int32_t synthesize(
        const char* text,
        const char* voice,
        float speed,
        NexusVoiceBuffer* output,
        std::string& error);
    void reset_cancel();
    void cancel();

    int32_t voice_count() const;
    const char* voice_id(int32_t index) const;

private:
    static int32_t progress(
        const float* samples,
        int32_t sample_count,
        float progress,
        void* context);
    int32_t speaker_id(const char* voice) const;
    void shutdown();

    std::filesystem::path model_directory_;
    std::string model_path_;
    std::string voices_path_;
    std::string tokens_path_;
    std::string data_path_;
    std::string lexicon_path_;
    const SherpaOnnxOfflineTts* tts_ = nullptr;
    std::atomic<bool> cancelled_{false};
    std::mutex generation_mutex_;
};
