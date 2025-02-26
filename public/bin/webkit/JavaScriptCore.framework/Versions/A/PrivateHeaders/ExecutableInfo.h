/*
 * Copyright (C) 2012-2015 Apple Inc. All Rights Reserved.
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

#include "ParserModes.h"

namespace JSC {
    
enum class DerivedContextType : uint8_t { None, DerivedConstructorContext, DerivedMethodContext };
enum class EvalContextType    : uint8_t { None, FunctionEvalContext, InstanceFieldEvalContext };
enum class NeedsClassFieldInitializer : bool { No, Yes };

// FIXME: These flags, ParserModes and propagation to XXXCodeBlocks should be reorganized.
// https://bugs.webkit.org/show_bug.cgi?id=151547
struct ExecutableInfo {
    ExecutableInfo(bool isConstructor, PrivateBrandRequirement privateBrandRequirement, bool isBuiltinFunction, ConstructorKind constructorKind, JSParserScriptMode scriptMode, SuperBinding superBinding, SourceParseMode parseMode, DerivedContextType derivedContextType, NeedsClassFieldInitializer needsClassFieldInitializer, bool isArrowFunctionContext, bool isClassContext, EvalContextType evalContextType)
        : m_isConstructor(isConstructor)
        , m_privateBrandRequirement(static_cast<unsigned>(privateBrandRequirement))
        , m_isBuiltinFunction(isBuiltinFunction)
        , m_constructorKind(static_cast<unsigned>(constructorKind))
        , m_superBinding(static_cast<unsigned>(superBinding))
        , m_scriptMode(static_cast<unsigned>(scriptMode))
        , m_parseMode(parseMode)
        , m_derivedContextType(static_cast<unsigned>(derivedContextType))
        , m_needsClassFieldInitializer(static_cast<unsigned>(needsClassFieldInitializer))
        , m_isArrowFunctionContext(isArrowFunctionContext)
        , m_isClassContext(isClassContext)
        , m_evalContextType(static_cast<unsigned>(evalContextType))
    {
        ASSERT(m_constructorKind == static_cast<unsigned>(constructorKind));
        ASSERT(m_superBinding == static_cast<unsigned>(superBinding));
        ASSERT(m_scriptMode == static_cast<unsigned>(scriptMode));
    }

    bool isConstructor() const { return m_isConstructor; }
    PrivateBrandRequirement privateBrandRequirement() const { return static_cast<PrivateBrandRequirement>(m_privateBrandRequirement); }
    bool isBuiltinFunction() const { return m_isBuiltinFunction; }
    ConstructorKind constructorKind() const { return static_cast<ConstructorKind>(m_constructorKind); }
    SuperBinding superBinding() const { return static_cast<SuperBinding>(m_superBinding); }
    JSParserScriptMode scriptMode() const { return static_cast<JSParserScriptMode>(m_scriptMode); }
    SourceParseMode parseMode() const { return m_parseMode; }
    DerivedContextType derivedContextType() const { return static_cast<DerivedContextType>(m_derivedContextType); }
    EvalContextType evalContextType() const { return static_cast<EvalContextType>(m_evalContextType); }
    bool isArrowFunctionContext() const { return m_isArrowFunctionContext; }
    bool isClassContext() const { return m_isClassContext; }
    NeedsClassFieldInitializer needsClassFieldInitializer() const { return static_cast<NeedsClassFieldInitializer>(m_needsClassFieldInitializer); }

private:
    unsigned m_isConstructor : 1;
    unsigned m_privateBrandRequirement : 1;
    unsigned m_isBuiltinFunction : 1;
    unsigned m_constructorKind : 2;
    unsigned m_superBinding : 1;
    unsigned m_scriptMode: 1;
    SourceParseMode m_parseMode;
    unsigned m_derivedContextType : 2;
    unsigned m_needsClassFieldInitializer : 1;
    unsigned m_isArrowFunctionContext : 1;
    unsigned m_isClassContext : 1;
    unsigned m_evalContextType : 2;
};

} // namespace JSC
