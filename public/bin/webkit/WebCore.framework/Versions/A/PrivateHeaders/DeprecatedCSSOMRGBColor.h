/*
 * Copyright (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2020 Apple Inc. All rights reserved.
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
 */

#pragma once

#include "Color.h"
#include "DeprecatedCSSOMPrimitiveValue.h"
#include <wtf/Ref.h>

namespace WebCore {

class DeprecatedCSSOMRGBColor final : public RefCounted<DeprecatedCSSOMRGBColor> {
public:
    static Ref<DeprecatedCSSOMRGBColor> create(CSSStyleDeclaration& owner, const WebCore::Color& color)
    {
        return adoptRef(*new DeprecatedCSSOMRGBColor(owner, color));
    }

    DeprecatedCSSOMPrimitiveValue& red() { return m_red; }
    DeprecatedCSSOMPrimitiveValue& green() { return m_green; }
    DeprecatedCSSOMPrimitiveValue& blue() { return m_blue; }
    DeprecatedCSSOMPrimitiveValue& alpha() { return m_alpha; }

    ResolvedColorType<SRGBA<uint8_t>> color() const { return m_color; }

private:
    template<typename NumberType> static Ref<DeprecatedCSSOMPrimitiveValue> createWrapper(CSSStyleDeclaration& owner, NumberType number)
    {
        return DeprecatedCSSOMPrimitiveValue::create(CSSPrimitiveValue::create(number), owner);
    }

    DeprecatedCSSOMRGBColor(CSSStyleDeclaration& owner, const WebCore::Color& color)
        : m_color(color.toColorTypeLossy<SRGBA<uint8_t>>().resolved())
        , m_red(createWrapper(owner, m_color.red))
        , m_green(createWrapper(owner, m_color.green))
        , m_blue(createWrapper(owner, m_color.blue))
        , m_alpha(createWrapper(owner, color.alphaAsFloat()))
    {
    }

    ResolvedColorType<SRGBA<uint8_t>> m_color;
    Ref<DeprecatedCSSOMPrimitiveValue> m_red;
    Ref<DeprecatedCSSOMPrimitiveValue> m_green;
    Ref<DeprecatedCSSOMPrimitiveValue> m_blue;
    Ref<DeprecatedCSSOMPrimitiveValue> m_alpha;
};

} // namespace WebCore
