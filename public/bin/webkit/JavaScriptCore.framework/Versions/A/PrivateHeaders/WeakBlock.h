/*
 * Copyright (C) 2012-2021 Apple Inc. All rights reserved.
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

#include "CellContainer.h"
#include "WeakImpl.h"
#include <wtf/DoublyLinkedList.h>
#include <wtf/StdLibExtras.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class AbstractSlotVisitor;
class Heap;
class SlotVisitor;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(WeakBlock);

class WeakBlock : public DoublyLinkedListNode<WeakBlock> {
public:
    friend class WTF::DoublyLinkedListNode<WeakBlock>;
    static constexpr size_t blockSize = 1024; // 1/16 of MarkedBlock size

    struct FreeCell {
        FreeCell* next;
    };

    struct SweepResult {
        bool isNull() const;

        bool blockIsFree { true };
        bool blockIsLogicallyEmpty { true };
        FreeCell* freeList { nullptr };
    };

    static WeakBlock* create(Heap&, CellContainer);
    static void destroy(Heap&, WeakBlock*);

    static WeakImpl* asWeakImpl(FreeCell*);

    bool isEmpty();
    bool isLogicallyEmptyButNotFree() const;

    void sweep();
    SweepResult takeSweepResult();

    JS_EXPORT_PRIVATE void visit(AbstractSlotVisitor&);
    JS_EXPORT_PRIVATE void visit(SlotVisitor&);

    void reap();

    void lastChanceToFinalize();
    void disconnectContainer() { m_container = CellContainer(); }

private:
    template<typename Visitor> void visitImpl(Visitor&);

    static FreeCell* asFreeCell(WeakImpl*);
    
    template<typename ContainerType, typename Visitor>
    void specializedVisit(ContainerType&, Visitor&);

    explicit WeakBlock(CellContainer);
    void finalize(WeakImpl*);
    WeakImpl* weakImpls();
    size_t weakImplCount();
    void addToFreeList(FreeCell**, WeakImpl*);

    CellContainer m_container;
    WeakBlock* m_prev;
    WeakBlock* m_next;
    SweepResult m_sweepResult;
};

inline bool WeakBlock::SweepResult::isNull() const
{
    return blockIsFree && !freeList; // This state is impossible, so we can use it to mean null.
}

inline WeakImpl* WeakBlock::asWeakImpl(FreeCell* freeCell)
{
    return reinterpret_cast_ptr<WeakImpl*>(freeCell);
}

inline WeakBlock::SweepResult WeakBlock::takeSweepResult()
{
    SweepResult tmp;
    std::swap(tmp, m_sweepResult);
    ASSERT(m_sweepResult.isNull());
    return tmp;
}

inline WeakBlock::FreeCell* WeakBlock::asFreeCell(WeakImpl* weakImpl)
{
    return reinterpret_cast_ptr<FreeCell*>(weakImpl);
}

inline WeakImpl* WeakBlock::weakImpls()
{
    return reinterpret_cast_ptr<WeakImpl*>(this) + ((sizeof(WeakBlock) + sizeof(WeakImpl) - 1) / sizeof(WeakImpl));
}

inline size_t WeakBlock::weakImplCount()
{
    return (blockSize / sizeof(WeakImpl)) - ((sizeof(WeakBlock) + sizeof(WeakImpl) - 1) / sizeof(WeakImpl));
}

inline void WeakBlock::addToFreeList(FreeCell** freeList, WeakImpl* weakImpl)
{
    ASSERT(weakImpl->state() == WeakImpl::Deallocated);
    FreeCell* freeCell = asFreeCell(weakImpl);
    ASSERT(!*freeList || ((char*)*freeList > (char*)this && (char*)*freeList < (char*)this + blockSize));
    ASSERT((char*)freeCell > (char*)this && (char*)freeCell < (char*)this + blockSize);
    freeCell->next = *freeList;
    *freeList = freeCell;
}

inline bool WeakBlock::isEmpty()
{
    return !m_sweepResult.isNull() && m_sweepResult.blockIsFree;
}

inline bool WeakBlock::isLogicallyEmptyButNotFree() const
{
    return !m_sweepResult.isNull() && !m_sweepResult.blockIsFree && m_sweepResult.blockIsLogicallyEmpty;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
