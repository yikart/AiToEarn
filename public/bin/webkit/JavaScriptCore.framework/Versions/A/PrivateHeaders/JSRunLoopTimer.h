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

#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/RefPtr.h>
#include <wtf/RetainPtr.h>
#include <wtf/RunLoop.h>
#include <wtf/SharedTask.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace JSC {

class JSLock;
class VM;

class JSRunLoopTimer : public ThreadSafeRefCounted<JSRunLoopTimer> {
public:
    typedef void TimerNotificationType();
    using TimerNotificationCallback = RefPtr<WTF::SharedTask<TimerNotificationType>>;

    class Manager {
        WTF_MAKE_NONCOPYABLE(Manager);
        WTF_MAKE_TZONE_ALLOCATED(Manager);
        void timerDidFireCallback();

        Manager() = default;

        void timerDidFire();

    public:
        static Manager& shared();
        void registerVM(VM&);
        void unregisterVM(VM&);
        void scheduleTimer(JSRunLoopTimer&, Seconds nextFireTime);
        void cancelTimer(JSRunLoopTimer&);

        std::optional<Seconds> timeUntilFire(JSRunLoopTimer&);

        // Do nothing since this is a singleton.
        void ref() const { }
        void deref() const { }

    private:
        Lock m_lock;

        class PerVMData {
            WTF_MAKE_FAST_ALLOCATED;
            WTF_MAKE_NONCOPYABLE(PerVMData);
        public:
            PerVMData(Manager&, WTF::RunLoop&);
            ~PerVMData();

            Ref<WTF::RunLoop> runLoop;
            std::unique_ptr<RunLoop::Timer> timer;
            Vector<std::pair<Ref<JSRunLoopTimer>, MonotonicTime>> timers;
        };

        UncheckedKeyHashMap<Ref<JSLock>, std::unique_ptr<PerVMData>> m_mapping;
    };

    JSRunLoopTimer(VM&);
    JS_EXPORT_PRIVATE virtual ~JSRunLoopTimer();
    virtual void doWork(VM&) = 0;

    JS_EXPORT_PRIVATE void setTimeUntilFire(Seconds intervalInSeconds);
    void cancelTimer();
    bool isScheduled() const { return m_isScheduled; }

    // Note: The only thing the timer notification callback cannot do is
    // call setTimeUntilFire(). This will cause a deadlock. It would not
    // be hard to make this work, however, there are no clients that need
    // this behavior. We should implement it only if we find that we need it.
    JS_EXPORT_PRIVATE void addTimerSetNotification(TimerNotificationCallback);
    JS_EXPORT_PRIVATE void removeTimerSetNotification(TimerNotificationCallback);

    JS_EXPORT_PRIVATE std::optional<Seconds> timeUntilFire();

protected:
    static constexpr Seconds s_decade { 60 * 60 * 24 * 365 * 10 };
    Ref<JSLock> m_apiLock;

private:
    friend class Manager;

    void timerDidFire();

    HashSet<TimerNotificationCallback> m_timerSetCallbacks;
    Lock m_timerCallbacksLock;

    Lock m_lock;
    bool m_isScheduled { false };
};
    
} // namespace JSC
