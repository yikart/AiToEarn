/*
 * Copyright (C) 2005-2021 Apple Inc. All rights reserved.
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

#pragma once

#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE

#import <CoreGraphics/CoreGraphics.h>
#import <WebCore/WAKAppKitStubs.h>
#import <WebCore/WAKView.h>
#import <WebCore/WKContentObservation.h>

@class CALayer;
@class WebEvent;

#ifdef __cplusplus
namespace WebCore {
class LegacyTileCache;
}
typedef WebCore::LegacyTileCache LegacyTileCache;
#else
typedef struct LegacyTileCache LegacyTileCache;
#endif

typedef enum {
    kWAKWindowTilingModeNormal,
    kWAKWindowTilingModeMinimal,
    kWAKWindowTilingModePanning,
    kWAKWindowTilingModeZooming,
    kWAKWindowTilingModeDisabled,
    kWAKWindowTilingModeScrollToTop,
} WAKWindowTilingMode;

typedef enum {
    kWAKTilingDirectionUp,
    kWAKTilingDirectionDown,
    kWAKTilingDirectionLeft,
    kWAKTilingDirectionRight,
} WAKTilingDirection;

extern NSString * const WAKWindowScreenScaleDidChangeNotification;
extern NSString * const WAKWindowVisibilityDidChangeNotification;

WEBCORE_EXPORT @interface WAKWindow : WAKResponder
{
    CALayer *_hostLayer;
    LegacyTileCache* _tileCache;
    CGRect _frozenVisibleRect;
    CALayer *_rootLayer;

    CGSize _screenSize;
    CGSize _availableScreenSize;
    CGFloat _screenScale;

    CGRect _frame;

    WAKView *_contentView;
    WAKView *_responderView;
    WAKView *_nextResponder;

    BOOL _visible;
    BOOL _isInSnapshottingPaint;
    BOOL _useOrientationDependentFontAntialiasing;
    BOOL _entireWindowVisibleForTesting;
}

@property (nonatomic, assign) BOOL useOrientationDependentFontAntialiasing;

// If non-NULL, contentReplacementImage will draw into tiles instead of web content.
@property (nonatomic) CGImageRef contentReplacementImage;

// Create layer hosted window
- (id)initWithLayer:(CALayer *)hostLayer;
// Create unhosted window for manual painting
- (id)initWithFrame:(CGRect)frame;

- (CALayer*)hostLayer;

- (void)setContentView:(WAKView *)view;
- (WAKView *)contentView;
- (void)close;
- (WAKView *)firstResponder;

- (NSPoint)convertBaseToScreen:(NSPoint)point;
- (NSPoint)convertScreenToBase:(NSPoint)point;
- (NSRect)convertRectToScreen:(NSRect)rect;
- (NSRect)convertRectFromScreen:(NSRect)rect;
- (BOOL)isKeyWindow;
- (void)makeKeyWindow;
- (BOOL)isVisible;
- (void)setVisible:(BOOL)visible;
- (NSSelectionDirection)keyViewSelectionDirection;
- (BOOL)makeFirstResponder:(WAKResponder *)responder;
- (WAKView *)_newFirstResponderAfterResigning NS_RETURNS_NOT_RETAINED;
- (void)setFrame:(NSRect)frameRect display:(BOOL)flag;
- (CGRect)frame;
- (void)setContentRect:(CGRect)rect;
- (void)setScreenSize:(CGSize)size;
- (CGSize)screenSize;
- (void)setAvailableScreenSize:(CGSize)size;
- (CGSize)availableScreenSize;
- (void)setScreenScale:(CGFloat)scale;
- (CGFloat)screenScale;
- (void)setRootLayer:(CALayer *)layer;
- (CALayer *)rootLayer;
- (void)sendEvent:(WebEvent *)event;
- (void)sendEventSynchronously:(WebEvent *)event;
- (void)sendMouseMoveEvent:(WebEvent *)event contentChange:(WKContentChange *)change;

- (void)setIsInSnapshottingPaint:(BOOL)isInSnapshottingPaint;
- (BOOL)isInSnapshottingPaint;

// Thread safe way of providing the "usable" rect of the WAKWindow in the viewport/scrollview.
- (CGRect)exposedScrollViewRect;
// setExposedScrollViewRect should only ever be called from UIKit.
- (void)setExposedScrollViewRect:(CGRect)exposedScrollViewRect;
// Used only by DumpRenderTree.
- (void)setEntireWindowVisibleForTesting:(BOOL)entireWindowVisible;

// Tiling support
- (void)layoutTiles;
- (void)layoutTilesNow;
- (void)layoutTilesNowForRect:(CGRect)rect;
- (void)setNeedsDisplay;
- (void)setNeedsDisplayInRect:(CGRect)rect;
- (BOOL)tilesOpaque;
- (void)setTilesOpaque:(BOOL)opaque;
- (CGRect)visibleRect;
// The extended visible rect includes the area outside superviews with
// masksToBounds set to NO.
- (CGRect)extendedVisibleRect;
- (void)removeAllNonVisibleTiles;
- (void)removeAllTiles;
- (void)removeForegroundTiles;
- (void)setTilingMode:(WAKWindowTilingMode)mode;
- (WAKWindowTilingMode)tilingMode;
- (void)setTilingDirection:(WAKTilingDirection)tilingDirection;
- (WAKTilingDirection)tilingDirection;
- (void)displayRect:(NSRect)rect;
- (void)setZoomedOutTileScale:(float)scale;
- (float)zoomedOutTileScale;
- (void)setCurrentTileScale:(float)scale;
- (float)currentTileScale;
- (void)setKeepsZoomedOutTiles:(BOOL)keepsZoomedOutTiles;
- (BOOL)keepsZoomedOutTiles;
- (LegacyTileCache*)tileCache;

- (void)dumpTiles;

- (void)willRotate;
- (void)didRotate;

- (BOOL)useOrientationDependentFontAntialiasing;
- (void)setUseOrientationDependentFontAntialiasing:(BOOL)aa;
+ (BOOL)hasLandscapeOrientation;
+ (void)setOrientationProvider:(id)provider;

+ (WebEvent *)currentEvent;

- (NSString *)recursiveDescription;

@end

#endif // TARGET_OS_IPHONE
