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

@class DOMCSSRule;
@class DOMCSSStyleSheet;
@class NSString;

enum {
    DOM_UNKNOWN_RULE = 0,
    DOM_STYLE_RULE = 1,
    DOM_CHARSET_RULE = 2,
    DOM_IMPORT_RULE = 3,
    DOM_MEDIA_RULE = 4,
    DOM_FONT_FACE_RULE = 5,
    DOM_PAGE_RULE = 6,
    DOM_KEYFRAMES_RULE = 7,
    DOM_KEYFRAME_RULE = 8,
    DOM_NAMESPACE_RULE = 10,
    DOM_SUPPORTS_RULE = 12,
    DOM_WEBKIT_REGION_RULE = 16,
    DOM_WEBKIT_KEYFRAMES_RULE = 7,
    DOM_WEBKIT_KEYFRAME_RULE = 8
} WEBKIT_ENUM_DEPRECATED_MAC(10_4, 10_14);

WEBKIT_CLASS_DEPRECATED_MAC(10_4, 10_14)
@interface DOMCSSRule : DOMObject
@property (readonly) unsigned short type;
@property (copy) NSString *cssText;
@property (readonly, strong) DOMCSSStyleSheet *parentStyleSheet;
@property (readonly, strong) DOMCSSRule *parentRule;
@end
