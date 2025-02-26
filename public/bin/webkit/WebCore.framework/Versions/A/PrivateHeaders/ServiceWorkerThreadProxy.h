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

#include "CacheStorageConnection.h"
#include "Document.h"
#include "FetchIdentifier.h"
#include "Page.h"
#include "PushSubscriptionData.h"
#include "ServiceWorkerDebuggable.h"
#include "ServiceWorkerIdentifier.h"
#include "ServiceWorkerInspectorProxy.h"
#include "ServiceWorkerThread.h"
#include "StorageBlockingPolicy.h"
#include "WorkerBadgeProxy.h"
#include "WorkerDebuggerProxy.h"
#include "WorkerLoaderProxy.h"
#include <wtf/CheckedPtr.h>
#include <wtf/HashMap.h>
#include <wtf/URLHash.h>

namespace WebCore {

class CacheStorageProvider;
class FetchLoader;
class FetchLoaderClient;
class PageConfiguration;
class NotificationClient;
class ServiceWorkerInspectorProxy;
struct NotificationPayload;
struct ServiceWorkerContextData;
enum class WorkerThreadMode : bool;

class ServiceWorkerThreadProxy final : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<ServiceWorkerThreadProxy, WTF::DestructionThread::Main>, public WorkerLoaderProxy, public WorkerDebuggerProxy, public WorkerBadgeProxy, public CanMakeThreadSafeCheckedPtr<ServiceWorkerThreadProxy> {
    WTF_MAKE_FAST_ALLOCATED;
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ServiceWorkerThreadProxy);
public:
    template<typename... Args> static Ref<ServiceWorkerThreadProxy> create(Args&&... args)
    {
        return adoptRef(*new ServiceWorkerThreadProxy(std::forward<Args>(args)...));
    }
    WEBCORE_EXPORT ~ServiceWorkerThreadProxy();

    ServiceWorkerIdentifier identifier() const { return m_serviceWorkerThread->identifier(); }
    ServiceWorkerThread& thread() { return m_serviceWorkerThread.get(); }
    ServiceWorkerInspectorProxy& inspectorProxy() { return m_inspectorProxy; }

    bool isTerminatingOrTerminated() const { return m_isTerminatingOrTerminated; }
    void setAsTerminatingOrTerminated() { m_isTerminatingOrTerminated = true; }

    WEBCORE_EXPORT std::unique_ptr<FetchLoader> createBlobLoader(FetchLoaderClient&, const URL&);

    const URL& scriptURL() const { return m_document->url(); }

    WEBCORE_EXPORT void notifyNetworkStateChange(bool isOnline);

    WEBCORE_EXPORT void startFetch(SWServerConnectionIdentifier, FetchIdentifier, Ref<ServiceWorkerFetch::Client>&&, ResourceRequest&&, String&& referrer, FetchOptions&&, bool isServiceWorkerNavigationPreloadEnabled, String&& clientIdentifier, String&& resultingClientIdentifier);
    WEBCORE_EXPORT void cancelFetch(SWServerConnectionIdentifier, FetchIdentifier);
    WEBCORE_EXPORT void removeFetch(SWServerConnectionIdentifier, FetchIdentifier);
    WEBCORE_EXPORT void navigationPreloadIsReady(SWServerConnectionIdentifier, FetchIdentifier, ResourceResponse&&);
    WEBCORE_EXPORT void navigationPreloadFailed(SWServerConnectionIdentifier, FetchIdentifier, ResourceError&&);

    WEBCORE_EXPORT void fireMessageEvent(MessageWithMessagePorts&&, ServiceWorkerOrClientData&&);

    WEBCORE_EXPORT void fireInstallEvent();
    WEBCORE_EXPORT void fireActivateEvent();
    void firePushEvent(std::optional<Vector<uint8_t>>&&, std::optional<NotificationPayload>&&, CompletionHandler<void(bool, std::optional<NotificationPayload>&&)>&&);
    void firePushSubscriptionChangeEvent(std::optional<PushSubscriptionData>&& newSubscriptionData, std::optional<PushSubscriptionData>&& oldSubscriptionData);
    void fireNotificationEvent(NotificationData&&, NotificationEventType, CompletionHandler<void(bool)>&&);
    void fireBackgroundFetchEvent(BackgroundFetchInformation&&, CompletionHandler<void(bool)>&&);
    void fireBackgroundFetchClickEvent(BackgroundFetchInformation&&, CompletionHandler<void(bool)>&&);

    WEBCORE_EXPORT void didSaveScriptsToDisk(ScriptBuffer&&, HashMap<URL, ScriptBuffer>&& importedScripts);

    WEBCORE_EXPORT void setLastNavigationWasAppInitiated(bool);
    WEBCORE_EXPORT bool lastNavigationWasAppInitiated();

    WEBCORE_EXPORT void setInspectable(bool);

    uint32_t checkedPtrCount() const { return CanMakeThreadSafeCheckedPtr<ServiceWorkerThreadProxy>::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const { return CanMakeThreadSafeCheckedPtr<ServiceWorkerThreadProxy>::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const { CanMakeThreadSafeCheckedPtr<ServiceWorkerThreadProxy>::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const { CanMakeThreadSafeCheckedPtr<ServiceWorkerThreadProxy>::decrementCheckedPtrCount(); }

private:
    WEBCORE_EXPORT ServiceWorkerThreadProxy(Ref<Page>&&, ServiceWorkerContextData&&, ServiceWorkerData&&, String&& userAgent, WorkerThreadMode, CacheStorageProvider&, std::unique_ptr<NotificationClient>&&);

    WEBCORE_EXPORT static void networkStateChanged(bool isOnLine);
    bool postTaskForModeToWorkerOrWorkletGlobalScope(ScriptExecutionContext::Task&&, const String& mode);

    // WorkerLoaderProxy
    void postTaskToLoader(ScriptExecutionContext::Task&&) final;
    ScriptExecutionContextIdentifier loaderContextIdentifier() const final;
    RefPtr<CacheStorageConnection> createCacheStorageConnection() final;
    RefPtr<RTCDataChannelRemoteHandlerConnection> createRTCDataChannelRemoteHandlerConnection() final;

    // WorkerDebuggerProxy
    void postMessageToDebugger(const String&) final;
    void setResourceCachingDisabledByWebInspector(bool) final;

    // WorkerBadgeProxy
    void setAppBadge(std::optional<uint64_t>) final;

    Ref<Page> m_page;
    Ref<Document> m_document;
#if ENABLE(REMOTE_INSPECTOR)
    Ref<ServiceWorkerDebuggable> m_remoteDebuggable;
#endif
    Ref<ServiceWorkerThread> m_serviceWorkerThread;
    CacheStorageProvider& m_cacheStorageProvider;
    RefPtr<CacheStorageConnection> m_cacheStorageConnection;
    bool m_isTerminatingOrTerminated { false };

    ServiceWorkerInspectorProxy m_inspectorProxy;
    uint64_t m_functionalEventTasksCounter { 0 };
    HashMap<uint64_t, CompletionHandler<void(bool)>> m_ongoingFunctionalEventTasks;
    HashMap<uint64_t, CompletionHandler<void(bool, std::optional<NotificationPayload>&&)>> m_ongoingNotificationPayloadFunctionalEventTasks;
};

} // namespace WebKit
