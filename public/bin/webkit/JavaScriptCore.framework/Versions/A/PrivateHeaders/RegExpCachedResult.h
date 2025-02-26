/*
 * Copyright (C) 2012-2021 Apple Inc. All rights reserved.
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
#include "SlotVisitorMacros.h"
#include "WriteBarrier.h"

namespace JSC {

class JSArray;
class JSString;
class RegExp;

// RegExpCachedResult is used to track the cached results of the last
// match, stores on the RegExp constructor (e.g. $&, $_, $1, $2 ...).
// These values will be lazily generated on demand, so the cached result
// may be in a lazy or reified state. A lazy state is indicated by a
// value of m_result indicating a successful match, and a reified state
// is indicated by setting m_result to MatchResult::failed().
// Following a successful match, m_result, m_lastInput and m_lastRegExp
// can be used to reify the results from the match, following reification
// m_reifiedResult and m_reifiedInput hold the cached results.
class RegExpCachedResult {
public:
    inline void record(VM&, JSObject* owner, RegExp*, JSString* input, MatchResult);

    JSArray* lastResult(JSGlobalObject*, JSObject* owner);
    void setInput(JSGlobalObject*, JSObject* owner, JSString*);

    JSString* leftContext(JSGlobalObject*, JSObject* owner);
    JSString* rightContext(JSGlobalObject*, JSObject* owner);

    JSString* input()
    {
        return m_reified ? m_reifiedInput.get() : m_lastInput.get();
    }

    DECLARE_VISIT_AGGREGATE;

    // m_lastRegExp would be nullptr when RegExpCachedResult is not reified.
    // If we find m_lastRegExp is nullptr, it means this should hold the empty RegExp.
    static constexpr ptrdiff_t offsetOfLastRegExp() { return OBJECT_OFFSETOF(RegExpCachedResult, m_lastRegExp); }
    static constexpr ptrdiff_t offsetOfLastInput() { return OBJECT_OFFSETOF(RegExpCachedResult, m_lastInput); }
    static constexpr ptrdiff_t offsetOfResult() { return OBJECT_OFFSETOF(RegExpCachedResult, m_result); }
    static constexpr ptrdiff_t offsetOfReified() { return OBJECT_OFFSETOF(RegExpCachedResult, m_reified); }

    MatchResult result() const { return m_result; }

private:
    MatchResult m_result { 0, 0 };
    bool m_reified { false };
    WriteBarrier<JSString> m_lastInput;
    WriteBarrier<RegExp> m_lastRegExp;
    WriteBarrier<JSArray> m_reifiedResult;
    WriteBarrier<JSString> m_reifiedInput;
    WriteBarrier<JSString> m_reifiedLeftContext;
    WriteBarrier<JSString> m_reifiedRightContext;
};

} // namespace JSC
