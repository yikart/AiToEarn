/*
 * Copyright (C) 2022-2023 Apple Inc.  All rights reserved.
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

#include "Gradient.h"

namespace WebCore {

struct SourceBrushLogicalGradient {
    std::variant<Ref<Gradient>, RenderingResourceIdentifier> gradient;
    AffineTransform spaceTransform;

    std::variant<Ref<Gradient>, RenderingResourceIdentifier> serializableGradient() const;
    friend bool operator==(const SourceBrushLogicalGradient&, const SourceBrushLogicalGradient&);
};

inline std::variant<Ref<Gradient>, RenderingResourceIdentifier> SourceBrushLogicalGradient::serializableGradient() const
{
    return WTF::switchOn(gradient,
        [&] (const Ref<Gradient>& gradient) -> std::variant<Ref<Gradient>, RenderingResourceIdentifier> {
            if (gradient->hasValidRenderingResourceIdentifier())
                return gradient->renderingResourceIdentifier();
            return gradient;
        },
        [&] (RenderingResourceIdentifier renderingResourceIdentifier) -> std::variant<Ref<Gradient>, RenderingResourceIdentifier> {
            return renderingResourceIdentifier;
        }
    );
}

inline bool operator==(const SourceBrushLogicalGradient& a, const SourceBrushLogicalGradient& b)
{
    if (a.spaceTransform != b.spaceTransform)
        return false;

    return WTF::switchOn(a.gradient,
        [&] (const Ref<Gradient>& aGradient) {
            if (auto* bGradient = std::get_if<Ref<Gradient>>(&b.gradient))
                return aGradient.ptr() == bGradient->ptr();
            return false;
        },
        [&] (RenderingResourceIdentifier aRenderingResourceIdentifier) {
            if (auto* bRenderingResourceIdentifier = std::get_if<RenderingResourceIdentifier>(&b.gradient))
                return aRenderingResourceIdentifier == *bRenderingResourceIdentifier;
            return false;
        }
    );
}

} // namespace WebCore
