/*
 * Copyright (C) 2006 Rob Buis <buis@kde.org>
 * Copyright (C) 2008-2021 Apple Inc. All right reserved.
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

#include "CSSValue.h"
#include "CSSValuePair.h"
#include "IntPoint.h"
#include "ResourceLoaderOptions.h"
#include <wtf/WeakHashSet.h>

namespace WebCore {

class StyleCursorImage;
class StyleImage;

namespace Style {
class BuilderState;
}

class CSSCursorImageValue final : public CSSValue {
public:
    static Ref<CSSCursorImageValue> create(Ref<CSSValue>&& imageValue, RefPtr<CSSValue>&& hotSpot, LoadedFromOpaqueSource);
    static Ref<CSSCursorImageValue> create(Ref<CSSValue>&& imageValue, RefPtr<CSSValue>&& hotSpot, URL, LoadedFromOpaqueSource);
    ~CSSCursorImageValue();

    const URL& imageURL() const { return m_originalURL; }
    String customCSSText() const;
    bool equals(const CSSCursorImageValue&) const;

    IterationStatus customVisitChildren(const Function<IterationStatus(CSSValue&)>& func) const
    {
        return func(m_imageValue.get());
    }

    RefPtr<StyleCursorImage> createStyleImage(const Style::BuilderState&) const;

private:
    CSSCursorImageValue(Ref<CSSValue>&& imageValue, RefPtr<CSSValue>&& hotSpot, URL, LoadedFromOpaqueSource);

    URL m_originalURL;
    Ref<CSSValue> m_imageValue;
    RefPtr<CSSValue> m_hotSpot;
    LoadedFromOpaqueSource m_loadedFromOpaqueSource { LoadedFromOpaqueSource::No };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSCursorImageValue, isCursorImageValue())
