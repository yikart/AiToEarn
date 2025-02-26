/*
 * Copyright (C) 2009-2023 Apple Inc. All rights reserved.
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

#include "Color.h"
#include "EventRegion.h"
#include "FilterOperations.h"
#include "FloatPoint.h"
#include "FloatPoint3D.h"
#include "FloatRoundedRect.h"
#include "FloatSize.h"
#include "GraphicsLayerClient.h"
#include "GraphicsTypes.h"
#include "HTMLMediaElementIdentifier.h"
#include "LayerHostingContextIdentifier.h"
#include "MediaPlayerEnums.h"
#include "Path.h"
#include "PlatformLayer.h"
#include "PlatformLayerIdentifier.h"
#include "ProcessIdentifier.h"
#include "ProcessQualified.h"
#include "Region.h"
#include "ScrollableArea.h"
#include "ScrollTypes.h"
#include "TimingFunction.h"
#include "TransformOperations.h"
#include "WindRule.h"
#include <wtf/CheckedRef.h>
#include <wtf/Function.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/TypeCasts.h>

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
#include "AcceleratedEffectStack.h"
#endif

#if HAVE(CORE_MATERIAL)
#include "AppleVisualEffect.h"
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

class Animation;
class GraphicsContext;
class GraphicsLayerFactory;
class GraphicsLayerContentsDisplayDelegate;
class GraphicsLayerAsyncContentsDisplayDelegate;
class HTMLVideoElement;
class Image;
class ImageBuffer;
class Model;
class Settings;
class TiledBacking;
class TimingFunction;
class TransformationMatrix;

typedef unsigned TileCoverage;

#if ENABLE(MODEL_PROCESS)
class ModelContext;
#endif

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
struct AcceleratedEffectValues;
String acceleratedEffectPropertyIDAsString(AcceleratedEffectProperty);
#endif

String animatedPropertyIDAsString(AnimatedProperty);

namespace DisplayList {
enum class AsTextFlag : uint8_t;
}

using LayerHostingContextID = uint32_t;

// Base class for animation values (also used for transitions). Here to
// represent values for properties being animated via the GraphicsLayer,
// without pulling in style-related data from outside of the platform directory.
// FIXME: Should be moved to its own header file.
class AnimationValue {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(AnimationValue, WEBCORE_EXPORT);
public:
    virtual ~AnimationValue() = default;

    double keyTime() const { return m_keyTime; }
    const TimingFunction* timingFunction() const { return m_timingFunction.get(); }
    virtual std::unique_ptr<AnimationValue> clone() const = 0;

protected:
    AnimationValue(double keyTime, TimingFunction* timingFunction = nullptr)
        : m_keyTime(keyTime)
        , m_timingFunction(timingFunction)
    {
    }

    AnimationValue(const AnimationValue& other)
        : m_keyTime(other.m_keyTime)
        , m_timingFunction(other.m_timingFunction ? RefPtr<TimingFunction> { other.m_timingFunction->clone() } : nullptr)
    {
    }

    AnimationValue(AnimationValue&&) = default;

private:
    void operator=(const AnimationValue&) = delete;

    double m_keyTime;
    RefPtr<TimingFunction> m_timingFunction;
};

// Used to store one float value of an animation.
// FIXME: Should be moved to its own header file.
class FloatAnimationValue : public AnimationValue {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FloatAnimationValue, WEBCORE_EXPORT);
public:
    FloatAnimationValue(double keyTime, float value, TimingFunction* timingFunction = nullptr)
        : AnimationValue(keyTime, timingFunction)
        , m_value(value)
    {
    }

    std::unique_ptr<AnimationValue> clone() const override
    {
        return makeUnique<FloatAnimationValue>(*this);
    }

    float value() const { return m_value; }

private:
    float m_value;
};

// Used to store one transform value in a keyframe list.
// FIXME: Should be moved to its own header file.
class TransformAnimationValue : public AnimationValue {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(TransformAnimationValue, WEBCORE_EXPORT);
public:
    TransformAnimationValue(double keyTime, const TransformOperations& value, TimingFunction* timingFunction = nullptr)
        : AnimationValue(keyTime, timingFunction)
        , m_value(value)
    {
    }

    TransformAnimationValue(double keyTime, TransformOperation* value, TimingFunction* timingFunction = nullptr)
        : AnimationValue(keyTime, timingFunction)
        , m_value(value ? TransformOperations { *value } : TransformOperations { })
    {
    }

    std::unique_ptr<AnimationValue> clone() const override
    {
        return makeUnique<TransformAnimationValue>(*this);
    }

    TransformAnimationValue(const TransformAnimationValue& other)
        : AnimationValue(other)
        , m_value(other.m_value.clone())
    {
    }

    TransformAnimationValue(TransformAnimationValue&&) = default;

    const TransformOperations& value() const { return m_value; }

private:
    TransformOperations m_value;
};

// Used to store one filter value in a keyframe list.
// FIXME: Should be moved to its own header file.
class FilterAnimationValue : public AnimationValue {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FilterAnimationValue, WEBCORE_EXPORT);
public:
    FilterAnimationValue(double keyTime, const FilterOperations& value, TimingFunction* timingFunction = nullptr)
        : AnimationValue(keyTime, timingFunction)
        , m_value(value)
    {
    }

    std::unique_ptr<AnimationValue> clone() const override
    {
        return makeUnique<FilterAnimationValue>(*this);
    }

    FilterAnimationValue(const FilterAnimationValue& other)
        : AnimationValue(other)
        , m_value(other.m_value.clone())
    {
    }

    FilterAnimationValue(FilterAnimationValue&&) = default;

    const FilterOperations& value() const { return m_value; }

private:
    FilterOperations m_value;
};

// Used to store a series of values in a keyframe list.
// Values will all be of the same type, which can be inferred from the property.
// FIXME: Should be moved to its own header file.
class KeyframeValueList {
    WTF_MAKE_TZONE_ALLOCATED(KeyframeValueList);
public:
    explicit KeyframeValueList(AnimatedProperty property)
        : m_property(property)
    {
    }

    KeyframeValueList(const KeyframeValueList& other)
        : m_property(other.property())
    {
        m_values = WTF::map(other.m_values, [](auto& value) -> std::unique_ptr<const AnimationValue> {
            return value->clone();
        });
    }

    KeyframeValueList(KeyframeValueList&&) = default;

    KeyframeValueList& operator=(const KeyframeValueList& other)
    {
        KeyframeValueList copy(other);
        swap(copy);
        return *this;
    }

    KeyframeValueList& operator=(KeyframeValueList&&) = default;

    void swap(KeyframeValueList& other)
    {
        std::swap(m_property, other.m_property);
        m_values.swap(other.m_values);
    }

    AnimatedProperty property() const { return m_property; }

    size_t size() const { return m_values.size(); }
    const AnimationValue& at(size_t i) const { return *m_values.at(i); }

    // Insert, sorted by keyTime.
    WEBCORE_EXPORT void insert(std::unique_ptr<const AnimationValue>);

protected:
    Vector<std::unique_ptr<const AnimationValue>> m_values;
    AnimatedProperty m_property;
};

// GraphicsLayer is an abstraction for a rendering surface with backing store,
// which may have associated transformation and animations.

class GraphicsLayer : public RefCounted<GraphicsLayer> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(GraphicsLayer, WEBCORE_EXPORT);
public:
    enum class Type : uint8_t {
        Normal,
        Structural, // Supports position and transform only, and doesn't flatten (i.e. behaves like preserves3D is true). Uses CATransformLayer on Cocoa platforms.
        PageTiledBacking,
        TiledBacking,
        ScrollContainer,
        ScrolledContents,
        Shape
    };
    
    enum class LayerMode : uint8_t {
        PlatformLayer,
        LayerHostingContextId
    };

    virtual LayerMode layerMode() const { return LayerMode::PlatformLayer; }
    
    WEBCORE_EXPORT static Ref<GraphicsLayer> create(GraphicsLayerFactory*, GraphicsLayerClient&, Type = Type::Normal);
    
    WEBCORE_EXPORT virtual ~GraphicsLayer();
    
    // Unparent, clear the client, and clear the RefPtr.
    WEBCORE_EXPORT static void unparentAndClear(RefPtr<GraphicsLayer>&);
    // Clear the client, and clear the RefPtr, but leave parented.
    WEBCORE_EXPORT static void clear(RefPtr<GraphicsLayer>&);

    WEBCORE_EXPORT void clearClient();
    WEBCORE_EXPORT void setClient(GraphicsLayerClient&);

    Type type() const { return m_type; }

    virtual void initialize(Type) { }

    virtual std::optional<PlatformLayerIdentifier> primaryLayerID() const { return std::nullopt; }

    GraphicsLayerClient& client() const { return *m_client; }

    // Layer name. Only used to identify layers in debug output
    const String& name() const { return m_name; }
    virtual void setName(const String& name) { m_name = name; }
    WEBCORE_EXPORT virtual String debugName() const;

    GraphicsLayer* parent() const { return m_parent; };
    void setParent(GraphicsLayer*); // Internal use only.
    
    // Returns true if the layer has the given layer as an ancestor (excluding self).
    bool hasAncestor(GraphicsLayer*) const;
    
    const Vector<Ref<GraphicsLayer>>& children() const { return m_children; }
    Vector<Ref<GraphicsLayer>>& children() { return m_children; }

    // Returns true if the child list changed.
    WEBCORE_EXPORT virtual bool setChildren(Vector<Ref<GraphicsLayer>>&&);

    // Add child layers. If the child is already parented, it will be removed from its old parent.
    WEBCORE_EXPORT virtual void addChild(Ref<GraphicsLayer>&&);
    WEBCORE_EXPORT virtual void addChildAtIndex(Ref<GraphicsLayer>&&, int index);
    WEBCORE_EXPORT virtual void addChildAbove(Ref<GraphicsLayer>&&, GraphicsLayer* sibling);
    WEBCORE_EXPORT virtual void addChildBelow(Ref<GraphicsLayer>&&, GraphicsLayer* sibling);
    WEBCORE_EXPORT virtual bool replaceChild(GraphicsLayer* oldChild, Ref<GraphicsLayer>&& newChild);

    WEBCORE_EXPORT void removeAllChildren();
    WEBCORE_EXPORT void removeFromParent();

    // The parent() of a maskLayer is set to the layer being masked.
    GraphicsLayer* maskLayer() const { return m_maskLayer.get(); }
    WEBCORE_EXPORT virtual void setMaskLayer(RefPtr<GraphicsLayer>&&);

    void setIsMaskLayer(bool isMask) { m_isMaskLayer = isMask; }
    bool isMaskLayer() const { return m_isMaskLayer; }

    virtual void setIsBackdropRoot(bool isBackdropRoot) { m_isBackdropRoot = isBackdropRoot; }
    bool isBackdropRoot() const { return m_isBackdropRoot; }

    // The given layer will replicate this layer and its children; the replica renders behind this layer.
    WEBCORE_EXPORT virtual void setReplicatedByLayer(RefPtr<GraphicsLayer>&&);
    // Whether this layer is being replicated by another layer.
    bool isReplicated() const { return m_replicaLayer; }
    // The layer that replicates this layer (if any).
    GraphicsLayer* replicaLayer() const { return m_replicaLayer.get(); }

    const FloatPoint& replicatedLayerPosition() const { return m_replicatedLayerPosition; }
    void setReplicatedLayerPosition(const FloatPoint& p) { m_replicatedLayerPosition = p; }

    enum ShouldSetNeedsDisplay {
        DontSetNeedsDisplay,
        SetNeedsDisplay
    };

    // Offset is origin of the renderer minus origin of the graphics layer.
    FloatSize offsetFromRenderer() const { return m_offsetFromRenderer; }
    void setOffsetFromRenderer(const FloatSize&, ShouldSetNeedsDisplay = SetNeedsDisplay);

    // Scroll offset of the content layer inside its scrolling parent layer.
    ScrollOffset scrollOffset() const { return m_scrollOffset; }
    void setScrollOffset(const ScrollOffset&, ShouldSetNeedsDisplay = SetNeedsDisplay);

#if ENABLE(SCROLLING_THREAD)
    std::optional<ScrollingNodeID> scrollingNodeID() const { return m_scrollingNodeID; }
    virtual void setScrollingNodeID(std::optional<ScrollingNodeID> nodeID) { m_scrollingNodeID = nodeID; }
#endif

    // The position of the layer (the location of its top-left corner in its parent)
    const FloatPoint& position() const { return m_position; }
    virtual void setPosition(const FloatPoint& p) { m_approximatePosition = std::nullopt; m_position = p; }

    // approximatePosition, if set, overrides position() and is used during coverage rect computation.
    FloatPoint approximatePosition() const { return m_approximatePosition ? m_approximatePosition.value() : m_position; }
    virtual void setApproximatePosition(const FloatPoint& p) { m_approximatePosition = p; }

    // For platforms that move underlying platform layers on a different thread for scrolling; just update the GraphicsLayer state.
    virtual void syncPosition(const FloatPoint& p) { m_position = p; }

    // Anchor point: (0, 0) is top left, (1, 1) is bottom right. The anchor point
    // affects the origin of the transforms.
    const FloatPoint3D& anchorPoint() const { return m_anchorPoint; }
    virtual void setAnchorPoint(const FloatPoint3D& p) { m_anchorPoint = p; }

    // The size of the layer.
    const FloatSize& size() const { return m_size; }
    WEBCORE_EXPORT virtual void setSize(const FloatSize&);

    // The boundOrigin affects the offset at which content is rendered, and sublayers are positioned.
    const FloatPoint& boundsOrigin() const { return m_boundsOrigin; }
    virtual void setBoundsOrigin(const FloatPoint& origin) { m_boundsOrigin = origin; }

    // For platforms that move underlying platform layers on a different thread for scrolling; just update the GraphicsLayer state.
    virtual void syncBoundsOrigin(const FloatPoint& origin) { m_boundsOrigin = origin; }

    WEBCORE_EXPORT const TransformationMatrix& transform() const;
    WEBCORE_EXPORT virtual void setTransform(const TransformationMatrix&);
    bool hasNonIdentityTransform() const { return m_transform && !m_transform->isIdentity(); }

    WEBCORE_EXPORT const TransformationMatrix& childrenTransform() const;
    WEBCORE_EXPORT virtual void setChildrenTransform(const TransformationMatrix&);
    bool hasNonIdentityChildrenTransform() const { return m_childrenTransform && !m_childrenTransform->isIdentity(); }

    bool preserves3D() const { return m_preserves3D; }
    WEBCORE_EXPORT virtual void setPreserves3D(bool);
    
    bool masksToBounds() const { return m_masksToBounds; }
    WEBCORE_EXPORT virtual void setMasksToBounds(bool);
    
    bool drawsContent() const { return m_drawsContent; }
    WEBCORE_EXPORT virtual void setDrawsContent(bool);

    bool contentsAreVisible() const { return m_contentsVisible; }
    virtual void setContentsVisible(bool b) { m_contentsVisible = b; }

    bool userInteractionEnabled() const { return m_userInteractionEnabled; }
    virtual void setUserInteractionEnabled(bool b) { m_userInteractionEnabled = b; }
    
    bool acceleratesDrawing() const { return m_acceleratesDrawing; }
    virtual void setAcceleratesDrawing(bool b) { m_acceleratesDrawing = b; }

    bool usesDisplayListDrawing() const { return m_usesDisplayListDrawing; }
    virtual void setUsesDisplayListDrawing(bool b) { m_usesDisplayListDrawing = b; }

#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    bool isIsSeparated() const { return m_isSeparated; }
    virtual void setIsSeparated(bool b) { m_isSeparated = b; }

#if HAVE(CORE_ANIMATION_SEPARATED_PORTALS)
    bool isSeparatedPortal() const { return m_isSeparatedPortal; }
    virtual void setIsSeparatedPortal(bool b) { m_isSeparatedPortal = b; }
#endif
#endif

#if HAVE(CORE_MATERIAL)
    AppleVisualEffect appleVisualEffect() const { return m_appleVisualEffect; }
    virtual void setAppleVisualEffect(AppleVisualEffect effect) { m_appleVisualEffect = effect; }
#endif

    bool needsBackdrop() const;

    // The color used to paint the layer background. Pass an invalid color to remove it.
    // Note that this covers the entire layer. Use setContentsToSolidColor() if the color should
    // only cover the contentsRect.
    const Color& backgroundColor() const { return m_backgroundColor; }
    WEBCORE_EXPORT virtual void setBackgroundColor(const Color&);

    // opaque means that we know the layer contents have no alpha
    bool contentsOpaque() const { return m_contentsOpaque; }
    virtual void setContentsOpaque(bool b) { m_contentsOpaque = b; }

    bool backfaceVisibility() const { return m_backfaceVisibility; }
    virtual void setBackfaceVisibility(bool b) { m_backfaceVisibility = b; }

    float opacity() const { return m_opacity; }
    WEBCORE_EXPORT virtual void setOpacity(float);

    const FilterOperations& filters() const { return m_filters; }
    // Returns true if filter can be rendered by the compositor.
    WEBCORE_EXPORT virtual bool setFilters(const FilterOperations&);

    const FilterOperations& backdropFilters() const { return m_backdropFilters; }
    virtual bool setBackdropFilters(const FilterOperations& filters) { m_backdropFilters = filters; return true; }

    virtual void setBackdropFiltersRect(const FloatRoundedRect& backdropFiltersRect) { m_backdropFiltersRect = backdropFiltersRect; }
    const FloatRoundedRect& backdropFiltersRect() const { return m_backdropFiltersRect; }

    BlendMode blendMode() const { return m_blendMode; }
    virtual void setBlendMode(BlendMode blendMode) { m_blendMode = blendMode; }

    // Some GraphicsLayers paint only the foreground or the background content
    OptionSet<GraphicsLayerPaintingPhase> paintingPhase() const { return m_paintingPhase; }
    void setPaintingPhase(OptionSet<GraphicsLayerPaintingPhase>);

    enum ShouldClipToLayer {
        DoNotClipToLayer,
        ClipToLayer
    };

    virtual void setNeedsDisplay() = 0;
    // mark the given rect (in layer coords) as needing dispay. Never goes deep.
    virtual void setNeedsDisplayInRect(const FloatRect&, ShouldClipToLayer = ClipToLayer) = 0;

    virtual void setContentsNeedsDisplay() { };

    virtual void markDamageRectsUnreliable() { };

    // The tile phase is relative to the GraphicsLayer bounds.
    virtual void setContentsTilePhase(const FloatSize& p) { m_contentsTilePhase = p; }
    FloatSize contentsTilePhase() const { return m_contentsTilePhase; }

    virtual void setContentsTileSize(const FloatSize& s) { m_contentsTileSize = s; }
    FloatSize contentsTileSize() const { return m_contentsTileSize; }
    bool hasContentsTiling() const { return !m_contentsTileSize.isEmpty(); }

    // Set that the position/size of the contents (image or video).
    FloatRect contentsRect() const { return m_contentsRect; }
    virtual void setContentsRect(const FloatRect& r) { m_contentsRect = r; }

    // Set a rounded rect that will be used to clip the layer contents.
    FloatRoundedRect contentsClippingRect() const { return m_contentsClippingRect; }
    virtual void setContentsClippingRect(const FloatRoundedRect& roundedRect) { m_contentsClippingRect = roundedRect; }
    
    // If true, contentsClippingRect is used to clip child GraphicsLayers.
    bool contentsRectClipsDescendants() const { return m_contentsRectClipsDescendants; }
    virtual void setContentsRectClipsDescendants(bool b) { m_contentsRectClipsDescendants = b; }

    // Used to lay out video contents within a video layer.
    MediaPlayerVideoGravity videoGravity() const;
    WEBCORE_EXPORT virtual void setVideoGravity(MediaPlayerVideoGravity);

    Path shapeLayerPath() const;
    WEBCORE_EXPORT virtual void setShapeLayerPath(const Path&);

    WindRule shapeLayerWindRule() const;
    WEBCORE_EXPORT virtual void setShapeLayerWindRule(WindRule);

    const EventRegion& eventRegion() const { return m_eventRegion; }
    WEBCORE_EXPORT virtual void setEventRegion(EventRegion&&);

    // Transitions are identified by a special animation name that cannot clash with a keyframe identifier.
    static String animationNameForTransition(AnimatedProperty);

    // Return true if the animation is handled by the compositing system.
    virtual bool addAnimation(const KeyframeValueList&, const FloatSize& /*boxSize*/, const Animation*, const String& /*animationName*/, double /*timeOffset*/)  { return false; }
    virtual void pauseAnimation(const String& /*animationName*/, double /*timeOffset*/) { }
    virtual void removeAnimation(const String& /*animationName*/, std::optional<AnimatedProperty>) { }
    virtual void transformRelatedPropertyDidChange() { }
    WEBCORE_EXPORT virtual void suspendAnimations(MonotonicTime);
    WEBCORE_EXPORT virtual void resumeAnimations();

    virtual Vector<std::pair<String, double>> acceleratedAnimationsForTesting(const Settings&) const { return { }; }

    // Layer contents
    virtual void setContentsToImage(Image*) { }
    virtual bool shouldDirectlyCompositeImage(Image*) const { return true; }

    // FIXME: Merge this with setContentsToImage once we can efficiently convert an
    // ImageBuffer to NativeImage without GPUP readback.
    virtual void setContentsToImageBuffer(ImageBuffer*) { }
    virtual bool shouldDirectlyCompositeImageBuffer(ImageBuffer*) const { return false; }
#if PLATFORM(IOS_FAMILY)
    virtual PlatformLayer* contentsLayerForMedia() const { return 0; }
#endif

    enum class ContentsLayerPurpose : uint8_t {
        None = 0,
        Image,
        Media,
        Canvas,
        BackgroundColor,
        Plugin,
        Model,
        HostedModel,
        Host,
    };

    // Pass an invalid color to remove the contents layer.
    virtual void setContentsToSolidColor(const Color&) { }
    virtual void setContentsToPlatformLayer(PlatformLayer*, ContentsLayerPurpose) { }
    virtual void setContentsToPlatformLayerHost(LayerHostingContextIdentifier) { }
#if ENABLE(MODEL_PROCESS)
    virtual void setContentsToModelContext(Ref<ModelContext>, ContentsLayerPurpose) { }
#endif
    virtual void setContentsToVideoElement(HTMLVideoElement&, ContentsLayerPurpose) { }
    virtual void setContentsDisplayDelegate(RefPtr<GraphicsLayerContentsDisplayDelegate>&&, ContentsLayerPurpose);
    WEBCORE_EXPORT virtual RefPtr<GraphicsLayerAsyncContentsDisplayDelegate> createAsyncContentsDisplayDelegate(GraphicsLayerAsyncContentsDisplayDelegate* existing);
#if ENABLE(MODEL_ELEMENT)
    enum class ModelInteraction : uint8_t { Enabled, Disabled };
    virtual void setContentsToModel(RefPtr<Model>&&, ModelInteraction) { }
    virtual std::optional<PlatformLayerIdentifier> contentsLayerIDForModel() const { return std::nullopt; }
#endif
    virtual bool usesContentsLayer() const { return false; }

    // Callback from the underlying graphics system to draw layer contents.
    WEBCORE_EXPORT void paintGraphicsLayerContents(GraphicsContext&, const FloatRect& clip, OptionSet<GraphicsLayerPaintBehavior> = { }) const;

    // For hosting this GraphicsLayer in a native layer hierarchy.
    virtual PlatformLayer* platformLayer() const { return nullptr; }

    enum class CompositingCoordinatesOrientation : uint8_t { TopDown, BottomUp };

    // Flippedness of the contents of this layer. Does not affect sublayer geometry.
    virtual void setContentsOrientation(CompositingCoordinatesOrientation orientation) { m_contentsOrientation = orientation; }
    CompositingCoordinatesOrientation contentsOrientation() const { return m_contentsOrientation; }

    enum class ScalingFilter { Linear, Nearest, Trilinear };
    virtual void setContentsMinificationFilter(ScalingFilter filter) { m_contentsMinificationFilter = filter; }
    ScalingFilter contentsMinificationFilter() const { return m_contentsMinificationFilter; }
    virtual void setContentsMagnificationFilter(ScalingFilter filter) { m_contentsMagnificationFilter = filter; }
    ScalingFilter contentsMagnificationFilter() const { return m_contentsMagnificationFilter; }

    void dumpLayer(WTF::TextStream&, OptionSet<LayerTreeAsTextOptions> = { }) const;

    virtual void setShowDebugBorder(bool show) { m_showDebugBorder = show; }
    bool isShowingDebugBorder() const { return m_showDebugBorder; }

    virtual void setShowRepaintCounter(bool show) { m_showRepaintCounter = show; }
    bool isShowingRepaintCounter() const { return m_showRepaintCounter; }

#if HAVE(HDR_SUPPORT)
    virtual void setHDRForImagesEnabled(bool b) { m_hdrForImagesEnabled = b; }
    bool hdrForImagesEnabled() const { return m_hdrForImagesEnabled; }
#endif

    // FIXME: this is really a paint count.
    int repaintCount() const { return m_repaintCount; }
    int incrementRepaintCount() { return ++m_repaintCount; }

    virtual void setDebugBackgroundColor(const Color&) { }
    virtual void setDebugBorder(const Color&, float /*borderWidth*/) { }

    enum class CustomAppearance : bool {
        None,
        ScrollingShadow
    };
    virtual void setCustomAppearance(CustomAppearance customAppearance) { m_customAppearance = customAppearance; }
    CustomAppearance customAppearance() const { return m_customAppearance; }

    // z-position is the z-equivalent of position(). It's only used for debugging purposes.
    virtual float zPosition() const { return m_zPosition; }
    WEBCORE_EXPORT virtual void setZPosition(float);

    virtual FloatSize pixelAlignmentOffset() const { return FloatSize(); }
    
    virtual void setAppliesPageScale(bool appliesScale = true) { m_appliesPageScale = appliesScale; }
    virtual bool appliesPageScale() const { return m_appliesPageScale; }

    void setAppliesDeviceScale(bool appliesScale = true) { m_appliesDeviceScale = appliesScale; }
    bool appliesDeviceScale() const { return m_appliesDeviceScale; }

    float pageScaleFactor() const { return client().pageScaleFactor(); }
    float deviceScaleFactor() const { return appliesDeviceScale() ? client().deviceScaleFactor() : 1.f; }
    
    // Whether this layer can throw away backing store to save memory. False for layers that can be revealed by async scrolling.
    virtual void setAllowsBackingStoreDetaching(bool) { }
    virtual bool allowsBackingStoreDetaching() const { return true; }

    virtual void setAllowsTiling(bool allowsTiling) { m_allowsTiling = allowsTiling; }
    virtual bool allowsTiling() const { return m_allowsTiling; }

    virtual void deviceOrPageScaleFactorChanged() { }
    virtual void setShouldUpdateRootRelativeScaleFactor(bool) { }

    WEBCORE_EXPORT void noteDeviceOrPageScaleFactorChangedIncludingDescendants();

    WEBCORE_EXPORT void setIsInWindow(bool);

    // Some compositing systems may do internal batching to synchronize compositing updates
    // with updates drawn into the window. These methods flush internal batched state on this layer
    // and descendant layers, and this layer only.
    virtual void flushCompositingState(const FloatRect& /* clipRect */) { }
    virtual void flushCompositingStateForThisLayerOnly() { }

    // If the exposed rect of this layer changes, returns true if this or descendant layers need a flush,
    // for example to allocate new tiles.
    virtual bool visibleRectChangeRequiresFlush(const FloatRect& /* clipRect */) const { return false; }

    static FloatRect adjustCoverageRectForMovement(const FloatRect& coverageRect, const FloatRect& previousVisibleRect, const FloatRect& currentVisibleRect);

    // Return a string with a human readable form of the layer tree, If debug is true
    // pointers for the layers and timing data will be included in the returned string.
    WEBCORE_EXPORT String layerTreeAsText(OptionSet<LayerTreeAsTextOptions> = { }, uint32_t baseIndent = 0) const;

    // For testing.
    virtual String displayListAsText(OptionSet<DisplayList::AsTextFlag>) const { return String(); }

    virtual String platformLayerTreeAsText(OptionSet<PlatformLayerTreeAsTextFlags>) const { return String(); }

    virtual void setIsTrackingDisplayListReplay(bool isTracking) { m_isTrackingDisplayListReplay = isTracking; }
    virtual bool isTrackingDisplayListReplay() const { return m_isTrackingDisplayListReplay; }
    virtual String replayDisplayListAsText(OptionSet<DisplayList::AsTextFlag>) const { return String(); }

    // Return an estimate of the backing store memory cost (in bytes). May be incorrect for tiled layers.
    WEBCORE_EXPORT virtual double backingStoreMemoryEstimate() const;

    virtual bool backingStoreAttached() const { return true; }
    virtual bool backingStoreAttachedForTesting() const { return backingStoreAttached(); }

    virtual TiledBacking* tiledBacking() const { return 0; }
    WEBCORE_EXPORT virtual void setTileCoverage(TileCoverage);

    void resetTrackedRepaints();
    WEBCORE_EXPORT void addRepaintRect(const FloatRect&);

    static bool supportsLayerType(Type);
    static bool supportsContentsTiling();

    WEBCORE_EXPORT void updateDebugIndicators();

    virtual bool isGraphicsLayerCA() const { return false; }
    virtual bool isGraphicsLayerCARemote() const { return false; }
    virtual bool isGraphicsLayerTextureMapper() const { return false; }
    virtual bool isGraphicsLayerCoordinated() const { return false; }

    bool shouldPaintUsingCompositeCopy() const { return m_shouldPaintUsingCompositeCopy; }
    void setShouldPaintUsingCompositeCopy(bool copy) { m_shouldPaintUsingCompositeCopy = copy; }

    bool renderingIsSuppressedIncludingDescendants() const { return m_renderingIsSuppressedIncludingDescendants; }
    void setRenderingIsSuppressedIncludingDescendants(bool suppressed) { m_renderingIsSuppressedIncludingDescendants = suppressed; }

    const std::optional<FloatRect>& animationExtent() const { return m_animationExtent; }
    void setAnimationExtent(std::optional<FloatRect> animationExtent) { m_animationExtent = animationExtent; }

    static void traverse(GraphicsLayer&, const Function<void(GraphicsLayer&)>&);

    virtual void markFrontBufferVolatileForTesting() { }

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    AcceleratedEffectStack* acceleratedEffectStack() const { return m_effectStack.get(); }
    WEBCORE_EXPORT virtual void setAcceleratedEffectsAndBaseValues(AcceleratedEffects&&, AcceleratedEffectValues&&);
#endif

    virtual void purgeFrontBufferForTesting() { }
    virtual void purgeBackBufferForTesting() { }

protected:
    WEBCORE_EXPORT explicit GraphicsLayer(Type, GraphicsLayerClient&);

    // Should be called from derived class destructors. Should call willBeDestroyed() on super.
    WEBCORE_EXPORT void willBeDestroyed();
    bool beingDestroyed() const { return m_beingDestroyed; }

    virtual void willModifyChildren() { }

    // This method is used by platform GraphicsLayer classes to clear the filters
    // when compositing is not done in hardware. It is not virtual, so the caller
    // needs to notifiy the change to the platform layer as needed.
    void clearFilters() { m_filters = { }; }
    void clearBackdropFilters() { m_backdropFilters = { }; }

    // Given a KeyframeValueList containing filterOperations, return true if the operations are valid.
    static int validateFilterOperations(const KeyframeValueList&);

    virtual bool shouldRepaintOnSizeChange() const { return drawsContent(); }

    void removeFromParentInternal();

    // The layer being replicated.
    GraphicsLayer* replicatedLayer() const { return m_replicatedLayer; }
    virtual void setReplicatedLayer(GraphicsLayer* layer) { m_replicatedLayer = layer; }

#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
#if HAVE(CORE_ANIMATION_SEPARATED_PORTALS)
    bool isDescendentOfSeparatedPortal() const { return m_isDescendentOfSeparatedPortal; }
    virtual void setIsDescendentOfSeparatedPortal(bool b) { m_isDescendentOfSeparatedPortal = b; }
#endif
#endif

    void dumpProperties(WTF::TextStream&, OptionSet<LayerTreeAsTextOptions>) const;
    virtual void dumpAdditionalProperties(WTF::TextStream&, OptionSet<LayerTreeAsTextOptions>) const { }

    WEBCORE_EXPORT virtual void getDebugBorderInfo(Color&, float& width) const;

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    RefPtr<AcceleratedEffectStack> m_effectStack;
#endif

    GraphicsLayerClient* m_client; // Always non-null.
    String m_name;
    
    // Offset from the owning renderer
    FloatSize m_offsetFromRenderer;
    
    // Scroll offset of the content layer inside its scrolling parent layer.
    ScrollOffset m_scrollOffset;

    // Position is relative to the parent GraphicsLayer
    FloatPoint m_position;

    // If set, overrides m_position. Only used for coverage computation.
    std::optional<FloatPoint> m_approximatePosition;

    FloatPoint3D m_anchorPoint { 0.5f, 0.5f, 0 };
    FloatSize m_size;
    FloatPoint m_boundsOrigin;

    std::unique_ptr<TransformationMatrix> m_transform;
    std::unique_ptr<TransformationMatrix> m_childrenTransform;

    Color m_backgroundColor;
    float m_opacity { 1 };
    float m_zPosition { 0 };
    
    FilterOperations m_filters;
    FilterOperations m_backdropFilters;
    
#if ENABLE(SCROLLING_THREAD)
    Markable<ScrollingNodeID> m_scrollingNodeID;
#endif

    BlendMode m_blendMode { BlendMode::Normal };

    const Type m_type;
    CustomAppearance m_customAppearance { CustomAppearance::None };

#if HAVE(CORE_MATERIAL)
    AppleVisualEffect m_appleVisualEffect { AppleVisualEffect::None };
#endif

    OptionSet<GraphicsLayerPaintingPhase> m_paintingPhase { GraphicsLayerPaintingPhase::Foreground, GraphicsLayerPaintingPhase::Background };
    CompositingCoordinatesOrientation m_contentsOrientation { CompositingCoordinatesOrientation::TopDown }; // affects orientation of layer contents

    bool m_beingDestroyed : 1;
    bool m_contentsOpaque : 1;
    bool m_preserves3D: 1;
    bool m_backfaceVisibility : 1;
    bool m_masksToBounds : 1;
    bool m_drawsContent : 1;
    bool m_contentsVisible : 1;
    bool m_contentsRectClipsDescendants : 1;
    bool m_acceleratesDrawing : 1;
    bool m_usesDisplayListDrawing : 1;
    bool m_allowsTiling : 1;
    bool m_appliesPageScale : 1; // Set for the layer which has the page scale applied to it.
    bool m_appliesDeviceScale : 1;
    bool m_showDebugBorder : 1;
    bool m_showRepaintCounter : 1;
    bool m_isMaskLayer : 1;
    bool m_isBackdropRoot : 1;
    bool m_isTrackingDisplayListReplay : 1;
    bool m_userInteractionEnabled : 1;
    bool m_canDetachBackingStore : 1;
    bool m_shouldPaintUsingCompositeCopy : 1;
    bool m_renderingIsSuppressedIncludingDescendants : 1 { false };
#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    bool m_isSeparated : 1;
#if HAVE(CORE_ANIMATION_SEPARATED_PORTALS)
    bool m_isSeparatedPortal : 1;
    bool m_isDescendentOfSeparatedPortal : 1;
#endif
#endif
#if HAVE(HDR_SUPPORT)
    bool m_hdrForImagesEnabled : 1;
#endif

    int m_repaintCount { 0 };

    Vector<Ref<GraphicsLayer>> m_children;
    GraphicsLayer* m_parent { nullptr };

    RefPtr<GraphicsLayer> m_maskLayer { nullptr }; // Reference to mask layer.

    RefPtr<GraphicsLayer> m_replicaLayer { nullptr }; // A layer that replicates this layer. We only allow one, for now.
                                   // The replica is not parented; this is the primary reference to it.
    GraphicsLayer* m_replicatedLayer { nullptr }; // For a replica layer, a reference to the original layer.
    FloatPoint m_replicatedLayerPosition; // For a replica layer, the position of the replica.

    FloatRect m_contentsRect;
    FloatRoundedRect m_contentsClippingRect;
    FloatSize m_contentsTilePhase;
    FloatSize m_contentsTileSize;
    ScalingFilter m_contentsMinificationFilter = ScalingFilter::Linear;
    ScalingFilter m_contentsMagnificationFilter = ScalingFilter::Linear;
    FloatRoundedRect m_backdropFiltersRect;
    std::optional<FloatRect> m_animationExtent;

    EventRegion m_eventRegion;
#if USE(CA)
    MediaPlayerVideoGravity m_videoGravity { MediaPlayerVideoGravity::ResizeAspect };
    WindRule m_shapeLayerWindRule { WindRule::NonZero };
    Path m_shapeLayerPath;
#endif

    LayerHostingContextID m_layerHostingContextID { 0 };
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const WebCore::GraphicsLayerPaintingPhase);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const Vector<PlatformLayerIdentifier>&);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const GraphicsLayer::CustomAppearance&);

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_GRAPHICSLAYER(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToValueTypeName) \
    static bool isType(const WebCore::GraphicsLayer& layer) { return layer.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

#if ENABLE(TREE_DEBUGGING)
// Outside the WebCore namespace for ease of invocation from the debugger.
void showGraphicsLayerTree(const WebCore::GraphicsLayer* layer);
#endif
