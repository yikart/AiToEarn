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

#include <mutex>
#include <stdint.h>
#include <wtf/Assertions.h>
#include <wtf/DataLog.h>
#include <wtf/TZoneMalloc.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC { namespace ARM64Disassembler {

class A64DOpcode {
private:
    class OpcodeGroup {
        WTF_MAKE_TZONE_ALLOCATED(OpcodeGroup);
    public:
        OpcodeGroup(uint32_t opcodeMask, uint32_t opcodePattern, const char* (*format)(A64DOpcode*))
            : m_opcodeMask(opcodeMask)
            , m_opcodePattern(opcodePattern)
            , m_format(format)
            , m_next(0)
        {
        }

        void setNext(OpcodeGroup* next)
        {
            m_next = next;
        }

        OpcodeGroup* next()
        {
            return m_next;
        }

        bool matches(uint32_t opcode)
        {
            return (opcode & m_opcodeMask) == m_opcodePattern;
        }

        const char* format(A64DOpcode* thisObj)
        {
            return m_format(thisObj);
        }

    private:
        uint32_t m_opcodeMask;
        uint32_t m_opcodePattern;
        const char* (*m_format)(A64DOpcode*);
        OpcodeGroup* m_next;
    };

public:
    static void init();

    A64DOpcode(uint32_t* startPC = nullptr, uint32_t* endPC = nullptr)
        : m_startPC(startPC)
        , m_endPC(endPC)
        , m_opcode(0)
        , m_bufferOffset(0)
    {
        static std::once_flag once;
        std::call_once(once, init);
        m_formatBuffer[0] = '\0';
    }

    const char* disassemble(uint32_t* currentPC);

protected:
    void setPCAndOpcode(uint32_t*, uint32_t);
    const char* format();

    static const char* const s_conditionNames[16];
    static const char* const s_shiftNames[4];
    static const char* const s_optionName[8];
    static const char s_FPRegisterPrefix[5];

    static const char* conditionName(unsigned condition) { return s_conditionNames[condition & 0xf]; }
    static const char* shiftName(unsigned shiftValue) { return s_shiftNames[shiftValue & 0x3]; }
    const char* optionName() { return s_optionName[option()]; }
    static char FPRegisterPrefix(unsigned FPRegisterSize)
    {
        if (FPRegisterSize > 4)
            FPRegisterSize = 4;
        return s_FPRegisterPrefix[FPRegisterSize];
    }

    unsigned opcodeGroupNumber(uint32_t opcode) { return (opcode >> 24) & 0x1f; }

    bool is64Bit() { return m_opcode & 0x80000000; }
    unsigned size() { return m_opcode >> 30; }
    unsigned option() { return (m_opcode >> 13) & 0x7; }
    unsigned rd() { return m_opcode & 0x1f; }
    unsigned rt() { return m_opcode & 0x1f; }
    unsigned rn() { return (m_opcode >> 5) & 0x1f; }
    unsigned rm() { return (m_opcode >> 16) & 0x1f; }

    void bufferPrintf(const char* format, ...) WTF_ATTRIBUTE_PRINTF(2, 3);

    void appendInstructionName(const char* instructionName)
    {
        bufferPrintf("   %-9.9s", instructionName);
    }

    void appendRegisterName(unsigned registerNumber, bool is64Bit = true);
    void appendSPOrRegisterName(unsigned registerNumber, bool is64Bit = true)
    {
        if (registerNumber == 31) {
            bufferPrintf(is64Bit ? "sp" : "wsp");
            return;
        }
        appendRegisterName(registerNumber, is64Bit);
    }

    void appendZROrRegisterName(unsigned registerNumber, bool is64Bit = true)
    {
        if (registerNumber == 31) {
            bufferPrintf(is64Bit ? "xzr" : "wzr");
            return;
        }
        appendRegisterName(registerNumber, is64Bit);
    }

    void appendFPRegisterName(unsigned registerNumber, unsigned registerSize);
    void appendVectorRegisterName(unsigned registerNumber);

    void appendSeparator()
    {
        bufferPrintf(", ");
    }

    void appendCharacter(const char c)
    {
        bufferPrintf("%c", c);
    }

    void appendString(const char* string)
    {
        bufferPrintf("%s", string);
    }

    void appendShiftType(unsigned shiftValue)
    {
        bufferPrintf("%s ", shiftName(shiftValue));
    }

    void appendSignedImmediate(int immediate)
    {
        bufferPrintf("#%d", immediate);
    }

    void appendSignedImmediate64(int64_t immediate)
    {
        bufferPrintf("#%" PRIi64, immediate);
    }
    
    void appendUnsignedImmediate(unsigned immediate)
    {
        bufferPrintf("#%u", immediate);
    }

    void appendUnsignedHexImmediate(unsigned immediate)
    {
        bufferPrintf("#0x%x", immediate);
    }
    
    void appendUnsignedImmediate64(uint64_t immediate)
    {
        bufferPrintf("#0x%" PRIx64, immediate);
    }

    void appendPCRelativeOffset(uint32_t* pc, int32_t immediate);

    void appendShiftAmount(unsigned amount)
    {
        bufferPrintf("lsl #%u", 16 * amount);
    }
    
    void appendSIMDLaneIndexAndType(unsigned imm6)
    {
        unsigned q = imm6 >> 5;
        unsigned imm5 = imm6 & 0x1F;

        appendSIMDLaneType(q, size());

        unsigned lane = (imm5 & 0xF) >> 1;
        bufferPrintf("[#%u]", lane);
    }

    void appendSIMDLaneType(unsigned q, unsigned size)
    {
        switch (size) {
        case 0:
            if (q)
                bufferPrintf(".16B");
            else
                bufferPrintf(".8B");
            break;
        case 1:
            if (q)
                bufferPrintf(".8H");
            else
                bufferPrintf(".4H");
            break;
        case 2:
            if (q)
                bufferPrintf(".4S");
            else
                bufferPrintf(".2S");
            break;
        case 3:
            if (q)
                bufferPrintf(".2D");
            else
                bufferPrintf(".1D");
            break;
        default:
            bufferPrintf(".UNKNOWN");
            break;
        }
    }

    static constexpr int bufferSize = 101;

    char m_formatBuffer[bufferSize];
    uint32_t* m_startPC;
    uint32_t* m_endPC;
    uint32_t* m_currentPC;
    uint32_t m_opcode;
    int m_bufferOffset;
    uintptr_t m_builtConstant { 0 };

private:
    static OpcodeGroup* opcodeTable[32];
};

#define DEFINE_STATIC_FORMAT(klass, thisObj) \
   static const char* format(A64DOpcode* thisObj) { return reinterpret_cast< klass *>(thisObj)->format(); }

class A64DOpcodeAddSubtract : public A64DOpcode {
private:
    static const char* const s_opNames[4];

public:
    const char* opName() { return s_opNames[opAndS()]; }
    const char* cmpName() { return op() ? "cmp" : "cmn"; }

    bool isCMP() { return (sBit() && rd() == 31); }
    unsigned op() { return (m_opcode >> 30) & 0x1; }
    unsigned sBit() { return (m_opcode >> 29) & 0x1; }
    unsigned opAndS() { return (m_opcode >> 29) & 0x3; }
};

class A64DOpcodeAddSubtractImmediate : public A64DOpcodeAddSubtract {
public:
    static constexpr uint32_t mask = 0x1f000000;
    static constexpr uint32_t pattern = 0x11000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeAddSubtractImmediate, thisObj);

    const char* format();

    bool isMovSP() { return (!opAndS() && !immed12() && ((rd() == 31) || rn() == 31)); }
    unsigned shift() { return (m_opcode >> 22) & 0x3; }
    unsigned immed12() { return (m_opcode >> 10) & 0xfff; }
};

class A64DOpcodeAddSubtractExtendedRegister : public A64DOpcodeAddSubtract {
public:
    static constexpr uint32_t mask = 0x1fe00000;
    static constexpr uint32_t pattern = 0x0b200000;

    DEFINE_STATIC_FORMAT(A64DOpcodeAddSubtractExtendedRegister, thisObj);

    const char* format();

    unsigned immediate3() { return (m_opcode >> 10) & 0x7; }
};

class A64DOpcodeAddSubtractShiftedRegister : public A64DOpcodeAddSubtract {
public:
    static constexpr uint32_t mask = 0x1f200000;
    static constexpr uint32_t pattern = 0x0b000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeAddSubtractShiftedRegister, thisObj);

    const char* format();

    bool isNeg() { return (op() && rn() == 31); }
    const char* negName() { return sBit() ? "negs" : "neg"; }
    unsigned shift() { return (m_opcode >> 22) & 0x3; }
    int immediate6() { return (static_cast<uint32_t>((m_opcode >> 10) & 0x3f) << 26) >> 26; }
};

class A64DOpcodeBitfield : public A64DOpcode {
private:
    static const char* const s_opNames[3];
    static const char* const s_extendPseudoOpNames[3][3];
    static const char* const s_insertOpNames[3];
    static const char* const s_extractOpNames[3];

public:
    static constexpr uint32_t mask = 0x1f800000;
    static constexpr uint32_t pattern = 0x13000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeBitfield, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opc()]; }
    const char* extendPseudoOpNames(unsigned opSize) { return s_extendPseudoOpNames[opc()][opSize]; }
    const char* insertOpNames() { return s_insertOpNames[opc()]; }
    const char* extractOpNames() { return s_extractOpNames[opc()]; }

    unsigned opc() { return (m_opcode >> 29) & 0x3; }
    unsigned nBit() { return (m_opcode >> 22) & 0x1; }
    unsigned immediateR() { return (m_opcode >> 16) & 0x3f; }
    unsigned immediateS() { return (m_opcode >> 10) & 0x3f; }
};

class A64DOpcodeCompareAndBranchImmediate : public A64DOpcode {
public:
    static constexpr uint32_t mask = 0x7e000000;
    static constexpr uint32_t pattern = 0x34000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeCompareAndBranchImmediate, thisObj);

    const char* format();

    unsigned opBit() { return (m_opcode >> 24) & 0x1; }
    int immediate19() { return (static_cast<int>((m_opcode >> 5) & 0x7ffff) << 13) >> 13; }
};

class A64DOpcodeConditionalBranchImmediate : public A64DOpcode {
public:
    static constexpr uint32_t mask = 0xff000010;
    static constexpr uint32_t pattern = 0x54000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeConditionalBranchImmediate, thisObj);

    const char* format();

    unsigned condition() { return m_opcode & 0xf; }
    int immediate19() { return (static_cast<int>((m_opcode >> 5) & 0x7ffff) << 13) >> 13; }
};

class A64DOpcodeConditionalSelect : public A64DOpcode {
private:
    static const char* const s_opNames[4];

public:
    static constexpr uint32_t mask = 0x1fe00000;
    static constexpr uint32_t pattern = 0x1a800000;

    DEFINE_STATIC_FORMAT(A64DOpcodeConditionalSelect, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opNum()]; }
    unsigned opNum() { return (op() << 1 | (op2() & 0x1)); }
    unsigned op() { return (m_opcode >> 30) & 0x1; }
    unsigned sBit() { return (m_opcode >> 29) & 0x1; }
    unsigned condition() { return (m_opcode >> 12) & 0xf; }
    unsigned op2() { return (m_opcode >> 10) & 0x3; }
};

class A64DOpcodeDataProcessing1Source : public A64DOpcode {
private:
    static const char* const s_opNames[8];
    static const char* const s_pacAutOpNames[18];
    
public:
    static constexpr uint32_t mask = 0x5fe00000;
    static constexpr uint32_t pattern = 0x5ac00000;
    
    DEFINE_STATIC_FORMAT(A64DOpcodeDataProcessing1Source, thisObj);
    
    const char* format();
    
    const char* opName() { return s_opNames[opNameIndex()]; }
    unsigned sBit() { return (m_opcode >> 29) & 0x1; }
    unsigned opCode() { return (m_opcode >> 10) & 0x3f; }
    unsigned opCode2() { return (m_opcode >> 16) & 0x1f; }
    unsigned opNameIndex() { return (opCode() & 0x7); }
};

class A64DOpcodeDataProcessing2Source : public A64DOpcode {
private:
    static const char* const s_opNames[16];

public:
    static constexpr uint32_t mask = 0x5fe00000;
    static constexpr uint32_t pattern = 0x1ac00000;

    DEFINE_STATIC_FORMAT(A64DOpcodeDataProcessing2Source, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opNameIndex()]; }
    unsigned sBit() { return (m_opcode >> 29) & 0x1; }
    unsigned opCode() { return (m_opcode >> 10) & 0x3f; }
    unsigned opNameIndex() { return (m_opcode >> 10) & 0xf; }
};

class A64DOpcodeDataProcessing3Source : public A64DOpcode {
private:
    static const char* const s_opNames[16];
    static const char* const s_pseudoOpNames[16];

public:
    static constexpr uint32_t mask = 0x1f000000;
    static constexpr uint32_t pattern = 0x1b000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeDataProcessing3Source, thisObj);

    const char* format();

    const char* opName() { return ra() == 31 ? s_pseudoOpNames[opNum() & 0xf] : s_opNames[opNum() & 0xf]; }
    unsigned ra() { return (m_opcode >> 10) & 0x1f; }
    unsigned op54() { return (m_opcode >> 29) & 0x3; }
    unsigned op31() { return (m_opcode >> 21) & 0x7; }
    unsigned op0() { return (m_opcode >> 15) & 0x1; }
    unsigned opNum() { return ((m_opcode >> 25) & 0x30) | ((m_opcode >> 20) & 0xe) | ((m_opcode >> 15) & 0x1); }
};

class A64OpcodeExceptionGeneration : public A64DOpcode {
public:
    static constexpr uint32_t mask = 0xff000000;
    static constexpr uint32_t pattern = 0xd4000000;

    DEFINE_STATIC_FORMAT(A64OpcodeExceptionGeneration, thisObj);

    const char* format();

    unsigned opc() { return (m_opcode>>21) & 0x7; }
    unsigned op2() { return (m_opcode>>2) & 0x7; }
    unsigned ll() { return m_opcode & 0x3; }
    unsigned immediate16() { return (static_cast<unsigned>((m_opcode >> 5) & 0xffff) << 16) >> 16; }
};

class A64DOpcodeExtract : public A64DOpcode {
public:
    static constexpr uint32_t mask = 0x1f800000;
    static constexpr uint32_t pattern = 0x13800000;

    DEFINE_STATIC_FORMAT(A64DOpcodeExtract, thisObj);

    const char* format();

    unsigned op21() { return (m_opcode >> 29) & 0x3; }
    unsigned nBit() { return (m_opcode >> 22) & 0x1; }
    unsigned o0Bit() { return (m_opcode >> 21) & 0x1; }
    unsigned immediateS() { return (m_opcode >> 10) & 0x3f; }
};

class A64DOpcodeFloatingPointOps : public A64DOpcode {
public:
    unsigned mBit() { return (m_opcode >> 31) & 0x1; }
    unsigned sBit() { return (m_opcode >> 29) & 0x1; }
    unsigned type() { return (m_opcode >> 22) & 0x3; }
};

class A64DOpcodeFloatingPointCompare : public A64DOpcodeFloatingPointOps {
private:
    static const char* const s_opNames[16];
    
public:
    static constexpr uint32_t mask = 0x5f203c00;
    static constexpr uint32_t pattern = 0x1e202000;
    
    DEFINE_STATIC_FORMAT(A64DOpcodeFloatingPointCompare, thisObj);
    
    const char* format();

    const char* opName() { return (opNum() & 0x2) ? "fcmpe" : "fcmp"; }

    unsigned op() { return (m_opcode >> 14) & 0x3; }
    unsigned opCode2() { return m_opcode & 0x1f; }
    unsigned opNum() { return (m_opcode >> 3) & 0x3; }
};

class A64DOpcodeFloatingPointConditionalSelect : public A64DOpcodeFloatingPointOps {
public:
    static constexpr uint32_t mask = 0x5f200c00;
    static constexpr uint32_t pattern = 0x1e200c00;
    
    DEFINE_STATIC_FORMAT(A64DOpcodeFloatingPointConditionalSelect, thisObj);
    
    const char* format();
    
    const char* opName() { return "fcsel"; }
    
    unsigned condition() { return (m_opcode >> 12) & 0xf; }
};

class A64DOpcodeFloatingPointDataProcessing1Source : public A64DOpcodeFloatingPointOps {
private:
    static const char* const s_opNames[16];

public:
    static constexpr uint32_t mask = 0x5f207c00;
    static constexpr uint32_t pattern = 0x1e204000;

    DEFINE_STATIC_FORMAT(A64DOpcodeFloatingPointDataProcessing1Source, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opNum()]; }

    unsigned opNum() { return (m_opcode >> 15) & 0x3f; }
};

class A64DOpcodeFloatingPointDataProcessing2Source : public A64DOpcodeFloatingPointOps {
private:
    static const char* const s_opNames[16];

public:
    static constexpr uint32_t mask = 0x5f200800;
    static constexpr uint32_t pattern = 0x1e200800;

    DEFINE_STATIC_FORMAT(A64DOpcodeFloatingPointDataProcessing2Source, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opNum()]; }

    unsigned opNum() { return (m_opcode >> 12) & 0xf; }
};

class A64DOpcodeFloatingPointDataProcessing4Source : public A64DOpcodeFloatingPointOps {
private:
    static const char* const s_opNames[4];

public:
    static constexpr uint32_t mask    = 0b1'1'1'11111'10'1'1111'00'11111'00000'00000;
    static constexpr uint32_t pattern = 0b0'0'0'11110'00'1'0100'00'10000'00000'00000;

    DEFINE_STATIC_FORMAT(A64DOpcodeFloatingPointDataProcessing4Source, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opNum()]; }

    unsigned opNum() { return (m_opcode >> 15) & 0b11; }
};

class A64DOpcodeFloatingFixedPointConversions : public A64DOpcodeFloatingPointOps {
private:
    static const char* const s_opNames[4];
    
public:
    static constexpr uint32_t mask = 0x5f200000;
    static constexpr uint32_t pattern = 0x1e000000;
    
    DEFINE_STATIC_FORMAT(A64DOpcodeFloatingFixedPointConversions, thisObj);
    
    const char* format();
    
    const char* opName() { return s_opNames[opNum()]; }
    unsigned rmode() { return (m_opcode >> 19) & 0x3; }
    unsigned opcode() { return (m_opcode >> 16) & 0x7; }
    unsigned scale() { return (m_opcode >> 10) & 0x3f; }
    unsigned opNum() { return (m_opcode >> 16) & 0x3; }
};

class A64DOpcodeFloatingPointIntegerConversions : public A64DOpcodeFloatingPointOps {
private:
    static const char* const s_opNames[32];
    
public:
    static constexpr uint32_t mask = 0x5f20fc00;
    static constexpr uint32_t pattern = 0x1e200000;

    DEFINE_STATIC_FORMAT(A64DOpcodeFloatingPointIntegerConversions, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opNum()]; }
    unsigned rmode() { return (m_opcode >> 19) & 0x3; }
    unsigned opcode() { return (m_opcode >> 16) & 0x7; }
    unsigned opNum() { return (m_opcode >> 16) & 0x1f; }
};

class A64DOpcodeSystem : public A64DOpcode {
public:
    unsigned lBit() { return (m_opcode >> 21) & 0x1; }
    unsigned op0() { return (m_opcode >> 19) & 0x3; }
    unsigned op1() { return (m_opcode >> 16) & 0x7; }
    unsigned crN() { return (m_opcode >> 12) & 0xf; }
    unsigned crM() { return (m_opcode >> 8) & 0xf; }
    unsigned op2() { return (m_opcode >> 5) & 0x7; }
};

class A64DOpcodeMSRImmediate : public A64DOpcodeSystem {
public:
    static constexpr uint32_t mask = 0xfff8f01f;
    static constexpr uint32_t pattern = 0xd500401f;

    DEFINE_STATIC_FORMAT(A64DOpcodeMSRImmediate, thisObj);

    const char* format();
};

class A64DOpcodeMSROrMRSRegister : public A64DOpcodeSystem {
public:
    static constexpr uint32_t mask = 0xffd00000;
    static constexpr uint32_t pattern = 0xd5100000;

    DEFINE_STATIC_FORMAT(A64DOpcodeMSROrMRSRegister, thisObj);

    const char* format();

    const char* opName() { return lBit() ? "mrs" : "msr"; }
    unsigned systemRegister() { return ((op0() << 14) | (op1() << 11) | (crN() << 7) | (crM() << 3) | op2()); }
};

class A64DOpcodeHint : public A64DOpcodeSystem {
private:
    static const char* const s_opNames[32];

public:
    static constexpr uint32_t mask = 0xfffff01f;
    static constexpr uint32_t pattern = 0xd503201f;

    DEFINE_STATIC_FORMAT(A64DOpcodeHint, thisObj);

    const char* format();

    const char* opName();
    unsigned immediate7() { return (m_opcode >> 5) & 0x7f; }
};

class A64DOpcodeSystemSync : public A64DOpcodeSystem {
    static const char* const s_opNames[8];
    static const char* const s_optionNames[16];

public:
    static constexpr uint32_t mask = 0xfffff01f;
    static constexpr uint32_t pattern = 0xd503301f;

    DEFINE_STATIC_FORMAT(A64DOpcodeSystemSync, thisObj);

    const char* format();

    const char* opName() { return s_opNames[op2()]; }
    const char* option() { return s_optionNames[crM()]; }
};

class A64DOpcodeLoadStore : public A64DOpcode {
private:
    static const char* const s_opNames[32];

protected:
    const char* opName()
    {
        return s_opNames[opNumber()];
    }

    unsigned size() { return (m_opcode >> 30) & 0x3; }
    unsigned vBit() { return (m_opcode >> 26) & 0x1; }
    unsigned opc() { return (m_opcode >> 22) & 0x3; }
    unsigned opNumber() { return (size() <<3 ) | (vBit() << 2) | opc(); }
    bool is64BitRT() { return ((opNumber() & 0x17) == 0x02) || ((opNumber() & 0x1e) == 0x18); }
};

class A64DOpcodeLoadStoreExclusive : public A64DOpcodeLoadStore {
private:
    static const char* const s_opNames[64];

public:
    static constexpr uint32_t mask = 0x3f000000;
    static constexpr uint32_t pattern = 0x08000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeLoadStoreExclusive, thisObj);

    const char* format();

    const char* opName()
    {
        return s_opNames[opNumber()];
    }

    unsigned rs() { return rm(); }
    unsigned rt2() { return (m_opcode >> 10) & 0x1f; }
    unsigned o0() { return (m_opcode >> 15) & 0x1; }
    unsigned o1() { return (m_opcode >> 21) & 0x1; }
    unsigned o2() { return (m_opcode >> 23) & 0x1; }
    unsigned loadBit() { return (m_opcode >> 22) & 0x1; }
    unsigned opNumber() { return (size() << 4 ) | (o2() << 3) | (loadBit() << 2) | (o1() << 1) | o0(); }
    bool isPairOp() { return (size() & 0x10) && o1(); }
};

class A64DOpcodeLoadStoreImmediate : public A64DOpcodeLoadStore {
private:
    static const char* const s_unprivilegedOpNames[32];
    static const char* const s_unscaledOpNames[32];

public:
    static constexpr uint32_t mask = 0x3b200000;
    static constexpr uint32_t pattern = 0x38000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeLoadStoreImmediate, thisObj);

    const char* format();

    const char* unprivilegedOpName()
    {
        return s_unprivilegedOpNames[opNumber()];
    }
    const char* unscaledOpName()
    {
        return s_unscaledOpNames[opNumber()];
    }
    unsigned type() { return (m_opcode >> 10) & 0x3; }
    int immediate9() { return (static_cast<int>((m_opcode >> 12) & 0x1ff) << 23) >> 23; }
};

class A64DOpcodeLoadStoreRegisterOffset : public A64DOpcodeLoadStore {
public:
    static constexpr uint32_t mask = 0x3b200c00;
    static constexpr uint32_t pattern = 0x38200800;

    DEFINE_STATIC_FORMAT(A64DOpcodeLoadStoreRegisterOffset, thisObj);

    const char* format();

    unsigned option() { return (m_opcode >> 13) & 0x7; }
    int sBit() { return (m_opcode >> 12) & 0x1; }
};

class A64DOpcodeLoadStoreAuthenticated : public A64DOpcodeLoadStore {
private:
    static const char* const s_opNames[2];
    
protected:
    const char* opName()
    {
        return s_opNames[opNumber()];
    }

public:
    static constexpr uint32_t mask = 0xff200400;
    static constexpr uint32_t pattern = 0xf8200400;
    
    DEFINE_STATIC_FORMAT(A64DOpcodeLoadStoreAuthenticated, thisObj);
    
    const char* format();

    unsigned opNum() { return mBit(); }
    unsigned mBit() { return (m_opcode >> 23) & 0x1; }
    unsigned sBit() { return (m_opcode >> 22) & 0x1; }
    unsigned wBit() { return (m_opcode >> 11) & 0x1; }
    int immediate10() { return (sBit() << 9) | ((m_opcode >> 12) & 0x1ff); }
    
};

class A64DOpcodeLoadAtomic : public A64DOpcodeLoadStore {
private:
    static const char* const s_opNames[64];

protected:
    const char* opName()
    {
        unsigned number = opNumber();
        if (number < 64)
            return s_opNames[number];
        return nullptr;
    }

public:
    static constexpr uint32_t mask    = 0b00111111'00100000'10001100'00000000U;
    static constexpr uint32_t pattern = 0b00111000'00100000'00000000'00000000U;

    DEFINE_STATIC_FORMAT(A64DOpcodeLoadAtomic, thisObj);

    const char* format();

    unsigned rs() { return rm(); }
    unsigned opc() { return (m_opcode >> 12) & 0b111; }
    unsigned ar() { return (m_opcode >> 22) & 0b11; }
    unsigned opNumber() { return (opc() << 4) | (size() << 2) | ar(); }
};

class A64DOpcodeSwapAtomic : public A64DOpcodeLoadStore {
private:
    static const char* const s_opNames[16];

protected:
    const char* opName()
    {
        return s_opNames[opNumber()];
    }

public:
    static constexpr uint32_t mask    = 0b00111111'00100000'11111100'00000000U;
    static constexpr uint32_t pattern = 0b00111000'00100000'10000000'00000000U;

    DEFINE_STATIC_FORMAT(A64DOpcodeSwapAtomic, thisObj);

    const char* format();

    unsigned rs() { return rm(); }
    unsigned ar() { return (m_opcode >> 22) & 0b11; }
    unsigned opNumber() { return (size() << 2) | ar(); }
};

class A64DOpcodeCAS : public A64DOpcodeLoadStore {
private:
    static const char* const s_opNames[16];

protected:
    const char* opName()
    {
        return s_opNames[opNumber()];
    }

public:
    static constexpr uint32_t mask    = 0b00111111'10100000'01111100'00000000U;
    static constexpr uint32_t pattern = 0b00001000'10100000'01111100'00000000U;

    DEFINE_STATIC_FORMAT(A64DOpcodeCAS, thisObj);

    const char* format();

    unsigned rs() { return rm(); }
    unsigned o1() { return (m_opcode >> 15) & 0x1; }
    unsigned l() { return (m_opcode >> 22) & 0x1; }
    unsigned opNumber() { return (size() << 2) | (l() << 1) | o1(); }
};

class A64DOpcodeLoadStoreRegisterPair : public A64DOpcodeLoadStore {
public:
    static constexpr uint32_t mask = 0x38000000;
    static constexpr uint32_t pattern = 0x28000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeLoadStoreRegisterPair, thisObj);

    const char* format();
    const char* opName();

    unsigned rt2() { return (m_opcode >> 10) & 0x1f; }
    int immediate7() { return (static_cast<int>((m_opcode >> 15) & 0x7f) << 25) >> 25; }
    unsigned offsetMode() { return (m_opcode >> 23) & 0x7; }
    int lBit() { return (m_opcode >> 22) & 0x1; }
};

class A64DOpcodeLoadStoreUnsignedImmediate : public A64DOpcodeLoadStore {
public:
    static constexpr uint32_t mask = 0x3b000000;
    static constexpr uint32_t pattern = 0x39000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeLoadStoreUnsignedImmediate, thisObj);

    const char* format();

    unsigned immediate12() { return (m_opcode >> 10) & 0xfff; }
};

class A64DOpcodeLogical : public A64DOpcode {
private:
    static const char* const s_opNames[8];

public:
    const char* opName(unsigned opNumber)
    {
        return s_opNames[opNumber & 0x7];
    }

    unsigned opc() { return (m_opcode >> 29) & 0x3; }
    unsigned nBit() { return (m_opcode >> 21) & 0x1; }
};

class A64DOpcodeLogicalImmediate : public A64DOpcodeLogical {
public:
    static constexpr uint32_t mask = 0x1f800000;
    static constexpr uint32_t pattern = 0x12000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeLogicalImmediate, thisObj);

    const char* format();

    bool isTst() { return ((opNumber() == 6) && (rd() == 31)); }
    bool isMov() { return ((opNumber() == 2) && (rn() == 31)); }
    unsigned opNumber() { return opc() << 1; }
    unsigned nBit() { return (m_opcode >> 22) & 0x1; }
    unsigned immediateR() { return (m_opcode >> 16) & 0x3f; }
    unsigned immediateS() { return (m_opcode >> 10) & 0x3f; }
};

class A64DOpcodeLogicalShiftedRegister : public A64DOpcodeLogical {
public:
    static constexpr uint32_t mask = 0x1f000000;
    static constexpr uint32_t pattern = 0x0a000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeLogicalShiftedRegister, thisObj);

    const char* format();

    bool isTst() { return ((opNumber() == 6) && (rd() == 31)); }
    bool isMov() { return ((opc() == 1) && (rn() == 31)); }
    unsigned opNumber() { return (opc() << 1) | nBit(); }
    unsigned shift() { return (m_opcode >> 22) & 0x3; }
    int immediate6() { return (static_cast<uint32_t>((m_opcode >> 10) & 0x3f) << 26) >> 26; }
};

class A64DOpcodeMoveWide : public A64DOpcode {
private:
    static const char* const s_opNames[4];

public:
    static constexpr uint32_t mask = 0x1f800000;
    static constexpr uint32_t pattern = 0x12800000;

    DEFINE_STATIC_FORMAT(A64DOpcodeMoveWide, thisObj);

    const char* format();
    bool isValid();

    const char* opName() { return s_opNames[opc()]; }
    unsigned opc() { return (m_opcode >> 29) & 0x3; }
    unsigned hw() { return (m_opcode >> 21) & 0x3; }
    unsigned immediate16() { return (m_opcode >> 5) & 0xffff; }

private:
    template<typename Trait> typename Trait::ResultType parse();
    bool handlePotentialDataPointer(void*);
    bool handlePotentialPtrTag(uintptr_t);

    // These forwarding functions are needed for MoveWideFormatTrait only.
    const char* baseFormat() { return A64DOpcode::format(); }
    const char* formatBuffer() { return m_formatBuffer; }

    friend class MoveWideFormatTrait;
    friend class MoveWideIsValidTrait;
};

class A64DOpcodeTestAndBranchImmediate : public A64DOpcode {
public:
    static constexpr uint32_t mask = 0x7e000000;
    static constexpr uint32_t pattern = 0x36000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeTestAndBranchImmediate, thisObj);

    const char* format();

    unsigned bitNumber() { return ((m_opcode >> 26) & 0x20) | ((m_opcode >> 19) & 0x1f); }
    unsigned opBit() { return (m_opcode >> 24) & 0x1; }
    int immediate14() { return (static_cast<int>((m_opcode >> 5) & 0x3fff) << 18) >> 18; }
};

class A64DOpcodeUnconditionalBranchImmediate : public A64DOpcode {
public:
    static constexpr uint32_t mask = 0x7c000000;
    static constexpr uint32_t pattern = 0x14000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeUnconditionalBranchImmediate, thisObj);

    const char* format();

    unsigned op() { return (m_opcode >> 31) & 0x1; }
    int immediate26() { return (static_cast<int>(m_opcode & 0x3ffffff) << 6) >> 6; }
};

class A64DOpcodeUnconditionalBranchRegister : public A64DOpcode {
private:
    static const char* const s_opNames[8];
    static const char* const s_AuthOpNames[20];

public:
    static constexpr uint32_t mask = 0xfe1f0000;
    static constexpr uint32_t pattern = 0xd61f0000;

    DEFINE_STATIC_FORMAT(A64DOpcodeUnconditionalBranchRegister, thisObj);

    const char* format();

    const char* opName() { return s_opNames[opc()]; }
    const char* authOpName();
    unsigned opc() { return (m_opcode >> 21) & 0xf; }
    unsigned authOpCode() {return (opc() << 1) | mBit(); }
    unsigned op2() { return (m_opcode >> 16) & 0x1f; }
    unsigned op3() { return (m_opcode >> 10) & 0x3f; }
    unsigned op4() { return m_opcode & 0xf; }
    unsigned mBit() { return (m_opcode >> 10) & 1; }
    unsigned rm() { return rd(); }
};

class A64DOpcodeVectorDataProcessingLogical1Source : public A64DOpcode {
public:
    static constexpr uint32_t mask    = 0b101'11111'11'1'000000000000000000000;
    static constexpr uint32_t pattern = 0b000'01110'00'0'000000000000000000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeVectorDataProcessingLogical1Source, thisObj);

    const char* format();
    const char* opName();
    
    unsigned rd() { return (m_opcode >> 0) & 0b11111; }
    unsigned rt() { return (m_opcode >> 5) & 0b11111; }
    unsigned op10_15() { return (m_opcode >> 10) & 0b11111; }
    unsigned imm5() { return (m_opcode >> 16) & 0b11111; }
    unsigned q() { return (m_opcode >> 30) & 0b1; }
};

class A64DOpcodeVectorDataProcessingLogical2Source : public A64DOpcode {
public:
    static constexpr uint32_t mask    = 0b101'11111'11'1'000000000000000000000;
    static constexpr uint32_t pattern = 0b000'01110'10'1'000000000000000000000;

    DEFINE_STATIC_FORMAT(A64DOpcodeVectorDataProcessingLogical2Source, thisObj);

    const char* format();
    const char* opName();
    
    unsigned rd() { return (m_opcode >> 0) & 0b11111; }
    unsigned rn() { return (m_opcode >> 5) & 0b11111; }
    unsigned op10_15() { return (m_opcode >> 10) & 0b11111; }
    unsigned rm() { return (m_opcode >> 16) & 0b11111; }
    unsigned q() { return (m_opcode >> 30) & 0b1; }
};



} } // namespace JSC::ARM64Disassembler

using JSC::ARM64Disassembler::A64DOpcode;

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
