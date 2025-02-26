/*
 * Copyright (C) 2013, 2014 Apple Inc. All rights reserved.
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

#if ENABLE(FTL_JIT)

#include "FTLAbbreviatedTypes.h"
#include "FTLValueRange.h"

namespace JSC {

namespace B3 {
class BasicBlock;
class Procedure;
}

namespace FTL {

class CommonValues {
public:
    CommonValues();

    void initializeConstants(B3::Procedure&, B3::BasicBlock*);
    
    LValue booleanTrue { nullptr };
    LValue booleanFalse { nullptr };
    LValue int32Zero { nullptr };
    LValue int32One { nullptr };
    LValue int64Zero { nullptr };
    LValue intPtrZero { nullptr };
    LValue intPtrOne { nullptr };
    LValue intPtrTwo { nullptr };
    LValue intPtrThree { nullptr };
    LValue intPtrEight { nullptr };
    LValue doubleZero { nullptr };
    LValue doubleEncodeOffsetAsDouble { nullptr };
#if USE(BIGINT32)
    LValue bigInt32Zero { nullptr };
#endif

    const unsigned rangeKind { 0 };
    const unsigned profKind { 0 };
    const LValue branchWeights { nullptr };
    
    const ValueRange nonNegativeInt32;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
