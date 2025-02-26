/*
 * Copyright (C) 2008-2017 Apple Inc. All rights reserved.
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
#include <wtf/RetainPtr.h>
#include "Timer.h"

#if PLATFORM(IOS_FAMILY)
OBJC_CLASS WebNetworkStateObserver;
#endif

#if PLATFORM(MAC)
typedef const struct __SCDynamicStore * SCDynamicStoreRef;
#endif

#if PLATFORM(WIN)
#include <windows.h>
#endif

namespace WebCore {

class NetworkStateNotifier {
    WTF_MAKE_NONCOPYABLE(NetworkStateNotifier);

public:
    WEBCORE_EXPORT static NetworkStateNotifier& singleton();

    WEBCORE_EXPORT bool onLine();
    WEBCORE_EXPORT void addListener(Function<void(bool isOnLine)>&&);

private:
    friend NeverDestroyed<NetworkStateNotifier>;

    NetworkStateNotifier();

    void updateStateWithoutNotifying();
    void updateState();
    void updateStateSoon();
    void startObserving();

#if PLATFORM(WIN)
    void registerForAddressChange();
    static void CALLBACK addressChangeCallback(void*, BOOLEAN timedOut);
#endif

#if USE(GLIB)
    static void networkChangedCallback(NetworkStateNotifier*);
#endif

    std::optional<bool> m_isOnLine;
    Vector<Function<void(bool)>> m_listeners;
    Timer m_updateStateTimer;

#if PLATFORM(IOS_FAMILY)
    RetainPtr<WebNetworkStateObserver> m_observer;
#endif

#if PLATFORM(MAC)
    RetainPtr<SCDynamicStoreRef> m_store;
#endif

#if PLATFORM(WIN)
    HANDLE m_waitHandle;
    OVERLAPPED m_overlapped;
#endif
};

} // namespace WebCore
