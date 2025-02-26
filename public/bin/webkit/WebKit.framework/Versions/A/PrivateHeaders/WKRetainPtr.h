/*
 * Copyright (C) 2010 Apple Inc. All rights reserved.
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

#ifdef __cplusplus

#include <WebKit/WKType.h>
#include <algorithm>
#include <wtf/HashTraits.h>

namespace WebKit {

template<typename T> class WKRetainPtr {
public:
    using PtrType = T;
    using ValueType = std::remove_pointer_t<PtrType>;

    WKRetainPtr()
        : m_ptr(0)
    {
    }

    WKRetainPtr(PtrType ptr)
        : m_ptr(ptr)
    {
        if (ptr)
            WKRetain(ptr);
    }

    template<typename U> WKRetainPtr(const WKRetainPtr<U>& o)
        : m_ptr(o.get())
    {
        if (PtrType ptr = m_ptr)
            WKRetain(ptr);
    }
    
    WKRetainPtr(const WKRetainPtr& o)
        : m_ptr(o.m_ptr)
    {
        if (PtrType ptr = m_ptr)
            WKRetain(ptr);
    }

    template<typename U> WKRetainPtr(WKRetainPtr<U>&& o)
        : m_ptr(o.leakRef())
    {
    }
    
    WKRetainPtr(WKRetainPtr&& o)
        : m_ptr(o.leakRef())
    {
    }

    ~WKRetainPtr()
    {
        if (PtrType ptr = m_ptr)
            WKRelease(ptr);
    }

    // Hash table deleted values, which are only constructed and never copied or destroyed.
    WKRetainPtr(WTF::HashTableDeletedValueType)
        : m_ptr(hashTableDeletedValue())
    {
    }

    bool isHashTableDeletedValue() const { return m_ptr == hashTableDeletedValue(); }
    constexpr static T hashTableDeletedValue() { return reinterpret_cast<T>(-1); }

    PtrType get() const { return m_ptr; }

    void clear()
    {
        PtrType ptr = m_ptr;
        m_ptr = 0;
        if (ptr)
            WKRelease(ptr);
    }

    PtrType leakRef()
    {
        PtrType ptr = m_ptr;
        m_ptr = 0;
        return ptr;
    }
    
    PtrType operator->() const { return m_ptr; }
    bool operator!() const { return !m_ptr; }

    // This conversion operator allows implicit conversion to bool but not to other integer types.
    typedef PtrType WKRetainPtr::*UnspecifiedBoolType;
    operator UnspecifiedBoolType() const { return m_ptr ? &WKRetainPtr::m_ptr : 0; }

    WKRetainPtr& operator=(const WKRetainPtr&);
    template<typename U> WKRetainPtr& operator=(const WKRetainPtr<U>&);
    WKRetainPtr& operator=(PtrType);
    template<typename U> WKRetainPtr& operator=(U*);

    WKRetainPtr& operator=(WKRetainPtr&&);
    template<typename U> WKRetainPtr& operator=(WKRetainPtr<U>&&);

    void adopt(PtrType);
    void swap(WKRetainPtr&);

private:
    template<typename U> friend WKRetainPtr<U> adoptWK(U);
    enum WKAdoptTag { AdoptWK };
    WKRetainPtr(WKAdoptTag, PtrType ptr)
        : m_ptr(ptr) { }

    PtrType m_ptr;
};

template<typename T> inline WKRetainPtr<T>& WKRetainPtr<T>::operator=(const WKRetainPtr<T>& o)
{
    PtrType optr = o.get();
    if (optr)
        WKRetain(optr);
    PtrType ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        WKRelease(ptr);
    return *this;
}

template<typename T> template<typename U> inline WKRetainPtr<T>& WKRetainPtr<T>::operator=(const WKRetainPtr<U>& o)
{
    PtrType optr = o.get();
    if (optr)
        WKRetain(optr);
    PtrType ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        WKRelease(ptr);
    return *this;
}

template<typename T> inline WKRetainPtr<T>& WKRetainPtr<T>::operator=(PtrType optr)
{
    if (optr)
        WKRetain(optr);
    PtrType ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        WKRelease(ptr);
    return *this;
}

template<typename T> template<typename U> inline WKRetainPtr<T>& WKRetainPtr<T>::operator=(U* optr)
{
    if (optr)
        WKRetain(optr);
    PtrType ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        WKRelease(ptr);
    return *this;
}

template<typename T> inline WKRetainPtr<T>& WKRetainPtr<T>::operator=(WKRetainPtr<T>&& o)
{
    adopt(o.leakRef());
    return *this;
}

template<typename T> template<typename U> inline WKRetainPtr<T>& WKRetainPtr<T>::operator=(WKRetainPtr<U>&& o)
{
    adopt(o.leakRef());
    return *this;
}

template<typename T> inline void WKRetainPtr<T>::adopt(PtrType optr)
{
    PtrType ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        WKRelease(ptr);
}

template<typename T> inline void WKRetainPtr<T>::swap(WKRetainPtr<T>& o)
{
    std::swap(m_ptr, o.m_ptr);
}

template<typename T> inline void swap(WKRetainPtr<T>& a, WKRetainPtr<T>& b)
{
    a.swap(b);
}

template<typename T, typename U> inline bool operator==(const WKRetainPtr<T>& a, const WKRetainPtr<U>& b)
{ 
    return a.get() == b.get(); 
}

template<typename T, typename U> inline bool operator==(const WKRetainPtr<T>& a, U* b)
{ 
    return a.get() == b; 
}

template<typename T, typename U> inline bool operator==(T* a, const WKRetainPtr<U>& b) 
{
    return a == b.get(); 
}

#if (defined(WIN32) || defined(_WIN32)) && !((_MSC_VER > 1900) && __clang__)
template<typename T> inline WKRetainPtr<T> adoptWK(T) _Check_return_;
#else
template<typename T> inline WKRetainPtr<T> adoptWK(T) __attribute__((warn_unused_result));
#endif
template<typename T> inline WKRetainPtr<T> adoptWK(T o)
{
    return WKRetainPtr<T>(WKRetainPtr<T>::AdoptWK, o);
}

template<typename T> inline WKRetainPtr<T> retainWK(T ptr)
{
    return ptr;
}

} // namespace WebKit

using WebKit::WKRetainPtr;
using WebKit::adoptWK;
using WebKit::retainWK;

namespace WTF {

template<typename> struct IsSmartPtr;
template<typename> struct DefaultHash;

template<typename T> struct IsSmartPtr<WKRetainPtr<T>> {
    WTF_INTERNAL static const bool value = true;
    WTF_INTERNAL static constexpr bool isNullable = true;
};

template<typename P> struct DefaultHash<WKRetainPtr<P>> : PtrHash<WKRetainPtr<P>> { };

template<typename P> struct HashTraits<WKRetainPtr<P>> : SimpleClassHashTraits<WKRetainPtr<P>> {
    static P emptyValue() { return nullptr; }
    static bool isEmptyValue(const WKRetainPtr<P>& value) { return !value; }

    typedef P PeekType;
    static PeekType peek(const WKRetainPtr<P>& value) { return value.get(); }
    static PeekType peek(P value) { return value; }
};

} // namespace WTF

#endif
