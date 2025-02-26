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


#import <WebKit/WKFoundation.h>

typedef NS_ENUM(NSInteger, _WKWebPushPermissionState) {
    _WKWebPushPermissionStateDenied,
    _WKWebPushPermissionStateGranted,
    _WKWebPushPermissionStatePrompt,
};

@class WKSecurityOrigin;
@class _WKNotificationData;
@class _WKWebPushMessage;
@class _WKWebPushSubscriptionData;

NS_ASSUME_NONNULL_BEGIN

WK_EXTERN
@interface _WKWebPushDaemonConnectionConfiguration : NSObject

- (instancetype)init;
@property (nonatomic, copy) NSString *machServiceName;
@property (nonatomic, copy) NSString *partition;
@property (nonatomic, assign) audit_token_t hostApplicationAuditToken;
@property (nonatomic, copy) NSString *bundleIdentifierOverrideForTesting;
@end

WK_EXTERN
@interface _WKWebPushDaemonConnection : NSObject

+ (instancetype)new NS_UNAVAILABLE;
- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithConfiguration:(_WKWebPushDaemonConnectionConfiguration *)configuration;

- (void)getPushPermissionStateForOrigin:(NSURL *)origin completionHandler:(void (^)(_WKWebPushPermissionState))completionHandler;
- (void)requestPushPermissionForOrigin:(NSURL *)origin completionHandler:(void (^)(BOOL))completionHandler;
- (void)setAppBadge:(NSUInteger *)badge origin:(NSURL *)origin;
- (void)subscribeToPushServiceForScope:(NSURL *)scopeURL applicationServerKey:(NSData *)key completionHandler:(void (^)(_WKWebPushSubscriptionData *, NSError *))completionHandler;
- (void)unsubscribeFromPushServiceForScope:(NSURL *)scopeURL completionHandler:(void (^)(BOOL unsubscribed, NSError *))completionHandler;
- (void)getSubscriptionForScope:(NSURL *)scopeURL completionHandler:(void (^)(_WKWebPushSubscriptionData *, NSError *))completionHandler;
- (void)getNextPendingPushMessage:(void (^)(_WKWebPushMessage *))completionHandler;
- (void)showNotification:(_WKNotificationData *)notificationData completionHandler:(void (^)())completionHandler;
- (void)getNotifications:(NSURL *)scopeURL tag:(NSString *)tag completionHandler:(void (^)(NSArray<_WKNotificationData *> *, NSError *))completionHandler;
- (void)cancelNotification:(NSURL *)securityOriginURL uuid:(NSUUID *)notificationIdentifier;

@end

NS_ASSUME_NONNULL_END
