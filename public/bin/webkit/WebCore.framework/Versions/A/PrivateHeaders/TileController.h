/*
 * Copyright (C) 2011-2014 Apple Inc. All rights reserved.
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

#include "FloatRect.h"
#include "IntRect.h"
#include "LengthBox.h"
#include "PlatformCALayer.h"
#include "PlatformCALayerClient.h"
#include "TiledBacking.h"
#include "Timer.h"
#include "VelocityData.h"
#include <wtf/Deque.h>
#include <wtf/Noncopyable.h>
#include <wtf/RetainPtr.h>
#include <wtf/Seconds.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class FloatRect;
class IntPoint;
class IntRect;
class TileCoverageMap;
class TileGrid;

typedef Vector<RetainPtr<PlatformLayer>> PlatformLayerList;

const int kDefaultTileSize = 512;

class TileController final : public TiledBacking {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(TileController, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(TileController);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(TileController);

    friend class TileCoverageMap;
    friend class TileGrid;
public:
    enum class AllowScrollPerformanceLogging { Yes, No };
    
    WEBCORE_EXPORT explicit TileController(PlatformCALayer*, AllowScrollPerformanceLogging = AllowScrollPerformanceLogging::Yes);
    WEBCORE_EXPORT ~TileController();
    
    WEBCORE_EXPORT static String tileGridContainerLayerName();
    static String zoomedOutTileGridContainerLayerName();

    WEBCORE_EXPORT void tileCacheLayerBoundsChanged();

    WEBCORE_EXPORT void setNeedsDisplay();
    WEBCORE_EXPORT void setNeedsDisplayInRect(const IntRect&);

    WEBCORE_EXPORT void setContentsScale(float);
    WEBCORE_EXPORT float contentsScale() const;

    bool acceleratesDrawing() const { return m_acceleratesDrawing; }
    WEBCORE_EXPORT void setAcceleratesDrawing(bool);

    ContentsFormat contentsFormat() const { return m_contentsFormat; }
    WEBCORE_EXPORT void setContentsFormat(ContentsFormat);

    WEBCORE_EXPORT void setTilesOpaque(bool);
    bool tilesAreOpaque() const { return m_tilesAreOpaque; }

    PlatformCALayer& rootLayer() { return *m_tileCacheLayer; }
    const PlatformCALayer& rootLayer() const { return *m_tileCacheLayer; }

    WEBCORE_EXPORT void setTileDebugBorderWidth(float);
    WEBCORE_EXPORT void setTileDebugBorderColor(Color);

    FloatRect visibleRect() const final { return m_visibleRect; }
    FloatRect coverageRect() const final { return m_coverageRect; }
    std::optional<FloatRect> layoutViewportRect() const { return m_layoutViewportRect; }

    void setTileSizeUpdateDelayDisabledForTesting(bool) final;

    unsigned blankPixelCount() const;
    WEBCORE_EXPORT static unsigned blankPixelCountForTiles(const PlatformLayerList&, const FloatRect&, const IntPoint&);

#if PLATFORM(IOS_FAMILY)
    unsigned numberOfUnparentedTiles() const;
    void removeUnparentedTilesNow();
#endif

    float deviceScaleFactor() const { return m_deviceScaleFactor; }

    const Color& tileDebugBorderColor() const { return m_tileDebugBorderColor; }
    float tileDebugBorderWidth() const { return m_tileDebugBorderWidth; }
    ScrollingModeIndication indicatorMode() const { return m_indicatorMode; }

    void willStartLiveResize() final;
    void didEndLiveResize() final;

    IntSize tileSize() const final;
    FloatRect rectForTile(TileIndex) const final;
    IntRect bounds() const final;
    IntRect boundsWithoutMargin() const final;
    bool hasMargins() const final;
    bool hasHorizontalMargins() const final;
    bool hasVerticalMargins() const final;
    int topMarginHeight() const final;
    int bottomMarginHeight() const final;
    int leftMarginWidth() const final;
    int rightMarginWidth() const final;
    TileCoverage tileCoverage() const final { return m_tileCoverage; }

    FloatRect adjustTileCoverageRect(const FloatRect& coverageRect, const FloatRect& previousVisibleRect, const FloatRect& currentVisibleRect, bool sizeChanged) final;
    FloatRect adjustTileCoverageRectForScrolling(const FloatRect& coverageRect, const FloatSize& newSize, const FloatRect& previousVisibleRect, const FloatRect& currentVisibleRect, float contentsScale) final;

    bool scrollingPerformanceTestingEnabled() const final { return m_scrollingPerformanceTestingEnabled; }

    IntSize computeTileSize();

    IntRect boundsAtLastRevalidate() const { return m_boundsAtLastRevalidate; }
    IntRect boundsAtLastRevalidateWithoutMargin() const;
    void willRevalidateTiles(TileGrid&, TileRevalidationType);
    void didRevalidateTiles(TileGrid&, TileRevalidationType, const HashSet<TileIndex>& tilesNeedingDisplay);

    bool shouldAggressivelyRetainTiles() const;
    bool shouldTemporarilyRetainTileCohorts() const;

    void updateTileCoverageMap();

    Ref<PlatformCALayer> createTileLayer(const IntRect&, TileGrid&);

    const TileGrid& tileGrid() const { return *m_tileGrid; }

    WEBCORE_EXPORT Vector<RefPtr<PlatformCALayer>> containerLayers();
    
    void logFilledVisibleFreshTile(unsigned blankPixelCount);

private:
    TileGrid& tileGrid() { return *m_tileGrid; }

    void scheduleTileRevalidation(Seconds interval);

    float topContentInset() const { return m_topContentInset; }

    // TiledBacking member functions.
    PlatformLayerIdentifier layerIdentifier() const final;
    void setClient(TiledBackingClient*) final;

    TileGridIdentifier primaryGridIdentifier() const final;
    std::optional<TileGridIdentifier> secondaryGridIdentifier() const final;

    void setVisibleRect(const FloatRect&) final;
    void setLayoutViewportRect(std::optional<FloatRect>) final;
    void setCoverageRect(const FloatRect&) final;
    bool tilesWouldChangeForCoverageRect(const FloatRect&) const final;
    void setTiledScrollingIndicatorPosition(const FloatPoint&) final;
    void setTopContentInset(float) final;
    void setVelocity(const VelocityData&) final;
    void setScrollability(OptionSet<Scrollability>) final;
    void prepopulateRect(const FloatRect&) final;
    void setIsInWindow(bool) final;
    bool isInWindow() const final { return m_isInWindow; }
    void setTileCoverage(TileCoverage) final;
    void revalidateTiles() final;
    IntRect tileGridExtent() const final;
    void setScrollingPerformanceTestingEnabled(bool flag) final { m_scrollingPerformanceTestingEnabled = flag; }
    double retainedTileBackingStoreMemory() const final;
    IntRect tileCoverageRect() const final;
#if USE(CA)
    PlatformCALayer* tiledScrollingIndicatorLayer() final;
#endif
    void setScrollingModeIndication(ScrollingModeIndication) final;
    void setHasMargins(bool marginTop, bool marginBottom, bool marginLeft, bool marginRight) final;
    void setMarginSize(int) final;
    void setZoomedOutContentsScale(float) final;
    float zoomedOutContentsScale() const final;
    float tilingScaleFactor() const final;

    void updateMargins();
    void clearZoomedOutTileGrid();
    void tileGridsChanged();

    void tileRevalidationTimerFired();
    void setNeedsRevalidateTiles();

    void notePendingTileSizeChange();
    void tileSizeChangeTimerFired();

    void willRepaintTile(TileGrid&, TileIndex, const FloatRect& tileClip, const FloatRect& paintDirtyRect);
    void willRemoveTile(TileGrid&, TileIndex);
    void willRepaintAllTiles(TileGrid&);

#if !PLATFORM(IOS_FAMILY)
    FloatRect adjustTileCoverageForDesktopPageScrolling(const FloatRect& coverageRect, const FloatSize& newSize, const FloatRect& previousVisibleRect, const FloatRect& visibleRect) const;
#endif

    FloatRect adjustTileCoverageWithScrollingVelocity(const FloatRect& coverageRect, const FloatSize& newSize, const FloatRect& visibleRect, float contentsScale) const;

    IntRect boundsForSize(const FloatSize&) const;

    PlatformCALayerClient* owningGraphicsLayer() const { return m_tileCacheLayer->owner(); }

    PlatformCALayer* m_tileCacheLayer;

    WeakPtr<TiledBackingClient> m_client;

    float m_zoomedOutContentsScale { 0 };
    float m_deviceScaleFactor;

    std::unique_ptr<TileCoverageMap> m_coverageMap;

    std::unique_ptr<TileGrid> m_tileGrid;
    std::unique_ptr<TileGrid> m_zoomedOutTileGrid;

    std::unique_ptr<HistoricalVelocityData> m_historicalVelocityData; // Used when we track velocity internally.

    FloatRect m_visibleRect; // Only used for scroll performance logging.
    std::optional<FloatRect> m_layoutViewportRect; // Only used by the tiled scrolling indicator.
    FloatRect m_coverageRect;
    IntRect m_boundsAtLastRevalidate;

    Timer m_tileRevalidationTimer;
    DeferrableOneShotTimer m_tileSizeChangeTimer;

    TileCoverage m_tileCoverage { CoverageForVisibleArea };

    VelocityData m_velocity;

    int m_marginSize { kDefaultTileSize };

    OptionSet<Scrollability> m_scrollability { Scrollability::HorizontallyScrollable, Scrollability::VerticallyScrollable };

    // m_marginTop and m_marginBottom are the height in pixels of the top and bottom margin tiles. The width
    // of those tiles will be equivalent to the width of the other tiles in the grid. m_marginRight and
    // m_marginLeft are the width in pixels of the right and left margin tiles, respectively. The height of
    // those tiles will be equivalent to the height of the other tiles in the grid.
    RectEdges<bool> m_marginEdges;
    
    bool m_isInWindow { false };
    bool m_scrollingPerformanceTestingEnabled { false };
    bool m_acceleratesDrawing { false };
    bool m_tilesAreOpaque { false };
    bool m_hasTilesWithTemporaryScaleFactor { false }; // Used to make low-res tiles when zooming.
    bool m_inLiveResize { false };
    bool m_tileSizeLocked { false };
    bool m_haveExternalVelocityData { false };
    bool m_isTileSizeUpdateDelayDisabledForTesting { false };

    ContentsFormat m_contentsFormat { ContentsFormat::RGBA8 };

    AllowScrollPerformanceLogging m_shouldAllowScrollPerformanceLogging { AllowScrollPerformanceLogging::Yes };

    Color m_tileDebugBorderColor;
    float m_tileDebugBorderWidth { 0 };
    ScrollingModeIndication m_indicatorMode { SynchronousScrollingBecauseOfLackOfScrollingCoordinatorIndication };
    float m_topContentInset { 0 };
};

} // namespace WebCore

