/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "WasmName.h"
#include "WasmNameSection.h"
#include <wtf/RefPtr.h>
#include <wtf/StdLibExtras.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class LLIntOffsetsExtractor;

namespace Wasm {

struct NameSection;

// Keep this class copyable when the world is stopped: do not allocate any memory while copying this.
// SamplingProfiler copies it while suspending threads.
struct IndexOrName {
    friend class JSC::LLIntOffsetsExtractor;
    typedef size_t Index;

private:
#if USE(JSVALUE32_64)
    enum class Kind : uint8_t {
        Empty,
        Index,
        Name
    };
#endif
public:

    IndexOrName()
    {
#if USE(JSVALUE64)
        m_indexName.index = emptyTag;
#elif USE(JSVALUE32_64)
        m_kind = Kind::Empty;
#endif
    }

    IndexOrName(Index, std::pair<const Name*, RefPtr<NameSection>>&&);

    bool isEmpty() const
    {
#if USE(JSVALUE64)
        return std::bit_cast<Index>(m_indexName) & emptyTag;
#elif USE(JSVALUE32_64)
        return m_kind == Kind::Empty;
#endif
    }

    bool isIndex() const
    {
#if USE(JSVALUE64)
        return std::bit_cast<Index>(m_indexName) & indexTag;
#elif USE(JSVALUE32_64)
        return m_kind == Kind::Index;
#endif
    }

    bool isName() const
    {
        return !(isEmpty() || isIndex());
    }

    Index index() const
    {
        ASSERT(isIndex());
#if USE(JSVALUE64)
        return m_indexName.index & ~indexTag;
#elif USE(JSVALUE32_64)
        return m_indexName.index;
#endif
    }

    const Name* name() const
    {
        ASSERT(isName());
        return m_indexName.name;
    }

    NameSection* nameSection() const { return m_nameSection.get(); }
    void dump(PrintStream&) const;

private:
    union {
        Index index;
        const Name* name;
    } m_indexName;
    RefPtr<NameSection> m_nameSection;

#if USE(JSVALUE64)
    public:
    // Use the top bits as tags. Neither pointers nor the function index space should use them.
    static constexpr Index indexTag = 1ull << (CHAR_BIT * sizeof(Index) - 1);
    static constexpr Index emptyTag = 1ull << (CHAR_BIT * sizeof(Index) - 2);
    static constexpr Index allTags = indexTag | emptyTag;
    private:
#elif USE(JSVALUE32_64)
    // Use an explicit tag as pointers might have high bits set
    Kind m_kind;
#endif
};

String makeString(const IndexOrName&);

} } // namespace JSC::Wasm
