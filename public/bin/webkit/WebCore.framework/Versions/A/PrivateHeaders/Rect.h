/**
 * Copyright (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
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

#include "RectBase.h"
#include <wtf/text/MakeString.h>

namespace WebCore {

class Rect final : public RectBase {
public:
    Rect(Ref<CSSPrimitiveValue> top, Ref<CSSPrimitiveValue> right, Ref<CSSPrimitiveValue> bottom, Ref<CSSPrimitiveValue> left)
        : RectBase(WTFMove(top), WTFMove(right), WTFMove(bottom), WTFMove(left))
    { }

    String cssText() const
    {
        return generateCSSString(top().cssText(), right().cssText(), bottom().cssText(), left().cssText());
    }

private:
    static String generateCSSString(const String& top, const String& right, const String& bottom, const String& left)
    {
        return makeString("rect("_s, top, ", "_s, right, ", "_s, bottom, ", "_s, left, ')');
    }
};

} // namespace WebCore
