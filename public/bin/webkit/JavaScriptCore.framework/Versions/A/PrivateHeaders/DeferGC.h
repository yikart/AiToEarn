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

#include "DisallowScope.h"
#include <wtf/NeverDestroyed.h>
#include <wtf/ThreadSpecific.h>

namespace JSC {

class Heap;
class VM;

class DeferGC {
    WTF_MAKE_NONCOPYABLE(DeferGC);
    WTF_FORBID_HEAP_ALLOCATION;
public:
    DeferGC(VM&);
    ~DeferGC();

private:
    VM& m_vm;
};

class DeferGCForAWhile {
    WTF_MAKE_NONCOPYABLE(DeferGCForAWhile);
    WTF_FORBID_HEAP_ALLOCATION;
public:
    DeferGCForAWhile(VM&);
    ~DeferGCForAWhile();

private:
    JSC::Heap& m_heap;
};

class DisallowGC : public DisallowScope<DisallowGC> {
    WTF_MAKE_NONCOPYABLE(DisallowGC);
    WTF_FORBID_HEAP_ALLOCATION;
    typedef DisallowScope<DisallowGC> Base;
public:
#if ASSERT_ENABLED
    DisallowGC() = default;

    static void initialize()
    {
        s_scopeReentryCount.construct();
    }

private:
    static unsigned scopeReentryCount()
    {
        return *s_scopeReentryCount.get();
    }
    static void setScopeReentryCount(unsigned value)
    {
        *s_scopeReentryCount.get() = value;
    }
    
    JS_EXPORT_PRIVATE static LazyNeverDestroyed<ThreadSpecific<unsigned, WTF::CanBeGCThread::True>> s_scopeReentryCount;

#else
    ALWAYS_INLINE DisallowGC() { } // We need this to placate Clang due to unused warnings.
    ALWAYS_INLINE static void initialize() { }
#endif // ASSERT_ENABLED
    
    friend class DisallowScope<DisallowGC>;
};

} // namespace JSC
