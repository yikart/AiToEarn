/*
 * Copyright (C) 2015-2023 Apple Inc. All rights reserved.
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

#if ENABLE(JIT)

#include "MacroAssemblerCodeRef.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class VM;

class OpaqueByproducts;

// This class is a way to keep the result of a compilation alive and runnable.

class Compilation {
    WTF_MAKE_NONCOPYABLE(Compilation);
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(Compilation, JS_EXPORT_PRIVATE);

public:
    JS_EXPORT_PRIVATE Compilation(MacroAssemblerCodeRef<JITCompilationPtrTag>, std::unique_ptr<OpaqueByproducts>);
    JS_EXPORT_PRIVATE Compilation(Compilation&&);
    JS_EXPORT_PRIVATE ~Compilation();

    CodePtr<JITCompilationPtrTag> code() const { return m_codeRef.code(); }
    MacroAssemblerCodeRef<JITCompilationPtrTag> codeRef() const { return m_codeRef; }
    
    CString disassembly() const { return m_codeRef.disassembly(); }

private:
    MacroAssemblerCodeRef<JITCompilationPtrTag> m_codeRef;
    std::unique_ptr<OpaqueByproducts> m_byproducts;
};

} // namespace JSC

#endif // ENABLE(JIT)
