/*
 * Copyright (C) 2014-2024 Apple Inc. All rights reserved.
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

#import <WebKit/WKPreferences.h>
#import <WebKit/WKPreferencesRefPrivate.h>

typedef NS_ENUM(NSInteger, _WKStorageBlockingPolicy) {
    _WKStorageBlockingPolicyAllowAll,
    _WKStorageBlockingPolicyBlockThirdParty,
    _WKStorageBlockingPolicyBlockAll,
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

typedef NS_OPTIONS(NSUInteger, _WKDebugOverlayRegions) {
    _WKNonFastScrollableRegion = 1 << 0,
    _WKWheelEventHandlerRegion = 1 << 1,
    _WKTouchActionRegion = 1 << 2,
    _WKEditableElementRegion = 1 << 3,
    _WKInteractionRegion WK_API_AVAILABLE(macos(13.0), ios(16.0)) = 1 << 4,
    _WKSiteIsolationRegion WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0)) = 1 << 5,
} WK_API_AVAILABLE(macos(10.11), ios(9.0));

typedef NS_OPTIONS(NSUInteger, _WKJavaScriptRuntimeFlags) {
    _WKJavaScriptRuntimeFlagsAllEnabled = 0
} WK_API_AVAILABLE(macos(10.11), ios(9.0));

typedef NS_ENUM(NSInteger, _WKEditableLinkBehavior) {
    _WKEditableLinkBehaviorDefault,
    _WKEditableLinkBehaviorAlwaysLive,
    _WKEditableLinkBehaviorOnlyLiveWithShiftKey,
    _WKEditableLinkBehaviorLiveWhenNotFocused,
    _WKEditableLinkBehaviorNeverLive,
} WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

typedef NS_ENUM(NSInteger, _WKPitchCorrectionAlgorithm) {
    _WKPitchCorrectionAlgorithmBestAllAround,
    _WKPitchCorrectionAlgorithmBestForMusic,
    _WKPitchCorrectionAlgorithmBestForSpeech,
} WK_API_AVAILABLE(macos(12.0), ios(15.0));

@class _WKFeature;
@class _WKExperimentalFeature;
@class _WKInternalDebugFeature;

@interface WKPreferences () <NSCopying>
@end

@interface WKPreferences (WKPrivate)

// FIXME: This property should not have the verb "is" in it.
@property (nonatomic, setter=_setTelephoneNumberDetectionIsEnabled:) BOOL _telephoneNumberDetectionIsEnabled;
@property (nonatomic, setter=_setStorageBlockingPolicy:) _WKStorageBlockingPolicy _storageBlockingPolicy;

@property (nonatomic, setter=_setCompositingBordersVisible:) BOOL _compositingBordersVisible;
@property (nonatomic, setter=_setCompositingRepaintCountersVisible:) BOOL _compositingRepaintCountersVisible;
@property (nonatomic, setter=_setTiledScrollingIndicatorVisible:) BOOL _tiledScrollingIndicatorVisible;
@property (nonatomic, setter=_setResourceUsageOverlayVisible:) BOOL _resourceUsageOverlayVisible WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setVisibleDebugOverlayRegions:) _WKDebugOverlayRegions _visibleDebugOverlayRegions WK_API_AVAILABLE(macos(10.11), ios(9.0));
@property (nonatomic, setter=_setLegacyLineLayoutVisualCoverageEnabled:) BOOL _legacyLineLayoutVisualCoverageEnabled WK_API_AVAILABLE(macos(10.11), ios(9.0));
@property (nonatomic, setter=_setContentChangeObserverEnabled:) BOOL _contentChangeObserverEnabled WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic, setter=_setAcceleratedDrawingEnabled:) BOOL _acceleratedDrawingEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setLargeImageAsyncDecodingEnabled:) BOOL _largeImageAsyncDecodingEnabled WK_API_AVAILABLE(macos(10.12.4), ios(10.3));
@property (nonatomic, setter=_setNeedsInAppBrowserPrivacyQuirks:) BOOL _needsInAppBrowserPrivacyQuirks WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, setter=_setAnimatedImageAsyncDecodingEnabled:) BOOL _animatedImageAsyncDecodingEnabled WK_API_AVAILABLE(macos(10.12.4), ios(10.3));
@property (nonatomic, setter=_setTextAutosizingEnabled:) BOOL _textAutosizingEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));

@property (nonatomic, setter=_setDeveloperExtrasEnabled:) BOOL _developerExtrasEnabled WK_API_AVAILABLE(macos(10.11), ios(9.0));

@property (nonatomic, setter=_setLogsPageMessagesToSystemConsoleEnabled:) BOOL _logsPageMessagesToSystemConsoleEnabled WK_API_AVAILABLE(macos(10.11), ios(9.0));

@property (nonatomic, setter=_setHiddenPageDOMTimerThrottlingEnabled:) BOOL _hiddenPageDOMTimerThrottlingEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setHiddenPageDOMTimerThrottlingAutoIncreases:) BOOL _hiddenPageDOMTimerThrottlingAutoIncreases WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setPageVisibilityBasedProcessSuppressionEnabled:) BOOL _pageVisibilityBasedProcessSuppressionEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));

@property (nonatomic, setter=_setAllowFileAccessFromFileURLs:) BOOL _allowFileAccessFromFileURLs WK_API_AVAILABLE(macos(10.11), ios(9.0));
@property (nonatomic, setter=_setJavaScriptRuntimeFlags:) _WKJavaScriptRuntimeFlags _javaScriptRuntimeFlags WK_API_AVAILABLE(macos(10.11), ios(9.0));

@property (nonatomic, setter=_setStandalone:, getter=_isStandalone) BOOL _standalone WK_API_AVAILABLE(macos(10.11), ios(9.0));

@property (nonatomic, setter=_setDiagnosticLoggingEnabled:) BOOL _diagnosticLoggingEnabled WK_API_AVAILABLE(macos(10.11), ios(9.0));

@property (nonatomic, setter=_setDefaultFontSize:) NSUInteger _defaultFontSize WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setDefaultFixedPitchFontSize:) NSUInteger _defaultFixedPitchFontSize WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, copy, setter=_setFixedPitchFontFamily:) NSString *_fixedPitchFontFamily WK_API_AVAILABLE(macos(10.12), ios(10.0));

@property (nonatomic, setter=_setFullScreenEnabled:) BOOL _fullScreenEnabled WK_API_DEPRECATED_WITH_REPLACEMENT("elementFullscreenEnabled", macos(10.11, 12.3), ios(9.0, 15.4));
@property (nonatomic, setter=_setShouldSuppressKeyboardInputDuringProvisionalNavigation:) BOOL _shouldSuppressKeyboardInputDuringProvisionalNavigation WK_API_AVAILABLE(macos(10.12.4), ios(10.3));
@property (nonatomic, setter=_setAllowsPictureInPictureMediaPlayback:) BOOL _allowsPictureInPictureMediaPlayback WK_API_AVAILABLE(macos(10.13), ios(11.0));

@property (nonatomic, setter=_setApplePayCapabilityDisclosureAllowed:) BOOL _applePayCapabilityDisclosureAllowed WK_API_AVAILABLE(macos(10.12), ios(10.0));

@property (nonatomic, setter=_setLoadsImagesAutomatically:) BOOL _loadsImagesAutomatically WK_API_AVAILABLE(macos(10.13), ios(11.0));

@property (nonatomic, setter=_setPeerConnectionEnabled:) BOOL _peerConnectionEnabled WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, setter=_setMediaDevicesEnabled:) BOOL _mediaDevicesEnabled WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, setter=_setGetUserMediaRequiresFocus:) BOOL _getUserMediaRequiresFocus WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, setter=_setScreenCaptureEnabled:) BOOL _screenCaptureEnabled WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, setter=_setMockCaptureDevicesEnabled:) BOOL _mockCaptureDevicesEnabled WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, setter=_setMockCaptureDevicesPromptEnabled:) BOOL _mockCaptureDevicesPromptEnabled WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, setter=_setMediaCaptureRequiresSecureConnection:) BOOL _mediaCaptureRequiresSecureConnection WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, setter=_setAlternateWebMPlayerEnabled:) BOOL _alternateWebMPlayerEnabled WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA));
@property (nonatomic, setter=_setEnumeratingAllNetworkInterfacesEnabled:) BOOL _enumeratingAllNetworkInterfacesEnabled WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, setter=_setICECandidateFilteringEnabled:) BOOL _iceCandidateFilteringEnabled WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, setter=_setInactiveMediaCaptureStreamRepromptIntervalInMinutes:) double _inactiveMediaCaptureStreamRepromptIntervalInMinutes WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, setter=_setInterruptAudioOnPageVisibilityChangeEnabled:) BOOL _interruptAudioOnPageVisibilityChangeEnabled WK_API_AVAILABLE(macos(10.15), ios(13.0));

@property (nonatomic, setter=_setJavaScriptCanAccessClipboard:) BOOL _javaScriptCanAccessClipboard WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, setter=_setDOMPasteAllowed:) BOOL _domPasteAllowed WK_API_AVAILABLE(macos(10.13), ios(11.0));

@property (nonatomic, setter=_setShouldAllowUserInstalledFonts:) BOOL _shouldAllowUserInstalledFonts WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

@property (nonatomic, setter=_setEditableLinkBehavior:) _WKEditableLinkBehavior _editableLinkBehavior WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

@property (nonatomic, setter=_setAVFoundationEnabled:) BOOL _avFoundationEnabled WK_API_AVAILABLE(macos(10.10), ios(12.0));

@property (nonatomic, setter=_setTextExtractionEnabled:) BOOL _textExtractionEnabled WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

+ (NSArray<_WKFeature *> *)_features WK_API_AVAILABLE(macos(13.3), ios(16.4));
- (BOOL)_isEnabledForFeature:(_WKFeature *)feature WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_setEnabled:(BOOL)value forFeature:(_WKFeature *)feature WK_API_AVAILABLE(macos(10.12), ios(10.0));

+ (NSArray<_WKInternalDebugFeature *> *)_internalDebugFeatures WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (BOOL)_isEnabledForInternalDebugFeature:(_WKInternalDebugFeature *)feature WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
- (void)_setEnabled:(BOOL)value forInternalDebugFeature:(_WKInternalDebugFeature *)feature WK_API_AVAILABLE(macos(10.14.4), ios(12.2));

+ (NSArray<_WKExperimentalFeature *> *)_experimentalFeatures WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (BOOL)_isEnabledForExperimentalFeature:(_WKExperimentalFeature *)feature WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_setEnabled:(BOOL)value forExperimentalFeature:(_WKExperimentalFeature *)feature WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_disableRichJavaScriptFeatures;

@property (nonatomic, setter=_setShouldEnableTextAutosizingBoost:) BOOL _shouldEnableTextAutosizingBoost WK_API_AVAILABLE(macos(10.14), ios(12.0));

@property (nonatomic, getter=_isSafeBrowsingEnabled, setter=_setSafeBrowsingEnabled:) BOOL _safeBrowsingEnabled WK_API_AVAILABLE(macos(10.14.4), ios(12.2));

@property (nonatomic, setter=_setColorFilterEnabled:) BOOL _colorFilterEnabled WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic, setter=_setPunchOutWhiteBackgroundsInDarkMode:) BOOL _punchOutWhiteBackgroundsInDarkMode WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic, setter=_setLowPowerVideoAudioBufferSizeEnabled:) BOOL _lowPowerVideoAudioBufferSizeEnabled WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, setter=_setShouldIgnoreMetaViewport:) BOOL _shouldIgnoreMetaViewport WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, setter=_setVideoQualityIncludesDisplayCompositingEnabled:) BOOL _videoQualityIncludesDisplayCompositingEnabled WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, setter=_setDeviceOrientationEventEnabled:) BOOL _deviceOrientationEventEnabled WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, setter=_setNeedsSiteSpecificQuirks:) BOOL _needsSiteSpecificQuirks WK_API_DEPRECATED_WITH_REPLACEMENT("siteSpecificQuirksModeEnabled", macos(10.13.4, 13.0), ios(13.0, 16.0));
@property (nonatomic, setter=_setItpDebugModeEnabled:) BOOL _itpDebugModeEnabled WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic, setter=_setMediaSourceEnabled:) BOOL _mediaSourceEnabled WK_API_AVAILABLE(macos(10.13.4), ios(13.0));
@property (nonatomic, setter=_setSecureContextChecksEnabled:) BOOL _secureContextChecksEnabled WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, setter=_setRemotePlaybackEnabled:) BOOL _remotePlaybackEnabled WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, setter=_setWebAudioEnabled:) BOOL _webAudioEnabled WK_API_AVAILABLE(macos(10.14), ios(13.4));
@property (nonatomic, setter=_setAcceleratedCompositingEnabled:) BOOL _acceleratedCompositingEnabled WK_API_AVAILABLE(macos(10.13.4), ios(13.4));
@property (nonatomic, setter=_setServiceWorkerEntitlementDisabledForTesting:) BOOL _serviceWorkerEntitlementDisabledForTesting WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, setter=_setAccessibilityIsolatedTreeEnabled:) BOOL _accessibilityIsolatedTreeEnabled WK_API_AVAILABLE(macos(10.16));
@property (nonatomic, setter=_setSpeechRecognitionEnabled:) BOOL _speechRecognitionEnabled WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, setter=_setPrivateClickMeasurementEnabled:) BOOL _privateClickMeasurementEnabled WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, setter=_setPrivateClickMeasurementDebugModeEnabled:) BOOL _privateClickMeasurementDebugModeEnabled WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, setter=_setPitchCorrectionAlgorithm:) _WKPitchCorrectionAlgorithm _pitchCorrectionAlgorithm WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, setter=_setMediaSessionEnabled:) BOOL _mediaSessionEnabled WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, getter=_isExtensibleSSOEnabled, setter=_setExtensibleSSOEnabled:) BOOL _extensibleSSOEnabled WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, setter=_setRequiresPageVisibilityToPlayAudio:) BOOL _requiresPageVisibilityToPlayAudio WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, setter=_setFileSystemAccessEnabled:) BOOL _fileSystemAccessEnabled WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, setter=_setStorageAPIEnabled:) BOOL _storageAPIEnabled WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, setter=_setAccessHandleEnabled:) BOOL _accessHandleEnabled WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, setter=_setNotificationsEnabled:) BOOL _notificationsEnabled WK_API_AVAILABLE(macos(10.13.4), ios(16.0));
@property (nonatomic, setter=_setNotificationEventEnabled:) BOOL _notificationEventEnabled WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, setter=_setPushAPIEnabled:) BOOL _pushAPIEnabled WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, setter=_setModelDocumentEnabled:) BOOL _modelDocumentEnabled WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, setter=_setInteractionRegionMinimumCornerRadius:) double _interactionRegionMinimumCornerRadius WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, setter=_setInteractionRegionInlinePadding:) double _interactionRegionInlinePadding WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, setter=_setRequiresFullscreenToLockScreenOrientation:) BOOL _requiresFullscreenToLockScreenOrientation WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, setter=_setMediaPreferredFullscreenWidth:) double _mediaPreferredFullscreenWidth WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, setter=_setAppBadgeEnabled:) BOOL _appBadgeEnabled WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, setter=_setClientBadgeEnabled:) BOOL _clientBadgeEnabled WK_API_AVAILABLE(macos(13.3), ios(16.4));
@property (nonatomic, setter=_setVerifyWindowOpenUserGestureFromUIProcess:) BOOL _verifyWindowOpenUserGestureFromUIProcess WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, setter=_setManagedMediaSourceEnabled:) BOOL _managedMediaSourceEnabled  WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, setter=_setManagedMediaSourceLowThreshold:) double _managedMediaSourceLowThreshold WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, setter=_setManagedMediaSourceHighThreshold:) double _managedMediaSourceHighThreshold WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, setter=_setMediaCapabilityGrantsEnabled:) BOOL _mediaCapabilityGrantsEnabled WK_API_AVAILABLE(ios(17.4), visionos(1.1)) WK_API_UNAVAILABLE(macos);
@property (nonatomic, setter=_setAllowPrivacySensitiveOperationsInNonPersistentDataStores:) BOOL _allowPrivacySensitiveOperationsInNonPersistentDataStores WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));
@property (nonatomic, setter=_setVideoFullscreenRequiresElementFullscreen:) BOOL _videoFullscreenRequiresElementFullscreen WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));
@property (nonatomic, setter=_setCSSTransformStyleSeparatedEnabled:) BOOL _cssTransformStyleSeparatedEnabled WK_API_AVAILABLE(visionos(WK_XROS_TBA));
@property (nonatomic, setter=_setOverlayRegionsEnabled:) BOOL _overlayRegionsEnabled WK_API_AVAILABLE(visionos(WK_XROS_TBA));
@property (nonatomic, setter=_setSpatialVideoEnabled:) BOOL _spatialVideoEnabled WK_API_AVAILABLE(visionos(WK_XROS_TBA));
@property (nonatomic, setter=_setModelElementEnabled:) BOOL _modelElementEnabled WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));
@property (nonatomic, setter=_setModelProcessEnabled:) BOOL _modelProcessEnabled WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));
@property (nonatomic, setter=_setModelNoPortalAttributeEnabled:) BOOL _modelNoPortalAttributeEnabled WK_API_AVAILABLE(visionos(WK_XROS_TBA));

#if !TARGET_OS_IPHONE
@property (nonatomic, setter=_setWebGLEnabled:) BOOL _webGLEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setCanvasUsesAcceleratedDrawing:) BOOL _canvasUsesAcceleratedDrawing WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setDefaultTextEncodingName:) NSString *_defaultTextEncodingName WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setAuthorAndUserStylesEnabled:) BOOL _authorAndUserStylesEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setDOMTimersThrottlingEnabled:) BOOL _domTimersThrottlingEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setWebArchiveDebugModeEnabled:) BOOL _webArchiveDebugModeEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setLocalFileContentSniffingEnabled:) BOOL _localFileContentSniffingEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setUsesPageCache:) BOOL _usesPageCache WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setShouldPrintBackgrounds:) BOOL _shouldPrintBackgrounds WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setWebSecurityEnabled:) BOOL _webSecurityEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setUniversalAccessFromFileURLsAllowed:) BOOL _universalAccessFromFileURLsAllowed WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setTopNavigationToDataURLsAllowed:) BOOL _topNavigationToDataURLsAllowed WK_API_AVAILABLE(macos(11.0));
@property (nonatomic, setter=_setSuppressesIncrementalRendering:) BOOL _suppressesIncrementalRendering WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setCookieEnabled:) BOOL _cookieEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setViewGestureDebuggingEnabled:) BOOL _viewGestureDebuggingEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setStandardFontFamily:) NSString *_standardFontFamily WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setBackspaceKeyNavigationEnabled:) BOOL _backspaceKeyNavigationEnabled WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, setter=_setAllowsInlineMediaPlayback:) BOOL _allowsInlineMediaPlayback WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setApplePayEnabled:) BOOL _applePayEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setDNSPrefetchingEnabled:) BOOL _dnsPrefetchingEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setInlineMediaPlaybackRequiresPlaysInlineAttribute:) BOOL _inlineMediaPlaybackRequiresPlaysInlineAttribute WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setInvisibleMediaAutoplayNotPermitted:) BOOL _invisibleMediaAutoplayNotPermitted WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setLegacyEncryptedMediaAPIEnabled:) BOOL _legacyEncryptedMediaAPIEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setMainContentUserGestureOverrideEnabled:) BOOL _mainContentUserGestureOverrideEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setMediaStreamEnabled:) BOOL _mediaStreamEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setNeedsStorageAccessFromFileURLsQuirk:) BOOL _needsStorageAccessFromFileURLsQuirk WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setPDFPluginEnabled:) BOOL _pdfPluginEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setRequiresUserGestureForAudioPlayback:) BOOL _requiresUserGestureForAudioPlayback WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setRequiresUserGestureForVideoPlayback:) BOOL _requiresUserGestureForVideoPlayback WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setServiceControlsEnabled:) BOOL _serviceControlsEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setShowsToolTipOverTruncatedText:) BOOL _showsToolTipOverTruncatedText WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setTextAreasAreResizable:) BOOL _textAreasAreResizable WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setUseGiantTiles:) BOOL _useGiantTiles WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setWantsBalancedSetDefersLoadingBehavior:) BOOL _wantsBalancedSetDefersLoadingBehavior WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setAggressiveTileRetentionEnabled:) BOOL _aggressiveTileRetentionEnabled WK_API_AVAILABLE(macos(10.14));
@property (nonatomic, setter=_setAppNapEnabled:) BOOL _appNapEnabled WK_API_AVAILABLE(macos(10.15));
#endif

@end

@interface WKPreferences (WKPrivateDeprecated)

@property (nonatomic, setter=_setShouldAllowDesignSystemUIFonts:) BOOL _shouldAllowDesignSystemUIFonts WK_API_DEPRECATED("Design system UI fonts are always enabled", macos(10.15, 15.0), ios(13.0, 18.0), visionos(1.0, 2.0));
@property (nonatomic, setter=_setRequestAnimationFrameEnabled:) BOOL _requestAnimationFrameEnabled WK_API_DEPRECATED("requestAnimationFrame is always enabled", macos(10.15.4, 13.0), ios(13.4, 16.0));
@property (nonatomic, setter=_setSubpixelAntialiasedLayerTextEnabled:) BOOL _subpixelAntialiasedLayerTextEnabled WK_API_DEPRECATED("Subpixel antialiased text is no longer supported", macos(10.12, 13.3), ios(10.0, 16.4));
#if !TARGET_OS_IPHONE
@property (nonatomic, setter=_setPageCacheSupportsPlugins:) BOOL _pageCacheSupportsPlugins WK_API_DEPRECATED("NPAPI plugins are no longer supported", macos(10.13.4, 15.0));
@property (nonatomic, setter=_setAsynchronousPluginInitializationEnabled:) BOOL _asynchronousPluginInitializationEnabled WK_API_DEPRECATED("NPAPI plugins are no longer supported", macos(10.13.4, 15.0));
@property (nonatomic, setter=_setArtificialPluginInitializationDelayEnabled:) BOOL _artificialPluginInitializationDelayEnabled WK_API_DEPRECATED("NPAPI plugins are no longer supported", macos(10.13.4, 15.0));
@property (nonatomic, setter=_setExperimentalPlugInSandboxProfilesEnabled:) BOOL _experimentalPlugInSandboxProfilesEnabled WK_API_DEPRECATED("NPAPI plugins are no longer supported", macos(10.14.4, 15.0));
@property (nonatomic, setter=_setPlugInSnapshottingEnabled:) BOOL _plugInSnapshottingEnabled WK_API_DEPRECATED("NPAPI plugins are no longer supported", macos(10.13.4, 15.0));
@property (nonatomic, setter=_setSubpixelCSSOMElementMetricsEnabled:) BOOL _subpixelCSSOMElementMetricsEnabled WK_API_DEPRECATED("Subpixel CSSOM element metrics are no longer supported", macos(10.13.4, 10.15));
#endif
@property (nonatomic, setter=_setDisplayListDrawingEnabled:) BOOL _displayListDrawingEnabled WK_API_DEPRECATED("Display list drawing is no longer supported", macos(10.12, 14.4), ios(10.0, 17.4), visionos(1.0, 1.1));
// FIXME: We should remove this property.
@property (nonatomic, setter=_setOfflineApplicationCacheIsEnabled:) BOOL _offlineApplicationCacheIsEnabled;


@end
