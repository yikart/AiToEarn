/*
 * Copyright (C) 2006-2020 Apple Inc.  All rights reserved.
 * Copyright (C) 2016 Canon Inc.  All rights reserved.
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

#include <wtf/TZoneMalloc.h>
#include <wtf/URL.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class ResourceError;

WEBCORE_EXPORT extern const ASCIILiteral errorDomainWebKitInternal; // Used for errors that won't be exposed to clients.
WEBCORE_EXPORT extern const ASCIILiteral errorDomainWebKitServiceWorker; // Used for errors that happen when loading a resource from a service worker.

enum class ResourceErrorBaseType : uint8_t {
    Null,
    General,
    AccessControl,
    Cancellation,
    Timeout
};

class ResourceErrorBase {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ResourceErrorBase, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT ResourceError isolatedCopy() const;

    const String& domain() const { lazyInit(); return m_domain; }
    int errorCode() const { lazyInit(); return m_errorCode; }
    const URL& failingURL() const { lazyInit(); return m_failingURL; }
    const String& localizedDescription() const { lazyInit(); return m_localizedDescription; }

    String sanitizedDescription() const { return m_isSanitized  == IsSanitized::Yes ? m_localizedDescription : "Load failed"_s; }

    using Type = ResourceErrorBaseType;

    enum class IsSanitized : bool { No, Yes };

    enum class ErrorRecoveryMethod : bool {
        NoRecovery,
        HTTPFallback
    };

    bool isNull() const { return m_type == Type::Null; }
    bool isGeneral() const { return m_type == Type::General; }
    bool isAccessControl() const { return m_type == Type::AccessControl; }
    bool isCancellation() const { return m_type == Type::Cancellation; }
    bool isTimeout() const { return m_type == Type::Timeout; }

    static bool compare(const ResourceError&, const ResourceError&);

    WEBCORE_EXPORT void setType(Type);
    Type type() const { return m_type; }

    bool isSanitized() const { return m_isSanitized == IsSanitized::Yes; }
    void setAsSanitized() { m_isSanitized = IsSanitized::Yes; }

protected:
    ResourceErrorBase(Type type) : m_type(type) { }

    ResourceErrorBase(const String& domain, int errorCode, const URL& failingURL, const String& localizedDescription, Type type, IsSanitized isSanitized)
        : m_domain(domain)
        , m_failingURL(failingURL)
        , m_localizedDescription(localizedDescription)
        , m_errorCode(errorCode)
        , m_type(type)
        , m_isSanitized(isSanitized)
    {
    }

    WEBCORE_EXPORT void lazyInit() const;

    // The ResourceError subclass may "shadow" this method to lazily initialize platform specific fields
    void platformLazyInit() {}

    // The ResourceError subclass may "shadow" this method to compare platform specific fields
    static bool platformCompare(const ResourceError&, const ResourceError&) { return true; }

    String m_domain;
    URL m_failingURL;
    String m_localizedDescription;
    int m_errorCode { 0 };
    Type m_type { Type::General };
    IsSanitized m_isSanitized { IsSanitized::No };

private:
    const ResourceError& asResourceError() const;
};

// FIXME: Replace this with std::source_location when libc++ on the macOS and iOS bots is new enough to support C++ 20.
// WEBCORE_EXPORT ResourceError internalError(const URL&, std::source_location = std::source_location::current());
WEBCORE_EXPORT ResourceError createInternalError(const URL&, ASCIILiteral filename, uint32_t line, ASCIILiteral functionName);
#define internalError(url) createInternalError(url, ASCIILiteral::fromLiteralUnsafe(__FILE__), __LINE__, ASCIILiteral::fromLiteralUnsafe(__FUNCTION__))

WEBCORE_EXPORT ResourceError badResponseHeadersError(const URL&);

inline bool operator==(const ResourceError& a, const ResourceError& b) { return ResourceErrorBase::compare(a, b); }

} // namespace WebCore
