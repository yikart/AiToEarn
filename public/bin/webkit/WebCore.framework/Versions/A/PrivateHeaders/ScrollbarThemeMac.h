/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
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

#include "ScrollbarThemeComposite.h"

#if PLATFORM(MAC)

OBJC_CLASS CALayer;

namespace WebCore {

class ScrollbarThemeMac : public ScrollbarThemeComposite {
public:
    ScrollbarThemeMac();
    virtual ~ScrollbarThemeMac();

    WEBCORE_EXPORT void preferencesChanged();

    void updateEnabledState(Scrollbar&) override;

    bool paint(Scrollbar&, GraphicsContext&, const IntRect& damageRect) override;
    void paintScrollCorner(ScrollableArea&, GraphicsContext&, const IntRect& cornerRect) override;

    int scrollbarThickness(ScrollbarWidth = ScrollbarWidth::Auto, ScrollbarExpansionState = ScrollbarExpansionState::Expanded, OverlayScrollbarSizeRelevancy = OverlayScrollbarSizeRelevancy::IncludeOverlayScrollbarSize) override;
    
    bool supportsControlTints() const override { return true; }
    bool usesOverlayScrollbars() const  override;
    void usesOverlayScrollbarsChanged() override;
    void updateScrollbarOverlayStyle(Scrollbar&)  override;

    Seconds initialAutoscrollTimerDelay() override { return 500_ms; }
    Seconds autoscrollTimerDelay() override { return 50_ms; }

    ScrollbarButtonsPlacement buttonsPlacement() const override;

    void registerScrollbar(Scrollbar&) override;
    void unregisterScrollbar(Scrollbar&) override;

    static NSScrollerImp *scrollerImpForScrollbar(Scrollbar&);

    void setPaintCharacteristicsForScrollbar(Scrollbar&);

    static bool isCurrentlyDrawingIntoLayer();
    static void setIsCurrentlyDrawingIntoLayer(bool);

    void didCreateScrollerImp(Scrollbar&) override;
    bool isLayoutDirectionRTL(Scrollbar&);

#if HAVE(RUBBER_BANDING)
    WEBCORE_EXPORT static void setUpOverhangAreaShadow(CALayer *);
    WEBCORE_EXPORT static void removeOverhangAreaShadow(CALayer *);
#endif

protected:
    bool hasButtons(Scrollbar&) override;
    bool hasThumb(Scrollbar&) override;

    IntRect backButtonRect(Scrollbar&, ScrollbarPart, bool painting = false) override;
    IntRect forwardButtonRect(Scrollbar&, ScrollbarPart, bool painting = false) override;
    IntRect trackRect(Scrollbar&, bool painting = false) override;

    int maxOverlapBetweenPages() override { return 40; }

    int minimumThumbLength(Scrollbar&) override;
    
    ScrollbarButtonPressAction handleMousePressEvent(Scrollbar&, const PlatformMouseEvent&, ScrollbarPart) override;
    bool shouldDragDocumentInsteadOfThumb(Scrollbar&, const PlatformMouseEvent&) override;
    int scrollbarPartToHIPressedState(ScrollbarPart);
};

}

#endif // PLATFORM(MAC)
