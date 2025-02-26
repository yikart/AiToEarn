/*
 * Copyright (C) 2012-2022 Apple Inc. All Rights Reserved.
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

#include "CodeSpecializationKind.h"
#include "ConstructAbility.h"
#include "ConstructorKind.h"
#include "ExecutableInfo.h"
#include "Identifier.h"
#include "ImplementationVisibility.h"
#include "InlineAttribute.h"
#include "Intrinsic.h"
#include "JSCast.h"
#include "ParserModes.h"
#include "ParserTokens.h"
#include "RegExp.h"
#include "SourceCode.h"
#include "VariableEnvironment.h"
#include <wtf/FixedVector.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class CachedFunctionExecutable;
class Decoder;
class FunctionExecutable;
class FunctionMetadataNode;
class ParserError;
class ScriptExecutable;
class SourceProvider;
class UnlinkedFunctionCodeBlock;

enum UnlinkedFunctionKind {
    UnlinkedNormalFunction,
    UnlinkedBuiltinFunction,
};

class UnlinkedFunctionExecutable final : public JSCell {
public:
    friend class CodeCache;
    friend class VM;
    friend class CachedFunctionExecutable;

    typedef JSCell Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.unlinkedFunctionExecutableSpace();
    }

    static UnlinkedFunctionExecutable* create(VM& vm, const SourceCode& source, FunctionMetadataNode* node, UnlinkedFunctionKind unlinkedFunctionKind, ConstructAbility constructAbility, InlineAttribute inlineAttribute, JSParserScriptMode scriptMode, RefPtr<TDZEnvironmentLink> parentScopeTDZVariables, std::optional<Vector<Identifier>>&& generatorOrAsyncWrapperFunctionParameterNames, std::optional<PrivateNameEnvironment> parentPrivateNameEnvironment, DerivedContextType derivedContextType, NeedsClassFieldInitializer needsClassFieldInitializer, PrivateBrandRequirement privateBrandRequirement, bool isBuiltinDefaultClassConstructor = false)
    {
        UnlinkedFunctionExecutable* instance = new (NotNull, allocateCell<UnlinkedFunctionExecutable>(vm))
            UnlinkedFunctionExecutable(vm, vm.unlinkedFunctionExecutableStructure.get(), source, node, unlinkedFunctionKind, constructAbility, inlineAttribute, scriptMode, WTFMove(parentScopeTDZVariables), WTFMove(generatorOrAsyncWrapperFunctionParameterNames), WTFMove(parentPrivateNameEnvironment), derivedContextType, needsClassFieldInitializer, privateBrandRequirement, isBuiltinDefaultClassConstructor);
        instance->finishCreation(vm);
        return instance;
    }

    ~UnlinkedFunctionExecutable();

    const Identifier& name() const { return m_name; }
    const Identifier& ecmaName() const { return m_ecmaName; }
    void setEcmaName(const Identifier& name) { m_ecmaName = name; }
    unsigned parameterCount() const { return m_parameterCount; }; // Excluding 'this'!
    SourceParseMode parseMode() const { return static_cast<SourceParseMode>(m_sourceParseMode); };

    SourceCode classSource() const
    {
        if (m_rareData)
            return m_rareData->m_classSource;
        return SourceCode();
    }
    void setClassSource(const SourceCode& source)
    {
        ensureRareData().m_classSource = source;
    }

    bool isInStrictContext() const { return m_lexicallyScopedFeatures & StrictModeLexicallyScopedFeature; }
    FunctionMode functionMode() const { return static_cast<FunctionMode>(m_functionMode); }
    ConstructorKind constructorKind() const { return static_cast<ConstructorKind>(m_constructorKind); }
    SuperBinding superBinding() const { return static_cast<SuperBinding>(m_superBinding); }

    unsigned lineCount() const { return m_lineCount; }
    unsigned linkedStartColumn(unsigned parentStartColumn) const { return m_unlinkedBodyStartColumn + (!m_firstLineOffset ? parentStartColumn : 1); }
    unsigned linkedEndColumn(unsigned startColumn) const { return m_unlinkedBodyEndColumn + (!m_lineCount ? startColumn : 1); }

    unsigned unlinkedFunctionStart() const { return m_unlinkedFunctionStart; }
    unsigned unlinkedFunctionEnd() const { return m_unlinkedFunctionEnd; }
    unsigned unlinkedBodyStartColumn() const { return m_unlinkedBodyStartColumn; }
    unsigned unlinkedBodyEndColumn() const { return m_unlinkedBodyEndColumn; }
    unsigned startOffset() const { return m_startOffset; }
    unsigned sourceLength() { return m_sourceLength; }
    unsigned parametersStartOffset() const { return m_parametersStartOffset; }

    UnlinkedFunctionCodeBlock* unlinkedCodeBlockFor(
        VM&, const SourceCode&, CodeSpecializationKind, OptionSet<CodeGenerationMode>,
        ParserError&, SourceParseMode);

    static UnlinkedFunctionExecutable* fromGlobalCode(
        const Identifier&, JSGlobalObject*, const SourceCode&, LexicallyScopedFeatures, JSObject*& exception,
        int overrideLineNumber, std::optional<int> functionConstructorParametersEndPosition);

    SourceCode linkedSourceCode(const SourceCode&) const;
    JS_EXPORT_PRIVATE FunctionExecutable* link(VM&, ScriptExecutable* topLevelExecutable, const SourceCode& parentSource, std::optional<int> overrideLineNumber = std::nullopt, Intrinsic = NoIntrinsic, bool isInsideOrdinaryFunction = false);

    void clearCode(VM& vm)
    {
        m_unlinkedCodeBlockForCall.clear();
        m_unlinkedCodeBlockForConstruct.clear();
        // FIXME GlobalGC: Need syncrhonization here for accessing the Heap server.
        vm.heap.unlinkedFunctionExecutableSpaceAndSet.set.remove(this);
    }

    void recordParse(CodeFeatures features, LexicallyScopedFeatures lexicallyScopedFeatures, bool hasCapturedVariables)
    {
        m_features = features;
        m_lexicallyScopedFeatures = lexicallyScopedFeatures;
        m_hasCapturedVariables = hasCapturedVariables;
    }

    CodeFeatures features() const { return m_features; }
    LexicallyScopedFeatures lexicallyScopedFeatures() const { return m_lexicallyScopedFeatures; }
    bool hasCapturedVariables() const { return m_hasCapturedVariables; }

    PrivateBrandRequirement privateBrandRequirement() const { return static_cast<PrivateBrandRequirement>(m_privateBrandRequirement); }

    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    ImplementationVisibility implementationVisibility() const { return static_cast<ImplementationVisibility>(m_implementationVisibility); }
    bool isBuiltinFunction() const { return m_isBuiltinFunction; }
    ConstructAbility constructAbility() const { return static_cast<ConstructAbility>(m_constructAbility); }
    JSParserScriptMode scriptMode() const { return static_cast<JSParserScriptMode>(m_scriptMode); }
    bool isClassConstructorFunction() const
    {
        switch (constructorKind()) {
        case ConstructorKind::None:
        case ConstructorKind::Naked:
            return false;
        case ConstructorKind::Base:
        case ConstructorKind::Extends:
            return true;
        }
        return false;
    }
    bool isClass() const
    {
        if (!m_rareData)
            return false;
        return !m_rareData->m_classSource.isNull();
    }

    RefPtr<TDZEnvironmentLink> parentScopeTDZVariables() const
    {
        if (!m_rareData)
            return nullptr;
        return m_rareData->m_parentScopeTDZVariables;
    }

    const FixedVector<Identifier>* generatorOrAsyncWrapperFunctionParameterNames() const
    {
        if (!m_rareData)
            return nullptr;
        return &m_rareData->m_generatorOrAsyncWrapperFunctionParameterNames;
    }

    const PrivateNameEnvironment* parentPrivateNameEnvironment() const
    {
        if (!m_rareData)
            return nullptr;
        return &m_rareData->m_parentPrivateNameEnvironment;
    }
    
    bool isArrowFunction() const { return isArrowFunctionParseMode(parseMode()); }

    JSC::DerivedContextType derivedContextType() const {return static_cast<JSC::DerivedContextType>(m_derivedContextType); }

    InlineAttribute inlineAttribute() const { return static_cast<InlineAttribute>(m_inlineAttribute); }

    String sourceURLDirective() const
    {
        if (m_rareData)
            return m_rareData->m_sourceURLDirective;
        return String();
    }
    String sourceMappingURLDirective() const
    {
        if (m_rareData)
            return m_rareData->m_sourceMappingURLDirective;
        return String();
    }
    void setSourceURLDirective(const String& sourceURL)
    {
        ensureRareData().m_sourceURLDirective = sourceURL;
    }
    void setSourceMappingURLDirective(const String& sourceMappingURL)
    {
        ensureRareData().m_sourceMappingURLDirective = sourceMappingURL;
    }

    void finalizeUnconditionally(VM&, CollectionScope);

    struct ClassElementDefinition {
        WTF_MAKE_STRUCT_TZONE_ALLOCATED(ClassElementDefinition);

        enum class Kind : uint8_t {
            FieldWithLiteralPropertyKey = 0,
            FieldWithComputedPropertyKey = 1,
            FieldWithPrivatePropertyKey = 2,
            StaticInitializationBlock = 3,
        };

        Identifier ident { };
        JSTextPosition position { };
        std::optional<JSTextPosition> initializerPosition { std::nullopt };
        Kind kind { Kind::FieldWithLiteralPropertyKey };
    };

    struct RareData {
        WTF_MAKE_STRUCT_TZONE_ALLOCATED(RareData);

        SourceCode m_classSource;
        String m_sourceURLDirective;
        String m_sourceMappingURLDirective;
        RefPtr<TDZEnvironmentLink> m_parentScopeTDZVariables;
        FixedVector<Identifier> m_generatorOrAsyncWrapperFunctionParameterNames;
        FixedVector<ClassElementDefinition> m_classElementDefinitions;
        PrivateNameEnvironment m_parentPrivateNameEnvironment;
    };

    NeedsClassFieldInitializer needsClassFieldInitializer() const { return static_cast<NeedsClassFieldInitializer>(m_needsClassFieldInitializer); }

    const FixedVector<ClassElementDefinition>* classElementDefinitions() const
    {
        if (m_rareData)
            return &m_rareData->m_classElementDefinitions;
        return nullptr;
    }

    void setClassElementDefinitions(Vector<ClassElementDefinition>&& classElementDefinitions)
    {
        if (classElementDefinitions.isEmpty())
            return;
        ensureRareData().m_classElementDefinitions = FixedVector<ClassElementDefinition>(WTFMove(classElementDefinitions));
    }

private:
    UnlinkedFunctionExecutable(VM&, Structure*, const SourceCode&, FunctionMetadataNode*, UnlinkedFunctionKind, ConstructAbility, InlineAttribute, JSParserScriptMode, RefPtr<TDZEnvironmentLink>, std::optional<Vector<Identifier>>&&, std::optional<PrivateNameEnvironment>, JSC::DerivedContextType, JSC::NeedsClassFieldInitializer, PrivateBrandRequirement, bool isBuiltinDefaultClassConstructor);
    UnlinkedFunctionExecutable(Decoder&, const CachedFunctionExecutable&);

    DECLARE_VISIT_CHILDREN;

    void decodeCachedCodeBlocks(VM&);

    bool codeBlockEdgeMayBeWeak() const
    {
        // Currently, bytecode cache assumes that the tree of UnlinkedFunctionExecutable and UnlinkedCodeBlock will not be destroyed while the parent is live.
        // Bytecode cache uses this asumption to avoid duplicate materialization by bookkeeping the heap cells in the offste-to-pointer map.
        return VM::useUnlinkedCodeBlockJettisoning() && !m_isGeneratedFromCache;
    }

    unsigned m_firstLineOffset : 31;
    unsigned m_isGeneratedFromCache : 1;
    unsigned m_lineCount : 31;
    unsigned m_hasCapturedVariables : 1;
    unsigned m_unlinkedFunctionStart: 31;
    unsigned m_isBuiltinFunction : 1;
    unsigned m_unlinkedBodyStartColumn : 31;
    unsigned m_isBuiltinDefaultClassConstructor : 1;
    unsigned m_unlinkedBodyEndColumn : 31;
    unsigned m_constructAbility: 1;
    unsigned m_startOffset : 31;
    unsigned m_scriptMode: 1; // JSParserScriptMode
    unsigned m_sourceLength : 31;
    unsigned m_superBinding : 1;
    unsigned m_parametersStartOffset : 31;
    unsigned m_isCached : 1;
    unsigned m_unlinkedFunctionEnd : 31;
    unsigned m_needsClassFieldInitializer : 1;
    unsigned m_parameterCount : 31;
    unsigned m_privateBrandRequirement : 1;
    CodeFeatures m_features : bitWidthOfCodeFeatures;
    uint16_t m_constructorKind : 2;
    SourceParseMode m_sourceParseMode;
    uint8_t m_implementationVisibility : bitWidthOfImplementationVisibility;
    LexicallyScopedFeatures m_lexicallyScopedFeatures : bitWidthOfLexicallyScopedFeatures;
    uint8_t m_functionMode : 2; // FunctionMode
    uint8_t m_derivedContextType : 2;
    uint8_t m_inlineAttribute : 1;

    union {
        WriteBarrier<UnlinkedFunctionCodeBlock> m_unlinkedCodeBlockForCall;
        RefPtr<Decoder> m_decoder;
    };

    union {
        WriteBarrier<UnlinkedFunctionCodeBlock> m_unlinkedCodeBlockForConstruct;
        struct {
            int32_t m_cachedCodeBlockForCallOffset;
            int32_t m_cachedCodeBlockForConstructOffset;
        };
    };

    Identifier m_name;
    Identifier m_ecmaName;

    RareData& ensureRareData()
    {
        if (LIKELY(m_rareData))
            return *m_rareData;
        return ensureRareDataSlow();
    }
    RareData& ensureRareDataSlow();

    std::unique_ptr<RareData> m_rareData;

public:
    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_EXPORT_INFO;
};

#if !ASSERT_ENABLED
static_assert(sizeof(UnlinkedFunctionExecutable) <= 96, "UnlinkedFunctionExecutable needs to be small");
#endif

} // namespace JSC
