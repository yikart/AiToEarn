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

#include "SharedWorkerObjectIdentifier.h"
#include "TransferredMessagePort.h"
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/RefCounted.h>

namespace WebCore {

class MessagePort;
class ResourceError;
class SharedWorkerScriptLoader;

struct SharedWorkerKey;
struct WorkerFetchResult;
struct WorkerInitializationData;
struct WorkerOptions;

class SharedWorkerObjectConnection : public RefCounted<SharedWorkerObjectConnection> {
public:
    WEBCORE_EXPORT virtual ~SharedWorkerObjectConnection();

    virtual void requestSharedWorker(const SharedWorkerKey&, SharedWorkerObjectIdentifier, TransferredMessagePort&&, const WorkerOptions&) = 0;
    virtual void sharedWorkerObjectIsGoingAway(const SharedWorkerKey&, SharedWorkerObjectIdentifier) = 0;
    virtual void suspendForBackForwardCache(const SharedWorkerKey&, SharedWorkerObjectIdentifier) = 0;
    virtual void resumeForBackForwardCache(const SharedWorkerKey&, SharedWorkerObjectIdentifier) = 0;

protected:
    // IPC messages.
    WEBCORE_EXPORT void fetchScriptInClient(URL&&, WebCore::SharedWorkerObjectIdentifier, WorkerOptions&&, CompletionHandler<void(WorkerFetchResult&&, WorkerInitializationData&&)>&&);
    WEBCORE_EXPORT void notifyWorkerObjectOfLoadCompletion(WebCore::SharedWorkerObjectIdentifier, const ResourceError&);
    WEBCORE_EXPORT void postErrorToWorkerObject(SharedWorkerObjectIdentifier, const String& errorMessage, int lineNumber, int columnNumber, const String& sourceURL, bool isErrorEvent);

    WEBCORE_EXPORT SharedWorkerObjectConnection();

private:
    HashMap<uint64_t, UniqueRef<SharedWorkerScriptLoader>> m_loaders;
};

} // namespace WebCore
