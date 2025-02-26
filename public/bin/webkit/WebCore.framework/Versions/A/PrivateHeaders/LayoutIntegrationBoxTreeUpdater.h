/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include <wtf/CheckedRef.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class RenderBlock;
class RenderBoxModelObject;
class RenderElement;
class RenderObject;
class RenderInline;
class RenderStyle;
class RenderText;

namespace Layout {
class Box;
class ElementBox;
class InitialContainingBlock;
}

namespace LayoutIntegration {

#if ENABLE(TREE_DEBUGGING)
struct InlineContent;
#endif

class BoxTreeUpdater {
public:
    BoxTreeUpdater(RenderBlock&);
    ~BoxTreeUpdater();

    CheckedRef<Layout::ElementBox> build();
    void tearDown();

    static void updateStyle(const RenderObject&);
    static void updateContent(const RenderText&);

    const Layout::Box& insert(const RenderElement& parent, RenderObject& child, const RenderObject* beforeChild = nullptr);
    UniqueRef<Layout::Box> remove(const RenderElement& parent, RenderObject& child);

private:
    const RenderBlock& rootRenderer() const { return m_rootRenderer; }
    RenderBlock& rootRenderer() { return m_rootRenderer; }

    const Layout::ElementBox& rootLayoutBox() const;
    Layout::ElementBox& rootLayoutBox();

    Layout::InitialContainingBlock& initialContainingBlock();

    static UniqueRef<Layout::Box> createLayoutBox(RenderObject&);
    static void adjustStyleIfNeeded(const RenderElement&, RenderStyle&, RenderStyle* firstLineStyle);

    void buildTreeForInlineContent();
    void buildTreeForFlexContent();
    void insertChild(UniqueRef<Layout::Box>, RenderObject&, const RenderObject* beforeChild = nullptr);

    RenderBlock& m_rootRenderer;
};

#if ENABLE(TREE_DEBUGGING)
void showInlineContent(TextStream&, const InlineContent&, size_t depth, bool isDamaged = false);
#endif
}
}

