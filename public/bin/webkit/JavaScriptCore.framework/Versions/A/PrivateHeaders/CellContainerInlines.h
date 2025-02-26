/*
 * Copyright (C) 2016-2019 Apple Inc. All rights reserved.
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

#include "CellContainer.h"
#include "JSCast.h"
#include "MarkedBlock.h"
#include "PreciseAllocation.h"
#include "VM.h"

namespace JSC {

inline VM& CellContainer::vm() const
{
    if (isPreciseAllocation())
        return preciseAllocation().vm();
    return markedBlock().vm();
}

inline JSC::Heap* CellContainer::heap() const
{
    return &vm().heap;
}

inline bool CellContainer::isMarked(HeapCell* cell) const
{
    if (isPreciseAllocation())
        return preciseAllocation().isMarked();
    return markedBlock().isMarked(cell);
}

inline bool CellContainer::isMarked(HeapVersion markingVersion, HeapCell* cell) const
{
    if (isPreciseAllocation())
        return preciseAllocation().isMarked();
    return markedBlock().isMarked(markingVersion, cell);
}

inline void CellContainer::noteMarked()
{
    if (!isPreciseAllocation())
        markedBlock().noteMarked();
}

inline void CellContainer::assertValidCell(VM& vm, HeapCell* cell) const
{
    if (isPreciseAllocation())
        preciseAllocation().assertValidCell(vm, cell);
    else
        markedBlock().assertValidCell(vm, cell);
}

inline size_t CellContainer::cellSize() const
{
    if (isPreciseAllocation())
        return preciseAllocation().cellSize();
    return markedBlock().cellSize();
}

inline WeakSet& CellContainer::weakSet() const
{
    if (isPreciseAllocation())
        return preciseAllocation().weakSet();
    return markedBlock().weakSet();
}

inline bool CellContainer::areMarksStale() const
{
    if (isPreciseAllocation())
        return false;
    return markedBlock().areMarksStale();
}

} // namespace JSC

