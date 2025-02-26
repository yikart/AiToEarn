/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#import "TextIndicator.h"
#import <wtf/Noncopyable.h>
#import <wtf/RefPtr.h>
#import <wtf/RetainPtr.h>
#import <wtf/RunLoop.h>

WEBCORE_EXPORT @interface WebTextIndicatorLayer : CALayer {
    RefPtr<WebCore::TextIndicator> _textIndicator;
    RetainPtr<NSArray> _bounceLayers;
    CGSize _margin;
    bool _hasCompletedAnimation;
    BOOL _fadingOut;
}

- (instancetype)initWithFrame:(CGRect)frame textIndicator:(WebCore::TextIndicator&)textIndicator margin:(CGSize)margin offset:(CGPoint)offset;

- (bool)indicatorWantsManualAnimation:(const WebCore::TextIndicator&)indicator;
- (bool)indicatorWantsBounce:(const WebCore::TextIndicator&)indicator;

- (void)present;
- (void)hideWithCompletionHandler:(void(^)(void))completionHandler;

- (void)setAnimationProgress:(float)progress;
- (BOOL)hasCompletedAnimation;

@property (nonatomic, getter=isFadingOut) BOOL fadingOut;

@end

