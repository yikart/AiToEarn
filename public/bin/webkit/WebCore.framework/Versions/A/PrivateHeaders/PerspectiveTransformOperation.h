/*
 * Copyright (C) 2009 Apple Inc. All rights reserved.
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

#include "Length.h"
#include "LengthFunctions.h"
#include "TransformOperation.h"
#include <optional>
#include <wtf/Ref.h>

namespace WebCore {

struct BlendingContext;

class PerspectiveTransformOperation final : public TransformOperation {
public:
    WEBCORE_EXPORT static Ref<PerspectiveTransformOperation> create(const std::optional<Length>&);

    Ref<TransformOperation> clone() const override
    {
        return adoptRef(*new PerspectiveTransformOperation(m_p));
    }

    std::optional<Length> perspective() const { return m_p; }
    
private:
    bool isIdentity() const override { return !m_p; }
    bool isAffectedByTransformOrigin() const override { return !isIdentity(); }
    bool isRepresentableIn2D() const final { return false; }

    bool operator==(const PerspectiveTransformOperation& other) const { return operator==(static_cast<const TransformOperation&>(other)); }
    bool operator==(const TransformOperation&) const override;

    std::optional<float> floatValue() const
    {
        if (!m_p)
            return { };

        // From https://www.w3.org/TR/css-transforms-2/#perspective-property:
        // "As very small <length> values can produce bizarre rendering results and stress the numerical accuracy of
        // transform calculations, values less than 1px must be treated as 1px for rendering purposes. (This clamping
        // does not affect the underlying value, so perspective: 0; in a stylesheet will still serialize back as 0.)"
        return std::max(1.0f, floatValueForLength(*m_p, 1.0));
    }

    bool apply(TransformationMatrix& transform, const FloatSize&) const override
    {
        if (auto value = floatValue())
            transform.applyPerspective(*value);
        return false;
    }

    Ref<TransformOperation> blend(const TransformOperation* from, const BlendingContext&, bool blendToIdentity = false) override;

    void dump(WTF::TextStream&) const final;

    PerspectiveTransformOperation(const std::optional<Length>&);

    std::optional<Length> m_p;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_TRANSFORMOPERATION(WebCore::PerspectiveTransformOperation, WebCore::TransformOperation::Type::Perspective ==)
