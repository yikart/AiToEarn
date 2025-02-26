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

#import <WebKitLegacy/DOMEvent.h>

@class DOMAbstractView;
@class NSString;

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMUIEvent : DOMEvent
@property (readonly, strong) DOMAbstractView *view;
@property (readonly) int detail;
@property (readonly) int keyCode WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int charCode WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int layerX WEBKIT_DEPRECATED_MAC(10_5, 10_5);
@property (readonly) int layerY WEBKIT_DEPRECATED_MAC(10_5, 10_5);
@property (readonly) int pageX WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int pageY WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int which WEBKIT_AVAILABLE_MAC(10_5);

- (void)initUIEvent:(NSString *)type canBubble:(BOOL)canBubble cancelable:(BOOL)cancelable view:(DOMAbstractView *)view detail:(int)detail WEBKIT_AVAILABLE_MAC(10_5);
@end

@interface DOMUIEvent (DOMUIEventDeprecated)
- (void)initUIEvent:(NSString *)type :(BOOL)canBubble :(BOOL)cancelable :(DOMAbstractView *)view :(int)detail WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
