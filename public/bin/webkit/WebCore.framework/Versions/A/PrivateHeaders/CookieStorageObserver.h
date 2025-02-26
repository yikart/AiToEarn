/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <pal/spi/cf/CFNetworkSPI.h>
#include <wtf/Function.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

OBJC_CLASS NSHTTPCookieStorage;
OBJC_CLASS WebCookieObserverAdapter;

namespace WebCore {
class CookieStorageObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::CookieStorageObserver> : std::true_type { };
}

namespace WebCore {

// Use eager initialization for the WeakPtrFactory since we construct WeakPtrs on a non-main thread.
class WEBCORE_EXPORT CookieStorageObserver : public CanMakeWeakPtr<CookieStorageObserver, WeakPtrFactoryInitialization::Eager> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(CookieStorageObserver, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(CookieStorageObserver);
public:
    explicit CookieStorageObserver(NSHTTPCookieStorage *);
    ~CookieStorageObserver();

    void startObserving(Function<void()>&& callback);
    void stopObserving();

    void cookiesDidChange();

private:
    RetainPtr<NSHTTPCookieStorage> m_cookieStorage;
    bool m_hasRegisteredInternalsForNotifications { false };
    RetainPtr<WebCookieObserverAdapter> m_observerAdapter;
    Function<void()> m_cookieChangeCallback;
};

} // namespace WebCore
