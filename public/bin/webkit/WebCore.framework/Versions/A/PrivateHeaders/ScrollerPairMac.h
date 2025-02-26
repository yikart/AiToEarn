/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if PLATFORM(MAC)

#include "FloatRect.h"
#include "FloatSize.h"
#include "PlatformWheelEvent.h"
#include "ScrollerMac.h"
#include "ScrollingStateScrollingNode.h"
#include <wtf/RecursiveLockAdapter.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>

OBJC_CLASS NSScrollerImp;
OBJC_CLASS NSScrollerImpPair;
OBJC_CLASS WebScrollerImpPairDelegateMac;

namespace WebCore {
class PlatformWheelEvent;
class ScrollingTreeScrollingNode;
}

namespace WebCore {

// Controls a pair of NSScrollerImps via a pair of ScrollerMac. The NSScrollerImps need to remain internal to this class.
class ScrollerPairMac : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<ScrollerPairMac> {
    WTF_MAKE_TZONE_ALLOCATED(ScrollerPairMac);
    friend class ScrollerMac;
public:
    void init();

    static Ref<ScrollerPairMac> create(ScrollingTreeScrollingNode& node)
    {
        return adoptRef(*new ScrollerPairMac(node));
    }

    ~ScrollerPairMac();

    void handleWheelEventPhase(PlatformWheelEventPhase);

    void setUsePresentationValues(bool);
    bool isUsingPresentationValues() const { return m_usingPresentationValues; }

    void setVerticalScrollbarPresentationValue(float);
    void setHorizontalScrollbarPresentationValue(float);

    void updateValues();

    FloatSize visibleSize() const;
    bool useDarkAppearance() const;
    ScrollbarWidth scrollbarWidthStyle() const;

    struct Values {
        float value;
        float proportion;
    };
    Values valuesForOrientation(ScrollbarOrientation);

    void releaseReferencesToScrollerImpsOnTheMainThread();

    bool hasScrollerImp();

    void viewWillStartLiveResize();
    void viewWillEndLiveResize();
    void contentsSizeChanged();
    bool inLiveResize() const { return m_inLiveResize; }

    // Only for use by WebScrollerImpPairDelegateMac. Do not use elsewhere!
    ScrollerMac& verticalScroller() { return m_verticalScroller; }
    ScrollerMac& horizontalScroller() { return m_horizontalScroller; }

    String scrollbarStateForOrientation(ScrollbarOrientation) const;

    ScrollbarStyle scrollbarStyle() const { return m_scrollbarStyle; }
    void setScrollbarStyle(ScrollbarStyle);

    void setVerticalScrollerImp(NSScrollerImp *);
    void setHorizontalScrollerImp(NSScrollerImp *);
    
    void mouseEnteredContentArea();
    void mouseExitedContentArea();
    void mouseMovedInContentArea(const MouseLocationState&);
    void mouseIsInScrollbar(ScrollbarHoverState);

    NSScrollerImpPair *scrollerImpPair() const { return m_scrollerImpPair.get(); }
    void ensureOnMainThreadWithProtectedThis(Function<void()>&&);
    RefPtr<ScrollingTreeScrollingNode> protectedNode() const { return m_scrollingNode.get(); }

    bool mouseInContentArea() const { return m_mouseInContentArea; }

    void setUseDarkAppearance(bool);

    void setScrollbarWidth(ScrollbarWidth);

private:
    ScrollerPairMac(ScrollingTreeScrollingNode&);

    NSScrollerImp *scrollerImpHorizontal() { return horizontalScroller().scrollerImp(); }
    NSScrollerImp *scrollerImpVertical() { return verticalScroller().scrollerImp(); }

    ThreadSafeWeakPtr<ScrollingTreeScrollingNode> m_scrollingNode;

    ScrollbarHoverState m_scrollbarHoverState;

    ScrollerMac m_verticalScroller;
    ScrollerMac m_horizontalScroller;

    std::optional<FloatPoint> m_lastScrollOffset;

    RetainPtr<NSScrollerImpPair> m_scrollerImpPair;
    RetainPtr<WebScrollerImpPairDelegateMac> m_scrollerImpPairDelegate;

    ScrollbarWidth m_scrollbarWidth { ScrollbarWidth::Auto };
    std::atomic<bool> m_usingPresentationValues { false };
    std::atomic<ScrollbarStyle> m_scrollbarStyle { ScrollbarStyle::AlwaysVisible };
    bool m_useDarkAppearance { false };
    bool m_inLiveResize { false };
    bool m_mouseInContentArea { false };
};

}

#endif
