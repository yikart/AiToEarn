/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2013-2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "DocumentFragment.h"
#include "Element.h"
#include "StyleScopeOrdinal.h"
#include "ShadowRootMode.h"
#include "SlotAssignmentMode.h"
#include <wtf/HashMap.h>

namespace WebCore {

class HTMLSlotElement;
class SlotAssignment;
class StyleSheetList;
class TrustedHTML;
class WebAnimation;

enum class ParserContentPolicy : uint8_t;

struct GetHTMLOptions;

namespace Style {
class Scope;
}

class ShadowRoot final : public DocumentFragment, public TreeScope {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ShadowRoot);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ShadowRoot);
public:

    enum class DelegatesFocus : bool { No, Yes };
    enum class Clonable : bool { No, Yes };
    enum class Serializable : bool { No, Yes };
    enum class AvailableToElementInternals : bool { No, Yes };
    enum class ScopedCustomElementRegistry : bool { No, Yes };

    static Ref<ShadowRoot> create(Document& document, ShadowRootMode type, SlotAssignmentMode assignmentMode = SlotAssignmentMode::Named,
        DelegatesFocus delegatesFocus = DelegatesFocus::No, Clonable clonable = Clonable::No, Serializable serializable = Serializable::No, AvailableToElementInternals availableToElementInternals = AvailableToElementInternals::No,
        RefPtr<CustomElementRegistry>&& registry = nullptr, ScopedCustomElementRegistry scopedRegistry = ScopedCustomElementRegistry::No)
    {
        return adoptRef(*new ShadowRoot(document, type, assignmentMode, delegatesFocus, clonable, serializable, availableToElementInternals, WTFMove(registry), scopedRegistry));
    }

    static Ref<ShadowRoot> create(Document& document, std::unique_ptr<SlotAssignment>&& assignment)
    {
        return adoptRef(*new ShadowRoot(document, WTFMove(assignment)));
    }

    virtual ~ShadowRoot();

    using DocumentFragment::ref;
    using DocumentFragment::deref;

    using TreeScope::getElementById;
    using TreeScope::rootNode;

    Style::Scope& styleScope() { return *m_styleScope; }
    CheckedRef<Style::Scope> checkedStyleScope() const;
    StyleSheetList& styleSheets();

    bool delegatesFocus() const { return m_delegatesFocus; }
    bool containsFocusedElement() const { return m_containsFocusedElement; }
    void setContainsFocusedElement(bool flag) { m_containsFocusedElement = flag; }

    bool isClonable() const { return m_isClonable; }
    bool serializable() const { return m_serializable; }

    bool isAvailableToElementInternals() const { return m_availableToElementInternals; }
    void setIsAvailableToElementInternals(bool flag) { m_availableToElementInternals = flag; }
    bool isDeclarativeShadowRoot() const { return m_isDeclarativeShadowRoot; }
    void setIsDeclarativeShadowRoot(bool flag) { m_isDeclarativeShadowRoot = flag; }

    Element* host() const { return m_host.get(); }
    RefPtr<Element> protectedHost() const { return m_host.get(); }
    void setHost(WeakPtr<Element, WeakPtrImplWithEventTargetData>&& host) { m_host = WTFMove(host); }

    CustomElementRegistry* registryForBindings() const { return m_hasScopedCustomElementRegistry ? customElementRegistry() : nullptr; }

    ExceptionOr<void> setHTMLUnsafe(std::variant<RefPtr<TrustedHTML>, String>&&);
    String getHTML(GetHTMLOptions&&) const;

    String innerHTML() const;
    ExceptionOr<void> setInnerHTML(std::variant<RefPtr<TrustedHTML>, String>&&);

    Ref<Node> cloneNodeInternal(TreeScope&, CloningOperation) override;

    Element* activeElement() const;

    ShadowRootMode mode() const { return m_mode; }
    bool shouldFireSlotchangeEvent() const { return m_mode != ShadowRootMode::UserAgent && !m_hasBegunDeletingDetachedChildren; }

    void removeAllEventListeners() override;

    SlotAssignmentMode slotAssignmentMode() const { return m_slotAssignmentMode; }
    HTMLSlotElement* findAssignedSlot(const Node&);

    void renameSlotElement(HTMLSlotElement&, const AtomString& oldName, const AtomString& newName);
    void addSlotElementByName(const AtomString&, HTMLSlotElement&);
    void removeSlotElementByName(const AtomString&, HTMLSlotElement&, ContainerNode& oldParentOfRemovedTree);
    void slotManualAssignmentDidChange(HTMLSlotElement&, Vector<WeakPtr<Node, WeakPtrImplWithEventTargetData>>& previous, Vector<WeakPtr<Node, WeakPtrImplWithEventTargetData>>& current);
    void didRemoveManuallyAssignedNode(HTMLSlotElement&, const Node&);
    void slotFallbackDidChange(HTMLSlotElement&);
    void resolveSlotsBeforeNodeInsertionOrRemoval();
    void willRemoveAllChildren(ContainerNode&);
    void willRemoveAssignedNode(const Node&);

    void didRemoveAllChildrenOfShadowHost();
    void didMutateTextNodesOfShadowHost();
    void hostChildElementDidChange(const Element&);
    void hostChildElementDidChangeSlotAttribute(Element&, const AtomString& oldValue, const AtomString& newValue);

    const Vector<WeakPtr<Node, WeakPtrImplWithEventTargetData>>* assignedNodesForSlot(const HTMLSlotElement&);

    void moveShadowRootToNewParentScope(TreeScope&, Document&);
    void moveShadowRootToNewDocument(Document& oldDocument, Document& newDocument);

    using PartMappings = UncheckedKeyHashMap<AtomString, Vector<AtomString, 1>>;
    const PartMappings& partMappings() const;
    void invalidatePartMappings();

#if ENABLE(PICTURE_IN_PICTURE_API)
    Element* pictureInPictureElement() const;
#endif

    Vector<RefPtr<WebAnimation>> getAnimations();

private:
    ShadowRoot(Document&, ShadowRootMode, SlotAssignmentMode, DelegatesFocus, Clonable, Serializable, AvailableToElementInternals, RefPtr<CustomElementRegistry>&&, ScopedCustomElementRegistry);
    ShadowRoot(Document&, std::unique_ptr<SlotAssignment>&&);

    bool childTypeAllowed(NodeType) const override;

    Node::InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) override;
    void removedFromAncestor(RemovalType, ContainerNode& insertionPoint) override;

    void childrenChanged(const ChildChange&) override;

    ExceptionOr<void> replaceChildrenWithMarkup(const String&, OptionSet<ParserContentPolicy>);

    bool m_hasBegunDeletingDetachedChildren : 1 { false };
    bool m_delegatesFocus : 1 { false };
    bool m_isClonable : 1 { false };
    bool m_serializable : 1 { false };
    bool m_containsFocusedElement : 1 { false };
    bool m_availableToElementInternals : 1 { false };
    bool m_isDeclarativeShadowRoot : 1 { false };
    bool m_hasScopedCustomElementRegistry : 1 { false };
    ShadowRootMode m_mode { ShadowRootMode::UserAgent };
    SlotAssignmentMode m_slotAssignmentMode { SlotAssignmentMode::Named };

    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_host;
    RefPtr<StyleSheetList> m_styleSheetList;

    std::unique_ptr<Style::Scope> m_styleScope;
    std::unique_ptr<SlotAssignment> m_slotAssignment;
    mutable std::optional<PartMappings> m_partMappings;
};

inline Element* ShadowRoot::activeElement() const
{
    return treeScope().focusedElementInScope();
}

inline bool Node::isUserAgentShadowRoot() const
{
    auto* shadowRoot = dynamicDowncast<ShadowRoot>(*this);
    return shadowRoot && shadowRoot->mode() == ShadowRootMode::UserAgent;
}

inline ContainerNode* Node::parentOrShadowHostNode() const
{
    ASSERT(isMainThreadOrGCThread());
    if (auto* shadowRoot = dynamicDowncast<ShadowRoot>(*this))
        return shadowRoot->host();
    return parentNode();
}

inline RefPtr<ContainerNode> Node::protectedParentOrShadowHostNode() const
{
    return parentOrShadowHostNode();
}

inline bool hasShadowRootParent(const Node& node)
{
    return node.parentNode() && node.parentNode()->isShadowRoot();
}

Vector<Ref<ShadowRoot>> assignedShadowRootsIfSlotted(const Node&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ShadowRoot)
    static bool isType(const WebCore::Node& node) { return node.isShadowRoot(); }
SPECIALIZE_TYPE_TRAITS_END()
