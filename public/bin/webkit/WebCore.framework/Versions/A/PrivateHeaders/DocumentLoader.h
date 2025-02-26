/*
 * Copyright (C) 2006-2020 Apple Inc. All rights reserved.
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

#include "AdvancedPrivacyProtections.h"
#include "CachedRawResourceClient.h"
#include "CachedResourceHandle.h"
#include "ContentFilterClient.h"
#include "ContentSecurityPolicyClient.h"
#include "CrossOriginOpenerPolicy.h"
#include "DeviceOrientationOrMotionPermissionState.h"
#include "DocumentLoadTiming.h"
#include "DocumentWriter.h"
#include "ElementTargetingTypes.h"
#include "FrameDestructionObserver.h"
#include "FrameLoaderTypes.h"
#include "HTTPSByDefaultMode.h"
#include "LinkIcon.h"
#include "NavigationAction.h"
#include "NavigationIdentifier.h"
#include "ResourceError.h"
#include "ResourceLoaderIdentifier.h"
#include "ResourceLoaderOptions.h"
#include "ResourceRequest.h"
#include "ResourceResponse.h"
#include "ScriptExecutionContextIdentifier.h"
#include "SecurityPolicyViolationEvent.h"
#include "ServiceWorkerRegistrationData.h"
#include "StringWithDirection.h"
#include "StyleSheetContents.h"
#include "SubstituteData.h"
#include "Timer.h"
#include <wtf/HashSet.h>
#include <wtf/OptionSet.h>
#include <wtf/RefPtr.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/RobinHoodHashSet.h>
#include <wtf/Vector.h>

#if ENABLE(APPLICATION_MANIFEST)
#include "ApplicationManifest.h"
#endif

#if PLATFORM(COCOA)
#include <wtf/SchedulePair.h>
#endif

namespace WebCore {
class DataLoadToken;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::DataLoadToken> : std::true_type { };
}

namespace WebCore {

class ApplicationCacheHost;
class ApplicationManifestLoader;
class Archive;
class ArchiveResource;
class ArchiveResourceCollection;
class CachedRawResource;
class CachedResourceLoader;
class ContentFilter;
class SharedBuffer;
struct CustomHeaderFields;
class FormState;
class FrameLoader;
class IconLoader;
class LocalFrame;
class Page;
class PreviewConverter;
class ResourceLoader;
class FragmentedSharedBuffer;
class SWClientConnection;
class SharedBuffer;
class SubresourceLoader;
class SubstituteResource;
class UserContentURLPattern;

enum class ClearSiteDataValue : uint8_t;
enum class LoadWillContinueInAnotherProcess : bool;
enum class ShouldContinue;

using ResourceLoaderMap = HashMap<ResourceLoaderIdentifier, RefPtr<ResourceLoader>>;

enum class AutoplayPolicy : uint8_t {
    Default, // Uses policies specified in document settings.
    Allow,
    AllowWithoutSound,
    Deny,
};

enum class AutoplayQuirk : uint8_t {
    SynthesizedPauseEvents = 1 << 0,
    InheritedUserGestures = 1 << 1,
    ArbitraryUserGestures = 1 << 2,
    PerDocumentAutoplayBehavior = 1 << 3,
};

enum class PopUpPolicy : uint8_t {
    Default, // Uses policies specified in frame settings.
    Allow,
    Block,
};

enum class MetaViewportPolicy : uint8_t {
    Default,
    Respect,
    Ignore,
};

enum class MediaSourcePolicy : uint8_t {
    Default,
    Disable,
    Enable
};

enum class SimulatedMouseEventsDispatchPolicy : uint8_t {
    Default,
    Allow,
    Deny,
};

enum class LegacyOverflowScrollingTouchPolicy : uint8_t {
    Default,
    Disable,
    Enable,
};

enum class MouseEventPolicy : uint8_t {
    Default,
#if ENABLE(IOS_TOUCH_EVENTS)
    SynthesizeTouchEvents,
#endif
};

enum class ModalContainerObservationPolicy : bool { Disabled, Prompt };

enum class ColorSchemePreference : uint8_t {
    NoPreference,
    Light,
    Dark
};

enum class PushAndNotificationsEnabledPolicy: uint8_t {
    UseGlobalPolicy,
    No,
    Yes,
};

enum class ContentExtensionDefaultEnablement : bool { Disabled, Enabled };
using ContentExtensionEnablement = std::pair<ContentExtensionDefaultEnablement, HashSet<String>>;

class DataLoadToken : public CanMakeWeakPtr<DataLoadToken> {
public:
    void clear() { weakPtrFactory().revokeAll(); }
};

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(DocumentLoader);
class DocumentLoader
    : public RefCounted<DocumentLoader>
    , public FrameDestructionObserver
    , public ContentSecurityPolicyClient
#if ENABLE(CONTENT_FILTERING)
    , public ContentFilterClient
#endif
    , public CachedRawResourceClient {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(DocumentLoader);
    friend class ContentFilter;
public:
#if ENABLE(CONTENT_FILTERING)
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }
#endif

    static Ref<DocumentLoader> create(const ResourceRequest& request, const SubstituteData& data)
    {
        return adoptRef(*new DocumentLoader(request, data));
    }

    USING_CAN_MAKE_WEAKPTR(CachedRawResourceClient);

    WEBCORE_EXPORT static DocumentLoader* fromScriptExecutionContextIdentifier(ScriptExecutionContextIdentifier);

    WEBCORE_EXPORT virtual ~DocumentLoader();

    void attachToFrame(LocalFrame&);

    WEBCORE_EXPORT virtual void detachFromFrame(LoadWillContinueInAnotherProcess);

    void replacedByFragmentNavigation(LocalFrame&);

    WEBCORE_EXPORT FrameLoader* frameLoader() const;
    RefPtr<FrameLoader> protectedFrameLoader() const;
    WEBCORE_EXPORT SubresourceLoader* mainResourceLoader() const;
    WEBCORE_EXPORT RefPtr<FragmentedSharedBuffer> mainResourceData() const;
    
    DocumentWriter& writer() const { return m_writer; }

    const ResourceRequest& originalRequest() const;
    const ResourceRequest& originalRequestCopy() const;

    const ResourceRequest& request() const;
    ResourceRequest& request();

    CachedResourceLoader& cachedResourceLoader() { return m_cachedResourceLoader; }
    Ref<CachedResourceLoader> protectedCachedResourceLoader() const;

    const SubstituteData& substituteData() const { return m_substituteData; }

    const URL& url() const;
    const URL& unreachableURL() const;

    const URL& originalURL() const;
    const URL& responseURL() const;
    const String& responseMIMEType() const;
#if PLATFORM(IOS_FAMILY)
    // FIXME: This method seems to violate the encapsulation of this class.
    WEBCORE_EXPORT void setResponseMIMEType(const String&);
#endif
    const String& currentContentType() const;
    void replaceRequestURLForSameDocumentNavigation(const URL&);
    bool isStopping() const { return m_isStopping; }
    void stopLoading();
    void setCommitted(bool committed) { m_committed = committed; }
    bool isCommitted() const { return m_committed; }
    WEBCORE_EXPORT bool isLoading() const;

    const ResourceError& mainDocumentError() const { return m_mainDocumentError; }

    const ResourceResponse& response() const { return m_response; }

    // FIXME: This method seems to violate the encapsulation of this class.
    void setResponse(const ResourceResponse& response) { m_response = response; }

    bool isClientRedirect() const { return m_isClientRedirect; }
    void setIsClientRedirect(bool isClientRedirect) { m_isClientRedirect = isClientRedirect; }
    void dispatchOnloadEvents();
    bool wasOnloadDispatched() { return m_wasOnloadDispatched; }
    WEBCORE_EXPORT bool isLoadingInAPISense() const;
    WEBCORE_EXPORT void setTitle(const StringWithDirection&);
    const String& overrideEncoding() const { return m_overrideEncoding; }

#if PLATFORM(COCOA)
    void schedule(SchedulePair&);
    void unschedule(SchedulePair&);
#endif

#if ENABLE(WEB_ARCHIVE) || ENABLE(MHTML)
    void setArchive(Ref<Archive>&&);
    WEBCORE_EXPORT void addAllArchiveResources(Archive&);
    WEBCORE_EXPORT void addArchiveResource(Ref<ArchiveResource>&&);
    RefPtr<Archive> popArchiveForSubframe(const String& frameName, const URL&);
    WEBCORE_EXPORT SharedBuffer* parsedArchiveData() const;

    bool hasArchiveResourceCollection() const { return !!m_archiveResourceCollection; }
    WEBCORE_EXPORT bool scheduleArchiveLoad(ResourceLoader&, const ResourceRequest&);
#endif

    void scheduleSubstituteResourceLoad(ResourceLoader&, SubstituteResource&);
    void scheduleCannotShowURLError(ResourceLoader&);

    // FrameDestructionObserver.
    WEBCORE_EXPORT void frameDestroyed() final;

    // Return the ArchiveResource for the URL only when loading an Archive
    WEBCORE_EXPORT ArchiveResource* archiveResourceForURL(const URL&) const;

    WEBCORE_EXPORT RefPtr<ArchiveResource> mainResource() const;

    // Return an ArchiveResource for the URL, either creating from live data or
    // pulling from the ArchiveResourceCollection.
    WEBCORE_EXPORT RefPtr<ArchiveResource> subresource(const URL&) const;

    WEBCORE_EXPORT Vector<Ref<ArchiveResource>> subresources() const;

#if ASSERT_ENABLED
    bool isSubstituteLoadPending(ResourceLoader*) const;
#endif
    void cancelPendingSubstituteLoad(ResourceLoader*);   
    
    void addResponse(const ResourceResponse&);
    const Vector<ResourceResponse>& responses() const { return m_responses; }

    const NavigationAction& triggeringAction() const { return m_triggeringAction; }
    void setTriggeringAction(NavigationAction&&);
    void setOverrideEncoding(const String& encoding) { m_overrideEncoding = encoding; }
    void setLastCheckedRequest(ResourceRequest&& request) { m_lastCheckedRequest = WTFMove(request); }
    const ResourceRequest& lastCheckedRequest()  { return m_lastCheckedRequest; }

    void stopRecordingResponses();
    const StringWithDirection& title() const { return m_pageTitle; }

    WEBCORE_EXPORT URL urlForHistory() const;
    WEBCORE_EXPORT bool urlForHistoryReflectsFailure() const;

    // These accessors accommodate WebCore's somewhat fickle custom of creating history
    // items for redirects, but only sometimes. For "source" and "destination",
    // these accessors return the URL that would have been used if a history
    // item were created. This allows WebKit to link history items reflecting
    // redirects into a chain from start to finish.
    String clientRedirectSourceForHistory() const { return m_clientRedirectSourceForHistory; } // null if no client redirect occurred.
    String clientRedirectDestinationForHistory() const { return urlForHistory().string(); }
    void setClientRedirectSourceForHistory(const String& clientRedirectSourceForHistory) { m_clientRedirectSourceForHistory = clientRedirectSourceForHistory; }
    
    String serverRedirectSourceForHistory() const { return (urlForHistory() == url() || url() == aboutBlankURL()) ? String() : urlForHistory().string(); } // null if no server redirect occurred.
    String serverRedirectDestinationForHistory() const { return url().string(); }

    bool didCreateGlobalHistoryEntry() const { return m_didCreateGlobalHistoryEntry; }
    void setDidCreateGlobalHistoryEntry(bool didCreateGlobalHistoryEntry) { m_didCreateGlobalHistoryEntry = didCreateGlobalHistoryEntry; }

    void setDefersLoading(bool);
    void setMainResourceDataBufferingPolicy(DataBufferingPolicy);

    void startLoadingMainResource();
    WEBCORE_EXPORT void cancelMainResourceLoad(const ResourceError&, LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No);
    void willContinueMainResourceLoadAfterRedirect(const ResourceRequest&);

    bool isLoadingMainResource() const { return m_loadingMainResource; }
    bool isLoadingMultipartContent() const { return m_isLoadingMultipartContent; }

    void stopLoadingPlugIns();
    void stopLoadingSubresources();
    WEBCORE_EXPORT void stopLoadingAfterXFrameOptionsOrContentSecurityPolicyDenied(ResourceLoaderIdentifier, const ResourceResponse&);

    const ContentExtensionEnablement& contentExtensionEnablement() const { return m_contentExtensionEnablement; }
    void setContentExtensionEnablement(ContentExtensionEnablement&& enablement) { m_contentExtensionEnablement = WTFMove(enablement); }

    bool allowsActiveContentRuleListActionsForURL(const String& contentRuleListIdentifier, const URL&) const;
    WEBCORE_EXPORT void setActiveContentRuleListActionPatterns(const HashMap<String, Vector<String>>&);

    const Vector<TargetedElementSelectors>& visibilityAdjustmentSelectors() const { return m_visibilityAdjustmentSelectors; }
    void setVisibilityAdjustmentSelectors(Vector<TargetedElementSelectors>&& selectors) { m_visibilityAdjustmentSelectors = WTFMove(selectors); }

#if ENABLE(DEVICE_ORIENTATION)
    DeviceOrientationOrMotionPermissionState deviceOrientationAndMotionAccessState() const { return m_deviceOrientationAndMotionAccessState; }
    void setDeviceOrientationAndMotionAccessState(DeviceOrientationOrMotionPermissionState state) { m_deviceOrientationAndMotionAccessState = state; }
#endif

    AutoplayPolicy autoplayPolicy() const { return m_autoplayPolicy; }
    void setAutoplayPolicy(AutoplayPolicy policy) { m_autoplayPolicy = policy; }

    void setCustomUserAgent(const String& customUserAgent) { m_customUserAgent = customUserAgent; }
    const String& customUserAgent() const { return m_customUserAgent; }

    void setAllowPrivacyProxy(bool allow) { m_allowPrivacyProxy = allow; }
    bool allowPrivacyProxy() const { return m_allowPrivacyProxy; }

    void setCustomUserAgentAsSiteSpecificQuirks(const String& customUserAgent) { m_customUserAgentAsSiteSpecificQuirks = customUserAgent; }
    const String& customUserAgentAsSiteSpecificQuirks() const { return m_customUserAgentAsSiteSpecificQuirks; }

    void setCustomNavigatorPlatform(const String& customNavigatorPlatform) { m_customNavigatorPlatform = customNavigatorPlatform; }
    const String& customNavigatorPlatform() const { return m_customNavigatorPlatform; }

    OptionSet<AutoplayQuirk> allowedAutoplayQuirks() const { return m_allowedAutoplayQuirks; }
    void setAllowedAutoplayQuirks(OptionSet<AutoplayQuirk> allowedQuirks) { m_allowedAutoplayQuirks = allowedQuirks; }

    PopUpPolicy popUpPolicy() const { return m_popUpPolicy; }
    void setPopUpPolicy(PopUpPolicy popUpPolicy) { m_popUpPolicy = popUpPolicy; }

    MetaViewportPolicy metaViewportPolicy() const { return m_metaViewportPolicy; }
    void setMetaViewportPolicy(MetaViewportPolicy policy) { m_metaViewportPolicy = policy; }

    MediaSourcePolicy mediaSourcePolicy() const { return m_mediaSourcePolicy; }
    void setMediaSourcePolicy(MediaSourcePolicy policy) { m_mediaSourcePolicy = policy; }

    SimulatedMouseEventsDispatchPolicy simulatedMouseEventsDispatchPolicy() const { return m_simulatedMouseEventsDispatchPolicy; }
    void setSimulatedMouseEventsDispatchPolicy(SimulatedMouseEventsDispatchPolicy policy) { m_simulatedMouseEventsDispatchPolicy = policy; }

    LegacyOverflowScrollingTouchPolicy legacyOverflowScrollingTouchPolicy() const { return m_legacyOverflowScrollingTouchPolicy; }
    void setLegacyOverflowScrollingTouchPolicy(LegacyOverflowScrollingTouchPolicy policy) { m_legacyOverflowScrollingTouchPolicy = policy; }

    MouseEventPolicy mouseEventPolicy() const { return m_mouseEventPolicy; }
    void setMouseEventPolicy(MouseEventPolicy policy) { m_mouseEventPolicy = policy; }

    ModalContainerObservationPolicy modalContainerObservationPolicy() const { return m_modalContainerObservationPolicy; }
    void setModalContainerObservationPolicy(ModalContainerObservationPolicy policy) { m_modalContainerObservationPolicy = policy; }

    // FIXME: Why is this in a Loader?
    WEBCORE_EXPORT ColorSchemePreference colorSchemePreference() const;
    void setColorSchemePreference(ColorSchemePreference preference) { m_colorSchemePreference = preference; }

    HTTPSByDefaultMode httpsByDefaultMode() { return m_httpsByDefaultMode; }
    WEBCORE_EXPORT void setHTTPSByDefaultMode(HTTPSByDefaultMode);

    PushAndNotificationsEnabledPolicy pushAndNotificationsEnabledPolicy() const { return m_pushAndNotificationsEnabledPolicy; }
    void setPushAndNotificationsEnabledPolicy(PushAndNotificationsEnabledPolicy policy) { m_pushAndNotificationsEnabledPolicy = policy; }

    void addSubresourceLoader(SubresourceLoader&);
    void removeSubresourceLoader(LoadCompletionType, SubresourceLoader&);
    void addPlugInStreamLoader(ResourceLoader&);
    void removePlugInStreamLoader(ResourceLoader&);

    void subresourceLoaderFinishedLoadingOnePart(ResourceLoader&);

    void setDeferMainResourceDataLoad(bool defer) { m_deferMainResourceDataLoad = defer; }
    
    void didTellClientAboutLoad(const String& url);
    bool haveToldClientAboutLoad(const String& url) { return m_resourcesClientKnowsAbout.contains(url); }
    void recordMemoryCacheLoadForFutureClientNotification(const ResourceRequest&);
    void takeMemoryCacheLoadsForClientNotification(Vector<ResourceRequest>& loads);

    const DocumentLoadTiming& timing() const { return m_loadTiming; }
    DocumentLoadTiming& timing() { return m_loadTiming; }
    void resetTiming() { m_loadTiming = { }; }

    // The WebKit layer calls this function when it's ready for the data to actually be added to the document.
    WEBCORE_EXPORT void commitData(const SharedBuffer&);

    ApplicationCacheHost& applicationCacheHost() const;
    ApplicationCacheHost* applicationCacheHostUnlessBeingDestroyed() const;

    void checkLoadComplete();

    // The URL of the document resulting from this DocumentLoader.
    URL documentURL() const;

#if USE(QUICK_LOOK)
    void setPreviewConverter(RefPtr<PreviewConverter>&&);
    PreviewConverter* previewConverter() const;
#endif

#if ENABLE(CONTENT_EXTENSIONS)
    void addPendingContentExtensionSheet(const String& identifier, StyleSheetContents&);
    void addPendingContentExtensionDisplayNoneSelector(const String& identifier, const String& selector, uint32_t selectorID);
#endif

    void setShouldOpenExternalURLsPolicy(ShouldOpenExternalURLsPolicy shouldOpenExternalURLsPolicy) { m_shouldOpenExternalURLsPolicy = shouldOpenExternalURLsPolicy; }
    ShouldOpenExternalURLsPolicy shouldOpenExternalURLsPolicyToPropagate() const;

    WEBCORE_EXPORT void setRedirectionAsSubstituteData(ResourceResponse&&);

#if ENABLE(CONTENT_FILTERING)
    void setBlockedPageURL(const URL& blockedPageURL) { m_blockedPageURL = blockedPageURL; }
    void setSubstituteDataFromContentFilter(SubstituteData&& substituteDataFromContentFilter) { m_substituteDataFromContentFilter = WTFMove(substituteDataFromContentFilter); }
    ContentFilter* contentFilter() const { return m_contentFilter.get(); }

    WEBCORE_EXPORT ResourceError handleContentFilterDidBlock(ContentFilterUnblockHandler, String&& unblockRequestDeniedScript);
#endif

    void startIconLoading();
    WEBCORE_EXPORT void didGetLoadDecisionForIcon(bool decision, uint64_t loadIdentifier, CompletionHandler<void(FragmentedSharedBuffer*)>&&);
    void finishedLoadingIcon(IconLoader&, FragmentedSharedBuffer*);

    const Vector<LinkIcon>& linkIcons() const { return m_linkIcons; }

#if ENABLE(APPLICATION_MANIFEST)
    WEBCORE_EXPORT void loadApplicationManifest(CompletionHandler<void(const std::optional<ApplicationManifest>&)>&&);
    void finishedLoadingApplicationManifest(ApplicationManifestLoader&);
#endif

    WEBCORE_EXPORT void setCustomHeaderFields(Vector<CustomHeaderFields>&&);
    const Vector<CustomHeaderFields>& customHeaderFields() const { return m_customHeaderFields; }

    bool allowsWebArchiveForMainFrame() const { return m_isRequestFromClientOrUserInput; }
    bool allowsDataURLsForMainFrame() const { return m_isRequestFromClientOrUserInput; }

    const AtomString& downloadAttribute() const { return m_triggeringAction.downloadAttribute(); }

    WEBCORE_EXPORT void applyPoliciesToSettings();

    void setAdvancedPrivacyProtections(OptionSet<AdvancedPrivacyProtections> policy) { m_advancedPrivacyProtections = policy; }
    OptionSet<AdvancedPrivacyProtections> advancedPrivacyProtections() const { return m_advancedPrivacyProtections; }

    void setOriginatorAdvancedPrivacyProtections(OptionSet<AdvancedPrivacyProtections> policy) { m_originatorAdvancedPrivacyProtections = policy; }
    OptionSet<AdvancedPrivacyProtections> navigationalAdvancedPrivacyProtections() const { return m_originatorAdvancedPrivacyProtections.value_or(m_advancedPrivacyProtections); }
    std::optional<OptionSet<AdvancedPrivacyProtections>> originatorAdvancedPrivacyProtections() const { return m_originatorAdvancedPrivacyProtections; }

    void setIdempotentModeAutosizingOnlyHonorsPercentages(bool idempotentModeAutosizingOnlyHonorsPercentages) { m_idempotentModeAutosizingOnlyHonorsPercentages = idempotentModeAutosizingOnlyHonorsPercentages; }
    bool idempotentModeAutosizingOnlyHonorsPercentages() const { return m_idempotentModeAutosizingOnlyHonorsPercentages; }

    WEBCORE_EXPORT bool setControllingServiceWorkerRegistration(ServiceWorkerRegistrationData&&);
    std::optional<ScriptExecutionContextIdentifier> resultingClientId() const { return m_resultingClientId; }

    bool lastNavigationWasAppInitiated() const { return m_lastNavigationWasAppInitiated; }
    void setLastNavigationWasAppInitiated(bool lastNavigationWasAppInitiated) { m_lastNavigationWasAppInitiated = lastNavigationWasAppInitiated; }

    ContentSecurityPolicy* contentSecurityPolicy() const { return m_contentSecurityPolicy.get(); }
    const std::optional<CrossOriginOpenerPolicy>& crossOriginOpenerPolicy() const { return m_responseCOOP; }
    OptionSet<ClearSiteDataValue> responseClearSiteDataValues() const { return m_responseClearSiteDataValues; }

    bool isContinuingLoadAfterProvisionalLoadStarted() const { return m_isContinuingLoadAfterProvisionalLoadStarted; }
    void setIsContinuingLoadAfterProvisionalLoadStarted(bool isContinuingLoadAfterProvisionalLoadStarted) { m_isContinuingLoadAfterProvisionalLoadStarted = isContinuingLoadAfterProvisionalLoadStarted; }

    bool isRequestFromClientOrUserInput() const { return m_isRequestFromClientOrUserInput; }
    void setIsRequestFromClientOrUserInput(bool isRequestFromClientOrUserInput) { m_isRequestFromClientOrUserInput = isRequestFromClientOrUserInput; }

    bool isInFinishedLoadingOfEmptyDocument() const { return m_isInFinishedLoadingOfEmptyDocument; }
#if ENABLE(CONTENT_FILTERING)
    bool contentFilterWillHandleProvisionalLoadFailure(const ResourceError&);
    void contentFilterHandleProvisionalLoadFailure(const ResourceError&);
#endif

    std::optional<NavigationIdentifier> navigationID() const { return m_navigationID.asOptional(); }
    WEBCORE_EXPORT void setNavigationID(NavigationIdentifier);

    bool isInitialAboutBlank() const { return m_isInitialAboutBlank; }

    bool navigationCanTriggerCrossDocumentViewTransition(Document& oldDocument, bool fromBackForwardCache);
    WEBCORE_EXPORT void whenDocumentIsCreated(Function<void(Document*)>&&);

protected:
    WEBCORE_EXPORT DocumentLoader(const ResourceRequest&, const SubstituteData&);

    WEBCORE_EXPORT virtual void attachToFrame();

private:
    Document* document() const;

    void matchRegistration(const URL&, CompletionHandler<void(std::optional<ServiceWorkerRegistrationData>&&)>&&);
    void unregisterReservedServiceWorkerClient();

    std::optional<CrossOriginOpenerPolicyEnforcementResult> doCrossOriginOpenerHandlingOfResponse(const ResourceResponse&);

    void loadMainResource(ResourceRequest&&);

    void setRequest(const ResourceRequest&);

    void commitIfReady();
    void setMainDocumentError(const ResourceError&);
    void commitLoad(const SharedBuffer&);
    void clearMainResourceLoader();

    void setupForReplace();
    void maybeFinishLoadingMultipartContent();
    
    bool maybeCreateArchive();
#if ENABLE(WEB_ARCHIVE) || ENABLE(MHTML)
    void clearArchiveResources();
#endif

    void willSendRequest(ResourceRequest&&, const ResourceResponse&, CompletionHandler<void(ResourceRequest&&)>&&);
    void finishedLoading();
    void mainReceivedError(const ResourceError&, LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No);
    WEBCORE_EXPORT void redirectReceived(CachedResource&, ResourceRequest&&, const ResourceResponse&, CompletionHandler<void(ResourceRequest&&)>&&) override;
    WEBCORE_EXPORT void responseReceived(CachedResource&, const ResourceResponse&, CompletionHandler<void()>&&) override;
    WEBCORE_EXPORT void dataReceived(CachedResource&, const SharedBuffer&) override;
    WEBCORE_EXPORT void notifyFinished(CachedResource&, const NetworkLoadMetrics&, LoadWillContinueInAnotherProcess) override;
#if USE(QUICK_LOOK)
    WEBCORE_EXPORT void previewResponseReceived(CachedResource&, const ResourceResponse&) override;
#endif

    void responseReceived(const ResourceResponse&, CompletionHandler<void()>&&);

#if ENABLE(CONTENT_FILTERING)
    // ContentFilterClient
    WEBCORE_EXPORT void dataReceivedThroughContentFilter(const SharedBuffer&, size_t) final;
    WEBCORE_EXPORT ResourceError contentFilterDidBlock(ContentFilterUnblockHandler, String&& unblockRequestDeniedScript) final;
    WEBCORE_EXPORT void cancelMainResourceLoadForContentFilter(const ResourceError&) final;
    WEBCORE_EXPORT void handleProvisionalLoadFailureFromContentFilter(const URL& blockedPageURL, SubstituteData&) final;
#endif

    void redirectReceived(ResourceRequest&&, const ResourceResponse&, CompletionHandler<void(ResourceRequest&&)>&&);

    void dataReceived(const SharedBuffer&);

    bool maybeLoadEmpty();
    void loadErrorDocument();

    bool shouldClearContentSecurityPolicyForResponse(const ResourceResponse&) const;

    bool isMultipartReplacingLoad() const;
    bool isPostOrRedirectAfterPost(const ResourceRequest&, const ResourceResponse&);

    bool tryLoadingRequestFromApplicationCache();
    bool tryLoadingSubstituteData();
    bool tryLoadingRedirectRequestFromApplicationCache(const ResourceRequest&);
    void continueAfterContentPolicy(PolicyAction);

    void stopLoadingForPolicyChange(LoadWillContinueInAnotherProcess = LoadWillContinueInAnotherProcess::No);
    ResourceError interruptedForPolicyChangeError() const;

    void handleSubstituteDataLoadNow();

    void deliverSubstituteResourcesAfterDelay();
    void substituteResourceDeliveryTimerFired();

    void clearMainResource();

    void cancelPolicyCheckIfNeeded();
    void becomeMainResourceClient();

#if ENABLE(APPLICATION_MANIFEST)
    void notifyFinishedLoadingApplicationManifest();
#endif

    // ContentSecurityPolicyClient
    WEBCORE_EXPORT void addConsoleMessage(MessageSource, MessageLevel, const String&, unsigned long requestIdentifier) final;
    WEBCORE_EXPORT void enqueueSecurityPolicyViolationEvent(SecurityPolicyViolationEventInit&&) final;

    bool disallowWebArchive() const;
    bool disallowDataRequest() const;

    Ref<CachedResourceLoader> m_cachedResourceLoader;

    CachedResourceHandle<CachedRawResource> m_mainResource;
    ResourceLoaderMap m_subresourceLoaders;
    ResourceLoaderMap m_multipartSubresourceLoaders;
    ResourceLoaderMap m_plugInStreamLoaders;
    
    mutable DocumentWriter m_writer;

    // A reference to actual request used to create the data source.
    // This should only be used by the resourceLoadDelegate's
    // identifierForInitialRequest:fromDatasource: method. It is
    // not guaranteed to remain unchanged, as requests are mutable.
    ResourceRequest m_originalRequest;   

    SubstituteData m_substituteData;

    // A copy of the original request used to create the data source.
    // We have to copy the request because requests are mutable.
    ResourceRequest m_originalRequestCopy;
    
    // The 'working' request. It may be mutated
    // several times from the original request to include additional
    // headers, cookie information, canonicalization and redirects.
    ResourceRequest m_request;

    // The last request that we checked click policy for - kept around
    // so we can avoid asking again needlessly.
    ResourceRequest m_lastCheckedRequest;

    ResourceResponse m_response;

    ResourceError m_mainDocumentError;    

    StringWithDirection m_pageTitle;
    String m_overrideEncoding;

    // The action that triggered loading - we keep this around for the
    // benefit of the various policy handlers.
    NavigationAction m_triggeringAction;

    Markable<NavigationIdentifier> m_navigationID;

    // We retain all the received responses so we can play back the
    // WebResourceLoadDelegate messages if the item is loaded from the
    // back/forward cache.
    Vector<ResourceResponse> m_responses;

    std::optional<CrossOriginOpenerPolicy> m_responseCOOP;
    OptionSet<ClearSiteDataValue> m_responseClearSiteDataValues;
    
    typedef HashMap<RefPtr<ResourceLoader>, RefPtr<SubstituteResource>> SubstituteResourceMap;
    SubstituteResourceMap m_pendingSubstituteResources;
    Timer m_substituteResourceDeliveryTimer;

    std::unique_ptr<ArchiveResourceCollection> m_archiveResourceCollection;
#if ENABLE(WEB_ARCHIVE) || ENABLE(MHTML)
    RefPtr<Archive> m_archive;
    RefPtr<SharedBuffer> m_parsedArchiveData;
#endif

    MemoryCompactRobinHoodHashSet<String> m_resourcesClientKnowsAbout;
    Vector<ResourceRequest> m_resourcesLoadedFromMemoryCacheForClientNotification;
    
    String m_clientRedirectSourceForHistory;
    DocumentLoadTiming m_loadTiming;

    Markable<ResourceLoaderIdentifier> m_identifierForLoadWithoutResourceLoader;

    DataLoadToken m_dataLoadToken;

    HashMap<uint64_t, LinkIcon> m_iconsPendingLoadDecision;
    HashMap<std::unique_ptr<IconLoader>, CompletionHandler<void(FragmentedSharedBuffer*)>> m_iconLoaders;
    Vector<LinkIcon> m_linkIcons;

#if ENABLE(APPLICATION_MANIFEST)
    std::unique_ptr<ApplicationManifestLoader> m_applicationManifestLoader;
    Vector<CompletionHandler<void(const std::optional<ApplicationManifest>&)>> m_loadApplicationManifestCallbacks;
#endif

    Vector<CustomHeaderFields> m_customHeaderFields;

    std::unique_ptr<ApplicationCacheHost> m_applicationCacheHost;
    std::unique_ptr<ContentSecurityPolicy> m_contentSecurityPolicy;

#if ENABLE(CONTENT_FILTERING)
    std::unique_ptr<ContentFilter> m_contentFilter;
    ResourceError m_blockedError;
    URL m_blockedPageURL;
    SubstituteData m_substituteDataFromContentFilter;
#endif // ENABLE(CONTENT_FILTERING)

#if USE(QUICK_LOOK)
    RefPtr<PreviewConverter> m_previewConverter;
#endif

#if ENABLE(CONTENT_EXTENSIONS)
    MemoryCompactRobinHoodHashMap<String, RefPtr<StyleSheetContents>> m_pendingNamedContentExtensionStyleSheets;
    MemoryCompactRobinHoodHashMap<String, Vector<std::pair<String, uint32_t>>> m_pendingContentExtensionDisplayNoneSelectors;
#endif
    String m_customUserAgent;
    String m_customUserAgentAsSiteSpecificQuirks;
    String m_customNavigatorPlatform;
    MemoryCompactRobinHoodHashMap<String, Vector<UserContentURLPattern>> m_activeContentRuleListActionPatterns;
    ContentExtensionEnablement m_contentExtensionEnablement { ContentExtensionDefaultEnablement::Enabled, { } };

    Vector<TargetedElementSelectors> m_visibilityAdjustmentSelectors;

    Markable<ScriptExecutionContextIdentifier> m_resultingClientId;

    std::unique_ptr<ServiceWorkerRegistrationData> m_serviceWorkerRegistrationData;

#if ENABLE(DEVICE_ORIENTATION)
    DeviceOrientationOrMotionPermissionState m_deviceOrientationAndMotionAccessState { DeviceOrientationOrMotionPermissionState::Prompt };
#endif

    OptionSet<AdvancedPrivacyProtections> m_advancedPrivacyProtections;
    std::optional<OptionSet<AdvancedPrivacyProtections>> m_originatorAdvancedPrivacyProtections;
    AutoplayPolicy m_autoplayPolicy { AutoplayPolicy::Default };
    OptionSet<AutoplayQuirk> m_allowedAutoplayQuirks;
    PopUpPolicy m_popUpPolicy { PopUpPolicy::Default };
    MetaViewportPolicy m_metaViewportPolicy { MetaViewportPolicy::Default };
    MediaSourcePolicy m_mediaSourcePolicy { MediaSourcePolicy::Default };
    SimulatedMouseEventsDispatchPolicy m_simulatedMouseEventsDispatchPolicy { SimulatedMouseEventsDispatchPolicy::Default };
    LegacyOverflowScrollingTouchPolicy m_legacyOverflowScrollingTouchPolicy { LegacyOverflowScrollingTouchPolicy::Default };
    MouseEventPolicy m_mouseEventPolicy { MouseEventPolicy::Default };
    ModalContainerObservationPolicy m_modalContainerObservationPolicy { ModalContainerObservationPolicy::Disabled };
    ColorSchemePreference m_colorSchemePreference { ColorSchemePreference::NoPreference };
    HTTPSByDefaultMode m_httpsByDefaultMode { HTTPSByDefaultMode::Disabled };
    ShouldOpenExternalURLsPolicy m_shouldOpenExternalURLsPolicy { ShouldOpenExternalURLsPolicy::ShouldNotAllow };
    PushAndNotificationsEnabledPolicy m_pushAndNotificationsEnabledPolicy { PushAndNotificationsEnabledPolicy::UseGlobalPolicy };

    bool m_idempotentModeAutosizingOnlyHonorsPercentages { false };

    bool m_isRequestFromClientOrUserInput { false };
    bool m_lastNavigationWasAppInitiated { true };
    bool m_allowPrivacyProxy { true };

    bool m_deferMainResourceDataLoad { true };

    bool m_originalSubstituteDataWasValid { false };
    bool m_committed { false };
    bool m_isStopping { false };
    bool m_gotFirstByte { false };
    bool m_isClientRedirect { false };
    bool m_isLoadingMultipartContent { false };
    bool m_isContinuingLoadAfterProvisionalLoadStarted { false };
    bool m_isInFinishedLoadingOfEmptyDocument { false };
    bool m_isInitialAboutBlank { false };

    // FIXME: Document::m_processingLoadEvent and DocumentLoader::m_wasOnloadDispatched are roughly the same
    // and should be merged.
    bool m_wasOnloadDispatched { false };
    bool m_stopRecordingResponses { false };
    bool m_didCreateGlobalHistoryEntry { false };
    bool m_loadingMainResource { false };

    bool m_waitingForContentPolicy { false };
    bool m_waitingForNavigationPolicy { false };

#if ENABLE(APPLICATION_MANIFEST)
    bool m_finishedLoadingApplicationManifest { false };
#endif

#if ENABLE(CONTENT_FILTERING)
    bool m_blockedByContentFilter { false };
#endif

    bool m_canUseServiceWorkers { true };

    Function<void(Document*)> m_whenDocumentIsCreatedCallback;

#if ASSERT_ENABLED
    bool m_hasEverBeenAttached { false };
#endif
};

inline void DocumentLoader::recordMemoryCacheLoadForFutureClientNotification(const ResourceRequest& request)
{
    m_resourcesLoadedFromMemoryCacheForClientNotification.append(request);
}

inline void DocumentLoader::takeMemoryCacheLoadsForClientNotification(Vector<ResourceRequest>& loadsSet)
{
    loadsSet.swap(m_resourcesLoadedFromMemoryCacheForClientNotification);
    m_resourcesLoadedFromMemoryCacheForClientNotification.clear();
}

inline const ResourceRequest& DocumentLoader::originalRequest() const
{
    return m_originalRequest;
}

inline const ResourceRequest& DocumentLoader::originalRequestCopy() const
{
    return m_originalRequestCopy;
}

inline const ResourceRequest& DocumentLoader::request() const
{
    return m_request;
}

inline ResourceRequest& DocumentLoader::request()
{
    return m_request;
}

inline const URL& DocumentLoader::url() const
{
    return m_request.url();
}

inline const URL& DocumentLoader::originalURL() const
{
    return m_originalRequestCopy.url();
}

inline const URL& DocumentLoader::responseURL() const
{
    return m_response.url();
}

inline const String& DocumentLoader::responseMIMEType() const
{
    return m_response.mimeType();
}

inline const String& DocumentLoader::currentContentType() const
{
    return m_writer.mimeType();
}

inline const URL& DocumentLoader::unreachableURL() const
{
    return m_substituteData.failingURL();
}

inline ApplicationCacheHost& DocumentLoader::applicationCacheHost() const
{
    // For a short time while the document loader is being destroyed, m_applicationCacheHost is null.
    // It's not acceptable to call this function during that time.
    ASSERT(m_applicationCacheHost);
    return *m_applicationCacheHost;
}

inline ApplicationCacheHost* DocumentLoader::applicationCacheHostUnlessBeingDestroyed() const
{
    return m_applicationCacheHost.get();
}

inline void DocumentLoader::didTellClientAboutLoad(const String& url)
{
#if !PLATFORM(COCOA)
    // Don't include data URLs here, as if a lot of data is loaded that way, we hold on to the (large) URL string for too long.
    if (protocolIs(url, "data"_s))
        return;
#endif
    if (!url.isEmpty())
        m_resourcesClientKnowsAbout.add(url);
}

} // namespace WebCore
