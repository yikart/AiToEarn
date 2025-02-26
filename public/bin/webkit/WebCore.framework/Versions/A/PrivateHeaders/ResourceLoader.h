/*
 * Copyright (C) 2005-2017 Apple Inc. All rights reserved.
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

#include "CachedResourceHandle.h"
#include "FrameLoaderTypes.h"
#include "ResourceHandleClient.h"
#include "ResourceLoadTiming.h"
#include "ResourceLoaderIdentifier.h"
#include "ResourceLoaderOptions.h"
#include "ResourceLoaderTypes.h"
#include "ResourceRequest.h"
#include "ResourceResponse.h"
#include "SharedBuffer.h"
#include <wtf/Forward.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/WeakPtr.h>

#if ENABLE(CONTENT_EXTENSIONS)
#include "ResourceLoadInfo.h"
#endif

namespace WTF {
class SchedulePair;
}

namespace WebCore {

class AuthenticationChallenge;
class CachedResource;
class DocumentLoader;
class FrameLoader;
class LegacyPreviewLoader;
class LocalFrame;
class NetworkLoadMetrics;

#if ENABLE(CONTENT_EXTENSIONS)
class ResourceMonitor;
#endif

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(ResourceLoader);
class ResourceLoader : public RefCountedAndCanMakeWeakPtr<ResourceLoader>, protected ResourceHandleClient {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(ResourceLoader);
public:
    virtual ~ResourceLoader() = 0;

    WEBCORE_EXPORT void cancel();

    virtual void init(ResourceRequest&&, CompletionHandler<void(bool)>&&);

    void deliverResponseAndData(const ResourceResponse&, RefPtr<FragmentedSharedBuffer>&&);

#if PLATFORM(IOS_FAMILY)
    virtual void startLoading()
    {
        start();
    }

    virtual const ResourceRequest& iOSOriginalRequest() const { return request(); }
#endif

    WEBCORE_EXPORT FrameLoader* frameLoader() const;
    WEBCORE_EXPORT RefPtr<FrameLoader> protectedFrameLoader() const;
    DocumentLoader* documentLoader() const { return m_documentLoader.get(); }
    WEBCORE_EXPORT RefPtr<DocumentLoader> protectedDocumentLoader() const;
    const ResourceRequest& originalRequest() const { return m_originalRequest; }

    WEBCORE_EXPORT void start();
    WEBCORE_EXPORT void cancel(const ResourceError&, LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No);
    WEBCORE_EXPORT ResourceError cancelledError();
    WEBCORE_EXPORT ResourceError blockedError();
    ResourceError blockedByContentBlockerError();
    ResourceError cannotShowURLError();
    ResourceError httpsUpgradeRedirectLoopError();
    
    virtual void setDefersLoading(bool);
    bool defersLoading() const { return m_defersLoading; }

    std::optional<ResourceLoaderIdentifier> identifier() const { return m_identifier; }

    bool wasAuthenticationChallengeBlocked() const { return m_wasAuthenticationChallengeBlocked; }

    virtual void releaseResources();
    const ResourceResponse& response() const { return m_response; }

    const FragmentedSharedBuffer* resourceData() const;
    RefPtr<const FragmentedSharedBuffer> protectedResourceData() const;
    void clearResourceData();
    
    virtual bool isSubresourceLoader() const;

    virtual void willSendRequest(ResourceRequest&&, const ResourceResponse& redirectResponse, CompletionHandler<void(ResourceRequest&&)>&& callback);
    virtual void didSendData(unsigned long long bytesSent, unsigned long long totalBytesToBeSent);
    virtual void didReceiveResponse(const ResourceResponse&, CompletionHandler<void()>&& policyCompletionHandler);
    virtual void didReceiveData(const SharedBuffer&, long long encodedDataLength, DataPayloadType);
    virtual void didReceiveBuffer(const FragmentedSharedBuffer&, long long encodedDataLength, DataPayloadType);
    virtual void didFinishLoading(const NetworkLoadMetrics&);
    virtual void didFail(const ResourceError&);

    WEBCORE_EXPORT void didBlockAuthenticationChallenge();

    virtual bool shouldUseCredentialStorage();
#if USE(PROTECTION_SPACE_AUTH_CALLBACK)
    virtual bool canAuthenticateAgainstProtectionSpace(const ProtectionSpace&);
#endif
    virtual void receivedCancellation(const AuthenticationChallenge&);

#if USE(QUICK_LOOK)
    bool isQuickLookResource() const;
    virtual void didReceivePreviewResponse(const ResourceResponse&) { };
#endif

    const URL& url() const { return m_request.url(); }
    ResourceHandle* handle() const { return m_handle.get(); }
    bool shouldSendResourceLoadCallbacks() const { return m_options.sendLoadCallbacks == SendCallbackPolicy::SendCallbacks; }
    void setSendCallbackPolicy(SendCallbackPolicy sendLoadCallbacks) { m_options.sendLoadCallbacks = sendLoadCallbacks; }
    bool shouldSniffContent() const { return m_options.sniffContent == ContentSniffingPolicy::SniffContent; }
    ContentEncodingSniffingPolicy contentEncodingSniffingPolicy() const { return m_options.contentEncodingSniffingPolicy; }
    WEBCORE_EXPORT bool isAllowedToAskUserForCredentials() const;
    WEBCORE_EXPORT bool shouldIncludeCertificateInfo() const;
    
    virtual CachedResource* cachedResource() const { return nullptr; }
    CachedResourceHandle<CachedResource> protectedCachedResource() const { return cachedResource(); }

    bool reachedTerminalState() const { return m_reachedTerminalState; }

    const ResourceRequest& request() const { return m_request; }
    void setRequest(ResourceRequest&& request) { m_request = WTFMove(request); }

    void setDataBufferingPolicy(DataBufferingPolicy);

    void willSwitchToSubstituteResource();

    const ResourceLoadTiming& loadTiming() { return m_loadTiming; }

#if PLATFORM(COCOA)
    void schedule(WTF::SchedulePair&);
    void unschedule(WTF::SchedulePair&);
#endif

    LocalFrame* frame() const { return m_frame.get(); }
    RefPtr<LocalFrame> protectedFrame() const;

    const ResourceLoaderOptions& options() const { return m_options; }

    const ResourceRequest& deferredRequest() const { return m_deferredRequest; }
    ResourceRequest takeDeferredRequest() { return std::exchange(m_deferredRequest, { }); }

    bool isPDFJSResourceLoad() const;

protected:
    ResourceLoader(LocalFrame&, ResourceLoaderOptions);

    void didFinishLoadingOnePart(const NetworkLoadMetrics&);
    void cleanupForError(const ResourceError&);

    bool wasCancelled() const { return m_cancellationStatus >= Cancelled; }

    void setReferrerPolicy(ReferrerPolicy referrerPolicy) { m_options.referrerPolicy = referrerPolicy; }
    ReferrerPolicy referrerPolicy() const { return m_options.referrerPolicy; }

#if PLATFORM(COCOA)
    void willCacheResponseAsync(ResourceHandle*, NSCachedURLResponse*, CompletionHandler<void(NSCachedURLResponse *)>&&) override;
#endif

    virtual void willSendRequestInternal(ResourceRequest&&, const ResourceResponse& redirectResponse, CompletionHandler<void(ResourceRequest&&)>&&);

    RefPtr<ResourceHandle> m_handle;
    RefPtr<LocalFrame> m_frame;
    RefPtr<DocumentLoader> m_documentLoader;
    ResourceResponse m_response;
    ResourceLoadTiming m_loadTiming;
#if USE(QUICK_LOOK)
    std::unique_ptr<LegacyPreviewLoader> m_previewLoader;
#endif
    bool m_canCrossOriginRequestsAskUserForCredentials { true };

private:
    virtual void willCancel(const ResourceError&) = 0;
    virtual void didCancel(LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No) = 0;

    void addBuffer(const FragmentedSharedBuffer&, DataPayloadType);
    void loadDataURL();
    void finishNetworkLoad();

    bool shouldAllowResourceToAskForCredentials() const;

    // ResourceHandleClient
    void didSendData(ResourceHandle*, unsigned long long bytesSent, unsigned long long totalBytesToBeSent) override;
    void didReceiveResponseAsync(ResourceHandle*, ResourceResponse&&, CompletionHandler<void()>&&) override;
    void willSendRequestAsync(ResourceHandle*, ResourceRequest&&, ResourceResponse&&, CompletionHandler<void(ResourceRequest&&)>&&) override;
    void didReceiveData(ResourceHandle*, const SharedBuffer&, int encodedDataLength) override;
    void didReceiveBuffer(ResourceHandle*, const FragmentedSharedBuffer&, int encodedDataLength) override;
    void didFinishLoading(ResourceHandle*, const NetworkLoadMetrics&) override;
    void didFail(ResourceHandle*, const ResourceError&) override;
    void wasBlocked(ResourceHandle*) override;
    void cannotShowURL(ResourceHandle*) override;
    bool shouldUseCredentialStorage(ResourceHandle*) override { return shouldUseCredentialStorage(); }
    void didReceiveAuthenticationChallenge(ResourceHandle*, const AuthenticationChallenge&) override;
#if USE(PROTECTION_SPACE_AUTH_CALLBACK)
    void canAuthenticateAgainstProtectionSpaceAsync(ResourceHandle*, const ProtectionSpace&, CompletionHandler<void(bool)>&&) override;
#endif
    void receivedCancellation(ResourceHandle*, const AuthenticationChallenge& challenge) override { receivedCancellation(challenge); }
#if PLATFORM(IOS_FAMILY)
    RetainPtr<CFDictionaryRef> connectionProperties(ResourceHandle*) override;
#endif

#if ENABLE(CONTENT_EXTENSIONS)
    ResourceMonitor* resourceMonitorIfExists();
#endif

#if USE(SOUP)
    void loadGResource();
#endif

    ResourceRequest m_request;
    ResourceRequest m_originalRequest; // Before redirects.
    SharedBufferBuilder m_resourceData;
    
    Markable<ResourceLoaderIdentifier> m_identifier;

    bool m_reachedTerminalState { false };
    bool m_notifiedLoadComplete { false };

    enum CancellationStatus {
        NotCancelled,
        CalledWillCancel,
        Cancelled,
        FinishedCancel
    };
    CancellationStatus m_cancellationStatus { NotCancelled };

    bool m_defersLoading;
    bool m_wasAuthenticationChallengeBlocked { false };
    ResourceRequest m_deferredRequest;
    ResourceLoaderOptions m_options;

#if ENABLE(CONTENT_EXTENSIONS)
protected:
    OptionSet<ContentExtensions::ResourceType> m_resourceType;
#endif
};

} // namespace WebCore
