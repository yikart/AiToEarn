/*
 * Copyright (C) 2020-2024 Apple Inc. All rights reserved.
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

NS_ASSUME_NONNULL_BEGIN

@class _WKFrameHandle;

typedef NS_ENUM(NSInteger, _WKResourceLoadInfoResourceType) {
    _WKResourceLoadInfoResourceTypeApplicationManifest,
    _WKResourceLoadInfoResourceTypeBeacon,
    _WKResourceLoadInfoResourceTypeCSPReport,
    _WKResourceLoadInfoResourceTypeDocument,
    _WKResourceLoadInfoResourceTypeImage,
    _WKResourceLoadInfoResourceTypeFetch,
    _WKResourceLoadInfoResourceTypeFont,
    _WKResourceLoadInfoResourceTypeMedia,
    _WKResourceLoadInfoResourceTypeObject,
    _WKResourceLoadInfoResourceTypePing,
    _WKResourceLoadInfoResourceTypeScript,
    _WKResourceLoadInfoResourceTypeStylesheet,
    _WKResourceLoadInfoResourceTypeXMLHTTPRequest,
    _WKResourceLoadInfoResourceTypeXSLT,
    _WKResourceLoadInfoResourceTypeOther = -1,
};

WK_CLASS_AVAILABLE(macos(11.0), ios(14.0))
@interface _WKResourceLoadInfo : NSObject <NSSecureCoding>

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;

@property (nonatomic, readonly) uint64_t resourceLoadID;
@property (nonatomic, readonly) _WKFrameHandle *frame;
@property (nonatomic, readonly, nullable) _WKFrameHandle *parentFrame;
@property (nonatomic, readonly, nullable) NSUUID *documentID;
@property (nonatomic, readonly) NSURL *originalURL;
@property (nonatomic, readonly) NSString *originalHTTPMethod;
@property (nonatomic, readonly) NSDate *eventTimestamp;
@property (nonatomic, readonly) BOOL loadedFromCache;
@property (nonatomic, readonly) _WKResourceLoadInfoResourceType resourceType;

@end

NS_ASSUME_NONNULL_END
