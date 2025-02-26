/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2019 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "Color.h"
#include "FloatLine.h"
#include "FloatQuad.h"
#include "FloatRect.h"
#include "InspectorOverlayLabel.h"
#include "Path.h"
#include "Timer.h"
#include <wtf/CheckedRef.h>
#include <wtf/Deque.h>
#include <wtf/MonotonicTime.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashMap.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace Inspector {
using ErrorString = String;

template <typename T>
using ErrorStringOr = Expected<T, ErrorString>;
}

namespace WebCore {

class WeakPtrImplWithEventTargetData;
class FontCascade;
class FloatPoint;
class GraphicsContext;
class InspectorClient;
class InspectorController;
class Node;
class NodeList;
class Page;

struct InspectorOverlayHighlight {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    enum class Type : uint8_t {
        None, // Provides only non-quad information, including grid overlays.
        Node, // Provides 4 quads: margin, border, padding, content.
        NodeList, // Provides a list of nodes.
        Rects, // Provides a list of quads.
    };

    struct Config {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;
        Color content;
        Color contentOutline;
        Color padding;
        Color border;
        Color margin;
        bool showInfo;
        bool usePageCoordinates;
    };

    struct GridHighlightOverlay {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        struct Area {
            WTF_MAKE_STRUCT_FAST_ALLOCATED;
            String name;
            FloatQuad quad;
        };

        Color color;
        Vector<FloatLine> gridLines;
        Vector<FloatQuad> gaps;
        Vector<Area> areas;
        Vector<InspectorOverlayLabel> labels;
    };

    struct FlexHighlightOverlay {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        Color color;
        FloatQuad containerBounds;
        Vector<FloatQuad> itemBounds;
        Vector<FloatQuad> mainAxisGaps;
        Vector<FloatQuad> mainAxisSpaceBetweenItemsAndGaps;
        Vector<FloatQuad> spaceBetweenItemsAndCrossAxisSpace;
        Vector<FloatQuad> crossAxisGaps;
        Vector<InspectorOverlayLabel> labels;
    };

    void setDataFromConfig(const Config& config)
    {
        contentColor = config.content;
        contentOutlineColor = config.contentOutline;
        paddingColor = config.padding;
        borderColor = config.border;
        marginColor = config.margin;
        usePageCoordinates = config.usePageCoordinates;
    }

    Color contentColor;
    Color contentOutlineColor;
    Color paddingColor;
    Color borderColor;
    Color marginColor;

    Type type { Type::Node };
    Vector<FloatQuad> quads;
    Vector<GridHighlightOverlay> gridHighlightOverlays;
    Vector<FlexHighlightOverlay> flexHighlightOverlays;
    bool usePageCoordinates { true };

    using Bounds = FloatRect;
};

class InspectorOverlay : public CanMakeWeakPtr<InspectorOverlay> {
    WTF_MAKE_TZONE_ALLOCATED(InspectorOverlay);
public:
    InspectorOverlay(InspectorController&, InspectorClient*);
    ~InspectorOverlay();

    void ref() const;
    void deref() const;

    using Highlight = InspectorOverlayHighlight;

    struct Grid {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        struct Config {
            WTF_MAKE_STRUCT_FAST_ALLOCATED;

            Color gridColor;
            bool showLineNames;
            bool showLineNumbers;
            bool showExtendedGridLines;
            bool showTrackSizes;
            bool showAreaNames;
        };

        WeakPtr<Node, WeakPtrImplWithEventTargetData> gridNode;
        Config config;
    };

    struct Flex {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        struct Config {
            WTF_MAKE_STRUCT_FAST_ALLOCATED;

            Color flexColor;
            bool showOrderNumbers;
        };

        WeakPtr<Node, WeakPtrImplWithEventTargetData> flexNode;
        Config config;
    };

    enum class CoordinateSystem {
        View, // Adjusts for the main frame's scroll offset.
        Document, // Does not adjust for the main frame's scroll offset.
    };

    void update();
    void paint(GraphicsContext&);
    void getHighlight(Highlight&, CoordinateSystem);
    bool shouldShowOverlay() const;

    void hideHighlight();
    void highlightNodeList(RefPtr<NodeList>&&, const Highlight::Config&, const std::optional<Grid::Config>& = std::nullopt, const std::optional<Flex::Config>& = std::nullopt, bool showRulers = false);
    void highlightNode(Node*, const Highlight::Config&, const std::optional<Grid::Config>& = std::nullopt, const std::optional<Flex::Config>& = std::nullopt, bool showRulers = false);
    void highlightQuad(std::unique_ptr<FloatQuad>, const Highlight::Config&);

    void setShowPaintRects(bool);
    void showPaintRect(const FloatRect&);
    unsigned paintRectCount() const { return m_paintRects.size(); }

    void setShowRulers(bool);

    Node* highlightedNode() const;
    unsigned gridOverlayCount() const { return m_activeGridOverlays.size(); }
    unsigned flexOverlayCount() const { return m_activeFlexOverlays.size(); }

    void didSetSearchingForNode(bool enabled);

    void setIndicating(bool indicating);

    // Multiple grid and flex overlays can be active at the same time. These methods
    // will fail if the node is not a grid or if the node has been GC'd.

    Inspector::ErrorStringOr<void> setGridOverlayForNode(Node&, const InspectorOverlay::Grid::Config&);
    Inspector::ErrorStringOr<void> clearGridOverlayForNode(Node&);
    void clearAllGridOverlays();

    Inspector::ErrorStringOr<void> setFlexOverlayForNode(Node&, const InspectorOverlay::Flex::Config&);
    Inspector::ErrorStringOr<void> clearFlexOverlayForNode(Node&);
    void clearAllFlexOverlays();

    WEBCORE_EXPORT static void drawGridOverlay(GraphicsContext&, const InspectorOverlayHighlight::GridHighlightOverlay&);
    WEBCORE_EXPORT static void drawFlexOverlay(GraphicsContext&, const InspectorOverlayHighlight::FlexHighlightOverlay&);

private:
    using TimeRectPair = std::pair<MonotonicTime, FloatRect>;

    struct RulerExclusion {
        Highlight::Bounds bounds;
        Path titlePath;
    };

    RulerExclusion drawNodeHighlight(GraphicsContext&, Node&);
    RulerExclusion drawQuadHighlight(GraphicsContext&, const FloatQuad&);
    void drawPaintRects(GraphicsContext&, const Deque<TimeRectPair>&);
    void drawBounds(GraphicsContext&, const Highlight::Bounds&);
    void drawRulers(GraphicsContext&, const RulerExclusion&);

    Path drawElementTitle(GraphicsContext&, Node&, const Highlight::Bounds&);
    
    std::optional<InspectorOverlayHighlight::GridHighlightOverlay> buildGridOverlay(const InspectorOverlay::Grid&, bool offsetBoundsByScroll = false);
    std::optional<InspectorOverlayHighlight::FlexHighlightOverlay> buildFlexOverlay(const InspectorOverlay::Flex&);

    void updatePaintRectsTimerFired();

    bool removeGridOverlayForNode(Node&);
    bool removeFlexOverlayForNode(Node&);

    Page& page() const;

    const WeakRef<InspectorController> m_controller;
    InspectorClient* m_client;

    RefPtr<Node> m_highlightNode;
    RefPtr<NodeList> m_highlightNodeList;
    Highlight::Config m_nodeHighlightConfig;
    std::optional<Grid::Config> m_nodeGridOverlayConfig;
    std::optional<Flex::Config> m_nodeFlexOverlayConfig;

    std::unique_ptr<FloatQuad> m_highlightQuad;
    Highlight::Config m_quadHighlightConfig;

    Deque<TimeRectPair> m_paintRects;
    Timer m_paintRectUpdateTimer;

    Vector<InspectorOverlay::Grid> m_activeGridOverlays;
    Vector<InspectorOverlay::Flex> m_activeFlexOverlays;

    bool m_indicating { false };
    bool m_showPaintRects { false };
    bool m_showRulers { false };
    bool m_showRulersForNodeHighlight { false };
};

} // namespace WebCore
