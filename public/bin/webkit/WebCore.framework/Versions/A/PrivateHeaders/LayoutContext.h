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

#include <wtf/OptionSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class GraphicsContext;
class IntRect;
class LayoutSize;
class RenderView;

namespace Layout {

class ElementBox;
class LayoutState;
class FormattingContext;

// LayoutContext is the entry point for layout.
// LayoutContext::layout() generates the display tree for the root container's subtree (it does not run layout on the root though).
// Note, while the initial containing block is entry point for the initial layout, it does not necessarily need to be the entry point of any
// subsequent layouts (subtree layout). A non-initial, subtree layout could be initiated on multiple formatting contexts.
// Each formatting context has an entry point for layout, which potenitally means multiple entry points per layout frame.
class LayoutContext {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(LayoutContext);
public:
    LayoutContext(LayoutState&);

    void layout(const LayoutSize& rootContentBoxSize);

    static std::unique_ptr<FormattingContext> createFormattingContext(const ElementBox& formattingContextRoot, LayoutState&);

#if ASSERT_ENABLED
    // For testing purposes only
    static void verifyAndOutputMismatchingLayoutTree(const LayoutState&, const RenderView&);
#endif

private:
    void layoutFormattingContextSubtree(const ElementBox&);
    LayoutState& layoutState() { return m_layoutState; }

    LayoutState& m_layoutState;
};

}
}
