/*
 * Copyright (C) 2022-2023 Apple Inc. All rights reserved.
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

#include "DeferredWorkTimer.h"
#include "JSPromise.h"
#include <wtf/Condition.h>
#include <wtf/HashMap.h>
#include <wtf/Lock.h>
#include <wtf/SentinelLinkedList.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

enum class AtomicsWaitType : uint8_t { Sync, Async };
enum class AtomicsWaitValidation : uint8_t { Pass, Fail };

class Waiter final : public WTF::BasicRawSentinelNode<Waiter>, public ThreadSafeRefCounted<Waiter> {
    WTF_MAKE_TZONE_ALLOCATED(Waiter);

public:
    Waiter(VM*);
    Waiter(JSPromise*);

    bool isAsync() const
    {
        return m_isAsync;
    }

    VM* vm()
    {
        return m_vm;
    }

    Condition& condition()
    {
        ASSERT(!m_isAsync);
        return m_condition;
    }

    RefPtr<DeferredWorkTimer::TicketData> ticket(const AbstractLocker&) const
    {
        ASSERT(m_isAsync);
        return m_ticket.get();
    }

    void clearTicket(const AbstractLocker&)
    {
        ASSERT(m_isAsync);
        m_ticket = nullptr;
    }

    void setTimer(const AbstractLocker&, Ref<RunLoop::DispatchTimer>&& timer)
    {
        ASSERT(m_isAsync);
        m_timer = WTFMove(timer);
    }

    bool hasTimer(const AbstractLocker&)
    {
        return !!m_timer;
    }

    void clearTimer(const AbstractLocker&)
    {
        ASSERT(m_isAsync);
        // If the timeout for AsyncWaiter is infinity, we won't dispatch any timer.
        if (!m_timer)
            return;
        m_timer->stop();
        // The AsyncWaiter's timer holds the waiter's reference. This
        // releases the strong reference to the Waiter in the timer.
        m_timer = nullptr;
    }

    void scheduleWorkAndClear(const AbstractLocker&, DeferredWorkTimer::Task&&);
    void cancelAndClear(const AbstractLocker&);
    void dump(PrintStream&) const;

private:
    VM* m_vm { nullptr };
    ThreadSafeWeakPtr<DeferredWorkTimer::TicketData> m_ticket { nullptr };
    RefPtr<RunLoop::DispatchTimer> m_timer { nullptr };
    Condition m_condition;
    bool m_isAsync { false };
};

class WaiterList : public ThreadSafeRefCounted<WaiterList> {
    WTF_MAKE_TZONE_ALLOCATED(WaiterList);

public:
    ~WaiterList()
    {
        removeIf([](Waiter*) {
            return true;
        });
    }

    void addLast(const AbstractLocker&, Waiter& waiter)
    {
        m_waiters.append(&waiter);
        waiter.ref();
        m_size++;
    }

    Ref<Waiter> takeFirst(const AbstractLocker&)
    {
        // `takeFisrt` is used to consume a waiter (either notify, timeout, or remove).
        // So, the waiter must not be removed and belong to this list.
        Waiter& waiter = *m_waiters.begin();
        ASSERT((!waiter.isAsync() || waiter.ticket(NoLockingNecessary)) && waiter.vm() && waiter.isOnList());
        Ref<Waiter> protectedWaiter = Ref { waiter };
        removeWithUpdate(waiter);
        return protectedWaiter;
    }

    bool findAndRemove(const AbstractLocker&, Waiter& target)
    {
#if ASSERT_ENABLED
        if (target.isOnList()) {
            bool found = false;
            for (auto iter = m_waiters.begin(); iter != m_waiters.end(); ++iter) {
                if (&*iter == &target)
                    found = true;
            }
            ASSERT(found);
        }
#endif

        if (!target.isOnList())
            return false;
        removeWithUpdate(target);
        return true;
    }

    template<typename Functor>
    void removeIf(const AbstractLocker&, const Functor& functor)
    {
        removeIf(functor);
    }

    unsigned size()
    {
        return m_size;
    }

    Lock lock;

private:
    template<typename Functor>
    void removeIf(const Functor& functor)
    {
        m_waiters.forEach([&](Waiter* waiter) {
            if (functor(waiter))
                removeWithUpdate(*waiter);
        });
    }

    void removeWithUpdate(Waiter& waiter)
    {
        m_waiters.remove(&waiter);
        waiter.deref();
        m_size--;
    }

    unsigned m_size { 0 };
    SentinelLinkedList<Waiter, BasicRawSentinelNode<Waiter>> m_waiters;
};

class WaiterListManager {
    WTF_MAKE_TZONE_ALLOCATED(WaiterListManager);
public:
    static WaiterListManager& singleton();

    enum class WaitSyncResult : int32_t {
        OK = 0,
        NotEqual = 1,
        TimedOut = 2,
        Terminated = 3,
    };

    JS_EXPORT_PRIVATE WaitSyncResult waitSync(VM&, int32_t* ptr, int32_t expected, Seconds timeout);
    JS_EXPORT_PRIVATE WaitSyncResult waitSync(VM&, int64_t* ptr, int64_t expected, Seconds timeout);
    JS_EXPORT_PRIVATE JSValue waitAsync(JSGlobalObject*, VM&, int32_t* ptr, int32_t expected, Seconds timeout);
    JS_EXPORT_PRIVATE JSValue waitAsync(JSGlobalObject*, VM&, int64_t* ptr, int64_t expected, Seconds timeout);

    enum class ResolveResult : uint8_t { Ok, Timeout };
    unsigned notifyWaiter(void* ptr, unsigned count);

    size_t waiterListSize(void* ptr);

    size_t totalWaiterCount();

    void unregister(VM*);
    void unregister(JSGlobalObject*);
    void unregister(uint8_t* arrayPtr, size_t);

private:
    template <typename ValueType>
    WaitSyncResult waitSyncImpl(VM&, ValueType* ptr, ValueType expectedValue, Seconds timeout);
    template <typename ValueType>
    JSValue waitAsyncImpl(JSGlobalObject*, VM&, ValueType* ptr, ValueType expectedValue, Seconds timeout);

    // Notify the waiter if its ticket is not canceled.
    void notifyWaiterImpl(const AbstractLocker&, Ref<Waiter>&&, const ResolveResult);

    void timeoutAsyncWaiter(void* ptr, Ref<Waiter>&&);

    void cancelAsyncWaiter(const AbstractLocker&, Waiter*);

    Ref<WaiterList> findOrCreateList(void* ptr);

    RefPtr<WaiterList> findList(void* ptr);

    Lock m_waiterListsLock;
    UncheckedKeyHashMap<void*, Ref<WaiterList>> m_waiterLists;
};

} // namespace JSC
