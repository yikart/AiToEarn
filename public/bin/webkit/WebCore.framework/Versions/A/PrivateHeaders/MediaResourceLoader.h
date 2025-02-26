/*
 * Copyright (C) 2014 Igalia S.L
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

#if ENABLE(VIDEO)

#include "CachedRawResourceClient.h"
#include "CachedResourceHandle.h"
#include "ContextDestructionObserver.h"
#include "FetchOptions.h"
#include "PlatformMediaResourceLoader.h"
#include "ResourceResponse.h"
#include <wtf/Atomics.h>
#include <wtf/HashSet.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CachedRawResource;
class Document;
class Element;
class MediaResource;
class WeakPtrImplWithEventTargetData;

class MediaResourceLoader final : public PlatformMediaResourceLoader, public CanMakeWeakPtr<MediaResourceLoader>, public ContextDestructionObserver {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(MediaResourceLoader, WEBCORE_EXPORT);
public:
    static Ref<MediaResourceLoader> create(Document& document, Element& element, const String& crossOriginMode, FetchOptions::Destination destination) { return adoptRef(*new MediaResourceLoader(document, element, crossOriginMode, destination)); }
    WEBCORE_EXPORT virtual ~MediaResourceLoader();

    RefPtr<PlatformMediaResource> requestResource(ResourceRequest&&, LoadOptions) final;
    void sendH2Ping(const URL&, CompletionHandler<void(Expected<Seconds, ResourceError>&&)>&&) final;
    void removeResource(MediaResource&);

    Document* document();
    RefPtr<Document> protectedDocument();
    const String& crossOriginMode() const;

    WEBCORE_EXPORT static void recordResponsesForTesting();
    WEBCORE_EXPORT Vector<ResourceResponse> responsesForTesting() const;
    void addResponseForTesting(const ResourceResponse&);

    bool verifyMediaResponse(const URL& requestURL, const ResourceResponse&, const SecurityOrigin*);

private:
    WEBCORE_EXPORT MediaResourceLoader(Document&, Element&, const String& crossOriginMode, FetchOptions::Destination);

    void contextDestroyed() final;

    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document WTF_GUARDED_BY_CAPABILITY(mainThread);
    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_element WTF_GUARDED_BY_CAPABILITY(mainThread);
    String m_crossOriginMode WTF_GUARDED_BY_CAPABILITY(mainThread);
    SingleThreadWeakHashSet<MediaResource> m_resources WTF_GUARDED_BY_CAPABILITY(mainThread);
    Vector<ResourceResponse> m_responsesForTesting WTF_GUARDED_BY_CAPABILITY(mainThread);
    FetchOptions::Destination m_destination WTF_GUARDED_BY_CAPABILITY(mainThread);

    struct ValidationInformation {
        RefPtr<const SecurityOrigin> origin;
        bool usedOpaqueResponse { false };
        bool usedServiceWorker { false };
    };
    HashMap<URL, ValidationInformation> m_validationLoadInformations WTF_GUARDED_BY_CAPABILITY(mainThread);
};

class MediaResource : public PlatformMediaResource, public CachedRawResourceClient {
    WTF_MAKE_TZONE_ALLOCATED(MediaResource);
public:
    static Ref<MediaResource> create(MediaResourceLoader&, CachedResourceHandle<CachedRawResource>&&);
    virtual ~MediaResource();

    // PlatformMediaResource
    void shutdown() override;
    bool didPassAccessControlCheck() const override { return m_didPassAccessControlCheck.load(); }

    // CachedRawResourceClient
    void responseReceived(CachedResource&, const ResourceResponse&, CompletionHandler<void()>&&) override;
    void redirectReceived(CachedResource&, ResourceRequest&&, const ResourceResponse&, CompletionHandler<void(ResourceRequest&&)>&&) override;
    bool shouldCacheResponse(CachedResource&, const ResourceResponse&) override;
    void dataSent(CachedResource&, unsigned long long, unsigned long long) override;
    void dataReceived(CachedResource&, const SharedBuffer&) override;
    void notifyFinished(CachedResource&, const NetworkLoadMetrics&, LoadWillContinueInAnotherProcess) override;

private:
    Ref<MediaResourceLoader> protectedLoader() const;
    CachedResourceHandle<CachedRawResource> protectedResource() const;

    MediaResource(MediaResourceLoader&, CachedResourceHandle<CachedRawResource>&&);
    void ensureShutdown();
    const Ref<MediaResourceLoader> m_loader;
    Atomic<bool> m_didPassAccessControlCheck { false };
    CachedResourceHandle<CachedRawResource> m_resource;
};

} // namespace WebCore

#endif // ENABLE(VIDEO)
