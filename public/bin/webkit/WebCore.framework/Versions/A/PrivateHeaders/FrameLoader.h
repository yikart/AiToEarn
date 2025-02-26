/*
 * Copyright (C) 2006-2016 Apple Inc. All rights reserved.
 * Copyright (C) 2008, 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 * Copyright (C) Research In Motion Limited 2009. All rights reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
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

#include "FrameIdentifier.h"
#include "FrameLoaderStateMachine.h"
#include "FrameLoaderTypes.h"
#include "LayoutMilestone.h"
#include "LoaderMalloc.h"
#include "PageIdentifier.h"
#include "PrivateClickMeasurement.h"
#include "ReferrerPolicy.h"
#include "ResourceLoadNotifier.h"
#include "ResourceLoaderOptions.h"
#include "ResourceRequestBase.h"
#include "SecurityContext.h"
#include "StoredCredentialsPolicy.h"
#include "Timer.h"
#include <wtf/CheckedRef.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/HashSet.h>
#include <wtf/OptionSet.h>
#include <wtf/UniqueRef.h>
#include <wtf/WallTime.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakRef.h>

namespace WebCore {

class Archive;
class CachedFrameBase;
class CachedPage;
class CachedResource;
class Chrome;
class SharedBuffer;
class DOMWrapperWorld;
class Document;
class DocumentLoader;
class Event;
class Frame;
class FormState;
class FormSubmission;
class FrameLoadRequest;
class FrameNetworkingContext;
class HistoryController;
class HistoryItem;
class LocalDOMWindow;
class LocalFrameLoaderClient;
class NavigationAction;
class NetworkingContext;
class Node;
class Page;
class PolicyChecker;
class ResourceError;
class ResourceRequest;
class ResourceResponse;
class SerializedScriptValue;
class SubstituteData;

enum class CachePolicy : uint8_t;
enum class NewLoadInProgress : bool;
enum class NavigationPolicyDecision : uint8_t;
enum class ShouldTreatAsContinuingLoad : uint8_t;
enum class UsedLegacyTLS : bool;
enum class WasPrivateRelayed : bool;
enum class IsMainResource : bool { No, Yes };
enum class ShouldUpdateAppInitiatedValue : bool { No, Yes };

struct WindowFeatures;

WEBCORE_EXPORT bool isBackForwardLoadType(FrameLoadType);
WEBCORE_EXPORT bool isReload(FrameLoadType);

using ContentPolicyDecisionFunction = CompletionHandler<void(PolicyAction)>;

class FrameLoader final : public CanMakeWeakPtr<FrameLoader> {
    WTF_MAKE_NONCOPYABLE(FrameLoader);
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(Loader);
    friend class PolicyChecker;
public:
    FrameLoader(LocalFrame&, CompletionHandler<UniqueRef<LocalFrameLoaderClient>(LocalFrame&, FrameLoader&)>&& clientCreator);
    ~FrameLoader();

    WEBCORE_EXPORT void ref() const;
    WEBCORE_EXPORT void deref() const;

    WEBCORE_EXPORT void init();
    void initForSynthesizedDocument(const URL&);

    WEBCORE_EXPORT LocalFrame& frame() const;
    WEBCORE_EXPORT Ref<LocalFrame> protectedFrame() const;

    PolicyChecker& policyChecker() const { return *m_policyChecker; }

    HistoryController& history() const { return m_history; }
    WEBCORE_EXPORT CheckedRef<HistoryController> checkedHistory() const;

    ResourceLoadNotifier& notifier() const { return m_notifier; }

    class SubframeLoader;
    SubframeLoader& subframeLoader() { return *m_subframeLoader; }
    const SubframeLoader& subframeLoader() const { return *m_subframeLoader; }

    void setupForReplace();

    // FIXME: These are all functions which start loads. We have too many.
    WEBCORE_EXPORT void loadFrameRequest(FrameLoadRequest&&, Event*, RefPtr<FormState>&&, std::optional<PrivateClickMeasurement>&& = std::nullopt); // Called by submitForm, calls loadPostRequest and loadURL.

    WEBCORE_EXPORT void load(FrameLoadRequest&&);

#if ENABLE(WEB_ARCHIVE) || ENABLE(MHTML)
    WEBCORE_EXPORT void loadArchive(Ref<Archive>&&);
#endif
    ResourceLoaderIdentifier loadResourceSynchronously(const ResourceRequest&, ClientCredentialPolicy, const FetchOptions&, const HTTPHeaderMap&, ResourceError&, ResourceResponse&, RefPtr<SharedBuffer>& data);

    WEBCORE_EXPORT void changeLocation(const URL&, const AtomString& target, Event*, const ReferrerPolicy&, ShouldOpenExternalURLsPolicy, std::optional<NewFrameOpenerPolicy> = std::nullopt, const AtomString& downloadAttribute = nullAtom(), std::optional<PrivateClickMeasurement>&& = std::nullopt, NavigationHistoryBehavior = NavigationHistoryBehavior::Push);
    void changeLocation(FrameLoadRequest&&, Event* = nullptr, std::optional<PrivateClickMeasurement>&& = std::nullopt);
    void submitForm(Ref<FormSubmission>&&);

    WEBCORE_EXPORT void reload(OptionSet<ReloadOption> = { }, bool isRequestFromClientOrUserInput = false);
    WEBCORE_EXPORT void reloadWithOverrideEncoding(const String& overrideEncoding);

    void open(CachedFrameBase&);

    void retryAfterFailedCacheOnlyMainResourceLoad();

    static void reportLocalLoadFailed(LocalFrame*, const String& url);
    static void reportBlockedLoadFailed(LocalFrame&, const URL&);

    // FIXME: These are all functions which stop loads. We have too many.
    void stopAllLoadersAndCheckCompleteness();
    WEBCORE_EXPORT void stopAllLoaders(ClearProvisionalItem = ClearProvisionalItem::Yes, StopLoadingPolicy = StopLoadingPolicy::PreventDuringUnloadEvents);
    WEBCORE_EXPORT void stopForUserCancel(bool deferCheckLoadComplete = false);
    void stopForBackForwardCache();
    void stop();
    void stopLoading(UnloadEventPolicy);
    void closeURL();
    // FIXME: clear() is trying to do too many things. We should break it down into smaller functions (ideally with fewer raw Boolean parameters).
    void clear(RefPtr<Document>&& newDocument, bool clearWindowProperties = true, bool clearScriptObjects = true, bool clearFrameView = true, Function<void()>&& handleDOMWindowCreation = nullptr);

    bool isLoading() const;
    WEBCORE_EXPORT bool frameHasLoaded() const;

    WEBCORE_EXPORT int numPendingOrLoadingRequests(bool recurse) const;

    ReferrerPolicy effectiveReferrerPolicy() const;
    String referrer() const;
    WEBCORE_EXPORT String outgoingReferrer() const;
    WEBCORE_EXPORT URL outgoingReferrerURL();
    String outgoingOrigin() const;

    WEBCORE_EXPORT DocumentLoader* activeDocumentLoader() const;
    RefPtr<DocumentLoader> protectedActiveDocumentLoader() const;
    DocumentLoader* documentLoader() const { return m_documentLoader.get(); }
    RefPtr<DocumentLoader> protectedDocumentLoader() const;
    DocumentLoader* policyDocumentLoader() const { return m_policyDocumentLoader.get(); }
    DocumentLoader* provisionalDocumentLoader() const { return m_provisionalDocumentLoader.get(); }
    RefPtr<DocumentLoader> protectedProvisionalDocumentLoader() const;
    FrameState state() const { return m_state; }

    enum class CanIncludeCurrentDocumentLoader : bool { No, Yes };
    WEBCORE_EXPORT RefPtr<DocumentLoader> loaderForWebsitePolicies(CanIncludeCurrentDocumentLoader = CanIncludeCurrentDocumentLoader::Yes) const;

    bool shouldReportResourceTimingToParentFrame() const { return m_shouldReportResourceTimingToParentFrame; };
    
#if PLATFORM(IOS_FAMILY)
    RetainPtr<CFDictionaryRef> connectionProperties(ResourceLoader*);
#endif
    void receivedMainResourceError(const ResourceError&, LoadWillContinueInAnotherProcess);

    bool willLoadMediaElementURL(URL&, Node&);

    WEBCORE_EXPORT ResourceError cancelledError(const ResourceRequest&) const;
    WEBCORE_EXPORT ResourceError blockedByContentBlockerError(const ResourceRequest&) const;
    ResourceError blockedError(const ResourceRequest&) const;
#if ENABLE(CONTENT_FILTERING)
    ResourceError blockedByContentFilterError(const ResourceRequest&) const;
#endif

    bool isReplacing() const;
    void setReplacing();
    bool subframeIsLoading() const;
    void willChangeTitle(DocumentLoader*);
    void didChangeTitle(DocumentLoader*);

    bool shouldTreatURLAsSrcdocDocument(const URL&) const;

    WEBCORE_EXPORT FrameLoadType loadType() const;

    CachePolicy subresourceCachePolicy(const URL&) const;

    void didReachLayoutMilestone(OptionSet<LayoutMilestone>);
    void didFirstLayout();
    void restoreScrollPositionAndViewStateSoon();
    void restoreScrollPositionAndViewStateNowIfNeeded();
    void didReachVisuallyNonEmptyState();

    void loadedResourceFromMemoryCache(CachedResource&, ResourceRequest& newRequest, ResourceError&);
    void tellClientAboutPastMemoryCacheLoads();

    void checkLoadComplete(LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No);
    WEBCORE_EXPORT void detachFromParent();
    void detachViewsAndDocumentLoader();

    static void addHTTPOriginIfNeeded(ResourceRequest&, const String& origin);
    static void addSameSiteInfoToRequestIfNeeded(ResourceRequest&, const Document* initiator = nullptr, const Page* = nullptr);

    const LocalFrameLoaderClient& client() const { return m_client.get(); }
    LocalFrameLoaderClient& client() { return m_client.get(); }
    WEBCORE_EXPORT Ref<const LocalFrameLoaderClient> protectedClient() const;
    WEBCORE_EXPORT Ref<LocalFrameLoaderClient> protectedClient();

    WEBCORE_EXPORT FrameIdentifier frameID() const;

    void setDefersLoading(bool);

    void checkContentPolicy(const ResourceResponse&, ContentPolicyDecisionFunction&&);

    void didExplicitOpen();

    // Callbacks from DocumentWriter
    void didBeginDocument(bool dispatchWindowObjectAvailable, LocalDOMWindow* previousWindow);

    void receivedFirstData();

    void dispatchOnloadEvents();
    String userAgent(const URL&) const;
    String navigatorPlatform() const;

    void dispatchDidClearWindowObjectInWorld(DOMWrapperWorld&);
    void dispatchDidClearWindowObjectsInAllWorlds();

    bool checkIfFormActionAllowedByCSP(const URL&, bool didReceiveRedirectResponse, const URL& preRedirectURL) const;

    void resetMultipleFormSubmissionProtection();

    void checkCallImplicitClose();

    void frameDetached();

    void setOutgoingReferrer(const URL&);

    void loadDone(LoadCompletionType);
    void subresourceLoadDone(LoadCompletionType);
    void finishedParsing();
    void checkCompleted();

    WEBCORE_EXPORT bool isComplete() const;

    void commitProvisionalLoad();
    void provisionalLoadFailedInAnotherProcess();

    void setLoadsSynchronously(bool loadsSynchronously) { m_loadsSynchronously = loadsSynchronously; }
    bool loadsSynchronously() const { return m_loadsSynchronously; }

    FrameLoaderStateMachine& stateMachine() { return m_stateMachine; }
    const FrameLoaderStateMachine& stateMachine() const { return m_stateMachine; }

    void advanceStatePastInitialEmptyDocument();

    WEBCORE_EXPORT RefPtr<Frame> findFrameForNavigation(const AtomString& name, Document* activeDocument = nullptr);

    void applyUserAgentIfNeeded(ResourceRequest&);

    bool shouldInterruptLoadForXFrameOptions(const String&, const URL&, ResourceLoaderIdentifier);

    void completed();
    bool allAncestorsAreComplete() const; // including this
    void clientRedirected(const URL&, double delay, WallTime fireDate, LockBackForwardList);
    void clientRedirectCancelledOrFinished(NewLoadInProgress);

    WEBCORE_EXPORT void setOriginalURLForDownloadRequest(ResourceRequest&);

    bool quickRedirectComing() const { return m_quickRedirectComing; }

    WEBCORE_EXPORT bool shouldClose();

    enum class PageDismissalType { None, BeforeUnload, PageHide, Unload };
    PageDismissalType pageDismissalEventBeingDispatched() const { return m_pageDismissalEventBeingDispatched; }

    WEBCORE_EXPORT NetworkingContext* networkingContext() const;
    WEBCORE_EXPORT RefPtr<NetworkingContext> protectedNetworkingContext() const;

    void loadProgressingStatusChanged();

    const URL& previousURL() const { return m_previousURL; }

    bool isHTTPFallbackInProgress() const { return m_isHTTPFallbackInProgress; }
    void setHTTPFallbackInProgress(bool value) { m_isHTTPFallbackInProgress = value; }

    bool shouldSkipHTTPSUpgradeForSameSiteNavigation() const { return m_shouldSkipHTTPSUpgradeForSameSiteNavigation; }

    WEBCORE_EXPORT void completePageTransitionIfNeeded();

    void setOverrideCachePolicyForTesting(ResourceRequestCachePolicy policy) { m_overrideCachePolicyForTesting = policy; }
    void setOverrideResourceLoadPriorityForTesting(ResourceLoadPriority priority) { m_overrideResourceLoadPriorityForTesting = priority; }
    void setStrictRawResourceValidationPolicyDisabledForTesting(bool disabled) { m_isStrictRawResourceValidationPolicyDisabledForTesting = disabled; }
    bool isStrictRawResourceValidationPolicyDisabledForTesting() { return m_isStrictRawResourceValidationPolicyDisabledForTesting; }

    WEBCORE_EXPORT void clearTestingOverrides();

    const URL& provisionalLoadErrorBeingHandledURL() const { return m_provisionalLoadErrorBeingHandledURL; }
    void setProvisionalLoadErrorBeingHandledURL(const URL& url) { m_provisionalLoadErrorBeingHandledURL = url; }

    bool shouldSuppressTextInputFromEditing() const;
    bool isReloadingFromOrigin() const { return m_loadType == FrameLoadType::ReloadFromOrigin; }

    // Used in webarchive loading tests.
    // FIXME: Clean up uses of setAlwaysAllowLocalWebarchive. The AlwaysAllowLocalWebarchive preference replaces it.
    void setAlwaysAllowLocalWebarchive(bool alwaysAllowLocalWebarchive) { m_alwaysAllowLocalWebarchive = alwaysAllowLocalWebarchive; }
    bool alwaysAllowLocalWebarchive() const { return m_alwaysAllowLocalWebarchive; }

    enum class IsServiceWorkerNavigationLoad : bool { No, Yes };
    enum class WillOpenInNewWindow : bool { No, Yes };
    // For subresource requests the FrameLoadType parameter has no effect and can be skipped.
    void updateRequestAndAddExtraFields(ResourceRequest&, IsMainResource, FrameLoadType = FrameLoadType::Standard, ShouldUpdateAppInitiatedValue = ShouldUpdateAppInitiatedValue::Yes, IsServiceWorkerNavigationLoad = IsServiceWorkerNavigationLoad::No, WillOpenInNewWindow = WillOpenInNewWindow::No, Document* = nullptr);

    void scheduleRefreshIfNeeded(Document&, const String& content, IsMetaRefresh);

    void switchBrowsingContextsGroup();

    bool errorOccurredInLoading() const { return m_errorOccurredInLoading; }

    // HistoryController specific.
    void loadItem(HistoryItem&, HistoryItem* fromItem, FrameLoadType, ShouldTreatAsContinuingLoad);
    HistoryItem* requestedHistoryItem() const { return m_requestedHistoryItem.get(); }

    void updateURLAndHistory(const URL&, RefPtr<SerializedScriptValue>&& stateObject, NavigationHistoryBehavior = NavigationHistoryBehavior::Replace);

private:
    enum FormSubmissionCacheLoadPolicy {
        MayAttemptCacheOnlyLoadForFormSubmissionItem,
        MayNotAttemptCacheOnlyLoadForFormSubmissionItem
    };

    RefPtr<LocalFrame> nonSrcdocFrame() const;

    std::optional<PageIdentifier> pageID() const;
    void executeJavaScriptURL(const URL&, const NavigationAction&);

    bool allChildrenAreComplete() const; // immediate children, not all descendants

    void checkTimerFired();
    void checkCompletenessNow();

    void loadSameDocumentItem(HistoryItem&);
    void loadDifferentDocumentItem(HistoryItem&, HistoryItem* fromItem, FrameLoadType, FormSubmissionCacheLoadPolicy, ShouldTreatAsContinuingLoad);

    void loadProvisionalItemFromCachedPage();

    void updateFirstPartyForCookies();
    void setFirstPartyForCookies(const URL&);

    ResourceRequestCachePolicy defaultRequestCachingPolicy(const ResourceRequest&, FrameLoadType, bool isMainResource);

    void clearProvisionalLoad();
    void transitionToCommitted(CachedPage*);
    void frameLoadCompleted();

    SubstituteData defaultSubstituteDataForURL(const URL&);

    bool dispatchBeforeUnloadEvent(Chrome&, FrameLoader* frameLoaderBeingNavigated);
    void dispatchUnloadEvents(UnloadEventPolicy);

    void continueLoadAfterNavigationPolicy(const ResourceRequest&, FormState*, NavigationPolicyDecision, AllowNavigationToInvalidURL);
    void continueLoadAfterNewWindowPolicy(const ResourceRequest&, FormState*, const AtomString& frameName, const NavigationAction&, ShouldContinuePolicyCheck, AllowNavigationToInvalidURL, NewFrameOpenerPolicy);
    void continueFragmentScrollAfterNavigationPolicy(const ResourceRequest&, const SecurityOrigin* requesterOrigin, bool shouldContinue, NavigationHistoryBehavior);

    bool shouldPerformFragmentNavigation(bool isFormSubmission, const String& httpMethod, FrameLoadType, const URL&);
    void scrollToFragmentWithParentBoundary(const URL&, bool isNewNavigation = true);

    void dispatchDidFailProvisionalLoad(DocumentLoader& provisionalDocumentLoader, const ResourceError&, WillInternallyHandleFailure);
    void checkLoadCompleteForThisFrame(LoadWillContinueInAnotherProcess);
    void handleLoadFailureRecovery(DocumentLoader&, const ResourceError&, bool);

    void setDocumentLoader(RefPtr<DocumentLoader>&&);
    void setPolicyDocumentLoader(RefPtr<DocumentLoader>&&, LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No);
    void setProvisionalDocumentLoader(RefPtr<DocumentLoader>&&);

    void setState(FrameState);

    void closeOldDataSources();
    void willRestoreFromCachedPage();

    bool shouldReloadToHandleUnreachableURL(DocumentLoader&);

    void dispatchDidCommitLoad(std::optional<HasInsecureContent> initialHasInsecureContent, std::optional<UsedLegacyTLS> initialUsedLegacyTLS, std::optional<WasPrivateRelayed> initialWasPrivateRelayed);

    void loadWithDocumentLoader(DocumentLoader*, FrameLoadType, RefPtr<FormState>&&, AllowNavigationToInvalidURL, CompletionHandler<void()>&& = [] { }); // Calls continueLoadAfterNavigationPolicy
    void load(DocumentLoader&, const SecurityOrigin* requesterOrigin); // Calls loadWithDocumentLoader

    void loadWithNavigationAction(const ResourceRequest&, NavigationAction&&, FrameLoadType, RefPtr<FormState>&&, AllowNavigationToInvalidURL, ShouldTreatAsContinuingLoad, CompletionHandler<void()>&& = [] { }); // Calls loadWithDocumentLoader

    void loadPostRequest(FrameLoadRequest&&, const String& referrer, FrameLoadType, Event*, RefPtr<FormState>&&, CompletionHandler<void()>&&);
    void loadURL(FrameLoadRequest&&, const String& referrer, FrameLoadType, Event*, RefPtr<FormState>&&, std::optional<PrivateClickMeasurement>&&, CompletionHandler<void()>&&);

    bool shouldReload(const URL& currentURL, const URL& destinationURL);

    ResourceLoaderIdentifier requestFromDelegate(ResourceRequest&, IsMainResourceLoad, ResourceError&);

    WEBCORE_EXPORT void detachChildren();
    void closeAndRemoveChild(LocalFrame&);

    void loadInSameDocument(URL, RefPtr<SerializedScriptValue> stateObject, const SecurityOrigin* requesterOrigin, bool isNewNavigation, NavigationHistoryBehavior historyHandling = NavigationHistoryBehavior::Auto);

    void prepareForLoadStart();
    void provisionalLoadStarted();

    bool didOpenURL();

    void scheduleCheckCompleted();
    void scheduleCheckLoadComplete();
    void startCheckCompleteTimer();

    bool shouldTreatURLAsSameAsCurrent(const SecurityOrigin* requesterOrigin, const URL&) const;

    void dispatchGlobalObjectAvailableInAllWorlds();

    bool isNavigationAllowed() const;
    bool isStopLoadingAllowed() const;

    enum class LoadContinuingState : uint8_t { NotContinuing, ContinuingWithRequest, ContinuingWithHistoryItem };
    bool shouldTreatCurrentLoadAsContinuingLoad() const { return m_currentLoadContinuingState != LoadContinuingState::NotContinuing; }

    // SubframeLoader specific.
    void loadURLIntoChildFrame(const URL&, const String& referer, LocalFrame*);
    void started();

    // PolicyChecker specific.
    void clearProvisionalLoadForPolicyCheck();
    bool hasOpenedFrames() const;

    void updateRequestAndAddExtraFields(Frame&, ResourceRequest&, IsMainResource, FrameLoadType, ShouldUpdateAppInitiatedValue, IsServiceWorkerNavigationLoad, WillOpenInNewWindow, Document*);

    bool dispatchNavigateEvent(const URL& newURL, FrameLoadType, const AtomString&, NavigationHistoryBehavior, bool isSameDocument, FormState* = nullptr, SerializedScriptValue* classicHistoryAPIState = nullptr);

    WeakRef<LocalFrame> m_frame;
    UniqueRef<LocalFrameLoaderClient> m_client;

    const std::unique_ptr<PolicyChecker> m_policyChecker;
    const UniqueRef<HistoryController> m_history;
    mutable ResourceLoadNotifier m_notifier;
    const std::unique_ptr<SubframeLoader> m_subframeLoader;
    mutable FrameLoaderStateMachine m_stateMachine;

    class FrameProgressTracker;
    std::unique_ptr<FrameProgressTracker> m_progressTracker;

    FrameState m_state;
    FrameLoadType m_loadType;

    // Document loaders for the three phases of frame loading. Note that while 
    // a new request is being loaded, the old document loader may still be referenced.
    // E.g. while a new request is in the "policy" state, the old document loader may
    // be consulted in particular as it makes sense to imply certain settings on the new loader.
    RefPtr<DocumentLoader> m_documentLoader;
    RefPtr<DocumentLoader> m_provisionalDocumentLoader;
    RefPtr<DocumentLoader> m_policyDocumentLoader;

    URL m_provisionalLoadErrorBeingHandledURL;

    bool m_quickRedirectComing { false };
    bool m_sentRedirectNotification { false };
    bool m_inStopAllLoaders { false };
    bool m_inClearProvisionalLoadForPolicyCheck { false };
    bool m_shouldReportResourceTimingToParentFrame { true };
    bool m_provisionalLoadHappeningInAnotherProcess { false };

    String m_outgoingReferrer;
    URL m_outgoingReferrerURL;

    bool m_isExecutingJavaScriptFormAction { false };

    bool m_didCallImplicitClose { true };
    bool m_wasUnloadEventEmitted { false };

    PageDismissalType m_pageDismissalEventBeingDispatched { PageDismissalType::None };
    bool m_isComplete { false };
    bool m_needsClear { false };

    URL m_submittedFormURL;

    Timer m_checkTimer;
    bool m_shouldCallCheckCompleted { false };
    bool m_shouldCallCheckLoadComplete { false };

    bool m_loadingFromCachedPage { false };

    bool m_currentNavigationHasShownBeforeUnloadConfirmPanel { false };

    bool m_loadsSynchronously { false };

    RefPtr<FrameNetworkingContext> m_networkingContext;

    std::optional<ResourceRequestCachePolicy> m_overrideCachePolicyForTesting;
    std::optional<ResourceLoadPriority> m_overrideResourceLoadPriorityForTesting;
    bool m_isStrictRawResourceValidationPolicyDisabledForTesting { false };

    LoadContinuingState m_currentLoadContinuingState { LoadContinuingState::NotContinuing };

    bool m_checkingLoadCompleteForDetachment { false };

    URL m_previousURL;
    RefPtr<HistoryItem> m_requestedHistoryItem;

    bool m_alwaysAllowLocalWebarchive { false };

    bool m_inStopForBackForwardCache { false };
    bool m_isHTTPFallbackInProgress { false };
    bool m_shouldSkipHTTPSUpgradeForSameSiteNavigation { false };
    bool m_shouldRestoreScrollPositionAndViewState { false };

    bool m_errorOccurredInLoading { false };
    bool m_doNotAbortNavigationAPI { false };
};

// This function is called by createWindow() in JSDOMWindowBase.cpp, for example, for
// modal dialog creation.  The lookupFrame is for looking up the frame name in case
// the frame name references a frame different from the openerFrame, e.g. when it is
// "_self" or "_parent".
//
// FIXME: Consider making this function part of an appropriate class (not FrameLoader)
// and moving it to a more appropriate location.
enum class CreatedNewPage : bool { No, Yes };
std::pair<RefPtr<Frame>, CreatedNewPage> createWindow(LocalFrame& openerFrame, FrameLoadRequest&&, WindowFeatures&&);

} // namespace WebCore
