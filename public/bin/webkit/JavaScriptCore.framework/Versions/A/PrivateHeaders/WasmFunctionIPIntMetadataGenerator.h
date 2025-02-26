/*
 * Copyright (C) 2023-2024 Apple Inc. All rights reserved.
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

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#if ENABLE(WEBASSEMBLY)

#include "BytecodeConventions.h"
#include "HandlerInfo.h"
#include "InstructionStream.h"
#include "MacroAssemblerCodeRef.h"
#include "SIMDInfo.h"
#include "WasmHandlerInfo.h"
#include "WasmIPIntGenerator.h"
#include "WasmIPIntTierUpCounter.h"
#include "WasmOps.h"
#include <wtf/BitVector.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace JSC {

class JITCode;

template <typename Traits>
class BytecodeGeneratorBase;

namespace Wasm {

class IPIntCallee;
class TypeDefinition;
struct IPIntGeneratorTraits;
struct JumpTableEntry;

#define WRITE_TO_METADATA(dst, src, type) \
    do { \
        type tmp = src; \
        memcpy(dst, &tmp, sizeof(type)); \
    } while (false)

class FunctionIPIntMetadataGenerator {
    WTF_MAKE_TZONE_ALLOCATED(FunctionIPIntMetadataGenerator);
    WTF_MAKE_NONCOPYABLE(FunctionIPIntMetadataGenerator);

    friend class IPIntGenerator;
    friend class IPIntCallee;

public:
    FunctionIPIntMetadataGenerator(FunctionCodeIndex functionIndex, std::span<const uint8_t> bytecode)
        : m_functionIndex(functionIndex)
        , m_bytecode(bytecode)
    {
    }

    FunctionCodeIndex functionIndex() const { return m_functionIndex; }
    const BitVector& tailCallSuccessors() const { return m_tailCallSuccessors; }
    bool tailCallClobbersInstance() const { return m_tailCallClobbersInstance ; }
    void setTailCall(uint32_t, bool);
    void setTailCallClobbersInstance() { m_tailCallClobbersInstance = true; }

    FixedBitVector&& takeCallees() { return WTFMove(m_callees); }

    const uint8_t* getBytecode() const { return m_bytecode.data(); }
    const uint8_t* getMetadata() const { return m_metadata.data(); }

    UncheckedKeyHashMap<IPIntPC, IPIntTierUpCounter::OSREntryData>& tierUpCounter() { return m_tierUpCounter; }

    unsigned addSignature(const TypeDefinition&);

private:

    inline void addBlankSpace(size_t);
    template <typename T> inline void addBlankSpace() { addBlankSpace(sizeof(T)); };

    template <typename T> inline void appendMetadata(T t)
    {
        auto size = m_metadata.size();
        addBlankSpace<T>();
        WRITE_TO_METADATA(m_metadata.data() + size, t, T);
    };

    void addLength(size_t length);
    void addLEB128ConstantInt32AndLength(uint32_t value, size_t length);
    void addLEB128ConstantAndLengthForType(Type, uint64_t value, size_t length);
    void addLEB128V128Constant(v128_t value, size_t length);
    void addReturnData(const FunctionSignature&);

    FunctionCodeIndex m_functionIndex;
    bool m_tailCallClobbersInstance { false };
    FixedBitVector m_callees;
    BitVector m_tailCallSuccessors;

    std::span<const uint8_t> m_bytecode;
    Vector<uint8_t> m_metadata { };
    Vector<uint8_t, 8> m_uINTBytecode { };
    unsigned m_highestReturnStackOffset;

    uint32_t m_bytecodeOffset { 0 };
    unsigned m_maxFrameSizeInV128 { 0 };
    unsigned m_numLocals { 0 };
    unsigned m_numAlignedRethrowSlots { 0 };
    unsigned m_numArguments { 0 };
    unsigned m_numArgumentsOnStack { 0 };
    unsigned m_nonArgLocalOffset { 0 };
    Vector<uint8_t, 16> m_argumINTBytecode { };

    Vector<const TypeDefinition*> m_signatures;
    UncheckedKeyHashMap<IPIntPC, IPIntTierUpCounter::OSREntryData> m_tierUpCounter;
    Vector<UnlinkedHandlerInfo> m_exceptionHandlers;
};

void FunctionIPIntMetadataGenerator::addBlankSpace(size_t size)
{
    m_metadata.grow(m_metadata.size() + size);
}

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
