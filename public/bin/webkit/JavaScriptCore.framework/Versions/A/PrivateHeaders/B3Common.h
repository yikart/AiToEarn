/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

#if ENABLE(B3_JIT)

#include "CPU.h"
#include "GPRInfo.h"
#include "JSExportMacros.h"
#include "Options.h"

namespace JSC { namespace B3 {

class Procedure;

extern const char* const tierName;

enum B3CompilationMode {
    B3Mode,
    AirMode
};

JS_EXPORT_PRIVATE bool shouldDumpIR(Procedure&, B3CompilationMode);
bool shouldDumpIRAtEachPhase(B3CompilationMode);
bool shouldValidateIR();
bool shouldValidateIRAtEachPhase();
bool shouldSaveIRBeforePhase();

template<typename IntType>
static IntType chillDiv(IntType numerator, IntType denominator)
{
    if (!denominator)
        return 0;
    if (denominator == -1 && numerator == std::numeric_limits<IntType>::min())
        return std::numeric_limits<IntType>::min();
    return numerator / denominator;
}

template<typename IntType>
static IntType chillMod(IntType numerator, IntType denominator)
{
    if (!denominator)
        return 0;
    if (denominator == -1 && numerator == std::numeric_limits<IntType>::min())
        return 0;
    return numerator % denominator;
}

template<typename IntType>
static IntType chillUDiv(IntType numerator, IntType denominator)
{
    typedef typename std::make_unsigned<IntType>::type UnsignedIntType;
    UnsignedIntType unsignedNumerator = static_cast<UnsignedIntType>(numerator);
    UnsignedIntType unsignedDenominator = static_cast<UnsignedIntType>(denominator);
    if (!unsignedDenominator)
        return 0;
    return unsignedNumerator / unsignedDenominator;
}

template<typename IntType>
static IntType chillUMod(IntType numerator, IntType denominator)
{
    typedef typename std::make_unsigned<IntType>::type UnsignedIntType;
    UnsignedIntType unsignedNumerator = static_cast<UnsignedIntType>(numerator);
    UnsignedIntType unsignedDenominator = static_cast<UnsignedIntType>(denominator);
    if (!unsignedDenominator)
        return 0;
    return unsignedNumerator % unsignedDenominator;
}

template<typename IntType>
static IntType rotateRight(IntType value, int32_t shift)
{
    typedef typename std::make_unsigned<IntType>::type UnsignedIntType;
    UnsignedIntType uValue = static_cast<UnsignedIntType>(value);
    int32_t bits = sizeof(IntType) * 8;
    int32_t mask = bits - 1;
    shift &= mask;
    return (uValue >> shift) | (uValue << ((bits - shift) & mask));
}

template<typename IntType>
static IntType rotateLeft(IntType value, int32_t shift)
{
    typedef typename std::make_unsigned<IntType>::type UnsignedIntType;
    UnsignedIntType uValue = static_cast<UnsignedIntType>(value);
    int32_t bits = sizeof(IntType) * 8;
    int32_t mask = bits - 1;
    shift &= mask;
    return (uValue << shift) | (uValue >> ((bits - shift) & mask));
}

inline unsigned defaultOptLevel()
{
    // This should almost always return 2, but we allow this default to be lowered for testing. Some
    // components will deliberately set the optLevel.
    return Options::defaultB3OptLevel();
}

GPRReg extendedOffsetAddrRegister();

} } // namespace JSC::B3

#endif // ENABLE(B3_JIT)
