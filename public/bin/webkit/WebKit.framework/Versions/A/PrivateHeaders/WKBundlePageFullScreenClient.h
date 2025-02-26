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

#ifndef WKBundlePageFullScreenClient_h
#define WKBundlePageFullScreenClient_h

#include <WebKit/WKBase.h>
#include <WebKit/WKGeometry.h>

enum {
    WKFullScreenNoKeyboard,
    WKFullScreenKeyboard,
};
typedef uint32_t WKFullScreenKeyboardRequestType;

typedef bool (*WKBundlePageSupportsFullScreen)(WKBundlePageRef page, WKFullScreenKeyboardRequestType requestType);
typedef void (*WKBundlePageEnterFullScreenForElement)(WKBundlePageRef page, WKBundleNodeHandleRef element);
typedef void (*WKBundlePageExitFullScreenForElement)(WKBundlePageRef page, WKBundleNodeHandleRef element);
typedef void (*WKBundlePageBeganEnterFullScreen)(WKBundlePageRef page, WKRect initialFrame, WKRect finalFrame);
typedef void (*WKBundlePageBeganExitFullScreen)(WKBundlePageRef page, WKRect initialFrame, WKRect finalFrame);
typedef void (*WKBundlePageCloseFullScreen)(WKBundlePageRef page);

typedef struct WKBundlePageFullScreenClientBase {
    int                                                                 version;
    const void *                                                        clientInfo;
} WKBundlePageFullScreenClientBase;

typedef struct WKBundlePageFullScreenClientV0 {
    WKBundlePageFullScreenClientBase                                    base;

    // Version 0.
    WKBundlePageSupportsFullScreen                                      supportsFullScreen;
    WKBundlePageEnterFullScreenForElement                               enterFullScreenForElement;
    WKBundlePageExitFullScreenForElement                                exitFullScreenForElement;
} WKBundlePageFullScreenClientV0;

typedef struct WKBundlePageFullScreenClientV1 {
    WKBundlePageFullScreenClientBase                                    base;

    // Version 0.
    WKBundlePageSupportsFullScreen                                      supportsFullScreen;
    WKBundlePageEnterFullScreenForElement                               enterFullScreenForElement;
    WKBundlePageExitFullScreenForElement                                exitFullScreenForElement;

    // Version 1.
    WKBundlePageBeganEnterFullScreen                                    beganEnterFullScreen;
    WKBundlePageBeganExitFullScreen                                     beganExitFullScreen;
    WKBundlePageCloseFullScreen                                         closeFullScreen;
} WKBundlePageFullScreenClientV1;

#endif // WKBundlePageFullScreenClient_h
