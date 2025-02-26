/*
 * Copyright (C) 2019-2021 Apple Inc. All rights reserved.
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

#include "JSObject.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

// This is used for sharing interface and implementation. It should not have its own classInfo.
template<unsigned passedNumberOfInternalFields = 1>
class JSInternalFieldObjectImpl : public JSNonFinalObject {
public:
    friend class LLIntOffsetsExtractor;

    using Base = JSNonFinalObject;
    static constexpr unsigned numberOfInternalFields = passedNumberOfInternalFields;

    template<typename CellType, SubspaceAccess>
    static void subspaceFor(VM&)
    {
        RELEASE_ASSERT_NOT_REACHED();
    }

    static size_t allocationSize(Checked<size_t> inlineCapacity)
    {
        ASSERT_UNUSED(inlineCapacity, !inlineCapacity);
        return sizeof(JSInternalFieldObjectImpl);
    }

    const WriteBarrier<Unknown>& internalField(unsigned index) const
    {
        ASSERT(index < numberOfInternalFields);
        return m_internalFields[index];
    }

    WriteBarrier<Unknown>& internalField(unsigned index)
    {
        ASSERT(index < numberOfInternalFields);
        return m_internalFields[index];
    }

    static constexpr ptrdiff_t offsetOfInternalFields() { return OBJECT_OFFSETOF(JSInternalFieldObjectImpl, m_internalFields); }
    static constexpr ptrdiff_t offsetOfInternalField(unsigned index) { return OBJECT_OFFSETOF(JSInternalFieldObjectImpl, m_internalFields) + index * sizeof(WriteBarrier<Unknown>); }

protected:
    DECLARE_VISIT_CHILDREN;

    JSInternalFieldObjectImpl(VM& vm, Structure* structure)
        : Base(vm, structure)
    {
    }

    WriteBarrier<Unknown> m_internalFields[numberOfInternalFields] { };
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
