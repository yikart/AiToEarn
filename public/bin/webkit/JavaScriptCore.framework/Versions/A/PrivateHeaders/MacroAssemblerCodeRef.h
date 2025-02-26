/*
 * Copyright (C) 2009-2022 Apple Inc. All rights reserved.
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

#include "ExecutableMemoryHandle.h"
#include "JSCPtrTag.h"
#include <wtf/CodePtr.h>
#include <wtf/DataLog.h>
#include <wtf/PrintStream.h>
#include <wtf/RefPtr.h>
#include <wtf/text/CString.h>

#if CPU(ARM_THUMB2) && ENABLE(JIT)
// ARM instructions must be 16-bit aligned. Thumb2 code pointers to be loaded into
// into the processor are decorated with the bottom bit set, while traditional ARM has
// the lower bit clear. Since we don't know what kind of pointer, we check for both
// decorated and undecorated null.
#define ASSERT_VALID_CODE_OFFSET(offset) \
    ASSERT(!(offset & 1)) // Must be multiple of 2.
#else
#define ASSERT_VALID_CODE_OFFSET(offset) // Anything goes!
#endif

namespace JSC {

namespace Wasm {
enum class CompilationMode : uint8_t;
} // namespace Wasm

class CodeBlock;

enum OpcodeID : unsigned;

// MacroAssemblerCodeRef:
//
// A reference to a section of JIT generated code.  A CodeRef consists of a
// pointer to the code, and a ref pointer to the pool from within which it
// was allocated.
class MacroAssemblerCodeRefBase {
protected:
    static bool tryToDisassemble(CodePtr<DisassemblyPtrTag>, size_t, const char* prefix, PrintStream& out);
    static bool tryToDisassemble(CodePtr<DisassemblyPtrTag>, size_t, const char* prefix);
    JS_EXPORT_PRIVATE static CString disassembly(CodePtr<DisassemblyPtrTag>, size_t);
};

template<PtrTag tag>
class MacroAssemblerCodeRef : private MacroAssemblerCodeRefBase {
private:
    // This is private because it's dangerous enough that we want uses of it
    // to be easy to find - hence the static create method below.
    explicit MacroAssemblerCodeRef(CodePtr<tag> codePtr)
        : m_codePtr(codePtr)
    {
        ASSERT(m_codePtr);
    }

public:
    MacroAssemblerCodeRef() = default;

    MacroAssemblerCodeRef(Ref<ExecutableMemoryHandle>&& executableMemory)
        : m_codePtr(executableMemory->start().retaggedPtr<tag>())
        , m_executableMemory(WTFMove(executableMemory))
    {
        ASSERT(m_executableMemory->start());
        ASSERT(m_codePtr);
    }

    template<PtrTag otherTag>
    MacroAssemblerCodeRef& operator=(const MacroAssemblerCodeRef<otherTag>& otherCodeRef)
    {
        m_codePtr = CodePtr<tag>::fromTaggedPtr(otherCodeRef.code().template retaggedPtr<tag>());
        m_executableMemory = otherCodeRef.m_executableMemory;
        return *this;
    }
    
    // Use this only when you know that the codePtr refers to code that is
    // already being kept alive through some other means. Typically this means
    // that codePtr is immortal.
    static MacroAssemblerCodeRef createSelfManagedCodeRef(CodePtr<tag> codePtr)
    {
        return MacroAssemblerCodeRef(codePtr);
    }
    
    ExecutableMemoryHandle* executableMemory() const
    {
        return m_executableMemory.get();
    }
    
    CodePtr<tag> code() const
    {
        return m_codePtr;
    }

    template<PtrTag newTag>
    CodePtr<newTag> retaggedCode() const
    {
        return m_codePtr.template retagged<newTag>();
    }

    template<PtrTag newTag>
    MacroAssemblerCodeRef<newTag> retagged() const
    {
        return MacroAssemblerCodeRef<newTag>(*this);
    }

    size_t size() const
    {
        if (!m_executableMemory)
            return 0;
        return m_executableMemory->sizeInBytes();
    }

    bool tryToDisassemble(PrintStream& out, const char* prefix = "") const
    {
        return tryToDisassemble(retaggedCode<DisassemblyPtrTag>(), size(), prefix, out);
    }
    
    bool tryToDisassemble(const char* prefix = "") const
    {
        return tryToDisassemble(retaggedCode<DisassemblyPtrTag>(), size(), prefix);
    }
    
    CString disassembly() const
    {
        return MacroAssemblerCodeRefBase::disassembly(retaggedCode<DisassemblyPtrTag>(), size());
    }
    
    explicit operator bool() const { return !!m_codePtr; }
    
    void dump(PrintStream& out) const
    {
        m_codePtr.dumpWithName("CodeRef"_s, out);
    }

    static constexpr ptrdiff_t offsetOfCodePtr() { return OBJECT_OFFSETOF(MacroAssemblerCodeRef, m_codePtr); }

private:
    template<PtrTag otherTag>
    MacroAssemblerCodeRef(const MacroAssemblerCodeRef<otherTag>& otherCodeRef)
    {
        *this = otherCodeRef;
    }

    CodePtr<tag> m_codePtr;
    RefPtr<ExecutableMemoryHandle> m_executableMemory;

    template<PtrTag> friend class MacroAssemblerCodeRef;
};

bool shouldDumpDisassemblyFor(CodeBlock*);
bool shouldDumpDisassemblyFor(Wasm::CompilationMode);

} // namespace JSC
