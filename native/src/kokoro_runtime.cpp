#include "kokoro_runtime.h"

#include <array>

namespace {
constexpr std::array<const char*, 4> required_files = {
    "model_quantized.onnx",
    "config.json",
    "tokenizer.json",
    "tokenizer_config.json"
};
}

bool KokoroRuntime::initialize(const std::filesystem::path& model_directory, std::string& error) {
    if (!std::filesystem::is_directory(model_directory)) {
        error = "NexusVoice model directory does not exist: " + model_directory.string();
        return false;
    }

    for (const char* filename : required_files) {
        if (!std::filesystem::is_regular_file(model_directory / filename)) {
            error = "NexusVoice model file is missing: " + (model_directory / filename).string();
            return false;
        }
    }

    model_directory_ = model_directory;
    return true;
}

bool KokoroRuntime::synthesize(
    const char*,
    const char*,
    float,
    NexusVoiceBuffer*,
    std::string& error) {
    error =
        "NexusVoice native inference is not included in this preview build. "
        "Use Node Bridge mode for authoring until the pinned ONNX Runtime and phonemizer are bundled.";
    return false;
}
