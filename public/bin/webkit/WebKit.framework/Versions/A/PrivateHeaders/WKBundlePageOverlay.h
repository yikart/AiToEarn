/*
 * Copyright (C) 2010 Apple Inc. All rights reserved.
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

#ifndef WKBundlePageOverlay_h
#define WKBundlePageOverlay_h

#include <WebKit/WKBase.h>
#include <WebKit/WKEvent.h>
#include <WebKit/WKGeometry.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Page overlay client.
typedef void (*WKBundlePageOverlayWillMoveToPageCallback)(WKBundlePageOverlayRef pageOverlay, WKBundlePageRef page, const void* clientInfo);
typedef void (*WKBundlePageOverlayDidMoveToPageCallback)(WKBundlePageOverlayRef pageOverlay, WKBundlePageRef page, const void* clientInfo);
typedef void (*WKBundlePageOverlayDrawRectCallback)(WKBundlePageOverlayRef pageOverlay, void* graphicsContext, WKRect dirtyRect, const void* clientInfo);
typedef bool (*WKBundlePageOverlayMouseDownCallback)(WKBundlePageOverlayRef pageOverlay, WKPoint position, WKEventMouseButton mouseButton, const void* clientInfo);
typedef bool (*WKBundlePageOverlayMouseUpCallback)(WKBundlePageOverlayRef pageOverlay, WKPoint position, WKEventMouseButton mouseButton, const void* clientInfo);
typedef bool (*WKBundlePageOverlayMouseMovedCallback)(WKBundlePageOverlayRef pageOverlay, WKPoint position, const void* clientInfo);
typedef bool (*WKBundlePageOverlayMouseDraggedCallback)(WKBundlePageOverlayRef pageOverlay, WKPoint position, WKEventMouseButton mouseButton, const void* clientInfo);

typedef void* (*WKBundlePageOverlayActionContextForResultAtPointCallback)(WKBundlePageOverlayRef pageOverlay, WKPoint position, WKBundleRangeHandleRef* rangeHandle, const void* clientInfo);
typedef void (*WKBundlePageOverlayDataDetectorsDidPresentUI)(WKBundlePageOverlayRef pageOverlay, const void* clientInfo);
typedef void (*WKBundlePageOverlayDataDetectorsDidChangeUI)(WKBundlePageOverlayRef pageOverlay, const void* clientInfo);
typedef void (*WKBundlePageOverlayDataDetectorsDidHideUI)(WKBundlePageOverlayRef pageOverlay, const void* clientInfo);

typedef struct WKBundlePageOverlayClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundlePageOverlayClientBase;

typedef struct WKBundlePageOverlayClientV0 {
    WKBundlePageOverlayClientBase                                       base;

    WKBundlePageOverlayWillMoveToPageCallback                           willMoveToPage;
    WKBundlePageOverlayDidMoveToPageCallback                            didMoveToPage;
    WKBundlePageOverlayDrawRectCallback                                 drawRect;
    WKBundlePageOverlayMouseDownCallback                                mouseDown;
    WKBundlePageOverlayMouseUpCallback                                  mouseUp;
    WKBundlePageOverlayMouseMovedCallback                               mouseMoved;
    WKBundlePageOverlayMouseDraggedCallback                             mouseDragged;
} WKBundlePageOverlayClientV0;

typedef struct WKBundlePageOverlayClientV1 {
    WKBundlePageOverlayClientBase                                       base;

    WKBundlePageOverlayWillMoveToPageCallback                           willMoveToPage;
    WKBundlePageOverlayDidMoveToPageCallback                            didMoveToPage;
    WKBundlePageOverlayDrawRectCallback                                 drawRect;
    WKBundlePageOverlayMouseDownCallback                                mouseDown;
    WKBundlePageOverlayMouseUpCallback                                  mouseUp;
    WKBundlePageOverlayMouseMovedCallback                               mouseMoved;
    WKBundlePageOverlayMouseDraggedCallback                             mouseDragged;

    WKBundlePageOverlayActionContextForResultAtPointCallback            actionContextForResultAtPoint;
    WKBundlePageOverlayDataDetectorsDidPresentUI                        dataDetectorsDidPresentUI;
    WKBundlePageOverlayDataDetectorsDidChangeUI                         dataDetectorsDidChangeUI;
    WKBundlePageOverlayDataDetectorsDidHideUI                           dataDetectorsDidHideUI;
} WKBundlePageOverlayClientV1;

typedef WKTypeRef (*WKAccessibilityAttributeValueCallback)(WKBundlePageOverlayRef pageOverlay, WKStringRef attribute, WKTypeRef parameter, const void* clientInfo);
typedef WKArrayRef (*WKAccessibilityAttributeNamesCallback)(WKBundlePageOverlayRef pageOverlay, bool parameterizedNames, const void* clientInfo);

typedef struct WKBundlePageOverlayAccessibilityClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundlePageOverlayAccessibilityClientBase;

typedef struct WKBundlePageOverlayAccessibilityClientV0 {
    WKBundlePageOverlayAccessibilityClientBase                          base;

    // Version 0.
    WKAccessibilityAttributeValueCallback                               copyAccessibilityAttributeValue;
    WKAccessibilityAttributeNamesCallback                               copyAccessibilityAttributeNames;
} WKBundlePageOverlayAccessibilityClientV0;

WK_EXPORT WKTypeID WKBundlePageOverlayGetTypeID();

WK_EXPORT WKBundlePageOverlayRef WKBundlePageOverlayCreate(WKBundlePageOverlayClientBase* client);
WK_EXPORT void WKBundlePageOverlaySetNeedsDisplay(WKBundlePageOverlayRef bundlePageOverlay, WKRect rect);
WK_EXPORT float WKBundlePageOverlayFractionFadedIn(WKBundlePageOverlayRef bundlePageOverlay);
WK_EXPORT void WKBundlePageOverlaySetAccessibilityClient(WKBundlePageOverlayRef bundlePageOverlay, WKBundlePageOverlayAccessibilityClientBase* client);
WK_EXPORT void WKBundlePageOverlayClear(WKBundlePageOverlayRef bundlePageOverlay);

#ifdef __cplusplus
}
#endif

#endif // WKBundlePageOverlay_h
