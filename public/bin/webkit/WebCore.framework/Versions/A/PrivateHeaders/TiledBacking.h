/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#include "IntPoint.h"
#include "PlatformLayerIdentifier.h"
#include "TileGridIdentifier.h"
#include <wtf/CheckedRef.h>
#include <wtf/MonotonicTime.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class TiledBackingClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::TiledBackingClient> : std::true_type { };
}

namespace WebCore {

class FloatPoint;
class FloatRect;
class FloatSize;
class IntRect;
class IntSize;
class PlatformCALayer;

struct VelocityData;

enum ScrollingModeIndication {
    SynchronousScrollingBecauseOfLackOfScrollingCoordinatorIndication,
    SynchronousScrollingBecauseOfStyleIndication,
    SynchronousScrollingBecauseOfEventHandlersIndication,
    AsyncScrollingIndication
};

enum class TiledBackingScrollability : uint8_t {
    NotScrollable           = 0,
    HorizontallyScrollable  = 1 << 0,
    VerticallyScrollable    = 1 << 1
};

enum class TileRevalidationType : uint8_t {
    Partial,
    Full
};

using TileIndex = IntPoint;
class TiledBacking;

class TiledBackingClient : public CanMakeWeakPtr<TiledBackingClient> {
public:
    virtual ~TiledBackingClient() = default;

    // paintDirtyRect is in the same coordinate system as tileClip.
    virtual void willRepaintTile(TiledBacking&, TileGridIdentifier, TileIndex, const FloatRect& tileClip, const FloatRect& paintDirtyRect) = 0;
    virtual void willRemoveTile(TiledBacking&, TileGridIdentifier, TileIndex) = 0;
    virtual void willRepaintAllTiles(TiledBacking&, TileGridIdentifier) = 0;

    // The client will not receive `willRepaintTile()` for tiles needing display as part of a revalidation.
    virtual void willRevalidateTiles(TiledBacking&, TileGridIdentifier, TileRevalidationType) = 0;
    virtual void didRevalidateTiles(TiledBacking&, TileGridIdentifier, TileRevalidationType, const HashSet<TileIndex>& tilesNeedingDisplay) = 0;

    virtual void didAddGrid(TiledBacking&, TileGridIdentifier) = 0;
    virtual void willRemoveGrid(TiledBacking&, TileGridIdentifier) = 0;

    virtual void coverageRectDidChange(TiledBacking&, const FloatRect&) = 0;

    virtual void willRepaintTilesAfterScaleFactorChange(TiledBacking&, TileGridIdentifier) = 0;
    virtual void didRepaintTilesAfterScaleFactorChange(TiledBacking&, TileGridIdentifier) = 0;
};


class TiledBacking : public CanMakeCheckedPtr<TiledBacking> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(TiledBacking);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(TiledBacking);
public:
    virtual ~TiledBacking() = default;

    virtual PlatformLayerIdentifier layerIdentifier() const = 0;

    virtual void setClient(TiledBackingClient*) = 0;

    // Note that the grids switch or change over time.
    virtual TileGridIdentifier primaryGridIdentifier() const = 0;
    // There can be a secondary grid when setZoomedOutContentsScale() has been called.
    virtual std::optional<TileGridIdentifier> secondaryGridIdentifier() const = 0;

    virtual void setVisibleRect(const FloatRect&) = 0;
    virtual FloatRect visibleRect() const = 0;

    // Only used to update the tile coverage map.
    virtual void setLayoutViewportRect(std::optional<FloatRect>) = 0;

    virtual void setCoverageRect(const FloatRect&) = 0;
    virtual FloatRect coverageRect() const = 0;
    virtual bool tilesWouldChangeForCoverageRect(const FloatRect&) const = 0;

    virtual void setTiledScrollingIndicatorPosition(const FloatPoint&) = 0;
    virtual void setTopContentInset(float) = 0;

    virtual void setVelocity(const VelocityData&) = 0;

    virtual void setTileSizeUpdateDelayDisabledForTesting(bool) = 0;
    
    using Scrollability = TiledBackingScrollability;
    virtual void setScrollability(OptionSet<Scrollability>) = 0;

    virtual void prepopulateRect(const FloatRect&) = 0;

    virtual void setIsInWindow(bool) = 0;
    virtual bool isInWindow() const = 0;

    enum {
        CoverageForVisibleArea = 0,
        CoverageForVerticalScrolling = 1 << 0,
        CoverageForHorizontalScrolling = 1 << 1,
        CoverageForScrolling = CoverageForVerticalScrolling | CoverageForHorizontalScrolling
    };
    typedef unsigned TileCoverage;

    virtual void setTileCoverage(TileCoverage) = 0;
    virtual TileCoverage tileCoverage() const = 0;

    virtual FloatRect adjustTileCoverageRect(const FloatRect& coverageRect, const FloatRect& previousVisibleRect, const FloatRect& currentVisibleRect, bool sizeChanged) = 0;
    virtual FloatRect adjustTileCoverageRectForScrolling(const FloatRect& coverageRect, const FloatSize& newSize, const FloatRect& previousVisibleRect, const FloatRect& currentVisibleRect, float contentsScale) = 0;

    virtual void willStartLiveResize() = 0;
    virtual void didEndLiveResize() = 0;

    virtual IntSize tileSize() const = 0;
    // The returned rect is in the same coordinate space as the tileClip rect argument to willRepaintTile().
    virtual FloatRect rectForTile(TileIndex) const = 0;

    virtual void revalidateTiles() = 0;

    virtual void setScrollingPerformanceTestingEnabled(bool) = 0;
    virtual bool scrollingPerformanceTestingEnabled() const = 0;
    
    virtual double retainedTileBackingStoreMemory() const = 0;

    virtual void setHasMargins(bool marginTop, bool marginBottom, bool marginLeft, bool marginRight) = 0;
    virtual void setMarginSize(int) = 0;
    virtual bool hasMargins() const = 0;
    virtual bool hasHorizontalMargins() const = 0;
    virtual bool hasVerticalMargins() const = 0;

    virtual int topMarginHeight() const = 0;
    virtual int bottomMarginHeight() const = 0;
    virtual int leftMarginWidth() const = 0;
    virtual int rightMarginWidth() const = 0;

    // This is the scale used to compute tile sizes; it's contentScale / deviceScaleFactor.
    virtual float tilingScaleFactor() const  = 0;

    virtual void setZoomedOutContentsScale(float) = 0;
    virtual float zoomedOutContentsScale() const = 0;

    // Includes margins.
    virtual IntRect bounds() const = 0;
    virtual IntRect boundsWithoutMargin() const = 0;

    // Exposed for testing
    virtual IntRect tileCoverageRect() const = 0;
    virtual IntRect tileGridExtent() const = 0;
    virtual void setScrollingModeIndication(ScrollingModeIndication) = 0;

#if USE(CA)
    virtual PlatformCALayer* tiledScrollingIndicatorLayer() = 0;
#endif
};

} // namespace WebCore
