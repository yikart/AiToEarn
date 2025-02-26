/*
 * Copyright (C) 2024 Apple Inc.  All rights reserved.
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

#if USE(CG)

#include "ImageBuffer.h"
#include "ImageBufferCGBackend.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class ImageBufferCGPDFDocumentBackend : public ImageBufferCGBackend {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ImageBufferCGPDFDocumentBackend);
    WTF_MAKE_NONCOPYABLE(ImageBufferCGPDFDocumentBackend);
public:
    WEBCORE_EXPORT static size_t calculateMemoryCost(const Parameters&);
    WEBCORE_EXPORT static std::unique_ptr<ImageBufferCGPDFDocumentBackend> create(const Parameters&, const ImageBufferCreationContext&);

    ~ImageBufferCGPDFDocumentBackend();

    static constexpr RenderingMode renderingMode = RenderingMode::PDFDocument;

private:
    ImageBufferCGPDFDocumentBackend(const Parameters&, RetainPtr<CFDataRef>&&, std::unique_ptr<GraphicsContextCG>&&);

    bool canMapBackingStore() const { return false; }
    unsigned bytesPerRow() const final { return 0; }
    GraphicsContext& context() final;

    RefPtr<NativeImage> copyNativeImage() final { return createNativeImageReference(); }
    RefPtr<NativeImage> createNativeImageReference() final { return nullptr; }

    void getPixelBuffer(const IntRect&, PixelBuffer&) final { ASSERT_NOT_REACHED(); }
    void putPixelBuffer(const PixelBuffer&, const IntRect&, const IntPoint&, AlphaPremultiplication) final { ASSERT_NOT_REACHED(); }

    RefPtr<SharedBuffer> sinkIntoPDFDocument() final;

    String debugDescription() const final;

    RetainPtr<CFDataRef> m_data;
};

} // namespace WebCore

#endif // USE(CG)
