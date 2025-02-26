/*
 * Copyright (C) 2008-2024 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Cameron Zwarich <cwzwarich@uwaterloo.ca>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ArrayProfile.h"
#include "BytecodeConventions.h"
#include "CallLinkInfo.h"
#include "CodeBlockHash.h"
#include "CodeOrigin.h"
#include "CodeType.h"
#include "CompilationResult.h"
#include "ConcurrentJSLock.h"
#include "DFGCodeOriginPool.h"
#include "DFGCommon.h"
#include "DirectEvalCodeCache.h"
#include "EvalExecutable.h"
#include "ExecutionCounter.h"
#include "ExpressionInfo.h"
#include "FunctionExecutable.h"
#include "HandlerInfo.h"
#include "ICStatusMap.h"
#include "Instruction.h"
#include "InstructionStream.h"
#include "JITCode.h"
#include "JITCodeMap.h"
#include "JITMathICForwards.h"
#include "JSCast.h"
#include "JumpTable.h"
#include "LazyValueProfile.h"
#include "MetadataTable.h"
#include "ModuleProgramExecutable.h"
#include "ObjectAllocationProfile.h"
#include "Options.h"
#include "Printer.h"
#include "ProfilerJettisonReason.h"
#include "ProgramExecutable.h"
#include "PutPropertySlot.h"
#include "RegisterAtOffsetList.h"
#include "ValueProfile.h"
#include "VirtualRegister.h"
#include "Watchpoint.h"
#include <wtf/ApproximateTime.h>
#include <wtf/FastMalloc.h>
#include <wtf/FixedVector.h>
#include <wtf/HashSet.h>
#include <wtf/RefPtr.h>
#include <wtf/SegmentedVector.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

#if ENABLE(DFG_JIT)
namespace DFG {
class JITData;
} // namespace DFG
#endif

class UnaryArithProfile;
class BinaryArithProfile;
class BytecodeLivenessAnalysis;
class CodeBlockSet;
class JSModuleEnvironment;
class LLIntOffsetsExtractor;
class LLIntPrototypeLoadAdaptiveStructureWatchpoint;
class MetadataTable;
class RegisterAtOffsetList;
class ScriptExecutable;
class StructureStubInfo;
class BaselineJITCode;
class BaselineJITData;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(CodeBlockRareData);

enum class AccessType : int8_t;

struct OpCatch;

enum ReoptimizationMode { DontCountReoptimization, CountReoptimization };

class CodeBlock : public JSCell {
    typedef JSCell Base;
    friend class BytecodeLivenessAnalysis;
    friend class JIT;
    friend class LLIntOffsetsExtractor;

public:

    enum CopyParsedBlockTag { CopyParsedBlock };

    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;
    static constexpr bool needsDestruction = true;

    template<typename, SubspaceAccess>
    static void subspaceFor(VM&)
    {
        RELEASE_ASSERT_NOT_REACHED();
    }
    // GC strongly assumes CodeBlock is not a PreciseAllocation for now.
    static constexpr uint8_t numberOfLowerTierPreciseCells = 0;

    DECLARE_INFO;

protected:
    CodeBlock(VM&, Structure*, CopyParsedBlockTag, CodeBlock& other);
    CodeBlock(VM&, Structure*, ScriptExecutable* ownerExecutable, UnlinkedCodeBlock*, JSScope*);

    void finishCreation(VM&, CopyParsedBlockTag, CodeBlock& other);
    bool finishCreation(VM&, ScriptExecutable* ownerExecutable, UnlinkedCodeBlock*, JSScope*);

    WriteBarrier<JSGlobalObject> m_globalObject;

public:
    JS_EXPORT_PRIVATE ~CodeBlock();

    UnlinkedCodeBlock* unlinkedCodeBlock() const { return m_unlinkedCode.get(); }

    CString inferredName() const;
    CodeBlockHash hash() const;
    bool hasHash() const;
    bool isSafeToComputeHash() const;
    CString hashAsStringIfPossible() const;
    CString sourceCodeForTools() const;
    CString sourceCodeOnOneLine() const; // As sourceCodeForTools(), but replaces all whitespace runs with a single space.
    void dumpAssumingJITType(PrintStream&, JITType) const;
    JS_EXPORT_PRIVATE void dump(PrintStream&) const;

    void dumpSimpleName(PrintStream&) const;

    MetadataTable* metadataTable() const { return m_metadata.get(); }

    unsigned numParameters() const { return m_numParameters; }
private:
    void setNumParameters(unsigned newValue, bool allocateArgumentValueProfiles);
public:

    bool couldBeTainted() const { return m_couldBeTainted; }

    unsigned numberOfArgumentsToSkip() const { return m_numberOfArgumentsToSkip; }

    unsigned numCalleeLocals() const { return m_numCalleeLocals; }

    unsigned numVars() const { return m_numVars; }
    unsigned numTmps() const { return m_unlinkedCode->hasCheckpoints() * maxNumCheckpointTmps; }

    static constexpr ptrdiff_t offsetOfNumParameters() { return OBJECT_OFFSETOF(CodeBlock, m_numParameters); }
    static constexpr ptrdiff_t offsetOfVM() { return OBJECT_OFFSETOF(CodeBlock, m_vm); }

    CodeBlock* alternative() const { return static_cast<CodeBlock*>(m_alternative.get()); }
    void setAlternative(VM&, CodeBlock*);

    template <typename Functor> void forEachRelatedCodeBlock(Functor&& functor)
    {
        Functor f(std::forward<Functor>(functor));
        Vector<CodeBlock*, 4> codeBlocks;
        codeBlocks.append(this);

        while (!codeBlocks.isEmpty()) {
            CodeBlock* currentCodeBlock = codeBlocks.takeLast();
            f(currentCodeBlock);

            if (CodeBlock* alternative = currentCodeBlock->alternative())
                codeBlocks.append(alternative);
            if (CodeBlock* osrEntryBlock = currentCodeBlock->specialOSREntryBlockOrNull())
                codeBlocks.append(osrEntryBlock);
        }
    }
    
    CodeSpecializationKind specializationKind() const
    {
        return specializationFromIsConstruct(isConstructor());
    }

    CodeBlock* alternativeForJettison();    
    JS_EXPORT_PRIVATE CodeBlock* baselineAlternative();
    
    // FIXME: Get rid of this.
    // https://bugs.webkit.org/show_bug.cgi?id=123677
    CodeBlock* baselineVersion();

    DECLARE_VISIT_CHILDREN;

    static size_t estimatedSize(JSCell*, VM&);
    static void destroy(JSCell*);
    void finalizeUnconditionally(VM&, CollectionScope);

    void notifyLexicalBindingUpdate();

    void dumpSource();
    void dumpSource(PrintStream&);

    void dumpBytecode();
    void dumpBytecode(PrintStream&);
    void dumpBytecode(PrintStream& out, const JSInstructionStream::Ref& it, const ICStatusMap& = ICStatusMap());
    void dumpBytecode(PrintStream& out, unsigned bytecodeOffset, const ICStatusMap& = ICStatusMap());

    void dumpExceptionHandlers(PrintStream&);
    void printStructures(PrintStream&, const JSInstruction*);
    void printStructure(PrintStream&, const char* name, const JSInstruction*, int operand);

    void dumpMathICStats();

    bool isConstructor() const { return m_unlinkedCode->isConstructor(); }
    CodeType codeType() const { return m_unlinkedCode->codeType(); }

    JSParserScriptMode scriptMode() const { return m_unlinkedCode->scriptMode(); }

    bool hasInstalledVMTrapsBreakpoints() const;
    bool canInstallVMTrapBreakpoints() const;
    bool installVMTrapBreakpoints();

    ALWAYS_INLINE bool isTemporaryRegister(VirtualRegister reg)
    {
        return reg.offset() >= static_cast<int>(m_numVars);
    }

    HandlerInfo* handlerForBytecodeIndex(BytecodeIndex, RequiredHandler = RequiredHandler::AnyHandler);
    HandlerInfo* handlerForIndex(unsigned, RequiredHandler = RequiredHandler::AnyHandler);
    void removeExceptionHandlerForCallSite(DisposableCallSiteIndex);

    LineColumn lineColumnForBytecodeIndex(BytecodeIndex) const;
    ExpressionInfo::Entry expressionInfoForBytecodeIndex(BytecodeIndex) const;

    std::optional<BytecodeIndex> bytecodeIndexFromCallSiteIndex(CallSiteIndex);

    // Because we might throw out baseline JIT code and all its baseline JIT data (m_jitData),
    // you need to be careful about the lifetime of when you use the return value of this function.
    // The return value may have raw pointers into this data structure that gets thrown away.
    // Specifically, you need to ensure that no GC can be finalized (typically that means no
    // allocations) between calling this and the last use of it.
    void getICStatusMap(const ConcurrentJSLocker&, ICStatusMap& result);
    void getICStatusMap(ICStatusMap& result);
    
#if ENABLE(JIT)
    void setupWithUnlinkedBaselineCode(Ref<BaselineJITCode>);

    static constexpr ptrdiff_t offsetOfJITData() { return OBJECT_OFFSETOF(CodeBlock, m_jitData); }

    // O(n) operation. Use getICStatusMap() unless you really only intend to get one stub info.
    StructureStubInfo* findStubInfo(CodeOrigin);

    const JITCodeMap& jitCodeMap();

    std::optional<CodeOrigin> findPC(void* pc);
#endif // ENABLE(JIT)

    void unlinkOrUpgradeIncomingCalls(VM&, CodeBlock*);
    void linkIncomingCall(JSCell* caller, CallLinkInfoBase*);

    const JSInstruction* outOfLineJumpTarget(const JSInstruction* pc);
    int outOfLineJumpOffset(JSInstructionStream::Offset offset)
    {
        return m_unlinkedCode->outOfLineJumpOffset(offset);
    }
    int outOfLineJumpOffset(const JSInstruction* pc);
    int outOfLineJumpOffset(const JSInstructionStream::Ref& instruction)
    {
        return outOfLineJumpOffset(instruction.ptr());
    }

    inline unsigned bytecodeOffset(const JSInstruction* returnAddress)
    {
        const auto* instructionsBegin = instructions().at(0).ptr();
        const auto* instructionsEnd = reinterpret_cast<const JSInstruction*>(reinterpret_cast<uintptr_t>(instructionsBegin) + instructions().size());
        RELEASE_ASSERT(returnAddress >= instructionsBegin && returnAddress < instructionsEnd);
        return returnAddress - instructionsBegin;
    }

    inline BytecodeIndex bytecodeIndex(const JSInstruction* returnAddress)
    {
        return BytecodeIndex(bytecodeOffset(returnAddress));
    }

    const JSInstructionStream& instructions() const { return m_unlinkedCode->instructions(); }
    const JSInstruction* instructionAt(BytecodeIndex index) const { return instructions().at(index).ptr(); }

    size_t predictedMachineCodeSize();

    unsigned instructionsSize() const { return instructions().size(); }
    unsigned bytecodeCost() const { return m_bytecodeCost; }

    // Exactly equivalent to codeBlock->ownerExecutable()->newReplacementCodeBlockFor(codeBlock->specializationKind())
    CodeBlock* newReplacement();
    
    void setJITCode(Ref<JSC::JITCode>&& code)
    {
        if (!code->isShared())
            heap()->reportExtraMemoryAllocated(this, code->size());

        ConcurrentJSLocker locker(m_lock);
        WTF::storeStoreFence(); // This is probably not needed because the lock will also do something similar, but it's good to be paranoid.
        m_jitCode = WTFMove(code);
    }

    RefPtr<JSC::JITCode> jitCode() { return m_jitCode; }
    static constexpr ptrdiff_t jitCodeOffset() { return OBJECT_OFFSETOF(CodeBlock, m_jitCode); }
    JITType jitType() const
    {
        auto* jitCode = m_jitCode.get();
        JITType result = JSC::JITCode::jitTypeFor(jitCode);
        return result;
    }

    bool hasBaselineJITProfiling() const
    {
        return jitType() == JITType::BaselineJIT;
    }

    bool useDataIC() const;

    CodePtr<JSEntryPtrTag> addressForCallConcurrently(const ConcurrentJSLocker&, ArityCheckMode) const;

#if ENABLE(JIT)
    CodeBlock* replacement();

    DFG::CapabilityLevel computeCapabilityLevel();
    DFG::CapabilityLevel capabilityLevel();
    DFG::CapabilityLevel capabilityLevelState() { return static_cast<DFG::CapabilityLevel>(m_capabilityLevelState); }

    CodeBlock* optimizedReplacement(JITType typeToReplace);
    CodeBlock* optimizedReplacement(); // the typeToReplace is my JITType
    bool hasOptimizedReplacement(JITType typeToReplace);
    bool hasOptimizedReplacement(); // the typeToReplace is my JITType
#endif

    void jettison(Profiler::JettisonReason, ReoptimizationMode = DontCountReoptimization, const FireDetail* = nullptr);
    
    ScriptExecutable* ownerExecutable() const { return m_ownerExecutable.get(); }
    
    VM& vm() const { return *m_vm; }

    VirtualRegister thisRegister() const { return m_unlinkedCode->thisRegister(); }

    void setScopeRegister(VirtualRegister scopeRegister)
    {
        ASSERT(scopeRegister.isLocal() || !scopeRegister.isValid());
        m_scopeRegister = scopeRegister;
    }

    VirtualRegister scopeRegister() const
    {
        return m_scopeRegister;
    }
    
    PutPropertySlot::Context putByIdContext() const
    {
        if (codeType() == EvalCode)
            return PutPropertySlot::PutByIdEval;
        return PutPropertySlot::PutById;
    }

    const SourceCode& source() const { return m_ownerExecutable->source(); }
    unsigned sourceOffset() const { return m_ownerExecutable->source().startOffset(); }
    unsigned firstLineColumnOffset() const { return m_ownerExecutable->startColumn(); }

    size_t numberOfJumpTargets() const { return m_unlinkedCode->numberOfJumpTargets(); }
    unsigned jumpTarget(int index) const { return m_unlinkedCode->jumpTarget(index); }

    String nameForRegister(VirtualRegister);

    static constexpr ptrdiff_t offsetOfArgumentValueProfiles() { return OBJECT_OFFSETOF(CodeBlock, m_argumentValueProfiles); }
    unsigned numberOfArgumentValueProfiles()
    {
        ASSERT(m_argumentValueProfiles.size() == static_cast<unsigned>(m_numParameters) || !Options::useJIT() || !JITCode::isBaselineCode(jitType()));
        return m_argumentValueProfiles.size();
    }

    ArgumentValueProfile& valueProfileForArgument(unsigned argumentIndex)
    {
        ASSERT(Options::useJIT()); // This is only called from the various JIT compilers or places that first check numberOfArgumentValueProfiles before calling this.
        ASSERT(JITCode::isBaselineCode(jitType()));
        return m_argumentValueProfiles[argumentIndex];
    }

    FixedVector<ArgumentValueProfile>& argumentValueProfiles() { return m_argumentValueProfiles; }

    ValueProfile& valueProfileForOffset(unsigned profileOffset) { return m_metadata->valueProfileForOffset(profileOffset); }

    ValueProfile* tryGetValueProfileForBytecodeIndex(BytecodeIndex);
    ValueProfile& valueProfileForBytecodeIndex(BytecodeIndex);
    SpeculatedType valueProfilePredictionForBytecodeIndex(const ConcurrentJSLocker&, BytecodeIndex, JSValue* specFailValue = nullptr);

    template<typename Functor> void forEachValueProfile(const Functor&);
    template<typename Functor> void forEachArrayAllocationProfile(const Functor&);
    template<typename Functor> void forEachObjectAllocationProfile(const Functor&);
    template<typename Functor> void forEachLLIntOrBaselineCallLinkInfo(const Functor&);

    BinaryArithProfile* binaryArithProfileForBytecodeIndex(BytecodeIndex);
    UnaryArithProfile* unaryArithProfileForBytecodeIndex(BytecodeIndex);
    BinaryArithProfile* binaryArithProfileForPC(const JSInstruction*);
    UnaryArithProfile* unaryArithProfileForPC(const JSInstruction*);

    bool couldTakeSpecialArithFastCase(BytecodeIndex bytecodeOffset);

    ArrayProfile* getArrayProfile(const ConcurrentJSLocker&, BytecodeIndex);

    // Exception handling support

    size_t numberOfExceptionHandlers() const { return m_rareData ? m_rareData->m_exceptionHandlers.size() : 0; }
    HandlerInfo& exceptionHandler(int index) { RELEASE_ASSERT(m_rareData); return m_rareData->m_exceptionHandlers[index]; }

    bool hasExpressionInfo() { return m_unlinkedCode->hasExpressionInfo(); }

#if ENABLE(DFG_JIT)
    DFG::CodeOriginPool& codeOrigins();
    
    // Having code origins implies that there has been some inlining.
    bool hasCodeOrigins()
    {
        return JSC::JITCode::isOptimizingJIT(jitType());
    }
        
    bool canGetCodeOrigin(CallSiteIndex index)
    {
        if (!hasCodeOrigins())
            return false;
        return index.bits() < codeOrigins().size();
    }

    CodeOrigin codeOrigin(CallSiteIndex index)
    {
        return codeOrigins().get(index.bits());
    }

    CompressedLazyValueProfileHolder& lazyValueProfiles()
    {
        return m_lazyValueProfiles;
    }
#endif // ENABLE(DFG_JIT)

    // Constant Pool
#if ENABLE(DFG_JIT)
    size_t numberOfIdentifiers() const { return m_unlinkedCode->numberOfIdentifiers() + numberOfDFGIdentifiers(); }
    size_t numberOfDFGIdentifiers() const;
    const Identifier& identifier(int index) const;
#else
    size_t numberOfIdentifiers() const { return m_unlinkedCode->numberOfIdentifiers(); }
    const Identifier& identifier(int index) const { return m_unlinkedCode->identifier(index); }
#endif
#if ASSERT_ENABLED
    bool hasIdentifier(UniquedStringImpl*);
    bool wasDestructed();
#endif

    Vector<WriteBarrier<Unknown>>& constants() { return m_constantRegisters; }
    unsigned addConstant(const ConcurrentJSLocker&, JSValue v)
    {
        unsigned result = m_constantRegisters.size();
        m_constantRegisters.append(WriteBarrier<Unknown>());
        m_constantRegisters.last().set(*m_vm, this, v);
        return result;
    }

    unsigned addConstantLazily(const ConcurrentJSLocker&)
    {
        unsigned result = m_constantRegisters.size();
        m_constantRegisters.append(WriteBarrier<Unknown>());
        return result;
    }

    const Vector<WriteBarrier<Unknown>>& constantRegisters() { return m_constantRegisters; }
    WriteBarrier<Unknown>& constantRegister(VirtualRegister reg) { return m_constantRegisters[reg.toConstantIndex()]; }
    ALWAYS_INLINE JSValue getConstant(VirtualRegister reg) const { return m_constantRegisters[reg.toConstantIndex()].get(); }
    bool isConstantOwnedByUnlinkedCodeBlock(VirtualRegister) const;
    ALWAYS_INLINE SourceCodeRepresentation constantSourceCodeRepresentation(VirtualRegister reg) const { return m_unlinkedCode->constantSourceCodeRepresentation(reg); }
    ALWAYS_INLINE SourceCodeRepresentation constantSourceCodeRepresentation(unsigned index) const { return m_unlinkedCode->constantSourceCodeRepresentation(index); }
    static constexpr ptrdiff_t offsetOfConstantsVectorBuffer() { return OBJECT_OFFSETOF(CodeBlock, m_constantRegisters) + decltype(m_constantRegisters)::dataMemoryOffset(); }

    FunctionExecutable* functionDecl(int index) { return m_functionDecls[index].get(); }
    int numberOfFunctionDecls() { return m_functionDecls.size(); }
    FunctionExecutable* functionExpr(int index) { return m_functionExprs[index].get(); }
    
    const BitVector& bitVector(size_t i) { return m_unlinkedCode->bitVector(i); }

    JSC::Heap* heap() const { return &m_vm->heap; }
    JSGlobalObject* globalObject() { return m_globalObject.get(); }

    static constexpr ptrdiff_t offsetOfGlobalObject() { return OBJECT_OFFSETOF(CodeBlock, m_globalObject); }

    JSGlobalObject* globalObjectFor(CodeOrigin);

    BytecodeLivenessAnalysis& livenessAnalysis()
    {
        return m_unlinkedCode->livenessAnalysis(this);
    }
    
    void validate();

    // Jump Tables

#if ENABLE(JIT)
    SimpleJumpTable& baselineSwitchJumpTable(int tableIndex);
    StringJumpTable& baselineStringSwitchJumpTable(int tableIndex);
    void setBaselineJITData(std::unique_ptr<BaselineJITData>&& jitData)
    {
        ASSERT(!m_jitData);
        WTF::storeStoreFence(); // m_jitData is accessed from concurrent GC threads.
        m_jitData = jitData.release();
    }
    BaselineJITData* baselineJITData()
    {
        if (!JSC::JITCode::isOptimizingJIT(jitType()))
            return std::bit_cast<BaselineJITData*>(m_jitData);
        return nullptr;
    }

#if ENABLE(DFG_JIT)
    void setDFGJITData(std::unique_ptr<DFG::JITData>&& jitData)
    {
        ASSERT(!m_jitData);
        WTF::storeStoreFence(); // m_jitData is accessed from concurrent GC threads.
        m_jitData = jitData.release();
    }

    DFG::JITData* dfgJITData()
    {
        if (JSC::JITCode::isOptimizingJIT(jitType()))
            return std::bit_cast<DFG::JITData*>(m_jitData);
        return nullptr;
    }
#endif
#endif
    size_t numberOfUnlinkedSwitchJumpTables() const { return m_unlinkedCode->numberOfUnlinkedSwitchJumpTables(); }
    const UnlinkedSimpleJumpTable& unlinkedSwitchJumpTable(int tableIndex) { return m_unlinkedCode->unlinkedSwitchJumpTable(tableIndex); }

#if ENABLE(DFG_JIT)
    StringJumpTable& dfgStringSwitchJumpTable(int tableIndex);
    SimpleJumpTable& dfgSwitchJumpTable(int tableIndex);
#endif

    size_t numberOfUnlinkedStringSwitchJumpTables() const { return m_unlinkedCode->numberOfUnlinkedStringSwitchJumpTables(); }
    const UnlinkedStringJumpTable& unlinkedStringSwitchJumpTable(int tableIndex) { return m_unlinkedCode->unlinkedStringSwitchJumpTable(tableIndex); }

    DirectEvalCodeCache& directEvalCodeCache() { createRareDataIfNecessary(); return m_rareData->m_directEvalCodeCache; }

    enum class ShrinkMode {
        // Shrink prior to generating machine code that may point directly into vectors.
        EarlyShrink,

        // Shrink after generating machine code, and after possibly creating new vectors
        // and appending to others. At this time it is not safe to shrink certain vectors
        // because we would have generated machine code that references them directly.
        LateShrink,
    };
    void shrinkToFit(const ConcurrentJSLocker&, ShrinkMode);

    // Functions for controlling when JITting kicks in, in a mixed mode
    // execution world.

    bool checkIfJITThresholdReached()
    {
        return m_unlinkedCode->llintExecuteCounter().checkIfThresholdCrossedAndSet(this);
    }

    void dontJITAnytimeSoon()
    {
        m_unlinkedCode->llintExecuteCounter().deferIndefinitely();
    }

    void jitSoon();
    void jitNextInvocation();

    const BaselineExecutionCounter& llintExecuteCounter() const
    {
        return m_unlinkedCode->llintExecuteCounter();
    }

    typedef UncheckedKeyHashMap<std::tuple<StructureID, BytecodeIndex>, FixedVector<LLIntPrototypeLoadAdaptiveStructureWatchpoint>> StructureWatchpointMap;
    StructureWatchpointMap& llintGetByIdWatchpointMap() { return m_llintGetByIdWatchpointMap; }

    // Functions for controlling when tiered compilation kicks in. This
    // controls both when the optimizing compiler is invoked and when OSR
    // entry happens. Two triggers exist: the loop trigger and the return
    // trigger. In either case, when an addition to m_jitExecuteCounter
    // causes it to become non-negative, the optimizing compiler is
    // invoked. This includes a fast check to see if this CodeBlock has
    // already been optimized (i.e. replacement() returns a CodeBlock
    // that was optimized with a higher tier JIT than this one). In the
    // case of the loop trigger, if the optimized compilation succeeds
    // (or has already succeeded in the past) then OSR is attempted to
    // redirect program flow into the optimized code.

    // These functions are called from within the optimization triggers,
    // and are used as a single point at which we define the heuristics
    // for how much warm-up is mandated before the next optimization
    // trigger files. All CodeBlocks start out with optimizeAfterWarmUp(),
    // as this is called from the CodeBlock constructor.

    // When we observe a lot of speculation failures, we trigger a
    // reoptimization. But each time, we increase the optimization trigger
    // to avoid thrashing.
    JS_EXPORT_PRIVATE unsigned reoptimizationRetryCounter() const;
    void countReoptimization();

#if !ENABLE(C_LOOP)
    static unsigned numberOfLLIntBaselineCalleeSaveRegisters() { return RegisterSetBuilder::llintBaselineCalleeSaveRegisters().numberOfSetRegisters(); }
    static size_t llintBaselineCalleeSaveSpaceAsVirtualRegisters();
    static size_t calleeSaveSpaceAsVirtualRegisters(const RegisterAtOffsetList&);
#else
    static unsigned numberOfLLIntBaselineCalleeSaveRegisters() { return 0; }
    static size_t llintBaselineCalleeSaveSpaceAsVirtualRegisters() { return 1; };
    static size_t calleeSaveSpaceAsVirtualRegisters(const RegisterAtOffsetList&) { return 0; }
#endif

#if ENABLE(JIT)
    unsigned numberOfDFGCompiles();

    int32_t codeTypeThresholdMultiplier() const;

    int32_t adjustedCounterValue(int32_t desiredThreshold);

    const BaselineExecutionCounter& baselineExecuteCounter();

    unsigned optimizationDelayCounter() const { return m_optimizationDelayCounter; }

    // Check if the optimization threshold has been reached, and if not,
    // adjust the heuristics accordingly. Returns true if the threshold has
    // been reached.
    bool checkIfOptimizationThresholdReached();

    // Call this to force the next optimization trigger to fire. This is
    // rarely wise, since optimization triggers are typically more
    // expensive than executing baseline code.
    void optimizeNextInvocation();

    // Call this to prevent optimization from happening again. Note that
    // optimization will still happen after roughly 2^29 invocations,
    // so this is really meant to delay that as much as possible. This
    // is called if optimization failed, and we expect it to fail in
    // the future as well.
    void dontOptimizeAnytimeSoon();

    // Call this to reinitialize the counter to its starting state,
    // forcing a warm-up to happen before the next optimization trigger
    // fires. This is called in the CodeBlock constructor. It also
    // makes sense to call this if an OSR exit occurred. Note that
    // OSR exit code is code generated, so the value of the execute
    // counter that this corresponds to is also available directly.
    void optimizeAfterWarmUp();

    // Call this to force an optimization trigger to fire only after
    // a lot of warm-up.
    void optimizeAfterLongWarmUp();

    // Call this to cause an optimization trigger to fire soon, but
    // not necessarily the next one. This makes sense if optimization
    // succeeds. Successful optimization means that all calls are
    // relinked to the optimized code, so this only affects call
    // frames that are still executing this CodeBlock. The value here
    // is tuned to strike a balance between the cost of OSR entry
    // (which is too high to warrant making every loop back edge to
    // trigger OSR immediately) and the cost of executing baseline
    // code (which is high enough that we don't necessarily want to
    // have a full warm-up). The intuition for calling this instead of
    // optimizeNextInvocation() is for the case of recursive functions
    // with loops. Consider that there may be N call frames of some
    // recursive function, for a reasonably large value of N. The top
    // one triggers optimization, and then returns, and then all of
    // the others return. We don't want optimization to be triggered on
    // each return, as that would be superfluous. It only makes sense
    // to trigger optimization if one of those functions becomes hot
    // in the baseline code.
    void optimizeSoon();

    void forceOptimizationSlowPathConcurrently();

    void setOptimizationThresholdBasedOnCompilationResult(CompilationResult);
    
    BytecodeIndex bytecodeIndexForExit(BytecodeIndex) const;
    uint32_t osrExitCounter() const { return m_osrExitCounter; }

    void countOSRExit() { m_osrExitCounter++; }

    static constexpr ptrdiff_t offsetOfOSRExitCounter() { return OBJECT_OFFSETOF(CodeBlock, m_osrExitCounter); }

    uint32_t adjustedExitCountThreshold(uint32_t desiredThreshold);
    uint32_t exitCountThresholdForReoptimization();
    uint32_t exitCountThresholdForReoptimizationFromLoop();
    bool shouldReoptimizeNow();
    bool shouldReoptimizeFromLoopNow();

#else // No JIT
    void optimizeAfterWarmUp() { }
    unsigned numberOfDFGCompiles() { return 0; }
#endif

    bool shouldOptimizeNowFromBaseline();
    void updateAllNonLazyValueProfilePredictions(const ConcurrentJSLocker&);
    void updateAllLazyValueProfilePredictions(const ConcurrentJSLocker&);
    void updateAllArrayProfilePredictions();
    void updateAllArrayAllocationProfilePredictions();
    void updateAllPredictions();

    unsigned frameRegisterCount();
    int stackPointerOffset();

    bool hasOpDebugForLineAndColumn(unsigned line, std::optional<unsigned> column);

    bool hasDebuggerRequests() const { return m_debuggerRequests; }
    static constexpr ptrdiff_t offsetOfDebuggerRequests() { return OBJECT_OFFSETOF(CodeBlock, m_debuggerRequests); }

    void addBreakpoint(unsigned numBreakpoints);
    void removeBreakpoint(unsigned numBreakpoints)
    {
        ASSERT(m_numBreakpoints >= numBreakpoints);
        m_numBreakpoints -= numBreakpoints;
    }

    bool isJettisoned() const { return m_isJettisoned; }

    enum SteppingMode {
        SteppingModeDisabled,
        SteppingModeEnabled
    };
    void setSteppingMode(SteppingMode);

    void clearDebuggerRequests()
    {
        m_steppingMode = SteppingModeDisabled;
        m_numBreakpoints = 0;
    }

    bool wasCompiledWithDebuggingOpcodes() const { return m_unlinkedCode->wasCompiledWithDebuggingOpcodes(); }
    
    // This is intentionally public; it's the responsibility of anyone doing any
    // of the following to hold the lock:
    //
    // - Modifying any inline cache in this code block.
    //
    // - Quering any inline cache in this code block, from a thread other than
    //   the main thread.
    //
    // Additionally, it's only legal to modify the inline cache on the main
    // thread. This means that the main thread can query the inline cache without
    // locking. This is crucial since executing the inline cache is effectively
    // "querying" it.
    //
    // Another exception to the rules is that the GC can do whatever it wants
    // without holding any locks, because the GC is guaranteed to wait until any
    // concurrent compilation threads finish what they're doing.
    mutable ConcurrentJSLock m_lock;

    bool m_shouldAlwaysBeInlined { true }; // Not a bitfield because the JIT wants to store to it.

#if USE(JSVALUE64)
    // 64bit environment does not need a lock for ValueProfile operations.
    NoLockingNecessaryTag valueProfileLock() { return NoLockingNecessary; }
#else
    ConcurrentJSLock& valueProfileLock() { return m_lock; }
#endif

    static constexpr ptrdiff_t offsetOfShouldAlwaysBeInlined() { return OBJECT_OFFSETOF(CodeBlock, m_shouldAlwaysBeInlined); }

#if ENABLE(JIT)
    unsigned m_capabilityLevelState : 2; // DFG::CapabilityLevel
#endif

    bool m_didFailJITCompilation : 1;
    bool m_didFailFTLCompilation : 1;
    bool m_hasBeenCompiledWithFTL : 1;
    bool m_isJettisoned : 1;

    bool m_visitChildrenSkippedDueToOldAge { false };

    // Internal methods for use by validation code. It would be private if it wasn't
    // for the fact that we use it from anonymous namespaces.
    void beginValidationDidFail();
    NO_RETURN_DUE_TO_CRASH void endValidationDidFail();

    struct RareData {
        WTF_MAKE_STRUCT_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(CodeBlockRareData);
    public:
        Vector<HandlerInfo> m_exceptionHandlers;

        DirectEvalCodeCache m_directEvalCodeCache;
    };

    void clearExceptionHandlers()
    {
        if (m_rareData)
            m_rareData->m_exceptionHandlers.clear();
    }

    void appendExceptionHandler(const HandlerInfo& handler)
    {
        createRareDataIfNecessary(); // We may be handling the exception of an inlined call frame.
        m_rareData->m_exceptionHandlers.append(handler);
    }

    DisposableCallSiteIndex newExceptionHandlingCallSiteIndex(CallSiteIndex originalCallSite);

    void ensureCatchLivenessIsComputedForBytecodeIndex(BytecodeIndex);

    bool hasTailCalls() const { return m_unlinkedCode->hasTailCalls(); }

    template<typename Metadata>
    Metadata& metadata(OpcodeID opcodeID, unsigned metadataID)
    {
        ASSERT(m_metadata);
        ASSERT_UNUSED(opcodeID, opcodeID == Metadata::opcodeID);
        return m_metadata->get<Metadata>()[metadataID];
    }

    template<typename Metadata>
    ptrdiff_t offsetInMetadataTable(Metadata* metadata)
    {
        return std::bit_cast<uint8_t*>(metadata) - std::bit_cast<uint8_t*>(metadataTable());
    }

    size_t metadataSizeInBytes()
    {
        return m_unlinkedCode->metadataSizeInBytes();
    }

    MetadataTable* metadataTable() { return m_metadata.get(); }
    const void* instructionsRawPointer() { return m_instructionsRawPointer; }

    static constexpr ptrdiff_t offsetOfMetadataTable() { return OBJECT_OFFSETOF(CodeBlock, m_metadata); }
    static constexpr ptrdiff_t offsetOfInstructionsRawPointer() { return OBJECT_OFFSETOF(CodeBlock, m_instructionsRawPointer); }

    bool loopHintsAreEligibleForFuzzingEarlyReturn() { return m_unlinkedCode->loopHintsAreEligibleForFuzzingEarlyReturn(); }

    double optimizationThresholdScalingFactor() const;

protected:
    void finalizeLLIntInlineCaches();
#if ENABLE(JIT)
    void finalizeJITInlineCaches();
#endif
#if ENABLE(DFG_JIT)
    void tallyFrequentExitSites();
#else
    void tallyFrequentExitSites() { }
#endif

private:
    friend class CodeBlockSet;
    friend class FunctionExecutable;
    friend class ScriptExecutable;

    template<typename Visitor> ALWAYS_INLINE void visitChildren(Visitor&);

    BytecodeLivenessAnalysis& livenessAnalysisSlow();
    
    CodeBlock* specialOSREntryBlockOrNull();
    
    void noticeIncomingCall(JSCell* caller);

    void updateAllNonLazyValueProfilePredictionsAndCountLiveness(const ConcurrentJSLocker&, unsigned& numberOfLiveNonArgumentValueProfiles, unsigned& numberOfSamplesInProfiles);

    Vector<unsigned> setConstantRegisters(const FixedVector<WriteBarrier<Unknown>>& constants, const FixedVector<SourceCodeRepresentation>& constantsSourceCodeRepresentation);
    void initializeTemplateObjects(ScriptExecutable* topLevelExecutable, const Vector<unsigned>& templateObjectIndices);

    void replaceConstant(VirtualRegister reg, JSValue value)
    {
        ASSERT(reg.isConstant() && static_cast<size_t>(reg.toConstantIndex()) < m_constantRegisters.size());
        m_constantRegisters[reg.toConstantIndex()].set(*m_vm, this, value);
    }

    template<typename Visitor> bool shouldVisitStrongly(const ConcurrentJSLocker&, Visitor&);
    bool shouldJettisonDueToWeakReference(VM&);
    template<typename Visitor> bool shouldJettisonDueToOldAge(const ConcurrentJSLocker&, Visitor&);
    
    template<typename Visitor> void propagateTransitions(const ConcurrentJSLocker&, Visitor&);
    template<typename Visitor> void determineLiveness(const ConcurrentJSLocker&, Visitor&);
        
    template<typename Visitor> void stronglyVisitStrongReferences(const ConcurrentJSLocker&, Visitor&);
    template<typename Visitor> void stronglyVisitWeakReferences(const ConcurrentJSLocker&, Visitor&);
    template<typename Visitor> void visitOSRExitTargets(const ConcurrentJSLocker&, Visitor&);

    unsigned numberOfNonArgumentValueProfiles() { return totalNumberOfValueProfiles() - numberOfArgumentValueProfiles(); }
    unsigned totalNumberOfValueProfiles() { return m_unlinkedCode->numberOfValueProfiles(); }

    Seconds timeSinceCreation()
    {
        return ApproximateTime::now() - m_creationTime;
    }

    void createRareDataIfNecessary()
    {
        if (!m_rareData) {
            auto rareData = makeUnique<RareData>();
            WTF::storeStoreFence();
            m_rareData = WTFMove(rareData);
        }
    }

    void insertBasicBlockBoundariesForControlFlowProfiler();
    void ensureCatchLivenessIsComputedForBytecodeIndexSlow(const OpCatch&, BytecodeIndex);

    template<typename Func>
    void forEachStructureStubInfo(Func);

    const unsigned m_numCalleeLocals;
    const unsigned m_numVars;
    unsigned m_numParameters;
    unsigned m_numberOfArgumentsToSkip : 31 { 0 };
    unsigned m_couldBeTainted : 1 { 0 };
    uint32_t m_osrExitCounter { 0 };
    union {
        unsigned m_debuggerRequests;
        struct {
            unsigned m_hasDebuggerStatement : 1;
            unsigned m_steppingMode : 1;
            unsigned m_numBreakpoints : 30;
        };
    };
    unsigned m_bytecodeCost { 0 };
    VirtualRegister m_scopeRegister;
    mutable CodeBlockHash m_hash;

    WriteBarrier<UnlinkedCodeBlock> m_unlinkedCode;
    WriteBarrier<ScriptExecutable> m_ownerExecutable;
    // m_vm must be a pointer (instead of a reference) because the JSCLLIntOffsetsExtractor
    // cannot handle it being a reference.
    VM* const m_vm;

    const void* const m_instructionsRawPointer { nullptr };
    SentinelLinkedList<CallLinkInfoBase, BasicRawSentinelNode<CallLinkInfoBase>> m_incomingCalls;
    uint16_t m_optimizationDelayCounter { 0 };
    uint16_t m_reoptimizationRetryCounter { 0 };
    float m_previousCounter { 0 };
    StructureWatchpointMap m_llintGetByIdWatchpointMap;
    RefPtr<JSC::JITCode> m_jitCode;
#if ENABLE(JIT)
public:
    void* m_jitData { nullptr };
private:
#endif
    RefPtr<MetadataTable> m_metadata;
#if ENABLE(DFG_JIT)
    // This is relevant to non-DFG code blocks that serve as the profiled code block
    // for DFG code blocks.
    CompressedLazyValueProfileHolder m_lazyValueProfiles;
#endif
    FixedVector<ArgumentValueProfile> m_argumentValueProfiles;

    // Constant Pool
    static_assert(sizeof(Register) == sizeof(WriteBarrier<Unknown>), "Register must be same size as WriteBarrier Unknown");
    // FIXME: This could just be a pointer to m_unlinkedCodeBlock's data, but the DFG mutates
    // it, so we're stuck with it for now.
    Vector<WriteBarrier<Unknown>> m_constantRegisters;
    FixedVector<WriteBarrier<FunctionExecutable>> m_functionDecls;
    FixedVector<WriteBarrier<FunctionExecutable>> m_functionExprs;

    WriteBarrier<CodeBlock> m_alternative;

    ApproximateTime m_creationTime;

    std::unique_ptr<RareData> m_rareData;

#if ASSERT_ENABLED
    Lock m_cachedIdentifierUidsLock;
    HashSet<UniquedStringImpl*> m_cachedIdentifierUids;
    uint32_t m_magic;
#endif
};
/* This check is for normal Release builds; ASSERT_ENABLED changes the size. */
#if !ASSERT_ENABLED
static_assert(sizeof(CodeBlock) <= 224, "Keep it small for memory saving");
#endif

template <typename ExecutableType>
void ScriptExecutable::prepareForExecution(VM& vm, JSFunction* function, JSScope* scope, CodeSpecializationKind kind, CodeBlock*& resultCodeBlock)
{
    if (hasJITCodeFor(kind)) {
        if constexpr (std::is_same<ExecutableType, EvalExecutable>::value)
            resultCodeBlock = jsCast<CodeBlock*>(jsCast<ExecutableType*>(this)->codeBlock());
        else if constexpr (std::is_same<ExecutableType, ProgramExecutable>::value)
            resultCodeBlock = jsCast<CodeBlock*>(jsCast<ExecutableType*>(this)->codeBlock());
        else if constexpr (std::is_same<ExecutableType, ModuleProgramExecutable>::value)
            resultCodeBlock = jsCast<CodeBlock*>(jsCast<ExecutableType*>(this)->codeBlock());
        else {
            static_assert(std::is_same<ExecutableType, FunctionExecutable>::value);
            resultCodeBlock = jsCast<CodeBlock*>(jsCast<ExecutableType*>(this)->codeBlockFor(kind));
        }
        return;
    }

    prepareForExecutionImpl(vm, function, scope, kind, resultCodeBlock);
}

#define CODEBLOCK_LOG_EVENT(codeBlock, summary, details) \
    do { \
        if (codeBlock) \
            (codeBlock->vm().logEvent(codeBlock, summary, [&] () { return toCString details; })); \
    } while (0)


void setPrinter(Printer::PrintRecord&, CodeBlock*);

} // namespace JSC

namespace WTF {
    
JS_EXPORT_PRIVATE void printInternal(PrintStream&, JSC::CodeBlock*);

} // namespace WTF

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
