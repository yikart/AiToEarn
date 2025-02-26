/*
 * THIS FILE WAS AUTOMATICALLY GENERATED, DO NOT EDIT.
 *
 * Copyright (C) 2017-2020 Apple Inc. All rights reserved.
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

#include "SettingsBase.h"
#include <wtf/RefCounted.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

class Page;

class Settings : public SettingsBase, public RefCounted<Settings> {
    WTF_MAKE_NONCOPYABLE(Settings); WTF_MAKE_FAST_ALLOCATED;
public:
    WEBCORE_EXPORT static Ref<Settings> create(Page*);
    WEBCORE_EXPORT virtual ~Settings();

    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    WEBCORE_EXPORT void disableUnstableFeaturesForModernWebKit();
    WEBCORE_EXPORT static void disableGlobalUnstableFeaturesForModernWebKit();
    WEBCORE_EXPORT void disableFeaturesForLockdownMode();

    bool CSSOMViewScrollingAPIEnabled() const { return m_values.CSSOMViewScrollingAPIEnabled; }
    void setCSSOMViewScrollingAPIEnabled(bool CSSOMViewScrollingAPIEnabled) { m_values.CSSOMViewScrollingAPIEnabled = CSSOMViewScrollingAPIEnabled; }
    bool CSSOMViewSmoothScrollingEnabled() const { return m_values.CSSOMViewSmoothScrollingEnabled; }
    void setCSSOMViewSmoothScrollingEnabled(bool CSSOMViewSmoothScrollingEnabled) { m_values.CSSOMViewSmoothScrollingEnabled = CSSOMViewSmoothScrollingEnabled; }
    bool abortSignalAnyOperationEnabled() const { return m_values.abortSignalAnyOperationEnabled; }
    void setAbortSignalAnyOperationEnabled(bool abortSignalAnyOperationEnabled) { m_values.abortSignalAnyOperationEnabled = abortSignalAnyOperationEnabled; }
    bool acceleratedCompositingEnabled() const { return m_values.acceleratedCompositingEnabled; }
    WEBCORE_EXPORT void setAcceleratedCompositingEnabled(bool);
    bool acceleratedCompositingForFixedPositionEnabled() const { return m_values.acceleratedCompositingForFixedPositionEnabled; }
    void setAcceleratedCompositingForFixedPositionEnabled(bool acceleratedCompositingForFixedPositionEnabled) { m_values.acceleratedCompositingForFixedPositionEnabled = acceleratedCompositingForFixedPositionEnabled; }
    bool acceleratedDrawingEnabled() const { return m_values.acceleratedDrawingEnabled; }
    void setAcceleratedDrawingEnabled(bool acceleratedDrawingEnabled) { m_values.acceleratedDrawingEnabled = acceleratedDrawingEnabled; }
    bool accentColorEnabled() const { return m_values.accentColorEnabled; }
    void setAccentColorEnabled(bool accentColorEnabled) { m_values.accentColorEnabled = accentColorEnabled; }
    bool accessHandleEnabled() const { return m_values.accessHandleEnabled; }
    void setAccessHandleEnabled(bool accessHandleEnabled) { m_values.accessHandleEnabled = accessHandleEnabled; }
    bool aggressiveTileRetentionEnabled() const { return m_values.aggressiveTileRetentionEnabled; }
    void setAggressiveTileRetentionEnabled(bool aggressiveTileRetentionEnabled) { m_values.aggressiveTileRetentionEnabled = aggressiveTileRetentionEnabled; }
    bool alignContentOnBlocksEnabled() const { return m_values.alignContentOnBlocksEnabled; }
    void setAlignContentOnBlocksEnabled(bool alignContentOnBlocksEnabled) { m_values.alignContentOnBlocksEnabled = alignContentOnBlocksEnabled; }
    bool allowAnimationControlsOverride() const { return m_values.allowAnimationControlsOverride; }
    void setAllowAnimationControlsOverride(bool allowAnimationControlsOverride) { m_values.allowAnimationControlsOverride = allowAnimationControlsOverride; }
    bool allowContentSecurityPolicySourceStarToMatchAnyProtocol() const { return m_values.allowContentSecurityPolicySourceStarToMatchAnyProtocol; }
    void setAllowContentSecurityPolicySourceStarToMatchAnyProtocol(bool allowContentSecurityPolicySourceStarToMatchAnyProtocol) { m_values.allowContentSecurityPolicySourceStarToMatchAnyProtocol = allowContentSecurityPolicySourceStarToMatchAnyProtocol; }
    bool allowDisplayOfInsecureContent() const { return m_values.allowDisplayOfInsecureContent; }
    void setAllowDisplayOfInsecureContent(bool allowDisplayOfInsecureContent) { m_values.allowDisplayOfInsecureContent = allowDisplayOfInsecureContent; }
    bool allowFileAccessFromFileURLs() const { return m_values.allowFileAccessFromFileURLs; }
    void setAllowFileAccessFromFileURLs(bool allowFileAccessFromFileURLs) { m_values.allowFileAccessFromFileURLs = allowFileAccessFromFileURLs; }
    bool allowMediaContentTypesRequiringHardwareSupportAsFallback() const { return m_values.allowMediaContentTypesRequiringHardwareSupportAsFallback; }
    void setAllowMediaContentTypesRequiringHardwareSupportAsFallback(bool allowMediaContentTypesRequiringHardwareSupportAsFallback) { m_values.allowMediaContentTypesRequiringHardwareSupportAsFallback = allowMediaContentTypesRequiringHardwareSupportAsFallback; }
    bool allowMultiElementImplicitSubmission() const { return m_values.allowMultiElementImplicitSubmission; }
    void setAllowMultiElementImplicitSubmission(bool allowMultiElementImplicitSubmission) { m_values.allowMultiElementImplicitSubmission = allowMultiElementImplicitSubmission; }
    bool allowPrivacySensitiveOperationsInNonPersistentDataStores() const { return m_values.allowPrivacySensitiveOperationsInNonPersistentDataStores; }
    void setAllowPrivacySensitiveOperationsInNonPersistentDataStores(bool allowPrivacySensitiveOperationsInNonPersistentDataStores) { m_values.allowPrivacySensitiveOperationsInNonPersistentDataStores = allowPrivacySensitiveOperationsInNonPersistentDataStores; }
    bool allowRunningOfInsecureContent() const { return m_values.allowRunningOfInsecureContent; }
    void setAllowRunningOfInsecureContent(bool allowRunningOfInsecureContent) { m_values.allowRunningOfInsecureContent = allowRunningOfInsecureContent; }
    bool allowSettingAnyXHRHeaderFromFileURLs() const { return m_values.allowSettingAnyXHRHeaderFromFileURLs; }
    void setAllowSettingAnyXHRHeaderFromFileURLs(bool allowSettingAnyXHRHeaderFromFileURLs) { m_values.allowSettingAnyXHRHeaderFromFileURLs = allowSettingAnyXHRHeaderFromFileURLs; }
    bool allowTopNavigationToDataURLs() const { return m_values.allowTopNavigationToDataURLs; }
    void setAllowTopNavigationToDataURLs(bool allowTopNavigationToDataURLs) { m_values.allowTopNavigationToDataURLs = allowTopNavigationToDataURLs; }
    bool allowUniversalAccessFromFileURLs() const { return m_values.allowUniversalAccessFromFileURLs; }
    void setAllowUniversalAccessFromFileURLs(bool allowUniversalAccessFromFileURLs) { m_values.allowUniversalAccessFromFileURLs = allowUniversalAccessFromFileURLs; }
    bool allowsInlineMediaPlayback() const { return m_values.allowsInlineMediaPlayback; }
    void setAllowsInlineMediaPlayback(bool allowsInlineMediaPlayback) { m_values.allowsInlineMediaPlayback = allowsInlineMediaPlayback; }
    bool allowsInlineMediaPlaybackAfterFullscreen() const { return m_values.allowsInlineMediaPlaybackAfterFullscreen; }
    void setAllowsInlineMediaPlaybackAfterFullscreen(bool allowsInlineMediaPlaybackAfterFullscreen) { m_values.allowsInlineMediaPlaybackAfterFullscreen = allowsInlineMediaPlaybackAfterFullscreen; }
    bool allowsPictureInPictureMediaPlayback() const { return m_values.allowsPictureInPictureMediaPlayback; }
    void setAllowsPictureInPictureMediaPlayback(bool allowsPictureInPictureMediaPlayback) { m_values.allowsPictureInPictureMediaPlayback = allowsPictureInPictureMediaPlayback; }
    bool altitudeAngleEnabled() const { return m_values.altitudeAngleEnabled; }
    void setAltitudeAngleEnabled(bool altitudeAngleEnabled) { m_values.altitudeAngleEnabled = altitudeAngleEnabled; }
    bool animatedImageAsyncDecodingEnabled() const { return m_values.animatedImageAsyncDecodingEnabled; }
    void setAnimatedImageAsyncDecodingEnabled(bool animatedImageAsyncDecodingEnabled) { m_values.animatedImageAsyncDecodingEnabled = animatedImageAsyncDecodingEnabled; }
    bool animatedImageDebugCanvasDrawingEnabled() const { return m_values.animatedImageDebugCanvasDrawingEnabled; }
    void setAnimatedImageDebugCanvasDrawingEnabled(bool animatedImageDebugCanvasDrawingEnabled) { m_values.animatedImageDebugCanvasDrawingEnabled = animatedImageDebugCanvasDrawingEnabled; }
    bool appBadgeEnabled() const { return m_values.appBadgeEnabled; }
    void setAppBadgeEnabled(bool appBadgeEnabled) { m_values.appBadgeEnabled = appBadgeEnabled; }
    bool appleMailPaginationQuirkEnabled() const { return m_values.appleMailPaginationQuirkEnabled; }
    void setAppleMailPaginationQuirkEnabled(bool appleMailPaginationQuirkEnabled) { m_values.appleMailPaginationQuirkEnabled = appleMailPaginationQuirkEnabled; }
    bool asyncClipboardAPIEnabled() const { return m_values.asyncClipboardAPIEnabled; }
    void setAsyncClipboardAPIEnabled(bool asyncClipboardAPIEnabled) { m_values.asyncClipboardAPIEnabled = asyncClipboardAPIEnabled; }
    bool asyncFrameScrollingEnabled() const { return m_values.asyncFrameScrollingEnabled; }
    WEBCORE_EXPORT void setAsyncFrameScrollingEnabled(bool);
    bool asyncOverflowScrollingEnabled() const { return m_values.asyncOverflowScrollingEnabled; }
    WEBCORE_EXPORT void setAsyncOverflowScrollingEnabled(bool);
    bool asynchronousSpellCheckingEnabled() const { return m_values.asynchronousSpellCheckingEnabled; }
    void setAsynchronousSpellCheckingEnabled(bool asynchronousSpellCheckingEnabled) { m_values.asynchronousSpellCheckingEnabled = asynchronousSpellCheckingEnabled; }
    bool audioControlsScaleWithPageZoom() const { return m_values.audioControlsScaleWithPageZoom; }
    void setAudioControlsScaleWithPageZoom(bool audioControlsScaleWithPageZoom) { m_values.audioControlsScaleWithPageZoom = audioControlsScaleWithPageZoom; }
    WEBCORE_EXPORT bool authorAndUserStylesEnabled() const;
    WEBCORE_EXPORT void setAuthorAndUserStylesEnabled(bool);
    bool automaticallyAdjustsViewScaleUsingMinimumEffectiveDeviceWidth() const { return m_values.automaticallyAdjustsViewScaleUsingMinimumEffectiveDeviceWidth; }
    void setAutomaticallyAdjustsViewScaleUsingMinimumEffectiveDeviceWidth(bool automaticallyAdjustsViewScaleUsingMinimumEffectiveDeviceWidth) { m_values.automaticallyAdjustsViewScaleUsingMinimumEffectiveDeviceWidth = automaticallyAdjustsViewScaleUsingMinimumEffectiveDeviceWidth; }
    bool autoscrollForDragAndDropEnabled() const { return m_values.autoscrollForDragAndDropEnabled; }
    void setAutoscrollForDragAndDropEnabled(bool autoscrollForDragAndDropEnabled) { m_values.autoscrollForDragAndDropEnabled = autoscrollForDragAndDropEnabled; }
    bool auxclickEventEnabled() const { return m_values.auxclickEventEnabled; }
    void setAuxclickEventEnabled(bool auxclickEventEnabled) { m_values.auxclickEventEnabled = auxclickEventEnabled; }
    bool azimuthAngleEnabled() const { return m_values.azimuthAngleEnabled; }
    void setAzimuthAngleEnabled(bool azimuthAngleEnabled) { m_values.azimuthAngleEnabled = azimuthAngleEnabled; }
    Seconds backForwardCacheExpirationInterval() const { return m_values.backForwardCacheExpirationInterval; }
    void setBackForwardCacheExpirationInterval(Seconds backForwardCacheExpirationInterval) { m_values.backForwardCacheExpirationInterval = backForwardCacheExpirationInterval; }
    bool backgroundFetchAPIEnabled() const { return m_values.backgroundFetchAPIEnabled; }
    void setBackgroundFetchAPIEnabled(bool backgroundFetchAPIEnabled) { m_values.backgroundFetchAPIEnabled = backgroundFetchAPIEnabled; }
    bool backgroundShouldExtendBeyondPage() const { return m_values.backgroundShouldExtendBeyondPage; }
    WEBCORE_EXPORT void setBackgroundShouldExtendBeyondPage(bool);
    bool backspaceKeyNavigationEnabled() const { return m_values.backspaceKeyNavigationEnabled; }
    void setBackspaceKeyNavigationEnabled(bool backspaceKeyNavigationEnabled) { m_values.backspaceKeyNavigationEnabled = backspaceKeyNavigationEnabled; }
    bool beaconAPIEnabled() const { return m_values.beaconAPIEnabled; }
    void setBeaconAPIEnabled(bool beaconAPIEnabled) { m_values.beaconAPIEnabled = beaconAPIEnabled; }
    bool blobFileAccessEnforcementEnabled() const { return m_values.blobFileAccessEnforcementEnabled; }
    void setBlobFileAccessEnforcementEnabled(bool blobFileAccessEnforcementEnabled) { m_values.blobFileAccessEnforcementEnabled = blobFileAccessEnforcementEnabled; }
    bool blobRegistryTopOriginPartitioningEnabled() const { return m_values.blobRegistryTopOriginPartitioningEnabled; }
    void setBlobRegistryTopOriginPartitioningEnabled(bool blobRegistryTopOriginPartitioningEnabled) { m_values.blobRegistryTopOriginPartitioningEnabled = blobRegistryTopOriginPartitioningEnabled; }
    bool broadcastChannelEnabled() const { return m_values.broadcastChannelEnabled; }
    void setBroadcastChannelEnabled(bool broadcastChannelEnabled) { m_values.broadcastChannelEnabled = broadcastChannelEnabled; }
    bool broadcastChannelOriginPartitioningEnabled() const { return m_values.broadcastChannelOriginPartitioningEnabled; }
    void setBroadcastChannelOriginPartitioningEnabled(bool broadcastChannelOriginPartitioningEnabled) { m_values.broadcastChannelOriginPartitioningEnabled = broadcastChannelOriginPartitioningEnabled; }
    bool cacheAPIEnabled() const { return m_values.cacheAPIEnabled; }
    void setCacheAPIEnabled(bool cacheAPIEnabled) { m_values.cacheAPIEnabled = cacheAPIEnabled; }
    bool canvasColorSpaceEnabled() const { return m_values.canvasColorSpaceEnabled; }
    void setCanvasColorSpaceEnabled(bool canvasColorSpaceEnabled) { m_values.canvasColorSpaceEnabled = canvasColorSpaceEnabled; }
    bool canvasFiltersEnabled() const { return m_values.canvasFiltersEnabled; }
    WEBCORE_EXPORT void setCanvasFiltersEnabled(bool);
    bool canvasFingerprintingQuirkEnabled() const { return m_values.canvasFingerprintingQuirkEnabled; }
    void setCanvasFingerprintingQuirkEnabled(bool canvasFingerprintingQuirkEnabled) { m_values.canvasFingerprintingQuirkEnabled = canvasFingerprintingQuirkEnabled; }
    bool canvasLayersEnabled() const { return m_values.canvasLayersEnabled; }
    void setCanvasLayersEnabled(bool canvasLayersEnabled) { m_values.canvasLayersEnabled = canvasLayersEnabled; }
    bool canvasPixelFormatEnabled() const { return m_values.canvasPixelFormatEnabled; }
    void setCanvasPixelFormatEnabled(bool canvasPixelFormatEnabled) { m_values.canvasPixelFormatEnabled = canvasPixelFormatEnabled; }
    bool caretBrowsingEnabled() const { return m_values.caretBrowsingEnabled; }
    void setCaretBrowsingEnabled(bool caretBrowsingEnabled) { m_values.caretBrowsingEnabled = caretBrowsingEnabled; }
    bool caretPositionFromPointEnabled() const { return m_values.caretPositionFromPointEnabled; }
    void setCaretPositionFromPointEnabled(bool caretPositionFromPointEnabled) { m_values.caretPositionFromPointEnabled = caretPositionFromPointEnabled; }
    bool childProcessDebuggabilityEnabled() const { return m_values.childProcessDebuggabilityEnabled; }
    void setChildProcessDebuggabilityEnabled(bool childProcessDebuggabilityEnabled) { m_values.childProcessDebuggabilityEnabled = childProcessDebuggabilityEnabled; }
    bool clearSiteDataExecutionContextsSupportEnabled() const { return m_values.clearSiteDataExecutionContextsSupportEnabled; }
    void setClearSiteDataExecutionContextsSupportEnabled(bool clearSiteDataExecutionContextsSupportEnabled) { m_values.clearSiteDataExecutionContextsSupportEnabled = clearSiteDataExecutionContextsSupportEnabled; }
    bool clearSiteDataHTTPHeaderEnabled() const { return m_values.clearSiteDataHTTPHeaderEnabled; }
    void setClearSiteDataHTTPHeaderEnabled(bool clearSiteDataHTTPHeaderEnabled) { m_values.clearSiteDataHTTPHeaderEnabled = clearSiteDataHTTPHeaderEnabled; }
    bool clientBadgeEnabled() const { return m_values.clientBadgeEnabled; }
    void setClientBadgeEnabled(bool clientBadgeEnabled) { m_values.clientBadgeEnabled = clientBadgeEnabled; }
    bool clientCoordinatesRelativeToLayoutViewport() const { return m_values.clientCoordinatesRelativeToLayoutViewport; }
    WEBCORE_EXPORT void setClientCoordinatesRelativeToLayoutViewport(bool);
    ClipboardAccessPolicy clipboardAccessPolicy() const { return m_values.clipboardAccessPolicy; }
    void setClipboardAccessPolicy(ClipboardAccessPolicy clipboardAccessPolicy) { m_values.clipboardAccessPolicy = clipboardAccessPolicy; }
    bool colorFilterEnabled() const { return m_values.colorFilterEnabled; }
    WEBCORE_EXPORT void setColorFilterEnabled(bool);
    bool compressionStreamEnabled() const { return m_values.compressionStreamEnabled; }
    void setCompressionStreamEnabled(bool compressionStreamEnabled) { m_values.compressionStreamEnabled = compressionStreamEnabled; }
    bool contactPickerAPIEnabled() const { return m_values.contactPickerAPIEnabled; }
    void setContactPickerAPIEnabled(bool contactPickerAPIEnabled) { m_values.contactPickerAPIEnabled = contactPickerAPIEnabled; }
    bool contentDispositionAttachmentSandboxEnabled() const { return m_values.contentDispositionAttachmentSandboxEnabled; }
    void setContentDispositionAttachmentSandboxEnabled(bool contentDispositionAttachmentSandboxEnabled) { m_values.contentDispositionAttachmentSandboxEnabled = contentDispositionAttachmentSandboxEnabled; }
    bool cookieConsentAPIEnabled() const { return m_values.cookieConsentAPIEnabled; }
    void setCookieConsentAPIEnabled(bool cookieConsentAPIEnabled) { m_values.cookieConsentAPIEnabled = cookieConsentAPIEnabled; }
    bool cookieEnabled() const { return m_values.cookieEnabled; }
    void setCookieEnabled(bool cookieEnabled) { m_values.cookieEnabled = cookieEnabled; }
    bool cookieStoreAPIEnabled() const { return m_values.cookieStoreAPIEnabled; }
    void setCookieStoreAPIEnabled(bool cookieStoreAPIEnabled) { m_values.cookieStoreAPIEnabled = cookieStoreAPIEnabled; }
    bool cookieStoreAPIExtendedAttributesEnabled() const { return m_values.cookieStoreAPIExtendedAttributesEnabled; }
    void setCookieStoreAPIExtendedAttributesEnabled(bool cookieStoreAPIExtendedAttributesEnabled) { m_values.cookieStoreAPIExtendedAttributesEnabled = cookieStoreAPIExtendedAttributesEnabled; }
    bool cookieStoreManagerEnabled() const { return m_values.cookieStoreManagerEnabled; }
    void setCookieStoreManagerEnabled(bool cookieStoreManagerEnabled) { m_values.cookieStoreManagerEnabled = cookieStoreManagerEnabled; }
    bool coreMathMLEnabled() const { return m_values.coreMathMLEnabled; }
    WEBCORE_EXPORT void setCoreMathMLEnabled(bool);
    bool crossDocumentViewTransitionsEnabled() const { return m_values.crossDocumentViewTransitionsEnabled; }
    void setCrossDocumentViewTransitionsEnabled(bool crossDocumentViewTransitionsEnabled) { m_values.crossDocumentViewTransitionsEnabled = crossDocumentViewTransitionsEnabled; }
    bool crossOriginCheckInGetMatchedCSSRulesDisabled() const { return m_values.crossOriginCheckInGetMatchedCSSRulesDisabled; }
    void setCrossOriginCheckInGetMatchedCSSRulesDisabled(bool crossOriginCheckInGetMatchedCSSRulesDisabled) { m_values.crossOriginCheckInGetMatchedCSSRulesDisabled = crossOriginCheckInGetMatchedCSSRulesDisabled; }
    bool crossOriginEmbedderPolicyEnabled() const { return m_values.crossOriginEmbedderPolicyEnabled; }
    void setCrossOriginEmbedderPolicyEnabled(bool crossOriginEmbedderPolicyEnabled) { m_values.crossOriginEmbedderPolicyEnabled = crossOriginEmbedderPolicyEnabled; }
    bool crossOriginOpenerPolicyEnabled() const { return m_values.crossOriginOpenerPolicyEnabled; }
    void setCrossOriginOpenerPolicyEnabled(bool crossOriginOpenerPolicyEnabled) { m_values.crossOriginOpenerPolicyEnabled = crossOriginOpenerPolicyEnabled; }
    bool css3DTransformBackfaceVisibilityInteroperabilityEnabled() const { return m_values.css3DTransformBackfaceVisibilityInteroperabilityEnabled; }
    void setCSS3DTransformBackfaceVisibilityInteroperabilityEnabled(bool css3DTransformBackfaceVisibilityInteroperabilityEnabled) { m_values.css3DTransformBackfaceVisibilityInteroperabilityEnabled = css3DTransformBackfaceVisibilityInteroperabilityEnabled; }
    bool cssAnchorPositioningEnabled() const { return m_values.cssAnchorPositioningEnabled; }
    void setCSSAnchorPositioningEnabled(bool cssAnchorPositioningEnabled) { m_values.cssAnchorPositioningEnabled = cssAnchorPositioningEnabled; }
    bool cssAppearanceBaseEnabled() const { return m_values.cssAppearanceBaseEnabled; }
    void setCSSAppearanceBaseEnabled(bool cssAppearanceBaseEnabled) { m_values.cssAppearanceBaseEnabled = cssAppearanceBaseEnabled; }
    bool cssBackgroundClipBorderAreaEnabled() const { return m_values.cssBackgroundClipBorderAreaEnabled; }
    void setCSSBackgroundClipBorderAreaEnabled(bool cssBackgroundClipBorderAreaEnabled) { m_values.cssBackgroundClipBorderAreaEnabled = cssBackgroundClipBorderAreaEnabled; }
    bool cssColorLayersEnabled() const { return m_values.cssColorLayersEnabled; }
    void setCSSColorLayersEnabled(bool cssColorLayersEnabled) { m_values.cssColorLayersEnabled = cssColorLayersEnabled; }
    bool cssContainerProgressFunctionEnabled() const { return m_values.cssContainerProgressFunctionEnabled; }
    void setCSSContainerProgressFunctionEnabled(bool cssContainerProgressFunctionEnabled) { m_values.cssContainerProgressFunctionEnabled = cssContainerProgressFunctionEnabled; }
    bool cssContentVisibilityEnabled() const { return m_values.cssContentVisibilityEnabled; }
    void setCSSContentVisibilityEnabled(bool cssContentVisibilityEnabled) { m_values.cssContentVisibilityEnabled = cssContentVisibilityEnabled; }
    bool cssContrastColorEnabled() const { return m_values.cssContrastColorEnabled; }
    void setCSSContrastColorEnabled(bool cssContrastColorEnabled) { m_values.cssContrastColorEnabled = cssContrastColorEnabled; }
    bool cssCounterStyleAtRuleImageSymbolsEnabled() const { return m_values.cssCounterStyleAtRuleImageSymbolsEnabled; }
    void setCSSCounterStyleAtRuleImageSymbolsEnabled(bool cssCounterStyleAtRuleImageSymbolsEnabled) { m_values.cssCounterStyleAtRuleImageSymbolsEnabled = cssCounterStyleAtRuleImageSymbolsEnabled; }
    bool cssCounterStyleAtRulesEnabled() const { return m_values.cssCounterStyleAtRulesEnabled; }
    void setCSSCounterStyleAtRulesEnabled(bool cssCounterStyleAtRulesEnabled) { m_values.cssCounterStyleAtRulesEnabled = cssCounterStyleAtRulesEnabled; }
    bool cssDPropertyEnabled() const { return m_values.cssDPropertyEnabled; }
    void setCSSDPropertyEnabled(bool cssDPropertyEnabled) { m_values.cssDPropertyEnabled = cssDPropertyEnabled; }
    bool cssFieldSizingEnabled() const { return m_values.cssFieldSizingEnabled; }
    void setCSSFieldSizingEnabled(bool cssFieldSizingEnabled) { m_values.cssFieldSizingEnabled = cssFieldSizingEnabled; }
    bool cssFontFaceSizeAdjustEnabled() const { return m_values.cssFontFaceSizeAdjustEnabled; }
    void setCSSFontFaceSizeAdjustEnabled(bool cssFontFaceSizeAdjustEnabled) { m_values.cssFontFaceSizeAdjustEnabled = cssFontFaceSizeAdjustEnabled; }
    bool cssFontVariantEmojiEnabled() const { return m_values.cssFontVariantEmojiEnabled; }
    void setCSSFontVariantEmojiEnabled(bool cssFontVariantEmojiEnabled) { m_values.cssFontVariantEmojiEnabled = cssFontVariantEmojiEnabled; }
    bool cssInputSecurityEnabled() const { return m_values.cssInputSecurityEnabled; }
    void setCSSInputSecurityEnabled(bool cssInputSecurityEnabled) { m_values.cssInputSecurityEnabled = cssInputSecurityEnabled; }
    bool cssLightDarkEnabled() const { return m_values.cssLightDarkEnabled; }
    void setCSSLightDarkEnabled(bool cssLightDarkEnabled) { m_values.cssLightDarkEnabled = cssLightDarkEnabled; }
    bool cssLineClampEnabled() const { return m_values.cssLineClampEnabled; }
    void setCSSLineClampEnabled(bool cssLineClampEnabled) { m_values.cssLineClampEnabled = cssLineClampEnabled; }
    bool cssLineFitEdgeEnabled() const { return m_values.cssLineFitEdgeEnabled; }
    void setCSSLineFitEdgeEnabled(bool cssLineFitEdgeEnabled) { m_values.cssLineFitEdgeEnabled = cssLineFitEdgeEnabled; }
    bool cssMarginTrimEnabled() const { return m_values.cssMarginTrimEnabled; }
    void setCSSMarginTrimEnabled(bool cssMarginTrimEnabled) { m_values.cssMarginTrimEnabled = cssMarginTrimEnabled; }
    bool cssMediaProgressFunctionEnabled() const { return m_values.cssMediaProgressFunctionEnabled; }
    void setCSSMediaProgressFunctionEnabled(bool cssMediaProgressFunctionEnabled) { m_values.cssMediaProgressFunctionEnabled = cssMediaProgressFunctionEnabled; }
    bool cssMotionPathEnabled() const { return m_values.cssMotionPathEnabled; }
    void setCSSMotionPathEnabled(bool cssMotionPathEnabled) { m_values.cssMotionPathEnabled = cssMotionPathEnabled; }
    bool cssNestingEnabled() const { return m_values.cssNestingEnabled; }
    void setCSSNestingEnabled(bool cssNestingEnabled) { m_values.cssNestingEnabled = cssNestingEnabled; }
    bool cssPaintingAPIEnabled() const { return m_values.cssPaintingAPIEnabled; }
    void setCSSPaintingAPIEnabled(bool cssPaintingAPIEnabled) { m_values.cssPaintingAPIEnabled = cssPaintingAPIEnabled; }
    bool cssProgressFunctionEnabled() const { return m_values.cssProgressFunctionEnabled; }
    void setCSSProgressFunctionEnabled(bool cssProgressFunctionEnabled) { m_values.cssProgressFunctionEnabled = cssProgressFunctionEnabled; }
    bool cssRhythmicSizingEnabled() const { return m_values.cssRhythmicSizingEnabled; }
    void setCSSRhythmicSizingEnabled(bool cssRhythmicSizingEnabled) { m_values.cssRhythmicSizingEnabled = cssRhythmicSizingEnabled; }
    bool cssRubyAlignEnabled() const { return m_values.cssRubyAlignEnabled; }
    void setCSSRubyAlignEnabled(bool cssRubyAlignEnabled) { m_values.cssRubyAlignEnabled = cssRubyAlignEnabled; }
    bool cssRubyOverhangEnabled() const { return m_values.cssRubyOverhangEnabled; }
    void setCSSRubyOverhangEnabled(bool cssRubyOverhangEnabled) { m_values.cssRubyOverhangEnabled = cssRubyOverhangEnabled; }
    bool cssScopeAtRuleEnabled() const { return m_values.cssScopeAtRuleEnabled; }
    void setCSSScopeAtRuleEnabled(bool cssScopeAtRuleEnabled) { m_values.cssScopeAtRuleEnabled = cssScopeAtRuleEnabled; }
    bool cssScrollAnchoringEnabled() const { return m_values.cssScrollAnchoringEnabled; }
    void setCSSScrollAnchoringEnabled(bool cssScrollAnchoringEnabled) { m_values.cssScrollAnchoringEnabled = cssScrollAnchoringEnabled; }
    bool cssScrollbarColorEnabled() const { return m_values.cssScrollbarColorEnabled; }
    void setCSSScrollbarColorEnabled(bool cssScrollbarColorEnabled) { m_values.cssScrollbarColorEnabled = cssScrollbarColorEnabled; }
    bool cssScrollbarGutterEnabled() const { return m_values.cssScrollbarGutterEnabled; }
    void setCSSScrollbarGutterEnabled(bool cssScrollbarGutterEnabled) { m_values.cssScrollbarGutterEnabled = cssScrollbarGutterEnabled; }
    bool cssScrollbarWidthEnabled() const { return m_values.cssScrollbarWidthEnabled; }
    void setCSSScrollbarWidthEnabled(bool cssScrollbarWidthEnabled) { m_values.cssScrollbarWidthEnabled = cssScrollbarWidthEnabled; }
    bool cssShapeFunctionEnabled() const { return m_values.cssShapeFunctionEnabled; }
    void setCSSShapeFunctionEnabled(bool cssShapeFunctionEnabled) { m_values.cssShapeFunctionEnabled = cssShapeFunctionEnabled; }
    bool cssStartingStyleAtRuleEnabled() const { return m_values.cssStartingStyleAtRuleEnabled; }
    void setCSSStartingStyleAtRuleEnabled(bool cssStartingStyleAtRuleEnabled) { m_values.cssStartingStyleAtRuleEnabled = cssStartingStyleAtRuleEnabled; }
    bool cssStyleQueriesEnabled() const { return m_values.cssStyleQueriesEnabled; }
    void setCSSStyleQueriesEnabled(bool cssStyleQueriesEnabled) { m_values.cssStyleQueriesEnabled = cssStyleQueriesEnabled; }
    bool cssTextAutospaceEnabled() const { return m_values.cssTextAutospaceEnabled; }
    void setCSSTextAutospaceEnabled(bool cssTextAutospaceEnabled) { m_values.cssTextAutospaceEnabled = cssTextAutospaceEnabled; }
    bool cssTextBoxTrimEnabled() const { return m_values.cssTextBoxTrimEnabled; }
    void setCSSTextBoxTrimEnabled(bool cssTextBoxTrimEnabled) { m_values.cssTextBoxTrimEnabled = cssTextBoxTrimEnabled; }
    bool cssTextGroupAlignEnabled() const { return m_values.cssTextGroupAlignEnabled; }
    void setCSSTextGroupAlignEnabled(bool cssTextGroupAlignEnabled) { m_values.cssTextGroupAlignEnabled = cssTextGroupAlignEnabled; }
    bool cssTextJustifyEnabled() const { return m_values.cssTextJustifyEnabled; }
    void setCSSTextJustifyEnabled(bool cssTextJustifyEnabled) { m_values.cssTextJustifyEnabled = cssTextJustifyEnabled; }
    bool cssTextSpacingTrimEnabled() const { return m_values.cssTextSpacingTrimEnabled; }
    void setCSSTextSpacingTrimEnabled(bool cssTextSpacingTrimEnabled) { m_values.cssTextSpacingTrimEnabled = cssTextSpacingTrimEnabled; }
    bool cssTextUnderlinePositionLeftRightEnabled() const { return m_values.cssTextUnderlinePositionLeftRightEnabled; }
    void setCSSTextUnderlinePositionLeftRightEnabled(bool cssTextUnderlinePositionLeftRightEnabled) { m_values.cssTextUnderlinePositionLeftRightEnabled = cssTextUnderlinePositionLeftRightEnabled; }
    bool cssTextWrapPrettyEnabled() const { return m_values.cssTextWrapPrettyEnabled; }
    void setCSSTextWrapPrettyEnabled(bool cssTextWrapPrettyEnabled) { m_values.cssTextWrapPrettyEnabled = cssTextWrapPrettyEnabled; }
    bool cssTextWrapStyleEnabled() const { return m_values.cssTextWrapStyleEnabled; }
    void setCSSTextWrapStyleEnabled(bool cssTextWrapStyleEnabled) { m_values.cssTextWrapStyleEnabled = cssTextWrapStyleEnabled; }
    bool cssTypedOMColorEnabled() const { return m_values.cssTypedOMColorEnabled; }
    void setCSSTypedOMColorEnabled(bool cssTypedOMColorEnabled) { m_values.cssTypedOMColorEnabled = cssTypedOMColorEnabled; }
    bool cssUnprefixedBackdropFilterEnabled() const { return m_values.cssUnprefixedBackdropFilterEnabled; }
    void setCSSUnprefixedBackdropFilterEnabled(bool cssUnprefixedBackdropFilterEnabled) { m_values.cssUnprefixedBackdropFilterEnabled = cssUnprefixedBackdropFilterEnabled; }
    bool cssWordBreakAutoPhraseEnabled() const { return m_values.cssWordBreakAutoPhraseEnabled; }
    WEBCORE_EXPORT void setCSSWordBreakAutoPhraseEnabled(bool);
    bool dataTransferItemsEnabled() const { return m_values.dataTransferItemsEnabled; }
    void setDataTransferItemsEnabled(bool dataTransferItemsEnabled) { m_values.dataTransferItemsEnabled = dataTransferItemsEnabled; }
    bool declarativeShadowRootsParserAPIsEnabled() const { return m_values.declarativeShadowRootsParserAPIsEnabled; }
    void setDeclarativeShadowRootsParserAPIsEnabled(bool declarativeShadowRootsParserAPIsEnabled) { m_values.declarativeShadowRootsParserAPIsEnabled = declarativeShadowRootsParserAPIsEnabled; }
    bool declarativeShadowRootsSerializerAPIsEnabled() const { return m_values.declarativeShadowRootsSerializerAPIsEnabled; }
    void setDeclarativeShadowRootsSerializerAPIsEnabled(bool declarativeShadowRootsSerializerAPIsEnabled) { m_values.declarativeShadowRootsSerializerAPIsEnabled = declarativeShadowRootsSerializerAPIsEnabled; }
    double defaultFixedFontSize() const { return m_values.defaultFixedFontSize; }
    WEBCORE_EXPORT void setDefaultFixedFontSize(double);
    double defaultFontSize() const { return m_values.defaultFontSize; }
    WEBCORE_EXPORT void setDefaultFontSize(double);
    const String& defaultTextEncodingName() const { return m_values.defaultTextEncodingName; }
    void setDefaultTextEncodingName(const String& defaultTextEncodingName) { m_values.defaultTextEncodingName = defaultTextEncodingName; }
    const String& defaultVideoPosterURL() const { return m_values.defaultVideoPosterURL; }
    void setDefaultVideoPosterURL(const String& defaultVideoPosterURL) { m_values.defaultVideoPosterURL = defaultVideoPosterURL; }
    bool deprecateAESCFBWebCryptoEnabled() const { return m_values.deprecateAESCFBWebCryptoEnabled; }
    void setDeprecateAESCFBWebCryptoEnabled(bool deprecateAESCFBWebCryptoEnabled) { m_values.deprecateAESCFBWebCryptoEnabled = deprecateAESCFBWebCryptoEnabled; }
    bool deprecationReportingEnabled() const { return m_values.deprecationReportingEnabled; }
    void setDeprecationReportingEnabled(bool deprecationReportingEnabled) { m_values.deprecationReportingEnabled = deprecationReportingEnabled; }
    bool detailsNameAttributeEnabled() const { return m_values.detailsNameAttributeEnabled; }
    void setDetailsNameAttributeEnabled(bool detailsNameAttributeEnabled) { m_values.detailsNameAttributeEnabled = detailsNameAttributeEnabled; }
    bool developerExtrasEnabled() const { return m_values.developerExtrasEnabled; }
    void setDeveloperExtrasEnabled(bool developerExtrasEnabled) { m_values.developerExtrasEnabled = developerExtrasEnabled; }
    uint32_t deviceHeight() const { return m_values.deviceHeight; }
    void setDeviceHeight(uint32_t deviceHeight) { m_values.deviceHeight = deviceHeight; }
    uint32_t deviceWidth() const { return m_values.deviceWidth; }
    void setDeviceWidth(uint32_t deviceWidth) { m_values.deviceWidth = deviceWidth; }
    bool devolvableWidgetsEnabled() const { return m_values.devolvableWidgetsEnabled; }
    void setDevolvableWidgetsEnabled(bool devolvableWidgetsEnabled) { m_values.devolvableWidgetsEnabled = devolvableWidgetsEnabled; }
    bool diagnosticLoggingEnabled() const { return m_values.diagnosticLoggingEnabled; }
    void setDiagnosticLoggingEnabled(bool diagnosticLoggingEnabled) { m_values.diagnosticLoggingEnabled = diagnosticLoggingEnabled; }
    bool digitalCredentialsEnabled() const { return m_values.digitalCredentialsEnabled; }
    void setDigitalCredentialsEnabled(bool digitalCredentialsEnabled) { m_values.digitalCredentialsEnabled = digitalCredentialsEnabled; }
    bool directoryUploadEnabled() const { return m_values.directoryUploadEnabled; }
    void setDirectoryUploadEnabled(bool directoryUploadEnabled) { m_values.directoryUploadEnabled = directoryUploadEnabled; }
    bool disabledAdaptationsMetaTagEnabled() const { return m_values.disabledAdaptationsMetaTagEnabled; }
    void setDisabledAdaptationsMetaTagEnabled(bool disabledAdaptationsMetaTagEnabled) { m_values.disabledAdaptationsMetaTagEnabled = disabledAdaptationsMetaTagEnabled; }
    bool disallowSyncXHRDuringPageDismissalEnabled() const { return m_values.disallowSyncXHRDuringPageDismissalEnabled; }
    void setDisallowSyncXHRDuringPageDismissalEnabled(bool disallowSyncXHRDuringPageDismissalEnabled) { m_values.disallowSyncXHRDuringPageDismissalEnabled = disallowSyncXHRDuringPageDismissalEnabled; }
    bool dnsPrefetchingEnabled() const { return m_values.dnsPrefetchingEnabled; }
    WEBCORE_EXPORT void setDNSPrefetchingEnabled(bool);
    bool domPasteAccessRequestsEnabled() const { return m_values.domPasteAccessRequestsEnabled; }
    void setDOMPasteAccessRequestsEnabled(bool domPasteAccessRequestsEnabled) { m_values.domPasteAccessRequestsEnabled = domPasteAccessRequestsEnabled; }
    bool domPasteAllowed() const { return m_values.domPasteAllowed; }
    void setDOMPasteAllowed(bool domPasteAllowed) { m_values.domPasteAllowed = domPasteAllowed; }
    bool domTestingAPIsEnabled() const { return m_values.domTestingAPIsEnabled; }
    void setDOMTestingAPIsEnabled(bool domTestingAPIsEnabled) { m_values.domTestingAPIsEnabled = domTestingAPIsEnabled; }
    bool domTimersThrottlingEnabled() const { return m_values.domTimersThrottlingEnabled; }
    void setDOMTimersThrottlingEnabled(bool domTimersThrottlingEnabled) { m_values.domTimersThrottlingEnabled = domTimersThrottlingEnabled; }
    bool downloadAttributeEnabled() const { return m_values.downloadAttributeEnabled; }
    void setDownloadAttributeEnabled(bool downloadAttributeEnabled) { m_values.downloadAttributeEnabled = downloadAttributeEnabled; }
    DownloadableBinaryFontTrustedTypes downloadableBinaryFontTrustedTypes() const { return m_values.downloadableBinaryFontTrustedTypes; }
    void setDownloadableBinaryFontTrustedTypes(DownloadableBinaryFontTrustedTypes downloadableBinaryFontTrustedTypes) { m_values.downloadableBinaryFontTrustedTypes = downloadableBinaryFontTrustedTypes; }
    bool dynamicSiteInterventionsEnabled() const { return m_values.dynamicSiteInterventionsEnabled; }
    void setDynamicSiteInterventionsEnabled(bool dynamicSiteInterventionsEnabled) { m_values.dynamicSiteInterventionsEnabled = dynamicSiteInterventionsEnabled; }
    WebCore::EditableLinkBehavior editableLinkBehavior() const { return m_values.editableLinkBehavior; }
    void setEditableLinkBehavior(WebCore::EditableLinkBehavior editableLinkBehavior) { m_values.editableLinkBehavior = editableLinkBehavior; }
    EditingBehaviorType editingBehaviorType() const { return m_values.editingBehaviorType; }
    void setEditingBehaviorType(EditingBehaviorType editingBehaviorType) { m_values.editingBehaviorType = editingBehaviorType; }
    bool elementCheckVisibilityEnabled() const { return m_values.elementCheckVisibilityEnabled; }
    void setElementCheckVisibilityEnabled(bool elementCheckVisibilityEnabled) { m_values.elementCheckVisibilityEnabled = elementCheckVisibilityEnabled; }
    bool embedElementEnabled() const { return m_values.embedElementEnabled; }
    void setEmbedElementEnabled(bool embedElementEnabled) { m_values.embedElementEnabled = embedElementEnabled; }
    bool enableInheritURIQueryComponent() const { return m_values.enableInheritURIQueryComponent; }
    void setEnableInheritURIQueryComponent(bool enableInheritURIQueryComponent) { m_values.enableInheritURIQueryComponent = enableInheritURIQueryComponent; }
    bool enterKeyHintEnabled() const { return m_values.enterKeyHintEnabled; }
    void setEnterKeyHintEnabled(bool enterKeyHintEnabled) { m_values.enterKeyHintEnabled = enterKeyHintEnabled; }
    bool eventHandlerDrivenSmoothKeyboardScrollingEnabled() const { return m_values.eventHandlerDrivenSmoothKeyboardScrollingEnabled; }
    void setEventHandlerDrivenSmoothKeyboardScrollingEnabled(bool eventHandlerDrivenSmoothKeyboardScrollingEnabled) { m_values.eventHandlerDrivenSmoothKeyboardScrollingEnabled = eventHandlerDrivenSmoothKeyboardScrollingEnabled; }
    bool fetchPriorityEnabled() const { return m_values.fetchPriorityEnabled; }
    void setFetchPriorityEnabled(bool fetchPriorityEnabled) { m_values.fetchPriorityEnabled = fetchPriorityEnabled; }
    bool fileReaderAPIEnabled() const { return m_values.fileReaderAPIEnabled; }
    void setFileReaderAPIEnabled(bool fileReaderAPIEnabled) { m_values.fileReaderAPIEnabled = fileReaderAPIEnabled; }
    bool fileSystemAccessEnabled() const { return m_values.fileSystemAccessEnabled; }
    void setFileSystemAccessEnabled(bool fileSystemAccessEnabled) { m_values.fileSystemAccessEnabled = fileSystemAccessEnabled; }
    bool fileSystemWritableStreamEnabled() const { return m_values.fileSystemWritableStreamEnabled; }
    void setFileSystemWritableStreamEnabled(bool fileSystemWritableStreamEnabled) { m_values.fileSystemWritableStreamEnabled = fileSystemWritableStreamEnabled; }
    bool filterLinkDecorationByDefaultEnabled() const { return m_values.filterLinkDecorationByDefaultEnabled; }
    void setFilterLinkDecorationByDefaultEnabled(bool filterLinkDecorationByDefaultEnabled) { m_values.filterLinkDecorationByDefaultEnabled = filterLinkDecorationByDefaultEnabled; }
    bool fixedBackgroundsPaintRelativeToDocument() const { return m_values.fixedBackgroundsPaintRelativeToDocument; }
    void setFixedBackgroundsPaintRelativeToDocument(bool fixedBackgroundsPaintRelativeToDocument) { m_values.fixedBackgroundsPaintRelativeToDocument = fixedBackgroundsPaintRelativeToDocument; }
    bool fixedElementsLayoutRelativeToFrame() const { return m_values.fixedElementsLayoutRelativeToFrame; }
    void setFixedElementsLayoutRelativeToFrame(bool fixedElementsLayoutRelativeToFrame) { m_values.fixedElementsLayoutRelativeToFrame = fixedElementsLayoutRelativeToFrame; }
    bool flexFormattingContextIntegrationEnabled() const { return m_values.flexFormattingContextIntegrationEnabled; }
    void setFlexFormattingContextIntegrationEnabled(bool flexFormattingContextIntegrationEnabled) { m_values.flexFormattingContextIntegrationEnabled = flexFormattingContextIntegrationEnabled; }
    bool fontFallbackPrefersPictographs() const { return m_values.fontFallbackPrefersPictographs; }
    WEBCORE_EXPORT void setFontFallbackPrefersPictographs(bool);
    FontLoadTimingOverride fontLoadTimingOverride() const { return m_values.fontLoadTimingOverride; }
    void setFontLoadTimingOverride(FontLoadTimingOverride fontLoadTimingOverride) { m_values.fontLoadTimingOverride = fontLoadTimingOverride; }
    bool forceCompositingMode() const { return m_values.forceCompositingMode; }
    void setForceCompositingMode(bool forceCompositingMode) { m_values.forceCompositingMode = forceCompositingMode; }
    bool forceFTPDirectoryListings() const { return m_values.forceFTPDirectoryListings; }
    void setForceFTPDirectoryListings(bool forceFTPDirectoryListings) { m_values.forceFTPDirectoryListings = forceFTPDirectoryListings; }
    bool forceWebGLUsesLowPower() const { return m_values.forceWebGLUsesLowPower; }
    void setForceWebGLUsesLowPower(bool forceWebGLUsesLowPower) { m_values.forceWebGLUsesLowPower = forceWebGLUsesLowPower; }
    ForcedAccessibilityValue forcedColorsAreInvertedAccessibilityValue() const { return m_values.forcedColorsAreInvertedAccessibilityValue; }
    void setForcedColorsAreInvertedAccessibilityValue(ForcedAccessibilityValue forcedColorsAreInvertedAccessibilityValue) { m_values.forcedColorsAreInvertedAccessibilityValue = forcedColorsAreInvertedAccessibilityValue; }
    ForcedAccessibilityValue forcedDisplayIsMonochromeAccessibilityValue() const { return m_values.forcedDisplayIsMonochromeAccessibilityValue; }
    void setForcedDisplayIsMonochromeAccessibilityValue(ForcedAccessibilityValue forcedDisplayIsMonochromeAccessibilityValue) { m_values.forcedDisplayIsMonochromeAccessibilityValue = forcedDisplayIsMonochromeAccessibilityValue; }
    ForcedAccessibilityValue forcedPrefersContrastAccessibilityValue() const { return m_values.forcedPrefersContrastAccessibilityValue; }
    void setForcedPrefersContrastAccessibilityValue(ForcedAccessibilityValue forcedPrefersContrastAccessibilityValue) { m_values.forcedPrefersContrastAccessibilityValue = forcedPrefersContrastAccessibilityValue; }
    ForcedAccessibilityValue forcedPrefersReducedMotionAccessibilityValue() const { return m_values.forcedPrefersReducedMotionAccessibilityValue; }
    void setForcedPrefersReducedMotionAccessibilityValue(ForcedAccessibilityValue forcedPrefersReducedMotionAccessibilityValue) { m_values.forcedPrefersReducedMotionAccessibilityValue = forcedPrefersReducedMotionAccessibilityValue; }
    ForcedAccessibilityValue forcedSupportsHighDynamicRangeValue() const { return m_values.forcedSupportsHighDynamicRangeValue; }
    WEBCORE_EXPORT void setForcedSupportsHighDynamicRangeValue(ForcedAccessibilityValue);
    const String& ftpDirectoryTemplatePath() const { return m_values.ftpDirectoryTemplatePath; }
    void setFTPDirectoryTemplatePath(const String& ftpDirectoryTemplatePath) { m_values.ftpDirectoryTemplatePath = ftpDirectoryTemplatePath; }
    bool ftpEnabled() const { return m_values.ftpEnabled; }
    void setFTPEnabled(bool ftpEnabled) { m_values.ftpEnabled = ftpEnabled; }
    bool fullscreenRequirementForScreenOrientationLockingEnabled() const { return m_values.fullscreenRequirementForScreenOrientationLockingEnabled; }
    void setFullscreenRequirementForScreenOrientationLockingEnabled(bool fullscreenRequirementForScreenOrientationLockingEnabled) { m_values.fullscreenRequirementForScreenOrientationLockingEnabled = fullscreenRequirementForScreenOrientationLockingEnabled; }
    bool geolocationAPIEnabled() const { return m_values.geolocationAPIEnabled; }
    void setGeolocationAPIEnabled(bool geolocationAPIEnabled) { m_values.geolocationAPIEnabled = geolocationAPIEnabled; }
    bool geolocationFloorLevelEnabled() const { return m_values.geolocationFloorLevelEnabled; }
    void setGeolocationFloorLevelEnabled(bool geolocationFloorLevelEnabled) { m_values.geolocationFloorLevelEnabled = geolocationFloorLevelEnabled; }
    bool getCoalescedEventsEnabled() const { return m_values.getCoalescedEventsEnabled; }
    void setGetCoalescedEventsEnabled(bool getCoalescedEventsEnabled) { m_values.getCoalescedEventsEnabled = getCoalescedEventsEnabled; }
    bool getPredictedEventsEnabled() const { return m_values.getPredictedEventsEnabled; }
    void setGetPredictedEventsEnabled(bool getPredictedEventsEnabled) { m_values.getPredictedEventsEnabled = getPredictedEventsEnabled; }
    bool googleAntiFlickerOptimizationQuirkEnabled() const { return m_values.googleAntiFlickerOptimizationQuirkEnabled; }
    void setGoogleAntiFlickerOptimizationQuirkEnabled(bool googleAntiFlickerOptimizationQuirkEnabled) { m_values.googleAntiFlickerOptimizationQuirkEnabled = googleAntiFlickerOptimizationQuirkEnabled; }
    bool hiddenPageCSSAnimationSuspensionEnabled() const { return m_values.hiddenPageCSSAnimationSuspensionEnabled; }
    WEBCORE_EXPORT void setHiddenPageCSSAnimationSuspensionEnabled(bool);
    bool hiddenPageDOMTimerThrottlingAutoIncreases() const { return m_values.hiddenPageDOMTimerThrottlingAutoIncreases; }
    WEBCORE_EXPORT void setHiddenPageDOMTimerThrottlingAutoIncreases(bool);
    bool hiddenPageDOMTimerThrottlingEnabled() const { return m_values.hiddenPageDOMTimerThrottlingEnabled; }
    WEBCORE_EXPORT void setHiddenPageDOMTimerThrottlingEnabled(bool);
    HTMLParserScriptingFlagPolicy htmlParserScriptingFlagPolicy() const { return m_values.htmlParserScriptingFlagPolicy; }
    void setHTMLParserScriptingFlagPolicy(HTMLParserScriptingFlagPolicy htmlParserScriptingFlagPolicy) { m_values.htmlParserScriptingFlagPolicy = htmlParserScriptingFlagPolicy; }
    bool httpEquivEnabled() const { return m_values.httpEquivEnabled; }
    void setHttpEquivEnabled(bool httpEquivEnabled) { m_values.httpEquivEnabled = httpEquivEnabled; }
    bool httpsByDefault() const { return m_values.httpsByDefault; }
    void setHttpsByDefault(bool httpsByDefault) { m_values.httpsByDefault = httpsByDefault; }
    bool hyperlinkAuditingEnabled() const { return m_values.hyperlinkAuditingEnabled; }
    void setHyperlinkAuditingEnabled(bool hyperlinkAuditingEnabled) { m_values.hyperlinkAuditingEnabled = hyperlinkAuditingEnabled; }
    bool iPAddressAndLocalhostMixedContentUpgradeTestingEnabled() const { return m_values.iPAddressAndLocalhostMixedContentUpgradeTestingEnabled; }
    void setIPAddressAndLocalhostMixedContentUpgradeTestingEnabled(bool iPAddressAndLocalhostMixedContentUpgradeTestingEnabled) { m_values.iPAddressAndLocalhostMixedContentUpgradeTestingEnabled = iPAddressAndLocalhostMixedContentUpgradeTestingEnabled; }
    WEBCORE_EXPORT bool iceCandidateFilteringEnabled() const;
    WEBCORE_EXPORT void setICECandidateFilteringEnabled(bool);
    bool ignoreIframeEmbeddingProtectionsEnabled() const { return m_values.ignoreIframeEmbeddingProtectionsEnabled; }
    void setIgnoreIframeEmbeddingProtectionsEnabled(bool ignoreIframeEmbeddingProtectionsEnabled) { m_values.ignoreIframeEmbeddingProtectionsEnabled = ignoreIframeEmbeddingProtectionsEnabled; }
    bool imageSubsamplingEnabled() const { return m_values.imageSubsamplingEnabled; }
    void setImageSubsamplingEnabled(bool imageSubsamplingEnabled) { m_values.imageSubsamplingEnabled = imageSubsamplingEnabled; }
    WEBCORE_EXPORT bool areImagesEnabled() const;
    WEBCORE_EXPORT void setImagesEnabled(bool);
    bool inWindowFullscreenEnabled() const { return m_values.inWindowFullscreenEnabled; }
    void setInWindowFullscreenEnabled(bool inWindowFullscreenEnabled) { m_values.inWindowFullscreenEnabled = inWindowFullscreenEnabled; }
    bool incompleteImageBorderEnabled() const { return m_values.incompleteImageBorderEnabled; }
    void setIncompleteImageBorderEnabled(bool incompleteImageBorderEnabled) { m_values.incompleteImageBorderEnabled = incompleteImageBorderEnabled; }
    double incrementalRenderingSuppressionTimeoutInSeconds() const { return m_values.incrementalRenderingSuppressionTimeoutInSeconds; }
    void setIncrementalRenderingSuppressionTimeoutInSeconds(double incrementalRenderingSuppressionTimeoutInSeconds) { m_values.incrementalRenderingSuppressionTimeoutInSeconds = incrementalRenderingSuppressionTimeoutInSeconds; }
    bool indexedDBAPIEnabled() const { return m_values.indexedDBAPIEnabled; }
    void setIndexedDBAPIEnabled(bool indexedDBAPIEnabled) { m_values.indexedDBAPIEnabled = indexedDBAPIEnabled; }
    bool inlineMediaPlaybackRequiresPlaysInlineAttribute() const { return m_values.inlineMediaPlaybackRequiresPlaysInlineAttribute; }
    void setInlineMediaPlaybackRequiresPlaysInlineAttribute(bool inlineMediaPlaybackRequiresPlaysInlineAttribute) { m_values.inlineMediaPlaybackRequiresPlaysInlineAttribute = inlineMediaPlaybackRequiresPlaysInlineAttribute; }
    double interactionRegionInlinePadding() const { return m_values.interactionRegionInlinePadding; }
    void setInteractionRegionInlinePadding(double interactionRegionInlinePadding) { m_values.interactionRegionInlinePadding = interactionRegionInlinePadding; }
    double interactionRegionMinimumCornerRadius() const { return m_values.interactionRegionMinimumCornerRadius; }
    void setInteractionRegionMinimumCornerRadius(double interactionRegionMinimumCornerRadius) { m_values.interactionRegionMinimumCornerRadius = interactionRegionMinimumCornerRadius; }
    bool interactiveFormValidationEnabled() const { return m_values.interactiveFormValidationEnabled; }
    void setInteractiveFormValidationEnabled(bool interactiveFormValidationEnabled) { m_values.interactiveFormValidationEnabled = interactiveFormValidationEnabled; }
    bool invisibleAutoplayNotPermitted() const { return m_values.invisibleAutoplayNotPermitted; }
    void setInvisibleAutoplayNotPermitted(bool invisibleAutoplayNotPermitted) { m_values.invisibleAutoplayNotPermitted = invisibleAutoplayNotPermitted; }
    bool invokerAttributesEnabled() const { return m_values.invokerAttributesEnabled; }
    void setInvokerAttributesEnabled(bool invokerAttributesEnabled) { m_values.invokerAttributesEnabled = invokerAttributesEnabled; }
    bool isFirstPartyWebsiteDataRemovalDisabled() const { return m_values.isFirstPartyWebsiteDataRemovalDisabled; }
    void setIsFirstPartyWebsiteDataRemovalDisabled(bool isFirstPartyWebsiteDataRemovalDisabled) { m_values.isFirstPartyWebsiteDataRemovalDisabled = isFirstPartyWebsiteDataRemovalDisabled; }
    bool isFirstPartyWebsiteDataRemovalLiveOnTestingEnabled() const { return m_values.isFirstPartyWebsiteDataRemovalLiveOnTestingEnabled; }
    void setIsFirstPartyWebsiteDataRemovalLiveOnTestingEnabled(bool isFirstPartyWebsiteDataRemovalLiveOnTestingEnabled) { m_values.isFirstPartyWebsiteDataRemovalLiveOnTestingEnabled = isFirstPartyWebsiteDataRemovalLiveOnTestingEnabled; }
    bool isFirstPartyWebsiteDataRemovalReproTestingEnabled() const { return m_values.isFirstPartyWebsiteDataRemovalReproTestingEnabled; }
    void setIsFirstPartyWebsiteDataRemovalReproTestingEnabled(bool isFirstPartyWebsiteDataRemovalReproTestingEnabled) { m_values.isFirstPartyWebsiteDataRemovalReproTestingEnabled = isFirstPartyWebsiteDataRemovalReproTestingEnabled; }
    bool isPerActivityStateCPUUsageMeasurementEnabled() const { return m_values.isPerActivityStateCPUUsageMeasurementEnabled; }
    void setIsPerActivityStateCPUUsageMeasurementEnabled(bool isPerActivityStateCPUUsageMeasurementEnabled) { m_values.isPerActivityStateCPUUsageMeasurementEnabled = isPerActivityStateCPUUsageMeasurementEnabled; }
    bool isPostBackgroundingCPUUsageMeasurementEnabled() const { return m_values.isPostBackgroundingCPUUsageMeasurementEnabled; }
    void setIsPostBackgroundingCPUUsageMeasurementEnabled(bool isPostBackgroundingCPUUsageMeasurementEnabled) { m_values.isPostBackgroundingCPUUsageMeasurementEnabled = isPostBackgroundingCPUUsageMeasurementEnabled; }
    bool isPostBackgroundingMemoryUsageMeasurementEnabled() const { return m_values.isPostBackgroundingMemoryUsageMeasurementEnabled; }
    void setIsPostBackgroundingMemoryUsageMeasurementEnabled(bool isPostBackgroundingMemoryUsageMeasurementEnabled) { m_values.isPostBackgroundingMemoryUsageMeasurementEnabled = isPostBackgroundingMemoryUsageMeasurementEnabled; }
    bool isPostLoadCPUUsageMeasurementEnabled() const { return m_values.isPostLoadCPUUsageMeasurementEnabled; }
    void setIsPostLoadCPUUsageMeasurementEnabled(bool isPostLoadCPUUsageMeasurementEnabled) { m_values.isPostLoadCPUUsageMeasurementEnabled = isPostLoadCPUUsageMeasurementEnabled; }
    bool isPostLoadMemoryUsageMeasurementEnabled() const { return m_values.isPostLoadMemoryUsageMeasurementEnabled; }
    void setIsPostLoadMemoryUsageMeasurementEnabled(bool isPostLoadMemoryUsageMeasurementEnabled) { m_values.isPostLoadMemoryUsageMeasurementEnabled = isPostLoadMemoryUsageMeasurementEnabled; }
    bool isSameSiteStrictEnforcementEnabled() const { return m_values.isSameSiteStrictEnforcementEnabled; }
    void setIsSameSiteStrictEnforcementEnabled(bool isSameSiteStrictEnforcementEnabled) { m_values.isSameSiteStrictEnforcementEnabled = isSameSiteStrictEnforcementEnabled; }
    bool isThirdPartyCookieBlockingDisabled() const { return m_values.isThirdPartyCookieBlockingDisabled; }
    void setIsThirdPartyCookieBlockingDisabled(bool isThirdPartyCookieBlockingDisabled) { m_values.isThirdPartyCookieBlockingDisabled = isThirdPartyCookieBlockingDisabled; }
    bool itpDebugModeEnabled() const { return m_values.itpDebugModeEnabled; }
    void setItpDebugModeEnabled(bool itpDebugModeEnabled) { m_values.itpDebugModeEnabled = itpDebugModeEnabled; }
    bool javaScriptCanAccessClipboard() const { return m_values.javaScriptCanAccessClipboard; }
    void setJavaScriptCanAccessClipboard(bool javaScriptCanAccessClipboard) { m_values.javaScriptCanAccessClipboard = javaScriptCanAccessClipboard; }
    bool javaScriptCanOpenWindowsAutomatically() const { return m_values.javaScriptCanOpenWindowsAutomatically; }
    void setJavaScriptCanOpenWindowsAutomatically(bool javaScriptCanOpenWindowsAutomatically) { m_values.javaScriptCanOpenWindowsAutomatically = javaScriptCanOpenWindowsAutomatically; }
    JSC::RuntimeFlags javaScriptRuntimeFlags() const { return m_values.javaScriptRuntimeFlags; }
    void setJavaScriptRuntimeFlags(JSC::RuntimeFlags javaScriptRuntimeFlags) { m_values.javaScriptRuntimeFlags = javaScriptRuntimeFlags; }
    bool langAttributeAwareFormControlUIEnabled() const { return m_values.langAttributeAwareFormControlUIEnabled; }
    void setLangAttributeAwareFormControlUIEnabled(bool langAttributeAwareFormControlUIEnabled) { m_values.langAttributeAwareFormControlUIEnabled = langAttributeAwareFormControlUIEnabled; }
    bool largeImageAsyncDecodingEnabled() const { return m_values.largeImageAsyncDecodingEnabled; }
    void setLargeImageAsyncDecodingEnabled(bool largeImageAsyncDecodingEnabled) { m_values.largeImageAsyncDecodingEnabled = largeImageAsyncDecodingEnabled; }
    bool layerBasedSVGEngineEnabled() const { return m_values.layerBasedSVGEngineEnabled; }
    WEBCORE_EXPORT void setLayerBasedSVGEngineEnabled(bool);
    uint32_t layoutFallbackWidth() const { return m_values.layoutFallbackWidth; }
    void setLayoutFallbackWidth(uint32_t layoutFallbackWidth) { m_values.layoutFallbackWidth = layoutFallbackWidth; }
    double layoutViewportHeightExpansionFactor() const { return m_values.layoutViewportHeightExpansionFactor; }
    WEBCORE_EXPORT void setLayoutViewportHeightExpansionFactor(double);
    bool lazyIframeLoadingEnabled() const { return m_values.lazyIframeLoadingEnabled; }
    void setLazyIframeLoadingEnabled(bool lazyIframeLoadingEnabled) { m_values.lazyIframeLoadingEnabled = lazyIframeLoadingEnabled; }
    bool lazyImageLoadingEnabled() const { return m_values.lazyImageLoadingEnabled; }
    void setLazyImageLoadingEnabled(bool lazyImageLoadingEnabled) { m_values.lazyImageLoadingEnabled = lazyImageLoadingEnabled; }
    bool legacyLineLayoutVisualCoverageEnabled() const { return m_values.legacyLineLayoutVisualCoverageEnabled; }
    WEBCORE_EXPORT void setLegacyLineLayoutVisualCoverageEnabled(bool);
    bool legacyPluginQuirkForMailSignaturesEnabled() const { return m_values.legacyPluginQuirkForMailSignaturesEnabled; }
    void setLegacyPluginQuirkForMailSignaturesEnabled(bool legacyPluginQuirkForMailSignaturesEnabled) { m_values.legacyPluginQuirkForMailSignaturesEnabled = legacyPluginQuirkForMailSignaturesEnabled; }
    bool linkModulePreloadEnabled() const { return m_values.linkModulePreloadEnabled; }
    void setLinkModulePreloadEnabled(bool linkModulePreloadEnabled) { m_values.linkModulePreloadEnabled = linkModulePreloadEnabled; }
    bool linkPreconnectEarlyHintsEnabled() const { return m_values.linkPreconnectEarlyHintsEnabled; }
    void setLinkPreconnectEarlyHintsEnabled(bool linkPreconnectEarlyHintsEnabled) { m_values.linkPreconnectEarlyHintsEnabled = linkPreconnectEarlyHintsEnabled; }
    bool linkPreconnectEnabled() const { return m_values.linkPreconnectEnabled; }
    void setLinkPreconnectEnabled(bool linkPreconnectEnabled) { m_values.linkPreconnectEnabled = linkPreconnectEnabled; }
    bool linkPrefetchEnabled() const { return m_values.linkPrefetchEnabled; }
    void setLinkPrefetchEnabled(bool linkPrefetchEnabled) { m_values.linkPrefetchEnabled = linkPrefetchEnabled; }
    bool linkPreloadEnabled() const { return m_values.linkPreloadEnabled; }
    void setLinkPreloadEnabled(bool linkPreloadEnabled) { m_values.linkPreloadEnabled = linkPreloadEnabled; }
    bool linkPreloadResponsiveImagesEnabled() const { return m_values.linkPreloadResponsiveImagesEnabled; }
    void setLinkPreloadResponsiveImagesEnabled(bool linkPreloadResponsiveImagesEnabled) { m_values.linkPreloadResponsiveImagesEnabled = linkPreloadResponsiveImagesEnabled; }
    bool linkSanitizerEnabled() const { return m_values.linkSanitizerEnabled; }
    void setLinkSanitizerEnabled(bool linkSanitizerEnabled) { m_values.linkSanitizerEnabled = linkSanitizerEnabled; }
    bool liveRangeSelectionEnabled() const { return m_values.liveRangeSelectionEnabled; }
    void setLiveRangeSelectionEnabled(bool liveRangeSelectionEnabled) { m_values.liveRangeSelectionEnabled = liveRangeSelectionEnabled; }
    bool loadDeferringEnabled() const { return m_values.loadDeferringEnabled; }
    void setLoadDeferringEnabled(bool loadDeferringEnabled) { m_values.loadDeferringEnabled = loadDeferringEnabled; }
    bool loadsImagesAutomatically() const { return m_values.loadsImagesAutomatically; }
    WEBCORE_EXPORT void setLoadsImagesAutomatically(bool);
    bool localFileContentSniffingEnabled() const { return m_values.localFileContentSniffingEnabled; }
    void setLocalFileContentSniffingEnabled(bool localFileContentSniffingEnabled) { m_values.localFileContentSniffingEnabled = localFileContentSniffingEnabled; }
    const String& localStorageDatabasePath() const { return m_values.localStorageDatabasePath; }
    void setLocalStorageDatabasePath(const String& localStorageDatabasePath) { m_values.localStorageDatabasePath = localStorageDatabasePath; }
    bool localStorageEnabled() const { return m_values.localStorageEnabled; }
    void setLocalStorageEnabled(bool localStorageEnabled) { m_values.localStorageEnabled = localStorageEnabled; }
    bool lockdownFontParserEnabled() const { return m_values.lockdownFontParserEnabled; }
    void setLockdownFontParserEnabled(bool lockdownFontParserEnabled) { m_values.lockdownFontParserEnabled = lockdownFontParserEnabled; }
    bool loginStatusAPIEnabled() const { return m_values.loginStatusAPIEnabled; }
    void setLoginStatusAPIEnabled(bool loginStatusAPIEnabled) { m_values.loginStatusAPIEnabled = loginStatusAPIEnabled; }
    bool loginStatusAPIRequiresWebAuthnEnabled() const { return m_values.loginStatusAPIRequiresWebAuthnEnabled; }
    void setLoginStatusAPIRequiresWebAuthnEnabled(bool loginStatusAPIRequiresWebAuthnEnabled) { m_values.loginStatusAPIRequiresWebAuthnEnabled = loginStatusAPIRequiresWebAuthnEnabled; }
    bool logsPageMessagesToSystemConsoleEnabled() const { return m_values.logsPageMessagesToSystemConsoleEnabled; }
    void setLogsPageMessagesToSystemConsoleEnabled(bool logsPageMessagesToSystemConsoleEnabled) { m_values.logsPageMessagesToSystemConsoleEnabled = logsPageMessagesToSystemConsoleEnabled; }
    bool mainContentUserGestureOverrideEnabled() const { return m_values.mainContentUserGestureOverrideEnabled; }
    void setMainContentUserGestureOverrideEnabled(bool mainContentUserGestureOverrideEnabled) { m_values.mainContentUserGestureOverrideEnabled = mainContentUserGestureOverrideEnabled; }
    bool masonryEnabled() const { return m_values.masonryEnabled; }
    void setMasonryEnabled(bool masonryEnabled) { m_values.masonryEnabled = masonryEnabled; }
    double maxParseDuration() const { return m_values.maxParseDuration; }
    void setMaxParseDuration(double maxParseDuration) { m_values.maxParseDuration = maxParseDuration; }
    uint32_t maximumHTMLParserDOMTreeDepth() const { return m_values.maximumHTMLParserDOMTreeDepth; }
    void setMaximumHTMLParserDOMTreeDepth(uint32_t maximumHTMLParserDOMTreeDepth) { m_values.maximumHTMLParserDOMTreeDepth = maximumHTMLParserDOMTreeDepth; }
    bool mediaCapabilitiesEnabled() const { return m_values.mediaCapabilitiesEnabled; }
    void setMediaCapabilitiesEnabled(bool mediaCapabilitiesEnabled) { m_values.mediaCapabilitiesEnabled = mediaCapabilitiesEnabled; }
    bool mediaCapabilitiesExtensionsEnabled() const { return m_values.mediaCapabilitiesExtensionsEnabled; }
    void setMediaCapabilitiesExtensionsEnabled(bool mediaCapabilitiesExtensionsEnabled) { m_values.mediaCapabilitiesExtensionsEnabled = mediaCapabilitiesExtensionsEnabled; }
    bool mediaControlsScaleWithPageZoom() const { return m_values.mediaControlsScaleWithPageZoom; }
    void setMediaControlsScaleWithPageZoom(bool mediaControlsScaleWithPageZoom) { m_values.mediaControlsScaleWithPageZoom = mediaControlsScaleWithPageZoom; }
    bool mediaDataLoadsAutomatically() const { return m_values.mediaDataLoadsAutomatically; }
    void setMediaDataLoadsAutomatically(bool mediaDataLoadsAutomatically) { m_values.mediaDataLoadsAutomatically = mediaDataLoadsAutomatically; }
    const String& mediaKeysStorageDirectory() const { return m_values.mediaKeysStorageDirectory; }
    void setMediaKeysStorageDirectory(const String& mediaKeysStorageDirectory) { m_values.mediaKeysStorageDirectory = mediaKeysStorageDirectory; }
    bool mediaPlaybackEnabled() const { return m_values.mediaPlaybackEnabled; }
    void setMediaPlaybackEnabled(bool mediaPlaybackEnabled) { m_values.mediaPlaybackEnabled = mediaPlaybackEnabled; }
    double mediaPreferredFullscreenWidth() const { return m_values.mediaPreferredFullscreenWidth; }
    void setMediaPreferredFullscreenWidth(double mediaPreferredFullscreenWidth) { m_values.mediaPreferredFullscreenWidth = mediaPreferredFullscreenWidth; }
    bool mediaPreloadingEnabled() const { return m_values.mediaPreloadingEnabled; }
    void setMediaPreloadingEnabled(bool mediaPreloadingEnabled) { m_values.mediaPreloadingEnabled = mediaPreloadingEnabled; }
    bool mediaSessionCaptureToggleAPIEnabled() const { return m_values.mediaSessionCaptureToggleAPIEnabled; }
    void setMediaSessionCaptureToggleAPIEnabled(bool mediaSessionCaptureToggleAPIEnabled) { m_values.mediaSessionCaptureToggleAPIEnabled = mediaSessionCaptureToggleAPIEnabled; }
    bool mediaSourceEnabled() const { return m_values.mediaSourceEnabled; }
    void setMediaSourceEnabled(bool mediaSourceEnabled) { m_values.mediaSourceEnabled = mediaSourceEnabled; }
    const String& mediaTypeOverride() const { return m_values.mediaTypeOverride; }
    WEBCORE_EXPORT void setMediaTypeOverride(const String&);
    bool mediaUserGestureInheritsFromDocument() const { return m_values.mediaUserGestureInheritsFromDocument; }
    void setMediaUserGestureInheritsFromDocument(bool mediaUserGestureInheritsFromDocument) { m_values.mediaUserGestureInheritsFromDocument = mediaUserGestureInheritsFromDocument; }
    uint64_t minimumAccelerated2DContextArea() const { return m_values.minimumAccelerated2DContextArea; }
    void setMinimumAccelerated2DContextArea(uint64_t minimumAccelerated2DContextArea) { m_values.minimumAccelerated2DContextArea = minimumAccelerated2DContextArea; }
    double minimumFontSize() const { return m_values.minimumFontSize; }
    WEBCORE_EXPORT void setMinimumFontSize(double);
    double minimumLogicalFontSize() const { return m_values.minimumLogicalFontSize; }
    WEBCORE_EXPORT void setMinimumLogicalFontSize(double);
    bool mockScrollbarsControllerEnabled() const { return m_values.mockScrollbarsControllerEnabled; }
    void setMockScrollbarsControllerEnabled(bool mockScrollbarsControllerEnabled) { m_values.mockScrollbarsControllerEnabled = mockScrollbarsControllerEnabled; }
    bool momentumScrollingAnimatorEnabled() const { return m_values.momentumScrollingAnimatorEnabled; }
    void setMomentumScrollingAnimatorEnabled(bool momentumScrollingAnimatorEnabled) { m_values.momentumScrollingAnimatorEnabled = momentumScrollingAnimatorEnabled; }
    bool navigationAPIEnabled() const { return m_values.navigationAPIEnabled; }
    void setNavigationAPIEnabled(bool navigationAPIEnabled) { m_values.navigationAPIEnabled = navigationAPIEnabled; }
    bool needsAcrobatFrameReloadingQuirk() const { return m_values.needsAdobeFrameReloadingQuirk; }
    void setNeedsAdobeFrameReloadingQuirk(bool needsAdobeFrameReloadingQuirk) { m_values.needsAdobeFrameReloadingQuirk = needsAdobeFrameReloadingQuirk; }
    bool needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk() const { return m_values.needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk; }
    void setNeedsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk(bool needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk) { m_values.needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk = needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk; }
    bool needsFrameNameFallbackToIdQuirk() const { return m_values.needsFrameNameFallbackToIdQuirk; }
    void setNeedsFrameNameFallbackToIdQuirk(bool needsFrameNameFallbackToIdQuirk) { m_values.needsFrameNameFallbackToIdQuirk = needsFrameNameFallbackToIdQuirk; }
    bool needsKeyboardEventDisambiguationQuirks() const { return m_values.needsKeyboardEventDisambiguationQuirks; }
    void setNeedsKeyboardEventDisambiguationQuirks(bool needsKeyboardEventDisambiguationQuirks) { m_values.needsKeyboardEventDisambiguationQuirks = needsKeyboardEventDisambiguationQuirks; }
    WEBCORE_EXPORT bool needsSiteSpecificQuirks() const;
    void setNeedsSiteSpecificQuirks(bool needsSiteSpecificQuirks) { m_values.needsSiteSpecificQuirks = needsSiteSpecificQuirks; }
    bool needsStorageAccessFromFileURLsQuirk() const { return m_values.needsStorageAccessFromFileURLsQuirk; }
    void setNeedsStorageAccessFromFileURLsQuirk(bool needsStorageAccessFromFileURLsQuirk) { m_values.needsStorageAccessFromFileURLsQuirk = needsStorageAccessFromFileURLsQuirk; }
    bool observableEnabled() const { return m_values.observableEnabled; }
    void setObservableEnabled(bool observableEnabled) { m_values.observableEnabled = observableEnabled; }
    bool opportunisticSweepingAndGarbageCollectionEnabled() const { return m_values.opportunisticSweepingAndGarbageCollectionEnabled; }
    void setOpportunisticSweepingAndGarbageCollectionEnabled(bool opportunisticSweepingAndGarbageCollectionEnabled) { m_values.opportunisticSweepingAndGarbageCollectionEnabled = opportunisticSweepingAndGarbageCollectionEnabled; }
    bool overlappingBackingStoreProvidersEnabled() const { return m_values.overlappingBackingStoreProvidersEnabled; }
    void setOverlappingBackingStoreProvidersEnabled(bool overlappingBackingStoreProvidersEnabled) { m_values.overlappingBackingStoreProvidersEnabled = overlappingBackingStoreProvidersEnabled; }
    bool overscrollBehaviorEnabled() const { return m_values.overscrollBehaviorEnabled; }
    void setOverscrollBehaviorEnabled(bool overscrollBehaviorEnabled) { m_values.overscrollBehaviorEnabled = overscrollBehaviorEnabled; }
    bool pageAtRuleMarginDescriptorsEnabled() const { return m_values.pageAtRuleMarginDescriptorsEnabled; }
    void setPageAtRuleMarginDescriptorsEnabled(bool pageAtRuleMarginDescriptorsEnabled) { m_values.pageAtRuleMarginDescriptorsEnabled = pageAtRuleMarginDescriptorsEnabled; }
    bool passiveTouchListenersAsDefaultOnDocument() const { return m_values.passiveTouchListenersAsDefaultOnDocument; }
    void setPassiveTouchListenersAsDefaultOnDocument(bool passiveTouchListenersAsDefaultOnDocument) { m_values.passiveTouchListenersAsDefaultOnDocument = passiveTouchListenersAsDefaultOnDocument; }
    bool passiveWheelListenersAsDefaultOnDocument() const { return m_values.passiveWheelListenersAsDefaultOnDocument; }
    void setPassiveWheelListenersAsDefaultOnDocument(bool passiveWheelListenersAsDefaultOnDocument) { m_values.passiveWheelListenersAsDefaultOnDocument = passiveWheelListenersAsDefaultOnDocument; }
    double passwordEchoDurationInSeconds() const { return m_values.passwordEchoDurationInSeconds; }
    void setPasswordEchoDurationInSeconds(double passwordEchoDurationInSeconds) { m_values.passwordEchoDurationInSeconds = passwordEchoDurationInSeconds; }
    bool passwordEchoEnabled() const { return m_values.passwordEchoEnabled; }
    void setPasswordEchoEnabled(bool passwordEchoEnabled) { m_values.passwordEchoEnabled = passwordEchoEnabled; }
    bool permissionsAPIEnabled() const { return m_values.permissionsAPIEnabled; }
    void setPermissionsAPIEnabled(bool permissionsAPIEnabled) { m_values.permissionsAPIEnabled = permissionsAPIEnabled; }
    MediaPlayerEnums::PitchCorrectionAlgorithm pitchCorrectionAlgorithm() const { return m_values.pitchCorrectionAlgorithm; }
    void setPitchCorrectionAlgorithm(MediaPlayerEnums::PitchCorrectionAlgorithm pitchCorrectionAlgorithm) { m_values.pitchCorrectionAlgorithm = pitchCorrectionAlgorithm; }
    bool popoverAttributeEnabled() const { return m_values.popoverAttributeEnabled; }
    void setPopoverAttributeEnabled(bool popoverAttributeEnabled) { m_values.popoverAttributeEnabled = popoverAttributeEnabled; }
    bool preferMIMETypeForImages() const { return m_values.preferMIMETypeForImages; }
    void setPreferMIMETypeForImages(bool preferMIMETypeForImages) { m_values.preferMIMETypeForImages = preferMIMETypeForImages; }
    bool preferPageRenderingUpdatesNear60FPSEnabled() const { return m_values.preferPageRenderingUpdatesNear60FPSEnabled; }
    void setPreferPageRenderingUpdatesNear60FPSEnabled(bool preferPageRenderingUpdatesNear60FPSEnabled) { m_values.preferPageRenderingUpdatesNear60FPSEnabled = preferPageRenderingUpdatesNear60FPSEnabled; }
    bool preventKeyboardDOMEventDispatch() const { return m_values.preventKeyboardDOMEventDispatch; }
    void setPreventKeyboardDOMEventDispatch(bool preventKeyboardDOMEventDispatch) { m_values.preventKeyboardDOMEventDispatch = preventKeyboardDOMEventDispatch; }
    bool privateClickMeasurementDebugModeEnabled() const { return m_values.privateClickMeasurementDebugModeEnabled; }
    void setPrivateClickMeasurementDebugModeEnabled(bool privateClickMeasurementDebugModeEnabled) { m_values.privateClickMeasurementDebugModeEnabled = privateClickMeasurementDebugModeEnabled; }
    bool privateClickMeasurementEnabled() const { return m_values.privateClickMeasurementEnabled; }
    void setPrivateClickMeasurementEnabled(bool privateClickMeasurementEnabled) { m_values.privateClickMeasurementEnabled = privateClickMeasurementEnabled; }
    bool privateClickMeasurementFraudPreventionEnabled() const { return m_values.privateClickMeasurementFraudPreventionEnabled; }
    void setPrivateClickMeasurementFraudPreventionEnabled(bool privateClickMeasurementFraudPreventionEnabled) { m_values.privateClickMeasurementFraudPreventionEnabled = privateClickMeasurementFraudPreventionEnabled; }
    bool privateTokenUsageByThirdPartyEnabled() const { return m_values.privateTokenUsageByThirdPartyEnabled; }
    void setPrivateTokenUsageByThirdPartyEnabled(bool privateTokenUsageByThirdPartyEnabled) { m_values.privateTokenUsageByThirdPartyEnabled = privateTokenUsageByThirdPartyEnabled; }
    bool punchOutWhiteBackgroundsInDarkMode() const { return m_values.punchOutWhiteBackgroundsInDarkMode; }
    WEBCORE_EXPORT void setPunchOutWhiteBackgroundsInDarkMode(bool);
    bool pushAPIEnabled() const { return m_values.pushAPIEnabled; }
    void setPushAPIEnabled(bool pushAPIEnabled) { m_values.pushAPIEnabled = pushAPIEnabled; }
    bool reportingEnabled() const { return m_values.reportingEnabled; }
    void setReportingEnabled(bool reportingEnabled) { m_values.reportingEnabled = reportingEnabled; }
    bool requestIdleCallbackEnabled() const { return m_values.requestIdleCallbackEnabled; }
    void setRequestIdleCallbackEnabled(bool requestIdleCallbackEnabled) { m_values.requestIdleCallbackEnabled = requestIdleCallbackEnabled; }
    bool requestStorageAccessThrowsExceptionUntilReload() const { return m_values.requestStorageAccessThrowsExceptionUntilReload; }
    void setRequestStorageAccessThrowsExceptionUntilReload(bool requestStorageAccessThrowsExceptionUntilReload) { m_values.requestStorageAccessThrowsExceptionUntilReload = requestStorageAccessThrowsExceptionUntilReload; }
    bool requestVideoFrameCallbackEnabled() const { return m_values.requestVideoFrameCallbackEnabled; }
    void setRequestVideoFrameCallbackEnabled(bool requestVideoFrameCallbackEnabled) { m_values.requestVideoFrameCallbackEnabled = requestVideoFrameCallbackEnabled; }
    bool requiresPageVisibilityToPlayAudio() const { return m_values.requiresPageVisibilityToPlayAudio; }
    void setRequiresPageVisibilityToPlayAudio(bool requiresPageVisibilityToPlayAudio) { m_values.requiresPageVisibilityToPlayAudio = requiresPageVisibilityToPlayAudio; }
    bool requiresUserGestureForAudioPlayback() const { return m_values.requiresUserGestureForAudioPlayback; }
    void setRequiresUserGestureForAudioPlayback(bool requiresUserGestureForAudioPlayback) { m_values.requiresUserGestureForAudioPlayback = requiresUserGestureForAudioPlayback; }
    bool requiresUserGestureForVideoPlayback() const { return m_values.requiresUserGestureForVideoPlayback; }
    void setRequiresUserGestureForVideoPlayback(bool requiresUserGestureForVideoPlayback) { m_values.requiresUserGestureForVideoPlayback = requiresUserGestureForVideoPlayback; }
    bool requiresUserGestureToLoadVideo() const { return m_values.requiresUserGestureToLoadVideo; }
    void setRequiresUserGestureToLoadVideo(bool requiresUserGestureToLoadVideo) { m_values.requiresUserGestureToLoadVideo = requiresUserGestureToLoadVideo; }
    bool resourceLoadSchedulingEnabled() const { return m_values.resourceLoadSchedulingEnabled; }
    void setResourceLoadSchedulingEnabled(bool resourceLoadSchedulingEnabled) { m_values.resourceLoadSchedulingEnabled = resourceLoadSchedulingEnabled; }
    bool respondToThermalPressureAggressively() const { return m_values.respondToThermalPressureAggressively; }
    void setRespondToThermalPressureAggressively(bool respondToThermalPressureAggressively) { m_values.respondToThermalPressureAggressively = respondToThermalPressureAggressively; }
    bool sKAttributionEnabled() const { return m_values.sKAttributionEnabled; }
    void setSKAttributionEnabled(bool sKAttributionEnabled) { m_values.sKAttributionEnabled = sKAttributionEnabled; }
    double sampledPageTopColorMaxDifference() const { return m_values.sampledPageTopColorMaxDifference; }
    void setSampledPageTopColorMaxDifference(double sampledPageTopColorMaxDifference) { m_values.sampledPageTopColorMaxDifference = sampledPageTopColorMaxDifference; }
    double sampledPageTopColorMinHeight() const { return m_values.sampledPageTopColorMinHeight; }
    void setSampledPageTopColorMinHeight(double sampledPageTopColorMinHeight) { m_values.sampledPageTopColorMinHeight = sampledPageTopColorMinHeight; }
    bool scopedCustomElementRegistryEnabled() const { return m_values.scopedCustomElementRegistryEnabled; }
    void setScopedCustomElementRegistryEnabled(bool scopedCustomElementRegistryEnabled) { m_values.scopedCustomElementRegistryEnabled = scopedCustomElementRegistryEnabled; }
    bool screenOrientationAPIEnabled() const { return m_values.screenOrientationAPIEnabled; }
    void setScreenOrientationAPIEnabled(bool screenOrientationAPIEnabled) { m_values.screenOrientationAPIEnabled = screenOrientationAPIEnabled; }
    bool screenOrientationLockingAPIEnabled() const { return m_values.screenOrientationLockingAPIEnabled; }
    void setScreenOrientationLockingAPIEnabled(bool screenOrientationLockingAPIEnabled) { m_values.screenOrientationLockingAPIEnabled = screenOrientationLockingAPIEnabled; }
    bool screenWakeLockAPIEnabled() const { return m_values.screenWakeLockAPIEnabled; }
    void setScreenWakeLockAPIEnabled(bool screenWakeLockAPIEnabled) { m_values.screenWakeLockAPIEnabled = screenWakeLockAPIEnabled; }
    WEBCORE_EXPORT bool isScriptEnabled() const;
    void setScriptEnabled(bool scriptEnabled) { m_values.scriptEnabled = scriptEnabled; }
    bool scriptMarkupEnabled() const { return m_values.scriptMarkupEnabled; }
    void setScriptMarkupEnabled(bool scriptMarkupEnabled) { m_values.scriptMarkupEnabled = scriptMarkupEnabled; }
    bool scriptTelemetryLoggingEnabled() const { return m_values.scriptTelemetryLoggingEnabled; }
    void setScriptTelemetryLoggingEnabled(bool scriptTelemetryLoggingEnabled) { m_values.scriptTelemetryLoggingEnabled = scriptTelemetryLoggingEnabled; }
    bool scrollAnimatorEnabled() const { return m_values.scrollAnimatorEnabled; }
    void setScrollAnimatorEnabled(bool scrollAnimatorEnabled) { m_values.scrollAnimatorEnabled = scrollAnimatorEnabled; }
    bool scrollDrivenAnimationsEnabled() const { return m_values.scrollDrivenAnimationsEnabled; }
    void setScrollDrivenAnimationsEnabled(bool scrollDrivenAnimationsEnabled) { m_values.scrollDrivenAnimationsEnabled = scrollDrivenAnimationsEnabled; }
    bool scrollToTextFragmentEnabled() const { return m_values.scrollToTextFragmentEnabled; }
    void setScrollToTextFragmentEnabled(bool scrollToTextFragmentEnabled) { m_values.scrollToTextFragmentEnabled = scrollToTextFragmentEnabled; }
    bool scrollToTextFragmentFeatureDetectionEnabled() const { return m_values.scrollToTextFragmentFeatureDetectionEnabled; }
    void setScrollToTextFragmentFeatureDetectionEnabled(bool scrollToTextFragmentFeatureDetectionEnabled) { m_values.scrollToTextFragmentFeatureDetectionEnabled = scrollToTextFragmentFeatureDetectionEnabled; }
    bool scrollToTextFragmentGenerationEnabled() const { return m_values.scrollToTextFragmentGenerationEnabled; }
    void setScrollToTextFragmentGenerationEnabled(bool scrollToTextFragmentGenerationEnabled) { m_values.scrollToTextFragmentGenerationEnabled = scrollToTextFragmentGenerationEnabled; }
    bool scrollToTextFragmentIndicatorEnabled() const { return m_values.scrollToTextFragmentIndicatorEnabled; }
    void setScrollToTextFragmentIndicatorEnabled(bool scrollToTextFragmentIndicatorEnabled) { m_values.scrollToTextFragmentIndicatorEnabled = scrollToTextFragmentIndicatorEnabled; }
    bool scrollToTextFragmentMarkingEnabled() const { return m_values.scrollToTextFragmentMarkingEnabled; }
    void setScrollToTextFragmentMarkingEnabled(bool scrollToTextFragmentMarkingEnabled) { m_values.scrollToTextFragmentMarkingEnabled = scrollToTextFragmentMarkingEnabled; }
    bool scrollingCoordinatorEnabled() const { return m_values.scrollingCoordinatorEnabled; }
    void setScrollingCoordinatorEnabled(bool scrollingCoordinatorEnabled) { m_values.scrollingCoordinatorEnabled = scrollingCoordinatorEnabled; }
    bool scrollingPerformanceTestingEnabled() const { return m_values.scrollingPerformanceTestingEnabled; }
    WEBCORE_EXPORT void setScrollingPerformanceTestingEnabled(bool);
    bool scrollingTreeIncludesFrames() const { return m_values.scrollingTreeIncludesFrames; }
    void setScrollingTreeIncludesFrames(bool scrollingTreeIncludesFrames) { m_values.scrollingTreeIncludesFrames = scrollingTreeIncludesFrames; }
    bool secureContextChecksEnabled() const { return m_values.secureContextChecksEnabled; }
    void setSecureContextChecksEnabled(bool secureContextChecksEnabled) { m_values.secureContextChecksEnabled = secureContextChecksEnabled; }
    bool selectShowPickerEnabled() const { return m_values.selectShowPickerEnabled; }
    void setSelectShowPickerEnabled(bool selectShowPickerEnabled) { m_values.selectShowPickerEnabled = selectShowPickerEnabled; }
    bool selectTrailingWhitespaceEnabled() const { return m_values.selectTrailingWhitespaceEnabled; }
    void setSelectTrailingWhitespaceEnabled(bool selectTrailingWhitespaceEnabled) { m_values.selectTrailingWhitespaceEnabled = selectTrailingWhitespaceEnabled; }
    bool selectionAPIForShadowDOMEnabled() const { return m_values.selectionAPIForShadowDOMEnabled; }
    void setSelectionAPIForShadowDOMEnabled(bool selectionAPIForShadowDOMEnabled) { m_values.selectionAPIForShadowDOMEnabled = selectionAPIForShadowDOMEnabled; }
    bool sendMouseEventsToDisabledFormControlsEnabled() const { return m_values.sendMouseEventsToDisabledFormControlsEnabled; }
    void setSendMouseEventsToDisabledFormControlsEnabled(bool sendMouseEventsToDisabledFormControlsEnabled) { m_values.sendMouseEventsToDisabledFormControlsEnabled = sendMouseEventsToDisabledFormControlsEnabled; }
    bool serviceWorkerNavigationPreloadEnabled() const { return m_values.serviceWorkerNavigationPreloadEnabled; }
    void setServiceWorkerNavigationPreloadEnabled(bool serviceWorkerNavigationPreloadEnabled) { m_values.serviceWorkerNavigationPreloadEnabled = serviceWorkerNavigationPreloadEnabled; }
    bool serviceWorkersEnabled() const { return m_values.serviceWorkersEnabled; }
    void setServiceWorkersEnabled(bool serviceWorkersEnabled) { m_values.serviceWorkersEnabled = serviceWorkersEnabled; }
    bool serviceWorkersUserGestureEnabled() const { return m_values.serviceWorkersUserGestureEnabled; }
    void setServiceWorkersUserGestureEnabled(bool serviceWorkersUserGestureEnabled) { m_values.serviceWorkersUserGestureEnabled = serviceWorkersUserGestureEnabled; }
    uint32_t sessionStorageQuota() const { return m_values.sessionStorageQuota; }
    void setSessionStorageQuota(uint32_t sessionStorageQuota) { m_values.sessionStorageQuota = sessionStorageQuota; }
    bool shapeDetection() const { return m_values.shapeDetection; }
    void setShapeDetection(bool shapeDetection) { m_values.shapeDetection = shapeDetection; }
    bool sharedWorkerEnabled() const { return m_values.sharedWorkerEnabled; }
    void setSharedWorkerEnabled(bool sharedWorkerEnabled) { m_values.sharedWorkerEnabled = sharedWorkerEnabled; }
    bool shouldAllowUserInstalledFonts() const { return m_values.shouldAllowUserInstalledFonts; }
    WEBCORE_EXPORT void setShouldAllowUserInstalledFonts(bool);
    bool shouldConvertInvalidURLsToBlank() const { return m_values.shouldConvertInvalidURLsToBlank; }
    void setShouldConvertInvalidURLsToBlank(bool shouldConvertInvalidURLsToBlank) { m_values.shouldConvertInvalidURLsToBlank = shouldConvertInvalidURLsToBlank; }
    bool shouldConvertPositionStyleOnCopy() const { return m_values.shouldConvertPositionStyleOnCopy; }
    void setShouldConvertPositionStyleOnCopy(bool shouldConvertPositionStyleOnCopy) { m_values.shouldConvertPositionStyleOnCopy = shouldConvertPositionStyleOnCopy; }
    bool shouldDecidePolicyBeforeLoadingQuickLookPreview() const { return m_values.shouldDecidePolicyBeforeLoadingQuickLookPreview; }
    void setShouldDecidePolicyBeforeLoadingQuickLookPreview(bool shouldDecidePolicyBeforeLoadingQuickLookPreview) { m_values.shouldDecidePolicyBeforeLoadingQuickLookPreview = shouldDecidePolicyBeforeLoadingQuickLookPreview; }
    bool shouldDeferAsynchronousScriptsUntilAfterDocumentLoadOrFirstPaint() const { return m_values.shouldDeferAsynchronousScriptsUntilAfterDocumentLoadOrFirstPaint; }
    void setShouldDeferAsynchronousScriptsUntilAfterDocumentLoadOrFirstPaint(bool shouldDeferAsynchronousScriptsUntilAfterDocumentLoadOrFirstPaint) { m_values.shouldDeferAsynchronousScriptsUntilAfterDocumentLoadOrFirstPaint = shouldDeferAsynchronousScriptsUntilAfterDocumentLoadOrFirstPaint; }
    bool shouldDispatchSyntheticMouseEventsWhenModifyingSelection() const { return m_values.shouldDispatchSyntheticMouseEventsWhenModifyingSelection; }
    void setShouldDispatchSyntheticMouseEventsWhenModifyingSelection(bool shouldDispatchSyntheticMouseEventsWhenModifyingSelection) { m_values.shouldDispatchSyntheticMouseEventsWhenModifyingSelection = shouldDispatchSyntheticMouseEventsWhenModifyingSelection; }
    bool shouldDispatchSyntheticMouseOutAfterSyntheticClick() const { return m_values.shouldDispatchSyntheticMouseOutAfterSyntheticClick; }
    void setShouldDispatchSyntheticMouseOutAfterSyntheticClick(bool shouldDispatchSyntheticMouseOutAfterSyntheticClick) { m_values.shouldDispatchSyntheticMouseOutAfterSyntheticClick = shouldDispatchSyntheticMouseOutAfterSyntheticClick; }
    bool shouldDropNearSuspendedAssertionAfterDelay() const { return m_values.shouldDropNearSuspendedAssertionAfterDelay; }
    void setShouldDropNearSuspendedAssertionAfterDelay(bool shouldDropNearSuspendedAssertionAfterDelay) { m_values.shouldDropNearSuspendedAssertionAfterDelay = shouldDropNearSuspendedAssertionAfterDelay; }
    bool shouldIgnoreFontLoadCompletions() const { return m_values.shouldIgnoreFontLoadCompletions; }
    void setShouldIgnoreFontLoadCompletions(bool shouldIgnoreFontLoadCompletions) { m_values.shouldIgnoreFontLoadCompletions = shouldIgnoreFontLoadCompletions; }
    bool shouldIgnoreMetaViewport() const { return m_values.shouldIgnoreMetaViewport; }
    void setShouldIgnoreMetaViewport(bool shouldIgnoreMetaViewport) { m_values.shouldIgnoreMetaViewport = shouldIgnoreMetaViewport; }
    bool shouldInjectUserScriptsInInitialEmptyDocument() const { return m_values.shouldInjectUserScriptsInInitialEmptyDocument; }
    void setShouldInjectUserScriptsInInitialEmptyDocument(bool shouldInjectUserScriptsInInitialEmptyDocument) { m_values.shouldInjectUserScriptsInInitialEmptyDocument = shouldInjectUserScriptsInInitialEmptyDocument; }
    bool shouldPrintBackgrounds() const { return m_values.shouldPrintBackgrounds; }
    void setShouldPrintBackgrounds(bool shouldPrintBackgrounds) { m_values.shouldPrintBackgrounds = shouldPrintBackgrounds; }
    bool shouldRespectImageOrientation() const { return m_values.shouldRespectImageOrientation; }
    void setShouldRespectImageOrientation(bool shouldRespectImageOrientation) { m_values.shouldRespectImageOrientation = shouldRespectImageOrientation; }
    bool shouldRestrictBaseURLSchemes() const { return m_values.shouldRestrictBaseURLSchemes; }
    void setShouldRestrictBaseURLSchemes(bool shouldRestrictBaseURLSchemes) { m_values.shouldRestrictBaseURLSchemes = shouldRestrictBaseURLSchemes; }
    bool shouldSuppressTextInputFromEditingDuringProvisionalNavigation() const { return m_values.shouldSuppressTextInputFromEditingDuringProvisionalNavigation; }
    void setShouldSuppressTextInputFromEditingDuringProvisionalNavigation(bool shouldSuppressTextInputFromEditingDuringProvisionalNavigation) { m_values.shouldSuppressTextInputFromEditingDuringProvisionalNavigation = shouldSuppressTextInputFromEditingDuringProvisionalNavigation; }
    bool shouldTakeNearSuspendedAssertions() const { return m_values.shouldTakeNearSuspendedAssertions; }
    void setShouldTakeNearSuspendedAssertions(bool shouldTakeNearSuspendedAssertions) { m_values.shouldTakeNearSuspendedAssertions = shouldTakeNearSuspendedAssertions; }
    bool shouldUseServiceWorkerShortTimeout() const { return m_values.shouldUseServiceWorkerShortTimeout; }
    void setShouldUseServiceWorkerShortTimeout(bool shouldUseServiceWorkerShortTimeout) { m_values.shouldUseServiceWorkerShortTimeout = shouldUseServiceWorkerShortTimeout; }
    WEBCORE_EXPORT bool showDebugBorders() const;
    WEBCORE_EXPORT void setShowDebugBorders(bool);
    bool showMediaStatsContextMenuItemEnabled() const { return m_values.showMediaStatsContextMenuItemEnabled; }
    void setShowMediaStatsContextMenuItemEnabled(bool showMediaStatsContextMenuItemEnabled) { m_values.showMediaStatsContextMenuItemEnabled = showMediaStatsContextMenuItemEnabled; }
    bool showModalDialogEnabled() const { return m_values.showModalDialogEnabled; }
    void setShowModalDialogEnabled(bool showModalDialogEnabled) { m_values.showModalDialogEnabled = showModalDialogEnabled; }
    WEBCORE_EXPORT bool showRepaintCounter() const;
    WEBCORE_EXPORT void setShowRepaintCounter(bool);
    bool showTiledScrollingIndicator() const { return m_values.showTiledScrollingIndicator; }
    void setShowTiledScrollingIndicator(bool showTiledScrollingIndicator) { m_values.showTiledScrollingIndicator = showTiledScrollingIndicator; }
    bool showsToolTipOverTruncatedText() const { return m_values.showsToolTipOverTruncatedText; }
    void setShowsToolTipOverTruncatedText(bool showsToolTipOverTruncatedText) { m_values.showsToolTipOverTruncatedText = showsToolTipOverTruncatedText; }
    bool showsURLsInToolTips() const { return m_values.showsURLsInToolTips; }
    void setShowsURLsInToolTips(bool showsURLsInToolTips) { m_values.showsURLsInToolTips = showsURLsInToolTips; }
    bool shrinksStandaloneImagesToFit() const { return m_values.shrinksStandaloneImagesToFit; }
    void setShrinksStandaloneImagesToFit(bool shrinksStandaloneImagesToFit) { m_values.shrinksStandaloneImagesToFit = shrinksStandaloneImagesToFit; }
    bool sidewaysWritingModesEnabled() const { return m_values.sidewaysWritingModesEnabled; }
    void setSidewaysWritingModesEnabled(bool sidewaysWritingModesEnabled) { m_values.sidewaysWritingModesEnabled = sidewaysWritingModesEnabled; }
    bool siteIsolationEnabled() const { return m_values.siteIsolationEnabled; }
    void setSiteIsolationEnabled(bool siteIsolationEnabled) { m_values.siteIsolationEnabled = siteIsolationEnabled; }
    bool smartInsertDeleteEnabled() const { return m_values.smartInsertDeleteEnabled; }
    void setSmartInsertDeleteEnabled(bool smartInsertDeleteEnabled) { m_values.smartInsertDeleteEnabled = smartInsertDeleteEnabled; }
    bool spatialNavigationEnabled() const { return m_values.spatialNavigationEnabled; }
    void setSpatialNavigationEnabled(bool spatialNavigationEnabled) { m_values.spatialNavigationEnabled = spatialNavigationEnabled; }
    bool speechRecognitionEnabled() const { return m_values.speechRecognitionEnabled; }
    void setSpeechRecognitionEnabled(bool speechRecognitionEnabled) { m_values.speechRecognitionEnabled = speechRecognitionEnabled; }
    bool speechSynthesisAPIEnabled() const { return m_values.speechSynthesisAPIEnabled; }
    void setSpeechSynthesisAPIEnabled(bool speechSynthesisAPIEnabled) { m_values.speechSynthesisAPIEnabled = speechSynthesisAPIEnabled; }
    bool springTimingFunctionEnabled() const { return m_values.springTimingFunctionEnabled; }
    void setSpringTimingFunctionEnabled(bool springTimingFunctionEnabled) { m_values.springTimingFunctionEnabled = springTimingFunctionEnabled; }
    bool standalone() const { return m_values.standalone; }
    void setStandalone(bool standalone) { m_values.standalone = standalone; }
    bool storageAPIEnabled() const { return m_values.storageAPIEnabled; }
    void setStorageAPIEnabled(bool storageAPIEnabled) { m_values.storageAPIEnabled = storageAPIEnabled; }
    bool storageAPIEstimateEnabled() const { return m_values.storageAPIEstimateEnabled; }
    void setStorageAPIEstimateEnabled(bool storageAPIEstimateEnabled) { m_values.storageAPIEstimateEnabled = storageAPIEstimateEnabled; }
    bool storageAccessAPIPerPageScopeEnabled() const { return m_values.storageAccessAPIPerPageScopeEnabled; }
    void setStorageAccessAPIPerPageScopeEnabled(bool storageAccessAPIPerPageScopeEnabled) { m_values.storageAccessAPIPerPageScopeEnabled = storageAccessAPIPerPageScopeEnabled; }
    StorageBlockingPolicy storageBlockingPolicy() const { return m_values.storageBlockingPolicy; }
    WEBCORE_EXPORT void setStorageBlockingPolicy(StorageBlockingPolicy);
    bool suppressesIncrementalRendering() const { return m_values.suppressesIncrementalRendering; }
    void setSuppressesIncrementalRendering(bool suppressesIncrementalRendering) { m_values.suppressesIncrementalRendering = suppressesIncrementalRendering; }
    bool switchControlEnabled() const { return m_values.switchControlEnabled; }
    void setSwitchControlEnabled(bool switchControlEnabled) { m_values.switchControlEnabled = switchControlEnabled; }
    WebCore::TextDirection systemLayoutDirection() const { return m_values.systemLayoutDirection; }
    void setSystemLayoutDirection(WebCore::TextDirection systemLayoutDirection) { m_values.systemLayoutDirection = systemLayoutDirection; }
    bool targetTextPseudoElementEnabled() const { return m_values.targetTextPseudoElementEnabled; }
    void setTargetTextPseudoElementEnabled(bool targetTextPseudoElementEnabled) { m_values.targetTextPseudoElementEnabled = targetTextPseudoElementEnabled; }
    bool telephoneNumberParsingEnabled() const { return m_values.telephoneNumberParsingEnabled; }
    void setTelephoneNumberParsingEnabled(bool telephoneNumberParsingEnabled) { m_values.telephoneNumberParsingEnabled = telephoneNumberParsingEnabled; }
    bool temporaryTileCohortRetentionEnabled() const { return m_values.temporaryTileCohortRetentionEnabled; }
    void setTemporaryTileCohortRetentionEnabled(bool temporaryTileCohortRetentionEnabled) { m_values.temporaryTileCohortRetentionEnabled = temporaryTileCohortRetentionEnabled; }
    bool textAreasAreResizable() const { return m_values.textAreasAreResizable; }
    WEBCORE_EXPORT void setTextAreasAreResizable(bool);
    TextDirectionSubmenuInclusionBehavior textDirectionSubmenuInclusionBehavior() const { return m_values.textDirectionSubmenuInclusionBehavior; }
    void setTextDirectionSubmenuInclusionBehavior(TextDirectionSubmenuInclusionBehavior textDirectionSubmenuInclusionBehavior) { m_values.textDirectionSubmenuInclusionBehavior = textDirectionSubmenuInclusionBehavior; }
    bool textInteractionEnabled() const { return m_values.textInteractionEnabled; }
    void setTextInteractionEnabled(bool textInteractionEnabled) { m_values.textInteractionEnabled = textInteractionEnabled; }
    bool thumbAndTrackPseudoElementsEnabled() const { return m_values.thumbAndTrackPseudoElementsEnabled; }
    void setThumbAndTrackPseudoElementsEnabled(bool thumbAndTrackPseudoElementsEnabled) { m_values.thumbAndTrackPseudoElementsEnabled = thumbAndTrackPseudoElementsEnabled; }
    Seconds timeWithoutMouseMovementBeforeHidingControls() const { return m_values.timeWithoutMouseMovementBeforeHidingControls; }
    void setTimeWithoutMouseMovementBeforeHidingControls(Seconds timeWithoutMouseMovementBeforeHidingControls) { m_values.timeWithoutMouseMovementBeforeHidingControls = timeWithoutMouseMovementBeforeHidingControls; }
    bool trackConfigurationEnabled() const { return m_values.trackConfigurationEnabled; }
    void setTrackConfigurationEnabled(bool trackConfigurationEnabled) { m_values.trackConfigurationEnabled = trackConfigurationEnabled; }
    bool treatIPAddressAsDomain() const { return m_values.treatIPAddressAsDomain; }
    void setTreatIPAddressAsDomain(bool treatIPAddressAsDomain) { m_values.treatIPAddressAsDomain = treatIPAddressAsDomain; }
    bool treatsAnyTextCSSLinkAsStylesheet() const { return m_values.treatsAnyTextCSSLinkAsStylesheet; }
    void setTreatsAnyTextCSSLinkAsStylesheet(bool treatsAnyTextCSSLinkAsStylesheet) { m_values.treatsAnyTextCSSLinkAsStylesheet = treatsAnyTextCSSLinkAsStylesheet; }
    bool trustedTypesEnabled() const { return m_values.trustedTypesEnabled; }
    void setTrustedTypesEnabled(bool trustedTypesEnabled) { m_values.trustedTypesEnabled = trustedTypesEnabled; }
    bool uAVisualTransitionDetectionEnabled() const { return m_values.uAVisualTransitionDetectionEnabled; }
    void setUAVisualTransitionDetectionEnabled(bool uAVisualTransitionDetectionEnabled) { m_values.uAVisualTransitionDetectionEnabled = uAVisualTransitionDetectionEnabled; }
    bool undoManagerAPIEnabled() const { return m_values.undoManagerAPIEnabled; }
    void setUndoManagerAPIEnabled(bool undoManagerAPIEnabled) { m_values.undoManagerAPIEnabled = undoManagerAPIEnabled; }
    bool unhandledPromiseRejectionToConsoleEnabled() const { return m_values.unhandledPromiseRejectionToConsoleEnabled; }
    void setUnhandledPromiseRejectionToConsoleEnabled(bool unhandledPromiseRejectionToConsoleEnabled) { m_values.unhandledPromiseRejectionToConsoleEnabled = unhandledPromiseRejectionToConsoleEnabled; }
    bool unifiedTextCheckerEnabled() const { return m_values.unifiedTextCheckerEnabled; }
    void setUnifiedTextCheckerEnabled(bool unifiedTextCheckerEnabled) { m_values.unifiedTextCheckerEnabled = unifiedTextCheckerEnabled; }
    bool upgradeMixedContentEnabled() const { return m_values.upgradeMixedContentEnabled; }
    void setUpgradeMixedContentEnabled(bool upgradeMixedContentEnabled) { m_values.upgradeMixedContentEnabled = upgradeMixedContentEnabled; }
    bool urlPatternAPIEnabled() const { return m_values.urlPatternAPIEnabled; }
    void setURLPatternAPIEnabled(bool urlPatternAPIEnabled) { m_values.urlPatternAPIEnabled = urlPatternAPIEnabled; }
    bool useAnonymousModeWhenFetchingMaskImages() const { return m_values.useAnonymousModeWhenFetchingMaskImages; }
    void setUseAnonymousModeWhenFetchingMaskImages(bool useAnonymousModeWhenFetchingMaskImages) { m_values.useAnonymousModeWhenFetchingMaskImages = useAnonymousModeWhenFetchingMaskImages; }
    bool useGiantTiles() const { return m_values.useGiantTiles; }
    void setUseGiantTiles(bool useGiantTiles) { m_values.useGiantTiles = useGiantTiles; }
    bool useIFCForSVGText() const { return m_values.useIFCForSVGText; }
    void setUseIFCForSVGText(bool useIFCForSVGText) { m_values.useIFCForSVGText = useIFCForSVGText; }
    bool useImageDocumentForSubframePDF() const { return m_values.useImageDocumentForSubframePDF; }
    void setUseImageDocumentForSubframePDF(bool useImageDocumentForSubframePDF) { m_values.useImageDocumentForSubframePDF = useImageDocumentForSubframePDF; }
    bool usePreHTML5ParserQuirks() const { return m_values.usePreHTML5ParserQuirks; }
    void setUsePreHTML5ParserQuirks(bool usePreHTML5ParserQuirks) { m_values.usePreHTML5ParserQuirks = usePreHTML5ParserQuirks; }
    bool userActivationAPIEnabled() const { return m_values.userActivationAPIEnabled; }
    void setUserActivationAPIEnabled(bool userActivationAPIEnabled) { m_values.userActivationAPIEnabled = userActivationAPIEnabled; }
    bool userGesturePromisePropagationEnabled() const { return m_values.userGesturePromisePropagationEnabled; }
    void setUserGesturePromisePropagationEnabled(bool userGesturePromisePropagationEnabled) { m_values.userGesturePromisePropagationEnabled = userGesturePromisePropagationEnabled; }
    WebCore::UserInterfaceDirectionPolicy userInterfaceDirectionPolicy() const { return m_values.userInterfaceDirectionPolicy; }
    void setUserInterfaceDirectionPolicy(WebCore::UserInterfaceDirectionPolicy userInterfaceDirectionPolicy) { m_values.userInterfaceDirectionPolicy = userInterfaceDirectionPolicy; }
    const URL& userStyleSheetLocation() const { return m_values.userStyleSheetLocation; }
    WEBCORE_EXPORT void setUserStyleSheetLocation(const URL&);
    bool usesBackForwardCache() const { return m_values.usesBackForwardCache; }
    WEBCORE_EXPORT void setUsesBackForwardCache(bool);
    bool usesEncodingDetector() const { return m_values.usesEncodingDetector; }
    void setUsesEncodingDetector(bool usesEncodingDetector) { m_values.usesEncodingDetector = usesEncodingDetector; }
    uint32_t validationMessageTimerMagnification() const { return m_values.validationMessageTimerMagnification; }
    void setValidationMessageTimerMagnification(uint32_t validationMessageTimerMagnification) { m_values.validationMessageTimerMagnification = validationMessageTimerMagnification; }
    bool verifyWindowOpenUserGestureFromUIProcess() const { return m_values.verifyWindowOpenUserGestureFromUIProcess; }
    void setVerifyWindowOpenUserGestureFromUIProcess(bool verifyWindowOpenUserGestureFromUIProcess) { m_values.verifyWindowOpenUserGestureFromUIProcess = verifyWindowOpenUserGestureFromUIProcess; }
    bool verticalFormControlsEnabled() const { return m_values.verticalFormControlsEnabled; }
    void setVerticalFormControlsEnabled(bool verticalFormControlsEnabled) { m_values.verticalFormControlsEnabled = verticalFormControlsEnabled; }
    bool videoPresentationModeAPIEnabled() const { return m_values.videoPresentationModeAPIEnabled; }
    void setVideoPresentationModeAPIEnabled(bool videoPresentationModeAPIEnabled) { m_values.videoPresentationModeAPIEnabled = videoPresentationModeAPIEnabled; }
    bool viewTransitionClassesEnabled() const { return m_values.viewTransitionClassesEnabled; }
    void setViewTransitionClassesEnabled(bool viewTransitionClassesEnabled) { m_values.viewTransitionClassesEnabled = viewTransitionClassesEnabled; }
    bool viewTransitionTypesEnabled() const { return m_values.viewTransitionTypesEnabled; }
    void setViewTransitionTypesEnabled(bool viewTransitionTypesEnabled) { m_values.viewTransitionTypesEnabled = viewTransitionTypesEnabled; }
    bool viewTransitionsEnabled() const { return m_values.viewTransitionsEnabled; }
    void setViewTransitionsEnabled(bool viewTransitionsEnabled) { m_values.viewTransitionsEnabled = viewTransitionsEnabled; }
    uint32_t visibleDebugOverlayRegions() const { return m_values.visibleDebugOverlayRegions; }
    void setVisibleDebugOverlayRegions(uint32_t visibleDebugOverlayRegions) { m_values.visibleDebugOverlayRegions = visibleDebugOverlayRegions; }
    bool visualViewportAPIEnabled() const { return m_values.visualViewportAPIEnabled; }
    void setVisualViewportAPIEnabled(bool visualViewportAPIEnabled) { m_values.visualViewportAPIEnabled = visualViewportAPIEnabled; }
    bool visualViewportEnabled() const { return m_values.visualViewportEnabled; }
    WEBCORE_EXPORT void setVisualViewportEnabled(bool);
    bool wantsBalancedSetDefersLoadingBehavior() const { return m_values.wantsBalancedSetDefersLoadingBehavior; }
    void setWantsBalancedSetDefersLoadingBehavior(bool wantsBalancedSetDefersLoadingBehavior) { m_values.wantsBalancedSetDefersLoadingBehavior = wantsBalancedSetDefersLoadingBehavior; }
    bool webAPIStatisticsEnabled() const { return m_values.webAPIStatisticsEnabled; }
    void setWebAPIStatisticsEnabled(bool webAPIStatisticsEnabled) { m_values.webAPIStatisticsEnabled = webAPIStatisticsEnabled; }
    bool webAPIsInShadowRealmEnabled() const { return m_values.webAPIsInShadowRealmEnabled; }
    void setWebAPIsInShadowRealmEnabled(bool webAPIsInShadowRealmEnabled) { m_values.webAPIsInShadowRealmEnabled = webAPIsInShadowRealmEnabled; }
    bool webAnimationsCustomEffectsEnabled() const { return m_values.webAnimationsCustomEffectsEnabled; }
    void setWebAnimationsCustomEffectsEnabled(bool webAnimationsCustomEffectsEnabled) { m_values.webAnimationsCustomEffectsEnabled = webAnimationsCustomEffectsEnabled; }
    bool webAnimationsCustomFrameRateEnabled() const { return m_values.webAnimationsCustomFrameRateEnabled; }
    void setWebAnimationsCustomFrameRateEnabled(bool webAnimationsCustomFrameRateEnabled) { m_values.webAnimationsCustomFrameRateEnabled = webAnimationsCustomFrameRateEnabled; }
    bool webAnimationsOverallProgressPropertyEnabled() const { return m_values.webAnimationsOverallProgressPropertyEnabled; }
    void setWebAnimationsOverallProgressPropertyEnabled(bool webAnimationsOverallProgressPropertyEnabled) { m_values.webAnimationsOverallProgressPropertyEnabled = webAnimationsOverallProgressPropertyEnabled; }
    bool webCryptoSafeCurvesEnabled() const { return m_values.webCryptoSafeCurvesEnabled; }
    void setWebCryptoSafeCurvesEnabled(bool webCryptoSafeCurvesEnabled) { m_values.webCryptoSafeCurvesEnabled = webCryptoSafeCurvesEnabled; }
    bool webCryptoX25519Enabled() const { return m_values.webCryptoX25519Enabled; }
    void setWebCryptoX25519Enabled(bool webCryptoX25519Enabled) { m_values.webCryptoX25519Enabled = webCryptoX25519Enabled; }
    bool webGLDraftExtensionsEnabled() const { return m_values.webGLDraftExtensionsEnabled; }
    void setWebGLDraftExtensionsEnabled(bool webGLDraftExtensionsEnabled) { m_values.webGLDraftExtensionsEnabled = webGLDraftExtensionsEnabled; }
    bool webGLEnabled() const { return m_values.webGLEnabled; }
    void setWebGLEnabled(bool webGLEnabled) { m_values.webGLEnabled = webGLEnabled; }
    bool webGLErrorsToConsoleEnabled() const { return m_values.webGLErrorsToConsoleEnabled; }
    void setWebGLErrorsToConsoleEnabled(bool webGLErrorsToConsoleEnabled) { m_values.webGLErrorsToConsoleEnabled = webGLErrorsToConsoleEnabled; }
    bool webGLTimerQueriesEnabled() const { return m_values.webGLTimerQueriesEnabled; }
    void setWebGLTimerQueriesEnabled(bool webGLTimerQueriesEnabled) { m_values.webGLTimerQueriesEnabled = webGLTimerQueriesEnabled; }
    bool webGPUEnabled() const { return m_values.webGPUEnabled; }
    void setWebGPUEnabled(bool webGPUEnabled) { m_values.webGPUEnabled = webGPUEnabled; }
    bool webGPUHDREnabled() const { return m_values.webGPUHDREnabled; }
    void setWebGPUHDREnabled(bool webGPUHDREnabled) { m_values.webGPUHDREnabled = webGPUHDREnabled; }
    bool webInspectorEngineeringSettingsAllowed() const { return m_values.webInspectorEngineeringSettingsAllowed; }
    void setWebInspectorEngineeringSettingsAllowed(bool webInspectorEngineeringSettingsAllowed) { m_values.webInspectorEngineeringSettingsAllowed = webInspectorEngineeringSettingsAllowed; }
    bool webLocksAPIEnabled() const { return m_values.webLocksAPIEnabled; }
    void setWebLocksAPIEnabled(bool webLocksAPIEnabled) { m_values.webLocksAPIEnabled = webLocksAPIEnabled; }
    bool webRTCEncryptionEnabled() const { return m_values.webRTCEncryptionEnabled; }
    void setWebRTCEncryptionEnabled(bool webRTCEncryptionEnabled) { m_values.webRTCEncryptionEnabled = webRTCEncryptionEnabled; }
    bool webRTCMediaPipelineAdditionalLoggingEnabled() const { return m_values.webRTCMediaPipelineAdditionalLoggingEnabled; }
    void setWebRTCMediaPipelineAdditionalLoggingEnabled(bool webRTCMediaPipelineAdditionalLoggingEnabled) { m_values.webRTCMediaPipelineAdditionalLoggingEnabled = webRTCMediaPipelineAdditionalLoggingEnabled; }
    WEBCORE_EXPORT bool webSecurityEnabled() const;
    void setWebSecurityEnabled(bool webSecurityEnabled) { m_values.webSecurityEnabled = webSecurityEnabled; }
    bool webShareEnabled() const { return m_values.webShareEnabled; }
    void setWebShareEnabled(bool webShareEnabled) { m_values.webShareEnabled = webShareEnabled; }
    bool webShareFileAPIEnabled() const { return m_values.webShareFileAPIEnabled; }
    void setWebShareFileAPIEnabled(bool webShareFileAPIEnabled) { m_values.webShareFileAPIEnabled = webShareFileAPIEnabled; }
    bool webSocketEnabled() const { return m_values.webSocketEnabled; }
    void setWebSocketEnabled(bool webSocketEnabled) { m_values.webSocketEnabled = webSocketEnabled; }
    bool webTransportEnabled() const { return m_values.webTransportEnabled; }
    void setWebTransportEnabled(bool webTransportEnabled) { m_values.webTransportEnabled = webTransportEnabled; }
    bool webXRWebGPUBindingsEnabled() const { return m_values.webXRWebGPUBindingsEnabled; }
    void setWebXRWebGPUBindingsEnabled(bool webXRWebGPUBindingsEnabled) { m_values.webXRWebGPUBindingsEnabled = webXRWebGPUBindingsEnabled; }
    bool webkitImageReadyEventEnabled() const { return m_values.webkitImageReadyEventEnabled; }
    void setWebkitImageReadyEventEnabled(bool webkitImageReadyEventEnabled) { m_values.webkitImageReadyEventEnabled = webkitImageReadyEventEnabled; }
    bool wheelEventGesturesBecomeNonBlocking() const { return m_values.wheelEventGesturesBecomeNonBlocking; }
    void setWheelEventGesturesBecomeNonBlocking(bool wheelEventGesturesBecomeNonBlocking) { m_values.wheelEventGesturesBecomeNonBlocking = wheelEventGesturesBecomeNonBlocking; }
    bool windowFocusRestricted() const { return m_values.windowFocusRestricted; }
    void setWindowFocusRestricted(bool windowFocusRestricted) { m_values.windowFocusRestricted = windowFocusRestricted; }
    bool wirelessPlaybackTargetAPIEnabled() const { return m_values.wirelessPlaybackTargetAPIEnabled; }
    void setWirelessPlaybackTargetAPIEnabled(bool wirelessPlaybackTargetAPIEnabled) { m_values.wirelessPlaybackTargetAPIEnabled = wirelessPlaybackTargetAPIEnabled; }
#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    bool imageAnimationControlEnabled() const { return m_values.imageAnimationControlEnabled; }
    void setImageAnimationControlEnabled(bool imageAnimationControlEnabled) { m_values.imageAnimationControlEnabled = imageAnimationControlEnabled; }
#endif
#if ENABLE(ALTERNATE_WEBM_PLAYER) && ENABLE(MEDIA_SOURCE)
    bool alternateWebMPlayerEnabled() const { return m_values.alternateWebMPlayerEnabled; }
    void setAlternateWebMPlayerEnabled(bool alternateWebMPlayerEnabled) { m_values.alternateWebMPlayerEnabled = alternateWebMPlayerEnabled; }
#endif
#if ENABLE(APPLE_PAY)
    bool applePayCapabilityDisclosureAllowed() const { return m_values.applePayCapabilityDisclosureAllowed; }
    void setApplePayCapabilityDisclosureAllowed(bool applePayCapabilityDisclosureAllowed) { m_values.applePayCapabilityDisclosureAllowed = applePayCapabilityDisclosureAllowed; }
    bool applePayEnabled() const { return m_values.applePayEnabled; }
    void setApplePayEnabled(bool applePayEnabled) { m_values.applePayEnabled = applePayEnabled; }
#endif
#if ENABLE(APP_HIGHLIGHTS)
    bool appHighlightsEnabled() const { return m_values.appHighlightsEnabled; }
    void setAppHighlightsEnabled(bool appHighlightsEnabled) { m_values.appHighlightsEnabled = appHighlightsEnabled; }
#endif
#if ENABLE(ATTACHMENT_ELEMENT)
    bool attachmentWideLayoutEnabled() const { return m_values.attachmentWideLayoutEnabled; }
    void setAttachmentWideLayoutEnabled(bool attachmentWideLayoutEnabled) { m_values.attachmentWideLayoutEnabled = attachmentWideLayoutEnabled; }
#endif
#if ENABLE(CONTENT_CHANGE_OBSERVER)
    bool contentChangeObserverEnabled() const { return m_values.contentChangeObserverEnabled; }
    void setContentChangeObserverEnabled(bool contentChangeObserverEnabled) { m_values.contentChangeObserverEnabled = contentChangeObserverEnabled; }
#endif
#if ENABLE(CONTENT_EXTENSIONS)
    bool iFrameResourceMonitoringEnabled() const { return m_values.iFrameResourceMonitoringEnabled; }
    void setIFrameResourceMonitoringEnabled(bool iFrameResourceMonitoringEnabled) { m_values.iFrameResourceMonitoringEnabled = iFrameResourceMonitoringEnabled; }
#endif
#if ENABLE(CONTEXT_MENU_QR_CODE_DETECTION)
    bool contextMenuQRCodeDetectionEnabled() const { return m_values.contextMenuQRCodeDetectionEnabled; }
    void setContextMenuQRCodeDetectionEnabled(bool contextMenuQRCodeDetectionEnabled) { m_values.contextMenuQRCodeDetectionEnabled = contextMenuQRCodeDetectionEnabled; }
#endif
#if ENABLE(DATALIST_ELEMENT)
    bool dataListElementEnabled() const { return m_values.dataListElementEnabled; }
    void setDataListElementEnabled(bool dataListElementEnabled) { m_values.dataListElementEnabled = dataListElementEnabled; }
#endif
#if ENABLE(DATA_DETECTION)
    WebCore::DataDetectorType dataDetectorTypes() const { return m_values.dataDetectorTypes; }
    void setDataDetectorTypes(WebCore::DataDetectorType dataDetectorTypes) { m_values.dataDetectorTypes = dataDetectorTypes; }
#endif
#if ENABLE(DATE_AND_TIME_INPUT_TYPES)
    bool dateTimeInputsEditableComponentsEnabled() const { return m_values.dateTimeInputsEditableComponentsEnabled; }
    void setDateTimeInputsEditableComponentsEnabled(bool dateTimeInputsEditableComponentsEnabled) { m_values.dateTimeInputsEditableComponentsEnabled = dateTimeInputsEditableComponentsEnabled; }
#endif
#if ENABLE(DECLARATIVE_WEB_PUSH)
    bool declarativeWebPush() const { return m_values.declarativeWebPush; }
    void setDeclarativeWebPush(bool declarativeWebPush) { m_values.declarativeWebPush = declarativeWebPush; }
#endif
#if ENABLE(DEVICE_ORIENTATION)
    bool deviceOrientationEventEnabled() const { return m_values.deviceOrientationEventEnabled; }
    void setDeviceOrientationEventEnabled(bool deviceOrientationEventEnabled) { m_values.deviceOrientationEventEnabled = deviceOrientationEventEnabled; }
    bool deviceOrientationPermissionAPIEnabled() const { return m_values.deviceOrientationPermissionAPIEnabled; }
    void setDeviceOrientationPermissionAPIEnabled(bool deviceOrientationPermissionAPIEnabled) { m_values.deviceOrientationPermissionAPIEnabled = deviceOrientationPermissionAPIEnabled; }
#endif
#if ENABLE(DOM_AUDIO_SESSION)
    bool domAudioSessionEnabled() const { return m_values.domAudioSessionEnabled; }
    void setDOMAudioSessionEnabled(bool domAudioSessionEnabled) { m_values.domAudioSessionEnabled = domAudioSessionEnabled; }
    bool domAudioSessionFullEnabled() const { return m_values.domAudioSessionFullEnabled; }
    void setDOMAudioSessionFullEnabled(bool domAudioSessionFullEnabled) { m_values.domAudioSessionFullEnabled = domAudioSessionFullEnabled; }
#endif
#if ENABLE(ENCRYPTED_MEDIA)
    bool encryptedMediaAPIEnabled() const { return m_values.encryptedMediaAPIEnabled; }
    void setEncryptedMediaAPIEnabled(bool encryptedMediaAPIEnabled) { m_values.encryptedMediaAPIEnabled = encryptedMediaAPIEnabled; }
#endif
#if ENABLE(EXTENSION_CAPABILITIES)
    bool mediaCapabilityGrantsEnabled() const { return m_values.mediaCapabilityGrantsEnabled; }
    void setMediaCapabilityGrantsEnabled(bool mediaCapabilityGrantsEnabled) { m_values.mediaCapabilityGrantsEnabled = mediaCapabilityGrantsEnabled; }
#endif
#if ENABLE(FULLSCREEN_API)
    bool fullScreenEnabled() const { return m_values.fullScreenEnabled; }
    void setFullScreenEnabled(bool fullScreenEnabled) { m_values.fullScreenEnabled = fullScreenEnabled; }
    bool fullScreenKeyboardLock() const { return m_values.fullScreenKeyboardLock; }
    void setFullScreenKeyboardLock(bool fullScreenKeyboardLock) { m_values.fullScreenKeyboardLock = fullScreenKeyboardLock; }
    bool videoFullscreenRequiresElementFullscreen() const { return m_values.videoFullscreenRequiresElementFullscreen; }
    void setVideoFullscreenRequiresElementFullscreen(bool videoFullscreenRequiresElementFullscreen) { m_values.videoFullscreenRequiresElementFullscreen = videoFullscreenRequiresElementFullscreen; }
#endif
#if ENABLE(GAMEPAD)
    bool gamepadTriggerRumbleEnabled() const { return m_values.gamepadTriggerRumbleEnabled; }
    void setGamepadTriggerRumbleEnabled(bool gamepadTriggerRumbleEnabled) { m_values.gamepadTriggerRumbleEnabled = gamepadTriggerRumbleEnabled; }
    bool gamepadVibrationActuatorEnabled() const { return m_values.gamepadVibrationActuatorEnabled; }
    void setGamepadVibrationActuatorEnabled(bool gamepadVibrationActuatorEnabled) { m_values.gamepadVibrationActuatorEnabled = gamepadVibrationActuatorEnabled; }
    bool gamepadsEnabled() const { return m_values.gamepadsEnabled; }
    void setGamepadsEnabled(bool gamepadsEnabled) { m_values.gamepadsEnabled = gamepadsEnabled; }
#endif
#if ENABLE(GPU_PROCESS)
    bool blockMediaLayerRehostingInWebContentProcess() const { return m_values.blockMediaLayerRehostingInWebContentProcess; }
    void setBlockMediaLayerRehostingInWebContentProcess(bool blockMediaLayerRehostingInWebContentProcess) { m_values.blockMediaLayerRehostingInWebContentProcess = blockMediaLayerRehostingInWebContentProcess; }
#endif
#if ENABLE(GPU_PROCESS) && ENABLE(WEBGL)
    bool useGPUProcessForWebGLEnabled() const { return m_values.useGPUProcessForWebGLEnabled; }
    void setUseGPUProcessForWebGLEnabled(bool useGPUProcessForWebGLEnabled) { m_values.useGPUProcessForWebGLEnabled = useGPUProcessForWebGLEnabled; }
#endif
#if ENABLE(IMAGE_ANALYSIS)
    bool imageAnalysisDuringFindInPageEnabled() const { return m_values.imageAnalysisDuringFindInPageEnabled; }
    void setImageAnalysisDuringFindInPageEnabled(bool imageAnalysisDuringFindInPageEnabled) { m_values.imageAnalysisDuringFindInPageEnabled = imageAnalysisDuringFindInPageEnabled; }
    bool visualTranslationEnabled() const { return m_values.visualTranslationEnabled; }
    void setVisualTranslationEnabled(bool visualTranslationEnabled) { m_values.visualTranslationEnabled = visualTranslationEnabled; }
#endif
#if ENABLE(IMAGE_ANALYSIS) && ENABLE(VIDEO)
    bool textRecognitionInVideosEnabled() const { return m_values.textRecognitionInVideosEnabled; }
    void setTextRecognitionInVideosEnabled(bool textRecognitionInVideosEnabled) { m_values.textRecognitionInVideosEnabled = textRecognitionInVideosEnabled; }
#endif
#if ENABLE(IMAGE_ANALYSIS_ENHANCEMENTS)
    bool removeBackgroundEnabled() const { return m_values.removeBackgroundEnabled; }
    void setRemoveBackgroundEnabled(bool removeBackgroundEnabled) { m_values.removeBackgroundEnabled = removeBackgroundEnabled; }
#endif
#if ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    bool includeIgnoredInCoreAXTree() const { return m_values.includeIgnoredInCoreAXTree; }
    void setIncludeIgnoredInCoreAXTree(bool includeIgnoredInCoreAXTree) { m_values.includeIgnoredInCoreAXTree = includeIgnoredInCoreAXTree; }
#endif
#if ENABLE(INPUT_TYPE_COLOR)
    bool inputTypeColorEnabled() const { return m_values.inputTypeColorEnabled; }
    void setInputTypeColorEnabled(bool inputTypeColorEnabled) { m_values.inputTypeColorEnabled = inputTypeColorEnabled; }
    bool inputTypeColorEnhancementsEnabled() const { return m_values.inputTypeColorEnhancementsEnabled; }
    void setInputTypeColorEnhancementsEnabled(bool inputTypeColorEnhancementsEnabled) { m_values.inputTypeColorEnhancementsEnabled = inputTypeColorEnhancementsEnabled; }
#endif
#if ENABLE(INPUT_TYPE_DATE)
    bool inputTypeDateEnabled() const { return m_values.inputTypeDateEnabled; }
    void setInputTypeDateEnabled(bool inputTypeDateEnabled) { m_values.inputTypeDateEnabled = inputTypeDateEnabled; }
#endif
#if ENABLE(INPUT_TYPE_DATETIMELOCAL)
    bool inputTypeDateTimeLocalEnabled() const { return m_values.inputTypeDateTimeLocalEnabled; }
    void setInputTypeDateTimeLocalEnabled(bool inputTypeDateTimeLocalEnabled) { m_values.inputTypeDateTimeLocalEnabled = inputTypeDateTimeLocalEnabled; }
#endif
#if ENABLE(INPUT_TYPE_MONTH)
    bool inputTypeMonthEnabled() const { return m_values.inputTypeMonthEnabled; }
    void setInputTypeMonthEnabled(bool inputTypeMonthEnabled) { m_values.inputTypeMonthEnabled = inputTypeMonthEnabled; }
#endif
#if ENABLE(INPUT_TYPE_TIME)
    bool inputTypeTimeEnabled() const { return m_values.inputTypeTimeEnabled; }
    void setInputTypeTimeEnabled(bool inputTypeTimeEnabled) { m_values.inputTypeTimeEnabled = inputTypeTimeEnabled; }
#endif
#if ENABLE(INPUT_TYPE_WEEK)
    bool inputTypeWeekEnabled() const { return m_values.inputTypeWeekEnabled; }
    void setInputTypeWeekEnabled(bool inputTypeWeekEnabled) { m_values.inputTypeWeekEnabled = inputTypeWeekEnabled; }
#endif
#if ENABLE(INTERACTION_REGIONS_IN_EVENT_REGION)
    bool interactionRegionsEnabled() const { return m_values.interactionRegionsEnabled; }
    void setInteractionRegionsEnabled(bool interactionRegionsEnabled) { m_values.interactionRegionsEnabled = interactionRegionsEnabled; }
#endif
#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
    bool legacyEncryptedMediaAPIEnabled() const { return m_values.legacyEncryptedMediaAPIEnabled; }
    void setLegacyEncryptedMediaAPIEnabled(bool legacyEncryptedMediaAPIEnabled) { m_values.legacyEncryptedMediaAPIEnabled = legacyEncryptedMediaAPIEnabled; }
#endif
#if ENABLE(LINEAR_MEDIA_PLAYER)
    bool linearMediaPlayerEnabled() const { return m_values.linearMediaPlayerEnabled; }
    void setLinearMediaPlayerEnabled(bool linearMediaPlayerEnabled) { m_values.linearMediaPlayerEnabled = linearMediaPlayerEnabled; }
    bool spatialVideoEnabled() const { return m_values.spatialVideoEnabled; }
    void setSpatialVideoEnabled(bool spatialVideoEnabled) { m_values.spatialVideoEnabled = spatialVideoEnabled; }
#endif
#if ENABLE(MATHML)
    bool mathMLEnabled() const { return m_values.mathMLEnabled; }
    void setMathMLEnabled(bool mathMLEnabled) { m_values.mathMLEnabled = mathMLEnabled; }
#endif
#if ENABLE(MEDIA_CONTROLS_CONTEXT_MENUS)
    bool mediaControlsContextMenusEnabled() const { return m_values.mediaControlsContextMenusEnabled; }
    void setMediaControlsContextMenusEnabled(bool mediaControlsContextMenusEnabled) { m_values.mediaControlsContextMenusEnabled = mediaControlsContextMenusEnabled; }
#endif
#if ENABLE(MEDIA_RECORDER)
    bool mediaRecorderEnabled() const { return m_values.mediaRecorderEnabled; }
    void setMediaRecorderEnabled(bool mediaRecorderEnabled) { m_values.mediaRecorderEnabled = mediaRecorderEnabled; }
#endif
#if ENABLE(MEDIA_RECORDER_WEBM)
    bool mediaRecorderEnabledWebM() const { return m_values.mediaRecorderEnabledWebM; }
    void setMediaRecorderEnabledWebM(bool mediaRecorderEnabledWebM) { m_values.mediaRecorderEnabledWebM = mediaRecorderEnabledWebM; }
#endif
#if ENABLE(MEDIA_SESSION)
    bool mediaSessionEnabled() const { return m_values.mediaSessionEnabled; }
    void setMediaSessionEnabled(bool mediaSessionEnabled) { m_values.mediaSessionEnabled = mediaSessionEnabled; }
#endif
#if ENABLE(MEDIA_SESSION_COORDINATOR)
    bool mediaSessionCoordinatorEnabled() const { return m_values.mediaSessionCoordinatorEnabled; }
    void setMediaSessionCoordinatorEnabled(bool mediaSessionCoordinatorEnabled) { m_values.mediaSessionCoordinatorEnabled = mediaSessionCoordinatorEnabled; }
#endif
#if ENABLE(MEDIA_SESSION_COORDINATOR) && ENABLE(MEDIA_SESSION_PLAYLIST)
    bool mediaSessionPlaylistEnabled() const { return m_values.mediaSessionPlaylistEnabled; }
    void setMediaSessionPlaylistEnabled(bool mediaSessionPlaylistEnabled) { m_values.mediaSessionPlaylistEnabled = mediaSessionPlaylistEnabled; }
#endif
#if ENABLE(MEDIA_SOURCE)
    bool detachableMediaSourceEnabled() const { return m_values.detachableMediaSourceEnabled; }
    void setDetachableMediaSourceEnabled(bool detachableMediaSourceEnabled) { m_values.detachableMediaSourceEnabled = detachableMediaSourceEnabled; }
    bool managedMediaSourceEnabled() const { return m_values.managedMediaSourceEnabled; }
    void setManagedMediaSourceEnabled(bool managedMediaSourceEnabled) { m_values.managedMediaSourceEnabled = managedMediaSourceEnabled; }
    double managedMediaSourceHighThreshold() const { return m_values.managedMediaSourceHighThreshold; }
    void setManagedMediaSourceHighThreshold(double managedMediaSourceHighThreshold) { m_values.managedMediaSourceHighThreshold = managedMediaSourceHighThreshold; }
    double managedMediaSourceLowThreshold() const { return m_values.managedMediaSourceLowThreshold; }
    void setManagedMediaSourceLowThreshold(double managedMediaSourceLowThreshold) { m_values.managedMediaSourceLowThreshold = managedMediaSourceLowThreshold; }
    uint32_t maximumSourceBufferSize() const { return m_values.maximumSourceBufferSize; }
    void setMaximumSourceBufferSize(uint32_t maximumSourceBufferSize) { m_values.maximumSourceBufferSize = maximumSourceBufferSize; }
    bool sourceBufferChangeTypeEnabled() const { return m_values.sourceBufferChangeTypeEnabled; }
    void setSourceBufferChangeTypeEnabled(bool sourceBufferChangeTypeEnabled) { m_values.sourceBufferChangeTypeEnabled = sourceBufferChangeTypeEnabled; }
#endif
#if ENABLE(MEDIA_SOURCE) && ENABLE(WIRELESS_PLAYBACK_TARGET)
    bool managedMediaSourceNeedsAirPlay() const { return m_values.managedMediaSourceNeedsAirPlay; }
    void setManagedMediaSourceNeedsAirPlay(bool managedMediaSourceNeedsAirPlay) { m_values.managedMediaSourceNeedsAirPlay = managedMediaSourceNeedsAirPlay; }
#endif
#if ENABLE(MEDIA_SOURCE) && USE(AVFOUNDATION)
    bool mediaSourceCanFallbackToDecompressionSession() const { return m_values.mediaSourceCanFallbackToDecompressionSession; }
    void setMediaSourceCanFallbackToDecompressionSession(bool mediaSourceCanFallbackToDecompressionSession) { m_values.mediaSourceCanFallbackToDecompressionSession = mediaSourceCanFallbackToDecompressionSession; }
    bool mediaSourcePrefersDecompressionSession() const { return m_values.mediaSourcePrefersDecompressionSession; }
    void setMediaSourcePrefersDecompressionSession(bool mediaSourcePrefersDecompressionSession) { m_values.mediaSourcePrefersDecompressionSession = mediaSourcePrefersDecompressionSession; }
#endif
#if ENABLE(MEDIA_SOURCE_IN_WORKERS)
    bool mediaSourceInWorkerEnabled() const { return m_values.mediaSourceInWorkerEnabled; }
    void setMediaSourceInWorkerEnabled(bool mediaSourceInWorkerEnabled) { m_values.mediaSourceInWorkerEnabled = mediaSourceInWorkerEnabled; }
#endif
#if ENABLE(MEDIA_STREAM)
    bool exposeSpeakersEnabled() const { return m_values.exposeSpeakersEnabled; }
    void setExposeSpeakersEnabled(bool exposeSpeakersEnabled) { m_values.exposeSpeakersEnabled = exposeSpeakersEnabled; }
    bool exposeSpeakersWithoutMicrophoneEnabled() const { return m_values.exposeSpeakersWithoutMicrophoneEnabled; }
    void setExposeSpeakersWithoutMicrophoneEnabled(bool exposeSpeakersWithoutMicrophoneEnabled) { m_values.exposeSpeakersWithoutMicrophoneEnabled = exposeSpeakersWithoutMicrophoneEnabled; }
    bool getUserMediaRequiresFocus() const { return m_values.getUserMediaRequiresFocus; }
    void setGetUserMediaRequiresFocus(bool getUserMediaRequiresFocus) { m_values.getUserMediaRequiresFocus = getUserMediaRequiresFocus; }
    bool imageCaptureEnabled() const { return m_values.imageCaptureEnabled; }
    void setImageCaptureEnabled(bool imageCaptureEnabled) { m_values.imageCaptureEnabled = imageCaptureEnabled; }
    bool interruptAudioOnPageVisibilityChangeEnabled() const { return m_values.interruptAudioOnPageVisibilityChangeEnabled; }
    void setInterruptAudioOnPageVisibilityChangeEnabled(bool interruptAudioOnPageVisibilityChangeEnabled) { m_values.interruptAudioOnPageVisibilityChangeEnabled = interruptAudioOnPageVisibilityChangeEnabled; }
    bool interruptVideoOnPageVisibilityChangeEnabled() const { return m_values.interruptVideoOnPageVisibilityChangeEnabled; }
    void setInterruptVideoOnPageVisibilityChangeEnabled(bool interruptVideoOnPageVisibilityChangeEnabled) { m_values.interruptVideoOnPageVisibilityChangeEnabled = interruptVideoOnPageVisibilityChangeEnabled; }
    WEBCORE_EXPORT bool mediaCaptureRequiresSecureConnection() const;
    void setMediaCaptureRequiresSecureConnection(bool mediaCaptureRequiresSecureConnection) { m_values.mediaCaptureRequiresSecureConnection = mediaCaptureRequiresSecureConnection; }
    bool mediaDevicesEnabled() const { return m_values.mediaDevicesEnabled; }
    void setMediaDevicesEnabled(bool mediaDevicesEnabled) { m_values.mediaDevicesEnabled = mediaDevicesEnabled; }
    bool mediaStreamEnabled() const { return m_values.mediaStreamEnabled; }
    void setMediaStreamEnabled(bool mediaStreamEnabled) { m_values.mediaStreamEnabled = mediaStreamEnabled; }
    bool mediaStreamTrackProcessingEnabled() const { return m_values.mediaStreamTrackProcessingEnabled; }
    void setMediaStreamTrackProcessingEnabled(bool mediaStreamTrackProcessingEnabled) { m_values.mediaStreamTrackProcessingEnabled = mediaStreamTrackProcessingEnabled; }
    WEBCORE_EXPORT bool mockCaptureDevicesEnabled() const;
    WEBCORE_EXPORT void setMockCaptureDevicesEnabled(bool);
    bool muteCameraOnMicrophoneInterruptionEnabled() const { return m_values.muteCameraOnMicrophoneInterruptionEnabled; }
    void setMuteCameraOnMicrophoneInterruptionEnabled(bool muteCameraOnMicrophoneInterruptionEnabled) { m_values.muteCameraOnMicrophoneInterruptionEnabled = muteCameraOnMicrophoneInterruptionEnabled; }
    bool perElementSpeakerSelectionEnabled() const { return m_values.perElementSpeakerSelectionEnabled; }
    void setPerElementSpeakerSelectionEnabled(bool perElementSpeakerSelectionEnabled) { m_values.perElementSpeakerSelectionEnabled = perElementSpeakerSelectionEnabled; }
    bool screenCaptureEnabled() const { return m_values.screenCaptureEnabled; }
    void setScreenCaptureEnabled(bool screenCaptureEnabled) { m_values.screenCaptureEnabled = screenCaptureEnabled; }
    bool speakerSelectionRequiresUserGesture() const { return m_values.speakerSelectionRequiresUserGesture; }
    void setSpeakerSelectionRequiresUserGesture(bool speakerSelectionRequiresUserGesture) { m_values.speakerSelectionRequiresUserGesture = speakerSelectionRequiresUserGesture; }
    bool useMicrophoneMuteStatusAPI() const { return m_values.useMicrophoneMuteStatusAPI; }
    void setUseMicrophoneMuteStatusAPI(bool useMicrophoneMuteStatusAPI) { m_values.useMicrophoneMuteStatusAPI = useMicrophoneMuteStatusAPI; }
#endif
#if ENABLE(MEDIA_STREAM) && PLATFORM(IOS_FAMILY)
    bool manageCaptureStatusBarInGPUProcessEnabled() const { return m_values.manageCaptureStatusBarInGPUProcessEnabled; }
    void setManageCaptureStatusBarInGPUProcessEnabled(bool manageCaptureStatusBarInGPUProcessEnabled) { m_values.manageCaptureStatusBarInGPUProcessEnabled = manageCaptureStatusBarInGPUProcessEnabled; }
#endif
#if ENABLE(MODEL_ELEMENT)
    bool modelElementEnabled() const { return m_values.modelElementEnabled; }
    void setModelElementEnabled(bool modelElementEnabled) { m_values.modelElementEnabled = modelElementEnabled; }
#endif
#if ENABLE(MODEL_PROCESS)
    bool modelProcessEnabled() const { return m_values.modelProcessEnabled; }
    void setModelProcessEnabled(bool modelProcessEnabled) { m_values.modelProcessEnabled = modelProcessEnabled; }
#endif
#if ENABLE(NOTIFICATIONS)
    bool notificationsEnabled() const { return m_values.notificationsEnabled; }
    void setNotificationsEnabled(bool notificationsEnabled) { m_values.notificationsEnabled = notificationsEnabled; }
#endif
#if ENABLE(NOTIFICATION_EVENT)
    bool notificationEventEnabled() const { return m_values.notificationEventEnabled; }
    void setNotificationEventEnabled(bool notificationEventEnabled) { m_values.notificationEventEnabled = notificationEventEnabled; }
#endif
#if ENABLE(OFFSCREEN_CANVAS)
    bool offscreenCanvasEnabled() const { return m_values.offscreenCanvasEnabled; }
    void setOffscreenCanvasEnabled(bool offscreenCanvasEnabled) { m_values.offscreenCanvasEnabled = offscreenCanvasEnabled; }
#endif
#if ENABLE(OFFSCREEN_CANVAS_IN_WORKERS)
    bool offscreenCanvasInWorkersEnabled() const { return m_values.offscreenCanvasInWorkersEnabled; }
    void setOffscreenCanvasInWorkersEnabled(bool offscreenCanvasInWorkersEnabled) { m_values.offscreenCanvasInWorkersEnabled = offscreenCanvasInWorkersEnabled; }
#endif
#if ENABLE(OVERFLOW_SCROLLING_TOUCH)
    bool legacyOverflowScrollingTouchEnabled() const { return m_values.legacyOverflowScrollingTouchEnabled; }
    WEBCORE_EXPORT void setLegacyOverflowScrollingTouchEnabled(bool);
#endif
#if ENABLE(PAYMENT_REQUEST)
    bool paymentRequestEnabled() const { return m_values.paymentRequestEnabled; }
    void setPaymentRequestEnabled(bool paymentRequestEnabled) { m_values.paymentRequestEnabled = paymentRequestEnabled; }
#endif
#if ENABLE(PDFJS)
    bool pdfJSViewerEnabled() const { return m_values.pdfJSViewerEnabled; }
    void setPDFJSViewerEnabled(bool pdfJSViewerEnabled) { m_values.pdfJSViewerEnabled = pdfJSViewerEnabled; }
#endif
#if ENABLE(PICTURE_IN_PICTURE_API)
    bool pictureInPictureAPIEnabled() const { return m_values.pictureInPictureAPIEnabled; }
    void setPictureInPictureAPIEnabled(bool pictureInPictureAPIEnabled) { m_values.pictureInPictureAPIEnabled = pictureInPictureAPIEnabled; }
#endif
#if ENABLE(POINTER_LOCK)
    bool pointerLockEnabled() const { return m_values.pointerLockEnabled; }
    void setPointerLockEnabled(bool pointerLockEnabled) { m_values.pointerLockEnabled = pointerLockEnabled; }
    bool pointerLockOptionsEnabled() const { return m_values.pointerLockOptionsEnabled; }
    void setPointerLockOptionsEnabled(bool pointerLockOptionsEnabled) { m_values.pointerLockOptionsEnabled = pointerLockOptionsEnabled; }
#endif
#if ENABLE(RESOURCE_USAGE)
    bool resourceUsageOverlayVisible() const { return m_values.resourceUsageOverlayVisible; }
    WEBCORE_EXPORT void setResourceUsageOverlayVisible(bool);
#endif
#if ENABLE(SCREEN_TIME)
    bool screenTimeEnabled() const { return m_values.screenTimeEnabled; }
    void setScreenTimeEnabled(bool screenTimeEnabled) { m_values.screenTimeEnabled = screenTimeEnabled; }
#endif
#if ENABLE(SERVICE_CONTROLS)
    bool imageControlsEnabled() const { return m_values.imageControlsEnabled; }
    void setImageControlsEnabled(bool imageControlsEnabled) { m_values.imageControlsEnabled = imageControlsEnabled; }
    bool serviceControlsEnabled() const { return m_values.serviceControlsEnabled; }
    void setServiceControlsEnabled(bool serviceControlsEnabled) { m_values.serviceControlsEnabled = serviceControlsEnabled; }
#endif
#if ENABLE(SPATIAL_IMAGE_CONTROLS)
    bool spatialImageControlsEnabled() const { return m_values.spatialImageControlsEnabled; }
    void setSpatialImageControlsEnabled(bool spatialImageControlsEnabled) { m_values.spatialImageControlsEnabled = spatialImageControlsEnabled; }
#endif
#if ENABLE(TEXT_AUTOSIZING)
    bool idempotentModeAutosizingOnlyHonorsPercentages() const { return m_values.idempotentModeAutosizingOnlyHonorsPercentages; }
    void setIdempotentModeAutosizingOnlyHonorsPercentages(bool idempotentModeAutosizingOnlyHonorsPercentages) { m_values.idempotentModeAutosizingOnlyHonorsPercentages = idempotentModeAutosizingOnlyHonorsPercentages; }
    double minimumZoomFontSize() const { return m_values.minimumZoomFontSize; }
    void setMinimumZoomFontSize(double minimumZoomFontSize) { m_values.minimumZoomFontSize = minimumZoomFontSize; }
    bool shouldEnableTextAutosizingBoost() const { return m_values.shouldEnableTextAutosizingBoost; }
    WEBCORE_EXPORT void setShouldEnableTextAutosizingBoost(bool);
    bool textAutosizingEnabled() const { return m_values.textAutosizingEnabled; }
    WEBCORE_EXPORT void setTextAutosizingEnabled(bool);
    bool textAutosizingEnabledAtLargeInitialScale() const { return m_values.textAutosizingEnabledAtLargeInitialScale; }
    WEBCORE_EXPORT void setTextAutosizingEnabledAtLargeInitialScale(bool);
    bool textAutosizingUsesIdempotentMode() const { return m_values.textAutosizingUsesIdempotentMode; }
    WEBCORE_EXPORT void setTextAutosizingUsesIdempotentMode(bool);
    uint32_t textAutosizingWindowSizeOverrideHeight() const { return m_values.textAutosizingWindowSizeOverrideHeight; }
    WEBCORE_EXPORT void setTextAutosizingWindowSizeOverrideHeight(uint32_t);
    uint32_t textAutosizingWindowSizeOverrideWidth() const { return m_values.textAutosizingWindowSizeOverrideWidth; }
    WEBCORE_EXPORT void setTextAutosizingWindowSizeOverrideWidth(uint32_t);
#endif
#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    bool threadedAnimationResolutionEnabled() const { return m_values.threadedAnimationResolutionEnabled; }
    void setThreadedAnimationResolutionEnabled(bool threadedAnimationResolutionEnabled) { m_values.threadedAnimationResolutionEnabled = threadedAnimationResolutionEnabled; }
#endif
#if ENABLE(TOUCH_EVENTS)
    bool mouseEventsSimulationEnabled() const { return m_values.mouseEventsSimulationEnabled; }
    void setMouseEventsSimulationEnabled(bool mouseEventsSimulationEnabled) { m_values.mouseEventsSimulationEnabled = mouseEventsSimulationEnabled; }
    bool touchEventDOMAttributesEnabled() const { return m_values.touchEventDOMAttributesEnabled; }
    void setTouchEventDOMAttributesEnabled(bool touchEventDOMAttributesEnabled) { m_values.touchEventDOMAttributesEnabled = touchEventDOMAttributesEnabled; }
    bool isTouchEventEmulationEnabled() const { return m_values.touchEventEmulationEnabled; }
    void setTouchEventEmulationEnabled(bool touchEventEmulationEnabled) { m_values.touchEventEmulationEnabled = touchEventEmulationEnabled; }
#endif
#if ENABLE(UNIFIED_PDF)
    bool unifiedPDFEnabled() const { return m_values.unifiedPDFEnabled; }
    void setUnifiedPDFEnabled(bool unifiedPDFEnabled) { m_values.unifiedPDFEnabled = unifiedPDFEnabled; }
#endif
#if ENABLE(VIDEO)
    bool audioDescriptionsEnabled() const { return m_values.audioDescriptionsEnabled; }
    void setAudioDescriptionsEnabled(bool audioDescriptionsEnabled) { m_values.audioDescriptionsEnabled = audioDescriptionsEnabled; }
    bool extendedAudioDescriptionsEnabled() const { return m_values.extendedAudioDescriptionsEnabled; }
    void setExtendedAudioDescriptionsEnabled(bool extendedAudioDescriptionsEnabled) { m_values.extendedAudioDescriptionsEnabled = extendedAudioDescriptionsEnabled; }
    bool genericCueAPIEnabled() const { return m_values.genericCueAPIEnabled; }
    void setGenericCueAPIEnabled(bool genericCueAPIEnabled) { m_values.genericCueAPIEnabled = genericCueAPIEnabled; }
    bool mediaEnabled() const { return m_values.mediaEnabled; }
    void setMediaEnabled(bool mediaEnabled) { m_values.mediaEnabled = mediaEnabled; }
    bool preferSandboxedMediaParsing() const { return m_values.preferSandboxedMediaParsing; }
    void setPreferSandboxedMediaParsing(bool preferSandboxedMediaParsing) { m_values.preferSandboxedMediaParsing = preferSandboxedMediaParsing; }
    bool shouldDisplayCaptions() const { return m_values.shouldDisplayCaptions; }
    void setShouldDisplayCaptions(bool shouldDisplayCaptions) { m_values.shouldDisplayCaptions = shouldDisplayCaptions; }
    bool shouldDisplaySubtitles() const { return m_values.shouldDisplaySubtitles; }
    void setShouldDisplaySubtitles(bool shouldDisplaySubtitles) { m_values.shouldDisplaySubtitles = shouldDisplaySubtitles; }
    bool shouldDisplayTextDescriptions() const { return m_values.shouldDisplayTextDescriptions; }
    void setShouldDisplayTextDescriptions(bool shouldDisplayTextDescriptions) { m_values.shouldDisplayTextDescriptions = shouldDisplayTextDescriptions; }
    bool videoQualityIncludesDisplayCompositingEnabled() const { return m_values.videoQualityIncludesDisplayCompositingEnabled; }
    void setVideoQualityIncludesDisplayCompositingEnabled(bool videoQualityIncludesDisplayCompositingEnabled) { m_values.videoQualityIncludesDisplayCompositingEnabled = videoQualityIncludesDisplayCompositingEnabled; }
#endif
#if ENABLE(VP9)
    bool vp9DecoderEnabled() const { return m_values.vp9DecoderEnabled; }
    void setVP9DecoderEnabled(bool vp9DecoderEnabled) { m_values.vp9DecoderEnabled = vp9DecoderEnabled; }
#endif
#if ENABLE(WEBASSEMBLY)
    bool webAssemblyESMIntegrationEnabled() const { return m_values.webAssemblyESMIntegrationEnabled; }
    void setWebAssemblyESMIntegrationEnabled(bool webAssemblyESMIntegrationEnabled) { m_values.webAssemblyESMIntegrationEnabled = webAssemblyESMIntegrationEnabled; }
#endif
#if ENABLE(WEBGL)
    bool allowWebGLInWorkers() const { return m_values.allowWebGLInWorkers; }
    void setAllowWebGLInWorkers(bool allowWebGLInWorkers) { m_values.allowWebGLInWorkers = allowWebGLInWorkers; }
#endif
#if ENABLE(WEBXR)
    bool touchInputCompatibilityEnabled() const { return m_values.touchInputCompatibilityEnabled; }
    void setTouchInputCompatibilityEnabled(bool touchInputCompatibilityEnabled) { m_values.touchInputCompatibilityEnabled = touchInputCompatibilityEnabled; }
    bool webXRAugmentedRealityModuleEnabled() const { return m_values.webXRAugmentedRealityModuleEnabled; }
    void setWebXRAugmentedRealityModuleEnabled(bool webXRAugmentedRealityModuleEnabled) { m_values.webXRAugmentedRealityModuleEnabled = webXRAugmentedRealityModuleEnabled; }
    bool webXREnabled() const { return m_values.webXREnabled; }
    void setWebXREnabled(bool webXREnabled) { m_values.webXREnabled = webXREnabled; }
    bool webXRGamepadsModuleEnabled() const { return m_values.webXRGamepadsModuleEnabled; }
    void setWebXRGamepadsModuleEnabled(bool webXRGamepadsModuleEnabled) { m_values.webXRGamepadsModuleEnabled = webXRGamepadsModuleEnabled; }
#endif
#if ENABLE(WEBXR_HANDS)
    bool webXRHandInputModuleEnabled() const { return m_values.webXRHandInputModuleEnabled; }
    void setWebXRHandInputModuleEnabled(bool webXRHandInputModuleEnabled) { m_values.webXRHandInputModuleEnabled = webXRHandInputModuleEnabled; }
#endif
#if ENABLE(WEBXR_LAYERS)
    bool webXRLayersAPIEnabled() const { return m_values.webXRLayersAPIEnabled; }
    void setWebXRLayersAPIEnabled(bool webXRLayersAPIEnabled) { m_values.webXRLayersAPIEnabled = webXRLayersAPIEnabled; }
#endif
#if ENABLE(WEB_ARCHIVE)
    bool alwaysAllowLocalWebarchive() const { return m_values.alwaysAllowLocalWebarchive; }
    void setAlwaysAllowLocalWebarchive(bool alwaysAllowLocalWebarchive) { m_values.alwaysAllowLocalWebarchive = alwaysAllowLocalWebarchive; }
    bool loadWebArchiveWithEphemeralStorageEnabled() const { return m_values.loadWebArchiveWithEphemeralStorageEnabled; }
    void setLoadWebArchiveWithEphemeralStorageEnabled(bool loadWebArchiveWithEphemeralStorageEnabled) { m_values.loadWebArchiveWithEphemeralStorageEnabled = loadWebArchiveWithEphemeralStorageEnabled; }
    bool webArchiveDebugModeEnabled() const { return m_values.webArchiveDebugModeEnabled; }
    void setWebArchiveDebugModeEnabled(bool webArchiveDebugModeEnabled) { m_values.webArchiveDebugModeEnabled = webArchiveDebugModeEnabled; }
    bool webArchiveTestingModeEnabled() const { return m_values.webArchiveTestingModeEnabled; }
    void setWebArchiveTestingModeEnabled(bool webArchiveTestingModeEnabled) { m_values.webArchiveTestingModeEnabled = webArchiveTestingModeEnabled; }
#endif
#if ENABLE(WEB_AUDIO)
    bool webAudioEnabled() const { return m_values.webAudioEnabled; }
    void setWebAudioEnabled(bool webAudioEnabled) { m_values.webAudioEnabled = webAudioEnabled; }
#endif
#if ENABLE(WEB_AUTHN)
    bool webAuthenticationEnabled() const { return m_values.webAuthenticationEnabled; }
    void setWebAuthenticationEnabled(bool webAuthenticationEnabled) { m_values.webAuthenticationEnabled = webAuthenticationEnabled; }
#endif
#if ENABLE(WEB_CODECS)
    bool webCodecsAV1Enabled() const { return m_values.webCodecsAV1Enabled; }
    void setWebCodecsAV1Enabled(bool webCodecsAV1Enabled) { m_values.webCodecsAV1Enabled = webCodecsAV1Enabled; }
    bool webCodecsAudioEnabled() const { return m_values.webCodecsAudioEnabled; }
    void setWebCodecsAudioEnabled(bool webCodecsAudioEnabled) { m_values.webCodecsAudioEnabled = webCodecsAudioEnabled; }
    bool webCodecsHEVCEnabled() const { return m_values.webCodecsHEVCEnabled; }
    void setWebCodecsHEVCEnabled(bool webCodecsHEVCEnabled) { m_values.webCodecsHEVCEnabled = webCodecsHEVCEnabled; }
    bool webCodecsVideoEnabled() const { return m_values.webCodecsVideoEnabled; }
    void setWebCodecsVideoEnabled(bool webCodecsVideoEnabled) { m_values.webCodecsVideoEnabled = webCodecsVideoEnabled; }
#endif
#if ENABLE(WEB_RTC)
    bool legacyWebRTCOfferOptionsEnabled() const { return m_values.legacyWebRTCOfferOptionsEnabled; }
    void setLegacyWebRTCOfferOptionsEnabled(bool legacyWebRTCOfferOptionsEnabled) { m_values.legacyWebRTCOfferOptionsEnabled = legacyWebRTCOfferOptionsEnabled; }
    bool peerConnectionEnabled() const { return m_values.peerConnectionEnabled; }
    void setPeerConnectionEnabled(bool peerConnectionEnabled) { m_values.peerConnectionEnabled = peerConnectionEnabled; }
    bool peerConnectionVideoScalingAdaptationDisabled() const { return m_values.peerConnectionVideoScalingAdaptationDisabled; }
    void setPeerConnectionVideoScalingAdaptationDisabled(bool peerConnectionVideoScalingAdaptationDisabled) { m_values.peerConnectionVideoScalingAdaptationDisabled = peerConnectionVideoScalingAdaptationDisabled; }
    bool webRTCAV1CodecEnabled() const { return m_values.webRTCAV1CodecEnabled; }
    void setWebRTCAV1CodecEnabled(bool webRTCAV1CodecEnabled) { m_values.webRTCAV1CodecEnabled = webRTCAV1CodecEnabled; }
    bool webRTCDTMFEnabled() const { return m_values.webRTCDTMFEnabled; }
    void setWebRTCDTMFEnabled(bool webRTCDTMFEnabled) { m_values.webRTCDTMFEnabled = webRTCDTMFEnabled; }
    bool webRTCEncodedTransformEnabled() const { return m_values.webRTCEncodedTransformEnabled; }
    void setWebRTCEncodedTransformEnabled(bool webRTCEncodedTransformEnabled) { m_values.webRTCEncodedTransformEnabled = webRTCEncodedTransformEnabled; }
    bool webRTCH265CodecEnabled() const { return m_values.webRTCH265CodecEnabled; }
    void setWebRTCH265CodecEnabled(bool webRTCH265CodecEnabled) { m_values.webRTCH265CodecEnabled = webRTCH265CodecEnabled; }
    bool webRTCL4SEnabled() const { return m_values.webRTCL4SEnabled; }
    void setWebRTCL4SEnabled(bool webRTCL4SEnabled) { m_values.webRTCL4SEnabled = webRTCL4SEnabled; }
    bool webRTCPlatformCodecsInGPUProcessEnabled() const { return m_values.webRTCPlatformCodecsInGPUProcessEnabled; }
    void setWebRTCPlatformCodecsInGPUProcessEnabled(bool webRTCPlatformCodecsInGPUProcessEnabled) { m_values.webRTCPlatformCodecsInGPUProcessEnabled = webRTCPlatformCodecsInGPUProcessEnabled; }
    bool webRTCRemoteVideoFrameEnabled() const { return m_values.webRTCRemoteVideoFrameEnabled; }
    void setWebRTCRemoteVideoFrameEnabled(bool webRTCRemoteVideoFrameEnabled) { m_values.webRTCRemoteVideoFrameEnabled = webRTCRemoteVideoFrameEnabled; }
    bool webRTCSFrameTransformEnabled() const { return m_values.webRTCSFrameTransformEnabled; }
    void setWebRTCSFrameTransformEnabled(bool webRTCSFrameTransformEnabled) { m_values.webRTCSFrameTransformEnabled = webRTCSFrameTransformEnabled; }
    bool webRTCSocketsProxyingEnabled() const { return m_values.webRTCSocketsProxyingEnabled; }
    void setWebRTCSocketsProxyingEnabled(bool webRTCSocketsProxyingEnabled) { m_values.webRTCSocketsProxyingEnabled = webRTCSocketsProxyingEnabled; }
    const String& webRTCUDPPortRange() const { return m_values.webRTCUDPPortRange; }
    void setWebRTCUDPPortRange(const String& webRTCUDPPortRange) { m_values.webRTCUDPPortRange = webRTCUDPPortRange; }
    bool webRTCVP9Profile0CodecEnabled() const { return m_values.webRTCVP9Profile0CodecEnabled; }
    void setWebRTCVP9Profile0CodecEnabled(bool webRTCVP9Profile0CodecEnabled) { m_values.webRTCVP9Profile0CodecEnabled = webRTCVP9Profile0CodecEnabled; }
    bool webRTCVP9Profile2CodecEnabled() const { return m_values.webRTCVP9Profile2CodecEnabled; }
    void setWebRTCVP9Profile2CodecEnabled(bool webRTCVP9Profile2CodecEnabled) { m_values.webRTCVP9Profile2CodecEnabled = webRTCVP9Profile2CodecEnabled; }
#endif
#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    bool allowsAirPlayForMediaPlayback() const { return m_values.allowsAirPlayForMediaPlayback; }
    void setAllowsAirPlayForMediaPlayback(bool allowsAirPlayForMediaPlayback) { m_values.allowsAirPlayForMediaPlayback = allowsAirPlayForMediaPlayback; }
    bool remotePlaybackEnabled() const { return m_values.remotePlaybackEnabled; }
    void setRemotePlaybackEnabled(bool remotePlaybackEnabled) { m_values.remotePlaybackEnabled = remotePlaybackEnabled; }
#endif
#if ENABLE(WK_WEB_EXTENSIONS_IN_WEBDRIVER)
    bool webExtensionWebDriverEnabled() const { return m_values.webExtensionWebDriverEnabled; }
    void setWebExtensionWebDriverEnabled(bool webExtensionWebDriverEnabled) { m_values.webExtensionWebDriverEnabled = webExtensionWebDriverEnabled; }
#endif
#if ENABLE(WK_WEB_EXTENSIONS_SIDEBAR)
    bool webExtensionSidebarEnabled() const { return m_values.webExtensionSidebarEnabled; }
    void setWebExtensionSidebarEnabled(bool webExtensionSidebarEnabled) { m_values.webExtensionSidebarEnabled = webExtensionSidebarEnabled; }
#endif
#if ENABLE(WRITING_SUGGESTIONS)
    bool writingSuggestionsAttributeEnabled() const { return m_values.writingSuggestionsAttributeEnabled; }
    void setWritingSuggestionsAttributeEnabled(bool writingSuggestionsAttributeEnabled) { m_values.writingSuggestionsAttributeEnabled = writingSuggestionsAttributeEnabled; }
#endif
#if ENABLE(WRITING_TOOLS)
    bool textAnimationsEnabled() const { return m_values.textAnimationsEnabled; }
    void setTextAnimationsEnabled(bool textAnimationsEnabled) { m_values.textAnimationsEnabled = textAnimationsEnabled; }
#endif
#if HAVE(ALLOW_ONLY_PARTITIONED_COOKIES)
    bool optInPartitionedCookiesEnabled() const { return m_values.optInPartitionedCookiesEnabled; }
    void setOptInPartitionedCookiesEnabled(bool optInPartitionedCookiesEnabled) { m_values.optInPartitionedCookiesEnabled = optInPartitionedCookiesEnabled; }
#endif
#if HAVE(AVKIT_CONTENT_SOURCE)
    bool aVKitContentSourceEnabled() const { return m_values.aVKitContentSourceEnabled; }
    void setAVKitContentSourceEnabled(bool aVKitContentSourceEnabled) { m_values.aVKitContentSourceEnabled = aVKitContentSourceEnabled; }
#endif
#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    bool cssTransformStyleSeparatedEnabled() const { return m_values.cssTransformStyleSeparatedEnabled; }
    void setCSSTransformStyleSeparatedEnabled(bool cssTransformStyleSeparatedEnabled) { m_values.cssTransformStyleSeparatedEnabled = cssTransformStyleSeparatedEnabled; }
#endif
#if HAVE(CORE_MATERIAL)
    bool appleSystemVisualEffectsEnabled() const { return m_values.appleSystemVisualEffectsEnabled; }
    void setAppleSystemVisualEffectsEnabled(bool appleSystemVisualEffectsEnabled) { m_values.appleSystemVisualEffectsEnabled = appleSystemVisualEffectsEnabled; }
#endif
#if HAVE(HDR_SUPPORT)
    bool hdrForImagesEnabled() const { return m_values.hdrForImagesEnabled; }
    WEBCORE_EXPORT void setHDRForImagesEnabled(bool);
#endif
#if HAVE(INCREMENTAL_PDF_APIS)
    bool incrementalPDFLoadingEnabled() const { return m_values.incrementalPDFLoadingEnabled; }
    void setIncrementalPDFLoadingEnabled(bool incrementalPDFLoadingEnabled) { m_values.incrementalPDFLoadingEnabled = incrementalPDFLoadingEnabled; }
#endif
#if HAVE(RUBBER_BANDING)
    bool rubberBandingForSubScrollableRegionsEnabled() const { return m_values.rubberBandingForSubScrollableRegionsEnabled; }
    void setRubberBandingForSubScrollableRegionsEnabled(bool rubberBandingForSubScrollableRegionsEnabled) { m_values.rubberBandingForSubScrollableRegionsEnabled = rubberBandingForSubScrollableRegionsEnabled; }
#endif
#if HAVE(SC_CONTENT_SHARING_PICKER)
    bool requireUAGetDisplayMediaPrompt() const { return m_values.requireUAGetDisplayMediaPrompt; }
    void setRequireUAGetDisplayMediaPrompt(bool requireUAGetDisplayMediaPrompt) { m_values.requireUAGetDisplayMediaPrompt = requireUAGetDisplayMediaPrompt; }
    bool useSCContentSharingPicker() const { return m_values.useSCContentSharingPicker; }
    void setUseSCContentSharingPicker(bool useSCContentSharingPicker) { m_values.useSCContentSharingPicker = useSCContentSharingPicker; }
#endif
#if HAVE(WEB_AUTHN_AS_MODERN)
    bool webAuthenticationASEnabled() const { return m_values.webAuthenticationASEnabled; }
    void setWebAuthenticationASEnabled(bool webAuthenticationASEnabled) { m_values.webAuthenticationASEnabled = webAuthenticationASEnabled; }
#endif
#if PLATFORM(COCOA)
    bool pdfPluginEnabled() const { return m_values.pdfPluginEnabled; }
    void setPDFPluginEnabled(bool pdfPluginEnabled) { m_values.pdfPluginEnabled = pdfPluginEnabled; }
    bool pdfPluginHUDEnabled() const { return m_values.pdfPluginHUDEnabled; }
    void setPDFPluginHUDEnabled(bool pdfPluginHUDEnabled) { m_values.pdfPluginHUDEnabled = pdfPluginHUDEnabled; }
    bool writeRichTextDataWhenCopyingOrDragging() const { return m_values.writeRichTextDataWhenCopyingOrDragging; }
    void setWriteRichTextDataWhenCopyingOrDragging(bool writeRichTextDataWhenCopyingOrDragging) { m_values.writeRichTextDataWhenCopyingOrDragging = writeRichTextDataWhenCopyingOrDragging; }
#endif
#if PLATFORM(IOS_FAMILY)
    bool allowViewportShrinkToFitContent() const { return m_values.allowViewportShrinkToFitContent; }
    void setAllowViewportShrinkToFitContent(bool allowViewportShrinkToFitContent) { m_values.allowViewportShrinkToFitContent = allowViewportShrinkToFitContent; }
    bool alternateFormControlDesignEnabled() const { return m_values.alternateFormControlDesignEnabled; }
    void setAlternateFormControlDesignEnabled(bool alternateFormControlDesignEnabled) { m_values.alternateFormControlDesignEnabled = alternateFormControlDesignEnabled; }
    bool alternateFullScreenControlDesignEnabled() const { return m_values.alternateFullScreenControlDesignEnabled; }
    void setAlternateFullScreenControlDesignEnabled(bool alternateFullScreenControlDesignEnabled) { m_values.alternateFullScreenControlDesignEnabled = alternateFullScreenControlDesignEnabled; }
    bool selectionHonorsOverflowScrolling() const { return m_values.selectionHonorsOverflowScrolling; }
    void setSelectionHonorsOverflowScrolling(bool selectionHonorsOverflowScrolling) { m_values.selectionHonorsOverflowScrolling = selectionHonorsOverflowScrolling; }
    bool useAsyncUIKitInteractions() const { return m_values.useAsyncUIKitInteractions; }
    void setUseAsyncUIKitInteractions(bool useAsyncUIKitInteractions) { m_values.useAsyncUIKitInteractions = useAsyncUIKitInteractions; }
    bool visuallyContiguousBidiTextSelectionEnabled() const { return m_values.visuallyContiguousBidiTextSelectionEnabled; }
    void setVisuallyContiguousBidiTextSelectionEnabled(bool visuallyContiguousBidiTextSelectionEnabled) { m_values.visuallyContiguousBidiTextSelectionEnabled = visuallyContiguousBidiTextSelectionEnabled; }
#endif
#if PLATFORM(MAC) && USE(RUNNINGBOARD)
    bool backgroundWebContentRunningBoardThrottlingEnabled() const { return m_values.backgroundWebContentRunningBoardThrottlingEnabled; }
    void setBackgroundWebContentRunningBoardThrottlingEnabled(bool backgroundWebContentRunningBoardThrottlingEnabled) { m_values.backgroundWebContentRunningBoardThrottlingEnabled = backgroundWebContentRunningBoardThrottlingEnabled; }
#endif
#if PLATFORM(VISION)
    bool fullscreenSceneAspectRatioLockingEnabled() const { return m_values.fullscreenSceneAspectRatioLockingEnabled; }
    void setFullscreenSceneAspectRatioLockingEnabled(bool fullscreenSceneAspectRatioLockingEnabled) { m_values.fullscreenSceneAspectRatioLockingEnabled = fullscreenSceneAspectRatioLockingEnabled; }
    bool fullscreenSceneDimmingEnabled() const { return m_values.fullscreenSceneDimmingEnabled; }
    void setFullscreenSceneDimmingEnabled(bool fullscreenSceneDimmingEnabled) { m_values.fullscreenSceneDimmingEnabled = fullscreenSceneDimmingEnabled; }
#endif
#if PLATFORM(VISION) && ENABLE(MODEL_PROCESS)
    bool modelNoPortalAttributeEnabled() const { return m_values.modelNoPortalAttributeEnabled; }
    void setModelNoPortalAttributeEnabled(bool modelNoPortalAttributeEnabled) { m_values.modelNoPortalAttributeEnabled = modelNoPortalAttributeEnabled; }
#endif
#if USE(CA) || USE(SKIA)
    bool canvasUsesAcceleratedDrawing() const { return m_values.canvasUsesAcceleratedDrawing; }
    void setCanvasUsesAcceleratedDrawing(bool canvasUsesAcceleratedDrawing) { m_values.canvasUsesAcceleratedDrawing = canvasUsesAcceleratedDrawing; }
#endif
#if USE(COORDINATED_GRAPHICS)
    bool propagateDamagingInformation() const { return m_values.propagateDamagingInformation; }
    void setPropagateDamagingInformation(bool propagateDamagingInformation) { m_values.propagateDamagingInformation = propagateDamagingInformation; }
    bool unifyDamagedRegions() const { return m_values.unifyDamagedRegions; }
    void setUnifyDamagedRegions(bool unifyDamagedRegions) { m_values.unifyDamagedRegions = unifyDamagedRegions; }
#endif
#if USE(CORE_IMAGE)
    bool acceleratedFiltersEnabled() const { return m_values.acceleratedFiltersEnabled; }
    WEBCORE_EXPORT void setAcceleratedFiltersEnabled(bool);
#endif
#if USE(GRAPHICS_CONTEXT_FILTERS)
    bool graphicsContextFiltersEnabled() const { return m_values.graphicsContextFiltersEnabled; }
    WEBCORE_EXPORT void setGraphicsContextFiltersEnabled(bool);
#endif
#if USE(MODERN_AVCONTENTKEYSESSION)
    bool shouldUseModernAVContentKeySession() const { return m_values.shouldUseModernAVContentKeySession; }
    WEBCORE_EXPORT void setShouldUseModernAVContentKeySession(bool);
#endif
#if USE(SYSTEM_PREVIEW)
    bool systemPreviewEnabled() const { return m_values.systemPreviewEnabled; }
    void setSystemPreviewEnabled(bool systemPreviewEnabled) { m_values.systemPreviewEnabled = systemPreviewEnabled; }
#endif

    WEBCORE_EXPORT void setAuthorAndUserStylesEnabledInspectorOverride(std::optional<bool>);
    WEBCORE_EXPORT void setICECandidateFilteringEnabledInspectorOverride(std::optional<bool>);
    WEBCORE_EXPORT void setImagesEnabledInspectorOverride(std::optional<bool>);
    void setMediaCaptureRequiresSecureConnectionInspectorOverride(std::optional<bool> mediaCaptureRequiresSecureConnectionInspectorOverride) { m_values.mediaCaptureRequiresSecureConnectionInspectorOverride = mediaCaptureRequiresSecureConnectionInspectorOverride; }
    WEBCORE_EXPORT void setMockCaptureDevicesEnabledInspectorOverride(std::optional<bool>);
    void setNeedsSiteSpecificQuirksInspectorOverride(std::optional<bool> needsSiteSpecificQuirksInspectorOverride) { m_values.needsSiteSpecificQuirksInspectorOverride = needsSiteSpecificQuirksInspectorOverride; }
    void setScriptEnabledInspectorOverride(std::optional<bool> scriptEnabledInspectorOverride) { m_values.scriptEnabledInspectorOverride = scriptEnabledInspectorOverride; }
    WEBCORE_EXPORT void setShowDebugBordersInspectorOverride(std::optional<bool>);
    WEBCORE_EXPORT void setShowRepaintCounterInspectorOverride(std::optional<bool>);
    void setWebSecurityEnabledInspectorOverride(std::optional<bool> webSecurityEnabledInspectorOverride) { m_values.webSecurityEnabledInspectorOverride = webSecurityEnabledInspectorOverride; }
    FontGenericFamilies& fontGenericFamilies() final { return m_values.fontGenericFamilies; }
    const FontGenericFamilies& fontGenericFamilies() const final { return m_values.fontGenericFamilies; }

    struct Values {
        void initialize();
        Values isolatedCopy() const;

        std::optional<bool> authorAndUserStylesEnabledInspectorOverride;
        std::optional<bool> iceCandidateFilteringEnabledInspectorOverride;
        std::optional<bool> imagesEnabledInspectorOverride;
        std::optional<bool> mediaCaptureRequiresSecureConnectionInspectorOverride;
        std::optional<bool> mockCaptureDevicesEnabledInspectorOverride;
        std::optional<bool> needsSiteSpecificQuirksInspectorOverride;
        std::optional<bool> scriptEnabledInspectorOverride;
        std::optional<bool> showDebugBordersInspectorOverride;
        std::optional<bool> showRepaintCounterInspectorOverride;
        std::optional<bool> webSecurityEnabledInspectorOverride;

        FontGenericFamilies fontGenericFamilies;
        Seconds backForwardCacheExpirationInterval;
        ClipboardAccessPolicy clipboardAccessPolicy;
        double defaultFixedFontSize;
        double defaultFontSize;
        String defaultTextEncodingName;
        String defaultVideoPosterURL;
        uint32_t deviceHeight;
        uint32_t deviceWidth;
        DownloadableBinaryFontTrustedTypes downloadableBinaryFontTrustedTypes;
        WebCore::EditableLinkBehavior editableLinkBehavior;
        EditingBehaviorType editingBehaviorType;
        FontLoadTimingOverride fontLoadTimingOverride;
        ForcedAccessibilityValue forcedColorsAreInvertedAccessibilityValue;
        ForcedAccessibilityValue forcedDisplayIsMonochromeAccessibilityValue;
        ForcedAccessibilityValue forcedPrefersContrastAccessibilityValue;
        ForcedAccessibilityValue forcedPrefersReducedMotionAccessibilityValue;
        ForcedAccessibilityValue forcedSupportsHighDynamicRangeValue;
        String ftpDirectoryTemplatePath;
        HTMLParserScriptingFlagPolicy htmlParserScriptingFlagPolicy;
        double incrementalRenderingSuppressionTimeoutInSeconds;
        double interactionRegionInlinePadding;
        double interactionRegionMinimumCornerRadius;
        JSC::RuntimeFlags javaScriptRuntimeFlags;
        uint32_t layoutFallbackWidth;
        double layoutViewportHeightExpansionFactor;
        String localStorageDatabasePath;
        double maxParseDuration;
        uint32_t maximumHTMLParserDOMTreeDepth;
        String mediaKeysStorageDirectory;
        double mediaPreferredFullscreenWidth;
        String mediaTypeOverride;
        uint64_t minimumAccelerated2DContextArea;
        double minimumFontSize;
        double minimumLogicalFontSize;
        double passwordEchoDurationInSeconds;
        MediaPlayerEnums::PitchCorrectionAlgorithm pitchCorrectionAlgorithm;
        double sampledPageTopColorMaxDifference;
        double sampledPageTopColorMinHeight;
        uint32_t sessionStorageQuota;
        StorageBlockingPolicy storageBlockingPolicy;
        WebCore::TextDirection systemLayoutDirection;
        TextDirectionSubmenuInclusionBehavior textDirectionSubmenuInclusionBehavior;
        Seconds timeWithoutMouseMovementBeforeHidingControls;
        WebCore::UserInterfaceDirectionPolicy userInterfaceDirectionPolicy;
        URL userStyleSheetLocation;
        uint32_t validationMessageTimerMagnification;
        uint32_t visibleDebugOverlayRegions;
#if ENABLE(DATA_DETECTION)
        WebCore::DataDetectorType dataDetectorTypes;
#endif
#if ENABLE(MEDIA_SOURCE)
        double managedMediaSourceHighThreshold;
        double managedMediaSourceLowThreshold;
        uint32_t maximumSourceBufferSize;
#endif
#if ENABLE(TEXT_AUTOSIZING)
        double minimumZoomFontSize;
        uint32_t textAutosizingWindowSizeOverrideHeight;
        uint32_t textAutosizingWindowSizeOverrideWidth;
#endif
#if ENABLE(WEB_RTC)
        String webRTCUDPPortRange;
#endif
        bool CSSOMViewScrollingAPIEnabled : 1;
        bool CSSOMViewSmoothScrollingEnabled : 1;
        bool abortSignalAnyOperationEnabled : 1;
        bool acceleratedCompositingEnabled : 1;
        bool acceleratedCompositingForFixedPositionEnabled : 1;
        bool acceleratedDrawingEnabled : 1;
        bool accentColorEnabled : 1;
        bool accessHandleEnabled : 1;
        bool aggressiveTileRetentionEnabled : 1;
        bool alignContentOnBlocksEnabled : 1;
        bool allowAnimationControlsOverride : 1;
        bool allowContentSecurityPolicySourceStarToMatchAnyProtocol : 1;
        bool allowDisplayOfInsecureContent : 1;
        bool allowFileAccessFromFileURLs : 1;
        bool allowMediaContentTypesRequiringHardwareSupportAsFallback : 1;
        bool allowMultiElementImplicitSubmission : 1;
        bool allowPrivacySensitiveOperationsInNonPersistentDataStores : 1;
        bool allowRunningOfInsecureContent : 1;
        bool allowSettingAnyXHRHeaderFromFileURLs : 1;
        bool allowTopNavigationToDataURLs : 1;
        bool allowUniversalAccessFromFileURLs : 1;
        bool allowsInlineMediaPlayback : 1;
        bool allowsInlineMediaPlaybackAfterFullscreen : 1;
        bool allowsPictureInPictureMediaPlayback : 1;
        bool altitudeAngleEnabled : 1;
        bool animatedImageAsyncDecodingEnabled : 1;
        bool animatedImageDebugCanvasDrawingEnabled : 1;
        bool appBadgeEnabled : 1;
        bool appleMailPaginationQuirkEnabled : 1;
        bool asyncClipboardAPIEnabled : 1;
        bool asyncFrameScrollingEnabled : 1;
        bool asyncOverflowScrollingEnabled : 1;
        bool asynchronousSpellCheckingEnabled : 1;
        bool audioControlsScaleWithPageZoom : 1;
        bool authorAndUserStylesEnabled : 1;
        bool automaticallyAdjustsViewScaleUsingMinimumEffectiveDeviceWidth : 1;
        bool autoscrollForDragAndDropEnabled : 1;
        bool auxclickEventEnabled : 1;
        bool azimuthAngleEnabled : 1;
        bool backgroundFetchAPIEnabled : 1;
        bool backgroundShouldExtendBeyondPage : 1;
        bool backspaceKeyNavigationEnabled : 1;
        bool beaconAPIEnabled : 1;
        bool blobFileAccessEnforcementEnabled : 1;
        bool blobRegistryTopOriginPartitioningEnabled : 1;
        bool broadcastChannelEnabled : 1;
        bool broadcastChannelOriginPartitioningEnabled : 1;
        bool cacheAPIEnabled : 1;
        bool canvasColorSpaceEnabled : 1;
        bool canvasFiltersEnabled : 1;
        bool canvasFingerprintingQuirkEnabled : 1;
        bool canvasLayersEnabled : 1;
        bool canvasPixelFormatEnabled : 1;
        bool caretBrowsingEnabled : 1;
        bool caretPositionFromPointEnabled : 1;
        bool childProcessDebuggabilityEnabled : 1;
        bool clearSiteDataExecutionContextsSupportEnabled : 1;
        bool clearSiteDataHTTPHeaderEnabled : 1;
        bool clientBadgeEnabled : 1;
        bool clientCoordinatesRelativeToLayoutViewport : 1;
        bool colorFilterEnabled : 1;
        bool compressionStreamEnabled : 1;
        bool contactPickerAPIEnabled : 1;
        bool contentDispositionAttachmentSandboxEnabled : 1;
        bool cookieConsentAPIEnabled : 1;
        bool cookieEnabled : 1;
        bool cookieStoreAPIEnabled : 1;
        bool cookieStoreAPIExtendedAttributesEnabled : 1;
        bool cookieStoreManagerEnabled : 1;
        bool coreMathMLEnabled : 1;
        bool crossDocumentViewTransitionsEnabled : 1;
        bool crossOriginCheckInGetMatchedCSSRulesDisabled : 1;
        bool crossOriginEmbedderPolicyEnabled : 1;
        bool crossOriginOpenerPolicyEnabled : 1;
        bool css3DTransformBackfaceVisibilityInteroperabilityEnabled : 1;
        bool cssAnchorPositioningEnabled : 1;
        bool cssAppearanceBaseEnabled : 1;
        bool cssBackgroundClipBorderAreaEnabled : 1;
        bool cssColorLayersEnabled : 1;
        bool cssContainerProgressFunctionEnabled : 1;
        bool cssContentVisibilityEnabled : 1;
        bool cssContrastColorEnabled : 1;
        bool cssCounterStyleAtRuleImageSymbolsEnabled : 1;
        bool cssCounterStyleAtRulesEnabled : 1;
        bool cssDPropertyEnabled : 1;
        bool cssFieldSizingEnabled : 1;
        bool cssFontFaceSizeAdjustEnabled : 1;
        bool cssFontVariantEmojiEnabled : 1;
        bool cssInputSecurityEnabled : 1;
        bool cssLightDarkEnabled : 1;
        bool cssLineClampEnabled : 1;
        bool cssLineFitEdgeEnabled : 1;
        bool cssMarginTrimEnabled : 1;
        bool cssMediaProgressFunctionEnabled : 1;
        bool cssMotionPathEnabled : 1;
        bool cssNestingEnabled : 1;
        bool cssPaintingAPIEnabled : 1;
        bool cssProgressFunctionEnabled : 1;
        bool cssRhythmicSizingEnabled : 1;
        bool cssRubyAlignEnabled : 1;
        bool cssRubyOverhangEnabled : 1;
        bool cssScopeAtRuleEnabled : 1;
        bool cssScrollAnchoringEnabled : 1;
        bool cssScrollbarColorEnabled : 1;
        bool cssScrollbarGutterEnabled : 1;
        bool cssScrollbarWidthEnabled : 1;
        bool cssShapeFunctionEnabled : 1;
        bool cssStartingStyleAtRuleEnabled : 1;
        bool cssStyleQueriesEnabled : 1;
        bool cssTextAutospaceEnabled : 1;
        bool cssTextBoxTrimEnabled : 1;
        bool cssTextGroupAlignEnabled : 1;
        bool cssTextJustifyEnabled : 1;
        bool cssTextSpacingTrimEnabled : 1;
        bool cssTextUnderlinePositionLeftRightEnabled : 1;
        bool cssTextWrapPrettyEnabled : 1;
        bool cssTextWrapStyleEnabled : 1;
        bool cssTypedOMColorEnabled : 1;
        bool cssUnprefixedBackdropFilterEnabled : 1;
        bool cssWordBreakAutoPhraseEnabled : 1;
        bool dataTransferItemsEnabled : 1;
        bool declarativeShadowRootsParserAPIsEnabled : 1;
        bool declarativeShadowRootsSerializerAPIsEnabled : 1;
        bool deprecateAESCFBWebCryptoEnabled : 1;
        bool deprecationReportingEnabled : 1;
        bool detailsNameAttributeEnabled : 1;
        bool developerExtrasEnabled : 1;
        bool devolvableWidgetsEnabled : 1;
        bool diagnosticLoggingEnabled : 1;
        bool digitalCredentialsEnabled : 1;
        bool directoryUploadEnabled : 1;
        bool disabledAdaptationsMetaTagEnabled : 1;
        bool disallowSyncXHRDuringPageDismissalEnabled : 1;
        bool dnsPrefetchingEnabled : 1;
        bool domPasteAccessRequestsEnabled : 1;
        bool domPasteAllowed : 1;
        bool domTestingAPIsEnabled : 1;
        bool domTimersThrottlingEnabled : 1;
        bool downloadAttributeEnabled : 1;
        bool dynamicSiteInterventionsEnabled : 1;
        bool elementCheckVisibilityEnabled : 1;
        bool embedElementEnabled : 1;
        bool enableInheritURIQueryComponent : 1;
        bool enterKeyHintEnabled : 1;
        bool eventHandlerDrivenSmoothKeyboardScrollingEnabled : 1;
        bool fetchPriorityEnabled : 1;
        bool fileReaderAPIEnabled : 1;
        bool fileSystemAccessEnabled : 1;
        bool fileSystemWritableStreamEnabled : 1;
        bool filterLinkDecorationByDefaultEnabled : 1;
        bool fixedBackgroundsPaintRelativeToDocument : 1;
        bool fixedElementsLayoutRelativeToFrame : 1;
        bool flexFormattingContextIntegrationEnabled : 1;
        bool fontFallbackPrefersPictographs : 1;
        bool forceCompositingMode : 1;
        bool forceFTPDirectoryListings : 1;
        bool forceWebGLUsesLowPower : 1;
        bool ftpEnabled : 1;
        bool fullscreenRequirementForScreenOrientationLockingEnabled : 1;
        bool geolocationAPIEnabled : 1;
        bool geolocationFloorLevelEnabled : 1;
        bool getCoalescedEventsEnabled : 1;
        bool getPredictedEventsEnabled : 1;
        bool googleAntiFlickerOptimizationQuirkEnabled : 1;
        bool hiddenPageCSSAnimationSuspensionEnabled : 1;
        bool hiddenPageDOMTimerThrottlingAutoIncreases : 1;
        bool hiddenPageDOMTimerThrottlingEnabled : 1;
        bool httpEquivEnabled : 1;
        bool httpsByDefault : 1;
        bool hyperlinkAuditingEnabled : 1;
        bool iPAddressAndLocalhostMixedContentUpgradeTestingEnabled : 1;
        bool iceCandidateFilteringEnabled : 1;
        bool ignoreIframeEmbeddingProtectionsEnabled : 1;
        bool imageSubsamplingEnabled : 1;
        bool imagesEnabled : 1;
        bool inWindowFullscreenEnabled : 1;
        bool incompleteImageBorderEnabled : 1;
        bool indexedDBAPIEnabled : 1;
        bool inlineMediaPlaybackRequiresPlaysInlineAttribute : 1;
        bool interactiveFormValidationEnabled : 1;
        bool invisibleAutoplayNotPermitted : 1;
        bool invokerAttributesEnabled : 1;
        bool isFirstPartyWebsiteDataRemovalDisabled : 1;
        bool isFirstPartyWebsiteDataRemovalLiveOnTestingEnabled : 1;
        bool isFirstPartyWebsiteDataRemovalReproTestingEnabled : 1;
        bool isPerActivityStateCPUUsageMeasurementEnabled : 1;
        bool isPostBackgroundingCPUUsageMeasurementEnabled : 1;
        bool isPostBackgroundingMemoryUsageMeasurementEnabled : 1;
        bool isPostLoadCPUUsageMeasurementEnabled : 1;
        bool isPostLoadMemoryUsageMeasurementEnabled : 1;
        bool isSameSiteStrictEnforcementEnabled : 1;
        bool isThirdPartyCookieBlockingDisabled : 1;
        bool itpDebugModeEnabled : 1;
        bool javaScriptCanAccessClipboard : 1;
        bool javaScriptCanOpenWindowsAutomatically : 1;
        bool langAttributeAwareFormControlUIEnabled : 1;
        bool largeImageAsyncDecodingEnabled : 1;
        bool layerBasedSVGEngineEnabled : 1;
        bool lazyIframeLoadingEnabled : 1;
        bool lazyImageLoadingEnabled : 1;
        bool legacyLineLayoutVisualCoverageEnabled : 1;
        bool legacyPluginQuirkForMailSignaturesEnabled : 1;
        bool linkModulePreloadEnabled : 1;
        bool linkPreconnectEarlyHintsEnabled : 1;
        bool linkPreconnectEnabled : 1;
        bool linkPrefetchEnabled : 1;
        bool linkPreloadEnabled : 1;
        bool linkPreloadResponsiveImagesEnabled : 1;
        bool linkSanitizerEnabled : 1;
        bool liveRangeSelectionEnabled : 1;
        bool loadDeferringEnabled : 1;
        bool loadsImagesAutomatically : 1;
        bool localFileContentSniffingEnabled : 1;
        bool localStorageEnabled : 1;
        bool lockdownFontParserEnabled : 1;
        bool loginStatusAPIEnabled : 1;
        bool loginStatusAPIRequiresWebAuthnEnabled : 1;
        bool logsPageMessagesToSystemConsoleEnabled : 1;
        bool mainContentUserGestureOverrideEnabled : 1;
        bool masonryEnabled : 1;
        bool mediaCapabilitiesEnabled : 1;
        bool mediaCapabilitiesExtensionsEnabled : 1;
        bool mediaControlsScaleWithPageZoom : 1;
        bool mediaDataLoadsAutomatically : 1;
        bool mediaPlaybackEnabled : 1;
        bool mediaPreloadingEnabled : 1;
        bool mediaSessionCaptureToggleAPIEnabled : 1;
        bool mediaSourceEnabled : 1;
        bool mediaUserGestureInheritsFromDocument : 1;
        bool mockScrollbarsControllerEnabled : 1;
        bool momentumScrollingAnimatorEnabled : 1;
        bool navigationAPIEnabled : 1;
        bool needsAdobeFrameReloadingQuirk : 1;
        bool needsDeferKeyDownAndKeyPressTimersUntilNextEditingCommandQuirk : 1;
        bool needsFrameNameFallbackToIdQuirk : 1;
        bool needsKeyboardEventDisambiguationQuirks : 1;
        bool needsSiteSpecificQuirks : 1;
        bool needsStorageAccessFromFileURLsQuirk : 1;
        bool observableEnabled : 1;
        bool opportunisticSweepingAndGarbageCollectionEnabled : 1;
        bool overlappingBackingStoreProvidersEnabled : 1;
        bool overscrollBehaviorEnabled : 1;
        bool pageAtRuleMarginDescriptorsEnabled : 1;
        bool passiveTouchListenersAsDefaultOnDocument : 1;
        bool passiveWheelListenersAsDefaultOnDocument : 1;
        bool passwordEchoEnabled : 1;
        bool permissionsAPIEnabled : 1;
        bool popoverAttributeEnabled : 1;
        bool preferMIMETypeForImages : 1;
        bool preferPageRenderingUpdatesNear60FPSEnabled : 1;
        bool preventKeyboardDOMEventDispatch : 1;
        bool privateClickMeasurementDebugModeEnabled : 1;
        bool privateClickMeasurementEnabled : 1;
        bool privateClickMeasurementFraudPreventionEnabled : 1;
        bool privateTokenUsageByThirdPartyEnabled : 1;
        bool punchOutWhiteBackgroundsInDarkMode : 1;
        bool pushAPIEnabled : 1;
        bool reportingEnabled : 1;
        bool requestIdleCallbackEnabled : 1;
        bool requestStorageAccessThrowsExceptionUntilReload : 1;
        bool requestVideoFrameCallbackEnabled : 1;
        bool requiresPageVisibilityToPlayAudio : 1;
        bool requiresUserGestureForAudioPlayback : 1;
        bool requiresUserGestureForVideoPlayback : 1;
        bool requiresUserGestureToLoadVideo : 1;
        bool resourceLoadSchedulingEnabled : 1;
        bool respondToThermalPressureAggressively : 1;
        bool sKAttributionEnabled : 1;
        bool scopedCustomElementRegistryEnabled : 1;
        bool screenOrientationAPIEnabled : 1;
        bool screenOrientationLockingAPIEnabled : 1;
        bool screenWakeLockAPIEnabled : 1;
        bool scriptEnabled : 1;
        bool scriptMarkupEnabled : 1;
        bool scriptTelemetryLoggingEnabled : 1;
        bool scrollAnimatorEnabled : 1;
        bool scrollDrivenAnimationsEnabled : 1;
        bool scrollToTextFragmentEnabled : 1;
        bool scrollToTextFragmentFeatureDetectionEnabled : 1;
        bool scrollToTextFragmentGenerationEnabled : 1;
        bool scrollToTextFragmentIndicatorEnabled : 1;
        bool scrollToTextFragmentMarkingEnabled : 1;
        bool scrollingCoordinatorEnabled : 1;
        bool scrollingPerformanceTestingEnabled : 1;
        bool scrollingTreeIncludesFrames : 1;
        bool secureContextChecksEnabled : 1;
        bool selectShowPickerEnabled : 1;
        bool selectTrailingWhitespaceEnabled : 1;
        bool selectionAPIForShadowDOMEnabled : 1;
        bool sendMouseEventsToDisabledFormControlsEnabled : 1;
        bool serviceWorkerNavigationPreloadEnabled : 1;
        bool serviceWorkersEnabled : 1;
        bool serviceWorkersUserGestureEnabled : 1;
        bool shapeDetection : 1;
        bool sharedWorkerEnabled : 1;
        bool shouldAllowUserInstalledFonts : 1;
        bool shouldConvertInvalidURLsToBlank : 1;
        bool shouldConvertPositionStyleOnCopy : 1;
        bool shouldDecidePolicyBeforeLoadingQuickLookPreview : 1;
        bool shouldDeferAsynchronousScriptsUntilAfterDocumentLoadOrFirstPaint : 1;
        bool shouldDispatchSyntheticMouseEventsWhenModifyingSelection : 1;
        bool shouldDispatchSyntheticMouseOutAfterSyntheticClick : 1;
        bool shouldDropNearSuspendedAssertionAfterDelay : 1;
        bool shouldIgnoreFontLoadCompletions : 1;
        bool shouldIgnoreMetaViewport : 1;
        bool shouldInjectUserScriptsInInitialEmptyDocument : 1;
        bool shouldPrintBackgrounds : 1;
        bool shouldRespectImageOrientation : 1;
        bool shouldRestrictBaseURLSchemes : 1;
        bool shouldSuppressTextInputFromEditingDuringProvisionalNavigation : 1;
        bool shouldTakeNearSuspendedAssertions : 1;
        bool shouldUseServiceWorkerShortTimeout : 1;
        bool showDebugBorders : 1;
        bool showMediaStatsContextMenuItemEnabled : 1;
        bool showModalDialogEnabled : 1;
        bool showRepaintCounter : 1;
        bool showTiledScrollingIndicator : 1;
        bool showsToolTipOverTruncatedText : 1;
        bool showsURLsInToolTips : 1;
        bool shrinksStandaloneImagesToFit : 1;
        bool sidewaysWritingModesEnabled : 1;
        bool siteIsolationEnabled : 1;
        bool smartInsertDeleteEnabled : 1;
        bool spatialNavigationEnabled : 1;
        bool speechRecognitionEnabled : 1;
        bool speechSynthesisAPIEnabled : 1;
        bool springTimingFunctionEnabled : 1;
        bool standalone : 1;
        bool storageAPIEnabled : 1;
        bool storageAPIEstimateEnabled : 1;
        bool storageAccessAPIPerPageScopeEnabled : 1;
        bool suppressesIncrementalRendering : 1;
        bool switchControlEnabled : 1;
        bool targetTextPseudoElementEnabled : 1;
        bool telephoneNumberParsingEnabled : 1;
        bool temporaryTileCohortRetentionEnabled : 1;
        bool textAreasAreResizable : 1;
        bool textInteractionEnabled : 1;
        bool thumbAndTrackPseudoElementsEnabled : 1;
        bool trackConfigurationEnabled : 1;
        bool treatIPAddressAsDomain : 1;
        bool treatsAnyTextCSSLinkAsStylesheet : 1;
        bool trustedTypesEnabled : 1;
        bool uAVisualTransitionDetectionEnabled : 1;
        bool undoManagerAPIEnabled : 1;
        bool unhandledPromiseRejectionToConsoleEnabled : 1;
        bool unifiedTextCheckerEnabled : 1;
        bool upgradeMixedContentEnabled : 1;
        bool urlPatternAPIEnabled : 1;
        bool useAnonymousModeWhenFetchingMaskImages : 1;
        bool useGiantTiles : 1;
        bool useIFCForSVGText : 1;
        bool useImageDocumentForSubframePDF : 1;
        bool usePreHTML5ParserQuirks : 1;
        bool userActivationAPIEnabled : 1;
        bool userGesturePromisePropagationEnabled : 1;
        bool usesBackForwardCache : 1;
        bool usesEncodingDetector : 1;
        bool verifyWindowOpenUserGestureFromUIProcess : 1;
        bool verticalFormControlsEnabled : 1;
        bool videoPresentationModeAPIEnabled : 1;
        bool viewTransitionClassesEnabled : 1;
        bool viewTransitionTypesEnabled : 1;
        bool viewTransitionsEnabled : 1;
        bool visualViewportAPIEnabled : 1;
        bool visualViewportEnabled : 1;
        bool wantsBalancedSetDefersLoadingBehavior : 1;
        bool webAPIStatisticsEnabled : 1;
        bool webAPIsInShadowRealmEnabled : 1;
        bool webAnimationsCustomEffectsEnabled : 1;
        bool webAnimationsCustomFrameRateEnabled : 1;
        bool webAnimationsOverallProgressPropertyEnabled : 1;
        bool webCryptoSafeCurvesEnabled : 1;
        bool webCryptoX25519Enabled : 1;
        bool webGLDraftExtensionsEnabled : 1;
        bool webGLEnabled : 1;
        bool webGLErrorsToConsoleEnabled : 1;
        bool webGLTimerQueriesEnabled : 1;
        bool webGPUEnabled : 1;
        bool webGPUHDREnabled : 1;
        bool webInspectorEngineeringSettingsAllowed : 1;
        bool webLocksAPIEnabled : 1;
        bool webRTCEncryptionEnabled : 1;
        bool webRTCMediaPipelineAdditionalLoggingEnabled : 1;
        bool webSecurityEnabled : 1;
        bool webShareEnabled : 1;
        bool webShareFileAPIEnabled : 1;
        bool webSocketEnabled : 1;
        bool webTransportEnabled : 1;
        bool webXRWebGPUBindingsEnabled : 1;
        bool webkitImageReadyEventEnabled : 1;
        bool wheelEventGesturesBecomeNonBlocking : 1;
        bool windowFocusRestricted : 1;
        bool wirelessPlaybackTargetAPIEnabled : 1;
#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
        bool imageAnimationControlEnabled : 1;
#endif
#if ENABLE(ALTERNATE_WEBM_PLAYER) && ENABLE(MEDIA_SOURCE)
        bool alternateWebMPlayerEnabled : 1;
#endif
#if ENABLE(APPLE_PAY)
        bool applePayCapabilityDisclosureAllowed : 1;
        bool applePayEnabled : 1;
#endif
#if ENABLE(APP_HIGHLIGHTS)
        bool appHighlightsEnabled : 1;
#endif
#if ENABLE(ATTACHMENT_ELEMENT)
        bool attachmentWideLayoutEnabled : 1;
#endif
#if ENABLE(CONTENT_CHANGE_OBSERVER)
        bool contentChangeObserverEnabled : 1;
#endif
#if ENABLE(CONTENT_EXTENSIONS)
        bool iFrameResourceMonitoringEnabled : 1;
#endif
#if ENABLE(CONTEXT_MENU_QR_CODE_DETECTION)
        bool contextMenuQRCodeDetectionEnabled : 1;
#endif
#if ENABLE(DATALIST_ELEMENT)
        bool dataListElementEnabled : 1;
#endif
#if ENABLE(DATA_DETECTION)
#endif
#if ENABLE(DATE_AND_TIME_INPUT_TYPES)
        bool dateTimeInputsEditableComponentsEnabled : 1;
#endif
#if ENABLE(DECLARATIVE_WEB_PUSH)
        bool declarativeWebPush : 1;
#endif
#if ENABLE(DEVICE_ORIENTATION)
        bool deviceOrientationEventEnabled : 1;
        bool deviceOrientationPermissionAPIEnabled : 1;
#endif
#if ENABLE(DOM_AUDIO_SESSION)
        bool domAudioSessionEnabled : 1;
        bool domAudioSessionFullEnabled : 1;
#endif
#if ENABLE(ENCRYPTED_MEDIA)
        bool encryptedMediaAPIEnabled : 1;
#endif
#if ENABLE(EXTENSION_CAPABILITIES)
        bool mediaCapabilityGrantsEnabled : 1;
#endif
#if ENABLE(FULLSCREEN_API)
        bool fullScreenEnabled : 1;
        bool fullScreenKeyboardLock : 1;
        bool videoFullscreenRequiresElementFullscreen : 1;
#endif
#if ENABLE(GAMEPAD)
        bool gamepadTriggerRumbleEnabled : 1;
        bool gamepadVibrationActuatorEnabled : 1;
        bool gamepadsEnabled : 1;
#endif
#if ENABLE(GPU_PROCESS)
        bool blockMediaLayerRehostingInWebContentProcess : 1;
#endif
#if ENABLE(GPU_PROCESS) && ENABLE(WEBGL)
        bool useGPUProcessForWebGLEnabled : 1;
#endif
#if ENABLE(IMAGE_ANALYSIS)
        bool imageAnalysisDuringFindInPageEnabled : 1;
        bool visualTranslationEnabled : 1;
#endif
#if ENABLE(IMAGE_ANALYSIS) && ENABLE(VIDEO)
        bool textRecognitionInVideosEnabled : 1;
#endif
#if ENABLE(IMAGE_ANALYSIS_ENHANCEMENTS)
        bool removeBackgroundEnabled : 1;
#endif
#if ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
        bool includeIgnoredInCoreAXTree : 1;
#endif
#if ENABLE(INPUT_TYPE_COLOR)
        bool inputTypeColorEnabled : 1;
        bool inputTypeColorEnhancementsEnabled : 1;
#endif
#if ENABLE(INPUT_TYPE_DATE)
        bool inputTypeDateEnabled : 1;
#endif
#if ENABLE(INPUT_TYPE_DATETIMELOCAL)
        bool inputTypeDateTimeLocalEnabled : 1;
#endif
#if ENABLE(INPUT_TYPE_MONTH)
        bool inputTypeMonthEnabled : 1;
#endif
#if ENABLE(INPUT_TYPE_TIME)
        bool inputTypeTimeEnabled : 1;
#endif
#if ENABLE(INPUT_TYPE_WEEK)
        bool inputTypeWeekEnabled : 1;
#endif
#if ENABLE(INTERACTION_REGIONS_IN_EVENT_REGION)
        bool interactionRegionsEnabled : 1;
#endif
#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
        bool legacyEncryptedMediaAPIEnabled : 1;
#endif
#if ENABLE(LINEAR_MEDIA_PLAYER)
        bool linearMediaPlayerEnabled : 1;
        bool spatialVideoEnabled : 1;
#endif
#if ENABLE(MATHML)
        bool mathMLEnabled : 1;
#endif
#if ENABLE(MEDIA_CONTROLS_CONTEXT_MENUS)
        bool mediaControlsContextMenusEnabled : 1;
#endif
#if ENABLE(MEDIA_RECORDER)
        bool mediaRecorderEnabled : 1;
#endif
#if ENABLE(MEDIA_RECORDER_WEBM)
        bool mediaRecorderEnabledWebM : 1;
#endif
#if ENABLE(MEDIA_SESSION)
        bool mediaSessionEnabled : 1;
#endif
#if ENABLE(MEDIA_SESSION_COORDINATOR)
        bool mediaSessionCoordinatorEnabled : 1;
#endif
#if ENABLE(MEDIA_SESSION_COORDINATOR) && ENABLE(MEDIA_SESSION_PLAYLIST)
        bool mediaSessionPlaylistEnabled : 1;
#endif
#if ENABLE(MEDIA_SOURCE)
        bool detachableMediaSourceEnabled : 1;
        bool managedMediaSourceEnabled : 1;
        bool sourceBufferChangeTypeEnabled : 1;
#endif
#if ENABLE(MEDIA_SOURCE) && ENABLE(WIRELESS_PLAYBACK_TARGET)
        bool managedMediaSourceNeedsAirPlay : 1;
#endif
#if ENABLE(MEDIA_SOURCE) && USE(AVFOUNDATION)
        bool mediaSourceCanFallbackToDecompressionSession : 1;
        bool mediaSourcePrefersDecompressionSession : 1;
#endif
#if ENABLE(MEDIA_SOURCE_IN_WORKERS)
        bool mediaSourceInWorkerEnabled : 1;
#endif
#if ENABLE(MEDIA_STREAM)
        bool exposeSpeakersEnabled : 1;
        bool exposeSpeakersWithoutMicrophoneEnabled : 1;
        bool getUserMediaRequiresFocus : 1;
        bool imageCaptureEnabled : 1;
        bool interruptAudioOnPageVisibilityChangeEnabled : 1;
        bool interruptVideoOnPageVisibilityChangeEnabled : 1;
        bool mediaCaptureRequiresSecureConnection : 1;
        bool mediaDevicesEnabled : 1;
        bool mediaStreamEnabled : 1;
        bool mediaStreamTrackProcessingEnabled : 1;
        bool mockCaptureDevicesEnabled : 1;
        bool muteCameraOnMicrophoneInterruptionEnabled : 1;
        bool perElementSpeakerSelectionEnabled : 1;
        bool screenCaptureEnabled : 1;
        bool speakerSelectionRequiresUserGesture : 1;
        bool useMicrophoneMuteStatusAPI : 1;
#endif
#if ENABLE(MEDIA_STREAM) && PLATFORM(IOS_FAMILY)
        bool manageCaptureStatusBarInGPUProcessEnabled : 1;
#endif
#if ENABLE(MODEL_ELEMENT)
        bool modelElementEnabled : 1;
#endif
#if ENABLE(MODEL_PROCESS)
        bool modelProcessEnabled : 1;
#endif
#if ENABLE(NOTIFICATIONS)
        bool notificationsEnabled : 1;
#endif
#if ENABLE(NOTIFICATION_EVENT)
        bool notificationEventEnabled : 1;
#endif
#if ENABLE(OFFSCREEN_CANVAS)
        bool offscreenCanvasEnabled : 1;
#endif
#if ENABLE(OFFSCREEN_CANVAS_IN_WORKERS)
        bool offscreenCanvasInWorkersEnabled : 1;
#endif
#if ENABLE(OVERFLOW_SCROLLING_TOUCH)
        bool legacyOverflowScrollingTouchEnabled : 1;
#endif
#if ENABLE(PAYMENT_REQUEST)
        bool paymentRequestEnabled : 1;
#endif
#if ENABLE(PDFJS)
        bool pdfJSViewerEnabled : 1;
#endif
#if ENABLE(PICTURE_IN_PICTURE_API)
        bool pictureInPictureAPIEnabled : 1;
#endif
#if ENABLE(POINTER_LOCK)
        bool pointerLockEnabled : 1;
        bool pointerLockOptionsEnabled : 1;
#endif
#if ENABLE(RESOURCE_USAGE)
        bool resourceUsageOverlayVisible : 1;
#endif
#if ENABLE(SCREEN_TIME)
        bool screenTimeEnabled : 1;
#endif
#if ENABLE(SERVICE_CONTROLS)
        bool imageControlsEnabled : 1;
        bool serviceControlsEnabled : 1;
#endif
#if ENABLE(SPATIAL_IMAGE_CONTROLS)
        bool spatialImageControlsEnabled : 1;
#endif
#if ENABLE(TEXT_AUTOSIZING)
        bool idempotentModeAutosizingOnlyHonorsPercentages : 1;
        bool shouldEnableTextAutosizingBoost : 1;
        bool textAutosizingEnabled : 1;
        bool textAutosizingEnabledAtLargeInitialScale : 1;
        bool textAutosizingUsesIdempotentMode : 1;
#endif
#if ENABLE(THREADED_ANIMATION_RESOLUTION)
        bool threadedAnimationResolutionEnabled : 1;
#endif
#if ENABLE(TOUCH_EVENTS)
        bool mouseEventsSimulationEnabled : 1;
        bool touchEventDOMAttributesEnabled : 1;
        bool touchEventEmulationEnabled : 1;
#endif
#if ENABLE(UNIFIED_PDF)
        bool unifiedPDFEnabled : 1;
#endif
#if ENABLE(VIDEO)
        bool audioDescriptionsEnabled : 1;
        bool extendedAudioDescriptionsEnabled : 1;
        bool genericCueAPIEnabled : 1;
        bool mediaEnabled : 1;
        bool preferSandboxedMediaParsing : 1;
        bool shouldDisplayCaptions : 1;
        bool shouldDisplaySubtitles : 1;
        bool shouldDisplayTextDescriptions : 1;
        bool videoQualityIncludesDisplayCompositingEnabled : 1;
#endif
#if ENABLE(VP9)
        bool vp9DecoderEnabled : 1;
#endif
#if ENABLE(WEBASSEMBLY)
        bool webAssemblyESMIntegrationEnabled : 1;
#endif
#if ENABLE(WEBGL)
        bool allowWebGLInWorkers : 1;
#endif
#if ENABLE(WEBXR)
        bool touchInputCompatibilityEnabled : 1;
        bool webXRAugmentedRealityModuleEnabled : 1;
        bool webXREnabled : 1;
        bool webXRGamepadsModuleEnabled : 1;
#endif
#if ENABLE(WEBXR_HANDS)
        bool webXRHandInputModuleEnabled : 1;
#endif
#if ENABLE(WEBXR_LAYERS)
        bool webXRLayersAPIEnabled : 1;
#endif
#if ENABLE(WEB_ARCHIVE)
        bool alwaysAllowLocalWebarchive : 1;
        bool loadWebArchiveWithEphemeralStorageEnabled : 1;
        bool webArchiveDebugModeEnabled : 1;
        bool webArchiveTestingModeEnabled : 1;
#endif
#if ENABLE(WEB_AUDIO)
        bool webAudioEnabled : 1;
#endif
#if ENABLE(WEB_AUTHN)
        bool webAuthenticationEnabled : 1;
#endif
#if ENABLE(WEB_CODECS)
        bool webCodecsAV1Enabled : 1;
        bool webCodecsAudioEnabled : 1;
        bool webCodecsHEVCEnabled : 1;
        bool webCodecsVideoEnabled : 1;
#endif
#if ENABLE(WEB_RTC)
        bool legacyWebRTCOfferOptionsEnabled : 1;
        bool peerConnectionEnabled : 1;
        bool peerConnectionVideoScalingAdaptationDisabled : 1;
        bool webRTCAV1CodecEnabled : 1;
        bool webRTCDTMFEnabled : 1;
        bool webRTCEncodedTransformEnabled : 1;
        bool webRTCH265CodecEnabled : 1;
        bool webRTCL4SEnabled : 1;
        bool webRTCPlatformCodecsInGPUProcessEnabled : 1;
        bool webRTCRemoteVideoFrameEnabled : 1;
        bool webRTCSFrameTransformEnabled : 1;
        bool webRTCSocketsProxyingEnabled : 1;
        bool webRTCVP9Profile0CodecEnabled : 1;
        bool webRTCVP9Profile2CodecEnabled : 1;
#endif
#if ENABLE(WIRELESS_PLAYBACK_TARGET)
        bool allowsAirPlayForMediaPlayback : 1;
        bool remotePlaybackEnabled : 1;
#endif
#if ENABLE(WK_WEB_EXTENSIONS_IN_WEBDRIVER)
        bool webExtensionWebDriverEnabled : 1;
#endif
#if ENABLE(WK_WEB_EXTENSIONS_SIDEBAR)
        bool webExtensionSidebarEnabled : 1;
#endif
#if ENABLE(WRITING_SUGGESTIONS)
        bool writingSuggestionsAttributeEnabled : 1;
#endif
#if ENABLE(WRITING_TOOLS)
        bool textAnimationsEnabled : 1;
#endif
#if HAVE(ALLOW_ONLY_PARTITIONED_COOKIES)
        bool optInPartitionedCookiesEnabled : 1;
#endif
#if HAVE(AVKIT_CONTENT_SOURCE)
        bool aVKitContentSourceEnabled : 1;
#endif
#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
        bool cssTransformStyleSeparatedEnabled : 1;
#endif
#if HAVE(CORE_MATERIAL)
        bool appleSystemVisualEffectsEnabled : 1;
#endif
#if HAVE(HDR_SUPPORT)
        bool hdrForImagesEnabled : 1;
#endif
#if HAVE(INCREMENTAL_PDF_APIS)
        bool incrementalPDFLoadingEnabled : 1;
#endif
#if HAVE(RUBBER_BANDING)
        bool rubberBandingForSubScrollableRegionsEnabled : 1;
#endif
#if HAVE(SC_CONTENT_SHARING_PICKER)
        bool requireUAGetDisplayMediaPrompt : 1;
        bool useSCContentSharingPicker : 1;
#endif
#if HAVE(WEB_AUTHN_AS_MODERN)
        bool webAuthenticationASEnabled : 1;
#endif
#if PLATFORM(COCOA)
        bool pdfPluginEnabled : 1;
        bool pdfPluginHUDEnabled : 1;
        bool writeRichTextDataWhenCopyingOrDragging : 1;
#endif
#if PLATFORM(IOS_FAMILY)
        bool allowViewportShrinkToFitContent : 1;
        bool alternateFormControlDesignEnabled : 1;
        bool alternateFullScreenControlDesignEnabled : 1;
        bool selectionHonorsOverflowScrolling : 1;
        bool useAsyncUIKitInteractions : 1;
        bool visuallyContiguousBidiTextSelectionEnabled : 1;
#endif
#if PLATFORM(MAC) && USE(RUNNINGBOARD)
        bool backgroundWebContentRunningBoardThrottlingEnabled : 1;
#endif
#if PLATFORM(VISION)
        bool fullscreenSceneAspectRatioLockingEnabled : 1;
        bool fullscreenSceneDimmingEnabled : 1;
#endif
#if PLATFORM(VISION) && ENABLE(MODEL_PROCESS)
        bool modelNoPortalAttributeEnabled : 1;
#endif
#if USE(CA) || USE(SKIA)
        bool canvasUsesAcceleratedDrawing : 1;
#endif
#if USE(COORDINATED_GRAPHICS)
        bool propagateDamagingInformation : 1;
        bool unifyDamagedRegions : 1;
#endif
#if USE(CORE_IMAGE)
        bool acceleratedFiltersEnabled : 1;
#endif
#if USE(GRAPHICS_CONTEXT_FILTERS)
        bool graphicsContextFiltersEnabled : 1;
#endif
#if USE(MODERN_AVCONTENTKEYSESSION)
        bool shouldUseModernAVContentKeySession : 1;
#endif
#if USE(SYSTEM_PREVIEW)
        bool systemPreviewEnabled : 1;
#endif
    };
    const Values& values() const { return m_values; }

private:
    WEBCORE_EXPORT explicit Settings(Page*);

    Values m_values;
};

}

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
