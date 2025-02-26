/*
* Copyright (C) 2012-2020 Apple Inc. All rights reserved.
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

#include <WebKit/WKBase.h>
#include <WebKit/WKGeometry.h>

#ifdef __cplusplus
extern "C" {
#endif

WK_EXPORT void WKRenderLayerGetTypeID(void);

WK_EXPORT void WKRenderLayerGetRenderer(void);

WK_EXPORT void WKRenderLayerCopyRendererName(void);

WK_EXPORT void WKRenderLayerCopyElementTagName(void);
WK_EXPORT void WKRenderLayerCopyElementID(void);
WK_EXPORT void WKRenderLayerGetElementClassNames(void);

WK_EXPORT void WKRenderLayerGetAbsoluteBounds(void);

WK_EXPORT void WKRenderLayerIsClipping(void);
WK_EXPORT void WKRenderLayerIsClipped(void);
WK_EXPORT void WKRenderLayerIsReflection(void);

WK_EXPORT void WKRenderLayerGetCompositingLayerType(void);
WK_EXPORT void WKRenderLayerGetBackingStoreMemoryEstimate(void);

WK_EXPORT void WKRenderLayerGetNegativeZOrderList(void);
WK_EXPORT void WKRenderLayerGetNormalFlowList(void);
WK_EXPORT void WKRenderLayerGetPositiveZOrderList(void);

WK_EXPORT void WKRenderLayerGetFrameContentsLayer(void);

#ifdef __cplusplus
}
#endif
