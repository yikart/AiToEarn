/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
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

#include "JITStubRoutine.h"
#include <wtf/HashMap.h>
#include <wtf/Range.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

using WTF::Range;

namespace JSC {

class GCAwareJITStubRoutine;
class VM;

#if ENABLE(JIT)

class JITStubRoutineSet {
    WTF_MAKE_NONCOPYABLE(JITStubRoutineSet);
    WTF_MAKE_TZONE_ALLOCATED(JITStubRoutineSet);
public:
    JITStubRoutineSet();
    ~JITStubRoutineSet();
    
    void add(GCAwareJITStubRoutine*);

    void clearMarks();
    
    void mark(void* candidateAddress)
    {
        uintptr_t address = removeCodePtrTag<uintptr_t>(candidateAddress);
        if (!m_range.contains(address))
            return;
        markSlow(address);
    }

    void prepareForConservativeScan();
    
    void deleteUnmarkedJettisonedStubRoutines(VM&);

    template<typename Visitor> void traceMarkedStubRoutines(Visitor&);
    
private:
    void markSlow(uintptr_t address);
    
    struct Routine {
        uintptr_t startAddress;
        GCAwareJITStubRoutine* routine;
    };
    Vector<Routine> m_routines;
    Vector<GCAwareJITStubRoutine*> m_immutableCodeRoutines;
    Range<uintptr_t> m_range { 0, 0 };
};

#else // !ENABLE(JIT)

class JITStubRoutineSet {
    WTF_MAKE_NONCOPYABLE(JITStubRoutineSet);
    WTF_MAKE_TZONE_ALLOCATED(JITStubRoutineSet);
public:
    JITStubRoutineSet() { }
    ~JITStubRoutineSet() { }

    void add(GCAwareJITStubRoutine*) { }
    void clearMarks() { }
    void mark(void*) { }
    void prepareForConservativeScan() { }
    void deleteUnmarkedJettisonedStubRoutines(VM&) { }
    template<typename Visitor> void traceMarkedStubRoutines(Visitor&) { }
};

#endif // !ENABLE(JIT)

} // namespace JSC
