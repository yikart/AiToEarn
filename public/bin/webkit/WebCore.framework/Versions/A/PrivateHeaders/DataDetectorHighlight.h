/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#if ENABLE(DATA_DETECTION) && PLATFORM(MAC)

#import "GraphicsLayer.h"
#import "GraphicsLayerClient.h"
#import "SimpleRange.h"
#import "Timer.h"
#import <wtf/RefCountedAndCanMakeWeakPtr.h>
#import <wtf/RefPtr.h>
#import <wtf/RetainPtr.h>
#import <wtf/WeakPtr.h>

using DDHighlightRef = struct __DDHighlight*;

namespace WebCore {
class DataDetectorHighlightClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::DataDetectorHighlightClient> : std::true_type { };
}

namespace WebCore {

class DataDetectorHighlight;
class FloatRect;
class GraphicsContext;
class GraphicsLayer;

enum class RenderingUpdateStep : uint32_t;

class DataDetectorHighlightClient : public CanMakeWeakPtr<DataDetectorHighlightClient> {
public:
    WEBCORE_EXPORT virtual ~DataDetectorHighlightClient() = default;
    WEBCORE_EXPORT virtual DataDetectorHighlight* activeHighlight() const = 0;
    WEBCORE_EXPORT virtual void scheduleRenderingUpdate(OptionSet<RenderingUpdateStep>) = 0;
    WEBCORE_EXPORT virtual float deviceScaleFactor() const = 0;
    WEBCORE_EXPORT virtual RefPtr<GraphicsLayer> createGraphicsLayer(GraphicsLayerClient&) = 0;
};

class DataDetectorHighlight : public RefCountedAndCanMakeWeakPtr<DataDetectorHighlight>, private GraphicsLayerClient {
    WTF_MAKE_NONCOPYABLE(DataDetectorHighlight);
public:
    static Ref<DataDetectorHighlight> createForSelection(DataDetectorHighlightClient&, RetainPtr<DDHighlightRef>&&, SimpleRange&&);
    static Ref<DataDetectorHighlight> createForTelephoneNumber(DataDetectorHighlightClient&, RetainPtr<DDHighlightRef>&&, SimpleRange&&);
    static Ref<DataDetectorHighlight> createForImageOverlay(DataDetectorHighlightClient&, RetainPtr<DDHighlightRef>&&, SimpleRange&&);
#if ENABLE(UNIFIED_PDF_DATA_DETECTION)
    WEBCORE_EXPORT static Ref<DataDetectorHighlight> createForPDFSelection(DataDetectorHighlightClient&, RetainPtr<DDHighlightRef>&&);
#endif

    ~DataDetectorHighlight();

    void invalidate();

    DDHighlightRef highlight() const { return m_highlight.get(); }
    const SimpleRange& range() const;
    GraphicsLayer& layer() const { return m_graphicsLayer.get(); }
    Ref<GraphicsLayer> protectedLayer() const { return layer(); }

    enum class Type : uint8_t {
        None = 0,
        TelephoneNumber = 1 << 0,
        Selection = 1 << 1,
        ImageOverlay = 1 << 2,
#if ENABLE(UNIFIED_PDF_DATA_DETECTION)
        PDFSelection = 1 << 3,
#endif
    };

    Type type() const { return m_type; }
    bool isRangeSupportingType() const;

    WEBCORE_EXPORT void fadeIn();
    WEBCORE_EXPORT void fadeOut();
    WEBCORE_EXPORT void dismissImmediately();

    WEBCORE_EXPORT void setHighlight(DDHighlightRef);

private:
    DataDetectorHighlight(DataDetectorHighlightClient&, Type, RetainPtr<DDHighlightRef>&&, std::optional<SimpleRange>&&);

    // GraphicsLayerClient
    void notifyFlushRequired(const GraphicsLayer*) override;
    void paintContents(const GraphicsLayer*, GraphicsContext&, const FloatRect& inClip, OptionSet<GraphicsLayerPaintBehavior>) override;
    float deviceScaleFactor() const override;

    void fadeAnimationTimerFired();
    void startFadeAnimation();
    void didFinishFadeOutAnimation();

    WeakPtr<DataDetectorHighlightClient> m_client;
    RetainPtr<DDHighlightRef> m_highlight;
    std::optional<SimpleRange> m_range;
    Ref<GraphicsLayer> m_graphicsLayer;
    Type m_type { Type::None };

    Timer m_fadeAnimationTimer;
    WallTime m_fadeAnimationStartTime;

    enum class FadeAnimationState : uint8_t { NotAnimating, FadingIn, FadingOut };
    FadeAnimationState m_fadeAnimationState { FadeAnimationState::NotAnimating };
};

bool areEquivalent(const DataDetectorHighlight*, const DataDetectorHighlight*);

} // namespace WebCore

#endif // ENABLE(DATA_DETECTION) && PLATFORM(MAC)
