/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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
#import <WebKit/WKFoundation.h>

@class WKFrameInfo;
@class WKWebView;
@class WKDownload;

WK_CLASS_DEPRECATED_WITH_REPLACEMENT("WKDownload", macos(10.10, 12.0), ios(8.0, 15.0))
@interface _WKDownload : NSObject <NSCopying>

+ (instancetype)downloadWithDownload:(WKDownload *)download WK_API_AVAILABLE(macos(12.0), ios(15.0));

- (void)cancel;
- (void)publishProgressAtURL:(NSURL *)URL WK_API_AVAILABLE(macos(10.14.4), ios(12.2));

@property (nonatomic, readonly) NSURLRequest *request;
@property (nonatomic, readonly, weak) WKWebView *originatingWebView;
@property (nonatomic, readonly, copy) NSArray<NSURL *> *redirectChain WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, readonly) BOOL wasUserInitiated WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
@property (nonatomic, readonly) NSData *resumeData WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, readonly) WKFrameInfo *originatingFrame WK_API_AVAILABLE(macos(10.15.4), ios(13.4));

@end
