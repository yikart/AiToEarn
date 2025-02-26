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
#import <WebKitLegacy/DOMCore.h>
#import <WebKitLegacy/DOMDocument.h>
#import <WebKitLegacy/DOMRangeException.h>

@class DOMDocumentFragment;
@class DOMNode;
@class DOMRange;
@class NSString;

enum {
    DOM_START_TO_START = 0,
    DOM_START_TO_END = 1,
    DOM_END_TO_END = 2,
    DOM_END_TO_START = 3,
    DOM_NODE_BEFORE = 0,
    DOM_NODE_AFTER = 1,
    DOM_NODE_BEFORE_AND_AFTER = 2,
    DOM_NODE_INSIDE = 3
} WEBKIT_ENUM_DEPRECATED_MAC(10_4, 10_14);

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMRange : DOMObject
@property (readonly, strong) DOMNode *startContainer;
@property (readonly) int startOffset;
@property (readonly, strong) DOMNode *endContainer;
@property (readonly) int endOffset;
@property (readonly) BOOL collapsed;
@property (readonly, strong) DOMNode *commonAncestorContainer;
@property (readonly, copy) NSString *text WEBKIT_AVAILABLE_MAC(10_5);

- (void)setStart:(DOMNode *)refNode offset:(int)offset WEBKIT_AVAILABLE_MAC(10_5);
- (void)setEnd:(DOMNode *)refNode offset:(int)offset WEBKIT_AVAILABLE_MAC(10_5);
- (void)setStartBefore:(DOMNode *)refNode;
- (void)setStartAfter:(DOMNode *)refNode;
- (void)setEndBefore:(DOMNode *)refNode;
- (void)setEndAfter:(DOMNode *)refNode;
- (void)collapse:(BOOL)toStart;
- (void)selectNode:(DOMNode *)refNode;
- (void)selectNodeContents:(DOMNode *)refNode;
- (short)compareBoundaryPoints:(unsigned short)how sourceRange:(DOMRange *)sourceRange WEBKIT_AVAILABLE_MAC(10_5);
- (void)deleteContents;
- (DOMDocumentFragment *)extractContents;
- (DOMDocumentFragment *)cloneContents;
- (void)insertNode:(DOMNode *)newNode;
- (void)surroundContents:(DOMNode *)newParent;
- (DOMRange *)cloneRange;
- (NSString *)toString;
- (void)detach;
- (DOMDocumentFragment *)createContextualFragment:(NSString *)html WEBKIT_AVAILABLE_MAC(10_5);
- (short)compareNode:(DOMNode *)refNode WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)intersectsNode:(DOMNode *)refNode WEBKIT_AVAILABLE_MAC(10_5);
- (short)comparePoint:(DOMNode *)refNode offset:(int)offset WEBKIT_AVAILABLE_MAC(10_5);
- (BOOL)isPointInRange:(DOMNode *)refNode offset:(int)offset WEBKIT_AVAILABLE_MAC(10_5);
@end

@interface DOMRange (DOMRangeDeprecated)
- (void)setStart:(DOMNode *)refNode :(int)offset WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (void)setEnd:(DOMNode *)refNode :(int)offset WEBKIT_DEPRECATED_MAC(10_4, 10_5);
- (short)compareBoundaryPoints:(unsigned short)how :(DOMRange *)sourceRange WEBKIT_DEPRECATED_MAC(10_4, 10_5);
@end
