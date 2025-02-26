/*
 * Copyright (C) 2021-2022 Apple Inc. All rights reserved.
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

#include "ClientOrigin.h"
#include "SharedWorkerIdentifier.h"
#include "WorkerBadgeProxy.h"
#include "WorkerDebuggerProxy.h"
#include "WorkerLoaderProxy.h"
#include "WorkerObjectProxy.h"
#include "WorkerOptions.h"
#include <wtf/CheckedPtr.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class CacheStorageProvider;
class Page;
class SharedWorker;
class SharedWorkerThread;

struct WorkerFetchResult;
struct WorkerInitializationData;

class SharedWorkerThreadProxy final : public ThreadSafeRefCounted<SharedWorkerThreadProxy>, public WorkerObjectProxy, public WorkerLoaderProxy, public WorkerDebuggerProxy, public WorkerBadgeProxy, public CanMakeWeakPtr<SharedWorkerThreadProxy>, public CanMakeThreadSafeCheckedPtr<SharedWorkerThreadProxy> {
    WTF_MAKE_FAST_ALLOCATED;
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(SharedWorkerThreadProxy);
public:
    template<typename... Args> static Ref<SharedWorkerThreadProxy> create(Args&&... args) { return adoptRef(*new SharedWorkerThreadProxy(std::forward<Args>(args)...)); }
    WEBCORE_EXPORT ~SharedWorkerThreadProxy();

    static SharedWorkerThreadProxy* byIdentifier(ScriptExecutionContextIdentifier);
    WEBCORE_EXPORT static bool hasInstances();

    SharedWorkerIdentifier identifier() const;
    SharedWorkerThread& thread() { return m_workerThread; }

    bool isTerminatingOrTerminated() const { return m_isTerminatingOrTerminated; }
    void setAsTerminatingOrTerminated() { m_isTerminatingOrTerminated = true; }

    uint32_t checkedPtrCount() const { return CanMakeThreadSafeCheckedPtr<SharedWorkerThreadProxy>::checkedPtrCount(); }
    uint32_t checkedPtrCountWithoutThreadCheck() const { return CanMakeThreadSafeCheckedPtr<SharedWorkerThreadProxy>::checkedPtrCountWithoutThreadCheck(); }
    void incrementCheckedPtrCount() const { CanMakeThreadSafeCheckedPtr<SharedWorkerThreadProxy>::incrementCheckedPtrCount(); }
    void decrementCheckedPtrCount() const { CanMakeThreadSafeCheckedPtr<SharedWorkerThreadProxy>::decrementCheckedPtrCount(); }

private:
    WEBCORE_EXPORT SharedWorkerThreadProxy(Ref<Page>&&, SharedWorkerIdentifier, const ClientOrigin&, WorkerFetchResult&&, WorkerOptions&&, WorkerInitializationData&&, CacheStorageProvider&);

    bool postTaskForModeToWorkerOrWorkletGlobalScope(ScriptExecutionContext::Task&&, const String& mode);

    // WorkerObjectProxy.
    void postExceptionToWorkerObject(const String& errorMessage, int lineNumber, int columnNumber, const String& sourceURL) final;
    void reportErrorToWorkerObject(const String&) final;
    void postMessageToWorkerObject(MessageWithMessagePorts&&) final { }
    void workerGlobalScopeDestroyed() final { }
    void workerGlobalScopeClosed() final;

    // WorkerLoaderProxy.
    RefPtr<CacheStorageConnection> createCacheStorageConnection() final;
    RefPtr<RTCDataChannelRemoteHandlerConnection> createRTCDataChannelRemoteHandlerConnection() final;
    void postTaskToLoader(ScriptExecutionContext::Task&&) final;
    ScriptExecutionContextIdentifier loaderContextIdentifier() const final;

    // WorkerDebuggerProxy.
    void postMessageToDebugger(const String&) final;
    void setResourceCachingDisabledByWebInspector(bool) final;

    // WorkerBadgeProxy
    void setAppBadge(std::optional<uint64_t>) final;

    static void networkStateChanged(bool isOnLine);
    void notifyNetworkStateChange(bool isOnline);

    ReportingClient* reportingClient() const final;

    Ref<Page> m_page;
    Ref<Document> m_document;
    ScriptExecutionContextIdentifier m_contextIdentifier;
    Ref<SharedWorkerThread> m_workerThread;
    CacheStorageProvider& m_cacheStorageProvider;
    RefPtr<CacheStorageConnection> m_cacheStorageConnection;
    bool m_isTerminatingOrTerminated { false };
    ClientOrigin m_clientOrigin;
};

} // namespace WebCore
