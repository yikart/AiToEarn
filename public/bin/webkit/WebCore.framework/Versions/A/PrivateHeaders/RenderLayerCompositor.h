/*
 * Copyright (C) 2009, 2013 Apple Inc. All rights reserved.
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

#include "ChromeClient.h"
#include "GraphicsLayerClient.h"
#include "LayerAncestorClippingStack.h"
#include "RenderLayer.h"
#include <pal/HysteresisActivity.h>
#include <wtf/CheckedPtr.h>
#include <wtf/HashMap.h>
#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {

class DisplayRefreshMonitorFactory;
class FixedPositionViewportConstraints;
class GraphicsLayer;
class LayerOverlapMap;
class RenderEmbeddedObject;
class RenderVideo;
class RenderWidget;
class ScrollingCoordinator;
class StickyPositionViewportConstraints;
class TiledBacking;

enum class ScrollingNodeType : uint8_t;

enum class CompositingUpdateType {
    AfterStyleChange,
    AfterLayout,
    OnScroll,
    OnCompositedScroll
};

enum class CompositingReason {
    Transform3D                            = 1 << 0,
    Video                                  = 1 << 1,
    Canvas                                 = 1 << 2,
    Plugin                                 = 1 << 3,
    IFrame                                 = 1 << 4,
    BackfaceVisibilityHidden               = 1 << 5,
    ClipsCompositingDescendants            = 1 << 6,
    Animation                              = 1 << 7,
    Filters                                = 1 << 8,
    PositionFixed                          = 1 << 9,
    PositionSticky                         = 1 << 10,
    OverflowScrolling                      = 1 << 11,
    Stacking                               = 1 << 12,
    Overlap                                = 1 << 13,
    OverflowScrollPositioning              = 1 << 14,
    NegativeZIndexChildren                 = 1 << 15,
    TransformWithCompositedDescendants     = 1 << 16,
    OpacityWithCompositedDescendants       = 1 << 17,
    MaskWithCompositedDescendants          = 1 << 18,
    ReflectionWithCompositedDescendants    = 1 << 19,
    FilterWithCompositedDescendants        = 1 << 20,
    BlendingWithCompositedDescendants      = 1 << 21,
    Perspective                            = 1 << 22,
    Preserve3D                             = 1 << 23,
    WillChange                             = 1 << 24,
    Root                                   = 1 << 25,
    IsolatesCompositedBlendingDescendants  = 1 << 26,
    Model                                  = 1 << 27,
    BackdropRoot                           = 1 << 28,
    AnchorPositioning                      = 1 << 29,
};

enum class ScrollCoordinationRole {
    ViewportConstrained = 1 << 0,
    Scrolling           = 1 << 1,
    ScrollingProxy      = 1 << 2,
    FrameHosting        = 1 << 3,
    PluginHosting       = 1 << 4,
    Positioning         = 1 << 5,
};

static constexpr OptionSet<ScrollCoordinationRole> allScrollCoordinationRoles()
{
    return {
        ScrollCoordinationRole::Scrolling,
        ScrollCoordinationRole::ScrollingProxy,
        ScrollCoordinationRole::ViewportConstrained,
        ScrollCoordinationRole::FrameHosting,
        ScrollCoordinationRole::PluginHosting,
        ScrollCoordinationRole::Positioning
    };
}

#if PLATFORM(IOS_FAMILY)
class LegacyWebKitScrollingLayerCoordinator {
    WTF_MAKE_TZONE_ALLOCATED(LegacyWebKitScrollingLayerCoordinator);
public:
    LegacyWebKitScrollingLayerCoordinator(ChromeClient& chromeClient, bool coordinateViewportConstrainedLayers)
        : m_chromeClient(chromeClient)
        , m_coordinateViewportConstrainedLayers(coordinateViewportConstrainedLayers)
    {
    }

    void registerAllViewportConstrainedLayers(RenderLayerCompositor&);
    void unregisterAllViewportConstrainedLayers();
    
    void registerAllScrollingLayers();
    void unregisterAllScrollingLayers();
    
    void addScrollingLayer(RenderLayer&);
    void removeScrollingLayer(RenderLayer&, RenderLayerBacking&);

    void addViewportConstrainedLayer(RenderLayer&);
    void removeViewportConstrainedLayer(RenderLayer&);

    void removeLayer(RenderLayer&);

private:
    void updateScrollingLayer(RenderLayer&);

    ChromeClient& m_chromeClient;

    SingleThreadWeakHashSet<RenderLayer> m_scrollingLayers;
    SingleThreadWeakHashSet<RenderLayer> m_viewportConstrainedLayers;

    const bool m_coordinateViewportConstrainedLayers;
};
#endif

// RenderLayerCompositor manages the hierarchy of
// composited RenderLayers. It determines which RenderLayers
// become compositing, and creates and maintains a hierarchy of
// GraphicsLayers based on the RenderLayer painting order.
// 
// There is one RenderLayerCompositor per RenderView.

class RenderLayerCompositor final : public GraphicsLayerClient, public CanMakeCheckedPtr<RenderLayerCompositor> {
    WTF_MAKE_TZONE_ALLOCATED(RenderLayerCompositor);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderLayerCompositor);
    friend class LegacyWebKitScrollingLayerCoordinator;
public:
    explicit RenderLayerCompositor(RenderView&);
    virtual ~RenderLayerCompositor();

    // Return true if this RenderView is in "compositing mode" (i.e. has one or more
    // composited RenderLayers)
    bool usesCompositing() const { return m_compositing; }
    // This will make a compositing layer at the root automatically, and hook up to
    // the native view/window system.
    void enableCompositingMode(bool enable = true);

    bool inForcedCompositingMode() const { return m_forceCompositingMode; }

    // True when some content element other than the root is composited.
    bool hasContentCompositingLayers() const { return m_contentLayersCount; }

    // Returns true if the accelerated compositing is enabled
    bool hasAcceleratedCompositing() const { return m_hasAcceleratedCompositing; }

    bool canRender3DTransforms() const;

    void willRecalcStyle();

    // Returns true if the composited layers were actually updated.
    bool didRecalcStyleWithNoPendingLayout();

    // GraphicsLayers buffer state, which gets pushed to the underlying platform layers
    // at specific times.
    void notifyFlushRequired(const GraphicsLayer*) override;
    void notifySubsequentFlushRequired(const GraphicsLayer*) override;
    void flushPendingLayerChanges(bool isFlushRoot = true);
    void setRenderingIsSuppressed(bool);

    // Called when the GraphicsLayer for the given RenderLayer has flushed changes inside of flushPendingLayerChanges().
    void didChangePlatformLayerForLayer(RenderLayer&, const GraphicsLayer*);

    // Called when something outside WebKit affects the visible rect (e.g. delegated scrolling). Might schedule a layer flush.
    void didChangeVisibleRect();
    
    // Rebuild the tree of compositing layers
    bool updateCompositingLayers(CompositingUpdateType, RenderLayer* updateRoot = nullptr);
    // This is only used when state changes and we do not exepect a style update or layout to happen soon (e.g. when
    // we discover that an iframe is overlapped during painting).
    void scheduleCompositingLayerUpdate();
    // This is used to cancel any pending update timers when the document goes into back/forward cache.
    void cancelCompositingLayerUpdate();

    // Update event regions, which only needs to happen once per rendering update.
    void updateEventRegions();
    void updateEventRegionsRecursive(RenderLayer&);

    struct RequiresCompositingData {
        LayoutUpToDate layoutUpToDate { LayoutUpToDate::Yes };
        RenderLayer::ViewportConstrainedNotCompositedReason nonCompositedForPositionReason { RenderLayer::NoNotCompositedReason };
        bool reevaluateAfterLayout { false };
        bool intrinsic { false };
    };

    // Whether layer's backing needs a graphics layer to do clipping by an ancestor (non-stacking-context parent with overflow).
    bool clippedByAncestor(RenderLayer&, const RenderLayer* compositingAncestor) const;

    bool updateAncestorClippingStack(const RenderLayer&, const RenderLayer* compositingAncestor) const;

    // Returns the ScrollingNodeID for the containing async-scrollable layer that scrolls this renderer's border box.
    // May return 0 for position-fixed content.
    WEBCORE_EXPORT static std::optional<ScrollingNodeID> asyncScrollableContainerNodeID(const RenderObject&);

    // Whether layer's backing needs a graphics layer to clip z-order children of the given layer.
    static bool clipsCompositingDescendants(const RenderLayer&);

    // Whether the given layer needs an extra 'contents' layer.
    bool needsContentsCompositingLayer(const RenderLayer&) const;

    bool fixedLayerIntersectsViewport(const RenderLayer&) const;

    bool supportsFixedRootBackgroundCompositing() const;
    bool needsFixedRootBackgroundLayer(const RenderLayer&) const;
    GraphicsLayer* fixedRootBackgroundLayer() const;

    void rootOrBodyStyleChanged(RenderElement&, const RenderStyle* oldStyle);

    // Called after the view transparency, or the document or base background color change.
    void rootBackgroundColorOrTransparencyChanged();
    
    // Repaint the appropriate layers when the given RenderLayer starts or stops being composited.
    void repaintOnCompositingChange(RenderLayer&);
    
    void repaintInCompositedAncestor(RenderLayer&, const LayoutRect&);
    
    // Notify us that a layer has been removed
    void layerWillBeRemoved(RenderLayer& parent, RenderLayer& child);

    void layerStyleChanged(StyleDifference, RenderLayer&, const RenderStyle* oldStyle);
    void layerGainedCompositedScrollableOverflow(RenderLayer&);

    void establishesTopLayerWillChangeForLayer(RenderLayer&);

    // Get the nearest ancestor layer that has overflow or clip, but is not a stacking context
    RenderLayer* enclosingNonStackingClippingLayer(const RenderLayer&) const;

    // Repaint all composited layers.
    void repaintCompositedLayers();

    // Returns true if the given layer needs it own backing store.
    bool requiresOwnBackingStore(const RenderLayer&, const RenderLayer* compositingAncestorLayer, const LayoutRect& layerCompositedBoundsInAncestor, const LayoutRect& ancestorCompositedBounds) const;

    WEBCORE_EXPORT RenderLayer& rootRenderLayer() const;
    GraphicsLayer* rootGraphicsLayer() const;

    GraphicsLayer* scrollContainerLayer() const { return m_scrollContainerLayer.get(); }
    GraphicsLayer* scrolledContentsLayer() const { return m_scrolledContentsLayer.get(); }
    GraphicsLayer* clipLayer() const { return m_clipLayer.get(); }
    GraphicsLayer* rootContentsLayer() const { return m_rootContentsLayer.get(); }

    GraphicsLayer* layerForClipping() const {  return m_clipLayer ? m_clipLayer.get() : m_scrollContainerLayer.get();  }

#if HAVE(RUBBER_BANDING)
    GraphicsLayer* headerLayer() const { return m_layerForHeader.get(); }
    GraphicsLayer* footerLayer() const { return m_layerForFooter.get(); }
#endif

    enum RootLayerAttachment {
        RootLayerUnattached,
        RootLayerAttachedViaChromeClient,
        RootLayerAttachedViaEnclosingFrame
    };

    RootLayerAttachment rootLayerAttachment() const { return m_rootLayerAttachment; }
    void updateRootLayerAttachment();
    void updateRootLayerPosition();
    
    void setIsInWindow(bool);

    void clearBackingForAllLayers();
    void invalidateEventRegionForAllFrames();
    void invalidateEventRegionForAllLayers();
    
    void layerBecameComposited(const RenderLayer&);
    void layerBecameNonComposited(const RenderLayer&);
    
#if ENABLE(VIDEO)
    // Use by RenderVideo to ask if it should try to use accelerated compositing.
    bool canAccelerateVideoRendering(RenderVideo&) const;
#endif

    // Walk the tree looking for layers with 3d transforms. Useful in case you need
    // to know if there is non-affine content, e.g. for drawing into an image.
    bool has3DContent() const;
    
    static bool hasCompositedWidgetContents(const RenderObject&);
    static bool isCompositedPlugin(const RenderObject&);

#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    static bool isSeparated(const RenderObject&);
#endif

    static RenderLayerCompositor* frameContentsCompositor(RenderWidget&);

    struct WidgetLayerAttachment {
        bool widgetLayersAttachedAsChildren { false };
        bool layerHierarchyChanged { false };
    };
    WidgetLayerAttachment attachWidgetContentLayersIfNecessary(RenderWidget&);

    void collectViewTransitionNewContentLayers(RenderLayer&, Vector<Ref<GraphicsLayer>>&);

    // Update the geometry of the layers used for clipping and scrolling in frames.
    void frameViewDidChangeLocation(const IntPoint& contentsOffset);
    void frameViewDidChangeSize();
    void frameViewDidScroll();
    void frameViewDidAddOrRemoveScrollbars();
    void frameViewDidLayout();
    void rootLayerConfigurationChanged();

    void widgetDidChangeSize(RenderWidget&);

    WEBCORE_EXPORT String layerTreeAsText(OptionSet<LayerTreeAsTextOptions> = { }) const;
    WEBCORE_EXPORT String trackedRepaintRectsAsText() const;

    WEBCORE_EXPORT String layerTreeAsText(OptionSet<LayerTreeAsTextOptions> = { }, uint32_t baseIndent = 0);
    WEBCORE_EXPORT std::optional<String> platformLayerTreeAsText(Element&, OptionSet<PlatformLayerTreeAsTextFlags>);

    float deviceScaleFactor() const override;
    float contentsScaleMultiplierForNewTiles(const GraphicsLayer*) const override;
    float pageScaleFactor() const override;
    float zoomedOutPageScaleFactor() const override;
    void didChangePlatformLayerForLayer(const GraphicsLayer*) override { }

    void layerTiledBackingUsageChanged(const GraphicsLayer*, bool /*usingTiledBacking*/);
    
    bool acceleratedDrawingEnabled() const { return m_acceleratedDrawingEnabled; }

    void deviceOrPageScaleFactorChanged();

    GraphicsLayer* layerForHorizontalScrollbar() const { return m_layerForHorizontalScrollbar.get(); }
    GraphicsLayer* layerForVerticalScrollbar() const { return m_layerForVerticalScrollbar.get(); }
    GraphicsLayer* layerForScrollCorner() const { return m_layerForScrollCorner.get(); }
#if HAVE(RUBBER_BANDING)
    GraphicsLayer* layerForOverhangAreas() const { return m_layerForOverhangAreas.get(); }
    GraphicsLayer* layerForContentShadow() const { return m_contentShadowLayer.get(); }

    GraphicsLayer* updateLayerForTopOverhangArea(bool wantsLayer);
    GraphicsLayer* updateLayerForBottomOverhangArea(bool wantsLayer);
    GraphicsLayer* updateLayerForHeader(bool wantsLayer);
    GraphicsLayer* updateLayerForFooter(bool wantsLayer);

    void updateLayerForOverhangAreasBackgroundColor();
    void updateSizeAndPositionForOverhangAreaLayer();
#endif // HAVE(RUBBER_BANDING)

    void updateRootContentsLayerBackgroundColor();

    // FIXME: make the coordinated/async terminology consistent.
    bool isViewportConstrainedFixedOrStickyLayer(const RenderLayer&) const;
    bool useCoordinatedScrollingForLayer(const RenderLayer&) const;
    ScrollPositioningBehavior computeCoordinatedPositioningForLayer(const RenderLayer&, const RenderLayer* compositingAncestor) const;
    bool isLayerForIFrameWithScrollCoordinatedContents(const RenderLayer&) const;
    bool isLayerForPluginWithScrollCoordinatedContents(const RenderLayer&) const;

    ScrollableArea* scrollableAreaForScrollingNodeID(std::optional<ScrollingNodeID>) const;

    void removeFromScrollCoordinatedLayers(RenderLayer&);

    void willRemoveScrollingLayerWithBacking(RenderLayer&, RenderLayerBacking&);
    void didAddScrollingLayer(RenderLayer&);

    void resetTrackedRepaintRects();
    void setTracksRepaints(bool tracksRepaints) { m_isTrackingRepaints = tracksRepaints; }

    bool viewHasTransparentBackground(Color* backgroundColor = nullptr) const;

    bool viewNeedsToInvalidateEventRegionOfEnclosingCompositingLayerForRepaint() const;

    bool hasNonMainLayersWithTiledBacking() const { return m_layersWithTiledBackingCount; }

    OptionSet<CompositingReason> reasonsForCompositing(const RenderLayer&) const;
    
    void didPaintBacking(RenderLayerBacking*);

    const Color& rootExtendedBackgroundColor() const { return m_rootExtendedBackgroundColor; }

    void updateRootContentLayerClipping();

    void setRootElementCapturedInViewTransition(bool);

    void updateScrollSnapPropertiesWithFrameView(const LocalFrameView&) const;

    // For testing.
    void startTrackingLayerFlushes() { m_layerFlushCount = 0; }
    unsigned layerFlushCount() const { return m_layerFlushCount; }

    void startTrackingCompositingUpdates() { m_compositingUpdateCount = 0; }
    unsigned compositingUpdateCount() const { return m_compositingUpdateCount; }

    class BackingSharingState;

private:
    struct CompositingState;
    struct OverlapExtent;
    struct UpdateBackingTraversalState;

    // Returns true if the policy changed.
    bool updateCompositingPolicy();
    bool canUpdateCompositingPolicy() const;
    
    // GraphicsLayerClient implementation
    void paintContents(const GraphicsLayer*, GraphicsContext&, const FloatRect&, OptionSet<GraphicsLayerPaintBehavior>) override;
    void customPositionForVisibleRectComputation(const GraphicsLayer*, FloatPoint&) const override;
    bool shouldDumpPropertyForLayer(const GraphicsLayer*, ASCIILiteral propertyName, OptionSet<LayerTreeAsTextOptions>) const override;
    bool isFlushingLayers() const override { return m_flushingLayers; }
    bool isTrackingRepaints() const override { return m_isTrackingRepaints; }
#if HAVE(HDR_SUPPORT)
    bool hdrForImagesEnabled() const override;
#endif

    // Copy the accelerated compositing related flags from Settings
    void cacheAcceleratedCompositingFlags();
    void cacheAcceleratedCompositingFlagsAfterLayout();

    // Whether the given RL needs a compositing layer.
    bool needsToBeComposited(const RenderLayer&, RequiresCompositingData&) const;
    // Whether the layer has an intrinsic need for compositing layer.
    bool requiresCompositingLayer(const RenderLayer&, RequiresCompositingData&) const;
    // Whether the layer could ever be composited.
    bool canBeComposited(const RenderLayer&) const;

    // Make or destroy the backing for this layer; returns true if backing changed.
    enum class BackingRequired { No, Yes, Unknown };
    bool updateBacking(RenderLayer&, RequiresCompositingData&, BackingSharingState* = nullptr, BackingRequired = BackingRequired::Unknown);
    bool updateLayerCompositingState(RenderLayer&, const RenderLayer* compositingAncestor, RequiresCompositingData&, BackingSharingState&);

    template<typename ApplyFunctionType> void applyToCompositedLayerIncludingDescendants(RenderLayer&, const ApplyFunctionType&);

    // Repaint this and its child layers.
    void recursiveRepaintLayer(RenderLayer&);
    bool layerRepaintTargetsBackingSharingLayer(RenderLayer&, BackingSharingState&) const;

    void computeExtent(const LayerOverlapMap&, const RenderLayer&, OverlapExtent&) const;
    void computeClippingScopes(const RenderLayer&, OverlapExtent&) const;
    void addToOverlapMap(LayerOverlapMap&, const RenderLayer&, OverlapExtent&) const;
    LayoutRect computeClippedOverlapBounds(LayerOverlapMap&, const RenderLayer&, OverlapExtent&) const;
    void addDescendantsToOverlapMapRecursive(LayerOverlapMap&, const RenderLayer&, const RenderLayer* ancestorLayer = nullptr) const;
    void updateOverlapMap(LayerOverlapMap&, const RenderLayer&, OverlapExtent&, bool didPushContainer, bool addLayerToOverlap, bool addDescendantsToOverlap = false) const;
    bool layerOverlaps(const LayerOverlapMap&, const RenderLayer&, OverlapExtent&) const;

    struct BackingSharingSnapshot;

    std::optional<BackingSharingSnapshot> updateBackingSharingBeforeDescendantTraversal(BackingSharingState&, unsigned depth, const LayerOverlapMap&, RenderLayer&, OverlapExtent&, bool willBeComposited, RenderLayer* stackingContextAncestor);
    void updateBackingSharingAfterDescendantTraversal(BackingSharingState&, unsigned depth, const LayerOverlapMap&, RenderLayer&, OverlapExtent&, RenderLayer* stackingContextAncestor, const std::optional<BackingSharingSnapshot>&);

    void clearBackingProviderSequencesInStackingContextOfLayer(RenderLayer&);

    void updateCompositingLayersTimerFired();

    void computeCompositingRequirements(RenderLayer* ancestorLayer, RenderLayer&, LayerOverlapMap&, CompositingState&, BackingSharingState&);
    void traverseUnchangedSubtree(RenderLayer* ancestorLayer, RenderLayer&, LayerOverlapMap&, CompositingState&, BackingSharingState&);

    enum class UpdateLevel {
        AllDescendants          = 1 << 0,
        CompositedChildren      = 1 << 1,
    };
    // Recurses down the tree, parenting descendant compositing layers and collecting an array of child layers for the current compositing layer.
    void updateBackingAndHierarchy(RenderLayer&, Vector<Ref<GraphicsLayer>>& childGraphicsLayersOfEnclosingLayer, struct UpdateBackingTraversalState&, struct ScrollingTreeState&, OptionSet<UpdateLevel> = { });

    void adjustOverflowScrollbarContainerLayers(RenderLayer& stackingContextLayer, const Vector<RenderLayer*>& overflowScrollLayers, const Vector<RenderLayer*>& layersClippedByScrollers, Vector<Ref<GraphicsLayer>>&);

    bool layerHas3DContent(const RenderLayer&) const;
    bool isRunningTransformAnimation(RenderLayerModelObject&) const;

    bool allowBackingStoreDetachingForFixedPosition(RenderLayer&, const LayoutRect& absoluteBounds);

    void appendDocumentOverlayLayers(Vector<Ref<GraphicsLayer>>&);

    bool needsCompositingForContentOrOverlays() const;

    void scheduleRenderingUpdate();

    void ensureRootLayer();
    void destroyRootLayer();

    void attachRootLayer(RootLayerAttachment);
    void detachRootLayer();
    
    void rootLayerAttachmentChanged();

    void updateOverflowControlsLayers();

    void updateScrollLayerPosition();
    void updateScrollLayerClipping();

    FloatPoint positionForClipLayer() const;

    void notifyIFramesOfCompositingChange();

#if PLATFORM(IOS_FAMILY)
    void updateScrollCoordinatedLayersAfterFlushIncludingSubframes();
    void updateScrollCoordinatedLayersAfterFlush();
#endif

    FloatRect visibleRectForLayerFlushing() const;
    
    Page& page() const;
    
    GraphicsLayerFactory* graphicsLayerFactory() const;
    ScrollingCoordinator* scrollingCoordinator() const;

    // Non layout-dependent
    bool requiresCompositingForAnimation(RenderLayerModelObject&) const;
    bool requiresCompositingForTransform(RenderLayerModelObject&) const;
    bool requiresCompositingForBackfaceVisibility(RenderLayerModelObject&) const;
    bool requiresCompositingForViewTransition(RenderLayerModelObject&) const;
    bool requiresCompositingForVideo(RenderLayerModelObject&) const;
    bool requiresCompositingForCanvas(RenderLayerModelObject&) const;
    bool requiresCompositingForFilters(RenderLayerModelObject&) const;
    bool requiresCompositingForWillChange(RenderLayerModelObject&) const;
    bool requiresCompositingForModel(RenderLayerModelObject&) const;

    // Layout-dependent
    bool requiresCompositingForPlugin(RenderLayerModelObject&, RequiresCompositingData&) const;
    bool requiresCompositingForFrame(RenderLayerModelObject&, RequiresCompositingData&) const;
    bool requiresCompositingForScrollableFrame(RequiresCompositingData&) const;
    bool requiresCompositingForPosition(RenderLayerModelObject&, const RenderLayer&, RequiresCompositingData&) const;
    bool requiresCompositingForOverflowScrolling(const RenderLayer&, RequiresCompositingData&) const;
    bool requiresCompositingForAnchorPositioning(const RenderLayer&) const;
    IndirectCompositingReason computeIndirectCompositingReason(const RenderLayer&, bool hasCompositedDescendants, bool has3DTransformedDescendants, bool paintsIntoProvidedBacking) const;

    static ScrollPositioningBehavior layerScrollBehahaviorRelativeToCompositedAncestor(const RenderLayer&, const RenderLayer& compositedAncestor);

    static bool styleChangeMayAffectIndirectCompositingReasons(const RenderStyle& oldStyle, const RenderStyle& newStyle);

    enum class ScrollingNodeChangeFlags {
        Layer           = 1 << 0,
        LayerGeometry   = 1 << 1,
    };

    std::optional<ScrollingNodeID> attachScrollingNode(RenderLayer&, ScrollingNodeType, struct ScrollingTreeState&);
    std::optional<ScrollingNodeID> registerScrollingNodeID(ScrollingCoordinator&, std::optional<ScrollingNodeID>, ScrollingNodeType, struct ScrollingTreeState&);

    OptionSet<ScrollCoordinationRole> coordinatedScrollingRolesForLayer(const RenderLayer&, const RenderLayer* compositingAncestor) const;

    // Returns the ScrollingNodeID which acts as the parent for children.
    std::optional<ScrollingNodeID> updateScrollCoordinationForLayer(RenderLayer&, const RenderLayer* compositingAncestor, struct ScrollingTreeState&, OptionSet<ScrollingNodeChangeFlags>);

    // These return the ScrollingNodeID which acts as the parent for children.
    std::optional<ScrollingNodeID> updateScrollingNodeForViewportConstrainedRole(RenderLayer&, struct ScrollingTreeState&, OptionSet<ScrollingNodeChangeFlags>);
    std::optional<ScrollingNodeID> updateScrollingNodeForScrollingRole(RenderLayer&, struct ScrollingTreeState&, OptionSet<ScrollingNodeChangeFlags>);
    std::optional<ScrollingNodeID> updateScrollingNodeForScrollingProxyRole(RenderLayer&, struct ScrollingTreeState&, OptionSet<ScrollingNodeChangeFlags>);
    std::optional<ScrollingNodeID> updateScrollingNodeForFrameHostingRole(RenderLayer&, struct ScrollingTreeState&, OptionSet<ScrollingNodeChangeFlags>);
    std::optional<ScrollingNodeID> updateScrollingNodeForPluginHostingRole(RenderLayer&, struct ScrollingTreeState&, OptionSet<ScrollingNodeChangeFlags>);
    std::optional<ScrollingNodeID> updateScrollingNodeForPositioningRole(RenderLayer&, const RenderLayer* compositingAncestor, struct ScrollingTreeState&, OptionSet<ScrollingNodeChangeFlags>);

    void updateScrollingNodeLayers(ScrollingNodeID, RenderLayer&, ScrollingCoordinator&);

    void detachScrollCoordinatedLayer(RenderLayer&, OptionSet<ScrollCoordinationRole>);
    void detachScrollCoordinatedLayerWithRole(RenderLayer&, ScrollingCoordinator&, ScrollCoordinationRole);
    
    void resolveScrollingTreeRelationships();
    bool setupScrollProxyRelatedOverflowScrollingNode(ScrollingCoordinator&, ScrollingNodeID, RenderLayer&);

    void updateSynchronousScrollingNodes();

    FixedPositionViewportConstraints computeFixedViewportConstraints(RenderLayer&) const;
    StickyPositionViewportConstraints computeStickyViewportConstraints(RenderLayer&) const;

    RoundedRect parentRelativeScrollableRect(const RenderLayer&, const RenderLayer* ancestorLayer) const;

    // Returns list of layers and their clip rects required to clip the given layer, which include clips in the
    // containing block chain between the given layer and its composited ancestor.
    Vector<CompositedClipData> computeAncestorClippingStack(const RenderLayer&, const RenderLayer* compositingAncestor) const;

    bool requiresScrollLayer(RootLayerAttachment) const;
    bool requiresHorizontalScrollbarLayer() const;
    bool requiresVerticalScrollbarLayer() const;
    bool requiresScrollCornerLayer() const;
#if HAVE(RUBBER_BANDING)
    bool requiresOverhangAreasLayer() const;
    bool requiresContentShadowLayer() const;
#endif

    // True if the FrameView uses a ScrollingCoordinator.
    bool hasCoordinatedScrolling() const;

    // FIXME: make the coordinated/async terminology consistent.
    bool isAsyncScrollableStickyLayer(const RenderLayer&, const RenderLayer** enclosingAcceleratedOverflowLayer = nullptr) const;

    bool shouldCompositeOverflowControls() const;

#if !LOG_DISABLED
    ASCIILiteral logOneReasonForCompositing(const RenderLayer&);
    void logLayerInfo(const RenderLayer&, ASCIILiteral, int depth);
#endif

    bool documentUsesTiledBacking() const;
    bool isRootFrameCompositor() const;
    bool isMainFrameCompositor() const;

    void updateCompositingForLayerTreeAsTextDump();

    RenderView& m_renderView;
    Timer m_updateCompositingLayersTimer;
    Timer m_updateRenderingTimer;

    ChromeClient::CompositingTriggerFlags m_compositingTriggers { static_cast<ChromeClient::CompositingTriggerFlags>(ChromeClient::AllTriggers) };
    bool m_hasAcceleratedCompositing { true };
    
    CompositingPolicy m_compositingPolicy { CompositingPolicy::Normal };
    PAL::HysteresisActivity m_compositingPolicyHysteresis;

    bool m_showDebugBorders { false };
    bool m_showRepaintCounter { false };
    bool m_acceleratedDrawingEnabled { false };

    bool m_compositing { false };
    bool m_flushingLayers { false };
    bool m_shouldFlushOnReattach { false };
    bool m_forceCompositingMode { false };
    bool m_rootElementCapturedInViewTransition { false };

    bool m_isTrackingRepaints { false }; // Used for testing.

    unsigned m_contentLayersCount { 0 };
    unsigned m_layersWithTiledBackingCount { 0 };
    unsigned m_layerFlushCount { 0 };
    unsigned m_compositingUpdateCount { 0 };

    RootLayerAttachment m_rootLayerAttachment { RootLayerUnattached };

    RefPtr<GraphicsLayer> m_rootContentsLayer;

    // Enclosing clipping layer for iframe content
    RefPtr<GraphicsLayer> m_clipLayer;
    RefPtr<GraphicsLayer> m_scrollContainerLayer;
    RefPtr<GraphicsLayer> m_scrolledContentsLayer;

    // Enclosing layer for overflow controls and the clipping layer
    RefPtr<GraphicsLayer> m_overflowControlsHostLayer;

    // Layers for overflow controls
    RefPtr<GraphicsLayer> m_layerForHorizontalScrollbar;
    RefPtr<GraphicsLayer> m_layerForVerticalScrollbar;
    RefPtr<GraphicsLayer> m_layerForScrollCorner;
#if HAVE(RUBBER_BANDING)
    RefPtr<GraphicsLayer> m_layerForOverhangAreas;
    RefPtr<GraphicsLayer> m_contentShadowLayer;
    RefPtr<GraphicsLayer> m_layerForTopOverhangArea;
    RefPtr<GraphicsLayer> m_layerForBottomOverhangArea;
    RefPtr<GraphicsLayer> m_layerForHeader;
    RefPtr<GraphicsLayer> m_layerForFooter;
#endif

    bool m_viewBackgroundIsTransparent { false };

#if !LOG_DISABLED
    int m_rootLayerUpdateCount { 0 };
    int m_obligateCompositedLayerCount { 0 }; // count of layer that have to be composited.
    int m_secondaryCompositedLayerCount { 0 }; // count of layers that have to be composited because of stacking or overlap.
    double m_obligatoryBackingStoreBytes { 0 };
    double m_secondaryBackingStoreBytes { 0 };
#endif

    Color m_viewBackgroundColor;
    Color m_rootExtendedBackgroundColor;

    UncheckedKeyHashMap<ScrollingNodeID, SingleThreadWeakPtr<RenderLayer>> m_scrollingNodeToLayerMap;
    SingleThreadWeakHashSet<RenderLayer> m_layersWithUnresolvedRelations;
#if PLATFORM(IOS_FAMILY)
    std::unique_ptr<LegacyWebKitScrollingLayerCoordinator> m_legacyScrollingLayerCoordinator;
#endif
};

void paintScrollbar(Scrollbar*, GraphicsContext&, const IntRect& clip, const Color& backgroundColor = Color());

WTF::TextStream& operator<<(WTF::TextStream&, CompositingUpdateType);
WTF::TextStream& operator<<(WTF::TextStream&, CompositingPolicy);
WTF::TextStream& operator<<(WTF::TextStream&, CompositingReason);

} // namespace WebCore

#if ENABLE(TREE_DEBUGGING)
// Outside the WebCore namespace for ease of invocation from the debugger.
void showGraphicsLayerTreeForCompositor(WebCore::RenderLayerCompositor&);
#endif
