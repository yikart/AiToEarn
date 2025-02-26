/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
 * Copyright (C) 2017 Yusuke Suzuki <utatane.tea@gmail.com>.
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

#include "CCallHelpers.h"

namespace JSC {

class SnippetParams;

typedef CCallHelpers::JumpList SnippetCompilerFunction(CCallHelpers&, SnippetParams&);
typedef SharedTask<SnippetCompilerFunction> SnippetCompiler;

// Snippet is the way to inject an opaque code generator into DFG and FTL.
// While B3::Patchpoint is self-contained about its compilation information,
// Snippet depends on which DFG Node invokes. For example, CheckDOM will
// link returned failureCases to BadType OSRExit, but this information is offered
// from CheckDOM DFG Node, not from this snippet. This snippet mainly focuses
// on injecting a snippet generator that can tell register usage and can be used
// in both DFG and FTL.
class Snippet : public ThreadSafeRefCounted<Snippet> {
public:
    static Ref<Snippet> create()
    {
        return adoptRef(*new Snippet());
    }

    template<typename Functor>
    void setGenerator(const Functor& functor)
    {
        m_generator = createSharedTask<SnippetCompilerFunction>(functor);
    }

    RefPtr<SnippetCompiler> generator() const { return m_generator; }

    uint8_t numGPScratchRegisters { 0 };
    uint8_t numFPScratchRegisters { 0 };

protected:
    Snippet() = default;

private:
    RefPtr<SnippetCompiler> m_generator;
};

}

#endif
