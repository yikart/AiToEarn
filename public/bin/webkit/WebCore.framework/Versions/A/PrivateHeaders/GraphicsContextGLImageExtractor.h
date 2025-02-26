/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(WEBGL)

#include "GraphicsContextGL.h"

namespace WebCore {

class GraphicsContextGLImageExtractor {
public:
    using DOMSource = GraphicsContextGL::DOMSource;
    using DataFormat = GraphicsContextGL::DataFormat;
    using AlphaOp = GraphicsContextGL::AlphaOp;
    GraphicsContextGLImageExtractor(Image&, DOMSource, bool premultiplyAlpha, bool ignoreGammaAndColorProfile, bool ignoreNativeImageAlphaPremultiplication);

    // Each platform must provide an implementation of this method to deallocate or release resources
    // associated with the image if needed.
    ~GraphicsContextGLImageExtractor();

    bool extractSucceeded() { return m_extractSucceeded; }
    const void* imagePixelData() { return m_imagePixelData; }
    unsigned imageWidth() { return m_imageWidth; }
    unsigned imageHeight() { return m_imageHeight; }
    DataFormat imageSourceFormat() { return m_imageSourceFormat; }
    AlphaOp imageAlphaOp() { return m_alphaOp; }
    unsigned imageSourceUnpackAlignment() { return m_imageSourceUnpackAlignment; }
    DOMSource imageHtmlDomSource() { return m_imageHtmlDomSource; }
private:
    // Each platform must provide an implementation of this method.
    // Extracts the image and keeps track of its status, such as width, height, Source Alignment, format and AlphaOp etc,
    // needs to lock the resources or relevant data if needed and returns true upon success
    bool extractImage(bool premultiplyAlpha, bool ignoreGammaAndColorProfile, bool ignoreNativeImageAlphaPremultiplication);

#if USE(CAIRO)
    RefPtr<cairo_surface_t> m_imageSurface;
#elif USE(CG)
    RetainPtr<CFDataRef> m_pixelData;
    UniqueArray<uint8_t> m_formalizedRGBA8Data;
#elif USE(SKIA)
    sk_sp<SkData> m_pixelData;
    sk_sp<SkImage> m_skImage;
#endif
    Ref<Image> m_image;
    DOMSource m_imageHtmlDomSource;
    bool m_extractSucceeded;
    const void* m_imagePixelData;
    unsigned m_imageWidth;
    unsigned m_imageHeight;
    DataFormat m_imageSourceFormat;
    AlphaOp m_alphaOp;
    unsigned m_imageSourceUnpackAlignment;
};

}

#endif
