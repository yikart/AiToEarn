/*
 * Copyright (C) 2015-2017 Apple Inc. All rights reserved.
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

#if ENABLE(B3_JIT)

#include "CPU.h"
#include "Options.h"

namespace JSC { namespace B3 { namespace Air {

class Code;

// We have two register allocators, both fundamentally derived from Chaitin's Yorktown
// allocator:
// http://cs.gmu.edu/~white/CS640/p98-chaitin.pdf
//
// We have an implementation of Briggs's optimistic allocator which is derivative of Chaitin's allocator:
// http://www.cs.utexas.edu/users/mckinley/380C/lecs/briggs-thesis-1992.pdf
//
// And an implementation of Andrew Appel's Iterated Register Coalescing which is derivative of Briggs's allocator.
// http://www.cs.cmu.edu/afs/cs/academic/class/15745-s07/www/papers/george.pdf
void allocateRegistersByGraphColoring(Code&);

} } } // namespace JSC::B3::Air

#endif // ENABLE(B3_JIT)
