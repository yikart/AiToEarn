/*
 * Copyright (C) 2014-2022 Apple Inc. All rights reserved.
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

#pragma once

#if HAVE(AVKIT)

#include "FloatRect.h"
#include <CoreGraphics/CGGeometry.h>
#include <QuartzCore/CALayer.h>
#include <pal/spi/cocoa/FoundationSPI.h>

OBJC_CLASS AVPlayerController;
OBJC_CLASS NSDictionary;
OBJC_CLASS NSString;

namespace WebCore {
class VideoPresentationModel;
}

WEBCORE_EXPORT @interface WebAVPlayerLayer : CALayer
@property (nonatomic, retain, nullable) NSString *videoGravity;
@property (nonatomic, getter=isReadyForDisplay) BOOL readyForDisplay;
@property (nonatomic, assign, nullable) WebCore::VideoPresentationModel* presentationModel;
@property (nonatomic, retain, nonnull) AVPlayerController *playerController;
@property (nonatomic, retain, nonnull) CALayer *videoSublayer;
@property (nonatomic, retain, nullable) CALayer *captionsLayer;
@property (nonatomic, copy, nullable) NSDictionary *pixelBufferAttributes;
@property CGSize videoDimensions;
@property (nonatomic) NSEdgeInsets legibleContentInsets;
- (WebCore::FloatRect)calculateTargetVideoFrame;
@end

#endif // HAVE(AVKIT)
