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

#import <WebKit/WKFoundation.h>

#import <Foundation/Foundation.h>

/**
 * WKInputType exposes a subset of all known input types enumerated in
 * WebKit::InputType. While there is currently a one-to-one mapping, we
 * need to consider how we should expose certain input types.
 */
typedef NS_ENUM(NSInteger, WKInputType) {
    WKInputTypeNone,
    WKInputTypeContentEditable,
    WKInputTypeText,
    WKInputTypePassword,
    WKInputTypeTextArea,
    WKInputTypeSearch,
    WKInputTypeEmail,
    WKInputTypeURL,
    WKInputTypePhone,
    WKInputTypeNumber,
    WKInputTypeNumberPad,
    WKInputTypeDate,
    WKInputTypeDateTime,
    WKInputTypeDateTimeLocal,
    WKInputTypeMonth,
    WKInputTypeWeek,
    WKInputTypeTime,
    WKInputTypeSelect,
    WKInputTypeColor,
    WKInputTypeDrawing,
};

/**
 * The _WKFocusedElementInfo provides basic information about an element that
 * has been focused (either programmatically or through user interaction) but
 * is not causing any input UI (e.g. keyboard, date picker, etc.) to be shown.
 */
@protocol _WKFocusedElementInfo <NSObject>

/* The type of the input element that was focused. */
@property (nonatomic, readonly) WKInputType type;

/* The value of the input at the time it was focused. */
@property (nonatomic, readonly, copy) NSString *value;

/* The placeholder text of the input. */
@property (nonatomic, readonly, copy) NSString *placeholder;

/* The text of a label element associated with the input. */
@property (nonatomic, readonly, copy) NSString *label;

/**
 * Whether the element was focused due to user interaction. NO indicates that
 * the element was focused programmatically, e.g. by calling focus() in JavaScript
 * or by using the autofocus attribute.
 */
@property (nonatomic, readonly, getter=isUserInitiated) BOOL userInitiated;

@property (nonatomic, readonly) NSObject <NSSecureCoding> *userObject WK_API_AVAILABLE(macos(10.13.4), ios(11.3));

@end
