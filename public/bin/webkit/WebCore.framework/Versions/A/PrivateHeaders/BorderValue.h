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

#include "RenderStyleConstants.h"
#include "StyleColor.h"

namespace WebCore {

class RenderStyle;

class BorderValue {
friend class RenderStyle;
public:
    BorderValue();

    bool nonZero() const
    {
        return width() && style() != BorderStyle::None;
    }

    bool isTransparent() const;

    bool isVisible() const;

    friend bool operator==(const BorderValue&, const BorderValue&) = default;

    void setColor(const Style::Color& color)
    {
        m_color = color;
    }

    const Style::Color& color() const { return m_color; }

    float width() const { return m_width; }
    BorderStyle style() const { return static_cast<BorderStyle>(m_style); }

protected:
    Style::Color m_color;

    float m_width { 3 };

    unsigned m_style : 4; // BorderStyle

    // This is only used by OutlineValue but moved here to keep the bits packed.
    unsigned m_isAuto : 1; // OutlineIsAuto
};

} // namespace WebCore
