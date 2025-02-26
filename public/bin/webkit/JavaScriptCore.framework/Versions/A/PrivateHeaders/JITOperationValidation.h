/*
 * Copyright (C) 2021-2022 Apple Inc. All rights reserved.
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

#if ENABLE(JIT_CAGE)
#include <WebKitAdditions/JITCageAdditions.h>
#else // ENABLE(JIT_CAGE)
#if OS(DARWIN)
#define MAP_EXECUTABLE_FOR_JIT MAP_JIT
#define MAP_EXECUTABLE_FOR_JIT_WITH_JIT_CAGE MAP_JIT
#else // OS(DARWIN)
#define MAP_EXECUTABLE_FOR_JIT 0
#define MAP_EXECUTABLE_FOR_JIT_WITH_JIT_CAGE 0
#endif // OS(DARWIN)
#endif

#if !defined(JSC_FORCE_USE_JIT_CAGE)
#define JSC_FORCE_USE_JIT_CAGE 0
#endif

#if !defined(JSC_ALLOW_JIT_CAGE_SPECIFIC_RESERVATION)
#define JSC_ALLOW_JIT_CAGE_SPECIFIC_RESERVATION 1
#endif

namespace JSC {

struct JITOperationAnnotation {
    void* operation;
#if ENABLE(JIT_OPERATION_VALIDATION)
    void* operationWithValidation;
#endif
};

#if ENABLE(JIT_OPERATION_VALIDATION)

#ifndef JSC_DECLARE_JIT_OPERATION_VALIDATION
#define JSC_DECLARE_JIT_OPERATION_VALIDATION(functionName)
#endif

#ifndef JSC_DECLARE_JIT_OPERATION_PROBE_VALIDATION
#define JSC_DECLARE_JIT_OPERATION_PROBE_VALIDATION(functionName)
#endif

#ifndef JSC_DECLARE_JIT_OPERATION_RETURN_VALIDATION
#define JSC_DECLARE_JIT_OPERATION_RETURN_VALIDATION(functionName)
#endif

#ifndef JSC_DEFINE_JIT_OPERATION_VALIDATION
#define JSC_DEFINE_JIT_OPERATION_VALIDATION(functionName) \
    static constexpr auto* functionName##Validate = functionName
#endif

#ifndef JSC_DEFINE_JIT_OPERATION_PROBE_VALIDATION
#define JSC_DEFINE_JIT_OPERATION_PROBE_VALIDATION(functionName) \
    static constexpr auto* functionName##Validate = functionName
#endif

#ifndef JSC_DEFINE_JIT_OPERATION_RETURN_VALIDATION
#define JSC_DEFINE_JIT_OPERATION_RETURN_VALIDATION(functionName) \
    static constexpr auto* functionName##Validate = functionName
#endif

#else // not ENABLE(JIT_OPERATION_VALIDATION)

#define JSC_DECLARE_JIT_OPERATION_VALIDATION(functionName)
#define JSC_DECLARE_JIT_OPERATION_PROBE_VALIDATION(functionName)
#define JSC_DECLARE_JIT_OPERATION_RETURN_VALIDATION(functionName)

#define JSC_DEFINE_JIT_OPERATION_VALIDATION(functionName)
#define JSC_DEFINE_JIT_OPERATION_PROBE_VALIDATION(functionName)
#define JSC_DEFINE_JIT_OPERATION_RETURN_VALIDATION(functionName)

#endif // ENABLE(JIT_OPERATION_VALIDATION)

#define JSC_DECLARE_AND_DEFINE_JIT_OPERATION_VALIDATION(functionName) \
    JSC_DECLARE_JIT_OPERATION_VALIDATION(functionName); \
    JSC_DEFINE_JIT_OPERATION_VALIDATION(functionName)

#define JSC_DECLARE_AND_DEFINE_JIT_OPERATION_PROBE_VALIDATION(functionName) \
    JSC_DECLARE_JIT_OPERATION_PROBE_VALIDATION(functionName); \
    JSC_DEFINE_JIT_OPERATION_PROBE_VALIDATION(functionName)

#define JSC_DECLARE_AND_DEFINE_JIT_OPERATION_RETURN_VALIDATION(functionName) \
    JSC_DECLARE_JIT_OPERATION_RETURN_VALIDATION(functionName); \
    JSC_DEFINE_JIT_OPERATION_RETURN_VALIDATION(functionName)

#ifndef LLINT_DECLARE_ROUTINE_VALIDATE
#define LLINT_DECLARE_ROUTINE_VALIDATE(name) \
    void unused##name##Validate()
#endif

#ifndef LLINT_ROUTINE_VALIDATE
#define LLINT_ROUTINE_VALIDATE(name)  LLInt::getCodeFunctionPtr<CFunctionPtrTag>(name)
#endif

#ifndef LLINT_RETURN_VALIDATE
#define LLINT_RETURN_VALIDATE(name)  LLInt::getCodeFunctionPtr<CFunctionPtrTag>(name)
#endif

#ifndef LLINT_RETURN_WIDE16_VALIDATE
#define LLINT_RETURN_WIDE16_VALIDATE(name)  LLInt::getWide16CodeFunctionPtr<CFunctionPtrTag>(name)
#endif

#ifndef LLINT_RETURN_WIDE32_VALIDATE
#define LLINT_RETURN_WIDE32_VALIDATE(name)  LLInt::getWide32CodeFunctionPtr<CFunctionPtrTag>(name)
#endif

#ifndef JSC_OPERATION_VALIDATION_MACROASSEMBLER_ARM64_SUPPORT
#define JSC_OPERATION_VALIDATION_MACROASSEMBLER_ARM64_SUPPORT() \
    struct NothingToAddForJITOperationValidationMacroAssemblerARM64Support { }
#endif

#ifndef JSC_RETURN_RETAGGED_OPERATION_WITH_VALIDATION
#define JSC_RETURN_RETAGGED_OPERATION_WITH_VALIDATION(operation) \
    return operation.retagged<CFunctionPtrTag>()
#endif

#ifndef JSC_RETURN_RETAGGED_CALL_TARGET_WITH_VALIDATION
#define JSC_RETURN_RETAGGED_CALL_TARGET_WITH_VALIDATION(call) \
    return MacroAssembler::readCallTarget<OperationPtrTag>(call).retagged<CFunctionPtrTag>()
#endif

} // namespace JSC
