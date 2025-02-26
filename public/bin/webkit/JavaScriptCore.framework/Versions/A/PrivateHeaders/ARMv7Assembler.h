/*
 * Copyright (C) 2009-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2010 University of Szeged
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

#if ENABLE(ASSEMBLER) && CPU(ARM_THUMB2)

#include "AssemblerBuffer.h"
#include "AssemblerCommon.h"
#include "RegisterInfo.h"
#include <limits.h>
#include <wtf/Assertions.h>
#include <wtf/Vector.h>
#include <stdint.h>

namespace JSC {

namespace RegisterNames {

    typedef enum : int8_t {
#define REGISTER_ID(id, name, r, cs) id,
        FOR_EACH_GP_REGISTER(REGISTER_ID)
#undef REGISTER_ID

#define REGISTER_ALIAS(id, name, alias) id = alias,
        FOR_EACH_REGISTER_ALIAS(REGISTER_ALIAS)
#undef REGISTER_ALIAS
        InvalidGPRReg = -1,
    } RegisterID;

    typedef enum : int8_t {
#define REGISTER_ID(id, name) id,
        FOR_EACH_SP_REGISTER(REGISTER_ID)
#undef REGISTER_ID
    } SPRegisterID;

    typedef enum : int8_t {
#define REGISTER_ID(id, name, r, cs) id,
        FOR_EACH_FP_SINGLE_REGISTER(REGISTER_ID)
#undef REGISTER_ID
    } FPSingleRegisterID;

    typedef enum : int8_t {
#define REGISTER_ID(id, name, r, cs) id,
        FOR_EACH_FP_DOUBLE_REGISTER(REGISTER_ID)
#undef REGISTER_ID
        InvalidFPRReg = -1,
    } FPDoubleRegisterID;

#if CPU(ARM_NEON)
    typedef enum : int8_t {
#define REGISTER_ID(id, name, r, cs) id,
        FOR_EACH_FP_QUAD_REGISTER(REGISTER_ID)
#undef REGISTER_ID
    } FPQuadRegisterID;
#endif // CPU(ARM_NEON)

    inline FPSingleRegisterID asSingle(FPDoubleRegisterID reg)
    {
        ASSERT(reg <= d15);
        return (FPSingleRegisterID)(reg << 1);
    }

    inline FPSingleRegisterID asSingleUpper(FPDoubleRegisterID reg)
    {
        ASSERT(reg <= d15);
        return (FPSingleRegisterID)((reg << 1) + 1);
    }

    inline FPDoubleRegisterID asDouble(FPSingleRegisterID reg)
    {
        ASSERT(!(reg & 1));
        return (FPDoubleRegisterID)(reg >> 1);
    }

} // namespace ARMRegisters

class ARMv7Assembler;
class ARMThumbImmediate {
    friend class ARMv7Assembler;

    typedef uint8_t ThumbImmediateType;
    static constexpr ThumbImmediateType TypeInvalid = 0;
    static constexpr ThumbImmediateType TypeEncoded = 1;
    static constexpr ThumbImmediateType TypeUInt16 = 2;

    typedef union {
        int16_t asInt;
        struct {
            unsigned imm8 : 8;
            unsigned imm3 : 3;
            unsigned i    : 1;
            unsigned imm4 : 4;
        };
        // If this is an encoded immediate, then it may describe a shift, or a pattern.
        struct {
            unsigned shiftValue7 : 7;
            unsigned shiftAmount : 5;
        };
        struct {
            unsigned immediate   : 8;
            unsigned pattern     : 4;
        };
    } ThumbImmediateValue;

    // byte0 contains least significant bit; not using an array to make client code endian agnostic.
    typedef union {
        int32_t asInt;
        struct {
            uint8_t byte0;
            uint8_t byte1;
            uint8_t byte2;
            uint8_t byte3;
        };
    } PatternBytes;

    ALWAYS_INLINE static void countLeadingZerosPartial(uint32_t& value, int32_t& zeros, const int N)
    {
        if (value & ~((1 << N) - 1)) /* check for any of the top N bits (of 2N bits) are set */
            value >>= N;             /* if any were set, lose the bottom N */
        else                         /* if none of the top N bits are set, */
            zeros += N;              /* then we have identified N leading zeros */
    }

    static int32_t countLeadingZeros(uint32_t value)
    {
        if (!value)
            return 32;

        int32_t zeros = 0;
        countLeadingZerosPartial(value, zeros, 16);
        countLeadingZerosPartial(value, zeros, 8);
        countLeadingZerosPartial(value, zeros, 4);
        countLeadingZerosPartial(value, zeros, 2);
        countLeadingZerosPartial(value, zeros, 1);
        return zeros;
    }

    ARMThumbImmediate()
        : m_type(TypeInvalid)
    {
        m_value.asInt = 0;
    }
        
    ARMThumbImmediate(ThumbImmediateType type, ThumbImmediateValue value)
        : m_type(type)
        , m_value(value)
    {
    }

    ARMThumbImmediate(ThumbImmediateType type, uint16_t value)
        : m_type(TypeUInt16)
    {
        // Make sure this constructor is only reached with type TypeUInt16;
        // this extra parameter makes the code a little clearer by making it
        // explicit at call sites which type is being constructed
        ASSERT_UNUSED(type, type == TypeUInt16);

        m_value.asInt = value;
    }

public:
    static ARMThumbImmediate makeEncodedImm(uint32_t value)
    {
        ThumbImmediateValue encoding;
        encoding.asInt = 0;

        // okay, these are easy.
        if (value < 256) {
            encoding.immediate = value;
            encoding.pattern = 0;
            return ARMThumbImmediate(TypeEncoded, encoding);
        }

        int32_t leadingZeros = countLeadingZeros(value);
        // if there were 24 or more leading zeros, then we'd have hit the (value < 256) case.
        ASSERT(leadingZeros < 24);

        // Given a number with bit fields Z:B:C, where count(Z)+count(B)+count(C) == 32,
        // Z are the bits known zero, B is the 8-bit immediate, C are the bits to check for
        // zero.  count(B) == 8, so the count of bits to be checked is 24 - count(Z).
        int32_t rightShiftAmount = 24 - leadingZeros;
        if (value == ((value >> rightShiftAmount) << rightShiftAmount)) {
            // Shift the value down to the low byte position.  The assign to 
            // shiftValue7 drops the implicit top bit.
            encoding.shiftValue7 = value >> rightShiftAmount;
            // The endoded shift amount is the magnitude of a right rotate.
            encoding.shiftAmount = 8 + leadingZeros;
            return ARMThumbImmediate(TypeEncoded, encoding);
        }
        
        PatternBytes bytes;
        bytes.asInt = value;

        if ((bytes.byte0 == bytes.byte1) && (bytes.byte0 == bytes.byte2) && (bytes.byte0 == bytes.byte3)) {
            encoding.immediate = bytes.byte0;
            encoding.pattern = 3;
            return ARMThumbImmediate(TypeEncoded, encoding);
        }

        if ((bytes.byte0 == bytes.byte2) && !(bytes.byte1 | bytes.byte3)) {
            encoding.immediate = bytes.byte0;
            encoding.pattern = 1;
            return ARMThumbImmediate(TypeEncoded, encoding);
        }

        if ((bytes.byte1 == bytes.byte3) && !(bytes.byte0 | bytes.byte2)) {
            encoding.immediate = bytes.byte1;
            encoding.pattern = 2;
            return ARMThumbImmediate(TypeEncoded, encoding);
        }

        return ARMThumbImmediate();
    }

    static ARMThumbImmediate makeUInt12(int32_t value)
    {
        return (!(value & 0xfffff000))
            ? ARMThumbImmediate(TypeUInt16, (uint16_t)value)
            : ARMThumbImmediate();
    }

    static ARMThumbImmediate makeUInt12OrEncodedImm(int32_t value)
    {
        // If this is not a 12-bit unsigned it, try making an encoded immediate.
        return (!(value & 0xfffff000))
            ? ARMThumbImmediate(TypeUInt16, (uint16_t)value)
            : makeEncodedImm(value);
    }

    // The 'make' methods, above, return a !isValid() value if the argument
    // cannot be represented as the requested type.  This methods  is called
    // 'get' since the argument can always be represented.
    static ARMThumbImmediate makeUInt16(uint16_t value)
    {
        return ARMThumbImmediate(TypeUInt16, value);
    }
    
    bool isValid()
    {
        return m_type != TypeInvalid;
    }

    uint16_t asUInt16() const { return m_value.asInt; }

    // These methods rely on the format of encoded byte values.
    bool isUInt3() { return !(m_value.asInt & 0xfff8); }
    bool isUInt4() { return !(m_value.asInt & 0xfff0); }
    bool isUInt5() { return !(m_value.asInt & 0xffe0); }
    bool isUInt6() { return !(m_value.asInt & 0xffc0); }
    bool isUInt7() { return !(m_value.asInt & 0xff80); }
    bool isUInt8() { return !(m_value.asInt & 0xff00); }
    bool isUInt9() { return (m_type == TypeUInt16) && !(m_value.asInt & 0xfe00); }
    bool isUInt10() { return (m_type == TypeUInt16) && !(m_value.asInt & 0xfc00); }
    bool isUInt12() { return (m_type == TypeUInt16) && !(m_value.asInt & 0xf000); }
    bool isUInt16() { return m_type == TypeUInt16; }
    uint8_t getUInt3() { ASSERT(isUInt3()); return m_value.asInt; }
    uint8_t getUInt4() { ASSERT(isUInt4()); return m_value.asInt; }
    uint8_t getUInt5() { ASSERT(isUInt5()); return m_value.asInt; }
    uint8_t getUInt6() { ASSERT(isUInt6()); return m_value.asInt; }
    uint8_t getUInt7() { ASSERT(isUInt7()); return m_value.asInt; }
    uint8_t getUInt8() { ASSERT(isUInt8()); return m_value.asInt; }
    uint16_t getUInt9() { ASSERT(isUInt9()); return m_value.asInt; }
    uint16_t getUInt10() { ASSERT(isUInt10()); return m_value.asInt; }
    uint16_t getUInt12() { ASSERT(isUInt12()); return m_value.asInt; }
    uint16_t getUInt16() { ASSERT(isUInt16()); return m_value.asInt; }

    bool isEncodedImm() { return m_type == TypeEncoded; }

private:
    ThumbImmediateType m_type;
    ThumbImmediateValue m_value;
};

typedef enum {
    SRType_LSL,
    SRType_LSR,
    SRType_ASR,
    SRType_ROR,

    SRType_RRX = SRType_ROR
} ARMShiftType;

class ShiftTypeAndAmount {
    friend class ARMv7Assembler;

public:
    ShiftTypeAndAmount()
    {
        m_u.type = (ARMShiftType)0;
        m_u.amount = 0;
    }
    
    ShiftTypeAndAmount(ARMShiftType type, unsigned amount)
    {
        m_u.type = type;
        m_u.amount = amount & 31;
    }
    
    unsigned lo4() { return m_u.lo4; }
    unsigned hi4() { return m_u.hi4; }
    
private:
    union {
        struct {
            unsigned lo4 : 4;
            unsigned hi4 : 4;
        };
        struct {
            unsigned type   : 2;
            unsigned amount : 6;
        };
    } m_u;
};

class ARMv7Assembler {
public:
    typedef ARMRegisters::RegisterID RegisterID;
    typedef ARMRegisters::FPSingleRegisterID FPSingleRegisterID;
    typedef ARMRegisters::FPDoubleRegisterID FPDoubleRegisterID;
#if CPU(ARM_NEON)
    typedef ARMRegisters::FPQuadRegisterID FPQuadRegisterID;
#endif
    typedef ARMRegisters::SPRegisterID SPRegisterID;
    typedef FPDoubleRegisterID FPRegisterID;
    
    static constexpr RegisterID firstRegister() { return ARMRegisters::r0; }
    static constexpr RegisterID lastRegister() { return ARMRegisters::r15; }
    static constexpr unsigned numberOfRegisters() { return lastRegister() - firstRegister() + 1; }

    static constexpr SPRegisterID firstSPRegister() { return ARMRegisters::apsr; }
    static constexpr SPRegisterID lastSPRegister() { return ARMRegisters::fpscr; }
    static constexpr unsigned numberOfSPRegisters() { return lastSPRegister() - firstSPRegister() + 1; }

    static constexpr FPRegisterID firstFPRegister() { return ARMRegisters::d0; }
#if CPU(ARM_NEON) || CPU(ARM_VFP_V3_D32)
    static constexpr FPRegisterID lastFPRegister() { return ARMRegisters::d31; }
#else
    static constexpr FPRegisterID lastFPRegister() { return ARMRegisters::d15; }
#endif
    static constexpr unsigned numberOfFPRegisters() { return lastFPRegister() - firstFPRegister() + 1; }

    static ASCIILiteral gprName(RegisterID id)
    {
        ASSERT(id >= firstRegister() && id <= lastRegister());
        static constexpr ASCIILiteral nameForRegister[numberOfRegisters()] = {
#define REGISTER_NAME(id, name, r, cs) name,
        FOR_EACH_GP_REGISTER(REGISTER_NAME)
#undef REGISTER_NAME        
        };
        return nameForRegister[id];
    }

    static ASCIILiteral sprName(SPRegisterID id)
    {
        ASSERT(id >= firstSPRegister() && id <= lastSPRegister());
        static constexpr ASCIILiteral nameForRegister[numberOfSPRegisters()] = {
#define REGISTER_NAME(id, name) name,
        FOR_EACH_SP_REGISTER(REGISTER_NAME)
#undef REGISTER_NAME
        };
        return nameForRegister[id];
    }

    static ASCIILiteral fprName(FPRegisterID id)
    {
        ASSERT(id >= firstFPRegister() && id <= lastFPRegister());
        static constexpr ASCIILiteral nameForRegister[numberOfFPRegisters()] = {
#define REGISTER_NAME(id, name, r, cs) name,
        FOR_EACH_FP_DOUBLE_REGISTER(REGISTER_NAME)
#undef REGISTER_NAME
        };
        return nameForRegister[id];
    }

    // (HS, LO, HI, LS) -> (AE, B, A, BE)
    // (VS, VC) -> (O, NO)
    typedef enum {
        ConditionEQ, // Zero / Equal.
        ConditionNE, // Non-zero / Not equal.
        ConditionHS, ConditionCS = ConditionHS, // Unsigned higher or same.
        ConditionLO, ConditionCC = ConditionLO, // Unsigned lower.
        ConditionMI, // Negative.
        ConditionPL, // Positive or zero.
        ConditionVS, // Overflowed.
        ConditionVC, // Not overflowed.
        ConditionHI, // Unsigned higher.
        ConditionLS, // Unsigned lower or same.
        ConditionGE, // Signed greater than or equal.
        ConditionLT, // Signed less than.
        ConditionGT, // Signed greater than.
        ConditionLE, // Signed less than or equal.
        ConditionAL, // Unconditional / Always execute.
        ConditionInvalid
    } Condition;

#define JUMP_ENUM_WITH_SIZE(index, value) (((value) << 3) | (index))
#define JUMP_ENUM_SIZE(jump) ((jump) >> 3) 
    enum JumpType { JumpFixed = JUMP_ENUM_WITH_SIZE(0, 0), 
                    JumpNoCondition = JUMP_ENUM_WITH_SIZE(1, 5 * sizeof(uint16_t)),
                    JumpCondition = JUMP_ENUM_WITH_SIZE(2, 6 * sizeof(uint16_t)),
                    JumpNoConditionFixedSize = JUMP_ENUM_WITH_SIZE(3, 5 * sizeof(uint16_t)),
                    JumpConditionFixedSize = JUMP_ENUM_WITH_SIZE(4, 6 * sizeof(uint16_t))
    };
    enum JumpLinkType { 
        LinkInvalid = JUMP_ENUM_WITH_SIZE(0, 0),
        LinkJumpT1 = JUMP_ENUM_WITH_SIZE(1, sizeof(uint16_t)),
        LinkJumpT2 = JUMP_ENUM_WITH_SIZE(2, sizeof(uint16_t)),
        LinkJumpT3 = JUMP_ENUM_WITH_SIZE(3, 2 * sizeof(uint16_t)),
        LinkJumpT4 = JUMP_ENUM_WITH_SIZE(4, 2 * sizeof(uint16_t)),
        LinkConditionalJumpT4 = JUMP_ENUM_WITH_SIZE(5, 3 * sizeof(uint16_t)),
        LinkBX = JUMP_ENUM_WITH_SIZE(6, 5 * sizeof(uint16_t)),
        LinkConditionalBX = JUMP_ENUM_WITH_SIZE(7, 6 * sizeof(uint16_t))
    };

    class LinkRecord {
    public:
        LinkRecord(intptr_t from, intptr_t to, JumpType type, Condition condition)
        {
            data.realTypes.m_from = from;
            data.realTypes.m_to = to;
            data.realTypes.m_type = type;
            data.realTypes.m_linkType = LinkInvalid;
            data.realTypes.m_condition = condition;
        }
        // We are defining a copy constructor and assignment operator
        // because the ones provided by the compiler are not
        // optimal. See https://bugs.webkit.org/show_bug.cgi?id=90930
        LinkRecord(const LinkRecord& other)
        {
            data.copyTypes = other.data.copyTypes;
        }
        LinkRecord& operator=(const LinkRecord& other)
        {
            data.copyTypes = other.data.copyTypes;
            return *this;
        }
        intptr_t from() const { return data.realTypes.m_from; }
        void setFrom(const ARMv7Assembler*, intptr_t from) { data.realTypes.m_from = from; }
        intptr_t to(const ARMv7Assembler*) const { return data.realTypes.m_to; }
        JumpType type() const { return data.realTypes.m_type; }
        JumpLinkType linkType() const { return data.realTypes.m_linkType; }
        void setLinkType(JumpLinkType linkType) { ASSERT(data.realTypes.m_linkType == LinkInvalid); data.realTypes.m_linkType = linkType; }
        Condition condition() const { return data.realTypes.m_condition; }
        bool isThunk() const { return false; }
    private:
        union {
            struct RealTypes {
                intptr_t m_from : 31;
                intptr_t m_to : 31;
                JumpType m_type : 8;
                JumpLinkType m_linkType : 8;
                Condition m_condition : 16;
            } realTypes;
            struct CopyTypes {
                uint32_t content[3];
            } copyTypes;
            static_assert(sizeof(RealTypes) == sizeof(CopyTypes), "LinkRecord's CopyStruct size equals to RealStruct");
        } data;
    };

    ARMv7Assembler()
        : m_indexOfLastWatchpoint(INT_MIN)
        , m_indexOfTailOfLastWatchpoint(INT_MIN)
    {
    }

    AssemblerBuffer& buffer() { return m_formatter.m_buffer; }

private:

    // In the ARMv7 ISA, the LSB of a code pointer indicates whether the target uses Thumb vs ARM
    // encoding. These utility functions are there for when we need to deal with this.
    static bool isEven(const void* ptr) { return !(reinterpret_cast<uintptr_t>(ptr) & 1); }
    static bool isEven(AssemblerLabel &label) { return !(label.offset() & 1); }
    static void* makeEven(const void* ptr)
    {
        ASSERT(!isEven(ptr));
        return reinterpret_cast<void*>(reinterpret_cast<uintptr_t>(ptr) & ~1);
    }

    // ARMv7, Appx-A.6.3
    static bool BadReg(RegisterID reg)
    {
        return (reg == ARMRegisters::sp) || (reg == ARMRegisters::pc);
    }

    uint32_t singleRegisterMask(FPSingleRegisterID rdNum, int highBitsShift, int lowBitShift)
    {
        uint32_t rdMask = (rdNum >> 1) << highBitsShift;
        if (rdNum & 1)
            rdMask |= 1 << lowBitShift;
        return rdMask;
    }

    uint32_t doubleRegisterMask(FPDoubleRegisterID rdNum, int highBitShift, int lowBitsShift)
    {
        uint32_t rdMask = (rdNum & 0xf) << lowBitsShift;
        if (rdNum & 16)
            rdMask |= 1 << highBitShift;
        return rdMask;
    }

    typedef enum {
        OP_ADD_reg_T1       = 0x1800,
        OP_SUB_reg_T1       = 0x1A00,
        OP_ADD_imm_T1       = 0x1C00,
        OP_SUB_imm_T1       = 0x1E00,
        OP_MOV_imm_T1       = 0x2000,
        OP_CMP_imm_T1       = 0x2800,
        OP_ADD_imm_T2       = 0x3000,
        OP_SUB_imm_T2       = 0x3800,
        OP_AND_reg_T1       = 0x4000,
        OP_EOR_reg_T1       = 0x4040,
        OP_TST_reg_T1       = 0x4200,
        OP_RSB_imm_T1       = 0x4240,
        OP_CMP_reg_T1       = 0x4280,
        OP_ORR_reg_T1       = 0x4300,
        OP_MVN_reg_T1       = 0x43C0,
        OP_ADD_reg_T2       = 0x4400,
        OP_MOV_reg_T1       = 0x4600,
        OP_BLX              = 0x4700,
        OP_BX               = 0x4700,
        OP_STR_reg_T1       = 0x5000,
        OP_STRH_reg_T1      = 0x5200,
        OP_STRB_reg_T1      = 0x5400,
        OP_LDRSB_reg_T1     = 0x5600,
        OP_LDR_reg_T1       = 0x5800,
        OP_LDRH_reg_T1      = 0x5A00,
        OP_LDRB_reg_T1      = 0x5C00,
        OP_LDRSH_reg_T1     = 0x5E00,
        OP_STR_imm_T1       = 0x6000,
        OP_LDR_imm_T1       = 0x6800,
        OP_STRB_imm_T1      = 0x7000,
        OP_LDRB_imm_T1      = 0x7800,
        OP_STRH_imm_T1      = 0x8000,
        OP_LDRH_imm_T1      = 0x8800,
        OP_STR_imm_T2       = 0x9000,
        OP_LDR_imm_T2       = 0x9800,
        OP_ADD_SP_imm_T1    = 0xA800,
        OP_ADD_SP_imm_T2    = 0xB000,
        OP_SUB_SP_imm_T1    = 0xB080,
        OP_SXTH_T1          = 0xB200,
        OP_SXTB_T1          = 0xB240,
        OP_UXTH_T1          = 0xB280,
        OP_UXTB_T1          = 0xB2C0,
        OP_PUSH_T1          = 0xB400,
        OP_POP_T1           = 0xBC00,
        OP_BKPT             = 0xBE00,
        OP_IT               = 0xBF00,
        OP_NOP_T1           = 0xBF00,
        OP_UDF              = 0xDE00
    } OpcodeID;

    typedef enum {
        OP_B_T1         = 0xD000,
        OP_B_T2         = 0xE000,
        OP_STRD_imm_T1  = 0xE840,
        OP_STREX_T1     = 0xE840,
        OP_LDRD_imm_T1  = 0xE850,
        OP_LDREX_T1     = 0xE850,
        OP_POP_T2       = 0xE8BD,
        OP_STREXB_T1    = 0xE8C0,
        OP_STREXD_T1    = 0xE8C0,
        OP_STREXH_T1    = 0xE8C0,
        OP_LDREXB_T1    = 0xE8D0,
        OP_LDREXD_T1    = 0xE8D0,
        OP_LDREXH_T1    = 0xE8D0,
        OP_PUSH_T2      = 0xE92D,
        OP_AND_reg_T2   = 0xEA00,
        OP_TST_reg_T2   = 0xEA10,
        OP_ORR_reg_T2   = 0xEA40,
        OP_ORR_S_reg_T2 = 0xEA50,
        OP_ASR_imm_T1   = 0xEA4F,
        OP_LSL_imm_T1   = 0xEA4F,
        OP_LSR_imm_T1   = 0xEA4F,
        OP_ROR_imm_T1   = 0xEA4F,
        OP_MVN_reg_T2   = 0xEA6F,
        OP_EOR_reg_T2   = 0xEA80,
        OP_ADD_reg_T3   = 0xEB00,
        OP_ADD_S_reg_T3 = 0xEB10,
        OP_ADC_reg_T2   = 0xEB40,
        OP_SBC_reg_T2   = 0xEB60,
        OP_SUB_reg_T2   = 0xEBA0,
        OP_SUB_S_reg_T2 = 0xEBB0,
        OP_CMP_reg_T2   = 0xEBB0,
        OP_VMOV_CtoD    = 0xEC00,
        OP_VMOV_DtoC    = 0xEC10,
        OP_VSTMIA       = 0xEC80,
        OP_VLDMIA       = 0xEC90,
        OP_FSTS         = 0xED00,
        OP_VSTR         = 0xED00,
        OP_FLDS         = 0xED10,
        OP_VLDR         = 0xED10,
        OP_VMOV_CtoS    = 0xEE00,
        OP_VMOV_StoC    = 0xEE10,
        OP_VMUL_T2      = 0xEE20,
        OP_VADD_T2      = 0xEE30,
        OP_VSUB_T2      = 0xEE30,
        OP_VDIV         = 0xEE80,
        OP_VABS_T2      = 0xEEB0,
        OP_VCMP         = 0xEEB0,
        OP_VCVT_FPIVFP  = 0xEEB0,
        OP_VMOV_T2      = 0xEEB0,
        OP_VMOV_IMM_T2  = 0xEEB0,
        OP_VMRS         = 0xEEB0,
        OP_VNEG_T2      = 0xEEB0,
        OP_VSQRT_T1     = 0xEEB0,
        OP_VCVTSD_T1    = 0xEEB0,
        OP_VCVTDS_T1    = 0xEEB0,
        OP_VAND_T1      = 0xEF00,
        OP_VORR_T1      = 0xEF20,
        OP_B_T3a        = 0xF000,
        OP_B_T4a        = 0xF000,
        OP_BL_T4a       = 0xF000,
        OP_AND_imm_T1   = 0xF000,
        OP_TST_imm      = 0xF010,
        OP_BIC_imm_T1   = 0xF020,
        OP_ORR_imm_T1   = 0xF040,
        OP_MOV_imm_T2   = 0xF040,
        OP_MVN_imm      = 0xF060,
        OP_EOR_imm_T1   = 0xF080,
        OP_ADD_imm_T3   = 0xF100,
        OP_ADD_S_imm_T3 = 0xF110,
        OP_CMN_imm      = 0xF110,
        OP_ADC_imm      = 0xF140,
        OP_SUB_imm_T3   = 0xF1A0,
        OP_SUB_S_imm_T3 = 0xF1B0,
        OP_CMP_imm_T2   = 0xF1B0,
        OP_RSB_imm_T2   = 0xF1C0,
        OP_RSB_S_imm_T2 = 0xF1D0,
        OP_ADD_imm_T4   = 0xF200,
        OP_MOV_imm_T3   = 0xF240,
        OP_SUB_imm_T4   = 0xF2A0,
        OP_MOVT         = 0xF2C0,
        OP_UBFX_T1      = 0xF3C0,
        OP_NOP_T2a      = 0xF3AF,
        OP_DMB_T1a      = 0xF3BF,
        OP_STRB_imm_T3  = 0xF800,
        OP_STRB_reg_T2  = 0xF800,
        OP_LDRB_imm_T3  = 0xF810,
        OP_LDRB_reg_T2  = 0xF810,
        OP_STRH_imm_T3  = 0xF820,
        OP_STRH_reg_T2  = 0xF820,
        OP_LDRH_reg_T2  = 0xF830,
        OP_LDRH_imm_T3  = 0xF830,
        OP_STR_imm_T4   = 0xF840,
        OP_STR_reg_T2   = 0xF840,
        OP_LDR_imm_T4   = 0xF850,
        OP_LDR_reg_T2   = 0xF850,
        OP_STRB_imm_T2  = 0xF880,
        OP_LDRB_imm_T2  = 0xF890,
        OP_STRH_imm_T2  = 0xF8A0,
        OP_LDRH_imm_T2  = 0xF8B0,
        OP_STR_imm_T3   = 0xF8C0,
        OP_LDR_imm_T3   = 0xF8D0,
        OP_LDRSB_imm_T2 = 0xF910,
        OP_LDRSB_reg_T2 = 0xF910,
        OP_LDRSH_imm_T2 = 0xF930,
        OP_LDRSH_reg_T2 = 0xF930,
        OP_LDRSB_imm_T1 = 0xF990,
        OP_LDRSH_imm_T1 = 0xF9B0,
        OP_LSL_reg_T2   = 0xFA00,
        OP_SXTH_T2      = 0xFA0F,
        OP_UXTH_T2      = 0xFA1F,
        OP_SXTB_T2      = 0xFA4F,
        OP_UXTB_T2      = 0xFA5F,
        OP_LSR_reg_T2   = 0xFA20,
        OP_ASR_reg_T2   = 0xFA40,
        OP_ROR_reg_T2   = 0xFA60,
        OP_RBIT         = 0xFA90,
        OP_CLZ          = 0xFAB0,
        OP_SMULL_T1     = 0xFB80,
        OP_UMULL_T1     = 0xFBA0,
#if HAVE(ARM_IDIV_INSTRUCTIONS)
        OP_SDIV_T1      = 0xFB90,
        OP_UDIV_T1      = 0xFBB0,
#endif
        OP_MRS_T1       = 0xF3EF,
    } OpcodeID1;

    typedef enum {
        OP_VAND_T1b      = 0x0010,
        OP_VORR_T1b      = 0x0010,
        OP_VADD_T2b      = 0x0A00,
        OP_VDIVb         = 0x0A00,
        OP_FLDSb         = 0x0A00,
        OP_VLDRb         = 0x0A00,
        OP_VMOV_IMM_T2b  = 0x0A00,
        OP_VMOV_T2b      = 0x0A40,
        OP_VMUL_T2b      = 0x0A00,
        OP_FSTSb         = 0x0A00,
        OP_VSTRb         = 0x0A00,
        OP_VMOV_StoCb    = 0x0A10,
        OP_VMOV_CtoSb    = 0x0A10,
        OP_VMOV_DtoCb    = 0x0A10,
        OP_VMOV_CtoDb    = 0x0A10,
        OP_VMRSb         = 0x0A10,
        OP_VABS_T2b      = 0x0A40,
        OP_VCMPb         = 0x0A40,
        OP_VCVT_FPIVFPb  = 0x0A40,
        OP_VNEG_T2b      = 0x0A40,
        OP_VSUB_T2b      = 0x0A40,
        OP_VSQRT_T1b     = 0x0A40,
        OP_VCVTSD_T1b    = 0x0A40,
        OP_VCVTDS_T1b    = 0x0A40,
        OP_VSTMIAb       = 0x0B00,
        OP_VLDMIAb       = 0x0B00,
        OP_NOP_T2b       = 0x8000,
        OP_DMB_SY_T1b    = 0x8F5F,
        OP_DMB_ISHST_T1b = 0x8F5A,
        OP_DMB_ISH_T1b   = 0x8F5B,
        OP_B_T3b         = 0x8000,
        OP_B_T4b         = 0x9000,
        OP_BL_T4b        = 0xD000,
    } OpcodeID2;

    struct FourFours {
        FourFours(unsigned f3, unsigned f2, unsigned f1, unsigned f0)
        {
            m_u.f0 = f0;
            m_u.f1 = f1;
            m_u.f2 = f2;
            m_u.f3 = f3;
        }

        union {
            unsigned value;
            struct {
                unsigned f0 : 4;
                unsigned f1 : 4;
                unsigned f2 : 4;
                unsigned f3 : 4;
            };
        } m_u;
    };

    enum class BranchWithLink : bool {
        No = false,
        Yes = true
    };

    class ARMInstructionFormatter;

    // false means else!
    static bool ifThenElseConditionBit(Condition condition, bool isIf)
    {
        return isIf ? (condition & 1) : !(condition & 1);
    }
    static uint8_t ifThenElse(Condition condition, bool inst2if, bool inst3if, bool inst4if)
    {
        int mask = (ifThenElseConditionBit(condition, inst2if) << 3)
            | (ifThenElseConditionBit(condition, inst3if) << 2)
            | (ifThenElseConditionBit(condition, inst4if) << 1)
            | 1;
        ASSERT((condition != ConditionAL) || !(mask & (mask - 1)));
        return (condition << 4) | mask;
    }
    static uint8_t ifThenElse(Condition condition, bool inst2if, bool inst3if)
    {
        int mask = (ifThenElseConditionBit(condition, inst2if) << 3)
            | (ifThenElseConditionBit(condition, inst3if) << 2)
            | 2;
        ASSERT((condition != ConditionAL) || !(mask & (mask - 1)));
        return (condition << 4) | mask;
    }
    static uint8_t ifThenElse(Condition condition, bool inst2if)
    {
        int mask = (ifThenElseConditionBit(condition, inst2if) << 3)
            | 4;
        ASSERT((condition != ConditionAL) || !(mask & (mask - 1)));
        return (condition << 4) | mask;
    }

    static uint8_t ifThenElse(Condition condition)
    {
        int mask = 8;
        return (condition << 4) | mask;
    }

public:
    
    void adc(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        // Rd can only be SP if Rn is also SP.
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isEncodedImm());

        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_ADC_imm, rn, rd, imm);
    }

    void adc(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift = ShiftTypeAndAmount { })
    {
        // Rd can only be SP if Rn is also SP.
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_ADC_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    void add(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        // Rd can only be SP if Rn is also SP.
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isValid());

        if (rn == ARMRegisters::sp && imm.isUInt16()) {
            ASSERT(!(imm.getUInt16() & 3));
            if (!(rd & 8) && imm.isUInt10()) {
                m_formatter.oneWordOp5Reg3Imm8(OP_ADD_SP_imm_T1, rd, static_cast<uint8_t>(imm.getUInt10() >> 2));
                return;
            } else if ((rd == ARMRegisters::sp) && imm.isUInt9()) {
                m_formatter.oneWordOp9Imm7(OP_ADD_SP_imm_T2, static_cast<uint8_t>(imm.getUInt9() >> 2));
                return;
            }
        } else if (!((rd | rn) & 8)) {
            if (imm.isUInt3()) {
                m_formatter.oneWordOp7Reg3Reg3Reg3(OP_ADD_imm_T1, (RegisterID)imm.getUInt3(), rn, rd);
                return;
            } else if ((rd == rn) && imm.isUInt8()) {
                m_formatter.oneWordOp5Reg3Imm8(OP_ADD_imm_T2, rd, imm.getUInt8());
                return;
            }
        }

        if (imm.isEncodedImm())
            m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_ADD_imm_T3, rn, rd, imm);
        else {
            ASSERT(imm.isUInt12());
            m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_ADD_imm_T4, rn, rd, imm);
        }
    }

    ALWAYS_INLINE void add(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_ADD_reg_T3, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    // NOTE: In an IT block, add doesn't modify the flags register.
    ALWAYS_INLINE void add(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if (rd == ARMRegisters::sp && rd != rn) {
            mov(rd, rn);
            rn = rd;
        }

        if (rd == rn)
            m_formatter.oneWordOp8RegReg143(OP_ADD_reg_T2, rm, rd);
        else if (rd == rm)
            m_formatter.oneWordOp8RegReg143(OP_ADD_reg_T2, rn, rd);
        else if (!((rd | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_ADD_reg_T1, rm, rn, rd);
        else
            add(rd, rn, rm, ShiftTypeAndAmount());
    }

    // Not allowed in an IT (if then) block.
    ALWAYS_INLINE void add_S(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        // Rd can only be SP if Rn is also SP.
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isEncodedImm());

        if (!((rd | rn) & 8)) {
            if (imm.isUInt3()) {
                m_formatter.oneWordOp7Reg3Reg3Reg3(OP_ADD_imm_T1, (RegisterID)imm.getUInt3(), rn, rd);
                return;
            } else if ((rd == rn) && imm.isUInt8()) {
                m_formatter.oneWordOp5Reg3Imm8(OP_ADD_imm_T2, rd, imm.getUInt8());
                return;
            }
        }

        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_ADD_S_imm_T3, rn, rd, imm);
    }

    // Not allowed in an IT (if then) block?
    ALWAYS_INLINE void add_S(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_ADD_S_reg_T3, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    // Not allowed in an IT (if then) block.
    ALWAYS_INLINE void add_S(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if (!((rd | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_ADD_reg_T1, rm, rn, rd);
        else
            add_S(rd, rn, rm, ShiftTypeAndAmount());
    }

    ALWAYS_INLINE void ARM_and(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(imm.isEncodedImm());
        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_AND_imm_T1, rn, rd, imm);
    }

    ALWAYS_INLINE void ARM_and(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_AND_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    ALWAYS_INLINE void ARM_and(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if ((rd == rn) && !((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_AND_reg_T1, rm, rd);
        else if ((rd == rm) && !((rd | rn) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_AND_reg_T1, rn, rd);
        else
            ARM_and(rd, rn, rm, ShiftTypeAndAmount());
    }

    ALWAYS_INLINE void asr(RegisterID rd, RegisterID rm, int32_t shiftAmount)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rm));
        ShiftTypeAndAmount shift(SRType_ASR, shiftAmount);
        m_formatter.twoWordOp16FourFours(OP_ASR_imm_T1, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    ALWAYS_INLINE void asr(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_ASR_reg_T2, rn, FourFours(0xf, rd, 0, rm));
    }
    
    // Only allowed in IT (if then) block if last instruction.
    ALWAYS_INLINE AssemblerLabel b()
    {
        m_formatter.twoWordOp16Op16(OP_B_T4a, OP_B_T4b);
        return m_formatter.label();
    }

    // Only allowed in IT (if then) block if last instruction.
    ALWAYS_INLINE AssemblerLabel bl()
    {
        m_formatter.twoWordOp16Op16(OP_BL_T4a, OP_BL_T4b);
        return m_formatter.label();
    }
    
    // Only allowed in IT (if then) block if last instruction.
    ALWAYS_INLINE AssemblerLabel blx(RegisterID rm)
    {
        ASSERT(rm != ARMRegisters::pc);
        m_formatter.oneWordOp8RegReg143(OP_BLX, rm, (RegisterID)8);
        return m_formatter.label();
    }

    // Only allowed in IT (if then) block if last instruction.
    ALWAYS_INLINE AssemblerLabel bx(RegisterID rm)
    {
        m_formatter.oneWordOp8RegReg143(OP_BX, rm, (RegisterID)0);
        return m_formatter.label();
    }

    ALWAYS_INLINE void bic(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(imm.isEncodedImm());
        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_BIC_imm_T1, rn, rd, imm);
    }

    void bkpt(uint8_t imm = 0)
    {
        m_formatter.oneWordOp8Imm8(OP_BKPT, imm);
    }

    void udf(uint8_t imm = 0)
    {
        m_formatter.oneWordOp8Imm8(OP_UDF, imm);
    }

    static bool isBkpt(void* address)
    {
        unsigned short expected = OP_BKPT;
        unsigned short immediateMask = 0xff;
        unsigned short candidateInstruction = *reinterpret_cast<unsigned short*>(address);
        return (candidateInstruction & ~immediateMask) == expected;
    }

    ALWAYS_INLINE void clz(RegisterID rd, RegisterID rm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_CLZ, rm, FourFours(0xf, rd, 8, rm));
    }

    ALWAYS_INLINE void cmn(RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isEncodedImm());

        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_CMN_imm, rn, (RegisterID)0xf, imm);
    }

    ALWAYS_INLINE void cmp(RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isEncodedImm());

        if (!(rn & 8) && imm.isUInt8())
            m_formatter.oneWordOp5Reg3Imm8(OP_CMP_imm_T1, rn, imm.getUInt8());
        else
            m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_CMP_imm_T2, rn, (RegisterID)0xf, imm);
    }

    ALWAYS_INLINE void cmp(RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_CMP_reg_T2, rn, FourFours(shift.hi4(), 0xf, shift.lo4(), rm));
    }

    ALWAYS_INLINE void cmp(RegisterID rn, RegisterID rm)
    {
        if ((rn | rm) & 8)
            cmp(rn, rm, ShiftTypeAndAmount());
        else
            m_formatter.oneWordOp10Reg3Reg3(OP_CMP_reg_T1, rm, rn);
    }

    // xor is not spelled with an 'e'. :-(
    ALWAYS_INLINE void eor(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(imm.isEncodedImm());
        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_EOR_imm_T1, rn, rd, imm);
    }

    // xor is not spelled with an 'e'. :-(
    ALWAYS_INLINE void eor(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_EOR_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    // xor is not spelled with an 'e'. :-(
    void eor(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if ((rd == rn) && !((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_EOR_reg_T1, rm, rd);
        else if ((rd == rm) && !((rd | rn) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_EOR_reg_T1, rn, rd);
        else
            eor(rd, rn, rm, ShiftTypeAndAmount());
    }

    ALWAYS_INLINE void it(Condition cond)
    {
        m_formatter.oneWordOp8Imm8(OP_IT, ifThenElse(cond));
    }

    ALWAYS_INLINE void it(Condition cond, bool inst2if)
    {
        m_formatter.oneWordOp8Imm8(OP_IT, ifThenElse(cond, inst2if));
    }

    ALWAYS_INLINE void it(Condition cond, bool inst2if, bool inst3if)
    {
        m_formatter.oneWordOp8Imm8(OP_IT, ifThenElse(cond, inst2if, inst3if));
    }

    ALWAYS_INLINE void it(Condition cond, bool inst2if, bool inst3if, bool inst4if)
    {
        m_formatter.oneWordOp8Imm8(OP_IT, ifThenElse(cond, inst2if, inst3if, inst4if));
    }

    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void ldr(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(imm.isUInt12());

        if (!((rt | rn) & 8) && imm.isUInt7() && !(imm.getUInt7() % 4)) {
            // We can only use Encoding T1 when imm is a multiple of 4.
            // For details see A8.8.63 on ARM Architecture Reference
            // Manual ARMv7-A and ARMv7-R edition available on
            // https://static.docs.arm.com/ddi0406/cd/DDI0406C_d_armv7ar_arm.pdf
            m_formatter.oneWordOp5Imm5Reg3Reg3(OP_LDR_imm_T1, imm.getUInt7() >> 2, rn, rt);
        } else if ((rn == ARMRegisters::sp) && !(rt & 8) && imm.isUInt10() && !(imm.getUInt10() % 4))
            m_formatter.oneWordOp5Reg3Imm8(OP_LDR_imm_T2, rt, static_cast<uint8_t>(imm.getUInt10() >> 2));
        else
            m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDR_imm_T3, rn, rt, imm.getUInt12());
    }
    
    ALWAYS_INLINE void ldrWide8BitImmediate(RegisterID rt, RegisterID rn, uint8_t immediate)
    {
        ASSERT(rn != ARMRegisters::pc);
        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDR_imm_T3, rn, rt, immediate);
    }

    ALWAYS_INLINE void ldrCompact(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(imm.isUInt7());
        ASSERT(!(imm.getUInt7() % 4));
        ASSERT(!((rt | rn) & 8));
        m_formatter.oneWordOp5Imm5Reg3Reg3(OP_LDR_imm_T1, imm.getUInt7() >> 2, rn, rt);
    }

    // If index is set, this is a regular offset or a pre-indexed load;
    // if index is not set then is is a post-index load.
    //
    // If wback is set rn is updated - this is a pre or post index load,
    // if wback is not set this is a regular offset memory access.
    //
    // (-255 <= offset <= 255)
    // _reg = REG[rn]
    // _tmp = _reg + offset
    // MEM[index ? _tmp : _reg] = REG[rt]
    // if (wback) REG[rn] = _tmp
    ALWAYS_INLINE void ldr(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));
    
        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        ASSERT((offset & ~0xff) == 0);
        
        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);
        
        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDR_imm_T4, rn, rt, offset);
    }

    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void ldr(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);

        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_LDR_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_LDR_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }

    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void ldrh(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(imm.isUInt12());

        if (!((rt | rn) & 8) && imm.isUInt6() && !(imm.getUInt6() & 1))
            m_formatter.oneWordOp5Imm5Reg3Reg3(OP_LDRH_imm_T1, imm.getUInt6() >> 1, rn, rt);
        else
            m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRH_imm_T2, rn, rt, imm.getUInt12());
    }

    // If index is set, this is a regular offset or a pre-indexed load;
    // if index is not set then is is a post-index load.
    //
    // If wback is set rn is updated - this is a pre or post index load,
    // if wback is not set this is a regular offset memory access.
    //
    // (-255 <= offset <= 255)
    // _reg = REG[rn]
    // _tmp = _reg + offset
    // MEM[index ? _tmp : _reg] = REG[rt]
    // if (wback) REG[rn] = _tmp
    ALWAYS_INLINE void ldrh(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));
    
        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        ASSERT((offset & ~0xff) == 0);
        
        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);
        
        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRH_imm_T3, rn, rt, offset);
    }

    ALWAYS_INLINE void ldrh(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(!BadReg(rt));   // Memory hint
        ASSERT(rn != ARMRegisters::pc); // LDRH (literal)
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);

        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_LDRH_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_LDRH_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }

    void ldrb(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(imm.isUInt12());

        if (!((rt | rn) & 8) && imm.isUInt5())
            m_formatter.oneWordOp5Imm5Reg3Reg3(OP_LDRB_imm_T1, imm.getUInt5(), rn, rt);
        else
            m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRB_imm_T2, rn, rt, imm.getUInt12());
    }

    void ldrb(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));

        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }

        ASSERT(!(offset & ~0xff));

        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);

        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRB_imm_T3, rn, rt, offset);
    }

    ALWAYS_INLINE void ldrb(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);

        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_LDRB_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_LDRB_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }

    void ldrsb(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rt != ARMRegisters::sp);
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(imm.isUInt12());

        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRSB_imm_T1, rn, rt, imm.getUInt12());
    }

    void ldrsb(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));

        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        ASSERT(!(offset & ~0xff));

        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);

        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRSB_imm_T2, rn, rt, offset);
    }

    void ldrsb(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);
        
        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_LDRSB_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_LDRSB_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }

    void ldrsh(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rt != ARMRegisters::sp);
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(imm.isUInt12());

        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRSH_imm_T1, rn, rt, imm.getUInt12());
    }

    void ldrsh(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc); // LDR (literal)
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));

        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        ASSERT(!(offset & ~0xff));

        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);

        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDRSH_imm_T2, rn, rt, offset);
    }

    void ldrsh(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);
        
        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_LDRSH_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_LDRSH_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }

    // If index is set, this is a regular offset or a pre-indexed load;
    // if index is not set then it is a post-index load.
    //
    // If wback is set rn is updated - this is a pre or post index load,
    // if wback is not set this is a regular offset memory access.
    //
    // (-1020 <= offset <= 1020)
    // offset % 4 == 0
    // _reg = REG[rn]
    // _tmp = _reg + offset
    // _addr = index ? _tmp : _reg
    // REG[rt] = MEM[_addr]
    // REG[rt2] = MEM[_addr + 4]
    // if (wback) REG[rn] = _tmp
    ALWAYS_INLINE void ldrd(RegisterID rt, RegisterID rt2, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(!BadReg(rt));
        ASSERT(!BadReg(rt2));
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(rt != rt2);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));
        ASSERT(!wback | (rt2 != rn));
        ASSERT(!(offset & 0x3));

        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        offset >>= 2;
        ASSERT(!(offset & ~0xff));

        uint16_t opcode = OP_LDRD_imm_T1;
        opcode |= (wback << 5);
        opcode |= (add << 7);
        opcode |= (index << 8);

        m_formatter.twoWordOp12Reg4Reg4Reg4Imm8(static_cast<OpcodeID1>(opcode), rn, rt, rt2, offset);
    }

    ALWAYS_INLINE void ldrex(RegisterID rt, RegisterID rn, int32_t offset)
    {
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!(offset & ~0x3fc));
        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_LDREX_T1, rn, rt, (0xf << 8 | offset >> 2));
    }

    ALWAYS_INLINE void ldrexb(RegisterID rt, RegisterID rn)
    {
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc);
        m_formatter.twoWordOp12Reg4FourFours(OP_LDREXB_T1, rn, FourFours(rt, 0xf, 0x4, 0xf));
    }

    ALWAYS_INLINE void ldrexh(RegisterID rt, RegisterID rn)
    {
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc);
        m_formatter.twoWordOp12Reg4FourFours(OP_LDREXH_T1, rn, FourFours(rt, 0xf, 0x5, 0xf));
    }

    ALWAYS_INLINE void ldrexd(RegisterID rt, RegisterID rt2, RegisterID rn)
    {
        ASSERT(!BadReg(rt));
        ASSERT(!BadReg(rt2));
        ASSERT(rn != ARMRegisters::pc);
        m_formatter.twoWordOp12Reg4FourFours(OP_LDREXD_T1, rn, FourFours(rt, rt2, 0x7, 0xf));
    }

    void lsl(RegisterID rd, RegisterID rm, int32_t shiftAmount)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rm));
        ShiftTypeAndAmount shift(SRType_LSL, shiftAmount);
        m_formatter.twoWordOp16FourFours(OP_LSL_imm_T1, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    ALWAYS_INLINE void lsl(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_LSL_reg_T2, rn, FourFours(0xf, rd, 0, rm));
    }

    ALWAYS_INLINE void lsr(RegisterID rd, RegisterID rm, int32_t shiftAmount)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rm));
        ShiftTypeAndAmount shift(SRType_LSR, shiftAmount);
        m_formatter.twoWordOp16FourFours(OP_LSR_imm_T1, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    ALWAYS_INLINE void lsr(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_LSR_reg_T2, rn, FourFours(0xf, rd, 0, rm));
    }

    ALWAYS_INLINE void movT3(RegisterID rd, ARMThumbImmediate imm)
    {
        ASSERT(imm.isValid());
        ASSERT(!imm.isEncodedImm());
        ASSERT(!BadReg(rd));
        
        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_MOV_imm_T3, imm.m_value.imm4, rd, imm);
    }
    
#if OS(LINUX)
    static void revertJumpTo_movT3movtcmpT2(void* instructionStart, RegisterID left, RegisterID right, uintptr_t imm)
    {
        uint16_t* address = static_cast<uint16_t*>(instructionStart);
        ARMThumbImmediate lo16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(imm));
        ARMThumbImmediate hi16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(imm >> 16));
        uint16_t instruction[] = {
            twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOV_imm_T3, lo16),
            twoWordOp5i6Imm4Reg4EncodedImmSecond(right, lo16),
            twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOVT, hi16),
            twoWordOp5i6Imm4Reg4EncodedImmSecond(right, hi16),
            static_cast<uint16_t>(static_cast<uint16_t>(OP_CMP_reg_T2) | static_cast<uint16_t>(left))
        };
        performJITMemcpy(address, instruction, sizeof(uint16_t) * 5);
        cacheFlush(address, sizeof(uint16_t) * 5);
    }
#else
    static void revertJumpTo_movT3(void* instructionStart, RegisterID rd, ARMThumbImmediate imm)
    {
        ASSERT(imm.isValid());
        ASSERT(!imm.isEncodedImm());
        ASSERT(!BadReg(rd));
        
        uint16_t* address = static_cast<uint16_t*>(instructionStart);
        uint16_t instruction[] = {
            twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOV_imm_T3, imm),
            twoWordOp5i6Imm4Reg4EncodedImmSecond(rd, imm)
        };
        performJITMemcpy(address, instruction, sizeof(uint16_t) * 2);
        cacheFlush(address, sizeof(uint16_t) * 2);
    }
#endif

    ALWAYS_INLINE void mov(RegisterID rd, ARMThumbImmediate imm)
    {
        ASSERT(imm.isValid());
        ASSERT(!BadReg(rd));
        
        if ((rd < 8) && imm.isUInt8())
            m_formatter.oneWordOp5Reg3Imm8(OP_MOV_imm_T1, rd, imm.getUInt8());
        else if (imm.isEncodedImm())
            m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_MOV_imm_T2, 0xf, rd, imm);
        else
            movT3(rd, imm);
    }

    ALWAYS_INLINE void mov(RegisterID rd, RegisterID rm)
    {
        ASSERT(rd != rm); // Use a NOP instead
        m_formatter.oneWordOp8RegReg143(OP_MOV_reg_T1, rm, rd);
    }

    ALWAYS_INLINE void movt(RegisterID rd, ARMThumbImmediate imm)
    {
        ASSERT(imm.isUInt16());
        ASSERT(!BadReg(rd));
        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_MOVT, imm.m_value.imm4, rd, imm);
    }

    ALWAYS_INLINE void mvn(RegisterID rd, ARMThumbImmediate imm)
    {
        ASSERT(imm.isEncodedImm());
        ASSERT(!BadReg(rd));
        
        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_MVN_imm, 0xf, rd, imm);
    }

    ALWAYS_INLINE void mvn(RegisterID rd, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp16FourFours(OP_MVN_reg_T2, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    ALWAYS_INLINE void mvn(RegisterID rd, RegisterID rm)
    {
        if (!((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_MVN_reg_T1, rm, rd);
        else
            mvn(rd, rm, ShiftTypeAndAmount());
    }

    ALWAYS_INLINE void mrs(RegisterID rd, SPRegisterID specReg)
    {
        ASSERT(specReg == ARMRegisters::apsr);
        ASSERT(!BadReg(rd));
        unsigned short specialRegisterBit = (specReg == ARMRegisters::apsr) ? 0 : (1 << 4);
        OpcodeID1 mrsOp = static_cast<OpcodeID1>(OP_MRS_T1 | specialRegisterBit);
        m_formatter.twoWordOp16FourFours(mrsOp, FourFours(0x8, rd, 0, 0));
    }

    ALWAYS_INLINE void neg(RegisterID rd, RegisterID rm)
    {
        ARMThumbImmediate zero = ARMThumbImmediate::makeUInt12(0);
        sub(rd, zero, rm);
    }

    ALWAYS_INLINE void orr(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(imm.isEncodedImm());
        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_ORR_imm_T1, rn, rd, imm);
    }

    ALWAYS_INLINE void orr(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_ORR_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    void orr(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if ((rd == rn) && !((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_ORR_reg_T1, rm, rd);
        else if ((rd == rm) && !((rd | rn) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_ORR_reg_T1, rn, rd);
        else
            orr(rd, rn, rm, ShiftTypeAndAmount());
    }

    ALWAYS_INLINE void orr_S(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_ORR_S_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    void orr_S(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if ((rd == rn) && !((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_ORR_reg_T1, rm, rd);
        else if ((rd == rm) && !((rd | rn) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_ORR_reg_T1, rn, rd);
        else
            orr_S(rd, rn, rm, ShiftTypeAndAmount());
    }

    ALWAYS_INLINE void rbit(RegisterID rd, RegisterID rm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_RBIT, rm, FourFours(0xf, rd, 0xa, rm));
    }

    ALWAYS_INLINE void ror(RegisterID rd, RegisterID rm, int32_t shiftAmount)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rm));
        ShiftTypeAndAmount shift(SRType_ROR, shiftAmount);
        m_formatter.twoWordOp16FourFours(OP_ROR_imm_T1, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    ALWAYS_INLINE void ror(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_ROR_reg_T2, rn, FourFours(0xf, rd, 0, rm));
    }

    ALWAYS_INLINE void pop(RegisterID dest)
    {
        if (dest < ARMRegisters::r8)
            m_formatter.oneWordOp7Imm9(OP_POP_T1, 1 << dest);
        else {
            // Load postindexed with writeback.
            ldr(dest, ARMRegisters::sp, sizeof(void*), false, true);
        }
    }

    ALWAYS_INLINE void pop(uint32_t registerList)
    {
        ASSERT(WTF::bitCount(registerList) > 1);
        ASSERT(!((1 << ARMRegisters::pc) & registerList) || !((1 << ARMRegisters::lr) & registerList));
        ASSERT(!((1 << ARMRegisters::sp) & registerList));
        m_formatter.twoWordOp16Imm16(OP_POP_T2, registerList);
    }

    ALWAYS_INLINE void push(RegisterID src)
    {
        if (src < ARMRegisters::r8)
            m_formatter.oneWordOp7Imm9(OP_PUSH_T1, 1 << src);
        else if (src == ARMRegisters::lr)
            m_formatter.oneWordOp7Imm9(OP_PUSH_T1, 0x100);
        else {
            // Store preindexed with writeback.
            str(src, ARMRegisters::sp, -sizeof(void*), true, true);
        }
    }

    ALWAYS_INLINE void push(uint32_t registerList)
    {
        ASSERT(WTF::bitCount(registerList) > 1);
        ASSERT(!((1 << ARMRegisters::pc) & registerList));
        ASSERT(!((1 << ARMRegisters::sp) & registerList));
        m_formatter.twoWordOp16Imm16(OP_PUSH_T2, registerList);
    }

    void sbc(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift = ShiftTypeAndAmount { })
    {
        // Rd can only be SP if Rn is also SP.
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_SBC_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

#if HAVE(ARM_IDIV_INSTRUCTIONS)
    template<int datasize>
    ALWAYS_INLINE void sdiv(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        static_assert(datasize == 32, "sdiv datasize must be 32 for armv7s");        
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_SDIV_T1, rn, FourFours(0xf, rd, 0xf, rm));
    }
#endif

    ALWAYS_INLINE void smull(RegisterID rdLo, RegisterID rdHi, RegisterID rn, RegisterID rm)
    {
        ASSERT(!BadReg(rdLo));
        ASSERT(!BadReg(rdHi));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        ASSERT(rdLo != rdHi);
        m_formatter.twoWordOp12Reg4FourFours(OP_SMULL_T1, rn, FourFours(rdLo, rdHi, 0, rm));
    }

    ALWAYS_INLINE void umull(RegisterID rdLo, RegisterID rdHi, RegisterID rn, RegisterID rm)
    {
        ASSERT(!BadReg(rdLo));
        ASSERT(!BadReg(rdHi));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        ASSERT(rdLo != rdHi);
        m_formatter.twoWordOp12Reg4FourFours(OP_UMULL_T1, rn, FourFours(rdLo, rdHi, 0, rm));
    }

    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void str(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isUInt12());

        if (!((rt | rn) & 8) && imm.isUInt7() && !(imm.getUInt7() & 0x3))
            m_formatter.oneWordOp5Imm5Reg3Reg3(OP_STR_imm_T1, imm.getUInt7() >> 2, rn, rt);
        else if ((rn == ARMRegisters::sp) && !(rt & 8) && imm.isUInt10() && !(imm.getUInt10() & 0x3))
            m_formatter.oneWordOp5Reg3Imm8(OP_STR_imm_T2, rt, static_cast<uint8_t>(imm.getUInt10() >> 2));
        else
            m_formatter.twoWordOp12Reg4Reg4Imm12(OP_STR_imm_T3, rn, rt, imm.getUInt12());
    }

    // If index is set, this is a regular offset or a pre-indexed store;
    // if index is not set then is is a post-index store.
    //
    // If wback is set rn is updated - this is a pre or post index store,
    // if wback is not set this is a regular offset memory access.
    //
    // (-255 <= offset <= 255)
    // _reg = REG[rn]
    // _tmp = _reg + offset
    // MEM[index ? _tmp : _reg] = REG[rt]
    // if (wback) REG[rn] = _tmp
    ALWAYS_INLINE void str(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));
    
        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        ASSERT((offset & ~0xff) == 0);
        
        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);
        
        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_STR_imm_T4, rn, rt, offset);
    }

    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void str(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);

        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_STR_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_STR_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }

    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void strb(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isUInt12());

        if (!((rt | rn) & 8) && imm.isUInt5())
            m_formatter.oneWordOp5Imm5Reg3Reg3(OP_STRB_imm_T1, imm.getUInt5(), rn, rt);
        else
            m_formatter.twoWordOp12Reg4Reg4Imm12(OP_STRB_imm_T2, rn, rt, imm.getUInt12());
    }

    // If index is set, this is a regular offset or a pre-indexed store;
    // if index is not set then is is a post-index store.
    //
    // If wback is set rn is updated - this is a pre or post index store,
    // if wback is not set this is a regular offset memory access.
    //
    // (-255 <= offset <= 255)
    // _reg = REG[rn]
    // _tmp = _reg + offset
    // MEM[index ? _tmp : _reg] = REG[rt]
    // if (wback) REG[rn] = _tmp
    ALWAYS_INLINE void strb(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));
    
        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        ASSERT((offset & ~0xff) == 0);
        
        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);
        
        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_STRB_imm_T3, rn, rt, offset);
    }

    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void strb(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);

        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_STRB_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_STRB_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }
    
    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void strh(RegisterID rt, RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isUInt12());
        
        if (!((rt | rn) & 8) && imm.isUInt6() && !(imm.getUInt6() & 0x1))
            m_formatter.oneWordOp5Imm5Reg3Reg3(OP_STRH_imm_T1, imm.getUInt6() >> 1, rn, rt);
        else
            m_formatter.twoWordOp12Reg4Reg4Imm12(OP_STRH_imm_T2, rn, rt, imm.getUInt12());
    }
    
    // If index is set, this is a regular offset or a pre-indexed store;
    // if index is not set then is is a post-index store.
    //
    // If wback is set rn is updated - this is a pre or post index store,
    // if wback is not set this is a regular offset memory access.
    //
    // (-255 <= offset <= 255)
    // _reg = REG[rn]
    // _tmp = _reg + offset
    // MEM[index ? _tmp : _reg] = REG[rt]
    // if (wback) REG[rn] = _tmp
    ALWAYS_INLINE void strh(RegisterID rt, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(rt != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));
        
        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        ASSERT(!(offset & ~0xff));
        
        offset |= (wback << 8);
        offset |= (add   << 9);
        offset |= (index << 10);
        offset |= (1 << 11);
        
        m_formatter.twoWordOp12Reg4Reg4Imm12(OP_STRH_imm_T3, rn, rt, offset);
    }
    
    // rt == ARMRegisters::pc only allowed if last instruction in IT (if then) block.
    ALWAYS_INLINE void strh(RegisterID rt, RegisterID rn, RegisterID rm, unsigned shift = 0)
    {
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        ASSERT(shift <= 3);
        
        if (!shift && !((rt | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_STRH_reg_T1, rm, rn, rt);
        else
            m_formatter.twoWordOp12Reg4FourFours(OP_STRH_reg_T2, rn, FourFours(rt, 0, shift, rm));
    }

    // If index is set, this is a regular offset or a pre-indexed load;
    // if index is not set then it is a post-index load.
    //
    // If wback is set rn is updated - this is a pre or post index load,
    // if wback is not set this is a regular offset memory access.
    //
    // (-1020 <= offset <= 1020)
    // offset % 4 == 0
    // _reg = REG[rn]
    // _tmp = _reg + offset
    // _addr = index ? _tmp : _reg
    // MEM[_addr] = REG[rt]
    // MEM[_addr + 4] = REG[rt2]
    // if (wback) REG[rn] = _tmp
    ALWAYS_INLINE void strd(RegisterID rt, RegisterID rt2, RegisterID rn, int offset, bool index, bool wback)
    {
        ASSERT(!BadReg(rt));
        ASSERT(!BadReg(rt2));
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(index || wback);
        ASSERT(!wback | (rt != rn));
        ASSERT(!wback | (rt2 != rn));
        ASSERT(!(offset & 0x3));

        bool add = true;
        if (offset < 0) {
            add = false;
            offset = -offset;
        }
        offset >>= 2;
        ASSERT(!(offset & ~0xff));

        uint16_t opcode = OP_STRD_imm_T1;
        opcode |= (wback << 5);
        opcode |= (add << 7);
        opcode |= (index << 8);

        m_formatter.twoWordOp12Reg4Reg4Reg4Imm8(static_cast<OpcodeID1>(opcode), rn, rt, rt2, offset);
    }

    ALWAYS_INLINE void strex(RegisterID rd, RegisterID rt, RegisterID rn, int32_t offset)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(rd != rn);
        ASSERT(rd != rt);
        ASSERT(!(offset & ~0x3fc));
        m_formatter.twoWordOp12Reg4Reg4Reg4Imm8(OP_STREX_T1, rn, rt, rd, offset >> 2);
    }

    ALWAYS_INLINE void strexb(RegisterID rd, RegisterID rt, RegisterID rn)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(rd != rn);
        ASSERT(rd != rt);
        m_formatter.twoWordOp12Reg4FourFours(OP_STREXB_T1, rn, FourFours(rt, 0xf, 0x4, rd));
    }

    ALWAYS_INLINE void strexh(RegisterID rd, RegisterID rt, RegisterID rn)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rt));
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(rd != rn);
        ASSERT(rd != rt);
        m_formatter.twoWordOp12Reg4FourFours(OP_STREXH_T1, rn, FourFours(rt, 0xf, 0x5, rd));
    }

    ALWAYS_INLINE void strexd(RegisterID rd, RegisterID rt, RegisterID rt2, RegisterID rn)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rt));
        ASSERT(!BadReg(rt2));
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(rd != rn);
        ASSERT(rd != rt);
        ASSERT(rd != rt2);
        m_formatter.twoWordOp12Reg4FourFours(OP_STREXD_T1, rn, FourFours(rt, rt2, 0x7, rd));
    }

    ALWAYS_INLINE void sub(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        // Rd can only be SP if Rn is also SP.
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isValid());

        if ((rn == ARMRegisters::sp) && (rd == ARMRegisters::sp) && imm.isUInt9()) {
            ASSERT(!(imm.getUInt16() & 3));
            m_formatter.oneWordOp9Imm7(OP_SUB_SP_imm_T1, static_cast<uint8_t>(imm.getUInt9() >> 2));
            return;
        } else if (!((rd | rn) & 8)) {
            if (imm.isUInt3()) {
                m_formatter.oneWordOp7Reg3Reg3Reg3(OP_SUB_imm_T1, (RegisterID)imm.getUInt3(), rn, rd);
                return;
            } else if ((rd == rn) && imm.isUInt8()) {
                m_formatter.oneWordOp5Reg3Imm8(OP_SUB_imm_T2, rd, imm.getUInt8());
                return;
            }
        }

        if (imm.isEncodedImm())
            m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_SUB_imm_T3, rn, rd, imm);
        else {
            ASSERT(imm.isUInt12());
            m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_SUB_imm_T4, rn, rd, imm);
        }
    }

    ALWAYS_INLINE void sub(RegisterID rd, ARMThumbImmediate imm, RegisterID rn)
    {
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isValid());
        ASSERT(imm.isUInt12());

        if (!((rd | rn) & 8) && !imm.getUInt12())
            m_formatter.oneWordOp10Reg3Reg3(OP_RSB_imm_T1, rn, rd);
        else
            m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_RSB_imm_T2, rn, rd, imm);
    }

    ALWAYS_INLINE void sub(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_SUB_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    // NOTE: In an IT block, add doesn't modify the flags register.
    ALWAYS_INLINE void sub(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if (!((rd | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_SUB_reg_T1, rm, rn, rd);
        else
            sub(rd, rn, rm, ShiftTypeAndAmount());
    }

    // Not allowed in an IT (if then) block.
    void sub_S(RegisterID rd, RegisterID rn, ARMThumbImmediate imm)
    {
        // Rd can only be SP if Rn is also SP.
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isValid());

        if ((rn == ARMRegisters::sp) && (rd == ARMRegisters::sp) && imm.isUInt9()) {
            ASSERT(!(imm.getUInt16() & 3));
            m_formatter.oneWordOp9Imm7(OP_SUB_SP_imm_T1, static_cast<uint8_t>(imm.getUInt9() >> 2));
            return;
        } else if (!((rd | rn) & 8)) {
            if (imm.isUInt3()) {
                m_formatter.oneWordOp7Reg3Reg3Reg3(OP_SUB_imm_T1, (RegisterID)imm.getUInt3(), rn, rd);
                return;
            } else if ((rd == rn) && imm.isUInt8()) {
                m_formatter.oneWordOp5Reg3Imm8(OP_SUB_imm_T2, rd, imm.getUInt8());
                return;
            }
        }

        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_SUB_S_imm_T3, rn, rd, imm);
    }

    ALWAYS_INLINE void sub_S(RegisterID rd, ARMThumbImmediate imm, RegisterID rn)
    {
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(imm.isValid());
        ASSERT(imm.isUInt12());

        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_RSB_S_imm_T2, rn, rd, imm);
    }

    // Not allowed in an IT (if then) block?
    ALWAYS_INLINE void sub_S(RegisterID rd, RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT((rd != ARMRegisters::sp) || (rn == ARMRegisters::sp));
        ASSERT(rd != ARMRegisters::pc);
        ASSERT(rn != ARMRegisters::pc);
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_SUB_S_reg_T2, rn, FourFours(shift.hi4(), rd, shift.lo4(), rm));
    }

    // Not allowed in an IT (if then) block.
    ALWAYS_INLINE void sub_S(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        if (!((rd | rn | rm) & 8))
            m_formatter.oneWordOp7Reg3Reg3Reg3(OP_SUB_reg_T1, rm, rn, rd);
        else
            sub_S(rd, rn, rm, ShiftTypeAndAmount());
    }

    ALWAYS_INLINE void sxtb(RegisterID rd, RegisterID rm)
    {
        if (!((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_SXTB_T1, rm, rd);
        else
            m_formatter.twoWordOp16FourFours(OP_SXTB_T2, FourFours(0xf, rd, 0x8, rm));
    }

    ALWAYS_INLINE void sxth(RegisterID rd, RegisterID rm)
    {
        if (!((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_SXTH_T1, rm, rd);
        else
            m_formatter.twoWordOp16FourFours(OP_SXTH_T2, FourFours(0xf, rd, 0x8, rm));
    }

    ALWAYS_INLINE void tst(RegisterID rn, ARMThumbImmediate imm)
    {
        ASSERT(!BadReg(rn));
        ASSERT(imm.isEncodedImm());

        m_formatter.twoWordOp5i6Imm4Reg4EncodedImm(OP_TST_imm, rn, (RegisterID)0xf, imm);
    }

    ALWAYS_INLINE void tst(RegisterID rn, RegisterID rm, ShiftTypeAndAmount shift)
    {
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_TST_reg_T2, rn, FourFours(shift.hi4(), 0xf, shift.lo4(), rm));
    }

    ALWAYS_INLINE void tst(RegisterID rn, RegisterID rm)
    {
        if ((rn | rm) & 8)
            tst(rn, rm, ShiftTypeAndAmount());
        else
            m_formatter.oneWordOp10Reg3Reg3(OP_TST_reg_T1, rm, rn);
    }

    ALWAYS_INLINE void ubfx(RegisterID rd, RegisterID rn, unsigned lsb, unsigned width)
    {
        ASSERT(lsb < 32);
        ASSERT((width >= 1) && (width <= 32));
        ASSERT((lsb + width) <= 32);
        m_formatter.twoWordOp12Reg40Imm3Reg4Imm20Imm5(OP_UBFX_T1, rd, rn, (lsb & 0x1c) << 10, (lsb & 0x3) << 6, (width - 1) & 0x1f);
    }

#if HAVE(ARM_IDIV_INSTRUCTIONS)
    ALWAYS_INLINE void udiv(RegisterID rd, RegisterID rn, RegisterID rm)
    {
        ASSERT(!BadReg(rd));
        ASSERT(!BadReg(rn));
        ASSERT(!BadReg(rm));
        m_formatter.twoWordOp12Reg4FourFours(OP_UDIV_T1, rn, FourFours(0xf, rd, 0xf, rm));
    }
#endif

    ALWAYS_INLINE void uxtb(RegisterID rd, RegisterID rm)
    {
        if (!((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_UXTB_T1, rm, rd);
        else
            m_formatter.twoWordOp16FourFours(OP_UXTB_T2, FourFours(0xf, rd, 0x8, rm));
    }

    ALWAYS_INLINE void uxth(RegisterID rd, RegisterID rm)
    {
        if (!((rd | rm) & 8))
            m_formatter.oneWordOp10Reg3Reg3(OP_UXTH_T1, rm, rd);
        else
            m_formatter.twoWordOp16FourFours(OP_UXTH_T2, FourFours(0xf, rd, 0x8, rm));
    }

    void vldmia(RegisterID rn, FPDoubleRegisterID rs, uint32_t count)
    {
        ASSERT(count < 16);
        m_formatter.vfpMemOp(OP_VLDMIA, OP_VLDMIAb, true, rn, rs, count << 3);
    }

    void vstmia(RegisterID rn, FPDoubleRegisterID rs, uint32_t count)
    {
        ASSERT(count < 16);
        m_formatter.vfpMemOp(OP_VSTMIA, OP_VSTMIAb, true, rn, rs, count << 3);
    }

    void vand(FPDoubleRegisterID rd, FPDoubleRegisterID rn, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VAND_T1, OP_VAND_T1b, true, rn, rd, rm);
    }

    void vorr(FPDoubleRegisterID rd, FPDoubleRegisterID rn, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VORR_T1, OP_VORR_T1b, true, rn, rd, rm);
    }

    void vadd(FPSingleRegisterID rd, FPSingleRegisterID rn, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VADD_T2, OP_VADD_T2b, false, rn, rd, rm);
    }

    void vadd(FPDoubleRegisterID rd, FPDoubleRegisterID rn, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VADD_T2, OP_VADD_T2b, true, rn, rd, rm);
    }

    void vcmp(FPSingleRegisterID rd, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VCMP, OP_VCMPb, false, VFPOperand(4), rd, rm);
    }

    void vcmp(FPDoubleRegisterID rd, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VCMP, OP_VCMPb, true, VFPOperand(4), rd, rm);
    }

    void vcmpz(FPDoubleRegisterID rd)
    {
        m_formatter.vfpOp(OP_VCMP, OP_VCMPb, true, VFPOperand(5), rd, VFPOperand(0));
    }

    void vcvt_signedToFloatingPoint(FPDoubleRegisterID rd, FPSingleRegisterID rm, bool toDouble = true)
    {
        // boolean values are 64bit (toInt, unsigned, roundZero)
        m_formatter.vfpOp(OP_VCVT_FPIVFP, OP_VCVT_FPIVFPb, toDouble, vcvtOp(false, false, false), rd, rm);
    }

    void vcvt_unsignedToFloatingPoint(FPDoubleRegisterID rd, FPSingleRegisterID rm, bool toDouble = true)
    {
        // boolean values are 64bit (toInt, unsigned, roundZero)
        m_formatter.vfpOp(OP_VCVT_FPIVFP, OP_VCVT_FPIVFPb, toDouble, vcvtOp(false, true, false), rd, rm);
    }

    void vcvt_floatingPointToSigned(FPSingleRegisterID rd, FPDoubleRegisterID rm)
    {
        // boolean values are 64bit (toInt, unsigned, roundZero)
        m_formatter.vfpOp(OP_VCVT_FPIVFP, OP_VCVT_FPIVFPb, true, vcvtOp(true, false, true), rd, rm);
    }

    void vcvt_floatingPointToSignedNearest(FPSingleRegisterID rd, FPDoubleRegisterID rm)
    {
        // boolean values are 64bit (toInt, unsigned, roundZero)
        m_formatter.vfpOp(OP_VCVT_FPIVFP, OP_VCVT_FPIVFPb, true, vcvtOp(true, false, false), rd, rm);
    }
    
    void vcvt_floatingPointToUnsigned(FPSingleRegisterID rd, FPDoubleRegisterID rm)
    {
        // boolean values are 64bit (toInt, unsigned, roundZero)
        m_formatter.vfpOp(OP_VCVT_FPIVFP, OP_VCVT_FPIVFPb, true, vcvtOp(true, true, true), rd, rm);
    }

    void vcvt_floatingPointToSigned(FPSingleRegisterID rd, FPSingleRegisterID rm)
    {
        // boolean values are 64bit (toInt, unsigned, roundZero)
        m_formatter.vfpOp(OP_VCVT_FPIVFP, OP_VCVT_FPIVFPb, false, vcvtOp(true, false, true), rd, rm);
    }

    void vcvt_floatingPointToUnsigned(FPSingleRegisterID rd, FPSingleRegisterID rm)
    {
        // boolean values are 64bit (toInt, unsigned, roundZero)
        m_formatter.vfpOp(OP_VCVT_FPIVFP, OP_VCVT_FPIVFPb, false, vcvtOp(true, true, true), rd, rm);
    }

    void vdiv(FPSingleRegisterID rd, FPSingleRegisterID rn, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VDIV, OP_VDIVb, false, rn, rd, rm);
    }

    void vdiv(FPDoubleRegisterID rd, FPDoubleRegisterID rn, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VDIV, OP_VDIVb, true, rn, rd, rm);
    }

    void vldr(FPDoubleRegisterID rd, RegisterID rn, int32_t imm)
    {
        m_formatter.vfpMemOp(OP_VLDR, OP_VLDRb, true, rn, rd, imm);
    }
    
    void flds(FPSingleRegisterID rd, RegisterID rn, int32_t imm)
    {
        m_formatter.vfpMemOp(OP_FLDS, OP_FLDSb, false, rn, rd, imm);
    }

    void vmov(RegisterID rd, FPSingleRegisterID rn)
    {
        ASSERT(!BadReg(rd));
        m_formatter.vfpOp(OP_VMOV_StoC, OP_VMOV_StoCb, false, rn, rd, VFPOperand(0));
    }

    void vmov(FPSingleRegisterID rd, RegisterID rn)
    {
        ASSERT(!BadReg(rn));
        m_formatter.vfpOp(OP_VMOV_CtoS, OP_VMOV_CtoSb, false, rd, rn, VFPOperand(0));
    }

    void vmov(RegisterID rd1, RegisterID rd2, FPDoubleRegisterID rn)
    {
        ASSERT(!BadReg(rd1));
        ASSERT(!BadReg(rd2));
        m_formatter.vfpOp(OP_VMOV_DtoC, OP_VMOV_DtoCb, true, rd2, VFPOperand(rd1 | 16), rn);
    }

    void vmov(FPDoubleRegisterID rd, RegisterID rn1, RegisterID rn2)
    {
        ASSERT(!BadReg(rn1));
        ASSERT(!BadReg(rn2));
        m_formatter.vfpOp(OP_VMOV_CtoD, OP_VMOV_CtoDb, true, rn2, VFPOperand(rn1 | 16), rd);
    }

    void vmov(FPDoubleRegisterID rd, FPDoubleRegisterID rn)
    {
        m_formatter.vfpOp(OP_VMOV_T2, OP_VMOV_T2b, true, VFPOperand(0), rd, rn);
    }

    void vmrs(RegisterID reg = ARMRegisters::pc)
    {
        ASSERT(reg != ARMRegisters::sp);
        m_formatter.vfpOp(OP_VMRS, OP_VMRSb, false, VFPOperand(1), VFPOperand(0x10 | reg), VFPOperand(0));
    }

    void vmul(FPSingleRegisterID rd, FPSingleRegisterID rn, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VMUL_T2, OP_VMUL_T2b, false, rn, rd, rm);
    }

    void vmul(FPDoubleRegisterID rd, FPDoubleRegisterID rn, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VMUL_T2, OP_VMUL_T2b, true, rn, rd, rm);
    }

    void vstr(FPDoubleRegisterID rd, RegisterID rn, int32_t imm)
    {
        m_formatter.vfpMemOp(OP_VSTR, OP_VSTRb, true, rn, rd, imm);
    }

    void fsts(FPSingleRegisterID rd, RegisterID rn, int32_t imm)
    {
        m_formatter.vfpMemOp(OP_FSTS, OP_FSTSb, false, rn, rd, imm);
    }

    void vsub(FPSingleRegisterID rd, FPSingleRegisterID rn, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VSUB_T2, OP_VSUB_T2b, false, rn, rd, rm);
    }

    void vsub(FPDoubleRegisterID rd, FPDoubleRegisterID rn, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VSUB_T2, OP_VSUB_T2b, true, rn, rd, rm);
    }

    void vabs(FPSingleRegisterID rd, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VABS_T2, OP_VABS_T2b, false, VFPOperand(16), rd, rm);
    }

    void vabs(FPDoubleRegisterID rd, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VABS_T2, OP_VABS_T2b, true, VFPOperand(16), rd, rm);
    }

    void vneg(FPSingleRegisterID rd, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VNEG_T2, OP_VNEG_T2b, false, VFPOperand(1), rd, rm);
    }

    void vneg(FPDoubleRegisterID rd, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VNEG_T2, OP_VNEG_T2b, true, VFPOperand(1), rd, rm);
    }

    void vsqrt(FPSingleRegisterID rd, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VSQRT_T1, OP_VSQRT_T1b, false, VFPOperand(17), rd, rm);
    }

    void vsqrt(FPDoubleRegisterID rd, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VSQRT_T1, OP_VSQRT_T1b, true, VFPOperand(17), rd, rm);
    }
    
    void vcvtds(FPDoubleRegisterID rd, FPSingleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VCVTDS_T1, OP_VCVTDS_T1b, false, VFPOperand(23), rd, rm);
    }

    void vcvtsd(FPSingleRegisterID rd, FPDoubleRegisterID rm)
    {
        m_formatter.vfpOp(OP_VCVTSD_T1, OP_VCVTSD_T1b, true, VFPOperand(23), rd, rm);
    }

    void nop()
    {
        m_formatter.oneWordOp8Imm8(OP_NOP_T1, 0);
    }

    void nopw()
    {
        m_formatter.twoWordOp16Op16(OP_NOP_T2a, OP_NOP_T2b);
    }
    
    static constexpr int16_t nopPseudo16()
    {
        return OP_NOP_T1;
    }

    static constexpr int32_t nopPseudo32()
    {
        return OP_NOP_T2a | (OP_NOP_T2b << 16);
    }

    template<MachineCodeCopyMode copy>
    ALWAYS_INLINE static void fillNops(void* base, size_t size)
    {
        RELEASE_ASSERT(!(size % sizeof(int16_t)));

        char* ptr = static_cast<char*>(base);
        const size_t num32s = size / sizeof(int32_t);
        for (size_t i = 0; i < num32s; i++) {
            const int32_t insn = nopPseudo32();
            machineCodeCopy<copy>(ptr, &insn, sizeof(int32_t));
            ptr += sizeof(int32_t);
        }

        const size_t num16s = (size % sizeof(int32_t)) / sizeof(int16_t);
        ASSERT(num16s == 0 || num16s == 1);
        ASSERT(num16s * sizeof(int16_t) + num32s * sizeof(int32_t) == size);
        if (num16s) {
            const int16_t insn = nopPseudo16();
            machineCodeCopy<copy>(ptr, &insn, sizeof(int16_t));
        }
    }

    template<MachineCodeCopyMode copy>
    ALWAYS_INLINE static void fillNearTailCall(void* from, void* to)
    {
        uint16_t* ptr = reinterpret_cast<uint16_t*>(from) + 2;
        linkJumpT4<copy>(ptr, ptr, to, BranchWithLink::No);
        cacheFlush(from, sizeof(uint16_t) * 2);
    }

    void dmbSY()
    {
        m_formatter.twoWordOp16Op16(OP_DMB_T1a, OP_DMB_SY_T1b);
    }

    void dmbISHST()
    {
        m_formatter.twoWordOp16Op16(OP_DMB_T1a, OP_DMB_ISHST_T1b);
    }

    void dmbISH()
    {
        m_formatter.twoWordOp16Op16(OP_DMB_T1a, OP_DMB_ISH_T1b);
    }

    AssemblerLabel labelIgnoringWatchpoints()
    {
        return m_formatter.label();
    }

    AssemblerLabel labelForWatchpoint()
    {
        AssemblerLabel result = m_formatter.label();
        if (static_cast<int>(result.offset()) != m_indexOfLastWatchpoint)
            result = label();
        m_indexOfLastWatchpoint = result.offset();
        m_indexOfTailOfLastWatchpoint = result.offset() + maxJumpReplacementSize();
        return result;
    }

    AssemblerLabel label()
    {
        AssemblerLabel result = m_formatter.label();
        while (UNLIKELY(static_cast<int>(result.offset()) < m_indexOfTailOfLastWatchpoint)) {
            if (UNLIKELY(static_cast<int>(result.offset()) + 4 <= m_indexOfTailOfLastWatchpoint))
                nopw();
            else
                nop();
            result = m_formatter.label();
        }
        return result;
    }
    
    AssemblerLabel align(int alignment)
    {
        while (!m_formatter.isAligned(alignment))
            bkpt();

        return label();
    }

    AssemblerLabel alignWithNop(int alignment)
    {
        while (!m_formatter.isAligned(alignment))
            nop();

        return label();
    }
    
    static void* getRelocatedAddress(void* code, AssemblerLabel label)
    {
        ASSERT(label.isSet());
        return reinterpret_cast<void*>(reinterpret_cast<ptrdiff_t>(code) + label.offset());
    }
    
    static int getDifferenceBetweenLabels(AssemblerLabel a, AssemblerLabel b)
    {
        return b.offset() - a.offset();
    }

    static int jumpSizeDelta(JumpType jumpType, JumpLinkType jumpLinkType) { return JUMP_ENUM_SIZE(jumpType) - JUMP_ENUM_SIZE(jumpLinkType); }
    
    // Assembler admin methods:

    static bool canCompact(JumpType jumpType)
    {
        // The following cannot be compacted:
        //   JumpFixed: represents custom jump sequence
        //   JumpNoConditionFixedSize: represents unconditional jump that must remain a fixed size
        //   JumpConditionFixedSize: represents conditional jump that must remain a fixed size
        return (jumpType == JumpNoCondition) || (jumpType == JumpCondition);
    }
    
    static JumpLinkType computeJumpType(JumpType jumpType, const uint8_t* from, const uint8_t* to)
    {
        if (jumpType == JumpFixed)
            return LinkInvalid;
        
        // for patchable jump we must leave space for the longest code sequence
        if (jumpType == JumpNoConditionFixedSize)
            return LinkBX;
        if (jumpType == JumpConditionFixedSize)
            return LinkConditionalBX;
        
        const int paddingSize = JUMP_ENUM_SIZE(jumpType);
        
        if (jumpType == JumpCondition) {
            // 2-byte conditional T1
            const uint16_t* jumpT1Location = reinterpret_cast_ptr<const uint16_t*>(from - (paddingSize - JUMP_ENUM_SIZE(LinkJumpT1)));
            if (canBeJumpT1(jumpT1Location, to))
                return LinkJumpT1;
            // 4-byte conditional T3
            const uint16_t* jumpT3Location = reinterpret_cast_ptr<const uint16_t*>(from - (paddingSize - JUMP_ENUM_SIZE(LinkJumpT3)));
            if (canBeJumpT3(jumpT3Location, to))
                return LinkJumpT3;
            // 4-byte conditional T4 with IT
            const uint16_t* conditionalJumpT4Location = 
            reinterpret_cast_ptr<const uint16_t*>(from - (paddingSize - JUMP_ENUM_SIZE(LinkConditionalJumpT4)));
            if (canBeJumpT4(conditionalJumpT4Location, to))
                return LinkConditionalJumpT4;
        } else {
            // 2-byte unconditional T2
            const uint16_t* jumpT2Location = reinterpret_cast_ptr<const uint16_t*>(from - (paddingSize - JUMP_ENUM_SIZE(LinkJumpT2)));
            if (canBeJumpT2(jumpT2Location, to))
                return LinkJumpT2;
            // 4-byte unconditional T4
            const uint16_t* jumpT4Location = reinterpret_cast_ptr<const uint16_t*>(from - (paddingSize - JUMP_ENUM_SIZE(LinkJumpT4)));
            if (canBeJumpT4(jumpT4Location, to))
                return LinkJumpT4;
            // use long jump sequence
            return LinkBX;
        }
        
        ASSERT(jumpType == JumpCondition);
        return LinkConditionalBX;
    }
    
    static JumpLinkType computeJumpType(LinkRecord& record, const uint8_t* from, const uint8_t* to)
    {
        JumpLinkType linkType = computeJumpType(record.type(), from, to);
        record.setLinkType(linkType);
        return linkType;
    }
    
    Vector<LinkRecord, 0, UnsafeVectorOverflow>& jumpsToLink()
    {
        std::sort(m_jumpsToLink.begin(), m_jumpsToLink.end(), [](auto& a, auto& b) {
            return a.from() < b.from();
        });
        return m_jumpsToLink;
    }

    template<MachineCodeCopyMode copy>
    static void ALWAYS_INLINE link(LinkRecord& record, uint8_t* from, const uint8_t* fromInstruction8, uint8_t* to)
    {
        const uint16_t* fromInstruction = reinterpret_cast_ptr<const uint16_t*>(fromInstruction8);
        switch (record.linkType()) {
        case LinkJumpT1:
            linkJumpT1<copy>(record.condition(), reinterpret_cast_ptr<uint16_t*>(from), fromInstruction, to);
            break;
        case LinkJumpT2:
            linkJumpT2<copy>(reinterpret_cast_ptr<uint16_t*>(from), fromInstruction, to);
            break;
        case LinkJumpT3:
            linkJumpT3<copy>(record.condition(), reinterpret_cast_ptr<uint16_t*>(from), fromInstruction, to);
            break;
        case LinkJumpT4:
            linkJumpT4<copy>(reinterpret_cast_ptr<uint16_t*>(from), fromInstruction, to, BranchWithLink::No);
            break;
        case LinkConditionalJumpT4:
            linkConditionalJumpT4<copy>(record.condition(), reinterpret_cast_ptr<uint16_t*>(from), fromInstruction, to);
            break;
        case LinkConditionalBX:
            linkConditionalBX<copy>(record.condition(), reinterpret_cast_ptr<uint16_t*>(from), fromInstruction, to);
            break;
        case LinkBX:
            linkBX<copy>(reinterpret_cast_ptr<uint16_t*>(from), fromInstruction, to);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            break;
        }
    }

    size_t codeSize() const { return m_formatter.codeSize(); }

    static unsigned getCallReturnOffset(AssemblerLabel call)
    {
        ASSERT(call.isSet());
        return call.offset();
    }

    // Linking & patching:
    //
    // 'link' and 'patch' methods are for use on unprotected code - such as the code
    // within the AssemblerBuffer, and code being patched by the patch buffer.  Once
    // code has been finalized it is (platform support permitting) within a non-
    // writable region of memory; to modify the code in an execute-only execuable
    // pool the 'repatch' and 'relink' methods should be used.

    void linkJump(AssemblerLabel from, AssemblerLabel to, JumpType type, Condition condition)
    {
        ASSERT(to.isSet());
        ASSERT(from.isSet());
        m_jumpsToLink.append(LinkRecord(from.offset(), to.offset(), type, condition));
    }

    static void linkJump(void* code, AssemblerLabel from, void* to)
    {
        ASSERT(from.isSet());
        
        uint16_t* location = reinterpret_cast<uint16_t*>(reinterpret_cast<intptr_t>(code) + from.offset());
        linkJumpAbsolute(location, location, to);
    }

    static void linkTailCall(void* code, AssemblerLabel from, void* to)
    {
        ASSERT(from.isSet());

        uint16_t* location = reinterpret_cast<uint16_t*>(reinterpret_cast<intptr_t>(code) + from.offset());
        linkBranch(location, location, makeEven(to), BranchWithLink::No);
    }

    static void linkCall(void* code, AssemblerLabel from, void* to)
    {
        ASSERT(from.isSet());

        uint16_t* location = reinterpret_cast<uint16_t*>(reinterpret_cast<intptr_t>(code) + from.offset());
        linkBranch(location, location, makeEven(to), BranchWithLink::Yes);
    }

    static void linkPointer(void* code, AssemblerLabel where, void* value)
    {
        setPointer(reinterpret_cast<char*>(code) + where.offset(), value, false);
    }

    // The static relink and replace methods can use can use |from| for both
    // the write and executable address for call and jump patching
    // as they're modifying existing (linked) code, so the address being
    // provided is correct for relative address computation.
    static void relinkJump(void* from, void* to)
    {
        ASSERT(!(reinterpret_cast<intptr_t>(from) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(to) & 1));

        linkJumpAbsolute(reinterpret_cast<uint16_t*>(from), reinterpret_cast<uint16_t*>(from), to);

        cacheFlush(reinterpret_cast<uint16_t*>(from) - 5, 5 * sizeof(uint16_t));
    }

    static void relinkCall(void* from, void* to)
    {
        ASSERT(isEven(from));

        uint16_t* location = reinterpret_cast<uint16_t*>(from);
        if (isBL(location - 2)) {
            linkBranch(location, location, makeEven(to), BranchWithLink::Yes);
            cacheFlush(location - 2, 2 * sizeof(uint16_t));
            return;
        }

        setPointer(location - 1, to, true);
    }

    static void relinkTailCall(void* from, void* to)
    {
        ASSERT(isEven(from));

        uint16_t* location = reinterpret_cast<uint16_t*>(from);
        linkBranch(location, location, to, BranchWithLink::No);
        cacheFlush(location - 2, 2 * sizeof(uint16_t));
    }

#if ENABLE(JUMP_ISLANDS)
    static void* prepareForAtomicRelinkJumpConcurrently(void* from, void* to)
    {
        ASSERT(isEven(from));
        ASSERT(isEven(to));

        intptr_t offset = std::bit_cast<intptr_t>(to) - std::bit_cast<intptr_t>(from);
        ASSERT(static_cast<int>(offset) == offset);

        if (isInt<25>(offset))
            return to;

        return ExecutableAllocator::singleton().getJumpIslandToConcurrently(from, to);
    }

    static void* prepareForAtomicRelinkCallConcurrently(void* from, void* to)
    {
        ASSERT(isEven(from));

        return prepareForAtomicRelinkJumpConcurrently(from, makeEven(to));
    }
#endif

    static void* readCallTarget(void* from)
    {
        return readPointer(reinterpret_cast<uint16_t*>(from) - 1);
    }

    static void repatchPointer(void* where, void* value)
    {
        ASSERT(!(reinterpret_cast<intptr_t>(where) & 1));
        
        setPointer(where, value, true);
    }

    static void* readPointer(void* where)
    {
        return reinterpret_cast<void*>(readInt32(where));
    }

    static void replaceWithJump(void* instructionStart, void* to)
    {
        ASSERT(!(std::bit_cast<uintptr_t>(instructionStart) & 1));
        ASSERT(!(std::bit_cast<uintptr_t>(to) & 1));

#if OS(LINUX)
        if (canBeJumpT4(reinterpret_cast<uint16_t*>(instructionStart), to)) {
            uint16_t* ptr = reinterpret_cast<uint16_t*>(instructionStart) + 2;
            linkJumpT4(ptr, ptr, to, BranchWithLink::No);
            cacheFlush(ptr - 2, sizeof(uint16_t) * 2);
        } else {
            uint16_t* ptr = reinterpret_cast<uint16_t*>(instructionStart) + 5;
            linkBX(ptr, ptr, to);
            cacheFlush(ptr - 5, sizeof(uint16_t) * 5);
        }
#else
        uint16_t* ptr = reinterpret_cast<uint16_t*>(instructionStart) + 2;
        linkJumpT4(ptr, ptr, to, BranchWithLink::No);
        cacheFlush(ptr - 2, sizeof(uint16_t) * 2);
#endif
    }

    static void replaceWithNops(void* instructionStart, size_t memoryToFillWithNopsInBytes)
    {
        fillNops<MachineCodeCopyMode::JITMemcpy>(instructionStart, memoryToFillWithNopsInBytes);
        cacheFlush(instructionStart, memoryToFillWithNopsInBytes);
    }

    static constexpr ptrdiff_t maxJumpReplacementSize()
    {
#if OS(LINUX)
        return 10;
#else
        return 4;
#endif
    }

    static constexpr ptrdiff_t patchableJumpSize()
    {
        return 10;
    }

    unsigned debugOffset() { return m_formatter.debugOffset(); }

#if OS(LINUX)
    static inline void linuxPageFlush(uintptr_t begin, uintptr_t end)
    {
        asm volatile(
            "push    {r7}\n"
            "mov     r0, %0\n"
            "mov     r1, %1\n"
            "movw    r7, #0x2\n"
            "movt    r7, #0xf\n"
            "movs    r2, #0x0\n"
            "svc     0x0\n"
            "pop     {r7}\n"
            :
            : "r" (begin), "r" (end)
            : "r0", "r1", "r2");
    }
#endif

    static void cacheFlush(void* code, size_t size)
    {
#if OS(DARWIN)
        sys_icache_invalidate(code, size);
#elif OS(LINUX)
        size_t page = pageSize();
        uintptr_t current = reinterpret_cast<uintptr_t>(code);
        uintptr_t end = current + size;
        uintptr_t firstPageEnd = (current & ~(page - 1)) + page;

        if (end <= firstPageEnd) {
            linuxPageFlush(current, end);
            return;
        }

        linuxPageFlush(current, firstPageEnd);

        for (current = firstPageEnd; current + page < end; current += page)
            linuxPageFlush(current, current + page);

        linuxPageFlush(current, end);
#else
#error "The cacheFlush support is missing on this platform."
#endif
    }

    static ALWAYS_INLINE bool canEmitJump(void* from, void* to)
    {
        // 'from' holds the address of the branch instruction. The branch range however is relative
        // to the architectural value of the PC which is 4 larger than the address of the branch.
        intptr_t offset = std::bit_cast<intptr_t>(to) - (std::bit_cast<intptr_t>(from) + 4);
        return isInt<25>(offset);
    }

private:
    // VFP operations commonly take one or more 5-bit operands, typically representing a
    // floating point register number. This will commonly be encoded in the instruction
    // in two parts, with one single bit field, and one 4-bit field. In the case of
    // double precision operands the high bit of the register number will be encoded
    // separately, and for single precision operands the high bit of the register number
    // will be encoded individually.
    // VFPOperand encapsulates a 5-bit VFP operand, with bits 0..3 containing the 4-bit
    // field to be encoded together in the instruction (the low 4-bits of a double
    // register number, or the high 4-bits of a single register number), and bit 4
    // contains the bit value to be encoded individually.
    struct VFPOperand {
        explicit VFPOperand(uint32_t value)
            : m_value(value)
        {
            ASSERT(!(m_value & ~0x1f));
        }

        VFPOperand(FPDoubleRegisterID reg)
            : m_value(reg)
        {
        }

        VFPOperand(RegisterID reg)
            : m_value(reg)
        {
        }

        VFPOperand(FPSingleRegisterID reg)
            : m_value(((reg & 1) << 4) | (reg >> 1)) // rotate the lowest bit of 'reg' to the top.
        {
        }

        uint32_t bits1()
        {
            return m_value >> 4;
        }

        uint32_t bits4()
        {
            return m_value & 0xf;
        }

        uint32_t m_value;
    };

    VFPOperand vcvtOp(bool toInteger, bool isUnsigned, bool isRoundZero)
    {
        // Cannot specify rounding when converting to float.
        ASSERT(toInteger || !isRoundZero);

        uint32_t op = 0x8;
        if (toInteger) {
            // opc2 indicates both toInteger & isUnsigned.
            op |= isUnsigned ? 0x4 : 0x5;
            // 'op' field in instruction is isRoundZero
            if (isRoundZero)
                op |= 0x10;
        } else {
            ASSERT(!isRoundZero);
            // 'op' field in instruction is isUnsigned
            if (!isUnsigned)
                op |= 0x10;
        }
        return VFPOperand(op);
    }

    static void setInt32(void* code, uint32_t value, bool flush)
    {
        uint16_t* location = reinterpret_cast<uint16_t*>(code);
        ASSERT(isMOV_imm_T3(location - 4) && isMOVT(location - 2));

        ARMThumbImmediate lo16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(value));
        ARMThumbImmediate hi16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(value >> 16));
        uint16_t instructions[4];
        instructions[0] = twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOV_imm_T3, lo16);
        instructions[1] = twoWordOp5i6Imm4Reg4EncodedImmSecond((location[-3] >> 8) & 0xf, lo16);
        instructions[2] = twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOVT, hi16);
        instructions[3] = twoWordOp5i6Imm4Reg4EncodedImmSecond((location[-1] >> 8) & 0xf, hi16);

        performJITMemcpy(location - 4, instructions, 4 * sizeof(uint16_t));
        if (flush)
            cacheFlush(location - 4, 4 * sizeof(uint16_t));
    }
    
    static int32_t readInt32(void* code)
    {
        uint16_t* location = reinterpret_cast<uint16_t*>(code);
        ASSERT(isMOV_imm_T3(location - 4) && isMOVT(location - 2));
        
        ARMThumbImmediate lo16;
        ARMThumbImmediate hi16;
        decodeTwoWordOp5i6Imm4Reg4EncodedImmFirst(lo16, location[-4]);
        decodeTwoWordOp5i6Imm4Reg4EncodedImmSecond(lo16, location[-3]);
        decodeTwoWordOp5i6Imm4Reg4EncodedImmFirst(hi16, location[-2]);
        decodeTwoWordOp5i6Imm4Reg4EncodedImmSecond(hi16, location[-1]);
        uint32_t result = hi16.asUInt16();
        result <<= 16;
        result |= lo16.asUInt16();
        return static_cast<int32_t>(result);
    }

    static void setUInt7ForLoad(void* code, ARMThumbImmediate imm)
    {
        // Requires us to have planted a LDR_imm_T1
        ASSERT(imm.isValid());
        ASSERT(imm.isUInt7());
        uint16_t* location = reinterpret_cast<uint16_t*>(code);
        uint16_t instruction;
        instruction = location[0] & ~((static_cast<uint16_t>(0x7f) >> 2) << 6);
        instruction |= (imm.getUInt7() >> 2) << 6;
        performJITMemcpy(location, &instruction, sizeof(uint16_t));
        cacheFlush(location, sizeof(uint16_t));
    }

    static void setPointer(void* code, void* value, bool flush)
    {
        setInt32(code, reinterpret_cast<uint32_t>(value), flush);
    }

    static bool isB(const void* address)
    {
        const uint16_t* instruction = static_cast<const uint16_t*>(address);
        return ((instruction[0] & 0xf800) == OP_B_T4a) && ((instruction[1] & 0xd000) == OP_B_T4b);
    }

    static bool isBL(const void* address)
    {
        const uint16_t* instruction = static_cast<const uint16_t*>(address);
        return ((instruction[0] & 0xf800) == OP_BL_T4a) && ((instruction[1] & 0xd000) == OP_BL_T4b);
    }

    static bool isBX(const void* address)
    {
        const uint16_t* instruction = static_cast<const uint16_t*>(address);
        return (instruction[0] & 0xff87) == OP_BX;
    }

    static bool isMOV_imm_T3(const void* address)
    {
        const uint16_t* instruction = static_cast<const uint16_t*>(address);
        return ((instruction[0] & 0xFBF0) == OP_MOV_imm_T3) && ((instruction[1] & 0x8000) == 0);
    }

    static bool isMOVT(const void* address)
    {
        const uint16_t* instruction = static_cast<const uint16_t*>(address);
        return ((instruction[0] & 0xFBF0) == OP_MOVT) && ((instruction[1] & 0x8000) == 0);
    }

    static bool isNOP_T1(const void* address)
    {
        const uint16_t* instruction = static_cast<const uint16_t*>(address);
        return instruction[0] == OP_NOP_T1;
    }

    static bool isNOP_T2(const void* address)
    {
        const uint16_t* instruction = static_cast<const uint16_t*>(address);
        return (instruction[0] == OP_NOP_T2a) && (instruction[1] == OP_NOP_T2b);
    }

    static bool canBeJumpT1(const uint16_t* instruction, const void* target)
    {
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        // It does not appear to be documented in the ARM ARM (big surprise), but
        // for OP_B_T1 the branch displacement encoded in the instruction is 2 
        // less than the actual displacement.
        relative -= 2;
        return ((relative << 23) >> 23) == relative;
    }
    
    static bool canBeJumpT2(const uint16_t* instruction, const void* target)
    {
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        // It does not appear to be documented in the ARM ARM (big surprise), but
        // for OP_B_T2 the branch displacement encoded in the instruction is 2 
        // less than the actual displacement.
        relative -= 2;
        return ((relative << 20) >> 20) == relative;
    }
    
    static bool canBeJumpT3(const uint16_t* instruction, const void* target)
    {
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        return ((relative << 11) >> 11) == relative;
    }
    
    static bool canBeJumpT4(const uint16_t* instruction, const void* target)
    {
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        return ((relative << 7) >> 7) == relative;
    }

    template<MachineCodeCopyMode copy = MachineCodeCopyMode::JITMemcpy>
    static void linkJumpT1(Condition cond, uint16_t* writeTarget, const uint16_t* instruction, void* target)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(        
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        ASSERT(canBeJumpT1(instruction, target));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        // It does not appear to be documented in the ARM ARM (big surprise), but
        // for OP_B_T1 the branch displacement encoded in the instruction is 2 
        // less than the actual displacement.
        relative -= 2;
        
        // All branch offsets should be an even distance.
        ASSERT(!(relative & 1));
        uint16_t newInstruction = OP_B_T1 | ((cond & 0xf) << 8) | ((relative & 0x1fe) >> 1);
        machineCodeCopy<copy>(writeTarget - 1, &newInstruction, sizeof(uint16_t));
    }

    template<MachineCodeCopyMode copy = MachineCodeCopyMode::JITMemcpy>
    static void linkJumpT2(uint16_t* writeTarget, const uint16_t* instruction, void* target)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(        
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        ASSERT(canBeJumpT2(instruction, target));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        // It does not appear to be documented in the ARM ARM (big surprise), but
        // for OP_B_T2 the branch displacement encoded in the instruction is 2 
        // less than the actual displacement.
        relative -= 2;
        
        // All branch offsets should be an even distance.
        ASSERT(!(relative & 1));
        uint16_t newInstruction = OP_B_T2 | ((relative & 0xffe) >> 1);
        machineCodeCopy<copy>(writeTarget - 1, &newInstruction, sizeof(uint16_t));
    }
    
    template<MachineCodeCopyMode copy = MachineCodeCopyMode::JITMemcpy>
    static void linkJumpT3(Condition cond, uint16_t* writeTarget, const uint16_t* instruction, void* target)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        ASSERT(canBeJumpT3(instruction, target));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        
        // All branch offsets should be an even distance.
        ASSERT(!(relative & 1));
        uint16_t instructions[2];
        instructions[0] = OP_B_T3a | ((relative & 0x100000) >> 10) | ((cond & 0xf) << 6) | ((relative & 0x3f000) >> 12);
        instructions[1] = OP_B_T3b | ((relative & 0x80000) >> 8) | ((relative & 0x40000) >> 5) | ((relative & 0xffe) >> 1);
        machineCodeCopy<copy>(writeTarget - 2, instructions, 2 * sizeof(uint16_t));
    }
    
    template<MachineCodeCopyMode copy = MachineCodeCopyMode::JITMemcpy>
    static void linkJumpT4(uint16_t* writeTarget, const uint16_t* instruction, void* target, BranchWithLink link)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(        
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        ASSERT(canBeJumpT4(instruction, target));
        
        intptr_t relative = reinterpret_cast<intptr_t>(target) - (reinterpret_cast<intptr_t>(instruction));
        // ARM encoding for the top two bits below the sign bit is 'peculiar'.
        if (relative >= 0)
            relative ^= 0xC00000;
        
        // All branch offsets should be an even distance.
        ASSERT(!(relative & 1));
        uint16_t instructions[2];
        instructions[0] = OP_B_T4a | ((relative & 0x1000000) >> 14) | ((relative & 0x3ff000) >> 12);
        instructions[1] = OP_B_T4b | (static_cast<uint16_t>(link) << 14) | ((relative & 0x800000) >> 10) | ((relative & 0x400000) >> 11) | ((relative & 0xffe) >> 1);
        machineCodeCopy<copy>(writeTarget - 2, instructions, 2 * sizeof(uint16_t));
    }

    template<MachineCodeCopyMode copy = MachineCodeCopyMode::JITMemcpy>
    static void linkConditionalJumpT4(Condition cond, uint16_t* writeTarget, const uint16_t* instruction, void* target)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(        
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        uint16_t newInstruction = ifThenElse(cond) | OP_IT;
        machineCodeCopy<copy>(writeTarget - 3, &newInstruction, sizeof(uint16_t));
        linkJumpT4<copy>(writeTarget, instruction, target, BranchWithLink::No);
    }

    template<MachineCodeCopyMode copy = MachineCodeCopyMode::JITMemcpy>
    static void linkBX(uint16_t* writeTarget, const uint16_t* instruction, void* target)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(
        ASSERT_UNUSED(instruction, !(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(writeTarget) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        const uint16_t JUMP_TEMPORARY_REGISTER = ARMRegisters::ip;
        ARMThumbImmediate lo16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(reinterpret_cast<uint32_t>(target) + 1));
        ARMThumbImmediate hi16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(reinterpret_cast<uint32_t>(target) >> 16));
        uint16_t instructions[5];
        instructions[0] = twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOV_imm_T3, lo16);
        instructions[1] = twoWordOp5i6Imm4Reg4EncodedImmSecond(JUMP_TEMPORARY_REGISTER, lo16);
        instructions[2] = twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOVT, hi16);
        instructions[3] = twoWordOp5i6Imm4Reg4EncodedImmSecond(JUMP_TEMPORARY_REGISTER, hi16);
        instructions[4] = OP_BX | (JUMP_TEMPORARY_REGISTER << 3);

        machineCodeCopy<copy>(writeTarget - 5, instructions, 5 * sizeof(uint16_t));
    }

    template<MachineCodeCopyMode copy = MachineCodeCopyMode::JITMemcpy>
    static void linkConditionalBX(Condition cond, uint16_t* writeTarget, const uint16_t* instruction, void* target)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(        
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        linkBX(writeTarget, instruction, target);
        uint16_t newInstruction = ifThenElse(cond, true, true) | OP_IT;
        machineCodeCopy<copy>(writeTarget - 6, &newInstruction, sizeof(uint16_t));
    }
    
    static void linkJumpAbsolute(uint16_t* writeTarget, const uint16_t* instruction, void* target)
    {
        // FIMXE: this should be up in the MacroAssembler layer. :-(
        ASSERT(!(reinterpret_cast<intptr_t>(instruction) & 1));
        ASSERT(!(reinterpret_cast<intptr_t>(target) & 1));
        
        ASSERT((isMOV_imm_T3(instruction - 5) && isMOVT(instruction - 3) && isBX(instruction - 1))
               || (isNOP_T1(instruction - 5) && isNOP_T2(instruction - 4) && isB(instruction - 2)));

        if (canBeJumpT4(instruction, target)) {
            // There may be a better way to fix this, but right now put the NOPs first, since in the
            // case of an conditional branch this will be coming after an ITTT predicating *three*
            // instructions!  Looking backwards to modify the ITTT to an IT is not easy, due to
            // variable wdith encoding - the previous instruction might *look* like an ITTT but
            // actually be the second half of a 2-word op.
            uint16_t instructions[3];
            instructions[0] = OP_NOP_T1;
            instructions[1] = OP_NOP_T2a;
            instructions[2] = OP_NOP_T2b;
            performJITMemcpy(writeTarget - 5, instructions, 3 * sizeof(uint16_t));
            linkJumpT4(writeTarget, instruction, target, BranchWithLink::No);
        } else {
            const uint16_t JUMP_TEMPORARY_REGISTER = ARMRegisters::ip;
            ARMThumbImmediate lo16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(reinterpret_cast<uint32_t>(target) + 1));
            ARMThumbImmediate hi16 = ARMThumbImmediate::makeUInt16(static_cast<uint16_t>(reinterpret_cast<uint32_t>(target) >> 16));

            uint16_t instructions[5];
            instructions[0] = twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOV_imm_T3, lo16);
            instructions[1] = twoWordOp5i6Imm4Reg4EncodedImmSecond(JUMP_TEMPORARY_REGISTER, lo16);
            instructions[2] = twoWordOp5i6Imm4Reg4EncodedImmFirst(OP_MOVT, hi16);
            instructions[3] = twoWordOp5i6Imm4Reg4EncodedImmSecond(JUMP_TEMPORARY_REGISTER, hi16);
            instructions[4] = OP_BX | (JUMP_TEMPORARY_REGISTER << 3);
            performJITMemcpy(writeTarget - 5, instructions, 5 * sizeof(uint16_t));
        }
    }

    static void linkBranch(uint16_t* from, const uint16_t* fromInstruction, void* to, BranchWithLink link)
    {
        ASSERT(isEven(fromInstruction));
        ASSERT(isEven(from));
        ASSERT(isEven(to));
        ASSERT(link == BranchWithLink::Yes ? isBL(from - 2) : isB(from - 2));

        intptr_t offset = std::bit_cast<intptr_t>(to) - std::bit_cast<intptr_t>(fromInstruction);
#if ENABLE(JUMP_ISLANDS)
        if (!isInt<25>(offset)) {
            to = ExecutableAllocator::singleton().getJumpIslandToUsingJITMemcpy(std::bit_cast<void*>(fromInstruction), to);
            offset = std::bit_cast<intptr_t>(to) - std::bit_cast<intptr_t>(fromInstruction);
        }
#endif
        RELEASE_ASSERT(isInt<25>(offset));

        linkJumpT4(from, fromInstruction, to, link);
    }

    static uint16_t twoWordOp5i6Imm4Reg4EncodedImmFirst(uint16_t op, ARMThumbImmediate imm)
    {
        return op | (imm.m_value.i << 10) | imm.m_value.imm4;
    }

    static void decodeTwoWordOp5i6Imm4Reg4EncodedImmFirst(ARMThumbImmediate& result, uint16_t value)
    {
        result.m_value.i = (value >> 10) & 1;
        result.m_value.imm4 = value & 15;
    }

    static uint16_t twoWordOp5i6Imm4Reg4EncodedImmSecond(uint16_t rd, ARMThumbImmediate imm)
    {
        return (imm.m_value.imm3 << 12) | (rd << 8) | imm.m_value.imm8;
    }

    static void decodeTwoWordOp5i6Imm4Reg4EncodedImmSecond(ARMThumbImmediate& result, uint16_t value)
    {
        result.m_value.imm3 = (value >> 12) & 7;
        result.m_value.imm8 = value & 255;
    }

    class ARMInstructionFormatter {
    public:
        ALWAYS_INLINE void oneWordOp5Reg3Imm8(OpcodeID op, RegisterID rd, uint8_t imm)
        {
            m_buffer.putShort(op | (rd << 8) | imm);
        }
        
        ALWAYS_INLINE void oneWordOp5Imm5Reg3Reg3(OpcodeID op, uint8_t imm, RegisterID reg1, RegisterID reg2)
        {
            m_buffer.putShort(op | (imm << 6) | (reg1 << 3) | reg2);
        }

        ALWAYS_INLINE void oneWordOp7Reg3Reg3Reg3(OpcodeID op, RegisterID reg1, RegisterID reg2, RegisterID reg3)
        {
            m_buffer.putShort(op | (reg1 << 6) | (reg2 << 3) | reg3);
        }

        ALWAYS_INLINE void oneWordOp7Imm9(OpcodeID op, uint16_t imm)
        {
            m_buffer.putShort(op | imm);
        }

        ALWAYS_INLINE void oneWordOp8Imm8(OpcodeID op, uint8_t imm)
        {
            m_buffer.putShort(op | imm);
        }

        ALWAYS_INLINE void oneWordOp8RegReg143(OpcodeID op, RegisterID reg1, RegisterID reg2)
        {
            m_buffer.putShort(op | ((reg2 & 8) << 4) | (reg1 << 3) | (reg2 & 7));
        }

        ALWAYS_INLINE void oneWordOp9Imm7(OpcodeID op, uint8_t imm)
        {
            m_buffer.putShort(op | imm);
        }

        ALWAYS_INLINE void oneWordOp10Reg3Reg3(OpcodeID op, RegisterID reg1, RegisterID reg2)
        {
            m_buffer.putShort(op | (reg1 << 3) | reg2);
        }

        ALWAYS_INLINE void twoWordOp12Reg4FourFours(OpcodeID1 op, RegisterID reg, FourFours ff)
        {
            m_buffer.putShort(static_cast<uint16_t>(op) | static_cast<uint16_t>(reg));
            m_buffer.putShort(ff.m_u.value);
        }
        
        ALWAYS_INLINE void twoWordOp16FourFours(OpcodeID1 op, FourFours ff)
        {
            m_buffer.putShort(op);
            m_buffer.putShort(ff.m_u.value);
        }
        
        ALWAYS_INLINE void twoWordOp16Op16(OpcodeID1 op1, OpcodeID2 op2)
        {
            m_buffer.putShort(op1);
            m_buffer.putShort(op2);
        }

        ALWAYS_INLINE void twoWordOp16Imm16(OpcodeID1 op1, uint16_t imm)
        {
            m_buffer.putShort(op1);
            m_buffer.putShort(imm);
        }
        
        ALWAYS_INLINE void twoWordOp5i6Imm4Reg4EncodedImm(OpcodeID1 op, int imm4, RegisterID rd, ARMThumbImmediate imm)
        {
            ARMThumbImmediate newImm = imm;
            newImm.m_value.imm4 = imm4;

            m_buffer.putShort(ARMv7Assembler::twoWordOp5i6Imm4Reg4EncodedImmFirst(op, newImm));
            m_buffer.putShort(ARMv7Assembler::twoWordOp5i6Imm4Reg4EncodedImmSecond(rd, newImm));
        }

        ALWAYS_INLINE void twoWordOp12Reg4Reg4Imm12(OpcodeID1 op, RegisterID reg1, RegisterID reg2, uint16_t imm)
        {
            m_buffer.putShort(static_cast<uint16_t>(op) | static_cast<uint16_t>(reg1));
            m_buffer.putShort((reg2 << 12) | imm);
        }

        ALWAYS_INLINE void twoWordOp12Reg4Reg4Reg4Imm8(OpcodeID1 op, RegisterID reg1, RegisterID reg2, RegisterID reg3, uint8_t imm)
        {
            m_buffer.putShort(static_cast<uint16_t>(op) | static_cast<uint16_t>(reg1));
            m_buffer.putShort((reg2 << 12) | (reg3 << 8) | imm);
        }

        ALWAYS_INLINE void twoWordOp12Reg40Imm3Reg4Imm20Imm5(OpcodeID1 op, RegisterID reg1, RegisterID reg2, uint16_t imm1, uint16_t imm2, uint16_t imm3)
        {
            m_buffer.putShort(static_cast<uint16_t>(op) | static_cast<uint16_t>(reg1));
            m_buffer.putShort((imm1 << 12) | (reg2 << 8) | (imm2 << 6) | imm3);
        }

        // Formats up instructions of the pattern:
        //    111111111B11aaaa:bbbb222SA2C2cccc
        // Where 1s in the pattern come from op1, 2s in the pattern come from op2, S is the provided size bit.
        // Operands provide 5 bit values of the form Aaaaa, Bbbbb, Ccccc.
        ALWAYS_INLINE void vfpOp(OpcodeID1 op1, OpcodeID2 op2, bool size, VFPOperand a, VFPOperand b, VFPOperand c)
        {
            ASSERT(!(op1 & 0x004f));
            ASSERT(!(op2 & 0xf1af));
            m_buffer.putShort(op1 | b.bits1() << 6 | a.bits4());
            m_buffer.putShort(op2 | b.bits4() << 12 | size << 8 | a.bits1() << 7 | c.bits1() << 5 | c.bits4());
        }

        // Arm vfp addresses can be offset by a 9-bit ones-comp immediate, left shifted by 2.
        // (i.e. +/-(0..255) 32-bit words)
        ALWAYS_INLINE void vfpMemOp(OpcodeID1 op1, OpcodeID2 op2, bool size, RegisterID rn, VFPOperand rd, int32_t imm)
        {
            bool up = true;
            if (imm < 0) {
                imm = -imm;
                up = false;
            }
            
            uint32_t offset = imm;
            ASSERT(!(offset & ~0x3fc));
            offset >>= 2;

            m_buffer.putShort(op1 | (up << 7) | rd.bits1() << 6 | rn);
            m_buffer.putShort(op2 | rd.bits4() << 12 | size << 8 | offset);
        }

        // Administrative methods:

        size_t codeSize() const { return m_buffer.codeSize(); }
        AssemblerLabel label() const { return m_buffer.label(); }
        bool isAligned(int alignment) const { return m_buffer.isAligned(alignment); }
        void* data() const { return m_buffer.data(); }

        unsigned debugOffset() { return m_buffer.debugOffset(); }

        AssemblerBuffer m_buffer;
    } m_formatter;

    Vector<LinkRecord, 0, UnsafeVectorOverflow> m_jumpsToLink;
    int m_indexOfLastWatchpoint;
    int m_indexOfTailOfLastWatchpoint;
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER) && CPU(ARM_THUMB2)
