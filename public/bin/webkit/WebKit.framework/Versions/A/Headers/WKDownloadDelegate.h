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

@class WKDownload;

/* @enum WKDownloadRedirectPolicy
 @abstract The policy to pass back to the decision handler from the download:willPerformHTTPRedirection:newRequest:decisionHandler: method.
 @constant WKDownloadRedirectPolicyCancel   Cancel the redirect.
 @constant WKDownloadRedirectPolicyAllow    Allow the redirect.
 */
typedef NS_ENUM(NSInteger, WKDownloadRedirectPolicy) {
    WKDownloadRedirectPolicyCancel,
    WKDownloadRedirectPolicyAllow,
} NS_SWIFT_NAME(WKDownload.RedirectPolicy) WK_API_AVAILABLE(macos(11.3), ios(14.5));

/* @enum WKDownloadPlaceholderPolicy
 @abstract The policy for creating a placeholder file in the Downloads directory during downloads.
 @constant WKDownloadPlaceholderPolicyDisable   Do not create a placeholder file.
 @constant WKDownloadPlaceholderPolicyEnable    Create a placeholder file.
 */
typedef NS_ENUM(NSInteger, WKDownloadPlaceholderPolicy) {
    WKDownloadPlaceholderPolicyDisable,
    WKDownloadPlaceholderPolicyEnable,
} NS_SWIFT_NAME(WKDownload.PlaceholderPolicy) WK_API_AVAILABLE(ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

NS_ASSUME_NONNULL_BEGIN

WK_SWIFT_UI_ACTOR
@protocol WKDownloadDelegate <NSObject>

@required

/* @abstract Invoked when the download needs a location to write the downloaded bytes.
 @param download The download for which we need a file to which to write.
 @param response The server response if this download was the result of an HTTP request,
 or a synthesized response for blob downloads.
 @param suggestedFilename The suggested filename.
 @param completionHandler The completion handler you must invoke with
 either a file URL to begin the download or nil to cancel the download.
 @discussion suggestedFilename will often be the same as response.suggestedFilename,
 but web content can specify the suggested download filename.  If the destination file
 URL is non-null, it must be a file that does not exist in a directory that does exist
 and can be written to.
 */
- (void)download:(WKDownload *)download decideDestinationUsingResponse:(NSURLResponse *)response suggestedFilename:(NSString *)suggestedFilename completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSURL * _Nullable destination))completionHandler;

@optional

/* @abstract Invoked when the download has received an HTTP redirection response.
 @param download The download that received the redirect.
 @param response The redirection response.
 @param newRequest The new request that will be sent.
 @param completionHandler The completion handler you must invoke to indicate whether or not
 to proceed with the redirection.
 @discussion If you do not implement this method, all server suggested redirects will be taken.
 */
- (void)download:(WKDownload *)download willPerformHTTPRedirection:(NSHTTPURLResponse *)response newRequest:(NSURLRequest *)request decisionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKDownloadRedirectPolicy))decisionHandler WK_SWIFT_ASYNC_NAME(download(_:decidedPolicyForHTTPRedirection:newRequest:)) WK_SWIFT_ASYNC(4);

/* @abstract Invoked when the download needs to respond to an authentication challenge.
 @param download The download that received the authentication challenge.
 @param challenge The authentication challenge.
 @param completionHandler The completion handler you must invoke to respond to the challenge. The
 disposition argument is one of the constants of the enumerated type
 NSURLSessionAuthChallengeDisposition. When disposition is NSURLSessionAuthChallengeUseCredential,
 the credential argument is the credential to use, or nil to indicate continuing without a
 credential.
 @discussion If you do not implement this method, the web view will respond to the authentication challenge with the NSURLSessionAuthChallengeRejectProtectionSpace disposition.
 */
- (void)download:(WKDownload *)download didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable))completionHandler WK_SWIFT_ASYNC_NAME(download(_:respondTo:));

/* @abstract Invoked when the download has finished successfully.
 @param download The download that finished.
 */
- (void)downloadDidFinish:(WKDownload *)download;

/* @abstract Invoked when the download has failed.
 @param download The download that has failed.
 @param error The error indicating the failure reason.
 @param resumeData This data can be passed to WKWebView resumeDownloadFromResumeData: to attempt to resume this download.
 */
- (void)download:(WKDownload *)download didFailWithError:(NSError *)error resumeData:(nullable NSData *)resumeData;

/* @abstract Invoked when the download needs a placeholder policy from the client.
 @param download The download for which we need a placeholder policy
 @param completionHandler The completion handler that should be invoked with the chosen policy.
 If the client implements it's own placeholder, it can choose to provide an alternate placeholder
 URL, which progress will be published against.
 The download will not proceed until the completion handler is called.
 @discussion The placeholder policy specifies whether a placeholder file should be created in
 the Downloads directory when the download is in progress. This function is called after
 the destination for the download has been decided, and before the download begins.
 If the client opts into the placeholder feature, the system will create a placeholder file in
 the Downloads directory, which is updated with the download's progress. When the download is
 done, the placeholder file is replaced with the actual downloaded file. If the client opts
 out of the placeholder feature, it can choose to provide a custom URL to publish progress
 against. This is useful if the client maintains it's own placeholder file. If this delegate
 is not implemented, the placeholder feature will be disabled.
 */
- (void)download:(WKDownload *)download decidePlaceholderPolicy:(WK_SWIFT_UI_ACTOR void (^)(WKDownloadPlaceholderPolicy, NSURL * _Nullable))completionHandler WK_SWIFT_ASYNC_NAME(placeholderPolicy(forDownload:)) WK_API_AVAILABLE(ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/* @abstract Called when the download receives a placeholder URL
 @param download The download for which we received a placeholder URL
 @param completionHandler The completion handler that should be called by the client in response to this call.
 The didReceiveFinalURL function will not be called until the completion handler has been called.
 @discussion This function is called only if the client opted into the placeholder feature, and it is called
 before receiving the final URL of the download. The placeholder URL will normally refer to a file in the
 Downloads directory.
 */
- (void)download:(WKDownload *)download didReceivePlaceholderURL:(NSURL *)url completionHandler:(WK_SWIFT_UI_ACTOR void (^)(void))completionHandler WK_API_AVAILABLE(ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

/* @abstract Called when the download receives a final URL
 @param download The download for which we received a final URL
 @param url The URL of the final download location
 @discussion This function is called after didReceivePlaceholderURL was called and after the download finished.
 The final URL will normally refer to a file in the Downloads directory
 */
- (void)download:(WKDownload *)download didReceiveFinalURL:(NSURL *)url WK_API_AVAILABLE(ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

@end

NS_ASSUME_NONNULL_END
