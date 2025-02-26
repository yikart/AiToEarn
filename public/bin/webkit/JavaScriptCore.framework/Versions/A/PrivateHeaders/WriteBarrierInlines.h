/*
 * Copyright (C) 2014-2021 Apple Inc. All rights reserved.
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

#include "VM.h"
#include "WriteBarrier.h"

namespace JSC {

template <typename T, typename Traits>
inline void WriteBarrierBase<T, Traits>::set(VM& vm, const JSCell* owner, T* value)
{
    ASSERT(value);
    ASSERT(!Options::useConcurrentJIT() || !isCompilationThread());
    validateCell(value);
    setEarlyValue(vm, owner, value);
}

template <typename T, typename Traits>
inline void WriteBarrierBase<T, Traits>::setMayBeNull(VM& vm, const JSCell* owner, T* value)
{
    if (value)
        validateCell(value);
    setEarlyValue(vm, owner, value);
}

template <typename T, typename Traits>
inline void WriteBarrierBase<T, Traits>::setEarlyValue(VM& vm, const JSCell* owner, T* value)
{
    Traits::exchange(this->m_cell, value);
    vm.writeBarrier(owner, static_cast<JSCell*>(value));
}

inline void WriteBarrierBase<Unknown, RawValueTraits<Unknown>>::set(VM& vm, const JSCell* owner, JSValue value)
{
    ASSERT(!Options::useConcurrentJIT() || !isCompilationThread());
    updateEncodedJSValueConcurrent(m_value, JSValue::encode(value));
    vm.writeBarrier(owner, value);
}

inline void WriteBarrierStructureID::set(VM& vm, const JSCell* owner, Structure* value)
{
    ASSERT(value);
    ASSERT(!Options::useConcurrentJIT() || !isCompilationThread());
    validateCell(reinterpret_cast<JSCell*>(value));
    setEarlyValue(vm, owner, value);
}

inline void WriteBarrierStructureID::setMayBeNull(VM& vm, const JSCell* owner, Structure* value)
{
    if (value)
        validateCell(reinterpret_cast<JSCell*>(value));
    setEarlyValue(vm, owner, value);
}

inline void WriteBarrierStructureID::setEarlyValue(VM& vm, const JSCell* owner, Structure* value)
{
    if (!value) {
        m_structureID = { };
        return;
    }
    m_structureID = StructureID::encode(value);
    vm.writeBarrier(owner, reinterpret_cast<JSCell*>(value));
}

} // namespace JSC 
