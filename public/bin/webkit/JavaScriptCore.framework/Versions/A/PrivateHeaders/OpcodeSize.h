/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include <type_traits>

namespace JSC {

enum OpcodeSize {
    Narrow = 1,
    Wide16 = 2,
    Wide32 = 4,
};

template<OpcodeSize>
struct TypeBySize;

template<>
struct TypeBySize<OpcodeSize::Narrow> {
    using signedType = int8_t;
    using unsignedType = uint8_t;
};

template<>
struct TypeBySize<OpcodeSize::Wide16> {
    using signedType = int16_t;
    using unsignedType = uint16_t;
};

template<>
struct TypeBySize<OpcodeSize::Wide32> {
    using signedType = int32_t;
    using unsignedType = uint32_t;
};

template<OpcodeSize>
struct PaddingBySize;

template<>
struct PaddingBySize<OpcodeSize::Narrow> {
    static constexpr uint8_t value = 0;
};

template<>
struct PaddingBySize<OpcodeSize::Wide16> {
    static constexpr uint8_t value = 1;
};

template<>
struct PaddingBySize<OpcodeSize::Wide32> {
    static constexpr uint8_t value = 1;
};

template<typename Traits, OpcodeSize>
struct OpcodeIDWidthBySize;

template<typename Traits>
struct OpcodeIDWidthBySize<Traits, OpcodeSize::Narrow> {
    using opcodeType = uint8_t;
    static constexpr OpcodeSize opcodeIDSize = OpcodeSize::Narrow;
};

template<typename Traits>
struct OpcodeIDWidthBySize<Traits, OpcodeSize::Wide16> {
    using opcodeType = typename std::conditional<Traits::maxOpcodeIDWidth == OpcodeSize::Narrow, uint8_t, uint16_t>::type;
    static constexpr OpcodeSize opcodeIDSize = static_cast<OpcodeSize>(sizeof(opcodeType));
};

template<typename Traits>
struct OpcodeIDWidthBySize<Traits, OpcodeSize::Wide32> {
    using opcodeType = typename std::conditional<Traits::maxOpcodeIDWidth == OpcodeSize::Narrow, uint8_t, uint16_t>::type;
    static constexpr OpcodeSize opcodeIDSize = static_cast<OpcodeSize>(sizeof(opcodeType));
};

} // namespace JSC
