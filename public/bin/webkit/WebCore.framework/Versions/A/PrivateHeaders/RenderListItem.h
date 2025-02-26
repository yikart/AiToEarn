/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2003-2023 Apple Inc. All rights reserved.
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

#include "RenderBlockFlow.h"
#include "RenderListMarker.h"

namespace WebCore {

class HTMLOListElement;

class RenderListItem final : public RenderBlockFlow {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderListItem);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderListItem);
public:
    RenderListItem(Element&, RenderStyle&&);
    virtual ~RenderListItem();

    Element& element() const { return downcast<Element>(nodeForNonAnonymous()); }

    int value() const;
    void updateValue();

    WEBCORE_EXPORT String markerTextWithoutSuffix() const;
    String markerTextWithSuffix() const;

    void updateListMarkerNumbers();

    static void updateItemValuesForOrderedList(const HTMLOListElement&);
    static unsigned itemCountForOrderedList(const HTMLOListElement&);

    RenderStyle computeMarkerStyle() const;

    RenderListMarker* markerRenderer() const { return m_marker.get(); }
    void setMarkerRenderer(RenderListMarker& marker) { m_marker = marker; }

    bool isInReversedOrderedList() const;

private:
    ASCIILiteral renderName() const final { return "RenderListItem"_s; }
    
    void paint(PaintInfo&, const LayoutPoint&) final;

    void styleDidChange(StyleDifference, const RenderStyle* oldStyle) final;
    void layout() final;

    void computePreferredLogicalWidths() final;

    void updateValueNow() const;
    void counterDirectivesChanged();

    SingleThreadWeakPtr<RenderListMarker> m_marker;
    mutable std::optional<int> m_value;
};

bool isHTMLListElement(const Node&);

inline int RenderListItem::value() const
{
    if (!m_value)
        updateValueNow();
    return m_value.value();
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderListItem, isRenderListItem())
