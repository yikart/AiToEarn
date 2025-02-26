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

#include "WasmExceptionType.h"
#include "WasmMemory.h"
#include <wtf/Forward.h>
#include <wtf/Function.h>

#include <memory>

namespace JSC {

class CCallHelpers;
class CallFrame;

namespace Wasm {

struct CompilationContext;
struct InternalFunction;
struct ModuleInformation;
class TypeDefinition;
struct UnlinkedWasmToWasmCall;

// Create wrapper code to call from JS -> WebAssembly.
using CreateJSWrapper = WTF::Function<std::unique_ptr<InternalFunction>(CCallHelpers&, const TypeDefinition&, Vector<UnlinkedWasmToWasmCall>*, const ModuleInformation&, MemoryMode, uint32_t)>;

// Called as soon as an exception is detected. The return value is the PC to continue at.
using ThrowWasmException = void* (*)(CallFrame*, Wasm::ExceptionType, JSWebAssemblyInstance*);

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
