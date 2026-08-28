#include "nexusvoice.h"

#include <chrono>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>

int main() {
    NexusVoiceBuffer buffer{};

    if (nexusvoice_synthesize("hello", "af_heart", 1.0f, &buffer) == 0) {
        std::cerr << "Synthesis unexpectedly succeeded before initialization.\n";
        return 1;
    }
    if (std::strlen(nexusvoice_last_error()) == 0) {
        std::cerr << "Missing native error message.\n";
        return 2;
    }

    if (nexusvoice_initialize("/nexusvoice/path/that/does/not/exist") == 0) {
        std::cerr << "Initialization unexpectedly accepted a missing model directory.\n";
        return 3;
    }

    const auto suffix = std::chrono::high_resolution_clock::now().time_since_epoch().count();
    const auto model_directory = std::filesystem::temp_directory_path()
        / ("nexusvoice-native-smoke-" + std::to_string(suffix));
    std::filesystem::create_directories(model_directory);

    for (const char* filename : {
             "model_quantized.onnx",
             "config.json",
             "tokenizer.json",
             "tokenizer_config.json"}) {
        std::ofstream(model_directory / filename) << "smoke";
    }

    if (nexusvoice_initialize(model_directory.string().c_str()) != 0) {
        std::cerr << "Initialization rejected a complete smoke model directory: "
                  << nexusvoice_last_error() << "\n";
        std::filesystem::remove_all(model_directory);
        return 4;
    }

    if (nexusvoice_synthesize("hello", "af_heart", 1.0f, &buffer) == 0) {
        std::cerr << "Preview native synthesis unexpectedly reported success.\n";
        std::filesystem::remove_all(model_directory);
        return 5;
    }
    if (std::strstr(nexusvoice_last_error(), "not included in this preview build") == nullptr) {
        std::cerr << "Native preview gate returned the wrong error: " << nexusvoice_last_error() << "\n";
        std::filesystem::remove_all(model_directory);
        return 6;
    }

    nexusvoice_free_buffer(&buffer);
    nexusvoice_shutdown();
    std::filesystem::remove_all(model_directory);
    std::cout << "NexusVoice native boundary smoke test passed.\n";
    return 0;
}
