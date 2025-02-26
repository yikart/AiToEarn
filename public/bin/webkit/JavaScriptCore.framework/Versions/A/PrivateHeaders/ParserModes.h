/*
 * Copyright (C) 2012-2013, 2015-2016 Apple Inc. All rights reserved.
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

#include "ConstructAbility.h"
#include "ConstructorKind.h"
#include "Identifier.h"
#include "InlineAttribute.h"

namespace JSC {

enum class JSParserBuiltinMode { NotBuiltin, Builtin };
enum class JSParserScriptMode { Classic, Module };

enum class SuperBinding { Needed, NotNeeded };

enum class PrivateBrandRequirement { None, Needed };

enum class CodeGenerationMode : uint8_t {
    Debugger = 1 << 0,
    TypeProfiler = 1 << 1,
    ControlFlowProfiler = 1 << 2,
};

enum class FunctionMode { None, FunctionExpression, FunctionDeclaration, MethodDefinition };

// Keep it less than 32, it means this should be within 5 bits.
enum class SourceParseMode : uint8_t {
    NormalFunctionMode                = 0,
    GeneratorBodyMode                 = 1,
    GeneratorWrapperFunctionMode      = 2,
    GetterMode                        = 3,
    SetterMode                        = 4,
    MethodMode                        = 5,
    ArrowFunctionMode                 = 6,
    AsyncFunctionBodyMode             = 7,
    AsyncArrowFunctionBodyMode        = 8,
    AsyncFunctionMode                 = 9,
    AsyncMethodMode                   = 10,
    AsyncArrowFunctionMode            = 11,
    ProgramMode                       = 12,
    ModuleAnalyzeMode                 = 13,
    ModuleEvaluateMode                = 14,
    AsyncGeneratorBodyMode            = 15,
    AsyncGeneratorWrapperFunctionMode = 16,
    AsyncGeneratorWrapperMethodMode   = 17,
    GeneratorWrapperMethodMode        = 18,
    ClassFieldInitializerMode         = 19,
    ClassStaticBlockMode              = 20,
};

class SourceParseModeSet { 
public: 
    template<typename... Modes> 
    constexpr SourceParseModeSet(Modes... args)
        : m_mask(mergeSourceParseModes(args...)) 
    { 
    } 

    ALWAYS_INLINE constexpr bool contains(SourceParseMode mode)
    { 
        return (1U << static_cast<unsigned>(mode)) & m_mask;
    } 

private: 
    ALWAYS_INLINE static constexpr unsigned mergeSourceParseModes(SourceParseMode mode)
    { 
        return (1U << static_cast<unsigned>(mode));
    } 

    template<typename... Rest> 
    ALWAYS_INLINE static constexpr unsigned mergeSourceParseModes(SourceParseMode mode, Rest... rest)
    { 
        return (1U << static_cast<unsigned>(mode)) | mergeSourceParseModes(rest...);
    } 

    const unsigned m_mask; 
}; 

ALWAYS_INLINE bool isFunctionParseMode(SourceParseMode parseMode) 
{ 
    return SourceParseModeSet( 
        SourceParseMode::NormalFunctionMode, 
        SourceParseMode::GeneratorBodyMode, 
        SourceParseMode::GeneratorWrapperFunctionMode, 
        SourceParseMode::GeneratorWrapperMethodMode,
        SourceParseMode::GetterMode, 
        SourceParseMode::SetterMode, 
        SourceParseMode::MethodMode, 
        SourceParseMode::ArrowFunctionMode, 
        SourceParseMode::AsyncFunctionBodyMode, 
        SourceParseMode::AsyncFunctionMode, 
        SourceParseMode::AsyncMethodMode, 
        SourceParseMode::AsyncArrowFunctionMode, 
        SourceParseMode::AsyncArrowFunctionBodyMode,
        SourceParseMode::AsyncGeneratorBodyMode,
        SourceParseMode::AsyncGeneratorWrapperFunctionMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode,
        SourceParseMode::ClassFieldInitializerMode,
        SourceParseMode::ClassStaticBlockMode).contains(parseMode);
} 

ALWAYS_INLINE bool isAsyncFunctionParseMode(SourceParseMode parseMode) 
{ 
    return SourceParseModeSet(
        SourceParseMode::AsyncGeneratorWrapperFunctionMode,
        SourceParseMode::AsyncGeneratorBodyMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode,
        SourceParseMode::AsyncFunctionBodyMode, 
        SourceParseMode::AsyncFunctionMode, 
        SourceParseMode::AsyncMethodMode, 
        SourceParseMode::AsyncArrowFunctionMode, 
        SourceParseMode::AsyncArrowFunctionBodyMode).contains(parseMode); 
} 

ALWAYS_INLINE bool isAsyncArrowFunctionParseMode(SourceParseMode parseMode) 
{ 
    return SourceParseModeSet( 
        SourceParseMode::AsyncArrowFunctionMode,
        SourceParseMode::AsyncArrowFunctionBodyMode).contains(parseMode); 
} 

ALWAYS_INLINE bool isAsyncGeneratorParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::AsyncGeneratorWrapperFunctionMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode,
        SourceParseMode::AsyncGeneratorBodyMode).contains(parseMode);
}

ALWAYS_INLINE bool isAsyncGeneratorWrapperParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::AsyncGeneratorWrapperFunctionMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode).contains(parseMode);
}

ALWAYS_INLINE bool isAsyncFunctionOrAsyncGeneratorWrapperParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::AsyncArrowFunctionMode,
        SourceParseMode::AsyncFunctionMode,
        SourceParseMode::AsyncGeneratorWrapperFunctionMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode,
        SourceParseMode::AsyncMethodMode).contains(parseMode);
    }
    
ALWAYS_INLINE bool isAsyncFunctionWrapperParseMode(SourceParseMode parseMode) 
{ 
    return SourceParseModeSet( 
        SourceParseMode::AsyncArrowFunctionMode, 
        SourceParseMode::AsyncFunctionMode,
        SourceParseMode::AsyncMethodMode).contains(parseMode); 
}

ALWAYS_INLINE bool isAsyncFunctionBodyParseMode(SourceParseMode parseMode) 
{ 
    return SourceParseModeSet( 
        SourceParseMode::AsyncFunctionBodyMode,
        SourceParseMode::AsyncGeneratorBodyMode,
        SourceParseMode::AsyncArrowFunctionBodyMode).contains(parseMode); 
}
    
ALWAYS_INLINE bool isGeneratorMethodParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::GeneratorWrapperMethodMode).contains(parseMode);
}

ALWAYS_INLINE bool isAsyncMethodParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(SourceParseMode::AsyncMethodMode).contains(parseMode);
}
    
ALWAYS_INLINE bool isAsyncGeneratorMethodParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(SourceParseMode::AsyncGeneratorWrapperMethodMode).contains(parseMode);
}

ALWAYS_INLINE bool isMethodParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::GeneratorWrapperMethodMode,
        SourceParseMode::GetterMode,
        SourceParseMode::SetterMode,
        SourceParseMode::MethodMode,
        SourceParseMode::AsyncMethodMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode,
        SourceParseMode::ClassStaticBlockMode).contains(parseMode);
}

ALWAYS_INLINE bool isGeneratorOrAsyncFunctionBodyParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::GeneratorBodyMode,
        SourceParseMode::AsyncFunctionBodyMode,
        SourceParseMode::AsyncGeneratorBodyMode,
        SourceParseMode::AsyncArrowFunctionBodyMode).contains(parseMode);
}

ALWAYS_INLINE bool isGeneratorOrAsyncFunctionWrapperParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::GeneratorWrapperFunctionMode,
        SourceParseMode::GeneratorWrapperMethodMode,
        SourceParseMode::AsyncFunctionMode,
        SourceParseMode::AsyncArrowFunctionMode,
        SourceParseMode::AsyncGeneratorWrapperFunctionMode,
        SourceParseMode::AsyncMethodMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode).contains(parseMode);
}

ALWAYS_INLINE bool isGeneratorOrAsyncGeneratorWrapperParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::GeneratorWrapperFunctionMode,
        SourceParseMode::GeneratorWrapperMethodMode,
        SourceParseMode::AsyncGeneratorWrapperFunctionMode,
        SourceParseMode::AsyncGeneratorWrapperMethodMode).contains(parseMode);
}

ALWAYS_INLINE bool isGeneratorParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::GeneratorBodyMode,
        SourceParseMode::GeneratorWrapperFunctionMode,
        SourceParseMode::GeneratorWrapperMethodMode).contains(parseMode);    
}

ALWAYS_INLINE bool isGeneratorWrapperParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::GeneratorWrapperFunctionMode,
        SourceParseMode::GeneratorWrapperMethodMode).contains(parseMode);
}

ALWAYS_INLINE bool isArrowFunctionParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::ArrowFunctionMode,
        SourceParseMode::AsyncArrowFunctionMode,
        SourceParseMode::AsyncArrowFunctionBodyMode).contains(parseMode);
}

ALWAYS_INLINE bool isModuleParseMode(SourceParseMode parseMode) 
{ 
    return SourceParseModeSet( 
        SourceParseMode::ModuleAnalyzeMode, 
        SourceParseMode::ModuleEvaluateMode).contains(parseMode); 
}

ALWAYS_INLINE bool isProgramParseMode(SourceParseMode parseMode) 
{ 
    return SourceParseModeSet(SourceParseMode::ProgramMode).contains(parseMode); 
}

ALWAYS_INLINE bool isProgramOrModuleParseMode(SourceParseMode parseMode)
{
    return SourceParseModeSet(
        SourceParseMode::ProgramMode, 
        SourceParseMode::ModuleAnalyzeMode, 
        SourceParseMode::ModuleEvaluateMode).contains(parseMode); 
}

ALWAYS_INLINE ConstructAbility constructAbilityForParseMode(SourceParseMode parseMode) 
{ 
    if (parseMode == SourceParseMode::NormalFunctionMode) 
        return ConstructAbility::CanConstruct;

    return ConstructAbility::CannotConstruct;
}

inline bool functionNameIsInScope(const Identifier& name, FunctionMode functionMode)
{
    if (name.isNull())
        return false;

    if (functionMode != FunctionMode::FunctionExpression)
        return false;

    return true;
}

inline bool functionNameScopeIsDynamic(bool usesEval, bool isStrictMode)
{
    // If non-strict eval is in play, a function gets a separate object in the scope chain for its name.
    // This enables eval to declare and then delete a name that shadows the function's name.

    if (!usesEval)
        return false;

    if (isStrictMode)
        return false;

    return true;
}

typedef uint8_t LexicallyScopedFeatures;

const LexicallyScopedFeatures NoLexicallyScopedFeatures                     = 0;
const LexicallyScopedFeatures StrictModeLexicallyScopedFeature         = 1 << 0;
const LexicallyScopedFeatures TaintedByWithScopeLexicallyScopedFeature = 1 << 1;

const LexicallyScopedFeatures AllLexicallyScopedFeatures = NoLexicallyScopedFeatures | StrictModeLexicallyScopedFeature | TaintedByWithScopeLexicallyScopedFeature;
static constexpr unsigned bitWidthOfLexicallyScopedFeatures = 2;
static_assert(AllLexicallyScopedFeatures <= (1 << bitWidthOfLexicallyScopedFeatures) - 1, "LexicallyScopedFeatures must be 2bits");

typedef uint16_t CodeFeatures;

const CodeFeatures NoFeatures =                         0;
const CodeFeatures EvalFeature =                   1 << 0;
const CodeFeatures ArgumentsFeature =              1 << 1;
const CodeFeatures WithFeature =                   1 << 2;
const CodeFeatures ThisFeature =                   1 << 3;
const CodeFeatures NonSimpleParameterListFeature = 1 << 4;
const CodeFeatures ShadowsArgumentsFeature =       1 << 5;
const CodeFeatures ArrowFunctionFeature =          1 << 6;
const CodeFeatures AwaitFeature =                  1 << 7;
const CodeFeatures SuperCallFeature =              1 << 8;
const CodeFeatures SuperPropertyFeature =          1 << 9;
const CodeFeatures NewTargetFeature =              1 << 10;
const CodeFeatures NoEvalCacheFeature =            1 << 11;
const CodeFeatures ImportMetaFeature =             1 << 12;

const CodeFeatures AllFeatures = EvalFeature | ArgumentsFeature | WithFeature | ThisFeature | NonSimpleParameterListFeature | ShadowsArgumentsFeature | ArrowFunctionFeature | AwaitFeature | SuperCallFeature | SuperPropertyFeature | NewTargetFeature | NoEvalCacheFeature | ImportMetaFeature;
static constexpr unsigned bitWidthOfCodeFeatures = 14;
static_assert(AllFeatures <= (1 << bitWidthOfCodeFeatures) - 1, "CodeFeatures must fit within 14 bits");

typedef uint8_t InnerArrowFunctionCodeFeatures;
    
const InnerArrowFunctionCodeFeatures NoInnerArrowFunctionFeatures =                0;
const InnerArrowFunctionCodeFeatures EvalInnerArrowFunctionFeature =          1 << 0;
const InnerArrowFunctionCodeFeatures ArgumentsInnerArrowFunctionFeature =     1 << 1;
const InnerArrowFunctionCodeFeatures ThisInnerArrowFunctionFeature =          1 << 2;
const InnerArrowFunctionCodeFeatures SuperCallInnerArrowFunctionFeature =     1 << 3;
const InnerArrowFunctionCodeFeatures SuperPropertyInnerArrowFunctionFeature = 1 << 4;
const InnerArrowFunctionCodeFeatures NewTargetInnerArrowFunctionFeature =     1 << 5;
    
const InnerArrowFunctionCodeFeatures AllInnerArrowFunctionCodeFeatures = EvalInnerArrowFunctionFeature | ArgumentsInnerArrowFunctionFeature | ThisInnerArrowFunctionFeature | SuperCallInnerArrowFunctionFeature | SuperPropertyInnerArrowFunctionFeature | NewTargetInnerArrowFunctionFeature;
static_assert(AllInnerArrowFunctionCodeFeatures <= 0b111111, "InnerArrowFunctionCodeFeatures must be 6bits");
} // namespace JSC
