/*
    Copyright (C) 1999 Lars Knoll (knoll@kde.org)
    Copyright (C) 2006-2017 Apple Inc. All rights reserved.
    Copyright (C) 2011 Rik Cabanier (cabanier@adobe.com)
    Copyright (C) 2011 Adobe Systems Incorporated. All rights reserved.
    Copyright (C) 2012 Motorola Mobility, Inc. All rights reserved.

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

#include "LayoutUnit.h"
#include "Length.h"

namespace WebCore {

class FloatSize;
class FloatPoint;
class LayoutSize;

struct Length;
struct LengthSize;
struct LengthPoint;

int intValueForLength(const Length&, LayoutUnit maximumValue);
float floatValueForLength(const Length&, LayoutUnit maximumValue);
WEBCORE_EXPORT float floatValueForLength(const Length&, float maximumValue);
WEBCORE_EXPORT LayoutUnit valueForLength(const Length&, LayoutUnit maximumValue);

LayoutSize sizeForLengthSize(const LengthSize&, const LayoutSize& maximumValue);
FloatSize floatSizeForLengthSize(const LengthSize&, const FloatSize& maximumValue);

LayoutPoint pointForLengthPoint(const LengthPoint&, const LayoutSize& maximumValue);
FloatPoint floatPointForLengthPoint(const LengthPoint&, const FloatSize& maximumValue);

inline LayoutUnit minimumValueForLength(const Length& length, LayoutUnit maximumValue)
{
    switch (length.type()) {
    case LengthType::Fixed:
        return LayoutUnit(length.value());
    case LengthType::Percent:
        // Don't remove the extra cast to float. It is needed for rounding on 32-bit Intel machines that use the FPU stack.
        return LayoutUnit(static_cast<float>(maximumValue * length.percent() / 100.0f));
    case LengthType::Calculated:
        return LayoutUnit(length.nonNanCalculatedValue(maximumValue));
    case LengthType::FillAvailable:
    case LengthType::Auto:
    case LengthType::Normal:
    case LengthType::Content:
        return 0;
    case LengthType::Relative:
    case LengthType::Intrinsic:
    case LengthType::MinIntrinsic:
    case LengthType::MinContent:
    case LengthType::MaxContent:
    case LengthType::FitContent:
    case LengthType::Undefined:
        break;
    }
    ASSERT_NOT_REACHED();
    return 0;
}

inline int minimumIntValueForLength(const Length& length, LayoutUnit maximumValue)
{
    return static_cast<int>(minimumValueForLength(length, maximumValue));
}

template<typename T> inline LayoutUnit valueForLength(const Length& length, T maximumValue) { return valueForLength(length, LayoutUnit(maximumValue)); }
template<typename T> inline LayoutUnit minimumValueForLength(const Length& length, T maximumValue) { return minimumValueForLength(length, LayoutUnit(maximumValue)); }

} // namespace WebCore
