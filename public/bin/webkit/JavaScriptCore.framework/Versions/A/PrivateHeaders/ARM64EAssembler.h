/*
 * Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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

#if ENABLE(ASSEMBLER) && CPU(ARM64E)

#include "ARM64Assembler.h"

namespace JSC {

#define CHECK_MEMOPSIZE_OF(size) static_assert(size == 8 || size == 16 || size == 32 || size == 64 || size == 128);
#define MEMOPSIZE_OF(datasize) ((datasize == 8 || datasize == 128) ? MemOpSize_8_or_128 : (datasize == 16) ? MemOpSize_16 : (datasize == 32) ? MemOpSize_32 : MemOpSize_64)
#define CHECK_MEMOPSIZE() CHECK_MEMOPSIZE_OF(datasize)
#define MEMOPSIZE MEMOPSIZE_OF(datasize)

class ARM64EAssembler : public ARM64Assembler {
protected:
    static constexpr RegisterID unusedID = static_cast<RegisterID>(0b11111);

    // Group 1 instructions from section 3.2.3.1.1.
    enum class Group1Op {
        PACIA1716 = 0b0001 << 8 | 0b000 << 5,
        PACIB1716 = 0b0001 << 8 | 0b010 << 5,
        AUTIA1716 = 0b0001 << 8 | 0b100 << 5,
        AUTIB1716 = 0b0001 << 8 | 0b110 << 5,
        PACIAZ    = 0b0011 << 8 | 0b000 << 5,
        PACIASP   = 0b0011 << 8 | 0b001 << 5,
        PACIBZ    = 0b0011 << 8 | 0b010 << 5,
        PACIBSP   = 0b0011 << 8 | 0b011 << 5,
        AUTIAZ    = 0b0011 << 8 | 0b100 << 5,
        AUTIASP   = 0b0011 << 8 | 0b101 << 5,
        AUTIBZ    = 0b0011 << 8 | 0b110 << 5,
        AUTIBSP   = 0b0011 << 8 | 0b111 << 5,
        XPACLRI   = 0b0000 << 8 | 0b111 << 5,
    };

    ALWAYS_INLINE static int encodeGroup1(Group1Op op)
    {
        return static_cast<int>(op) | 0b1101 << 28 | 0b0101 << 24 | 0b011 << 16 | 0b0010 << 12 | 0b11111;
    }

    // Group 2 instructions from section 3.2.3.1.1.
    enum class Group2Op {
        PACIA  = 1 << 30 | 0b00001 << 16 | 0b00000 << 10,
        PACIB  = 1 << 30 | 0b00001 << 16 | 0b00001 << 10,
        PACDA  = 1 << 30 | 0b00001 << 16 | 0b00010 << 10,
        PACDB  = 1 << 30 | 0b00001 << 16 | 0b00011 << 10,
        AUTIA  = 1 << 30 | 0b00001 << 16 | 0b00100 << 10,
        AUTIB  = 1 << 30 | 0b00001 << 16 | 0b00101 << 10,
        AUTDA  = 1 << 30 | 0b00001 << 16 | 0b00110 << 10,
        AUTDB  = 1 << 30 | 0b00001 << 16 | 0b00111 << 10,
        PACIZA = 1 << 30 | 0b00001 << 16 | 0b01000 << 10,
        PACIZB = 1 << 30 | 0b00001 << 16 | 0b01001 << 10,
        PACDZA = 1 << 30 | 0b00001 << 16 | 0b01010 << 10,
        PACDZB = 1 << 30 | 0b00001 << 16 | 0b01011 << 10,
        AUTIZA = 1 << 30 | 0b00001 << 16 | 0b01100 << 10,
        AUTIZB = 1 << 30 | 0b00001 << 16 | 0b01101 << 10,
        AUTDZA = 1 << 30 | 0b00001 << 16 | 0b01110 << 10,
        AUTDZB = 1 << 30 | 0b00001 << 16 | 0b01111 << 10,
        XPACI  = 1 << 30 | 0b00001 << 16 | 0b10000 << 10,
        XPACD  = 1 << 30 | 0b00001 << 16 | 0b10001 << 10,

        PACGA  = 0 << 30 | 0b01100 << 10,
    };

    ALWAYS_INLINE static int encodeGroup2(Group2Op op, RegisterID rn, RegisterID rd, RegisterID rm)
    {
        ASSERT((rn & 0b11111) == rn);
        ASSERT((rd & 0b11111) == rd);
        ASSERT((rm & 0b11111) == rm);
        return static_cast<int>(op) | 1 << 31 | 0b11010110 << 21 | rm << 16 | rn << 5 | rd;
    }

    ALWAYS_INLINE static int encodeGroup2(Group2Op op, RegisterID rn, RegisterID rd)
    {
        return encodeGroup2(op, rn, rd, static_cast<RegisterID>(0));
    }

    ALWAYS_INLINE static int encodeGroup2(Group2Op op, RegisterID rd)
    {
        return encodeGroup2(op, unusedID, rd);
    }

    // Group 4 instructions from section 3.2.3.2.1.
    enum class Group4Op {
        BRAA   = 0b1000 << 21 | 0 << 10,
        BRAB   = 0b1000 << 21 | 1 << 10,
        BLRAA  = 0b1001 << 21 | 0 << 10,
        BLRAB  = 0b1001 << 21 | 1 << 10,

        BRAAZ  = 0b0000 << 21 | 0 << 10,
        BRABZ  = 0b0000 << 21 | 1 << 10,
        BLRAAZ = 0b0001 << 21 | 0 << 10,
        BLRABZ = 0b0001 << 21 | 1 << 10,
        RETAA  = 0b0010 << 21 | 0 << 10 | 0b11111 << 5,
        RETAB  = 0b0010 << 21 | 1 << 10 | 0b11111 << 5,
        ERETAA = 0b0100 << 21 | 0 << 10 | 0b11111 << 5,
        ERETAB = 0b0100 << 21 | 1 << 10 | 0b11111 << 5,
    };

    ALWAYS_INLINE static int encodeGroup4(Group4Op op, RegisterID rn = unusedID, RegisterID rm = unusedID)
    {
        ASSERT((rn & 0b11111) == rn);
        ASSERT((rm & 0b11111) == rm);
        return (0b1101011 << 25 | static_cast<int>(op) | 0b11111 << 16 | 0b00001 << 11 | rn << 5 | rm);
    }

public:
    ALWAYS_INLINE void pacia1716() { insn(encodeGroup1(Group1Op::PACIA1716)); }
    ALWAYS_INLINE void pacib1716() { insn(encodeGroup1(Group1Op::PACIB1716)); }
    ALWAYS_INLINE void autia1716() { insn(encodeGroup1(Group1Op::AUTIA1716)); }
    ALWAYS_INLINE void autib1716() { insn(encodeGroup1(Group1Op::AUTIB1716)); }
    ALWAYS_INLINE void paciaz() { insn(encodeGroup1(Group1Op::PACIAZ)); }
    ALWAYS_INLINE void paciasp() { insn(encodeGroup1(Group1Op::PACIASP)); }
    ALWAYS_INLINE void pacibz() { insn(encodeGroup1(Group1Op::PACIBZ)); }
    ALWAYS_INLINE void pacibsp() { insn(encodeGroup1(Group1Op::PACIBSP)); }
    ALWAYS_INLINE void autiaz() { insn(encodeGroup1(Group1Op::AUTIAZ)); }
    ALWAYS_INLINE void autiasp() { insn(encodeGroup1(Group1Op::AUTIASP)); }
    ALWAYS_INLINE void autibz() { insn(encodeGroup1(Group1Op::AUTIBZ)); }
    ALWAYS_INLINE void autibsp() { insn(encodeGroup1(Group1Op::AUTIBSP)); }
    ALWAYS_INLINE void xpaclri() { insn(encodeGroup1(Group1Op::XPACLRI)); }

    ALWAYS_INLINE void pacia(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::PACIA, rn, rd));
    }

    ALWAYS_INLINE void pacib(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::PACIB, rn, rd));
    }

    ALWAYS_INLINE void pacda(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::PACDA, rn, rd));
    }

    ALWAYS_INLINE void pacdb(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::PACDB, rn, rd));
    }

    ALWAYS_INLINE void autia(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::AUTIA, rn, rd));
    }

    ALWAYS_INLINE void autib(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::AUTIB, rn, rd));
    }

    ALWAYS_INLINE void autda(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::AUTDA, rn, rd));
    }

    ALWAYS_INLINE void autdb(RegisterID rd, RegisterID rn)
    {
        insn(encodeGroup2(Group2Op::AUTDB, rn, rd));
    }

    ALWAYS_INLINE void paciza(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::PACIZA, rd));
    }

    ALWAYS_INLINE void pacizb(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::PACIZB, rd));
    }

    ALWAYS_INLINE void pacdza(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::PACDZA, rd));
    }

    ALWAYS_INLINE void pacdzb(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::PACDZB, rd));
    }

    ALWAYS_INLINE void autiza(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::AUTIZA, rd));
    }

    ALWAYS_INLINE void autizb(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::AUTIZB, rd));
    }

    ALWAYS_INLINE void autdza(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::AUTDZA, rd));
    }

    ALWAYS_INLINE void autdzb(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::AUTDZB, rd));
    }

    ALWAYS_INLINE void xpaci(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::XPACI, rd));
    }

    ALWAYS_INLINE void xpacd(RegisterID rd)
    {
        insn(encodeGroup2(Group2Op::XPACD, rd));
    }

    ALWAYS_INLINE void pacga(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        insn(encodeGroup2(Group2Op::PACGA, rn, rd, rm));
    }

    // Group 4 instructions from section 3.2.3.2.1.
    ALWAYS_INLINE void braa(RegisterID dest, RegisterID diversity)
    {
        insn(encodeGroup4(Group4Op::BRAA, dest, diversity));
    }

    ALWAYS_INLINE void brab(RegisterID dest, RegisterID diversity)
    {
        insn(encodeGroup4(Group4Op::BRAB, dest, diversity));
    }

    ALWAYS_INLINE void blraa(RegisterID dest, RegisterID diversity)
    {
        insn(encodeGroup4(Group4Op::BLRAA, dest, diversity));
    }

    ALWAYS_INLINE void blrab(RegisterID dest, RegisterID diversity)
    {
        insn(encodeGroup4(Group4Op::BLRAB, dest, diversity));
    }

    ALWAYS_INLINE void braaz(RegisterID dest)
    {
        insn(encodeGroup4(Group4Op::BRAAZ, dest));
    }

    ALWAYS_INLINE void brabz(RegisterID dest)
    {
        insn(encodeGroup4(Group4Op::BRABZ, dest));
    }

    ALWAYS_INLINE void blraaz(RegisterID dest)
    {
        insn(encodeGroup4(Group4Op::BLRAAZ, dest));
    }

    ALWAYS_INLINE void blrabz(RegisterID dest)
    {
        insn(encodeGroup4(Group4Op::BLRABZ, dest));
    }

    ALWAYS_INLINE void retaa() { insn(encodeGroup4(Group4Op::RETAA)); }
    ALWAYS_INLINE void retab() { insn(encodeGroup4(Group4Op::RETAB)); }
    ALWAYS_INLINE void eretaa() { insn(encodeGroup4(Group4Op::ERETAA)); }
    ALWAYS_INLINE void eretab() { insn(encodeGroup4(Group4Op::ERETAB)); }
};

#undef CHECK_MEMOPSIZE_OF
#undef MEMOPSIZE_OF
#undef CHECK_MEMOPSIZE
#undef MEMOPSIZE

} // namespace JSC

#endif // ENABLE(ASSEMBLER) && CPU(ARM64E)
