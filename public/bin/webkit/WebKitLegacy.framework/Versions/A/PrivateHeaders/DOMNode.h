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

#import <WebKitLegacy/DOMObject.h>
#import <WebKitLegacy/DOMEventTarget.h>

@class DOMDocument;
@class DOMElement;
@class DOMNamedNodeMap;
@class DOMNode;
@class DOMNodeList;
@class NSString;

enum {
    DOM_ELEMENT_NODE = 1,
    DOM_ATTRIBUTE_NODE = 2,
    DOM_TEXT_NODE = 3,
    DOM_CDATA_SECTION_NODE = 4,
    DOM_ENTITY_REFERENCE_NODE = 5,
    DOM_ENTITY_NODE = 6,
    DOM_PROCESSING_INSTRUCTION_NODE = 7,
    DOM_COMMENT_NODE = 8,
    DOM_DOCUMENT_NODE = 9,
    DOM_DOCUMENT_TYPE_NODE = 10,
    DOM_DOCUMENT_FRAGMENT_NODE = 11,
    DOM_NOTATION_NODE = 12,
    DOM_DOCUMENT_POSITION_DISCONNECTED = 0x01,
    DOM_DOCUMENT_POSITION_PRECEDING = 0x02,
    DOM_DOCUMENT_POSITION_FOLLOWING = 0x04,
    DOM_DOCUMENT_POSITION_CONTAINS = 0x08,
    DOM_DOCUMENT_POSITION_CONTAINED_BY = 0x10,
    DOM_DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20
} WEBKIT_ENUM_DEPRECATED_MAC(10_4, 10_14);

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMNode : DOMObject <DOMEventTarget>
@property (readonly, copy) NSString *nodeName;
@property (copy) NSString *nodeValue;
@property (readonly) unsigned short nodeType;
@property (readonly, strong) DOMNode *parentNode;
@property (readonly, strong) DOMNodeList *childNodes;
@property (readonly, strong) DOMNode *firstChild;
@property (readonly, strong) DOMNode *lastChild;
@property (readonly, strong) DOMNode *previousSibling;
@property (readonly, strong) DOMNode *nextSibling;
@property (readonly, strong) DOMDocument *ownerDocument;
@property (readonly, copy) NSString *namespaceURI;
@property (copy) NSString *prefix;
@property (readonly, copy) NSString *localName;
@property (readonly, strong) DOMNamedNodeMap *attributes;
@property (readonly, copy) NSString *baseURI WEBKIT_AVAILABLE_MAC(10_5);
@property (copy) NSString *textContent WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, strong) DOMElement *parentElement WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly) BOOL isContentEditable WEBKIT_AVAILABLE_MAC(10_5);

- (DOMNode *)insertBefore:(DOMNode *)newChild refChild:(DOMNode *)refChild WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNode *)replaceChild:(DOMNode *)newChild oldChild:(DOMNode *)oldChild WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNode *)removeChild:(DOMNode *)oldChild;
- (DOMNode *)appendChild:(DOMNode *)newChild;
- (BOOL)hasChildNodes;
- (DOMNode *)cloneNode:(BOOL)deep;
- (void)normalize;
- (BOOL)isSupported:(NSString *)feature version:(NSString *)version WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)hasAttributes;
- (BOOL)isSameNode:(DOMNode *)other WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)isEqualNode:(DOMNode *)other WEBKIT_AVAILABLE_MAC(10_5);
- (NSString *)lookupPrefix:(NSString *)namespaceURI WEBKIT_AVAILABLE_MAC(10_5);
- (NSString *)lookupNamespaceURI:(NSString *)prefix WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)isDefaultNamespace:(NSString *)namespaceURI WEBKIT_AVAILABLE_MAC(10_5);
- (unsigned short)compareDocumentPosition:(DOMNode *)other WEBKIT_AVAILABLE_MAC(10_6);
- (BOOL)contains:(DOMNode *)other WEBKIT_AVAILABLE_MAC(10_5);
@end

@interface DOMNode (DOMNodeDeprecated)
- (DOMNode *)insertBefore:(DOMNode *)newChild :(DOMNode *)refChild WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMNode *)replaceChild:(DOMNode *)newChild :(DOMNode *)oldChild WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (BOOL)isSupported:(NSString *)feature :(NSString *)version WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
