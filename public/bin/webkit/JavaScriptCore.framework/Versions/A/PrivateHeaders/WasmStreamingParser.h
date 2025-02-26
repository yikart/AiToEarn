/*
 * Copyright (C) 2018 Yusuke Suzuki <yusukesuzuki@slowstart.org>.
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

#if ENABLE(WEBASSEMBLY)

#include "WasmFormat.h"
#include "WasmSections.h"
#include <wtf/CrossThreadCopier.h>
#include <wtf/SHA1.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace JSC { namespace Wasm {

struct FunctionData;
struct ModuleInformation;

enum class CompilerMode : uint8_t { FullCompile, Validation };

class StreamingParserClient {
public:
    virtual ~StreamingParserClient() = default;
    virtual bool didReceiveSectionData(Section) { return true; };
    virtual bool didReceiveFunctionData(FunctionCodeIndex, const FunctionData&) = 0;
    virtual void didFinishParsing() { }
};

class StreamingParser {
    WTF_MAKE_TZONE_ALLOCATED(StreamingParser);
public:
    // The layout of the Wasm module is the following.
    //
    // Module:       [ Header ][ Section ]*
    // Section:      [ ID ][ SizeOfPayload ][ Payload ]
    // Code Section: [ ID ][ SizeOfPayload ][                   Payload of Code Section                   ]
    //                                      [ NumberOfFunctions ]([ SizeOfFunction ][ PayloadOfFunction ])*
    //
    // Basically we can parse Wasm sections by repeatedly (1) reading the size of the payload, and (2) reading the payload based on the size read in (1).
    // So this streaming parser handles Section as the unit for incremental parsing. The exception is the Code section. The Code section is large since it
    // includes all the functions in the wasm module. Since we would like to compile each function and parse the Code section concurrently, the streaming
    // parser specially handles the Code section. In the Code section, the streaming parser uses Function as the unit for incremental parsing.
    enum class State : uint8_t {
        ModuleHeader,
        SectionID,
        SectionSize,
        SectionPayload,
        CodeSectionSize,
        FunctionSize,
        FunctionPayload,
        Finished,
        FatalError,
    };

    enum class IsEndOfStream : bool { No, Yes };

    StreamingParser(ModuleInformation&, StreamingParserClient&);

    State addBytes(std::span<const uint8_t> bytes) { return addBytes(bytes, IsEndOfStream::No); }
    State finalize();

    String errorMessage() const { return crossThreadCopy(m_errorMessage); }

    void reportError() { moveToStateIfNotFailed(failOnState(State::FatalError)); }

private:
    static constexpr unsigned moduleHeaderSize = 8;
    static constexpr unsigned sectionIDSize = 1;

    JS_EXPORT_PRIVATE State addBytes(std::span<const uint8_t> bytes, IsEndOfStream);

    State parseModuleHeader(Vector<uint8_t>&&);
    State parseSectionID(Vector<uint8_t>&&);
    State parseSectionSize(uint32_t);
    State parseSectionPayload(Vector<uint8_t>&&);

    State parseCodeSectionSize(uint32_t);
    State parseFunctionSize(uint32_t);
    State parseFunctionPayload(Vector<uint8_t>&&);

    std::optional<Vector<uint8_t>> consume(std::span<const uint8_t> bytes, size_t&, size_t);
    Expected<uint32_t, State> consumeVarUInt32(std::span<const uint8_t> bytes, size_t&, IsEndOfStream);

    void moveToStateIfNotFailed(State);
    template <typename ...Args> NEVER_INLINE State WARN_UNUSED_RETURN fail(Args...);

    State failOnState(State);

    Ref<ModuleInformation> m_info;
    StreamingParserClient& m_client;
    Vector<uint8_t> m_remaining;
    String m_errorMessage;

    CheckedSize m_totalSize { 0 };
    size_t m_offset { 0 };
    size_t m_nextOffset { 0 };
    size_t m_codeOffset { 0 };

    SHA1 m_hasher;

    uint32_t m_sectionLength { 0 };

    uint32_t m_functionCount { 0 };
    uint32_t m_functionIndex { 0 };

    uint32_t m_functionSize { 0 };

    Lock m_stateLock;
    State m_state { State::ModuleHeader };
    Section m_section { Section::Begin };
    Section m_previousKnownSection { Section::Begin };

#if ASSERT_ENABLED
    Vector<uint8_t> m_buffer;
#endif
};


} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
