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

#include "FetchIdentifier.h"
#include "ResourceResponse.h"
#include "ScriptExecutionContextIdentifier.h"
#include "ServiceWorkerTypes.h"
#include <wtf/Ref.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {
class FetchEvent;
struct FetchOptions;
class FetchResponse;
class FormData;
class NetworkLoadMetrics;
class ResourceError;
class ResourceRequest;
class ServiceWorkerGlobalScope;
class ServiceWorkerGlobalScope;
class SharedBuffer;

namespace ServiceWorkerFetch {
class Client : public ThreadSafeRefCounted<Client, WTF::DestructionThread::Main> {
public:
    virtual ~Client() = default;

    virtual void didReceiveRedirection(const ResourceResponse&) = 0;
    virtual void didReceiveResponse(const ResourceResponse&) = 0;
    virtual void didReceiveData(const SharedBuffer&) = 0;
    virtual void didReceiveFormDataAndFinish(Ref<FormData>&&) = 0;
    virtual void didFail(const ResourceError&) = 0;
    virtual void didFinish(const NetworkLoadMetrics&) = 0;
    virtual void didNotHandle() = 0;
    virtual void setCancelledCallback(Function<void()>&&) = 0;
    virtual void usePreload() = 0;
    virtual void contextIsStopping() = 0;

    void cancel();
    bool isCancelled() const { return m_isCancelled; }

private:
    virtual void doCancel() = 0;
    bool m_isCancelled { false };
};

inline void Client::cancel()
{
    ASSERT(!m_isCancelled);
    m_isCancelled = true;
    doCancel();
}

void dispatchFetchEvent(Ref<Client>&&, ServiceWorkerGlobalScope&, ResourceRequest&&, String&& referrer, FetchOptions&&, SWServerConnectionIdentifier, FetchIdentifier, bool isServiceWorkerNavigationPreloadEnabled, String&& clientIdentifier, String&& resultingClientIdentifier);
};

} // namespace WebCore
