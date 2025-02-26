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

#include "Color.h"

namespace WebCore {

struct CompositionHighlight {
    CompositionHighlight() = default;
    CompositionHighlight(unsigned startOffset, unsigned endOffset, const std::optional<Color>& backgroundColor, const std::optional<Color>& foregroundColor)
        : startOffset(startOffset)
        , endOffset(endOffset)
        , backgroundColor(backgroundColor)
        , foregroundColor(foregroundColor)
    {
    }

#if PLATFORM(IOS_FAMILY)
    static constexpr auto defaultCompositionFillColor = SRGBA<uint8_t> { 175, 192, 227, 60 };
#else
    static constexpr auto defaultCompositionFillColor = SRGBA<uint8_t> { 225, 221, 85 };
#endif

    unsigned startOffset { 0 };
    unsigned endOffset { 0 };
    std::optional<Color> backgroundColor;
    std::optional<Color> foregroundColor;
};

} // namespace WebCore
