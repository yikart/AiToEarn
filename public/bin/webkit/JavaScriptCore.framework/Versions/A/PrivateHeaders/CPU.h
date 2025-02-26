/*
 * Copyright (C) 2008-2023 Apple Inc. All rights reserved.
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

#include "JSExportMacros.h"
#include <wtf/NumberOfCores.h>
#include <wtf/StdIntExtras.h>

namespace JSC {

using UCPUStrictInt32 = UCPURegister;

constexpr bool isARMv7IDIVSupported()
{
#if HAVE(ARM_IDIV_INSTRUCTIONS)
    return true;
#else
    return false;
#endif
}

constexpr bool isARM_THUMB2()
{
#if CPU(ARM_THUMB2)
    return true;
#else
    return false;
#endif
}

constexpr bool hasUnalignedFPMemoryAccess()
{
    return !isARM_THUMB2();
}

constexpr bool isARM64()
{
#if CPU(ARM64)
    return true;
#else
    return false;
#endif
}

constexpr bool isARM64E()
{
#if CPU(ARM64E)
    return true;
#else
    return false;
#endif
}

#if CPU(ARM64)
#if CPU(ARM64E)
JS_EXPORT_PRIVATE bool isARM64E_FPAC();
#else
constexpr bool isARM64E_FPAC() { return false; }
#endif

#if CPU(ARM64E) || OS(MAC_OS_X)
// ARM64E or all macOS ARM64 CPUs have LSE.
constexpr bool isARM64_LSE() { return true; }
#else
JS_EXPORT_PRIVATE bool isARM64_LSE();
#endif

#else // not CPU(ARM64)
constexpr bool isARM64_LSE() { return false; }
constexpr bool isARM64E_FPAC() { return false; }
#endif

constexpr bool isX86()
{
#if CPU(X86_64) || CPU(X86)
    return true;
#else
    return false;
#endif
}

constexpr bool isX86_64()
{
#if CPU(X86_64)
    return true;
#else
    return false;
#endif
}

#if CPU(X86_64)
JS_EXPORT_PRIVATE bool isX86_64_AVX();
#else
constexpr bool isX86_64_AVX()
{
    return false;
}
#endif

constexpr bool isRISCV64()
{
#if CPU(RISCV64)
    return true;
#else
    return false;
#endif
}

constexpr bool is64Bit()
{
#if USE(JSVALUE64)
    return true;
#else
    return false;
#endif
}

constexpr bool is32Bit()
{
    return !is64Bit();
}

constexpr bool isAddress64Bit()
{
    return sizeof(void*) == 8;
}

constexpr bool isAddress32Bit()
{
    return !isAddress64Bit();
}

constexpr size_t registerSize()
{
#if CPU(REGISTER64)
    return 8;
#elif CPU(REGISTER32)
    return 4;
#else
#  error "Unknown register size"
#endif
}

constexpr bool isRegister64Bit()
{
    return registerSize() == 8;
}

constexpr bool isRegister32Bit()
{
    return registerSize() == 4;
}

inline bool optimizeForARMv7IDIVSupported();
inline bool optimizeForARM64();
inline bool optimizeForX86();
inline bool optimizeForX86_64();
inline bool hasSensibleDoubleToInt();

#if PLATFORM(MAC) || PLATFORM(MACCATALYST)
bool isKernOpenSource();
#endif

#if (CPU(X86) || CPU(X86_64)) && OS(DARWIN)
bool isKernTCSMAvailable();
bool enableKernTCSM();
int kernTCSMAwareNumberOfProcessorCores();
int64_t hwL3CacheSize();
int32_t hwPhysicalCPUMax();
#else
ALWAYS_INLINE bool isKernTCSMAvailable() { return false; }
ALWAYS_INLINE bool enableKernTCSM() { return false; }
ALWAYS_INLINE int kernTCSMAwareNumberOfProcessorCores() { return WTF::numberOfProcessorCores(); }
ALWAYS_INLINE int64_t hwL3CacheSize() { return 0; }
ALWAYS_INLINE int32_t hwPhysicalCPUMax() { return kernTCSMAwareNumberOfProcessorCores(); }
#endif

constexpr size_t prologueStackPointerDelta()
{
#if ENABLE(C_LOOP)
    // Prologue saves the framePointerRegister and linkRegister
    return 2 * sizeof(CPURegister);
#elif CPU(X86_64)
    // Prologue only saves the framePointerRegister
    return sizeof(CPURegister);
#elif CPU(ARM_THUMB2) || CPU(ARM64) || CPU(RISCV64)
    // Prologue saves the framePointerRegister and linkRegister
    return 2 * sizeof(CPURegister);
#else
#error unsupported architectures
#endif
}



} // namespace JSC

