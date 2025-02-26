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
#include <wtf/Ref.h>

namespace WebCore {

struct BlendingContext;

class RotateTransformOperation final : public TransformOperation {
public:
    static Ref<RotateTransformOperation> create(double angle, TransformOperation::Type type)
    {
        return adoptRef(*new RotateTransformOperation(0, 0, 1, angle, type));
    }

    WEBCORE_EXPORT static Ref<RotateTransformOperation> create(double, double, double, double, TransformOperation::Type);

    Ref<TransformOperation> clone() const final
    {
        return adoptRef(*new RotateTransformOperation(m_x, m_y, m_z, m_angle, type()));
    }

    double x() const { return m_x; }
    double y() const { return m_y; }
    double z() const { return m_z; }
    double angle() const { return m_angle; }

    TransformOperation::Type primitiveType() const final { return type() == Type::Rotate ? Type::Rotate : Type::Rotate3D; }

    bool operator==(const RotateTransformOperation& other) const { return operator==(static_cast<const TransformOperation&>(other)); }
    bool operator==(const TransformOperation&) const final;

    Ref<TransformOperation> blend(const TransformOperation* from, const BlendingContext&, bool blendToIdentity = false) final;

    bool isIdentity() const final { return !m_angle; }

    bool isRepresentableIn2D() const final { return (!m_x && !m_y) || !m_angle; }

    bool isAffectedByTransformOrigin() const final { return !isIdentity(); }

    bool apply(TransformationMatrix& transform, const FloatSize& /*borderBoxSize*/) const final
    {
        if (type() == TransformOperation::Type::Rotate)
            transform.rotate(m_angle);
        else
            transform.rotate3d(m_x, m_y, m_z, m_angle);
        return false;
    }

    bool applyUnrounded(TransformationMatrix& transform, const FloatSize& /*borderBoxSize*/) const final
    {
        if (type() == TransformOperation::Type::Rotate)
            transform.rotate(m_angle, TransformationMatrix::RotationSnapping::None);
        else
            transform.rotate3d(m_x, m_y, m_z, m_angle, TransformationMatrix::RotationSnapping::None);
        return false;
    }


    void dump(WTF::TextStream&) const final;

private:
    RotateTransformOperation(double, double, double, double, TransformOperation::Type);

    double m_x;
    double m_y;
    double m_z;
    double m_angle;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_TRANSFORMOPERATION(WebCore::RotateTransformOperation, WebCore::TransformOperation::isRotateTransformOperationType)
