/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "WriteBarrier.h"

namespace JSC {

class JSCell;
class VM;

// An Auxiliary barrier is a barrier that does not try to reason about the value being stored into
// it, other than interpreting a falsy value as not needing a barrier. It's OK to use this for either
// JSCells or any other kind of data, so long as it responds to operator!().
template<typename T>
class AuxiliaryBarrier {
public:
    using Type = T;
    
    AuxiliaryBarrier() = default;
    
    template<typename U>
    AuxiliaryBarrier(VM&, JSCell*, U&&);

    template<typename U>
    AuxiliaryBarrier(U&& value, WriteBarrierEarlyInitTag)
    {
        setWithoutBarrier(std::forward<U>(value));
    }
    
    void clear() { m_value = T(); }
    
    template<typename U>
    void set(VM&, JSCell*, U&&);
    
    const T& get() const { return m_value; }
    
    T* slot() { return &m_value; }
    
    explicit operator bool() const { return !!m_value; }
    
    template<typename U>
    void setWithoutBarrier(U&& value) { m_value = std::forward<U>(value); }

    T operator->() const { return get(); }
    
private:
    T m_value { };
};

} // namespace JSC
