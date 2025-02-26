/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

#pragma once

#include "CachedResource.h"
#include "CachedResourceClient.h"
#include "CachedResourceHandle.h"
#include "LinkLoaderClient.h"
#include "LinkRelAttribute.h"
#include "ReferrerPolicy.h"

namespace WebCore {
class LinkLoader;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::LinkLoader> : std::true_type { };
}

namespace WebCore {

class Document;
class LinkPreloadResourceClient;

struct LinkLoadParameters {
    LinkRelAttribute relAttribute;
    URL href;
    String as;
    String media;
    String mimeType;
    String crossOrigin;
    String imageSrcSet;
    String imageSizes;
    String nonce;
    ReferrerPolicy referrerPolicy { ReferrerPolicy::EmptyString };
    RequestPriority fetchPriorityHint { RequestPriority::Auto };
};

class LinkLoader : public CachedResourceClient {
public:
    explicit LinkLoader(LinkLoaderClient&);
    virtual ~LinkLoader();

    void loadLink(const LinkLoadParameters&, Document&);
    enum class ShouldLog : bool { No, Yes };
    static std::optional<CachedResource::Type> resourceTypeFromAsAttribute(const String&, Document&, ShouldLog = ShouldLog::No);

    enum class MediaAttributeCheck { MediaAttributeEmpty, MediaAttributeNotEmpty, SkipMediaAttributeCheck };
    static void loadLinksFromHeader(const String& headerValue, const URL& baseURL, Document&, MediaAttributeCheck);
    static bool isSupportedType(CachedResource::Type, const String& mimeType, Document&);

    void triggerEvents(const CachedResource&);
    void triggerError();
    void cancelLoad();

private:
    void notifyFinished(CachedResource&, const NetworkLoadMetrics&, LoadWillContinueInAnotherProcess) override;
    static void preconnectIfNeeded(const LinkLoadParameters&, Document&);
    static std::unique_ptr<LinkPreloadResourceClient> preloadIfNeeded(const LinkLoadParameters&, Document&, LinkLoader*);
    void prefetchIfNeeded(const LinkLoadParameters&, Document&);

    WeakRef<LinkLoaderClient> m_client;
    CachedResourceHandle<CachedResource> m_cachedLinkResource;
    std::unique_ptr<LinkPreloadResourceClient> m_preloadResourceClient;
};

}
