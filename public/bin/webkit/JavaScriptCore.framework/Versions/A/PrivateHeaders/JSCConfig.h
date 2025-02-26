/*
 * Copyright (C) 2019-2023 Apple Inc. All rights reserved.
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

#include "Gate.h"
#include "Opcode.h"
#include "OptionsList.h"
#include "SecureARM64EHashPins.h"
#include <wtf/WTFConfig.h>

namespace JSC {

class ExecutableAllocator;
class FixedVMPoolExecutableAllocator;
class VM;

#if ENABLE(SEPARATED_WX_HEAP)
using JITWriteSeparateHeapsFunction = void (*)(off_t, const void*, size_t);
#endif

struct Config {
    static Config& singleton();

    static void disableFreezingForTesting() { g_wtfConfig.disableFreezingForTesting(); }
    JS_EXPORT_PRIVATE static void enableRestrictedOptions();
    static void finalize() { WTF::Config::finalize(); }

    static void configureForTesting()
    {
        WTF::setPermissionsOfConfigPage();
        disableFreezingForTesting();
        enableRestrictedOptions();
    }

    bool isPermanentlyFrozen() { return g_wtfConfig.isPermanentlyFrozen; }

    // All the fields in this struct should be chosen such that their
    // initial value is 0 / null / falsy because Config is instantiated
    // as a global singleton.
    // FIXME: We should use a placement new constructor from JSC::initialize so we can use default initializers.

    bool restrictedOptionsEnabled;
    bool jitDisabled;
    bool vmCreationDisallowed;
    bool vmEntryDisallowed;

    bool useFastJITPermissions;

    // The following HasBeenCalled flags are for auditing call_once initialization functions.
    bool initializeHasBeenCalled;

    struct {
#if ASSERT_ENABLED
        bool canUseJITIsSet;
#endif
        bool canUseJIT;
    } vm;

#if CPU(ARM64E)
    bool canUseFPAC;
#endif

    ExecutableAllocator* executableAllocator;
    FixedVMPoolExecutableAllocator* fixedVMPoolExecutableAllocator;
    void* startExecutableMemory;
    void* endExecutableMemory;
    uintptr_t startOfFixedWritableMemoryPool;
    uintptr_t startOfStructureHeap;
    uintptr_t sizeOfStructureHeap;
    void* defaultCallThunk;
    void* arityFixupThunk;

#if ENABLE(SEPARATED_WX_HEAP)
    JITWriteSeparateHeapsFunction jitWriteSeparateHeaps;
#endif

    OptionsStorage options;

    void (*shellTimeoutCheckCallback)(VM&);

    struct {
        uint8_t exceptionInstructions[maxBytecodeStructLength + 1];
        uint8_t wasmExceptionInstructions[maxBytecodeStructLength + 1];
        const void* gateMap[numberOfGates];
    } llint;

#if CPU(ARM64E) && ENABLE(PTRTAG_DEBUGGING)
    WTF::PtrTagLookup ptrTagLookupRecord;
#endif

#if CPU(ARM64E) && ENABLE(JIT)
    SecureARM64EHashPins arm64eHashPins;
#endif
};

constexpr size_t alignmentOfJSCConfig = std::alignment_of<JSC::Config>::value;

static_assert(WTF::offsetOfWTFConfigExtension + sizeof(JSC::Config) <= WTF::ConfigSizeToProtect);
static_assert(roundUpToMultipleOf<alignmentOfJSCConfig>(WTF::offsetOfWTFConfigExtension) == WTF::offsetOfWTFConfigExtension);

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

// Workaround to localize bounds safety warnings to this file.
// FIXME: Use real types to make materializing JSC::Config* bounds-safe and type-safe.
inline Config* addressOfJSCConfig() { return std::bit_cast<Config*>(&g_wtfConfig.spaceForExtensions); }

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#define g_jscConfig (*JSC::addressOfJSCConfig())

constexpr size_t offsetOfJSCConfigInitializeHasBeenCalled = offsetof(JSC::Config, initializeHasBeenCalled);
constexpr size_t offsetOfJSCConfigGateMap = offsetof(JSC::Config, llint.gateMap);
constexpr size_t offsetOfJSCConfigStartOfStructureHeap = offsetof(JSC::Config, startOfStructureHeap);
constexpr size_t offsetOfJSCConfigDefaultCallThunk = offsetof(JSC::Config, defaultCallThunk);

ALWAYS_INLINE PURE_FUNCTION uintptr_t startOfStructureHeap()
{
    return g_jscConfig.startOfStructureHeap;
}

} // namespace JSC
