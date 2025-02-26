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

#include "BackgroundFetchRecordIdentifier.h"
#include "BackgroundFetchStore.h"
#include "ClientOrigin.h"
#include "ExceptionOr.h"
#include "NotificationPayload.h"
#include "PageIdentifier.h"
#include "SWServerDelegate.h"
#include "SWServerWorker.h"
#include "ScriptExecutionContextIdentifier.h"
#include "SecurityOriginData.h"
#include "ServiceWorkerClientData.h"
#include "ServiceWorkerClientPendingMessage.h"
#include "ServiceWorkerIdentifier.h"
#include "ServiceWorkerJob.h"
#include "ServiceWorkerRegistrationData.h"
#include "ServiceWorkerRegistrationKey.h"
#include "ServiceWorkerTypes.h"
#include "WorkerThreadMode.h"
#include <pal/SessionID.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/ObjectIdentifier.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/RunLoop.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Threading.h>
#include <wtf/URLHash.h>
#include <wtf/UniqueRef.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class BackgroundFetchEngine;
class RegistrationStore;
class SWOriginStore;
class SWServerJobQueue;
class SWServerRegistration;
class SWServerToContextConnection;
class Site;
class Timer;

enum class AdvancedPrivacyProtections : uint16_t;
enum class NotificationEventType : bool;

struct BackgroundFetchInformation;
struct BackgroundFetchOptions;
struct BackgroundFetchRecordInformation;
struct BackgroundFetchRequest;
struct ExceptionData;
struct MessageWithMessagePorts;
struct NotificationData;
struct RetrieveRecordsOptions;
struct ServiceWorkerClientQueryOptions;
struct ServiceWorkerContextData;
struct ServiceWorkerRegistrationData;
struct WorkerFetchResult;

class SWServer : public RefCountedAndCanMakeWeakPtr<SWServer> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SWServer, WEBCORE_EXPORT);
public:
    class Connection : public CanMakeWeakPtr<Connection>, public RefCounted<Connection> {
        WTF_MAKE_TZONE_ALLOCATED_EXPORT(Connection, WEBCORE_EXPORT);
        friend class SWServer;
    public:
        WEBCORE_EXPORT virtual ~Connection();

        using Identifier = SWServerConnectionIdentifier;
        Identifier identifier() const { return m_identifier; }

        WEBCORE_EXPORT void didResolveRegistrationPromise(const ServiceWorkerRegistrationKey&);
        WEBCORE_EXPORT RefPtr<SWServerRegistration> doRegistrationMatching(const SecurityOriginData& topOrigin, const URL& clientURL);
        void resolveRegistrationReadyRequests(SWServerRegistration&);

        using ExceptionOrBackgroundFetchInformationCallback = CompletionHandler<void(Expected<std::optional<BackgroundFetchInformation>, ExceptionData>&&)>;
        WEBCORE_EXPORT void startBackgroundFetch(ServiceWorkerRegistrationIdentifier, const String&, Vector<BackgroundFetchRequest>&&, BackgroundFetchOptions&&, ExceptionOrBackgroundFetchInformationCallback&&);
        WEBCORE_EXPORT void backgroundFetchInformation(ServiceWorkerRegistrationIdentifier, const String&, ExceptionOrBackgroundFetchInformationCallback&&);
        using BackgroundFetchIdentifiersCallback = CompletionHandler<void(Vector<String>&&)>;
        WEBCORE_EXPORT void backgroundFetchIdentifiers(ServiceWorkerRegistrationIdentifier, BackgroundFetchIdentifiersCallback&&);
        using AbortBackgroundFetchCallback = CompletionHandler<void(bool)>;
        WEBCORE_EXPORT void abortBackgroundFetch(ServiceWorkerRegistrationIdentifier, const String&, AbortBackgroundFetchCallback&&);
        using MatchBackgroundFetchCallback = CompletionHandler<void(Vector<BackgroundFetchRecordInformation>&&)>;
        WEBCORE_EXPORT void matchBackgroundFetch(ServiceWorkerRegistrationIdentifier, const String&, RetrieveRecordsOptions&&, MatchBackgroundFetchCallback&&);
        using RetrieveRecordResponseCallback = CompletionHandler<void(Expected<ResourceResponse, ExceptionData>&&)>;
        WEBCORE_EXPORT void retrieveRecordResponse(BackgroundFetchRecordIdentifier, RetrieveRecordResponseCallback&&);
        using RetrieveRecordResponseBodyCallback = Function<void(Expected<RefPtr<SharedBuffer>, ResourceError>&&)>;
        WEBCORE_EXPORT void retrieveRecordResponseBody(BackgroundFetchRecordIdentifier, RetrieveRecordResponseBodyCallback&&);

        // Messages to the client WebProcess
        virtual void updateRegistrationStateInClient(ServiceWorkerRegistrationIdentifier, ServiceWorkerRegistrationState, const std::optional<ServiceWorkerData>&) = 0;
        virtual void updateWorkerStateInClient(ServiceWorkerIdentifier, ServiceWorkerState) = 0;
        virtual void fireUpdateFoundEvent(ServiceWorkerRegistrationIdentifier) = 0;
        virtual void setRegistrationLastUpdateTime(ServiceWorkerRegistrationIdentifier, WallTime) = 0;
        virtual void setRegistrationUpdateViaCache(ServiceWorkerRegistrationIdentifier, ServiceWorkerUpdateViaCache) = 0;
        virtual void notifyClientsOfControllerChange(const HashSet<ScriptExecutionContextIdentifier>& contextIdentifiers, const std::optional<ServiceWorkerData>& newController) = 0;
        virtual void postMessageToServiceWorkerClient(ScriptExecutionContextIdentifier, const MessageWithMessagePorts&, ServiceWorkerIdentifier, const String& sourceOrigin) = 0;
        virtual void focusServiceWorkerClient(ScriptExecutionContextIdentifier, CompletionHandler<void(std::optional<ServiceWorkerClientData>&&)>&&) = 0;
        virtual void updateBackgroundFetchRegistration(const BackgroundFetchInformation&) = 0;

        virtual void contextConnectionCreated(SWServerToContextConnection&) = 0;

        SWServer* server() { return m_server.get(); }
        const SWServer* server() const { return m_server.get(); }

    protected:
        WEBCORE_EXPORT Connection(SWServer&, Identifier);

        WEBCORE_EXPORT void finishFetchingScriptInServer(const ServiceWorkerJobDataIdentifier&, const ServiceWorkerRegistrationKey&, WorkerFetchResult&&);
        WEBCORE_EXPORT void addServiceWorkerRegistrationInServer(ServiceWorkerRegistrationIdentifier);
        WEBCORE_EXPORT void removeServiceWorkerRegistrationInServer(ServiceWorkerRegistrationIdentifier);
        WEBCORE_EXPORT void whenRegistrationReady(const SecurityOriginData& topOrigin, const URL& clientURL, CompletionHandler<void(std::optional<ServiceWorkerRegistrationData>&&)>&&);

        WEBCORE_EXPORT void storeRegistrationsOnDisk(CompletionHandler<void()>&&);

    private:
        // Messages to the client WebProcess
        virtual void rejectJobInClient(ServiceWorkerJobIdentifier, const ExceptionData&) = 0;
        virtual void resolveRegistrationJobInClient(ServiceWorkerJobIdentifier, const ServiceWorkerRegistrationData&, ShouldNotifyWhenResolved) = 0;
        virtual void resolveUnregistrationJobInClient(ServiceWorkerJobIdentifier, const ServiceWorkerRegistrationKey&, bool registrationResult) = 0;
        virtual void startScriptFetchInClient(ServiceWorkerJobIdentifier, const ServiceWorkerRegistrationKey&, FetchOptions::Cache) = 0;

        struct RegistrationReadyRequest {
            SecurityOriginData topOrigin;
            URL clientURL;
            CompletionHandler<void(std::optional<ServiceWorkerRegistrationData>&&)> callback;
        };

        WeakPtr<SWServer> m_server;
        Identifier m_identifier;
        Vector<RegistrationReadyRequest> m_registrationReadyRequests;
    };

    WEBCORE_EXPORT static Ref<SWServer> create(SWServerDelegate&, UniqueRef<SWOriginStore>&&, bool processTerminationDelayEnabled, String&& registrationDatabaseDirectory, PAL::SessionID, bool shouldRunServiceWorkersOnMainThreadForTesting, bool hasServiceWorkerEntitlement, std::optional<unsigned> overrideServiceWorkerRegistrationCountTestingValue, ServiceWorkerIsInspectable);
    WEBCORE_EXPORT ~SWServer();

    WEBCORE_EXPORT void clearAll(CompletionHandler<void()>&&);
    WEBCORE_EXPORT void clear(const SecurityOriginData&, CompletionHandler<void()>&&);
    WEBCORE_EXPORT void clear(const ClientOrigin&, CompletionHandler<void()>&&);

    WEBCORE_EXPORT void setInspectable(ServiceWorkerIsInspectable);

    WEBCORE_EXPORT SWServerRegistration* getRegistration(ServiceWorkerRegistrationIdentifier);
    WEBCORE_EXPORT SWServerRegistration* getRegistration(const ServiceWorkerRegistrationKey&);
    void addRegistration(Ref<SWServerRegistration>&&);
    void removeRegistration(ServiceWorkerRegistrationIdentifier);
    WEBCORE_EXPORT Vector<ServiceWorkerRegistrationData> getRegistrations(const SecurityOriginData& topOrigin, const URL& clientURL);
    WEBCORE_EXPORT void storeRegistrationsOnDisk(CompletionHandler<void()>&&);

    WEBCORE_EXPORT void scheduleJob(ServiceWorkerJobData&&);
    WEBCORE_EXPORT void scheduleUnregisterJob(ServiceWorkerJobDataIdentifier, SWServerRegistration&, ServiceWorkerOrClientIdentifier, URL&&);

    void rejectJob(const ServiceWorkerJobData&, const ExceptionData&);
    void resolveRegistrationJob(const ServiceWorkerJobData&, const ServiceWorkerRegistrationData&, ShouldNotifyWhenResolved);
    void resolveUnregistrationJob(const ServiceWorkerJobData&, const ServiceWorkerRegistrationKey&, bool unregistrationResult);
    void startScriptFetch(const ServiceWorkerJobData&, SWServerRegistration&);
    void refreshImportedScripts(const ServiceWorkerJobData&, SWServerRegistration&, const Vector<URL>&, const std::optional<ProcessIdentifier>&);

    void updateWorker(const ServiceWorkerJobDataIdentifier&, const std::optional<ProcessIdentifier>&, SWServerRegistration&, const URL&, const ScriptBuffer&, const CertificateInfo&, const ContentSecurityPolicyResponseHeaders&, const CrossOriginEmbedderPolicy&, const String& referrerPolicy, WorkerType, MemoryCompactRobinHoodHashMap<URL, ServiceWorkerContextData::ImportedScript>&&, std::optional<ScriptExecutionContextIdentifier> serviceWorkerPageIdentifier);
    void fireInstallEvent(SWServerWorker&);
    void runServiceWorkerAndFireActivateEvent(SWServerWorker&);

    WEBCORE_EXPORT RefPtr<SWServerWorker> workerByID(ServiceWorkerIdentifier) const;
    WEBCORE_EXPORT std::optional<ServiceWorkerClientData> serviceWorkerClientWithOriginByID(const ClientOrigin&, const ScriptExecutionContextIdentifier&) const;
    WEBCORE_EXPORT std::optional<ServiceWorkerClientData> topLevelServiceWorkerClientFromPageIdentifier(const ClientOrigin&, PageIdentifier) const;
    String serviceWorkerClientUserAgent(const ClientOrigin&) const;
    WEBCORE_EXPORT SWServerWorker* activeWorkerFromRegistrationID(ServiceWorkerRegistrationIdentifier);

    WEBCORE_EXPORT void markAllWorkersForRegistrableDomainAsTerminated(const RegistrableDomain&);

    WEBCORE_EXPORT void addConnection(Ref<Connection>&&);
    WEBCORE_EXPORT void removeConnection(SWServerConnectionIdentifier);
    Connection* connection(SWServerConnectionIdentifier identifier) const { return m_connections.get(identifier); }

    const HashMap<SWServerConnectionIdentifier, Ref<Connection>>& connections() const { return m_connections; }
    WEBCORE_EXPORT bool canHandleScheme(StringView) const;

    SWOriginStore& originStore() { return m_originStore; }

    void refreshImportedScriptsFinished(const ServiceWorkerJobDataIdentifier&, const ServiceWorkerRegistrationKey&, const Vector<std::pair<URL, ScriptBuffer>>&, const std::optional<ProcessIdentifier>&);
    void scriptContextFailedToStart(const std::optional<ServiceWorkerJobDataIdentifier>&, SWServerWorker&, const String& message);
    void scriptContextStarted(const std::optional<ServiceWorkerJobDataIdentifier>&, SWServerWorker&);
    void didFinishInstall(const std::optional<ServiceWorkerJobDataIdentifier>&, SWServerWorker&, bool wasSuccessful);
    void didFinishActivation(SWServerWorker&);
    void workerContextTerminated(SWServerWorker&);
    void matchAll(SWServerWorker&, const ServiceWorkerClientQueryOptions&, ServiceWorkerClientsMatchAllCallback&&);
    std::optional<ExceptionData> claim(SWServerWorker&);
    WEBCORE_EXPORT void terminateContextConnectionWhenPossible(const RegistrableDomain&, ProcessIdentifier);

    enum class IsBeingCreatedClient : bool { No, Yes };
    WEBCORE_EXPORT void registerServiceWorkerClient(ClientOrigin&&, ServiceWorkerClientData&&, const std::optional<ServiceWorkerRegistrationIdentifier>&, String&& userAgent, IsBeingCreatedClient);
    WEBCORE_EXPORT void unregisterServiceWorkerClient(const ClientOrigin&, ScriptExecutionContextIdentifier);

    using RunServiceWorkerCallback = Function<void(SWServerToContextConnection*)>;
    WEBCORE_EXPORT void runServiceWorkerIfNecessary(ServiceWorkerIdentifier, RunServiceWorkerCallback&&);

    void resolveRegistrationReadyRequests(SWServerRegistration&);

    void addRegistrationFromStore(ServiceWorkerContextData&&, CompletionHandler<void()>&&);
    WEBCORE_EXPORT void didSaveWorkerScriptsToDisk(ServiceWorkerIdentifier, ScriptBuffer&& mainScript, MemoryCompactRobinHoodHashMap<URL, ScriptBuffer>&& importedScripts);
    void registrationStoreImportComplete();
    void registrationStoreDatabaseFailedToOpen();
    void storeRegistrationForWorker(SWServerWorker&);

    WEBCORE_EXPORT void getOriginsWithRegistrations(Function<void(const HashSet<SecurityOriginData>&)>&&);

    PAL::SessionID sessionID() const { return m_sessionID; }
    WEBCORE_EXPORT bool needsContextConnectionForRegistrableDomain(const RegistrableDomain&) const;

    void removeFromScopeToRegistrationMap(const ServiceWorkerRegistrationKey&);

    WEBCORE_EXPORT void addContextConnection(SWServerToContextConnection&);
    WEBCORE_EXPORT void removeContextConnection(SWServerToContextConnection&);
    WEBCORE_EXPORT void terminateIdleServiceWorkers(SWServerToContextConnection&);
    WEBCORE_EXPORT bool areServiceWorkersIdle(const SWServerToContextConnection&);

    WEBCORE_EXPORT SWServerToContextConnection* contextConnectionForRegistrableDomain(const RegistrableDomain&);
    WEBCORE_EXPORT void createContextConnection(const Site&, std::optional<ScriptExecutionContextIdentifier> serviceWorkerPageIdentifier);

    bool isImportCompleted() const { return m_importCompleted; }
    WEBCORE_EXPORT void whenImportIsCompleted(CompletionHandler<void()>&&);

    void softUpdate(SWServerRegistration&);

    WEBCORE_EXPORT void handleLowMemoryWarning();

    static constexpr Seconds defaultTerminationDelay = 10_s;
    static constexpr Seconds defaultFunctionalEventDuration = 2_s;

    LastNavigationWasAppInitiated clientIsAppInitiatedForRegistrableDomain(const RegistrableDomain&);
    bool shouldRunServiceWorkersOnMainThreadForTesting() const { return m_shouldRunServiceWorkersOnMainThreadForTesting; }

    WEBCORE_EXPORT void processPushMessage(std::optional<Vector<uint8_t>>&&, std::optional<NotificationPayload>&&, URL&&, CompletionHandler<void(bool, std::optional<NotificationPayload>&&)>&&);
    WEBCORE_EXPORT void processNotificationEvent(NotificationData&&, NotificationEventType, CompletionHandler<void(bool)>&&);

    enum class ShouldSkipEvent : bool { No, Yes };
    void fireFunctionalEvent(SWServerRegistration&, CompletionHandler<void(Expected<SWServerToContextConnection*, ShouldSkipEvent>)>&&);
    void fireBackgroundFetchEvent(SWServerRegistration&, BackgroundFetchInformation&&, CompletionHandler<void()>&&);
    void fireBackgroundFetchClickEvent(SWServerRegistration&, BackgroundFetchInformation&&);

    ScriptExecutionContextIdentifier clientIdFromVisibleClientId(const String& visibleIdentifier) const { return m_visibleClientIdToInternalClientIdMap.get(visibleIdentifier); }

    void forEachServiceWorker(const Function<bool(const SWServerWorker&)>&) const;
    bool hasClientsWithOrigin(const ClientOrigin& origin) { return m_clientIdentifiersPerOrigin.contains(origin); }

    enum class ShouldDelayRemoval : bool { No, Yes };
    ShouldDelayRemoval removeContextConnectionIfPossible(const RegistrableDomain&);

    std::optional<ServiceWorkerRegistrationIdentifier> clientIdentifierToControllingRegistration(ScriptExecutionContextIdentifier) const;
    WEBCORE_EXPORT void forEachClientForOrigin(const ClientOrigin&, const Function<void(ServiceWorkerClientData&)>&);
    void forEachClientForOrigin(const ClientOrigin&, const Function<void(const ServiceWorkerClientData&)>&) const;

    struct GatheredClientData {
        ClientOrigin clientOrigin;
        ServiceWorkerClientData serviceWorkerClientData;
        std::optional<ServiceWorkerRegistrationIdentifier> controllingServiceWorkerRegistrationIdentifier;
        String userAgent;
    };
    WEBCORE_EXPORT std::optional<GatheredClientData> gatherClientData(const ClientOrigin&, ScriptExecutionContextIdentifier);
    WEBCORE_EXPORT void getAllOrigins(CompletionHandler<void(HashSet<ClientOrigin>&&)>&&);

    void requestBackgroundFetchPermission(const ClientOrigin& clientOrigin, CompletionHandler<void(bool)>&& callback) { m_delegate->requestBackgroundFetchPermission(clientOrigin, WTFMove(callback)); }
    RefPtr<BackgroundFetchRecordLoader> createBackgroundFetchRecordLoader(BackgroundFetchRecordLoaderClient& client, const BackgroundFetchRequest& request, size_t responseDataSize, const WebCore::ClientOrigin& origin) { return m_delegate->createBackgroundFetchRecordLoader(client, request, responseDataSize, origin); }
    Ref<BackgroundFetchStore> createBackgroundFetchStore() { return m_delegate->createBackgroundFetchStore(); }
    WEBCORE_EXPORT BackgroundFetchEngine& backgroundFetchEngine();

    WEBCORE_EXPORT Vector<ServiceWorkerClientPendingMessage> releaseServiceWorkerClientPendingMessage(ScriptExecutionContextIdentifier);

    WEBCORE_EXPORT void postMessageToServiceWorkerClient(ScriptExecutionContextIdentifier, const MessageWithMessagePorts&, ServiceWorkerIdentifier, const String&, const Function<void(ScriptExecutionContextIdentifier, const MessageWithMessagePorts&, const ServiceWorkerData&, const String&)>&);

    WEBCORE_EXPORT OptionSet<AdvancedPrivacyProtections> advancedPrivacyProtectionsFromClient(const ClientOrigin&) const;

    bool isProcessTerminationDelayEnabled() const { return m_isProcessTerminationDelayEnabled; }

    unsigned runningOrTerminatingCount() const { return m_runningOrTerminatingWorkers.size(); }

private:
    SWServer(SWServerDelegate&, UniqueRef<SWOriginStore>&&, bool processTerminationDelayEnabled, String&& registrationDatabaseDirectory, PAL::SessionID, bool shouldRunServiceWorkersOnMainThreadForTesting, bool hasServiceWorkerEntitlement, std::optional<unsigned> overrideServiceWorkerRegistrationCountTestingValue, ServiceWorkerIsInspectable);

    unsigned maxRegistrationCount();
    bool allowLoopbackIPAddress(const String&);
    void validateRegistrationDomain(RegistrableDomain, ServiceWorkerJobType, bool, CompletionHandler<void(bool)>&&);

    void scriptFetchFinished(const ServiceWorkerJobDataIdentifier&, const ServiceWorkerRegistrationKey&, const std::optional<ProcessIdentifier>&, WorkerFetchResult&&);

    void didResolveRegistrationPromise(Connection*, const ServiceWorkerRegistrationKey&);

    void addClientServiceWorkerRegistration(Connection&, ServiceWorkerRegistrationIdentifier);
    void removeClientServiceWorkerRegistration(Connection&, ServiceWorkerRegistrationIdentifier);

    void terminatePreinstallationWorker(SWServerWorker&);

    void clearInternal(Function<bool(const ServiceWorkerRegistrationKey&)>&& matches, CompletionHandler<void()>&&);

    WEBCORE_EXPORT RefPtr<SWServerRegistration> doRegistrationMatching(const SecurityOriginData& topOrigin, const URL& clientURL);
    void runServiceWorkerIfNecessary(SWServerWorker&, RunServiceWorkerCallback&&);
    bool runServiceWorker(ServiceWorkerIdentifier);
    bool runServiceWorker(SWServerWorker&);

    void tryInstallContextData(const std::optional<ProcessIdentifier>&, ServiceWorkerContextData&&);
    void installContextData(const ServiceWorkerContextData&);

    SWServerRegistration* registrationFromServiceWorkerIdentifier(ServiceWorkerIdentifier);

    void performGetOriginsWithRegistrationsCallbacks();

    void contextConnectionCreated(SWServerToContextConnection&);

    void updateAppInitiatedValueForWorkers(const ClientOrigin&, LastNavigationWasAppInitiated);
    void whenImportIsCompletedIfNeeded(CompletionHandler<void()>&&);

    ResourceRequest createScriptRequest(const URL&, const ServiceWorkerJobData&, SWServerRegistration&);

    WeakPtr<SWServerDelegate> m_delegate;

    HashMap<SWServerConnectionIdentifier, Ref<Connection>> m_connections;
    HashMap<ServiceWorkerRegistrationKey, WeakRef<SWServerRegistration>> m_scopeToRegistrationMap;
    HashMap<ServiceWorkerRegistrationIdentifier, Ref<SWServerRegistration>> m_registrations;
    HashMap<ServiceWorkerRegistrationKey, std::unique_ptr<SWServerJobQueue>> m_jobQueues;

    HashMap<ServiceWorkerIdentifier, Ref<SWServerWorker>> m_runningOrTerminatingWorkers;

    HashMap<RegistrableDomain, HashSet<ScriptExecutionContextIdentifier>> m_clientsByRegistrableDomain;
    struct Clients {
        Vector<ScriptExecutionContextIdentifier> identifiers;
        std::unique_ptr<Timer> terminateServiceWorkersTimer;
        String userAgent;
    };

    HashMap<ClientOrigin, Clients> m_clientIdentifiersPerOrigin;
    HashMap<ScriptExecutionContextIdentifier, WeakRef<SWServerRegistration>> m_serviceWorkerPageIdentifierToRegistrationMap;
    HashMap<ScriptExecutionContextIdentifier, UniqueRef<ServiceWorkerClientData>> m_clientsById;
    HashMap<ScriptExecutionContextIdentifier, Vector<ServiceWorkerClientPendingMessage>> m_clientsToBeCreatedById;
    HashMap<ScriptExecutionContextIdentifier, ServiceWorkerRegistrationIdentifier> m_clientToControllingRegistration;
    MemoryCompactRobinHoodHashMap<String, ScriptExecutionContextIdentifier> m_visibleClientIdToInternalClientIdMap;

    UniqueRef<SWOriginStore> m_originStore;
    RefPtr<SWRegistrationStore> m_registrationStore;
    HashMap<RegistrableDomain, Vector<ServiceWorkerContextData>> m_pendingContextDatas;
    HashMap<RegistrableDomain, HashMap<ServiceWorkerIdentifier, Vector<RunServiceWorkerCallback>>> m_serviceWorkerRunRequests;
    PAL::SessionID m_sessionID;
    bool m_importCompleted { false };
    bool m_isProcessTerminationDelayEnabled { true };
    Vector<CompletionHandler<void()>> m_clearCompletionCallbacks;
    Vector<Function<void(const HashSet<SecurityOriginData>&)>> m_getOriginsWithRegistrationsCallbacks;
    HashMap<RegistrableDomain, WeakRef<SWServerToContextConnection>> m_contextConnections;

    HashSet<RegistrableDomain> m_pendingConnectionDomains;
    Vector<CompletionHandler<void()>> m_importCompletedCallbacks;

    HashSet<RegistrableDomain> m_appBoundDomains;
    bool m_shouldRunServiceWorkersOnMainThreadForTesting { false };
    bool m_hasServiceWorkerEntitlement { false };
    bool m_hasReceivedAppBoundDomains { false };
    unsigned m_uniqueRegistrationCount { 0 };
    std::optional<unsigned> m_overrideServiceWorkerRegistrationCountTestingValue;
    uint64_t m_focusOrder { 0 };
    ServiceWorkerIsInspectable m_isInspectable { ServiceWorkerIsInspectable::Yes };

    RefPtr<BackgroundFetchEngine> m_backgroundFetchEngine;
};

} // namespace WebCore
