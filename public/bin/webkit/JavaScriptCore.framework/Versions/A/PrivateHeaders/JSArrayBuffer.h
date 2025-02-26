/*
 * Copyright (C) 2013-2022 Apple Inc. All rights reserved.
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

#include "ArrayBuffer.h"
#include "JSObject.h"

namespace JSC {

class JSArrayBuffer final : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.arrayBufferSpace<mode>();
    }

    // This function will register the new wrapper with the vm's TypedArrayController.
    JS_EXPORT_PRIVATE static JSArrayBuffer* create(VM&, Structure*, RefPtr<ArrayBuffer>&&);

    ArrayBuffer* impl() const { return m_impl; }
    
    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);

    JS_EXPORT_PRIVATE bool isShared() const;
    ArrayBufferSharingMode sharingMode() const;
    bool isResizableOrGrowableShared() const { return m_impl->isResizableOrGrowableShared(); }
    
    DECLARE_EXPORT_INFO;
    
    // This is the default DOM unwrapping. It calls toUnsharedArrayBuffer().
    static ArrayBuffer* toWrapped(VM&, JSValue);
    static ArrayBuffer* toWrappedAllowShared(VM&, JSValue);
    
private:
    JSArrayBuffer(VM&, Structure*, RefPtr<ArrayBuffer>&&);
    void finishCreation(VM&, JSGlobalObject*);

    static size_t estimatedSize(JSCell*, VM&);

    ArrayBuffer* m_impl;
};

inline ArrayBuffer* toPossiblySharedArrayBuffer(VM&, JSValue value)
{
    JSArrayBuffer* wrapper = jsDynamicCast<JSArrayBuffer*>(value);
    if (!wrapper)
        return nullptr;
    return wrapper->impl();
}

inline ArrayBuffer* toUnsharedArrayBuffer(VM& vm, JSValue value)
{
    ArrayBuffer* result = toPossiblySharedArrayBuffer(vm, value);
    if (!result || result->isShared())
        return nullptr;
    return result;
}

inline ArrayBuffer* JSArrayBuffer::toWrapped(VM& vm, JSValue value)
{
    auto result = toUnsharedArrayBuffer(vm, value);
    if (!result || result->isResizableOrGrowableShared())
        return nullptr;
    return result;
}

inline ArrayBuffer* JSArrayBuffer::toWrappedAllowShared(VM& vm, JSValue value)
{
    auto result = toPossiblySharedArrayBuffer(vm, value);
    if (!result || result->isResizableOrGrowableShared())
        return nullptr;
    return result;
}

} // namespace JSC
