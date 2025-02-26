/*
 * Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY)

#include "JSObject.h"
#include "WasmMemory.h"
#include <wtf/Ref.h>
#include <wtf/RefPtr.h>

namespace JSC {

class ArrayBuffer;
class JSArrayBuffer;

// FIXME: Merge Wasm::Memory into this now that JSWebAssemblyInstance is the only instance object.
class JSWebAssemblyMemory final : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;
    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.webAssemblyMemorySpace<mode>();
    }

    JS_EXPORT_PRIVATE static JSWebAssemblyMemory* tryCreate(JSGlobalObject*, VM&, Structure*);
    static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_EXPORT_INFO;

    JS_EXPORT_PRIVATE void adopt(Ref<Wasm::Memory>&&);
    Wasm::Memory& memory() { return m_memory.get(); }
    JSArrayBuffer* buffer(JSGlobalObject*);
    PageCount grow(VM&, JSGlobalObject*, uint32_t delta);
    JS_EXPORT_PRIVATE void growSuccessCallback(VM&, PageCount oldPageCount, PageCount newPageCount);

    JSObject* type(JSGlobalObject*);

    MemoryMode mode() const { return m_memory->mode(); }
    MemorySharingMode sharingMode() const { return m_memory->sharingMode(); }
    size_t mappedCapacity() const { return m_memory->mappedCapacity(); }
    void* basePointer() const { return m_memory->basePointer(); }

    static constexpr ptrdiff_t offsetOfMemory() { return OBJECT_OFFSETOF(JSWebAssemblyMemory, m_memory); }

private:
    JSWebAssemblyMemory(VM&, Structure*);
    void finishCreation(VM&);
    DECLARE_VISIT_CHILDREN;

    Ref<Wasm::Memory> m_memory;
    WriteBarrier<JSArrayBuffer> m_bufferWrapper;
    RefPtr<ArrayBuffer> m_buffer;
};

} // namespace JSC

#endif // ENABLE(WEBASSEMBLY)
