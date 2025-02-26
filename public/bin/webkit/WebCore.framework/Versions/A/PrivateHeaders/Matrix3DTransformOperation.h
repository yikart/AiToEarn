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

#include "TransformOperation.h"
#include <wtf/Ref.h>

namespace WebCore {

struct BlendingContext;

class Matrix3DTransformOperation final : public TransformOperation {
public:
    WEBCORE_EXPORT static Ref<Matrix3DTransformOperation> create(const TransformationMatrix&);

    Ref<TransformOperation> clone() const override
    {
        return adoptRef(*new Matrix3DTransformOperation(m_matrix));
    }

    TransformationMatrix matrix() const {return m_matrix; }

private:    
    bool isIdentity() const override { return m_matrix.isIdentity(); }
    bool isAffectedByTransformOrigin() const final { return !isIdentity(); }

    bool isRepresentableIn2D() const final;

    bool operator==(const Matrix3DTransformOperation& other) const { return operator==(static_cast<const TransformOperation&>(other)); }
    bool operator==(const TransformOperation&) const override;

    bool apply(TransformationMatrix& transform, const FloatSize&) const override
    {
        transform.multiply(m_matrix);
        return false;
    }

    Ref<TransformOperation> blend(const TransformOperation* from, const BlendingContext&, bool blendToIdentity = false) override;
    
    void dump(WTF::TextStream&) const final;

    Matrix3DTransformOperation(const TransformationMatrix&);

    TransformationMatrix m_matrix;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_TRANSFORMOPERATION(WebCore::Matrix3DTransformOperation, WebCore::TransformOperation::Type::Matrix3D ==)
