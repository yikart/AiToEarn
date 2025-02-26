/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003, 2005, 2006, 2007, 2008 Apple Inc. All rights reserved.
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

#include "LengthPoint.h"
#include "RenderStyleConstants.h"
#include "TransformOperations.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>

namespace WebCore {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleTransformData);
class StyleTransformData : public RefCounted<StyleTransformData> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleTransformData);
public:
    static Ref<StyleTransformData> create() { return adoptRef(*new StyleTransformData); }
    Ref<StyleTransformData> copy() const;

    bool operator==(const StyleTransformData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleTransformData&) const;
#endif

    bool hasTransform() const { return operations.size(); }

    LengthPoint originXY() const { return { x, y }; }

    TransformOperations operations;
    Length x;
    Length y;
    float z;
    TransformBox transformBox;

private:
    StyleTransformData();
    StyleTransformData(const StyleTransformData&);
};

} // namespace WebCore
