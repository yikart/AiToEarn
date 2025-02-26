/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "ImageBuffer.h"
#include "RenderReplaced.h"

namespace WebCore {

class RenderViewTransitionCapture final : public RenderReplaced {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderViewTransitionCapture);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderViewTransitionCapture);
public:
    RenderViewTransitionCapture(Type, Document&, RenderStyle&&);
    virtual ~RenderViewTransitionCapture();

    void setImage(RefPtr<ImageBuffer>);
    bool setCapturedSize(const LayoutSize&, const LayoutRect& overflowRect, const LayoutPoint& layerToLayoutOffset);

    void paintReplaced(PaintInfo&, const LayoutPoint& paintOffset) override;
    void intrinsicSizeChanged() override;

    void layout() override;

    FloatSize scale() const { return m_scale; }

    // Rect covered by the captured contents, in RenderLayer coordinates of the captured renderer
    LayoutRect captureOverflowRect() const { return m_overflowRect; }

    LayoutRect captureLocalOverflowRect() const { return m_localOverflowRect; }

    // Inset of the scaled capture from the visualOverflowRect()
    LayoutPoint captureContentInset() const;

    bool canUseExistingLayers() const { return !hasNonVisibleOverflow(); }

    bool paintsContent() const final;

    RefPtr<ImageBuffer> image() { return m_oldImage; }

private:
    ASCIILiteral renderName() const override { return "RenderViewTransitionCapture"_s; }
    String debugDescription() const override;

    void updateFromStyle() override;

    Node* nodeForHitTest() const override;

    RefPtr<ImageBuffer> m_oldImage;
    // The overflow rect that the captured image represents, in RenderLayer coordinates
    // of the captured renderer (see layerToLayoutOffset in ViewTransition.cpp).
    // The intrisic size subset of the image is stored as the intrinsic size of the RenderReplaced.
    LayoutRect m_overflowRect;
    // The offset between coordinates used by RenderLayer, and RenderObject
    // for the captured renderer
    LayoutPoint m_layerToLayoutOffset;
    // The overflow rect of the snapshot (replaced content), scaled and positioned
    // so that the intrinsic size of the image fits the replaced content rect.
    LayoutRect m_localOverflowRect;
    LayoutSize m_imageIntrinsicSize;
    // Scale factor between the intrinsic size and the replaced content rect size.
    FloatSize m_scale;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderViewTransitionCapture, isRenderViewTransitionCapture())
