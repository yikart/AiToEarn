/*
 * Copyright (C) 2013, 2016 Apple Inc. All rights reserved.
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

#include "Register.h"
#include "StackAlignment.h"
#include <wtf/Assertions.h>

namespace JSC {

// The maxFrameExtentForSlowPathCall is the max amount of stack space (in bytes)
// that can be used for outgoing args when calling a slow path C function
// from JS code.

#if !ENABLE(ASSEMBLER)
static constexpr size_t maxFrameExtentForSlowPathCall = 0;

#elif CPU(X86_64)
// All args in registers. Windows also uses System V ABI.
static constexpr size_t maxFrameExtentForSlowPathCall = 0;

#elif CPU(ARM64) || CPU(ARM64E) || CPU(RISCV64)
// All args in registers.
static constexpr size_t maxFrameExtentForSlowPathCall = 0;

#elif CPU(ARM)
// First four args in registers, remaining 4 args on stack.
static constexpr size_t maxFrameExtentForSlowPathCall = 24;

#else
#error "Unsupported CPU: need value for maxFrameExtentForSlowPathCall"

#endif

static_assert(!(maxFrameExtentForSlowPathCall % sizeof(Register)), "Extent must be in multiples of registers");

#if ENABLE(ASSEMBLER)
// Make sure that cfr - maxFrameExtentForSlowPathCall bytes will make the stack pointer aligned
static_assert((maxFrameExtentForSlowPathCall % 16) == 16 - sizeof(CallerFrameAndPC), "Extent must align stack from callframe pointer");
#endif

static constexpr size_t maxFrameExtentForSlowPathCallInRegisters = maxFrameExtentForSlowPathCall / sizeof(Register);

} // namespace JSC
