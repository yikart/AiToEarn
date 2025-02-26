/*
 * Copyright (C) 2009-2019 Apple Inc. All rights reserved.
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

#include "JSExportMacros.h"
#include <cstddef>
#include <wtf/Atomics.h>
#include <wtf/HashTraits.h>
#include <wtf/Noncopyable.h>
#include <wtf/VectorTraits.h>

namespace JSC {

class WeakImpl;
class WeakHandleOwner;
class VM;

template<typename T> class Weak {
    WTF_MAKE_NONCOPYABLE(Weak);
public:
    Weak() = default;

    constexpr Weak(std::nullptr_t)
        : Weak()
    {
    }

    Weak(T*, WeakHandleOwner* = nullptr, void* context = nullptr);
    Weak(VM&, T* t, WeakHandleOwner* owner = nullptr, void* context = nullptr)
        : Weak(t, owner, context)
    {
    }

    bool isHashTableDeletedValue() const;
    Weak(WTF::HashTableDeletedValueType);
    constexpr bool isHashTableEmptyValue() const { return !impl(); }

    Weak(Weak&&);

    ~Weak()
    {
        clear();
    }

    inline void swap(Weak&);

    inline Weak& operator=(Weak&&);

    inline bool operator!() const;
    inline T* operator->() const;
    inline T& operator*() const;
    inline T* get() const;

    inline void set(VM&, T*);

    inline bool was(T*) const;

    inline explicit operator bool() const;

    inline WeakImpl* leakImpl() WARN_UNUSED_RETURN;
    WeakImpl* unsafeImpl() const { return impl(); }
    void clear();

private:
    static inline WeakImpl* hashTableDeletedValue();
    WeakImpl* impl() const { return m_impl; }

    WeakImpl* m_impl { nullptr };
};

} // namespace JSC

namespace WTF {

template<typename T> struct VectorTraits<JSC::Weak<T>> : SimpleClassVectorTraits {
    static constexpr bool canCompareWithMemcmp = false;
};

template<typename T> struct HashTraits<JSC::Weak<T>> : SimpleClassHashTraits<JSC::Weak<T>> {
    typedef JSC::Weak<T> StorageType;

    typedef std::nullptr_t EmptyValueType;
    static EmptyValueType emptyValue() { return nullptr; }

    static constexpr bool hasIsEmptyValueFunction = true;
    static bool isEmptyValue(const JSC::Weak<T>& value) { return value.isHashTableEmptyValue(); }

    typedef T* PeekType;
    static PeekType peek(const StorageType& value) { return value.get(); }
    static PeekType peek(EmptyValueType) { return PeekType(); }
};

} // namespace WTF
