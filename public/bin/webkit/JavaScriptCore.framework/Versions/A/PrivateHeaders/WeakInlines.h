/*
 * Copyright (C) 2009, 2012, 2013, 2016 Apple Inc. All rights reserved.
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

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include "JSCast.h"
#include "WeakSetInlines.h"
#include <wtf/Assertions.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

namespace JSC {

template<typename T> inline Weak<T>::Weak(T* cell, WeakHandleOwner* weakOwner, void* context)
    : m_impl(cell ? WeakSet::allocate(cell, weakOwner, context) : nullptr)
{
}

template<typename T> inline bool Weak<T>::isHashTableDeletedValue() const
{
    return impl() == hashTableDeletedValue();
}

template<typename T> inline Weak<T>::Weak(WTF::HashTableDeletedValueType)
    : m_impl(hashTableDeletedValue())
{
}

template<typename T> inline Weak<T>::Weak(Weak&& other)
    : m_impl(other.leakImpl())
{
}

template<class T> inline void swap(Weak<T>& a, Weak<T>& b)
{
    a.swap(b);
}

template<typename T> inline void Weak<T>::swap(Weak& other)
{
    std::swap(m_impl, other.m_impl);
}

template<typename T> inline auto Weak<T>::operator=(Weak&& other) -> Weak&
{
    Weak weak = WTFMove(other);
    swap(weak);
    return *this;
}

template <typename T>
inline void Weak<T>::set(VM&, T* value)
{
    *this = value;
}

template<typename T> inline T* Weak<T>::operator->() const
{
    auto* pointer = impl();
    ASSERT(pointer && pointer->state() == WeakImpl::Live);
    // We can't use jsCast here since we could be called in a finalizer.
    return static_cast<T*>(pointer->jsValue().asCell());
}

template<typename T> inline T& Weak<T>::operator*() const
{
    auto* pointer = impl();
    ASSERT(pointer && pointer->state() == WeakImpl::Live);
    // We can't use jsCast here since we could be called in a finalizer.
    return *static_cast<T*>(pointer->jsValue().asCell());
}

template<typename T> inline T* Weak<T>::get() const
{
    auto* pointer = impl();
    if (!pointer || pointer->state() != WeakImpl::Live)
        return nullptr;
    // We can't use jsCast here since we could be called in a finalizer.
    return static_cast<T*>(pointer->jsValue().asCell());
}

template<typename T> inline bool Weak<T>::was(T* other) const
{
    return static_cast<T*>(m_impl->jsValue().asCell()) == other;
}

template<typename T> inline bool Weak<T>::operator!() const
{
    auto* pointer = impl();
    return !pointer || !pointer->jsValue() || pointer->state() != WeakImpl::Live;
}

template<typename T> inline Weak<T>::operator bool() const
{
    return !!*this;
}

template<typename T> inline WeakImpl* Weak<T>::leakImpl()
{
    auto* pointer = impl();
    m_impl = nullptr;
    return pointer;
}

template<typename T> inline WeakImpl* Weak<T>::hashTableDeletedValue()
{
    return reinterpret_cast<WeakImpl*>(-1);
}

template <typename T> inline bool operator==(const Weak<T>& lhs, const Weak<T>& rhs)
{
    return lhs.get() == rhs.get();
}

template<typename T> inline bool operator==(const Weak<T>& lhs, const T* rhs)
{
    return lhs.get() == rhs;
}

template<typename T> inline bool operator==(const T* lhs, const Weak<T>& rhs)
{
    return lhs == rhs.get();
}

// This function helps avoid modifying a weak table while holding an iterator into it. (Object allocation
// can run a finalizer that modifies the table. We avoid that by requiring a pre-constructed object as our value.)
template<typename Map, typename Key, typename Value> inline void weakAdd(Map& map, const Key& key, Value&& value)
{
    ASSERT(!map.get(key));
    map.set(key, std::forward<Value>(value)); // The table may still have a zombie for value.
}

template<typename Map, typename Key, typename Value> inline void weakRemove(Map& map, const Key& key, Value value)
{
    typename Map::iterator it = map.find(key);
    ASSERT_UNUSED(value, value);
    ASSERT(it != map.end());
    ASSERT(it->value.was(value));
    ASSERT(!it->value);
    map.remove(it);
}

template<typename T> inline void weakClear(Weak<T>& weak, T* cell)
{
    ASSERT_UNUSED(cell, cell);
    ASSERT(weak.was(cell));
    ASSERT(!weak);
    weak.clear();
}

} // namespace JSC
