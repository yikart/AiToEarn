/*
 * Copyright (C) 2018-2022 Apple Inc. All rights reserved.
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

#include "Event.h"
#include "QuirksData.h"
#include <optional>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class Document;
class Element;
class EventListener;
class EventTarget;
class EventTypeInfo;
class HTMLElement;
class HTMLVideoElement;
class LayoutUnit;
class LocalFrame;
class Node;
class PlatformMouseEvent;
class RegistrableDomain;
class ResourceRequest;
class RenderStyle;
class SecurityOriginData;
class WeakPtrImplWithEventTargetData;

enum class IsSyntheticClick : bool;
enum class StorageAccessWasGranted : uint8_t;

class Quirks {
    WTF_MAKE_TZONE_ALLOCATED(Quirks);
    WTF_MAKE_NONCOPYABLE(Quirks);
public:
    Quirks(Document&);
    ~Quirks();

    bool shouldSilenceResizeObservers() const;
    bool shouldSilenceWindowResizeEvents() const;
    bool shouldSilenceMediaQueryListChangeEvents() const;
    bool shouldIgnoreInvalidSignal() const;
    bool needsFormControlToBeMouseFocusable() const;
    bool needsAutoplayPlayPauseEvents() const;
    bool needsSeekingSupportDisabled() const;
    bool needsPerDocumentAutoplayBehavior() const;
    bool shouldAutoplayWebAudioForArbitraryUserGesture() const;
    bool hasBrokenEncryptedMediaAPISupportQuirk() const;
#if ENABLE(TOUCH_EVENTS)
    bool shouldDispatchSimulatedMouseEvents(const EventTarget*) const;
    bool shouldDispatchedSimulatedMouseEventsAssumeDefaultPrevented(EventTarget*) const;
    bool shouldPreventDispatchOfTouchEvent(const AtomString&, EventTarget*) const;
#endif
    bool shouldDisablePointerEventsQuirk() const;
    bool needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommand() const;
    bool shouldExposeShowModalDialog() const;
    bool shouldNavigatorPluginsBeEmpty() const;
    bool returnNullPictureInPictureElementDuringFullscreenChange() const;

    bool shouldPreventOrientationMediaQueryFromEvaluatingToLandscape() const;
    bool shouldFlipScreenDimensions() const;
    bool shouldAllowDownloadsInSpiteOfCSP() const;

    WEBCORE_EXPORT bool shouldDispatchSyntheticMouseEventsWhenModifyingSelection() const;
    WEBCORE_EXPORT bool shouldSuppressAutocorrectionAndAutocapitalizationInHiddenEditableAreas() const;
    WEBCORE_EXPORT bool isTouchBarUpdateSuppressedForHiddenContentEditable() const;
    WEBCORE_EXPORT bool isNeverRichlyEditableForTouchBar() const;
    WEBCORE_EXPORT bool shouldAvoidResizingWhenInputViewBoundsChange() const;
    WEBCORE_EXPORT bool shouldAvoidScrollingWhenFocusedContentIsVisible() const;
    WEBCORE_EXPORT bool shouldUseLegacySelectPopoverDismissalBehaviorInDataActivation() const;
    WEBCORE_EXPORT bool shouldIgnoreAriaForFastPathContentObservationCheck() const;
    WEBCORE_EXPORT bool shouldIgnoreViewportArgumentsToAvoidExcessiveZoom() const;
    WEBCORE_EXPORT bool shouldLayOutAtMinimumWindowWidthWhenIgnoringScalingConstraints() const;
    WEBCORE_EXPORT static bool shouldAllowNavigationToCustomProtocolWithoutUserGesture(StringView protocol, const SecurityOriginData& requesterOrigin);

    WEBCORE_EXPORT bool needsYouTubeMouseOutQuirk() const;

    WEBCORE_EXPORT bool shouldDisableWritingSuggestionsByDefault() const;

    WEBCORE_EXPORT static void updateStorageAccessUserAgentStringQuirks(HashMap<RegistrableDomain, String>&&);
    WEBCORE_EXPORT String storageAccessUserAgentStringQuirkForDomain(const URL&);
    WEBCORE_EXPORT static bool needsIPadMiniUserAgent(const URL&);
    WEBCORE_EXPORT static bool needsIPhoneUserAgent(const URL&);
    WEBCORE_EXPORT static bool needsDesktopUserAgent(const URL&);

    WEBCORE_EXPORT static bool needsPartitionedCookies(const ResourceRequest&);

    WEBCORE_EXPORT static std::optional<Vector<HashSet<String>>> defaultVisibilityAdjustmentSelectors(const URL&);

    bool needsGMailOverflowScrollQuirk() const;
    bool needsIPadSkypeOverflowScrollQuirk() const;
    bool needsYouTubeOverflowScrollQuirk() const;
    bool needsFullscreenDisplayNoneQuirk() const;
    bool needsFullscreenObjectFitQuirk() const;
    bool needsWeChatScrollingQuirk() const;
    bool needsGoogleMapsScrollingQuirk() const;

    bool needsPrimeVideoUserSelectNoneQuirk() const;

    bool needsScrollbarWidthThinDisabledQuirk() const;
    bool needsBodyScrollbarWidthNoneDisabledQuirk() const;

    bool shouldOpenAsAboutBlank(const String&) const;

    bool needsPreloadAutoQuirk() const;

    bool shouldBypassBackForwardCache() const;
    bool shouldBypassAsyncScriptDeferring() const;

    static bool shouldMakeEventListenerPassive(const EventTarget&, const EventTypeInfo&);

#if ENABLE(MEDIA_STREAM)
    bool shouldEnableLegacyGetUserMediaQuirk() const;
    bool shouldDisableImageCaptureQuirk() const;
#endif

    bool needsCanPlayAfterSeekedQuirk() const;

    bool shouldAvoidPastingImagesAsWebContent() const;

    enum StorageAccessResult : bool { ShouldNotCancelEvent, ShouldCancelEvent };
    enum ShouldDispatchClick : bool { No, Yes };

    void triggerOptionalStorageAccessIframeQuirk(const URL& frameURL, CompletionHandler<void()>&&) const;
    StorageAccessResult triggerOptionalStorageAccessQuirk(Element&, const PlatformMouseEvent&, const AtomString& eventType, int, Element*, bool isParentProcessAFullWebBrowser, IsSyntheticClick) const;
    void setSubFrameDomainsForStorageAccessQuirk(Vector<RegistrableDomain>&& domains) { m_subFrameDomainsForStorageAccessQuirk = WTFMove(domains); }
    const Vector<RegistrableDomain>& subFrameDomainsForStorageAccessQuirk() const { return m_subFrameDomainsForStorageAccessQuirk; }

    bool needsVP9FullRangeFlagQuirk() const;

    bool requiresUserGestureToPauseInPictureInPicture() const;
    bool requiresUserGestureToLoadInPictureInPicture() const;

    WEBCORE_EXPORT bool blocksReturnToFullscreenFromPictureInPictureQuirk() const;
    WEBCORE_EXPORT bool blocksEnteringStandardFullscreenFromPictureInPictureQuirk() const;
    bool shouldDisableEndFullscreenEventWhenEnteringPictureInPictureFromFullscreenQuirk() const;
    bool shouldDelayFullscreenEventWhenExitingPictureInPictureQuirk() const;

    static bool isMicrosoftTeamsRedirectURL(const URL&);
    static bool hasStorageAccessForAllLoginDomains(const HashSet<RegistrableDomain>&, const RegistrableDomain&);
    StorageAccessResult requestStorageAccessAndHandleClick(CompletionHandler<void(ShouldDispatchClick)>&&) const;

#if ENABLE(TOUCH_EVENTS)
    WEBCORE_EXPORT static bool shouldOmitTouchEventDOMAttributesForDesktopWebsite(const URL&);
    bool shouldDispatchPointerOutAfterHandlingSyntheticClick() const;
#endif

    WEBCORE_EXPORT void setTopDocumentURLForTesting(URL&&);

    static bool shouldOmitHTMLDocumentSupportedPropertyNames();

#if PLATFORM(IOS) || PLATFORM(VISION)
    WEBCORE_EXPORT bool allowLayeredFullscreenVideos() const;
#endif
    bool shouldEnableApplicationCacheQuirk() const;
    bool shouldEnableFontLoadingAPIQuirk() const;
    bool needsVideoShouldMaintainAspectRatioQuirk() const;

#if ENABLE(TEXT_AUTOSIZING)
    bool shouldIgnoreTextAutoSizing() const;
#endif

#if PLATFORM(VISION)
    WEBCORE_EXPORT bool shouldDisableFullscreenVideoAspectRatioAdaptiveSizing() const;
#endif

    bool shouldDisableLazyIframeLoadingQuirk() const;

    bool shouldDisableFetchMetadata() const;
    bool shouldDisablePushStateFilePathRestrictions() const;

    void setNeedsConfigurableIndexedPropertiesQuirk() { m_needsConfigurableIndexedPropertiesQuirk = true; }
    bool needsConfigurableIndexedPropertiesQuirk() const;

    // webkit.org/b/259091.
    bool needsToCopyUserSelectNoneQuirk() const { return m_needsToCopyUserSelectNoneQuirk; }
    void setNeedsToCopyUserSelectNoneQuirk() { m_needsToCopyUserSelectNoneQuirk = true; }

    bool shouldEnableCanvas2DAdvancedPrivacyProtectionQuirk() const;
    String advancedPrivacyProtectionSubstituteDataURLForScriptWithFeatures(const String& lastDrawnText, int canvasWidth, int canvasHeight) const;

    bool needsResettingTransitionCancelsRunningTransitionQuirk() const;

    bool shouldDisableDataURLPaddingValidation() const;

    bool needsDisableDOMPasteAccessQuirk() const;

    bool shouldDisableElementFullscreenQuirk() const;
    bool shouldIgnorePlaysInlineRequirementQuirk() const;
    WEBCORE_EXPORT bool shouldUseEphemeralPartitionedStorageForDOMCookies(const URL&) const;

    bool needsGetElementsByNameQuirk() const;
    bool needsRelaxedCorsMixedContentCheckQuirk() const;
    bool needsLaxSameSiteCookieQuirk(const URL&) const;

    String scriptToEvaluateBeforeRunningScriptFromURL(const URL&);

    bool shouldHideCoarsePointerCharacteristics() const;

    bool implicitMuteWhenVolumeSetToZero() const;

    bool needsZeroMaxTouchPointsQuirk() const;
    bool needsChromeMediaControlsPseudoElement() const;

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT bool shouldIgnoreContentObservationForClick(const Node&) const;
    WEBCORE_EXPORT bool shouldSynthesizeTouchEventsAfterNonSyntheticClick(const Element&) const;
    WEBCORE_EXPORT bool needsPointerTouchCompatibility(const Element&) const;
#endif

    bool needsMozillaFileTypeForDataTransfer() const;

    bool needsBingGestureEventQuirk(EventTarget*) const;

    bool shouldAvoidStartingSelectionOnMouseDown(const Node&) const;

    bool needsFacebookStoriesCreationFormQuirk(const Element&, const RenderStyle&) const;

private:
    bool needsQuirks() const;
    bool isDomain(const String&) const;
    bool domainStartsWith(const String&) const;
    bool isEmbedDomain(const String&) const;
    bool isYoutubeEmbedDomain() const;

    void determineRelevantQuirks();

    static bool domainNeedsAvoidResizingWhenInputViewBoundsChangeQuirk(const URL&, QuirksData&);
    static bool domainNeedsScrollbarWidthThinDisabledQuirk(const URL&, QuirksData&);
#if ENABLE(VIDEO_PRESENTATION_MODE)
    static bool domainShouldDisableEndFullscreenEventWhenEnteringPictureInPictureFromFullscreenQuirk(const URL&, QuirksData&);
#endif

    RefPtr<Document> protectedDocument() const;

    URL topDocumentURL() const;

    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document;
    mutable WeakPtr<const Element, WeakPtrImplWithEventTargetData> m_facebookStoriesCreationFormContainer;

    mutable QuirksData m_quirksData;

    bool m_needsConfigurableIndexedPropertiesQuirk { false };
    bool m_needsToCopyUserSelectNoneQuirk { false };

    Vector<RegistrableDomain> m_subFrameDomainsForStorageAccessQuirk;
    URL m_topDocumentURLForTesting;
};

} // namespace WebCore
