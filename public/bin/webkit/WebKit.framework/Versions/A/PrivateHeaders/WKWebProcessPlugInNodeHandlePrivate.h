/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#import <WebKit/WKWebProcessPlugInNodeHandle.h>

typedef NS_ENUM(NSInteger, _WKAutoFillButtonType) {
    _WKAutoFillButtonTypeNone,
    _WKAutoFillButtonTypeCredentials,
    _WKAutoFillButtonTypeContacts,
    _WKAutoFillButtonTypeStrongPassword,
    _WKAutoFillButtonTypeCreditCard WK_API_AVAILABLE(macos(10.14.4), ios(12.2)),
    _WKAutoFillButtonTypeLoading WK_API_AVAILABLE(macos(13.0), ios(16.0)),
} WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

@interface WKWebProcessPlugInNodeHandle (WKPrivate)

- (BOOL)isHTMLInputElementAutoFillButtonEnabled WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
- (void)setHTMLInputElementAutoFillButtonEnabledWithButtonType:(_WKAutoFillButtonType)autoFillButtonType WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
- (_WKAutoFillButtonType)htmlInputElementAutoFillButtonType WK_API_AVAILABLE(macos(10.13.4), ios(11.3));
- (_WKAutoFillButtonType)htmlInputElementLastAutoFillButtonType WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

@end
