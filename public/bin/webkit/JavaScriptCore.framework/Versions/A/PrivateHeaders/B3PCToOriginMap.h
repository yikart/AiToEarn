/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#if ENABLE(B3_JIT)

#include "B3Origin.h"
#include "MacroAssembler.h"
#include <wtf/Vector.h>

namespace JSC { namespace B3 {

class PCToOriginMap {
    WTF_MAKE_NONCOPYABLE(PCToOriginMap);
public:
    PCToOriginMap()
    { }

    PCToOriginMap(PCToOriginMap&& other)
        : m_ranges(WTFMove(other.m_ranges))
    { }

    struct OriginRange {
        MacroAssembler::Label label;
        Origin origin;
    };

    void appendItem(MacroAssembler::Label label, Origin origin)
    {
        if (m_ranges.size()) {
            if (m_ranges.last().label == label)
                return;
        }

        m_ranges.append(OriginRange{label, origin});
    }

    const Vector<OriginRange>& ranges() const  { return m_ranges; }

private:
    Vector<OriginRange, 0> m_ranges;
};

} } // namespace JSC::B3

#endif // ENABLE(B3_JIT)
