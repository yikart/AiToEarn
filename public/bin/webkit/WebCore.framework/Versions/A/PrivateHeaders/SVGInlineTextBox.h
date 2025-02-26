/*
 * Copyright (C) 2007 Rob Buis <buis@kde.org>
 * Copyright (C) 2007 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) Research In Motion Limited 2010. All rights reserved.
 * Copyright (C) 2023 Igalia S.L.
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

#include "LegacyInlineTextBox.h"

namespace WebCore {

class RenderSVGInlineText;
class SVGRootInlineBox;
struct SVGTextFragment;

class SVGInlineTextBox final : public LegacyInlineTextBox {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(SVGInlineTextBox);
public:
    explicit SVGInlineTextBox(RenderSVGInlineText&);

    inline RenderSVGInlineText& renderer() const;

    float virtualLogicalHeight() const override { return m_logicalHeight; }
    void setLogicalHeight(float height) { m_logicalHeight = height; }

    bool mapStartEndPositionsIntoFragmentCoordinates(const SVGTextFragment&, unsigned& startPosition, unsigned& endPosition) const;

    FloatRect calculateBoundaries() const;

    const Vector<SVGTextFragment>& textFragments() const { return m_textFragments; }
    void setTextFragments(Vector<SVGTextFragment>&&);

    void dirtyOwnLineBoxes() override;
    void dirtyLineBoxes() override;

    inline SVGInlineTextBox* nextTextBox() const;
    
private:
    bool isSVGInlineTextBox() const override { return true; }

private:
    float m_logicalHeight { 0 };

    Vector<SVGTextFragment> m_textFragments;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_INLINE_BOX(SVGInlineTextBox, isSVGInlineTextBox())
