cmake_minimum_required(VERSION 3.16)

PROJECT(cpp-socket)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(THREADS_PREFER_PTHREAD_FLAG ON)

find_package(Threads REQUIRED)

add_executable(cpp-socket main.cpp)
target_link_libraries(cpp-socket Threads::Threads)
