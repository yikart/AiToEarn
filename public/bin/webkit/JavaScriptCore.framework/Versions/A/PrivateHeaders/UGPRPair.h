/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "CPU.h"
#include <wtf/StdLibExtras.h>

namespace JSC {

#if USE(JSVALUE64)
// According to C++ rules, a type used for the return signature of function with C linkage (i.e.
// 'extern "C"') needs to be POD; hence putting any constructors into it could cause either compiler
// warnings, or worse, a change in the ABI used to return these types.
struct UGPRPair {
    UCPURegister first;
    UCPURegister second;
};
static_assert(sizeof(UGPRPair) == sizeof(UCPURegister) * 2, "UGPRPair should fit in two machine registers");

constexpr UGPRPair makeUGPRPair(UCPURegister first, UCPURegister second) { return { first, second }; }

inline UGPRPair encodeResult(const void* a, const void* b)
{
    return makeUGPRPair(reinterpret_cast<UCPURegister>(a), reinterpret_cast<UCPURegister>(b));
}

inline void decodeResult(UGPRPair result, const void*& a, const void*& b)
{
    a = reinterpret_cast<void*>(result.first);
    b = reinterpret_cast<void*>(result.second);
}

inline void decodeResult(UGPRPair result, size_t& a, size_t& b)
{
    a = static_cast<size_t>(result.first);
    b = static_cast<size_t>(result.second);
}

#else // USE(JSVALUE32_64)
using UGPRPair = uint64_t;

#if CPU(BIG_ENDIAN)
constexpr UGPRPair makeUGPRPair(UCPURegister first, UCPURegister second) { return static_cast<uint64_t>(first) << 32 | second; }
#else
constexpr UGPRPair makeUGPRPair(UCPURegister first, UCPURegister second) { return static_cast<uint64_t>(second) << 32 | first; }
#endif

typedef union {
    struct {
        const void* a;
        const void* b;
    } pair;
    uint64_t i;
} UGPRPairEncoding;


inline UGPRPair encodeResult(const void* a, const void* b)
{
    return makeUGPRPair(reinterpret_cast<UCPURegister>(a), reinterpret_cast<UCPURegister>(b));
}

inline void decodeResult(UGPRPair result, const void*& a, const void*& b)
{
    UGPRPairEncoding u;
    u.i = result;
    a = u.pair.a;
    b = u.pair.b;
}

inline void decodeResult(UGPRPair result, size_t& a, size_t& b)
{
    UGPRPairEncoding u;
    u.i = result;
    a = std::bit_cast<size_t>(u.pair.a);
    b = std::bit_cast<size_t>(u.pair.b);
}

#endif // USE(JSVALUE32_64)

} // namespace JSC
