/*
 * Copyright (C) 2017-2024 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY)

#include "WasmBranchHints.h"
#include "WasmFormat.h"

#include <wtf/FixedBitVector.h>
#include <wtf/HashMap.h>

namespace JSC { namespace Wasm {

struct ModuleInformation final : public ThreadSafeRefCounted<ModuleInformation> {

    using BranchHints = UncheckedKeyHashMap<uint32_t, BranchHintMap, IntHash<uint32_t>, WTF::UnsignedWithZeroKeyHashTraits<uint32_t>>;

    ModuleInformation();
    ModuleInformation(const ModuleInformation&) = delete;
    ModuleInformation(ModuleInformation&&) = delete;

    static Ref<ModuleInformation> create()
    {
        return adoptRef(*new ModuleInformation);
    }

    JS_EXPORT_PRIVATE ~ModuleInformation();
    
    size_t functionIndexSpaceSize() const { return importFunctionTypeIndices.size() + internalFunctionTypeIndices.size(); }
    bool isImportedFunctionFromFunctionIndexSpace(FunctionSpaceIndex functionIndex) const
    {
        ASSERT(functionIndex < functionIndexSpaceSize());
        return functionIndex < importFunctionTypeIndices.size();
    }
    TypeIndex typeIndexFromFunctionIndexSpace(FunctionSpaceIndex functionIndex) const
    {
        return isImportedFunctionFromFunctionIndexSpace(functionIndex)
            ? importFunctionTypeIndices[functionIndex]
            : internalFunctionTypeIndices[functionIndex - importFunctionTypeIndices.size()];
    }

    size_t exceptionIndexSpaceSize() const { return importExceptionTypeIndices.size() + internalExceptionTypeIndices.size(); }
    bool isImportedExceptionFromExceptionIndexSpace(size_t exceptionIndex) const
    {
        ASSERT(exceptionIndex < exceptionIndexSpaceSize());
        return exceptionIndex < importExceptionTypeIndices.size();
    }
    TypeIndex typeIndexFromExceptionIndexSpace(size_t exceptionIndex) const
    {
        return isImportedExceptionFromExceptionIndexSpace(exceptionIndex)
            ? importExceptionTypeIndices[exceptionIndex]
            : internalExceptionTypeIndices[exceptionIndex - importExceptionTypeIndices.size()];
    }

    uint32_t importFunctionCount() const { return importFunctionTypeIndices.size(); }
    uint32_t internalFunctionCount() const { return internalFunctionTypeIndices.size(); }
    uint32_t importExceptionCount() const { return importExceptionTypeIndices.size(); }
    uint32_t internalExceptionCount() const { return internalExceptionTypeIndices.size(); }

    FunctionCodeIndex toCodeIndex(FunctionSpaceIndex index) const { ASSERT(importFunctionCount() <= index && index < functionIndexSpaceSize()); return FunctionCodeIndex(index - importFunctionCount()); }
    FunctionSpaceIndex toSpaceIndex(FunctionCodeIndex index) const { ASSERT(index < internalFunctionCount()); return FunctionSpaceIndex(index + importFunctionCount()); }

    // Currently, our wasm implementation allows only one memory.
    // If we need to remove this limitation, we would have MemoryInformation in the Vectors.
    uint32_t memoryCount() const { return memory ? 1 : 0; }
    uint32_t tableCount() const { return tables.size(); }
    uint32_t elementCount() const { return elements.size(); }
    uint32_t globalCount() const { return globals.size(); }
    uint32_t dataSegmentsCount() const { return numberOfDataSegments.value_or(0); }

    const TableInformation& table(unsigned index) const { return tables[index]; }
    const GlobalInformation& global(unsigned index) const { return globals[index]; }

    void initializeFunctionTrackers() const
    {
        size_t totalNumberOfFunctions = functionIndexSpaceSize();
        m_referencedFunctions = FixedBitVector(totalNumberOfFunctions);
        m_clobberingTailCalls = FixedBitVector(totalNumberOfFunctions);
    }

    const FixedBitVector& referencedFunctions() const { return m_referencedFunctions; }
    bool hasReferencedFunction(FunctionSpaceIndex functionIndexSpace) const { return m_referencedFunctions.test(functionIndexSpace); }
    void addReferencedFunction(FunctionSpaceIndex functionIndexSpace) const { m_referencedFunctions.concurrentTestAndSet(functionIndexSpace); }

    bool isDeclaredFunction(FunctionSpaceIndex index) const { return m_declaredFunctions.contains(index); }
    void addDeclaredFunction(FunctionSpaceIndex index) { m_declaredFunctions.set(index); }

    bool isDeclaredException(uint32_t index) const { return m_declaredExceptions.contains(index); }
    void addDeclaredException(uint32_t index) { m_declaredExceptions.set(index); }

    size_t functionWasmSizeImportSpace(FunctionSpaceIndex index) const { return functionWasmSize(toCodeIndex(index)); }

    size_t functionWasmSize(FunctionCodeIndex index) const
    {
        ASSERT(index < internalFunctionCount());
        ASSERT(functions[index].finishedValidating);
        auto size = functions[index].end - functions[index].start + 1;
        RELEASE_ASSERT(size > 1);
        return size;
    }

    bool usesSIMDImportSpace(FunctionSpaceIndex index) const { return usesSIMD(toCodeIndex(index)); }
    bool usesSIMD(FunctionCodeIndex index) const
    {
        ASSERT(index < internalFunctionCount());
        ASSERT(functions[index].finishedValidating);

        // See also: B3Procedure::usesSIMD().
        if (!Options::useWasmSIMD())
            return false;
        if (Options::forceAllFunctionsToUseSIMD())
            return true;
        // The LLInt discovers this value.
        ASSERT(Options::useWasmLLInt() || Options::useWasmIPInt());

        return functions[index].usesSIMD;
    }
    void markUsesSIMD(FunctionCodeIndex index) { ASSERT(index < internalFunctionCount()); ASSERT(!functions[index].finishedValidating); functions[index].usesSIMD = true; }

    bool usesExceptions(FunctionCodeIndex index) const { ASSERT(index < internalFunctionCount()); ASSERT(functions[index].finishedValidating); return functions[index].usesExceptions; }
    void markUsesExceptions(FunctionCodeIndex index) { ASSERT(index < internalFunctionCount()); ASSERT(!functions[index].finishedValidating); functions[index].usesExceptions = true; }
    bool usesAtomics(FunctionCodeIndex index) const { ASSERT(index < internalFunctionCount()); ASSERT(functions[index].finishedValidating); return functions[index].usesAtomics; }
    void markUsesAtomics(FunctionCodeIndex index) { ASSERT(index < internalFunctionCount()); ASSERT(!functions[index].finishedValidating); functions[index].usesAtomics = true; }

    void doneSeeingFunction(FunctionCodeIndex index) { ASSERT(index < internalFunctionCount()); ASSERT(!functions[index].finishedValidating); functions[index].finishedValidating = true; }

    uint32_t typeCount() const { return typeSignatures.size(); }

    bool hasMemoryImport() const { return memory.isImport(); }

    BranchHint getBranchHint(uint32_t functionOffset, uint32_t branchOffset) const
    {
        auto it = branchHints.find(functionOffset);
        return it == branchHints.end()
            ? BranchHint::Invalid
            : it->value.getBranchHint(branchOffset);
    }

    // FIXME: This should probably be FunctionCodeIndex as calling an import always clobbers the instance.
    const FixedBitVector& clobberingTailCalls() const { return m_clobberingTailCalls; }
    bool callCanClobberInstance(FunctionSpaceIndex functionIndexSpace) const { return m_clobberingTailCalls.test(functionIndexSpace); }
    void addClobberingTailCall(FunctionSpaceIndex functionIndexSpace) { m_clobberingTailCalls.concurrentTestAndSet(functionIndexSpace); }

    // FIXME: These should probably be FixedVectors.
    Vector<Import> imports;
    Vector<TypeIndex> importFunctionTypeIndices;
    Vector<TypeIndex> internalFunctionTypeIndices;
    Vector<TypeIndex> importExceptionTypeIndices;
    Vector<TypeIndex> internalExceptionTypeIndices;
    Vector<Ref<TypeDefinition>> typeSignatures;
    Vector<Ref<TypeDefinition>> recursionGroups;

    MemoryInformation memory;

    Vector<FunctionData> functions;

    Vector<Export> exports;
    std::optional<uint32_t> startFunctionIndexSpace;
    Vector<Segment::Ptr> data;
    Vector<Element> elements;
    Vector<TableInformation> tables;
    Vector<GlobalInformation> globals;
    unsigned firstInternalGlobal { 0 };
    uint32_t codeSectionSize { 0 };
    Vector<CustomSection> customSections;
    Ref<NameSection> nameSection;
    BranchHints branchHints;
    std::optional<uint32_t> numberOfDataSegments;
    Vector<RefPtr<const RTT>> rtts;
    Vector<Vector<uint8_t>> constantExpressions;
    Name sourceMappingURL;

    BitVector m_declaredFunctions;
    BitVector m_declaredExceptions;
    mutable FixedBitVector m_referencedFunctions;
    mutable FixedBitVector m_clobberingTailCalls;
};

    
} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
