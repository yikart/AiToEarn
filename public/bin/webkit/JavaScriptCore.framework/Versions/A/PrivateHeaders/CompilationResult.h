/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include <wtf/PrintStream.h>

namespace JSC {

enum CompilationResult {
    // We tried to compile the code, but we couldn't compile it. This could be
    // because we ran out of memory, or because the compiler encountered an
    // internal error and decided to bail out gracefully. Either way, this implies
    // that we shouldn't try to compile this code block again.
    CompilationFailed,
    
    // The profiling assumptions that were fed into the compiler were invalidated
    // even before we finished compiling. This means we should try again: in such
    // cases the profiling will now be updated and the next compilation won't
    // encounter the same problem. But it does mean that we should exercise
    // exponential back-off, to get even more profiling so that new profiling
    // pathologies aren't encountered.
    CompilationInvalidated,
    
    // The compilation succeeded and the code block now has JITCode for the newly
    // compiled code. However, compilation success doesn't mean that the CodeBlock
    // will execute yet; you typically have to install it first, unless you plan
    // on invoking it manually (something that *could* be done for some kinds of
    // OSR entry).
    CompilationSuccessful,
    
    // We decided to do the compilation asynchronously. This means that we haven't
    // yet compiled the code. This only happens when you pass a
    // DeferredCompilationCallback. That callback will get called with some
    // interesting result, once compilation completes.
    CompilationDeferred
};

} // namespace JSC

namespace WTF {

void printInternal(PrintStream&, JSC::CompilationResult);

} // namespace WTF
