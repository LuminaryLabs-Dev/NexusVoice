cmake_minimum_required(VERSION 3.20)
project(NexusVoiceNative LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

set(
    NEXUSVOICE_SHERPA_ROOT
    "${CMAKE_CURRENT_SOURCE_DIR}/vendor/sherpa-onnx-full"
    CACHE PATH
    "Path to the pinned Sherpa-ONNX shared runtime"
)

find_path(
    SHERPA_ONNX_INCLUDE_DIR
    sherpa-onnx/c-api/c-api.h
    PATHS "${NEXUSVOICE_SHERPA_ROOT}/include"
    NO_DEFAULT_PATH
    REQUIRED
)
find_library(
    SHERPA_ONNX_C_API
    NAMES sherpa-onnx-c-api libsherpa-onnx-c-api
    PATHS "${NEXUSVOICE_SHERPA_ROOT}/lib"
    NO_DEFAULT_PATH
    REQUIRED
)

add_library(nexusvoice SHARED
    src/nexusvoice.cpp
    src/kokoro_runtime.cpp
)
target_include_directories(
    nexusvoice
    PUBLIC include
    PRIVATE src "${SHERPA_ONNX_INCLUDE_DIR}"
)
target_compile_definitions(nexusvoice PRIVATE NEXUSVOICE_BUILDING=1)
target_link_libraries(nexusvoice PRIVATE "${SHERPA_ONNX_C_API}")
set_target_properties(nexusvoice PROPERTIES BUILD_RPATH "$ORIGIN")

file(GLOB SHERPA_RUNTIME_LIBS
    "${NEXUSVOICE_SHERPA_ROOT}/lib/*.so*"
    "${NEXUSVOICE_SHERPA_ROOT}/lib/*.dylib"
    "${NEXUSVOICE_SHERPA_ROOT}/lib/*.dll"
)
foreach(runtime_library IN LISTS SHERPA_RUNTIME_LIBS)
    add_custom_command(
        TARGET nexusvoice POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
            "${runtime_library}"
            "$<TARGET_FILE_DIR:nexusvoice>"
    )
endforeach()

option(NEXUSVOICE_BUILD_TESTS "Build NexusVoice native smoke tests" ON)
if(NEXUSVOICE_BUILD_TESTS)
    enable_testing()
    add_executable(nexusvoice_native_smoke tests/native_smoke.cpp)
    target_link_libraries(nexusvoice_native_smoke PRIVATE nexusvoice)
    add_test(
        NAME nexusvoice_native_smoke
        COMMAND nexusvoice_native_smoke
            "${CMAKE_CURRENT_SOURCE_DIR}/models/nexusvoice-kokoro-v1_0"
            "${CMAKE_CURRENT_BINARY_DIR}/nexusvoice-native-smoke.wav"
    )
endif()
