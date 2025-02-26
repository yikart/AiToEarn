/*
 * Copyright (C) 2010 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "PlatformLayer.h"
#include "ScrollTypes.h"
#include "Widget.h"

#if PLATFORM(COCOA)
typedef struct objc_object* id;
#endif

namespace WebCore {

class Element;
class GraphicsLayer;
class ScrollableArea;
class Scrollbar;
class VoidCallback;

enum class PluginLayerHostingStrategy : uint8_t {
    None,
    PlatformLayer,
    GraphicsLayer
};

// FIXME: Move these virtual functions all into the Widget class and get rid of this class.
class PluginViewBase : public Widget {
public:
    virtual PluginLayerHostingStrategy layerHostingStrategy() const { return PluginLayerHostingStrategy::None; }
    virtual PlatformLayer* platformLayer() const { return nullptr; }
    virtual GraphicsLayer* graphicsLayer() const { return nullptr; }

    virtual void layerHostingStrategyDidChange() { }

    virtual bool scroll(ScrollDirection, ScrollGranularity) { return false; }
    virtual ScrollPosition scrollPositionForTesting() const { return { }; }

    virtual Scrollbar* horizontalScrollbar() { return nullptr; }
    virtual Scrollbar* verticalScrollbar() { return nullptr; }

    virtual bool wantsWheelEvents() { return false; }
    virtual bool shouldAllowNavigationFromDrags() const { return false; }
    virtual void willDetachRenderer() { }

    virtual ScrollableArea* scrollableArea() const { return nullptr; }
    virtual bool usesAsyncScrolling() const { return false; }
    virtual std::optional<ScrollingNodeID> scrollingNodeID() const { return std::nullopt; }
    virtual void willAttachScrollingNode() { }
    virtual void didAttachScrollingNode() { }

#if PLATFORM(COCOA)
    virtual id accessibilityAssociatedPluginParentForElement(Element*) const { return nullptr; }
#endif
    virtual void setPDFDisplayModeForTesting(const String&) { }
    virtual bool sendEditingCommandToPDFForTesting(const String&, const String&) { return false; }
    virtual Vector<FloatRect> pdfAnnotationRectsForTesting() const { return { }; }
    virtual void unlockPDFDocumentForTesting(const String&) { }
    virtual void setPDFTextAnnotationValueForTesting(unsigned /* pageIndex */, unsigned /* annotationIndex */, const String& /* value */) { };

    virtual void releaseMemory() { }

protected:
    explicit PluginViewBase(PlatformWidget widget = 0) : Widget(widget) { }

private:
    bool isPluginViewBase() const final { return true; }

    friend class Internals;
    virtual void registerPDFTestCallback(RefPtr<VoidCallback>&&) { };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_WIDGET(PluginViewBase, isPluginViewBase())
