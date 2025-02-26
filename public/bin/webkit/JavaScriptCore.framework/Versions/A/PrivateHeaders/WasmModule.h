/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include "WasmCalleeGroup.h"
#include "WasmJS.h"
#include "WasmMemory.h"
#include "WasmOps.h"
#include <wtf/Expected.h>
#include <wtf/Lock.h>
#include <wtf/SharedTask.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace JSC {

class VM;
class JSWebAssemblyInstance;

namespace Wasm {

class LLIntPlan;
class IPIntPlan;
struct ModuleInformation;
enum class BindingFailure;

class Module : public ThreadSafeRefCounted<Module> {
public:
    using ValidationResult = Expected<Ref<Module>, String>;
    typedef void CallbackType(ValidationResult&&);
    using AsyncValidationCallback = RefPtr<SharedTask<CallbackType>>;

    static ValidationResult validateSync(VM&, Vector<uint8_t>&& source);
    static void validateAsync(VM&, Vector<uint8_t>&& source, Module::AsyncValidationCallback&&);

    static Ref<Module> create(LLIntPlan& plan)
    {
        return adoptRef(*new Module(plan));
    }
    static Ref<Module> create(IPIntPlan& plan)
    {
        return adoptRef(*new Module(plan));
    }

    Wasm::TypeIndex typeIndexFromFunctionIndexSpace(FunctionSpaceIndex functionIndexSpace) const;
    const Wasm::ModuleInformation& moduleInformation() const { return m_moduleInformation.get(); }

    Ref<CalleeGroup> compileSync(VM&, MemoryMode);
    void compileAsync(VM&, MemoryMode, CalleeGroup::AsyncCompilationCallback&&);

    JS_EXPORT_PRIVATE ~Module();

    CalleeGroup* calleeGroupFor(MemoryMode mode) { return m_calleeGroups[static_cast<uint8_t>(mode)].get(); }

    void copyInitialCalleeGroupToAllMemoryModes(MemoryMode);

    CodePtr<WasmEntryPtrTag> importFunctionStub(FunctionSpaceIndex importFunctionNum) { return m_wasmToJSExitStubs[importFunctionNum].code(); }

private:
    Ref<CalleeGroup> getOrCreateCalleeGroup(VM&, MemoryMode);

    Module(LLIntPlan&);
    Module(IPIntPlan&);
    Ref<ModuleInformation> m_moduleInformation;
    RefPtr<CalleeGroup> m_calleeGroups[numberOfMemoryModes];
    Ref<LLIntCallees> m_llintCallees;
    Ref<IPIntCallees> m_ipintCallees;
    FixedVector<MacroAssemblerCodeRef<WasmEntryPtrTag>> m_wasmToJSExitStubs;
    Lock m_lock;
};

} } // namespace JSC::Wasm

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(WEBASSEMBLY)
