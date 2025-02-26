/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2018 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "CollectionType.h"
#include "Node.h"

namespace WebCore {

class HTMLCollection;
class RadioNodeList;
class RenderElement;

class ContainerNode : public Node {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ContainerNode);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ContainerNode);
public:
    virtual ~ContainerNode();

    Node* firstChild() const { return m_firstChild.get(); }
    RefPtr<Node> protectedFirstChild() const { return m_firstChild.get(); }
    static constexpr ptrdiff_t firstChildMemoryOffset() { return OBJECT_OFFSETOF(ContainerNode, m_firstChild); }
    Node* lastChild() const { return m_lastChild.get(); }
    RefPtr<Node> protectedLastChild() const { return m_lastChild.get(); }
    static constexpr ptrdiff_t lastChildMemoryOffset() { return OBJECT_OFFSETOF(ContainerNode, m_lastChild); }
    bool hasChildNodes() const { return m_firstChild.get(); }
    bool hasOneChild() const { return m_firstChild && m_firstChild == m_lastChild; }

    bool directChildNeedsStyleRecalc() const { return hasStyleFlag(NodeStyleFlag::DirectChildNeedsStyleResolution); }
    void setDirectChildNeedsStyleRecalc() { setStyleFlag(NodeStyleFlag::DirectChildNeedsStyleResolution); }

    WEBCORE_EXPORT unsigned countChildNodes() const;
    WEBCORE_EXPORT Node* traverseToChildAt(unsigned) const;

    ExceptionOr<void> insertBefore(Node& newChild, RefPtr<Node>&& refChild);
    ExceptionOr<void> replaceChild(Node& newChild, Node& oldChild);
    WEBCORE_EXPORT ExceptionOr<void> removeChild(Node& child);
    WEBCORE_EXPORT ExceptionOr<void> appendChild(Node& newChild);
    void stringReplaceAll(String&&);
    void replaceAll(Node*);

    ContainerNode& rootNode() const;
    Ref<ContainerNode> protectedRootNode() const { return rootNode(); }
    ContainerNode& traverseToRootNode() const;

    // These methods are only used during parsing.
    // They don't send DOM mutation events or handle reparenting.
    // However, arbitrary code may be run by beforeload handlers.
    void parserAppendChild(Node&);
    void parserAppendChildIntoIsolatedTree(Node&);
    void parserNotifyChildrenChanged();
    void parserRemoveChild(Node&);
    void parserInsertBefore(Node& newChild, Node& refChild);

    WEBCORE_EXPORT void removeChildren();

    void takeAllChildrenFrom(ContainerNode*);

    void cloneChildNodes(TreeScope&, ContainerNode& clone);

    struct ChildChange {
        enum class Type : uint8_t { ElementInserted, ElementRemoved, TextInserted, TextRemoved, TextChanged, AllChildrenRemoved, NonContentsChildRemoved, NonContentsChildInserted, AllChildrenReplaced };
        enum class Source : uint8_t { Parser, API, Clone };
        enum class AffectsElements : uint8_t { Unknown, No, Yes };

        ChildChange::Type type;
        // Making these raw pointers RefPtr leads to a Speedometer 3 regression.
        SUPPRESS_UNCOUNTED_MEMBER Element* siblingChanged;
        SUPPRESS_UNCOUNTED_MEMBER Element* previousSiblingElement;
        SUPPRESS_UNCOUNTED_MEMBER Element* nextSiblingElement;
        ChildChange::Source source;
        AffectsElements affectsElements;

        bool isInsertion() const
        {
            switch (type) {
            case ChildChange::Type::ElementInserted:
            case ChildChange::Type::TextInserted:
            case ChildChange::Type::NonContentsChildInserted:
            case ChildChange::Type::AllChildrenReplaced:
                return true;
            case ChildChange::Type::ElementRemoved:
            case ChildChange::Type::TextRemoved:
            case ChildChange::Type::TextChanged:
            case ChildChange::Type::AllChildrenRemoved:
            case ChildChange::Type::NonContentsChildRemoved:
                return false;
            }
            ASSERT_NOT_REACHED();
            return false;
        }
    };
    virtual void childrenChanged(const ChildChange&);

    ExceptionOr<void> appendChild(ChildChange::Source, Node& newChild);

    void disconnectDescendantFrames();

    inline RenderElement* renderer() const; // Defined in RenderElement.h.
    inline CheckedPtr<RenderElement> checkedRenderer() const; // Defined in RenderElement.h.

    // Return a bounding box in absolute coordinates enclosing this node and all its descendants.
    // This gives the area within which events may get handled by a hander registered on this node.
    virtual LayoutRect absoluteEventHandlerBounds(bool& /* includesFixedPositionElements */) { return LayoutRect(); }

    WEBCORE_EXPORT ExceptionOr<Element*> querySelector(const String& selectors);
    WEBCORE_EXPORT ExceptionOr<Ref<NodeList>> querySelectorAll(const String& selectors);

    WEBCORE_EXPORT Ref<HTMLCollection> getElementsByTagName(const AtomString&);
    WEBCORE_EXPORT Ref<HTMLCollection> getElementsByTagNameNS(const AtomString& namespaceURI, const AtomString& localName);
    WEBCORE_EXPORT Ref<HTMLCollection> getElementsByClassName(const AtomString& classNames);
    Ref<RadioNodeList> radioNodeList(const AtomString&);

    // From the ParentNode interface - https://dom.spec.whatwg.org/#interface-parentnode
    WEBCORE_EXPORT Ref<HTMLCollection> children();
    WEBCORE_EXPORT Element* firstElementChild() const;
    WEBCORE_EXPORT Element* lastElementChild() const;
    WEBCORE_EXPORT unsigned childElementCount() const;
    ExceptionOr<void> append(FixedVector<NodeOrString>&&);
    ExceptionOr<void> prepend(FixedVector<NodeOrString>&&);

    ExceptionOr<void> replaceChildren(FixedVector<NodeOrString>&&);

    ExceptionOr<void> ensurePreInsertionValidity(Node& newChild, Node* refChild);
    ExceptionOr<void> ensurePreInsertionValidityForPhantomDocumentFragment(NodeVector& newChildren, Node* refChild = nullptr);
    ExceptionOr<void> insertChildrenBeforeWithoutPreInsertionValidityCheck(NodeVector&&, Node* nextChild = nullptr);

protected:
    explicit ContainerNode(Document&, NodeType, OptionSet<TypeFlag> = { });

    friend void removeDetachedChildrenInContainer(ContainerNode&);

    void removeDetachedChildren();
    void setFirstChild(Node* child) { m_firstChild = child; }
    void setLastChild(Node* child) { m_lastChild = child; }

    HTMLCollection* cachedHTMLCollection(CollectionType);

private:
    void executePreparedChildrenRemoval();
    enum class DeferChildrenChanged : bool { No, Yes };
    enum class DidRemoveElements : bool { No, Yes };
    DidRemoveElements removeAllChildrenWithScriptAssertion(ChildChange::Source, NodeVector& children, DeferChildrenChanged = DeferChildrenChanged::No);
    bool removeNodeWithScriptAssertion(Node&, ChildChange::Source);
    ExceptionOr<void> removeSelfOrChildNodesForInsertion(Node&, NodeVector&);

    void removeBetween(Node* previousChild, Node* nextChild, Node& oldChild);
    ExceptionOr<void> appendChildWithoutPreInsertionValidityCheck(Node&);

    void insertBeforeCommon(Node& nextChild, Node& oldChild);
    void appendChildCommon(Node&);

    void rebuildSVGExtensionsElementsIfNecessary();

    bool isContainerNode() const = delete;

    CheckedPtr<Node> m_firstChild;
    CheckedPtr<Node> m_lastChild;
};

inline ContainerNode::ContainerNode(Document& document, NodeType type, OptionSet<TypeFlag> typeFlags)
    : Node(document, type, typeFlags | TypeFlag::IsContainerNode)
{
    ASSERT(!isTextNode());
}

inline unsigned Node::countChildNodes() const
{
    auto* containerNode = dynamicDowncast<ContainerNode>(*this);
    return containerNode ? containerNode->countChildNodes() : 0;
}

inline Node* Node::traverseToChildAt(unsigned index) const
{
    auto* containerNode = dynamicDowncast<ContainerNode>(*this);
    return containerNode ? containerNode->traverseToChildAt(index) : nullptr;
}

inline Node* Node::firstChild() const
{
    auto* containerNode = dynamicDowncast<ContainerNode>(*this);
    return containerNode ? containerNode->firstChild() : nullptr;
}

inline RefPtr<Node> Node::protectedFirstChild() const
{
    return firstChild();
}

inline Node* Node::lastChild() const
{
    auto* containerNode = dynamicDowncast<ContainerNode>(*this);
    return containerNode ? containerNode->lastChild() : nullptr;
}

inline RefPtr<Node> Node::protectedLastChild() const
{
    return lastChild();
}

inline bool Node::hasChildNodes() const
{
    return firstChild();
}

inline ContainerNode& TreeScope::rootNode() const
{
    return m_rootNode.get();
}

inline Node& Node::rootNode() const
{
    if (isInTreeScope())
        return treeScope().rootNode();
    return traverseToRootNode();
}

inline ContainerNode& ContainerNode::rootNode() const
{
    if (isInTreeScope())
        return treeScope().rootNode();
    return traverseToRootNode();
}

inline void collectChildNodes(Node& node, NodeVector& children)
{
    for (SUPPRESS_UNCOUNTED_LOCAL Node* child = node.firstChild(); child; child = child->nextSibling())
        children.append(*child);
}

inline void Node::setParentNode(ContainerNode* parent)
{
    ASSERT(isMainThread());
    m_parentNode = parent;
    m_refCountAndParentBit = (m_refCountAndParentBit & s_refCountMask) | !!parent;
}

inline RefPtr<ContainerNode> Node::protectedParentNode() const
{
    return parentNode();
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ContainerNode)
    static bool isType(const WebCore::Node& node) { return node.isContainerNode(); }
SPECIALIZE_TYPE_TRAITS_END()
