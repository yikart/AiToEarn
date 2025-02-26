/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#if TARGET_OS_OSX || TARGET_OS_IOS || (defined(TARGET_OS_VISION) && TARGET_OS_VISION)

#import <Foundation/Foundation.h>

@class WKFrameInfo;

typedef NS_ENUM(NSInteger, _WKHitTestResultElementType) {
    _WKHitTestResultElementTypeNone,
    _WKHitTestResultElementTypeAudio,
    _WKHitTestResultElementTypeVideo,
} WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));

WK_CLASS_AVAILABLE(macos(10.12), ios(16.0))
@interface _WKHitTestResult : NSObject <NSCopying>

@property (nonatomic, readonly, copy) NSURL *absoluteImageURL;
@property (nonatomic, readonly, copy) NSString *imageMIMEType WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));

@property (nonatomic, readonly, copy) NSURL *absolutePDFURL;
@property (nonatomic, readonly, copy) NSURL *absoluteLinkURL;
@property (nonatomic, readonly) BOOL hasLocalDataForLinkURL WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
@property (nonatomic, readonly, copy) NSString *linkLocalDataMIMEType WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
@property (nonatomic, readonly, copy) NSURL *absoluteMediaURL;

@property (nonatomic, readonly, copy) NSString *linkLabel;
@property (nonatomic, readonly, copy) NSString *linkTitle;
@property (nonatomic, readonly, copy) NSString *linkSuggestedFilename WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
@property (nonatomic, readonly, copy) NSString *imageSuggestedFilename WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));
@property (nonatomic, readonly, copy) NSString *lookupText;

@property (nonatomic, readonly, getter=isContentEditable) BOOL contentEditable;
@property (nonatomic, readonly, getter=isSelected) BOOL selected WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));
@property (nonatomic, readonly, getter=isMediaDownloadable) BOOL mediaDownloadable WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));
@property (nonatomic, readonly, getter=isMediaFullscreen) BOOL mediaFullscreen WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));

@property (nonatomic, readonly) CGRect elementBoundingBox;

@property (nonatomic, readonly) _WKHitTestResultElementType elementType WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));

@property (nonatomic, readonly) WKFrameInfo *frameInfo WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));

@end

#endif
