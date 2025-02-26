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

#import <WebKit/WKFrameInfo.h>
#import <WebKit/WKNavigationDelegate.h>
#import <WebKit/WKWebViewPrivate.h>
#import <WebKit/_WKSameDocumentNavigationType.h>

@class _WKContentRuleListAction;
@class _WKPageLoadTiming;

#if !TARGET_OS_IPHONE
typedef NS_ENUM(NSInteger, _WKPluginModuleLoadPolicy) {
    _WKPluginModuleLoadPolicyLoadNormally,
    _WKPluginModuleLoadPolicyLoadUnsandboxed,
    _WKPluginModuleLoadPolicyBlockedForSecurity,
    _WKPluginModuleLoadPolicyBlockedForCompatibility,
} WK_API_AVAILABLE(macos(10.14));
#endif

typedef NS_ENUM(NSInteger, _WKProcessTerminationReason) {
    _WKProcessTerminationReasonExceededMemoryLimit,
    _WKProcessTerminationReasonExceededCPULimit,
    _WKProcessTerminationReasonRequestedByClient,
    _WKProcessTerminationReasonCrash,
    _WKProcessTerminationReasonExceededSharedProcessCrashLimit WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA)),
} WK_API_AVAILABLE(macos(10.14), ios(12.0));

typedef NS_ENUM(NSInteger, _WKSOAuthorizationLoadPolicy) {
    _WKSOAuthorizationLoadPolicyAllow,
    _WKSOAuthorizationLoadPolicyIgnore,
} WK_API_AVAILABLE(macos(10.15), ios(13.0));

static const WKNavigationActionPolicy _WKNavigationActionPolicyDownload WK_API_DEPRECATED_WITH_REPLACEMENT("WKNavigationActionPolicyDownload", macos(10.10, 12.0), ios(8.0, 15.0)) = (WKNavigationActionPolicy)(WKNavigationActionPolicyAllow + 1);
static const WKNavigationActionPolicy WK_API_AVAILABLE(macos(10.11), ios(9.0)) _WKNavigationActionPolicyAllowWithoutTryingAppLink = (WKNavigationActionPolicy)(WKNavigationActionPolicyAllow + 2);
static const WKNavigationActionPolicy WK_API_AVAILABLE(macos(10.14.4), ios(12.2)) _WKNavigationActionPolicyAllowInNewProcess = (WKNavigationActionPolicy)(_WKNavigationActionPolicyAllowWithoutTryingAppLink + 1);

static const WKNavigationResponsePolicy _WKNavigationResponsePolicyBecomeDownload WK_API_DEPRECATED_WITH_REPLACEMENT("WKNavigationResponsePolicyDownload", macos(10.10, 12.0), ios(8.0, 15.0)) = (WKNavigationResponsePolicy)(WKNavigationResponsePolicyAllow + 1);

@protocol WKNavigationDelegatePrivate <WKNavigationDelegate>

@optional

- (void)_webView:(WKWebView *)webView navigation:(WKNavigation *)navigation didFailProvisionalLoadInSubframe:(WKFrameInfo *)subframe withError:(NSError *)error;

- (void)_webView:(WKWebView *)webView willPerformClientRedirectToURL:(NSURL *)URL delay:(NSTimeInterval)delay;
- (void)_webView:(WKWebView *)webView didPerformClientRedirectFromURL:(NSURL *)sourceURL toURL:(NSURL *)destinationURL;
- (void)_webViewDidCancelClientRedirect:(WKWebView *)webView;

- (void)_webView:(WKWebView *)webView navigationDidFinishDocumentLoad:(WKNavigation *)navigation;
- (void)_webView:(WKWebView *)webView navigation:(WKNavigation *)navigation didSameDocumentNavigation:(_WKSameDocumentNavigationType)navigationType;

- (void)_webView:(WKWebView *)webView renderingProgressDidChange:(_WKRenderingProgressEvents)progressEvents;

- (void)_webViewWebProcessDidCrash:(WKWebView *)webView;
- (void)_webViewWebProcessDidBecomeResponsive:(WKWebView *)webView;
- (void)_webViewWebProcessDidBecomeUnresponsive:(WKWebView *)webView;

- (NSData *)_webCryptoMasterKeyForWebView:(WKWebView *)webView;
- (void)_webCryptoMasterKeyForWebView:(WKWebView *)webView completionHandler:(void (^)(NSData *))completionHandler WK_API_AVAILABLE(macos(15.0), ios(18.0), visionos(2.0));

- (void)_webView:(WKWebView *)webView authenticationChallenge:(NSURLAuthenticationChallenge *)challenge shouldAllowLegacyTLS:(void (^)(BOOL))completionHandler WK_API_AVAILABLE(macos(10.15.4), ios(13.4));
- (void)_webView:(WKWebView *)webView didNegotiateModernTLSForURL:(NSURL *)url WK_API_AVAILABLE(macos(12.0), ios(15.0));

- (void)_webView:(WKWebView *)webView contextMenuDidCreateDownload:(WKDownload *)download WK_API_AVAILABLE(macos(12.0), ios(15.0));

- (void)_webViewDidBeginNavigationGesture:(WKWebView *)webView;
// Item is nil if the gesture ended without navigation.
- (void)_webViewDidEndNavigationGesture:(WKWebView *)webView withNavigationToBackForwardListItem:(WKBackForwardListItem *)item;
// Only called if how the gesture will end (with or without navigation) is known before it ends.
- (void)_webViewWillEndNavigationGesture:(WKWebView *)webView withNavigationToBackForwardListItem:(WKBackForwardListItem *)item;
- (void)_webView:(WKWebView *)webView willSnapshotBackForwardListItem:(WKBackForwardListItem *)item;
- (void)_webViewDidRemoveNavigationGestureSnapshot:(WKWebView *)webView WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction preferences:(WKWebpagePreferences *)preferences userInfo:(id <NSSecureCoding>)userInfo decisionHandler:(void (^)(WKNavigationActionPolicy, WKWebpagePreferences *))decisionHandler WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (void)_webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error userInfo:(id <NSSecureCoding>)userInfo WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

- (void)_webView:(WKWebView *)webView URL:(NSURL *)url contentRuleListIdentifiers:(NSArray<NSString *> *)identifiers notifications:(NSArray<NSString *> *)notifications WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
- (void)_webView:(WKWebView *)webView contentRuleListWithIdentifier:(NSString *)identifier performedAction:(_WKContentRuleListAction *)action forURL:(NSURL *)url WK_API_AVAILABLE(macos(10.15), ios(13.0));
- (void)_webView:(WKWebView *)webView webContentProcessDidTerminateWithReason:(_WKProcessTerminationReason)reason WK_API_AVAILABLE(macos(10.14), ios(12.0));

- (void)_webView:(WKWebView *)webView didStartProvisionalLoadWithRequest:(NSURLRequest *)request inFrame:(WKFrameInfo *)frame WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_webView:(WKWebView *)webView didFailProvisionalLoadWithRequest:(NSURLRequest *)request inFrame:(WKFrameInfo *)frame withError:(NSError *)error WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_webView:(WKWebView *)webView didCommitLoadWithRequest:(NSURLRequest *)request inFrame:(WKFrameInfo *)frame WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_webView:(WKWebView *)webView didFailLoadWithRequest:(NSURLRequest *)request inFrame:(WKFrameInfo *)frame withError:(NSError *)error WK_API_AVAILABLE(macos(11.0), ios(14.0));
- (void)_webView:(WKWebView *)webView didFinishLoadWithRequest:(NSURLRequest *)request inFrame:(WKFrameInfo *)frame WK_API_AVAILABLE(macos(11.0), ios(14.0));

- (void)_webView:(WKWebView *)webView didFailLoadDueToNetworkConnectionIntegrityWithURL:(NSURL *)url WK_API_AVAILABLE(macos(13.3), ios(16.4));
- (void)_webView:(WKWebView *)webView didChangeLookalikeCharactersFromURL:(NSURL *)originalURL toURL:(NSURL *)adjustedURL WK_API_AVAILABLE(macos(13.3), ios(16.4));
- (void)_webView:(WKWebView *)webView didPromptForStorageAccess:(NSString *)topFrameDomain forSubFrameDomain:(NSString *)subFrameDomain forQuirk:(BOOL)forQuirk WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));

- (void)_webView:(WKWebView *)webView backForwardListItemAdded:(WKBackForwardListItem *)itemAdded removed:(NSArray<WKBackForwardListItem *> *)itemsRemoved WK_API_AVAILABLE(macos(10.13.4), ios(WK_IOS_TBA));

#if TARGET_OS_IPHONE
- (void)_webView:(WKWebView *)webView didStartLoadForQuickLookDocumentInMainFrameWithFileName:(NSString *)fileName uti:(NSString *)uti;
- (void)_webView:(WKWebView *)webView didFinishLoadForQuickLookDocumentInMainFrame:(NSData *)documentData;
- (void)_webViewDidRequestPasswordForQuickLookDocument:(WKWebView *)webView WK_API_AVAILABLE(ios(11.0));
- (void)_webViewDidStopRequestingPasswordForQuickLookDocument:(WKWebView *)webView WK_API_AVAILABLE(ios(17.0));
#else
- (void)_webView:(WKWebView *)webView didFailToInitializePlugInWithInfo:(NSDictionary *)info WK_API_AVAILABLE(macos(10.13.4));
- (void)_webView:(WKWebView *)webView didBlockInsecurePluginVersionWithInfo:(NSDictionary *)info WK_API_AVAILABLE(macos(10.14));
- (void)_webView:(WKWebView *)webView decidePolicyForPluginLoadWithCurrentPolicy:(_WKPluginModuleLoadPolicy)policy pluginInfo:(NSDictionary *)info completionHandler:(void (^)(_WKPluginModuleLoadPolicy policy, NSString * unavailabilityDescription))completionHandler WK_API_AVAILABLE(macos(10.14.4));
#endif

- (void)_webView:(WKWebView *)webView willGoToBackForwardListItem:(WKBackForwardListItem *)item inPageCache:(BOOL)inPageCache WK_API_AVAILABLE(macos(10.13.4), ios(14.0));
- (void)_webView:(WKWebView *)webView decidePolicyForSOAuthorizationLoadWithCurrentPolicy:(_WKSOAuthorizationLoadPolicy)policy forExtension:(NSString *)extension completionHandler:(void (^)(_WKSOAuthorizationLoadPolicy policy))completionHandler WK_API_AVAILABLE(macos(10.15), ios(13.0));

- (void)_webView:(WKWebView *)webView didGeneratePageLoadTiming:(_WKPageLoadTiming *)timing WK_API_AVAILABLE(macos(WK_MAC_TBA), ios(WK_IOS_TBA), visionos(WK_XROS_TBA));

@end
