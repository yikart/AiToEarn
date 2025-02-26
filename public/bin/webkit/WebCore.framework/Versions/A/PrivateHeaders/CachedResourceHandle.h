/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
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

#include <wtf/Forward.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class CachedResource;

class CachedResourceHandleBase {
public:
    WEBCORE_EXPORT ~CachedResourceHandleBase();

    WEBCORE_EXPORT CachedResource* get() const;
    
    bool operator!() const { return !m_resource; }
    operator bool() const { return !!m_resource; }

protected:
    WEBCORE_EXPORT CachedResourceHandleBase();
    WEBCORE_EXPORT explicit CachedResourceHandleBase(CachedResource*);
    WEBCORE_EXPORT explicit CachedResourceHandleBase(CachedResource&);
    WEBCORE_EXPORT CachedResourceHandleBase(const CachedResourceHandleBase&);

    WEBCORE_EXPORT void setResource(CachedResource*);
    
private:
    CachedResourceHandleBase& operator=(const CachedResourceHandleBase&) { return *this; } 
    
    friend class CachedResource;

    WeakPtr<CachedResource> m_resource;
};
    
template <class R> class CachedResourceHandle : public CachedResourceHandleBase {
public: 
    CachedResourceHandle() = default;
    CachedResourceHandle(R& res) : CachedResourceHandleBase(res) { }
    CachedResourceHandle(R* res) : CachedResourceHandleBase(res) { }
    CachedResourceHandle(const CachedResourceHandle<R>& o) : CachedResourceHandleBase(o) { }
    template<typename U> CachedResourceHandle(const CachedResourceHandle<U>& o) : CachedResourceHandleBase(o.get()) { }

    R* get() const { return reinterpret_cast<R*>(CachedResourceHandleBase::get()); }
    R* operator->() const { return get(); }
    R& operator*() const { ASSERT(get()); return *get(); }

    CachedResourceHandle& operator=(R* res) { setResource(res); return *this; } 
    CachedResourceHandle& operator=(const CachedResourceHandle& o) { setResource(o.get()); return *this; }
    template<typename U> CachedResourceHandle& operator=(const CachedResourceHandle<U>& o) { setResource(o.get()); return *this; }

    bool operator==(const CachedResourceHandle& o) const { return operator==(static_cast<const CachedResourceHandleBase&>(o)); }
    bool operator==(const CachedResourceHandleBase& o) const { return get() == o.get(); }
};

template <class R, class RR> bool operator==(const CachedResourceHandle<R>& h, const RR* res) 
{ 
    return h.get() == res; 
}
template <class R, class RR> bool operator==(const RR* res, const CachedResourceHandle<R>& h) 
{ 
    return h.get() == res; 
}

} // namespace WebCore
