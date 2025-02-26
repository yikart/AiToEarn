/*
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
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
#include "WeakSet.h"
#include <wtf/StdLibExtras.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class IsoSubspace;
class SlotVisitor;

// WebKit has a good malloc that already knows what to do for large allocations. The GC shouldn't
// have to think about such things. That's where PreciseAllocation comes in. We will allocate large
// objects directly using malloc, and put the PreciseAllocation header just before them. We can detect
// when a HeapCell* is a PreciseAllocation because it will have the MarkedBlock::atomSize / 2 bit set.

class PreciseAllocation : public BasicRawSentinelNode<PreciseAllocation> {
public:
    friend class LLIntOffsetsExtractor;
    friend class IsoSubspace;

    static PreciseAllocation* tryCreate(Heap&, size_t, Subspace*, unsigned indexInSpace);
    static PreciseAllocation* tryCreateForLowerTierPrecise(Heap&, size_t, Subspace*, uint8_t lowerTierPreciseIndex);

    PreciseAllocation* reuseForLowerTierPrecise();

    PreciseAllocation* tryReallocate(size_t, Subspace*);
    
    ~PreciseAllocation();
    
    static PreciseAllocation* fromCell(const void* cell)
    {
        return std::bit_cast<PreciseAllocation*>(std::bit_cast<char*>(cell) - headerSize());
    }
    
    HeapCell* cell() const
    {
        return std::bit_cast<HeapCell*>(std::bit_cast<char*>(this) + headerSize());
    }
    
    static bool isPreciseAllocation(HeapCell* cell)
    {
        return std::bit_cast<uintptr_t>(cell) & halfAlignment;
    }
    
    Subspace* subspace() const { return m_subspace; }
    
    void lastChanceToFinalize();
    
    JSC::Heap* heap() const { return m_weakSet.heap(); }
    VM& vm() const { return m_weakSet.vm(); }
    WeakSet& weakSet() { return m_weakSet; }

    static constexpr ptrdiff_t offsetOfWeakSet() { return OBJECT_OFFSETOF(PreciseAllocation, m_weakSet); }

    unsigned indexInSpace() { return m_indexInSpace; }
    void setIndexInSpace(unsigned indexInSpace) { m_indexInSpace = indexInSpace; }
    
    void clearNewlyAllocated() { m_isNewlyAllocated = false; }
    void flip();
    
    bool isNewlyAllocated() const { return m_isNewlyAllocated; }
    ALWAYS_INLINE bool isMarked() { return m_isMarked.load(std::memory_order_relaxed); }
    ALWAYS_INLINE bool isMarked(HeapCell*) { return isMarked(); }
    ALWAYS_INLINE bool isMarked(HeapCell*, Dependency) { return isMarked(); }
    ALWAYS_INLINE bool isMarked(HeapVersion, HeapCell*) { return isMarked(); }
    bool isLive() { return isMarked() || isNewlyAllocated(); }
    
    bool hasValidCell() const { return m_hasValidCell; }
    
    bool isEmpty();
    
    size_t cellSize() const { return m_cellSize; }

    bool aboveLowerBound(const void* rawPtr)
    {
        char* ptr = std::bit_cast<char*>(rawPtr);
        char* begin = std::bit_cast<char*>(cell());
        return ptr >= begin;
    }
    
    bool belowUpperBound(const void* rawPtr)
    {
        char* ptr = std::bit_cast<char*>(rawPtr);
        char* begin = std::bit_cast<char*>(cell());
        char* end = begin + cellSize();
        // We cannot #include IndexingHeader.h because reasons. The fact that IndexingHeader is 8
        // bytes is wired deep into our engine, so this isn't so bad.
        size_t sizeOfIndexingHeader = 8;
        return ptr <= end + sizeOfIndexingHeader;
    }
    
    bool contains(const void* rawPtr)
    {
        return aboveLowerBound(rawPtr) && belowUpperBound(rawPtr);
    }

    CellAttributes attributes() const { return m_attributes; }

    Dependency aboutToMark(HeapVersion) { return Dependency(); }
    
    ALWAYS_INLINE bool testAndSetMarked()
    {
        // This method is usually called when the object is already marked. This avoids us
        // having to CAS in that case. It's profitable to reduce the total amount of CAS
        // traffic.
        if (isMarked())
            return true;
        return m_isMarked.compareExchangeStrong(false, true);
    }
    ALWAYS_INLINE bool testAndSetMarked(HeapCell*, Dependency) { return testAndSetMarked(); }
    void clearMarked() { m_isMarked.store(false); }
    
    void noteMarked() { }
    
#if ASSERT_ENABLED
    void assertValidCell(VM&, HeapCell*) const;
#else
    void assertValidCell(VM&, HeapCell*) const { }
#endif
    
    void sweep();
    
    void destroy();
    
    void dump(PrintStream&) const;

    bool isLowerTierPrecise() const { return m_lowerTierPreciseIndex != UINT8_MAX; }
    uint8_t lowerTierPreciseIndex() const { return m_lowerTierPreciseIndex; }

    static constexpr unsigned alignment = MarkedBlock::atomSize;
    static constexpr unsigned halfAlignment = alignment / 2;
    static constexpr unsigned cacheLineAdjustment = 2 * halfAlignment;

    // The header size must be packed to full alignment size. Because the cell start address
    // always begins immediately after the header, this allows isAlignedForPreciseAllocation()
    // to trivially infer the alignment of the cell from the alignment of the header.
    static constexpr unsigned headerSize() { return roundUpToMultipleOf<alignment>(sizeof(PreciseAllocation)); }

private:
    PreciseAllocation(Heap&, size_t, Subspace*, unsigned indexInSpace, unsigned adjustment);
    
    void* basePointer() const;
    
    unsigned m_indexInSpace { 0 };
    size_t m_cellSize;
    bool m_isNewlyAllocated : 1;
    bool m_hasValidCell : 1;
    // Worst case adjustment needed would be halfAlignment + portionOfObjectThatMustFitInCacheLine
    // which is 8 + 16 -> 24 bytes i.e. will fit in 5 bits. If we need more bits in the future, we
    // can also encode this number of uintptr_t words to save 3 bits.
    unsigned m_adjustment : 5;
    Atomic<bool> m_isMarked;
    CellAttributes m_attributes;
    uint8_t m_lowerTierPreciseIndex { UINT8_MAX };
    Subspace* m_subspace;
    WeakSet m_weakSet;
};

inline void* PreciseAllocation::basePointer() const
{
    return std::bit_cast<char*>(this) - m_adjustment;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
