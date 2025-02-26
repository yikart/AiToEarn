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

class SkewTransformOperation final : public TransformOperation {
public:
    WEBCORE_EXPORT static Ref<SkewTransformOperation> create(double, double, TransformOperation::Type);

    Ref<TransformOperation> clone() const override
    {
        return adoptRef(*new SkewTransformOperation(m_angleX, m_angleY, type()));
    }

    double angleX() const { return m_angleX; }
    double angleY() const { return m_angleY; }

private:
    bool isIdentity() const override { return m_angleX == 0 && m_angleY == 0; }
    bool isAffectedByTransformOrigin() const override { return !isIdentity(); }

    bool operator==(const SkewTransformOperation& other) const { return operator==(static_cast<const TransformOperation&>(other)); }
    bool operator==(const TransformOperation&) const override;

    bool apply(TransformationMatrix& transform, const FloatSize&) const override
    {
        transform.skew(m_angleX, m_angleY);
        return false;
    }

    Ref<TransformOperation> blend(const TransformOperation* from, const BlendingContext&, bool blendToIdentity = false) override;

    void dump(WTF::TextStream&) const final;
    
    SkewTransformOperation(double, double, TransformOperation::Type);

    double m_angleX;
    double m_angleY;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_TRANSFORMOPERATION(WebCore::SkewTransformOperation, WebCore::TransformOperation::isSkewTransformOperationType)
