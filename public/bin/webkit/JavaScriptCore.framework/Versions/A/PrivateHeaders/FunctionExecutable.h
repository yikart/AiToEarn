/*
 * Copyright (C) 2009-2022 Apple Inc. All rights reserved.
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

#include "JSFunction.h"
#include "ScriptExecutable.h"
#include "SourceCode.h"
#include <wtf/Box.h>
#include <wtf/Markable.h>

namespace JSC {

struct FunctionOverrideInfo;

class FunctionExecutable final : public ScriptExecutable {
    friend class JIT;
    friend class LLIntOffsetsExtractor;
public:
    typedef ScriptExecutable Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.functionExecutableSpace();
    }

    static FunctionExecutable* create(VM& vm, ScriptExecutable* topLevelExecutable, const SourceCode& source, UnlinkedFunctionExecutable* unlinkedExecutable, Intrinsic intrinsic, bool isInsideOrdinaryFunction)
    {
        FunctionExecutable* executable = new (NotNull, allocateCell<FunctionExecutable>(vm)) FunctionExecutable(vm, topLevelExecutable, source, unlinkedExecutable, intrinsic, isInsideOrdinaryFunction);
        executable->finishCreation(vm);
        return executable;
    }
    static FunctionExecutable* fromGlobalCode(
        const Identifier& name, JSGlobalObject*, const SourceCode&, LexicallyScopedFeatures,
        JSObject*& exception, int overrideLineNumber, std::optional<int> functionConstructorParametersEndPosition);

    static void destroy(JSCell*);
        
    UnlinkedFunctionExecutable* unlinkedExecutable() const
    {
        return m_unlinkedExecutable.get();
    }

    // Returns either call or construct bytecode. This can be appropriate
    // for answering questions that that don't vary between call and construct --
    // for example, argumentsRegister().
    FunctionCodeBlock* eitherCodeBlock() const
    {
        if (auto* result = codeBlockForCall())
            return result;
        return codeBlockForConstruct();
    }
        
    bool isGeneratedForCall() const
    {
        return !!codeBlockForCall();
    }

    FunctionCodeBlock* codeBlockForCall() const
    {
        return std::bit_cast<FunctionCodeBlock*>(m_codeBlockForCall.get());
    }

    bool isGeneratedForConstruct() const
    {
        return !!codeBlockForConstruct();
    }

    FunctionCodeBlock* codeBlockForConstruct() const
    {
        return std::bit_cast<FunctionCodeBlock*>(m_codeBlockForConstruct.get());
    }
        
    bool isGeneratedFor(CodeSpecializationKind kind)
    {
        if (kind == CodeForCall)
            return isGeneratedForCall();
        ASSERT(kind == CodeForConstruct);
        return isGeneratedForConstruct();
    }
        
    FunctionCodeBlock* codeBlockFor(CodeSpecializationKind kind)
    {
        if (kind == CodeForCall)
            return codeBlockForCall();
        ASSERT(kind == CodeForConstruct);
        return codeBlockForConstruct();
    }

    FunctionCodeBlock* baselineCodeBlockFor(CodeSpecializationKind);
        
    FunctionCodeBlock* profiledCodeBlockFor(CodeSpecializationKind kind)
    {
        return baselineCodeBlockFor(kind);
    }

    FunctionCodeBlock* replaceCodeBlockWith(VM&, CodeSpecializationKind, CodeBlock*);

    RefPtr<TypeSet> returnStatementTypeSet() 
    {
        RareData& rareData = ensureRareData();
        if (!rareData.m_returnStatementTypeSet)
            rareData.m_returnStatementTypeSet = TypeSet::create();
        return rareData.m_returnStatementTypeSet;
    }
        
    FunctionMode functionMode() { return m_unlinkedExecutable->functionMode(); }
    ImplementationVisibility implementationVisibility() const { return m_unlinkedExecutable->implementationVisibility(); }
    bool isBuiltinFunction() const { return m_unlinkedExecutable->isBuiltinFunction(); }
    ConstructAbility constructAbility() const { return m_unlinkedExecutable->constructAbility(); }
    InlineAttribute inlineAttribute() const { return m_unlinkedExecutable->inlineAttribute(); }
    bool isClass() const { return m_unlinkedExecutable->isClass(); }
    bool isArrowFunction() const { return parseMode() == SourceParseMode::ArrowFunctionMode; }
    bool isGetter() const { return parseMode() == SourceParseMode::GetterMode; }
    bool isSetter() const { return parseMode() == SourceParseMode::SetterMode; }
    bool isGenerator() const { return isGeneratorParseMode(parseMode()); }
    bool isAsyncGenerator() const { return isAsyncGeneratorParseMode(parseMode()); }
    bool isMethod() const { return parseMode() == SourceParseMode::MethodMode; }
    bool hasPrototypeProperty() const
    {
        return SourceParseModeSet(
            SourceParseMode::NormalFunctionMode,
            SourceParseMode::GeneratorBodyMode,
            SourceParseMode::GeneratorWrapperFunctionMode,
            SourceParseMode::GeneratorWrapperMethodMode,
            SourceParseMode::AsyncGeneratorWrapperFunctionMode,
            SourceParseMode::AsyncGeneratorWrapperMethodMode,
            SourceParseMode::AsyncGeneratorBodyMode
        ).contains(parseMode()) || isClass();
    }
    DerivedContextType derivedContextType() const { return m_unlinkedExecutable->derivedContextType(); }
    bool isClassConstructorFunction() const { return m_unlinkedExecutable->isClassConstructorFunction(); }
    const Identifier& name() { return m_unlinkedExecutable->name(); }
    const Identifier& ecmaName() { return m_unlinkedExecutable->ecmaName(); }
    unsigned parameterCount() const { return m_unlinkedExecutable->parameterCount(); } // Excluding 'this'!
    SourceParseMode parseMode() const { return m_unlinkedExecutable->parseMode(); }
    JSParserScriptMode scriptMode() const { return m_unlinkedExecutable->scriptMode(); }
    SourceCode classSource() const { return m_unlinkedExecutable->classSource(); }

    DECLARE_VISIT_CHILDREN;
    DECLARE_VISIT_OUTPUT_CONSTRAINTS;
    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    void setOverrideLineNumber(int overrideLineNumber)
    {
        if (overrideLineNumber == -1) {
            if (UNLIKELY(m_rareData))
                m_rareData->m_overrideLineNumber = std::nullopt;
            return;
        }
        ensureRareData().m_overrideLineNumber = overrideLineNumber;
    }

    std::optional<int> overrideLineNumber() const
    {
        if (UNLIKELY(m_rareData))
            return m_rareData->m_overrideLineNumber;
        return std::nullopt;
    }

    int lineCount() const
    {
        if (UNLIKELY(m_rareData))
            return m_rareData->m_lineCount;
        return m_unlinkedExecutable->lineCount();
    }

    int endColumn() const
    {
        if (UNLIKELY(m_rareData))
            return m_rareData->m_endColumn;
        return m_unlinkedExecutable->linkedEndColumn(m_source.startColumn().oneBasedInt());
    }

    int firstLine() const
    {
        return source().firstLine().oneBasedInt();
    }

    int lastLine() const
    {
        return firstLine() + lineCount();
    }

    unsigned functionEnd() const
    {
        if (UNLIKELY(m_rareData))
            return m_rareData->m_functionEnd;
        return m_unlinkedExecutable->unlinkedFunctionEnd();
    }

    unsigned functionStart() const
    {
        if (UNLIKELY(m_rareData))
            return m_rareData->m_functionStart;
        return m_unlinkedExecutable->unlinkedFunctionStart();
    }

    unsigned parametersStartOffset() const
    {
        if (UNLIKELY(m_rareData))
            return m_rareData->m_parametersStartOffset;
        return m_unlinkedExecutable->parametersStartOffset();
    }

    void overrideInfo(const FunctionOverrideInfo&);

    DECLARE_INFO;

    InferredValue<JSFunction>& singleton()
    {
        return m_singleton;
    }

    void notifyCreation(VM& vm, JSFunction* function, const char* reason)
    {
        m_singleton.notifyWrite(vm, this, function, reason);
    }

    // Cached poly proto structure for the result of constructing this executable.
    Structure* cachedPolyProtoStructure()
    {
        if (UNLIKELY(m_rareData))
            return m_rareData->m_cachedPolyProtoStructureID.get();
        return nullptr;
    }
    void setCachedPolyProtoStructure(VM& vm, Structure* structure)
    {
        ensureRareData().m_cachedPolyProtoStructureID.set(vm, this, structure);
    }

    InlineWatchpointSet& ensurePolyProtoWatchpoint()
    {
        if (!m_polyProtoWatchpoint)
            m_polyProtoWatchpoint = Box<InlineWatchpointSet>::create(IsWatched);
        return *m_polyProtoWatchpoint;
    }

    Box<InlineWatchpointSet> sharedPolyProtoWatchpoint() const { return m_polyProtoWatchpoint; }

    ScriptExecutable* topLevelExecutable() const { return m_topLevelExecutable.get(); }

    TemplateObjectMap& ensureTemplateObjectMap(VM&);

    void finalizeUnconditionally(VM&, CollectionScope);

    JSString* toString(JSGlobalObject*);
    JSString* asStringConcurrently() const
    {
        if (!m_rareData)
            return nullptr;
        return m_rareData->m_asString.get();
    }

    static constexpr ptrdiff_t offsetOfRareData() { return OBJECT_OFFSETOF(FunctionExecutable, m_rareData); }
    static constexpr ptrdiff_t offsetOfCodeBlockForCall() { return OBJECT_OFFSETOF(FunctionExecutable, m_codeBlockForCall); }
    static constexpr ptrdiff_t offsetOfCodeBlockForConstruct() { return OBJECT_OFFSETOF(FunctionExecutable, m_codeBlockForConstruct); }

    static constexpr ptrdiff_t offsetOfCodeBlockFor(CodeSpecializationKind kind)
    {
        switch (kind) {
        case CodeForCall:
            return OBJECT_OFFSETOF(FunctionExecutable, m_codeBlockForCall);
        case CodeForConstruct:
            return OBJECT_OFFSETOF(FunctionExecutable, m_codeBlockForConstruct);
        }
        RELEASE_ASSERT_NOT_REACHED();
        return 0;
    }

    struct RareData {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        static constexpr ptrdiff_t offsetOfAsString() { return OBJECT_OFFSETOF(RareData, m_asString); }

        RefPtr<TypeSet> m_returnStatementTypeSet;
        unsigned m_lineCount;
        unsigned m_endColumn;
        Markable<int, IntegralMarkableTraits<int, -1>> m_overrideLineNumber;
        unsigned m_parametersStartOffset { 0 };
        WriteBarrierStructureID m_cachedPolyProtoStructureID;
        std::unique_ptr<TemplateObjectMap> m_templateObjectMap;
        WriteBarrier<JSString> m_asString;
        unsigned m_functionStart { UINT_MAX };
        unsigned m_functionEnd { UINT_MAX };
    };

private:
    friend class ExecutableBase;
    FunctionExecutable(VM&, ScriptExecutable* topLevelExecutable, const SourceCode&, UnlinkedFunctionExecutable*, Intrinsic, bool isInsideOrdinaryFunction);

    DECLARE_DEFAULT_FINISH_CREATION;

    friend class ScriptExecutable;

    RareData& ensureRareData()
    {
        if (LIKELY(m_rareData))
            return *m_rareData;
        return ensureRareDataSlow();
    }
    RareData& ensureRareDataSlow();

    JSString* toStringSlow(JSGlobalObject*);

    // FIXME: We can merge rareData pointer and top-level executable pointer. First time, setting parent.
    // If RareData is required, materialize RareData, swap it, and store top-level executable pointer inside RareData.
    // https://bugs.webkit.org/show_bug.cgi?id=197625
    std::unique_ptr<RareData> m_rareData;
    WriteBarrier<ScriptExecutable> m_topLevelExecutable;
    WriteBarrier<UnlinkedFunctionExecutable> m_unlinkedExecutable;
    WriteBarrier<CodeBlock> m_codeBlockForCall;
    WriteBarrier<CodeBlock> m_codeBlockForConstruct;
    InferredValue<JSFunction> m_singleton;
    Box<InlineWatchpointSet> m_polyProtoWatchpoint;
};

} // namespace JSC
