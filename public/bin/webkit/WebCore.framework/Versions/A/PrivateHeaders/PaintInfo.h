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

#include "AccessibilityRegionContext.h"
#include "AffineTransform.h"
#include "EventRegion.h"
#include "GraphicsContext.h"
#include "IntRect.h"
#include "LayoutRect.h"
#include "PaintPhase.h"
#include <limits>
#include <wtf/HashMap.h>
#include <wtf/OptionSet.h>
#include <wtf/WeakListHashSet.h>

namespace WebCore {

class OverlapTestRequestClient;
class RenderInline;
class RenderLayer;
class RenderLayerModelObject;
class RenderObject;

typedef UncheckedKeyHashMap<OverlapTestRequestClient*, IntRect> OverlapTestRequestMap;

/*
 * Paint the object and its children, clipped by (x|y|w|h).
 * (tx|ty) is the calculated position of the parent
 */
struct PaintInfo {
    PaintInfo(GraphicsContext& newContext, const LayoutRect& newRect, PaintPhase newPhase, OptionSet<PaintBehavior> newPaintBehavior,
        RenderObject* newSubtreePaintRoot = nullptr, SingleThreadWeakListHashSet<RenderInline>* newOutlineObjects = nullptr,
        OverlapTestRequestMap* overlapTestRequests = nullptr, const RenderLayerModelObject* newPaintContainer = nullptr,
        const RenderLayer* enclosingSelfPaintingLayer = nullptr, bool newRequireSecurityOriginAccessForWidgets = false)
            : rect(newRect)
            , phase(newPhase)
            , paintBehavior(newPaintBehavior)
            , subtreePaintRoot(newSubtreePaintRoot)
            , outlineObjects(newOutlineObjects)
            , overlapTestRequests(overlapTestRequests)
            , paintContainer(newPaintContainer)
            , requireSecurityOriginAccessForWidgets(newRequireSecurityOriginAccessForWidgets)
            , m_enclosingSelfPaintingLayer(enclosingSelfPaintingLayer)
            , m_context(&newContext)
    {
    }

    GraphicsContext& context() const
    {
        ASSERT(m_context);
        return *m_context;
    }

    void setContext(GraphicsContext& context)
    {
        m_context = &context;
    }

    void updateSubtreePaintRootForChildren(const RenderObject* renderer)
    {
        if (!subtreePaintRoot)
            return;

        // If we're the painting root, kids draw normally, and see root of nullptr.
        if (subtreePaintRoot == renderer) {
            subtreePaintRoot = nullptr;
            return;
        }
    }

    bool shouldPaintWithinRoot(const RenderObject& renderer) const
    {
        return !subtreePaintRoot || subtreePaintRoot == &renderer;
    }

    bool forceTextColor() const { return forceBlackText() || forceWhiteText(); }
    bool forceBlackText() const { return paintBehavior.contains(PaintBehavior::ForceBlackText); }
    bool forceWhiteText() const { return paintBehavior.contains(PaintBehavior::ForceWhiteText); }
    Color forcedTextColor() const { return forceBlackText() ? Color::black : Color::white; }

    bool skipRootBackground() const { return paintBehavior.contains(PaintBehavior::SkipRootBackground); }
    bool paintRootBackgroundOnly() const { return paintBehavior.contains(PaintBehavior::RootBackgroundOnly); }

    const RenderLayer* enclosingSelfPaintingLayer() const { return m_enclosingSelfPaintingLayer; }

    void applyTransform(const AffineTransform& localToAncestorTransform)
    {
        if (localToAncestorTransform.isIdentity())
            return;

        context().concatCTM(localToAncestorTransform);

        if (rect.isInfinite())
            return;

        FloatRect tranformedRect(valueOrDefault(localToAncestorTransform.inverse()).mapRect(rect));
        rect.setLocation(LayoutPoint(tranformedRect.location()));
        rect.setSize(LayoutSize(tranformedRect.size()));
    }

    EventRegionContext* eventRegionContext() { return dynamicDowncast<EventRegionContext>(regionContext); }
    AccessibilityRegionContext* accessibilityRegionContext() { return dynamicDowncast<AccessibilityRegionContext>(regionContext); }

    LayoutRect rect;
    PaintPhase phase;
    OptionSet<PaintBehavior> paintBehavior;
    RenderObject* subtreePaintRoot; // used to draw just one element and its visual children
    SingleThreadWeakListHashSet<RenderInline>* outlineObjects; // used to list outlines that should be painted by a block with inline children
    OverlapTestRequestMap* overlapTestRequests;
    const RenderLayerModelObject* paintContainer; // the layer object that originates the current painting
    bool requireSecurityOriginAccessForWidgets { false };
    const RenderLayer* m_enclosingSelfPaintingLayer { nullptr };
    RegionContext* regionContext { nullptr }; // For PaintPhase::EventRegion and PaintPhase::Accessibility.

private:
    GraphicsContext* m_context;
};

} // namespace WebCore
