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

@class DOMAbstractView;
@class DOMAttr;
@class DOMCDATASection;
@class DOMCSSRuleList;
@class DOMCSSStyleDeclaration;
@class DOMComment;
@class DOMDocumentFragment;
@class DOMDocumentType;
@class DOMElement;
@class DOMEntityReference;
@class DOMEvent;
@class DOMHTMLCollection;
@class DOMHTMLElement;
@class DOMImplementation;
@class DOMNode;
@class DOMNodeIterator;
@class DOMNodeList;
@class DOMProcessingInstruction;
@class DOMRange;
@class DOMStyleSheetList;
@class DOMText;
@class DOMTreeWalker;
@class DOMXPathExpression;
@class DOMXPathResult;
@class NSString;
@protocol DOMNodeFilter;
@protocol DOMXPathNSResolver;

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMDocument : DOMNode
@property (readonly, strong) DOMDocumentType *doctype;
@property (readonly, strong) DOMImplementation *implementation;
@property (readonly, strong) DOMElement *documentElement;
@property (readonly, copy) NSString *inputEncoding WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, copy) NSString *xmlEncoding WEBKIT_AVAILABLE_MAC(10_5);
@property (copy) NSString *xmlVersion WEBKIT_AVAILABLE_MAC(10_5);
@property BOOL xmlStandalone WEBKIT_AVAILABLE_MAC(10_5);
@property (copy) NSString *documentURI WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, strong) DOMAbstractView *defaultView;
@property (readonly, strong) DOMStyleSheetList *styleSheets;
@property (copy) NSString *title;
@property (readonly, copy) NSString *referrer;
@property (readonly, copy) NSString *domain;
@property (readonly, copy) NSString *URL;
@property (copy) NSString *cookie;
@property (strong) DOMHTMLElement *body;
@property (readonly, strong) DOMHTMLCollection *images;
@property (readonly, strong) DOMHTMLCollection *applets;
@property (readonly, strong) DOMHTMLCollection *links;
@property (readonly, strong) DOMHTMLCollection *forms;
@property (readonly, strong) DOMHTMLCollection *anchors;
@property (readonly, copy) NSString *lastModified WEBKIT_AVAILABLE_MAC(10_6);
@property (copy) NSString *charset WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, copy) NSString *defaultCharset WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, copy) NSString *readyState WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, copy) NSString *characterSet WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, copy) NSString *preferredStylesheetSet WEBKIT_AVAILABLE_MAC(10_5);
@property (copy) NSString *selectedStylesheetSet WEBKIT_AVAILABLE_MAC(10_5);
@property (readonly, strong) DOMElement *activeElement WEBKIT_AVAILABLE_MAC(10_6);

- (DOMElement *)createElement:(NSString *)tagName;
- (DOMDocumentFragment *)createDocumentFragment;
- (DOMText *)createTextNode:(NSString *)data;
- (DOMComment *)createComment:(NSString *)data;
- (DOMCDATASection *)createCDATASection:(NSString *)data;
- (DOMProcessingInstruction *)createProcessingInstruction:(NSString *)target data:(NSString *)data WEBKIT_AVAILABLE_MAC(10_5);
- (DOMAttr *)createAttribute:(NSString *)name;
- (DOMEntityReference *)createEntityReference:(NSString *)name;
- (DOMNodeList *)getElementsByTagName:(NSString *)tagname;
- (DOMNode *)importNode:(DOMNode *)importedNode deep:(BOOL)deep WEBKIT_AVAILABLE_MAC(10_5);
- (DOMElement *)createElementNS:(NSString *)namespaceURI qualifiedName:(NSString *)qualifiedName WEBKIT_AVAILABLE_MAC(10_5);
- (DOMAttr *)createAttributeNS:(NSString *)namespaceURI qualifiedName:(NSString *)qualifiedName WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNodeList *)getElementsByTagNameNS:(NSString *)namespaceURI localName:(NSString *)localName WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNode *)adoptNode:(DOMNode *)source WEBKIT_AVAILABLE_MAC(10_5);
- (DOMEvent *)createEvent:(NSString *)eventType;
- (DOMRange *)createRange;
- (DOMNodeIterator *)createNodeIterator:(DOMNode *)root whatToShow:(unsigned)whatToShow filter:(id <DOMNodeFilter>)filter expandEntityReferences:(BOOL)expandEntityReferences WEBKIT_AVAILABLE_MAC(10_5);
- (DOMTreeWalker *)createTreeWalker:(DOMNode *)root whatToShow:(unsigned)whatToShow filter:(id <DOMNodeFilter>)filter expandEntityReferences:(BOOL)expandEntityReferences WEBKIT_AVAILABLE_MAC(10_5);
- (DOMCSSStyleDeclaration *)getOverrideStyle:(DOMElement *)element pseudoElement:(NSString *)pseudoElement WEBKIT_AVAILABLE_MAC(10_5);
- (DOMXPathExpression *)createExpression:(NSString *)expression resolver:(id <DOMXPathNSResolver>)resolver WEBKIT_AVAILABLE_MAC(10_5);
- (id <DOMXPathNSResolver>)createNSResolver:(DOMNode *)nodeResolver WEBKIT_AVAILABLE_MAC(10_5);
- (DOMXPathResult *)evaluate:(NSString *)expression contextNode:(DOMNode *)contextNode resolver:(id <DOMXPathNSResolver>)resolver type:(unsigned short)type inResult:(DOMXPathResult *)inResult WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)execCommand:(NSString *)command userInterface:(BOOL)userInterface value:(NSString *)value WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)execCommand:(NSString *)command userInterface:(BOOL)userInterface WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)execCommand:(NSString *)command WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)queryCommandEnabled:(NSString *)command WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)queryCommandIndeterm:(NSString *)command WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)queryCommandState:(NSString *)command WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)queryCommandSupported:(NSString *)command WEBKIT_AVAILABLE_MAC(10_5);
- (NSString *)queryCommandValue:(NSString *)command WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNodeList *)getElementsByName:(NSString *)elementName;
- (DOMElement *)elementFromPoint:(int)x y:(int)y WEBKIT_AVAILABLE_MAC(10_5);
- (DOMCSSStyleDeclaration *)createCSSStyleDeclaration WEBKIT_AVAILABLE_MAC(10_5);
- (DOMCSSStyleDeclaration *)getComputedStyle:(DOMElement *)element pseudoElement:(NSString *)pseudoElement WEBKIT_AVAILABLE_MAC(10_5);
- (DOMCSSRuleList *)getMatchedCSSRules:(DOMElement *)element pseudoElement:(NSString *)pseudoElement WEBKIT_AVAILABLE_MAC(10_5);
- (DOMCSSRuleList *)getMatchedCSSRules:(DOMElement *)element pseudoElement:(NSString *)pseudoElement authorOnly:(BOOL)authorOnly WEBKIT_AVAILABLE_MAC(10_5);
- (DOMNodeList *)getElementsByClassName:(NSString *)classNames WEBKIT_AVAILABLE_MAC(10_6);
- (BOOL)hasFocus WEBKIT_AVAILABLE_MAC(10_6);
- (void)webkitCancelFullScreen WEBKIT_AVAILABLE_MAC(10_6);
- (DOMElement *)getElementById:(NSString *)elementId;
- (DOMElement *)querySelector:(NSString *)selectors WEBKIT_AVAILABLE_MAC(10_6);
- (DOMNodeList *)querySelectorAll:(NSString *)selectors WEBKIT_AVAILABLE_MAC(10_6);
@end

@interface DOMDocument (DOMDocumentDeprecated)
- (DOMProcessingInstruction *)createProcessingInstruction:(NSString *)target :(NSString *)data WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMNode *)importNode:(DOMNode *)importedNode :(BOOL)deep WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMElement *)createElementNS:(NSString *)namespaceURI :(NSString *)qualifiedName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMAttr *)createAttributeNS:(NSString *)namespaceURI :(NSString *)qualifiedName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMNodeList *)getElementsByTagNameNS:(NSString *)namespaceURI :(NSString *)localName WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMNodeIterator *)createNodeIterator:(DOMNode *)root :(unsigned)whatToShow :(id <DOMNodeFilter>)filter :(BOOL)expandEntityReferences WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMTreeWalker *)createTreeWalker:(DOMNode *)root :(unsigned)whatToShow :(id <DOMNodeFilter>)filter :(BOOL)expandEntityReferences WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMCSSStyleDeclaration *)getOverrideStyle:(DOMElement *)element :(NSString *)pseudoElement WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMXPathExpression *)createExpression:(NSString *)expression :(id <DOMXPathNSResolver>)resolver WEBKIT_DEPRECATED_MAC(10_5, 10_5);
- (DOMXPathResult *)evaluate:(NSString *)expression :(DOMNode *)contextNode :(id <DOMXPathNSResolver>)resolver :(unsigned short)type :(DOMXPathResult *)inResult WEBKIT_DEPRECATED_MAC(10_5, 10_5);
- (DOMCSSStyleDeclaration *)getComputedStyle:(DOMElement *)element :(NSString *)pseudoElement WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
