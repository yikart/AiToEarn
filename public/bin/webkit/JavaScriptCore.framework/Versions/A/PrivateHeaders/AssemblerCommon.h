/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
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

#include "OSCheck.h"
#include <optional>
#include <wtf/Atomics.h>

namespace JSC {

template<size_t bits, typename Type>
ALWAYS_INLINE constexpr bool isInt(Type t)
{
    constexpr size_t shift = sizeof(Type) * CHAR_BIT - bits;
    static_assert(sizeof(Type) * CHAR_BIT > shift, "shift is larger than the size of the value");
    return ((t << shift) >> shift) == t;
}

ALWAYS_INLINE bool isInt9(int32_t value)
{
    return value == ((value << 23) >> 23);
}

template<typename Type>
ALWAYS_INLINE bool isUInt12(Type value)
{
    return !(value & ~static_cast<Type>(0xfff));
}

template<int datasize>
ALWAYS_INLINE bool isValidScaledUImm12(int32_t offset)
{
    int32_t maxPImm = 4095 * (datasize / 8);
    if (offset < 0)
        return false;
    if (offset > maxPImm)
        return false;
    if (offset & ((datasize / 8) - 1))
        return false;
    return true;
}

ALWAYS_INLINE bool isValidSignedImm9(int32_t value)
{
    return isInt9(value);
}

ALWAYS_INLINE bool isValidSignedImm7(int32_t value, int alignmentShiftAmount)
{
    constexpr int32_t disallowedHighBits = 32 - 7;
    int32_t shiftedValue = value >> alignmentShiftAmount;
    bool fitsIn7Bits = shiftedValue == ((shiftedValue << disallowedHighBits) >> disallowedHighBits);
    bool hasCorrectAlignment = value == (shiftedValue << alignmentShiftAmount);
    return fitsIn7Bits && hasCorrectAlignment;
}

class ARM64LogicalImmediate {
public:
    static ARM64LogicalImmediate create32(uint32_t value)
    {
        // Check for 0, -1 - these cannot be encoded.
        if (!value || !~value)
            return InvalidLogicalImmediate;

        // First look for a 32-bit pattern, then for repeating 16-bit
        // patterns, 8-bit, 4-bit, and finally 2-bit.

        unsigned hsb, lsb;
        bool inverted;
        if (findBitRange<32>(value, hsb, lsb, inverted))
            return encodeLogicalImmediate<32>(hsb, lsb, inverted);

        if ((value & 0xffff) != (value >> 16))
            return InvalidLogicalImmediate;
        value &= 0xffff;

        if (findBitRange<16>(value, hsb, lsb, inverted))
            return encodeLogicalImmediate<16>(hsb, lsb, inverted);

        if ((value & 0xff) != (value >> 8))
            return InvalidLogicalImmediate;
        value &= 0xff;

        if (findBitRange<8>(value, hsb, lsb, inverted))
            return encodeLogicalImmediate<8>(hsb, lsb, inverted);

        if ((value & 0xf) != (value >> 4))
            return InvalidLogicalImmediate;
        value &= 0xf;

        if (findBitRange<4>(value, hsb, lsb, inverted))
            return encodeLogicalImmediate<4>(hsb, lsb, inverted);

        if ((value & 0x3) != (value >> 2))
            return InvalidLogicalImmediate;
        value &= 0x3;

        if (findBitRange<2>(value, hsb, lsb, inverted))
            return encodeLogicalImmediate<2>(hsb, lsb, inverted);

        return InvalidLogicalImmediate;
    }

    static ARM64LogicalImmediate create64(uint64_t value)
    {
        // Check for 0, -1 - these cannot be encoded.
        if (!value || !~value)
            return InvalidLogicalImmediate;

        // Look for a contiguous bit range.
        unsigned hsb, lsb;
        bool inverted;
        if (findBitRange<64>(value, hsb, lsb, inverted))
            return encodeLogicalImmediate<64>(hsb, lsb, inverted);

        // If the high & low 32 bits are equal, we can try for a 32-bit (or narrower) pattern.
        if (static_cast<uint32_t>(value) == static_cast<uint32_t>(value >> 32))
            return create32(static_cast<uint32_t>(value));
        return InvalidLogicalImmediate;
    }

    int value() const
    {
        ASSERT(isValid());
        return m_value;
    }

    bool isValid() const
    {
        return m_value != InvalidLogicalImmediate;
    }

    bool is64bit() const
    {
        return m_value & (1 << 12);
    }

private:
    ARM64LogicalImmediate(int value)
        : m_value(value)
    {
    }

    // Generate a mask with bits in the range hsb..0 set, for example:
    //   hsb:63 = 0xffffffffffffffff
    //   hsb:42 = 0x000007ffffffffff
    //   hsb: 0 = 0x0000000000000001
    static uint64_t mask(unsigned hsb)
    {
        ASSERT(hsb < 64);
        return 0xffffffffffffffffull >> (63 - hsb);
    }

    template<unsigned N>
    static void partialHSB(uint64_t& value, unsigned&result)
    {
        if (value & (0xffffffffffffffffull << N)) {
            result += N;
            value >>= N;
        }
    }

    // Find the bit number of the highest bit set in a non-zero value, for example:
    //   0x8080808080808080 = hsb:63
    //   0x0000000000000001 = hsb: 0
    //   0x000007ffffe00000 = hsb:42
    static unsigned highestSetBit(uint64_t value)
    {
        ASSERT(value);
        unsigned hsb = 0;
        partialHSB<32>(value, hsb);
        partialHSB<16>(value, hsb);
        partialHSB<8>(value, hsb);
        partialHSB<4>(value, hsb);
        partialHSB<2>(value, hsb);
        partialHSB<1>(value, hsb);
        return hsb;
    }

    // This function takes a value and a bit width, where value obeys the following constraints:
    //   * bits outside of the width of the value must be zero.
    //   * bits within the width of value must neither be all clear or all set.
    // The input is inspected to detect values that consist of either two or three contiguous
    // ranges of bits. The output range hsb..lsb will describe the second range of the value.
    // if the range is set, inverted will be false, and if the range is clear, inverted will
    // be true. For example (with width 8):
    //   00001111 = hsb:3, lsb:0, inverted:false
    //   11110000 = hsb:3, lsb:0, inverted:true
    //   00111100 = hsb:5, lsb:2, inverted:false
    //   11000011 = hsb:5, lsb:2, inverted:true
    template<unsigned width>
    static bool findBitRange(uint64_t value, unsigned& hsb, unsigned& lsb, bool& inverted)
    {
        ASSERT(value & mask(width - 1));
        ASSERT(value != mask(width - 1));
        ASSERT(!(value & ~mask(width - 1)));

        // Detect cases where the top bit is set; if so, flip all the bits & set invert.
        // This halves the number of patterns we need to look for.
        const uint64_t msb = 1ull << (width - 1);
        if ((inverted = (value & msb)))
            value ^= mask(width - 1);

        // Find the highest set bit in value, generate a corresponding mask & flip all
        // bits under it.
        hsb = highestSetBit(value);
        value ^= mask(hsb);
        if (!value) {
            // If this cleared the value, then the range hsb..0 was all set.
            lsb = 0;
            return true;
        }

        // Try making one more mask, and flipping the bits!
        lsb = highestSetBit(value);
        value ^= mask(lsb);
        if (!value) {
            // Success - but lsb actually points to the hsb of a third range - add one
            // to get to the lsb of the mid range.
            ++lsb;
            return true;
        }

        return false;
    }

    // Encodes the set of immN:immr:imms fields found in a logical immediate.
    template<unsigned width>
    static int encodeLogicalImmediate(unsigned hsb, unsigned lsb, bool inverted)
    {
        // Check width is a power of 2!
        ASSERT(!(width & (width -1)));
        ASSERT(width <= 64 && width >= 2);
        ASSERT(hsb >= lsb);
        ASSERT(hsb < width);

        int immN = 0;
        int imms = 0;
        int immr = 0;

        // For 64-bit values this is easy - just set immN to true, and imms just
        // contains the bit number of the highest set bit of the set range. For
        // values with narrower widths, these are encoded by a leading set of
        // one bits, followed by a zero bit, followed by the remaining set of bits
        // being the high bit of the range. For a 32-bit immediate there are no
        // leading one bits, just a zero followed by a five bit number. For a
        // 16-bit immediate there is one one bit, a zero bit, and then a four bit
        // bit-position, etc.
        if (width == 64)
            immN = 1;
        else
            imms = 63 & ~(width + width - 1);

        if (inverted) {
            // if width is 64 & hsb is 62, then we have a value something like:
            //   0x80000000ffffffff (in this case with lsb 32).
            // The ror should be by 1, imms (effectively set width minus 1) is
            // 32. Set width is full width minus cleared width.
            immr = (width - 1) - hsb;
            imms |= (width - ((hsb - lsb) + 1)) - 1;
        } else {
            // if width is 64 & hsb is 62, then we have a value something like:
            //   0x7fffffff00000000 (in this case with lsb 32).
            // The value is effectively rol'ed by lsb, which is equivalent to
            // a ror by width - lsb (or 0, in the case where lsb is 0). imms
            // is hsb - lsb.
            immr = (width - lsb) & (width - 1);
            imms |= hsb - lsb;
        }

        return immN << 12 | immr << 6 | imms;
    }

    static constexpr int InvalidLogicalImmediate = -1;

    int m_value;
};

class ARM64FPImmediate {
public:
    static ARM64FPImmediate create64(uint64_t value)
    {
        uint8_t result = 0;
        for (unsigned i = 0; i < sizeof(double); ++i) {
            uint8_t slice = static_cast<uint8_t>(value >> (8 * i));
            if (!slice)
                continue;
            if (slice == UINT8_MAX) {
                result |= (1U << i);
                continue;
            }
            return { };
        }
        return ARM64FPImmediate(result);
    }

    bool isValid() const { return m_value.has_value(); }
    uint8_t value() const
    {
        ASSERT(isValid());
        return m_value.value();
    }

private:
    ARM64FPImmediate() = default;

    ARM64FPImmediate(uint8_t value)
        : m_value(value)
    {
    }

    std::optional<uint8_t> m_value;
};

ALWAYS_INLINE bool isValidARMThumb2Immediate(int64_t value)
{
    if (value < 0)
        return false;
    if (value > UINT32_MAX)
        return false;
    if (value < 256)
        return true;
    // If it can be expressed as an 8-bit number, left sifted by a constant
    const int64_t mask = (value ^ (value & (value - 1))) * 0xff;
    if ((value & mask) == value)
        return true;
    // FIXME: there are a few more valid forms, see section 4.2 in the Thumb-2 Supplement
    return false;
}

enum class MachineCodeCopyMode : uint8_t {
    Memcpy,
    JITMemcpy,
};

static ALWAYS_INLINE void* memcpyAtomicIfPossible(void* dst, const void* src, size_t n)
{
#if !CPU(NEEDS_ALIGNED_ACCESS)
    // We would like to do atomic write here.
    switch (n) {
    case 1:
        WTF::atomicStore(std::bit_cast<uint8_t*>(dst), *std::bit_cast<const uint8_t*>(src), std::memory_order_relaxed);
        return dst;
    case 2:
        WTF::atomicStore(std::bit_cast<uint16_t*>(dst), *std::bit_cast<const uint16_t*>(src), std::memory_order_relaxed);
        return dst;
    case 4:
        WTF::atomicStore(std::bit_cast<uint32_t*>(dst), *std::bit_cast<const uint32_t*>(src), std::memory_order_relaxed);
        return dst;
    case 8:
        WTF::atomicStore(std::bit_cast<uint64_t*>(dst), *std::bit_cast<const uint64_t*>(src), std::memory_order_relaxed);
        return dst;
    default:
        break;
    }
#endif
    return memcpy(dst, src, n);
}

static void* performJITMemcpy(void* dst, const void* src, size_t n);

template<MachineCodeCopyMode copy>
ALWAYS_INLINE void* machineCodeCopy(void* dst, const void* src, size_t n)
{
#if CPU(ARM_THUMB2)
    // For thumb instructions, we want to avoid the case where we have
    // to repatch a 32-bit instruction that crosses 2 words.
    bool isAligned = (dst == WTF::roundUpToMultipleOf<4>(dst));
    if (n == 2 * sizeof(int16_t) && isAligned) {
        *static_cast<uint32_t*>(dst) = *static_cast<const uint32_t*>(src);
        return dst;
    }
    if (n == 1 * sizeof(int16_t)) {
        *static_cast<uint16_t*>(dst) = *static_cast<const uint16_t*>(src);
        return dst;
    }
#endif
    if constexpr (copy == MachineCodeCopyMode::Memcpy)
        return memcpyAtomicIfPossible(dst, src, n);
    else
        return performJITMemcpy(dst, src, n);
}

} // namespace JSC.
