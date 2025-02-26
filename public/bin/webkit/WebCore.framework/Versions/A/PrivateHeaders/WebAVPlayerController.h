/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#if PLATFORM(COCOA) && HAVE(AVKIT)

#import <pal/spi/cocoa/AVKitSPI.h>

NS_ASSUME_NONNULL_BEGIN

namespace WebCore {
class PlaybackSessionModel;
class PlaybackSessionInterfaceIOS;
}

@class AVTimeRange;

@interface WebAVMediaSelectionOption : NSObject
- (instancetype)initWithMediaType:(AVMediaType)type displayName:(NSString *)displayName;

@property (nonatomic, readonly) NSString *displayName;
@property (nonatomic, readonly) NSString *localizedDisplayName;
@property (nonatomic, readonly) AVMediaType mediaType;

@end

@interface WebAVPlayerController : NSObject

- (void)setAllowsPictureInPicture:(BOOL)allowsPictureInPicture;

@property (retain) AVPlayerController *playerControllerProxy;
@property (assign, nullable /*weak*/) WebCore::PlaybackSessionModel* delegate;
@property (assign, nullable /*weak*/) WebCore::PlaybackSessionInterfaceIOS* playbackSessionInterface;

@property (readonly) BOOL canScanForward;
@property BOOL canScanBackward;
@property (readonly) BOOL canSeekToBeginning;
@property (readonly) BOOL canSeekToEnd;
@property (readonly) BOOL isScrubbing;
@property (readonly) BOOL canSeekFrameBackward;
@property (readonly) BOOL canSeekFrameForward;
@property (readonly) BOOL hasContentChapters;
@property (readonly) BOOL isSeeking;
@property (readonly) NSTimeInterval seekToTime;

@property BOOL canPlay;
@property (getter=isPlaying) BOOL playing;
@property BOOL canPause;
@property BOOL canTogglePlayback;
@property double defaultPlaybackRate;
@property double rate;
@property BOOL canSeek;
@property NSTimeInterval contentDuration;
@property CGSize contentDimensions;
@property BOOL hasEnabledAudio;
@property BOOL hasEnabledVideo;
@property BOOL hasVideo;
@property (readonly) NSTimeInterval minTime;
@property (readonly) NSTimeInterval maxTime;
@property NSTimeInterval contentDurationWithinEndTimes;
@property (retain) NSArray *loadedTimeRanges;
@property AVPlayerControllerStatus status;
@property (retain) AVValueTiming *timing;
@property (retain) NSArray *seekableTimeRanges;
@property (getter=isMuted) BOOL muted;
@property double volume;
- (void)volumeChanged:(double)volume;

@property (readonly) BOOL hasMediaSelectionOptions;
@property (readonly) BOOL hasAudioMediaSelectionOptions;
@property (retain) NSArray *audioMediaSelectionOptions;
@property (retain) WebAVMediaSelectionOption *currentAudioMediaSelectionOption;
@property (readonly) BOOL hasLegibleMediaSelectionOptions;
@property (retain) NSArray *legibleMediaSelectionOptions;
@property (retain) WebAVMediaSelectionOption *currentLegibleMediaSelectionOption;

@property (readonly, getter=isPlayingOnExternalScreen) BOOL playingOnExternalScreen;
@property (nonatomic, getter=isPlayingOnSecondScreen) BOOL playingOnSecondScreen;
@property (getter=isExternalPlaybackActive) BOOL externalPlaybackActive;
@property AVPlayerControllerExternalPlaybackType externalPlaybackType;
@property (retain) NSString *externalPlaybackAirPlayDeviceLocalizedName;
@property BOOL allowsExternalPlayback;
@property (readonly, getter=isPictureInPicturePossible) BOOL pictureInPicturePossible;
@property (getter=isPictureInPictureInterrupted) BOOL pictureInPictureInterrupted;

@property NSTimeInterval seekableTimeRangesLastModifiedTime;
@property NSTimeInterval liveUpdateInterval;

@property (NS_NONATOMIC_IOSONLY, retain, readwrite) AVValueTiming *minTiming;
@property (NS_NONATOMIC_IOSONLY, retain, readwrite) AVValueTiming *maxTiming;

- (void)setDefaultPlaybackRate:(double)defaultPlaybackRate fromJavaScript:(BOOL)fromJavaScript;
- (void)setRate:(double)rate fromJavaScript:(BOOL)fromJavaScript;

#if PLATFORM(APPLETV)
// FIXME (116592344): Remove these declarations once AVPlayerController API is available on tvOS.
@property (nonatomic, readonly, getter=isEffectiveRateNonZero) BOOL effectiveRateNonZero;
@property (nonatomic, readonly) CMTime forwardPlaybackEndTime;
@property (nonatomic, readonly) CMTime backwardPlaybackEndTime;
@property (nonatomic, readonly) BOOL isSeekingTV;
@property (nonatomic, readonly) BOOL hasStartAndEndDates;
@property (nonatomic, readonly, nullable) AVTimeRange *timeRangeSeekable;
@property (readonly, nullable) NSValue *overrideForForwardPlaybackEndTime;
@property (readonly, nullable) NSValue *overrideForReversePlaybackEndTime;
@property (readonly) double timebaseRate;
@property (readonly, nullable) NSArray *externalMetadata;
@property (readonly) BOOL isPlaybackLikelyToKeepUp;
@property (readonly) AVPlayerControllerTimeControlStatus timeControlStatus;
@property (readonly) NSTimeInterval displayedDuration;
@property (nonatomic, readonly) NSTimeInterval contentDurationCached;
@property (nonatomic, readonly) NSTimeInterval currentDisplayTime;
@property (nonatomic, readonly) NSDate *currentOrEstimatedDate;
@property (nonatomic, readonly) AVTimeRange *displayTimeRangeForNavigation;
@property (nonatomic, readonly) BOOL isContentDurationIndefinite;
@property (nonatomic, readonly) AVTimeRange *timeRangeForNavigation;
@property (nonatomic) float activeRate;
#endif // PLATFORM(APPLETV)

@end

Class webAVPlayerControllerClass();
RetainPtr<WebAVPlayerController> createWebAVPlayerController();

NS_ASSUME_NONNULL_END

#endif // PLATFORM(COCOA) && HAVE(AVKIT)
