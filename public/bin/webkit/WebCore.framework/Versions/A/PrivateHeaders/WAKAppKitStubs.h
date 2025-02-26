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

#ifndef WAKAppKitStubs_h
#define WAKAppKitStubs_h

#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE

#import <CoreGraphics/CoreGraphics.h>

// WebKitLegacy was built around AppKit, which isn't present on iOS,
// so WebKitLegacy redeclares many AppKit types on iOS. This is a problem
// for Mac Catalyst where AppKit is present and usable, because the
// redeclared types now conflict with the original types. Normally the AppKit
// types are marked unavailable, so WebKitLegacy still needs to redeclare
// them to make them available. As long as Mac Catalyst clients stick to UIKit
// and WebKitLegacy, and don't directly import AppKit, things are fine.
// However, there are a few special Apple internal Mac Catalyst clients that
// are able to use all of the normally unavailable AppKit types, and so
// those clients need WebKitLegacy to use the AppKit types directly rather
// than redeclare them. Duplicate the Apple internal APPKIT_API_UNAVAILABLE_BEGIN_MACCATALYST
// logic to identify when this is the case.
#if TARGET_OS_MACCATALYST && ((defined(__UIKIT_BUILDING_UIKIT__) && __UIKIT_BUILDING_UIKIT__) || (defined(__SWIFTUI_BUILDING_SWIFTUI__) && __SWIFTUI_BUILDING_SWIFTUI__) || (defined(__UIKIT_AX_BUILDING_UIKIT_AX__) && __UIKIT_AX_BUILDING_UIKIT_AX__))
#define WAK_APPKIT_API_AVAILABLE_MACCATALYST 1
#else
#define WAK_APPKIT_API_AVAILABLE_MACCATALYST 0
#endif

#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
#import <AppKit/NSClipView.h>
#import <AppKit/NSScrollView.h>
#import <AppKit/NSView.h>
#else
#ifndef NSClipView
#define NSClipView WAKClipView
#endif
#ifndef NSView
#define NSView WAKView
#endif
#ifndef NSScrollView
#define NSScrollView WAKScrollView
#endif
#endif // WAK_APPKIT_API_AVAILABLE_MACCATALYST
// There is no <WebKit/WebDynamicScrollBarsView.h> in Mac Catalyst.
#ifndef WebDynamicScrollBarsView
#define WebDynamicScrollBarsView WAKScrollView
#endif
#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
#import <AppKit/NSResponder.h>
#import <AppKit/NSWindow.h>
#else
#ifndef NSWindow
#define NSWindow WAKWindow
#endif
#ifndef NSResponder
#define NSResponder WAKResponder
#endif
#endif // WAK_APPKIT_API_AVAILABLE_MACCATALYST

// FIXME: <rdar://problem/6669434> Switch from using NSGeometry methods to CGGeometry methods
//
// We explicitly use __has_include() instead of the macro define USE_APPLE_INTERNAL_SDK as
// the condition for including the header Foundation/NSGeometry.h to support internal Apple
// clients that build without header wtf/Platform.h.
#if __has_include(<Foundation/NSGeometry.h>)

#import <Foundation/NSGeometry.h>

#else

typedef CGPoint NSPoint;
typedef CGRect NSRect;
typedef CGSize NSSize;

#ifndef NSZeroPoint
#define NSZeroPoint CGPointZero
#endif
#ifndef NSZeroRect
#define NSZeroRect CGRectZero
#endif
#ifndef NSZeroSize
#define NSZeroSize CGSizeZero
#endif
#ifndef NSMakePoint
#define NSMakePoint CGPointMake
#endif
#ifndef NSMakeRect
#define NSMakeRect CGRectMake
#endif
#ifndef NSMakeSize
#define NSMakeSize CGSizeMake
#endif
#ifndef NSEqualPoints
#define NSEqualPoints CGPointEqualToPoint
#endif
#ifndef NSEqualRects
#define NSEqualRects CGRectEqualToRect
#endif
#ifndef NSEqualSizes
#define NSEqualSizes CGSizeEqualToSize
#endif
#ifndef NSInsetRect
#define NSInsetRect CGRectInset
#endif
#ifndef NSIntersectionRect
#define NSIntersectionRect CGRectIntersection
#endif
#ifndef NSIsEmptyRect
#define NSIsEmptyRect CGRectIsEmpty
#endif
#ifndef NSContainsRect
#define NSContainsRect CGRectContainsRect
#endif
#ifndef NSPointInRect
#define NSPointInRect(x, y) CGRectContainsPoint((y), (x))
#endif
#ifndef NSMinX
#define NSMinX CGRectGetMinX
#endif
#ifndef NSMinY
#define NSMinY CGRectGetMinY
#endif
#ifndef NSMaxX
#define NSMaxX CGRectGetMaxX
#endif
#ifndef NSMaxY
#define NSMaxY CGRectGetMaxY
#endif

typedef NS_ENUM(NSInteger, NSRectEdge) {
#ifndef NSMinXEdge
    NSMinXEdge = CGRectMinXEdge,
#endif
#ifndef NSMinYEdge
    NSMinYEdge = CGRectMinYEdge,
#endif
#ifndef NSMaxXEdge
    NSMaxXEdge = CGRectMaxXEdge,
#endif
#ifndef NSMaxYEdge
    NSMaxYEdge = CGRectMaxYEdge,
#endif
};

@interface NSValue (NSGeometryDetails)
+ (NSValue *)valueWithPoint:(NSPoint)point;
+ (NSValue *)valueWithRect:(NSRect)rect;
+ (NSValue *)valueWithSize:(NSSize)size;
@property (readonly) NSPoint pointValue;
@property (readonly) NSRect rectValue;
@property (readonly) NSSize sizeValue;
@end

#endif // __has_include(<Foundation/NSGeometry.h>)

@class WAKClipView;
@class WAKResponder;
@class WAKScrollView;
@class WAKView;
@class WAKWindow;

typedef NS_OPTIONS(NSUInteger, WKNSEventModifierFlags) {
    WKNSEventModifierFlagCapsLock = 1 << 16,
    WKNSEventModifierFlagShift = 1 << 17,
    WKNSEventModifierFlagControl = 1 << 18,
    WKNSEventModifierFlagOption = 1 << 19,
    WKNSEventModifierFlagCommand = 1 << 20,
    WKNSEventModifierFlagNumericPad = 1 << 21,
    WKNSEventModifierFlagHelp = 1 << 22,
    WKNSEventModifierFlagFunction = 1 << 23,
    WKNSEventModifierFlagDeviceIndependentFlagsMask = 0xffff0000U
};

#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
#import <AppKit/NSEvent.h>
#else
#ifndef NSEventModifierFlagCapsLock
#define NSEventModifierFlagCapsLock WKNSEventModifierFlagCapsLock
#define NSEventModifierFlagShift WKNSEventModifierFlagShift
#define NSEventModifierFlagControl WKNSEventModifierFlagControl
#define NSEventModifierFlagOption WKNSEventModifierFlagOption
#define NSEventModifierFlagCommand WKNSEventModifierFlagCommand
#define NSEventModifierFlagNumericPad WKNSEventModifierFlagNumericPad
#define NSEventModifierFlagHelp WKNSEventModifierFlagHelp
#define NSEventModifierFlagFunction WKNSEventModifierFlagFunction
#define NSEventModifierFlagDeviceIndependentFlagsMask WKNSEventModifierFlagDeviceIndependentFlagsMask
#endif
#endif // WAK_APPKIT_API_AVAILABLE_MACCATALYST

typedef enum _WKWritingDirection {
    WKWritingDirectionNatural     = -1, /* Determines direction using the Unicode Bidi Algorithm rules P2 and P3 */
    WKWritingDirectionLeftToRight = 0,  /* Left to right writing direction */
    WKWritingDirectionRightToLeft       /* Right to left writing direction */
} WKWritingDirection;

typedef NS_ENUM(NSUInteger, WKNSSelectionAffinity) {
    WKNSSelectionAffinityUpstream = 0,
    WKNSSelectionAffinityDownstream = 1
};

#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
#import <AppKit/NSTextView.h>
#else
#ifndef NSSelectionAffinityUpstream
#define NSSelectionAffinity WKNSSelectionAffinity
#define NSSelectionAffinityUpstream WKNSSelectionAffinityUpstream
#define NSSelectionAffinityDownstream WKNSSelectionAffinityDownstream
#endif
#endif // WAK_APPKIT_API_AVAILABLE_MACCATALYST

typedef NS_ENUM(NSInteger, WKNSControlStateValue) {
    WKNSControlStateValueMixed = -1,
    WKNSControlStateValueOff   =  0,
    WKNSControlStateValueOn    =  1
};

#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
#import <AppKit/NSCell.h>
#else
#ifndef NSControlStateValueMixed
#define NSControlStateValue WKNSControlStateValue
#define NSControlStateValueMixed WKNSControlStateValueMixed
#define NSControlStateValueOff WKNSControlStateValueOff
#define NSControlStateValueOn WKNSControlStateValueOn
#endif
#endif // WAK_APPKIT_API_AVAILABLE_MACCATALYST

typedef NS_ENUM(NSUInteger, WKNSCompositingOperation) {
    WKNSCompositeClear           = 0,
    WKNSCompositeCopy            = 1,
    WKNSCompositeSourceOver      = 2,
    WKNSCompositeSourceIn        = 3,
    WKNSCompositeSourceOut       = 4,
    WKNSCompositeSourceAtop      = 5,
    WKNSCompositeDestinationOver = 6,
    WKNSCompositeDestinationIn   = 7,
    WKNSCompositeDestinationOut  = 8,
    WKNSCompositeDestinationAtop = 9,
    WKNSCompositeXOR             = 10,
    WKNSCompositePlusDarker      = 11,
    WKNSCompositeHighlight       = 12,
    WKNSCompositePlusLighter     = 13
};

#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
#import <AppKit/NSGraphics.h>
#else
#ifndef NSCompositeClear
#define NSCompositingOperation WKNSCompositingOperation
#define NSCompositeClear WKNSCompositeClear
#define NSCompositeCopy WKNSCompositeCopy
#define NSCompositeSourceOver WKNSCompositeSourceOver
#define NSCompositeSourceIn WKNSCompositeSourceIn
#define NSCompositeSourceOut WKNSCompositeSourceOut
#define NSCompositeSourceAtop WKNSCompositeSourceAtop
#define NSCompositeDestinationOver WKNSCompositeDestinationOver
#define NSCompositeDestinationIn WKNSCompositeDestinationIn
#define NSCompositeDestinationOut WKNSCompositeDestinationOut
#define NSCompositeDestinationAtop WKNSCompositeDestinationAtop
#define NSCompositeXOR WKNSCompositeXOR
#define NSCompositePlusDarker WKNSCompositePlusDarker
#define NSCompositeHighlight WKNSCompositeHighlight
#define NSCompositePlusLighter WKNSCompositePlusLighter
#endif
#endif // WAK_APPKIT_API_AVAILABLE_MACCATALYST

typedef NS_ENUM(NSUInteger, WKNSSelectionDirection) {
    WKNSDirectSelection = 0,
    WKNSSelectingNext,
    WKNSSelectingPrevious
};

#if WAK_APPKIT_API_AVAILABLE_MACCATALYST
// Included earlier, but the following constants are
// in NSWindow.h.
// #import <AppKit/NSWindow.h>
#else
#ifndef NSDirectSelection
#define NSSelectionDirection WKNSSelectionDirection
#define NSDirectSelection WKNSDirectSelection
#define NSSelectingNext WKNSSelectingNext
#define NSSelectingPrevious WKNSSelectingPrevious
#endif
#endif // WAK_APPKIT_API_AVAILABLE_MACCATALYST

#endif // TARGET_OS_IPHONE

#endif // WAKAppKitStubs_h
