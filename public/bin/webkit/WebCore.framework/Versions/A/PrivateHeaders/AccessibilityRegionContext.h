/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "InlineIteratorTextBox.h"
#include "LayoutRect.h"
#include "RegionContext.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class RenderBox;
class RenderBoxModelObject;
class RenderText;
class RenderView;

class AccessibilityRegionContext final : public RegionContext {
    WTF_MAKE_TZONE_ALLOCATED(AccessibilityRegionContext);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(AccessibilityRegionContext);
public:
    AccessibilityRegionContext() = default;
    virtual ~AccessibilityRegionContext();

    bool isAccessibilityRegionContext() const final { return true; }

    // This group of methods takes paint-time geometry and uses it directly.
    void takeBounds(const RenderBox&, LayoutPoint /* paintOffset */);
    void takeBounds(const RenderBox&, FloatRect /* paintRect */);
    void takeBounds(const RenderInline* renderInline, LayoutRect&& paintRect)
    {
        if (renderInline)
            takeBounds(*renderInline, WTFMove(paintRect));
    };
    void takeBounds(const RenderInline&, LayoutRect&& /* paintRect */);
    void takeBounds(const RenderText&, FloatRect /* paintRect */);
    void takeBounds(const RenderView&, LayoutPoint&& /* paintOffset */);

    // This group of methods serves only as a notification that the given object is
    // being painted. From there, we construct the geometry we need ourselves
    // (cheaply, i.e. by combining already-computed geometry how we need it).
    void onPaint(const ScrollView&);

private:
    void takeBoundsInternal(const RenderBoxModelObject&, IntRect&& /* paintRect */);

    // Maps the given rect using the current transform and clip stack.
    // Assumes `rect` is in page-absolute coordinate space (because the clips being applied are).
    template<typename RectT>
    FloatRect mapRect(RectT&& rect)
    {
        bool hasTransform = m_transformStack.size();
        bool hasClip = m_clipStack.size();
        if (!hasTransform && !hasClip)
            return rect;

        FloatRect mappedRect = rect;
        if (hasTransform)
            mappedRect = m_transformStack.last().mapRect(mappedRect);
        if (hasClip)
            mappedRect.intersect(m_clipStack.last());

        return mappedRect;
    }

    SingleThreadWeakHashMap<RenderText, FloatRect> m_accumulatedRenderTextRects;
}; // class AccessibilityRegionContext

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::AccessibilityRegionContext)
    static bool isType(const WebCore::RegionContext& regionContext) { return regionContext.isAccessibilityRegionContext(); }
SPECIALIZE_TYPE_TRAITS_END()
