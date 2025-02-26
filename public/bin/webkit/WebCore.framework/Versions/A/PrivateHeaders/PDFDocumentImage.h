/*
 * Copyright (C) 2004-2023 Apple Inc.  All rights reserved.
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

#include "CachedSubimage.h"
#include "FloatRect.h"
#include "GraphicsTypes.h"
#include "Image.h"
#include <wtf/RuntimeApplicationChecks.h>

#if USE(CG)

#if PLATFORM(MAC)
#define USE_PDFKIT_FOR_PDFDOCUMENTIMAGE 1
#endif

typedef struct CGPDFDocument *CGPDFDocumentRef;
OBJC_CLASS PDFDocument;

namespace WebCore {

class PDFDocumentImage final : public Image {
    friend CachedSubimage;
public:
    static Ref<PDFDocumentImage> create(ImageObserver* observer)
    {
#if ENABLE(GPU_PROCESS)
        RELEASE_ASSERT(!isInGPUProcess());
#endif
        return adoptRef(*new PDFDocumentImage(observer));
    }

    unsigned cachedSubimageCreateCountForTesting() const { return m_cachedSubimageCreateCountForTesting; }
    unsigned cachedSubimageDrawCountForTesting() const { return m_cachedSubimageDrawCountForTesting; }

private:
    PDFDocumentImage(ImageObserver*);
    virtual ~PDFDocumentImage();

    bool isPDFDocumentImage() const override { return true; }

    String filenameExtension() const override;

    EncodedDataStatus dataChanged(bool allDataReceived) override;

    void destroyDecodedData(bool destroyAll = true) override;

    void computeIntrinsicDimensions(Length& intrinsicWidth, Length& intrinsicHeight, FloatSize& intrinsicRatio) override;
    FloatSize size(ImageOrientation = ImageOrientation::Orientation::FromImage) const override;

    bool shouldDrawFromCachedSubimage(GraphicsContext&) const override;
    bool mustDrawFromCachedSubimage(GraphicsContext&) const override;

    std::unique_ptr<CachedSubimage> createCachedSubimage(GraphicsContext&, const FloatRect& destinationRect, const FloatRect& sourceRect, ImagePaintingOptions);

    ImageDrawResult drawPDFDocument(GraphicsContext&, const FloatRect& destinationRect, const FloatRect& sourceRect, ImagePaintingOptions);
    ImageDrawResult drawFromCachedSubimage(GraphicsContext&, const FloatRect& destinationRect, const FloatRect& sourceRect, ImagePaintingOptions);
    ImageDrawResult draw(GraphicsContext&, const FloatRect& destinationRect, const FloatRect& sourceRect, ImagePaintingOptions = { }) override;

    // FIXME: Implement this to be less conservative.
    bool currentFrameKnownToBeOpaque() const override { return false; }

    void dump(WTF::TextStream&) const override;

    void createPDFDocument();
    void computeBoundsForCurrentPage();
    unsigned pageCount() const;
    void drawPDFPage(GraphicsContext&);

    void decodedSizeChanged(size_t newCachedBytes);

#if USE(PDFKIT_FOR_PDFDOCUMENTIMAGE)
    RetainPtr<PDFDocument> m_document;
#else
    RetainPtr<CGPDFDocumentRef> m_document;
#endif

    size_t m_cachedBytes { 0 };
    FloatRect m_cropBox;
    int m_rotationDegrees { 0 }; // Can only be 0, 90, 180, or 270 degrees.
    bool m_hasPage { false };

    std::unique_ptr<CachedSubimage> m_cachedSubimage;
    unsigned m_cachedSubimageCreateCountForTesting { 0 };
    unsigned m_cachedSubimageDrawCountForTesting { 0 };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_IMAGE(PDFDocumentImage)

#endif // USE(CG)
