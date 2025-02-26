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

#import <WebKitLegacy/DOMHTMLElement.h>

@class DOMHTMLElement;
@class DOMHTMLFormElement;
@class DOMHTMLOptionsCollection;
@class DOMNode;
@class NSString;

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMHTMLSelectElement : DOMHTMLElement
@property BOOL autofocus WEBKIT_AVAILABLE_MAC(10_6);
@property BOOL disabled;
@property (readonly, strong) DOMHTMLFormElement *form;
@property BOOL multiple;
@property (copy) NSString *name;
@property int size;
@property (readonly, copy) NSString *type;
@property (readonly, strong) DOMHTMLOptionsCollection *options;
@property (readonly) int length;
@property int selectedIndex;
@property (copy) NSString *value;
@property (readonly) BOOL willValidate WEBKIT_AVAILABLE_MAC(10_6);

- (DOMNode *)item:(unsigned)index WEBKIT_AVAILABLE_MAC(10_6);
- (DOMNode *)namedItem:(NSString *)name WEBKIT_AVAILABLE_MAC(10_6);
- (void)add:(DOMHTMLElement *)element before:(DOMHTMLElement *)before WEBKIT_AVAILABLE_MAC(10_5);
- (void)remove:(int)index;
@end

@interface DOMHTMLSelectElement (DOMHTMLSelectElementDeprecated)
- (void)add:(DOMHTMLElement *)element :(DOMHTMLElement *)before WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
