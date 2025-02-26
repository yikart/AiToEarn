/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include <cstdint>
#include <wtf/Assertions.h>

namespace JSC {

class VM;

namespace DFG {

struct DoesGCCheck {
    enum class Special {
        Uninitialized,
        DFGOSRExit,
        FTLOSRExit,
        NumberOfSpecials
    };

    DoesGCCheck()
    {
        u.encoded = encode(true, Special::Uninitialized);
    }

    static uint64_t encode(bool expectDoesGC, unsigned nodeIndex, unsigned nodeOp)
    {
        Union un;
        un.nodeIndex = nodeIndex;
        un.other = (nodeOp << nodeOpShift) | bits(expectDoesGC);
        return un.encoded;
    }

    static uint64_t encode(bool expectDoesGC, Special special)
    {
        Union un;
        un.nodeIndex = 0;
        un.other = bits(special) << specialShift | isSpecialBit | bits(expectDoesGC);
        return un.encoded;
    }

    void set(bool expectDoesGC, unsigned nodeIndex, unsigned nodeOp)
    {
        u.encoded = encode(expectDoesGC, nodeIndex, nodeOp);
    }

    void set(bool expectDoesGC, Special special)
    {
        u.encoded = encode(expectDoesGC, special);
    }

    bool expectDoesGC() const { return u.other & expectDoesGCBit; }
    bool isSpecial() const { return u.other & isSpecialBit; }
    Special special() { return static_cast<Special>(u.other >> specialShift); }
    unsigned nodeOp() { return (u.other >> nodeOpShift) & nodeOpMask; }
    unsigned nodeIndex() { return u.nodeIndex; }

#if ENABLE(DFG_DOES_GC_VALIDATION)
    JS_EXPORT_PRIVATE void verifyCanGC(VM&);
#endif

private:
    template<typename T> static uint32_t bits(T value) { return static_cast<uint32_t>(value); }

    // The value cannot be both a Special and contain node information at the
    // time. Hence, the 2 can have separate encodings. The isSpecial bit
    // determines which encoding is in use.

    static constexpr unsigned expectDoesGCBit = 1 << 0;
    static constexpr unsigned isSpecialBit = 1 << 1;
    static constexpr unsigned commonBits = 2;
    static_assert((expectDoesGCBit | isSpecialBit) == (1 << commonBits) - 1);

    static constexpr unsigned specialShift = commonBits;

    static constexpr unsigned nodeOpBits = 9;
    static constexpr unsigned nodeOpMask = (1 << nodeOpBits) - 1;
    static constexpr unsigned nodeOpShift = commonBits;

public:
    union Union {
        struct {
            uint32_t other;
            uint32_t nodeIndex;
        };
        uint64_t encoded;
    } u;
};

} // namespace DFG

using DFG::DoesGCCheck;

} // namespace JSC
