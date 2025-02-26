/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "LayoutIntegrationBoxTreeUpdater.h"
#include "LayoutState.h"
#include "RenderObjectEnums.h"
#include <wtf/CheckedPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class HitTestLocation;
class HitTestRequest;
class HitTestResult;
class RenderBlock;
class RenderFlexibleBox;
class RenderStyle;
struct PaintInfo;

namespace LayoutIntegration {

class FlexLayout final : public CanMakeCheckedPtr<FlexLayout> {
    WTF_MAKE_TZONE_ALLOCATED(FlexLayout);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(FlexLayout);
public:
    FlexLayout(RenderFlexibleBox&);
    ~FlexLayout();

    void updateFormattingContexGeometries();
    void updateStyle(const RenderBlock&, const RenderStyle& oldStyle);

    std::pair<LayoutUnit, LayoutUnit> computeIntrinsicWidthConstraints();

    void layout();
    void paint(PaintInfo&, const LayoutPoint& paintOffset);
    bool hitTest(const HitTestRequest&, HitTestResult&, const HitTestLocation&, const LayoutPoint& accumulatedOffset, HitTestAction);

    void collectOverflow();
    LayoutUnit contentBoxLogicalHeight() const;

private:
    void updateRenderers();

    const Layout::ElementBox& flexBox() const { return *m_flexBox; }
    Layout::ElementBox& flexBox() { return *m_flexBox; }

    const RenderFlexibleBox& flexBoxRenderer() const { return downcast<RenderFlexibleBox>(*m_flexBox->rendererForIntegration()); }
    RenderFlexibleBox& flexBoxRenderer() { return downcast<RenderFlexibleBox>(*m_flexBox->rendererForIntegration()); }

    Layout::LayoutState& layoutState() { return *m_layoutState; }
    const Layout::LayoutState& layoutState() const { return *m_layoutState; }

    CheckedPtr<Layout::ElementBox> m_flexBox;
    WeakPtr<Layout::LayoutState> m_layoutState;
};

}
}

