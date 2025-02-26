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

#include "AuxiliaryBarrier.h"
#include <wtf/CagedPtr.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class JSCell;
class VM;

// This is a convenient combo of AuxiliaryBarrier and CagedPtr.

template<Gigacage::Kind passedKind, typename T>
class CagedBarrierPtr {
public:
    static constexpr Gigacage::Kind kind = passedKind;
    using Type = T;
    using CagedType = CagedPtr<kind, Type>;
    
    CagedBarrierPtr() = default;
    
    template<typename U>
    CagedBarrierPtr(VM& vm, JSCell* cell, U&& value)
    {
        m_barrier.set(vm, cell, CagedType(std::forward<U>(value)));
    }
    
    void clear() { m_barrier.clear(); }
    
    template<typename U>
    void set(VM& vm, JSCell* cell, U&& value)
    {
        m_barrier.set(vm, cell, CagedType(std::forward<U>(value)));
    }
    
    T* get() const { return m_barrier.get().get(); }
    T* getMayBeNull() const { return m_barrier.get().getMayBeNull(); }
    T* getUnsafe() const { return m_barrier.get().getUnsafe(); }

    // We need the template here so that the type of U is deduced at usage time rather than class time. U should always be T.
    template<typename U = T>
    typename std::enable_if<!std::is_same<void, U>::value, T>::type&
    /* T& */ at(size_t index) const { return get()[index]; }

    bool operator==(const CagedBarrierPtr& other) const
    {
        return m_barrier.get() == other.m_barrier.get();
    }
    
    explicit operator bool() const
    {
        return !!m_barrier.get();
    }
    
    template<typename U>
    void setWithoutBarrier(U&& value) { m_barrier.setWithoutBarrier(CagedType(std::forward<U>(value))); }

    T* rawBits() const
    {
        return m_barrier.get().rawBits();
    }
    
private:
    AuxiliaryBarrier<CagedType> m_barrier;
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
