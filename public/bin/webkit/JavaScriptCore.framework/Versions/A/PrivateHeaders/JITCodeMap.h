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

#if ENABLE(JIT)

#include "BytecodeIndex.h"
#include "CodeLocation.h"
#include <wtf/MallocPtr.h>
#include <wtf/StdLibExtras.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(JITCodeMap);

class JITCodeMap {
public:
    static_assert(std::is_trivially_destructible_v<BytecodeIndex>);
    static_assert(std::is_trivially_destructible_v<CodeLocationLabel<JSEntryPtrTag>>);
    static_assert(alignof(CodeLocationLabel<JSEntryPtrTag>) >= alignof(BytecodeIndex), "Putting CodeLocationLabel vector first since we can avoid alignment consideration of BytecodeIndex vector");
    JITCodeMap() = default;
    JITCodeMap(Vector<BytecodeIndex>&& indexes, Vector<CodeLocationLabel<JSEntryPtrTag>>&& codeLocations)
        : m_size(indexes.size())
    {
        ASSERT(indexes.size() == codeLocations.size());
        m_pointer = MallocPtr<uint8_t, JITCodeMapMalloc>::malloc(sizeof(CodeLocationLabel<JSEntryPtrTag>) * m_size + sizeof(BytecodeIndex) * m_size);
        std::copy(codeLocations.begin(), codeLocations.end(), this->codeLocations());
        std::copy(indexes.begin(), indexes.end(), this->indexes());
    }

    CodeLocationLabel<JSEntryPtrTag> find(BytecodeIndex bytecodeIndex) const
    {
        auto* index = binarySearch<BytecodeIndex, BytecodeIndex>(indexes(), m_size, bytecodeIndex, [] (BytecodeIndex* index) { return *index; });
        if (!index)
            return CodeLocationLabel<JSEntryPtrTag>();
        return codeLocations()[index - indexes()];
    }

    explicit operator bool() const { return m_size; }

private:
    CodeLocationLabel<JSEntryPtrTag>* codeLocations() const
    {
        return std::bit_cast<CodeLocationLabel<JSEntryPtrTag>*>(m_pointer.get());
    }

    BytecodeIndex* indexes() const
    {
        return std::bit_cast<BytecodeIndex*>(m_pointer.get() + sizeof(CodeLocationLabel<JSEntryPtrTag>) * m_size);
    }

    MallocPtr<uint8_t, JITCodeMapMalloc> m_pointer;
    unsigned m_size { 0 };
};

class JITCodeMapBuilder {
    WTF_MAKE_NONCOPYABLE(JITCodeMapBuilder);
public:
    JITCodeMapBuilder() = default;
    void append(BytecodeIndex bytecodeIndex, CodeLocationLabel<JSEntryPtrTag> codeLocation)
    {
        m_indexes.append(bytecodeIndex);
        m_codeLocations.append(codeLocation);
    }

    JITCodeMap finalize()
    {
        return JITCodeMap(WTFMove(m_indexes), WTFMove(m_codeLocations));
    }

private:
    Vector<BytecodeIndex> m_indexes;
    Vector<CodeLocationLabel<JSEntryPtrTag>> m_codeLocations;
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(JIT)
