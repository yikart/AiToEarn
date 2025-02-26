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

#ifndef WKFrame_h
#define WKFrame_h

#include <WebKit/WKBase.h>
#include <WebKit/WKDeprecated.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

#ifdef __cplusplus
extern "C" {
#endif

enum {
    kWKFrameLoadStateProvisional = 0,
    kWKFrameLoadStateCommitted = 1,
    kWKFrameLoadStateFinished = 2
};
typedef uint32_t WKFrameLoadState;

WK_EXPORT WKTypeID WKFrameGetTypeID(void);
 
WK_EXPORT bool WKFrameIsMainFrame(WKFrameRef frame);
WK_EXPORT WKFrameLoadState WKFrameGetFrameLoadState(WKFrameRef frame);
WK_EXPORT WKURLRef WKFrameCopyProvisionalURL(WKFrameRef frame);
WK_EXPORT WKURLRef WKFrameCopyURL(WKFrameRef frame);
WK_EXPORT WKURLRef WKFrameCopyUnreachableURL(WKFrameRef frame);

WK_EXPORT void WKFrameStopLoading(WKFrameRef frame) WK_C_API_DEPRECATED;

WK_EXPORT WKStringRef WKFrameCopyMIMEType(WKFrameRef frame);
WK_EXPORT WKStringRef WKFrameCopyTitle(WKFrameRef frame);

WK_EXPORT WKPageRef WKFrameGetPage(WKFrameRef frame);

WK_EXPORT WKCertificateInfoRef WKFrameGetCertificateInfo(WKFrameRef frame) WK_C_API_DEPRECATED;

WK_EXPORT bool WKFrameCanProvideSource(WKFrameRef frame);
WK_EXPORT bool WKFrameCanShowMIMEType(WKFrameRef frame, WKStringRef mimeType) WK_C_API_DEPRECATED;

WK_EXPORT bool WKFrameIsDisplayingStandaloneImageDocument(WKFrameRef frame);
WK_EXPORT bool WKFrameIsDisplayingMarkupDocument(WKFrameRef frame);

WK_EXPORT bool WKFrameIsFrameSet(WKFrameRef frame) WK_C_API_DEPRECATED;

WK_EXPORT WKFrameHandleRef WKFrameCreateFrameHandle(WKFrameRef frame);
WK_EXPORT WKFrameInfoRef WKFrameCreateFrameInfo(WKFrameRef frame) WK_C_API_DEPRECATED;

typedef void (*WKFrameGetResourceDataFunction)(WKDataRef data, WKErrorRef error, void* functionContext);
WK_EXPORT void WKFrameGetMainResourceData(WKFrameRef frame, WKFrameGetResourceDataFunction function, void* functionContext);
WK_EXPORT void WKFrameGetResourceData(WKFrameRef frame, WKURLRef resourceURL, WKFrameGetResourceDataFunction function, void* functionContext);

typedef void (*WKFrameGetWebArchiveFunction)(WKDataRef archiveData, WKErrorRef error, void* functionContext);
WK_EXPORT void WKFrameGetWebArchive(WKFrameRef frame, WKFrameGetWebArchiveFunction function, void* functionContext);

#ifdef __cplusplus
}
#endif

#endif /* WKFrame_h */
