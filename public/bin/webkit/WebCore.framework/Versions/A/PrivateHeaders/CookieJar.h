/*
 * Copyright (C) 2003-2018 Apple Inc. All rights reserved.
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

#include "FrameIdentifier.h"
#include "PageIdentifier.h"
#include "SameSiteInfo.h"
#include <optional>
#include <wtf/Forward.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

enum class IncludeSecureCookies : bool { No, Yes };
enum class IncludeHttpOnlyCookies : bool { No, Yes };
enum class SecureCookiesAccessed : bool { No, Yes };

class Document;
struct Cookie;
class CookieChangeListener;
struct CookieRequestHeaderFieldProxy;
struct CookieStoreGetOptions;
class NetworkStorageSession;
class StorageSessionProvider;
struct SameSiteInfo;
enum class ShouldPartitionCookie : bool;
class ResourceLoader;

class WEBCORE_EXPORT CookieJar : public RefCountedAndCanMakeWeakPtr<CookieJar> {
public:
    static Ref<CookieJar> create(Ref<StorageSessionProvider>&&);
    
    static CookieRequestHeaderFieldProxy cookieRequestHeaderFieldProxy(const Document&, const URL&);

    String cookieRequestHeaderFieldValue(Document&, const URL&) const;

    // These two functions implement document.cookie API, with special rules for HttpOnly cookies.
    virtual String cookies(Document&, const URL&) const;
    virtual void setCookies(Document&, const URL&, const String& cookieString);

    virtual bool cookiesEnabled(Document&);
    virtual void remoteCookiesEnabled(const Document&, CompletionHandler<void(bool)>&&) const;
    virtual std::pair<String, SecureCookiesAccessed> cookieRequestHeaderFieldValue(const URL& firstParty, const SameSiteInfo&, const URL&, std::optional<FrameIdentifier>, std::optional<PageIdentifier>, IncludeSecureCookies) const;
    virtual bool getRawCookies(Document&, const URL&, Vector<Cookie>&) const;
    virtual void setRawCookie(const Document&, const Cookie&, ShouldPartitionCookie);
    virtual void deleteCookie(const Document&, const URL&, const String& cookieName, CompletionHandler<void()>&&);

    virtual void getCookiesAsync(Document&, const URL&, const CookieStoreGetOptions&, CompletionHandler<void(std::optional<Vector<Cookie>>&&)>&&) const;
    virtual void setCookieAsync(Document&, const URL&, const Cookie&, CompletionHandler<void(bool)>&&) const;

#if HAVE(COOKIE_CHANGE_LISTENER_API)
    virtual void addChangeListener(const WebCore::Document&, const CookieChangeListener&);
    virtual void removeChangeListener(const String& host, const CookieChangeListener&);
#endif

    // Cookie Cache.
    virtual void clearCache() { }
    virtual void clearCacheForHost(const String&) { }

    // Playwright.
    virtual void setCookieFromResponse(ResourceLoader&, const String&) { }

    virtual ~CookieJar();
protected:
    static SameSiteInfo sameSiteInfo(const Document&, IsForDOMCookieAccess = IsForDOMCookieAccess::No);
    static IncludeSecureCookies shouldIncludeSecureCookies(const Document&, const URL&);
    CookieJar(Ref<StorageSessionProvider>&&);

private:
    Ref<StorageSessionProvider> m_storageSessionProvider;
    Ref<StorageSessionProvider> protectedStorageSessionProvider() const;
};

} // namespace WebCore
