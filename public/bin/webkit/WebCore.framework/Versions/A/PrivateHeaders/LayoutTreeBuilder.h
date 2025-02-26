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

#include "LayoutElementBox.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class RenderBlockFlow;
class RenderBox;
class RenderElement;
class RenderObject;
class RenderTable;
class RenderView;

namespace Layout {

class InitialContainingBlock;
class LayoutState;

class LayoutTree {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(LayoutTree);
public:
    LayoutTree(std::unique_ptr<ElementBox>);
    ~LayoutTree() = default;

    const ElementBox& root() const { return *m_root; }

private:
    std::unique_ptr<ElementBox> m_root;
};

class TreeBuilder {
public:
    static std::unique_ptr<Layout::LayoutTree> buildLayoutTree(const RenderView&);

private:
    TreeBuilder();

    void buildSubTree(const RenderElement& parentRenderer, ElementBox& parentContainer);
    void buildTableStructure(const RenderTable& tableRenderer, ElementBox& tableWrapperBox);
    std::unique_ptr<Box> createLayoutBox(const ElementBox& parentContainer, const RenderObject& childRenderer);

    std::unique_ptr<Box> createReplacedBox(Box::ElementAttributes, ElementBox::ReplacedAttributes&&, RenderStyle&&);
    std::unique_ptr<Box> createTextBox(String text, bool isCombined, bool canUseSimplifiedTextMeasuring, bool canUseSimpleFontCodePath, bool hasPositionDependentContentWidth, bool hasStrongDirectionalityContent, RenderStyle&&);
    std::unique_ptr<ElementBox> createContainer(Box::ElementAttributes, RenderStyle&&);
};

#if ENABLE(TREE_DEBUGGING)
String layoutTreeAsText(const InitialContainingBlock&, const LayoutState*);
void showLayoutTree(const InitialContainingBlock&, const LayoutState*);
void showLayoutTree(const InitialContainingBlock&);
void showInlineTreeAndRuns(TextStream&, const LayoutState&, const ElementBox& inlineFormattingRoot, size_t depth);
void printLayoutTreeForLiveDocuments();
#endif

}
}

