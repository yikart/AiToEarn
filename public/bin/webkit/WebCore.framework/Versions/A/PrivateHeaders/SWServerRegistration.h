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

#include "CookieChangeSubscription.h"
#include "NavigationPreloadState.h"
#include "SWServer.h"
#include "ScriptExecutionContextIdentifier.h"
#include "ServiceWorkerRegistrationData.h"
#include "ServiceWorkerTypes.h"
#include "Timer.h"
#include <wtf/Forward.h>
#include <wtf/HashCountedSet.h>
#include <wtf/HashSet.h>
#include <wtf/Identified.h>
#include <wtf/MonotonicTime.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WallTime.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class SWServer;
class SWServerWorker;
enum class ServiceWorkerRegistrationState : uint8_t;
enum class ServiceWorkerState : uint8_t;
struct ExceptionData;
struct ServiceWorkerContextData;

enum class IsAppInitiated : bool { No, Yes };

class SWServerRegistration : public RefCountedAndCanMakeWeakPtr<SWServerRegistration>, public Identified<ServiceWorkerRegistrationIdentifier> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SWServerRegistration, WEBCORE_EXPORT);
public:
    static Ref<SWServerRegistration> create(SWServer&, const ServiceWorkerRegistrationKey&, ServiceWorkerUpdateViaCache, const URL& scopeURL, const URL& scriptURL, std::optional<ScriptExecutionContextIdentifier> serviceWorkerPageIdentifier, NavigationPreloadState&&);
    WEBCORE_EXPORT ~SWServerRegistration();

    const ServiceWorkerRegistrationKey& key() const { return m_registrationKey; }

    SWServerWorker* getNewestWorker();
    WEBCORE_EXPORT ServiceWorkerRegistrationData data() const;

    void setLastUpdateTime(WallTime);
    WallTime lastUpdateTime() const { return m_lastUpdateTime; }
    bool isStale() const { return m_lastUpdateTime && (WallTime::now() - m_lastUpdateTime) > 86400_s; }

    void setUpdateViaCache(ServiceWorkerUpdateViaCache);
    ServiceWorkerUpdateViaCache updateViaCache() const { return m_updateViaCache; }

    void updateRegistrationState(ServiceWorkerRegistrationState, SWServerWorker*);
    void updateWorkerState(SWServerWorker&, ServiceWorkerState);
    void fireUpdateFoundEvent();

    void addClientServiceWorkerRegistration(SWServerConnectionIdentifier);
    void removeClientServiceWorkerRegistration(SWServerConnectionIdentifier);

    void setPreInstallationWorker(SWServerWorker*);
    SWServerWorker* preInstallationWorker() const { return m_preInstallationWorker.get(); }
    SWServerWorker* installingWorker() const { return m_installingWorker.get(); }
    SWServerWorker* waitingWorker() const { return m_waitingWorker.get(); }
    SWServerWorker* activeWorker() const { return m_activeWorker.get(); }

    MonotonicTime creationTime() const { return m_creationTime; }

    bool hasClientsUsingRegistration() const { return !m_clientsUsingRegistration.isEmpty(); }
    void addClientUsingRegistration(const ScriptExecutionContextIdentifier&);
    void removeClientUsingRegistration(const ScriptExecutionContextIdentifier&);
    void unregisterServerConnection(SWServerConnectionIdentifier);

    void notifyClientsOfControllerChange();
    void controlClient(ScriptExecutionContextIdentifier);

    void clear();
    bool tryClear();
    void tryActivate();
    void didFinishActivation(ServiceWorkerIdentifier);
    
    bool isUnregistered() const;

    void forEachConnection(const Function<void(SWServer::Connection&)>&);

    WEBCORE_EXPORT bool shouldSoftUpdate(const FetchOptions&) const;
    WEBCORE_EXPORT void scheduleSoftUpdate(IsAppInitiated);
    static constexpr Seconds softUpdateDelay { 1_s };

    URL scopeURLWithoutFragment() const { return m_scopeURL; }
    URL scriptURL() const { return m_scriptURL; }

    bool isAppInitiated() const { return m_isAppInitiated; }
    std::optional<ScriptExecutionContextIdentifier> serviceWorkerPageIdentifier() const { return m_serviceWorkerPageIdentifier; }

    WEBCORE_EXPORT std::optional<ExceptionData> enableNavigationPreload();
    WEBCORE_EXPORT std::optional<ExceptionData> disableNavigationPreload();
    WEBCORE_EXPORT std::optional<ExceptionData> setNavigationPreloadHeaderValue(String&&);
    const NavigationPreloadState& navigationPreloadState() const { return m_preloadState; }

    WEBCORE_EXPORT void addCookieChangeSubscriptions(Vector<CookieChangeSubscription>&&);
    WEBCORE_EXPORT void removeCookieChangeSubscriptions(Vector<CookieChangeSubscription>&&);
    WEBCORE_EXPORT Vector<CookieChangeSubscription> cookieChangeSubscriptions() const;

private:
    SWServerRegistration(SWServer&, const ServiceWorkerRegistrationKey&, ServiceWorkerUpdateViaCache, const URL& scopeURL, const URL& scriptURL, std::optional<ScriptExecutionContextIdentifier> serviceWorkerPageIdentifier, NavigationPreloadState&&);

    void activate();
    void handleClientUnload();
    void softUpdate();

    RefPtr<SWServer> protectedServer() const { return m_server.get(); }

    ServiceWorkerRegistrationKey m_registrationKey;
    ServiceWorkerUpdateViaCache m_updateViaCache;
    URL m_scopeURL;
    URL m_scriptURL;
    std::optional<ScriptExecutionContextIdentifier> m_serviceWorkerPageIdentifier;

    RefPtr<SWServerWorker> m_preInstallationWorker; // Implementation detail, not part of the specification.
    RefPtr<SWServerWorker> m_installingWorker;
    RefPtr<SWServerWorker> m_waitingWorker;
    RefPtr<SWServerWorker> m_activeWorker;

    HashSet<CookieChangeSubscription> m_cookieChangeSubscriptions;

    WallTime m_lastUpdateTime;
    
    HashCountedSet<SWServerConnectionIdentifier> m_connectionsWithClientRegistrations;
    WeakPtr<SWServer> m_server;

    MonotonicTime m_creationTime;
    HashMap<SWServerConnectionIdentifier, HashSet<ScriptExecutionContextIdentifier>> m_clientsUsingRegistration;

    WebCore::Timer m_softUpdateTimer;
    
    bool m_isAppInitiated { true };
    NavigationPreloadState m_preloadState;
};

} // namespace WebCore
