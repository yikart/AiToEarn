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

#ifndef WKView_h
#define WKView_h

#if TARGET_OS_IPHONE

#import "WKUtilities.h"
#import <CoreGraphics/CoreGraphics.h>

#ifdef __cplusplus
extern "C" {
#endif

@class WAKWindow;

typedef enum {
    WKViewNotificationViewDidMoveToWindow,
    WKViewNotificationViewFrameSizeChanged,
    WKViewNotificationViewDidScroll
} WKViewNotificationType;

typedef enum {
    WKViewResponderAcceptsFirstResponder,
    WKViewResponderBecomeFirstResponder,
    WKViewResponderResignFirstResponder,
} WKViewResponderCallbackType;

typedef void (*WKViewDrawCallback)(WKViewRef view, CGRect dirtyRect, void *userInfo); 
typedef void (*WKViewNotificationCallback)(WKViewRef view, WKViewNotificationType type, void *userInfo);
typedef bool (*WKViewResponderCallback)(WKViewRef view, WKViewResponderCallbackType type, void *userInfo);
typedef void (*WKViewWillRemoveSubviewCallback)(WKViewRef view, WKViewRef subview);
typedef void (*WKViewInvalidateGStateCallback)(WKViewRef view);

typedef struct _WKViewContext {
    WKViewNotificationCallback notificationCallback;
    void *notificationUserInfo;
    WKViewResponderCallback responderCallback;
    void *responderUserInfo;
    WKViewWillRemoveSubviewCallback willRemoveSubviewCallback;
    WKViewInvalidateGStateCallback invalidateGStateCallback;
} WKViewContext;

struct _WKView {
    WAKObject isa;
    
    WKViewContext *context;
    
    __unsafe_unretained WAKWindow *window;

    WKViewRef superview;
    CFMutableArrayRef subviews;

    CGPoint origin;
    CGRect bounds;
    
    unsigned int autoresizingMask;
    
    float scale;

    // This is really a WAKView.
    void *wrapper;
};

extern WKClassInfo WKViewClassInfo;

WEBCORE_EXPORT WKViewRef WKViewCreateWithFrame (CGRect rect, WKViewContext *context);
void WKViewInitialize (WKViewRef view, CGRect rect, WKViewContext *context);

void WKViewSetViewContext (WKViewRef view, WKViewContext *context);
void WKViewGetViewContext (WKViewRef view, WKViewContext *context);

WEBCORE_EXPORT CGRect WKViewGetBounds (WKViewRef view);

WEBCORE_EXPORT void WKViewSetFrameOrigin (WKViewRef view, CGPoint newPoint);
WEBCORE_EXPORT void WKViewSetFrameSize (WKViewRef view, CGSize newSize);
void WKViewSetBoundsOrigin(WKViewRef view, CGPoint newOrigin);
void WKViewSetBoundsSize (WKViewRef view, CGSize newSize);

WEBCORE_EXPORT CGRect WKViewGetFrame (WKViewRef view);

CGPoint WKViewGetOrigin(WKViewRef);

WEBCORE_EXPORT void WKViewSetScale (WKViewRef view, float scale);
WEBCORE_EXPORT float WKViewGetScale (WKViewRef view);
CGAffineTransform _WKViewGetTransform(WKViewRef view);

WEBCORE_EXPORT WAKWindow *WKViewGetWindow (WKViewRef view);

CFArrayRef WKViewGetSubviews (WKViewRef view);

WKViewRef WKViewGetSuperview (WKViewRef view);

WEBCORE_EXPORT void WKViewAddSubview (WKViewRef view, WKViewRef subview);
WEBCORE_EXPORT void WKViewRemoveFromSuperview (WKViewRef view);

CGPoint WKViewConvertPointToSuperview (WKViewRef view, CGPoint aPoint);
CGPoint WKViewConvertPointFromSuperview (WKViewRef view, CGPoint aPoint);
CGPoint WKViewConvertPointToBase(WKViewRef view, CGPoint aPoint);
CGPoint WKViewConvertPointFromBase(WKViewRef view, CGPoint aPoint);

CGRect WKViewConvertRectToSuperview (WKViewRef view, CGRect aRect);
CGRect WKViewConvertRectFromSuperview (WKViewRef view, CGRect aRect);
WEBCORE_EXPORT CGRect WKViewConvertRectToBase (WKViewRef view, CGRect r);
WEBCORE_EXPORT CGRect WKViewConvertRectFromBase (WKViewRef view, CGRect aRect);

CGRect WKViewGetVisibleRect (WKViewRef view);

WKViewRef WKViewFirstChild (WKViewRef view);
WKViewRef WKViewNextSibling (WKViewRef view);
WEBCORE_EXPORT WKViewRef WKViewTraverseNext (WKViewRef view);

WEBCORE_EXPORT bool WKViewAcceptsFirstResponder (WKViewRef view);
WEBCORE_EXPORT bool WKViewBecomeFirstResponder (WKViewRef view);
WEBCORE_EXPORT bool WKViewResignFirstResponder (WKViewRef view);

unsigned int WKViewGetAutoresizingMask(WKViewRef view);
void WKViewSetAutoresizingMask (WKViewRef view, unsigned int mask);

void WKViewScrollToRect(WKViewRef view, CGRect rect);

#ifdef __cplusplus
}
#endif

#endif // TARGET_OS_IPHONE

#endif // WKView_h
