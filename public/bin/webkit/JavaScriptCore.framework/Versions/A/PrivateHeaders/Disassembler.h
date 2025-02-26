/*
 * Copyright (C) 2012-2022 Apple Inc. All rights reserved.
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
#include "JSExportMacros.h"
#include <functional>
#include <wtf/CodePtr.h>
#include <wtf/PrintStream.h>
#include <wtf/text/CString.h>

namespace JSC {

template<PtrTag> class MacroAssemblerCodeRef;

#if ENABLE(DISASSEMBLER)
JS_EXPORT_PRIVATE bool tryToDisassemble(const CodePtr<DisassemblyPtrTag>&, size_t, void* codeStart, void* codeEnd, const char* prefix, PrintStream&);
#else
inline bool tryToDisassemble(const CodePtr<DisassemblyPtrTag>&, size_t, void*, void*, const char*, PrintStream&)
{
    return false;
}
#endif

inline bool tryToDisassemble(const CodePtr<DisassemblyPtrTag>& code, size_t size, const char* prefix, PrintStream& out)
{
    return tryToDisassemble(code, size, nullptr, nullptr, prefix, out);
}

// Prints either the disassembly, or a line of text indicating that disassembly failed and
// the range of machine code addresses.
void disassemble(const CodePtr<DisassemblyPtrTag>&, size_t, void* codeStart, void* codeEnd, const char* prefix, PrintStream& out);

// Asynchronous disassembly. This happens on another thread, and calls the provided
// callback when the disassembly is done.
void disassembleAsynchronously(
    const CString& header, const MacroAssemblerCodeRef<DisassemblyPtrTag>&, size_t, void* codeStart, void* codeEnd, const char* prefix);

JS_EXPORT_PRIVATE void waitForAsynchronousDisassembly();

void registerLabel(void* thunkAddress, CString&& label);
void registerLabel(void* thunkAddress, const char* label);
const char* labelFor(void* thunkAddress);

} // namespace JSC
