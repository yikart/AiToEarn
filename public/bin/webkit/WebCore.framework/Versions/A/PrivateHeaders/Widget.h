/*
 * Copyright (C) 2004-2018 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Collabora Ltd.  All rights reserved.
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

#if PLATFORM(IOS_FAMILY)
#ifndef NSView
#define NSView WAKView
#endif
#endif

#include "IntRect.h"
#include "PlatformScreen.h"
#include <wtf/CheckedRef.h>
#include <wtf/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/TypeCasts.h>
#include <wtf/WeakPtr.h>

#if PLATFORM(COCOA)
#include <wtf/RetainPtr.h>
#endif

#if PLATFORM(COCOA)
OBJC_CLASS NSView;
OBJC_CLASS NSWindow;
typedef NSView *PlatformWidget;
#elif PLATFORM(WIN)
typedef struct HWND__* HWND;
typedef HWND PlatformWidget;
#else
typedef void* PlatformWidget;
#endif

typedef PlatformWidget PlatformPageClient;

namespace WebCore {

class Cursor;
class Event;
class FontCascade;
class FrameView;
class GraphicsContext;
class PlatformMouseEvent;
class RegionContext;
class ScrollView;

enum WidgetNotification { WillPaintFlattened, DidPaintFlattened };

// The Widget class serves as a base class for three kinds of objects:
// (1) Scrollable areas (ScrollView)
// (2) Scrollbars (Scrollbar)
// (3) Plugins (PluginView)
//
// A widget may or may not be backed by a platform-specific object (e.g., HWND on Windows, NSView on Mac, QWidget on Qt).
//
// Widgets are connected in a hierarchy, with the restriction that plugins and scrollbars are always leaves of the
// tree.  Only ScrollViews can have children (and therefore the Widget class has no concept of children).
//
// The rules right now for which widgets get platform-specific objects are as follows:
// ScrollView - Mac
// Scrollbar - Mac, Gtk
// Plugin - Mac, Windows (windowed only), Qt (windowed only, widget is an HWND on windows), Gtk (windowed only)
//
class Widget : public RefCounted<Widget>, public CanMakeSingleThreadWeakPtr<Widget> {
public:
    WEBCORE_EXPORT explicit Widget(PlatformWidget = nullptr);
    WEBCORE_EXPORT virtual ~Widget();

    WEBCORE_EXPORT PlatformWidget platformWidget() const;
    WEBCORE_EXPORT void setPlatformWidget(PlatformWidget);

    int x() const { return frameRect().x(); }
    int y() const { return frameRect().y(); }
    int width() const { return frameRect().width(); }
    int height() const { return frameRect().height(); }
    IntSize size() const { return frameRect().size(); }
    IntPoint location() const { return frameRect().location(); }

    WEBCORE_EXPORT virtual void setFrameRect(const IntRect&);
    WEBCORE_EXPORT IntRect frameRect() const;
    IntRect boundsRect() const { return IntRect(0, 0, width(),  height()); }

    void resize(int w, int h) { setFrameRect(IntRect(x(), y(), w, h)); }
    void resize(const IntSize& s) { setFrameRect(IntRect(location(), s)); }
    void move(int x, int y) { setFrameRect(IntRect(x, y, width(), height())); }
    void move(const IntPoint& p) { setFrameRect(IntRect(p, size())); }

    enum class SecurityOriginPaintPolicy { AnyOrigin, AccessibleOriginOnly };

    WEBCORE_EXPORT virtual void paint(GraphicsContext&, const IntRect&, SecurityOriginPaintPolicy = SecurityOriginPaintPolicy::AnyOrigin, RegionContext* = nullptr);
    void invalidate() { invalidateRect(boundsRect()); }
    virtual void invalidateRect(const IntRect&) = 0;

    WEBCORE_EXPORT virtual void setFocus(bool);

    WEBCORE_EXPORT void setCursor(const Cursor&);

    WEBCORE_EXPORT virtual void show();
    WEBCORE_EXPORT virtual void hide();
    bool isSelfVisible() const { return m_selfVisible; } // Whether or not we have been explicitly marked as visible or not.
    bool isParentVisible() const { return m_parentVisible; } // Whether or not our parent is visible.
    bool isVisible() const { return m_selfVisible && m_parentVisible; } // Whether or not we are actually visible.
    virtual void setParentVisible(bool visible) { m_parentVisible = visible; }
    void setSelfVisible(bool v) { m_selfVisible = v; }

    void setIsSelected(bool);

    virtual bool isLocalFrameView() const { return false; }
    virtual bool isRemoteFrameView() const { return false; }
    virtual bool isPluginViewBase() const { return false; }
    virtual bool isScrollbar() const { return false; }
    virtual bool isScrollView() const { return false; }

    WEBCORE_EXPORT void removeFromParent();
    WEBCORE_EXPORT virtual void setParent(ScrollView* view);
    WEBCORE_EXPORT ScrollView* parent() const;
    WEBCORE_EXPORT RefPtr<ScrollView> protectedParent() const;
    FrameView* root() const;

    virtual void handleEvent(Event&) { }

    virtual void notifyWidget(WidgetNotification) { }

    WEBCORE_EXPORT IntRect convertToRootView(const IntRect&) const;
    IntRect convertFromRootView(const IntRect&) const;

    FloatRect convertToRootView(const FloatRect&) const;
    FloatRect convertFromRootView(const FloatRect&) const;

    IntPoint convertToRootView(const IntPoint&) const;
    IntPoint convertFromRootView(const IntPoint&) const;

    FloatPoint convertToRootView(const FloatPoint&) const;
    FloatPoint convertFromRootView(const FloatPoint&) const;

    // It is important for cross-platform code to realize that Mac has flipped coordinates.  Therefore any code
    // that tries to convert the location of a rect using the point-based convertFromContainingWindow will end
    // up with an inaccurate rect.  Always make sure to use the rect-based convertFromContainingWindow method
    // when converting window rects.
    WEBCORE_EXPORT IntRect convertToContainingWindow(const IntRect&) const;
    IntRect convertFromContainingWindow(const IntRect&) const;

    WEBCORE_EXPORT IntPoint convertToContainingWindow(const IntPoint&) const;
    IntPoint convertFromContainingWindow(const IntPoint&) const;

    virtual void frameRectsChanged() { }

    // Notifies this widget that its clip rect changed.
    virtual void clipRectChanged() { }

    // Whether transforms affect the frame rect. FIXME: We get rid of this and have
    // the frame rects be the same no matter what transforms are applied.
    virtual bool transformsAffectFrameRect() { return true; }

    virtual void willBeDestroyed() { }

#if PLATFORM(COCOA)
    virtual id accessibilityHitTest(const IntPoint&) const { return nil; }
    virtual id accessibilityObject() const { return nil; }
    NSView* getOuterView() const;

    void removeFromSuperview();
#endif
#if PLATFORM(IOS_FAMILY)
    void addToSuperview(NSView*);
#endif

    // Virtual methods to convert points to/from the containing ScrollView
    WEBCORE_EXPORT virtual IntRect convertToContainingView(const IntRect&) const;
    WEBCORE_EXPORT virtual IntRect convertFromContainingView(const IntRect&) const;
    WEBCORE_EXPORT virtual FloatRect convertToContainingView(const FloatRect&) const;
    WEBCORE_EXPORT virtual FloatRect convertFromContainingView(const FloatRect&) const;
    WEBCORE_EXPORT virtual IntPoint convertToContainingView(const IntPoint&) const;
    WEBCORE_EXPORT virtual IntPoint convertFromContainingView(const IntPoint&) const;
    WEBCORE_EXPORT virtual FloatPoint convertToContainingView(const FloatPoint&) const;
    WEBCORE_EXPORT virtual FloatPoint convertFromContainingView(const FloatPoint&) const;

private:
    void init(PlatformWidget); // Must be called by all Widget constructors to initialize cross-platform data.

    // These methods are used to convert from the root widget to the containing window,
    // which has behavior that may differ between platforms (e.g. Mac uses flipped window coordinates).
    static IntRect convertFromRootToContainingWindow(const Widget* rootWidget, const IntRect&);
    static IntRect convertFromContainingWindowToRoot(const Widget* rootWidget, const IntRect&);

    static IntPoint convertFromRootToContainingWindow(const Widget* rootWidget, const IntPoint&);
    static IntPoint convertFromContainingWindowToRoot(const Widget* rootWidget, const IntPoint&);

private:
    bool m_selfVisible { false };
    bool m_parentVisible { false };

    SingleThreadWeakPtr<ScrollView> m_parent;
#if !PLATFORM(COCOA)
    PlatformWidget m_widget;
#else
    RetainPtr<NSView> m_widget;
#endif

    IntRect m_frame; // Not used when a native widget exists.
};

#if !PLATFORM(COCOA)

inline PlatformWidget Widget::platformWidget() const
{
    return m_widget;
}

inline void Widget::setPlatformWidget(PlatformWidget widget)
{
    m_widget = widget;
}

#endif

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_WIDGET(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::Widget& widget) { return widget.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

