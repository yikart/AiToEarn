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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

namespace JSC {

// We track collector phase in order to allow either the collector thread or the mutator thread to
// jump in and do work. The collector and mutator trade the conn
// (https://en.wikipedia.org/wiki/Conn_(nautical)) with each other based on who is available to do work,
// and they use the phase to help each other know what to do once they take the conn.
//
// The collector relinquishes the conn whenever it stopTheMutator's and the mutator is running. Then the
// collector thread goes to sleep.
//
// The mutator relinquishes the conn whenever it releaseAccess's. That wakes up the collector thread.
enum class CollectorPhase : uint8_t {
    // We use this phase when the collector is not running at all. After this state is Begin.
    NotRunning,
    
    // This is everything from when the collector begins to when it first yields to the mutator for
    // marking. After this is Fixpoint.
    Begin,
    
    // This means that we should try to do some progress with the world stopped. This usually means
    // doing an iteration of MarkingConstraintSet::executeConvergence, but it could also mean marking
    // with the world stopped. After this is either Concurrent or End.
    Fixpoint,
    
    // In this state the collector is relying on the parallel helpers and incremental mutator work to
    // make progress. After this is Reloop, once marking stalls.
    Concurrent,
        
    // We did some concurrent marking and now we ran out of work. This phase prepares the GC for another
    // Fixpoint. After this is Fixpoint.
    Reloop,
    
    // The collector is trying to finish up. After this state is NotRunning.
    End
};

bool worldShouldBeSuspended(CollectorPhase phase);

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::CollectorPhase);

} // namespace WTF

