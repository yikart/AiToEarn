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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "LocalFrameLoaderClient.h"

namespace WebCore {

class WEBCORE_EXPORT EmptyFrameLoaderClient : public LocalFrameLoaderClient {
public:
    explicit EmptyFrameLoaderClient(FrameLoader& frameLoader)
        : LocalFrameLoaderClient(frameLoader)
    { }

private:
    Ref<DocumentLoader> createDocumentLoader(const ResourceRequest&, const SubstituteData&) override;

    bool hasWebView() const final;

    void makeRepresentation(DocumentLoader*) final;

#if PLATFORM(IOS_FAMILY)
    bool forceLayoutOnRestoreFromBackForwardCache() final;
#endif

    void forceLayoutForNonHTML() final;

    void setCopiesOnScroll() final;

    void detachedFromParent2() final;
    void detachedFromParent3() final;

    void convertMainResourceLoadToDownload(DocumentLoader*, const ResourceRequest&, const ResourceResponse&) final;

    void assignIdentifierToInitialRequest(ResourceLoaderIdentifier, IsMainResourceLoad, DocumentLoader*, const ResourceRequest&) final;
    bool shouldUseCredentialStorage(DocumentLoader*, ResourceLoaderIdentifier) override;
    void dispatchWillSendRequest(DocumentLoader*, ResourceLoaderIdentifier, ResourceRequest&, const ResourceResponse&) final;
    void dispatchDidReceiveAuthenticationChallenge(DocumentLoader*, ResourceLoaderIdentifier, const AuthenticationChallenge&) final;
#if USE(PROTECTION_SPACE_AUTH_CALLBACK)
    bool canAuthenticateAgainstProtectionSpace(DocumentLoader*, ResourceLoaderIdentifier, const ProtectionSpace&) final;
#endif

#if PLATFORM(IOS_FAMILY)
    RetainPtr<CFDictionaryRef> connectionProperties(DocumentLoader*, ResourceLoaderIdentifier) final;
#endif

    void dispatchDidReceiveResponse(DocumentLoader*, ResourceLoaderIdentifier, const ResourceResponse&) final;
    void dispatchDidReceiveContentLength(DocumentLoader*, ResourceLoaderIdentifier, int) final;
    void dispatchDidFinishLoading(DocumentLoader*, IsMainResourceLoad, ResourceLoaderIdentifier) final;
#if ENABLE(DATA_DETECTION)
    void dispatchDidFinishDataDetection(NSArray *) final;
#endif
    void dispatchDidFailLoading(DocumentLoader*, IsMainResourceLoad, ResourceLoaderIdentifier, const ResourceError&) final;
    bool dispatchDidLoadResourceFromMemoryCache(DocumentLoader*, const ResourceRequest&, const ResourceResponse&, int) final;

    void dispatchDidDispatchOnloadEvents() final;
    void dispatchDidReceiveServerRedirectForProvisionalLoad() final;
    void dispatchDidCancelClientRedirect() final;
    void dispatchWillPerformClientRedirect(const URL&, double, WallTime, LockBackForwardList) final;
    void dispatchDidChangeLocationWithinPage() final;
    void dispatchDidPushStateWithinPage() final;
    void dispatchDidReplaceStateWithinPage() final;
    void dispatchDidPopStateWithinPage() final;
    void dispatchWillClose() final;
    void dispatchDidStartProvisionalLoad() final;
    void dispatchDidReceiveTitle(const StringWithDirection&) final;
    void dispatchDidCommitLoad(std::optional<HasInsecureContent>, std::optional<UsedLegacyTLS>, std::optional<WasPrivateRelayed>) final;
    void dispatchDidFailProvisionalLoad(const ResourceError&, WillContinueLoading, WillInternallyHandleFailure) final;
    void dispatchDidFailLoad(const ResourceError&) final;
    void dispatchDidFinishDocumentLoad() final;
    void dispatchDidFinishLoad() final;
    void dispatchDidReachLayoutMilestone(OptionSet<LayoutMilestone>) final;
    void dispatchDidReachVisuallyNonEmptyState() final;

    LocalFrame* dispatchCreatePage(const NavigationAction&, NewFrameOpenerPolicy) final;
    void dispatchShow() final;

    void dispatchDecidePolicyForResponse(const ResourceResponse&, const ResourceRequest&, const String&, FramePolicyFunction&&) final;
    void dispatchDecidePolicyForNewWindowAction(const NavigationAction&, const ResourceRequest&, FormState*, const String&, std::optional<HitTestResult>&&, FramePolicyFunction&&) final;
    void dispatchDecidePolicyForNavigationAction(const NavigationAction&, const ResourceRequest&, const ResourceResponse& redirectResponse, FormState*, const String&, std::optional<NavigationIdentifier>, std::optional<HitTestResult>&&, bool, IsPerformingHTTPFallback, SandboxFlags, PolicyDecisionMode, FramePolicyFunction&&) final;
    void updateSandboxFlags(SandboxFlags) final;
    void updateOpener(const Frame&) final;
    void cancelPolicyCheck() final;

    void dispatchUnableToImplementPolicy(const ResourceError&) final;

    void dispatchWillSendSubmitEvent(Ref<FormState>&&) final;
    void dispatchWillSubmitForm(FormState&, CompletionHandler<void()>&&) final;

    void revertToProvisionalState(DocumentLoader*) final;
    void setMainDocumentError(DocumentLoader*, const ResourceError&) final;

    void setMainFrameDocumentReady(bool) final;

    void startDownload(const ResourceRequest&, const String&, FromDownloadAttribute = FromDownloadAttribute::No) final;

    void willChangeTitle(DocumentLoader*) final;
    void didChangeTitle(DocumentLoader*) final;

    void willReplaceMultipartContent() final;
    void didReplaceMultipartContent() final;

    void committedLoad(DocumentLoader*, const SharedBuffer&) final;
    void finishedLoading(DocumentLoader*) final;

    ResourceError cancelledError(const ResourceRequest&) const final;
    ResourceError blockedError(const ResourceRequest&) const final;
    ResourceError blockedByContentBlockerError(const ResourceRequest&) const final;
    ResourceError cannotShowURLError(const ResourceRequest&) const final;
    ResourceError interruptedForPolicyChangeError(const ResourceRequest&) const final;
#if ENABLE(CONTENT_FILTERING)
    ResourceError blockedByContentFilterError(const ResourceRequest&) const final;
#endif

    ResourceError cannotShowMIMETypeError(const ResourceResponse&) const final;
    ResourceError fileDoesNotExistError(const ResourceResponse&) const final;
    ResourceError httpsUpgradeRedirectLoopError(const ResourceRequest&) const final;
    ResourceError httpNavigationWithHTTPSOnlyError(const ResourceRequest&) const final;
    ResourceError pluginWillHandleLoadError(const ResourceResponse&) const final;

    void loadStorageAccessQuirksIfNeeded() final;

    bool shouldFallBack(const ResourceError&) const final;

    bool canHandleRequest(const ResourceRequest&) const final;
    bool canShowMIMEType(const String&) const final;
    bool canShowMIMETypeAsHTML(const String&) const final;
    bool representationExistsForURLScheme(StringView) const final;
    String generatedMIMETypeForURLScheme(StringView) const final;

    void frameLoadCompleted() final;
    void restoreViewState() final;
    void provisionalLoadStarted() final;
    void didFinishLoad() final;
    void prepareForDataSourceReplacement() final;

    void updateCachedDocumentLoader(DocumentLoader&) final;
    void setTitle(const StringWithDirection&, const URL&) final;

    String userAgent(const URL&) const override;

    void savePlatformDataToCachedFrame(CachedFrame*) final;
    void transitionToCommittedFromCachedFrame(CachedFrame*) final;
#if PLATFORM(IOS_FAMILY)
    void didRestoreFrameHierarchyForCachedFrame() final;
#endif
    void transitionToCommittedForNewPage(InitializingIframe) final;

    void didRestoreFromBackForwardCache() final;

    void updateGlobalHistory() final;
    void updateGlobalHistoryRedirectLinks() final;
    bool shouldGoToHistoryItem(HistoryItem&) const final;
    void saveViewStateToItem(HistoryItem&) final;
    bool canCachePage() const final;
    void didDisplayInsecureContent() final;
    void didRunInsecureContent(SecurityOrigin&) final;
    RefPtr<LocalFrame> createFrame(const AtomString&, HTMLFrameOwnerElement&) final;
    RefPtr<Widget> createPlugin(HTMLPlugInElement&, const URL&, const Vector<AtomString>&, const Vector<AtomString>&, const String&, bool) final;

    ObjectContentType objectContentType(const URL&, const String&) final;
    AtomString overrideMediaType() const final;

    void redirectDataToPlugin(Widget&) final;
    void dispatchDidClearWindowObjectInWorld(DOMWrapperWorld&) final;

#if PLATFORM(COCOA)
    RemoteAXObjectRef accessibilityRemoteObject() final;
    IntPoint accessibilityRemoteFrameOffset() final;
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    void setAXIsolatedTreeRoot(WebCore::AXCoreObject*) final;
#endif
    void willCacheResponse(DocumentLoader*, ResourceLoaderIdentifier, NSCachedURLResponse *, CompletionHandler<void(NSCachedURLResponse *)>&&) const final;
#endif

    Ref<FrameNetworkingContext> createNetworkingContext() final;

    bool isEmptyFrameLoaderClient() const override;
    void prefetchDNS(const String&) final;
    void sendH2Ping(const URL&, CompletionHandler<void(Expected<Seconds, ResourceError>&&)>&&) final;

#if USE(QUICK_LOOK)
    RefPtr<LegacyPreviewLoaderClient> createPreviewLoaderClient(const String&, const String&) final;
#endif

    bool hasFrameSpecificStorageAccess() final;

    void dispatchLoadEventToOwnerElementInAnotherProcess() final;
};

} // namespace WebCore
