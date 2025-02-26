/*
 * Copyright (C) 2005, 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
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

#ifndef WAKView_h
#define WAKView_h

#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE

#import <CoreGraphics/CoreGraphics.h>
#import <WebCore/WAKAppKitStubs.h>
#import <WebCore/WAKResponder.h>

extern NSString *WAKViewFrameSizeDidChangeNotification;
extern NSString *WAKViewDidScrollNotification;

#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
#import <AppKit/NSView.h>
#else
enum {
    NSViewNotSizable = 0,
    NSViewMinXMargin = 1,
    NSViewWidthSizable = 2,
    NSViewMaxXMargin = 4,
    NSViewMinYMargin = 8,
    NSViewHeightSizable = 16,
    NSViewMaxYMargin = 32
};
#endif

@class WAKWindow;

WEBCORE_EXPORT @interface WAKView : WAKResponder

+ (WAKView *)focusView;

- (id)initWithFrame:(CGRect)rect;

- (WAKWindow *)window;

- (NSRect)bounds;
- (NSRect)frame;

- (void)setFrame:(NSRect)frameRect;
- (void)setFrameOrigin:(NSPoint)newOrigin;
- (void)setFrameSize:(NSSize)newSize;
- (void)setBoundsOrigin:(NSPoint)newOrigin;
- (void)setBoundsSize:(NSSize)size;
- (void)frameSizeChanged;

- (NSArray *)subviews;
- (WAKView *)superview;
- (void)addSubview:(WAKView *)subview;
- (void)willRemoveSubview:(WAKView *)subview;
- (void)removeFromSuperview;
- (BOOL)isDescendantOf:(WAKView *)aView;
- (BOOL)isHiddenOrHasHiddenAncestor;
- (WAKView *)lastScrollableAncestor;

- (void)viewDidMoveToWindow;

- (void)lockFocus;
- (void)unlockFocus;

- (void)setNeedsDisplay:(BOOL)flag;
- (void)setNeedsDisplayInRect:(CGRect)invalidRect;
- (BOOL)needsDisplay;
- (void)display;
- (void)displayIfNeeded;
- (void)displayRect:(NSRect)rect;
- (void)displayRectIgnoringOpacity:(NSRect)rect;
- (void)displayRectIgnoringOpacity:(NSRect)rect inContext:(CGContextRef)context;
- (void)drawRect:(CGRect)rect;
- (void)viewWillDraw;

- (WAKView *)hitTest:(NSPoint)point;
- (NSPoint)convertPoint:(NSPoint)point fromView:(WAKView *)aView;
- (NSPoint)convertPoint:(NSPoint)point toView:(WAKView *)aView;
- (NSSize)convertSize:(NSSize)size toView:(WAKView *)aView;
- (NSRect)convertRect:(NSRect)rect fromView:(WAKView *)aView;
- (NSRect)convertRect:(NSRect)rect toView:(WAKView *)aView;

- (BOOL)needsPanelToBecomeKey;

- (BOOL)scrollRectToVisible:(NSRect)aRect;
- (void)scrollPoint:(NSPoint)aPoint;
- (NSRect)visibleRect;

- (void)setHidden:(BOOL)flag;

- (void)setNextKeyView:(WAKView *)aView;
- (WAKView *)nextKeyView;
- (WAKView *)nextValidKeyView;
- (WAKView *)previousKeyView;
- (WAKView *)previousValidKeyView;

- (void)invalidateGState;
- (void)releaseGState;

- (void)setAutoresizingMask:(unsigned int)mask;
- (unsigned int)autoresizingMask;
- (BOOL)inLiveResize;

- (BOOL)mouse:(NSPoint)aPoint inRect:(NSRect)aRect;

- (void)setNeedsLayout:(BOOL)flag;
- (void)layout;
- (void)layoutIfNeeded;

- (void)setScale:(float)scale;
- (float)scale;

- (void)_setDrawsOwnDescendants:(BOOL)draw;

- (void)_appendDescriptionToString:(NSMutableString *)info atLevel:(int)level;

+ (void)_setInterpolationQuality:(int)quality;

@end

#endif // TARGET_OS_IPHONE

#endif // WAKView_h
