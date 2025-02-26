/*
 * Copyright (C) 2019-2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Forward.h>

namespace JSC { namespace Wasm {

enum class CompilationMode : uint8_t {
    LLIntMode,
    IPIntMode,
    BBQMode,
    OMGMode,
    OMGForOSREntryMode,
    JSToWasmEntrypointMode,
    JSToWasmICMode,
    WasmToJSMode,
};

constexpr inline bool isAnyInterpreter(CompilationMode compilationMode)
{
    switch (compilationMode) {
    case CompilationMode::LLIntMode:
    case CompilationMode::IPIntMode:
        return true;
    case CompilationMode::BBQMode:
    case CompilationMode::OMGForOSREntryMode:
    case CompilationMode::OMGMode:
    case CompilationMode::JSToWasmEntrypointMode:
    case CompilationMode::JSToWasmICMode:
    case CompilationMode::WasmToJSMode:
        return false;
    }
    RELEASE_ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
}

constexpr inline bool isAnyBBQ(CompilationMode compilationMode)
{
    switch (compilationMode) {
    case CompilationMode::BBQMode:
        return true;
    case CompilationMode::OMGForOSREntryMode:
    case CompilationMode::LLIntMode:
    case CompilationMode::IPIntMode:
    case CompilationMode::OMGMode:
    case CompilationMode::JSToWasmEntrypointMode:
    case CompilationMode::JSToWasmICMode:
    case CompilationMode::WasmToJSMode:
        return false;
    }
    RELEASE_ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
}

constexpr inline bool isAnyOMG(CompilationMode compilationMode)
{
    switch (compilationMode) {
    case CompilationMode::OMGMode:
    case CompilationMode::OMGForOSREntryMode:
        return true;
    case CompilationMode::BBQMode:
    case CompilationMode::LLIntMode:
    case CompilationMode::IPIntMode:
    case CompilationMode::JSToWasmEntrypointMode:
    case CompilationMode::JSToWasmICMode:
    case CompilationMode::WasmToJSMode:
        return false;
    }
    RELEASE_ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
}

constexpr inline bool isAnyWasmToJS(CompilationMode compilationMode)
{
    switch (compilationMode) {
    case CompilationMode::WasmToJSMode:
        return true;
    case CompilationMode::OMGMode:
    case CompilationMode::OMGForOSREntryMode:
    case CompilationMode::BBQMode:
    case CompilationMode::LLIntMode:
    case CompilationMode::IPIntMode:
    case CompilationMode::JSToWasmEntrypointMode:
    case CompilationMode::JSToWasmICMode:
        return false;
    }
    RELEASE_ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
}

} } // namespace JSC::Wasm
