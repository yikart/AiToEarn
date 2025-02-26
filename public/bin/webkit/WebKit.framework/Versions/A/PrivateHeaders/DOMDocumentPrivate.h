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

#import <WebKit/DOMDocument.h>

@class DOMHTMLHeadElement;
@class DOMHTMLScriptElement;

@interface DOMDocument (DOMDocumentPrivate)
@property (readonly, copy) NSString *contentType;
@property (copy) NSString *dir;
@property (readonly, strong) DOMHTMLHeadElement *head;
@property (readonly, copy) NSString *compatMode;
@property (readonly) BOOL webkitIsFullScreen;
@property (readonly) BOOL webkitFullScreenKeyboardInputAllowed;
@property (readonly, strong) DOMElement *webkitCurrentFullScreenElement;
@property (readonly) BOOL webkitFullscreenEnabled;
@property (readonly, strong) DOMElement *webkitFullscreenElement;
@property (readonly, copy) NSString *visibilityState;
@property (readonly) BOOL hidden;
@property (readonly, strong) DOMHTMLScriptElement *currentScript;
@property (readonly, copy) NSString *origin;
@property (readonly, strong) DOMElement *scrollingElement;
@property (readonly, strong) DOMHTMLCollection *children;
@property (readonly, strong) DOMElement *firstElementChild;
@property (readonly, strong) DOMElement *lastElementChild;
@property (readonly) unsigned childElementCount;

- (DOMRange *)caretRangeFromPoint:(int)x y:(int)y;
- (void)webkitExitFullscreen;
@end
