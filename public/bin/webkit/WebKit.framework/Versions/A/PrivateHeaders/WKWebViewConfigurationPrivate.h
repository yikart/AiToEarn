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

#import <WebKit/WKBase.h>
#import <WebKit/WKWebViewConfiguration.h>

#if TARGET_OS_IPHONE
typedef NS_ENUM(NSUInteger, _WKDragLiftDelay) {
    _WKDragLiftDelayShort = 0,
    _WKDragLiftDelayMedium,
    _WKDragLiftDelayLong
} WK_API_AVAILABLE(ios(11.0));

typedef NS_ENUM(NSUInteger, _WKAttributionOverrideTesting) {
    _WKAttributionOverrideTestingNoOverride = 0,
    _WKAttributionOverrideTestingAppInitiated,
    _WKAttributionOverrideTestingUserInitiated
} WK_API_AVAILABLE(ios(15.0));

@protocol _UIClickInteractionDriving;
#endif

typedef NS_ENUM(NSUInteger, _WKContentSecurityPolicyModeForExtension) {
    _WKContentSecurityPolicyModeForExtensionNone = 0,
    _WKContentSecurityPolicyModeForExtensionManifestV2,
    _WKContentSecurityPolicyModeForExtensionManifestV3
} WK_API_AVAILABLE(macos(13.0), ios(16.0));

@class WKWebView;
@class _WKApplicationManifest;
@class _WKVisitedLinkStore;
@class _WKWebExtensionController;

@interface WKWebViewConfiguration (WKPrivate)

@property (nonatomic, weak, setter=_setRelatedWebView:) WKWebView *_relatedWebView WK_API_DEPRECATED("Please migrate away from using _relatedWebView and talk to the WebKit team if there are difficulties doing so", macos(10.10, WK_MAC_TBA), ios(8.0, WK_IOS_TBA));
@property (nonatomic, weak, setter=_setWebViewToCloneSessionStorageFrom:) WKWebView *_webViewToCloneSessionStorageFrom;
@property (nonatomic, copy, setter=_setGroupIdentifier:) NSString *_groupIdentifier;

@property (nonatomic, strong, setter=_setVisitedLinkStore:) _WKVisitedLinkStore *_visitedLinkStore;

// Specifies the base URL that the web view must use for navigation. Navigation to URLs not matching this base URL will result in a navigation error.
// When not set, the web view allows navigation to any URL that isn't a web extension URL. This is needed to ensure proper configuration of the web view.
@property (nonatomic, strong, setter=_setRequiredWebExtensionBaseURL:) NSURL *_requiredWebExtensionBaseURL;

@property (nonatomic, strong, readonly) WKWebExtensionController *_strongWebExtensionController;
@property (nonatomic, weak, setter=_setWeakWebExtensionController:) WKWebExtensionController *_weakWebExtensionController;
@property (nonatomic, strong, setter=_setWebExtensionController:) _WKWebExtensionController *_webExtensionController;

@property (nonatomic, weak, setter=_setAlternateWebViewForNavigationGestures:) WKWebView *_alternateWebViewForNavigationGestures;

@property (nonatomic, setter=_setRespectsImageOrientation:) BOOL _respectsImageOrientation WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setPrintsBackgrounds:) BOOL _printsBackgrounds WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setIncrementalRenderingSuppressionTimeout:) NSTimeInterval _incrementalRenderingSuppressionTimeout WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setAllowsJavaScriptMarkup:) BOOL _allowsJavaScriptMarkup WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setConvertsPositionStyleOnCopy:) BOOL _convertsPositionStyleOnCopy WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setAllowsMetaRefresh:) BOOL _allowsMetaRefresh WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setAllowUniversalAccessFromFileURLs:) BOOL _allowUniversalAccessFromFileURLs WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setAllowTopNavigationToDataURLs:) BOOL _allowTopNavigationToDataURLs WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, setter=_setNeedsStorageAccessFromFileURLsQuirk:) BOOL _needsStorageAccessFromFileURLsQuirk WK_API_AVAILABLE(macos(10.12.4), ios(10.3));
@property (nonatomic, setter=_setMainContentUserGestureOverrideEnabled:) BOOL _mainContentUserGestureOverrideEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setInvisibleAutoplayNotPermitted:) BOOL _invisibleAutoplayNotPermitted WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setMediaDataLoadsAutomatically:) BOOL _mediaDataLoadsAutomatically WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setAttachmentElementEnabled:) BOOL _attachmentElementEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setAttachmentWideLayoutEnabled:) BOOL _attachmentWideLayoutEnabled WK_API_AVAILABLE(macos(14.0), ios(17.0));
@property (nonatomic, setter=_setAttachmentFileWrapperClass:) Class _attachmentFileWrapperClass WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, setter=_setInitialCapitalizationEnabled:) BOOL _initialCapitalizationEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setApplePayEnabled:) BOOL _applePayEnabled WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, setter=_setWaitsForPaintAfterViewDidMoveToWindow:) BOOL _waitsForPaintAfterViewDidMoveToWindow WK_API_AVAILABLE(macos(10.12.4), ios(10.3));
@property (nonatomic, setter=_setControlledByAutomation:, getter=_isControlledByAutomation) BOOL _controlledByAutomation WK_API_AVAILABLE(macos(10.12.4), ios(10.3));
@property (nonatomic, setter=_setApplicationManifest:) _WKApplicationManifest *_applicationManifest WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, setter=_setColorFilterEnabled:) BOOL _colorFilterEnabled WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic, setter=_setIncompleteImageBorderEnabled:) BOOL _incompleteImageBorderEnabled WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic, setter=_setDrawsBackground:) BOOL _drawsBackground WK_API_AVAILABLE(macos(10.14), ios(12.0));
@property (nonatomic, setter=_setShouldDeferAsynchronousScriptsUntilAfterDocumentLoad:) BOOL _shouldDeferAsynchronousScriptsUntilAfterDocumentLoad WK_API_AVAILABLE(macos(10.14), ios(12.0));

@property (nonatomic, readonly) WKWebsiteDataStore *_websiteDataStoreIfExists WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, copy, setter=_setCORSDisablingPatterns:) NSArray<NSString *> *_corsDisablingPatterns WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
@property (nonatomic, copy, setter=_setMaskedURLSchemes:) NSSet<NSString *> *_maskedURLSchemes WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, setter=_setDeferrableUserScriptsShouldWaitUntilNotification:) BOOL _deferrableUserScriptsShouldWaitUntilNotification WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, setter=_setCrossOriginAccessControlCheckEnabled:) BOOL _crossOriginAccessControlCheckEnabled WK_API_AVAILABLE(macos(11.0), ios(14.0));

@property (nonatomic, setter=_setLoadsFromNetwork:) BOOL _loadsFromNetwork WK_API_DEPRECATED_WITH_REPLACEMENT("_allowedNetworkHosts", macos(11.0, 12.0), ios(14.0, 15.0));
@property (nonatomic, copy, setter=_setAllowedNetworkHosts:) NSSet<NSString *> *_allowedNetworkHosts WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, setter=_setLoadsSubresources:) BOOL _loadsSubresources WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, setter=_setIgnoresAppBoundDomains:) BOOL _ignoresAppBoundDomains WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, setter=_setClientNavigationsRunAtForegroundPriority:) BOOL _clientNavigationsRunAtForegroundPriority WK_API_AVAILABLE(macos(13.5), ios(13.4));
@property (nonatomic, setter=_setPortsForUpgradingInsecureSchemeForTesting:) NSArray<NSNumber *> *_portsForUpgradingInsecureSchemeForTesting WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

#if TARGET_OS_IPHONE
@property (nonatomic, setter=_setAlwaysRunsAtForegroundPriority:) BOOL _alwaysRunsAtForegroundPriority WK_API_DEPRECATED_WITH_REPLACEMENT("_clientNavigationsRunAtForegroundPriority", ios(9.0, 14.0));
@property (nonatomic, setter=_setInlineMediaPlaybackRequiresPlaysInlineAttribute:) BOOL _inlineMediaPlaybackRequiresPlaysInlineAttribute WK_API_AVAILABLE(ios(10.0));
@property (nonatomic, setter=_setAllowsInlineMediaPlaybackAfterFullscreen:) BOOL _allowsInlineMediaPlaybackAfterFullscreen  WK_API_AVAILABLE(ios(10.0));
@property (nonatomic, setter=_setDragLiftDelay:) _WKDragLiftDelay _dragLiftDelay WK_API_AVAILABLE(ios(11.0));
@property (nonatomic, setter=_setLongPressActionsEnabled:) BOOL _longPressActionsEnabled WK_API_AVAILABLE(ios(12.0));
@property (nonatomic, setter=_setSystemPreviewEnabled:) BOOL _systemPreviewEnabled WK_API_AVAILABLE(ios(12.0));
@property (nonatomic, setter=_setShouldDecidePolicyBeforeLoadingQuickLookPreview:) BOOL _shouldDecidePolicyBeforeLoadingQuickLookPreview WK_API_AVAILABLE(ios(13.0));
@property (nonatomic, setter=_setCanShowWhileLocked:) BOOL _canShowWhileLocked WK_API_AVAILABLE(ios(13.0));
@property (nonatomic, setter=_setClickInteractionDriverForTesting:) id <_UIClickInteractionDriving> _clickInteractionDriverForTesting WK_API_AVAILABLE(ios(13.0));
@property (nonatomic, setter=_setAppInitiatedOverrideValueForTesting:) _WKAttributionOverrideTesting _appInitiatedOverrideValueForTesting WK_API_AVAILABLE(ios(15.0));
#else
@property (nonatomic, setter=_setShowsURLsInToolTips:) BOOL _showsURLsInToolTips WK_API_AVAILABLE(macos(10.12));
@property (nonatomic, setter=_setServiceControlsEnabled:) BOOL _serviceControlsEnabled WK_API_AVAILABLE(macos(10.12));
@property (nonatomic, setter=_setImageControlsEnabled:) BOOL _imageControlsEnabled WK_API_AVAILABLE(macos(13.0));
@property (nonatomic, setter=_setContextMenuQRCodeDetectionEnabled:) BOOL _contextMenuQRCodeDetectionEnabled WK_API_AVAILABLE(macos(14.0));
@property (nonatomic, readwrite, setter=_setRequiresUserActionForEditingControlsManager:) BOOL _requiresUserActionForEditingControlsManager WK_API_AVAILABLE(macos(10.12));
@property (nonatomic, readwrite, setter=_setCPULimit:) double _cpuLimit WK_API_AVAILABLE(macos(10.13.4));
@property (nonatomic, readwrite, setter=_setPageGroup:) WKPageGroupRef _pageGroup WK_API_DEPRECATED_WITH_REPLACEMENT("_groupIdentifier", macos(10.13.4, 14.2));
#endif

@property (nonatomic, setter=_setRequiresUserActionForAudioPlayback:) BOOL _requiresUserActionForAudioPlayback WK_API_DEPRECATED_WITH_REPLACEMENT("mediaTypesRequiringUserActionForPlayback", macos(10.12, 10.12), ios(10.0, 10.0));
@property (nonatomic, setter=_setRequiresUserActionForVideoPlayback:) BOOL _requiresUserActionForVideoPlayback WK_API_DEPRECATED_WITH_REPLACEMENT("mediaTypesRequiringUserActionForPlayback", macos(10.12, 10.12), ios(10.0, 10.0));

@property (nonatomic, setter=_setOverrideContentSecurityPolicy:) NSString *_overrideContentSecurityPolicy WK_API_AVAILABLE(macos(10.12.4), ios(10.3));
@property (nonatomic, setter=_setMediaContentTypesRequiringHardwareSupport:) NSString *_mediaContentTypesRequiringHardwareSupport WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, setter=_setLegacyEncryptedMediaAPIEnabled:) BOOL _legacyEncryptedMediaAPIEnabled WK_API_AVAILABLE(macos(10.13), ios(11.0));
@property (nonatomic, setter=_setAllowMediaContentTypesRequiringHardwareSupportAsFallback:) BOOL _allowMediaContentTypesRequiringHardwareSupportAsFallback WK_API_AVAILABLE(macos(10.13), ios(11.0));

@property (nonatomic, setter=_setMediaCaptureEnabled:) BOOL _mediaCaptureEnabled WK_API_AVAILABLE(macos(12.0), ios(15.0));

// The input of this SPI is an array of image UTI (Uniform Type Identifier).
@property (nonatomic, copy, setter=_setAdditionalSupportedImageTypes:) NSArray<NSString *> *_additionalSupportedImageTypes WK_API_AVAILABLE(macos(10.14.4), ios(12.2));

@property (nonatomic, setter=_setUndoManagerAPIEnabled:) BOOL _undoManagerAPIEnabled WK_API_AVAILABLE(macos(10.15), ios(13.0));
@property (nonatomic, setter=_setShouldRelaxThirdPartyCookieBlocking:) BOOL _shouldRelaxThirdPartyCookieBlocking WK_API_AVAILABLE(macos(11.0), ios(14.0));
@property (nonatomic, setter=_setProcessDisplayName:) NSString *_processDisplayName WK_API_AVAILABLE(macos(11.0), ios(14.0));

@property (nonatomic, setter=_setAppHighlightsEnabled:) BOOL _appHighlightsEnabled WK_API_AVAILABLE(macos(12.0), ios(15.0));

@property (nonatomic, setter=_setAllowTestOnlyIPC:) BOOL _allowTestOnlyIPC WK_API_AVAILABLE(macos(14.0), ios(17.0));

// Default value is YES on macOS and NO on iOS.
@property (nonatomic, setter=_setDelaysWebProcessLaunchUntilFirstLoad:) BOOL _delaysWebProcessLaunchUntilFirstLoad WK_API_AVAILABLE(macos(14.0), ios(17.0));

// The maximum Lab color difference allowed between two consecutive page top snapshots.
// Expects 0 (disables page top color sampling entirely) or any positive number.
@property (nonatomic, setter=_setSampledPageTopColorMaxDifference:) double _sampledPageTopColorMaxDifference WK_API_AVAILABLE(macos(12.0), ios(15.0));

// How far down the page the sampled page top color needs to extend in order to be considered valid.
// Expects 0 (the color doesn't need to continue into the page at all) or any positive number.
@property (nonatomic, setter=_setSampledPageTopColorMinHeight:) double _sampledPageTopColorMinHeight WK_API_AVAILABLE(macos(12.0), ios(15.0));

// Attributes network activity from this WKWebView to the app with this bundle.
@property (nonatomic, setter=_setAttributedBundleIdentifier:) NSString *_attributedBundleIdentifier;

@property (nonatomic, setter=_setContentSecurityPolicyModeForExtension:) _WKContentSecurityPolicyModeForExtension _contentSecurityPolicyModeForExtension WK_API_AVAILABLE(macos(13.0), ios(16.0));

@property (nonatomic, setter=_setMarkedTextInputEnabled:) BOOL _markedTextInputEnabled WK_API_AVAILABLE(macos(14.0), ios(17.0));

@property (nonatomic, setter=_setMultiRepresentationHEICInsertionEnabled:) BOOL _multiRepresentationHEICInsertionEnabled WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

@property (nonatomic, setter=_setScrollToTextFragmentIndicatorEnabled:) BOOL _scrollToTextFragmentIndicatorEnabled WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

@property (nonatomic, setter=_setScrollToTextFragmentMarkingEnabled:) BOOL _scrollToTextFragmentMarkingEnabled WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

#if defined(TARGET_OS_VISION) && TARGET_OS_VISION
@property (nonatomic, setter=_setGamepadAccessRequiresExplicitConsent:) BOOL _gamepadAccessRequiresExplicitConsent WK_API_AVAILABLE(visionos(2.0));
@property (nonatomic, setter=_setCSSTransformStyleSeparatedEnabled:) BOOL _cssTransformStyleSeparatedEnabled WK_API_AVAILABLE(visionos(WK_XROS_TBA));
#endif

@end

#if TARGET_OS_IPHONE

@interface WKWebViewConfiguration (WKPrivateDeprecated)

@property (nonatomic, setter=_setTextInteractionGesturesEnabled:) BOOL _textInteractionGesturesEnabled WK_API_DEPRECATED_WITH_REPLACEMENT("WKPreferences.textInteractionGesturesEnabled", ios(12.0, 15.0));

@end

#endif
