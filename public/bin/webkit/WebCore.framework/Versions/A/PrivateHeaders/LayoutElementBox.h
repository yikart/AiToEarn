/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "LayoutBox.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class CachedImage;
class RenderElement;
class RenderStyle;

namespace Layout {

class ElementBox : public Box {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ElementBox);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ElementBox);
public:
    ElementBox(ElementAttributes&&, RenderStyle&&, std::unique_ptr<RenderStyle>&& firstLineStyle = nullptr, OptionSet<BaseTypeFlag> = { ElementBoxFlag });

    enum class ListMarkerAttribute : uint8_t {
        Image = 1 << 0,
        Outside = 1 << 1,
    };
    ElementBox(ElementAttributes&&, OptionSet<ListMarkerAttribute>, RenderStyle&&, std::unique_ptr<RenderStyle>&& firstLineStyle = nullptr);

    struct ReplacedAttributes {
        LayoutSize intrinsicSize;
        std::optional<LayoutUnit> intrinsicRatio { };
        CachedImage* cachedImage { };
    };
    ElementBox(ElementAttributes&&, ReplacedAttributes&&, RenderStyle&&, std::unique_ptr<RenderStyle>&& firstLineStyle = nullptr);

    ~ElementBox();

    const Box* firstChild() const { return m_firstChild.get(); }
    const Box* firstInFlowChild() const;
    const Box* firstInFlowOrFloatingChild() const;
    const Box* firstOutOfFlowChild() const;
    const Box* lastChild() const { return m_lastChild.get(); }
    const Box* lastInFlowChild() const;
    const Box* lastInFlowOrFloatingChild() const;
    const Box* lastOutOfFlowChild() const;

    // FIXME: This is currently needed for style updates.
    Box* firstChild() { return m_firstChild.get(); }

    bool hasChild() const { return firstChild(); }
    bool hasInFlowChild() const { return firstInFlowChild(); }
    bool hasInFlowOrFloatingChild() const { return firstInFlowOrFloatingChild(); }
    bool hasOutOfFlowChild() const;

    void appendChild(UniqueRef<Box>);
    void insertChild(UniqueRef<Box>, Box* beforeChild = nullptr);
    void destroyChildren();

    void setBaselineForIntegration(LayoutUnit baseline) { m_baselineForIntegration = baseline; }
    std::optional<LayoutUnit> baselineForIntegration() const { return m_baselineForIntegration; }

    bool hasIntrinsicWidth() const;
    bool hasIntrinsicHeight() const;
    bool hasIntrinsicRatio() const;
    LayoutUnit intrinsicWidth() const;
    LayoutUnit intrinsicHeight() const;
    LayoutUnit intrinsicRatio() const;
    bool hasAspectRatio() const;

    void setListMarkerAttributes(OptionSet<ListMarkerAttribute> listMarkerAttributes) { m_replacedData->listMarkerAttributes = listMarkerAttributes; }

    bool isListMarkerImage() const { return m_replacedData && m_replacedData->listMarkerAttributes.contains(ListMarkerAttribute::Image); }
    bool isListMarkerOutside() const { return m_replacedData && m_replacedData->listMarkerAttributes.contains(ListMarkerAttribute::Outside); }

    // FIXME: This doesn't belong.
    CachedImage* cachedImage() const { return m_replacedData ? m_replacedData->cachedImage : nullptr; }

    RenderElement* rendererForIntegration() const;

private:
    friend class Box;

    struct ReplacedData {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        OptionSet<ListMarkerAttribute> listMarkerAttributes;
        std::optional<LayoutSize> intrinsicSize;
        std::optional<LayoutUnit> intrinsicRatio;
        CachedImage* cachedImage { nullptr };
    };

    std::unique_ptr<Box> m_firstChild;
    CheckedPtr<Box> m_lastChild;

    std::unique_ptr<ReplacedData> m_replacedData;
    std::optional<LayoutUnit> m_baselineForIntegration;
};

}
}

SPECIALIZE_TYPE_TRAITS_LAYOUT_BOX(ElementBox, isElementBox())

