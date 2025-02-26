/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "LayoutRect.h"
#include "RenderLayer.h"
#include "ScrollTypes.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class ScrollingCoordinator;

struct CompositedClipData {
    CompositedClipData(RenderLayer* layer, const RoundedRect& roundedRect, bool isOverflowScrollEntry)
        : clippingLayer(layer)
        , clipRect(roundedRect)
        , isOverflowScroll(isOverflowScrollEntry)
    {
    }

    friend bool operator==(const CompositedClipData&, const CompositedClipData&) = default;
    
    SingleThreadWeakPtr<RenderLayer> clippingLayer; // For scroller entries, the scrolling layer. For other entries, the most-descendant layer that has a clip.
    RoundedRect clipRect; // In the coordinate system of the RenderLayer that owns the stack.
    bool isOverflowScroll { false };
};


// This class encapsulates the set of layers and their scrolling tree nodes representing clipping in the layer's containing block ancestry,
// but not in its paint order ancestry.
class LayerAncestorClippingStack {
    WTF_MAKE_TZONE_ALLOCATED(LayerAncestorClippingStack);
public:
    LayerAncestorClippingStack(Vector<CompositedClipData>&&);
    ~LayerAncestorClippingStack() = default;

    bool hasAnyScrollingLayers() const;
    
    bool equalToClipData(const Vector<CompositedClipData>&) const;
    bool updateWithClipData(ScrollingCoordinator*, Vector<CompositedClipData>&&);
    
    Vector<CompositedClipData> compositedClipData() const;

    void clear(ScrollingCoordinator*);
    void detachFromScrollingCoordinator(ScrollingCoordinator&);

    void updateScrollingNodeLayers(ScrollingCoordinator&);

    GraphicsLayer* firstLayer() const;
    GraphicsLayer* lastLayer() const;
    std::optional<ScrollingNodeID> lastOverflowScrollProxyNodeID() const;

    struct ClippingStackEntry {
        CompositedClipData clipData;
        Markable<ScrollingNodeID> overflowScrollProxyNodeID; // The node for repositioning the scrolling proxy layer.
        RefPtr<GraphicsLayer> clippingLayer;
        RefPtr<GraphicsLayer> scrollingLayer; // Only present for scrolling entries.

        GraphicsLayer* parentForSublayers() const
        {
            return scrollingLayer ? scrollingLayer.get() : clippingLayer.get();
        }
        
        GraphicsLayer* childForSuperlayers() const
        {
            return clippingLayer.get();
        }
    };

    Vector<ClippingStackEntry>& stack() { return m_stack; }
    const Vector<ClippingStackEntry>& stack() const { return m_stack; }

private:
    // Order is ancestors to descendants.
    Vector<ClippingStackEntry> m_stack;
};

TextStream& operator<<(TextStream&, const LayerAncestorClippingStack&);

} // namespace WebCore
