/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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
@protocol NSProgressReporting;
@protocol WKDownloadDelegate;

NS_ASSUME_NONNULL_BEGIN

WK_CLASS_AVAILABLE(macos(11.3), ios(14.5))
WK_SWIFT_UI_ACTOR
@interface WKDownload : NSObject<NSProgressReporting>

/* @abstract The request used to initiate this download.
  @discussion If the original request redirected to a different URL, originalRequest
  will be unchanged after the download follows the redirect.
 */
@property (nonatomic, readonly, nullable) NSURLRequest *originalRequest;

/* @abstract The web view that originated this download. */
@property (nonatomic, readonly, weak) WKWebView *webView;

/* @abstract The delegate that receives progress updates for this download. */
@property (nonatomic, weak) id <WKDownloadDelegate> delegate;

/* @abstract A boolean value indicating whether this download was initiated by the user. */
@property (nonatomic, readonly, getter=isUserInitiated) BOOL userInitiated WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA));

/* @abstract The frame that originated this download. */
@property (nonatomic, readonly) WKFrameInfo *originatingFrame WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA));

/* @abstract Cancel the download.
 @param completionHandler A block to invoke when cancellation is finished.
 @discussion To attempt to resume the download, call WKWebView resumeDownloadFromResumeData: with the data given to the completionHandler.
 If no resume attempt is possible with this server, completionHandler will be called with nil.
 */
- (void)cancel:(WK_SWIFT_UI_ACTOR void(^ _Nullable)(NSData * _Nullable resumeData))completionHandler;

@end

NS_ASSUME_NONNULL_END
