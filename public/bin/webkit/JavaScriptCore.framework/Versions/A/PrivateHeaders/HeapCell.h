/*
 * Copyright (C) 2016-2020 Apple Inc. All rights reserved.
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

#include "DestructionMode.h"
#include "EnsureStillAliveHere.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class CellContainer;
class Heap;
class PreciseAllocation;
class MarkedBlock;
class Subspace;
class VM;
struct CellAttributes;

class HeapCell {
public:
    enum Kind : int8_t {
        JSCell,
        JSCellWithIndexingHeader,
        Auxiliary
    };
    
    HeapCell() { }
    
    // We're intentionally only zapping the bits for the structureID and leaving
    // the rest of the cell header bits intact for crash analysis uses.
    enum ZapReason : int8_t { Unspecified, Destruction, StopAllocating };
    void zap(ZapReason reason)
    {
        uint32_t* cellWords = std::bit_cast<uint32_t*>(this);
        cellWords[0] = 0;
        // Leaving cellWords[1] alone for crash analysis if needed.
        cellWords[2] = reason;
    }
    bool isZapped() const { return !*std::bit_cast<const uint32_t*>(this); }

    // isPendingDestruction returns true iff the cell is no longer alive but has not yet
    // been swept and therefore its destructor (if it has one) has not yet run.
    bool isPendingDestruction();

    bool isPreciseAllocation() const;
    CellContainer cellContainer() const;
    MarkedBlock& markedBlock() const;
    PreciseAllocation& preciseAllocation() const;

    // If you want performance and you know that your cell is small, you can do this instead:
    // ASSERT(!cell->isPreciseAllocation());
    // cell->markedBlock().vm()
    // We currently only use this hack for callees to make CallFrame::vm() fast. It's not
    // recommended to use it for too many other things, since the large allocation cutoff is
    // a runtime option and its default value is small (400 bytes).
    JSC::Heap* heap() const;
    VM& vm() const;
    
    size_t cellSize() const;
    CellAttributes cellAttributes() const;
    DestructionMode destructionMode() const;
    Kind cellKind() const;
    Subspace* subspace() const;
    
    // Call use() after the last point where you need `this` pointer to be kept alive. You usually don't
    // need to use this, but it might be necessary if you're otherwise referring to an object's innards
    // but not the object itself.
    ALWAYS_INLINE void use() const
    {
        ensureStillAliveHere(this);
    }
};

inline bool isJSCellKind(HeapCell::Kind kind)
{
    return kind == HeapCell::JSCell || kind == HeapCell::JSCellWithIndexingHeader;
}

inline bool mayHaveIndexingHeader(HeapCell::Kind kind)
{
    return kind == HeapCell::Auxiliary || kind == HeapCell::JSCellWithIndexingHeader;
}

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::HeapCell::Kind);

} // namespace WTF

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
