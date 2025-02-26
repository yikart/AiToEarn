/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "SharedWorkerIdentifier.h"
#include "TransferredMessagePort.h"
#include <wtf/AbstractRefCounted.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class ScriptExecutionContext;
class SharedWorkerThreadProxy;

class SharedWorkerContextManager {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SharedWorkerContextManager, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT static SharedWorkerContextManager& singleton();

    SharedWorkerThreadProxy* sharedWorker(SharedWorkerIdentifier) const;
    void stopSharedWorker(SharedWorkerIdentifier);
    void suspendSharedWorker(SharedWorkerIdentifier);
    void resumeSharedWorker(SharedWorkerIdentifier);
    WEBCORE_EXPORT void stopAllSharedWorkers();

    class Connection : public AbstractRefCounted {
        WTF_MAKE_TZONE_ALLOCATED_EXPORT(Connection, WEBCORE_EXPORT);
    public:
        virtual ~Connection() { }
        virtual void establishConnection(CompletionHandler<void()>&&) = 0;
        virtual void postErrorToWorkerObject(SharedWorkerIdentifier, const String& errorMessage, int lineNumber, int columnNumber, const String& sourceURL, bool isErrrorEvent) = 0;
        virtual void sharedWorkerTerminated(SharedWorkerIdentifier) = 0;
        bool isClosed() const { return m_isClosed; }

    protected:
        void setAsClosed() { m_isClosed = true; }

        // IPC message handlers.
        WEBCORE_EXPORT void postConnectEvent(SharedWorkerIdentifier, TransferredMessagePort&&, String&& sourceOrigin, CompletionHandler<void(bool)>&&);
        WEBCORE_EXPORT void terminateSharedWorker(SharedWorkerIdentifier);
        WEBCORE_EXPORT void suspendSharedWorker(SharedWorkerIdentifier);
        WEBCORE_EXPORT void resumeSharedWorker(SharedWorkerIdentifier);

    private:
        bool m_isClosed { false };
    };

    WEBCORE_EXPORT void setConnection(RefPtr<Connection>&&);
    WEBCORE_EXPORT Connection* connection() const;

    WEBCORE_EXPORT void registerSharedWorkerThread(Ref<SharedWorkerThreadProxy>&&);

    void forEachSharedWorker(const Function<Function<void(ScriptExecutionContext&)>()>&);

private:
    friend class NeverDestroyed<SharedWorkerContextManager>;

    SharedWorkerContextManager() = default;

    RefPtr<Connection> m_connection;
    HashMap<SharedWorkerIdentifier, Ref<SharedWorkerThreadProxy>> m_workerMap;
};

} // namespace WebCore
