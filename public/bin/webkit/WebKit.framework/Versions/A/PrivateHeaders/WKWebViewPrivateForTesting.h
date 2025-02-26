/*
 * Copyright (C) 2019-2022 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE
#import <WebKit/WKWebViewPrivateForTestingIOS.h>
#else
#import <WebKit/WKWebViewPrivateForTestingMac.h>
#endif

NS_ASSUME_NONNULL_BEGIN

typedef enum {
    WKWebViewAudioRoutingArbitrationStatusNone,
    WKWebViewAudioRoutingArbitrationStatusPending,
    WKWebViewAudioRoutingArbitrationStatusActive,
} WKWebViewAudioRoutingArbitrationStatus;

struct WKAppPrivacyReportTestingData {
    BOOL hasLoadedAppInitiatedRequestTesting;
    BOOL hasLoadedNonAppInitiatedRequestTesting;
    BOOL didPerformSoftUpdate;
};

@class _WKNowPlayingMetadata;
@protocol _WKMediaSessionCoordinator;

@interface WKWebView (WKTesting)

@property (nonatomic, readonly) NSString *_caLayerTreeAsText;

- (NSString*)_scrollbarStateForScrollingNodeID:(uint64_t)scrollingNodeID processID:(uint64_t)processID isVertical:(bool)isVertical;

- (void)_addEventAttributionWithSourceID:(uint8_t)sourceID destinationURL:(NSURL *)destination sourceDescription:(NSString *)sourceDescription purchaser:(NSString *)purchaser reportEndpoint:(NSURL *)reportEndpoint optionalNonce:(nullable NSString *)nonce applicationBundleID:(NSString *)bundleID ephemeral:(BOOL)ephemeral WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_setPageScale:(CGFloat)scale withOrigin:(CGPoint)origin;
- (CGFloat)_pageScale;

- (void)_setContinuousSpellCheckingEnabledForTesting:(BOOL)enabled;
- (void)_setGrammarCheckingEnabledForTesting:(BOOL)enabled;
- (NSDictionary *)_contentsOfUserInterfaceItem:(NSString *)userInterfaceItem;

- (void)_requestActiveNowPlayingSessionInfo:(void(^)(BOOL, BOOL, NSString*, double, double, NSInteger))callback;
- (void)_setNowPlayingMetadataObserver:(void(^)(_WKNowPlayingMetadata *))observer;

- (void)_doAfterNextPresentationUpdateWithoutWaitingForAnimatedResizeForTesting:(void (^)(void))updateBlock;

- (void)_disableBackForwardSnapshotVolatilityForTesting;

- (void)_denyNextUserMediaRequest;
@property (nonatomic, setter=_setMediaCaptureReportingDelayForTesting:) double _mediaCaptureReportingDelayForTesting WK_API_AVAILABLE(macos(12.0), ios(15.0));
@property (nonatomic, readonly) BOOL _wirelessVideoPlaybackDisabled;

- (void)_setIndexOfGetDisplayMediaDeviceSelectedForTesting:(nullable NSNumber *)index;
- (void)_setSystemCanPromptForGetDisplayMediaForTesting:(BOOL)canPrompt;

- (BOOL)_beginBackSwipeForTesting;
- (BOOL)_completeBackSwipeForTesting;
- (void)_resetNavigationGestureStateForTesting;
- (void)_setDefersLoadingForTesting:(BOOL)defersLoading;

- (void)_setShareSheetCompletesImmediatelyWithResolutionForTesting:(BOOL)resolved;

- (void)_didShowContextMenu;
- (void)_didDismissContextMenu;

- (void)_resetInteraction;

- (BOOL)_shouldBypassGeolocationPromptForTesting;

- (void)_didPresentContactPicker;
- (void)_didDismissContactPicker;
- (void)_dismissContactPickerWithContacts:(NSArray *)contacts;

@property (nonatomic, setter=_setScrollingUpdatesDisabledForTesting:) BOOL _scrollingUpdatesDisabledForTesting;
@property (nonatomic, readonly) NSString *_scrollingTreeAsText;

@property (nonatomic, readonly) pid_t _networkProcessIdentifier;

@property (nonatomic, readonly) unsigned long _countOfUpdatesWithLayerChanges;

- (void)_processWillSuspendForTesting:(void (^)(void))completionHandler;
- (void)_processWillSuspendImminentlyForTesting;
- (void)_processDidResumeForTesting;
@property (nonatomic, readonly) BOOL _hasServiceWorkerBackgroundActivityForTesting;
@property (nonatomic, readonly) BOOL _hasServiceWorkerForegroundActivityForTesting;
- (void)_setThrottleStateForTesting:(int)type;

- (void)_doAfterProcessingAllPendingMouseEvents:(dispatch_block_t)action;

+ (void)_setApplicationBundleIdentifier:(NSString *)bundleIdentifier;
+ (void)_clearApplicationBundleIdentifierTestingOverride;

- (BOOL)_hasSleepDisabler;
- (WKWebViewAudioRoutingArbitrationStatus)_audioRoutingArbitrationStatus;
- (double)_audioRoutingArbitrationUpdateTime;

- (void)_doAfterActivityStateUpdate:(void (^)(void))completionHandler;

- (NSNumber *)_suspendMediaPlaybackCounter WK_API_AVAILABLE(macos(12.0), ios(15.0));

- (void)_setPrivateClickMeasurementOverrideTimerForTesting:(BOOL)overrideTimer completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_setPrivateClickMeasurementAttributionReportURLsForTesting:(NSURL *)sourceURL destinationURL:(NSURL *)destinationURL completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_setPrivateClickMeasurementAttributionTokenPublicKeyURLForTesting:(NSURL *)url completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_setPrivateClickMeasurementAttributionTokenSignatureURLForTesting:(NSURL *)url completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(12.0), ios(15.0));
- (void)_setPrivateClickMeasurementAppBundleIDForTesting:(NSString *)appBundleID completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));
- (void)_dumpPrivateClickMeasurement:(void(^)(NSString *))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_lastNavigationWasAppInitiated:(void(^)(BOOL))completionHandler;
- (void)_appPrivacyReportTestingData:(void(^)(struct WKAppPrivacyReportTestingData data))completionHandler;
- (void)_clearAppPrivacyReportTestingData:(void(^)(void))completionHandler;

- (void)_createMediaSessionCoordinatorForTesting:(id <_WKMediaSessionCoordinator>)privateCoordinator completionHandler:(void(^)(BOOL))completionHandler;
- (void)_gpuToWebProcessConnectionCountForTesting:(void(^)(NSUInteger))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_isLayerTreeFrozenForTesting:(void (^)(BOOL frozen))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_computePagesForPrinting:(_WKFrameHandle *)handle completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(13.0), ios(16.0));

- (void)_setConnectedToHardwareConsoleForTesting:(BOOL)connected;

- (void)_setSystemPreviewCompletionHandlerForLoadTesting:(void(^)(bool))completionHandler;

@property (nonatomic, readonly) BOOL _isLoggerEnabledForTesting;

- (void)_terminateIdleServiceWorkersForTesting;
@end

typedef NS_ENUM(NSInteger, _WKMediaSessionReadyState) {
    WKMediaSessionReadyStateHaveNothing,
    WKMediaSessionReadyStateHaveMetadata,
    WKMediaSessionReadyStateHaveCurrentData,
    WKMediaSessionReadyStateHaveFutureData,
    WKMediaSessionReadyStateHaveEnoughData
};

typedef NS_ENUM(NSInteger, _WKMediaSessionPlaybackState) {
    WKMediaSessionPlaybackStateNone,
    WKMediaSessionPlaybackStatePaused,
    WKMediaSessionPlaybackStatePlaying
};

typedef NS_ENUM(NSInteger, _WKMediaSessionCoordinatorState) {
    WKMediaSessionCoordinatorStateWaiting,
    WKMediaSessionCoordinatorStateJoined,
    WKMediaSessionCoordinatorStateClosed
};

struct _WKMediaPositionState {
    double duration;
    double playbackRate;
    double position;
};

@protocol _WKMediaSessionCoordinatorDelegate <NSObject>
- (void)seekSessionToTime:(double)time withCompletion:(void(^)(BOOL))completionHandler;
- (void)playSessionWithCompletion:(void(^)(BOOL))completionHandler;
- (void)pauseSessionWithCompletion:(void(^)(BOOL))completionHandler;
- (void)setSessionTrack:(NSString*)trackIdentifier withCompletion:(void(^)(BOOL))completionHandler;
- (void)coordinatorStateChanged:(_WKMediaSessionCoordinatorState)state;
@end

@protocol _WKMediaSessionCoordinator <NSObject>
@property (nullable, weak) id <_WKMediaSessionCoordinatorDelegate> delegate;
@property (nonatomic, readonly) NSString * _Nonnull identifier;
- (void)joinWithCompletion:(void(^ _Nonnull)(BOOL))completionHandler;
- (void)leave;
- (void)seekTo:(double)time withCompletion:(void(^ _Nonnull)(BOOL))completionHandler;
- (void)playWithCompletion:(void(^ _Nonnull)(BOOL))completionHandler;
- (void)pauseWithCompletion:(void(^ _Nonnull)(BOOL))completionHandler;
- (void)setTrack:(NSString *_Nonnull)trackIdentifier withCompletion:(void(^ _Nonnull)(BOOL))completionHandler;
- (void)positionStateChanged:(struct _WKMediaPositionState * _Nullable)state;
- (void)readyStateChanged:(_WKMediaSessionReadyState)state;
- (void)playbackStateChanged:(_WKMediaSessionPlaybackState)state;
- (void)trackIdentifierChanged:(NSString *)trackIdentifier;
@end

WK_EXTERN
@interface _WKNowPlayingMetadata : NSObject
@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) NSString *artist;
@property (nonatomic, copy) NSString *album;
@property (nonatomic, copy) NSString *sourceApplicationIdentifier;
@end

NS_ASSUME_NONNULL_END
