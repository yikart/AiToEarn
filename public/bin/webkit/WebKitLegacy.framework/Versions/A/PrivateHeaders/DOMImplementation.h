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

@class DOMCSSStyleSheet;
@class DOMDocument;
@class DOMDocumentType;
@class DOMHTMLDocument;
@class NSString;

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMImplementation : DOMObject
- (BOOL)hasFeature:(NSString *)feature version:(NSString *)version WEBKIT_AVAILABLE_MAC(10_5);
- (DOMDocumentType *)createDocumentType:(NSString *)qualifiedName publicId:(NSString *)publicId systemId:(NSString *)systemId WEBKIT_AVAILABLE_MAC(10_5);
- (DOMDocument *)createDocument:(NSString *)namespaceURI qualifiedName:(NSString *)qualifiedName doctype:(DOMDocumentType *)doctype WEBKIT_AVAILABLE_MAC(10_5);
- (DOMCSSStyleSheet *)createCSSStyleSheet:(NSString *)title media:(NSString *)media WEBKIT_AVAILABLE_MAC(10_5);
- (DOMHTMLDocument *)createHTMLDocument:(NSString *)title WEBKIT_AVAILABLE_MAC(10_5);
@end

@interface DOMImplementation (DOMImplementationDeprecated)
- (BOOL)hasFeature:(NSString *)feature :(NSString *)version WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMDocumentType *)createDocumentType:(NSString *)qualifiedName :(NSString *)publicId :(NSString *)systemId WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMDocument *)createDocument:(NSString *)namespaceURI :(NSString *)qualifiedName :(DOMDocumentType *)doctype WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (DOMCSSStyleSheet *)createCSSStyleSheet:(NSString *)title :(NSString *)media WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
