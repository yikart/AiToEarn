/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2019 Apple Inc. All rights reserved.
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

#include "CollectionIndexCache.h"
#include "CollectionTraversal.h"
#include "Document.h"
#include "HTMLNames.h"
#include "NodeList.h"
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class Element;

inline bool shouldInvalidateTypeOnAttributeChange(NodeListInvalidationType, const QualifiedName&);

class LiveNodeList : public NodeList {
    WTF_MAKE_TZONE_OR_ISO_NONALLOCATABLE(LiveNodeList);
public:
    virtual ~LiveNodeList();

    virtual bool elementMatches(Element&) const = 0;
    virtual bool isRootedAtTreeScope() const = 0;

    NodeListInvalidationType invalidationType() const { return m_invalidationType; }
    ContainerNode& ownerNode() const { return m_ownerNode; }
    Ref<ContainerNode> protectedOwnerNode() const { return m_ownerNode; }
    void invalidateCacheForAttribute(const QualifiedName& attributeName) const;
    virtual void invalidateCacheForDocument(Document&) const = 0;
    void invalidateCache() const { invalidateCacheForDocument(document()); }

    bool isRegisteredForInvalidationAtDocument() const { return m_isRegisteredForInvalidationAtDocument; }
    void setRegisteredForInvalidationAtDocument(bool isRegistered) { m_isRegisteredForInvalidationAtDocument = isRegistered; }

protected:
    LiveNodeList(ContainerNode& ownerNode, NodeListInvalidationType);

    Document& document() const { return m_ownerNode->document(); }
    Ref<Document> protectedDocument() const { return document(); }
    ContainerNode& rootNode() const;

private:
    bool isLiveNodeList() const final { return true; }

    Ref<ContainerNode> m_ownerNode;

    const NodeListInvalidationType m_invalidationType;
    bool m_isRegisteredForInvalidationAtDocument { false };
};

template <class NodeListType>
class CachedLiveNodeList : public LiveNodeList {
    WTF_MAKE_TZONE_OR_ISO_NONALLOCATABLE(CachedLiveNodeList);
public:
    virtual ~CachedLiveNodeList();

    inline unsigned length() const final;
    inline Node* item(unsigned offset) const final;

    // For CollectionIndexCache
    using Traversal = CollectionTraversal<CollectionTraversalType::Descendants>;
    using Iterator = Traversal::Iterator;
    inline Iterator collectionBegin() const;
    inline Iterator collectionLast() const;
    inline void collectionTraverseForward(Iterator& current, unsigned count, unsigned& traversedCount) const;
    inline void collectionTraverseBackward(Iterator& current, unsigned count) const;
    inline bool collectionCanTraverseBackward() const;
    inline void willValidateIndexCache() const;

    inline void invalidateCacheForDocument(Document&) const final;
    size_t memoryCost() const final
    {
        // memoryCost() may be invoked concurrently from a GC thread, and we need to be careful
        // about what data we access here and how. Accessing m_indexCache is safe because
        // because it doesn't involve any pointer chasing.
        return m_indexCache.memoryCost();
    }

protected:
    inline CachedLiveNodeList(ContainerNode& rootNode, NodeListInvalidationType);

private:
    NodeListType& nodeList() { return static_cast<NodeListType&>(*this); }
    const NodeListType& nodeList() const { return static_cast<const NodeListType&>(*this); }

    mutable CollectionIndexCache<NodeListType, Iterator> m_indexCache;
};

template <class NodeListType>
CachedLiveNodeList<NodeListType>::CachedLiveNodeList(ContainerNode& ownerNode, NodeListInvalidationType invalidationType)
    : LiveNodeList(ownerNode, invalidationType)
{
}

template <class NodeListType>
CachedLiveNodeList<NodeListType>::~CachedLiveNodeList()
{
    if (m_indexCache.hasValidCache())
        document().unregisterNodeListForInvalidation(*this);
}

} // namespace WebCore
