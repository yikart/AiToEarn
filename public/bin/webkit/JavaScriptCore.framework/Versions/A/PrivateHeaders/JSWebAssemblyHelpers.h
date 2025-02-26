/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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

#include "Error.h"
#include "JSArrayBuffer.h"
#include "JSArrayBufferViewInlines.h"
#include "JSCJSValue.h"
#include "JSDataView.h"
#include "JSSourceCode.h"
#include "JSWebAssemblyRuntimeError.h"
#include "WasmFormat.h"
#include "WasmTypeDefinition.h"
#include "WebAssemblyFunction.h"
#include "WebAssemblyWrapperFunction.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

ALWAYS_INLINE uint32_t toNonWrappingUint32(JSGlobalObject* globalObject, JSValue value, ErrorType errorType = ErrorType::TypeError)
{
    VM& vm = getVM(globalObject);
    auto throwScope = DECLARE_THROW_SCOPE(vm);

    if (value.isUInt32())
        return value.asUInt32();

    double doubleValue = value.toNumber(globalObject);
    RETURN_IF_EXCEPTION(throwScope, { });

    if (!std::isnan(doubleValue) && !std::isinf(doubleValue)) {
        double truncedValue = trunc(doubleValue);
        if (truncedValue >= 0 && truncedValue <= UINT_MAX)
            return static_cast<uint32_t>(truncedValue);
    }

    constexpr auto message = "Expect an integer argument in the range: [0, 2^32 - 1]"_s;
    if (errorType == ErrorType::RangeError)
        throwRangeError(globalObject, throwScope, message);
    else
        throwTypeError(globalObject, throwScope, message);
    return { };
}

ALWAYS_INLINE std::span<const uint8_t> getWasmBufferFromValue(JSGlobalObject* globalObject, JSValue value, const WebAssemblySourceProviderBufferGuard&)
{
    VM& vm = getVM(globalObject);
    auto throwScope = DECLARE_THROW_SCOPE(vm);

    if (auto* source = jsDynamicCast<JSSourceCode*>(value)) {
        auto* provider = static_cast<BaseWebAssemblySourceProvider*>(source->sourceCode().provider());
        return { provider->data(), provider->size() };
    }

    // If the given bytes argument is not a BufferSource, a TypeError exception is thrown.
    JSArrayBuffer* arrayBuffer = value.getObject() ? jsDynamicCast<JSArrayBuffer*>(value.getObject()) : nullptr;
    JSArrayBufferView* arrayBufferView = value.getObject() ? jsDynamicCast<JSArrayBufferView*>(value.getObject()) : nullptr;
    if (!(arrayBuffer || arrayBufferView)) {
        throwException(globalObject, throwScope, createTypeError(globalObject,
            "first argument must be an ArrayBufferView or an ArrayBuffer"_s, defaultSourceAppender, runtimeTypeForValue(value)));
        return { };
    }

    if (arrayBufferView) {
        if (isTypedArrayType(arrayBufferView->type())) {
            validateTypedArray(globalObject, arrayBufferView);
            RETURN_IF_EXCEPTION(throwScope, { });
        } else {
            IdempotentArrayBufferByteLengthGetter<std::memory_order_relaxed> getter;
            if (UNLIKELY(!jsCast<JSDataView*>(arrayBufferView)->viewByteLength(getter))) {
                throwTypeError(globalObject, throwScope, typedArrayBufferHasBeenDetachedErrorMessage);
                return { };
            }
        }
    } else if (arrayBuffer->impl()->isDetached()) {
        throwTypeError(globalObject, throwScope, typedArrayBufferHasBeenDetachedErrorMessage);
        return { };
    }

    uint8_t* base = arrayBufferView ? static_cast<uint8_t*>(arrayBufferView->vector()) : static_cast<uint8_t*>(arrayBuffer->impl()->data());
    size_t byteSize = arrayBufferView ? arrayBufferView->byteLength() : arrayBuffer->impl()->byteLength();
    return { base, byteSize };
}

ALWAYS_INLINE Vector<uint8_t> createSourceBufferFromValue(VM& vm, JSGlobalObject* globalObject, JSValue value)
{
    auto throwScope = DECLARE_THROW_SCOPE(vm);

    BaseWebAssemblySourceProvider* provider = nullptr;
    if (auto* source = jsDynamicCast<JSSourceCode*>(value))
        provider = static_cast<BaseWebAssemblySourceProvider*>(source->sourceCode().provider());
    WebAssemblySourceProviderBufferGuard bufferGuard(provider);

    auto data = getWasmBufferFromValue(globalObject, value, bufferGuard);
    RETURN_IF_EXCEPTION(throwScope, { });

    Vector<uint8_t> result;
    if (!result.tryReserveInitialCapacity(data.size())) {
        throwException(globalObject, throwScope, createOutOfMemoryError(globalObject));
        return result;
    }
    result.append(data);
    return result;
}

ALWAYS_INLINE bool isWebAssemblyHostFunction(JSObject* object, WebAssemblyFunction*& wasmFunction, WebAssemblyWrapperFunction*& wasmWrapperFunction)
{
    if (object->inherits<WebAssemblyFunction>()) {
        wasmFunction = jsCast<WebAssemblyFunction*>(object);
        wasmWrapperFunction = nullptr;
        return true;
    }
    if (object->inherits<WebAssemblyWrapperFunction>()) {
        wasmWrapperFunction = jsCast<WebAssemblyWrapperFunction*>(object);
        wasmFunction = nullptr;
        return true;
    }
    return false;
}

ALWAYS_INLINE bool isWebAssemblyHostFunction(JSValue value, WebAssemblyFunction*& wasmFunction, WebAssemblyWrapperFunction*& wasmWrapperFunction)
{
    if (!value.isObject())
        return false;
    return isWebAssemblyHostFunction(jsCast<JSObject*>(value), wasmFunction, wasmWrapperFunction);
}

ALWAYS_INLINE bool isWebAssemblyHostFunction(JSValue object)
{
    WebAssemblyFunction* unused;
    WebAssemblyWrapperFunction* unused2;
    return isWebAssemblyHostFunction(object, unused, unused2);
}

ALWAYS_INLINE JSValue defaultValueForReferenceType(const Wasm::Type type)
{
    ASSERT(Wasm::isRefType(type));
    if (Wasm::isExternref(type))
        return jsUndefined();
    return jsNull();
}

ALWAYS_INLINE JSValue toJSValue(JSGlobalObject* globalObject, const Wasm::Type type, uint64_t bits)
{
    switch (type.kind) {
    case Wasm::TypeKind::Void:
        return jsUndefined();
    case Wasm::TypeKind::I32:
        return jsNumber(static_cast<int32_t>(bits));
    case Wasm::TypeKind::F32:
        return jsNumber(purifyNaN(std::bit_cast<float>(static_cast<int32_t>(bits))));
    case Wasm::TypeKind::F64:
        return jsNumber(purifyNaN(std::bit_cast<double>(bits)));
    case Wasm::TypeKind::I64:
        return JSBigInt::createFrom(globalObject, static_cast<int64_t>(bits));
    case Wasm::TypeKind::Ref:
    case Wasm::TypeKind::RefNull:
    case Wasm::TypeKind::Externref:
    case Wasm::TypeKind::Funcref:
        return std::bit_cast<JSValue>(bits);
    case Wasm::TypeKind::V128:
    default:
        break;
    }
    RELEASE_ASSERT_NOT_REACHED();
    return JSValue();
}

ALWAYS_INLINE uint64_t toWebAssemblyValue(JSGlobalObject* globalObject, const Wasm::Type type, JSValue value)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    switch (type.kind) {
    case Wasm::TypeKind::I32:
        RELEASE_AND_RETURN(scope, value.toInt32(globalObject));
    case Wasm::TypeKind::I64:
        RELEASE_AND_RETURN(scope, std::bit_cast<uint64_t>(value.toBigInt64(globalObject)));
    case Wasm::TypeKind::F32:
        RELEASE_AND_RETURN(scope, std::bit_cast<uint32_t>(value.toFloat(globalObject)));
    case Wasm::TypeKind::F64:
        RELEASE_AND_RETURN(scope, std::bit_cast<uint64_t>(value.toNumber(globalObject)));
    case Wasm::TypeKind::V128:
        RELEASE_ASSERT_NOT_REACHED();
    case Wasm::TypeKind::Ref:
    case Wasm::TypeKind::RefNull:
    case Wasm::TypeKind::Externref:
    case Wasm::TypeKind::Funcref: {
        if (Wasm::isExternref(type)) {
            if (!type.isNullable() && value.isNull())
                return throwVMTypeError(globalObject, scope, "Non-null Externref cannot be null"_s);
        } else if (Wasm::isFuncref(type) || (!Options::useWasmGC() && isRefWithTypeIndex(type))) {
            if (type.isNullable() && value.isNull())
                break;

            auto* wasmFunction = jsDynamicCast<WebAssemblyFunctionBase*>(value);
            if (!wasmFunction)
                return throwVMTypeError(globalObject, scope, "Argument value did not match the reference type"_s);

            if (!isSubtype(wasmFunction->type(), type))
                return throwVMTypeError(globalObject, scope, "Argument value did not match the reference type"_s);
        } else {
            ASSERT(Options::useWasmGC());
            value = Wasm::internalizeExternref(value);
            if (!Wasm::TypeInformation::castReference(value, type.isNullable(), type.index)) {
                // FIXME: provide a better error message here
                // https://bugs.webkit.org/show_bug.cgi?id=247746
                return throwVMTypeError(globalObject, scope, "Argument value did not match the reference type"_s);
            }
        }
        break;
    }
    default:
        RELEASE_ASSERT_NOT_REACHED();
    }
    RELEASE_AND_RETURN(scope, JSValue::encode(value));
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(WEBASSEMBLY)
