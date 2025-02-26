/*
 * Copyright (C) 2005-2020 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ResourceLoader.h"
#include <wtf/Function.h>
#include <wtf/Forward.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class NetscapePlugInStreamLoaderClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::NetscapePlugInStreamLoaderClient> : std::true_type { };
}

namespace WebCore {

class NetscapePlugInStreamLoader;
class SharedBuffer;

class NetscapePlugInStreamLoaderClient : public CanMakeWeakPtr<NetscapePlugInStreamLoaderClient> {
public:
    virtual void willSendRequest(NetscapePlugInStreamLoader*, ResourceRequest&&, const ResourceResponse& redirectResponse, CompletionHandler<void(ResourceRequest&&)>&&) = 0;
    virtual void didReceiveResponse(NetscapePlugInStreamLoader*, const ResourceResponse&) = 0;
    virtual void didReceiveData(NetscapePlugInStreamLoader*, const SharedBuffer&) = 0;
    virtual void didFail(NetscapePlugInStreamLoader*, const ResourceError&) = 0;
    virtual void didFinishLoading(NetscapePlugInStreamLoader*) { }
    virtual bool wantsAllStreams() const { return false; }

protected:
    virtual ~NetscapePlugInStreamLoaderClient() = default;
};

class NetscapePlugInStreamLoader final : public ResourceLoader {
public:
    WEBCORE_EXPORT static void create(LocalFrame&, NetscapePlugInStreamLoaderClient&, ResourceRequest&&, CompletionHandler<void(RefPtr<NetscapePlugInStreamLoader>&&)>&&);
    virtual ~NetscapePlugInStreamLoader();

    WEBCORE_EXPORT bool isDone() const;

private:
    void init(ResourceRequest&&, CompletionHandler<void(bool)>&&) override;

    void willSendRequest(ResourceRequest&&, const ResourceResponse& redirectResponse, CompletionHandler<void(ResourceRequest&&)>&& callback) override;
    void didReceiveResponse(const ResourceResponse&, CompletionHandler<void()>&& policyCompletionHandler) override;
    void didReceiveData(const SharedBuffer&, long long encodedDataLength, DataPayloadType) override;
    void didFinishLoading(const NetworkLoadMetrics&) override;
    void didFail(const ResourceError&) override;

    void releaseResources() override;

    NetscapePlugInStreamLoader(LocalFrame&, NetscapePlugInStreamLoaderClient&);

    void willCancel(const ResourceError&) override;
    void didCancel(LoadWillContinueInAnotherProcess) override;

    void notifyDone();

    WeakPtr<NetscapePlugInStreamLoaderClient> m_client;
    bool m_isInitialized { false };
};

}
