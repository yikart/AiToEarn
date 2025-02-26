/*
 * Copyright (C) 2013-2021 Apple Inc. All rights reserved.
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

#include "CallFrame.h"
#include "JSCJSValue.h"
#include <wtf/MathExtras.h>

namespace JSC {

// NB. Different platforms may have different requirements here. But 16 bytes is very common.
constexpr unsigned stackAlignmentBytes() { return 16; }

constexpr unsigned stackAlignmentRegisters()
{
    return stackAlignmentBytes() / sizeof(EncodedJSValue);
}
static_assert(stackAlignmentRegisters() == 2, "LLInt, CLoop, and JIT rely on this");

// The number of bytes the SP needs to be adjusted downwards to get an aligned SP after a function prologue.
// I.e.: (callFrameRegister - stackAdjustmentForAlignment()) % stackAlignmentBytes() == 0 always;
constexpr unsigned stackAdjustmentForAlignment()
{
    if (constexpr unsigned excess = sizeof(CallerFrameAndPC) % stackAlignmentBytes())
        return stackAlignmentBytes() - excess;
    return 0;
}

// Align argument count taking into account the CallFrameHeaderSize may be
// an "unaligned" count of registers.
constexpr unsigned roundArgumentCountToAlignFrame(unsigned argumentCount)
{
    return WTF::roundUpToMultipleOf(stackAlignmentRegisters(), argumentCount + CallFrame::headerSizeInRegisters) - CallFrame::headerSizeInRegisters;
}

// Align local register count to make the last local end on a stack aligned address given the
// CallFrame is at an address that is stack aligned minus CallerFrameAndPC::sizeInRegisters
constexpr unsigned roundLocalRegisterCountForFramePointerOffset(unsigned localRegisterCount)
{
    return WTF::roundUpToMultipleOf(stackAlignmentRegisters(), localRegisterCount + CallerFrameAndPC::sizeInRegisters) - CallerFrameAndPC::sizeInRegisters;
}

constexpr unsigned argumentCountForStackSize(unsigned sizeInBytes)
{
    unsigned sizeInRegisters = sizeInBytes / sizeof(void*);

    if (sizeInRegisters <= CallFrame::headerSizeInRegisters)
        return 0;

    return sizeInRegisters - CallFrame::headerSizeInRegisters;
}

inline unsigned logStackAlignmentRegisters()
{
    return WTF::fastLog2(stackAlignmentRegisters());
}

} // namespace JSC
