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
#import <WebKit/_WKFocusedElementInfo.h>

@class UITextSuggestion;

@protocol _WKFormInputSession <NSObject>

@property (nonatomic, readonly, getter=isValid) BOOL valid;
@property (nonatomic, readonly) NSObject <NSSecureCoding> *userObject;
@property (nonatomic, readonly) id <_WKFocusedElementInfo> focusedElementInfo WK_API_AVAILABLE(macos(10.12), ios(10.0));

#if TARGET_OS_IPHONE
@property (nonatomic, copy) NSString *accessoryViewCustomButtonTitle;
@property (nonatomic, strong) UIView *customInputView WK_API_AVAILABLE(ios(10.0));
@property (nonatomic, strong) UIView *customInputAccessoryView WK_API_AVAILABLE(ios(12.2));
@property (nonatomic, copy) NSArray<UITextSuggestion *> *suggestions WK_API_AVAILABLE(ios(10.0));
@property (nonatomic) BOOL accessoryViewShouldNotShow WK_API_AVAILABLE(ios(10.0));
@property (nonatomic) BOOL forceSecureTextEntry WK_API_AVAILABLE(ios(10.0));
@property (nonatomic, readonly) BOOL requiresStrongPasswordAssistance WK_API_AVAILABLE(ios(12.0));

- (void)reloadFocusedElementContextView WK_API_AVAILABLE(ios(12.0));
#endif

@end
