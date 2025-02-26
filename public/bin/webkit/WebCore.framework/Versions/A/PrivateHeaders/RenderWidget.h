/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004, 2005, 2006, 2009, 2010, 2013 Apple Inc. All rights reserved.
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

#include "HTMLFrameOwnerElement.h"
#include "OverlapTestRequestClient.h"
#include "RenderReplaced.h"
#include "Widget.h"

namespace WebCore {

class RemoteFrame;

class WidgetHierarchyUpdatesSuspensionScope {
public:
    WidgetHierarchyUpdatesSuspensionScope()
    {
        s_widgetHierarchyUpdateSuspendCount++;
    }
    ~WidgetHierarchyUpdatesSuspensionScope()
    {
        ASSERT(s_widgetHierarchyUpdateSuspendCount);
        if (s_widgetHierarchyUpdateSuspendCount == 1 && s_haveScheduledWidgetToMove)
            moveWidgets();
        s_widgetHierarchyUpdateSuspendCount--;
    }

    static bool isSuspended() { return s_widgetHierarchyUpdateSuspendCount; }
    static void scheduleWidgetToMove(Widget&, LocalFrameView*);

private:
    using WidgetToParentMap = UncheckedKeyHashMap<RefPtr<Widget>, SingleThreadWeakPtr<LocalFrameView>>;
    static WidgetToParentMap& widgetNewParentMap();

    WEBCORE_EXPORT void moveWidgets();
    WEBCORE_EXPORT static unsigned s_widgetHierarchyUpdateSuspendCount;
    WEBCORE_EXPORT static bool s_haveScheduledWidgetToMove;
};

inline void WidgetHierarchyUpdatesSuspensionScope::scheduleWidgetToMove(Widget& widget, LocalFrameView* frame)
{
    s_haveScheduledWidgetToMove = true;
    widgetNewParentMap().set(&widget, frame);
}

class RenderWidget : public RenderReplaced, private OverlapTestRequestClient, public RefCounted<RenderWidget> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderWidget);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderWidget);
public:
    virtual ~RenderWidget();

    HTMLFrameOwnerElement& frameOwnerElement() const { return downcast<HTMLFrameOwnerElement>(nodeForNonAnonymous()); }

    Widget* widget() const { return m_widget.get(); }
    RefPtr<Widget> protectedWidget() const { return m_widget; }
    WEBCORE_EXPORT void setWidget(RefPtr<Widget>&&);

    static RenderWidget* find(const Widget&);

    enum class ChildWidgetState { Valid, Destroyed };
    ChildWidgetState updateWidgetPosition() WARN_UNUSED_RETURN;
    WEBCORE_EXPORT IntRect windowClipRect() const;

    virtual bool requiresAcceleratedCompositing() const;

    RemoteFrame* remoteFrame() const;

protected:
    RenderWidget(Type, HTMLFrameOwnerElement&, RenderStyle&&);

    void willBeDestroyed() override;
    void styleDidChange(StyleDifference, const RenderStyle* oldStyle) final;
    void layout() override;
    void paint(PaintInfo&, const LayoutPoint&) override;
    bool nodeAtPoint(const HitTestRequest&, HitTestResult&, const HitTestLocation& locationInContainer, const LayoutPoint& accumulatedOffset, HitTestAction) override;
    bool requiresLayer() const override;

private:
    void element() const = delete;

    bool needsPreferredWidthsRecalculation() const final;
    RenderBox* embeddedContentBox() const final;

    void setSelectionState(HighlightState) final;
    void setOverlapTestResult(bool) final;

    bool setWidgetGeometry(const LayoutRect&);
    bool updateWidgetGeometry();

    void paintContents(PaintInfo&, const LayoutPoint&);

    RefPtr<Widget> m_widget;
    IntRect m_clipRect; // The rectangle needs to remain correct after scrolling, so it is stored in content view coordinates, and not clipped to window.
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderWidget, isRenderWidget())
