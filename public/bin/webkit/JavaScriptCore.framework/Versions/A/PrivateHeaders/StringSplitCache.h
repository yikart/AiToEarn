/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
 * Copyright (C) 2012 the V8 project authors. All rights reserved.
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

#include <array>
#include <wtf/DebugHeap.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER_AND_EXPORT(StringSplitCache, WTF_INTERNAL);

class JSImmutableButterfly;

class StringSplitCache {
    WTF_MAKE_TZONE_ALLOCATED(StringSplitCache);
    WTF_MAKE_NONCOPYABLE(StringSplitCache);
public:
    static constexpr unsigned cacheSize = 64;

    StringSplitCache() = default;

    struct Entry {
        RefPtr<AtomStringImpl> m_subject { nullptr };
        RefPtr<AtomStringImpl> m_separator { nullptr };
        JSImmutableButterfly* m_butterfly { nullptr };
    };

    JSImmutableButterfly* get(const String& subject, const String& separator);
    void set(const String& subject, const String& separator, JSImmutableButterfly*);

    void clear()
    {
        m_entries.fill(Entry { });
    }

private:
    std::array<Entry, cacheSize> m_entries { };
};

} // namespace JSC
