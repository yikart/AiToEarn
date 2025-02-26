/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

/*! @constant WKErrorDomain Indicates a WebKit error. */
WK_EXTERN NSString * const WKErrorDomain WK_API_AVAILABLE(macos(10.10), ios(8.0));

/*! @enum WKErrorCode
 @abstract Constants used by NSError to indicate errors in the WebKit domain.
 @constant WKErrorUnknown                              Indicates that an unknown error occurred.
 @constant WKErrorWebContentProcessTerminated          Indicates that the Web Content process was terminated.
 @constant WKErrorWebViewInvalidated                   Indicates that the WKWebView was invalidated.
 @constant WKErrorJavaScriptExceptionOccurred          Indicates that a JavaScript exception occurred.
 @constant WKErrorJavaScriptResultTypeIsUnsupported    Indicates that the result of JavaScript execution could not be returned.
 @constant WKErrorContentRuleListStoreCompileFailed    Indicates that compiling a WKUserContentRuleList failed.
 @constant WKErrorContentRuleListStoreLookUpFailed     Indicates that looking up a WKUserContentRuleList failed.
 @constant WKErrorContentRuleListStoreRemoveFailed     Indicates that removing a WKUserContentRuleList failed.
 @constant WKErrorContentRuleListStoreVersionMismatch  Indicates that the WKUserContentRuleList version did not match the latest.
 @constant WKErrorAttributedStringContentFailedToLoad  Indicates that the attributed string content failed to load.
 @constant WKErrorAttributedStringContentLoadTimedOut  Indicates that loading attributed string content timed out.
 @constant WKErrorNavigationAppBoundDomain  Indicates that a navigation failed due to an app-bound domain restriction.
 @constant WKErrorJavaScriptAppBoundDomain  Indicates that JavaScript execution failed due to an app-bound domain restriction.
 */
typedef NS_ENUM(NSInteger, WKErrorCode) {
    WKErrorUnknown = 1,
    WKErrorWebContentProcessTerminated,
    WKErrorWebViewInvalidated,
    WKErrorJavaScriptExceptionOccurred,
    WKErrorJavaScriptResultTypeIsUnsupported WK_API_AVAILABLE(macos(10.11), ios(9.0)),
    WKErrorContentRuleListStoreCompileFailed WK_API_AVAILABLE(macos(10.13), ios(11.0)),
    WKErrorContentRuleListStoreLookUpFailed WK_API_AVAILABLE(macos(10.13), ios(11.0)),
    WKErrorContentRuleListStoreRemoveFailed WK_API_AVAILABLE(macos(10.13), ios(11.0)),
    WKErrorContentRuleListStoreVersionMismatch WK_API_AVAILABLE(macos(10.13), ios(11.0)),
    WKErrorAttributedStringContentFailedToLoad WK_API_AVAILABLE(macos(10.15), ios(13.0)),
    WKErrorAttributedStringContentLoadTimedOut WK_API_AVAILABLE(macos(10.15), ios(13.0)),
    WKErrorJavaScriptInvalidFrameTarget WK_API_AVAILABLE(macos(11.0), ios(14.0)),
    WKErrorNavigationAppBoundDomain WK_API_AVAILABLE(macos(11.0), ios(14.0)),
    WKErrorJavaScriptAppBoundDomain WK_API_AVAILABLE(macos(11.0), ios(14.0)),
    WKErrorDuplicateCredential WK_API_AVAILABLE(macos(13.0), ios(16.0)),
    WKErrorMalformedCredential WK_API_AVAILABLE(macos(13.0), ios(16.0)),
    WKErrorCredentialNotFound WK_API_AVAILABLE(macos(13.0), ios(16.0)),
} WK_API_AVAILABLE(macos(10.10), ios(8.0));

NS_ASSUME_NONNULL_END
