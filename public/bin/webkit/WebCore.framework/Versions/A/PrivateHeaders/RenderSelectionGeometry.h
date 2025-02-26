/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 *           (C) 2004 Allan Sandfeld Jensen (kde@carewolf.com)
 * Copyright (C) 2003, 2004, 2005, 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
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

#include "GapRects.h"
#include "RenderBlock.h"
#include "RenderObject.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class RenderSelectionGeometryBase {
    WTF_MAKE_TZONE_ALLOCATED(RenderSelectionGeometryBase);
    WTF_MAKE_NONCOPYABLE(RenderSelectionGeometryBase);
public:
    explicit RenderSelectionGeometryBase(RenderObject& renderer);
    const RenderLayerModelObject* repaintContainer() const { return m_repaintContainer; }
    RenderObject::HighlightState state() const { return m_state; }

protected:
    void repaintRectangle(const LayoutRect& repaintRect);

    RenderObject& m_renderer;
    const RenderLayerModelObject* m_repaintContainer;

private:
    RenderObject::HighlightState m_state;
};

// This struct is used when the selection changes to cache the old and new state of the selection for each RenderObject.
class RenderSelectionGeometry : public RenderSelectionGeometryBase {
    WTF_MAKE_TZONE_ALLOCATED(RenderSelectionGeometry);
public:
    RenderSelectionGeometry(RenderObject& renderer, bool clipToVisibleContent);

    void repaint();
    const Vector<FloatQuad>& collectedSelectionQuads() const { return m_collectedSelectionQuads; }
    LayoutRect rect() const { return m_rect; }

private:
    Vector<FloatQuad> m_collectedSelectionQuads; // relative to repaint container
    LayoutRect m_rect; // relative to repaint container
};


// This struct is used when the selection changes to cache the old and new state of the selection for each RenderBlock.
class RenderBlockSelectionGeometry : public RenderSelectionGeometryBase {
    WTF_MAKE_TZONE_ALLOCATED(RenderBlockSelectionGeometry);
public:
    explicit RenderBlockSelectionGeometry(RenderBlock& renderer);

    void repaint();
    GapRects rects() const { return m_rects; }

private:
    GapRects m_rects; // relative to repaint container
};

} // namespace WebCore
