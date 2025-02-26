/*
 * Copyright (C) 2004-2016 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <WebKitLegacy/DOMUIEvent.h>

@class DOMAbstractView;
@class NSString;

enum {
    DOM_KEY_LOCATION_STANDARD = 0x00,
    DOM_KEY_LOCATION_LEFT = 0x01,
    DOM_KEY_LOCATION_RIGHT = 0x02,
    DOM_KEY_LOCATION_NUMPAD = 0x03
} WEBKIT_ENUM_DEPRECATED_MAC(10_5, 10_14);

WEBKIT_CLASS_DEPRECATED_MAC(10_5, 10_14)
@interface DOMKeyboardEvent : DOMUIEvent
@property (readonly, copy) NSString *keyIdentifier;
@property (readonly) unsigned location WEBKIT_AVAILABLE_MAC(10_8);
@property (readonly) unsigned keyLocation WEBKIT_DEPRECATED_MAC(10_5, 10_5);
@property (readonly) BOOL ctrlKey;
@property (readonly) BOOL shiftKey;
@property (readonly) BOOL altKey;
@property (readonly) BOOL metaKey;
@property (readonly) BOOL altGraphKey WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int keyCode;
@property (readonly) int charCode;

- (BOOL)getModifierState:(NSString *)keyIdentifierArg;
- (void)initKeyboardEvent:(NSString *)type canBubble:(BOOL)canBubble cancelable:(BOOL)cancelable view:(DOMAbstractView *)view keyIdentifier:(NSString *)keyIdentifier location:(unsigned)location ctrlKey:(BOOL)ctrlKey altKey:(BOOL)altKey shiftKey:(BOOL)shiftKey metaKey:(BOOL)metaKey altGraphKey:(BOOL)altGraphKey WEBKIT_AVAILABLE_MAC(10_8);
- (void)initKeyboardEvent:(NSString *)type canBubble:(BOOL)canBubble cancelable:(BOOL)cancelable view:(DOMAbstractView *)view keyIdentifier:(NSString *)keyIdentifier location:(unsigned)location ctrlKey:(BOOL)ctrlKey altKey:(BOOL)altKey shiftKey:(BOOL)shiftKey metaKey:(BOOL)metaKey WEBKIT_AVAILABLE_MAC(10_8);
- (void)initKeyboardEvent:(NSString *)type canBubble:(BOOL)canBubble cancelable:(BOOL)cancelable view:(DOMAbstractView *)view keyIdentifier:(NSString *)keyIdentifier keyLocation:(unsigned)keyLocation ctrlKey:(BOOL)ctrlKey altKey:(BOOL)altKey shiftKey:(BOOL)shiftKey metaKey:(BOOL)metaKey altGraphKey:(BOOL)altGraphKey WEBKIT_DEPRECATED_MAC(10_5, 10_5);
- (void)initKeyboardEvent:(NSString *)type canBubble:(BOOL)canBubble cancelable:(BOOL)cancelable view:(DOMAbstractView *)view keyIdentifier:(NSString *)keyIdentifier keyLocation:(unsigned)keyLocation ctrlKey:(BOOL)ctrlKey altKey:(BOOL)altKey shiftKey:(BOOL)shiftKey metaKey:(BOOL)metaKey WEBKIT_DEPRECATED_MAC(10_5, 10_5);
@end
