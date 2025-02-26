/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

@class UITextSuggestion;
@class WKWebView;

@protocol _WKFocusedElementInfo;
@protocol _WKFormInputSession;

#if TARGET_OS_IPHONE
typedef NS_ENUM(NSInteger, _WKFocusStartsInputSessionPolicy) {
    _WKFocusStartsInputSessionPolicyAuto,
    _WKFocusStartsInputSessionPolicyAllow,
    _WKFocusStartsInputSessionPolicyDisallow,
} WK_API_AVAILABLE(ios(12.0));
#endif

@protocol _WKInputDelegate <NSObject>

@optional

- (void)_webView:(WKWebView *)webView didStartInputSession:(id <_WKFormInputSession>)inputSession;
- (void)_webView:(WKWebView *)webView willSubmitFormValues:(NSDictionary *)values userObject:(NSObject <NSSecureCoding> *)userObject submissionHandler:(void (^)(void))submissionHandler;

#if TARGET_OS_IPHONE
- (BOOL)_webView:(WKWebView *)webView focusShouldStartInputSession:(id <_WKFocusedElementInfo>)info;
- (_WKFocusStartsInputSessionPolicy)_webView:(WKWebView *)webView decidePolicyForFocusedElement:(id <_WKFocusedElementInfo>)info WK_API_AVAILABLE(ios(12.0));
- (void)_webView:(WKWebView *)webView accessoryViewCustomButtonTappedInFormInputSession:(id <_WKFormInputSession>)inputSession;
- (void)_webView:(WKWebView *)webView insertTextSuggestion:(UITextSuggestion *)suggestion inInputSession:(id <_WKFormInputSession>)inputSession WK_API_AVAILABLE(ios(10.0));
- (void)_webView:(WKWebView *)webView willStartInputSession:(id <_WKFormInputSession>)inputSession WK_API_AVAILABLE(ios(12.0));
- (BOOL)_webView:(WKWebView *)webView focusRequiresStrongPasswordAssistance:(id <_WKFocusedElementInfo>)info WK_API_AVAILABLE(ios(12.0));

- (NSDictionary<id, NSString *> *)_webViewAdditionalContextForStrongPasswordAssistance:(WKWebView *)webView WK_API_AVAILABLE(ios(13.4));

- (BOOL)_webView:(WKWebView *)webView shouldRevealFocusOverlayForInputSession:(id <_WKFormInputSession>)inputSession WK_API_AVAILABLE(ios(12.0));
- (CGFloat)_webView:(WKWebView *)webView focusedElementContextViewHeightForFittingSize:(CGSize)fittingSize inputSession:(id <_WKFormInputSession>)inputSession WK_API_AVAILABLE(ios(12.0));
- (UIView *)_webView:(WKWebView *)webView focusedElementContextViewForInputSession:(id <_WKFormInputSession>)inputSession WK_API_AVAILABLE(ios(12.0));
#endif

@end
