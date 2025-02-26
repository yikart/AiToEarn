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

#import <WebKit/DOMNode.h>

@class DOMAttr;
@class DOMCSSStyleDeclaration;
@class DOMElement;
@class DOMNodeList;
@class NSString;

enum {
    DOM_ALLOW_KEYBOARD_INPUT = 1
} WEBKIT_ENUM_DEPRECATED_MAC(10_4, 10_14);

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMElement : DOMNode
@property (readonly, copy) NSString *tagName;
@property (readonly, strong) DOMCSSStyleDeclaration *style;
@property (readonly) int offsetLeft;
@property (readonly) int offsetTop;
@property (readonly) int offsetWidth;
@property (readonly) int offsetHeight;
@property (readonly) int clientLeft WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int clientTop WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) int clientWidth;
@property (readonly) int clientHeight;
@property int scrollLeft;
@property int scrollTop;
@property (readonly) int scrollWidth;
@property (readonly) int scrollHeight;
@property (readonly, strong) DOMElement *offsetParent;
@property (copy) NSString *innerHTML;
@property (copy) NSString *outerHTML;
@property (copy) NSString *className;
@property (readonly, copy) NSString *innerText WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, strong) DOMElement *previousElementSibling WEBKIT_AVAILABLE_MAC(10_6);
@property (readonly, strong) DOMElement *nextElementSibling WEBKIT_AVAILABLE_MAC(10_6);
@property (readonly, strong) DOMElement *firstElementChild WEBKIT_AVAILABLE_MAC(10_6);
@property (readonly, strong) DOMElement *lastElementChild WEBKIT_AVAILABLE_MAC(10_6);
@property (readonly) unsigned childElementCount WEBKIT_AVAILABLE_MAC(10_6);

- (NSString *)getAttribute:(NSString *)name;
- (void)setAttribute:(NSString *)name value:(NSString *)value WEBKIT_AVAILABLE_MAC(10_5);
- (void)removeAttribute:(NSString *)name;
- (DOMAttr *)getAttributeNode:(NSString *)name;
- (DOMAttr *)setAttributeNode:(DOMAttr *)newAttr;
- (DOMAttr *)removeAttributeNode:(DOMAttr *)oldAttr;
- (DOMNodeList *)getElementsByTagName:(NSString *)name;
- (NSString *)getAttributeNS:(NSString *)namespaceURI localName:(NSString *)localName WEBKIT_AVAILABLE_MAC(10_5);
- (void)setAttributeNS:(NSString *)namespaceURI qualifiedName:(NSString *)qualifiedName value:(NSString *)value WEBKIT_AVAILABLE_MAC(10_5);
- (void)removeAttributeNS:(NSString *)namespaceURI localName:(NSString *)localName WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNodeList *)getElementsByTagNameNS:(NSString *)namespaceURI localName:(NSString *)localName WEBKIT_AVAILABLE_MAC(10_5);
- (DOMAttr *)getAttributeNodeNS:(NSString *)namespaceURI localName:(NSString *)localName WEBKIT_AVAILABLE_MAC(10_5);
- (DOMAttr *)setAttributeNodeNS:(DOMAttr *)newAttr;
- (BOOL)hasAttribute:(NSString *)name;
- (BOOL)hasAttributeNS:(NSString *)namespaceURI localName:(NSString *)localName WEBKIT_AVAILABLE_MAC(10_5);
- (void)focus WEBKIT_AVAILABLE_MAC(10_6);
- (void)blur WEBKIT_AVAILABLE_MAC(10_6);
- (void)scrollIntoView:(BOOL)alignWithTop WEBKIT_AVAILABLE_MAC(10_5);
- (void)scrollIntoViewIfNeeded:(BOOL)centerIfNeeded WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNodeList *)getElementsByClassName:(NSString *)name WEBKIT_AVAILABLE_MAC(10_6);
- (void)webkitRequestFullScreen:(unsigned short)flags WEBKIT_AVAILABLE_MAC(10_6);
- (DOMElement *)querySelector:(NSString *)selectors WEBKIT_AVAILABLE_MAC(10_6);
- (DOMNodeList *)querySelectorAll:(NSString *)selectors WEBKIT_AVAILABLE_MAC(10_6);
@end

@interface DOMElement (DOMElementDeprecated)
- (void)setAttribute:(NSString *)name :(NSString *)value WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (NSString *)getAttributeNS:(NSString *)namespaceURI :(NSString *)localName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (void)setAttributeNS:(NSString *)namespaceURI :(NSString *)qualifiedName :(NSString *)value WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (void)removeAttributeNS:(NSString *)namespaceURI :(NSString *)localName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMNodeList *)getElementsByTagNameNS:(NSString *)namespaceURI :(NSString *)localName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMAttr *)getAttributeNodeNS:(NSString *)namespaceURI :(NSString *)localName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (BOOL)hasAttributeNS:(NSString *)namespaceURI :(NSString *)localName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (void)scrollByLines:(int)lines WEBKIT_DEPRECATED_MAC(10_5, 10_14);
- (void)scrollByPages:(int)pages WEBKIT_DEPRECATED_MAC(10_5, 10_14);
@end
