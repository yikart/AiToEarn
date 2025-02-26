/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "JITOperationValidation.h"
#include "ThrowScope.h"

#include <type_traits>
#include <wtf/FunctionTraits.h>
#include <wtf/StdLibExtras.h>

namespace JSC {

// This is wrapped in a lambda since it's used by static_asserts thus needs to be an expression.
// Additionally, it should not participate in SFINAE: substitution failure IS an error when used in
// a type name below.
template<typename T>
constexpr bool assertNotOperationSignature = ([] { 
    static_assert(!std::is_function_v<typename std::remove_pointer_t<T>>, "This should take a return type, not an operator signature."); 
    return true; 
})();

template<typename T>
concept canMakeExceptionOperationResult =
    std::is_standard_layout_v<T>
    && std::is_trivial_v<T>
#if CPU(ARM64) || CPU(ARM_THUMB2)
    && !std::is_floating_point_v<T> // The ARM64 ABI says that this should be returned in x0 instead of d0. Seems unlikely it's worth it to do the extra fmov.
#endif
    && sizeof(T) <= sizeof(CPURegister);

#if USE(JSVALUE64)

template<typename T>
struct ExceptionOperationResult {
    using ResultType = T;
    static_assert(assertNotOperationSignature<T>);
    T value;
    Exception* exception;
};

template<>
struct ExceptionOperationResult<void> {
    using ResultType = void;
    Exception* exception;
};

template<typename OperationType>
concept OperationHasResult = FunctionTraits<OperationType>::hasResult && !std::is_same_v<typename FunctionTraits<OperationType>::ResultType, ExceptionOperationResult<void>>;

// Note we need this because e.g. `requires (!OperationHasResult<int>)` will pass the requirement as the SFINAE in `OperationHasResult<int>`
// means the concept returns false and the `!` makes it true.
template<typename OperationType>
concept OperationIsVoid = !FunctionTraits<OperationType>::hasResult || std::is_same_v<typename FunctionTraits<OperationType>::ResultType, ExceptionOperationResult<void>>;

template<typename T>
struct IsExceptionOperationResult : std::false_type { };

template<typename T>
struct IsExceptionOperationResult<ExceptionOperationResult<T>> : std::true_type { };

template<typename T>
concept isExceptionOperationResult = IsExceptionOperationResult<T>::value;

// Note: We always return an exception in a register if the operation's return type is void on all platforms (assuming it throws).
template<typename T>
using OperationReturnType = std::conditional_t<(std::is_same_v<T, void> || canMakeExceptionOperationResult<T>), ExceptionOperationResult<T>, T>;

// This class exists so we can cast ExceptionOperationImplicitResult<From> to ExceptionOperationResult<To> implicitly while ExceptionOperationResult remains POD.
// FIXME: we could use __atribute__((trivial_abi)) when we no longer support MSVC.
template<typename From>
struct ExceptionOperationImplicitResult {
    template<typename To>
    requires std::is_convertible_v<From, To>
    ALWAYS_INLINE operator ExceptionOperationResult<To>()
    {
        // For whatever reason aggregate initialization doesn't seem to work here.
        ExceptionOperationResult<To> result;
        result.value = value;
        result.exception = exception;
        return result;
    }

    template<typename To>
    ALWAYS_INLINE operator To()
    {
        return value;
    }

    From value;
    Exception* exception;
};

template<>
struct ExceptionOperationImplicitResult<void> {
    ALWAYS_INLINE operator ExceptionOperationResult<void>()
    {
        ExceptionOperationResult<void> result;
        result.exception = exception;
        return result;
    }

    Exception* exception;
};

// We can't have a constructor since that would make ExceptionOperationResult non-pod and thus not returned in registers.
template<typename Scope, typename T>
requires canMakeExceptionOperationResult<T>
ALWAYS_INLINE ExceptionOperationImplicitResult<T> makeOperationResult(Scope& scope, T result)
{
    return { result, scope.exception() };
}

template<typename Scope>
ALWAYS_INLINE ExceptionOperationImplicitResult<void> makeOperationResult(Scope& scope)
{
    return { scope.exception() };
}

template<typename Scope, typename T>
requires (!canMakeExceptionOperationResult<T>)
ALWAYS_INLINE T makeOperationResult(Scope& scope, T result)
{
    RELEASE_AND_RETURN(scope, result);
}

#else // USE(JSVALUE64)

enum class ExceptionOperationResultTag : uint64_t { };

struct ExceptionOperationResultVoid {
    Exception* exception;
};

template<typename T>
using ExceptionOperationResult = std::conditional_t<(std::is_same_v<T, void>), ExceptionOperationResultVoid, ExceptionOperationResultTag>;

template<typename OperationType>
concept OperationHasResult = FunctionTraits<OperationType>::hasResult && !std::is_same_v<typename FunctionTraits<OperationType>::ResultType, ExceptionOperationResult<void>>;

// Note we need this because e.g. `requires (!OperationHasResult<int>)` will pass the requirement as the SFINAE in `OperationHasResult<int>`
// means the concept returns false and the `!` makes it true.
template<typename OperationType>
concept OperationIsVoid = !FunctionTraits<OperationType>::hasResult || std::is_same_v<typename FunctionTraits<OperationType>::ResultType, ExceptionOperationResult<void>>;

template<typename T>
struct IsExceptionOperationResult : std::false_type { };

template<>
struct IsExceptionOperationResult<ExceptionOperationResultTag> : std::true_type { };

template<>
struct IsExceptionOperationResult<ExceptionOperationResultVoid> : std::true_type { };

template<typename T>
concept isExceptionOperationResult = IsExceptionOperationResult<T>::value;

// Note: We always return an exception in a register if the operation's return type is void on all platforms (assuming it throws).
template<typename T>
using OperationReturnType = std::conditional_t<(assertNotOperationSignature<T> && (std::is_same_v<T, void> || canMakeExceptionOperationResult<T>)), ExceptionOperationResult<T>, T>;

static ALWAYS_INLINE ExceptionOperationResultTag asExceptionResultBase(uint32_t value, Exception* exception)
{
    uint32_t v = std::bit_cast<uint32_t>(value);
    return std::bit_cast<ExceptionOperationResultTag>(
        static_cast<long long>(v)
        | (static_cast<long long>(reinterpret_cast<uint32_t>(exception)) << 32));
}

template<typename T>
requires (sizeof(T) == sizeof(uint32_t))
static ALWAYS_INLINE ExceptionOperationResultTag asExceptionResult(T value, Exception* exception)
{
    uint32_t v = std::bit_cast<uint32_t>(value);
    return asExceptionResultBase(v, exception);
}

template<typename T>
requires (sizeof(T) < sizeof(uint32_t))
static ALWAYS_INLINE ExceptionOperationResultTag asExceptionResult(T value, Exception* exception)
{
    uint32_t v = static_cast<uint32_t>(value);
    return asExceptionResultBase(v, exception);
}

template<typename From>
struct ExceptionOperationImplicitResult {

    ALWAYS_INLINE operator ExceptionOperationResultTag()
    {
        return asExceptionResult(value, exception);
    }

    template<typename To>
    ALWAYS_INLINE operator To()
    {
        return static_cast<To>(value);
    }

    From value;
    Exception* exception;
};

template<>
struct ExceptionOperationImplicitResult<void> {
    ALWAYS_INLINE operator ExceptionOperationResultVoid()
    {
        return { exception };
    }

    Exception* exception;
};

template<typename Scope, typename T>
requires canMakeExceptionOperationResult<T>
ALWAYS_INLINE ExceptionOperationImplicitResult<T> makeOperationResult(Scope& scope, T result)
{
    static_assert(assertNotOperationSignature<T>);
    return { result, scope.exception() };
}

template<typename Scope>
ALWAYS_INLINE ExceptionOperationImplicitResult<void> makeOperationResult(Scope& scope)
{
    return { scope.exception() };
}

template<typename Scope, typename T>
requires (!canMakeExceptionOperationResult<T>)
ALWAYS_INLINE T makeOperationResult(Scope& scope, T result)
{
    static_assert(assertNotOperationSignature<T>);
    RELEASE_AND_RETURN(scope, result);
}

#endif // USE(JSVALUE64)

#define OPERATION_RETURN(scope__, ...) return makeOperationResult(scope__, ## __VA_ARGS__);
#define OPERATION_RETURN_IF_EXCEPTION(scope__, ...) RETURN_IF_EXCEPTION(scope__, makeOperationResult(scope__, ## __VA_ARGS__))

#if COMPILER(CLANG)

#define JSC_DECLARE_JIT_OPERATION(functionName, returnType, parameters) \
    _Pragma("clang diagnostic push") \
    _Pragma("clang diagnostic ignored \"-Wreturn-type-c-linkage\"") \
    JSC_DECLARE_JIT_OPERATION_IMPL(functionName, JSC::OperationReturnType<returnType>, parameters) \
    _Pragma("clang diagnostic pop")

#define JSC_DECLARE_JIT_OPERATION_WITHOUT_WTF_INTERNAL(functionName, returnType, parameters) \
    _Pragma("clang diagnostic push") \
    _Pragma("clang diagnostic ignored \"-Wreturn-type-c-linkage\"") \
    JSC_DECLARE_JIT_OPERATION_WITHOUT_WTF_INTERNAL_IMPL(functionName, JSC::OperationReturnType<returnType>, parameters) \
    _Pragma("clang diagnostic pop")

#else

#define JSC_DECLARE_JIT_OPERATION(functionName, returnType, parameters) JSC_DECLARE_JIT_OPERATION_IMPL(functionName, JSC::OperationReturnType<returnType>, parameters)
#define JSC_DECLARE_JIT_OPERATION_WITHOUT_WTF_INTERNAL(functionName, returnType, parameters) JSC_DECLARE_JIT_OPERATION_WITHOUT_WTF_INTERNAL_IMPL(functionName, JSC::OperationReturnType<returnType>, parameters)

#endif

#define JSC_DEFINE_JIT_OPERATION(functionName, returnType, parameters) JSC_DEFINE_JIT_OPERATION_IMPL(functionName, JSC::OperationReturnType<returnType>, parameters)

#define JSC_DECLARE_NOEXCEPT_JIT_OPERATION(functionName, returnType, parameters) JSC_DECLARE_JIT_OPERATION_IMPL(functionName, returnType, parameters)
#define JSC_DECLARE_NOEXCEPT_JIT_OPERATION_WITH_ATTRIBUTES(functionName, attributes, returnType, parameters) JSC_DECLARE_JIT_OPERATION_WITH_ATTRIBUTES_IMPL(functionName, attributes, returnType, parameters)
#define JSC_DECLARE_NOEXCEPT_JIT_OPERATION_WITHOUT_WTF_INTERNAL(functionName, returnType, parameters) JSC_DECLARE_JIT_OPERATION_WITHOUT_WTF_INTERNAL_IMPL(functionName, returnType, parameters)

#define JSC_DEFINE_NOEXCEPT_JIT_OPERATION_WITH_ATTRIBUTES(functionName, attributes, returnType, parameters) JSC_DEFINE_JIT_OPERATION_WITH_ATTRIBUTES_IMPL(functionName, attributes, returnType, parameters)
#define JSC_DEFINE_NOEXCEPT_JIT_OPERATION(functionName, returnType, parameters) JSC_DEFINE_JIT_OPERATION_IMPL(functionName, returnType, parameters)

} // namespace JSC
