/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#include <wtf/Lock.h>
#include <wtf/MonotonicTime.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/WorkQueue.h>

namespace JSC {

class CallFrame;
class JSGlobalObject;
class VM;

class Watchdog : public WTF::ThreadSafeRefCounted<Watchdog> {
    WTF_MAKE_TZONE_ALLOCATED(Watchdog);
public:
    class Scope;

    Watchdog(VM*);
    void willDestroyVM(VM*);

    typedef bool (*ShouldTerminateCallback)(JSGlobalObject*, void* data1, void* data2);
    void setTimeLimit(Seconds limit, ShouldTerminateCallback = nullptr, void* data1 = nullptr, void* data2 = nullptr);

    bool shouldTerminate(JSGlobalObject*);

    bool isActive() const { return m_hasEnteredVM; }

    bool hasTimeLimit();
    void enteredVM();
    void exitedVM();

    static constexpr Seconds noTimeLimit = Seconds::infinity();

private:
    void startTimer(Seconds timeLimit);
    void stopTimer();

    bool m_hasEnteredVM { false };

    Lock m_lock; // Guards access to m_vm.
    VM* m_vm;

    Seconds m_timeLimit;

    Seconds m_cpuDeadline;
    MonotonicTime m_deadline;

    ShouldTerminateCallback m_callback;
    void* m_callbackData1;
    void* m_callbackData2;

    Ref<WorkQueue> m_timerQueue;

    friend class LLIntOffsetsExtractor;
};

} // namespace JSC
