/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#import <WebKit/WKUserContentController.h>

@class WKContentWorld;
@class WKUserScript;
@class _WKUserContentFilter;
@class _WKUserContentWorld;
@class _WKUserStyleSheet;

@interface WKUserContentController (WKPrivate)

- (void)_removeUserScript:(WKUserScript *)userScript WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_removeAllUserScriptsAssociatedWithContentWorld:(WKContentWorld *)contentWorld WK_API_AVAILABLE(macos(11.0), ios(14.0));

- (void)_addUserScriptImmediately:(WKUserScript *)userScript WK_API_AVAILABLE(macos(10.14), ios(12.0));

// FIXME: Remove this once rdar://100785999 is unblocked.
- (void)_addUserContentFilter:(_WKUserContentFilter *)userContentFilter WK_API_DEPRECATED_WITH_REPLACEMENT("addContentRuleList", macos(10.11, 13.3), ios(9.0, 16.4));

- (void)_removeUserContentFilter:(NSString *)userContentFilterName WK_API_AVAILABLE(macos(10.11), ios(9.0));
- (void)_removeAllUserContentFilters WK_API_AVAILABLE(macos(10.11), ios(9.0));
- (void)_addContentRuleList:(WKContentRuleList *)contentRuleList extensionBaseURL:(NSURL *)extensionBaseURL WK_API_AVAILABLE(macos(13.0), ios(16.0));

@property (nonatomic, readonly, copy) NSArray<_WKUserStyleSheet *> *_userStyleSheets WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_addUserStyleSheet:(_WKUserStyleSheet *)userStyleSheet WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_removeUserStyleSheet:(_WKUserStyleSheet *)userStyleSheet WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_removeAllUserStyleSheets WK_API_AVAILABLE(macos(10.12), ios(10.0));
- (void)_removeAllUserStyleSheetsAssociatedWithContentWorld:(WKContentWorld *)contentWorld WK_API_AVAILABLE(macos(11.0), ios(14.0));

- (void)_addScriptMessageHandler:(id <WKScriptMessageHandler>)scriptMessageHandler name:(NSString *)name userContentWorld:(_WKUserContentWorld *)userContentWorld WK_API_DEPRECATED_WITH_REPLACEMENT("_addScriptMessageHandler:name:contentWorld:", macos(10.11, 11.0), ios(9.0, 14.0));
- (void)_addScriptMessageHandler:(id <WKScriptMessageHandler>)scriptMessageHandler name:(NSString *)name contentWorld:(WKContentWorld *)contentWorld;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)_removeScriptMessageHandlerForName:(NSString *)name userContentWorld:(_WKUserContentWorld *)userContentWorld;
- (void)_removeAllScriptMessageHandlersAssociatedWithUserContentWorld:(_WKUserContentWorld *)userContentWorld;
#pragma clang diagnostic pop

@end
