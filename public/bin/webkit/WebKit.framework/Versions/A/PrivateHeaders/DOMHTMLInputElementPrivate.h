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

#import <WebKit/DOMHTMLElementPrivate.h>
#import <WebKit/DOMHTMLInputElement.h>

@class DOMHTMLElement;
@class DOMNodeList;
@class DOMValidityState;

@interface DOMHTMLInputElement (DOMHTMLInputElementPrivate)
@property (copy) NSString *autocomplete;
@property (copy) NSString *dirName;
@property (copy) NSString *formAction;
@property (copy) NSString *formEnctype;
@property (copy) NSString *formMethod;
@property BOOL formNoValidate;
@property (copy) NSString *formTarget;
@property unsigned height;
@property (readonly, strong) DOMHTMLElement *list;
@property (copy) NSString *max;
@property (copy) NSString *min;
@property (copy) NSString *pattern;
@property (copy) NSString *placeholder;
@property BOOL required;
@property (copy) NSString *step;
@property NSTimeInterval valueAsDate;
@property double valueAsNumber;
@property unsigned width;
@property (readonly, strong) DOMNodeList *labels;
@property (copy) NSString *selectionDirection;
@property BOOL incremental;
@property BOOL capture;
@property (nonatomic) BOOL canShowPlaceholder;

- (void)stepUp:(int)n;
- (void)stepDown:(int)n;
- (void)setRangeText:(NSString *)replacement;
- (void)setRangeText:(NSString *)replacement start:(unsigned)start end:(unsigned)end selectionMode:(NSString *)selectionMode;
- (void)setValueForUser:(NSString *)value;
@end
