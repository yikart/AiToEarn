/*
  * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "B3Value.h"
#include "SIMDInfo.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC { namespace B3 {

class JS_EXPORT_PRIVATE SIMDValue final : public Value {
public:
    static bool accepts(Kind kind)
    {
        switch (kind.opcode()) {
        case VectorExtractLane:
        case VectorReplaceLane:
        case VectorDupElement:
        case VectorEqual:
        case VectorNotEqual:
        case VectorLessThan:
        case VectorLessThanOrEqual:
        case VectorBelow:
        case VectorBelowOrEqual:
        case VectorGreaterThan:
        case VectorGreaterThanOrEqual:
        case VectorAbove:
        case VectorAboveOrEqual:
        case VectorAdd:
        case VectorSub:
        case VectorAddSat:
        case VectorSubSat:
        case VectorMul:
        case VectorDiv:
        case VectorMin:
        case VectorMax:
        case VectorPmin:
        case VectorPmax:
        case VectorNarrow:
        case VectorNot:
        case VectorAnd:
        case VectorAndnot:
        case VectorOr:
        case VectorXor:
        case VectorShl:
        case VectorShr:
        case VectorAbs:
        case VectorNeg:
        case VectorPopcnt:
        case VectorCeil:
        case VectorFloor:
        case VectorTrunc:
        case VectorTruncSat:
        case VectorRelaxedTruncSat:
        case VectorConvert:
        case VectorConvertLow:
        case VectorNearest:
        case VectorSqrt:
        case VectorExtendLow:
        case VectorExtendHigh:
        case VectorPromote:
        case VectorDemote:
        case VectorSplat:
        case VectorAnyTrue:
        case VectorAllTrue:
        case VectorAvgRound:
        case VectorBitmask:
        case VectorBitwiseSelect:
        case VectorExtaddPairwise:
        case VectorMulSat:
        case VectorSwizzle:
        case VectorMulByElement:
        case VectorShiftByVector:
        case VectorDotProduct:
        case VectorRelaxedSwizzle:
        case VectorRelaxedMAdd:
        case VectorRelaxedNMAdd:
        case VectorRelaxedLaneSelect:
            return true;
        default:
            return false;
        }
    }

    ~SIMDValue() final;

    SIMDInfo simdInfo() const { return m_simdInfo; }
    SIMDLane simdLane() const { return m_simdInfo.lane; }
    SIMDSignMode signMode() const { return m_simdInfo.signMode; }
    uint8_t immediate() const { return m_immediate; }

    B3_SPECIALIZE_VALUE_FOR_FINAL_SIZE_FIXED_CHILDREN

protected:
    void dumpMeta(CommaPrinter&, PrintStream&) const final;

    template<typename... Arguments>
    SIMDValue(Origin origin, Kind kind, Type type, SIMDInfo info, uint8_t imm1, Arguments... arguments)
        : Value(CheckedOpcode, kind, type, static_cast<NumChildren>(sizeof...(arguments)), origin, arguments...)
        , m_simdInfo(info)
        , m_immediate(imm1)
    {
    }

    template<typename... Arguments>
    SIMDValue(Origin origin, Kind kind, Type type, SIMDInfo info, Arguments... arguments)
        : Value(CheckedOpcode, kind, type, static_cast<NumChildren>(sizeof...(arguments)), origin, arguments...)
        , m_simdInfo(info)
    {
    }

    template<typename... Arguments>
    SIMDValue(Origin origin, Kind kind, Type type, SIMDLane simdLane, SIMDSignMode signMode, uint8_t imm1, Arguments... arguments)
        : Value(CheckedOpcode, kind, type, static_cast<NumChildren>(sizeof...(arguments)), origin, arguments...)
        , m_simdInfo { simdLane, signMode }
        , m_immediate(imm1)
    {
    }

    template<typename... Arguments>
    SIMDValue(Origin origin, Kind kind, Type type, SIMDLane simdLane, SIMDSignMode signMode, Arguments... arguments)
        : Value(CheckedOpcode, kind, type, static_cast<NumChildren>(sizeof...(arguments)), origin, arguments...)
        , m_simdInfo { simdLane, signMode }
    {
    }

private:
    template<typename... Arguments>
    static Opcode opcodeFromConstructor(Origin, Kind kind, Type, SIMDLane, SIMDSignMode, Arguments...) { return kind.opcode(); }
    template<typename... Arguments>
    static Opcode opcodeFromConstructor(Origin, Kind kind, Type, SIMDInfo, Arguments...) { return kind.opcode(); }
    template<typename... Arguments>
    static Opcode opcodeFromConstructor(Origin, Kind kind, Type, SIMDLane, SIMDSignMode, v128_t, Arguments...) { return kind.opcode(); }
    friend class Procedure;
    friend class Value;

    SIMDInfo m_simdInfo { };
    uint8_t m_immediate { 0 };
};

} } // namespace JSC::B3

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(B3_JIT)
