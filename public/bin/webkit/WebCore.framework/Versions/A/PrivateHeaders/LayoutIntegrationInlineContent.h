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


#include "InlineDisplayContent.h"
#include <wtf/HashMap.h>
#include <wtf/IteratorRange.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
namespace LayoutIntegration {
struct InlineContent;
}
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::LayoutIntegration::InlineContent> : std::true_type { };
}

namespace WebCore {

class RenderBlockFlow;
class RenderObject;
struct SVGTextFragment;

namespace Layout {
class Box;
}

namespace InlineDisplay {
struct Box;
class Line;
} 

namespace LayoutIntegration {

class LineLayout;

struct InlineContent : public CanMakeWeakPtr<InlineContent> {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    InlineContent(const LineLayout&);

    InlineDisplay::Content& displayContent() { return m_displayContent; }
    const InlineDisplay::Content& displayContent() const { return m_displayContent; }

    float clearGapBeforeFirstLine { 0 };
    float clearGapAfterLastLine { 0 };
    float firstLinePaginationOffset { 0 };

    bool isPaginated { false };
    bool hasMultilinePaintOverlap { false };

    bool hasContent() const;

    bool hasVisualOverflow() const { return m_hasVisualOverflow; }
    void setHasVisualOverflow() { m_hasVisualOverflow = true; }
    
    const InlineDisplay::Line& lineForBox(const InlineDisplay::Box& box) const { return displayContent().lines[box.lineIndex()]; }

    IteratorRange<const InlineDisplay::Box*> boxesForRect(const LayoutRect&) const;

    void shrinkToFit();

    const LineLayout& lineLayout() const { return *m_lineLayout; }
    const RenderBlockFlow& formattingContextRoot() const;

    size_t indexForBox(const InlineDisplay::Box&) const;

    const InlineDisplay::Box* firstBoxForLayoutBox(const Layout::Box&) const;
    template<typename Function> void traverseNonRootInlineBoxes(const Layout::Box&, Function&&);

    std::optional<size_t> firstBoxIndexForLayoutBox(const Layout::Box&) const;
    const Vector<size_t>& nonRootInlineBoxIndexesForLayoutBox(const Layout::Box&) const;

    const Vector<SVGTextFragment>& svgTextFragments(size_t boxIndex) const;
    Vector<Vector<SVGTextFragment>>& svgTextFragmentsForBoxes() { return m_svgTextFragmentsForBoxes; }

    void releaseCaches();

private:
    CheckedPtr<const LineLayout> m_lineLayout;

    InlineDisplay::Content m_displayContent;
    using FirstBoxIndexCache = UncheckedKeyHashMap<CheckedRef<const Layout::Box>, size_t>;
    mutable std::unique_ptr<FirstBoxIndexCache> m_firstBoxIndexCache;

    using InlineBoxIndexCache = UncheckedKeyHashMap<CheckedRef<const Layout::Box>, Vector<size_t>>;
    mutable std::unique_ptr<InlineBoxIndexCache> m_inlineBoxIndexCache;
    bool m_hasVisualOverflow { false };

    Vector<Vector<SVGTextFragment>> m_svgTextFragmentsForBoxes;
};

template<typename Function> void InlineContent::traverseNonRootInlineBoxes(const Layout::Box& layoutBox, Function&& function)
{
    for (auto index : nonRootInlineBoxIndexesForLayoutBox(layoutBox))
        function(displayContent().boxes[index]);
}

}
}

