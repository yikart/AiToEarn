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

#if ENABLE(JIT)

#include "CodeOrigin.h"
#include "MacroAssembler.h"
#include "VM.h"
#include <wtf/Vector.h>

namespace JSC {

#if ENABLE(FTL_JIT) || ENABLE(WEBASSEMBLY_OMGJIT) || ENABLE(WEBASSEMBLY_BBQJIT)
namespace B3 {
class PCToOriginMap;
}
#endif

class LinkBuffer;
class PCToCodeOriginMapBuilder;

class PCToCodeOriginMapBuilder {
    WTF_MAKE_TZONE_ALLOCATED(PCToCodeOriginMapBuilder);
    WTF_MAKE_NONCOPYABLE(PCToCodeOriginMapBuilder);
    friend class PCToCodeOriginMap;

public:
    PCToCodeOriginMapBuilder(VM&);
    PCToCodeOriginMapBuilder(PCToCodeOriginMapBuilder&& other);
    PCToCodeOriginMapBuilder(bool shouldBuildMapping)
        : m_shouldBuildMapping(shouldBuildMapping)
    { }

#if ENABLE(FTL_JIT)
    enum JSTag { JSCodeOriginMap };
    PCToCodeOriginMapBuilder(JSTag, VM&, B3::PCToOriginMap);
#endif

#if ENABLE(WEBASSEMBLY_OMGJIT) || ENABLE(WEBASSEMBLY_BBQJIT)
    enum WasmTag { WasmCodeOriginMap };
    PCToCodeOriginMapBuilder(WasmTag, B3::PCToOriginMap);
#endif

    void appendItem(MacroAssembler::Label label, const CodeOrigin& origin)
    {
        if (!m_shouldBuildMapping)
            return;
        appendItemSlow(label, origin);
    }
    static CodeOrigin defaultCodeOrigin() { return CodeOrigin(BytecodeIndex(0)); }

    bool didBuildMapping() const { return m_shouldBuildMapping; }

private:
    void appendItemSlow(MacroAssembler::Label, const CodeOrigin&);

    struct CodeRange {
        MacroAssembler::Label start;
        MacroAssembler::Label end;
        CodeOrigin codeOrigin;
    };

    Vector<CodeRange> m_codeRanges;
    bool m_shouldBuildMapping;
};

// FIXME: <rdar://problem/39436658>
class PCToCodeOriginMap {
    WTF_MAKE_TZONE_ALLOCATED(PCToCodeOriginMap);
    WTF_MAKE_NONCOPYABLE(PCToCodeOriginMap);
public:
    PCToCodeOriginMap(PCToCodeOriginMapBuilder&&, LinkBuffer&);
    ~PCToCodeOriginMap();

    std::optional<CodeOrigin> findPC(void* pc) const;

    double memorySize();

private:
    size_t m_compressedPCBufferSize;
    size_t m_compressedCodeOriginsSize;
    uint8_t* m_compressedPCs;
    uint8_t* m_compressedCodeOrigins;
    uintptr_t m_pcRangeStart;
    uintptr_t m_pcRangeEnd;
};

} // namespace JSC

#endif // ENABLE(JIT)
