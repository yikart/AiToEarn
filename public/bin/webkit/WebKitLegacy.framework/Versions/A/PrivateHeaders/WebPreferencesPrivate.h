/*
 * Copyright (C) 2005-2023 Apple Inc. All rights reserved.
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

#import <WebKitLegacy/WebPreferences.h>

#import <Quartz/Quartz.h>

@class WebFeature;

typedef enum {
    WebKitEditableLinkDefaultBehavior,
    WebKitEditableLinkAlwaysLive,
    WebKitEditableLinkOnlyLiveWithShiftKey,
    WebKitEditableLinkLiveWhenNotFocused,
    WebKitEditableLinkNeverLive
} WebKitEditableLinkBehavior;

typedef enum {
    WebTextDirectionSubmenuNeverIncluded,
    WebTextDirectionSubmenuAutomaticallyIncluded,
    WebTextDirectionSubmenuAlwaysIncluded
} WebTextDirectionSubmenuInclusionBehavior;

typedef enum {
    WebAllowAllStorage = 0,
    WebBlockThirdPartyStorage,
    WebBlockAllStorage
} WebStorageBlockingPolicy;

typedef enum {
    WebKitJavaScriptRuntimeFlagsAllEnabled = 0
} WebKitJavaScriptRuntimeFlags;

typedef enum : unsigned {
    WebKitAudioSessionCategoryAmbientSound = 'ambi',
    WebKitAudioSessionCategorySoloAmbientSound = 'solo',
    WebKitAudioSessionCategoryMediaPlayback = 'medi',
    WebKitAudioSessionCategoryRecordAudio = 'reca',
    WebKitAudioSessionCategoryPlayAndRecord = 'plar',
    WebKitAudioSessionCategoryAudioProcessing = 'proc',
} WebKitAudioSessionCategory;

typedef enum {
    WebKitPitchCorrectionAlgorithmBestAllAround = 0,
    WebKitPitchCorrectionAlgorithmBestForMusic,
    WebKitPitchCorrectionAlgorithmBestForSpeech,
} WebKitPitchCorrectionAlgorithm;

extern NSString *WebPreferencesChangedNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString *WebPreferencesRemovedNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString *WebPreferencesChangedInternalNotification WEBKIT_DEPRECATED_MAC(10_3, 10_14);
extern NSString *WebPreferencesCacheModelChangedInternalNotification WEBKIT_DEPRECATED_MAC(10_5, 10_14);

@interface WebPreferences (WebPrivate)

- (void)_startBatchingUpdates;
- (void)_stopBatchingUpdates;
- (void)_batchUpdatePreferencesInBlock:(void (^)(WebPreferences *))block;

- (void)_resetForTesting;

- (void)_postPreferencesChangedNotification;
- (void)_postPreferencesChangedAPINotification;
+ (WebPreferences *)_getInstanceForIdentifier:(NSString *)identifier;
+ (void)_setInstance:(WebPreferences *)instance forIdentifier:(NSString *)identifier;
+ (void)_removeReferenceForIdentifier:(NSString *)identifier;
+ (CFStringEncoding)_systemCFStringEncoding;
+ (void)_setInitialDefaultTextEncodingToSystemEncoding;
+ (void)_setIBCreatorID:(NSString *)string;

+ (void)setWebKitLinkTimeVersion:(int)version;

// For WebView's use only.
- (void)willAddToWebView;
- (void)didRemoveFromWebView;

@property (nonatomic, getter=isDNSPrefetchingEnabled) BOOL DNSPrefetchingEnabled;
@property (nonatomic) BOOL developerExtrasEnabled;
@property (nonatomic) WebKitJavaScriptRuntimeFlags javaScriptRuntimeFlags;
@property (nonatomic) BOOL authorAndUserStylesEnabled;
@property (nonatomic) BOOL applicationChromeModeEnabled;
@property (nonatomic) BOOL usesEncodingDetector;
@property (nonatomic) BOOL shrinksStandaloneImagesToFit;
@property (nonatomic) BOOL automaticallyDetectsCacheModel;
@property (nonatomic, getter=domTimersThrottlingEnabled) BOOL DOMTimersThrottlingEnabled;
@property (nonatomic) BOOL webArchiveDebugModeEnabled;
@property (nonatomic) BOOL localFileContentSniffingEnabled;
@property (nonatomic) BOOL databasesEnabled;
@property (nonatomic) BOOL localStorageEnabled;
@property (nonatomic, getter=isWebSecurityEnabled) BOOL webSecurityEnabled;
@property (nonatomic) BOOL allowUniversalAccessFromFileURLs;
@property (nonatomic) BOOL allowFileAccessFromFileURLs;
@property (nonatomic) BOOL allowTopNavigationToDataURLs;
@property (nonatomic) BOOL needsStorageAccessFromFileURLsQuirk;
@property (nonatomic) BOOL zoomsTextOnly;
@property (nonatomic) BOOL javaScriptCanAccessClipboard;
@property (nonatomic) BOOL asyncFrameScrollingEnabled;
@property (nonatomic, getter=isSpatialNavigationEnabled) BOOL spatialNavigationEnabled;
@property (nonatomic) BOOL mediaDevicesEnabled;
@property (nonatomic) BOOL mediaStreamEnabled;
@property (nonatomic) BOOL peerConnectionEnabled;
@property (nonatomic) WebKitEditableLinkBehavior editableLinkBehavior;
@property (nonatomic) WebTextDirectionSubmenuInclusionBehavior textDirectionSubmenuInclusionBehavior;
// If site-specific spoofing is enabled, some pages that do inappropriate user-agent string checks will be
// passed a nonstandard user-agent string to get them to work correctly. This method might be removed in
// the future when there's no more need for it.
@property (nonatomic, setter=_setUseSiteSpecificSpoofing:) BOOL _useSiteSpecificSpoofing;
// WARNING: Allowing paste through the DOM API opens a security hole. We only use it for testing purposes.
@property (nonatomic, getter=isDOMPasteAllowed) BOOL DOMPasteAllowed;
@property (nonatomic, setter=_setFTPDirectoryTemplatePath:) NSString *_ftpDirectoryTemplatePath;
@property (nonatomic, setter=_setForceFTPDirectoryListings:) BOOL _forceFTPDirectoryListings;
@property (nonatomic, setter=_setLocalStorageDatabasePath:) NSString *_localStorageDatabasePath;
@property (nonatomic) BOOL acceleratedDrawingEnabled;
@property (nonatomic) BOOL resourceLoadStatisticsEnabled;
@property (nonatomic) BOOL canvasUsesAcceleratedDrawing;
@property (nonatomic) BOOL acceleratedCompositingEnabled;
@property (nonatomic) BOOL showDebugBorders;
@property (nonatomic) BOOL legacyLineLayoutVisualCoverageEnabled;
@property (nonatomic) BOOL showRepaintCounter;
@property (nonatomic) BOOL webAudioEnabled;
@property (nonatomic) BOOL webGLEnabled;
@property (nonatomic, getter=forceLowPowerGPUForWebGL) BOOL forceWebGLUsesLowPower;
@property (nonatomic) BOOL hyperlinkAuditingEnabled;
@property (nonatomic) BOOL mediaPlaybackRequiresUserGesture; // Deprecated. Use videoPlaybackRequiresUserGesture and audioPlaybackRequiresUserGesture instead.
@property (nonatomic) BOOL videoPlaybackRequiresUserGesture;
@property (nonatomic) BOOL audioPlaybackRequiresUserGesture;
@property (nonatomic) BOOL overrideUserGestureRequirementForMainContent;
@property (nonatomic) BOOL mediaPlaybackAllowsInline;
@property (nonatomic) BOOL inlineMediaPlaybackRequiresPlaysInlineAttribute;
@property (nonatomic) BOOL invisibleAutoplayNotPermitted;
@property (nonatomic) BOOL mediaControlsScaleWithPageZoom;
@property (nonatomic) BOOL allowsAlternateFullscreen;
@property (nonatomic) BOOL allowsPictureInPictureMediaPlayback;
@property (nonatomic) NSString *pictographFontFamily;
@property (nonatomic) BOOL pageCacheSupportsPlugins;
@property (nonatomic) BOOL mockScrollbarsEnabled; // This is a global setting.
@property (nonatomic, setter=_setTextAutosizingEnabled:) BOOL _textAutosizingEnabled;
@property (nonatomic, getter=isInheritURIQueryComponentEnabled) BOOL enableInheritURIQueryComponent;
@property (nonatomic) BOOL fullScreenEnabled;
@property (nonatomic) BOOL asynchronousSpellCheckingEnabled;
@property (nonatomic) BOOL usePreHTML5ParserQuirks;
@property (nonatomic, getter=isAVFoundationEnabled) BOOL AVFoundationEnabled;
@property (nonatomic, getter=isAVFoundationNSURLSessionEnabled) BOOL AVFoundationNSURLSessionEnabled;
@property (nonatomic) BOOL backspaceKeyNavigationEnabled;
@property (nonatomic) BOOL wantsBalancedSetDefersLoadingBehavior;
@property (nonatomic) BOOL shouldDisplaySubtitles;
@property (nonatomic) BOOL shouldDisplayCaptions;
@property (nonatomic) BOOL shouldDisplayTextDescriptions;
@property (nonatomic) BOOL notificationsEnabled;
@property (nonatomic) BOOL shouldRespectImageOrientation;
@property (nonatomic) NSTimeInterval incrementalRenderingSuppressionTimeoutInSeconds;
@property (nonatomic, readonly) NSTimeInterval _backForwardCacheExpirationInterval;
@property (nonatomic) BOOL diagnosticLoggingEnabled;
@property (nonatomic) WebStorageBlockingPolicy storageBlockingPolicy;
@property (nonatomic) BOOL plugInSnapshottingEnabled;
@property (nonatomic) BOOL hiddenPageDOMTimerThrottlingEnabled;
@property (nonatomic) BOOL hiddenPageCSSAnimationSuspensionEnabled;
@property (nonatomic) BOOL lowPowerVideoAudioBufferSizeEnabled;
@property (nonatomic) BOOL mediaSourceEnabled;
@property (nonatomic) BOOL shouldConvertPositionStyleOnCopy;
@property (nonatomic) BOOL imageControlsEnabled;
@property (nonatomic) BOOL serviceControlsEnabled;
@property (nonatomic) BOOL gamepadsEnabled;
@property (nonatomic) BOOL mediaPreloadingEnabled;
@property (nonatomic) NSString *mediaKeysStorageDirectory;
@property (nonatomic) BOOL metaRefreshEnabled;
@property (nonatomic, getter=httpEquivEnabled) BOOL HTTPEquivEnabled;
@property (nonatomic) BOOL mockCaptureDevicesEnabled;
@property (nonatomic) BOOL mockCaptureDevicesPromptEnabled;
@property (nonatomic) BOOL enumeratingAllNetworkInterfacesEnabled;
@property (nonatomic) BOOL iceCandidateFilteringEnabled;
@property (nonatomic) BOOL mediaCaptureRequiresSecureConnection;
@property (nonatomic) BOOL dataTransferItemsEnabled;
@property (nonatomic) BOOL customPasteboardDataEnabled;
@property (nonatomic) BOOL cacheAPIEnabled;
@property (nonatomic) BOOL downloadAttributeEnabled;
@property (nonatomic) BOOL directoryUploadEnabled;
@property (nonatomic) BOOL layoutFormattingContextIntegrationEnabled;
@property (nonatomic, getter=isInAppBrowserPrivacyEnabled) BOOL inAppBrowserPrivacyEnabled;
@property (nonatomic) BOOL webSQLEnabled;
@property (nonatomic) BOOL CSSOMViewScrollingAPIEnabled;
@property (nonatomic) BOOL largeImageAsyncDecodingEnabled;
@property (nonatomic) BOOL animatedImageAsyncDecodingEnabled;
@property (nonatomic) BOOL javaScriptMarkupEnabled;
@property (nonatomic) BOOL mediaDataLoadsAutomatically;
@property (nonatomic) BOOL attachmentElementEnabled;
@property (nonatomic) BOOL allowsInlineMediaPlaybackAfterFullscreen;
@property (nonatomic) BOOL linkPreloadEnabled;
@property (nonatomic) BOOL mediaUserGestureInheritsFromDocument;
@property (nonatomic) BOOL isSecureContextAttributeEnabled;
@property (nonatomic) BOOL legacyEncryptedMediaAPIEnabled;
@property (nonatomic) BOOL encryptedMediaAPIEnabled;
@property (nonatomic) BOOL pictureInPictureAPIEnabled;
@property (nonatomic) BOOL colorFilterEnabled;
@property (nonatomic) BOOL punchOutWhiteBackgroundsInDarkMode;
@property (nonatomic) BOOL allowMediaContentTypesRequiringHardwareSupportAsFallback;
@property (nonatomic) BOOL mediaCapabilitiesEnabled;
@property (nonatomic) BOOL sourceBufferChangeTypeEnabled;
@property (nonatomic) BOOL siteSpecificQuirksModeEnabled;
@property (nonatomic) NSString *mediaContentTypesRequiringHardwareSupport;
@property (nonatomic, retain) NSArray<NSString *> *additionalSupportedImageTypes; // additionalSupportedImageTypes is an array of image UTIs.

@property (nonatomic) BOOL respectStandardStyleKeyEquivalents;
@property (nonatomic) BOOL showsURLsInToolTips;
@property (nonatomic) BOOL showsToolTipOverTruncatedText;
@property (nonatomic) BOOL textAreasAreResizable;
@property (nonatomic) PDFDisplayMode PDFDisplayMode;
@property (nonatomic) float PDFScaleFactor; // zero means do AutoScale

@end

// For use by MiniBrowser and testing infrastructure only

@interface WebPreferences (WebPrivateExperimentalFeatures)
+ (NSArray<WebFeature *> *)_experimentalFeatures;
@end

@interface WebPreferences (WebPrivateInternalFeatures)
+ (NSArray<WebFeature *> *)_internalFeatures;
@end

@interface WebPreferences (WebPrivateFeatures)
- (BOOL)_isEnabledForFeature:(WebFeature *)feature;
- (void)_setEnabled:(BOOL)value forFeature:(WebFeature *)feature;
@end

@interface WebPreferences (WebPrivateTesting)
+ (void)_switchNetworkLoaderToNewTestingSession;
+ (void)_setCurrentNetworkLoaderSessionCookieAcceptPolicy:(NSHTTPCookieAcceptPolicy)cookieAcceptPolicy;
+ (void)_clearNetworkLoaderSession:(void (^)(void))completionHandler;

- (void)_setBoolPreferenceForTestingWithValue:(BOOL)value forKey:(NSString *)key;
- (void)_setUInt32PreferenceForTestingWithValue:(uint32_t)value forKey:(NSString *)key;
- (void)_setDoublePreferenceForTestingWithValue:(double)value forKey:(NSString *)key;
- (void)_setStringPreferenceForTestingWithValue:(NSString *)value forKey:(NSString *)key;
@end

// FIXME: If these are not used anywhere, we should remove them and only use WebFeature mechanism for the preference.
@interface WebPreferences (WebPrivatePreferencesConvertedToWebFeature)
@property (nonatomic) BOOL userGesturePromisePropagationEnabled;
@property (nonatomic) BOOL requestIdleCallbackEnabled;
@property (nonatomic) BOOL asyncClipboardAPIEnabled;
@property (nonatomic) BOOL visualViewportAPIEnabled;
@property (nonatomic) BOOL CSSOMViewSmoothScrollingEnabled;
@property (nonatomic) BOOL webAnimationsCompositeOperationsEnabled;
@property (nonatomic) BOOL webAnimationsMutableTimelinesEnabled;
@property (nonatomic) BOOL privateClickMeasurementEnabled;
@property (nonatomic) BOOL genericCueAPIEnabled;
@property (nonatomic) BOOL coreMathMLEnabled;
@property (nonatomic) BOOL linkPreloadResponsiveImagesEnabled;
@property (nonatomic) BOOL remotePlaybackEnabled;
@property (nonatomic) BOOL readableByteStreamAPIEnabled;
@property (nonatomic) BOOL mediaRecorderEnabled;
@property (nonatomic, setter=_setMediaRecorderEnabled:) BOOL _mediaRecorderEnabled;
@property (nonatomic) BOOL contactPickerAPIEnabled;
@property (nonatomic, setter=_setSpeechRecognitionEnabled:) BOOL _speechRecognitionEnabled;
@property (nonatomic, setter=_setPitchCorrectionAlgorithm:) WebKitPitchCorrectionAlgorithm _pitchCorrectionAlgorithm;
@end

@interface WebPreferences (WebPrivateDeprecated)

// The preferences in this category are deprecated and have no effect. They should
// be removed when it is considered safe to do so.

@property (nonatomic) BOOL constantPropertiesEnabled;
@property (nonatomic) BOOL maskWebGLStringsEnabled;
@property (nonatomic) BOOL CSSCustomPropertiesAndValuesEnabled;
@property (nonatomic) BOOL syntheticEditingCommandsEnabled;
@property (nonatomic) BOOL allowCrossOriginSubresourcesToAskForCredentials;
@property (nonatomic) BOOL aspectRatioOfImgFromWidthAndHeightEnabled;
@property (nonatomic) BOOL resizeObserverEnabled;
@property (nonatomic) BOOL subpixelCSSOMElementMetricsEnabled;
@property (nonatomic) BOOL userTimingEnabled;
@property (nonatomic) BOOL requestAnimationFrameEnabled;
@property (nonatomic) BOOL resourceTimingEnabled;
@property (nonatomic, getter=cssShadowPartsEnabled) BOOL CSSShadowPartsEnabled;
@property (nonatomic) BOOL isSecureContextAttributeEnabled;
@property (nonatomic) BOOL fetchAPIEnabled;
@property (nonatomic) BOOL fetchAPIKeepAliveEnabled;
@property (nonatomic) BOOL intersectionObserverEnabled;
@property (nonatomic) BOOL shadowDOMEnabled;
@property (nonatomic) BOOL customElementsEnabled;
@property (nonatomic) BOOL keygenElementEnabled;
@property (nonatomic, getter=isVideoPluginProxyEnabled) BOOL videoPluginProxyEnabled;
@property (nonatomic, getter=isHixie76WebSocketProtocolEnabled) BOOL hixie76WebSocketProtocolEnabled;
@property (nonatomic) BOOL accelerated2dCanvasEnabled;
@property (nonatomic) BOOL experimentalNotificationsEnabled;
@property (nonatomic) BOOL selectionAcrossShadowBoundariesEnabled;
@property (nonatomic, getter=isXSSAuditorEnabled) BOOL XSSAuditorEnabled;
@property (nonatomic) BOOL subpixelAntialiasedLayerTextEnabled;
@property (nonatomic) BOOL webGL2Enabled;
@property (nonatomic) BOOL loadsSiteIconsIgnoringImageLoadingPreference;
@property (nonatomic) BOOL displayListDrawingEnabled;
@property (nonatomic) BOOL transformStreamAPIEnabled;
@property (nonatomic) BOOL lineHeightUnitsEnabled;
@property (nonatomic) BOOL CSSIndividualTransformPropertiesEnabled;
@property (nonatomic) BOOL highlightAPIEnabled;
@property (nonatomic) BOOL serverTimingEnabled;
@property (nonatomic) BOOL offlineWebApplicationCacheEnabled;
@property (nonatomic) int64_t applicationCacheTotalQuota;
@property (nonatomic) int64_t applicationCacheDefaultOriginQuota;

- (void)setDiskImageCacheEnabled:(BOOL)enabled;

@end
