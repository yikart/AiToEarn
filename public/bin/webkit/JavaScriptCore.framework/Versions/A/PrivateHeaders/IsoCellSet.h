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

#include "MarkedBlock.h"
#include <wtf/BitSet.h>
#include <wtf/ConcurrentVector.h>
#include <wtf/FastBitVector.h>
#include <wtf/Noncopyable.h>
#include <wtf/Nonmovable.h>
#include <wtf/SentinelLinkedList.h>
#include <wtf/SharedTask.h>

namespace JSC {

class HeapCell;
class IsoSubspace;

// Create a set of cells that are in an IsoSubspace. This allows concurrent O(1) set insertion and
// removal. Each such set should be thought of as a 0.8% increase in object size for objects in that
// IsoSubspace (it's like adding 1 bit every 16 bytes, or 1 bit every 128 bits).
class IsoCellSet final : public BasicRawSentinelNode<IsoCellSet> {
    WTF_MAKE_NONCOPYABLE(IsoCellSet);
    WTF_MAKE_NONMOVABLE(IsoCellSet);
public:
    IsoCellSet(IsoSubspace& subspace);
    ~IsoCellSet();
    
    bool add(HeapCell* cell); // Returns true if the cell was newly added.
    
    bool remove(HeapCell* cell); // Returns true if the cell was previously present and got removed.
    
    bool contains(HeapCell* cell) const;
    
    JS_EXPORT_PRIVATE Ref<SharedTask<MarkedBlock::Handle*()>> parallelNotEmptyMarkedBlockSource();
    
    // This will have to do a combined search over whatever Subspace::forEachMarkedCell uses and
    // our m_blocksWithBits.
    template<typename Func>
    void forEachMarkedCell(const Func&);

    template<typename Visitor, typename Func>
    Ref<SharedTask<void(Visitor&)>> forEachMarkedCellInParallel(const Func&);
    
    template<typename Func>
    void forEachLiveCell(const Func&);
    
private:
    friend class IsoSubspace;
    
    WTF::BitSet<MarkedBlock::atomsPerBlock>* addSlow(unsigned blockIndex);
    
    void didResizeBits(unsigned newSize);
    void didRemoveBlock(unsigned blockIndex);
    void sweepToFreeList(MarkedBlock::Handle*);
    void clearLowerTierPreciseCell(unsigned);
    
    WTF::BitSet<MarkedBlock::maxNumberOfLowerTierPreciseCells> m_lowerTierPreciseBits;

    IsoSubspace& m_subspace;
    
    // Idea: sweeping to free-list clears bits for those cells that were free-listed. The first time
    // we add a cell in a block, that block gets a free-list. Unless we do something that obviously
    // clears all bits for a block, we keep it set in blocksWithBits.
    
    FastBitVector m_blocksWithBits;
    ConcurrentVector<std::unique_ptr<WTF::BitSet<MarkedBlock::atomsPerBlock>>> m_bits;
};

} // namespace JSC

