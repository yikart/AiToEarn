/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#include "JSCJSValue.h"
#include "Weak.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class WeakHandleOwner;

class WeakImpl {
public:
    enum State {
        Live        = 0x0,
        Dead        = 0x1,
        Finalized   = 0x2,
        Deallocated = 0x3
    };

    enum {
        StateMask   = 0x3
    };

    WeakImpl();
    WeakImpl(JSValue, WeakHandleOwner*, void* context);

    State state();
    void setState(State);
    void clear();

    const JSValue& jsValue();
    static constexpr ptrdiff_t offsetOfJSValue() { return OBJECT_OFFSETOF(WeakImpl, m_jsValue); }
    WeakHandleOwner* weakHandleOwner();
    static constexpr ptrdiff_t offsetOfWeakHandleOwner() { return OBJECT_OFFSETOF(WeakImpl, m_weakHandleOwner); }
    void* context();

    static WeakImpl* asWeakImpl(JSValue*);

private:
    const JSValue m_jsValue;
    WeakHandleOwner* m_weakHandleOwner;
    void* m_context { nullptr };
};

inline WeakImpl::WeakImpl()
    : m_weakHandleOwner(std::bit_cast<WeakHandleOwner*>(static_cast<uintptr_t>(Deallocated)))
{
}

inline void WeakImpl::clear()
{
    ASSERT(Deallocated >= this->state());
    m_weakHandleOwner = std::bit_cast<WeakHandleOwner*>(static_cast<uintptr_t>(Deallocated));
}

inline WeakImpl::WeakImpl(JSValue jsValue, WeakHandleOwner* weakHandleOwner, void* context)
    : m_jsValue(jsValue)
    , m_weakHandleOwner(weakHandleOwner)
    , m_context(context)
{
    ASSERT(state() == Live);
    ASSERT(m_jsValue && m_jsValue.isCell());
}

inline WeakImpl::State WeakImpl::state()
{
    return static_cast<State>(reinterpret_cast<uintptr_t>(m_weakHandleOwner) & StateMask);
}

inline void WeakImpl::setState(WeakImpl::State state)
{
    ASSERT(state >= this->state());
    m_weakHandleOwner = reinterpret_cast<WeakHandleOwner*>((reinterpret_cast<uintptr_t>(m_weakHandleOwner) & ~StateMask) | state);
}

inline const JSValue& WeakImpl::jsValue()
{
    return m_jsValue;
}

inline WeakHandleOwner* WeakImpl::weakHandleOwner()
{
    return reinterpret_cast<WeakHandleOwner*>((reinterpret_cast<uintptr_t>(m_weakHandleOwner) & ~StateMask));
}

inline void* WeakImpl::context()
{
    return m_context;
}

inline WeakImpl* WeakImpl::asWeakImpl(JSValue* slot)
{
    return reinterpret_cast_ptr<WeakImpl*>(reinterpret_cast_ptr<char*>(slot) + OBJECT_OFFSETOF(WeakImpl, m_jsValue));
}

template<typename T>
inline void Weak<T>::clear()
{
    auto* pointer = impl();
    if (!pointer)
        return;
    pointer->clear();
    m_impl = nullptr;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
