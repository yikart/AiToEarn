/*
 * Copyright (C) 2019 Metrological Group B.V.
 * Copyright (C) 2019 Igalia S.L.
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

#include <wtf/Platform.h>

#if CPU(ARM_THUMB2)

#define RegisterNames ARMRegisters

#define FOR_EACH_REGISTER(macro)                \
    FOR_EACH_GP_REGISTER(macro)                 \
    FOR_EACH_FP_REGISTER(macro)

#define FOR_EACH_FP_REGISTER(macro)             \
    FOR_EACH_FP_DOUBLE_REGISTER(macro)

#if !OS(DARWIN)
#define FOR_EACH_GP_REGISTER(macro)             \
    macro(r0,  "r0"_s,  0, 0)                     \
    macro(r1,  "r1"_s,  0, 0)                     \
    macro(r2,  "r2"_s,  0, 0)                     \
    macro(r3,  "r3"_s,  0, 0)                     \
    macro(r4,  "r4"_s,  0, 1)                     \
    macro(r5,  "r5"_s,  0, 1)                     \
    macro(r6,  "r6"_s,  0, 1)                     \
    macro(r7,  "r7"_s,  0, 0)                     \
    macro(r8,  "r8"_s,  0, 1)                     \
    macro(r9,  "r9"_s,  0, 1)                     \
    macro(r10, "r10"_s, 0, 1)                     \
    macro(r11, "r11"_s, 0, 1)                     \
    macro(r12, "ip"_s,  0, 0)                     \
    macro(r13, "sp"_s,  0, 0)                     \
    macro(r14, "lr"_s,  1, 0)                     \
    macro(r15, "pc"_s,  1, 0)
#else
#define FOR_EACH_GP_REGISTER(macro)             \
    macro(r0,  "r0"_s,  0, 0)                     \
    macro(r1,  "r1"_s,  0, 0)                     \
    macro(r2,  "r2"_s,  0, 0)                     \
    macro(r3,  "r3"_s,  0, 0)                     \
    macro(r4,  "r4"_s,  0, 1)                     \
    macro(r5,  "r5"_s,  0, 1)                     \
    macro(r6,  "r6"_s,  0, 1)                     \
    macro(r7,  "r7"_s,  0, 0)                     \
    macro(r8,  "r8"_s,  0, 1)                     \
    macro(r9,  "r9"_s,  0, 0)                     \
    macro(r10, "r10"_s, 0, 1)                     \
    macro(r11, "r11"_s, 0, 1)                     \
    macro(r12, "ip"_s,  0, 0)                     \
    macro(r13, "sp"_s,  0, 0)                     \
    macro(r14, "lr"_s,  1, 0)                     \
    macro(r15, "pc"_s,  1, 0)
#endif

#define FOR_EACH_REGISTER_ALIAS(macro)          \
    macro(fp, "fp"_s, r7)                         \
    macro(sb, "sb"_s, r9)                         \
    macro(sl, "sl"_s, r10)                        \
    macro(ip, "ip"_s, r12)                        \
    macro(sp, "sp"_s, r13)                        \
    macro(lr, "lr"_s, r14)                        \
    macro(pc, "pc"_s, r15)

#define FOR_EACH_SP_REGISTER(macro)             \
    macro(apsr,  "apsr"_s)                        \
    macro(fpscr, "fpscr"_s)

#define FOR_EACH_FP_SINGLE_REGISTER(macro)      \
    macro(s0,  "s0"_s,  0, 0)                     \
    macro(s1,  "s1"_s,  0, 0)                     \
    macro(s2,  "s2"_s,  0, 0)                     \
    macro(s3,  "s3"_s,  0, 0)                     \
    macro(s4,  "s4"_s,  0, 0)                     \
    macro(s5,  "s5"_s,  0, 0)                     \
    macro(s6,  "s6"_s,  0, 0)                     \
    macro(s7,  "s7"_s,  0, 0)                     \
    macro(s8,  "s8"_s,  0, 0)                     \
    macro(s9,  "s9"_s,  0, 0)                     \
    macro(s10, "s10"_s, 0, 0)                     \
    macro(s11, "s11"_s, 0, 0)                     \
    macro(s12, "s12"_s, 0, 0)                     \
    macro(s13, "s13"_s, 0, 0)                     \
    macro(s14, "s14"_s, 0, 0)                     \
    macro(s15, "s15"_s, 0, 0)                     \
    macro(s16, "s16"_s, 0, 1)                     \
    macro(s17, "s17"_s, 0, 1)                     \
    macro(s18, "s18"_s, 0, 1)                     \
    macro(s19, "s19"_s, 0, 1)                     \
    macro(s20, "s20"_s, 0, 1)                     \
    macro(s21, "s21"_s, 0, 1)                     \
    macro(s22, "s22"_s, 0, 1)                     \
    macro(s23, "s23"_s, 0, 1)                     \
    macro(s24, "s24"_s, 0, 1)                     \
    macro(s25, "s25"_s, 0, 1)                     \
    macro(s26, "s26"_s, 0, 1)                     \
    macro(s27, "s27"_s, 0, 1)                     \
    macro(s28, "s28"_s, 0, 1)                     \
    macro(s29, "s29"_s, 0, 1)                     \
    macro(s30, "s30"_s, 0, 1)                     \
    macro(s31, "s31"_s, 0, 1)

#if CPU(ARM_NEON) || CPU(ARM_VFP_V3_D32)
#define FOR_EACH_FP_DOUBLE_REGISTER(macro)      \
    macro(d0,  "d0"_s,  0, 0)                     \
    macro(d1,  "d1"_s,  0, 0)                     \
    macro(d2,  "d2"_s,  0, 0)                     \
    macro(d3,  "d3"_s,  0, 0)                     \
    macro(d4,  "d4"_s,  0, 0)                     \
    macro(d5,  "d5"_s,  0, 0)                     \
    macro(d6,  "d6"_s,  0, 0)                     \
    macro(d7,  "d7"_s,  0, 0)                     \
    macro(d8,  "d8"_s,  0, 1)                     \
    macro(d9,  "d9"_s,  0, 1)                     \
    macro(d10, "d10"_s, 0, 1)                     \
    macro(d11, "d11"_s, 0, 1)                     \
    macro(d12, "d12"_s, 0, 1)                     \
    macro(d13, "d13"_s, 0, 1)                     \
    macro(d14, "d14"_s, 0, 1)                     \
    macro(d15, "d15"_s, 0, 1)                     \
    macro(d16, "d16"_s, 0, 0)                     \
    macro(d17, "d17"_s, 0, 0)                     \
    macro(d18, "d18"_s, 0, 0)                     \
    macro(d19, "d19"_s, 0, 0)                     \
    macro(d20, "d20"_s, 0, 0)                     \
    macro(d21, "d21"_s, 0, 0)                     \
    macro(d22, "d22"_s, 0, 0)                     \
    macro(d23, "d23"_s, 0, 0)                     \
    macro(d24, "d24"_s, 0, 0)                     \
    macro(d25, "d25"_s, 0, 0)                     \
    macro(d26, "d26"_s, 0, 0)                     \
    macro(d27, "d27"_s, 0, 0)                     \
    macro(d28, "d28"_s, 0, 0)                     \
    macro(d29, "d29"_s, 0, 0)                     \
    macro(d30, "d30"_s, 0, 0)                     \
    macro(d31, "d31"_s, 0, 0)
#else
#define FOR_EACH_FP_DOUBLE_REGISTER(macro)      \
    macro(d0,  "d0"_s,  0, 0)                     \
    macro(d1,  "d1"_s,  0, 0)                     \
    macro(d2,  "d2"_s,  0, 0)                     \
    macro(d3,  "d3"_s,  0, 0)                     \
    macro(d4,  "d4"_s,  0, 0)                     \
    macro(d5,  "d5"_s,  0, 0)                     \
    macro(d6,  "d6"_s,  0, 0)                     \
    macro(d7,  "d7"_s,  0, 0)                     \
    macro(d8,  "d8"_s,  0, 1)                     \
    macro(d9,  "d9"_s,  0, 1)                     \
    macro(d10, "d10"_s, 0, 1)                     \
    macro(d11, "d11"_s, 0, 1)                     \
    macro(d12, "d12"_s, 0, 1)                     \
    macro(d13, "d13"_s, 0, 1)                     \
    macro(d14, "d14"_s, 0, 1)                     \
    macro(d15, "d15"_s, 0, 1)
#endif

#if CPU(ARM_NEON)
#define FOR_EACH_FP_QUAD_REGISTER(macro)        \
    macro(q0, "q0"_s, 0, 0)                       \
    macro(q1, "q1"_s, 0, 0)                       \
    macro(q2, "q2"_s, 0, 0)                       \
    macro(q3, "q3"_s, 0, 0)                       \
    macro(q4, "q4"_s, 0, 1)                       \
    macro(q5, "q5"_s, 0, 1)                       \
    macro(q6, "q6"_s, 0, 1)                       \
    macro(q7, "q7"_s, 0, 1)                       \
    macro(q8, "q8"_s, 0, 0)                       \
    macro(q9, "q9"_s, 0, 0)                       \
    macro(q10, "q10"_s, 0, 0)                     \
    macro(q11, "q11"_s, 0, 0)                     \
    macro(q12, "q12"_s, 0, 0)                     \
    macro(q13, "q13"_s, 0, 0)                     \
    macro(q14, "q14"_s, 0, 0)                     \
    macro(q15, "q15"_s, 0, 0)
#endif

#endif // CPU(ARM_THUMB2)
