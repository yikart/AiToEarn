/*
 * Copyright (C) 2004-2016 Apple Inc. All rights reserved.
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

#import <WebKitLegacy/DOMHTMLElement.h>

@class DOMMediaError;
@class DOMTimeRanges;
@class NSString;

enum {
    DOM_NETWORK_EMPTY = 0,
    DOM_NETWORK_IDLE = 1,
    DOM_NETWORK_LOADING = 2,
    DOM_NETWORK_NO_SOURCE = 3,
    DOM_HAVE_NOTHING = 0,
    DOM_HAVE_METADATA = 1,
    DOM_HAVE_CURRENT_DATA = 2,
    DOM_HAVE_FUTURE_DATA = 3,
    DOM_HAVE_ENOUGH_DATA = 4
} WEBKIT_ENUM_DEPRECATED_MAC(10_5, 10_14);

WEBKIT_CLASS_DEPRECATED_MAC(10_5, 10_14)
@interface DOMHTMLMediaElement : DOMHTMLElement
@property (readonly, strong) DOMMediaError *error;
@property (copy) NSString *src;
@property (readonly, copy) NSString *currentSrc;
@property (copy) NSString *crossOrigin;
@property (readonly) unsigned short networkState;
@property (copy) NSString *preload;
@property (readonly, strong) DOMTimeRanges *buffered;
@property (readonly) unsigned short readyState;
@property (readonly) BOOL seeking;
@property double currentTime;
@property (readonly) double duration;
@property (readonly) BOOL paused;
@property double defaultPlaybackRate;
@property double playbackRate;
@property (readonly, strong) DOMTimeRanges *played;
@property (readonly, strong) DOMTimeRanges *seekable;
@property (readonly) BOOL ended;
@property BOOL autoplay;
@property BOOL loop;
@property BOOL controls;
@property double volume;
@property BOOL muted;
@property BOOL defaultMuted;
@property BOOL webkitPreservesPitch;
@property (readonly) BOOL webkitHasClosedCaptions;
@property BOOL webkitClosedCaptionsVisible;
@property (copy) NSString *mediaGroup;

- (void)load;
- (NSString *)canPlayType:(NSString *)type;
- (NSTimeInterval)getStartDate;
- (void)play;
- (void)pause;
- (void)fastSeek:(double)time;
@end
