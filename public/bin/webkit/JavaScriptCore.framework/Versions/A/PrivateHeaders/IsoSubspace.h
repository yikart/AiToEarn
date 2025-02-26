/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

#include "BlockDirectory.h"
#include "IsoMemoryAllocatorBase.h"
#include "Subspace.h"
#include "SubspaceAccess.h"
#include <wtf/SinglyLinkedListWithTail.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class IsoCellSet;

namespace GCClient {
class IsoSubspace;
}

class IsoSubspace : public Subspace {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(IsoSubspace, JS_EXPORT_PRIVATE);
public:
    JS_EXPORT_PRIVATE IsoSubspace(CString name, Heap&, const HeapCellType&, size_t size, bool preciseOnly, uint8_t numberOfLowerTierPreciseCells, std::unique_ptr<IsoMemoryAllocatorBase>&& = nullptr);
    JS_EXPORT_PRIVATE ~IsoSubspace() override;

    size_t cellSize() { return m_directory.cellSize(); }

    void sweepLowerTierPreciseCell(PreciseAllocation*);
    void clearIsoCellSetBit(PreciseAllocation*);

    void* tryAllocatePreciseOrLowerTierPrecise(size_t cellSize);
    void destroyLowerTierPreciseFreeList();

    void sweep();

    template<typename Func> void forEachLowerTierPreciseFreeListedPreciseAllocation(const Func&);

private:
    friend class IsoCellSet;
    friend class GCClient::IsoSubspace;
    
    void didResizeBits(unsigned newSize) override;
    void didRemoveBlock(unsigned blockIndex) override;
    void didBeginSweepingToFreeList(MarkedBlock::Handle*) override;

    BlockDirectory m_directory;
    std::unique_ptr<IsoMemoryAllocatorBase> m_isoAlignedMemoryAllocator;
    SentinelLinkedList<PreciseAllocation, BasicRawSentinelNode<PreciseAllocation>> m_lowerTierPreciseFreeList;
    SentinelLinkedList<IsoCellSet, BasicRawSentinelNode<IsoCellSet>> m_cellSets;
};


namespace GCClient {

class IsoSubspace {
    WTF_MAKE_NONCOPYABLE(IsoSubspace);
    WTF_MAKE_FAST_ALLOCATED;
public:
    JS_EXPORT_PRIVATE IsoSubspace(JSC::IsoSubspace&);
    JS_EXPORT_PRIVATE ~IsoSubspace() = default;

    size_t cellSize() { return m_localAllocator.cellSize(); }

    Allocator allocatorFor(size_t, AllocatorForMode);

    void* allocate(VM&, size_t, GCDeferralContext*, AllocationFailureMode);

private:
    LocalAllocator m_localAllocator;
};

ALWAYS_INLINE Allocator IsoSubspace::allocatorFor(size_t size, AllocatorForMode)
{
    RELEASE_ASSERT(size <= cellSize());
    return Allocator(&m_localAllocator);
}

} // namespace GCClient

#define ISO_SUBSPACE_INIT(heap, heapCellType, type) ("IsoSpace " #type, (heap), (heapCellType), sizeof(type), type::usePreciseAllocationsOnly, type::numberOfLowerTierPreciseCells)

} // namespace JSC

