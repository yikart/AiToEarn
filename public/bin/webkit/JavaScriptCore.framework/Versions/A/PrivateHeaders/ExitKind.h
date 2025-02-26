/*
 * Copyright (C) 2012-2016 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>

namespace JSC {

enum ExitKind : uint8_t {
    ExitKindUnset,
    BadType, // We exited because a type prediction was wrong.
    BadConstantValue, // We exited because we made an incorrect assumption about what value we would see. Usually used for function checks.
    BadIdent, // We exited because we made an incorrect assumption about what identifier we would see. Usually used for cached Id check in get_by_val.
    BadExecutable, // We exited because we made an incorrect assumption about what executable we would see.
    BadCache, // We exited because an inline cache was wrong.
    BadConstantCache, // We exited because a cache on a weak constant (usually a prototype) was wrong.
    BadIndexingType, // We exited because an indexing type was wrong.
    BadTypeInfoFlags, // We exited because we made an incorrect assumption about what TypeInfo flags we would see.
    BadStringType, // We exited because we made an incorrect assumption about StringIdent v.s. StringVar
    Overflow, // We exited because of overflow.
    NegativeZero, // We exited because we encountered negative zero.
    NegativeIndex, // We exited because we encountered a negative index in a place we didn't want to see it.
    Int52Overflow, // We exited because of an Int52 overflow.
    StoreToHole, // We had a store to a hole.
    LoadFromHole, // We had a load from a hole.
    OutOfBounds, // We had an out-of-bounds access to an array.
    InadequateCoverage, // We exited because we ended up in code that didn't have profiling coverage.
    ArgumentsEscaped, // We exited because arguments escaped but we didn't expect them to.
    ExoticObjectMode, // We exited because some exotic object that we were accessing was in an exotic mode (like Arguments with slow arguments).
    VarargsOverflow, // We exited because a varargs call passed more arguments than we expected.
    TDZFailure, // We exited because we were in the TDZ and accessed the variable.
    HoistingFailed, // Something that was hoisted exited. So, assume that hoisting is a bad idea.
    Uncountable, // We exited for none of the above reasons, and we should not count it. Most uses of this should be viewed as a FIXME.
    UncountableInvalidation, // We exited because the code block was invalidated; this means that we've already counted the reasons why the code block was invalidated.
    WatchdogTimerFired, // We exited because we need to service the watchdog timer.
    DebuggerEvent, // We exited because we need to service the debugger.
    ExceptionCheck, // We exited because a direct exception check showed that we threw an exception from a C call.
    GenericUnwind, // We exited because we arrived at this OSR exit from genericUnwind.
    BigInt32Overflow, // We exited because of an BigInt32 overflow.
    UnexpectedResizableArrayBufferView, // We exited because we made an incorrect assumption about what type of ArrayBufferView we would see.
};

bool exitKindMayJettison(ExitKind);

} // namespace JSC
