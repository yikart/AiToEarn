/*
 * Copyright (C) 2016-2021 Apple Inc. All rights reserved.
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

#if PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE)

#import <pal/spi/cocoa/AVKitSPI.h>
#import <wtf/RetainPtr.h>
#import <wtf/Vector.h>

namespace WebCore {
class PlaybackSessionInterfaceMac;
struct MediaSelectionOption;
}

#if ENABLE(WEB_PLAYBACK_CONTROLS_MANAGER)

WEBCORE_EXPORT
@interface WebPlaybackControlsManager : NSObject
    <AVTouchBarPlaybackControlsControlling>
{
@private
    NSTimeInterval _contentDuration;
    RetainPtr<AVValueTiming> _timing;
    NSTimeInterval _seekToTime;
    RetainPtr<NSArray> _seekableTimeRanges;
    RetainPtr<NSArray<AVTouchBarMediaSelectionOption *>> _audioTouchBarMediaSelectionOptions;
    RetainPtr<AVTouchBarMediaSelectionOption> _currentAudioTouchBarMediaSelectionOption;
    RetainPtr<NSArray<AVTouchBarMediaSelectionOption *>> _legibleTouchBarMediaSelectionOptions;
    RetainPtr<AVTouchBarMediaSelectionOption> _currentLegibleTouchBarMediaSelectionOption;
    RefPtr<WebCore::PlaybackSessionInterfaceMac> _playbackSessionInterfaceMac;
    double _defaultPlaybackRate;
    float _rate;
    BOOL _playing;
    BOOL _hasEnabledAudio;
    BOOL _hasEnabledVideo;
    BOOL _canTogglePlayback;
    BOOL _canSeek;
}

@property (assign) WebCore::PlaybackSessionInterfaceMac* playbackSessionInterfaceMac;
@property (readwrite) NSTimeInterval contentDuration;
@property (nonatomic, retain, readwrite) AVValueTiming *timing;
@property (nonatomic) NSTimeInterval seekToTime;
@property (nonatomic, retain, readwrite) NSArray *seekableTimeRanges;
@property (nonatomic) BOOL hasEnabledAudio;
@property (nonatomic) BOOL hasEnabledVideo;
@property (getter=isPlaying) BOOL playing;
@property BOOL canTogglePlayback;
@property double defaultPlaybackRate;
@property (nonatomic) float rate;
@property BOOL allowsPictureInPicturePlayback;
@property (getter=isPictureInPictureActive) BOOL pictureInPictureActive;
@property BOOL canTogglePictureInPicture;
- (void)togglePictureInPicture;
- (void)enterInWindow;
- (void)exitInWindow;
@property (nonatomic, readonly) BOOL canSeek;

- (AVTouchBarMediaSelectionOption *)currentAudioTouchBarMediaSelectionOption;
- (void)setCurrentAudioTouchBarMediaSelectionOption:(AVTouchBarMediaSelectionOption *)option;
- (AVTouchBarMediaSelectionOption *)currentLegibleTouchBarMediaSelectionOption;
- (void)setCurrentLegibleTouchBarMediaSelectionOption:(AVTouchBarMediaSelectionOption *)option;
- (void)setAudioMediaSelectionOptions:(const Vector<WebCore::MediaSelectionOption>&)options withSelectedIndex:(NSUInteger)selectedIndex;
- (void)setLegibleMediaSelectionOptions:(const Vector<WebCore::MediaSelectionOption>&)options withSelectedIndex:(NSUInteger)selectedIndex;
- (void)setAudioMediaSelectionIndex:(NSUInteger)selectedIndex;
- (void)setLegibleMediaSelectionIndex:(NSUInteger)selectedIndex;

- (void)setDefaultPlaybackRate:(double)defaultPlaybackRate fromJavaScript:(BOOL)fromJavaScript;
- (void)setRate:(double)rate fromJavaScript:(BOOL)fromJavaScript;
@end

#endif // ENABLE(WEB_PLAYBACK_CONTROLS_MANAGER)

#endif // PLATFORM(MAC) && ENABLE(VIDEO_PRESENTATION_MODE)
