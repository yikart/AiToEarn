/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "Node.h"
#include "StyleChange.h"
#include <wtf/HashMap.h>
#include <wtf/ListHashSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class ContainerNode;
class Document;
class Element;
class Node;
class RenderStyle;
class SVGElement;
class Text;

namespace Style {

struct ElementUpdate {
    std::unique_ptr<RenderStyle> style;
    Change change { Change::None };
    bool recompositeLayer { false };
    bool mayNeedRebuildRoot { false };
};

struct TextUpdate {
    unsigned offset { 0 };
    unsigned length { std::numeric_limits<unsigned>::max() };
    std::optional<std::unique_ptr<RenderStyle>> inheritedDisplayContentsStyle;
};

class Update final : public CanMakeCheckedPtr<Update> {
    WTF_MAKE_TZONE_ALLOCATED(Update);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(Update);
public:
    Update(Document&);
    ~Update();

    const ListHashSet<RefPtr<ContainerNode>>& roots() const { return m_roots; }
    ListHashSet<RefPtr<Element>> takeRebuildRoots() { return WTFMove(m_rebuildRoots); }

    const ElementUpdate* elementUpdate(const Element&) const;
    ElementUpdate* elementUpdate(const Element&);

    const TextUpdate* textUpdate(const Text&) const;

    const RenderStyle* initialContainingBlockUpdate() const { return m_initialContainingBlockUpdate.get(); }

    const RenderStyle* elementStyle(const Element&) const;
    RenderStyle* elementStyle(const Element&);

    const Document& document() const { return m_document; }

    bool isEmpty() const { return !size(); }
    unsigned size() const { return m_elements.size() + m_texts.size(); }

    void addElement(Element&, Element* parent, ElementUpdate&&);
    void addText(Text&, Element* parent, TextUpdate&&);
    void addText(Text&, TextUpdate&&);
    void addSVGRendererUpdate(SVGElement&);
    void addInitialContainingBlockUpdate(std::unique_ptr<RenderStyle>);

private:
    void addPossibleRoot(Element*);
    void addPossibleRebuildRoot(Element&, Element* parent);

    Ref<Document> m_document;
    ListHashSet<RefPtr<ContainerNode>> m_roots;
    ListHashSet<RefPtr<Element>> m_rebuildRoots;
    UncheckedKeyHashMap<RefPtr<const Element>, ElementUpdate> m_elements;
    UncheckedKeyHashMap<RefPtr<const Text>, TextUpdate> m_texts;
    std::unique_ptr<RenderStyle> m_initialContainingBlockUpdate;
};

}
}
