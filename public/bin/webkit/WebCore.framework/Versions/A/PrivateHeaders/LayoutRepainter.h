/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 *           (C) 2004 Allan Sandfeld Jensen (kde@carewolf.com)
 * Copyright (C) 2003, 2004, 2005, 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
 * Copyright (C) 2009 Google Inc. All rights reserved.
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

#include "RenderElement.h"

namespace WebCore {

class RenderElement;
class RenderLayerModelObject;

class LayoutRepainter {
public:
    enum class CheckForRepaint : uint8_t { No, Yes };
    enum class ShouldAlwaysIssueFullRepaint : uint8_t { No, Yes };
    LayoutRepainter(RenderElement&, std::optional<CheckForRepaint> checkForRepaintOverride = { }, std::optional<ShouldAlwaysIssueFullRepaint> = { }, RepaintOutlineBounds = RepaintOutlineBounds::Yes);

    // Return true if it repainted.
    bool repaintAfterLayout();

private:
    CheckedRef<RenderElement> m_renderer;
    const RenderLayerModelObject* m_repaintContainer { nullptr };
    // We store these values as LayoutRects, but the final invalidations will be pixel snapped
    RenderObject::RepaintRects m_oldRects;
    bool m_checkForRepaint { true };
    bool m_forceFullRepaint { false };
    RepaintOutlineBounds m_repaintOutlineBounds;
};

} // namespace WebCore
