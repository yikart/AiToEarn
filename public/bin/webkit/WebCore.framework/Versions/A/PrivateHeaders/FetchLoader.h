/*
 * Copyright (C) 2016 Canon Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted, provided that the following conditions
 * are required to be met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Canon Inc. nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY CANON INC. AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL CANON INC. AND ITS CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ThreadableLoader.h"
#include "ThreadableLoaderClient.h"
#include "URLKeepingBlobAlive.h"
#include <wtf/CheckedPtr.h>
#include <wtf/URL.h>

namespace WebCore {

class Blob;
class FetchBodyConsumer;
class FetchLoaderClient;
class FetchRequest;
class ScriptExecutionContext;
class FragmentedSharedBuffer;

class WEBCORE_EXPORT FetchLoader final : public ThreadableLoaderClient {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(FetchLoader);
public:
    FetchLoader(FetchLoaderClient&, FetchBodyConsumer*);
    ~FetchLoader();

    RefPtr<FragmentedSharedBuffer> startStreaming();

    void start(ScriptExecutionContext&, const FetchRequest&, const String&);
    void start(ScriptExecutionContext&, const Blob&);
    void startLoadingBlobURL(ScriptExecutionContext&, const URL& blobURL);
    void stop();

    bool isStarted() const { return m_isStarted; }

private:
    // ThreadableLoaderClient API.
    void didReceiveResponse(ScriptExecutionContextIdentifier, std::optional<ResourceLoaderIdentifier>, const ResourceResponse&) final;
    void didReceiveData(const SharedBuffer&) final;
    void didFinishLoading(ScriptExecutionContextIdentifier, std::optional<ResourceLoaderIdentifier>, const NetworkLoadMetrics&) final;
    void didFail(std::optional<ScriptExecutionContextIdentifier>, const ResourceError&) final;

private:
    CheckedRef<FetchLoaderClient> m_client;
    RefPtr<ThreadableLoader> m_loader;
    CheckedPtr<FetchBodyConsumer> m_consumer;
    bool m_isStarted { false };
    URLKeepingBlobAlive m_urlForReading;
};

} // namespace WebCore
