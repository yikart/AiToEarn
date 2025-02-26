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

class IdentityTransformOperation final : public TransformOperation {
public:
    WEBCORE_EXPORT static Ref<IdentityTransformOperation> create();

    Ref<TransformOperation> clone() const override
    {
        return create();
    }

private:
    bool isIdentity() const override { return true; }

    bool operator==(const TransformOperation& o) const override
    {
        return isSameType(o);
    }

    bool apply(TransformationMatrix&, const FloatSize&) const override
    {
        return false;
    }

    Ref<TransformOperation> blend(const TransformOperation*, const BlendingContext&, bool = false) override
    {
        return *this;
    }

    void dump(WTF::TextStream&) const final;

    IdentityTransformOperation();
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_TRANSFORMOPERATION(WebCore::IdentityTransformOperation, WebCore::TransformOperation::Type::Identity ==)
