/*
 * Copyright (C) 2014-2019 Apple Inc. All rights reserved.
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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class WKDownload;
@class WKNavigation;
@class WKNavigationAction;
@class WKNavigationResponse;
@class WKWebView;
@class WKWebpagePreferences;

/*! @enum WKNavigationActionPolicy
 @abstract The policy to pass back to the decision handler from the
 webView:decidePolicyForNavigationAction:decisionHandler: method.
 @constant WKNavigationActionPolicyCancel   Cancel the navigation.
 @constant WKNavigationActionPolicyAllow    Allow the navigation to continue.
 @constant WKNavigationActionPolicyDownload    Turn the navigation into a download.
 */
typedef NS_ENUM(NSInteger, WKNavigationActionPolicy) {
    WKNavigationActionPolicyCancel,
    WKNavigationActionPolicyAllow,
    WKNavigationActionPolicyDownload WK_API_AVAILABLE(macos(11.3), ios(14.5)),
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

/*! @enum WKNavigationResponsePolicy
 @abstract The policy to pass back to the decision handler from the webView:decidePolicyForNavigationResponse:decisionHandler: method.
 @constant WKNavigationResponsePolicyCancel   Cancel the navigation.
 @constant WKNavigationResponsePolicyAllow    Allow the navigation to continue.
 @constant WKNavigationResponsePolicyDownload    Turn the navigation into a download.
 */
typedef NS_ENUM(NSInteger, WKNavigationResponsePolicy) {
    WKNavigationResponsePolicyCancel,
    WKNavigationResponsePolicyAllow,
    WKNavigationResponsePolicyDownload WK_API_AVAILABLE(macos(11.3), ios(14.5)),
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

/*! A class conforming to the WKNavigationDelegate protocol can provide
 methods for tracking progress for main frame navigations and for deciding
 policy for main frame and subframe navigations.
 */
WK_SWIFT_UI_ACTOR
@protocol WKNavigationDelegate <NSObject>

@optional

/*! @abstract Decides whether to allow or cancel a navigation.
 @param webView The web view invoking the delegate method.
 @param navigationAction Descriptive information about the action
 triggering the navigation request.
 @param decisionHandler The decision handler to call to allow or cancel the
 navigation. The argument is one of the constants of the enumerated type WKNavigationActionPolicy.
 @discussion If you do not implement this method, the web view will load the request or, if appropriate, forward it to another application.
 */
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKNavigationActionPolicy))decisionHandler WK_SWIFT_ASYNC(3);

/*! @abstract Decides whether to allow or cancel a navigation.
 @param webView The web view invoking the delegate method.
 @param navigationAction Descriptive information about the action
 triggering the navigation request.
 @param preferences The default set of webpage preferences. This may be
 changed by setting defaultWebpagePreferences on WKWebViewConfiguration.
 @param decisionHandler The policy decision handler to call to allow or cancel
 the navigation. The arguments are one of the constants of the enumerated type
 WKNavigationActionPolicy, as well as an instance of WKWebpagePreferences.
 @discussion If you implement this method,
 -webView:decidePolicyForNavigationAction:decisionHandler: will not be called.
 */
- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction preferences:(WKWebpagePreferences *)preferences decisionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKNavigationActionPolicy, WKWebpagePreferences *))decisionHandler WK_SWIFT_ASYNC(4) WK_API_AVAILABLE(macos(10.15), ios(13.0));

/*! @abstract Decides whether to allow or cancel a navigation after its
 response is known.
 @param webView The web view invoking the delegate method.
 @param navigationResponse Descriptive information about the navigation
 response.
 @param decisionHandler The decision handler to call to allow or cancel the
 navigation. The argument is one of the constants of the enumerated type WKNavigationResponsePolicy.
 @discussion If you do not implement this method, the web view will allow the response, if the web view can show it.
 */
- (void)webView:(WKWebView *)webView decidePolicyForNavigationResponse:(WKNavigationResponse *)navigationResponse decisionHandler:(WK_SWIFT_UI_ACTOR void (^)(WKNavigationResponsePolicy))decisionHandler WK_SWIFT_ASYNC(3);

/*! @abstract Invoked when a main frame navigation starts.
 @param webView The web view invoking the delegate method.
 @param navigation The navigation.
 */
- (void)webView:(WKWebView *)webView didStartProvisionalNavigation:(null_unspecified WKNavigation *)navigation;

/*! @abstract Invoked when a server redirect is received for the main
 frame.
 @param webView The web view invoking the delegate method.
 @param navigation The navigation.
 */
- (void)webView:(WKWebView *)webView didReceiveServerRedirectForProvisionalNavigation:(null_unspecified WKNavigation *)navigation;

/*! @abstract Invoked when an error occurs while starting to load data for
 the main frame.
 @param webView The web view invoking the delegate method.
 @param navigation The navigation.
 @param error The error that occurred.
 */
- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(null_unspecified WKNavigation *)navigation withError:(NSError *)error;

/*! @abstract Invoked when content starts arriving for the main frame.
 @param webView The web view invoking the delegate method.
 @param navigation The navigation.
 */
- (void)webView:(WKWebView *)webView didCommitNavigation:(null_unspecified WKNavigation *)navigation;

/*! @abstract Invoked when a main frame navigation completes.
 @param webView The web view invoking the delegate method.
 @param navigation The navigation.
 */
- (void)webView:(WKWebView *)webView didFinishNavigation:(null_unspecified WKNavigation *)navigation;

/*! @abstract Invoked when an error occurs during a committed main frame
 navigation.
 @param webView The web view invoking the delegate method.
 @param navigation The navigation.
 @param error The error that occurred.
 */
- (void)webView:(WKWebView *)webView didFailNavigation:(null_unspecified WKNavigation *)navigation withError:(NSError *)error;

/*! @abstract Invoked when the web view needs to respond to an authentication challenge.
 @param webView The web view that received the authentication challenge.
 @param challenge The authentication challenge.
 @param completionHandler The completion handler you must invoke to respond to the challenge. The
 disposition argument is one of the constants of the enumerated type
 NSURLSessionAuthChallengeDisposition. When disposition is NSURLSessionAuthChallengeUseCredential,
 the credential argument is the credential to use, or nil to indicate continuing without a
 credential.
 @discussion If you do not implement this method, the web view will respond to the authentication challenge with the NSURLSessionAuthChallengeRejectProtectionSpace disposition.
 */
- (void)webView:(WKWebView *)webView didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(WK_SWIFT_UI_ACTOR void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential * _Nullable credential))completionHandler WK_SWIFT_ASYNC_NAME(webView(_:respondTo:));

/*! @abstract Invoked when the web view's web content process is terminated.
 @param webView The web view whose underlying web content process was terminated.
 */
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView WK_API_AVAILABLE(macos(10.11), ios(9.0));

/*! @abstract Invoked when the web view is establishing a network connection using a deprecated version of TLS.
 @param webView The web view initiating the connection.
 @param challenge The authentication challenge.
 @param decisionHandler The decision handler you must invoke to respond to indicate whether or not to continue with the connection establishment.
 */
- (void)webView:(WKWebView *)webView authenticationChallenge:(NSURLAuthenticationChallenge *)challenge shouldAllowDeprecatedTLS:(WK_SWIFT_UI_ACTOR void (^)(BOOL))decisionHandler WK_SWIFT_ASYNC_NAME(webView(_:shouldAllowDeprecatedTLSFor:)) WK_SWIFT_ASYNC(3) WK_API_AVAILABLE(macos(11.0), ios(14.0));

/*
 @abstract Called after using WKNavigationActionPolicyDownload.
 @param webView The web view that created the download.
 @param navigationAction The action that is being turned into a download.
 @param download The download.
 @discussion The download needs its delegate to be set to receive updates about its progress.
*/
- (void)webView:(WKWebView *)webView navigationAction:(WKNavigationAction *)navigationAction didBecomeDownload:(WKDownload *)download WK_API_AVAILABLE(macos(11.3), ios(14.5));

/*
 @abstract Called after using WKNavigationResponsePolicyDownload.
 @param webView The web view that created the download.
 @param navigationResponse The response that is being turned into a download.
 @param download The download.
 @discussion The download needs its delegate to be set to receive updates about its progress.
*/
- (void)webView:(WKWebView *)webView navigationResponse:(WKNavigationResponse *)navigationResponse didBecomeDownload:(WKDownload *)download WK_API_AVAILABLE(macos(11.3), ios(14.5));

@end

NS_ASSUME_NONNULL_END
