/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003, 2005, 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
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

#include "FloatRect.h"
#include "LayoutRect.h"
#include "Length.h"
#include "LengthBox.h"
#include "LengthPoint.h"
#include "StyleColor.h"
#include "StylePrimitiveNumericTypes.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

namespace Style {
struct BoxShadow;
struct TextShadow;
}

enum class ShadowStyle : bool { Normal, Inset };

// This class holds information about shadows for the text-shadow and box-shadow properties.

class ShadowData {
    WTF_MAKE_TZONE_ALLOCATED(ShadowData);
public:
    ShadowData(Style::BoxShadow&&);
    ShadowData(Style::TextShadow&&);

    ~ShadowData();

    ShadowData(const ShadowData&);
    static std::optional<ShadowData> clone(const ShadowData*);

    ShadowData& operator=(ShadowData&&) = default;

    bool operator==(const ShadowData&) const;

    Style::BoxShadow asBoxShadow() const;
    Style::TextShadow asTextShadow() const;

    const Style::Length<>& x() const { return m_location.x(); }
    const Style::Length<>& y() const { return m_location.y(); }
    const SpaceSeparatedPoint<Style::Length<>>& location() const { return m_location; }
    const Style::Length<CSS::Nonnegative>& radius() const { return m_blur; }
    const Style::Length<>& spread() const { return m_spread; }

    LayoutUnit paintingExtent() const
    {
        // Blurring uses a Gaussian function whose std. deviation is m_radius/2, and which in theory
        // extends to infinity. In 8-bit contexts, however, rounding causes the effect to become
        // undetectable at around 1.4x the radius.
        const float radiusExtentMultiplier = 1.4;
        return LayoutUnit(ceilf(m_blur.value * radiusExtentMultiplier));
    }

    ShadowStyle style() const { return m_style; }

    void setColor(const Style::Color& color) { m_color = color; }
    const Style::Color& color() const { return m_color; }

    bool isWebkitBoxShadow() const { return m_isWebkitBoxShadow; }

    const ShadowData* next() const { return m_next.get(); }
    void setNext(std::unique_ptr<ShadowData>&& next) { m_next = WTFMove(next); }

    void adjustRectForShadow(LayoutRect&) const;
    void adjustRectForShadow(FloatRect&) const;

    LayoutBoxExtent shadowOutsetExtent() const;
    LayoutBoxExtent shadowInsetExtent() const;

    static LayoutBoxExtent shadowOutsetExtent(const ShadowData*);
    static LayoutBoxExtent shadowInsetExtent(const ShadowData*);

private:
    void deleteNextLinkedListWithoutRecursion();

    Style::Color m_color;
    SpaceSeparatedPoint<Style::Length<>> m_location;
    Style::Length<CSS::Nonnegative> m_blur;
    Style::Length<> m_spread;
    ShadowStyle m_style;
    bool m_isWebkitBoxShadow;

    std::unique_ptr<ShadowData> m_next;
};

inline ShadowData::~ShadowData()
{
    if (m_next)
        deleteNextLinkedListWithoutRecursion();
}


inline LayoutBoxExtent ShadowData::shadowOutsetExtent(const ShadowData* shadow)
{
    if (!shadow)
        return { };

    return shadow->shadowOutsetExtent();
}

inline LayoutBoxExtent ShadowData::shadowInsetExtent(const ShadowData* shadow)
{
    if (!shadow)
        return { };

    return shadow->shadowInsetExtent();
}

WTF::TextStream& operator<<(WTF::TextStream&, const ShadowData&);

} // namespace WebCore
