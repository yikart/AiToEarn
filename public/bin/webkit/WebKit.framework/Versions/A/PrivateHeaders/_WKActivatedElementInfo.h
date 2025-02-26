/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#import <WebKit/WKFoundation.h>

#if TARGET_OS_IPHONE
@class UIImage;
#else
@class NSImage;
#endif

typedef NS_ENUM(NSInteger, _WKActivatedElementType) {
    _WKActivatedElementTypeLink,
    _WKActivatedElementTypeImage,
    _WKActivatedElementTypeAttachment WK_API_AVAILABLE(macos(10.12), ios(10.0)),
    _WKActivatedElementTypeUnspecified WK_API_AVAILABLE(macos(10.13), ios(11.0)),
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface _WKActivatedElementInfo : NSObject

@property (nonatomic, readonly) NSURL *URL;
@property (nonatomic, readonly) NSURL *imageURL;
@property (nonatomic, readonly) NSString *title;
@property (nonatomic, readonly) _WKActivatedElementType type;
@property (nonatomic, readonly) CGRect boundingRect;
@property (nonatomic, readonly) NSString *ID WK_API_AVAILABLE(macos(10.12), ios(10.0));
@property (nonatomic, readonly) BOOL isAnimatedImage WK_API_AVAILABLE(macos(10.15), ios(13.0));
#if defined(TARGET_OS_VISION) && TARGET_OS_VISION && __VISION_OS_VERSION_MIN_REQUIRED >= 20000
@property (nonatomic, readonly) BOOL isSpatialImage WK_API_AVAILABLE(visionos(WK_XROS_TBA));
#endif // defined(TARGET_OS_VISION) && TARGET_OS_VISION & __VISION_OS_VERSION_MIN_REQUIRED >= 20000
#if TARGET_OS_IPHONE
@property (nonatomic, readonly) BOOL isAnimating;
@property (nonatomic, readonly) BOOL canShowAnimationControls;
@property (nonatomic, readonly) NSDictionary *userInfo WK_API_AVAILABLE(ios(11.0));
@property (nonatomic, readonly, copy) UIImage *image;
#else
@property (nonatomic, readonly, copy) NSImage *image;
#endif

@end
