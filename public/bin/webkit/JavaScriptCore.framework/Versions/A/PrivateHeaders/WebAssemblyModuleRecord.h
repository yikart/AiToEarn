/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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

#include "AbstractModuleRecord.h"
#include "WasmCreationMode.h"
#include "WasmModuleInformation.h"

namespace JSC {

class JSWebAssemblyInstance;
class JSWebAssemblyModule;
class WebAssemblyFunction;

// Based on the WebAssembly.Instance specification
// https://github.com/WebAssembly/design/blob/master/JS.md#webassemblyinstance-constructor
class WebAssemblyModuleRecord final : public AbstractModuleRecord {
    friend class LLIntOffsetsExtractor;
public:
    using Base = AbstractModuleRecord;

    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.webAssemblyModuleRecordSpace<mode>();
    }

    DECLARE_EXPORT_INFO;

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
    static WebAssemblyModuleRecord* create(JSGlobalObject*, VM&, Structure*, const Identifier&, const Wasm::ModuleInformation&);

    void prepareLink(VM&, JSWebAssemblyInstance*);
    Synchronousness link(JSGlobalObject*, JSValue scriptFetcher);
    void initializeImports(JSGlobalObject*, JSObject* importObject, Wasm::CreationMode);
    void initializeExports(JSGlobalObject*);
    JS_EXPORT_PRIVATE JSValue evaluate(JSGlobalObject*);

    JSObject* exportsObject() const { return m_exportsObject.get(); }

    static constexpr ptrdiff_t offsetOfExportsObject() { return OBJECT_OFFSETOF(WebAssemblyModuleRecord, m_exportsObject); }

private:
    WebAssemblyModuleRecord(VM&, Structure*, const Identifier&);

    void finishCreation(JSGlobalObject*, VM&, const Wasm::ModuleInformation&);
    JSValue evaluateConstantExpression(JSGlobalObject*, const Vector<uint8_t>&, const Wasm::ModuleInformation&, Wasm::Type, uint64_t&);

    DECLARE_VISIT_CHILDREN;

    WriteBarrier<JSWebAssemblyInstance> m_instance;
    WriteBarrier<JSObject> m_startFunction;
    WriteBarrier<JSObject> m_exportsObject;
};

} // namespace JSC

#endif // ENABLE(WEBASSEMBLY)
