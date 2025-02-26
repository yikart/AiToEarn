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

#import <WebKit/WKError.h>

WK_EXTERN NSString * const _WKLegacyErrorDomain WK_API_AVAILABLE(macos(10.11), ios(8.3));

typedef NS_ENUM(NSInteger, _WKLegacyErrorCode) {
    _WKErrorCodeCannotShowURL WK_API_AVAILABLE(macos(13.3), ios(16.4)) = 101,
    _WKErrorCodeFrameLoadInterruptedByPolicyChange WK_API_AVAILABLE(macos(10.11), ios(9.0)) = 102,
    _WKErrorCodeFrameLoadBlockedByContentBlocker WK_API_AVAILABLE(macos(13.3), ios(16.4)) = 104,
    _WKErrorCodeFrameLoadBlockedByRestrictions WK_API_AVAILABLE(macos(10.15), ios(13.0)) = 106,
    _WKErrorCodeHTTPSUpgradeRedirectLoop WK_API_AVAILABLE(macos(14.0), ios(17.0)) = 304,
    _WKErrorCodeHTTPNavigationWithHTTPSOnly WK_API_AVAILABLE(macos(14.0), ios(17.0)) = 305,
    _WKLegacyErrorPlugInWillHandleLoad = 204,
} WK_API_AVAILABLE(macos(10.11), ios(8.3));

/*! @constant _WKJavaScriptExceptionMessageErrorKey Key in userInfo representing
 the exception message (as an NSString) for WKErrorJavaScriptExceptionOccurred errors. */
WK_EXTERN NSString * const _WKJavaScriptExceptionMessageErrorKey WK_API_AVAILABLE(macos(10.12), ios(10.0));

/*! @constant _WKJavaScriptExceptionLineNumberErrorKey Key in userInfo representing
 the exception line number (as an NSNumber) for WKErrorJavaScriptExceptionOccurred errors. */
WK_EXTERN NSString * const _WKJavaScriptExceptionLineNumberErrorKey WK_API_AVAILABLE(macos(10.12), ios(10.0));

/*! @constant _WKJavaScriptExceptionColumnNumberErrorKey Key in userInfo representing
 the exception column number (as an NSNumber) for WKErrorJavaScriptExceptionOccurred errors. */
WK_EXTERN NSString * const _WKJavaScriptExceptionColumnNumberErrorKey WK_API_AVAILABLE(macos(10.12), ios(10.0));

/*! @constant _WKJavaScriptExceptionSourceURLErrorKey Key in userInfo representing
 the exception source URL (as an NSURL) for WKErrorJavaScriptExceptionOccurred errors. */
WK_EXTERN NSString * const _WKJavaScriptExceptionSourceURLErrorKey WK_API_AVAILABLE(macos(10.12), ios(10.0));
