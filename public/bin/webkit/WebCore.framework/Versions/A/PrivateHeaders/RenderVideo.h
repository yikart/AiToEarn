/*
 * Copyright (C) 2007, 2009, 2010 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "HTMLVideoElement.h"
#include "RenderMedia.h"

namespace WebCore {

class RenderVideo final : public RenderMedia {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderVideo);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderVideo);
public:
    RenderVideo(HTMLVideoElement&, RenderStyle&&);
    virtual ~RenderVideo();

    WEBCORE_EXPORT HTMLVideoElement& videoElement() const;

    WEBCORE_EXPORT IntRect videoBox() const;

    static IntSize defaultSize();

    bool supportsAcceleratedRendering() const;
    void acceleratedRenderingStateChanged();

    bool requiresImmediateCompositing() const;

    bool shouldDisplayVideo() const;
    bool failedToLoadPosterImage() const;

    void updateFromElement() final;
    bool hasVideoMetadata() const;
    bool hasPosterFrameSize() const;
    bool hasDefaultObjectSize() const;

private:
    void willBeDestroyed() override;
    void mediaElement() const = delete;

    void intrinsicSizeChanged() final;
    LayoutSize calculateIntrinsicSizeInternal();
    LayoutSize calculateIntrinsicSize();
    bool updateIntrinsicSize();

    void imageChanged(WrappedImagePtr, const IntRect*) final;

    ASCIILiteral renderName() const final { return "RenderVideo"_s; }

    bool requiresLayer() const final { return true; }

    void paintReplaced(PaintInfo&, const LayoutPoint&) final;

    void layout() final;
    void styleDidChange(StyleDifference, const RenderStyle* oldStyle) final;

    void visibleInViewportStateChanged() final;

    LayoutUnit computeReplacedLogicalWidth(ShouldComputePreferred  = ShouldComputePreferred::ComputeActual) const final;
    LayoutUnit minimumReplacedHeight() const final;

    void updatePlayer();

    bool foregroundIsKnownToBeOpaqueInRect(const LayoutRect& localRect, unsigned maxDepthToTest) const final;

    LayoutSize m_cachedImageSize;
};

inline RenderVideo* HTMLVideoElement::renderer() const
{
    return downcast<RenderVideo>(HTMLMediaElement::renderer());
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderVideo, isRenderVideo())

#endif // ENABLE(VIDEO)
