/*
 * Copyright (C) 2005-2018 Apple Inc. All rights reserved.
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

#ifndef WAKScrollView_h
#define WAKScrollView_h

#if TARGET_OS_IPHONE

#import "WAKView.h"
#import "WebCoreFrameView.h"
#import <Foundation/Foundation.h>

@class WAKClipView;

WEBCORE_EXPORT @interface WAKScrollView : WAKView <WebCoreFrameScrollView>
{
    WAKView *_documentView;  // Only here so the ObjC instance stays around.
    WAKClipView *_contentView;
    NSPoint _scrollOrigin;
}

- (CGRect)documentVisibleRect;
- (WAKClipView *)contentView;
- (id)documentView;
- (void)setDocumentView:(WAKView *)aView;
- (void)setHasVerticalScroller:(BOOL)flag;
- (BOOL)hasVerticalScroller;
- (void)setHasHorizontalScroller:(BOOL)flag;
- (BOOL)hasHorizontalScroller;
- (void)reflectScrolledClipView:(WAKClipView *)aClipView;
- (void)setDrawsBackground:(BOOL)flag;
- (float)verticalLineScroll;
- (void)setLineScroll:(float)aFloat;
- (BOOL)drawsBackground;
- (float)horizontalLineScroll;

@property (nonatomic, weak) id delegate;

- (CGRect)unobscuredContentRect;
- (void)setActualScrollPosition:(CGPoint)point;

// Like unobscuredContentRect, but includes areas possibly covered by translucent UI.
- (CGRect)exposedContentRect;

- (BOOL)inProgrammaticScroll;
@end

@interface NSObject (WAKScrollViewDelegate)
- (BOOL)scrollView:(WAKScrollView *)scrollView shouldScrollToPoint:(CGPoint)point;
@end

#endif // TARGET_OS_IPHONE

#endif // WAKScrollView_h
