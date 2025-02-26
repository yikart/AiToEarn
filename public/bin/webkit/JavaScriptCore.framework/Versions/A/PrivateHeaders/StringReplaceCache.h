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

#include "MatchResult.h"
#include <array>
#include <wtf/TZoneMalloc.h>

namespace JSC {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER_AND_EXPORT(StringReplaceCache, WTF_INTERNAL);

class JSImmutableButterfly;
class RegExp;

class StringReplaceCache {
    WTF_MAKE_TZONE_ALLOCATED(StringReplaceCache);
    WTF_MAKE_NONCOPYABLE(StringReplaceCache);

public:
    static constexpr unsigned cacheSize = 64;

    StringReplaceCache() = default;

    struct Entry {
        RefPtr<AtomStringImpl> m_subject { nullptr };
        RegExp* m_regExp { nullptr };
        JSImmutableButterfly* m_result { nullptr }; // We use JSImmutableButterfly since we would like to keep all entries alive while repeatedly calling a JS function.
        MatchResult m_matchResult { };
        Vector<int> m_lastMatch { };
    };

    Entry* get(const String& subject, RegExp*);
    void set(const String& subject, RegExp*, JSImmutableButterfly*, MatchResult, const Vector<int>&);

    DECLARE_VISIT_AGGREGATE;

    void clear()
    {
        m_entries.fill(Entry { });
    }

private:
    std::array<Entry, cacheSize> m_entries { };
};

} // namespace JSC
