/*
 * Copyright (C) 2011-2021 Apple Inc. All rights reserved.
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

#include "JITCompilationMode.h"

#if ENABLE(DFG_JIT)

#include "Options.h"
#include <limits.h>
#include <wtf/text/StringImpl.h>

namespace JSC { namespace DFG {

struct Node;

typedef uint32_t BlockIndex;
static constexpr BlockIndex NoBlock = UINT_MAX;

extern const char* const tierName;

// Use RefChildren if the child ref counts haven't already been adjusted using
// other means and either of the following is true:
// - The node you're creating is MustGenerate.
// - The place where you're inserting a reference to the node you're creating
//   will not also do RefChildren.
enum RefChildrenMode {
    RefChildren,
    DontRefChildren
};

// Use RefNode if you know that the node will be used from another node, and you
// will not already be ref'ing the node to account for that use.
enum RefNodeMode {
    RefNode,
    DontRefNode
};

enum SwitchKind {
    SwitchImm,
    SwitchChar,
    SwitchString,
    SwitchCell
};

inline bool verboseCompilationEnabled(JITCompilationMode mode = JITCompilationMode::DFG)
{
    return Options::verboseCompilation() || Options::dumpGraphAtEachPhase() || (isFTL(mode) && Options::verboseFTLCompilation());
}

inline bool logCompilationChanges(JITCompilationMode mode = JITCompilationMode::DFG)
{
    return verboseCompilationEnabled(mode) || Options::logCompilationChanges();
}

inline bool shouldDumpGraphAtEachPhase(JITCompilationMode mode = JITCompilationMode::DFG)
{
    if (isFTL(mode))
        return Options::dumpGraphAtEachPhase() || Options::dumpDFGFTLGraphAtEachPhase();
    return Options::dumpGraphAtEachPhase() || Options::dumpDFGGraphAtEachPhase();
}

inline bool validationEnabled()
{
#if ASSERT_ENABLED
    return true;
#else
    return Options::validateGraph() || Options::validateGraphAtEachPhase();
#endif
}

inline bool constexpr enableInt52()
{
#if USE(JSVALUE64)
    return true;
#else
    return false;
#endif
}

// The prediction propagator effectively does four passes, with the last pass
// being done by the separate FixuPhase.
enum PredictionPass {
    // We're converging in a straight-forward forward flow fixpoint. This is the
    // most conventional part of the propagator - it makes only monotonic decisions
    // based on value profiles and rare case profiles. It ignores baseline JIT rare
    // case profiles. The goal here is to develop a good guess of which variables
    // are likely to be purely numerical, which generally doesn't require knowing
    // the rare case profiles.
    PrimaryPass,
    
    // At this point we know what is numerical and what isn't. Non-numerical inputs
    // to arithmetic operations will not have useful information in the Baseline JIT
    // rare case profiles because Baseline may take slow path on non-numerical
    // inputs even if the DFG could handle the input on the fast path. Boolean
    // inputs are the most obvious example. This pass of prediction propagation will
    // use Baseline rare case profiles for purely numerical operations and it will
    // ignore them for everything else. The point of this pass is to develop a good
    // guess of which variables are likely to be doubles.
    //
    // This pass is intentionally weird and goes against what is considered good
    // form when writing a static analysis: a new data flow of booleans will cause
    // us to ignore rare case profiles except that by then, we will have already
    // propagated double types based on our prior assumption that we shouldn't
    // ignore rare cases. This probably won't happen because the PrimaryPass is
    // almost certainly going to establish what is and isn't numerical. But it's
    // conceivable that during this pass we will discover a new boolean data flow.
    // This ends up being sound because the prediction propagator could literally
    // make any guesses it wants and still be sound (worst case, we OSR exit more
    // often or use too general of types are run a bit slower). This will converge
    // because we force monotonicity on the types of nodes and variables. So, the
    // worst thing that can happen is that we violate basic laws of theoretical
    // decency.
    RareCasePass,
    
    // At this point we know what is numerical and what isn't, and we also know what
    // is a double and what isn't. So, we start forcing variables to be double.
    // Doing so may have a cascading effect so this is a fixpoint. It's monotonic
    // in the sense that once a variable is forced double, it cannot be forced in
    // the other direction.
    DoubleVotingPass,
    
    // This pass occurs once we have converged. At this point we are just installing
    // type checks based on the conclusions we have already reached. It's important
    // for this pass to reach the same conclusions that DoubleVotingPass reached.
    FixupPass
};

enum StructureRegistrationState { HaveNotStartedRegistering, AllStructuresAreRegistered };

enum StructureRegistrationResult { StructureRegisteredNormally, StructureRegisteredAndWatched };

enum OptimizationFixpointState { BeforeFixpoint, FixpointNotConverged, FixpointConverged };

// Describes the form you can expect the entire graph to be in.
enum GraphForm {
    // LoadStore form means that basic blocks may freely use GetLocal, SetLocal,
    // and Flush for accessing local variables and indicating where their live
    // ranges ought to be. Data flow between local accesses is implicit. Liveness
    // is only explicit at block heads (variablesAtHead). This is only used by
    // the DFG simplifier and is only preserved by same.
    //
    // For example, LoadStore form gives no easy way to determine which SetLocal's
    // flow into a GetLocal. As well, LoadStore form implies no restrictions on
    // redundancy: you can freely emit multiple GetLocals, or multiple SetLocals
    // (or any combination thereof) to the same local in the same block. LoadStore
    // form does not require basic blocks to declare how they affect or use locals,
    // other than implicitly by using the local ops and by preserving
    // variablesAtHead. Finally, LoadStore allows flexibility in how liveness of
    // locals is extended; for example you can replace a GetLocal with a Phantom
    // and so long as the Phantom retains the GetLocal's children (i.e. the Phi
    // most likely) then it implies that the local is still live but that it need
    // not be stored to the stack necessarily. This implies that Phantom can
    // reference nodes that have no result, as long as those nodes are valid
    // GetLocal children (i.e. Phi, SetLocal, SetArgumentDefinitely, SetArgumentMaybe).
    //
    // LoadStore form also implies that Phis need not have children. By default,
    // they end up having no children if you enter LoadStore using the canonical
    // way (call Graph::dethread).
    //
    // LoadStore form is suitable for CFG transformations, as well as strength
    // reduction, folding, and CSE.
    LoadStore,
    
    // ThreadedCPS form means that basic blocks list up-front which locals they
    // expect to be live at the head, and which locals they make available at the
    // tail. ThreadedCPS form also implies that:
    //
    // - GetLocals and SetLocals are not redundant within a basic block.
    //
    // - All GetLocals and Flushes are linked directly to the last access point
    //   of the variable, which must not be another GetLocal.
    //
    // - Phantom(Phi) is not legal, but PhantomLocal is.
    //
    // ThreadedCPS form is suitable for data flow analysis (CFA, prediction
    // propagation), register allocation, and code generation.
    ThreadedCPS,
    
    // SSA form. See DFGSSAConversionPhase.h for a description.
    SSA
};

// Describes the state of the UnionFind structure of VariableAccessData's.
enum UnificationState {
    // BasicBlock-local accesses to variables are appropriately unified with each other.
    LocallyUnified,
    
    // Unification has been performed globally.
    GloballyUnified
};

// Describes how reference counts in the graph behave.
enum RefCountState {
    // Everything has refCount() == 1.
    EverythingIsLive,

    // Set after DCE has run.
    ExactRefCount
};

enum OperandSpeculationMode { AutomaticOperandSpeculation, ManualOperandSpeculation };

enum ProofStatus { NeedsCheck, IsProved };

inline bool isProved(ProofStatus proofStatus)
{
    ASSERT(proofStatus == IsProved || proofStatus == NeedsCheck);
    return proofStatus == IsProved;
}

inline ProofStatus proofStatusForIsProved(bool isProved)
{
    return isProved ? IsProved : NeedsCheck;
}

enum KillStatus { DoesNotKill, DoesKill };

inline bool doesKill(KillStatus killStatus)
{
    ASSERT(killStatus == DoesNotKill || killStatus == DoesKill);
    return killStatus == DoesKill;
}

inline KillStatus killStatusForDoesKill(bool doesKill)
{
    return doesKill ? DoesKill : DoesNotKill;
}

enum class PlanStage {
    Initial,
    AfterFixup,
    LICMAndLater
};

// If possible, this will acquire a lock to make sure that if multiple threads
// start crashing at the same time, you get coherent dump output. Use this only
// when you're forcing a crash with diagnostics.
void startCrashing();

JS_EXPORT_PRIVATE bool isCrashing();

struct NodeAndIndex {
    NodeAndIndex()
        : node(nullptr)
        , index(UINT_MAX)
    {
    }
    
    NodeAndIndex(Node* node, unsigned index)
        : node(node)
        , index(index)
    {
        ASSERT(!node == (index == UINT_MAX));
    }
    
    bool operator!() const
    {
        return !node;
    }
    
    Node* node;
    unsigned index;
};

// A less-than operator for strings that is useful for generating string switches. Sorts by <
// relation on characters. Ensures that if a is a prefix of b, then a < b.
bool stringLessThan(StringImpl& a, StringImpl& b);

} } // namespace JSC::DFG

namespace WTF {

void printInternal(PrintStream&, JSC::DFG::OptimizationFixpointState);
void printInternal(PrintStream&, JSC::DFG::GraphForm);
void printInternal(PrintStream&, JSC::DFG::UnificationState);
void printInternal(PrintStream&, JSC::DFG::RefCountState);
void printInternal(PrintStream&, JSC::DFG::ProofStatus);

} // namespace WTF

#endif // ENABLE(DFG_JIT)

namespace JSC { namespace DFG {

// Put things here that must be defined even if ENABLE(DFG_JIT) is false.

enum CapabilityLevel {
    CannotCompile,
    CanCompile,
    CanCompileAndInline,
    CapabilityLevelNotSet
};

inline bool canCompile(CapabilityLevel level)
{
    switch (level) {
    case CanCompile:
    case CanCompileAndInline:
        return true;
    default:
        return false;
    }
}

inline bool canInline(CapabilityLevel level)
{
    switch (level) {
    case CanCompileAndInline:
        return true;
    default:
        return false;
    }
}

inline CapabilityLevel leastUpperBound(CapabilityLevel a, CapabilityLevel b)
{
    switch (a) {
    case CannotCompile:
        return CannotCompile;
    case CanCompile:
        switch (b) {
        case CanCompile:
        case CanCompileAndInline:
            return CanCompile;
        default:
            return CannotCompile;
        }
    case CanCompileAndInline:
        return b;
    case CapabilityLevelNotSet:
        ASSERT_NOT_REACHED();
        return CannotCompile;
    }
    ASSERT_NOT_REACHED();
    return CannotCompile;
}

// Unconditionally disable DFG disassembly support if the DFG is not compiled in.
inline bool shouldDumpDisassembly(JITCompilationMode mode = JITCompilationMode::DFG)
{
#if ENABLE(DFG_JIT)
    return Options::dumpDisassembly() || Options::dumpDFGDisassembly() || (isFTL(mode) && Options::dumpFTLDisassembly());
#else
    UNUSED_PARAM(mode);
    return false;
#endif
}

} } // namespace JSC::DFG

namespace WTF {

void printInternal(PrintStream&, JSC::DFG::CapabilityLevel);

} // namespace WTF
