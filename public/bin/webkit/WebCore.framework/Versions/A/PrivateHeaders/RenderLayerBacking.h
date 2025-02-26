/*
 * Copyright (C) 2009, 2010, 2011 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "FloatPoint.h"
#include "FloatPoint3D.h"
#include "GraphicsLayer.h"
#include "GraphicsLayerClient.h"
#include "RenderLayer.h"
#include "RenderLayerCompositor.h"
#include "ScrollingCoordinator.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakListHashSet.h>

namespace WebCore {

class BlendingKeyframes;
class PaintedContentsInfo;
class RegionContext;
class RenderLayerCompositor;
class TiledBacking;
class TransformationMatrix;

enum CompositingLayerType {
    NormalCompositingLayer, // non-tiled layer with backing store
    TiledCompositingLayer, // tiled layer (always has backing store)
    MediaCompositingLayer, // layer that contains an image, video, WebGL or plugin
    ContainerCompositingLayer // layer with no backing store
};

// RenderLayerBacking controls the compositing behavior for a single RenderLayer.
// It holds the various GraphicsLayers, and makes decisions about intra-layer rendering
// optimizations.
// 
// There is one RenderLayerBacking for each RenderLayer that is composited.

class RenderLayerBacking final : public GraphicsLayerClient {
    WTF_MAKE_TZONE_ALLOCATED(RenderLayerBacking);
    WTF_MAKE_NONCOPYABLE(RenderLayerBacking);
public:
    explicit RenderLayerBacking(RenderLayer&);
    ~RenderLayerBacking();

    // Do cleanup while layer->backing() is still valid.
    void willBeDestroyed();

    RenderLayer& owningLayer() const { return m_owningLayer; }

    // Included layers are non-z-order descendant layers that are painted into this backing.
    const SingleThreadWeakListHashSet<RenderLayer>& backingSharingLayers() const { return m_backingSharingLayers; }
    void setBackingSharingLayers(SingleThreadWeakListHashSet<RenderLayer>&&);

    bool hasBackingSharingLayers() const { return !m_backingSharingLayers.isEmptyIgnoringNullReferences(); }

    void removeBackingSharingLayer(RenderLayer&);
    void clearBackingSharingLayers();

    void updateConfigurationAfterStyleChange();

    // Returns true if layer configuration changed.
    bool updateConfiguration(const RenderLayer* compositingAncestor);

    // Update graphics layer position and bounds.
    void updateGeometry(const RenderLayer* compositingAncestor);

    // Update state the requires that descendant layers have been updated.
    void updateAfterDescendants();

    // Update contents and clipping structure.
    void updateDrawsContent();
    
    void updateAfterLayout(bool needsClippingUpdate, bool needsFullRepaint);
    
    GraphicsLayer* graphicsLayer() const { return m_graphicsLayer.get(); }

    // Layer to clip children
    bool hasClippingLayer() const { return (m_childContainmentLayer && !m_isFrameLayerWithTiledBacking); }
    GraphicsLayer* clippingLayer() const { return !m_isFrameLayerWithTiledBacking ? m_childContainmentLayer.get() : nullptr; }

    bool hasAncestorClippingLayers() const { return !!m_ancestorClippingStack; }
    LayerAncestorClippingStack* ancestorClippingStack() const { return m_ancestorClippingStack.get(); }
    bool updateAncestorClippingStack(Vector<CompositedClipData>&&);

    void ensureOverflowControlsHostLayerAncestorClippingStack(const RenderLayer* compositedAncestor);
    LayerAncestorClippingStack* overflowControlsHostLayerAncestorClippingStack() const { return m_overflowControlsHostLayerAncestorClippingStack.get(); }

    GraphicsLayer* contentsContainmentLayer() const { return m_contentsContainmentLayer.get(); }
    GraphicsLayer* viewportAnchorLayer() const { return m_viewportAnchorLayer.get(); }

    GraphicsLayer* foregroundLayer() const { return m_foregroundLayer.get(); }
    GraphicsLayer* backgroundLayer() const { return m_backgroundLayer.get(); }
    bool backgroundLayerPaintsFixedRootBackground() const { return m_backgroundLayerPaintsFixedRootBackground; }

    bool needsRepaintOnCompositedScroll() const;

    bool requiresBackgroundLayer() const { return m_requiresBackgroundLayer; }
    void setRequiresBackgroundLayer(bool);

    bool hasScrollingLayer() const { return m_scrollContainerLayer != nullptr; }
    GraphicsLayer* scrollContainerLayer() const { return m_scrollContainerLayer.get(); }
    GraphicsLayer* scrolledContentsLayer() const { return m_scrolledContentsLayer.get(); }

    void detachFromScrollingCoordinator(OptionSet<ScrollCoordinationRole>);

    std::optional<ScrollingNodeID> scrollingNodeIDForRole(ScrollCoordinationRole role) const
    {
        switch (role) {
        case ScrollCoordinationRole::Scrolling:
            return m_scrollingNodeID;
        case ScrollCoordinationRole::ScrollingProxy:
            // These nodeIDs are stored in m_ancestorClippingStack.
            ASSERT_NOT_REACHED();
            return std::nullopt;
        case ScrollCoordinationRole::FrameHosting:
            return m_frameHostingNodeID;
        case ScrollCoordinationRole::PluginHosting:
            return m_pluginHostingNodeID;
        case ScrollCoordinationRole::ViewportConstrained:
            return m_viewportConstrainedNodeID;
        case ScrollCoordinationRole::Positioning:
            return m_positioningNodeID;
        }
        return std::nullopt;
    }

    void setScrollingNodeIDForRole(ScrollingNodeID, ScrollCoordinationRole);

    bool hasMaskLayer() const { return m_maskLayer; }

    GraphicsLayer* parentForSublayers() const;
    GraphicsLayer* childForSuperlayers() const;
    GraphicsLayer* childForSuperlayersExcludingViewTransitions() const;

    // RenderLayers with backing normally short-circuit paintLayer() because
    // their content is rendered via callbacks from GraphicsLayer. However, the document
    // layer is special, because it has a GraphicsLayer to act as a container for the GraphicsLayers
    // for descendants, but its contents usually render into the window (in which case this returns true).
    // This returns false for other layers, and when the document layer actually needs to paint into its backing store
    // for some reason.
    bool paintsIntoWindow() const;

    // Returns true for a composited layer that has no backing store of its own, so
    // paints into some ancestor layer.
    bool paintsIntoCompositedAncestor() const { return !m_requiresOwnBackingStore; }

    void setRequiresOwnBackingStore(bool);

    void setContentsNeedDisplay(GraphicsLayer::ShouldClipToLayer = GraphicsLayer::ClipToLayer);
    // r is in the coordinate space of the layer's render object
    void setContentsNeedDisplayInRect(const LayoutRect&, GraphicsLayer::ShouldClipToLayer = GraphicsLayer::ClipToLayer);

    // Notification from the renderer that its content changed.
    void contentChanged(ContentChangeType);

    // Interface to start, finish, suspend and resume animations
    bool startAnimation(double timeOffset, const Animation&, const BlendingKeyframes&);
    void animationPaused(double timeOffset, const String& name);
    void animationFinished(const String& name);
    void transformRelatedPropertyDidChange();
    void suspendAnimations(MonotonicTime = MonotonicTime());
    void resumeAnimations();

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    bool updateAcceleratedEffectsAndBaseValues();
#endif

    WEBCORE_EXPORT LayoutRect compositedBounds() const;
    // Returns true if changed.
    bool setCompositedBounds(const LayoutRect&);
    // Returns true if changed.
    bool updateCompositedBounds();
    
    void updateAllowsBackingStoreDetaching(bool allowDetachingForFixed);

#if ENABLE(ASYNC_SCROLLING)
    bool maintainsEventRegion() const;
    void updateEventRegion();
    
    bool needsEventRegionUpdate() const { return m_needsEventRegionUpdate; }
    void setNeedsEventRegionUpdate(bool needsUpdate = true);
#endif

#if ENABLE(INTERACTION_REGIONS_IN_EVENT_REGION)
    void clearInteractionRegions();
#endif

    void updateAfterWidgetResize();
    void positionOverflowControlsLayers();
    
    bool isFrameLayerWithTiledBacking() const { return m_isFrameLayerWithTiledBacking; }

    WEBCORE_EXPORT TiledBacking* tiledBacking() const;
    void adjustTiledBackingCoverage();
    void setTiledBackingHasMargins(bool hasExtendedBackgroundOnLeftAndRight, bool hasExtendedBackgroundOnTopAndBottom);
    
    void updateDebugIndicators(bool showBorder, bool showRepaintCounter);

    // GraphicsLayerClient interface
    void tiledBackingUsageChanged(const GraphicsLayer*, bool /*usingTiledBacking*/) override;
    void notifyAnimationStarted(const GraphicsLayer*, const String& animationKey, MonotonicTime startTime) override;
    void notifyFlushRequired(const GraphicsLayer*) override;
    void notifySubsequentFlushRequired(const GraphicsLayer*) override;

    void paintContents(const GraphicsLayer*, GraphicsContext&, const FloatRect& clip, OptionSet<GraphicsLayerPaintBehavior>) override;

    float deviceScaleFactor() const override;
    float contentsScaleMultiplierForNewTiles(const GraphicsLayer*) const override;

    bool layerContainsBitmapOnly(const GraphicsLayer*) const override { return isBitmapOnly(); }

    bool paintsOpaquelyAtNonIntegralScales(const GraphicsLayer*) const override;

    float pageScaleFactor() const override;
    float zoomedOutPageScaleFactor() const override;

    void didChangePlatformLayerForLayer(const GraphicsLayer*) override;
    bool getCurrentTransform(const GraphicsLayer*, TransformationMatrix&) const override;

    bool isFlushingLayers() const override;
    bool isTrackingRepaints() const override;
    bool shouldSkipLayerInDump(const GraphicsLayer*, OptionSet<LayerTreeAsTextOptions>) const override;
    bool shouldDumpPropertyForLayer(const GraphicsLayer*, ASCIILiteral propertyName, OptionSet<LayerTreeAsTextOptions>) const override;
#if HAVE(HDR_SUPPORT)
    bool hdrForImagesEnabled() const override;
#endif

    bool shouldAggressivelyRetainTiles(const GraphicsLayer*) const override;
    bool shouldTemporarilyRetainTileCohorts(const GraphicsLayer*) const override;
    bool useGiantTiles() const override;
    bool cssUnprefixedBackdropFilterEnabled() const override;
    void logFilledVisibleFreshTile(unsigned) override;
    bool needsPixelAligment() const override { return !m_isMainFrameRenderViewLayer; }

    LayoutSize subpixelOffsetFromRenderer() const { return m_subpixelOffsetFromRenderer; }

    TransformationMatrix transformMatrixForProperty(AnimatedProperty) const final;

    void dumpProperties(const GraphicsLayer*, TextStream&, OptionSet<LayerTreeAsTextOptions>) const final;

#if PLATFORM(IOS_FAMILY)
    bool needsIOSDumpRenderTreeMainFrameRenderViewLayerIsAlwaysOpaqueHack(const GraphicsLayer&) const override;
#endif

#ifndef NDEBUG
    void verifyNotPainting() override;
#endif

    WEBCORE_EXPORT LayoutRect contentsBox() const;
    
    // For informative purposes only.
    WEBCORE_EXPORT CompositingLayerType compositingLayerType() const;
    
    GraphicsLayer* layerForHorizontalScrollbar() const { return m_layerForHorizontalScrollbar.get(); }
    GraphicsLayer* layerForVerticalScrollbar() const { return m_layerForVerticalScrollbar.get(); }
    GraphicsLayer* layerForScrollCorner() const { return m_layerForScrollCorner.get(); }
    GraphicsLayer* overflowControlsContainer() const { return m_overflowControlsContainer.get(); }

    GraphicsLayer* layerForContents() const;

    void adjustOverflowControlsPositionRelativeToAncestor(const RenderLayer&);

    bool canCompositeFilters() const { return m_canCompositeFilters; }
    bool canCompositeBackdropFilters() const { return m_canCompositeBackdropFilters; }

    // Return an estimate of the backing store area (in pixels) allocated by this object's GraphicsLayers.
    WEBCORE_EXPORT double backingStoreMemoryEstimate() const;
    
    // For testing only.
    WEBCORE_EXPORT void setUsesDisplayListDrawing(bool);
    WEBCORE_EXPORT String displayListAsText(OptionSet<DisplayList::AsTextFlag>) const;

    WEBCORE_EXPORT void setIsTrackingDisplayListReplay(bool);
    WEBCORE_EXPORT String replayDisplayListAsText(OptionSet<DisplayList::AsTextFlag>) const;

    bool shouldPaintUsingCompositeCopy() const { return m_shouldPaintUsingCompositeCopy; }

    void purgeFrontBufferForTesting();
    void purgeBackBufferForTesting();
    void markFrontBufferVolatileForTesting();
private:
    friend class PaintedContentsInfo;

    FloatRect backgroundBoxForSimpleContainerPainting() const;

    void createPrimaryGraphicsLayer();
    void destroyGraphicsLayers();
    
    void willDestroyLayer(const GraphicsLayer*);

    LayoutRect compositedBoundsIncludingMargin() const;
    
    Ref<GraphicsLayer> createGraphicsLayer(const String&, GraphicsLayer::Type = GraphicsLayer::Type::Normal);

    RenderLayerModelObject& renderer() const { return m_owningLayer.renderer(); }
    RenderBox* renderBox() const { return m_owningLayer.renderBox(); }
    RenderLayerCompositor& compositor() const { return m_owningLayer.compositor(); }

    void updateInternalHierarchy();
    bool updateViewportConstrainedAnchorLayer(bool needsAnchorLayer);
    bool updateAncestorClipping(bool needsAncestorClip, const RenderLayer* compositingAncestor);
    bool updateDescendantClippingLayer(bool needsDescendantClip);
    bool updateOverflowControlsLayers(bool needsHorizontalScrollbarLayer, bool needsVerticalScrollbarLayer, bool needsScrollCornerLayer);
    bool updateForegroundLayer(bool needsForegroundLayer);
    bool updateBackgroundLayer(bool needsBackgroundLayer);
    bool updateMaskingLayer(bool hasMask, bool hasClipPath);
    bool updateTransformFlatteningLayer(const RenderLayer* compositingAncestor);

    bool requiresLayerForScrollbar(Scrollbar*) const;
    bool requiresHorizontalScrollbarLayer() const;
    bool requiresVerticalScrollbarLayer() const;
    bool requiresScrollCornerLayer() const;
    bool updateScrollingLayers(bool scrollingLayers);
    
    void updateScrollOffset(ScrollOffset);
    void setLocationOfScrolledContents(ScrollOffset, ScrollingLayerPositionAction);

    void updateMaskingLayerGeometry();
    void updateRootLayerConfiguration();
    void updatePaintingPhases();

    void setBackgroundLayerPaintsFixedRootBackground(bool);

    LayoutSize contentOffsetInCompositingLayer() const;
    LayoutSize offsetRelativeToRendererOriginForDescendantLayers() const;
    
    void ensureClippingStackLayers(LayerAncestorClippingStack&);
    void removeClippingStackLayers(LayerAncestorClippingStack&);

    void updateClippingStackLayerGeometry(LayerAncestorClippingStack&, const RenderLayer* compositedAncestor, LayoutRect& parentGraphicsLayerRect);

    void connectClippingStackLayers(LayerAncestorClippingStack&);

    void updateOpacity(const RenderStyle&);
    void updateTransform(const RenderStyle&);
    void updateChildrenTransformAndAnchorPoint(const LayoutRect& primaryGraphicsLayerRect, LayoutSize offsetFromParentGraphicsLayer);
    void updateFilters(const RenderStyle&);
    void updateBackdropFilters(const RenderStyle&);
    void updateBackdropFiltersGeometry();
    bool updateBackdropRoot();
    void updateBlendMode(const RenderStyle&);
#if ENABLE(VIDEO)
    void updateVideoGravity(const RenderStyle&);
#endif
    void updateContentsScalingFilters(const RenderStyle&);
#if HAVE(CORE_MATERIAL)
    void updateAppleVisualEffect(const RenderStyle&);
#endif

    // Return the opacity value that this layer should use for compositing.
    float compositingOpacity(float rendererOpacity) const;
    Color rendererBackgroundColor() const;

    bool isMainFrameRenderViewLayer() const;
    
    bool paintsBoxDecorations() const;
    bool paintsContent(RenderLayer::PaintedContentRequest&) const;

    void updateDrawsContent(PaintedContentsInfo&);

    // Returns true if this compositing layer has no visible content.
    bool isSimpleContainerCompositingLayer(PaintedContentsInfo&) const;
    // Returns true if this layer has content that needs to be rendered by painting into the backing store.
    bool containsPaintedContent(PaintedContentsInfo&) const;
    // Returns true if the RenderLayer just contains an image that we can composite directly.
    bool isDirectlyCompositedImage() const;
    void updateImageContents(PaintedContentsInfo&);
    bool isUnscaledBitmapOnly() const;
    bool isBitmapOnly() const;

    void updateDirectlyCompositedBoxDecorations(PaintedContentsInfo&, bool& didUpdateContentsRect);
    void updateDirectlyCompositedBackgroundColor(PaintedContentsInfo&, bool& didUpdateContentsRect);
    void updateDirectlyCompositedBackgroundImage(PaintedContentsInfo&, bool& didUpdateContentsRect);

    void resetContentsRect();
    void updateContentsRects();

    bool isPaintDestinationForDescendantLayers(RenderLayer::PaintedContentRequest&) const;
    bool hasVisibleNonCompositedDescendants() const;

    bool shouldClipCompositedBounds() const;

    bool hasTiledBackingFlatteningLayer() const { return (m_childContainmentLayer && m_isFrameLayerWithTiledBacking); }
    GraphicsLayer* tileCacheFlatteningLayer() const { return m_isFrameLayerWithTiledBacking ? m_childContainmentLayer.get() : nullptr; }

    void paintIntoLayer(const GraphicsLayer*, GraphicsContext&, const IntRect& paintDirtyRect, OptionSet<PaintBehavior>, RegionContext* = nullptr);
    OptionSet<RenderLayer::PaintLayerFlag> paintFlagsForLayer(const GraphicsLayer&) const;
    
    void paintDebugOverlays(const GraphicsLayer*, GraphicsContext&);

    static CSSPropertyID graphicsLayerToCSSProperty(AnimatedProperty);
    static AnimatedProperty cssToGraphicsLayerProperty(CSSPropertyID);

    bool canIssueSetNeedsDisplay() const { return !paintsIntoWindow() && !paintsIntoCompositedAncestor(); }
    LayoutRect computeParentGraphicsLayerRect(const RenderLayer* compositedAncestor) const;
    LayoutRect computePrimaryGraphicsLayerRect(const RenderLayer* compositedAncestor, const LayoutRect& parentGraphicsLayerRect) const;

    bool shouldSetContentsDisplayDelegate() const;

    RenderLayer& m_owningLayer;
    
    // A list other layers that paint into this backing store, later than m_owningLayer in paint order.
    SingleThreadWeakListHashSet<RenderLayer> m_backingSharingLayers;

    std::unique_ptr<LayerAncestorClippingStack> m_ancestorClippingStack; // Only used if we are clipped by an ancestor which is not a stacking context.
    std::unique_ptr<LayerAncestorClippingStack> m_overflowControlsHostLayerAncestorClippingStack; // Used when we have an overflow controls host layer which was reparented, and needs clipping by ancestors.

    RefPtr<GraphicsLayer> m_contentsContainmentLayer; // Only used if we have a background layer; takes the transform.
    RefPtr<GraphicsLayer> m_graphicsLayer;
    RefPtr<GraphicsLayer> m_foregroundLayer; // Only used in cases where we need to draw the foreground separately.
    RefPtr<GraphicsLayer> m_backgroundLayer; // Only used in cases where we need to draw the background separately.
    RefPtr<GraphicsLayer> m_childContainmentLayer; // Only used if we have clipping on a stacking context with compositing children, or if the layer has a tile cache.
    RefPtr<GraphicsLayer> m_viewportAnchorLayer; // Only used on fixed/sticky elements.
    RefPtr<GraphicsLayer> m_maskLayer; // Only used if we have a mask and/or clip-path.
    RefPtr<GraphicsLayer> m_transformFlatteningLayer;

    RefPtr<GraphicsLayer> m_layerForHorizontalScrollbar;
    RefPtr<GraphicsLayer> m_layerForVerticalScrollbar;
    RefPtr<GraphicsLayer> m_layerForScrollCorner;
    RefPtr<GraphicsLayer> m_overflowControlsContainer;

    RefPtr<GraphicsLayer> m_scrollContainerLayer; // Only used if the layer is using composited scrolling.
    RefPtr<GraphicsLayer> m_scrolledContentsLayer; // Only used if the layer is using composited scrolling.

    LayoutRect m_compositedBounds;
    LayoutSize m_subpixelOffsetFromRenderer; // This is the subpixel distance between the primary graphics layer and the associated renderer's bounds.
    LayoutSize m_compositedBoundsOffsetFromGraphicsLayer; // This is the subpixel distance between the primary graphics layer and the render layer bounds.

    Markable<ScrollingNodeID> m_viewportConstrainedNodeID;
    Markable<ScrollingNodeID> m_scrollingNodeID;
    Markable<ScrollingNodeID> m_frameHostingNodeID;
    Markable<ScrollingNodeID> m_pluginHostingNodeID;
    Markable<ScrollingNodeID> m_positioningNodeID;

    bool m_artificiallyInflatedBounds { false }; // bounds had to be made non-zero to make transform-origin work
    bool m_isMainFrameRenderViewLayer { false };
    bool m_isRootFrameRenderViewLayer { false };
    bool m_isFrameLayerWithTiledBacking { false };
    bool m_requiresOwnBackingStore { true };
    bool m_canCompositeFilters { false };
    bool m_canCompositeBackdropFilters { false };
    bool m_backgroundLayerPaintsFixedRootBackground { false };
    bool m_requiresBackgroundLayer { false };
    bool m_hasSubpixelRounding { false };
#if ENABLE(ASYNC_SCROLLING)
    bool m_needsEventRegionUpdate { true };
#endif
    bool m_shouldPaintUsingCompositeCopy { false };
};

enum CanvasCompositingStrategy {
    CanvasPaintedToEnclosingLayer,
    CanvasPaintedToLayer,
    CanvasAsLayerContents
};
CanvasCompositingStrategy canvasCompositingStrategy(const RenderObject&);

WTF::TextStream& operator<<(WTF::TextStream&, const RenderLayerBacking&);

} // namespace WebCore
