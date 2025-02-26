/*
 * Copyright (C) 2023 Apple Inc.  All rights reserved.
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

#include "FloatRect.h"
#include "ImageTypes.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class GraphicsContext;
class ImageBuffer;
struct ImagePaintingOptions;

class CachedSubimage {
    WTF_MAKE_TZONE_ALLOCATED(CachedSubimage);
public:
    static std::unique_ptr<CachedSubimage> create(GraphicsContext&, const FloatSize& imageSize, const FloatRect& destinationRect, const FloatRect& sourceRect);
    static std::unique_ptr<CachedSubimage> createPixelated(GraphicsContext&, const FloatRect& destinationRect, const FloatRect& sourceRect);

    CachedSubimage(Ref<ImageBuffer>&&, const FloatSize& scaleFactor, const FloatRect& destinationRect, const FloatRect& sourceRect);

    ImageBuffer& imageBuffer() const { return m_imageBuffer; }
    FloatSize scaleFactor() const { return m_scaleFactor; }
    FloatRect destinationRect() const { return m_destinationRect; }
    FloatRect sourceRect() const { return m_sourceRect; }

    bool canBeUsed(GraphicsContext&, const FloatRect& destinationRect, const FloatRect& sourceRect) const;
    void draw(GraphicsContext&, const FloatRect& destinationRect, const FloatRect& sourceRect);

    // The tile size is usually 512 x 512, account for the 2x display resolution
    // and make room for one more tile in every direction.
    static constexpr float maxSide = 512 * 2 * 3;
    static constexpr float maxArea = maxSide * maxSide;

private:
    Ref<ImageBuffer> m_imageBuffer;
    FloatSize m_scaleFactor;
    FloatRect m_destinationRect;
    FloatRect m_sourceRect;
};

} // namespace WebCore
