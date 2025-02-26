/*
 * Copyright (C) 2005-2020 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSStringRef.h>
#include <algorithm>
#include <utility>

inline void JSRetain(JSClassRef context) { JSClassRetain(context); }
inline void JSRelease(JSClassRef context) { JSClassRelease(context); }
inline void JSRetain(JSGlobalContextRef context) { JSGlobalContextRetain(context); }
inline void JSRelease(JSGlobalContextRef context) { JSGlobalContextRelease(context); }
inline void JSRetain(JSStringRef string) { JSStringRetain(string); }
inline void JSRelease(JSStringRef string) { JSStringRelease(string); }

enum AdoptTag { Adopt };

template<typename T> class JSRetainPtr {
public:
    JSRetainPtr() = default;
    JSRetainPtr(T ptr) : m_ptr(ptr) { if (ptr) JSRetain(ptr); }
    JSRetainPtr(const JSRetainPtr&);
    JSRetainPtr(JSRetainPtr&&);
    ~JSRetainPtr();
    
    T get() const { return m_ptr; }
    
    void clear();
    T leakRef() WARN_UNUSED_RETURN;

    T operator->() const { return m_ptr; }
    
    bool operator!() const { return !m_ptr; }
    explicit operator bool() const { return m_ptr; }

    JSRetainPtr& operator=(const JSRetainPtr&);
    JSRetainPtr& operator=(JSRetainPtr&&);
    JSRetainPtr& operator=(T);

    void swap(JSRetainPtr&);

    friend JSRetainPtr<JSStringRef> adopt(JSStringRef);
    friend JSRetainPtr<JSGlobalContextRef> adopt(JSGlobalContextRef);

    // FIXME: Make this private once Apple's internal code is updated to not rely on it.
    // https://bugs.webkit.org/show_bug.cgi?id=189644
    JSRetainPtr(AdoptTag, T);

private:
    T m_ptr { nullptr };
};

JSRetainPtr<JSClassRef> adopt(JSClassRef);
JSRetainPtr<JSStringRef> adopt(JSStringRef);
JSRetainPtr<JSGlobalContextRef> adopt(JSGlobalContextRef);

template<typename T> inline JSRetainPtr<T>::JSRetainPtr(AdoptTag, T ptr)
    : m_ptr(ptr)
{
}

inline JSRetainPtr<JSClassRef> adopt(JSClassRef o)
{
    return JSRetainPtr<JSClassRef>(Adopt, o);
}

inline JSRetainPtr<JSStringRef> adopt(JSStringRef o)
{
    return JSRetainPtr<JSStringRef>(Adopt, o);
}

inline JSRetainPtr<JSGlobalContextRef> adopt(JSGlobalContextRef o)
{
    return JSRetainPtr<JSGlobalContextRef>(Adopt, o);
}

template<typename T> inline JSRetainPtr<T>::JSRetainPtr(const JSRetainPtr& o)
    : m_ptr(o.m_ptr)
{
    if (m_ptr)
        JSRetain(m_ptr);
}

template<typename T> inline JSRetainPtr<T>::JSRetainPtr(JSRetainPtr&& o)
    : m_ptr(o.leakRef())
{
}

template<typename T> inline JSRetainPtr<T>::~JSRetainPtr()
{
    if (m_ptr)
        JSRelease(m_ptr);
}

template<typename T> inline void JSRetainPtr<T>::clear()
{
    if (T ptr = leakRef())
        JSRelease(ptr);
}

template<typename T> inline T JSRetainPtr<T>::leakRef()
{
    return std::exchange(m_ptr, nullptr);
}

template<typename T> inline JSRetainPtr<T>& JSRetainPtr<T>::operator=(const JSRetainPtr<T>& o)
{
    return operator=(o.get());
}

template<typename T> inline JSRetainPtr<T>& JSRetainPtr<T>::operator=(JSRetainPtr&& o)
{
    if (T ptr = std::exchange(m_ptr, o.leakRef()))
        JSRelease(ptr);
    return *this;
}

template<typename T> inline JSRetainPtr<T>& JSRetainPtr<T>::operator=(T optr)
{
    if (optr)
        JSRetain(optr);
    if (T ptr = std::exchange(m_ptr, optr))
        JSRelease(ptr);
    return *this;
}

template<typename T> inline void JSRetainPtr<T>::swap(JSRetainPtr<T>& o)
{
    std::swap(m_ptr, o.m_ptr);
}

template<typename T> inline void swap(JSRetainPtr<T>& a, JSRetainPtr<T>& b)
{
    a.swap(b);
}

template<typename T, typename U> inline bool operator==(const JSRetainPtr<T>& a, const JSRetainPtr<U>& b)
{ 
    return a.get() == b.get(); 
}

template<typename T, typename U> inline bool operator==(const JSRetainPtr<T>& a, U* b)
{ 
    return a.get() == b; 
}

template<typename T, typename U> inline bool operator==(T* a, const JSRetainPtr<U>& b) 
{
    return a == b.get(); 
}
