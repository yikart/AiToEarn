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

#include "MessagePortIdentifier.h"
#include "ResourceLoaderIdentifier.h"
#include "ResourceResponse.h"
#include "ScriptExecutionContextIdentifier.h"
#include "WorkerOptions.h"
#include "WorkerScriptLoaderClient.h"
#include <wtf/CompletionHandler.h>
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

struct ServiceWorkerRegistrationData;
class SharedWorker;
class WorkerScriptLoader;
struct WorkerFetchResult;
struct WorkerInitializationData;

class SharedWorkerScriptLoader : private WorkerScriptLoaderClient {
    WTF_MAKE_TZONE_ALLOCATED(SharedWorkerScriptLoader);
public:
    SharedWorkerScriptLoader(URL&&, SharedWorker&, WorkerOptions&&);

    void load(CompletionHandler<void(WorkerFetchResult&&, WorkerInitializationData&&)>&&);

    const URL& url() const { return m_url; }
    SharedWorker& worker() { return m_worker.get(); }
    const WorkerOptions& options() const { return m_options; }

private:
    void didReceiveResponse(ScriptExecutionContextIdentifier, std::optional<ResourceLoaderIdentifier>, const ResourceResponse&) final;
    void notifyFinished(std::optional<ScriptExecutionContextIdentifier>) final;

    const WorkerOptions m_options;
    const Ref<SharedWorker> m_worker;
    const Ref<WorkerScriptLoader> m_loader;
    const URL m_url;
    CompletionHandler<void(WorkerFetchResult&&, WorkerInitializationData&&)> m_completionHandler;
};

} // namespace WebCore
