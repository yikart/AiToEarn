/*
 * Copyright (C) 2023 Apple Inc. All Rights Reserved.
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

#include "ControlPart.h"
#include "IntRect.h"

namespace WebCore {

class SliderTrackPart : public ControlPart {
public:
    static Ref<SliderTrackPart> create(StyleAppearance);
    WEBCORE_EXPORT static Ref<SliderTrackPart> create(StyleAppearance, const IntSize& thumbSize, const IntRect& trackBounds, Vector<double>&& tickRatios, double thumbPosition);

    IntSize thumbSize() const { return m_thumbSize; }
    void setThumbSize(IntSize thumbSize) { m_thumbSize = thumbSize; }

    IntRect trackBounds() const { return m_trackBounds; }
    void setTrackBounds(IntRect trackBounds) { m_trackBounds = trackBounds; }

    const Vector<double>& tickRatios() const { return m_tickRatios; }
    void setTickRatios(Vector<double>&& tickRatios) { m_tickRatios = WTFMove(tickRatios); }

    double thumbPosition() const { return m_thumbPosition; }
    void setThumbPosition(double thumbPosition) { m_thumbPosition = thumbPosition; }

#if ENABLE(DATALIST_ELEMENT)
    void drawTicks(GraphicsContext&, const FloatRect&, const ControlStyle&) const;
#endif

private:
    SliderTrackPart(StyleAppearance, const IntSize& thumbSize, const IntRect& trackBounds, Vector<double>&& tickRatios, double thumbPosition);

    std::unique_ptr<PlatformControl> createPlatformControl() override;

    IntSize m_thumbSize;
    IntRect m_trackBounds;
    Vector<double> m_tickRatios;
    double m_thumbPosition;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::SliderTrackPart) \
    static bool isType(const WebCore::ControlPart& part) { return part.type() == WebCore::StyleAppearance::SliderHorizontal || part.type() == WebCore::StyleAppearance::SliderVertical; } \
SPECIALIZE_TYPE_TRAITS_END()
