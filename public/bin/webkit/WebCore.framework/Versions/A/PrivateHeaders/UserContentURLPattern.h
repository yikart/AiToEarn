/*
 * Copyright (C) 2009-2023 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/URL.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class UserContentURLPattern {
public:
    UserContentURLPattern() = default;

    enum class Error : uint8_t {
        None,
        Invalid,
        MissingScheme,
        MissingHost,
        InvalidHost,
        MissingPath,
    };

    explicit UserContentURLPattern(StringView pattern)
    {
        m_error = parse(pattern);
    }

    WEBCORE_EXPORT UserContentURLPattern(StringView scheme, StringView host, StringView path);

    bool isValid() const { return m_error == Error::None; }
    Error error() const { return m_error; }

    template <typename T>
    bool matches(const T& test) const
    {
        if (!isValid())
            return false;
        return matchesScheme(test) && matchesHost(test) && matchesPath(test);
    }

    const String& scheme() const { return m_scheme; }
    const String& host() const { return m_host; }
    const String& path() const { return m_path; }

    bool matchAllHosts() const { return m_matchSubdomains && m_host.isEmpty(); }
    bool matchSubdomains() const { return m_matchSubdomains; }

    // The host with the '*' wildcard, if matchSubdomains is true, otherwise same as host().
    WEBCORE_EXPORT String originalHost() const;

    WEBCORE_EXPORT bool matchesScheme(const URL&) const;
    bool matchesHost(const URL& url) const { return matchesHost(url.host().toStringWithoutCopying()); }
    bool matchesPath(const URL& url) const { return matchesPath(url.path().toStringWithoutCopying()); }

    WEBCORE_EXPORT bool matchesScheme(const UserContentURLPattern&) const;
    bool matchesHost(const UserContentURLPattern& other) const { return matchesHost(other.host()); }
    bool matchesPath(const UserContentURLPattern& other) const { return matchesPath(other.path()); }

    WEBCORE_EXPORT bool operator==(const UserContentURLPattern& other) const;

    static bool matchesPatterns(const URL&, const Vector<String>& allowlist, const Vector<String>& blocklist);

private:
    WEBCORE_EXPORT Error parse(StringView pattern);
    void normalizeHostAndSetMatchSubdomains();

    WEBCORE_EXPORT bool matchesHost(const String&) const;
    WEBCORE_EXPORT bool matchesPath(const String&) const;

    String m_scheme;
    String m_host;
    String m_path;

    Error m_error { Error::Invalid };
    bool m_matchSubdomains { false };
};

WEBCORE_EXPORT bool matchesWildcardPattern(const String& pattern, const String& testString);

} // namespace WebCore
