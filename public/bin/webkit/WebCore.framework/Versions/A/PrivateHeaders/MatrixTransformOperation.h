/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003, 2005-2008, 2017 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Graham Dennis (graham.dennis@gmail.com)
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "TransformOperation.h"
#include "TransformationMatrix.h"
#include <wtf/Ref.h>

namespace WebCore {

struct BlendingContext;

class MatrixTransformOperation final : public TransformOperation {
public:
    static Ref<MatrixTransformOperation> create(double a, double b, double c, double d, double e, double f)
    {
        return adoptRef(*new MatrixTransformOperation(a, b, c, d, e, f));
    }

    WEBCORE_EXPORT static Ref<MatrixTransformOperation> create(const TransformationMatrix&);

    Ref<TransformOperation> clone() const override
    {
        return adoptRef(*new MatrixTransformOperation(matrix()));
    }

    TransformationMatrix matrix() const { return TransformationMatrix(m_a, m_b, m_c, m_d, m_e, m_f); }

private:
    bool isIdentity() const override { return m_a == 1 && m_b == 0 && m_c == 0 && m_d == 1 && m_e == 0 && m_f == 0; }
    bool isAffectedByTransformOrigin() const override { return !isIdentity(); }

    bool operator==(const MatrixTransformOperation& other) const { return operator==(static_cast<const TransformOperation&>(other)); }
    bool operator==(const TransformOperation&) const override;

    bool apply(TransformationMatrix& transform, const FloatSize&) const override
    {
        TransformationMatrix matrix(m_a, m_b, m_c, m_d, m_e, m_f);
        transform.multiply(matrix);
        return false;
    }

    Ref<TransformOperation> blend(const TransformOperation* from, const BlendingContext&, bool blendToIdentity = false) override;

    void dump(WTF::TextStream&) const final;

    MatrixTransformOperation(double a, double b, double c, double d, double e, double f)
        : TransformOperation(TransformOperation::Type::Matrix)
        , m_a(a)
        , m_b(b)
        , m_c(c)
        , m_d(d)
        , m_e(e)
        , m_f(f)
    {
    }

    MatrixTransformOperation(const TransformationMatrix&);

    double m_a;
    double m_b;
    double m_c;
    double m_d;
    double m_e;
    double m_f;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_TRANSFORMOPERATION(WebCore::MatrixTransformOperation, WebCore::TransformOperation::Type::Matrix ==)
