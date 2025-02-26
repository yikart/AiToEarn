/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

@class WKBrowsingContextController;

/* Constants for policy action dictionaries */
WK_EXTERN NSString * const WKActionIsMainFrameKey;         // NSNumber (BOOL)
WK_EXTERN NSString * const WKActionMouseButtonKey;         // NSNumber (0 for left button, 1 for middle button, 2 for right button)
WK_EXTERN NSString * const WKActionModifierFlagsKey;       // NSNumber (unsigned)
WK_EXTERN NSString * const WKActionOriginalURLRequestKey;  // NSURLRequest
WK_EXTERN NSString * const WKActionURLRequestKey;          // NSURLRequest
WK_EXTERN NSString * const WKActionURLResponseKey;         // NSURLResponse
WK_EXTERN NSString * const WKActionFrameNameKey;           // NSString
WK_EXTERN NSString * const WKActionOriginatingFrameURLKey; // NSURL
WK_EXTERN NSString * const WKActionCanShowMIMETypeKey;     // NSNumber (BOOL)

typedef NS_ENUM(NSUInteger, WKPolicyDecision) {
    WKPolicyDecisionCancel,
    WKPolicyDecisionAllow,
    WKPolicyDecisionBecomeDownload
};

typedef void (^WKPolicyDecisionHandler)(WKPolicyDecision);

WK_CLASS_DEPRECATED_WITH_REPLACEMENT("WKNavigationDelegate", macos(10.10, 10.14.4), ios(8.0, 12.2))
@protocol WKBrowsingContextPolicyDelegate <NSObject>
@optional

- (void)browsingContextController:(WKBrowsingContextController *)sender decidePolicyForNavigationAction:(NSDictionary *)actionInformation decisionHandler:(WKPolicyDecisionHandler)decisionHandler;
- (void)browsingContextController:(WKBrowsingContextController *)sender decidePolicyForNewWindowAction:(NSDictionary *)actionInformation decisionHandler:(WKPolicyDecisionHandler)decisionHandler;
- (void)browsingContextController:(WKBrowsingContextController *)sender decidePolicyForResponseAction:(NSDictionary *)actionInformation decisionHandler:(WKPolicyDecisionHandler)decisionHandler;

@end
