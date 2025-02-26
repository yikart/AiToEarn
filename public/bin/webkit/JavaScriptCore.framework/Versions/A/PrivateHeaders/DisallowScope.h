/*
 * Copyright (C) 2017-2020 Apple Inc. All rights reserved.
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

#include <wtf/ForbidHeapAllocation.h>
#include <wtf/Noncopyable.h>

namespace JSC {

template<class T>
class DisallowScope {
    WTF_MAKE_NONCOPYABLE(DisallowScope);
    WTF_FORBID_HEAP_ALLOCATION;
public:
#if ASSERT_ENABLED
    DisallowScope()
    {
        auto count = T::scopeReentryCount();
        T::setScopeReentryCount(++count);
    }

    ~DisallowScope()
    {
        auto count = T::scopeReentryCount();
        ASSERT(count);
        T::setScopeReentryCount(--count);
    }

    static bool isInEffectOnCurrentThread()
    {
        return !!T::scopeReentryCount();
    }

#else // not ASSERT_ENABLED
    ALWAYS_INLINE DisallowScope() { } // We need this to placate Clang due to unused warnings.
    ALWAYS_INLINE static bool isInEffectOnCurrentThread() { return false; }
#endif // ASSERT_ENABLED
};

} // namespace JSC
