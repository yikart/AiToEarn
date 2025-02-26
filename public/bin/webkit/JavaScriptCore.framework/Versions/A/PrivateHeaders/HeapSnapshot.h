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

#include "HeapSnapshotBuilder.h"
#include "TinyBloomFilter.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

class HeapSnapshot {
    WTF_MAKE_TZONE_ALLOCATED(HeapSnapshot);
public:
    HeapSnapshot(HeapSnapshot*);
    ~HeapSnapshot();

    HeapSnapshot* previous() const { return m_previous; }

    void appendNode(const HeapSnapshotNode&);
    void sweepCell(JSCell*);
    void shrinkToFit();
    void finalize();

    bool isEmpty() const { return m_nodes.isEmpty(); }
    std::optional<HeapSnapshotNode> nodeForCell(JSCell*);
    std::optional<HeapSnapshotNode> nodeForObjectIdentifier(unsigned objectIdentifier);

private:
    friend class HeapSnapshotBuilder;
    static constexpr intptr_t CellToSweepTag = 1;

    Vector<HeapSnapshotNode> m_nodes;
    TinyBloomFilter<uintptr_t> m_filter;
    HeapSnapshot* m_previous { nullptr };
    unsigned m_firstObjectIdentifier { 0 };
    unsigned m_lastObjectIdentifier { 0 };
    bool m_finalized { false };
    bool m_hasCellsToSweep { false };
};

} // namespace JSC
