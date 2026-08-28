#pragma once

#include "nexusvoice.h"

#include <filesystem>
#include <string>

class KokoroRuntime {
public:
    bool initialize(const std::filesystem::path& model_directory, std::string& error);
    bool synthesize(
        const char* text,
        const char* voice,
        float speed,
        NexusVoiceBuffer* output,
        std::string& error);

private:
    std::filesystem::path model_directory_;
};
