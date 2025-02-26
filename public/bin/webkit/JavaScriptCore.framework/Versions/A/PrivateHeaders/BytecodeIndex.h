/*
* Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include <wtf/HashTraits.h>
#include <wtf/MathExtras.h>

namespace WTF {
class PrintStream;
}

namespace JSC {

using Checkpoint = uint8_t;
static constexpr Checkpoint noCheckpoints = 0;

class BytecodeIndex {
public:
    BytecodeIndex() = default;
    BytecodeIndex(WTF::HashTableDeletedValueType)
        : m_packedBits(deletedValue().asBits())
    {
    }

    explicit BytecodeIndex(uint32_t bytecodeOffset, Checkpoint checkpoint = noCheckpoints)
        : m_packedBits(pack(bytecodeOffset, checkpoint))
    {
        ASSERT(*this);
    }

    static constexpr uint32_t numberOfCheckpoints = 4;
    static_assert(hasOneBitSet(numberOfCheckpoints), "numberOfCheckpoints should be a power of 2");
    static constexpr uint32_t checkpointMask = numberOfCheckpoints - 1;
    static constexpr uint32_t checkpointShift = WTF::getMSBSetConstexpr(numberOfCheckpoints);

    uint32_t offset() const { return m_packedBits >> checkpointShift; }
    Checkpoint checkpoint() const { return m_packedBits & checkpointMask; }
    uint32_t asBits() const { return m_packedBits; }

    unsigned hash() const { return intHash(m_packedBits); }
    static BytecodeIndex deletedValue() { return fromBits(invalidOffset - 1); }
    bool isHashTableDeletedValue() const { return *this == deletedValue(); }

    static BytecodeIndex fromBits(uint32_t bits);
    BytecodeIndex withCheckpoint(Checkpoint checkpoint) const { return BytecodeIndex(offset(), checkpoint); }

    // Comparison operators.
    explicit operator bool() const { return m_packedBits != invalidOffset && m_packedBits != deletedValue().offset(); }
    bool operator ==(const BytecodeIndex& other) const { return asBits() == other.asBits(); }

    bool operator <(const BytecodeIndex& other) const { return asBits() < other.asBits(); }
    bool operator >(const BytecodeIndex& other) const { return asBits() > other.asBits(); }
    bool operator <=(const BytecodeIndex& other) const { return asBits() <= other.asBits(); }
    bool operator >=(const BytecodeIndex& other) const { return asBits() >= other.asBits(); }


    void dump(WTF::PrintStream&) const;

private:
    static constexpr uint32_t invalidOffset = std::numeric_limits<uint32_t>::max();

    static uint32_t pack(uint32_t bytecodeIndex, Checkpoint);

    uint32_t m_packedBits { invalidOffset };
};

inline uint32_t BytecodeIndex::pack(uint32_t bytecodeIndex, Checkpoint checkpoint)
{
    ASSERT(checkpoint < numberOfCheckpoints);
    ASSERT((bytecodeIndex << checkpointShift) >> checkpointShift == bytecodeIndex);
    return bytecodeIndex << checkpointShift | checkpoint;
}

inline BytecodeIndex BytecodeIndex::fromBits(uint32_t bits)
{
    BytecodeIndex result;
    result.m_packedBits = bits;
    return result;
}

struct BytecodeIndexHash {
    static unsigned hash(const BytecodeIndex& key) { return key.hash(); }
    static bool equal(const BytecodeIndex& a, const BytecodeIndex& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::BytecodeIndex> : JSC::BytecodeIndexHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::BytecodeIndex> : SimpleClassHashTraits<JSC::BytecodeIndex> {
    static constexpr bool emptyValueIsZero = false;
};

} // namespace WTF
