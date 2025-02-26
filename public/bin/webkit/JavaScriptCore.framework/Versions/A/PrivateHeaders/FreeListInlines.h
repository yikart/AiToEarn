/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "FreeList.h"
#include "MarkedBlock.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

template<typename Func>
ALWAYS_INLINE HeapCell* FreeList::allocateWithCellSize(const Func& slowPath, size_t cellSize)
{
    if (LIKELY(m_intervalStart < m_intervalEnd)) {
        char* result = m_intervalStart;
        m_intervalStart += cellSize;
        return std::bit_cast<HeapCell*>(result);
    }
    
    FreeCell* cell = nextInterval();
    if (UNLIKELY(isSentinel(cell)))
        return slowPath();

    FreeCell::advance(m_secret, m_nextInterval, m_intervalStart, m_intervalEnd);
    
    // It's an invariant of our allocator that we don't create empty intervals, so there 
    // should always be enough space remaining to allocate a cell.
    char* result = m_intervalStart;
    m_intervalStart += cellSize;
    return std::bit_cast<HeapCell*>(result);
}

template<typename Func>
void FreeList::forEach(const Func& func) const
{
    FreeCell* cell = nextInterval();
    char* intervalStart = m_intervalStart;
    char* intervalEnd = m_intervalEnd;
    ASSERT(intervalEnd - intervalStart < (ptrdiff_t)(16 * KB));

    while (true) {
        for (; intervalStart < intervalEnd; intervalStart += m_cellSize)
            func(std::bit_cast<HeapCell*>(intervalStart));

        // If we explore the whole interval and the cell is the sentinel value, though, we should
        // immediately exit so we don't decode anything out of bounds.
        if (isSentinel(cell))
            break;

        FreeCell::advance(m_secret, cell, intervalStart, intervalEnd);
    }
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
