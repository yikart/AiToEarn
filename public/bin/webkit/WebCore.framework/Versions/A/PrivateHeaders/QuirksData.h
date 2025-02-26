/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

namespace WebCore {

struct WEBCORE_EXPORT QuirksData {
    bool isAmazon { false };
    bool isBankOfAmerica { false };
    bool isBing { false };
    bool isCBSSports { false };
    bool isESPN { false };
    bool isFacebook { false };
    bool isGoogleDocs { false };
    bool isGoogleProperty { false };
    bool isGoogleMaps { false };
    bool isNetflix { false };
    bool isSoundCloud { false };
    bool isSpotify { false };
    bool isThesaurus { false };
    bool isVimeo { false };
    bool isWebEx { false };
    bool isYouTube { false };
    bool isZoom { false };

    bool hasBrokenEncryptedMediaAPISupportQuirk { false };
    bool implicitMuteWhenVolumeSetToZero { false };
    bool maybeBypassBackForwardCache { false };
    bool needsBingGestureEventQuirk { false };
    bool needsBodyScrollbarWidthNoneDisabledQuirk { false };
    bool needsCanPlayAfterSeekedQuirk { false };
    bool needsChromeMediaControlsPseudoElementQuirk { false };
    bool needsMozillaFileTypeForDataTransferQuirk { false };
    bool needsRelaxedCorsMixedContentCheckQuirk { false };
    bool needsResettingTransitionCancelsRunningTransitionQuirk { false };
    bool needsScrollbarWidthThinDisabledQuirk { false };
    bool needsSeekingSupportDisabledQuirk { false };
    bool needsVP9FullRangeFlagQuirk { false };
    bool needsVideoShouldMaintainAspectRatioQuirk { false };
    bool returnNullPictureInPictureElementDuringFullscreenChangeQuirk { false };
    bool shouldAllowDownloadsInSpiteOfCSPQuirk { false };
    bool shouldAutoplayWebAudioForArbitraryUserGestureQuirk { false };
    bool shouldAvoidResizingWhenInputViewBoundsChangeQuirk { false };
    bool shouldAvoidScrollingWhenFocusedContentIsVisibleQuirk { false };
    bool shouldBypassAsyncScriptDeferring { false };
    bool shouldDisableDataURLPaddingValidation { false };
    bool shouldDisableElementFullscreen { false };
    bool shouldDisableFetchMetadata { false };
    bool shouldDisableLazyIframeLoadingQuirk { false };
    bool shouldDisablePushStateFilePathRestrictions { false };
    bool shouldDisableWritingSuggestionsByDefaultQuirk { false };
    bool shouldDispatchSyntheticMouseEventsWhenModifyingSelectionQuirk { false };
    bool shouldDispatchedSimulatedMouseEventsAssumeDefaultPreventedQuirk { false };
    bool shouldEnableFontLoadingAPIQuirk { false };
    bool shouldExposeShowModalDialog { false };
    bool shouldIgnorePlaysInlineRequirementQuirk { false };
    bool shouldLayOutAtMinimumWindowWidthWhenIgnoringScalingConstraintsQuirk { false };
    bool shouldPreventOrientationMediaQueryFromEvaluatingToLandscapeQuirk { false };
    bool shouldUseLegacySelectPopoverDismissalBehaviorInDataActivationQuirk { false };

    // Requires check at moment of use
    std::optional<bool> needsDisableDOMPasteAccessQuirk;

#if PLATFORM(IOS_FAMILY)
    bool mayNeedToIgnoreContentObservation { false };
    bool needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk { false };
    bool needsFullscreenDisplayNoneQuirk { false };
    bool needsFullscreenObjectFitQuirk { false };
    bool needsGMailOverflowScrollQuirk { false };
    bool needsGoogleMapsScrollingQuirk { false };
    bool needsIPadSkypeOverflowScrollQuirk { false };
    bool needsPreloadAutoQuirk { false };
    bool needsScriptToEvaluateBeforeRunningScriptFromURLQuirk { false };
    bool needsYouTubeMouseOutQuirk { false };
    bool needsYouTubeOverflowScrollQuirk { false };
    bool shouldAvoidPastingImagesAsWebContent { false };
    bool shouldDisablePointerEventsQuirk { false };
    bool shouldEnableApplicationCacheQuirk { false };
    bool shouldIgnoreAriaForFastPathContentObservationCheckQuirk { false };
    bool shouldNavigatorPluginsBeEmpty { false };
    bool shouldSuppressAutocorrectionAndAutocapitalizationInHiddenEditableAreasQuirk { false };
    bool shouldSynthesizeTouchEventsAfterNonSyntheticClickQuirk { false };
#endif

#if PLATFORM(IOS)
    bool needsGetElementsByNameQuirk { false };
#endif

#if PLATFORM(IOS) || PLATFORM(VISION)
    bool allowLayeredFullscreenVideos { false };
    bool shouldSilenceMediaQueryListChangeEvents { false };
    bool shouldSilenceResizeObservers { false };
    bool shouldSilenceWindowResizeEvents { false };
#endif

#if PLATFORM(VISION)
    bool shouldDisableFullscreenVideoAspectRatioAdaptiveSizingQuirk { false };
#endif

#if PLATFORM(MAC)
    bool isNeverRichlyEditableForTouchBarQuirk { false };
    bool isTouchBarUpdateSuppressedForHiddenContentEditableQuirk { false };
    bool needsFormControlToBeMouseFocusableQuirk { false };
    bool needsPrimeVideoUserSelectNoneQuirk { false };
    bool shouldAvoidStartingSelectionOnMouseDown { false };
#endif

#if ENABLE(DESKTOP_CONTENT_MODE_QUIRKS)
    bool needsZeroMaxTouchPointsQuirk { false };
    bool shouldHideCoarsePointerCharacteristicsQuirk { false };
#endif

#if ENABLE(FLIP_SCREEN_DIMENSIONS_QUIRKS)
    bool shouldFlipScreenDimensionsQuirk { false };
#endif

#if ENABLE(MEDIA_STREAM)
    bool shouldDisableImageCaptureQuirk { false };
    bool shouldEnableLegacyGetUserMediaQuirk { false };
#endif

#if ENABLE(META_VIEWPORT)
    bool shouldIgnoreViewportArgumentsToAvoidExcessiveZoomQuirk { false };
#endif

#if ENABLE(TEXT_AUTOSIZING)
    bool shouldIgnoreTextAutoSizingQuirk { false };
#endif

#if ENABLE(TOUCH_EVENTS)
    enum class ShouldDispatchSimulatedMouseEvents : uint8_t {
        Unknown,
        No,
        DependingOnTargetFor_mybinder_org,
        Yes,
    };
    ShouldDispatchSimulatedMouseEvents shouldDispatchSimulatedMouseEventsQuirk { ShouldDispatchSimulatedMouseEvents::Unknown };
    bool shouldDispatchPointerOutAfterHandlingSyntheticClick { false };
    bool shouldPreventDispatchOfTouchEventQuirk { false };
#endif

#if ENABLE(FULLSCREEN_API) && ENABLE(VIDEO_PRESENTATION_MODE)
    bool blocksEnteringStandardFullscreenFromPictureInPictureQuirk { false };
    bool blocksReturnToFullscreenFromPictureInPictureQuirk { false };
#endif

#if ENABLE(VIDEO_PRESENTATION_MODE)
    bool requiresUserGestureToLoadInPictureInPictureQuirk { false };
    bool requiresUserGestureToPauseInPictureInPictureQuirk { false };
    bool shouldDelayFullscreenEventWhenExitingPictureInPictureQuirk { false };
    bool shouldDisableEndFullscreenEventWhenEnteringPictureInPictureFromFullscreenQuirk { false };
#endif
};

} // namespace WebCore
