cmake_minimum_required(VERSION 3.20)
project(NexusVoiceNative LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(nexusvoice SHARED
    src/nexusvoice.cpp
    src/kokoro_runtime.cpp
)
target_include_directories(nexusvoice PUBLIC include PRIVATE src)
target_compile_definitions(nexusvoice PRIVATE NEXUSVOICE_BUILDING=1)

option(NEXUSVOICE_BUILD_TESTS "Build NexusVoice native smoke tests" ON)
if(NEXUSVOICE_BUILD_TESTS)
    enable_testing()
    add_executable(nexusvoice_native_smoke tests/native_smoke.cpp)
    target_link_libraries(nexusvoice_native_smoke PRIVATE nexusvoice)
    add_test(NAME nexusvoice_native_smoke COMMAND nexusvoice_native_smoke)
endif()
