/*
    Copyright (C) 1998 Lars Knoll (knoll@mpi-hd.mpg.de)
    Copyright (C) 2001 Dirk Mueller <mueller@kde.org>
    Copyright (C) 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011 Apple Inc. All rights reserved.
    Copyright (C) 2009 Torch Mobile Inc. http://www.torchmobile.com/

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.

    This class provides all functionality needed for loading images, style sheets and html
    pages from the web. It has a memory cache for these objects.
*/

#pragma once

#include "CachedResource.h"
#include "CachedResourceHandle.h"
#include "CachedResourceRequest.h"
#include "ContentSecurityPolicy.h"
#include "Document.h"
#include "KeepaliveRequestTracker.h"
#include "MixedContentChecker.h"
#include "ResourceTimingInformation.h"
#include "Timer.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Expected.h>
#include <wtf/HashMap.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/RobinHoodHashSet.h>
#include <wtf/WeakListHashSet.h>
#include <wtf/text/StringHash.h>

namespace WebCore {

#if ENABLE(APPLICATION_MANIFEST)
class CachedApplicationManifest;
#endif
class CachedCSSStyleSheet;
class CachedSVGDocument;
class CachedFont;
class CachedImage;
class CachedRawResource;
class CachedScript;
class CachedTextTrack;
class CachedXSLStyleSheet;
class Document;
class DocumentLoader;
class ImageLoader;
class LocalFrame;
class Page;
class SVGImage;
class Settings;

template <typename T>
using ResourceErrorOr = Expected<T, ResourceError>;

enum class CachePolicy : uint8_t;
enum class ImageLoading : uint8_t { Immediate, DeferredUntilVisible };
enum class FetchMetadataSite : uint8_t { None, SameOrigin, SameSite, CrossSite };

const String& convertEnumerationToString(FetchMetadataSite);

// The CachedResourceLoader provides a per-context interface to the MemoryCache
// and enforces a bunch of security checks and rules for resource revalidation.
// Its lifetime is roughly per-DocumentLoader, in that it is generally created
// in the DocumentLoader constructor and loses its ability to generate network
// requests when the DocumentLoader is destroyed. Documents also hold a 
// RefPtr<CachedResourceLoader> for their lifetime (and will create one if they
// are initialized without a Frame), so a Document can keep a CachedResourceLoader
// alive past detach if scripts still reference the Document.
class CachedResourceLoader : public RefCountedAndCanMakeWeakPtr<CachedResourceLoader> {
    WTF_MAKE_NONCOPYABLE(CachedResourceLoader); WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
friend class ImageLoader;
friend class ResourceCacheValidationSuppressor;

public:
    static Ref<CachedResourceLoader> create(DocumentLoader* documentLoader) { return adoptRef(*new CachedResourceLoader(documentLoader)); }
    ~CachedResourceLoader();

    ResourceErrorOr<CachedResourceHandle<CachedImage>> requestImage(CachedResourceRequest&&, ImageLoading = ImageLoading::Immediate);
    ResourceErrorOr<CachedResourceHandle<CachedCSSStyleSheet>> requestCSSStyleSheet(CachedResourceRequest&&);
    CachedResourceHandle<CachedCSSStyleSheet> requestUserCSSStyleSheet(Page&, CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedScript>> requestScript(CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedFont>> requestFont(CachedResourceRequest&&, bool isSVG);
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestMedia(CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestIcon(CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestBeaconResource(CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestPingResource(CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestMainResource(CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedSVGDocument>> requestSVGDocument(CachedResourceRequest&&);
#if ENABLE(XSLT)
    ResourceErrorOr<CachedResourceHandle<CachedXSLStyleSheet>> requestXSLStyleSheet(CachedResourceRequest&&);
#endif
    ResourceErrorOr<CachedResourceHandle<CachedResource>> requestLinkResource(CachedResource::Type, CachedResourceRequest&&);
#if ENABLE(VIDEO)
    ResourceErrorOr<CachedResourceHandle<CachedTextTrack>> requestTextTrack(CachedResourceRequest&&);
#endif
#if ENABLE(APPLICATION_MANIFEST)
    ResourceErrorOr<CachedResourceHandle<CachedApplicationManifest>> requestApplicationManifest(CachedResourceRequest&&);
#endif
#if ENABLE(MODEL_ELEMENT)
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestEnvironmentMapResource(CachedResourceRequest&&);
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestModelResource(CachedResourceRequest&&);
#endif

    // Called to load Web Worker main script, Service Worker main script, importScripts(), XHR,
    // EventSource, Fetch, and App Cache.
    ResourceErrorOr<CachedResourceHandle<CachedRawResource>> requestRawResource(CachedResourceRequest&&);

    // Logs an access denied message to the console for the specified URL.
    void printAccessDeniedMessage(const URL& url) const;

    WEBCORE_EXPORT CachedResource* cachedResource(const String& url) const;
    CachedResource* cachedResource(const URL& url) const;

    typedef HashMap<String, CachedResourceHandle<CachedResource>> DocumentResourceMap;
    const DocumentResourceMap& allCachedResources() const { return m_documentResources; }

    void notifyFinished(const CachedResource&);
    Vector<Ref<SVGImage>> allCachedSVGImages() const;

    bool autoLoadImages() const { return m_autoLoadImages; }
    void setAutoLoadImages(bool);

    bool imagesEnabled() const { return m_imagesEnabled; }
    void setImagesEnabled(bool);

    bool shouldDeferImageLoad(const URL&) const;
    bool shouldPerformImageLoad(const URL&) const;
    
    CachePolicy cachePolicy(CachedResource::Type, const URL&) const;
    
    LocalFrame* frame() const; // Can be null
    RefPtr<LocalFrame> protectedFrame() const;
    Document* document() const { return m_document.get(); } // Can be null
    RefPtr<Document> protectedDocument() const { return document(); }
    void setDocument(Document* document) { m_document = document; }
    void clearDocumentLoader(); 
    void loadDone(LoadCompletionType, bool shouldPerformPostLoadActions = true);

    WEBCORE_EXPORT void garbageCollectDocumentResources();

    void incrementRequestCount(const CachedResource&);
    void decrementRequestCount(const CachedResource&);
    int requestCount() const { return m_requestCount; }

    WEBCORE_EXPORT bool isPreloaded(const String& urlString) const;
    enum class ClearPreloadsMode { ClearSpeculativePreloads, ClearAllPreloads };
    void clearPreloads(ClearPreloadsMode);
    ResourceErrorOr<CachedResourceHandle<CachedResource>> preload(CachedResource::Type, CachedResourceRequest&&);
    void printPreloadStats();
    void warnUnusedPreloads();
    void stopUnusedPreloadsTimer();

    bool updateRequestAfterRedirection(CachedResource::Type, ResourceRequest&, const ResourceLoaderOptions&, FetchMetadataSite, const URL& preRedirectURL);
    bool allowedByContentSecurityPolicy(CachedResource::Type, const URL&, const ResourceLoaderOptions&, ContentSecurityPolicy::RedirectResponseReceived, const URL& preRedirectURL = URL()) const;

    static const ResourceLoaderOptions& defaultCachedResourceOptions();

    void documentDidFinishLoadEvent();

    ResourceTimingInformation& resourceTimingInformation() { return m_resourceTimingInfo; }

    KeepaliveRequestTracker& keepaliveRequestTracker() { return m_keepaliveRequestTracker; }

    Vector<CachedResourceHandle<CachedResource>> visibleResourcesToPrioritize();

    static FetchMetadataSite computeFetchMetadataSite(const ResourceRequest&, CachedResource::Type, FetchOptions::Mode, const LocalFrame&, bool isDirectlyUserInitiatedRequest);
    static FetchMetadataSite computeFetchMetadataSiteAfterRedirection(const ResourceRequest&, CachedResource::Type, FetchOptions::Mode, const SecurityOrigin& originalOrigin, FetchMetadataSite originalSite, bool isDirectlyUserInitiatedRequest);

private:
    explicit CachedResourceLoader(DocumentLoader*);

    enum class ForPreload : bool { No, Yes };

    ResourceErrorOr<CachedResourceHandle<CachedResource>> requestResource(CachedResource::Type, CachedResourceRequest&&, ForPreload = ForPreload::No, ImageLoading = ImageLoading::Immediate);
    CachedResourceHandle<CachedResource> revalidateResource(CachedResourceRequest&&, CachedResource&);

    enum class MayAddToMemoryCache : bool { No, Yes };
    CachedResourceHandle<CachedResource> loadResource(CachedResource::Type, PAL::SessionID, CachedResourceRequest&&, const CookieJar&, const Settings&, MayAddToMemoryCache);

    void prepareFetch(CachedResource::Type, CachedResourceRequest&);
    void updateHTTPRequestHeaders(FrameLoader&, CachedResource::Type, CachedResourceRequest&);

    bool canRequest(CachedResource::Type, const URL&, const ResourceLoaderOptions&, ForPreload, MixedContentChecker::IsUpgradable);

    enum RevalidationPolicy { Use, Revalidate, Reload, Load };
    RevalidationPolicy determineRevalidationPolicy(CachedResource::Type, CachedResourceRequest&, CachedResource* existingResource, ForPreload, ImageLoading) const;

    bool shouldUpdateCachedResourceWithCurrentRequest(const CachedResource&, const CachedResourceRequest&);
    CachedResourceHandle<CachedResource> updateCachedResourceWithCurrentRequest(const CachedResource&, CachedResourceRequest&&, PAL::SessionID, const CookieJar&, const Settings&);

    bool shouldContinueAfterNotifyingLoadedFromMemoryCache(const CachedResourceRequest&, CachedResource&, ResourceError&);
    bool checkInsecureContent(CachedResource::Type, const URL&, MixedContentChecker::IsUpgradable) const;

    void performPostLoadActions();

    ImageLoading clientDefersImage(const URL&) const;
    void reloadImagesIfNotDeferred();

    bool canRequestAfterRedirection(CachedResource::Type, const URL&, const ResourceLoaderOptions&, const URL& preRedirectURL) const;
    bool canRequestInContentDispositionAttachmentSandbox(CachedResource::Type, const URL&) const;

    RefPtr<DocumentLoader> protectedDocumentLoader() const;

    MemoryCompactRobinHoodHashSet<URL> m_validatedURLs;
    MemoryCompactRobinHoodHashSet<URL> m_cachedSVGImagesURLs;
    mutable DocumentResourceMap m_documentResources;
    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document;
    SingleThreadWeakPtr<DocumentLoader> m_documentLoader;

    int m_requestCount { 0 };

    std::unique_ptr<WeakListHashSet<CachedResource>> m_preloads;
    Timer m_unusedPreloadsTimer;

    Timer m_garbageCollectDocumentResourcesTimer;

    ResourceTimingInformation m_resourceTimingInfo;
    KeepaliveRequestTracker m_keepaliveRequestTracker;

    bool m_autoLoadImages { true };
    bool m_imagesEnabled { true };
    bool m_allowStaleResources { false };
};

class ResourceCacheValidationSuppressor {
    WTF_MAKE_NONCOPYABLE(ResourceCacheValidationSuppressor);
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
public:
    ResourceCacheValidationSuppressor(CachedResourceLoader& loader)
        : m_loader(loader)
        , m_previousState(loader.m_allowStaleResources)
    {
        m_loader->m_allowStaleResources = true;
    }
    ~ResourceCacheValidationSuppressor()
    {
        m_loader->m_allowStaleResources = m_previousState;
    }
private:
    WeakRef<CachedResourceLoader> m_loader;
    bool m_previousState;
};

} // namespace WebCore
