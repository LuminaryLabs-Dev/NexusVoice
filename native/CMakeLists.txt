cmake_minimum_required(VERSION 3.20)
project(NexusVoiceNative LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(nexusvoice SHARED src/nexusvoice.cpp)
target_include_directories(nexusvoice PUBLIC include)
target_compile_definitions(nexusvoice PRIVATE NEXUSVOICE_BUILDING=1)
