/*
 * Copyright (C) 2011-2021 Apple Inc. All rights reserved.
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

#include "Handle.h"
#include "HandleBlock.h"
#include "HeapCell.h"
#include <wtf/DoublyLinkedList.h>
#include <wtf/HashCountedSet.h>
#include <wtf/SentinelLinkedList.h>
#include <wtf/SinglyLinkedList.h>

namespace JSC {

class HandleSet;
class VM;
class JSValue;

class HandleNode final : public BasicRawSentinelNode<HandleNode> {
public:
    HandleNode() = default;
    
    HandleSlot slot();
    HandleSet* handleSet();

    static HandleNode* toHandleNode(HandleSlot slot)
    {
        return std::bit_cast<HandleNode*>(std::bit_cast<uintptr_t>(slot) - OBJECT_OFFSETOF(HandleNode, m_value));
    }

private:
    JSValue m_value { };
};

class HandleSet {
    friend class HandleBlock;
public:
    static HandleSet* heapFor(HandleSlot);

    HandleSet(VM&);
    ~HandleSet();

    VM& vm();

    HandleSlot allocate();
    void deallocate(HandleSlot);

    template<typename Visitor> void visitStrongHandles(Visitor&);

    template<bool isCellOnly>
    void writeBarrier(HandleSlot, JSValue);

    unsigned protectedGlobalObjectCount();

    template<typename Functor> void forEachStrongHandle(const Functor&, const HashCountedSet<JSCell*>& skipSet);

private:
    typedef HandleNode Node;

    JS_EXPORT_PRIVATE void grow();
    
#if ENABLE(GC_VALIDATION) || ASSERT_ENABLED
    JS_EXPORT_PRIVATE bool isLiveNode(Node*);
#endif

    VM& m_vm;
    DoublyLinkedList<HandleBlock> m_blockList;

    using NodeList = SentinelLinkedList<Node, BasicRawSentinelNode<Node>>;
    NodeList m_strongList;
    SinglyLinkedList<Node> m_freeList;
};

inline HandleSet* HandleSet::heapFor(HandleSlot handle)
{
    return HandleNode::toHandleNode(handle)->handleSet();
}

inline VM& HandleSet::vm()
{
    return m_vm;
}

inline HandleSlot HandleSet::allocate()
{
    if (m_freeList.isEmpty())
        grow();

    HandleSet::Node* node = m_freeList.pop();
    new (NotNull, node) HandleSet::Node();
    return node->slot();
}

inline void HandleSet::deallocate(HandleSlot handle)
{
    HandleSet::Node* node = HandleNode::toHandleNode(handle);
    if (node->isOnList())
        NodeList::remove(node);
    m_freeList.push(node);
}

inline HandleSlot HandleNode::slot()
{
    return &m_value;
}

inline HandleSet* HandleNode::handleSet()
{
    return HandleBlock::blockFor(this)->handleSet();
}

template<typename Functor> void HandleSet::forEachStrongHandle(const Functor& functor, const HashCountedSet<JSCell*>& skipSet)
{
    for (Node& node : m_strongList) {
        JSValue value = *node.slot();
        if (!value || !value.isCell())
            continue;
        if (skipSet.contains(value.asCell()))
            continue;
        functor(value.asCell());
    }
}

template<bool isCellOnly>
inline void HandleSet::writeBarrier(HandleSlot slot, JSValue value)
{
    bool valueIsNonEmptyCell = value && (isCellOnly || value.isCell());
    bool slotIsNonEmptyCell = *slot && (isCellOnly || slot->isCell());
    if (valueIsNonEmptyCell == slotIsNonEmptyCell)
        return;

    Node* node = HandleNode::toHandleNode(slot);
#if ENABLE(GC_VALIDATION)
    if (node->isOnList())
        RELEASE_ASSERT(isLiveNode(node));
#endif
    if (!valueIsNonEmptyCell) {
        ASSERT(slotIsNonEmptyCell);
        ASSERT(node->isOnList());
        NodeList::remove(node);
        return;
    }

    ASSERT(!slotIsNonEmptyCell);
    ASSERT(!node->isOnList());
    m_strongList.push(node);

#if ENABLE(GC_VALIDATION)
    RELEASE_ASSERT(isLiveNode(node));
#endif
}

} // namespace JSC
