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

#if ENABLE(ASSEMBLER) && CPU(X86_64)

#include "AssemblerBuffer.h"
#include "AssemblerCommon.h"
#include "JITCompilationEffort.h"
#include "RegisterInfo.h"
#include "SIMDInfo.h"
#include <limits.h>
#include <stdint.h>
#include <wtf/Assertions.h>
#include <wtf/Vector.h>

namespace JSC {

inline bool CAN_SIGN_EXTEND_8_32(int32_t value) { return value == (int32_t)(signed char)value; }

namespace RegisterNames {

#define REGISTER_ID(id, name, res, cs) id,

typedef enum : int8_t {
    FOR_EACH_GP_REGISTER(REGISTER_ID)
    InvalidGPRReg = -1,
} RegisterID;

typedef enum : int8_t {
    FOR_EACH_SP_REGISTER(REGISTER_ID)                                                     
} SPRegisterID;

typedef enum : int8_t {
    FOR_EACH_FP_REGISTER(REGISTER_ID)
    InvalidFPRReg = -1,
} XMMRegisterID;

#undef REGISTER_ID

} // namespace X86Registers

class X86Assembler {
public:
    typedef X86Registers::RegisterID RegisterID;
    
    static constexpr RegisterID firstRegister() { return X86Registers::eax; }
    static constexpr RegisterID lastRegister()
    {
        return X86Registers::r15;
    }
    static constexpr unsigned numberOfRegisters() { return lastRegister() - firstRegister() + 1; }
    
    typedef X86Registers::SPRegisterID SPRegisterID;

    static constexpr SPRegisterID firstSPRegister() { return X86Registers::eip; }
    static constexpr SPRegisterID lastSPRegister() { return X86Registers::eflags; }
    static constexpr unsigned numberOfSPRegisters() { return lastSPRegister() - firstSPRegister() + 1; }
    
    typedef X86Registers::XMMRegisterID XMMRegisterID;
    typedef XMMRegisterID FPRegisterID;
    
    static constexpr FPRegisterID firstFPRegister() { return X86Registers::xmm0; }
    static constexpr FPRegisterID lastFPRegister()
    {
        return X86Registers::xmm15;
    }
    static constexpr unsigned numberOfFPRegisters() { return lastFPRegister() - firstFPRegister() + 1; }
    
    static ASCIILiteral gprName(RegisterID id)
    {
        ASSERT(id >= firstRegister() && id <= lastRegister());
        static constexpr ASCIILiteral nameForRegister[numberOfRegisters()] = {
#define REGISTER_NAME(id, name, res, cs) name,
        FOR_EACH_GP_REGISTER(REGISTER_NAME)
#undef REGISTER_NAME
        };
        return nameForRegister[id];
    }

    static ASCIILiteral sprName(SPRegisterID id)
    {
        ASSERT(id >= firstSPRegister() && id <= lastSPRegister());
        static constexpr ASCIILiteral const nameForRegister[numberOfSPRegisters()] = {
#define REGISTER_NAME(id, name, res, cs) name,
        FOR_EACH_SP_REGISTER(REGISTER_NAME)
#undef REGISTER_NAME
        };
        return nameForRegister[id];
    }
    
    static ASCIILiteral fprName(FPRegisterID reg)
    {
        ASSERT(reg >= firstFPRegister() && reg <= lastFPRegister());
        static constexpr ASCIILiteral nameForRegister[numberOfFPRegisters()] = {
#define REGISTER_NAME(id, name, res, cs) name,
        FOR_EACH_FP_REGISTER(REGISTER_NAME)
#undef REGISTER_NAME
        };
        return nameForRegister[reg];
    }
    
    typedef enum {
        ConditionO,
        ConditionNO,
        ConditionB,
        ConditionAE,
        ConditionE,
        ConditionNE,
        ConditionBE,
        ConditionA,
        ConditionS,
        ConditionNS,
        ConditionP,
        ConditionNP,
        ConditionL,
        ConditionGE,
        ConditionLE,
        ConditionG,

        ConditionC  = ConditionB,
        ConditionNC = ConditionAE,
    } Condition;

private:
    // OneByteOpcodeID defines the bytecode for 1 byte instruction. It also contains the prefixes
    // for two bytes instructions.
    // TwoByteOpcodeID, ThreeByteOpcodeID define the opcodes for the multibytes instructions.
    //
    // The encoding for each instruction can be found in the Intel Architecture Manual in the appendix
    // "Opcode Map."
    //
    // Each opcode can have a suffix describing the type of argument. The full list of suffixes is
    // in the "Key to Abbreviations" section of the "Opcode Map".
    // The most common argument types are:
    //     -E: The argument is either a GPR or a memory address.
    //     -G: The argument is a GPR.
    //     -I: The argument is an immediate.
    // The most common sizes are:
    //     -v: 32 or 64bit depending on the operand-size attribute.
    //     -z: 32bit in both 32bit and 64bit mode. Common for immediate values.
    typedef enum {
        OP_ADD_EbGb                     = 0x00,
        PRE_SSE_00                      = 0x00,
        OP_ADD_EvGv                     = 0x01,
        OP_ADD_GvEv                     = 0x03,
        OP_ADD_EAXIv                    = 0x05,
        OP_OR_EvGb                      = 0x08,
        OP_OR_EvGv                      = 0x09,
        OP_OR_GvEv                      = 0x0B,
        OP_OR_EAXIv                     = 0x0D,
        OP_2BYTE_ESCAPE                 = 0x0F,
        OP_AND_EvGb                     = 0x20,
        OP_AND_EvGv                     = 0x21,
        OP_AND_GvEv                     = 0x23,
        OP_SUB_EvGb                     = 0x28,
        OP_SUB_EvGv                     = 0x29,
        OP_SUB_GvEv                     = 0x2B,
        OP_SUB_EAXIv                    = 0x2D,
        PRE_PREDICT_BRANCH_NOT_TAKEN    = 0x2E,
        OP_XOR_EvGb                     = 0x30,
        OP_XOR_EvGv                     = 0x31,
        OP_XOR_GvEv                     = 0x33,
        OP_XOR_EAXIv                    = 0x35,
        OP_CMP_EvGv                     = 0x39,
        OP_CMP_GvEv                     = 0x3B,
        OP_CMP_EAXIv                    = 0x3D,
        PRE_REX                         = 0x40,
        OP_PUSH_EAX                     = 0x50,
        OP_POP_EAX                      = 0x58,
        OP_MOVSXD_GvEv                  = 0x63,
        PRE_GS                          = 0x65,
        PRE_OPERAND_SIZE                = 0x66,
        PRE_SSE_66                      = 0x66,
        OP_PUSH_Iz                      = 0x68,
        OP_IMUL_GvEvIz                  = 0x69,
        OP_GROUP1_EbIb                  = 0x80,
        OP_GROUP1_EvIz                  = 0x81,
        OP_GROUP1_EvIb                  = 0x83,
        OP_TEST_EbGb                    = 0x84,
        OP_TEST_EvGv                    = 0x85,
        OP_XCHG_EvGb                    = 0x86,
        OP_XCHG_EvGv                    = 0x87,
        OP_MOV_EbGb                     = 0x88,
        OP_MOV_EvGv                     = 0x89,
        OP_MOV_GvEv                     = 0x8B,
        OP_LEA                          = 0x8D,
        OP_GROUP1A_Ev                   = 0x8F,
        OP_NOP                          = 0x90,
        OP_XCHG_EAX                     = 0x90,
        OP_PAUSE                        = 0x90,
        OP_CDQ                          = 0x99,
        OP_MOV_EAXOv                    = 0xA1,
        OP_MOV_OvEAX                    = 0xA3,
        OP_TEST_ALIb                    = 0xA8,
        OP_TEST_EAXIv                   = 0xA9,
        OP_MOV_EAXIv                    = 0xB8,
        OP_GROUP2_EvIb                  = 0xC1,
        OP_RET                          = 0xC3,
        OP_GROUP11_EvIb                 = 0xC6,
        OP_GROUP11_EvIz                 = 0xC7,
        OP_INT3                         = 0xCC,
        OP_GROUP2_Ev1                   = 0xD1,
        OP_GROUP2_EvCL                  = 0xD3,
        OP_ESCAPE_D9                    = 0xD9,
        OP_ESCAPE_DD                    = 0xDD,
        OP_CALL_rel32                   = 0xE8,
        OP_JMP_rel32                    = 0xE9,
        PRE_LOCK                        = 0xF0,
        PRE_SSE_F2                      = 0xF2,
        PRE_SSE_F3                      = 0xF3,
        OP_HLT                          = 0xF4,
        OP_GROUP3_Eb                    = 0xF6,
        OP_GROUP3_EbIb                  = 0xF6,
        OP_GROUP3_Ev                    = 0xF7,
        OP_GROUP3_EvIz                  = 0xF7, // OP_GROUP3_Ev has an immediate, when instruction is a test. 
        OP_GROUP5_Ev                    = 0xFF,
    } OneByteOpcodeID;

    typedef enum {
        OP2_UD2                         = 0xB,
        OP2_MOVSD_VsdWsd                = 0x10,
        OP2_MOVUPS_VsdWsd               = 0x10,
        OP2_MOVSS_VsdWsd                = 0x10,
        OP2_MOVSD_WsdVsd                = 0x11,
        OP2_MOVUPS_WsdVsd               = 0x11,
        OP2_MOVSS_WsdVsd                = 0x11,
        OP2_MOVDDUP_VqWq                = 0x12,
        OP2_MOVHLPS_VqUq                = 0x12,
        OP2_MOVSLDUP_VqWq               = 0x12,
        OP2_UNPCKLPD_VpdWpd             = 0x14,
        OP2_UNPCKHPD_VpdWpd             = 0x15,
        OP2_MOVSHDUP_VqWq               = 0x16,
        OP2_MOVAPD_VpdWpd               = 0x28,
        OP2_MOVAPS_VpsWps               = 0x28,
        OP2_MOVAPS_WpsVps               = 0x29,
        OP2_CVTSI2SS_VssEs              = 0x2A,
        OP2_CVTSI2SD_VsdEd              = 0x2A,
        OP2_CVTTSD2SI_GdWsd             = 0x2C,
        OP2_CVTTSS2SI_GdWsd             = 0x2C,
        OP2_UCOMISS_VssWss              = 0x2E,
        OP2_UCOMISD_VsdWsd              = 0x2E,
        OP2_RDTSC                       = 0x31,
        OP2_3BYTE_ESCAPE_38             = 0x38,
        OP2_3BYTE_ESCAPE_3A             = 0x3A,
        OP2_CMOVCC                      = 0x40,
        OP2_MOVMSKPD_VdEd               = 0x50,
        OP2_SQRTSD_VsdWsd               = 0x51,
        OP2_SQRTSS_VssWss               = 0x51,
        OP2_ANDPS_VpsWps                = 0x54,
        OP2_ANDPD_VpdWpd                = 0x54,
        OP2_ANDNPS_VpsWps               = 0x55,
        OP2_ANDNPD_VpdWpd               = 0x55,
        OP2_ORPS_VpsWps                 = 0x56,
        OP2_ORPD_VpdWpd                 = 0x56,
        OP2_XORPS_VpsWps                = 0x57,
        OP2_XORPD_VpdWpd                = 0x57,
        OP2_ADDSD_VsdWsd                = 0x58,
        OP2_MULSD_VsdWsd                = 0x59,
        OP2_CVTSD2SS_VsdWsd             = 0x5A,
        OP2_CVTPS2PD_VsdWsd             = 0x5A,
        OP2_CVTSS2SD_VsdWsd             = 0x5A,
        OP2_CVTPD2PS_VsdWsd             = 0x5A,
        OP2_CVTDQ2PS_VsdWsd             = 0x5B,
        OP2_SUBSD_VsdWsd                = 0x5C,
        OP2_MINPS_VpsWps                = 0x5D,
        OP2_MINPD_VpdWpd                = 0x5D,
        OP2_DIVSD_VsdWsd                = 0x5E,
        OP2_MAXPS_VpsWps                = 0x5F,
        OP2_MAXPD_VpdWpd                = 0x5F,
        OP2_PUNPCKLBW_VdqWdq            = 0x60,
        OP2_PACKSSWB_VdqWdq             = 0x63,
        OP2_PACKUSWB_VdqWdq             = 0x67,
        OP2_PUNPCKHBW_VdqWdq            = 0x68,
        OP2_PACKSSDW_VdqWdq             = 0x6B,
        OP2_PUNPCKLQDQ_VdqWdq           = 0x6C,
        OP2_MOVD_VdEd                   = 0x6E,
        OP2_MOVQ_PqQq                   = 0x6E,
        OP2_MOVDQA_VdqWdq               = 0x6F,
        OP2_PSHUFD_VdqWdqIb             = 0x70,
        OP2_PSHUFLW_VdqWdqIb            = 0x70,
        OP2_PSHUFHW_VdqWdqIb            = 0x70,
        OP2_PSLLW_UdqIb                 = 0x71,
        OP2_PSRLW_UdqIb                 = 0x71,
        OP2_PSRAW_UdqIb                 = 0x71,
        OP2_PSLLD_UdqIb                 = 0x72,
        OP2_PSRLD_UdqIb                 = 0x72,
        OP2_PSRAD_UdqIb                 = 0x72,
        OP2_PSLLQ_UdqIb                 = 0x73,
        OP2_PSRLQ_UdqIb                 = 0x73,
        OP2_VZEROUPPER                  = 0x77,
        OP2_MOVD_EdVd                   = 0x7E,
        OP2_MOVQ_QqPq                   = 0x7E,
        OP2_JCC_rel32                   = 0x80,
        OP_SETCC                        = 0x90,
        OP2_CPUID                       = 0xA2,
        OP2_BT_EvEv                     = 0xA3,
        OP2_3BYTE_ESCAPE_AE             = 0xAE,
        OP2_IMUL_GvEv                   = 0xAF,
        OP2_CMPXCHGb                    = 0xB0,
        OP2_CMPXCHG                     = 0xB1,
        OP2_BTR                         = 0xB3,
        OP2_MOVZX_GvEb                  = 0xB6,
        OP2_POPCNT                      = 0xB8,
        OP2_GROUP_BT_EvIb               = 0xBA,
        OP2_BSF                         = 0xBC,
        OP2_TZCNT                       = 0xBC,
        OP2_BSR                         = 0xBD,
        OP2_LZCNT                       = 0xBD,
        OP2_MOVSX_GvEb                  = 0xBE,
        OP2_MOVZX_GvEw                  = 0xB7,
        OP2_MOVSX_GvEw                  = 0xBF,
        OP2_XADDb                       = 0xC0,
        OP2_XADD                        = 0xC1,
        OP2_PINSRW_VdqRdqp              = 0xC4,
        OP2_PEXTRW_GdUdIb               = 0xC5,
        OP2_SHUFPD_VpdWpdIb             = 0xC6,
        OP2_SHUFPS_VpdWpdIb             = 0xC6,
        OP2_BSWAP                       = 0xC8,
        OP2_PSUBUSB_VdqWdq              = 0xD8,
        OP2_PSUBUSW_VdqWdq              = 0xD9,
        OP2_VPAND_VxHxWx                = 0xDB,
        OP2_PADDUSB_VdqWdq              = 0xDC,
        OP2_PADDUSW_VdqWdq              = 0xDD,
        OP2_PAVGB_VdqWdq                = 0xE0,
        OP2_PAVGW_VdqWdq                = 0xE3,
        OP2_CVTDQ2PD_VdqWdq             = 0xE6,
        OP2_CVTDPD2DQ_VdqWdq            = 0xE6,
        OP2_PSUBSB_VdqWdq               = 0xE8,
        OP2_PSUBSW_VdqWdq               = 0xE9,
        OP2_POR_VdqWdq                  = 0XEB,
        OP2_PADDSB_VdqWdq               = 0xEC,
        OP2_PADDSW_VdqWdq               = 0xED,
        OP2_PXOR_VdqWdq                 = 0xEF,
        OP2_PADDB_VdqWdq                = 0xFC,
        OP2_PADDW_VdqWdq                = 0xFD,
        OP2_PADDD_VdqWdq                = 0xFE,
        OP2_PADDQ_VdqWdq                = 0xD4,
        OP2_PSUBB_VdqWdq                = 0xF8,
        OP2_PSUBW_VdqWdq                = 0xF9,
        OP2_PSUBD_VdqWdq                = 0xFA,
        OP2_PSUBQ_VdqWdq                = 0xFB,
        OP2_PMULLW_VdqWdq               = 0xD5,
        OP2_PMOVMSKB_GdqpUdq            = 0xD7,
        OP2_ADDPS_VpsWps                = 0x58,
        OP2_ADDPD_VpdWpd                = 0x58,
        OP2_SUBPS_VpsWps                = 0x5C,
        OP2_SUBPD_VpdWpd                = 0x5C,
        OP2_MULPS_VpsWps                = 0x59,
        OP2_MULPD_VpdWpd                = 0x59,
        OP2_DIVPS_VpsWps                = 0x5E,
        OP2_DIVPD_VpdWpd                = 0x5E,
        OP2_DIVSS_VpsWps                = 0x5E,
        OP2_SQRTPS_VpsWps               = 0x51,
        OP2_SQRTPD_VpdWpd               = 0x51,
        OP2_PMADDWD_VdqWdq              = 0xF5,
        OP2_VPSLLD_VxHxWx               = 0x72,
        OP2_PCMPEQB_VdqWdq              = 0x74,
        OP2_PCMPEQW_VdqWdq              = 0x75,
        OP2_PCMPEQD_VdqWdq              = 0x76,
        OP2_PCMPGTB_VdqWdq              = 0x64,
        OP2_PCMPGTW_VdqWdq              = 0x65,
        OP2_PCMPGTD_VdqWdq              = 0x66,
        OP2_CMPPS_VpsWpsIb              = 0xC2,
        OP2_CMPPD_VpdWpdIb              = 0xC2,
        OP2_PMAXSW_VdqWdq               = 0xEE,
        OP2_PMAXUB_VdqWdq               = 0xDE,
        OP2_PMINSW_VdqWdq               = 0xEA,
        OP2_PMINUB_VdqWdq               = 0xDA,
        OP2_PSRLW_VdqWdq                = 0xD1,
        OP2_PSRLD_VdqWdq                = 0xD2,
        OP2_PSRLQ_VdqWdq                = 0xD3,
        OP2_PSRAW_VdqWdq                = 0xE1,
        OP2_PSRAD_VdqWdq                = 0xE2,
        OP2_PSLLW_VdqWdq                = 0xF1,
        OP2_PSLLD_VdqWdq                = 0xF2,
        OP2_PSLLQ_VdqWdq                = 0xF3,
        OP2_PMOVMSKB_EqWdq              = 0xD7,
        OP2_MOVMSKPS_EqWps              = 0x50,
        OP2_MOVMSKPD_EqWpd              = 0x50,
    } TwoByteOpcodeID;
    
    typedef enum {
        OP3_PSHUFB_VdqWdq       = 0x00,
        OP3_PMADDUBSW_VpdWpd    = 0x04,
        OP3_ROUNDPD_MbVdqIb     = 0x09,
        OP3_ROUNDSS_VssWssIb    = 0x0A,
        OP3_ROUNDSD_VsdWsdIb    = 0x0B,
        OP3_VPBLENDW_VxHxWxIb   = 0x0E,
        OP3_PEXTRB_MbVdqIb      = 0x14,
        OP3_PEXTRW_MwVdqIb      = 0x15,
        OP3_PEXTRD_EyVdqIb      = 0x16,
        OP3_PEXTRQ_EyVdqIb      = 0x16,
        OP3_EXTRACTPS_EdVdqIb   = 0x17,
        OP3_VBROADCASTSS_VxWd   = 0x18,
        OP3_VPMOVSXBW_VxUx      = 0x20,
        OP3_PABSB_VdqWdq        = 0x1C,
        OP3_PABSW_VdqWdq        = 0x1D,
        OP3_PABSD_VdqWdq        = 0x1E,
        OP3_INSERTPS_VpsUpsIb   = 0x21,
        OP3_PINSRB_VdqRdqpIb    = 0x20,
        OP3_PINSRD_VdqEdIb      = 0x22,
        OP3_PINSRQ_VdqEqbIb     = 0x22,
        OP3_VPMOVSXWD_VxUx      = 0x23,
        OP3_VPMOVSXDQ_VxUx      = 0x25,
        OP3_VPACKUSDW_VxHxWx    = 0x2B,
        OP3_VPMOVZXBW_VxUx      = 0x30,
        OP3_VPMOVZXWD_VxUx      = 0x33,
        OP3_VPMOVZXDQ_VxUx      = 0x35,
        OP3_BLENDVPD_VpdWpdXMM0 = 0x4B,
        OP3_LFENCE              = 0xE8,
        OP3_MFENCE              = 0xF0,
        OP3_SFENCE              = 0xF8,
        OP3_ROUNDPS_VpsWpsIb    = 0x08,
        OP3_ROUNDPD_VpdWpdIb    = 0x09,
        OP3_PMULLD_VdqWdq       = 0x40,
        OP3_PCMPEQQ_VdqWdq      = 0x29,
        OP3_PCMPGTQ_VdqWdq      = 0x37,
        OP3_PMINSB_VdqWdq       = 0x38,
        OP3_PMINSD_VdqWdq       = 0x39,
        OP3_PMINUW_VdqWdq       = 0x3A,
        OP3_PMINUD_VdqWdq       = 0x3B,
        OP3_PMAXSB_VdqWdq       = 0x3C,
        OP3_PMAXSD_VdqWdq       = 0x3D,
        OP3_PMAXUW_VdqWdq       = 0x3E,
        OP3_PMAXUD_VdqWdq       = 0x3F,
        OP3_PTEST_VdqWdq        = 0x17,
    } ThreeByteOpcodeID;

    enum class VexPrefix : uint8_t {
        TwoBytes = 0xC5,
        ThreeBytes = 0xC4,
    };

    // Bits[4:0] of the 3-byte VEX byte 1 encode an implied leading opcode byte (0F, 0F 38, or 0F 3A).
    // Several bits are reserved for future use and will #UD unless 0.
    enum class VexImpliedBytes : uint8_t {
        TwoBytesOp     = 0b01,   // 0F
        ThreeBytesOp38 = 0b10,   // 0F 38
        ThreeBytesOp3A = 0b11,   // 0F 3A
    };

    enum class VexW : uint8_t {
        W0 = 0,
        W1 = 1,
    };
    
    TwoByteOpcodeID cmovcc(Condition cond)
    {
        return (TwoByteOpcodeID)(OP2_CMOVCC + static_cast<TwoByteOpcodeID>(cond));
    }

    TwoByteOpcodeID jccRel32(Condition cond)
    {
        return (TwoByteOpcodeID)(OP2_JCC_rel32 + static_cast<TwoByteOpcodeID>(cond));
    }

    TwoByteOpcodeID setccOpcode(Condition cond)
    {
        return (TwoByteOpcodeID)(OP_SETCC + static_cast<TwoByteOpcodeID>(cond));
    }

    typedef enum {
        GROUP1_OP_ADD = 0,
        GROUP1_OP_OR  = 1,
        GROUP1_OP_ADC = 2,
        GROUP1_OP_AND = 4,
        GROUP1_OP_SUB = 5,
        GROUP1_OP_XOR = 6,
        GROUP1_OP_CMP = 7,

        GROUP1A_OP_POP = 0,
        
        GROUP2_OP_ROL = 0,
        GROUP2_OP_ROR = 1,
        GROUP2_OP_RCL = 2,
        GROUP2_OP_RCR = 3,
        
        GROUP2_OP_SHL = 4,
        GROUP2_OP_SHR = 5,
        GROUP2_OP_SAR = 7,

        GROUP3_OP_TEST = 0,
        GROUP3_OP_NOT  = 2,
        GROUP3_OP_NEG  = 3,
        GROUP3_OP_DIV = 6,
        GROUP3_OP_IDIV = 7,

        GROUP5_OP_CALLN = 2,
        GROUP5_OP_JMPN  = 4,
        GROUP5_OP_PUSH  = 6,

        GROUP11_MOV = 0,

        GROUP14_OP_PSLLD = 6,
        GROUP14_OP_PSLLQ = 6,
        GROUP14_OP_PSRAQ = 4,
        GROUP14_OP_PSRLQ = 2,

        ESCAPE_D9_FSTP_singleReal = 3,
        ESCAPE_DD_FSTP_doubleReal = 3,

        GROUP_BT_OP_BT = 4,
    } GroupOpcodeID;
    
    class X86InstructionFormatter;
public:

    X86Assembler()
        : m_indexOfLastWatchpoint(INT_MIN)
        , m_indexOfTailOfLastWatchpoint(INT_MIN)
    {
    }
    
    AssemblerBuffer& buffer() { return m_formatter.m_buffer; }

    // Stack operations:

    void push_r(RegisterID reg)
    {
        m_formatter.oneByteOp(OP_PUSH_EAX, reg);
    }

    void pop_r(RegisterID reg)
    {
        m_formatter.oneByteOp(OP_POP_EAX, reg);
    }

    void push_i32(int imm)
    {
        m_formatter.oneByteOp(OP_PUSH_Iz);
        m_formatter.immediate32(imm);
    }

    void push_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP5_OP_PUSH, base, offset);
    }

    void pop_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP1A_Ev, GROUP1A_OP_POP, base, offset);
    }

    // Arithmetic operations:

    void addl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_ADD_EvGv, src, dst);
    }

    void addl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_ADD_GvEv, dst, base, offset);
    }
    
    void addl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_ADD_GvEv, dst, base, index, scale, offset);
    }
    
    void addl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_ADD_EvGv, src, base, offset);
    }

    void addl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_ADD_EvGv, src, base, index, scale, offset);
    }

    void addb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp8(OP_ADD_EbGb, src, base, offset);
    }

    void addb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp8(OP_ADD_EbGb, src, base, index, scale, offset);
    }

    void addw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp8(OP_ADD_EvGv, src, base, offset);
    }

    void addw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp8(OP_ADD_EvGv, src, base, index, scale, offset);
    }

    void addl_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_ADD, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp(OP_ADD_EAXIv);
            else
                m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_ADD, dst);
            m_formatter.immediate32(imm);
        }
    }

    void addl_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_ADD, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_ADD, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void addl_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_ADD, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_ADD, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void addb_im(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp8(OP_GROUP1_EbIb, GROUP1_OP_ADD, base, offset);
        m_formatter.immediate8(imm);
    }

    void addb_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp8(OP_GROUP1_EbIb, GROUP1_OP_ADD, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }

    void addw_im(int imm, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp8(OP_GROUP1_EvIb, GROUP1_OP_ADD, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp8(OP_GROUP1_EvIz, GROUP1_OP_ADD, base, offset);
            m_formatter.immediate16(imm);
        }
    }

    void addw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp8(OP_GROUP1_EvIb, GROUP1_OP_ADD, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp8(OP_GROUP1_EvIz, GROUP1_OP_ADD, base, index, scale, offset);
            m_formatter.immediate16(imm);
        }
    }

    void addq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_ADD_EvGv, src, dst);
    }

    void addq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_ADD_GvEv, dst, base, offset);
    }

    void addq_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_ADD_GvEv, dst, base, index, scale, offset);
    }

    void addq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_ADD_EvGv, src, base, offset);
    }

    void addq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_ADD_EvGv, src, base, index, scale, offset);
    }

    void addq_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_ADD, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp64(OP_ADD_EAXIv);
            else
                m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_ADD, dst);
            m_formatter.immediate32(imm);
        }
    }

    void addq_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_ADD, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_ADD, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void addq_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_ADD, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_ADD, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void andl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_AND_EvGv, src, dst);
    }

    void andl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_AND_GvEv, dst, base, offset);
    }

    void andl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_AND_GvEv, dst, base, index, scale, offset);
    }

    void andw_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        andl_mr(offset, base, dst);
    }

    void andw_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        andl_mr(offset, base, index, scale, dst);
    }

    void andl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_AND_EvGv, src, base, offset);
    }

    void andl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_AND_EvGv, src, base, index, scale, offset);
    }

    void andw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        andl_rm(src, offset, base);
    }

    void andw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        andl_rm(src, offset, base, index, scale);
    }

    void andb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_AND_EvGb, src, base, offset);
    }

    void andb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_AND_EvGb, src, base, index, scale, offset);
    }

    void andl_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_AND, dst);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_AND, dst);
            m_formatter.immediate32(imm);
        }
    }

    void andl_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_AND, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_AND, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void andl_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_AND, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_AND, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void andw_im(int imm, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_AND, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_AND, base, offset);
            m_formatter.immediate16(imm);
        }
    }

    void andw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_AND, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_AND, base, index, scale, offset);
            m_formatter.immediate16(imm);
        }
    }

    void andb_im(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_AND, base, offset);
        m_formatter.immediate8(imm);
    }

    void andb_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_AND, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }

    void andq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_AND_EvGv, src, dst);
    }

    void andq_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_AND, dst);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_AND, dst);
            m_formatter.immediate32(imm);
        }
    }

    void andq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_AND_GvEv, dst, base, offset);
    }

    void andq_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_AND_GvEv, dst, base, index, scale, offset);
    }

    void andq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_AND_EvGv, src, base, offset);
    }

    void andq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_AND_EvGv, src, base, index, scale, offset);
    }

    void andq_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_AND, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_AND, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void andq_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_AND, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_AND, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void dec_r(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP1_OP_OR, dst);
    }

    void decq_r(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP5_Ev, GROUP1_OP_OR, dst);
    }

    // Only used for testing purposes.
    void illegalInstruction()
    {
        m_formatter.twoByteOp(OP2_UD2);
    }

    void inc_r(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP1_OP_ADD, dst);
    }

    void incq_r(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP5_Ev, GROUP1_OP_ADD, dst);
    }

    void incq_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_GROUP5_Ev, GROUP1_OP_ADD, base, offset);
    }

    void incq_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_GROUP5_Ev, GROUP1_OP_ADD, base, index, scale, offset);
    }

    void negl_r(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_NEG, dst);
    }

    void negq_r(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_NEG, dst);
    }

    void negq_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_NEG, base, offset);
    }

    void negq_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_NEG, base, index, scale, offset);
    }

    void negl_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_NEG, base, offset);
    }

    void negl_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_NEG, base, index, scale, offset);
    }

    void negw_m(int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        negl_m(offset, base);
    }

    void negw_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        negl_m(offset, base, index, scale);
    }

    void negb_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP3_Eb, GROUP3_OP_NEG, base, offset);
    }

    void negb_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP3_Eb, GROUP3_OP_NEG, base, index, scale, offset);
    }

    void notl_r(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_NOT, dst);
    }

    void notl_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_NOT, base, offset);
    }

    void notl_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_NOT, base, index, scale, offset);
    }

    void notw_m(int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        notl_m(offset, base);
    }

    void notw_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        notl_m(offset, base, index, scale);
    }

    void notb_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP3_Eb, GROUP3_OP_NOT, base, offset);
    }

    void notb_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP3_Eb, GROUP3_OP_NOT, base, index, scale, offset);
    }

    void notq_r(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_NOT, dst);
    }

    void notq_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_NOT, base, offset);
    }

    void notq_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_NOT, base, index, scale, offset);
    }

    void orl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_OR_EvGv, src, dst);
    }

    void orl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_OR_GvEv, dst, base, offset);
    }

    void orl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_OR_GvEv, dst, base, index, scale, offset);
    }

    void orl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_OR_EvGv, src, base, offset);
    }

    void orl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_OR_EvGv, src, base, index, scale, offset);
    }

    void orw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        orl_rm(src, offset, base);
    }

    void orw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        orl_rm(src, offset, base, index, scale);
    }

    void orb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_OR_EvGb, src, base, offset);
    }

    void orb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_OR_EvGb, src, base, index, scale, offset);
    }

    void orl_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_OR, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp(OP_OR_EAXIv);
            else
                m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_OR, dst);
            m_formatter.immediate32(imm);
        }
    }

    void orl_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_OR, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_OR, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void orl_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_OR, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_OR, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void orw_im(int imm, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_OR, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_OR, base, offset);
            m_formatter.immediate16(imm);
        }
    }

    void orw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_OR, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_OR, base, index, scale, offset);
            m_formatter.immediate16(imm);
        }
    }

    void orb_im(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_OR, base, offset);
        m_formatter.immediate8(imm);
    }

    void orb_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_OR, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }

    void orq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_OR_EvGv, src, dst);
    }

    void orq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_OR_GvEv, dst, base, offset);
    }

    void orq_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_OR_GvEv, dst, base, index, scale, offset);
    }

    void orq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_OR_EvGv, src, base, offset);
    }

    void orq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_OR_EvGv, src, base, index, scale, offset);
    }

    void orq_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_OR, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_OR, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void orq_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_OR, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_OR, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void orq_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_OR, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp64(OP_OR_EAXIv);
            else
                m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_OR, dst);
            m_formatter.immediate32(imm);
        }
    }

    void subl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_SUB_EvGv, src, dst);
    }

    void subl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_SUB_GvEv, dst, base, offset);
    }

    void subl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_SUB_GvEv, dst, base, index, scale, offset);
    }

    void subl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_SUB_EvGv, src, base, offset);
    }

    void subl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_SUB_EvGv, src, base, index, scale, offset);
    }

    void subw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_SUB_EvGv, src, base, offset);
    }

    void subw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_SUB_EvGv, src, base, index, scale, offset);
    }

    void subb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_SUB_EvGb, src, base, offset);
    }

    void subb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_SUB_EvGb, src, base, index, scale, offset);
    }

    void subl_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_SUB, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp(OP_SUB_EAXIv);
            else
                m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_SUB, dst);
            m_formatter.immediate32(imm);
        }
    }
    
    void subl_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_SUB, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_SUB, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void subl_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_SUB, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_SUB, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void subw_im(int imm, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_SUB, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_SUB, base, offset);
            m_formatter.immediate16(imm);
        }
    }

    void subw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_SUB, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_SUB, base, index, scale, offset);
            m_formatter.immediate16(imm);
        }
    }

    void subb_im(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_SUB, base, offset);
        m_formatter.immediate8(imm);
    }

    void subb_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_SUB, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }

    void subq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_SUB_EvGv, src, dst);
    }

    void subq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_SUB_GvEv, dst, base, offset);
    }

    void subq_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_SUB_GvEv, dst, base, index, scale, offset);
    }

    void subq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_SUB_EvGv, src, base, offset);
    }

    void subq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_SUB_EvGv, src, base, index, scale, offset);
    }

    void subq_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_SUB, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp64(OP_SUB_EAXIv);
            else
                m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_SUB, dst);
            m_formatter.immediate32(imm);
        }
    }

    void subq_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_SUB, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_SUB, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void subq_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_SUB, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_SUB, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void xorl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_XOR_EvGv, src, dst);
    }

    void xorl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_XOR_GvEv, dst, base, offset);
    }

    void xorl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_XOR_GvEv, dst, base, index, scale, offset);
    }

    void xorl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_XOR_EvGv, src, base, offset);
    }

    void xorl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_XOR_EvGv, src, base, index, scale, offset);
    }

    void xorl_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_XOR, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_XOR, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void xorl_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_XOR, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_XOR, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void xorw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        xorl_rm(src, offset, base);
    }

    void xorw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        xorl_rm(src, offset, base, index, scale);
    }

    void xorw_im(int imm, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_XOR, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_XOR, base, offset);
            m_formatter.immediate16(imm);
        }
    }

    void xorw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_XOR, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_XOR, base, index, scale, offset);
            m_formatter.immediate16(imm);
        }
    }

    void xorb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_XOR_EvGb, src, base, offset);
    }

    void xorb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_XOR_EvGb, src, base, index, scale, offset);
    }

    void xorb_im(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_XOR, base, offset);
        m_formatter.immediate8(imm);
    }

    void xorb_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_XOR, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }

    void xorl_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_XOR, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp(OP_XOR_EAXIv);
            else
                m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_XOR, dst);
            m_formatter.immediate32(imm);
        }
    }

    void xorq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_XOR_EvGv, src, dst);
    }

    void xorq_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_XOR, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp64(OP_XOR_EAXIv);
            else
                m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_XOR, dst);
            m_formatter.immediate32(imm);
        }
    }
    
    void xorq_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_XOR, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_XOR, base, offset);
            m_formatter.immediate32(imm);
        }
    }
    
    void xorq_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_XOR, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_XOR, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }
    
    void xorq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_XOR_EvGv, src, base, offset);
    }

    void xorq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_XOR_EvGv, src, base, index, scale, offset);
    }

    void xorq_mr(int offset, RegisterID base, RegisterID dest)
    {
        m_formatter.oneByteOp64(OP_XOR_GvEv, dest, base, offset);
    }

    void xorq_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dest)
    {
        m_formatter.oneByteOp64(OP_XOR_GvEv, dest, base, index, scale, offset);
    }

    void lzcnt_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_LZCNT, dst, src);
    }

    void lzcnt_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_LZCNT, dst, base, offset);
    }

    void lzcntq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_LZCNT, dst, src);
    }

    void lzcntq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_LZCNT, dst, base, offset);
    }

    void bsr_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_BSR, dst, src);
    }

    void bsr_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_BSR, dst, base, offset);
    }

    void bsrq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_BSR, dst, src);
    }

    void bsrq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_BSR, dst, base, offset);
    }

    void bswapl_r(RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_BSWAP, dst);
    }

    void bswapq_r(RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_BSWAP, dst);
    }

    void tzcnt_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_TZCNT, dst, src);
    }

    void tzcntq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_TZCNT, dst, src);
    }

    void bsf_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_BSF, dst, src);
    }

    void bsfq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_BSF, dst, src);
    }

    void btrq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_BTR, dst, src);
    }

    void popcnt_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_POPCNT, dst, src);
    }

    void popcnt_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_POPCNT, dst, base, offset);
    }

    void popcntq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_POPCNT, dst, src);
    }

    void popcntq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_POPCNT, dst, base, offset);
    }

private:
    template<GroupOpcodeID op>
    void shiftInstruction32(int imm, RegisterID dst)
    {
        if (imm == 1)
            m_formatter.oneByteOp(OP_GROUP2_Ev1, op, dst);
        else {
            m_formatter.oneByteOp(OP_GROUP2_EvIb, op, dst);
            m_formatter.immediate8(imm & 31);
        }
    }

    template<GroupOpcodeID op>
    void shiftInstruction16(int imm, RegisterID dst)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        if (imm == 1)
            m_formatter.oneByteOp(OP_GROUP2_Ev1, op, dst);
        else {
            m_formatter.oneByteOp(OP_GROUP2_EvIb, op, dst);
            m_formatter.immediate8(imm);
        }
    }
public:

    void sarl_i8r(int imm, RegisterID dst)
    {
        shiftInstruction32<GROUP2_OP_SAR>(imm, dst);
    }

    void sarl_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP2_EvCL, GROUP2_OP_SAR, dst);
    }
    
    void shrl_i8r(int imm, RegisterID dst)
    {
        shiftInstruction32<GROUP2_OP_SHR>(imm, dst);
    }
    
    void shrl_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP2_EvCL, GROUP2_OP_SHR, dst);
    }

    void shll_i8r(int imm, RegisterID dst)
    {
        shiftInstruction32<GROUP2_OP_SHL>(imm, dst);
    }

    void shll_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP2_EvCL, GROUP2_OP_SHL, dst);
    }

    void rorl_i8r(int imm, RegisterID dst)
    {
        shiftInstruction32<GROUP2_OP_ROR>(imm, dst);
    }

    void rorl_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP2_EvCL, GROUP2_OP_ROR, dst);
    }

    void roll_i8r(int imm, RegisterID dst)
    {
        shiftInstruction32<GROUP2_OP_ROL>(imm, dst);
    }

    void roll_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP2_EvCL, GROUP2_OP_ROL, dst);
    }

    void rolw_i8r(int imm, RegisterID dst)
    {
        shiftInstruction16<GROUP2_OP_ROL>(imm, dst);
    }

private:
    template<GroupOpcodeID op>
    void shiftInstruction64(int imm, RegisterID dst)
    {
        if (imm == 1)
            m_formatter.oneByteOp64(OP_GROUP2_Ev1, op, dst);
        else {
            m_formatter.oneByteOp64(OP_GROUP2_EvIb, op, dst);
            m_formatter.immediate8(imm & 63);
        }
    }
public:
    void sarq_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP2_EvCL, GROUP2_OP_SAR, dst);
    }

    void sarq_i8r(int imm, RegisterID dst)
    {
        shiftInstruction64<GROUP2_OP_SAR>(imm, dst);
    }

    void shrq_i8r(int imm, RegisterID dst)
    {
        shiftInstruction64<GROUP2_OP_SHR>(imm, dst);
    }

    void shrq_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP2_EvCL, GROUP2_OP_SHR, dst);
    }

    void shlq_i8r(int imm, RegisterID dst)
    {
        shiftInstruction64<GROUP2_OP_SHL>(imm, dst);
    }

    void shlq_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP2_EvCL, GROUP2_OP_SHL, dst);
    }

    void rorq_i8r(int imm, RegisterID dst)
    {
        shiftInstruction64<GROUP2_OP_ROR>(imm, dst);
    }

    void rorq_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP2_EvCL, GROUP2_OP_ROR, dst);
    }

    void rolq_i8r(int imm, RegisterID dst)
    {
        shiftInstruction64<GROUP2_OP_ROL>(imm, dst);
    }

    void rolq_CLr(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP2_EvCL, GROUP2_OP_ROL, dst);
    }

    void imull_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_IMUL_GvEv, dst, src);
    }

    void imulq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_IMUL_GvEv, dst, src);
    }

    void imull_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_IMUL_GvEv, dst, base, offset);
    }

    void imull_i32r(RegisterID src, int32_t value, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_IMUL_GvEvIz, dst, src);
        m_formatter.immediate32(value);
    }

    void divl_r(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_DIV, dst);
    }

    void idivl_r(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP3_Ev, GROUP3_OP_IDIV, dst);
    }

    void divq_r(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_DIV, dst);
    }

    void idivq_r(RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP3_Ev, GROUP3_OP_IDIV, dst);
    }

    // Comparisons:

    void cmpl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_CMP_EvGv, src, dst);
    }

    void cmpl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_CMP_EvGv, src, base, offset);
    }

    void cmpl_mr(int offset, RegisterID base, RegisterID src)
    {
        m_formatter.oneByteOp(OP_CMP_GvEv, src, base, offset);
    }

    void cmpl_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_CMP, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp(OP_CMP_EAXIv);
            else
                m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, dst);
            m_formatter.immediate32(imm);
        }
    }

    void cmpl_ir_force32(int imm, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, dst);
        m_formatter.immediate32(imm);
    }
    
    void cmpl_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_CMP, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, base, offset);
            m_formatter.immediate32(imm);
        }
    }
    
    void cmpb_im(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_CMP, base, offset);
        m_formatter.immediate8(imm);
    }
    
    void cmpb_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP1_EbIb, GROUP1_OP_CMP, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }
    
    void cmpl_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_CMP, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void cmpl_im_force32(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, base, offset);
        m_formatter.immediate32(imm);
    }

    void cmpq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_CMP_EvGv, src, dst);
    }

    void cmpq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_CMP_EvGv, src, base, offset);
    }

    void cmpq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_CMP_EvGv, src, base, index, scale, offset);
    }

    void cmpq_mr(int offset, RegisterID base, RegisterID src)
    {
        m_formatter.oneByteOp64(OP_CMP_GvEv, src, base, offset);
    }

    void cmpq_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_CMP, dst);
            m_formatter.immediate8(imm);
        } else {
            if (dst == X86Registers::eax)
                m_formatter.oneByteOp64(OP_CMP_EAXIv);
            else
                m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_CMP, dst);
            m_formatter.immediate32(imm);
        }
    }

    void cmpq_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_CMP, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_CMP, base, offset);
            m_formatter.immediate32(imm);
        }
    }

    void cmpq_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.oneByteOp64(OP_GROUP1_EvIb, GROUP1_OP_CMP, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.oneByteOp64(OP_GROUP1_EvIz, GROUP1_OP_CMP, base, index, scale, offset);
            m_formatter.immediate32(imm);
        }
    }

    void cmpw_ir(int imm, RegisterID dst)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.prefix(PRE_OPERAND_SIZE);
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_CMP, dst);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.prefix(PRE_OPERAND_SIZE);
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, dst);
            m_formatter.immediate16(imm);
        }
    }

    void cmpw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_CMP_EvGv, src, base, index, scale, offset);
    }

    void cmpw_im(int imm, int offset, RegisterID base)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.prefix(PRE_OPERAND_SIZE);
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_CMP, base, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.prefix(PRE_OPERAND_SIZE);
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, base, offset);
            m_formatter.immediate16(imm);
        }
    }

    void cmpw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        if (CAN_SIGN_EXTEND_8_32(imm)) {
            m_formatter.prefix(PRE_OPERAND_SIZE);
            m_formatter.oneByteOp(OP_GROUP1_EvIb, GROUP1_OP_CMP, base, index, scale, offset);
            m_formatter.immediate8(imm);
        } else {
            m_formatter.prefix(PRE_OPERAND_SIZE);
            m_formatter.oneByteOp(OP_GROUP1_EvIz, GROUP1_OP_CMP, base, index, scale, offset);
            m_formatter.immediate16(imm);
        }
    }

    void testl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_TEST_EvGv, src, dst);
    }
    
    void testl_i32r(int imm, RegisterID dst)
    {
        if (dst == X86Registers::eax)
            m_formatter.oneByteOp(OP_TEST_EAXIv);
        else
            m_formatter.oneByteOp(OP_GROUP3_EvIz, GROUP3_OP_TEST, dst);
        m_formatter.immediate32(imm);
    }

    void testl_i32m(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP3_EvIz, GROUP3_OP_TEST, base, offset);
        m_formatter.immediate32(imm);
    }

    void testb_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp8(OP_TEST_EbGb, src, dst);
    }

    void testb_im(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP3_EbIb, GROUP3_OP_TEST, base, offset);
        m_formatter.immediate8(imm);
    }
    
    void testb_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP3_EbIb, GROUP3_OP_TEST, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }

    void testl_i32m(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP3_EvIz, GROUP3_OP_TEST, base, index, scale, offset);
        m_formatter.immediate32(imm);
    }

    void testq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_TEST_EvGv, src, dst);
    }

    void testq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_TEST_EvGv, src, base, offset);
    }

    void testq_i32r(int imm, RegisterID dst)
    {
        if (dst == X86Registers::eax)
            m_formatter.oneByteOp64(OP_TEST_EAXIv);
        else
            m_formatter.oneByteOp64(OP_GROUP3_EvIz, GROUP3_OP_TEST, dst);
        m_formatter.immediate32(imm);
    }

    void testq_i32m(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_GROUP3_EvIz, GROUP3_OP_TEST, base, offset);
        m_formatter.immediate32(imm);
    }

    void testq_i32m(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_GROUP3_EvIz, GROUP3_OP_TEST, base, index, scale, offset);
        m_formatter.immediate32(imm);
    }

    void testw_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_TEST_EvGv, src, dst);
    }

    void testw_im(int imm, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_GROUP3_EvIz, GROUP3_OP_TEST, base, offset);
        m_formatter.immediate16(imm);
    }

    void testw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_GROUP3_EvIz, GROUP3_OP_TEST, base, index, scale, offset);
        m_formatter.immediate16(imm);
    }

    void testb_i8r(int imm, RegisterID dst)
    {
        if (dst == X86Registers::eax)
            m_formatter.oneByteOp(OP_TEST_ALIb);
        else
            m_formatter.oneByteOp8(OP_GROUP3_EbIb, GROUP3_OP_TEST, dst);
        m_formatter.immediate8(imm);
    }

    void bt_ir(int bitOffset, RegisterID testValue)
    {
        ASSERT(-128 <= bitOffset && bitOffset < 128);
        m_formatter.twoByteOp(OP2_GROUP_BT_EvIb, GROUP_BT_OP_BT, testValue);
        m_formatter.immediate8(bitOffset);
    }

    void bt_im(int bitOffset, int offset, RegisterID base)
    {
        ASSERT(-128 <= bitOffset && bitOffset < 128);
        m_formatter.twoByteOp(OP2_GROUP_BT_EvIb, GROUP_BT_OP_BT, base, offset);
        m_formatter.immediate8(bitOffset);
    }

    void bt_ir(RegisterID bitOffset, RegisterID testValue)
    {
        m_formatter.twoByteOp(OP2_BT_EvEv, bitOffset, testValue);
    }

    void bt_im(RegisterID bitOffset, int offset, RegisterID base)
    {
        m_formatter.twoByteOp(OP2_BT_EvEv, bitOffset, base, offset);
    }

    void btw_ir(int bitOffset, RegisterID testValue)
    {
        ASSERT(-128 <= bitOffset && bitOffset < 128);
        m_formatter.twoByteOp64(OP2_GROUP_BT_EvIb, GROUP_BT_OP_BT, testValue);
        m_formatter.immediate8(bitOffset);
    }

    void btw_im(int bitOffset, int offset, RegisterID base)
    {
        ASSERT(-128 <= bitOffset && bitOffset < 128);
        m_formatter.twoByteOp64(OP2_GROUP_BT_EvIb, GROUP_BT_OP_BT, base, offset);
        m_formatter.immediate8(bitOffset);
    }

    void btw_ir(RegisterID bitOffset, RegisterID testValue)
    {
        m_formatter.twoByteOp64(OP2_BT_EvEv, bitOffset, testValue);
    }

    void btw_im(RegisterID bitOffset, int offset, RegisterID base)
    {
        m_formatter.twoByteOp64(OP2_BT_EvEv, bitOffset, base, offset);
    }

    void setCC_r(Condition cond, RegisterID dst)
    {
        m_formatter.twoByteOp8(setccOpcode(cond), (GroupOpcodeID)0, dst);
    }

    void sete_r(RegisterID dst)
    {
        m_formatter.twoByteOp8(setccOpcode(ConditionE), (GroupOpcodeID)0, dst);
    }

    void setz_r(RegisterID dst)
    {
        sete_r(dst);
    }

    void setne_r(RegisterID dst)
    {
        m_formatter.twoByteOp8(setccOpcode(ConditionNE), (GroupOpcodeID)0, dst);
    }

    void setnz_r(RegisterID dst)
    {
        setne_r(dst);
    }

    void setnp_r(RegisterID dst)
    {
        m_formatter.twoByteOp8(setccOpcode(ConditionNP), (GroupOpcodeID)0, dst);
    }

    void setp_r(RegisterID dst)
    {
        m_formatter.twoByteOp8(setccOpcode(ConditionP), (GroupOpcodeID)0, dst);
    }

    // Various move ops:

    void cdq()
    {
        m_formatter.oneByteOp(OP_CDQ);
    }

    void cqo()
    {
        m_formatter.oneByteOp64(OP_CDQ);
    }

    void fstps(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_ESCAPE_D9, ESCAPE_D9_FSTP_singleReal, base, offset);
    }

    void fstpl(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_ESCAPE_DD, ESCAPE_DD_FSTP_doubleReal, base, offset);
    }

    void xchgl_rr(RegisterID src, RegisterID dst)
    {
        if (src == X86Registers::eax)
            m_formatter.oneByteOp(OP_XCHG_EAX, dst);
        else if (dst == X86Registers::eax)
            m_formatter.oneByteOp(OP_XCHG_EAX, src);
        else
            m_formatter.oneByteOp(OP_XCHG_EvGv, src, dst);
    }

    void xchgb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp8(OP_XCHG_EvGb, src, base, offset);
    }

    void xchgb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp8(OP_XCHG_EvGb, src, base, index, scale, offset);
    }

    void xchgw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_XCHG_EvGv, src, base, offset);
    }

    void xchgw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_XCHG_EvGv, src, base, index, scale, offset);
    }

    void xchgl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_XCHG_EvGv, src, base, offset);
    }

    void xchgl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_XCHG_EvGv, src, base, index, scale, offset);
    }

    void xchgq_rr(RegisterID src, RegisterID dst)
    {
        if (src == X86Registers::eax)
            m_formatter.oneByteOp64(OP_XCHG_EAX, dst);
        else if (dst == X86Registers::eax)
            m_formatter.oneByteOp64(OP_XCHG_EAX, src);
        else
            m_formatter.oneByteOp64(OP_XCHG_EvGv, src, dst);
    }

    void xchgq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_XCHG_EvGv, src, base, offset);
    }

    void xchgq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_XCHG_EvGv, src, base, index, scale, offset);
    }

    void pinsrb_i8rr(uint8_t laneIndex, RegisterID rn, XMMRegisterID vd)
    {
        ASSERT(laneIndex < 16);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // 66 0F 3A 20 /r ib PINSRB xmm1, r32/m8, imm8
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_PINSRB_VdqRdqpIb, (RegisterID)vd, rn);
        m_formatter.immediate8((uint8_t)laneIndex);
    }

    void pinsrw_i8rr(uint8_t laneIndex, RegisterID rn, XMMRegisterID vd)
    {
        ASSERT(laneIndex < 8);
        // https://www.felixcloutier.com/x86/pinsrw
        // 66 0F C4 /r ib PINSRW xmm, r32/m16, imm8
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PINSRW_VdqRdqp, (RegisterID)vd, rn);
        m_formatter.immediate8((uint8_t)laneIndex);
    }

    void pinsrd_i8rr(uint8_t laneIndex, RegisterID rn, XMMRegisterID vd)
    {
        ASSERT(laneIndex < 4);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // 66 0F 3A 22 /r ib PINSRD xmm1, r/m32, imm8
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_PINSRD_VdqEdIb, (RegisterID)vd, rn);
        m_formatter.immediate8((uint8_t)laneIndex);
    }

    void pinsrq_i8rr(uint8_t laneIndex, RegisterID rn, XMMRegisterID vd)
    {
        ASSERT(laneIndex < 2);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // 66 REX.W 0F 3A 22 /r ib PINSRQ xmm1, r/m64, imm8
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp64(OP2_3BYTE_ESCAPE_3A, OP3_PINSRQ_VdqEqbIb, (RegisterID)vd, rn);
        m_formatter.immediate8((uint8_t)laneIndex);
    }

    void insertps_i8rr(uint8_t laneIndex, XMMRegisterID rn, XMMRegisterID vd)
    {
        ASSERT(laneIndex < 4);
        // https://www.felixcloutier.com/x86/insertps
        // 66 0F 3A 21 /r ib INSERTPS xmm1, xmm2/m32, imm8 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_INSERTPS_VpsUpsIb, (RegisterID)vd, (RegisterID)rn);
        m_formatter.immediate8(laneIndex << 4);
    }

    void unpcklpd_rr(XMMRegisterID rn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/unpcklpd
        // 66 0F 14 /r UNPCKLPD xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_UNPCKLPD_VpdWpd, (RegisterID)vd, (RegisterID)rn);
    }

    void pextrb_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        ASSERT(laneIndex < 16);
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // 66 0F 3A 14 /r ib PEXTRB reg/m8, xmm2, imm8 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_PEXTRB_MbVdqIb, (RegisterID)vn, rd);
        m_formatter.immediate8(laneIndex);
    }

    void pextrw_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        ASSERT(laneIndex < 8);
        // https://www.felixcloutier.com/x86/pextrw
        // 66 0F 3A 15 /r ib PEXTRW reg/m16, xmm, imm8 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_PEXTRW_MwVdqIb, (RegisterID)vn, rd);
        m_formatter.immediate8(laneIndex);
    }

    void pextrd_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        ASSERT(laneIndex < 4);
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // 66 0F 3A 16 /r ib PEXTRD r/m32, xmm2, imm8 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_PEXTRD_EyVdqIb, (RegisterID)vn, rd);
        m_formatter.immediate8(laneIndex);
    }

    void pextrq_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        ASSERT(laneIndex < 2);
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // 66 REX.W 0F 3A 16 /r ib PEXTRQ r/m64, xmm2, imm8 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp64(OP2_3BYTE_ESCAPE_3A, OP3_PEXTRQ_EyVdqIb, (RegisterID)vn, rd);
        m_formatter.immediate8(laneIndex);
    }

    void pshufd_i8rr(uint8_t controlBits, XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pshufd
        // 66 0F 70 /r ib PSHUFD xmm1, xmm2/m128, imm8
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PSHUFD_VdqWdqIb, (RegisterID)vd, (RegisterID)vn);
        m_formatter.immediate8((uint8_t)controlBits);
    }

    void pshufb_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pshufb
        // 66 0F 38 00 /r PSHUFB xmm1, xmm2/m128 | SSSE3
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PSHUFB_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    void pshuflw_i8rr(uint8_t controlBits, XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pshuflw
        // F2 0F 70 /r ib PSHUFLW xmm1, xmm2/m128, imm8
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_PSHUFLW_VdqWdqIb, (RegisterID)vd, (RegisterID)vn);
        m_formatter.immediate8((uint8_t)controlBits);
    }

    void pshufhw_rr(uint8_t controlBits, XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pshufhw
        // F3 0F 70 /r ib PSHUFHW xmm1, xmm2/m128, imm8
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_PSHUFHW_VdqWdqIb, (RegisterID)vd, (RegisterID)vn);
        m_formatter.immediate8((uint8_t)controlBits);
    }

    void punpcklqdq_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/punpcklbw:punpcklwd:punpckldq:punpcklqdq
        // 66 0F 6C /r PUNPCKLQDQ xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PUNPCKLQDQ_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    void shufps_i8rr(uint8_t controlBits, XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/shufps
        // NP 0F C6 /r ib SHUFPS xmm1, xmm3/m128, imm8
        m_formatter.twoByteOp(OP2_SHUFPS_VpdWpdIb, (RegisterID)vd, (RegisterID)vn);
        m_formatter.immediate8((uint8_t)controlBits);
    }

    void shufpd_i8rr(uint8_t controlBits, XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/shufpd
        // 66 0F C6 /r ib SHUFPD xmm1, xmm2/m128, imm8
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_SHUFPD_VpdWpdIb, (RegisterID)vd, (RegisterID)vn);
        m_formatter.immediate8((uint8_t)controlBits);
    }

    void paddsb_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddsb:paddsw
        // 66 0F EC /r PADDSB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PADDSB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void paddusb_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddusb:paddusw
        // 66 0F DC /r PADDUSB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PADDUSB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void paddsw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddsb:paddsw
        // 66 0F ED /r PADDSW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PADDSW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void paddusw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddusb:paddusw
        // 66 0F DD /r PADDUSW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PADDUSW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void psubsb_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubsb:psubsw
        // 66 0F E8 /r PSUBSB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PSUBSB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void psubusb_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubusb:psubusw
        // 66 0F D8 /r PSUBUSB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PSUBUSB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void psubsw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubsb:psubsw
        // 66 0F E9 /r PSUBSW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PSUBSW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void psubusw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubusb:psubusw
        // 66 0F D9 /r PSUBUSW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PSUBUSW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pmaxsb_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxsb:pmaxsw:pmaxsd:pmaxsq
        // 66 0F 38 3C /r PMAXSB xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMAXSB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pmaxsw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxsb:pmaxsw:pmaxsd:pmaxsq
        // 66 0F EE /r PMAXSW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PMAXSW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pmaxsd_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxsb:pmaxsw:pmaxsd:pmaxsq
        // 66 0F 38 3D /r PMAXSD xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMAXSD_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pmaxub_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxub:pmaxuw
        // 66 0F DE /r PMAXUB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PMAXUB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pmaxuw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxub:pmaxuw
        // 66 0F 38 3E /r PMAXUW xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMAXUW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pmaxud_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxud:pmaxuq
        // 66 0F 38 3F /r PMAXUD xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMAXUD_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pminsb_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminsb:pminsw
        // 66 0F 38 38 /r PMINSB xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMINSB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pminsw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminsb:pminsw
        // 66 0F EA /r PMINSW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PMINSW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pminsd_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminsd:pminsq
        // 66 0F 38 39 /r PMINSD xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMINSD_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pminub_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminub:pminuw
        // 66 0F DA /r PMINUB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PMINUB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pminuw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminub:pminuw
        // 66 0F 38 3A /r PMINUW xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMINUW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pminud_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminud:pminuq
        // 66 0F 38 3B /r PMINUD xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PMINUD_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pavgb_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pavgb:pavgw
        // 66 0F E0, /r PAVGB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PAVGB_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pavgw_rr(XMMRegisterID right, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pavgb:pavgw
        // 66 0F E3 /r PAVGW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PAVGW_VdqWdq, (RegisterID)vd, (RegisterID)right);
    }

    void pabsb_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pabsb:pabsw:pabsd:pabsq
        // 66 0F 38 1C /r PABSB xmm1, xmm2/m128 | SSSE3
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PABSB_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    void pabsw_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pabsb:pabsw:pabsd:pabsq
        // 66 0F 38 1D /r PABSW xmm1, xmm2/m128 | SSSE3
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PABSW_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    void pabsd_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pabsb:pabsw:pabsd:pabsq
        // 66 0F 38 1E /r PABSD xmm1, xmm2/m128 | SSSE3
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_PABSD_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    void pxor_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pxor
        // 66 0F EF /r PXOR xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PXOR_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    void pblendw_i8rr(uint8_t imm8, XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pblendw
        // 66 0F 3A 0E /r ib PBLENDW xmm1, xmm2/m128, imm8 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_VPBLENDW_VxHxWxIb, (RegisterID)vd, (RegisterID)vn);
        m_formatter.immediate8((uint8_t)imm8);
    }

    void addps_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/addps
        // NP 0F 58 /r ADDPS xmm1, xmm2/m128
        m_formatter.twoByteOp(OP2_ADDPS_VpsWps, (RegisterID)vd, (RegisterID)vn);
    }

    void psubd_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubb:psubw:psubd
        // 66 0F FA /r PSUBD xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PSUBD_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    enum class RoundingType : uint8_t {
        ToNearestWithTiesToEven = 0,
        TowardNegativeInfiniti = 1,
        TowardInfiniti = 2,
        TowardZero = 3
    };

    enum class PackedCompareCondition : uint8_t {
        EqualAndOrdered = 0,
        LessThanAndOrdered = 1,
        LessThanOrEqualAndOrdered = 2,
        Unordered = 3,
        NotEqualOrUnordered = 4,
        NotLessThanOrUnordered = 5,
        NotLessThanOrEqualOrUnordered = 6,
        Ordered = 7,
        EqualOrUnordered = 8,
        NotGreaterThanOrEqualOrUnordered = 9,
        NotGreaterThanOrUnordered = 10,
        False = 11,
        NotEqualAndOrdered = 12,
        GreaterThanOrEqualAndOrdered = 13,
        GreaterThanAndOrdered = 14,
        True = 15
    };

    void cvtdq2ps_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/cvtdq2ps
        // NP 0F 5B /r CVTDQ2PS xmm1, xmm2/m128
        m_formatter.twoByteOp(OP2_CVTDQ2PS_VsdWsd, (RegisterID)vd, (RegisterID)vn);
    }

    void cvtdq2pd_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/cvtdq2pd
        // F3 0F E6 /r CVTDQ2PD xmm1, xmm2/m64
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_CVTDQ2PD_VdqWdq, (RegisterID)vd, (RegisterID)vn);
    }

    void packsswb_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/packsswb:packssdw
        // 66 0F 63 /r PACKSSWB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PACKSSWB_VdqWdq, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void packuswb_rr(XMMRegisterID upper, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/packuswb
        // 66 0F 67 /r PACKUSWB xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PACKUSWB_VdqWdq, (RegisterID)dest, (RegisterID)upper);
    }

    void packssdw_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/packsswb:packssdw
        // 66 0F 6B /r PACKSSDW xmm1, xmm2/m128
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PACKSSDW_VdqWdq, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void packusdw_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/packusdw
        // 66 0F 38 2B /r PACKUSDW xmm1, xmm2/m128 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_VPACKUSDW_VxHxWx, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void pmovsxbw(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovsx
        // 66 0f 38 20 /r PMOVSXBW xmm1, xmm2/m64 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_VPMOVSXBW_VxUx, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void pmovzxbw(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovzx
        // 66 0f 38 30 /r PMOVZXBW xmm1, xmm2/m64 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_VPMOVZXBW_VxUx, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void pmovsxwd(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovsx
        // 66 0f 38 23 /r PMOVSXWD xmm1, xmm2/m64 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_VPMOVSXWD_VxUx, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void pmovzxwd(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovzx
        // 66 0f 38 33 /r PMOVZXWD xmm1, xmm2/m64 | SSE4_1
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_VPMOVZXWD_VxUx, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void pmovsxdq(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovsx
        // 66 0f 38 25 /r PMOVSXDQ xmm1, xmm2/m64
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_VPMOVSXDQ_VxUx, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void pmovzxdq(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovzx
        // 66 0f 38 35 /r PMOVZXDQ xmm1, xmm2/m64
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_38, OP3_VPMOVZXDQ_VxUx, (RegisterID)xmm1, (RegisterID)xmm2);
    }

    void movl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_MOV_EvGv, src, dst);
    }

    void movl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_MOV_EvGv, src, base, offset);
    }

    void movl_rm_disp32(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp_disp32(OP_MOV_EvGv, src, base, offset);
    }

    void movl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_MOV_EvGv, src, base, index, scale, offset);
    }
    
    void movl_mEAX(const void* addr)
    {
        m_formatter.oneByteOp(OP_MOV_EAXOv);
        m_formatter.immediate64(reinterpret_cast<int64_t>(addr));
    }

    void movl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_MOV_GvEv, dst, base, offset);
    }

    void movl_mr_disp32(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp_disp32(OP_MOV_GvEv, dst, base, offset);
    }
    
    void movl_mr_disp8(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp_disp8(OP_MOV_GvEv, dst, base, offset);
    }

    void movl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_MOV_GvEv, dst, base, index, scale, offset);
    }

    void movl_i32r(int imm, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_MOV_EAXIv, dst);
        m_formatter.immediate32(imm);
    }

    void movl_i32m(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP11_EvIz, GROUP11_MOV, base, offset);
        m_formatter.immediate32(imm);
    }
    
    void movl_i32m(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP11_EvIz, GROUP11_MOV, base, index, scale, offset);
        m_formatter.immediate32(imm);
    }

    void movb_i8m(int imm, int offset, RegisterID base)
    {
        ASSERT(-128 <= imm && imm < 128);
        m_formatter.oneByteOp(OP_GROUP11_EvIb, GROUP11_MOV, base, offset);
        m_formatter.immediate8(imm);
    }

    void movb_i8m(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        ASSERT(-128 <= imm && imm < 128);
        m_formatter.oneByteOp(OP_GROUP11_EvIb, GROUP11_MOV, base, index, scale, offset);
        m_formatter.immediate8(imm);
    }

    void movb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp8(OP_MOV_EbGb, src, base, offset);
    }
    
    void movb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp8(OP_MOV_EbGb, src, base, index, scale, offset);
    }

    void movw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);

        // FIXME: We often use oneByteOp8 for 16-bit operations. It's not clear that this is
        // necessary. https://bugs.webkit.org/show_bug.cgi?id=153433
        m_formatter.oneByteOp8(OP_MOV_EvGv, src, base, offset);
    }

    void movw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp8(OP_MOV_EvGv, src, base, index, scale, offset);
    }

    void movw_im(int imm, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_GROUP11_EvIz, GROUP11_MOV, base, offset);
        m_formatter.immediate16(imm);
    }

    void movw_im(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.oneByteOp(OP_GROUP11_EvIz, GROUP11_MOV, base, index, scale, offset);
        m_formatter.immediate16(imm);
    }

    void movl_EAXm(const void* addr)
    {
        m_formatter.oneByteOp(OP_MOV_OvEAX);
        m_formatter.immediate64(reinterpret_cast<int64_t>(addr));
    }

    void movl_mr(uint32_t addr, RegisterID dst)
    {
        m_formatter.oneByteOpAddr(OP_MOV_GvEv, dst, addr);
    }

    void movl_rm(RegisterID src, uint32_t addr)
    {
        m_formatter.oneByteOpAddr(OP_MOV_EvGv, src, addr);
    }

    void movq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_MOV_EvGv, src, dst);
    }

    void movq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_MOV_EvGv, src, base, offset);
    }

    void movq_rm_disp32(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64_disp32(OP_MOV_EvGv, src, base, offset);
    }

    void movq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_MOV_EvGv, src, base, index, scale, offset);
    }

    void movq_rm(RegisterID src, int offset)
    {
        m_formatter.oneByteOp64Addr(OP_MOV_EvGv, src, offset);
    }

    void movq_mEAX(const void* addr)
    {
        m_formatter.oneByteOp64(OP_MOV_EAXOv);
        m_formatter.immediate64(reinterpret_cast<int64_t>(addr));
    }

    void movq_EAXm(const void* addr)
    {
        m_formatter.oneByteOp64(OP_MOV_OvEAX);
        m_formatter.immediate64(reinterpret_cast<int64_t>(addr));
    }

    void movq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_MOV_GvEv, dst, base, offset);
    }

    void movq_mr_disp32(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64_disp32(OP_MOV_GvEv, dst, base, offset);
    }

    void movq_mr_disp8(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64_disp8(OP_MOV_GvEv, dst, base, offset);
    }

    void movq_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_MOV_GvEv, dst, base, index, scale, offset);
    }

    void movq_mr(uint32_t addr, RegisterID dst)
    {
        m_formatter.oneByteOp64Addr(OP_MOV_GvEv, dst, addr);
    }

    void movq_i32m(int imm, int offset, RegisterID base)
    {
        m_formatter.oneByteOp64(OP_GROUP11_EvIz, GROUP11_MOV, base, offset);
        m_formatter.immediate32(imm);
    }

    void movq_i32m(int imm, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp64(OP_GROUP11_EvIz, GROUP11_MOV, base, index, scale, offset);
        m_formatter.immediate32(imm);
    }

    void movq_i64r(int64_t imm, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_MOV_EAXIv, dst);
        m_formatter.immediate64(imm);
    }

    void mov_i32r(int32_t imm, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_GROUP11_EvIz, GROUP11_MOV, dst);
        m_formatter.immediate32(imm);
    }
    
    void movsxd_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_MOVSXD_GvEv, dst, src);
    }

    void movzwl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVZX_GvEw, dst, base, offset);
    }

    void movzwl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVZX_GvEw, dst, base, index, scale, offset);
    }

    void movswl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVSX_GvEw, dst, base, offset);
    }

    void movswl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVSX_GvEw, dst, base, index, scale, offset);
    }

    void movzbl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVZX_GvEb, dst, base, offset);
    }
    
    void movzbl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVZX_GvEb, dst, base, index, scale, offset);
    }

    void movsbl_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVSX_GvEb, dst, base, offset);
    }
    
    void movsbl_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVSX_GvEb, dst, base, index, scale, offset);
    }

    void movzbl_rr(RegisterID src, RegisterID dst)
    {
        // In 64-bit, this may cause an unnecessary REX to be planted (if the dst register
        // is in the range ESP-EDI, and the src would not have required a REX).  Unneeded
        // REX prefixes are defined to be silently ignored by the processor.
        m_formatter.twoByteOp8(OP2_MOVZX_GvEb, dst, src);
    }

    void movsbl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp8(OP2_MOVSX_GvEb, dst, src);
    }

    void movsbq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_MOVSX_GvEb, dst, src);
    }

    void movzwl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp8(OP2_MOVZX_GvEw, dst, src);
    }

    void movswl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp8(OP2_MOVSX_GvEw, dst, src);
    }

    void movswq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(OP2_MOVSX_GvEw, dst, src);
    }

    void cmovl_rr(Condition cond, RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(cmovcc(cond), dst, src);
    }

    void cmovl_mr(Condition cond, int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp(cmovcc(cond), dst, base, offset);
    }

    void cmovl_mr(Condition cond, int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.twoByteOp(cmovcc(cond), dst, base, index, scale, offset);
    }

    void cmovel_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(cmovcc(ConditionE), dst, src);
    }
    
    void cmovnel_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(cmovcc(ConditionNE), dst, src);
    }
    
    void cmovpl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(cmovcc(ConditionP), dst, src);
    }
    
    void cmovnpl_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp(cmovcc(ConditionNP), dst, src);
    }

    void cmovq_rr(Condition cond, RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(cmovcc(cond), dst, src);
    }

    void cmovq_mr(Condition cond, int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.twoByteOp64(cmovcc(cond), dst, base, offset);
    }

    void cmovq_mr(Condition cond, int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.twoByteOp64(cmovcc(cond), dst, base, index, scale, offset);
    }

    void cmoveq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(cmovcc(ConditionE), dst, src);
    }

    void cmovneq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(cmovcc(ConditionNE), dst, src);
    }

    void cmovpq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(cmovcc(ConditionP), dst, src);
    }

    void cmovnpq_rr(RegisterID src, RegisterID dst)
    {
        m_formatter.twoByteOp64(cmovcc(ConditionNP), dst, src);
    }

    void leal_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_LEA, dst, base, offset);
    }

    void leal_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp(OP_LEA, dst, base, index, scale, offset);
    }

    void leaq_mr(int offset, RegisterID base, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_LEA, dst, base, offset);
    }

    void leaq_mr(int offset, RegisterID base, RegisterID index, int scale, RegisterID dst)
    {
        m_formatter.oneByteOp64(OP_LEA, dst, base, index, scale, offset);
    }

    // Flow control:

    AssemblerLabel call()
    {
        m_formatter.oneByteOp(OP_CALL_rel32);
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel call(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP5_OP_CALLN, dst);
        return m_formatter.label();
    }
    
    void call_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP5_OP_CALLN, base, offset);
    }

    AssemblerLabel jmp()
    {
        m_formatter.oneByteOp(OP_JMP_rel32);
        return m_formatter.immediateRel32();
    }
    
    // Return a AssemblerLabel so we have a label to the jump, so we can use this
    // To make a tail recursive call on x86-64.  The MacroAssembler
    // really shouldn't wrap this as a Jump, since it can't be linked. :-/
    AssemblerLabel jmp_r(RegisterID dst)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP5_OP_JMPN, dst);
        return m_formatter.label();
    }
    
    void jmp_m(int offset, RegisterID base)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP5_OP_JMPN, base, offset);
    }
    
    void jmp_m(int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.oneByteOp(OP_GROUP5_Ev, GROUP5_OP_JMPN, base, index, scale, offset);
    }
    
    AssemblerLabel jne()
    {
        m_formatter.twoByteOp(jccRel32(ConditionNE));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jnz()
    {
        return jne();
    }

    AssemblerLabel je()
    {
        m_formatter.twoByteOp(jccRel32(ConditionE));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jz()
    {
        return je();
    }

    AssemblerLabel jl()
    {
        m_formatter.twoByteOp(jccRel32(ConditionL));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jb()
    {
        m_formatter.twoByteOp(jccRel32(ConditionB));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jle()
    {
        m_formatter.twoByteOp(jccRel32(ConditionLE));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jbe()
    {
        m_formatter.twoByteOp(jccRel32(ConditionBE));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jge()
    {
        m_formatter.twoByteOp(jccRel32(ConditionGE));
        return m_formatter.immediateRel32();
    }

    AssemblerLabel jg()
    {
        m_formatter.twoByteOp(jccRel32(ConditionG));
        return m_formatter.immediateRel32();
    }

    AssemblerLabel ja()
    {
        m_formatter.twoByteOp(jccRel32(ConditionA));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jae()
    {
        m_formatter.twoByteOp(jccRel32(ConditionAE));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel jo()
    {
        m_formatter.twoByteOp(jccRel32(ConditionO));
        return m_formatter.immediateRel32();
    }

    AssemblerLabel jnp()
    {
        m_formatter.twoByteOp(jccRel32(ConditionNP));
        return m_formatter.immediateRel32();
    }

    AssemblerLabel jp()
    {
        m_formatter.twoByteOp(jccRel32(ConditionP));
        return m_formatter.immediateRel32();
    }
    
    AssemblerLabel js()
    {
        m_formatter.twoByteOp(jccRel32(ConditionS));
        return m_formatter.immediateRel32();
    }

    AssemblerLabel jCC(Condition cond)
    {
        m_formatter.twoByteOp(jccRel32(cond));
        return m_formatter.immediateRel32();
    }

    // SSE operations:

    void addsd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void addsd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_ADDSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void addsd_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_ADDSD_VsdWsd, dst, base, index, scale, offset);
    }

    void addss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void addss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_ADDSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void addss_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_ADDSD_VsdWsd, dst, base, index, scale, offset);
    }

    void cvtsi2sd_rr(RegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, src);
    }

    void cvtsi2ss_rr(RegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, src);
    }

    void cvtsi2sdq_rr(RegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp64(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, src);
    }

    void cvtsi2ssq_rr(RegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, src);
    }

    void cvtsi2sdq_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp64(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, base, offset);
    }

    void cvtsi2ssq_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, base, offset);
    }

    void cvtsi2sd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, base, offset);
    }

    void cvtsi2ss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_CVTSI2SD_VsdEd, (RegisterID)dst, base, offset);
    }

    void cvttsd2si_rr(XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_CVTTSD2SI_GdWsd, dst, (RegisterID)src);
    }

    void cvttss2si_rr(XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_CVTTSS2SI_GdWsd, dst, (RegisterID)src);
    }

    void cvttss2siq_rr(XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp64(OP2_CVTTSS2SI_GdWsd, dst, (RegisterID)src);
    }

    void cvtsd2ss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_CVTSD2SS_VsdWsd, dst, (RegisterID)src);
    }

    void cvtsd2ss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_CVTSD2SS_VsdWsd, dst, base, offset);
    }

    void cvtss2sd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_CVTSS2SD_VsdWsd, dst, (RegisterID)src);
    }

    void cvtss2sd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_CVTSS2SD_VsdWsd, dst, base, offset);
    }

    void cvttsd2siq_rr(XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp64(OP2_CVTTSD2SI_GdWsd, dst, (RegisterID)src);
    }

    void movd_rr(XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_MOVD_EdVd, (RegisterID)src, dst);
    }

    void movd_rr(RegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_MOVD_VdEd, (RegisterID)dst, src);
    }

    void movddup_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movddup
        // F2 0F 12 /r MOVDDUP xmm1, xmm2/m64
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MOVDDUP_VqWq, (RegisterID)dst, (RegisterID)src);
    }

    void movmskpd_rr(XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp64(OP2_MOVMSKPD_VdEd, dst, (RegisterID)src);
    }

    void movq_rr(XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp64(OP2_MOVD_EdVd, (RegisterID)src, dst);
    }

    void movq_rr(RegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp64(OP2_MOVD_VdEd, (RegisterID)dst, src);
    }

    void movapd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_MOVAPD_VpdWpd, (RegisterID)dst, (RegisterID)src);
    }

    void movaps_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVAPS_VpsWps, (RegisterID)dst, (RegisterID)src);
    }

    void movhlps_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.twoByteOp(OP2_MOVHLPS_VqUq, (RegisterID)dst, (RegisterID)src);
    }

    void movsd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MOVSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void movsd_rm(XMMRegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MOVSD_WsdVsd, (RegisterID)src, base, offset);
    }
    
    void movsd_rm(XMMRegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MOVSD_WsdVsd, (RegisterID)src, base, index, scale, offset);
    }

    void movss_rm(XMMRegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MOVSD_WsdVsd, (RegisterID)src, base, offset);
    }
    
    void movss_rm(XMMRegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MOVSD_WsdVsd, (RegisterID)src, base, index, scale, offset);
    }
    
    void movsd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MOVSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void movsd_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MOVSD_VsdWsd, dst, base, index, scale, offset);
    }

    void movss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MOVSS_VsdWsd, (RegisterID)dst, base, offset);
    }

    void movss_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MOVSS_VsdWsd, dst, base, index, scale, offset);
    }

    void movshdup_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MOVSHDUP_VqWq, (RegisterID)dst, (RegisterID)src);
    }

    void movsldup_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MOVSLDUP_VqWq, (RegisterID)dst, (RegisterID)src);
    }

    void mulsd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void mulsd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MULSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void mulsd_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_MULSD_VsdWsd, dst, base, index, scale, offset);
    }

    void mulss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void mulss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MULSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void mulss_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_MULSD_VsdWsd, dst, base, index, scale, offset);
    }

    void pextrw_irr(int whichWord, XMMRegisterID src, RegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_PEXTRW_GdUdIb, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(whichWord);
    }

    void psllq_i8r(int imm, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp8(OP2_PSLLQ_UdqIb, GROUP14_OP_PSLLQ, (RegisterID)dst);
        m_formatter.immediate8(imm);
    }

    void psrld_i8r(uint8_t imm8, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // // 66 0F 72 /2 ib PSRLD xmm1, imm8
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp8(OP2_PSRLD_UdqIb, GROUP14_OP_PSRLQ, (RegisterID)dst);
        m_formatter.immediate8(imm8);
    }

    void psrlq_i8r(int imm, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp8(OP2_PSRLQ_UdqIb, GROUP14_OP_PSRLQ, (RegisterID)dst);
        m_formatter.immediate8(imm);
    }

    void por_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_POR_VdqWdq, (RegisterID)dst, (RegisterID)src);
    }

    void subsd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void subsd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_SUBSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void subsd_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_SUBSD_VsdWsd, dst, base, index, scale, offset);
    }

    void subss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void subss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_SUBSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void subss_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_SUBSD_VsdWsd, dst, base, index, scale, offset);
    }

    void ucomisd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_UCOMISD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void ucomisd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_UCOMISD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void ucomiss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.twoByteOp(OP2_UCOMISD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void ucomiss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.twoByteOp(OP2_UCOMISD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void divsd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_DIVSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void divsd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_DIVSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void divss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_DIVSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void divss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_DIVSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void andps_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.twoByteOp(OP2_ANDPS_VpsWps, (RegisterID)dst, (RegisterID)src);
    }

    void orps_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.twoByteOp(OP2_ORPS_VpsWps, (RegisterID)dst, (RegisterID)src);
    }

    void xorps_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.twoByteOp(OP2_XORPD_VpdWpd, (RegisterID)dst, (RegisterID)src);
    }

    void xorpd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        if (src == dst) {
            xorps_rr(src, dst);
            return;
        }
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_XORPD_VpdWpd, (RegisterID)dst, (RegisterID)src);
    }

    void andnpd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.twoByteOp(OP2_ANDNPD_VpdWpd, (RegisterID)dst, (RegisterID)src);
    }

    void sqrtsd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_SQRTSD_VsdWsd, (RegisterID)dst, (RegisterID)src);
    }

    void sqrtsd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F2);
        m_formatter.twoByteOp(OP2_SQRTSD_VsdWsd, (RegisterID)dst, base, offset);
    }

    void sqrtss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_SQRTSS_VssWss, (RegisterID)dst, (RegisterID)src);
    }

    void sqrtss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.twoByteOp(OP2_SQRTSS_VssWss, (RegisterID)dst, base, offset);
    }

    void roundss_rr(XMMRegisterID src, XMMRegisterID dst, RoundingType rounding)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_ROUNDSS_VssWssIb, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void roundss_mr(int offset, RegisterID base, XMMRegisterID dst, RoundingType rounding)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_ROUNDSS_VssWssIb, (RegisterID)dst, base, offset);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void roundsd_rr(XMMRegisterID src, XMMRegisterID dst, RoundingType rounding)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_ROUNDSD_VsdWsdIb, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void roundsd_mr(int offset, RegisterID base, XMMRegisterID dst, RoundingType rounding)
    {
        m_formatter.prefix(PRE_SSE_66);
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_3A, OP3_ROUNDSD_VsdWsdIb, (RegisterID)dst, base, offset);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    // Misc instructions:

    void int3()
    {
        m_formatter.oneByteOp(OP_INT3);
    }
    
    static bool isInt3(void* address)
    {
        uint8_t candidateInstruction = *static_cast<uint8_t*>(address);
        return candidateInstruction == OP_INT3;
    }

    void ret()
    {
        m_formatter.oneByteOp(OP_RET);
    }

    void predictNotTaken()
    {
        m_formatter.prefix(PRE_PREDICT_BRANCH_NOT_TAKEN);
    }
    
    void lock()
    {
        m_formatter.prefix(PRE_LOCK);
    }
    
    // Causes the memory access in the next instruction to be offset by %gs. Usually you use
    // this with a 32-bit absolute address load. That "address" ends up being the offset to
    // %gs. This prefix is ignored by lea. Getting the value of %gs is hard - you can pretty
    // much just use it as a secret offset.
    void gs()
    {
        m_formatter.prefix(PRE_GS);
    }
    
    void cmpxchgb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.twoByteOp8(OP2_CMPXCHGb, src, base, offset);
    }
    
    void cmpxchgb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.twoByteOp8(OP2_CMPXCHGb, src, base, index, scale, offset);
    }
    
    void cmpxchgw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.twoByteOp(OP2_CMPXCHG, src, base, offset);
    }
    
    void cmpxchgw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.twoByteOp(OP2_CMPXCHG, src, base, index, scale, offset);
    }
    
    void cmpxchgl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.twoByteOp(OP2_CMPXCHG, src, base, offset);
    }
    
    void cmpxchgl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.twoByteOp(OP2_CMPXCHG, src, base, index, scale, offset);
    }

    void cmpxchgq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.twoByteOp64(OP2_CMPXCHG, src, base, offset);
    }

    void cmpxchgq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.twoByteOp64(OP2_CMPXCHG, src, base, index, scale, offset);
    }

    void xaddb_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.twoByteOp8(OP2_XADDb, src, base, offset);
    }
    
    void xaddb_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.twoByteOp8(OP2_XADDb, src, base, index, scale, offset);
    }
    
    void xaddw_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.twoByteOp(OP2_XADD, src, base, offset);
    }
    
    void xaddw_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.prefix(PRE_OPERAND_SIZE);
        m_formatter.twoByteOp(OP2_XADD, src, base, index, scale, offset);
    }
    
    void xaddl_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.twoByteOp(OP2_XADD, src, base, offset);
    }
    
    void xaddl_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.twoByteOp(OP2_XADD, src, base, index, scale, offset);
    }

    void xaddq_rm(RegisterID src, int offset, RegisterID base)
    {
        m_formatter.twoByteOp64(OP2_XADD, src, base, offset);
    }

    void xaddq_rm(RegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        m_formatter.twoByteOp64(OP2_XADD, src, base, index, scale, offset);
    }

    void lfence()
    {
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_AE, OP3_LFENCE);
    }

    void mfence()
    {
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_AE, OP3_MFENCE);
    }

    void sfence()
    {
        m_formatter.threeByteOp(OP2_3BYTE_ESCAPE_AE, OP3_SFENCE);
    }

    void rdtsc()
    {
        m_formatter.twoByteOp(OP2_RDTSC);
    }

    void pause()
    {
        m_formatter.prefix(PRE_SSE_F3);
        m_formatter.oneByteOp(OP_PAUSE);
    }

    void cpuid()
    {
        m_formatter.twoByteOp(OP2_CPUID);
    }

    // AVX methods.
    //
    // Our AVX methods follow our rule of using AT&T syntax, i.e. reverse order of Intel syntax.
    // So, for example,
    //
    //    VEX.128.0F.WIG 14 /r VUNPCKLPS xmm1,xmm2, xmm3/m128
    //
    // will have following three methods potentially.
    //     - vunpcklps_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    //     - vunpcklps_mrr(int offset, RegisterID base, XMMRegisterID xmm2, XMMRegisterID xmm1)
    //     - vunpcklps_mrr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID xmm2, XMMRegisterID xmm1)
    //
    // For detailed Instruction encoding, read Intel SDM 2.3, "INTEL ADVANCED VECTOR EXTENSIONS (INTEL AVX)".
    // And 3.1.1.2 Opcode Column in the Instruction Summary Table (Instructions with VEX prefix)
    //
    // And the way to read the instruction is
    //
    // VEX.128.0F.WIG 14 /r VUNPCKLPS xmm1,xmm2, xmm3/m128
    //     - 128 bit AVX
    //     - only 0F, so PRE_SSE_00 prefix
    //     - only 0F, so two byte opcode
    //     - WIG => W is ignored, this is necessary to use two-byte VEX prefix. If W needs to have 0 or 1, then we need to use three byte VEX prefix.
    //     - 14 => opcode second byte (0F 14 is opcode)
    //     - /r => ModR/M contains register
    //     - VUNPCKLPS is instruction name
    //     - xmm1 is destination
    //     - xmm2 and xmm3 are operands
    //     - /r says that vvvv in VEX prefix is representing a register operand and an r/m operand.
    //
    // VEX.128.66.0F3A.W0 14 /r ib VPEXTRB reg/m8, xmm2, imm8
    //     - 128 bit AVX
    //     - 66, so PRE_SSE_66 prefix
    //     - 0F3A, so three byte opcode
    //     - W0 => W is 0
    //     - 14 => opcode third byte (0F 3A 14 is opcode)
    //     - /r => ModR/M contains register
    //     - ib => one byte imm before opcode.
    //     - VPEXTRB is instruction name
    //     - xmm1 is destination
    //     - xmm2 and xmm3 are operands
    //
    //  See also https://stackoverflow.com/questions/15017659/how-to-read-the-intel-opcode-notation
    //
    //  AVX instruction format is the following
    //
    //     [Prefixes] [VEX] OPCODE ModR/M [SIB] [DISP]
    //
    //  Prefixes are typically empty (LOCK etc. and they are invalid).
    //  How operand is mapped to these fields are defined per instruction.

    void vzeroupper()
    {
        // https://www.felixcloutier.com/x86/vzeroupper
        // VEX.128.0F.WIG 77 VZEROUPPER
        // ZO    NA    NA    NA    NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_00, VexW::W0, OP2_VZEROUPPER);
    }

    void vpinsrb_i8mrr(uint8_t laneIndex, int offset, RegisterID base, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 16);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // VEX.128.66.0F3A.W0 20 /r ib VPINSRB xmm1, xmm2, r32/m8, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_PINSRB_VdqRdqpIb, (RegisterID)xmm1, (RegisterID)xmm2, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpinsrb_i8rrr(uint8_t laneIndex, RegisterID rm, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 16);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // VEX.128.66.0F3A.W0 20 /r ib VPINSRB xmm1, xmm2, r32/m8, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_PINSRB_VdqRdqpIb, (RegisterID)xmm1, (RegisterID)xmm2, rm);
        m_formatter.immediate8(laneIndex);
    }

    void vpinsrw_i8mrr(uint8_t laneIndex, int offset, RegisterID base, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 8);
        // https://www.felixcloutier.com/x86/pinsrw
        // VEX.128.66.0F.W0 C4 /r ib VPINSRW xmm1, xmm2, r32/m16, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PINSRW_VdqRdqp, (RegisterID)xmm1, (RegisterID)xmm2, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpinsrw_i8rrr(uint8_t laneIndex, RegisterID rm, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 8);
        // https://www.felixcloutier.com/x86/pinsrw
        // VEX.128.66.0F.W0 C4 /r ib VPINSRW xmm1, xmm2, r32/m16, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PINSRW_VdqRdqp, (RegisterID)xmm1, (RegisterID)xmm2, rm);
        m_formatter.immediate8(laneIndex);
    }

    void vpinsrd_i8mrr(uint8_t laneIndex, int offset, RegisterID base, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 4);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // VEX.128.66.0F3A.W0 22 /r ib VPINSRD xmm1, xmm2, r/m32, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_PINSRD_VdqEdIb, (RegisterID)xmm1, (RegisterID)xmm2, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpinsrd_i8rrr(uint8_t laneIndex, RegisterID rm, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 4);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // VEX.128.66.0F3A.W0 22 /r ib VPINSRD xmm1, xmm2, r/m32, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_PINSRD_VdqEdIb, (RegisterID)xmm1, (RegisterID)xmm2, rm);
        m_formatter.immediate8(laneIndex);
    }

    void vpinsrq_i8mrr(uint8_t laneIndex, int offset, RegisterID base, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 2);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // VEX.128.66.0F3A.W1 22 /r ib VPINSRQ xmm1, xmm2, r/m64, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W1, OP3_PINSRQ_VdqEqbIb, (RegisterID)xmm1, (RegisterID)xmm2, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpinsrq_i8rrr(uint8_t laneIndex, RegisterID rm, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 2);
        // https://www.felixcloutier.com/x86/pinsrb:pinsrd:pinsrq
        // VEX.128.66.0F3A.W1 22 /r ib VPINSRQ xmm1, xmm2, r/m64, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W1, OP3_PINSRQ_VdqEqbIb, (RegisterID)xmm1, (RegisterID)xmm2, rm);
        m_formatter.immediate8(laneIndex);
    }

    void vinsertps_i8rrr(uint8_t laneIndex, XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        ASSERT(laneIndex < 4);
        // https://www.felixcloutier.com/x86/insertps
        // VEX.128.66.0F3A.WIG 21 /r ib VINSERTPS xmm1, xmm2, xmm3/m32, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    Imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_INSERTPS_VpsUpsIb, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
        m_formatter.immediate8(laneIndex << 4);
    }

    void vmovddup_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movddup
        // VEX.128.F2.0F.WIG 12 /r VMOVDDUP xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MOVDDUP_VqWq, (RegisterID)dst, (RegisterID)0, (RegisterID)src);
    }

    void vmovddup_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movddup
        // VEX.128.F2.0F.WIG 12 /r VMOVDDUP xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MOVDDUP_VqWq, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    void vmovapd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movapd
        // VEX.128.66.0F.WIG 28 /r VMOVAPD xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MOVAPD_VpdWpd, (RegisterID)dst, (RegisterID)0, (RegisterID)src);
    }

    void vbroadcastss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/vbroadcast
        // VEX.128.66.0F38.W0 18 /r VBROADCASTSS xmm1, m32
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VBROADCASTSS_VxWd, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    void vpunpcklbw_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/punpcklbw:punpcklwd:punpckldq:punpcklqdq
        // VEX.128.66.0F.WIG 60/r VPUNPCKLBW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PUNPCKLBW_VdqWdq, (RegisterID)xmm1, (RegisterID)xmm3, (RegisterID)xmm2);
    }

    void vpunpckhbw_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/punpckhbw:punpckhwd:punpckhdq:punpckhqdq
        // VEX.128.66.0F.WIG 68/r VPUNPCKHBW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PUNPCKHBW_VdqWdq, (RegisterID)xmm1, (RegisterID)xmm3, (RegisterID)xmm2);
    }

    void vpunpcklqdq_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/punpcklbw:punpcklwd:punpckldq:punpcklqdq
        // VEX.128.66.0F.WIG 6C /r VPUNPCKLQDQ xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PUNPCKLQDQ_VdqWdq, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vunpcklps_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/unpcklps
        // VEX.128.0F.WIG 14 /r VUNPCKLPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_UNPCKLPD_VpdWpd, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vunpcklpd_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/unpcklpd
        // VEX.128.66.0F.WIG 14 /r VUNPCKLPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_UNPCKLPD_VpdWpd, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vpextrb_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // VEX.128.66.0F3A.W0 14 /r ib VPEXTRB reg/m8, xmm2, imm8
        // A    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 16);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W0, OP3_PEXTRB_MbVdqIb, (RegisterID)vn, (RegisterID)0, rd);
        m_formatter.immediate8(laneIndex);
    }

    void vpextrb_i8rm(uint8_t laneIndex, XMMRegisterID src, RegisterID base, int offset)
    {
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // VEX.128.66.0F3A.W0 14 /r ib VPEXTRB reg/m8, xmm2, imm8
        // A    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 16);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W0, OP3_PEXTRB_MbVdqIb, (RegisterID)src, (RegisterID)0, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpextrw_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        // https://www.felixcloutier.com/x86/pextrw
        // VEX.128.66.0F3A.W0 15 /r ib VPEXTRW reg/m16, xmm2, imm8
        // B    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 8);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W0, OP3_PEXTRW_MwVdqIb, (RegisterID)vn, (RegisterID)0, rd);
        m_formatter.immediate8(laneIndex);
    }

    void vpextrw_i8rm(uint8_t laneIndex, XMMRegisterID src, RegisterID base, int offset)
    {
        // https://www.felixcloutier.com/x86/pextrw
        // VEX.128.66.0F3A.W0 15 /r ib VPEXTRW reg/m16, xmm2, imm8
        // B    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 8);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W0, OP3_PEXTRW_MwVdqIb, (RegisterID)src, (RegisterID)0, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpextrd_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // VEX.128.66.0F3A.W0 16 /r ib VPEXTRD r32/m32, xmm2, imm8
        // A    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 4);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W0, OP3_PEXTRD_EyVdqIb, (RegisterID)vn, (RegisterID)0, rd);
        m_formatter.immediate8(laneIndex);
    }

    void vpextrd_i8rm(uint8_t laneIndex, XMMRegisterID src, RegisterID base, int offset)
    {
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // VEX.128.66.0F3A.W0 16 /r ib VPEXTRD r32/m32, xmm2, imm8
        // A    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 4);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W0, OP3_PEXTRD_EyVdqIb, (RegisterID)src, (RegisterID)0, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpextrq_i8rr(uint8_t laneIndex, XMMRegisterID vn, RegisterID rd)
    {
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // VEX.128.66.0F3A.W1 16 /r ib VPEXTRQ r64/m64, xmm2, imm8
        // A    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 2);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W1, OP3_PEXTRQ_EyVdqIb, (RegisterID)vn, (RegisterID)0, rd);
        m_formatter.immediate8(laneIndex);
    }

    void vpextrq_i8rm(uint8_t laneIndex, XMMRegisterID src, RegisterID base, int offset)
    {
        // https://www.felixcloutier.com/x86/pextrb:pextrd:pextrq
        // VEX.128.66.0F3A.W1 16 /r ib VPEXTRQ r64/m64, xmm2, imm8
        // A    NA    ModRM:r/m (w)    ModRM:reg (r)    imm8    NA
        ASSERT(laneIndex < 2);
        m_formatter.vexNdsLigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, VexW::W1, OP3_PEXTRQ_EyVdqIb, (RegisterID)src, (RegisterID)0, base, offset);
        m_formatter.immediate8(laneIndex);
    }

    void vpshufb_rrr(XMMRegisterID vm, XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pshufb
        // VEX.128.66.0F38.WIG 00 /r VPSHUFB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PSHUFB_VdqWdq, (RegisterID)vd, (RegisterID)vn, (RegisterID)vm);
    }

    void vshufps_i8rrr(uint8_t controlBits, XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/shufps
        // VEX.128.0F.WIG C6 /r ib VSHUFPS xmm1, xmm2, xmm3/m128, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    Imm8
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_SHUFPS_VpdWpdIb, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
        m_formatter.immediate8(controlBits);
    }

    void vshufpd_i8rrr(uint8_t controlBits, XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/shufpd
        // VEX.128.66.0F.WIG C6 /r ib VSHUFPD xmm1, xmm2, xmm3/m128, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    Imm8
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_SHUFPD_VpdWpdIb, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
        m_formatter.immediate8(controlBits);
    }

    void vpshuflw_i8rr(uint8_t controlBits, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pshuflw
        // VEX.128.F2.0F.WIG 70 /r ib VPSHUFLW xmm1, xmm2/m128, imm8
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_PSHUFLW_VdqWdqIb, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
        m_formatter.immediate8(controlBits);
    }

    void vpshufd_i8rr(uint8_t controlBits, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pshufd
        // VEX.128.66.0F.WIG 70 /r ib VPSHUFD xmm1, xmm2/m128, imm8
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSHUFD_VdqWdqIb, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
        m_formatter.immediate8(controlBits);
    }

    void vpaddsb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddsb:paddsw
        // VEX.128.66.0F.WIG EC /r VPADDSB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDSB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpaddusb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddusb:paddusw
        // VEX.128.66.0F.WIG DC /r VPADDUSB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDUSB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpaddsw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddsb:paddsw
        // VEX.128.66.0F.WIG ED /r VPADDSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDSW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpaddusw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/paddusb:paddusw
        // VEX.128.66.0F.WIG DD /r VPADDUSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDUSW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpsubsb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubsb:psubsw
        // VEX.128.66.0F.WIG E8 /r VPSUBSB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBSB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpsubusb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubusb:psubusw
        // VEX.128.66.0F.WIG D8 /r VPSUBUSB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBUSB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpsubsw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubsb:psubsw
        // VEX.128.66.0F.WIG E9 /r VPSUBSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBSW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpsubusw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubusb:psubusw
        // VEX.128.66.0F.WIG D9 /r VPSUBUSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBUSW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpmaxsb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxsb:pmaxsw:pmaxsd:pmaxsq
        // VEX.128.66.0F38.WIG 3C /r VPMAXSB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMAXSB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpmaxsw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxsb:pmaxsw:pmaxsd:pmaxsq
        // VEX.128.66.0F.WIG EE /r VPMAXSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PMAXSW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpmaxsd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxsb:pmaxsw:pmaxsd:pmaxsq
        // VEX.128.66.0F38.WIG 3D /r VPMAXSD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMAXSD_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpmaxub_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxub:pmaxuw
        // VEX.128.66.0F DE /r VPMAXUB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PMAXUB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpmaxuw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxub:pmaxuw
        // VEX.128.66.0F38 3E /r VPMAXUW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMAXUW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpmaxud_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pmaxud:pmaxuq
        // VEX.128.66.0F38.WIG 3F /r VPMAXUD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMAXUD_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpminsb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminsb:pminsw
        // VEX.128.66.0F38 38 /r VPMINSB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMINSB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpminsw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminsb:pminsw
        // VEX.128.66.0F EA /r VPMINSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PMINSW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpminsd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminsd:pminsq
        // VEX.128.66.0F38.WIG 39 /r VPMINSD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMINSD_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpminub_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminub:pminuw
        // VEX.128.66.0F DA /r VPMINUB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PMINUB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpminuw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminub:pminuw
        // VEX.128.66.0F38 3A /r VPMINUW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMINUW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpminud_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pminud:pminuq
        // VEX.128.66.0F38.WIG 3B /r VPMINUD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMINUD_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vmaxps_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/maxps
        // VEX.128.NP.0F.WIG 5F /r VMAXPS xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MAXPS_VpsWps, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vmaxpd_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/maxpd
        // VEX.128.66.0F.WIG 5F /r VMAXPD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MAXPD_VpdWpd, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vminps_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/minps
        // VEX.128.NP.0F.WIG 5D /r VMINPS xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MINPS_VpsWps, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vminpd_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/minpd
        // VEX.128.66.0F.WIG 5D /r VMINPD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MINPD_VpdWpd, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vpavgb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pavgb:pavgw
        // VEX.128.66.0F.WIG E0 /r VPAVGB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PAVGB_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpavgw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pavgb:pavgw
        // VEX.128.66.0F.WIG E3 /r VPAVGW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PAVGW_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpabsb_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pabsb:pabsw:pabsd:pabsq
        // VEX.128.66.0F38.WIG 1C /r VPABSB xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PABSB_VdqWdq, (RegisterID)vd, (RegisterID)0, (RegisterID)vn);
    }

    void vpabsw_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pabsb:pabsw:pabsd:pabsq
        // VEX.128.66.0F38.WIG 1D /r VPABSW xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PABSW_VdqWdq, (RegisterID)vd, (RegisterID)0, (RegisterID)vn);
    }

    void vpabsd_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pabsb:pabsw:pabsd:pabsq
        // VEX.128.66.0F38.WIG 1E /r VPABSD xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PABSD_VdqWdq, (RegisterID)vd, (RegisterID)0, (RegisterID)vn);
    }

    void vpxor_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/pxor
        // VEX.128.66.0F.WIG EF /r VPXOR xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PXOR_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vpsubq_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/psubq
        // VEX.128.66.0F.WIG FB /r VPSUBQ xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBQ_VdqWdq, (RegisterID)vd, (RegisterID)left, (RegisterID)right);
    }

    void vblendvpd_rrrr(XMMRegisterID xmm4, XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/blendvpd
        // VEX.128.66.0F3A.W0 4B /r /is4 VBLENDVPD xmm1, xmm2, xmm3/m128, xmm4
        // RVMR    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8[7:4]
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_BLENDVPD_VpdWpdXMM0, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
        m_formatter.immediate8(static_cast<uint8_t>(xmm4) << 4); // imm8[7:4]
    }

    void vpmulhrsw_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmulhrsw
        // VEX.128.66.0F38.WIG 0B /r VPMULHRSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_ROUNDSD_VsdWsdIb, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vaddps_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/addps
        // VEX.128.0F.WIG 58 /r VADDPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_00, OP2_ADDPS_VpsWps, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vaddpd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/addpd
        // VEX.128.66.0F.WIG 58 /r VADDPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_ADDPD_VpdWpd, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vaddpd_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/addpd
        // VEX.128.66.0F.WIG 58 /r VADDPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_ADDPD_VpdWpd, (RegisterID)dest, (RegisterID)src2, base, offset);
    }

    void vpaddb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/paddb:paddw:paddd:paddq
        // VEX.128.66.0F.WIG FC /r VPADDB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDB_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpaddw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/paddb:paddw:paddd:paddq
        // VEX.128.66.0F.WIG FD /r VPADDW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDW_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpaddd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/paddb:paddw:paddd:paddq
        // VEX.128.66.0F.WIG FE /r VPADDD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDD_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpaddq_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/paddb:paddw:paddd:paddq
        // VEX.128.66.0F.WIG D4 /r VPADDQ xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PADDQ_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vsubps_mrr(int offset, RegisterID base, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/subps
        // VEX.128.0F.WIG 5C /r VSUBPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_SUBPS_VpsWps, (RegisterID)dest, (RegisterID)left, base, offset);
    }

    void vsubps_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/subps
        // VEX.128.0F.WIG 5C /r VSUBPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_SUBPS_VpsWps, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vsubpd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/subpd
        // VEX.128.66.0F.WIG 5C /r VSUBPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        // Sub is xmm1 = xmm2 - xmm3
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_SUBPD_VpdWpd, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpsubb_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psubb:psubw:psubd
        // VEX.128.66.0F.WIG F8 /r VPSUBB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBB_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpsubw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psubb:psubw:psubd
        // VEX.128.66.0F.WIG F9 /r VPSUBW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBW_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpsubd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psubb:psubw:psubd
        // VEX.128.66.0F.WIG FA /r VPSUBD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSUBD_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vmulps_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/mulps
        // VEX.128.0F.WIG 59 /r VMULPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_00, OP2_MULPS_VpsWps, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vmulpd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/mulpd
        // VEX.128.66.0F.WIG 59 /r VMULPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_MULPD_VpdWpd, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpmullw_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pmullw
        // VEX.128.66.0F.WIG D5 /r VPMULLW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PMULLW_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vpmulld_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pmulld:pmullq
        // VEX.128.66.0F38.WIG 40 /r VPMULLD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMULLD_VdqWdq, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vdivps_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/divps
        // VEX.128.0F.WIG 5E /r VDIVPS xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_DIVPS_VpsWps, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vdivpd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/divpd
        // VEX.128.66.0F.WIG 5E /r VDIVPD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_DIVPD_VpdWpd, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vdivsd_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/divsd
        // VEX.LIG.F2.0F.WIG 5E /r VDIVSD xmm1, xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_DIVSD_VsdWsd, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vdivsd_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/divsd
        // VEX.LIG.F2.0F.WIG 5E /r VDIVSD xmm1, xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_DIVSD_VsdWsd, (RegisterID)dest, (RegisterID)src2, base, offset);
    }

    void vdivss_rrr(XMMRegisterID right, XMMRegisterID left, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/divss
        // VEX.LIG.F3.0F.WIG 5E /r VDIVSS xmm1, xmm2, xmm3/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_DIVSS_VpsWps, (RegisterID)dest, (RegisterID)left, (RegisterID)right);
    }

    void vdivss_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/divss
        // VEX.LIG.F3.0F.WIG 5E /r VDIVSS xmm1, xmm2, xmm3/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_DIVSS_VpsWps, (RegisterID)dest, (RegisterID)src2, base, offset);
    }

    void vroundsd_i8rrr(RoundingType rounding, FPRegisterID src1, FPRegisterID src2, FPRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/roundsd
        // VEX.LIG.66.0F3A.WIG 0B /r ib VROUNDSD xmm1, xmm2, xmm3/m64, imm8
        // RVMI    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_ROUNDSD_VsdWsdIb, (RegisterID)dest, (RegisterID)src2, (RegisterID)src1);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void vroundsd_i8mrr(RoundingType rounding, int offset, RegisterID base, FPRegisterID src2, FPRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/roundsd
        // VEX.LIG.66.0F3A.WIG 0B /r ib VROUNDSD xmm1, xmm2, xmm3/m64, imm8
        // RVMI    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_ROUNDSD_VsdWsdIb, (RegisterID)dest, (RegisterID)src2, base, offset);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void vroundss_i8rrr(RoundingType rounding, FPRegisterID src1, FPRegisterID src2, FPRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/roundss
        // VEX.LIG.66.0F3A.WIG 0A /r ib VROUNDSS xmm1, xmm2, xmm3/m32, imm8
        // RVMI    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_ROUNDSS_VssWssIb, (RegisterID)dest, (RegisterID)src2, (RegisterID)src1);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void vroundss_i8mrr(RoundingType rounding, int offset, RegisterID base, FPRegisterID src2, FPRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/roundss
        // VEX.LIG.66.0F3A.WIG 0A /r ib VROUNDSS xmm1, xmm2, xmm3/m32, imm8
        // RVMI    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_ROUNDSS_VssWssIb, (RegisterID)dest, (RegisterID)src2, base, offset);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void vroundps_rr(FPRegisterID src, FPRegisterID dest, RoundingType rounding)
    {
        // https://www.felixcloutier.com/x86/roundps
        // VEX.128.66.0F3A.WIG 08 /r ib VROUNDPS xmm1, xmm2/m128, imm8
        // RMI    ModRM:reg (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_ROUNDPS_VpsWpsIb, (RegisterID)dest, (RegisterID)0, (RegisterID)src);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void vroundpd_rr(FPRegisterID src, FPRegisterID dest, RoundingType rounding)
    {
        // https://www.felixcloutier.com/x86/roundpd
        // VEX.128.66.0F3A.WIG 09 /r ib VROUNDPD xmm1, xmm2/m128, imm8
        // RMI    ModRM:reg (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_ROUNDPD_VpdWpdIb, (RegisterID)dest, (RegisterID)0, (RegisterID)src);
        m_formatter.immediate8(static_cast<uint8_t>(rounding));
    }

    void vsqrtps_rr(XMMRegisterID src, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/sqrtps
        // VEX.128.0F.WIG 51 /r VSQRTPS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_SQRTPS_VpsWps, (RegisterID)dest, (RegisterID)0, (RegisterID)src);
    }

    void vsqrtpd_rr(XMMRegisterID src, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/sqrtpd
        // VEX.128.66.0F.WIG 51 /r VSQRTPD xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_SQRTPD_VpdWpd, (RegisterID)dest, (RegisterID)0, (RegisterID)src);
    }

    void vpmaddwd_rrr(FPRegisterID a, FPRegisterID b, FPRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pmaddwd
        // VEX.128.66.0F.WIG F5 /r VPMADDWD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PMADDWD_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpeqb_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpeqb:pcmpeqw:pcmpeqd
        // VEX.128.66.0F.WIG 74 /r VPCMPEQB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PCMPEQB_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpeqw_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpeqb:pcmpeqw:pcmpeqd
        // VEX.128.66.0F.WIG 75 /r VPCMPEQW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PCMPEQW_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpeqd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpeqb:pcmpeqw:pcmpeqd
        // VEX.128.66.0F.WIG 76 /r VPCMPEQD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_PCMPEQD_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpeqq_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpeqq
        // VEX.128.66.0F38.WIG 29 /r VPCMPEQQ xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PCMPEQQ_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpgtb_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpgtb:pcmpgtw:pcmpgtd
        // VEX.128.66.0F.WIG 64 /r VPCMPGTB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PCMPGTB_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpgtw_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpgtb:pcmpgtw:pcmpgtd
        // VEX.128.66.0F.WIG 65 /r VPCMPGTW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PCMPGTW_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpgtd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpgtb:pcmpgtw:pcmpgtd
        // VEX.128.66.0F.WIG 66 /r VPCMPGTD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PCMPGTD_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpcmpgtq_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pcmpgtq
        // VEX.128.66.0F38.WIG 37 /r VPCMPGTQ xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PCMPGTQ_VdqWdq, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vcmpunordps_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        vcmpps_rrr(PackedCompareCondition::Unordered, a, b, dest);
    }

    void vcmpleps_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        vcmpps_rrr(PackedCompareCondition::LessThanOrEqualAndOrdered, a, b, dest);
    }

    void vcmpnltps_mrr(int offset, RegisterID base, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        vcmpps_mrr(PackedCompareCondition::GreaterThanOrEqualAndOrdered, offset, base, xmm2, xmm1);
    }

    void vcmpltps_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        vcmpps_rrr(PackedCompareCondition::LessThanAndOrdered, a, b, dest);
    }

    void vcmpps_rrr(PackedCompareCondition condition, XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/cmpps
        // VEX.128.0F.WIG C2 /r ib VCMPPS xmm1, xmm2, xmm3/m128, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    Imm8
        switch (condition) {
        case PackedCompareCondition::EqualAndOrdered:
        case PackedCompareCondition::NotEqualOrUnordered:
        case PackedCompareCondition::Unordered:
        case PackedCompareCondition::Ordered:
        case PackedCompareCondition::EqualOrUnordered:
        case PackedCompareCondition::NotEqualAndOrdered:
            m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_00, OP2_CMPPS_VpsWpsIb, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
            break;
        default:
            m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_CMPPS_VpsWpsIb, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
        }
        m_formatter.immediate8(static_cast<uint8_t>(condition));
    }

    void vcmpps_mrr(PackedCompareCondition condition, int offset, RegisterID base, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/cmpps
        // VEX.128.0F.WIG C2 /r ib VCMPPS xmm1, xmm2, xmm3/m128, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    Imm8
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_CMPPS_VpsWpsIb, (RegisterID)xmm1, (RegisterID)xmm2, base, offset);
        m_formatter.immediate8(static_cast<uint8_t>(condition));
    }

    void vcmppd_rrr(PackedCompareCondition condition, XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/cmppd
        // VEX.128.66.0F.WIG C2 /r ib VCMPPD xmm1, xmm2, xmm3/m128, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    Imm8
        switch (condition) {
        case PackedCompareCondition::EqualAndOrdered:
        case PackedCompareCondition::NotEqualOrUnordered:
        case PackedCompareCondition::Unordered:
        case PackedCompareCondition::Ordered:
        case PackedCompareCondition::EqualOrUnordered:
        case PackedCompareCondition::NotEqualAndOrdered:
            m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_CMPPD_VpdWpdIb, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
            break;
        default:
            m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_CMPPD_VpdWpdIb, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
        }
        m_formatter.immediate8(static_cast<uint8_t>(condition));
    }

    void vcvttps2dq_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/cvttps2dq
        // VEX.128.F3.0F.WIG 5B /r VCVTTPS2DQ xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_CVTDQ2PS_VsdWsd, (RegisterID)vd, (RegisterID)0, (RegisterID)vn);
    }

    void vcvtdq2ps_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/cvtdq2ps
        // VEX.128.0F.WIG 5B /r VCVTDQ2PS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_CVTDQ2PS_VsdWsd, (RegisterID)vd, (RegisterID)0, (RegisterID)vn);
    }

    void vcvtdq2pd_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/cvtdq2pd
        // VEX.128.F3.0F.WIG E6 /r VCVTDQ2PD xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_CVTDQ2PD_VdqWdq, (RegisterID)vd, (RegisterID)0, (RegisterID)vn);
    }

    void vminpd_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/minpd
        // VEX.128.66.0F.WIG 5D /r VMINPD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MINPD_VpdWpd, (RegisterID)dest, (RegisterID)src2, base, offset);
    }

    void vcmppd_rrr(uint8_t imm8, XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/cmppd
        // VEX.128.66.0F.WIG C2 /r ib VCMPPD xmm1, xmm2, xmm3/m128, imm8
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    Imm8
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_CMPPD_VpdWpdIb, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
        m_formatter.immediate8(imm8);
    }

    void vpsllw_i8rr(uint8_t shift, XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG 71 /6 ib VPSLLW xmm1, xmm2, imm8
        // D    NA    VEX.vvvv (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSLLW_UdqIb, (RegisterID)GROUP14_OP_PSLLQ, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(shift);
    }

    void vpslld_i8rr(uint8_t shift, XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG 72 /6 ib VPSLLD xmm1, xmm2, imm8
        // D    NA    VEX.vvvv (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSLLD_UdqIb, (RegisterID)GROUP14_OP_PSLLQ, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(shift);
    }

    void vpsrlw_i8rr(uint8_t shift, XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG 71 /2 ib VPSRLW xmm1, xmm2, imm8
        // D    NA    VEX.vvvv (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRLW_UdqIb, (RegisterID)GROUP14_OP_PSRLQ, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(shift);
    }

    void vpsrld_i8rr(uint8_t shift, XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG 72 /2 ib VPSRLD xmm1, xmm2, imm8
        // D    NA    VEX.vvvv (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRLD_UdqIb, (RegisterID)GROUP14_OP_PSRLQ, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(shift);
    }

    void vpsrlq_i8rr(uint8_t shift, XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG 73 /2 ib VPSRLQ xmm1, xmm2, imm8
        // D    NA    VEX.vvvv (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRLQ_UdqIb, (RegisterID)GROUP14_OP_PSRLQ, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(shift);
    }

    void vpsraw_i8rr(uint8_t shift, XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psraw:psrad:psraq
        // VEX.128.66.0F.WIG 71 /4 ib VPSRAW xmm1, xmm2, imm8
        // D    NA    VEX.vvvv (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRAW_UdqIb, (RegisterID)GROUP14_OP_PSRAQ, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(shift);
    }

    void vpsrad_i8rr(uint8_t shift, XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/psraw:psrad:psraq
        // VEX.128.66.0F.WIG 72 /4 ib VPSRAD xmm1, xmm2, imm8
        // D    NA    VEX.vvvv (w)    ModRM:r/m (r)    imm8    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRAD_UdqIb, (RegisterID)GROUP14_OP_PSRAQ, (RegisterID)dst, (RegisterID)src);
        m_formatter.immediate8(shift);
    }

    void vcvttpd2dq_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/cvttpd2dq
        // VEX.128.66.0F.WIG E6 /r VCVTTPD2DQ xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_CVTDPD2DQ_VdqWdq, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vcvtpd2ps_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/cvtpd2ps
        // VEX.128.66.0F.WIG 5A /r VCVTPD2PS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_CVTPD2PS_VsdWsd, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vcvtps2pd_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/cvtps2pd
        // VEX.128.0F.WIG 5A /r VCVTPS2PD xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_CVTPS2PD_VsdWsd, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vpacksswb_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/packsswb:packssdw
        // VEX.128.66.0F.WIG 63 /r VPACKSSWB xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PACKSSWB_VdqWdq, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vpackuswb_rrr(XMMRegisterID upper, XMMRegisterID lower, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/packuswb
        // VEX.128.66.0F.WIG 67 /r VPACKUSWB xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PACKUSWB_VdqWdq, (RegisterID)dest, (RegisterID)lower, (RegisterID)upper);
    }

    void vpackssdw_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/packsswb:packssdw
        // VEX.128.66.0F.WIG 6B /r VPACKSSDW xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PACKSSDW_VdqWdq, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vpackusdw_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/packusdw
        // VEX.128.66.0F38 2B /r VPACKUSDW xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VPACKUSDW_VxHxWx, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vpmovsxbw_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovsx
        // VEX.128.66.0F38.WIG 20 /r VPMOVSXBW xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VPMOVSXBW_VxUx, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vpmovzxbw_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovzx
        // VEX.128.66.0F38.WIG 30 /r VPMOVZXBW xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VPMOVZXBW_VxUx, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vpmovsxwd_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovsx
        // VEX.128.66.0F38.WIG 23 /r VPMOVSXWD xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VPMOVSXWD_VxUx, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vpmovzxwd_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovzx
        // VEX.128.66.0F38.WIG 33 /r VPMOVZXWD xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VPMOVZXWD_VxUx, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vpmovsxdq_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovsx
        // VEX.128.66.0F38.WIG 25 /r VPMOVSXDQ xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VPMOVSXDQ_VxUx, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vpmovzxdq_rr(XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmovzx
        // VEX.128.66.0F38.WIG 35 /r VPMOVZXDQ xmm1, xmm2/m64
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_VPMOVZXDQ_VxUx, (RegisterID)xmm1, (RegisterID)0, (RegisterID)xmm2);
    }

    void vunpckhpd_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/unpckhpd
        // VEX.128.66.0F.WIG 15 /r VUNPCKHPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_UNPCKHPD_VpdWpd, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vpand_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pand
        // VEX.128.66.0F.WIG DB /r VPAND xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_VPAND_VxHxWx, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vandps_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/andps
        // VEX.128.0F 54 /r VANDPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_00, OP2_ANDPS_VpsWps, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vandpd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/andpd
        // VEX.128.66.0F 54 /r VANDPD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_ANDPD_VpdWpd, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vandpd_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/andpd
        // VEX.128.66.0F 54 /r VANDPD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_ANDPD_VpdWpd, (RegisterID)dest, (RegisterID)src2, base, offset);
    }

    void vorps_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/orps
        // VEX.128.0F 56 /r VORPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_00, OP2_ORPS_VpsWps, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vorpd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/orpd
        // VEX.128.66.0F 56 /r VORPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_ORPD_VpdWpd, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vxorps_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/xorps
        // VEX.128.0F.WIG 57 /r VXORPS xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_00, OP2_XORPS_VpsWps, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vxorpd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/xorpd
        // VEX.128.66.0F.WIG 57 /r VXORPD xmm1,xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_66, OP2_XORPD_VpdWpd, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vandnps_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/andnps
        // VEX.128.0F 55 /r VANDNPS xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_ANDNPS_VpsWps, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vandnpd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/andnpd
        // VEX.128.66.0F 55 /r VANDNPD xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_ANDNPD_VpdWpd, (RegisterID)dest, (RegisterID)b, (RegisterID)a);
    }

    void vpmovmskb_rr(XMMRegisterID input, RegisterID dest)
    {
        // https://www.felixcloutier.com/x86/pmovmskb
        // VEX.128.66.0F.WIG D7 /r VPMOVMSKB reg, xmm1
        // RM    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PMOVMSKB_EqWdq, (RegisterID)dest, (RegisterID)0, (RegisterID)input);
    }

    void vmovshdup_rr(XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/movshdup
        // VEX.128.F3.0F.WIG 16 /r VMOVSHDUP xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_MOVSHDUP_VqWq, (RegisterID)dest, (RegisterID)0, (RegisterID)input);
    }

    void vmovhlps_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/movhlps
        // VEX.128.0F.WIG 12 /r VMOVHLPS xmm1, xmm2, xmm3
        // RVM    ModRM:reg (w)    vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVHLPS_VqUq, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vmovsd_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/movsd
        // VEX.LIG.F2.0F.WIG 10 /r VMOVSD xmm1, xmm2, xmm3
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MOVSD_VsdWsd, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vmovmskps_rr(XMMRegisterID input, RegisterID dest)
    {
        // https://www.felixcloutier.com/x86/movmskps
        // VEX.128.0F.WIG 50 /r VMOVMSKPS reg, xmm2
        // RM    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVMSKPS_EqWps, (RegisterID)dest, (RegisterID)0, (RegisterID)input);
    }

    void vmovmskpd_rr(XMMRegisterID input, RegisterID dest)
    {
        // https://www.felixcloutier.com/x86/movmskpd
        // VEX.128.66.0F.WIG 50 /r VMOVMSKPD reg, xmm2
        // RM    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MOVMSKPD_EqWpd, (RegisterID)dest, (RegisterID)0, (RegisterID)input);
    }

    void vptest_rr(XMMRegisterID a, XMMRegisterID b)
    {
        // https://www.felixcloutier.com/x86/ptest
        // VEX.128.66.0F38.WIG 17 /r VPTEST xmm1, xmm2/m128
        // RM    ModRM:reg (r)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PTEST_VdqWdq, (RegisterID)b, (RegisterID)0, (RegisterID)a);
    }

    void vpsllw_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psllw:pslld:psllq
        // VEX.128.66.0F.WIG F1 /r VPSLLW xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSLLW_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vpslld_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psllw:pslld:psllq
        // VEX.128.66.0F.WIG F2 /r VPSLLD xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSLLD_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vpsllq_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psllw:pslld:psllq
        // VEX.128.66.0F.WIG F3 /r VPSLLQ xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSLLQ_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vpsrlw_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG D1 /r VPSRLW xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRLW_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vpsrld_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG D2 /r VPSRLD xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRLD_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vpsrlq_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psrlw:psrld:psrlq
        // VEX.128.66.0F.WIG D3 /r VPSRLQ xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRLQ_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vpsraw_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psraw:psrad:psraq
        // VEX.128.66.0F.WIG E1 /r VPSRAW xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRAW_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vpsrad_rrr(XMMRegisterID shift, XMMRegisterID input, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/psraw:psrad:psraq
        // VEX.128.66.0F.WIG E2 /r VPSRAD xmm1, xmm2, xmm3/m128
        // C    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_PSRAD_VdqWdq, (RegisterID)dest, (RegisterID)input, (RegisterID)shift);
    }

    void vmovd_rr(RegisterID src, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/movd:movq
        // VEX.128.66.0F.W0 6E / VMOVD xmm1, r32/m32
        // A   NA   ModRM:reg (w)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MOVD_VdEd, (RegisterID)dest, (RegisterID)0, src);
    }

    void vmovd_rr(XMMRegisterID src, RegisterID dest)
    {
        // https://www.felixcloutier.com/x86/movd:movq
        // VEX.128.66.0F.W0 7E /r VMOVD r32/m32, xmm1
        // B   NA   ModRM:r/m (w)   ModRM:reg (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MOVD_EdVd, (RegisterID)src, (RegisterID)0, dest);
    }

    void vmovq_rr(RegisterID src, XMMRegisterID dest)
    {
        // https://www.felixcloutier.com/x86/movd:movq
        // VEX.128.66.0F.W1 6E /r VMOVQ xmm1, r64/m64
        // A   NA   ModRM:reg (w)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_66, VexW::W1, OP2_MOVQ_PqQq, (RegisterID)dest, (RegisterID)0, src);
    }

    void vmovq_rr(XMMRegisterID src, RegisterID dest)
    {
        // https://www.felixcloutier.com/x86/movd:movq
        // VEX.128.66.0F.W1 7E /r VMOVQ r64/m64, xmm1
        // B   NA   ModRM:r/m (w)   ModRM:reg (r)   NA   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_66, VexW::W1, OP2_MOVQ_QqPq, (RegisterID)src, (RegisterID)0, dest);
    }

    void vmovdqa_rr(XMMRegisterID vn, XMMRegisterID vd)
    {
        // https://www.felixcloutier.com/x86/movdqa:vmovdqa32:vmovdqa64
        // VEX.128.66.0F.WIG 6F /r VMOVDQA xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_MOVDQA_VdqWdq, (RegisterID)vd, (RegisterID)0, (RegisterID)vn);
    }

    void vpmaddubsw_rrr(XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pmaddubsw
        // VEX.128.66.0F38.WIG 04 /r VPMADDUBSW xmm1, xmm2, xmm3/m128
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp38, OP3_PMADDUBSW_VpdWpd, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
    }

    void vpblendw_i8rrr(uint8_t imm8, XMMRegisterID xmm3, XMMRegisterID xmm2, XMMRegisterID xmm1)
    {
        // https://www.felixcloutier.com/x86/pblendw
        // VEX.128.66.0F3A.WIG 0E /r ib VPBLENDW xmm1, xmm2, xmm3/m128, imm8
        // RVMI    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    imm8
        m_formatter.vexNdsLigWigThreeByteOp(PRE_SSE_66, VexImpliedBytes::ThreeBytesOp3A, OP3_VPBLENDW_VxHxWxIb, (RegisterID)xmm1, (RegisterID)xmm2, (RegisterID)xmm3);
        m_formatter.immediate8(imm8);
    }

    void vaddsd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/addsd
        // VEX.LIG.F2.0F.WIG 58 /r VADDSD xmm1, xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_F2, OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)b, (RegisterID)a);
    }

    void vaddsd_mrr(int offset, RegisterID base, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/addsd
        // VEX.LIG.F2.0F.WIG 58 /r VADDSD xmm1, xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)b, base, offset);
    }

    void vaddsd_mrr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/addsd
        // VEX.LIG.F2.0F.WIG 58 /r VADDSD xmm1, xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)b, offset, base, index, scale);
    }

    void vaddss_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/addss
        // VEX.LIG.F3.0F.WIG 58 /r VADDSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_F3, OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)b, (RegisterID)a);
    }

    void vaddss_mrr(int offset, RegisterID base, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/addss
        // VEX.LIG.F3.0F.WIG 58 /r VADDSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)b, base, offset);
    }

    void vaddss_mrr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/addss
        // VEX.LIG.F3.0F.WIG 58 /r VADDSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_ADDSD_VsdWsd, (RegisterID)dst, (RegisterID)b, offset, base, index, scale);
    }

    void vmovups_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movups
        // VEX.128.0F.WIG 10 /r VMOVUPS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVUPS_VsdWsd, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    void vmovups_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movups
        // VEX.128.0F.WIG 10 /r VMOVUPS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVUPS_VsdWsd, (RegisterID)dst, (RegisterID)0, offset, base, index, scale);
    }

    void vmovups_rm(XMMRegisterID src, int offset, RegisterID base)
    {
        // https://www.felixcloutier.com/x86/movups
        // VEX.128.0F.WIG 11 /r VMOVUPS xmm2/m128, xmm1
        // B    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVUPS_WsdVsd, (RegisterID)src, (RegisterID)0, base, offset);
    }

    void vmovups_rm(XMMRegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        // https://www.felixcloutier.com/x86/movups
        // VEX.128.0F.WIG 11 /r VMOVUPS xmm2/m128, xmm1
        // B    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVUPS_WsdVsd, (RegisterID)src, (RegisterID)0, offset, base, index, scale);
    }

    void vmovaps_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movaps
        // VEX.128.0F.WIG 28 /r VMOVAPS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVAPS_VpsWps, (RegisterID)dst, (RegisterID)0, (RegisterID)src);
    }

    void vmovaps_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movaps
        // VEX.128.0F.WIG 28 /r VMOVAPS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVAPS_VpsWps, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    void vmovaps_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movaps
        // VEX.128.0F.WIG 28 /r VMOVAPS xmm1, xmm2/m128
        // A    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVAPS_VpsWps, (RegisterID)dst, (RegisterID)0, offset, base, index, scale);
    }

    void vmovaps_rm(XMMRegisterID src, int offset, RegisterID base)
    {
        // https://www.felixcloutier.com/x86/movaps
        // VEX.128.0F.WIG 29 /r VMOVAPS xmm2/m128, xmm1
        // B    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVAPS_WpsVps, (RegisterID)src, (RegisterID)0, base, offset);
    }

    void vmovaps_rm(XMMRegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        // https://www.felixcloutier.com/x86/movaps
        // VEX.128.0F.WIG 29 /r VMOVAPS xmm2/m128, xmm1
        // B    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_MOVAPS_WpsVps, (RegisterID)src, (RegisterID)0, offset, base, index, scale);
    }

    void vmovsd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movsd
        // VEX.LIG.F2.0F.WIG 10 /r VMOVSD xmm1, m64
        // D    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MOVSD_VsdWsd, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    void vmovsd_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movsd
        // VEX.LIG.F2.0F.WIG 10 /r VMOVSD xmm1, m64
        // D    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MOVSD_VsdWsd, (RegisterID)dst, (RegisterID)0, offset, base, index, scale);
    }

    void vmovsd_rm(XMMRegisterID src, int offset, RegisterID base)
    {
        // https://www.felixcloutier.com/x86/movsd
        // VEX.LIG.F2.0F.WIG 11 /r VMOVSD m64, xmm1
        // C    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MOVSD_WsdVsd, (RegisterID)src, (RegisterID)0, base, offset);
    }

    void vmovsd_rm(XMMRegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        // https://www.felixcloutier.com/x86/movsd
        // VEX.LIG.F2.0F.WIG 11 /r VMOVSD m64, xmm1
        // C    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MOVSD_WsdVsd, (RegisterID)src, (RegisterID)0, offset, base, index, scale);
    }

    void vmovss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movss
        // VEX.LIG.F3.0F.WIG 10 /r VMOVSS xmm1, m32
        // D    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_MOVSS_VsdWsd, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    void vmovss_mr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/movss
        // VEX.LIG.F3.0F.WIG 10 /r VMOVSS xmm1, m32
        // D    NA    ModRM:reg (w)    ModRM:r/m (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_MOVSS_VsdWsd, (RegisterID)dst, (RegisterID)0, offset, base, index, scale);
    }

    void vmovss_rm(XMMRegisterID src, int offset, RegisterID base)
    {
        // https://www.felixcloutier.com/x86/movss
        // VEX.LIG.F3.0F.WIG 11 /r VMOVSS m32, xmm1
        // C    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_MOVSS_WsdVsd, (RegisterID)src, (RegisterID)0, base, offset);
    }

    void vmovss_rm(XMMRegisterID src, int offset, RegisterID base, RegisterID index, int scale)
    {
        // https://www.felixcloutier.com/x86/movss
        // VEX.LIG.F3.0F.WIG 11 /r VMOVSS m32, xmm1
        // C    NA    ModRM:r/m (w)    ModRM:reg (r)    NA    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_MOVSS_WsdVsd, (RegisterID)src, (RegisterID)0, offset, base, index, scale);
    }

    void vmulsd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/mulsd
        // VEX.LIG.F2.0F.WIG 59 /r VMULSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_F2, OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)b, (RegisterID)a);
    }

    void vmulsd_mrr(int offset, RegisterID base, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/mulsd
        // VEX.LIG.F2.0F.WIG 59 /r VMULSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)b, base, offset);
    }

    void vmulsd_mrr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/mulsd
        // VEX.LIG.F2.0F.WIG 59 /r VMULSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)b, offset, base, index, scale);
    }

    void vmulss_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/mulss
        // VEX.LIG.F3.0F.WIG 59 /r VMULSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigCommutativeTwoByteOp(PRE_SSE_F3, OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)b, (RegisterID)a);
    }

    void vmulss_mrr(int offset, RegisterID base, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/mulss
        // VEX.LIG.F3.0F.WIG 59 /r VMULSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)b, base, offset);
    }

    void vmulss_mrr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/mulss
        // VEX.LIG.F3.0F.WIG 59 /r VMULSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_MULSD_VsdWsd, (RegisterID)dst, (RegisterID)b, offset, base, index, scale);
    }

    void vsubsd_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/subsd
        // VEX.LIG.F2.0F.WIG 5C /r VSUBSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)b, (RegisterID)a);
    }

    void vsubsd_mrr(int offset, RegisterID base, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/subsd
        // VEX.LIG.F2.0F.WIG 5C /r VSUBSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)b, base, offset);
    }

    void vsubsd_mrr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/subsd
        // VEX.LIG.F2.0F.WIG 5C /r VSUBSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)b, offset, base, index, scale);
    }

    void vsubss_rrr(XMMRegisterID a, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/subss
        // VEX.LIG.F3.0F.WIG 5C /r VSUBSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)b, (RegisterID)a);
    }

    void vsubss_mrr(int offset, RegisterID base, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/subss
        // VEX.LIG.F3.0F.WIG 5C /r VSUBSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)b, base, offset);
    }

    void vsubss_mrr(int offset, RegisterID base, RegisterID index, int scale, XMMRegisterID b, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/subss
        // VEX.LIG.F3.0F.WIG 5C /r VSUBSS xmm1,xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_SUBSD_VsdWsd, (RegisterID)dst, (RegisterID)b, offset, base, index, scale);
    }

    void vsqrtsd_rrr(XMMRegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/sqrtsd
        // VEX.LIG.F2.0F.WIG 51/r VSQRTSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_SQRTSD_VsdWsd, (RegisterID)dst, (RegisterID)src2, (RegisterID)src1);
    }

    void vsqrtsd_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/sqrtsd
        // VEX.LIG.F2.0F.WIG 51/r VSQRTSD xmm1,xmm2, xmm3/m64
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_SQRTSD_VsdWsd, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vsqrtss_rrr(XMMRegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/sqrtss
        // VEX.LIG.F3.0F.WIG 51 /r VSQRTSS xmm1, xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_SQRTSS_VssWss, (RegisterID)dst, (RegisterID)src2, (RegisterID)src1);
    }

    void vsqrtss_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/sqrtss
        // VEX.LIG.F3.0F.WIG 51 /r VSQRTSS xmm1, xmm2, xmm3/m32
        // B    NA    ModRM:reg (w)    VEX.vvvv (r)    ModRM:r/m (r)    NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_SQRTSS_VssWss, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vcvtsd2ss_rrr(XMMRegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsd2ss
        // VEX.LIG.F2.0F.WIG 5A /r VCVTSD2SS xmm1,xmm2, xmm3/m64
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_CVTSD2SS_VsdWsd, (RegisterID)dst, (RegisterID)src2, (RegisterID)src1);
    }

    void vcvtsd2ss_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsd2ss
        // VEX.LIG.F2.0F.WIG 5A /r VCVTSD2SS xmm1,xmm2, xmm3/m64
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_CVTSD2SS_VsdWsd, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vcvtss2sd_rrr(XMMRegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtss2sd
        // VEX.LIG.F3.0F.WIG 5A /r VCVTSS2SD xmm1, xmm2, xmm3/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_CVTSS2SD_VsdWsd, (RegisterID)dst, (RegisterID)src2, (RegisterID)src1);
    }

    void vcvtss2sd_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtss2sd
        // VEX.LIG.F3.0F.WIG 5A /r VCVTSS2SD xmm1, xmm2, xmm3/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_CVTSS2SD_VsdWsd, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vcvtsi2sd_rrr(RegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2sd
        // VEX.LIG.F2.0F.W0 2A /r VCVTSI2SD xmm1, xmm2, r/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_CVTSI2SD_VsdEd, (RegisterID)dst, (RegisterID)src2, (RegisterID)src1);
    }

    void vcvtsi2sd_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2sd
        // VEX.LIG.F2.0F.W0 2A /r VCVTSI2SD xmm1, xmm2, r/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_CVTSI2SD_VsdEd, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vcvtsi2ss_rrr(RegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2ss
        // VEX.LIG.F3.0F.W0 2A /r VCVTSI2SS xmm1, xmm2, r/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_CVTSI2SS_VssEs, (RegisterID)dst, (RegisterID)src2, (RegisterID)src1);
    }

    void vcvtsi2ss_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2ss
        // VEX.LIG.F3.0F.W0 2A /r VCVTSI2SS xmm1, xmm2, r/m32
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_CVTSI2SS_VssEs, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vcvttsd2si_rr(XMMRegisterID src, RegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvttsd2si
        // VEX.LIG.F2.0F.W0 2C /r VCVTTSD2SI r32, xmm1/m64
        // A   NA   ModRM:reg (w)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F2, OP2_CVTTSD2SI_GdWsd, dst, (RegisterID)0, (RegisterID)src);
    }

    void vcvttss2si_rr(XMMRegisterID src, RegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvttss2si
        // VEX.LIG.F3.0F.W0 2C /r VCVTTSS2SI r32, xmm1/m32
        // A   NA   ModRM:reg (w)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_F3, OP2_CVTTSS2SI_GdWsd, dst, (RegisterID)0, (RegisterID)src);
    }

    void vcvttsd2siq_rr(XMMRegisterID src, RegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvttsd2si
        // VEX.LIG.F2.0F.W1 2C /r VCVTTSD2SI r64, xmm1/m64
        // B   Tuple1 Fixed   ModRM:reg (w)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_F2, VexW::W1, OP2_CVTTSD2SI_GdWsd, dst, (RegisterID)0, (RegisterID)src);
    }

    void vcvttss2siq_rr(XMMRegisterID src, RegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvttss2si
        // VEX.LIG.F3.0F.W1 2C /r VCVTTSS2SI r64, xmm1/m32
        // A   NA   ModRM:reg (w)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_F3, VexW::W1, OP2_CVTTSS2SI_GdWsd, dst, (RegisterID)0, (RegisterID)src);
    }

    void vcvtsi2sdq_rrr(RegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2sd
        // VEX.LIG.F2.0F.W1 2A /r VCVTSI2SD xmm1, xmm2, r/m64
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_F2, VexW::W1, OP2_CVTSI2SD_VsdEd, (RegisterID)dst, (RegisterID)src2, src1);
    }

    void vcvtsi2sdq_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2sd
        // VEX.LIG.F2.0F.W1 2A /r VCVTSI2SD xmm1, xmm2, r/m64
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_F2, VexW::W1, OP2_CVTSI2SD_VsdEd, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vcvtsi2ssq_rrr(RegisterID src1, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2ss.html
        // VEX.LIG.F3.0F.W1 2A /r VCVTSI2SS xmm1, xmm2, r/m64
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_F3, VexW::W1, OP2_CVTSI2SS_VssEs, (RegisterID)dst, (RegisterID)src2, src1);
    }

    void vcvtsi2ssq_mrr(int offset, RegisterID base, XMMRegisterID src2, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/cvtsi2ss.html
        // VEX.LIG.F3.0F.W1 2A /r VCVTSI2SS xmm1, xmm2, r/m64
        // B   NA   ModRM:reg (w)   VEX.vvvv (r)   ModRM:r/m (r)   NA
        m_formatter.vexNdsLigTwoByteOp(PRE_SSE_F3, VexW::W1, OP2_CVTSI2SS_VssEs, (RegisterID)dst, (RegisterID)src2, base, offset);
    }

    void vucomisd_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/ucomisd
        // VEX.LIG.66.0F.WIG 2E /r VUCOMISD xmm1, xmm2/m64
        // A   NA   ModRM:reg (r)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_UCOMISD_VsdWsd, (RegisterID)dst, (RegisterID)0, (RegisterID)src);
    }

    void vucomisd_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/ucomisd
        // VEX.LIG.66.0F.WIG 2E /r VUCOMISD xmm1, xmm2/m64
        // A   NA   ModRM:reg (r)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_66, OP2_UCOMISD_VsdWsd, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    void vucomiss_rr(XMMRegisterID src, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/ucomiss
        // VEX.LIG.0F.WIG 2E /r VUCOMISS xmm1, xmm2/m32
        // A   NA   ModRM:reg (r)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_UCOMISS_VssWss, (RegisterID)dst, (RegisterID)0, (RegisterID)src);
    }

    void vucomiss_mr(int offset, RegisterID base, XMMRegisterID dst)
    {
        // https://www.felixcloutier.com/x86/ucomiss
        // VEX.LIG.0F.WIG 2E /r VUCOMISS xmm1, xmm2/m32
        // A   NA   ModRM:reg (r)   ModRM:r/m (r)   NA   NA
        m_formatter.vexNdsLigWigTwoByteOp(PRE_SSE_00, OP2_UCOMISS_VssWss, (RegisterID)dst, (RegisterID)0, base, offset);
    }

    // Assembler admin methods:

    size_t codeSize() const
    {
        return m_formatter.codeSize();
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
    
    AssemblerLabel labelIgnoringWatchpoints()
    {
        return m_formatter.label();
    }

    AssemblerLabel label()
    {
        AssemblerLabel result = m_formatter.label();
        while (UNLIKELY(static_cast<int>(result.offset()) < m_indexOfTailOfLastWatchpoint)) {
            nop();
            result = m_formatter.label();
        }
        return result;
    }

    AssemblerLabel align(int alignment)
    {
        while (!m_formatter.isAligned(alignment))
            m_formatter.oneByteOp(OP_HLT);

        return label();
    }

    // Linking & patching:
    //
    // 'link' and 'patch' methods are for use on unprotected code - such as the code
    // within the AssemblerBuffer, and code being patched by the patch buffer.  Once
    // code has been finalized it is (platform support permitting) within a non-
    // writable region of memory; to modify the code in an execute-only execuable
    // pool the 'repatch' and 'relink' methods should be used.

    void linkJump(AssemblerLabel from, AssemblerLabel to)
    {
        ASSERT(from.isSet());
        ASSERT(to.isSet());

        char* code = static_cast<char*>(m_formatter.data());
        ASSERT(!WTF::unalignedLoad<int32_t>(std::bit_cast<int32_t*>(code + from.offset()) - 1));
        setRel32(code + from.offset(), code + to.offset());
    }
    
    static void linkJump(void* code, AssemblerLabel from, void* to)
    {
        ASSERT(from.isSet());

        setRel32(static_cast<char*>(code) + from.offset(), to);
    }

    static void linkCall(void* code, AssemblerLabel from, void* to)
    {
        ASSERT(from.isSet());

        setRel32(static_cast<char*>(code) + from.offset(), to);
    }

    static void linkPointer(void* code, AssemblerLabel where, void* value)
    {
        ASSERT(where.isSet());

        setPointer(static_cast<char*>(code) + where.offset(), value);
    }

    static void relinkJump(void* from, void* to)
    {
        setRel32(from, to);
    }
    
    static void relinkCall(void* from, void* to)
    {
        setRel32(from, to);
    }

    static void relinkTailCall(void* from, void* to)
    {
        relinkJump(from, to);
    }

    static void repatchPointer(void* where, void* value)
    {
        setPointer(where, value);
    }
    
    static void* readPointer(void* where)
    {
        return WTF::unalignedLoad<void*>(std::bit_cast<void**>(where) - 1);
    }

    static void replaceWithHlt(void* instructionStart)
    {
#if ENABLE(MPROTECT_RX_TO_RWX)
        uint8_t op = OP_HLT;
        performJITMemcpy(instructionStart, &op, 1);
#else
        WTF::unalignedStore<uint8_t>(instructionStart, static_cast<uint8_t>(OP_HLT));
#endif
    }

    static void replaceWithJump(void* instructionStart, void* to)
    {
        uint8_t* ptr = std::bit_cast<uint8_t*>(instructionStart);
        uint8_t* dstPtr = std::bit_cast<uint8_t*>(to);
        intptr_t distance = (intptr_t)(dstPtr - (ptr + 5));
#if ENABLE(MPROTECT_RX_TO_RWX)
        uint8_t buffer[5];
        buffer[0] = static_cast<uint8_t>(OP_JMP_rel32);
        WTF::unalignedStore<int32_t>(buffer + 1, static_cast<int32_t>(distance));
        performJITMemcpy(ptr, buffer, 5);
#else
        WTF::unalignedStore<uint8_t>(ptr, static_cast<uint8_t>(OP_JMP_rel32));
        WTF::unalignedStore<int32_t>(ptr + 1, static_cast<int32_t>(distance));
#endif
    }

    static void replaceWithNops(void* instructionStart, size_t memoryToFillWithNopsInBytes)
    {
#if ENABLE(MPROTECT_RX_TO_RWX)
        fillNops<MachineCodeCopyMode::JITMemcpy>(instructionStart, memoryToFillWithNopsInBytes);
#else
        fillNops<MachineCodeCopyMode::Memcpy>(instructionStart, memoryToFillWithNopsInBytes);
#endif
    }

    static constexpr ptrdiff_t maxJumpReplacementSize()
    {
        return 5;
    }

    static constexpr ptrdiff_t patchableJumpSize()
    {
        return 5;
    }
    
    static void revertJumpTo_movq_i64r(void* instructionStart, int64_t imm, RegisterID dst)
    {
        constexpr unsigned instructionSize = 10; // REX.W MOV IMM64
        constexpr int rexBytes = 1;
        constexpr int opcodeBytes = 1;
        uint8_t* ptr = static_cast<uint8_t*>(instructionStart);

        union {
            uint64_t asWord;
            uint8_t asBytes[8];
        } u;
        u.asWord = imm;
#if ENABLE(MPROTECT_RX_TO_RWX)
        uint8_t buffer[instructionSize];
        buffer[0] = PRE_REX | (1 << 3) | (dst >> 3);
        buffer[1] = OP_MOV_EAXIv | (dst & 7);
        memcpy(buffer + rexBytes + opcodeBytes, u.asBytes, instructionSize - rexBytes - opcodeBytes);
        performJITMemcpy(ptr, buffer, instructionSize);
#else
        ptr[0] = PRE_REX | (1 << 3) | (dst >> 3);
        ptr[1] = OP_MOV_EAXIv | (dst & 7);
        for (unsigned i = rexBytes + opcodeBytes; i < instructionSize; ++i)
            ptr[i] = u.asBytes[i - rexBytes - opcodeBytes];
#endif
    }

    static void revertJumpTo_movl_i32r(void* instructionStart, int32_t imm, RegisterID dst)
    {
        // We only revert jumps on inline caches, and inline caches always use the scratch register (r11).
        // FIXME: If the above is ever false then we need to make this smarter with respect to emitting 
        // the REX byte.
        ASSERT(dst == X86Registers::r11);
        constexpr unsigned instructionSize = 6; // REX MOV IMM32
        constexpr int rexBytes = 1;
        constexpr int opcodeBytes = 1;
        uint8_t* ptr = static_cast<uint8_t*>(instructionStart);

        union {
            uint32_t asWord;
            uint8_t asBytes[4];
        } u;
        u.asWord = imm;
#if ENABLE(MPROTECT_RX_TO_RWX)
        uint8_t buffer[instructionSize];
        buffer[0] = PRE_REX | (1 << 3) | (dst >> 3);
        buffer[1] = OP_MOV_EAXIv | (dst & 7);
        memcpy(buffer + rexBytes + opcodeBytes, u.asBytes, instructionSize - rexBytes - opcodeBytes);
        performJITMemcpy(ptr, buffer, instructionSize);
#else
        ptr[0] = PRE_REX | (dst >> 3);
        ptr[1] = OP_MOV_EAXIv | (dst & 7);
        for (unsigned i = rexBytes + opcodeBytes; i < instructionSize; ++i)
            ptr[i] = u.asBytes[i - rexBytes - opcodeBytes];
#endif
    }

    static void revertJumpTo_cmpl_ir_force32(void* instructionStart, int32_t imm, RegisterID dst)
    {
        constexpr int opcodeBytes = 1;
        constexpr int modRMBytes = 1;
        ASSERT(opcodeBytes + modRMBytes <= maxJumpReplacementSize());
        uint8_t* ptr = static_cast<uint8_t*>(instructionStart);
        union {
            uint32_t asWord;
            uint8_t asBytes[4];
        } u;
        u.asWord = imm;
#if ENABLE(MPROTECT_RX_TO_RWX)
        uint8_t buffer[maxJumpReplacementSize()];
        buffer[0] = OP_GROUP1_EvIz;
        buffer[1] = (X86InstructionFormatter::ModRmRegister << 6) | (GROUP1_OP_CMP << 3) | dst;
        memcpy(buffer + 2, u.asBytes, maxJumpReplacementSize() - opcodeBytes - modRMBytes);
        performJITMemcpy(ptr, buffer, maxJumpReplacementSize());
#else
        ptr[0] = OP_GROUP1_EvIz;
        ptr[1] = (X86InstructionFormatter::ModRmRegister << 6) | (GROUP1_OP_CMP << 3) | dst;
        for (unsigned i = opcodeBytes + modRMBytes; i < static_cast<unsigned>(maxJumpReplacementSize()); ++i)
            ptr[i] = u.asBytes[i - opcodeBytes - modRMBytes];
#endif
    }
    
    static void revertJumpTo_cmpl_im_force32(void* instructionStart, int32_t imm, int offset, RegisterID dst)
    {
        ASSERT_UNUSED(offset, !offset);
        constexpr int opcodeBytes = 1;
        constexpr int modRMBytes = 1;
        ASSERT(opcodeBytes + modRMBytes <= maxJumpReplacementSize());
        uint8_t* ptr = static_cast<uint8_t*>(instructionStart);
        union {
            uint32_t asWord;
            uint8_t asBytes[4];
        } u;
        u.asWord = imm;
#if ENABLE(MPROTECT_RX_TO_RWX)
        uint8_t buffer[maxJumpReplacementSize()];
        buffer[0] = OP_GROUP1_EvIz;
        buffer[1] = (X86InstructionFormatter::ModRmMemoryNoDisp << 6) | (GROUP1_OP_CMP << 3) | dst;
        memcpy(buffer + 2, u.asBytes, maxJumpReplacementSize() - opcodeBytes - modRMBytes);
        performJITMemcpy(ptr, buffer, maxJumpReplacementSize());
#else
        ptr[0] = OP_GROUP1_EvIz;
        ptr[1] = (X86InstructionFormatter::ModRmMemoryNoDisp << 6) | (GROUP1_OP_CMP << 3) | dst;
        for (unsigned i = opcodeBytes + modRMBytes; i < static_cast<unsigned>(maxJumpReplacementSize()); ++i)
            ptr[i] = u.asBytes[i - opcodeBytes - modRMBytes];
#endif
    }

    static unsigned getCallReturnOffset(AssemblerLabel call)
    {
        ASSERT(call.isSet());
        return call.offset();
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
    
    unsigned debugOffset() { return m_formatter.debugOffset(); }

    void nop()
    {
        m_formatter.oneByteOp(OP_NOP);
    }

    template<MachineCodeCopyMode copy>
    static void fillNops(void* base, size_t size)
    {
        UNUSED_PARAM(copy);
        static const uint8_t nops[10][10] = {
            // nop
            {0x90},
            // xchg %ax,%ax
            {0x66, 0x90},
            // nopl (%[re]ax)
            {0x0f, 0x1f, 0x00},
            // nopl 8(%[re]ax)
            {0x0f, 0x1f, 0x40, 0x08},
            // nopl 8(%[re]ax,%[re]ax,1)
            {0x0f, 0x1f, 0x44, 0x00, 0x08},
            // nopw 8(%[re]ax,%[re]ax,1)
            {0x66, 0x0f, 0x1f, 0x44, 0x00, 0x08},
            // nopl 512(%[re]ax)
            {0x0f, 0x1f, 0x80, 0x00, 0x02, 0x00, 0x00},
            // nopl 512(%[re]ax,%[re]ax,1)
            {0x0f, 0x1f, 0x84, 0x00, 0x00, 0x02, 0x00, 0x00},
            // nopw 512(%[re]ax,%[re]ax,1)
            {0x66, 0x0f, 0x1f, 0x84, 0x00, 0x00, 0x02, 0x00, 0x00},
            // nopw %cs:512(%[re]ax,%[re]ax,1)
            {0x66, 0x2e, 0x0f, 0x1f, 0x84, 0x00, 0x00, 0x02, 0x00, 0x00}
        };

        uint8_t* where = static_cast<uint8_t*>(base);
        while (size) {
            unsigned nopSize = static_cast<unsigned>(std::min<size_t>(size, 15));
            unsigned numPrefixes = nopSize <= 10 ? 0 : nopSize - 10;
            uint8_t buffer[16];
            uint8_t* bufferWriter = buffer;
            for (unsigned i = 0; i != numPrefixes; ++i)
                *bufferWriter++ = 0x66;

            unsigned nopRest = nopSize - numPrefixes;
            for (unsigned i = 0; i != nopRest; ++i)
                *bufferWriter++ = nops[nopRest-1][i];

            ASSERT(nopSize == bufferWriter - buffer);
            if constexpr (copy == MachineCodeCopyMode::JITMemcpy)
                performJITMemcpy(where, buffer, nopSize);
            else
                memcpy(where, buffer, nopSize);
            where += nopSize;
            size -= nopSize;
        }
    }

    // This is a no-op on x86
    ALWAYS_INLINE static void cacheFlush(void*, size_t) { }

private:

    static void setPointer(void* where, void* value)
    {
#if ENABLE(MPROTECT_RX_TO_RWX)
        performJITMemcpy(std::bit_cast<void**>(where) - 1, &value, sizeof(void*));
#else
        WTF::unalignedStore<void*>(std::bit_cast<void**>(where) - 1, value);
#endif
    }

    static void setInt32(void* where, int32_t value)
    {
#if ENABLE(MPROTECT_RX_TO_RWX)
        performJITMemcpy(std::bit_cast<int32_t*>(where) - 1, &value, sizeof(int32_t));
#else
        WTF::unalignedStore<int32_t>(std::bit_cast<int32_t*>(where) - 1, value);
#endif
    }
    
    static void setInt8(void* where, int8_t value)
    {
#if ENABLE(MPROTECT_RX_TO_RWX)
        performJITMemcpy(std::bit_cast<int8_t*>(where) - 1, &value, sizeof(int8_t));
#else
        WTF::unalignedStore<int8_t>(std::bit_cast<int8_t*>(where) - 1, value);
#endif
    }

    static void setRel32(void* from, void* to)
    {
        intptr_t offset = reinterpret_cast<intptr_t>(to) - reinterpret_cast<intptr_t>(from);
        ASSERT(offset == static_cast<int32_t>(offset));

        setInt32(from, offset);
    }

    class X86InstructionFormatter {
        static constexpr int maxInstructionSize = 16;

    public:
        enum ModRmMode {
            ModRmMemoryNoDisp = 0,
            ModRmMemoryDisp8 = 1 << 6,
            ModRmMemoryDisp32 = 2 << 6,
            ModRmRegister = 3 << 6,
        };

        // Legacy prefix bytes:
        //
        // These are emmitted prior to the instruction.

        void prefix(OneByteOpcodeID pre)
        {
            m_buffer.putByte(pre);
        }

        // Byte operand register spl & above require a REX prefix (to prevent the 'H' registers be accessed).
        static bool byteRegRequiresRex(int reg)
        {
            static_assert(X86Registers::esp == 4, "Necessary condition for OR-masking");
            return (reg >= X86Registers::esp);
        }
        static bool byteRegRequiresRex(int a, int b)
        {
            return byteRegRequiresRex(a | b);
        }

        // Registers r8 & above require a REX prefixe.
        static bool regRequiresRex(int reg)
        {
            static_assert(X86Registers::r8 == 8, "Necessary condition for OR-masking");
            return (reg >= X86Registers::r8);
        }
        static bool regRequiresRex(int a, int b)
        {
            return regRequiresRex(a | b);
        }
        static bool regRequiresRex(int a, int b, int c)
        {
            return regRequiresRex(a | b | c);
        }

        class SingleInstructionBufferWriter : public AssemblerBuffer::LocalWriter {
        public:
            SingleInstructionBufferWriter(AssemblerBuffer& buffer)
                : AssemblerBuffer::LocalWriter(buffer, maxInstructionSize)
            {
            }

            // Internals; ModRm and REX formatters.

            static constexpr RegisterID noBase = X86Registers::ebp;
            static constexpr RegisterID hasSib = X86Registers::esp;
            static constexpr RegisterID noIndex = X86Registers::esp;

            static constexpr RegisterID noBase2 = X86Registers::r13;
            static constexpr RegisterID hasSib2 = X86Registers::r12;

            // Format a REX prefix byte.
            ALWAYS_INLINE void emitRex(bool w, int r, int x, int b)
            {
                ASSERT(r >= 0);
                ASSERT(x >= 0);
                ASSERT(b >= 0);
                putByteUnchecked(PRE_REX | ((int)w << 3) | ((r>>3)<<2) | ((x>>3)<<1) | (b>>3));
            }

            // Used to plant a REX byte with REX.w set (for 64-bit operations).
            ALWAYS_INLINE void emitRexW(int r, int x, int b)
            {
                emitRex(true, r, x, b);
            }

            // Used for operations with byte operands - use byteRegRequiresRex() to check register operands,
            // regRequiresRex() to check other registers (i.e. address base & index).
            ALWAYS_INLINE void emitRexIf(bool condition, int r, int x, int b)
            {
                if (condition)
                    emitRex(false, r, x, b);
            }

            // Used for word sized operations, will plant a REX prefix if necessary (if any register is r8 or above).
            ALWAYS_INLINE void emitRexIfNeeded(int r, int x, int b)
            {
                emitRexIf(regRequiresRex(r, x, b), r, x, b);
            }

            ALWAYS_INLINE void putModRm(ModRmMode mode, int reg, RegisterID rm)
            {
                putByteUnchecked(mode | ((reg & 7) << 3) | (rm & 7));
            }

            ALWAYS_INLINE void putModRmSib(ModRmMode mode, int reg, RegisterID base, RegisterID index, int scale)
            {
                ASSERT(mode != ModRmRegister);

                putModRm(mode, reg, hasSib);
                putByteUnchecked((scale << 6) | ((index & 7) << 3) | (base & 7));
            }

            ALWAYS_INLINE void registerModRM(int reg, RegisterID rm)
            {
                putModRm(ModRmRegister, reg, rm);
            }

            ALWAYS_INLINE void memoryModRM(int reg, RegisterID base, int offset)
            {
                // A base of esp or r12 would be interpreted as a sib, so force a sib with no index & put the base in there.
                if ((base == hasSib) || (base == hasSib2)) {
                    if (!offset) // No need to check if the base is noBase, since we know it is hasSib!
                        putModRmSib(ModRmMemoryNoDisp, reg, base, noIndex, 0);
                    else if (CAN_SIGN_EXTEND_8_32(offset)) {
                        putModRmSib(ModRmMemoryDisp8, reg, base, noIndex, 0);
                        putByteUnchecked(offset);
                    } else {
                        putModRmSib(ModRmMemoryDisp32, reg, base, noIndex, 0);
                        putIntUnchecked(offset);
                    }
                } else {
                    if (!offset && (base != noBase) && (base != noBase2))
                        putModRm(ModRmMemoryNoDisp, reg, base);
                    else if (CAN_SIGN_EXTEND_8_32(offset)) {
                        putModRm(ModRmMemoryDisp8, reg, base);
                        putByteUnchecked(offset);
                    } else {
                        putModRm(ModRmMemoryDisp32, reg, base);
                        putIntUnchecked(offset);
                    }
                }
            }

            ALWAYS_INLINE void memoryModRM_disp8(int reg, RegisterID base, int offset)
            {
                // A base of esp or r12 would be interpreted as a sib, so force a sib with no index & put the base in there.
                ASSERT(CAN_SIGN_EXTEND_8_32(offset));
                if ((base == hasSib) || (base == hasSib2)) {
                    putModRmSib(ModRmMemoryDisp8, reg, base, noIndex, 0);
                    putByteUnchecked(offset);
                } else {
                    putModRm(ModRmMemoryDisp8, reg, base);
                    putByteUnchecked(offset);
                }
            }

            ALWAYS_INLINE void memoryModRM_disp32(int reg, RegisterID base, int offset)
            {
                // A base of esp or r12 would be interpreted as a sib, so force a sib with no index & put the base in there.
                if ((base == hasSib) || (base == hasSib2)) {
                    putModRmSib(ModRmMemoryDisp32, reg, base, noIndex, 0);
                    putIntUnchecked(offset);
                } else {
                    putModRm(ModRmMemoryDisp32, reg, base);
                    putIntUnchecked(offset);
                }
            }
        
            ALWAYS_INLINE void memoryModRM(int reg, RegisterID base, RegisterID index, int scale, int offset)
            {
                ASSERT(index != noIndex);

                if (!offset && (base != noBase) && (base != noBase2))
                    putModRmSib(ModRmMemoryNoDisp, reg, base, index, scale);
                else if (CAN_SIGN_EXTEND_8_32(offset)) {
                    putModRmSib(ModRmMemoryDisp8, reg, base, index, scale);
                    putByteUnchecked(offset);
                } else {
                    putModRmSib(ModRmMemoryDisp32, reg, base, index, scale);
                    putIntUnchecked(offset);
                }
            }

            ALWAYS_INLINE void memoryModRMAddr(int reg, uint32_t address)
            {
                putModRmSib(ModRmMemoryNoDisp, reg, noBase, noIndex, 0);
                putIntUnchecked(address);
            }

            ALWAYS_INLINE void twoBytesVex(bool isVEX256, OneByteOpcodeID simdPrefix, RegisterID r, RegisterID vvvv)
            {
                // https://en.wikipedia.org/wiki/VEX_prefix
                // https://wiki.osdev.org/X86-64_Instruction_Encoding#REX_prefix
                // From Intel SDM volume 2
                uint8_t firstByte = static_cast<uint8_t>(VexPrefix::TwoBytes);       // 0xC5

                // R:    REX.R in 1’s complement (inverted) form 1: Same as REX.R=0 (must be 1 in 32-bit mode) 0: Same as REX.R=1 (64-bit mode only)
                // vvvv: a register specifier (in 1’s complement form) or 1111 if unused.
                // L:    Vector Length, 0: scalar or 128-bit vector, 1: 256-bit vector
                // pp:   opcode extension providing equivalent functionality of a SIMD prefix 00: None, 01: 66, 10: F3, 11: F2
                uint8_t secondByte = 0;
                secondByte |= !regRequiresRex(r) << 7;         // R
                secondByte |= (~vvvv & 0xf) << 3;              // vvvv
                secondByte |= isVEX256 << 2;                   // L
                secondByte |= vexEncodeSIMDPrefix(simdPrefix); // pp

                putByteUnchecked(firstByte);
                putByteUnchecked(secondByte);
            }

            ALWAYS_INLINE void twoBytesVex(OneByteOpcodeID simdPrefix, RegisterID inOpReg, RegisterID r)
            {
                constexpr bool isVEX256 = false;
                twoBytesVex(isVEX256, simdPrefix, r, inOpReg);
            }

            ALWAYS_INLINE void threeBytesVex(bool isVEX256, OneByteOpcodeID simdPrefix, VexImpliedBytes impliedBytes, bool isW1, RegisterID r, RegisterID x, RegisterID b, RegisterID vvvv)
            {
                // https://en.wikipedia.org/wiki/VEX_prefix
                // https://wiki.osdev.org/X86-64_Instruction_Encoding#REX_prefix
                // From Intel SDM volume 2
                uint8_t firstByte = static_cast<uint8_t>(VexPrefix::ThreeBytes);        // 0xC4

                // R:    REX.R in 1’s complement (inverted) form 1: Same as REX.R=0 (must be 1 in 32-bit mode) 0: Same as REX.R=1 (64-bit mode only)
                // X:    REX.X in 1’s complement (inverted) form 1: Same as REX.X=0 (must be 1 in 32-bit mode) 0: Same as REX.X=1 (64-bit mode only)
                // B:    REX.B in 1’s complement (inverted) form 1: Same as REX.B=0 (Ignored in 32-bit mode). 0: Same as REX.B=1 (64-bit mode only)
                // m-mmmm:
                //     00000: Reserved for future use (will #UD)
                //     00001: implied 0F leading opcode byte
                //     00010: implied 0F 38 leading opcode bytes
                //     00011: implied 0F 3A leading opcode bytes
                //     00100-11111: Reserved for future use (will #UD)
                uint8_t secondByte = 0;
                secondByte |= !regRequiresRex(r) << 7;            // R
                secondByte |= !regRequiresRex(x) << 6;            // X
                secondByte |= !regRequiresRex(b) << 5;            // B
                secondByte |= static_cast<uint8_t>(impliedBytes); // m-mmmm

                // W:    opcode specific (use like REX.W, or used for opcode extension, or ignored, depending on the opcode byte)
                // vvvv: a register specifier (in 1’s complement form) or 1111 if unused.
                // L:    Vector Length, 0: scalar or 128-bit vector, 1: 256-bit vector
                // pp:   opcode extension providing equivalent functionality of a SIMD prefix 00: None, 01: 66, 10: F3, 11: F2
                uint8_t thirdByte = 0;
                thirdByte |= isW1 << 7;                           // W
                thirdByte |= (~vvvv & 0xf) << 3;                  // vvvv
                thirdByte |= isVEX256 << 2;                       // L
                thirdByte |= vexEncodeSIMDPrefix(simdPrefix);     // pp

                putByteUnchecked(firstByte);
                putByteUnchecked(secondByte);
                putByteUnchecked(thirdByte);
            }

            ALWAYS_INLINE void threeBytesVexNds(OneByteOpcodeID simdPrefix, VexImpliedBytes impliedBytes, VexW vexW, RegisterID r, RegisterID inOpReg, RegisterID x, RegisterID b)
            {
                constexpr bool isVEX256 = false;
                threeBytesVex(isVEX256, simdPrefix, impliedBytes, vexW == VexW::W1, r, x, b, inOpReg);
            }

            ALWAYS_INLINE void threeBytesVexNds(OneByteOpcodeID simdPrefix, VexImpliedBytes impliedBytes, VexW vexW, RegisterID r, RegisterID inOpReg, RegisterID b)
            {
                constexpr bool isVEX256 = false;
                threeBytesVex(isVEX256, simdPrefix, impliedBytes, vexW == VexW::W1, r, (RegisterID)0, b, inOpReg);
            }

        private:
            uint8_t vexEncodeSIMDPrefix(OneByteOpcodeID simdPrefix)
            {
                // pp:   opcode extension providing equivalent functionality of a SIMD prefix
                //
                //     00: None
                //     01: 66
                //     10: F3
                //     11: F2
                //
                switch (simdPrefix) {
                case PRE_SSE_66:
                    return 0b01;
                case PRE_SSE_F3:
                    return 0b10;
                case PRE_SSE_F2:
                    return 0b11;
                default:
                    return 0b00;
                }
            }
        };

        // Word-sized operands / no operand instruction formatters.
        //
        // In addition to the opcode, the following operand permutations are supported:
        //   * None - instruction takes no operands.
        //   * One register - the low three bits of the RegisterID are added into the opcode.
        //   * Two registers - encode a register form ModRm (for all ModRm formats, the reg field is passed first, and a GroupOpcodeID may be passed in its place).
        //   * Three argument ModRM - a register, and a register and an offset describing a memory operand.
        //   * Five argument ModRM - a register, and a base register, an index, scale, and offset describing a memory operand.
        //
        // For 32-bit x86 targets, the address operand may also be provided as a void*.
        // On 64-bit targets REX prefixes will be planted as necessary, where high numbered registers are used.
        //
        // The twoByteOp methods plant two-byte Intel instructions sequences (first opcode byte 0x0F).

        void oneByteOp(OneByteOpcodeID opcode)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.putByteUnchecked(opcode);
        }

        void oneByteOp(OneByteOpcodeID opcode, RegisterID reg)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(0, 0, reg);
            writer.putByteUnchecked(opcode + (reg & 7));
        }

        void oneByteOp(OneByteOpcodeID opcode, int reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, rm);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        void oneByteOp(OneByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, offset);
        }

        void oneByteOp_disp32(OneByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM_disp32(reg, base, offset);
        }
        
        void oneByteOp_disp8(OneByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM_disp8(reg, base, offset);
        }

        void oneByteOp(OneByteOpcodeID opcode, int reg, RegisterID base, RegisterID index, int scale, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, index, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, index, scale, offset);
        }

        void oneByteOpAddr(OneByteOpcodeID opcode, int reg, uint32_t address)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.putByteUnchecked(opcode);
            writer.memoryModRMAddr(reg, address);
        }

        void twoByteOp(TwoByteOpcodeID opcode)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
        }

        void twoByteOp(TwoByteOpcodeID opcode, int reg)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(0, 0, reg);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode + (reg & 7));
        }

        void twoByteOp(TwoByteOpcodeID opcode, int reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, rm);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        void twoByteOp(TwoByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, base);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, offset);
        }

        void twoByteOp(TwoByteOpcodeID opcode, int reg, RegisterID base, RegisterID index, int scale, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, index, base);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, index, scale, offset);
        }

        void twoByteOpAddr(TwoByteOpcodeID opcode, int reg, uint32_t address)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.memoryModRMAddr(reg, address);
        }

        void vexNdsLigTwoByteOp(OneByteOpcodeID simdPrefix, VexW vexW, TwoByteOpcodeID opcode)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            if (vexW == VexW::W1)
                writer.threeBytesVexNds(simdPrefix, VexImpliedBytes::TwoBytesOp, vexW, (RegisterID)0, (RegisterID)0, (RegisterID)0);
            else
                writer.twoBytesVex(simdPrefix, (RegisterID)0, (RegisterID)0);
            writer.putByteUnchecked(opcode);
        }

        // Typically,
        //   xmm1 = ModRM:reg (w)
        //   xmm2 = VEX.vvvv (r)
        //   xmm3 = ModRM:r/m (r)
        // And xmm1 = dest, xmm2 = a, xmm3 = b
        void vexNdsLigTwoByteOp(OneByteOpcodeID simdPrefix, VexW vexW, TwoByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID b)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            // Section 3.1.1.2 from Intel SDM volume 2:
            // The presence of W1 in the opcode column implies the opcode must be encoded using the 3-byte form of the VEX prefix.
            if (regRequiresRex(b) || vexW == VexW::W1)
                writer.threeBytesVexNds(simdPrefix, VexImpliedBytes::TwoBytesOp, vexW, dest, a, b);
            else
                writer.twoBytesVex(simdPrefix, a, dest);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(dest, b);
        }

        void vexNdsLigTwoByteOp(OneByteOpcodeID simdPrefix, VexW vexW, TwoByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            if (regRequiresRex(base) || vexW == VexW::W1)
                writer.threeBytesVexNds(simdPrefix, VexImpliedBytes::TwoBytesOp, vexW, dest, a, base);
            else
                writer.twoBytesVex(simdPrefix, a, dest);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(dest, base, offset);
        }

        void vexNdsLigTwoByteOp(OneByteOpcodeID simdPrefix, VexW vexW, TwoByteOpcodeID opcode, RegisterID dest, RegisterID a, int offset, RegisterID base, RegisterID index, int scale)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            if (regRequiresRex(base, index) || vexW == VexW::W1)
                writer.threeBytesVexNds(simdPrefix, VexImpliedBytes::TwoBytesOp, vexW, dest, a, index, base);
            else
                writer.twoBytesVex(simdPrefix, a, dest);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(dest, base, index, scale, offset);
        }

        void vexNdsLigWigTwoByteOp(OneByteOpcodeID simdPrefix, TwoByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID b)
        {
            vexNdsLigTwoByteOp(simdPrefix, VexW::W0, opcode, dest, a, b);
        }

        void vexNdsLigWigCommutativeTwoByteOp(OneByteOpcodeID simdPrefix, TwoByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID b)
        {
            // Since this is a commutative operation, we can try switching the arguments.
            if (regRequiresRex(b))
                std::swap(a, b);
            vexNdsLigWigTwoByteOp(simdPrefix, opcode, dest, a, b);
        }

        void vexNdsLigWigTwoByteOp(OneByteOpcodeID simdPrefix, TwoByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID base, int offset)
        {
            vexNdsLigTwoByteOp(simdPrefix, VexW::W0, opcode, dest, a, base, offset);
        }

        void vexNdsLigWigTwoByteOp(OneByteOpcodeID simdPrefix, TwoByteOpcodeID opcode, RegisterID dest, RegisterID a, int offset, RegisterID base, RegisterID index, int scale)
        {
            vexNdsLigTwoByteOp(simdPrefix, VexW::W0, opcode, dest, a, offset, base, index, scale);
        }

        // Typically, xmm1 = dest, xmm2 = a, xmm3 = b
        // dest = reg, a = vvvv, b = r/m
        void vexNdsLigWigThreeByteOp(OneByteOpcodeID simdPrefix, VexImpliedBytes impliedBytes, ThreeByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID b)
        {
            vexNdsLigThreeByteOp(simdPrefix, impliedBytes, VexW::W0, opcode, dest, a, b);
        }

        void vexNdsLigWigThreeByteOp(OneByteOpcodeID simdPrefix, VexImpliedBytes impliedBytes, ThreeByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID base, int offset)
        {
            vexNdsLigThreeByteOp(simdPrefix, impliedBytes, VexW::W0, opcode, dest, a, base, offset);
        }

        // Typically, xmm1 = dest, xmm2 = a, xmm3 = b, but it depends.
        // dest = reg, a = vvvv, b = r/m
        void vexNdsLigThreeByteOp(OneByteOpcodeID simdPrefix, VexImpliedBytes impliedBytes, VexW vexW, ThreeByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID b)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            ASSERT(impliedBytes != VexImpliedBytes::TwoBytesOp);
            writer.threeBytesVex(/* isVEX256 */ false, simdPrefix, impliedBytes, vexW == VexW::W1, dest, (RegisterID)0, b, a);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(dest, b);
        }

        void vexNdsLigThreeByteOp(OneByteOpcodeID simdPrefix, VexImpliedBytes impliedBytes, VexW vexW, ThreeByteOpcodeID opcode, RegisterID dest, RegisterID a, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            ASSERT(impliedBytes != VexImpliedBytes::TwoBytesOp);
            writer.threeBytesVex(/* isVEX256 */ false, simdPrefix, impliedBytes, vexW == VexW::W1, dest, (RegisterID)0, base, a);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(dest, base, offset);
        }

        void threeByteOp(TwoByteOpcodeID twoBytePrefix, ThreeByteOpcodeID opcode)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(twoBytePrefix);
            writer.putByteUnchecked(opcode);
        }

        void threeByteOp(TwoByteOpcodeID twoBytePrefix, ThreeByteOpcodeID opcode, int reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, rm);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(twoBytePrefix);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        void threeByteOp(TwoByteOpcodeID twoBytePrefix, ThreeByteOpcodeID opcode, int reg, RegisterID base, int displacement)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIfNeeded(reg, 0, base);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(twoBytePrefix);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, displacement);
        }

        // Quad-word-sized operands:
        //
        // Used to format 64-bit operantions, planting a REX.w prefix.
        // When planting d64 or f64 instructions, not requiring a REX.w prefix,
        // the normal (non-'64'-postfixed) formatters should be used.

        void oneByteOp64(OneByteOpcodeID opcode)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(0, 0, 0);
            writer.putByteUnchecked(opcode);
        }

        void oneByteOp64(OneByteOpcodeID opcode, RegisterID reg)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(0, 0, reg);
            writer.putByteUnchecked(opcode + (reg & 7));
        }

        void oneByteOp64(OneByteOpcodeID opcode, int reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, rm);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        void oneByteOp64(OneByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, offset);
        }

        void oneByteOp64_disp32(OneByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM_disp32(reg, base, offset);
        }
        
        void oneByteOp64_disp8(OneByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM_disp8(reg, base, offset);
        }

        void oneByteOp64(OneByteOpcodeID opcode, int reg, RegisterID base, RegisterID index, int scale, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, index, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, index, scale, offset);
        }

        void oneByteOp64Addr(OneByteOpcodeID opcode, int reg, uint32_t address)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, 0);
            writer.putByteUnchecked(opcode);
            writer.memoryModRMAddr(reg, address);
        }

        void twoByteOp64(TwoByteOpcodeID opcode, int reg)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(0, 0, reg);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode + (reg & 7));
        }

        void twoByteOp64(TwoByteOpcodeID opcode, int reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, rm);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        void twoByteOp64(TwoByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, base);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, offset);
        }

        void twoByteOp64(TwoByteOpcodeID opcode, int reg, RegisterID base, RegisterID index, int scale, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, index, base);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, index, scale, offset);
        }
            
        void threeByteOp64(TwoByteOpcodeID twoBytePrefix, ThreeByteOpcodeID opcode, int reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexW(reg, 0, rm);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(twoBytePrefix);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        // Byte-operands:
        //
        // These methods format byte operations.  Byte operations differ from the normal
        // formatters in the circumstances under which they will decide to emit REX prefixes.
        // These should be used where any register operand signifies a byte register.
        //
        // The disctinction is due to the handling of register numbers in the range 4..7 on
        // x86-64.  These register numbers may either represent the second byte of the first
        // four registers (ah..bh) or the first byte of the second four registers (spl..dil).
        //
        // Since ah..bh cannot be used in all permutations of operands (specifically cannot
        // be accessed where a REX prefix is present), these are likely best treated as
        // deprecated.  In order to ensure the correct registers spl..dil are selected a
        // REX prefix will be emitted for any byte register operand in the range 4..15.
        //
        // These formatters may be used in instructions where a mix of operand sizes, in which
        // case an unnecessary REX will be emitted, for example:
        //     movzbl %al, %edi
        // In this case a REX will be planted since edi is 7 (and were this a byte operand
        // a REX would be required to specify dil instead of bh).  Unneeded REX prefixes will
        // be silently ignored by the processor.
        //
        // Address operands should still be checked using regRequiresRex(), while byteRegRequiresRex()
        // is provided to check byte register operands.

        void oneByteOp8(OneByteOpcodeID opcode, GroupOpcodeID groupOp, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(rm), 0, 0, rm);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(groupOp, rm);
        }

        void oneByteOp8(OneByteOpcodeID opcode, int reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(reg, rm), reg, 0, rm);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        void oneByteOp8(OneByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(reg, base), reg, 0, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, offset);
        }

        void oneByteOp8(OneByteOpcodeID opcode, int reg, RegisterID base, RegisterID index, int scale, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(reg) || regRequiresRex(index, base), reg, index, base);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, index, scale, offset);
        }

        void twoByteOp8(TwoByteOpcodeID opcode, RegisterID reg, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(reg, rm), reg, 0, rm);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(reg, rm);
        }

        void twoByteOp8(TwoByteOpcodeID opcode, GroupOpcodeID groupOp, RegisterID rm)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(rm), 0, 0, rm);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.registerModRM(groupOp, rm);
        }

        void twoByteOp8(TwoByteOpcodeID opcode, int reg, RegisterID base, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(reg, base), reg, 0, base);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, offset);
        }

        void twoByteOp8(TwoByteOpcodeID opcode, int reg, RegisterID base, RegisterID index, int scale, int offset)
        {
            SingleInstructionBufferWriter writer(m_buffer);
            writer.emitRexIf(byteRegRequiresRex(reg) || regRequiresRex(index, base), reg, index, base);
            writer.putByteUnchecked(OP_2BYTE_ESCAPE);
            writer.putByteUnchecked(opcode);
            writer.memoryModRM(reg, base, index, scale, offset);
        }

        // Immediates:
        //
        // An immediate should be appended where appropriate after an op has been emitted.
        // The writes are unchecked since the opcode formatters above will have ensured space.

        void immediate8(int imm)
        {
            m_buffer.putByteUnchecked(imm);
        }

        void immediate16(int imm)
        {
            m_buffer.putShortUnchecked(imm);
        }

        void immediate32(int imm)
        {
            m_buffer.putIntUnchecked(imm);
        }

        void immediate64(int64_t imm)
        {
            m_buffer.putInt64Unchecked(imm);
        }

        AssemblerLabel immediateRel32()
        {
            m_buffer.putIntUnchecked(0);
            return label();
        }

        // Administrative methods:

        size_t codeSize() const { return m_buffer.codeSize(); }
        AssemblerLabel label() const { return m_buffer.label(); }
        bool isAligned(int alignment) const { return m_buffer.isAligned(alignment); }
        void* data() const { return m_buffer.data(); }

        unsigned debugOffset() { return m_buffer.debugOffset(); }

    public:
        AssemblerBuffer m_buffer;
    } m_formatter;
    int m_indexOfLastWatchpoint;
    int m_indexOfTailOfLastWatchpoint;
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER) && CPU(X86_64)
