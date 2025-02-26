/*
 * Copyright (C) 2016, 2018 Apple Inc. All rights reserved.
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
#import <WebKit/WKBase.h>

NS_ASSUME_NONNULL_BEGIN

@class WKWebView;
@class _WKAutomationSession;

typedef NS_ENUM(NSInteger, _WKAutomationSessionJavaScriptDialogType) {
    _WKAutomationSessionJavaScriptDialogTypeNone = 1,
    _WKAutomationSessionJavaScriptDialogTypeAlert,
    _WKAutomationSessionJavaScriptDialogTypeConfirm,
    _WKAutomationSessionJavaScriptDialogTypePrompt,
} WK_API_AVAILABLE(macos(10.14), ios(12.0));

typedef NS_ENUM(NSUInteger, _WKAutomationSessionBrowsingContextOptions) {
    _WKAutomationSessionBrowsingContextOptionsPreferNewTab = 1 << 0,
} WK_API_AVAILABLE(macos(10.14), ios(12.0));

typedef NS_ENUM(NSInteger, _WKAutomationSessionBrowsingContextPresentation) {
    _WKAutomationSessionBrowsingContextPresentationTab,
    _WKAutomationSessionBrowsingContextPresentationWindow,
} WK_API_AVAILABLE(macos(10.15), ios(13.0));

typedef NS_ENUM(NSInteger, _WKAutomationSessionWebExtensionResourceOptions) {
    _WKAutomationSessionWebExtensionResourceOptionsPath,
    _WKAutomationSessionWebExtensionResourceOptionsArchivePath,
    _WKAutomationSessionWebExtensionResourceOptionsBase64,
} WK_API_AVAILABLE(macos(WK_MAC_TBA));

@protocol _WKAutomationSessionDelegate <NSObject>
@optional

- (void)_automationSessionDidDisconnectFromRemote:(_WKAutomationSession *)automationSession;

- (void)_automationSession:(_WKAutomationSession *)automationSession requestNewWebViewWithOptions:(_WKAutomationSessionBrowsingContextOptions)options completionHandler:(void(^)(WKWebView * _Nullable))completionHandler WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (void)_automationSession:(_WKAutomationSession *)automationSession requestHideWindowOfWebView:(WKWebView *)webView completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (void)_automationSession:(_WKAutomationSession *)automationSession requestRestoreWindowOfWebView:(WKWebView *)webView completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (void)_automationSession:(_WKAutomationSession *)automationSession requestMaximizeWindowOfWebView:(WKWebView *)webView completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (void)_automationSession:(_WKAutomationSession *)automationSession requestSwitchToWebView:(WKWebView *)webView completionHandler:(void(^)(void))completionHandler WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (BOOL)_automationSession:(_WKAutomationSession *)automationSession isShowingJavaScriptDialogForWebView:(WKWebView *)webView WK_API_AVAILABLE(macos(10.13), ios(11.0));
- (void)_automationSession:(_WKAutomationSession *)automationSession dismissCurrentJavaScriptDialogForWebView:(WKWebView *)webView WK_API_AVAILABLE(macos(10.13), ios(11.0));
- (void)_automationSession:(_WKAutomationSession *)automationSession acceptCurrentJavaScriptDialogForWebView:(WKWebView *)webView WK_API_AVAILABLE(macos(10.13), ios(11.0));
- (nullable NSString *)_automationSession:(_WKAutomationSession *)automationSession messageOfCurrentJavaScriptDialogForWebView:(WKWebView *)webView WK_API_AVAILABLE(macos(10.13), ios(11.0));
- (void)_automationSession:(_WKAutomationSession *)automationSession setUserInput:(NSString *)value forCurrentJavaScriptDialogForWebView:(WKWebView *)webView WK_API_AVAILABLE(macos(10.13), ios(11.0));
- (_WKAutomationSessionJavaScriptDialogType)_automationSession:(_WKAutomationSession *)automationSession typeOfCurrentJavaScriptDialogForWebView:(WKWebView *)webView WK_API_AVAILABLE(macos(10.14), ios(12.0));
- (_WKAutomationSessionBrowsingContextPresentation)_automationSession:(_WKAutomationSession *)automationSession currentPresentationForWebView:(WKWebView *)webView WK_API_AVAILABLE(macos(10.15), ios(13.0));

- (void)_automationSession:(_WKAutomationSession *)automationSession loadWebExtensionWithOptions:(_WKAutomationSessionWebExtensionResourceOptions)options resource:(NSString *)resource completionHandler:(void(^)(NSString *))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA));
- (void)_automationSession:(_WKAutomationSession *)automationSession unloadWebExtensionWithIdentifier:(NSString *)identifier completionHandler:(void(^)(BOOL))completionHandler WK_API_AVAILABLE(macos(WK_MAC_TBA));

@end

NS_ASSUME_NONNULL_END
