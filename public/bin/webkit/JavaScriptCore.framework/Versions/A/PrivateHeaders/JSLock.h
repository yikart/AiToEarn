/*
 * Copyright (C) 2005-2024 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include <mutex>
#include <wtf/Assertions.h>
#include <wtf/ForbidHeapAllocation.h>
#include <wtf/Lock.h>
#include <wtf/Noncopyable.h>
#include <wtf/RefPtr.h>
#include <wtf/Threading.h>
#include <wtf/text/AtomStringTable.h>

namespace JSC {

// To make it safe to use JavaScript on multiple threads, it is
// important to lock before doing anything that allocates a
// JavaScript data structure or that interacts with shared state
// such as the protect count hash table. The simplest way to lock
// is to create a local JSLockHolder object in the scope where the lock 
// must be held and pass it the context that requires protection. 
// The lock is recursive so nesting is ok. The JSLock 
// object also acts as a convenience short-hand for running important
// initialization routines.

// To avoid deadlock, sometimes it is necessary to temporarily
// release the lock. Since it is recursive you actually have to
// release all locks held by your thread. This is safe to do if
// you are executing code that doesn't require the lock, and you
// reacquire the right number of locks at the end. You can do this
// by constructing a locally scoped JSLock::DropAllLocks object. The 
// DropAllLocks object takes care to release the JSLock only if your
// thread acquired it to begin with.

class CallFrame;
class VM;
class JSGlobalObject;
class JSLock;

// FIXME: We should either have a specialization of WTF::Locker for JSLock or only allow using JSLockHolder.
// It's weird that WTF::Locker<JSLock> doesn't ref() the VM for the lifetime of the lock and it's unclear
// there's any noticable performance difference.
class JSLockHolder {
public:
    JS_EXPORT_PRIVATE JSLockHolder(VM*);
    JS_EXPORT_PRIVATE JSLockHolder(VM&);
    JS_EXPORT_PRIVATE JSLockHolder(JSGlobalObject*);

    JS_EXPORT_PRIVATE ~JSLockHolder();

private:
    RefPtr<VM> m_vm;
};

class JSLock : public ThreadSafeRefCounted<JSLock> {
    WTF_MAKE_NONCOPYABLE(JSLock);
public:
    JSLock(VM*);
    JS_EXPORT_PRIVATE ~JSLock();

    JS_EXPORT_PRIVATE void lock();
    JS_EXPORT_PRIVATE void unlock();

    static void lock(JSGlobalObject*);
    static void unlock(JSGlobalObject*);
    static void lock(VM&);
    static void unlock(VM&);

    VM* vm() { return m_vm; }

    std::optional<RefPtr<Thread>> ownerThread() const
    {
        if (m_hasOwnerThread)
            return m_ownerThread;
        return std::nullopt;
    }
    bool currentThreadIsHoldingLock() { return m_hasOwnerThread && m_ownerThread.get() == &Thread::current(); }

    void willDestroyVM(VM*);

    class DropAllLocks {
        WTF_MAKE_NONCOPYABLE(DropAllLocks);
    public:
        JS_EXPORT_PRIVATE DropAllLocks(JSGlobalObject*);
        JS_EXPORT_PRIVATE DropAllLocks(VM*);
        JS_EXPORT_PRIVATE DropAllLocks(VM&);
        JS_EXPORT_PRIVATE ~DropAllLocks();

        void setDropDepth(unsigned depth) { m_dropDepth = depth; }
        unsigned dropDepth() const { return m_dropDepth; }

    private:
        intptr_t m_droppedLockCount;
        RefPtr<VM> m_vm;
        unsigned m_dropDepth;
    };

    void makeWebThreadAware()
    {
        m_isWebThreadAware = true;
    }

    bool isWebThreadAware() const { return m_isWebThreadAware; }

private:
    void lock(intptr_t lockCount);
    void unlock(intptr_t unlockCount);

    void didAcquireLock();
    void willReleaseLock();

    unsigned dropAllLocks(DropAllLocks*);
    void grabAllLocks(DropAllLocks*, unsigned lockCount);

    Lock m_lock;
    bool m_isWebThreadAware { false };
    // We cannot make m_ownerThread an optional (instead of pairing it with an explicit
    // m_hasOwnerThread) because currentThreadIsHoldingLock() may be called from a
    // different thread, and an optional is vulnerable to races.
    // See https://bugs.webkit.org/show_bug.cgi?id=169042#c6
    bool m_hasOwnerThread { false };
    bool m_shouldReleaseHeapAccess;
    RefPtr<Thread> m_ownerThread;
    intptr_t m_lockCount;
    unsigned m_lockDropDepth;
    uint32_t m_lastOwnerThread { 0 };
    VM* m_vm;
    AtomStringTable* m_entryAtomStringTable; 
};

} // namespace
