/*
 * Copyright (C) 2010-2022 Apple Inc. All rights reserved.
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

#ifndef JSWeakObjectMapRefInternal_h
#define JSWeakObjectMapRefInternal_h

#include "WeakGCMap.h"
#include <wtf/RefCounted.h>

namespace JSC {

class JSObject;

}

typedef void (*JSWeakMapDestroyedCallback)(struct OpaqueJSWeakObjectMap*, void*);

typedef JSC::WeakGCMap<void*, JSC::JSObject> WeakMapType;

#define OPAQUE_JSWEAK_OBJECT_MAP_METHOD(method) \
    WTF_VTBL_FUNCPTR_PTRAUTH_STR("OpaqueJSWeakObjectMap." #method) method

struct OpaqueJSWeakObjectMap : public RefCounted<OpaqueJSWeakObjectMap> {
public:
    static Ref<OpaqueJSWeakObjectMap> create(JSC::VM& vm, void* data, JSWeakMapDestroyedCallback callback)
    {
        return adoptRef(*new OpaqueJSWeakObjectMap(vm, data, callback));
    }

    WeakMapType& map() { return m_map; }
    
    ~OpaqueJSWeakObjectMap()
    {
        m_callback(this, m_data);
    }

private:
    OpaqueJSWeakObjectMap(JSC::VM& vm, void* data, JSWeakMapDestroyedCallback callback)
        : m_map(vm)
        , m_data(data)
        , m_callback(callback)
    {
    }
    WeakMapType m_map;
    void* m_data;
    JSWeakMapDestroyedCallback OPAQUE_JSWEAK_OBJECT_MAP_METHOD(m_callback);
};

#undef OPAQUE_JSWEAK_OBJECT_MAP_METHOD

#endif // JSWeakObjectMapInternal_h
