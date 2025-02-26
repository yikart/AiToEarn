/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "GraphicsLayer.h"
#include "GraphicsLayerClient.h"
#include "PageOverlay.h"
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashMap.h>

namespace WebCore {

class LocalFrame;
class Page;
class PlatformMouseEvent;

class PageOverlayController final : public GraphicsLayerClient {
    WTF_MAKE_TZONE_ALLOCATED(PageOverlayController);
    friend class MockPageOverlayClient;
public:
    PageOverlayController(Page&);
    virtual ~PageOverlayController();

    bool hasDocumentOverlays() const;
    bool hasViewOverlays() const;

    GraphicsLayer& layerWithDocumentOverlays();
    GraphicsLayer& layerWithViewOverlays();
    Ref<GraphicsLayer> protectedLayerWithViewOverlays();

    const Vector<RefPtr<PageOverlay>>& pageOverlays() const { return m_pageOverlays; }

    WEBCORE_EXPORT void installPageOverlay(PageOverlay&, PageOverlay::FadeMode);
    WEBCORE_EXPORT void uninstallPageOverlay(PageOverlay&, PageOverlay::FadeMode);

    void setPageOverlayNeedsDisplay(PageOverlay&, const IntRect&);
    void setPageOverlayOpacity(PageOverlay&, float);
    void clearPageOverlay(PageOverlay&);
    GraphicsLayer& layerForOverlay(PageOverlay&) const;

    void didChangeViewSize();
    void didChangeDocumentSize();
    void didChangeSettings();
    WEBCORE_EXPORT void didChangeDeviceScaleFactor();
    void didChangeViewExposedRect();
    void didScrollFrame(LocalFrame&);

    void didChangeOverlayFrame(PageOverlay&);
    void didChangeOverlayBackgroundColor(PageOverlay&);

    int overlayCount() const { return m_overlayGraphicsLayers.computeSize(); }

    bool handleMouseEvent(const PlatformMouseEvent&);

    WEBCORE_EXPORT bool copyAccessibilityAttributeStringValueForPoint(String attribute, FloatPoint, String& value);
    WEBCORE_EXPORT bool copyAccessibilityAttributeBoolValueForPoint(String attribute, FloatPoint, bool& value);
    WEBCORE_EXPORT Vector<String> copyAccessibilityAttributesNames(bool parameterizedNames);

private:
    void createRootLayersIfNeeded();

    WEBCORE_EXPORT GraphicsLayer* documentOverlayRootLayer() const;
    WEBCORE_EXPORT GraphicsLayer* viewOverlayRootLayer() const;

    void installedPageOverlaysChanged();
    void attachViewOverlayLayers();
    void detachViewOverlayLayers();

    void updateSettingsForLayer(GraphicsLayer&);
    void updateForceSynchronousScrollLayerPositionUpdates();

    // GraphicsLayerClient
    void notifyFlushRequired(const GraphicsLayer*) override;
    void paintContents(const GraphicsLayer*, GraphicsContext&, const FloatRect& clipRect, OptionSet<GraphicsLayerPaintBehavior>) override;
    float deviceScaleFactor() const override;
    bool shouldSkipLayerInDump(const GraphicsLayer*, OptionSet<LayerTreeAsTextOptions>) const override;
    bool shouldDumpPropertyForLayer(const GraphicsLayer*, ASCIILiteral propertyName, OptionSet<LayerTreeAsTextOptions>) const override;
    void tiledBackingUsageChanged(const GraphicsLayer*, bool) override;

    Ref<Page> protectedPage() const;

    WeakRef<Page> m_page;
    RefPtr<GraphicsLayer> m_documentOverlayRootLayer;
    RefPtr<GraphicsLayer> m_viewOverlayRootLayer;

    WeakHashMap<PageOverlay, Ref<GraphicsLayer>> m_overlayGraphicsLayers;
    Vector<RefPtr<PageOverlay>> m_pageOverlays;
    bool m_initialized { false };
};

} // namespace WebKit
