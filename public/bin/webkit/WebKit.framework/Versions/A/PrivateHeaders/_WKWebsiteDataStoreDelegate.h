/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

@class UNNotification;
@class WKSecurityOrigin;
@class WKWebsiteDataStore;
@class WKWebView;
@class _WKNotificationData;

/*! @enum WKNavigationActionPolicy
 @abstract The policy to pass back to the decision handler from the
 webView:decidePolicyForNavigationAction:decisionHandler: method.
 @constant WKNavigationActionPolicyCancel   Cancel the navigation.
 @constant WKNavigationActionPolicyAllow    Allow the navigation to continue.
 @constant WKNavigationActionPolicyDownload    Turn the navigation into a download.
 */
typedef NS_ENUM(NSInteger, WKBackgroundFetchChange) {
    WKBackgroundFetchChangeAddition,
    WKBackgroundFetchChangeRemoval,
    WKBackgroundFetchChangeUpdate,
} WK_API_AVAILABLE(macos(14.0), ios(17.0));

typedef NS_ENUM(NSInteger, WKWindowProxyProperty) {
    WKWindowProxyPropertyInitialOpen,
    WKWindowProxyPropertyPostMessage,
    WKWindowProxyPropertyClosed,
    WKWindowProxyPropertyOther,
} WK_API_AVAILABLE(macos(14.4), ios(17.4), visionos(1.1));

#define HAVE_WK_WINDOW_PROXY_PROPERTY 1

WK_API_AVAILABLE(macos(10.15), ios(13.0))
@protocol _WKWebsiteDataStoreDelegate <NSObject>

@optional
- (void)requestStorageSpace:(NSURL *)mainFrameURL frameOrigin:(NSURL *)frameURL quota:(NSUInteger)quota currentSize:(NSUInteger)currentSize spaceRequired:(NSUInteger)spaceRequired decisionHandler:(void (^)(unsigned long long quota))decisionHandler;
- (void)didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition disposition, NSURLCredential *credential))completionHandler;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore openWindow:(NSURL *)url fromServiceWorkerOrigin:(WKSecurityOrigin *)serviceWorkerOrigin completionHandler:(void (^)(WKWebView *newWebView))completionHandler;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore reportServiceWorkerConsoleMessage:(NSString *)message;
- (NSDictionary<NSString *, NSNumber *> *)notificationPermissionsForWebsiteDataStore:(WKWebsiteDataStore *)dataStore;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore showNotification:(_WKNotificationData *)notificationData;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore workerOrigin:(WKSecurityOrigin *)workerOrigin updatedAppBadge:(NSNumber *)badge;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore getDisplayedNotificationsForWorkerOrigin:(WKSecurityOrigin *)workerOrigin completionHandler:(void (^)(NSArray<NSDictionary *> *))completionHandler;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore navigateToNotificationActionURL:(NSURL *)url;
- (void)requestBackgroundFetchPermission:(NSURL *)mainFrameURL frameOrigin:(NSURL *)frameURL  decisionHandler:(void (^)(bool isGranted))decisionHandler;
- (void)notifyBackgroundFetchChange:(NSString *)backgroundFetchIdentifier change:(WKBackgroundFetchChange)change;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore domain:(NSString *)registrableDomain didOpenDomainViaWindowOpen:(NSString *)openedRegistrableDomain withProperty:(WKWindowProxyProperty)property directly:(BOOL)directly;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore didAllowPrivateTokenUsageByThirdPartyForTesting:(BOOL)wasAllowed forResourceURL:(NSURL *)resourceURL;
- (void)websiteDataStore:(WKWebsiteDataStore *)dataStore domain:(NSString *)registrableDomain didExceedMemoryFootprintThreshold:(size_t)footprint withPageCount:(NSUInteger)pageCount processLifetime:(NSTimeInterval)processLifetime inForeground:(BOOL)inForeground wasPrivateRelayed:(BOOL)wasPrivateRelayed canSuspend:(BOOL)canSuspend;
- (void)webCryptoMasterKey:(void (^)(NSData *))completionHandler WK_API_AVAILABLE(macos(15.0), ios(18.0));
@end
