/*
 * Copyright (C) 2016 Canon Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted, provided that the following conditions
 * are required to be met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Canon Inc. nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY CANON INC. AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL CANON INC. AND ITS CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ExceptionOr.h"
#include "FetchHeadersGuard.h"
#include "HTTPHeaderMap.h"
#include <variant>
#include <wtf/HashTraits.h>
#include <wtf/Vector.h>

namespace WebCore {

class ScriptExecutionContext;

class FetchHeaders : public RefCounted<FetchHeaders> {
public:
    using Guard = FetchHeadersGuard;
    using Init = std::variant<Vector<Vector<String>>, Vector<KeyValuePair<String, String>>>;
    static ExceptionOr<Ref<FetchHeaders>> create(std::optional<Init>&&);

    static Ref<FetchHeaders> create(Guard guard = Guard::None, HTTPHeaderMap&& headers = { }, Vector<String>&& setCookieValues = { }) { return adoptRef(*new FetchHeaders { guard, WTFMove(headers), WTFMove(setCookieValues) }); }
    static Ref<FetchHeaders> create(const FetchHeaders& headers) { return adoptRef(*new FetchHeaders { headers }); }

    ExceptionOr<void> append(const String& name, const String& value);
    ExceptionOr<void> remove(const String&);
    ExceptionOr<String> get(const String&) const;
    const Vector<String>& getSetCookie() const;
    ExceptionOr<bool> has(const String&) const;
    ExceptionOr<void> set(const String& name, const String& value);

    ExceptionOr<void> fill(const Init&);
    ExceptionOr<void> fill(const FetchHeaders&);
    void filterAndFill(const HTTPHeaderMap&, Guard);

    String fastGet(HTTPHeaderName) const;
    bool fastHas(HTTPHeaderName) const;
    void fastSet(HTTPHeaderName, const String& value);

    class Iterator {
    public:
        explicit Iterator(FetchHeaders&);
        std::optional<KeyValuePair<String, String>> next();

    private:
        Ref<FetchHeaders> m_headers;
        size_t m_currentIndex { 0 };
        size_t m_setCookieIndex { 0 };
        Vector<String> m_keys;
        size_t m_updateCounter { 0 };
    };
    Iterator createIterator(ScriptExecutionContext*) { return Iterator { *this }; }

    void setInternalHeaders(HTTPHeaderMap&& headers) { m_headers = WTFMove(headers); }
    const HTTPHeaderMap& internalHeaders() const { return m_headers; }

    void setGuard(Guard);
    Guard guard() const { return m_guard; }

private:
    FetchHeaders(Guard, HTTPHeaderMap&&, Vector<String>&&);
    explicit FetchHeaders(const FetchHeaders&);

    Guard m_guard;
    HTTPHeaderMap m_headers;
    Vector<String> m_setCookieValues;
    uint64_t m_updateCounter { 0 };
};

inline FetchHeaders::FetchHeaders(Guard guard, HTTPHeaderMap&& headers, Vector<String>&& setCookieValues)
    : m_guard(guard)
    , m_headers(WTFMove(headers))
    , m_setCookieValues(WTFMove(setCookieValues))
{
}

inline FetchHeaders::FetchHeaders(const FetchHeaders& other)
    : RefCounted<FetchHeaders>()
    , m_guard(other.m_guard)
    , m_headers(other.m_headers)
    , m_setCookieValues(other.m_setCookieValues)
{
}

inline String FetchHeaders::fastGet(HTTPHeaderName name) const
{
    ASSERT(name != HTTPHeaderName::SetCookie);
    return m_headers.get(name);
}

inline bool FetchHeaders::fastHas(HTTPHeaderName name) const
{
    ASSERT(name != HTTPHeaderName::SetCookie);
    return m_headers.contains(name);
}

inline void FetchHeaders::fastSet(HTTPHeaderName name, const String& value)
{
    ASSERT(name != HTTPHeaderName::SetCookie);
    m_headers.set(name, value);
}

inline void FetchHeaders::setGuard(Guard guard)
{
    ASSERT(!m_headers.size());
    m_guard = guard;
}

} // namespace WebCore
