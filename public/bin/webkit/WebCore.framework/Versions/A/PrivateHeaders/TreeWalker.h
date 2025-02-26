/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2000 Frederik Holljen (frederik.holljen@hig.no)
 * Copyright (C) 2001 Peter Kelly (pmk@post.com)
 * Copyright (C) 2006 Samuel Weinig (sam.weinig@gmail.com)
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

#include "ExceptionOr.h"
#include "NodeFilter.h"
#include "ScriptWrappable.h"
#include "Traversal.h"
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class TreeWalker final : public ScriptWrappable, public RefCounted<TreeWalker>, public NodeIteratorBase {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(TreeWalker, WEBCORE_EXPORT);
public:
    static Ref<TreeWalker> create(Node& rootNode, unsigned long whatToShow, RefPtr<NodeFilter>&& filter)
    {
        return adoptRef(*new TreeWalker(rootNode, whatToShow, WTFMove(filter)));
    }                            

    Node& currentNode() { return m_current.get(); }
    const Node& currentNode() const { return m_current.get(); }

    WEBCORE_EXPORT void setCurrentNode(Node&);

    WEBCORE_EXPORT ExceptionOr<Node*> parentNode();
    WEBCORE_EXPORT ExceptionOr<Node*> firstChild();
    WEBCORE_EXPORT ExceptionOr<Node*> lastChild();
    WEBCORE_EXPORT ExceptionOr<Node*> previousSibling();
    WEBCORE_EXPORT ExceptionOr<Node*> nextSibling();
    WEBCORE_EXPORT ExceptionOr<Node*> previousNode();
    WEBCORE_EXPORT ExceptionOr<Node*> nextNode();

private:
    TreeWalker(Node&, unsigned long whatToShow, RefPtr<NodeFilter>&&);

    enum class SiblingTraversalType { Previous, Next };
    template<SiblingTraversalType> ExceptionOr<Node*> traverseSiblings();
    
    Node* setCurrent(Ref<Node>&&);

    Ref<Node> m_current;
};

} // namespace WebCore
