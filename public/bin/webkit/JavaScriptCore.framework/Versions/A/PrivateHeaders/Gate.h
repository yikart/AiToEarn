/*
 * Copyright (C) 2020-2022 Apple Inc. All rights reserved.
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

namespace JSC {

#if ENABLE(JIT_OPERATION_VALIDATION) || ENABLE(JIT_OPERATION_DISASSEMBLY) || CPU(ARM64E)

#define JSC_UTILITY_GATES(v) \
    v(jitCagePtr, NoPtrTag) \
    v(tailCallJSEntryPtrTag, NoPtrTag) \
    v(tailCallJSEntrySlowPathPtrTag, NoPtrTag) \
    v(tailCallWithoutUntagJSEntryPtrTag, NoPtrTag) \
    v(loopOSREntry, NoPtrTag) \
    v(entryOSREntry, NoPtrTag) \
    v(wasmOSREntry, NoPtrTag) \
    v(wasmTailCallWasmEntryPtrTag, NoPtrTag) \
    v(wasmIPIntTailCallWasmEntryPtrTag, NoPtrTag) \
    v(exceptionHandler, NoPtrTag) \
    v(returnFromLLInt, NoPtrTag) \
    v(llint_function_for_call_arity_checkUntag, NoPtrTag) \
    v(llint_function_for_call_arity_checkTag, NoPtrTag) \
    v(llint_function_for_construct_arity_checkUntag, NoPtrTag) \
    v(llint_function_for_construct_arity_checkTag, NoPtrTag) \
    v(vmEntryToJavaScript, JSEntryPtrTag) \

#define JSC_JS_GATE_OPCODES(v) \
    v(op_call, JSEntryPtrTag) \
    v(op_call_ignore_result, JSEntryPtrTag) \
    v(op_construct, JSEntryPtrTag) \
    v(op_super_construct, JSEntryPtrTag) \
    v(op_iterator_next, JSEntryPtrTag) \
    v(op_iterator_open, JSEntryPtrTag) \
    v(op_call_varargs, JSEntryPtrTag) \
    v(op_construct_varargs, JSEntryPtrTag) \
    v(op_super_construct_varargs, JSEntryPtrTag) \
    v(op_call_direct_eval_slow, JSEntrySlowPathPtrTag) \

#if ENABLE(WEBASSEMBLY)

#define JSC_WASM_GATE_OPCODES(v) \
    v(wasm_call, WasmEntryPtrTag) \
    v(wasm_call_indirect, WasmEntryPtrTag) \
    v(wasm_call_ref, WasmEntryPtrTag) \
    v(wasm_ipint_call, WasmEntryPtrTag) \

#else
#define JSC_WASM_GATE_OPCODES(v)
#endif

enum class Gate : uint8_t {
#define JSC_DEFINE_GATE_ENUM(gateName, tag) gateName,
#define JSC_DEFINE_OPCODE_GATE_ENUM(gateName, tag) gateName, gateName##_wide16, gateName##_wide32,
    JSC_UTILITY_GATES(JSC_DEFINE_GATE_ENUM)
    JSC_JS_GATE_OPCODES(JSC_DEFINE_OPCODE_GATE_ENUM)
    JSC_WASM_GATE_OPCODES(JSC_DEFINE_OPCODE_GATE_ENUM)
#undef JSC_DEFINE_GATE_ENUM
};

#define JSC_COUNT(gateName, tag) + 1
#define JSC_OPCODE_COUNT(gateName, tag) + 3
static constexpr unsigned numberOfGates = 0 JSC_UTILITY_GATES(JSC_COUNT) JSC_JS_GATE_OPCODES(JSC_OPCODE_COUNT) JSC_WASM_GATE_OPCODES(JSC_OPCODE_COUNT);
#undef JSC_COUNT
#undef JSC_OPCODE_COUNT

#else // not (ENABLE(JIT_OPERATION_VALIDATION) || ENABLE(JIT_OPERATION_DISASSEMBLY) || CPU(ARM64E))

// Keep it non-zero to make JSCConfig's array not [0].
static constexpr unsigned numberOfGates = 1;

#endif // ENABLE(JIT_OPERATION_VALIDATION) || ENABLE(JIT_OPERATION_DISASSEMBLY) || CPU(ARM64E)

} // namespace JSC
