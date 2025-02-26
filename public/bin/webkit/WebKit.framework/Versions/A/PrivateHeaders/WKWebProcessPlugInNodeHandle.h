/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#import <WebKit/WKFoundation.h>

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>
#import <WebKit/WKImage.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIImage.h>
#endif

@class WKWebProcessPlugInFrame;

WK_CLASS_AVAILABLE(macos(10.10), ios(8.0))
@interface WKWebProcessPlugInNodeHandle : NSObject

+ (WKWebProcessPlugInNodeHandle *)nodeHandleWithJSValue:(JSValue *)value inContext:(JSContext *)context;
- (WKWebProcessPlugInFrame *)htmlIFrameElementContentFrame;

#if TARGET_OS_IPHONE
- (UIImage *)renderedImageWithOptions:(WKSnapshotOptions)options WK_API_AVAILABLE(ios(9.0));
- (UIImage *)renderedImageWithOptions:(WKSnapshotOptions)options width:(NSNumber *)width WK_API_AVAILABLE(ios(11.0));
#else
- (NSImage *)renderedImageWithOptions:(WKSnapshotOptions)options WK_API_AVAILABLE(macos(10.11));
- (NSImage *)renderedImageWithOptions:(WKSnapshotOptions)options width:(NSNumber *)width WK_API_AVAILABLE(macos(10.13));
#endif

@property (nonatomic, readonly) CGRect elementBounds;
@property (nonatomic) BOOL HTMLInputElementIsAutoFilled;
@property (nonatomic) BOOL HTMLInputElementIsAutoFilledAndViewable;
@property (nonatomic) BOOL HTMLInputElementIsAutoFilledAndObscured WK_API_AVAILABLE(macos(13.0), ios(16.0));
@property (nonatomic, readonly) BOOL HTMLInputElementIsUserEdited;
@property (nonatomic, readonly) BOOL HTMLTextAreaElementIsUserEdited;
@property (nonatomic, readonly) WKWebProcessPlugInNodeHandle *HTMLTableCellElementCellAbove;
@property (nonatomic, readonly) WKWebProcessPlugInFrame *frame;
@property (nonatomic, readonly) BOOL isSelectElement WK_API_AVAILABLE(macos(10.14.4), ios(12.2));
@property (nonatomic, readonly) BOOL isSelectableTextNode WK_API_AVAILABLE(macos(12.0), ios(15.0));

- (BOOL)isTextField;

@end
