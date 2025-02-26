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

#include "BackgroundFetchInformation.h"
#include "NotificationClient.h"
#include "NotificationEventType.h"
#include "PushSubscriptionData.h"
#include "ScriptExecutionContextIdentifier.h"
#include "ServiceWorkerContextData.h"
#include "ServiceWorkerFetch.h"
#include "ServiceWorkerIdentifier.h"
#include "Settings.h"
#include "Timer.h"
#include "WorkerThread.h"
#include <wtf/OptionSet.h>

namespace WebCore {

class CacheStorageProvider;
class ContentSecurityPolicyResponseHeaders;
class ExtendableEvent;
class MessagePortChannel;
class SerializedScriptValue;
class WorkerObjectProxy;
struct MessageWithMessagePorts;
struct NotificationData;
struct NotificationPayload;

enum class AdvancedPrivacyProtections : uint16_t;

class ServiceWorkerThread : public WorkerThread {
public:
    template<typename... Args> static Ref<ServiceWorkerThread> create(Args&&... args)
    {
        return adoptRef(*new ServiceWorkerThread(std::forward<Args>(args)...));
    }
    virtual ~ServiceWorkerThread();

    WorkerObjectProxy& workerObjectProxy() const { return m_workerObjectProxy; }

    void start(Function<void(const String&, bool)>&&);

    void willPostTaskToFireInstallEvent();
    void willPostTaskToFireActivateEvent();
    void willPostTaskToFireMessageEvent();
    void willPostTaskToFirePushSubscriptionChangeEvent();

    void queueTaskToFireFetchEvent(Ref<ServiceWorkerFetch::Client>&&, ResourceRequest&&, String&& referrer, FetchOptions&&, SWServerConnectionIdentifier, FetchIdentifier, bool isServiceWorkerNavigationPreloadEnabled, String&& clientIdentifier, String&& resultingClientIdentifier);
    void queueTaskToPostMessage(MessageWithMessagePorts&&, ServiceWorkerOrClientData&& sourceData);
    void queueTaskToFireInstallEvent();
    void queueTaskToFireActivateEvent();
    void queueTaskToFirePushEvent(std::optional<Vector<uint8_t>>&&, std::optional<NotificationPayload>&&, Function<void(bool, std::optional<NotificationPayload>&&)>&&);
#if ENABLE(DECLARATIVE_WEB_PUSH)
    void queueTaskToFireDeclarativePushEvent(NotificationPayload&&, Function<void(bool, std::optional<NotificationPayload>&&)>&&);
#endif
    void queueTaskToFirePushSubscriptionChangeEvent(std::optional<PushSubscriptionData>&& newSubscriptionData, std::optional<PushSubscriptionData>&& oldSubscriptionData);
#if ENABLE(NOTIFICATION_EVENT)
    void queueTaskToFireNotificationEvent(NotificationData&&, NotificationEventType, Function<void(bool)>&&);
#endif
    void queueTaskToFireBackgroundFetchEvent(BackgroundFetchInformation&&, Function<void(bool)>&&);
    void queueTaskToFireBackgroundFetchClickEvent(BackgroundFetchInformation&&, Function<void(bool)>&&);

    ServiceWorkerIdentifier identifier() const { return m_serviceWorkerIdentifier; }
    std::optional<ServiceWorkerJobDataIdentifier> jobDataIdentifier() const { return m_jobDataIdentifier; }
    bool doesHandleFetch() const { return m_doesHandleFetch; }

    void startFetchEventMonitoring();
    void stopFetchEventMonitoring() { m_isHandlingFetchEvent = false; }
    void startFunctionalEventMonitoring();
    void stopFunctionalEventMonitoring() { m_isHandlingFunctionalEvent = false; }
    void startNotificationPayloadFunctionalEventMonitoring();
    void stopNotificationPayloadFunctionalEventMonitoring() { m_isHandlingNotificationPayloadFunctionalEvent = false; }

protected:
    Ref<WorkerGlobalScope> createWorkerGlobalScope(const WorkerParameters&, Ref<SecurityOrigin>&&, Ref<SecurityOrigin>&& topOrigin) final;
    void runEventLoop() override;

private:
    WEBCORE_EXPORT ServiceWorkerThread(ServiceWorkerContextData&&, ServiceWorkerData&&, String&& userAgent, WorkerThreadMode, const Settings::Values&, WorkerLoaderProxy&, WorkerDebuggerProxy&, WorkerBadgeProxy&, IDBClient::IDBConnectionProxy*, SocketProvider*, std::unique_ptr<NotificationClient>&&, PAL::SessionID, std::optional<uint64_t>, OptionSet<AdvancedPrivacyProtections>);

    ASCIILiteral threadName() const final { return "WebCore: ServiceWorker"_s; }
    void finishedEvaluatingScript() final;

    void finishedFiringInstallEvent(bool hasRejectedAnyPromise);
    void finishedFiringActivateEvent();
    void finishedFiringMessageEvent();
    void finishedFiringPushSubscriptionChangeEvent();
    void finishedStarting();

    void startHeartBeatTimer();
    void heartBeatTimerFired();
    void installEventTimerFired();

    ServiceWorkerIdentifier m_serviceWorkerIdentifier;
    std::optional<ServiceWorkerJobDataIdentifier> m_jobDataIdentifier;
    std::optional<ServiceWorkerContextData> m_contextData; // Becomes std::nullopt after the ServiceWorkerGlobalScope has been created.
    std::optional<ServiceWorkerData> m_workerData; // Becomes std::nullopt after the ServiceWorkerGlobalScope has been created.
    WorkerObjectProxy& m_workerObjectProxy;
    bool m_doesHandleFetch { false };

    bool m_isHandlingFetchEvent { false };
    bool m_isHandlingFunctionalEvent { false };
    bool m_isHandlingNotificationPayloadFunctionalEvent { false };
    uint64_t m_pushSubscriptionChangeEventCount { 0 };
    uint64_t m_messageEventCount { 0 };
    enum class State { Idle, Starting, Installing, Activating };
    State m_state { State::Idle };
    bool m_ongoingHeartBeatCheck { false };

    static constexpr Seconds heartBeatTimeout { 60_s };
    static constexpr Seconds heartBeatTimeoutForTest { 1_s };
    Seconds m_heartBeatTimeout { heartBeatTimeout };
    Timer m_heartBeatTimer;
    std::unique_ptr<NotificationClient> m_notificationClient;
};

} // namespace WebCore
