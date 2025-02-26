/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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

#include "CatchScope.h"
#include "StackAlignment.h"
#include "VM.h"

namespace JSC {

struct EntryFrame;
class StructureStubInfo;

class SuspendExceptionScope {
public:
    SuspendExceptionScope(VM& vm)
        : m_vm(vm)
        , m_exceptionWasSet(vm.m_exception)
        , m_savedException(vm.m_exception, nullptr)
        , m_savedLastException(vm.m_lastException, nullptr)
    {
        if (m_exceptionWasSet)
            m_vm.traps().clearTrapBit(VMTraps::NeedExceptionHandling);
    }
    ~SuspendExceptionScope()
    {
        if (m_exceptionWasSet)
            m_vm.traps().setTrapBit(VMTraps::NeedExceptionHandling);
    }
private:
    VM& m_vm;
    bool m_exceptionWasSet;
    SetForScope<Exception*> m_savedException;
    SetForScope<Exception*> m_savedLastException;
};

class TopCallFrameSetter {
public:
    TopCallFrameSetter(VM& currentVM, CallFrame* callFrame)
        : vm(currentVM)
        , oldCallFrame(currentVM.topCallFrame)
    {
        currentVM.topCallFrame = callFrame;
    }

    ~TopCallFrameSetter()
    {
        vm.topCallFrame = oldCallFrame;
    }
private:
    VM& vm;
    CallFrame* oldCallFrame;
};

ALWAYS_INLINE static void assertStackPointerIsAligned()
{
#ifndef NDEBUG
#if CPU(X86) && !OS(WINDOWS)
    uintptr_t stackPointer;

    asm("movl %%esp,%0" : "=r"(stackPointer));
    ASSERT(!(stackPointer % stackAlignmentBytes()));
#endif
#endif
}

class SlowPathFrameTracer {
public:
    ALWAYS_INLINE SlowPathFrameTracer(VM& vm, CallFrame* callFrame)
    {
        ASSERT(callFrame);
        ASSERT(reinterpret_cast<void*>(callFrame) < reinterpret_cast<void*>(vm.topEntryFrame));
        assertStackPointerIsAligned();
        vm.topCallFrame = callFrame;
    }
};

class NativeCallFrameTracer {
public:
    ALWAYS_INLINE NativeCallFrameTracer(VM& vm, CallFrame* callFrame)
    {
        ASSERT(callFrame);
        ASSERT(reinterpret_cast<void*>(callFrame) < reinterpret_cast<void*>(vm.topEntryFrame));
        assertStackPointerIsAligned();
        vm.topCallFrame = callFrame;
    }
};

class JITOperationPrologueCallFrameTracer {
public:
    ALWAYS_INLINE JITOperationPrologueCallFrameTracer(VM& vm, CallFrame* callFrame)
#if ASSERT_ENABLED
        : m_vm(vm)
#endif
    {
        UNUSED_PARAM(vm);
        UNUSED_PARAM(callFrame);
        ASSERT(callFrame);
        ASSERT(reinterpret_cast<void*>(callFrame) < reinterpret_cast<void*>(vm.topEntryFrame));
        assertStackPointerIsAligned();
#if USE(BUILTIN_FRAME_ADDRESS)
        // If ASSERT_ENABLED and USE(BUILTIN_FRAME_ADDRESS), prepareCallOperation() will put the frame pointer into vm.topCallFrame.
        // We can ensure here that a call to prepareCallOperation() (or its equivalent) is not missing by comparing vm.topCallFrame to
        // the result of __builtin_frame_address which is passed in as callFrame.
        ASSERT(vm.topCallFrame == callFrame);
        vm.topCallFrame = callFrame;
#endif
    }

#if ASSERT_ENABLED
    ~JITOperationPrologueCallFrameTracer()
    {
        // Fill vm.topCallFrame with invalid value when leaving from JIT operation functions.
        m_vm.topCallFrame = std::bit_cast<CallFrame*>(static_cast<uintptr_t>(0x0badbeef0badbeefULL));
    }

    VM& m_vm;
#endif
};

class ICSlowPathCallFrameTracer {
public:
    inline ICSlowPathCallFrameTracer(VM&, CallFrame*, StructureStubInfo*);

#if ASSERT_ENABLED
    ~ICSlowPathCallFrameTracer()
    {
        // Fill vm.topCallFrame with invalid value when leaving from JIT operation functions.
        m_vm.topCallFrame = std::bit_cast<CallFrame*>(static_cast<uintptr_t>(0x0badbeef0badbeefULL));
    }

    VM& m_vm;
#endif
};


} // namespace JSC
