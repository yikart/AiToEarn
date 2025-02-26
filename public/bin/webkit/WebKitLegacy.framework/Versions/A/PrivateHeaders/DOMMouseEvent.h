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
@class DOMNode;
@class NSString;
@protocol DOMEventTarget;

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMMouseEvent : DOMUIEvent
@property (readonly) int screenX;
@property (readonly) int screenY;
@property (readonly) int clientX;
@property (readonly) int clientY;
@property (readonly) BOOL ctrlKey;
@property (readonly) BOOL shiftKey;
@property (readonly) BOOL altKey;
@property (readonly) BOOL metaKey;
@property (readonly) short button;
@property (readonly, strong) id <DOMEventTarget> relatedTarget;
@property (readonly) int offsetX WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int offsetY WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int x WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int y WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, strong) DOMNode *fromElement WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, strong) DOMNode *toElement WEBKIT_AVAILABLE_MAC(10_5);

- (void)initMouseEvent:(NSString *)type canBubble:(BOOL)canBubble cancelable:(BOOL)cancelable view:(DOMAbstractView *)view detail:(int)detail screenX:(int)screenX screenY:(int)screenY clientX:(int)clientX clientY:(int)clientY ctrlKey:(BOOL)ctrlKey altKey:(BOOL)altKey shiftKey:(BOOL)shiftKey metaKey:(BOOL)metaKey button:(unsigned short)button relatedTarget:(id <DOMEventTarget>)relatedTarget WEBKIT_AVAILABLE_MAC(10_5);
@end

@interface DOMMouseEvent (DOMMouseEventDeprecated)
- (void)initMouseEvent:(NSString *)type :(BOOL)canBubble :(BOOL)cancelable :(DOMAbstractView *)view :(int)detail :(int)screenX :(int)screenY :(int)clientX :(int)clientY :(BOOL)ctrlKey :(BOOL)altKey :(BOOL)shiftKey :(BOOL)metaKey :(unsigned short)button :(id <DOMEventTarget>)relatedTarget WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
