/*
 * Copyright (C) 2009-2019 Apple Inc. All rights reserved.
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

#include "ExecutableBase.h"
#include "ParserModes.h"
#include "ProfilerJettisonReason.h"

namespace JSC {

class JSArray;
class JSTemplateObjectDescriptor;
class IsoCellSet;

class ScriptExecutable : public ExecutableBase {
public:
    typedef ExecutableBase Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    static void destroy(JSCell*);

    using TemplateObjectMap = UncheckedKeyHashMap<uint64_t, WriteBarrier<JSArray>, WTF::IntHash<uint64_t>, WTF::UnsignedWithZeroKeyHashTraits<uint64_t>>;
        
    CodeBlockHash hashFor(CodeSpecializationKind) const;

    const SourceCode& source() const { return m_source; }
    SourceID sourceID() const { return m_source.providerID(); }
    const SourceOrigin& sourceOrigin() const { return m_source.provider()->sourceOrigin(); }
    // This is NOT the path that should be used for computing relative paths from a script. Use SourceOrigin's URL for that, the values may or may not be the same... This should only be used for `error.sourceURL` and stack traces.
    const String& sourceURL() const { return m_source.provider()->sourceURL(); }
    const String& sourceURLStripped() const { return m_source.provider()->sourceURLStripped(); }
    const String& preRedirectURL() const { return m_source.provider()->preRedirectURL(); }
    int firstLine() const { return m_source.firstLine().oneBasedInt(); }
    JS_EXPORT_PRIVATE int lastLine() const;
    unsigned startColumn() const { return m_source.startColumn().oneBasedInt(); }
    JS_EXPORT_PRIVATE unsigned endColumn() const;

    std::optional<int> overrideLineNumber(VM&) const;
    unsigned typeProfilingStartOffset() const;
    unsigned typeProfilingEndOffset() const;

    bool usesArguments() const { return m_features & ArgumentsFeature; }
    bool isArrowFunctionContext() const { return m_isArrowFunctionContext; }
    DerivedContextType derivedContextType() const { return static_cast<DerivedContextType>(m_derivedContextType); }
    EvalContextType evalContextType() const { return static_cast<EvalContextType>(m_evalContextType); }
    bool isInStrictContext() const { return m_lexicallyScopedFeatures & StrictModeLexicallyScopedFeature; }
    bool usesNonSimpleParameterList() const { return m_features & NonSimpleParameterListFeature; }

    void setNeverInline(bool value) { m_neverInline = value; }
    void setNeverOptimize(bool value) { m_neverOptimize = value; }
    void setNeverFTLOptimize(bool value) { m_neverFTLOptimize = value; }
    void setDidTryToEnterInLoop(bool value) { m_didTryToEnterInLoop = value; }
    void setCanUseOSRExitFuzzing(bool value) { m_canUseOSRExitFuzzing = value; }
    bool neverInline() const { return m_neverInline; }
    bool neverOptimize() const { return m_neverOptimize; }
    bool neverFTLOptimize() const { return m_neverFTLOptimize; }
    bool didTryToEnterInLoop() const { return m_didTryToEnterInLoop; }
    bool isInliningCandidate() const { return !neverInline(); }
    bool isOkToOptimize() const { return !neverOptimize(); }
    bool canUseOSRExitFuzzing() const { return m_canUseOSRExitFuzzing; }
    bool isInsideOrdinaryFunction() const { return m_isInsideOrdinaryFunction; }
    
    bool* addressOfDidTryToEnterInLoop() { return &m_didTryToEnterInLoop; }

    CodeFeatures features() const { return m_features; }
    LexicallyScopedFeatures lexicallyScopedFeatures() { return static_cast<LexicallyScopedFeatures>(m_lexicallyScopedFeatures); }
    void setTaintedByWithScope() { m_lexicallyScopedFeatures |= TaintedByWithScopeLexicallyScopedFeature; }
        
    DECLARE_EXPORT_INFO;

    void recordParse(CodeFeatures, LexicallyScopedFeatures, bool hasCapturedVariables, int lastLine, unsigned endColumn);
    void installCode(CodeBlock*);
    void installCode(VM&, CodeBlock*, CodeType, CodeSpecializationKind, Profiler::JettisonReason);
    CodeBlock* newCodeBlockFor(CodeSpecializationKind, JSFunction*, JSScope*);
    CodeBlock* newReplacementCodeBlockFor(CodeSpecializationKind);

    void clearCode(IsoCellSet&);

    Intrinsic intrinsic() const
    {
        return m_intrinsic;
    }

    bool hasJITCodeForCall() const
    {
        return m_jitCodeForCall;
    }
    bool hasJITCodeForConstruct() const
    {
        return m_jitCodeForConstruct;
    }

    // This function has an interesting GC story. Callers of this function are asking us to create a CodeBlock
    // that is not jettisoned before this function returns. Callers are essentially asking for a strong reference
    // to the CodeBlock. Because the Executable may be allocating the CodeBlock, we require callers to pass in
    // their CodeBlock*& reference because it's safe for CodeBlock to be jettisoned if Executable is the only thing
    // to point to it. This forces callers to have a CodeBlock* in a register or on the stack that will be marked
    // by conservative GC if a GC happens after we create the CodeBlock.
    template <typename ExecutableType>
    void prepareForExecution(VM&, JSFunction*, JSScope*, CodeSpecializationKind, CodeBlock*&);

    ScriptExecutable* topLevelExecutable();
    JSArray* createTemplateObject(JSGlobalObject*, JSTemplateObjectDescriptor*);

private:
    friend class ExecutableBase;
    void prepareForExecutionImpl(VM&, JSFunction*, JSScope*, CodeSpecializationKind, CodeBlock*&);

    bool hasClearableCode() const;

    TemplateObjectMap& ensureTemplateObjectMap(VM&);

protected:
    ScriptExecutable(Structure*, VM&, const SourceCode&, LexicallyScopedFeatures, DerivedContextType, bool isInArrowFunctionContext, bool isInsideOrdinaryFunction, EvalContextType, Intrinsic);

    void recordParse(CodeFeatures features, LexicallyScopedFeatures lexicallyScopedFeatures, bool hasCapturedVariables)
    {
        m_features = features;
        m_lexicallyScopedFeatures = lexicallyScopedFeatures;
        m_hasCapturedVariables = hasCapturedVariables;
    }

    static TemplateObjectMap& ensureTemplateObjectMapImpl(std::unique_ptr<TemplateObjectMap>& dest);

    template<typename Visitor>
    static void runConstraint(const ConcurrentJSLocker&, Visitor&, CodeBlock*);
    template<typename Visitor>
    static void visitCodeBlockEdge(Visitor&, CodeBlock*);
    void finalizeCodeBlockEdge(VM&, WriteBarrier<CodeBlock>&);

    SourceCode m_source;
    Intrinsic m_intrinsic { NoIntrinsic };
    bool m_didTryToEnterInLoop { false };
    CodeFeatures m_features;
    LexicallyScopedFeatures m_lexicallyScopedFeatures : bitWidthOfLexicallyScopedFeatures;
    OptionSet<CodeGenerationMode> m_codeGenerationModeForGeneratorBody;
    bool m_hasCapturedVariables : 1;
    bool m_neverInline : 1;
    bool m_neverOptimize : 1;
    bool m_neverFTLOptimize : 1;
    bool m_isArrowFunctionContext : 1;
    bool m_canUseOSRExitFuzzing : 1;
    bool m_codeForGeneratorBodyWasGenerated : 1;
    bool m_isInsideOrdinaryFunction : 1;
    unsigned m_derivedContextType : 2; // DerivedContextType
    unsigned m_evalContextType : 2; // EvalContextType
};

} // namespace JSC
