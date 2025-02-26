/*
 * Copyright (C) 2011-2018 Apple Inc. All rights reserved.
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

#include "JSCPtrTag.h"
#include "OpcodeSize.h"
#include <wtf/StdLibExtras.h>

namespace JSC {

class CallFrame;
class VM;
template<PtrTag> class MacroAssemblerCodeRef;

template<typename> struct BaseInstruction;
struct JSOpcodeTraits;
struct WasmOpcodeTraits;

using JSInstruction = BaseInstruction<JSOpcodeTraits>;
using WasmInstruction = BaseInstruction<WasmOpcodeTraits>;

namespace LLInt {

// Gives you a PC that you can tell the interpreter to go to, which when advanced
// between 1 and 9 slots will give you an "instruction" that threads to the
// interpreter's exception handler.
JSInstruction* returnToThrow(VM&);
WasmInstruction* wasmReturnToThrow(VM&);

// Use this when you're throwing to a call thunk.
MacroAssemblerCodeRef<ExceptionHandlerPtrTag> callToThrow(VM&);

MacroAssemblerCodeRef<ExceptionHandlerPtrTag> handleUncaughtException(VM&);
MacroAssemblerCodeRef<ExceptionHandlerPtrTag> handleCatch(OpcodeSize);

#if ENABLE(WEBASSEMBLY)
MacroAssemblerCodeRef<ExceptionHandlerPtrTag> handleWasmCatch(OpcodeSize);
MacroAssemblerCodeRef<ExceptionHandlerPtrTag> handleWasmCatchAll(OpcodeSize);
MacroAssemblerCodeRef<ExceptionHandlerPtrTag> handleWasmTryTable(WasmOpcodeID, OpcodeSize);
#endif // ENABLE(WEBASSEMBLY)

} } // namespace JSC::LLInt
