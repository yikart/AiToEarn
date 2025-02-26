/*
 * Copyright (C) 2010-2023 Apple Inc. All rights reserved.
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

#include "FloatRoundedRect.h"
#include "GraphicsLayer.h"
#include <wtf/RetainPtr.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/TypeCasts.h>
#include <wtf/Vector.h>

OBJC_CLASS AVPlayerLayer;

typedef struct CGContext *CGContextRef;

namespace WebCore {

class LayerPool;
class PlatformCALayer;
class PlatformCAAnimation;
class PlatformCALayerClient;

struct PlatformCALayerDelegatedContents;
struct PlatformCALayerDelegatedContentsFinishedEvent;
struct PlatformCALayerInProcessDelegatedContents;
struct PlatformCALayerInProcessDelegatedContentsFinishedEvent;

typedef Vector<RefPtr<PlatformCALayer>> PlatformCALayerList;

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
class AcceleratedEffect;
struct AcceleratedEffectValues;
#endif

enum class AppleVisualEffect : uint8_t;
enum class MediaPlayerVideoGravity : uint8_t;
enum class ContentsFormat : uint8_t;

enum class PlatformCALayerFilterType : uint8_t {
    Linear,
    Nearest,
    Trilinear
};

enum class PlatformCALayerLayerType : uint8_t {
        LayerTypeLayer,
        LayerTypeWebLayer,
        LayerTypeSimpleLayer,
        LayerTypeTransformLayer,
        LayerTypeTiledBackingLayer,
        LayerTypePageTiledBackingLayer,
        LayerTypeTiledBackingTileLayer,
        LayerTypeRootLayer,
        LayerTypeAVPlayerLayer,
        LayerTypeContentsProvidedLayer,
        LayerTypeBackdropLayer,
#if HAVE(CORE_MATERIAL)
        LayerTypeMaterialLayer,
#endif
        LayerTypeShapeLayer,
        LayerTypeScrollContainerLayer,
#if ENABLE(MODEL_ELEMENT)
        LayerTypeModelLayer,
#endif
        LayerTypeCustom,
        LayerTypeHost,
};

class WEBCORE_EXPORT PlatformCALayer : public ThreadSafeRefCounted<PlatformCALayer, WTF::DestructionThread::Main> {
    friend class PlatformCALayerCocoa;
public:
    static CFTimeInterval currentTimeToMediaTime(MonotonicTime);

    // LayerTypeRootLayer is used on some platforms. It has no backing store, so setNeedsDisplay
    // should not call CACFLayerSetNeedsDisplay, but rather just notify the renderer that it
    // has changed and should be re-rendered.
    using LayerType = PlatformCALayerLayerType;
    using FilterType = PlatformCALayerFilterType;

    virtual Ref<PlatformCALayer> clone(PlatformCALayerClient*) const = 0;

    virtual ~PlatformCALayer();

    PlatformLayerIdentifier layerID() const { return m_layerID; }
    virtual std::optional<WebCore::LayerHostingContextIdentifier> hostingContextIdentifier() const { return std::nullopt; }

    enum class Type : uint8_t {
        Cocoa,
        Remote,
        RemoteCustom,
        RemoteHost,
        RemoteModel
    };
    virtual Type type() const = 0;

    // This function passes the layer as a void* rather than a PlatformLayer because PlatformLayer
    // is defined differently for Obj C and C++. This allows callers from both languages.
    static RefPtr<PlatformCALayer> platformCALayerForLayer(void* platformLayer);

    virtual PlatformLayer* platformLayer() const { return m_layer.get(); }

    bool usesTiledBackingLayer() const { return layerType() == LayerType::LayerTypePageTiledBackingLayer || layerType() == LayerType::LayerTypeTiledBackingLayer; } // NOLINT(build/webcore_export)

    bool isPageTiledBackingLayer() const { return layerType() == LayerType::LayerTypePageTiledBackingLayer; } // NOLINT(build/webcore_export)

    PlatformCALayerClient* owner() const { return m_owner; }
    virtual void setOwner(PlatformCALayerClient* owner) { m_owner = owner; }

    virtual void animationStarted(const String& key, MonotonicTime beginTime) = 0;
    virtual void animationEnded(const String& key) = 0;

    virtual void setNeedsDisplay() = 0;
    virtual void setNeedsDisplayInRect(const FloatRect& dirtyRect) = 0;

    virtual bool needsDisplay() const = 0;

    virtual void copyContentsFromLayer(PlatformCALayer*) = 0;

    LayerType layerType() const { return m_layerType; }
    
    bool canHaveBackingStore() const;

    virtual PlatformCALayer* superlayer() const = 0;
    virtual void removeFromSuperlayer() = 0;
    virtual void setSublayers(const PlatformCALayerList&) = 0;
    virtual PlatformCALayerList sublayersForLogging() const = 0;
    virtual void removeAllSublayers() = 0;
    virtual void appendSublayer(PlatformCALayer&) = 0;
    virtual void insertSublayer(PlatformCALayer&, size_t index) = 0;
    virtual void replaceSublayer(PlatformCALayer& reference, PlatformCALayer&) = 0;

    // A list of sublayers that GraphicsLayerCA should maintain as the first sublayers.
    virtual const PlatformCALayerList* customSublayers() const = 0;

    // This method removes the sublayers from the source and reparents them to the current layer.
    // Any sublayers previously in the current layer are removed.
    virtual void adoptSublayers(PlatformCALayer& source) = 0;

    virtual void addAnimationForKey(const String& key, PlatformCAAnimation&) = 0;
    virtual void removeAnimationForKey(const String& key) = 0;
    virtual RefPtr<PlatformCAAnimation> animationForKey(const String& key) = 0;

#if ENABLE(THREADED_ANIMATION_RESOLUTION)
    virtual void clearAcceleratedEffectsAndBaseValues();
    virtual void setAcceleratedEffectsAndBaseValues(const AcceleratedEffects&, const AcceleratedEffectValues&);
#endif

    virtual void setMaskLayer(RefPtr<PlatformCALayer>&&);
    PlatformCALayer* maskLayer() const;

    virtual bool isOpaque() const = 0;
    virtual void setOpaque(bool) = 0;

    virtual FloatRect bounds() const = 0;
    virtual void setBounds(const FloatRect&) = 0;

    virtual FloatPoint3D position() const = 0;
    virtual void setPosition(const FloatPoint3D&) = 0;
    void setPosition(const FloatPoint& pos) { setPosition(FloatPoint3D(pos.x(), pos.y(), 0)); }

    virtual FloatPoint3D anchorPoint() const = 0;
    virtual void setAnchorPoint(const FloatPoint3D&) = 0;

    virtual TransformationMatrix transform() const = 0;
    virtual void setTransform(const TransformationMatrix&) = 0;

    virtual TransformationMatrix sublayerTransform() const = 0;
    virtual void setSublayerTransform(const TransformationMatrix&) = 0;

    virtual void setIsBackdropRoot(bool) = 0;
    virtual bool backdropRootIsOpaque() const = 0;
    virtual void setBackdropRootIsOpaque(bool) = 0;

    virtual bool isHidden() const = 0;
    virtual void setHidden(bool) = 0;

    // Used to disable user interaction for some platforms.
    virtual bool contentsHidden() const = 0;
    virtual void setContentsHidden(bool) = 0;
    virtual bool userInteractionEnabled() const = 0;
    virtual void setUserInteractionEnabled(bool) = 0;

    virtual bool geometryFlipped() const = 0;
    virtual void setGeometryFlipped(bool) = 0;

    virtual bool isDoubleSided() const = 0;
    virtual void setDoubleSided(bool) = 0;

    virtual bool masksToBounds() const = 0;
    virtual void setMasksToBounds(bool) = 0;

    virtual bool acceleratesDrawing() const = 0;
    virtual void setAcceleratesDrawing(bool) = 0;

    virtual ContentsFormat contentsFormat() const = 0;
    virtual void setContentsFormat(ContentsFormat) = 0;

    virtual bool hasContents() const = 0;
    virtual CFTypeRef contents() const = 0;
    virtual void setContents(CFTypeRef) = 0;
    virtual void clearContents();

    // The client will override one of setDelegatedContents().

    virtual void setDelegatedContents(const PlatformCALayerDelegatedContents&);
    virtual void setDelegatedContents(const PlatformCALayerInProcessDelegatedContents&);

    virtual void setContentsRect(const FloatRect&) = 0;

    virtual void setBackingStoreAttached(bool) = 0;
    virtual bool backingStoreAttached() const = 0;

#if ENABLE(INTERACTION_REGIONS_IN_EVENT_REGION) || HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    virtual void setVisibleRect(const FloatRect&) = 0;
#endif

    virtual void setMinificationFilter(FilterType) = 0;
    virtual void setMagnificationFilter(FilterType) = 0;

    virtual Color backgroundColor() const = 0;
    virtual void setBackgroundColor(const Color&) = 0;

    virtual void setBorderWidth(float) = 0;

    virtual void setBorderColor(const Color&) = 0;

    virtual float opacity() const = 0;
    virtual void setOpacity(float) = 0;
    virtual void setFilters(const FilterOperations&) = 0;
    virtual void copyFiltersFrom(const PlatformCALayer&) = 0;

    virtual void setBlendMode(BlendMode) = 0;

    virtual void setName(const String&) = 0;

    virtual void setSpeed(float) = 0;

    virtual void setTimeOffset(CFTimeInterval) = 0;

    virtual float contentsScale() const = 0;
    virtual void setContentsScale(float) = 0;

    virtual float cornerRadius() const = 0;
    virtual void setCornerRadius(float) = 0;

    virtual void setAntialiasesEdges(bool) = 0;

    virtual MediaPlayerVideoGravity videoGravity() const = 0;
    virtual void setVideoGravity(MediaPlayerVideoGravity) = 0;

    // Only used by LayerTypeShapeLayer.
    virtual FloatRoundedRect shapeRoundedRect() const = 0;
    virtual void setShapeRoundedRect(const FloatRoundedRect&) = 0;

    // Only used by LayerTypeShapeLayer.
    virtual Path shapePath() const = 0;
    virtual void setShapePath(const Path&) = 0;

    virtual WindRule shapeWindRule() const = 0;
    virtual void setShapeWindRule(WindRule) = 0;

    virtual const EventRegion* eventRegion() const { return nullptr; }
    virtual void setEventRegion(const EventRegion&) { }
    
#if ENABLE(SCROLLING_THREAD)
    virtual std::optional<ScrollingNodeID> scrollingNodeID() const { return std::nullopt; }
    virtual void setScrollingNodeID(std::optional<ScrollingNodeID>) { }
#endif

    virtual GraphicsLayer::CustomAppearance customAppearance() const = 0;
    virtual void updateCustomAppearance(GraphicsLayer::CustomAppearance) = 0;

#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    virtual bool isSeparated() const = 0;
    virtual void setIsSeparated(bool) = 0;
    
#if HAVE(CORE_ANIMATION_SEPARATED_PORTALS)
    virtual bool isSeparatedPortal() const = 0;
    virtual void setIsSeparatedPortal(bool) = 0;

    virtual bool isDescendentOfSeparatedPortal() const = 0;
    virtual void setIsDescendentOfSeparatedPortal(bool) = 0;
#endif
#endif

#if HAVE(CORE_MATERIAL)
    virtual AppleVisualEffect appleVisualEffect() const = 0;
    virtual void setAppleVisualEffect(AppleVisualEffect) = 0;
#endif

    virtual TiledBacking* tiledBacking() = 0;

    void drawTextAtPoint(CGContextRef, CGFloat x, CGFloat y, CGSize scale, CGFloat fontSize, std::span<const char8_t> text, CGFloat strokeWidthAsPercentageOfFontSize = 0, Color strokeColor = Color()) const;

    static void flipContext(CGContextRef, CGFloat height);
    
    virtual unsigned backingStoreBytesPerPixel() const { return 4; }

#if PLATFORM(IOS_FAMILY)
    bool isWebLayer();
    void setBoundsOnMainThread(CGRect);
    void setPositionOnMainThread(CGPoint);
    void setAnchorPointOnMainThread(FloatPoint3D);
#endif

    virtual Ref<PlatformCALayer> createCompatibleLayer(LayerType, PlatformCALayerClient*) const = 0;
    Ref<PlatformCALayer> createCompatibleLayerOrTakeFromPool(LayerType, PlatformCALayerClient*, IntSize);

    virtual void enumerateRectsBeingDrawn(GraphicsContext&, void (^block)(FloatRect)) = 0;

    static const unsigned webLayerMaxRectsToPaint = 5;
    constexpr static const float webLayerWastedSpaceThreshold = 0.75f;

    typedef Vector<FloatRect, webLayerMaxRectsToPaint> RepaintRectList;
        
    // Functions allows us to share implementation across WebTiledLayer and WebLayer
    static RepaintRectList collectRectsToPaint(GraphicsContext&, PlatformCALayer*);
    static void drawLayerContents(GraphicsContext&, PlatformCALayer*, RepaintRectList&, OptionSet<GraphicsLayerPaintBehavior>);
    static void drawRepaintIndicator(GraphicsContext&, PlatformCALayer*, int repaintCount, Color customBackgroundColor = { });
    static CGRect frameForLayer(const PlatformLayer*);

    virtual void markFrontBufferVolatileForTesting() { }
    void moveToLayerPool();

    virtual void dumpAdditionalProperties(TextStream&, OptionSet<PlatformLayerTreeAsTextFlags>);

    virtual void purgeFrontBufferForTesting() { }
    virtual void purgeBackBufferForTesting() { }

    bool needsPlatformContext() const;

protected:
    PlatformCALayer(LayerType, PlatformCALayerClient* owner);

    virtual LayerPool* layerPool();

    const LayerType m_layerType;
    const PlatformLayerIdentifier m_layerID;
    RetainPtr<PlatformLayer> m_layer;
    RefPtr<PlatformCALayer> m_maskLayer;
    PlatformCALayerClient* m_owner;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, PlatformCALayer::LayerType);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, PlatformCALayer::FilterType);

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_PLATFORM_CALAYER(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToValueTypeName) \
    static bool isType(const WebCore::PlatformCALayer& layer) { return layer.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
