/*
 * Copyright (C) 2019-2024 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY_OMGJIT) || ENABLE(WEBASSEMBLY_BBQJIT)

#include "B3Type.h"
#include "B3ValueRep.h"
#include "WasmFormat.h"
#include <wtf/FixedVector.h>
#include <wtf/TZoneMalloc.h>

namespace JSC { namespace Wasm {

class OSREntryValue final : public B3::ValueRep {
public:
    OSREntryValue() = default;
    OSREntryValue(const B3::ValueRep& valueRep, B3::Type type)
        : B3::ValueRep(valueRep)
        , m_type(type)
    {
    }

    B3::Type type() const { return m_type; }

private:
    B3::Type m_type { };
};

class OSREntryData {
    WTF_MAKE_NONCOPYABLE(OSREntryData);
    WTF_MAKE_TZONE_ALLOCATED(OSREntryData);
public:
    OSREntryData(FunctionCodeIndex functionIndex, uint32_t loopIndex, StackMap&& stackMap)
        : m_functionIndex(functionIndex)
        , m_loopIndex(loopIndex)
        , m_values(WTFMove(stackMap))
    {
    }

    FunctionCodeIndex functionIndex() const { return m_functionIndex; }
    uint32_t loopIndex() const { return m_loopIndex; }
    const StackMap& values() { return m_values; }

private:
    FunctionCodeIndex m_functionIndex;
    uint32_t m_loopIndex;
    StackMap m_values;
};

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY_OMGJIT)
