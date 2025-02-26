/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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
#import <WebKit/WKDownloadDelegate.h>
#import <WebKit/WKFoundation.h>

@class WKDownload;

/* @enum _WKPlaceholderPolicy
 @abstract The policy for creating a placeholder file in the Downloads directory during downloads.
 @constant _WKPlaceholderPolicyDisable   Do not create a placeholder file.
 @constant _WKPlaceholderPolicyEnable    Create a placeholder file.
 */
typedef NS_ENUM(NSInteger, _WKPlaceholderPolicy) {
    _WKPlaceholderPolicyDisable,
    _WKPlaceholderPolicyEnable,
} NS_SWIFT_NAME(WKDownload.PlaceholderPolicy) WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

NS_ASSUME_NONNULL_BEGIN

WK_SWIFT_UI_ACTOR
@protocol WKDownloadDelegatePrivate <WKDownloadDelegate>

@optional

/* @abstract Invoked when the download needs a placeholder policy from the client.
 @param download The download for which we need a placeholder policy
 @param completionHandler The completion handler that should be invoked with the chosen policy
 @discussion The placeholder policy specifies whether a placeholder file should be created in
 the Downloads directory when the download is in progress. If the client opts out of the
 placeholder feature, it can choose to provide a custom URL to publish progress against.
 This is useful if the client maintains it's own placeholder file.
 */
- (void)_download:(WKDownload *)download decidePlaceholderPolicy:(void (^)(_WKPlaceholderPolicy, NSURL *))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/* @abstract Called when the download receives a placeholder URL
 @param download The download for which we received a placeholder URL
 @param completionHandler The completion handler that should be called by the client in response to this call. 
 @discussion The placeholder URL will normally refer to a file in the Downloads directory
 */
- (void)_download:(WKDownload *)download didReceivePlaceholderURL:(NSURL *)url completionHandler:(void (^)(void))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/* @abstract Called when the download receives a final URL
 @param download The download for which we received a final URL
 @param url The URL of the final download location
 @discussion The final URL will normally refer to a file in the Downloads directory
 */
- (void)_download:(WKDownload *)download didReceiveFinalURL:(NSURL *)url WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

@end

NS_ASSUME_NONNULL_END
