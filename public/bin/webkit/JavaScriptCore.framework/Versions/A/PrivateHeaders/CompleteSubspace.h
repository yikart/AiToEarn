/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
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

#include "Subspace.h"

namespace JSC {

class CompleteSubspace final : public Subspace {
public:
    JS_EXPORT_PRIVATE CompleteSubspace(CString name, Heap&, const HeapCellType&, AlignedMemoryAllocator*);
    JS_EXPORT_PRIVATE ~CompleteSubspace() final;

    // In some code paths, we need it to be a compile error to call the virtual version of one of
    // these functions. That's why we do final methods the old school way.
    
    // FIXME: Currently subspaces speak of BlockDirectories as "allocators", but that's temporary.
    // https://bugs.webkit.org/show_bug.cgi?id=181559
    Allocator allocatorFor(size_t, AllocatorForMode);
    Allocator allocatorForNonInline(size_t, AllocatorForMode);

    void* allocate(VM&, size_t, GCDeferralContext*, AllocationFailureMode);
    void* reallocatePreciseAllocationNonVirtual(VM&, HeapCell*, size_t, GCDeferralContext*, AllocationFailureMode);
    
    static constexpr ptrdiff_t offsetOfAllocatorForSizeStep() { return OBJECT_OFFSETOF(CompleteSubspace, m_allocatorForSizeStep); }
    
    Allocator* allocatorForSizeStep() { return &m_allocatorForSizeStep[0]; }

private:
    JS_EXPORT_PRIVATE Allocator allocatorForSlow(size_t);
    
    // These slow paths are concerned with large allocations and allocator creation.
    JS_EXPORT_PRIVATE void* allocateSlow(VM&, size_t, GCDeferralContext*, AllocationFailureMode);
    void* tryAllocateSlow(VM&, size_t, GCDeferralContext*);
    
    std::array<Allocator, MarkedSpace::numSizeClasses> m_allocatorForSizeStep;
    Vector<std::unique_ptr<BlockDirectory>> m_directories;
    Vector<std::unique_ptr<LocalAllocator>> m_localAllocators;
};

ALWAYS_INLINE Allocator CompleteSubspace::allocatorFor(size_t size, AllocatorForMode mode)
{
    if (size <= MarkedSpace::largeCutoff) {
        Allocator result = m_allocatorForSizeStep[MarkedSpace::sizeClassToIndex(size)];
        switch (mode) {
        case AllocatorForMode::MustAlreadyHaveAllocator:
            RELEASE_ASSERT(result);
            break;
        case AllocatorForMode::EnsureAllocator:
            if (!result)
                return allocatorForSlow(size);
            break;
        case AllocatorForMode::AllocatorIfExists:
            break;
        }
        return result;
    }
    RELEASE_ASSERT(mode != AllocatorForMode::MustAlreadyHaveAllocator);
    return Allocator();
}

} // namespace JSC

