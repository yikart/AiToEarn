/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include <setjmp.h>

namespace JSC {

#if !OS(WINDOWS)

// ALLOCATE_AND_GET_REGISTER_STATE has to ensure that the GC sees callee-saves. It achieves this by
// ensuring that the callee-saves are either spilled to the stack or saved in the RegisterState. The code
// looks like it's achieving only the latter. However, it's possible that the compiler chooses to use
// a callee-save for one of the caller's variables, which means that the value that we were interested in
// got spilled. In that case, we will store something bogus into the RegisterState, and that's OK.

#if CPU(X86)
struct RegisterState {
    uint32_t ebx;
    uint32_t edi;
    uint32_t esi;
};

#define SAVE_REG(regname, where) \
    asm volatile ("movl %%" #regname ", %0" : "=m"(where) : : "memory")

#define ALLOCATE_AND_GET_REGISTER_STATE(registers) \
    RegisterState registers; \
    SAVE_REG(ebx, registers.ebx); \
    SAVE_REG(edi, registers.edi); \
    SAVE_REG(esi, registers.esi)

#elif CPU(X86_64)
struct RegisterState {
    uint64_t rbx;
    uint64_t r12;
    uint64_t r13;
    uint64_t r14;
    uint64_t r15;
};

#define SAVE_REG(regname, where) \
    asm volatile ("movq %%" #regname ", %0" : "=m"(where) : : "memory")

#define ALLOCATE_AND_GET_REGISTER_STATE(registers) \
    RegisterState registers; \
    SAVE_REG(rbx, registers.rbx); \
    SAVE_REG(r12, registers.r12); \
    SAVE_REG(r13, registers.r13); \
    SAVE_REG(r14, registers.r14); \
    SAVE_REG(r15, registers.r15)

#elif CPU(ARM_THUMB2)
struct RegisterState {
    uint32_t r4;
    uint32_t r5;
    uint32_t r6;
    uint32_t r7;
    uint32_t r8;
    uint32_t r9;
    uint32_t r10;
    uint32_t r11;
};

#define SAVE_REG(regname, where) \
    asm volatile ("str " #regname ", %0" : "=m"(where) : : "memory")

#define ALLOCATE_AND_GET_REGISTER_STATE(registers) \
    RegisterState registers; \
    SAVE_REG(r4, registers.r4); \
    SAVE_REG(r5, registers.r5); \
    SAVE_REG(r6, registers.r6); \
    SAVE_REG(r7, registers.r7); \
    SAVE_REG(r8, registers.r8); \
    SAVE_REG(r9, registers.r9); \
    SAVE_REG(r10, registers.r10); \
    SAVE_REG(r11, registers.r11)

#elif CPU(ARM64)
struct RegisterState {
    uint64_t x19;
    uint64_t x20;
    uint64_t x21;
    uint64_t x22;
    uint64_t x23;
    uint64_t x24;
    uint64_t x25;
    uint64_t x26;
    uint64_t x27;
    uint64_t x28;
};

#define SAVE_REG(regname, where) \
    asm volatile ("str " #regname ", %0" : "=m"(where) : : "memory")

#define ALLOCATE_AND_GET_REGISTER_STATE(registers) \
    RegisterState registers; \
    SAVE_REG(x19, registers.x19); \
    SAVE_REG(x20, registers.x20); \
    SAVE_REG(x21, registers.x21); \
    SAVE_REG(x22, registers.x22); \
    SAVE_REG(x23, registers.x23); \
    SAVE_REG(x24, registers.x24); \
    SAVE_REG(x25, registers.x25); \
    SAVE_REG(x26, registers.x26); \
    SAVE_REG(x27, registers.x27); \
    SAVE_REG(x28, registers.x28)

#elif CPU(MIPS)
struct RegisterState {
    uint32_t r16;
    uint32_t r17;
    uint32_t r18;
    uint32_t r19;
    uint32_t r20;
    uint32_t r21;
    uint32_t r22;
    uint32_t r23;
};

#define SAVE_REG(regname, where) \
    asm volatile ("sw $" #regname ", %0" : "=m"(where) : : "memory")

#define ALLOCATE_AND_GET_REGISTER_STATE(registers) \
    RegisterState registers; \
    SAVE_REG(16, registers.r16); \
    SAVE_REG(17, registers.r17); \
    SAVE_REG(18, registers.r18); \
    SAVE_REG(19, registers.r19); \
    SAVE_REG(20, registers.r20); \
    SAVE_REG(21, registers.r21); \
    SAVE_REG(22, registers.r22); \
    SAVE_REG(23, registers.r23)

#endif
#endif // !OS(WINDOWS)

#ifndef ALLOCATE_AND_GET_REGISTER_STATE

using RegisterState = jmp_buf;

// ALLOCATE_AND_GET_REGISTER_STATE() is a macro so that it is always "inlined" even in debug builds.
#define ALLOCATE_AND_GET_REGISTER_STATE(registers) \
    alignas(alignof(void*) > alignof(RegisterState) ? alignof(void*) : alignof(RegisterState)) RegisterState registers; \
    memset(&registers, 0, sizeof(registers)); /* Clear RegisterState so that it never includes some garbage for conservative root scanning. */ \
    setjmp(registers)

#endif // ALLOCATE_AND_GET_REGISTER_STATE

} // namespace JSC

