/*
 * Copyright (C) 2015-2019 Apple Inc. All rights reserved.
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

#include <wtf/Assertions.h>

namespace JSC {

// The CellState of a cell is a kind of hint about what the state of the cell is.
enum class CellState : uint8_t {
    // The object is either currently being scanned, or it has finished being scanned, or this
    // is a full collection and it's actually a white object (you'd know because its mark bit
    // would be clear).
    PossiblyBlack = 0,
    
    // The object is in eden. During GC, this means that the object has not been marked yet.
    DefinitelyWhite = 1,

    // This sorta means that the object is grey - i.e. it will be scanned. Or it could be white
    // during a full collection if its mark bit is clear. That would happen if it had been black,
    // got barriered, and we did a full collection.
    PossiblyGrey = 2
};

static constexpr unsigned blackThreshold = 0; // x <= blackThreshold means x is PossiblyOldOrBlack.
static constexpr unsigned tautologicalThreshold = 100; // x <= tautologicalThreshold is always true.

inline bool isWithinThreshold(CellState cellState, unsigned threshold)
{
    return static_cast<unsigned>(cellState) <= threshold;
}

} // namespace JSC
