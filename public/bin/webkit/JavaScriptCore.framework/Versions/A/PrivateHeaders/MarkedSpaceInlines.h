/*
 * Copyright (C) 2016-2018 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "MarkedBlockInlines.h"
#include "MarkedSpace.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

ALWAYS_INLINE JSC::Heap& MarkedSpace::heap() const
{
    return *std::bit_cast<Heap*>(std::bit_cast<uintptr_t>(this) - OBJECT_OFFSETOF(Heap, m_objectSpace));
}

template<typename Functor> inline void MarkedSpace::forEachLiveCell(HeapIterationScope&, const Functor& functor)
{
    ASSERT(isIterating());
    forEachLiveCell(functor);
}

template<typename Functor> inline void MarkedSpace::forEachLiveCell(const Functor& functor)
{
    BlockIterator end = m_blocks.set().end();
    for (BlockIterator it = m_blocks.set().begin(); it != end; ++it) {
        IterationStatus result = (*it)->handle().forEachLiveCell(
            [&] (size_t, HeapCell* cell, HeapCell::Kind kind) -> IterationStatus {
                return functor(cell, kind);
            });
        if (result == IterationStatus::Done)
            return;
    }
    for (PreciseAllocation* allocation : m_preciseAllocations) {
        if (allocation->isLive()) {
            if (functor(allocation->cell(), allocation->attributes().cellKind) == IterationStatus::Done)
                return;
        }
    }
}

template<typename Functor> inline void MarkedSpace::forEachDeadCell(HeapIterationScope&, const Functor& functor)
{
    ASSERT(isIterating());
    BlockIterator end = m_blocks.set().end();
    for (BlockIterator it = m_blocks.set().begin(); it != end; ++it) {
        if ((*it)->handle().forEachDeadCell(functor) == IterationStatus::Done)
            return;
    }
    for (PreciseAllocation* allocation : m_preciseAllocations) {
        if (!allocation->isLive()) {
            if (functor(allocation->cell(), allocation->attributes().cellKind) == IterationStatus::Done)
                return;
        }
    }
}

template<typename Visitor>
inline Ref<SharedTask<void(Visitor&)>> MarkedSpace::forEachWeakInParallel(Visitor& visitor)
{
    constexpr unsigned batchSize = 16;
    class Task final : public SharedTask<void(Visitor&)> {
    public:
        Task(MarkedSpace& markedSpace, Visitor& visitor)
            : m_markedSpace(markedSpace)
            , m_newActiveCursor(markedSpace.m_newActiveWeakSets.begin())
            , m_activeCursor(markedSpace.heap().collectionScope() == CollectionScope::Full ? markedSpace.m_activeWeakSets.begin() : markedSpace.m_activeWeakSets.end())
            , m_reason(visitor.rootMarkReason())
        {
        }

        std::span<WeakBlock*> drain(std::array<WeakBlock*, batchSize>& results)
        {
            Locker locker { m_lock };
            size_t resultsSize = 0;
            while (true) {
                if (m_current) {
                    auto* block = m_current;
                    m_current = m_current->next();
                    if (block->isEmpty())
                        continue;
                    results[resultsSize++] = block;
                    if (resultsSize == batchSize)
                        return std::span { results.data(), resultsSize };
                    continue;
                }

                if (m_newActiveCursor != m_markedSpace.m_newActiveWeakSets.end()) {
                    m_current = m_newActiveCursor->head();
                    ++m_newActiveCursor;
                    continue;
                }

                if (m_activeCursor != m_markedSpace.m_activeWeakSets.end()) {
                    m_current = m_activeCursor->head();
                    ++m_activeCursor;
                    continue;
                }
                return std::span { results.data(), resultsSize };
            }
        }

        void run(Visitor& visitor) final
        {
            SetRootMarkReasonScope rootScope(visitor, m_reason);
            std::array<WeakBlock*, batchSize> resultsStorage;
            while (true) {
                auto results = drain(resultsStorage);
                if (!results.size())
                    return;
                for (auto* result : results)
                    result->visit(visitor);
            }
        }

    private:
        MarkedSpace& m_markedSpace;
        WeakBlock* m_current { nullptr };
        SentinelLinkedList<WeakSet, BasicRawSentinelNode<WeakSet>>::iterator m_newActiveCursor;
        SentinelLinkedList<WeakSet, BasicRawSentinelNode<WeakSet>>::iterator m_activeCursor;
        Lock m_lock;
        RootMarkReason m_reason;
    };

    return adoptRef(*new Task(*this, visitor));
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
