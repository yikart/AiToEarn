/*
    Copyright (C) 1999 Lars Knoll (knoll@kde.org)
    Copyright (C) 2006, 2008, 2015 Apple Inc. All rights reserved.
    Copyright (c) 2012, Google Inc. All rights reserved.

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.
*/

#pragma once

#include "Length.h"
#include "RectEdges.h"
#include "WritingMode.h"

namespace WebCore {

class LengthBox : public RectEdges<Length> {
public:
    LengthBox()
        : LengthBox(LengthType::Auto)
    {
    }

    explicit LengthBox(LengthType type)
        : RectEdges(Length(type), Length(type), Length(type), Length(type))
    {
    }

    explicit LengthBox(int v)
        : RectEdges(Length(v, LengthType::Fixed), Length(v, LengthType::Fixed), Length(v, LengthType::Fixed), Length(v, LengthType::Fixed))
    {
    }

    LengthBox(int top, int right, int bottom, int left)
        : RectEdges(Length(top, LengthType::Fixed), Length(right, LengthType::Fixed), Length(bottom, LengthType::Fixed), Length(left, LengthType::Fixed))
    {
    }

    LengthBox(Length&& top, Length&& right, Length&& bottom, Length&& left)
        : RectEdges { WTFMove(top), WTFMove(right), WTFMove(bottom), WTFMove(left) }
    {
    }

    LengthBox(const LengthBox&) = default;
    LengthBox& operator=(const LengthBox&) = default;

    bool isZero() const
    {
        return top().isZero() && right().isZero() && bottom().isZero() && left().isZero();
    }
};

using LayoutBoxExtent = RectEdges<LayoutUnit>;
using FloatBoxExtent = RectEdges<float>;
using IntBoxExtent = RectEdges<int>;

using IntOutsets = IntBoxExtent;
using LayoutOptionalOutsets = RectEdges<std::optional<LayoutUnit>>;

inline LayoutBoxExtent toLayoutBoxExtent(const IntBoxExtent& extent)
{
    return { extent.top(), extent.right(), extent.bottom(), extent.left() };
}

WTF::TextStream& operator<<(WTF::TextStream&, const LengthBox&);
WTF::TextStream& operator<<(WTF::TextStream&, const IntBoxExtent&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FloatBoxExtent&);

} // namespace WebCore
