/*
 * Copyright (C) 2012-2024 Apple Inc. All Rights Reserved.
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

#include "ArithProfile.h"
#include "ArrayProfile.h"
#include "BytecodeConventions.h"
#include "CodeType.h"
#include "DFGExitProfile.h"
#include "ExecutionCounter.h"
#include "ExpressionInfo.h"
#include "HandlerInfo.h"
#include "Identifier.h"
#include "InstructionStream.h"
#include "JSCast.h"
#include "Opcode.h"
#include "ParserModes.h"
#include "RegExp.h"
#include "UnlinkedFunctionExecutable.h"
#include "UnlinkedMetadataTable.h"
#include "ValueProfile.h"
#include "VirtualRegister.h"
#include <algorithm>
#include <wtf/BitVector.h>
#include <wtf/FixedVector.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/TriState.h>
#include <wtf/Vector.h>
#include <wtf/text/UniquedStringImpl.h>

namespace JSC {

class BytecodeLivenessAnalysis;
class BytecodeRewriter;
class CodeBlock;
class Debugger;
class FunctionExecutable;
class ParserError;
class ScriptExecutable;
class SourceCode;
class SourceProvider;
class UnlinkedCodeBlock;
class UnlinkedCodeBlockGenerator;
class UnlinkedFunctionCodeBlock;
class UnlinkedFunctionExecutable;
class BaselineJITCode;
struct ExecutableInfo;
enum class LinkTimeConstant : int32_t;

template<typename CodeBlockType>
class CachedCodeBlock;

typedef unsigned UnlinkedArrayAllocationProfile;
typedef unsigned UnlinkedObjectAllocationProfile;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(UnlinkedCodeBlock_RareData);

struct UnlinkedStringJumpTable {
    struct OffsetLocation {
        int32_t m_branchOffset;
        unsigned m_indexInTable;
    };

    using StringOffsetTable = MemoryCompactLookupOnlyRobinHoodHashMap<RefPtr<StringImpl>, OffsetLocation>;
    StringOffsetTable m_offsetTable;
    unsigned m_minLength { StringImpl::MaxLength };
    unsigned m_maxLength { 0 };
    int32_t m_defaultOffset { 0 };

    inline int32_t offsetForValue(StringImpl* value) const
    {
        auto loc = m_offsetTable.find(value);
        if (loc == m_offsetTable.end())
            return m_defaultOffset;
        return loc->value.m_branchOffset;
    }

    inline unsigned indexForValue(StringImpl* value, unsigned defaultIndex) const
    {
        auto loc = m_offsetTable.find(value);
        if (loc == m_offsetTable.end())
            return defaultIndex;
        return loc->value.m_indexInTable;
    }

    unsigned minLength() const { return m_minLength; }
    unsigned maxLength() const { return m_maxLength; }
    int32_t defaultOffset() const { return m_defaultOffset; }
};

struct UnlinkedSimpleJumpTable {
    FixedVector<int32_t> m_branchOffsets;
    int32_t m_min { 0 };
    int32_t m_defaultOffset { 0 };

    inline int32_t offsetForValue(int32_t value) const
    {
        if (value >= m_min && static_cast<uint32_t>(value - m_min) < m_branchOffsets.size()) {
            int32_t offset = m_branchOffsets[value - m_min];
            if (offset)
                return offset;
        }
        return m_defaultOffset;
    }

    void add(int32_t key, int32_t offset)
    {
        if (!m_branchOffsets[key])
            m_branchOffsets[key] = offset;
    }

    int32_t defaultOffset() const { return m_defaultOffset; }
};

class UnlinkedCodeBlock : public JSCell {
public:
    typedef JSCell Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    static constexpr bool needsDestruction = true;

    template<typename, SubspaceAccess>
    static void subspaceFor(VM&)
    {
        RELEASE_ASSERT_NOT_REACHED();
    }

    friend class LLIntOffsetsExtractor;

    enum { CallFunction, ApplyFunction };

    void initializeLoopHintExecutionCounter();

    bool isConstructor() const { return m_isConstructor; }
    SourceParseMode parseMode() const { return m_parseMode; }
    bool isArrowFunction() const { return isArrowFunctionParseMode(parseMode()); }
    DerivedContextType derivedContextType() const { return static_cast<DerivedContextType>(m_derivedContextType); }
    EvalContextType evalContextType() const { return static_cast<EvalContextType>(m_evalContextType); }
    bool isArrowFunctionContext() const { return m_isArrowFunctionContext; }
    bool isClassContext() const { return m_isClassContext; }
    bool hasTailCalls() const { return m_hasTailCalls; }
    void setHasTailCalls() { m_hasTailCalls = true; }
    bool allowDirectEvalCache() const { return !(m_features & NoEvalCacheFeature); }
    bool usesImportMeta() const { return m_features & ImportMetaFeature; }

    bool hasExpressionInfo() { return !m_expressionInfo->isEmpty(); }

    bool hasCheckpoints() const { return m_hasCheckpoints; }
    void setHasCheckpoints() { m_hasCheckpoints = true; }

    // Special registers
    void setThisRegister(VirtualRegister thisRegister) { m_thisRegister = thisRegister; }
    void setScopeRegister(VirtualRegister scopeRegister) { m_scopeRegister = scopeRegister; }

    // Parameter information
    void setNumParameters(int newValue) { m_numParameters = newValue; }
    unsigned numParameters() const { return m_numParameters; }

    // Constant Pools

    size_t numberOfIdentifiers() const { return m_identifiers.size(); }
    const Identifier& identifier(int index) const { return m_identifiers[index]; }
    const FixedVector<Identifier>& identifiers() const { return m_identifiers; }

    BitVector& bitVector(size_t i) { ASSERT(m_rareData); return m_rareData->m_bitVectors[i]; }

    const FixedVector<WriteBarrier<Unknown>>& constantRegisters() { return m_constantRegisters; }
    const WriteBarrier<Unknown>& constantRegister(VirtualRegister reg) const { return m_constantRegisters[reg.toConstantIndex()]; }
    WriteBarrier<Unknown>& constantRegister(VirtualRegister reg) { return m_constantRegisters[reg.toConstantIndex()]; }
    ALWAYS_INLINE JSValue getConstant(VirtualRegister reg) const { return m_constantRegisters[reg.toConstantIndex()].get(); }
    const FixedVector<SourceCodeRepresentation>& constantsSourceCodeRepresentation() { return m_constantsSourceCodeRepresentation; }

    SourceCodeRepresentation constantSourceCodeRepresentation(VirtualRegister reg) const
    {
        return constantSourceCodeRepresentation(reg.toConstantIndex());
    }
    SourceCodeRepresentation constantSourceCodeRepresentation(unsigned index) const
    {
        if (index < m_constantsSourceCodeRepresentation.size())
            return m_constantsSourceCodeRepresentation[index];
        return SourceCodeRepresentation::Other;
    }

    unsigned numberOfConstantIdentifierSets() const { return m_rareData ? m_rareData->m_constantIdentifierSets.size() : 0; }
    const FixedVector<IdentifierSet>& constantIdentifierSets() { ASSERT(m_rareData); return m_rareData->m_constantIdentifierSets; }

    // Jumps
    size_t numberOfJumpTargets() const { return m_jumpTargets.size(); }
    unsigned jumpTarget(int index) const { return m_jumpTargets[index]; }
    unsigned lastJumpTarget() const { return m_jumpTargets.last(); }

    UnlinkedHandlerInfo* handlerForBytecodeIndex(BytecodeIndex, RequiredHandler = RequiredHandler::AnyHandler);
    UnlinkedHandlerInfo* handlerForIndex(unsigned, RequiredHandler = RequiredHandler::AnyHandler);

    bool isBuiltinFunction() const { return m_isBuiltinFunction; }

    ConstructorKind constructorKind() const { return static_cast<ConstructorKind>(m_constructorKind); }
    SuperBinding superBinding() const { return static_cast<SuperBinding>(m_superBinding); }
    JSParserScriptMode scriptMode() const { return static_cast<JSParserScriptMode>(m_scriptMode); }

    const JSInstructionStream& instructions() const;
    const JSInstruction* instructionAt(BytecodeIndex index) const { return instructions().at(index).ptr(); }
    unsigned bytecodeOffset(const JSInstruction* instruction)
    {
        const auto* instructionsBegin = instructions().at(0).ptr();
        const auto* instructionsEnd = reinterpret_cast<const JSInstruction*>(reinterpret_cast<uintptr_t>(instructionsBegin) + instructions().size());
        RELEASE_ASSERT(instruction >= instructionsBegin && instruction < instructionsEnd);
        return instruction - instructionsBegin;
    }
    unsigned instructionsSize() const { return instructions().size(); }

    unsigned numCalleeLocals() const { return m_numCalleeLocals; }
    unsigned numVars() const { return m_numVars; }

    // Jump Tables

    size_t numberOfUnlinkedSwitchJumpTables() const { return m_rareData ? m_rareData->m_unlinkedSwitchJumpTables.size() : 0; }
    const UnlinkedSimpleJumpTable& unlinkedSwitchJumpTable(int tableIndex) const { ASSERT(m_rareData); return m_rareData->m_unlinkedSwitchJumpTables[tableIndex]; }

    size_t numberOfUnlinkedStringSwitchJumpTables() const { return m_rareData ? m_rareData->m_unlinkedStringSwitchJumpTables.size() : 0; }
    const UnlinkedStringJumpTable& unlinkedStringSwitchJumpTable(int tableIndex) const { ASSERT(m_rareData); return m_rareData->m_unlinkedStringSwitchJumpTables[tableIndex]; }

    UnlinkedFunctionExecutable* functionDecl(int index) { return m_functionDecls[index].get(); }
    size_t numberOfFunctionDecls() { return m_functionDecls.size(); }
    UnlinkedFunctionExecutable* functionExpr(int index) { return m_functionExprs[index].get(); }
    size_t numberOfFunctionExprs() { return m_functionExprs.size(); }

    // Exception handling support
    size_t numberOfExceptionHandlers() const { return m_rareData ? m_rareData->m_exceptionHandlers.size() : 0; }
    UnlinkedHandlerInfo& exceptionHandler(int index) { ASSERT(m_rareData); return m_rareData->m_exceptionHandlers[index]; }

    CodeType codeType() const { return static_cast<CodeType>(m_codeType); }

    VirtualRegister thisRegister() const { return m_thisRegister; }
    VirtualRegister scopeRegister() const { return m_scopeRegister; }

    bool hasRareData() const { return m_rareData.get(); }

    ExpressionInfo::Entry expressionInfoForBytecodeIndex(BytecodeIndex);
    LineColumn lineColumnForBytecodeIndex(BytecodeIndex);

    bool typeProfilerExpressionInfoForBytecodeOffset(unsigned bytecodeOffset, unsigned& startDivot, unsigned& endDivot);

    void recordParse(CodeFeatures features, LexicallyScopedFeatures lexicallyScopedFeatures, bool hasCapturedVariables, unsigned lineCount, unsigned endColumn)
    {
        m_features = features;
        m_lexicallyScopedFeatures = lexicallyScopedFeatures;
        m_hasCapturedVariables = hasCapturedVariables;
        m_lineCount = lineCount;
        // For the UnlinkedCodeBlock, startColumn is always 0.
        m_endColumn = endColumn;
    }

    StringImpl* sourceURLDirective() const { return m_sourceURLDirective.get(); }
    StringImpl* sourceMappingURLDirective() const { return m_sourceMappingURLDirective.get(); }
    void setSourceURLDirective(const String& sourceURL) { m_sourceURLDirective = sourceURL.impl(); }
    void setSourceMappingURLDirective(const String& sourceMappingURL) { m_sourceMappingURLDirective = sourceMappingURL.impl(); }

    CodeFeatures codeFeatures() const { return m_features; }
    LexicallyScopedFeatures lexicallyScopedFeatures() const { return m_lexicallyScopedFeatures; }
    bool hasCapturedVariables() const { return m_hasCapturedVariables; }
    unsigned lineCount() const { return m_lineCount; }
    ALWAYS_INLINE unsigned startColumn() const { return 0; }
    unsigned endColumn() const { return m_endColumn; }

    const FixedVector<JSInstructionStream::Offset>& opProfileControlFlowBytecodeOffsets() const
    {
        ASSERT(m_rareData);
        return m_rareData->m_opProfileControlFlowBytecodeOffsets;
    }
    bool hasOpProfileControlFlowBytecodeOffsets() const
    {
        return m_rareData && !m_rareData->m_opProfileControlFlowBytecodeOffsets.isEmpty();
    }

    void dumpExpressionInfo(); // For debugging purpose only.

    bool wasCompiledWithDebuggingOpcodes() const { return m_codeGenerationMode.contains(CodeGenerationMode::Debugger); }
    bool wasCompiledWithTypeProfilerOpcodes() const { return m_codeGenerationMode.contains(CodeGenerationMode::TypeProfiler); }
    bool wasCompiledWithControlFlowProfilerOpcodes() const { return m_codeGenerationMode.contains(CodeGenerationMode::ControlFlowProfiler); }
    OptionSet<CodeGenerationMode> codeGenerationMode() const { return m_codeGenerationMode; }

    TriState didOptimize() const { return m_metadata->didOptimize(); }
    void setDidOptimize(TriState didOptimize) { m_metadata->setDidOptimize(didOptimize); }

    static constexpr unsigned maxAge = 7;

    unsigned age() const { return m_age; }
    void resetAge() { m_age = 0; }

    NeedsClassFieldInitializer needsClassFieldInitializer() const
    {
        if (m_rareData)
            return static_cast<NeedsClassFieldInitializer>(m_rareData->m_needsClassFieldInitializer);
        return NeedsClassFieldInitializer::No;
    }

    PrivateBrandRequirement privateBrandRequirement() const
    {
        if (m_rareData)
            return static_cast<PrivateBrandRequirement>(m_rareData->m_privateBrandRequirement);
        return PrivateBrandRequirement::None;
    }

    void dump(PrintStream&) const;

    BytecodeLivenessAnalysis& livenessAnalysis(CodeBlock* codeBlock)
    {
        if (m_liveness)
            return *m_liveness;
        return livenessAnalysisSlow(codeBlock);
    }

#if ENABLE(DFG_JIT)
    bool hasExitSite(const ConcurrentJSLocker& locker, const DFG::FrequentExitSite& site) const
    {
        return m_exitProfile.hasExitSite(locker, site);
    }

    bool hasExitSite(const DFG::FrequentExitSite& site)
    {
        ConcurrentJSLocker locker(m_lock);
        return hasExitSite(locker, site);
    }

    DFG::ExitProfile& exitProfile() { return m_exitProfile; }
#endif

    UnlinkedMetadataTable& metadata() { return m_metadata.get(); }

    size_t metadataSizeInBytes()
    {
        return m_metadata->sizeInBytesForGC();
    }

    bool loopHintsAreEligibleForFuzzingEarlyReturn()
    {
        // Some builtins are required to always complete the loops they run.
        return !isBuiltinFunction();
    }
    void allocateSharedProfiles(unsigned numBinaryArithProfiles, unsigned numUnaryArithProfiles);
    FixedVector<UnlinkedValueProfile>& unlinkedValueProfiles() { return m_valueProfiles; }
    FixedVector<UnlinkedArrayProfile>& unlinkedArrayProfiles() { return m_arrayProfiles; }
    unsigned numberOfValueProfiles() const { return m_valueProfiles.size(); }
    unsigned numberOfArrayProfiles() const { return m_arrayProfiles.size(); }

#if ASSERT_ENABLED
    bool hasIdentifier(UniquedStringImpl*);
#endif

    int32_t thresholdForJIT(int32_t threshold);

protected:
    UnlinkedCodeBlock(VM&, Structure*, CodeType, const ExecutableInfo&, OptionSet<CodeGenerationMode>);

    template<typename CodeBlockType>
    UnlinkedCodeBlock(Decoder&, Structure*, const CachedCodeBlock<CodeBlockType>&);

    ~UnlinkedCodeBlock();

    DECLARE_DEFAULT_FINISH_CREATION;

private:
    friend class BytecodeRewriter;
    friend class UnlinkedCodeBlockGenerator;
    template<typename Traits>
    friend class BytecodeGeneratorBase;

    template<typename CodeBlockType>
    friend class CachedCodeBlock;

    void createRareDataIfNecessary(const AbstractLocker&)
    {
        if (!m_rareData)
            m_rareData = makeUnique<RareData>();
    }

    BytecodeLivenessAnalysis& livenessAnalysisSlow(CodeBlock*);

    VirtualRegister m_thisRegister;
    VirtualRegister m_scopeRegister;

    unsigned m_numVars : 31;
    unsigned m_numCalleeLocals : 31;
    unsigned m_isConstructor : 1;
    unsigned m_numParameters : 31;
    unsigned m_hasCapturedVariables : 1;

    unsigned m_isBuiltinFunction : 1;
    unsigned m_superBinding : 1;
    unsigned m_scriptMode: 1;
    unsigned m_isArrowFunctionContext : 1;
    unsigned m_isClassContext : 1;
    unsigned m_hasTailCalls : 1;
    unsigned m_constructorKind : 2;
    unsigned m_derivedContextType : 2;
    unsigned m_evalContextType : 2;
    unsigned m_codeType : 2;
    unsigned m_age : 3;
    static_assert(((1U << 3) - 1) >= maxAge);
    bool m_hasCheckpoints : 1;
    LexicallyScopedFeatures m_lexicallyScopedFeatures : bitWidthOfLexicallyScopedFeatures { 0 };
public:
    ConcurrentJSLock m_lock;
#if ENABLE(JIT)
    RefPtr<BaselineJITCode> m_unlinkedBaselineCode;
#endif
private:
    CodeFeatures m_features { 0 };
    SourceParseMode m_parseMode;
    OptionSet<CodeGenerationMode> m_codeGenerationMode;

    unsigned m_lineCount { 0 };
    unsigned m_endColumn { UINT_MAX };

    PackedRefPtr<StringImpl> m_sourceURLDirective;
    PackedRefPtr<StringImpl> m_sourceMappingURLDirective;

    FixedVector<JSInstructionStream::Offset> m_jumpTargets;
    Ref<UnlinkedMetadataTable> m_metadata;
    std::unique_ptr<JSInstructionStream> m_instructions;
    std::unique_ptr<BytecodeLivenessAnalysis> m_liveness;

#if ENABLE(DFG_JIT)
    DFG::ExitProfile m_exitProfile;
#endif

    // Constant Pools
    FixedVector<Identifier> m_identifiers;
    FixedVector<WriteBarrier<Unknown>> m_constantRegisters;
    FixedVector<SourceCodeRepresentation> m_constantsSourceCodeRepresentation;
    using FunctionExpressionVector = FixedVector<WriteBarrier<UnlinkedFunctionExecutable>>;
    FunctionExpressionVector m_functionDecls;
    FunctionExpressionVector m_functionExprs;

public:
    struct RareData {
        WTF_MAKE_STRUCT_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(UnlinkedCodeBlock_RareData);

        size_t sizeInBytes(const AbstractLocker&) const;

        FixedVector<UnlinkedHandlerInfo> m_exceptionHandlers;

        // Jump Tables
        FixedVector<UnlinkedSimpleJumpTable> m_unlinkedSwitchJumpTables;
        FixedVector<UnlinkedStringJumpTable> m_unlinkedStringSwitchJumpTables;

        struct TypeProfilerExpressionRange {
            unsigned m_startDivot;
            unsigned m_endDivot;
        };
        UncheckedKeyHashMap<unsigned, TypeProfilerExpressionRange> m_typeProfilerInfoMap;
        FixedVector<JSInstructionStream::Offset> m_opProfileControlFlowBytecodeOffsets;
        FixedVector<BitVector> m_bitVectors;
        FixedVector<IdentifierSet> m_constantIdentifierSets;

        unsigned m_needsClassFieldInitializer : 1;
        unsigned m_privateBrandRequirement : 1;
    };

    int outOfLineJumpOffset(JSInstructionStream::Offset);
    int outOfLineJumpOffset(const JSInstructionStream::Ref& instruction)
    {
        return outOfLineJumpOffset(instruction.offset());
    }
    int outOfLineJumpOffset(const JSInstruction* pc)
    {
        unsigned bytecodeOffset = this->bytecodeOffset(pc);
        return outOfLineJumpOffset(bytecodeOffset);
    }

    BinaryArithProfile& binaryArithProfile(unsigned i) { return m_binaryArithProfiles[i]; }
    UnaryArithProfile& unaryArithProfile(unsigned i) { return m_unaryArithProfiles[i]; }

    BaselineExecutionCounter& llintExecuteCounter() { return m_llintExecuteCounter; }

private:
    using OutOfLineJumpTargets = UncheckedKeyHashMap<JSInstructionStream::Offset, int>;

    OutOfLineJumpTargets m_outOfLineJumpTargets;
    std::unique_ptr<RareData> m_rareData;
    MallocPtr<ExpressionInfo> m_expressionInfo;
    BaselineExecutionCounter m_llintExecuteCounter;
    FixedVector<UnlinkedValueProfile> m_valueProfiles;
    FixedVector<UnlinkedArrayProfile> m_arrayProfiles;
    FixedVector<BinaryArithProfile> m_binaryArithProfiles;
    FixedVector<UnaryArithProfile> m_unaryArithProfiles;

#if ASSERT_ENABLED
    Lock m_cachedIdentifierUidsLock;
    HashSet<UniquedStringImpl*> m_cachedIdentifierUids;
#endif

protected:
    DECLARE_VISIT_CHILDREN;
    static size_t estimatedSize(JSCell*, VM&);

public:
    DECLARE_INFO;
};

}
