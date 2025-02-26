/*
 * Copyright (C) 2006-2023 Apple Inc.
 * Copyright (C) 2014 Google Inc.
 * Copyright (C) 2012 Nokia Corporation and/or its subsidiary(-ies)
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
*/

#pragma once

#include "HitTestLocation.h"
#include "HitTestRequest.h"
#include <wtf/Forward.h>
#include <wtf/ListHashSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class Element;
class HTMLImageElement;
class HTMLMediaElement;
class Image;
class LocalFrame;
class Node;
class Scrollbar;

enum class HitTestProgress { Stop, Continue };

class HitTestResult {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(HitTestResult, WEBCORE_EXPORT);
public:
    using NodeSet = ListHashSet<Ref<Node>>;

    WEBCORE_EXPORT HitTestResult();
    WEBCORE_EXPORT explicit HitTestResult(const LayoutPoint&);

    WEBCORE_EXPORT explicit HitTestResult(const LayoutRect&);
    WEBCORE_EXPORT explicit HitTestResult(const HitTestLocation&);
    WEBCORE_EXPORT HitTestResult(const HitTestResult&);
    WEBCORE_EXPORT ~HitTestResult();

    WEBCORE_EXPORT HitTestResult& operator=(const HitTestResult&);

    WEBCORE_EXPORT void setInnerNode(Node*);
    Node* innerNode() const { return m_innerNode.get(); }

    void setInnerNonSharedNode(Node*);
    Node* innerNonSharedNode() const { return m_innerNonSharedNode.get(); }

    WEBCORE_EXPORT Element* innerNonSharedElement() const;

    void setURLElement(Element*);
    Element* URLElement() const { return m_innerURLElement.get(); }

    void setScrollbar(RefPtr<Scrollbar>&&);
    Scrollbar* scrollbar() const { return m_scrollbar.get(); }

    bool isOverWidget() const { return m_isOverWidget; }
    void setIsOverWidget(bool isOverWidget) { m_isOverWidget = isOverWidget; }

    WEBCORE_EXPORT String linkSuggestedFilename() const;

    // Forwarded from HitTestLocation
    bool isRectBasedTest() const { return m_hitTestLocation.isRectBasedTest(); }

    // The hit-tested point in the coordinates of the main frame.
    const LayoutPoint& pointInMainFrame() const { return m_hitTestLocation.point(); }
    IntPoint roundedPointInMainFrame() const { return roundedIntPoint(pointInMainFrame()); }

    // The hit-tested point in the coordinates of the innerNode frame, the frame containing innerNode.
    const LayoutPoint& pointInInnerNodeFrame() const { return m_pointInInnerNodeFrame; }
    IntPoint roundedPointInInnerNodeFrame() const { return roundedIntPoint(pointInInnerNodeFrame()); }
    WEBCORE_EXPORT LocalFrame* innerNodeFrame() const;

    // The hit-tested point in the coordinates of the inner node.
    const LayoutPoint& localPoint() const { return m_localPoint; }
    void setLocalPoint(const LayoutPoint& p) { m_localPoint = p; }

    WEBCORE_EXPORT void setToNonUserAgentShadowAncestor();

    const HitTestLocation& hitTestLocation() const { return m_hitTestLocation; }

    WEBCORE_EXPORT LocalFrame* frame() const;
    WEBCORE_EXPORT LocalFrame* targetFrame() const;
    WEBCORE_EXPORT bool isSelected() const;
    WEBCORE_EXPORT String selectedText() const;
    WEBCORE_EXPORT String spellingToolTip(TextDirection&) const;
    String replacedString() const;
    WEBCORE_EXPORT String title(TextDirection&) const;
    WEBCORE_EXPORT String innerTextIfTruncated(TextDirection&) const;
    WEBCORE_EXPORT String altDisplayString() const;
    WEBCORE_EXPORT String titleDisplayString() const;
    WEBCORE_EXPORT Image* image() const;
    WEBCORE_EXPORT IntRect imageRect() const;
    WEBCORE_EXPORT bool hasEntireImage() const;
    WEBCORE_EXPORT URL absoluteImageURL() const;
    WEBCORE_EXPORT URL absolutePDFURL() const;
    WEBCORE_EXPORT URL absoluteMediaURL() const;
    WEBCORE_EXPORT URL absoluteLinkURL() const;
    WEBCORE_EXPORT bool hasLocalDataForLinkURL() const;
    WEBCORE_EXPORT String textContent() const;
    bool isOverLink() const;
    WEBCORE_EXPORT bool isContentEditable() const;
    void toggleMediaControlsDisplay() const;
    void toggleMediaLoopPlayback() const;
    void toggleShowMediaStats() const;
    WEBCORE_EXPORT bool mediaIsInFullscreen() const;
    bool mediaIsInVideoViewer() const;
    void toggleVideoViewer() const;
    void toggleMediaFullscreenState() const;
    void enterFullscreenForVideo() const;
    bool mediaControlsEnabled() const;
    bool mediaLoopEnabled() const;
    bool mediaStatsShowing() const;
    bool mediaPlaying() const;
    bool mediaSupportsFullscreen() const;
    void toggleMediaPlayState() const;
    WEBCORE_EXPORT bool hasMediaElement() const;
    WEBCORE_EXPORT bool mediaHasAudio() const;
    WEBCORE_EXPORT bool mediaIsVideo() const;
    bool mediaMuted() const;
    void toggleMediaMuteState() const;
    bool mediaSupportsEnhancedFullscreen() const;
    bool mediaIsInEnhancedFullscreen() const;
    void toggleEnhancedFullscreenForVideo() const;

#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    void pauseAnimation() const;
    void playAnimation() const;
    bool isAnimating() const;
#endif

    WEBCORE_EXPORT bool isDownloadableMedia() const;
    WEBCORE_EXPORT bool isOverTextInsideFormControlElement() const;

    HitTestProgress addNodeToListBasedTestResult(Node*, const HitTestRequest&, const HitTestLocation& pointInContainer, const LayoutRect& = LayoutRect());
    HitTestProgress addNodeToListBasedTestResult(Node*, const HitTestRequest&, const HitTestLocation& pointInContainer, const FloatRect&);
    void append(const HitTestResult&, const HitTestRequest&);

    // If m_listBasedTestResult is 0 then set it to a new NodeSet. Return *m_listBasedTestResult. Lazy allocation makes
    // sense because the NodeSet is seldom necessary, and it's somewhat expensive to allocate and initialize. This method does
    // the same thing as mutableListBasedTestResult(), but here the return value is const.
    WEBCORE_EXPORT const NodeSet& listBasedTestResult() const;

    Vector<String> dictationAlternatives() const;

    Node* targetNode() const { return innerNode(); }
    WEBCORE_EXPORT RefPtr<Node> protectedTargetNode() const;
    WEBCORE_EXPORT Element* targetElement() const;
    RefPtr<Element> protectedTargetElement() const;

private:
    NodeSet& mutableListBasedTestResult(); // See above.

    template<typename RectType> HitTestProgress addNodeToListBasedTestResultCommon(Node*, const HitTestRequest&, const HitTestLocation&, const RectType&);

    RefPtr<Node> nodeForImageData() const;

#if ENABLE(ACCESSIBILITY_ANIMATION_CONTROL)
    void setAllowsAnimation(bool /* allowAnimation */) const;
    HTMLImageElement* imageElement() const;
#endif

#if ENABLE(VIDEO)
    HTMLMediaElement* mediaElement() const;
#endif
    HitTestLocation m_hitTestLocation;

    RefPtr<Node> m_innerNode;
    RefPtr<Node> m_innerNonSharedNode;
    LayoutPoint m_pointInInnerNodeFrame; // The hit-tested point in innerNode frame coordinates.
    LayoutPoint m_localPoint; // A point in the local coordinate space of m_innerNonSharedNode's renderer. Allows us to efficiently
                              // determine where inside the renderer we hit on subsequent operations.
    RefPtr<Element> m_innerURLElement;
    RefPtr<Scrollbar> m_scrollbar;
    bool m_isOverWidget { false }; // Returns true if we are over a widget (and not in the border/padding area of a RenderWidget for example).

    mutable std::unique_ptr<NodeSet> m_listBasedTestResult;
};

WEBCORE_EXPORT String displayString(const String&, const Node*);

} // namespace WebCore
