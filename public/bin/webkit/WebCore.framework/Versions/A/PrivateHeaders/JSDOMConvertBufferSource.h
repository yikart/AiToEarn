/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "BufferSource.h"
#include "IDLTypes.h"
#include "JSDOMConvertBase.h"
#include "JSDOMWrapperCache.h"
#include <JavaScriptCore/JSCInlines.h>
#include <JavaScriptCore/JSGenericTypedArrayViewInlines.h>
#include <JavaScriptCore/JSTypedArrays.h>

namespace WebCore {

struct IDLInt8Array : IDLTypedArray<JSC::Int8Array> { };
struct IDLInt16Array : IDLTypedArray<JSC::Int16Array> { };
struct IDLInt32Array : IDLTypedArray<JSC::Int32Array> { };
struct IDLUint8Array : IDLTypedArray<JSC::Uint8Array> { };
struct IDLUint16Array : IDLTypedArray<JSC::Uint16Array> { };
struct IDLUint32Array : IDLTypedArray<JSC::Uint32Array> { };
struct IDLUint8ClampedArray : IDLTypedArray<JSC::Uint8ClampedArray> { };
struct IDLFloat16Array : IDLTypedArray<JSC::Float16Array> { };
struct IDLFloat32Array : IDLTypedArray<JSC::Float32Array> { };
struct IDLFloat64Array : IDLTypedArray<JSC::Float64Array> { };
struct IDLBigInt64Array : IDLTypedArray<JSC::BigInt64Array> { };
struct IDLBigUint64Array : IDLTypedArray<JSC::BigUint64Array> { };

inline RefPtr<JSC::Int8Array> toPossiblySharedInt8Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Int8Adaptor>(vm, value); }
inline RefPtr<JSC::Int16Array> toPossiblySharedInt16Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Int16Adaptor>(vm, value); }
inline RefPtr<JSC::Int32Array> toPossiblySharedInt32Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Int32Adaptor>(vm, value); }
inline RefPtr<JSC::Uint8Array> toPossiblySharedUint8Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Uint8Adaptor>(vm, value); }
inline RefPtr<JSC::Uint8ClampedArray> toPossiblySharedUint8ClampedArray(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Uint8ClampedAdaptor>(vm, value); }
inline RefPtr<JSC::Uint16Array> toPossiblySharedUint16Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Uint16Adaptor>(vm, value); }
inline RefPtr<JSC::Uint32Array> toPossiblySharedUint32Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Uint32Adaptor>(vm, value); }
inline RefPtr<JSC::Float16Array> toPossiblySharedFloat16Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Float16Adaptor>(vm, value); }
inline RefPtr<JSC::Float32Array> toPossiblySharedFloat32Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Float32Adaptor>(vm, value); }
inline RefPtr<JSC::Float64Array> toPossiblySharedFloat64Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::Float64Adaptor>(vm, value); }
inline RefPtr<JSC::BigInt64Array> toPossiblySharedBigInt64Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::BigInt64Adaptor>(vm, value); }
inline RefPtr<JSC::BigUint64Array> toPossiblySharedBigUint64Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toPossiblySharedNativeTypedView<JSC::BigUint64Adaptor>(vm, value); }

inline RefPtr<JSC::Int8Array> toUnsharedInt8Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Int8Adaptor>(vm, value); }
inline RefPtr<JSC::Int16Array> toUnsharedInt16Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Int16Adaptor>(vm, value); }
inline RefPtr<JSC::Int32Array> toUnsharedInt32Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Int32Adaptor>(vm, value); }
inline RefPtr<JSC::Uint8Array> toUnsharedUint8Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Uint8Adaptor>(vm, value); }
inline RefPtr<JSC::Uint8ClampedArray> toUnsharedUint8ClampedArray(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Uint8ClampedAdaptor>(vm, value); }
inline RefPtr<JSC::Uint16Array> toUnsharedUint16Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Uint16Adaptor>(vm, value); }
inline RefPtr<JSC::Uint32Array> toUnsharedUint32Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Uint32Adaptor>(vm, value); }
inline RefPtr<JSC::Float16Array> toUnsharedFloat16Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Float16Adaptor>(vm, value); }
inline RefPtr<JSC::Float32Array> toUnsharedFloat32Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Float32Adaptor>(vm, value); }
inline RefPtr<JSC::Float64Array> toUnsharedFloat64Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::Float64Adaptor>(vm, value); }
inline RefPtr<JSC::BigInt64Array> toUnsharedBigInt64Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::BigInt64Adaptor>(vm, value); }
inline RefPtr<JSC::BigUint64Array> toUnsharedBigUint64Array(JSC::VM& vm, JSC::JSValue value) { return JSC::toUnsharedNativeTypedView<JSC::BigUint64Adaptor>(vm, value); }

inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSDOMGlobalObject* globalObject, JSC::ArrayBuffer& buffer)
{
    if (auto result = getCachedWrapper(globalObject->world(), buffer))
        return result;

    // The JSArrayBuffer::create function will register the wrapper in finishCreation.
    return JSC::JSArrayBuffer::create(JSC::getVM(lexicalGlobalObject), globalObject->arrayBufferStructure(buffer.sharingMode()), &buffer);
}

inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSC::JSGlobalObject* globalObject, JSC::ArrayBufferView& view)
{
    return view.wrap(lexicalGlobalObject, globalObject);
}

template<> struct JSConverter<IDLBufferSource> {
    static constexpr bool needsState = true;
    static constexpr bool needsGlobalObject = false;

    static JSC::JSValue convert(JSC::JSGlobalObject& lexicalGlobalObject, const BufferSource& bufferSource)
    {
        auto* jsDOMGlobalObject = JSC::jsCast<JSDOMGlobalObject*>(&lexicalGlobalObject);

        JSC::JSValue jsValue;
        WTF::switchOn(bufferSource.variant(), [&](RefPtr<JSC::ArrayBufferView> view) {
            jsValue = toJS(&lexicalGlobalObject, &lexicalGlobalObject, *view);
        }, [&](RefPtr<JSC::ArrayBuffer> arrayBuffer) {
            jsValue = toJS(&lexicalGlobalObject, jsDOMGlobalObject, *arrayBuffer);
        });
        return jsValue;
    }
    static JSC::JSValue convert(JSC::JSGlobalObject& lexicalGlobalObject, const std::optional<BufferSource>& bufferSource)
    {
        auto* jsDOMGlobalObject = JSC::jsCast<JSDOMGlobalObject*>(&lexicalGlobalObject);

        JSC::JSValue jsValue;
        if (bufferSource) {
            WTF::switchOn(bufferSource->variant(), [&](RefPtr<JSC::ArrayBufferView> view) {
                jsValue = toJS(&lexicalGlobalObject, &lexicalGlobalObject, *view);
            }, [&](RefPtr<JSC::ArrayBuffer> arrayBuffer) {
                jsValue = toJS(&lexicalGlobalObject, jsDOMGlobalObject, *arrayBuffer);
            });
        }
        return jsValue;
    }
};

inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSDOMGlobalObject* globalObject, JSC::ArrayBuffer* buffer)
{
    if (!buffer)
        return JSC::jsNull();
    return toJS(lexicalGlobalObject, globalObject, *buffer);
}

inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSDOMGlobalObject* globalObject, BufferSource* bufferSource)
{
    JSC::JSValue jsValue;
    WTF::switchOn(bufferSource->variant(), [&](RefPtr<JSC::ArrayBufferView> view) {
        jsValue = toJS(lexicalGlobalObject, globalObject, *view);
    }, [&](RefPtr<JSC::ArrayBuffer> arrayBuffer) {
        jsValue = toJS(lexicalGlobalObject, globalObject, *arrayBuffer);
    });
    return jsValue;
}

inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSDOMGlobalObject* globalObject, const std::optional<BufferSource> bufferSource)
{
    if (!bufferSource)
        return JSC::jsNull();

    return toJS(lexicalGlobalObject, globalObject, *bufferSource);
}

inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSC::JSGlobalObject* globalObject, JSC::ArrayBufferView* view)
{
    if (!view)
        return JSC::jsNull();
    return toJS(lexicalGlobalObject, globalObject, *view);
}

inline RefPtr<JSC::ArrayBufferView> toPossiblySharedArrayBufferView(JSC::VM&, JSC::JSValue value)
{
    auto* wrapper = JSC::jsDynamicCast<JSC::JSArrayBufferView*>(value);
    if (!wrapper)
        return nullptr;
    return wrapper->possiblySharedImpl();
}

inline RefPtr<JSC::ArrayBufferView> toUnsharedArrayBufferView(JSC::VM& vm, JSC::JSValue value)
{
    auto result = toPossiblySharedArrayBufferView(vm, value);
    if (!result || result->isShared())
        return nullptr;
    return result;
}

namespace Detail {

enum class BufferSourceConverterAllowSharedMode { Allow, Disallow };

template<typename BufferSourceType, BufferSourceConverterAllowSharedMode mode>
struct BufferSourceConverter {
    using WrapperType = typename Converter<BufferSourceType>::WrapperType;
    using Result = ConversionResult<BufferSourceType>;

    template<typename ExceptionThrower = DefaultExceptionThrower>
    static Result convert(JSC::JSGlobalObject& lexicalGlobalObject, JSC::JSValue value, ExceptionThrower&& exceptionThrower = ExceptionThrower())
    {
        auto& vm = JSC::getVM(&lexicalGlobalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);
        if constexpr (mode == BufferSourceConverterAllowSharedMode::Allow) {
            RefPtr object = WrapperType::toWrappedAllowShared(vm, value);
            if (UNLIKELY(!object)) {
                exceptionThrower(lexicalGlobalObject, scope);
                return Result::exception();
            }
            return Result { object.releaseNonNull() };
        } else {
            RefPtr object = WrapperType::toWrapped(vm, value);
            if (UNLIKELY(!object)) {
                exceptionThrower(lexicalGlobalObject, scope);
                return Result::exception();
            }
            return Result { object.releaseNonNull() };
        }

    }
};

template<typename IDL, typename Wrapper>
struct TypedArrayConverter : DefaultConverter<IDL> {
    using WrapperType = Wrapper;

    template<typename ExceptionThrower = DefaultExceptionThrower>
    static ConversionResult<IDL> convert(JSC::JSGlobalObject& lexicalGlobalObject, JSC::JSValue value, ExceptionThrower&& exceptionThrower = ExceptionThrower())
    {
        return Detail::BufferSourceConverter<IDL, Detail::BufferSourceConverterAllowSharedMode::Disallow>::convert(lexicalGlobalObject, value, std::forward<ExceptionThrower>(exceptionThrower));
    }
};

template<typename IDL>
struct JSTypedArrayConverter {
    static constexpr bool needsState = true;
    static constexpr bool needsGlobalObject = true;

    template <typename U>
    static JSC::JSValue convert(JSC::JSGlobalObject& lexicalGlobalObject, JSDOMGlobalObject& globalObject, const U& value)
    {
        return toJS(&lexicalGlobalObject, &globalObject, Detail::getPtrOrRef(value));
    }

    template<typename U>
    static JSC::JSValue convertNewlyCreated(JSC::JSGlobalObject& lexicalGlobalObject, JSDOMGlobalObject& globalObject, U&& value)
    {
        return convert(lexicalGlobalObject, globalObject, std::forward<U>(value));
    }
};

}

template<> struct Converter<IDLArrayBuffer> : Detail::TypedArrayConverter<IDLArrayBuffer, JSC::JSArrayBuffer> { };
template<> struct Converter<IDLDataView> : Detail::TypedArrayConverter<IDLDataView, JSC::JSDataView> { };
template<> struct Converter<IDLInt8Array> : Detail::TypedArrayConverter<IDLInt8Array, JSC::JSInt8Array> { };
template<> struct Converter<IDLInt16Array> : Detail::TypedArrayConverter<IDLInt16Array, JSC::JSInt16Array> { };
template<> struct Converter<IDLInt32Array> : Detail::TypedArrayConverter<IDLInt32Array, JSC::JSInt32Array> { };
template<> struct Converter<IDLUint8Array> : Detail::TypedArrayConverter<IDLUint8Array, JSC::JSUint8Array> { };
template<> struct Converter<IDLUint16Array> : Detail::TypedArrayConverter<IDLUint16Array, JSC::JSUint16Array> { };
template<> struct Converter<IDLUint32Array> : Detail::TypedArrayConverter<IDLUint32Array, JSC::JSUint32Array> { };
template<> struct Converter<IDLUint8ClampedArray> : Detail::TypedArrayConverter<IDLUint8ClampedArray, JSC::JSUint8ClampedArray> { };
template<> struct Converter<IDLFloat16Array> : Detail::TypedArrayConverter<IDLFloat16Array, JSC::JSFloat16Array> { };
template<> struct Converter<IDLFloat32Array> : Detail::TypedArrayConverter<IDLFloat32Array, JSC::JSFloat32Array> { };
template<> struct Converter<IDLFloat64Array> : Detail::TypedArrayConverter<IDLFloat64Array, JSC::JSFloat64Array> { };
template<> struct Converter<IDLBigInt64Array> : Detail::TypedArrayConverter<IDLBigInt64Array, JSC::JSBigInt64Array> { };
template<> struct Converter<IDLBigUint64Array> : Detail::TypedArrayConverter<IDLBigUint64Array, JSC::JSBigUint64Array> { };
template<> struct Converter<IDLArrayBufferView> : Detail::TypedArrayConverter<IDLArrayBufferView, JSC::JSArrayBufferView> { };

template<> struct JSConverter<IDLArrayBuffer> : Detail::JSTypedArrayConverter<IDLArrayBuffer> { };
template<> struct JSConverter<IDLDataView> : Detail::JSTypedArrayConverter<IDLDataView> { };
template<> struct JSConverter<IDLInt8Array> : Detail::JSTypedArrayConverter<IDLInt8Array> { };
template<> struct JSConverter<IDLInt16Array> : Detail::JSTypedArrayConverter<IDLInt16Array> { };
template<> struct JSConverter<IDLInt32Array> : Detail::JSTypedArrayConverter<IDLInt32Array> { };
template<> struct JSConverter<IDLUint8Array> : Detail::JSTypedArrayConverter<IDLInt8Array> { };
template<> struct JSConverter<IDLUint16Array> : Detail::JSTypedArrayConverter<IDLUint16Array> { };
template<> struct JSConverter<IDLUint32Array> : Detail::JSTypedArrayConverter<IDLUint32Array> { };
template<> struct JSConverter<IDLUint8ClampedArray> : Detail::JSTypedArrayConverter<IDLUint8ClampedArray> { };
template<> struct JSConverter<IDLFloat16Array> : Detail::JSTypedArrayConverter<IDLFloat16Array> { };
template<> struct JSConverter<IDLFloat32Array> : Detail::JSTypedArrayConverter<IDLFloat32Array> { };
template<> struct JSConverter<IDLFloat64Array> : Detail::JSTypedArrayConverter<IDLFloat64Array> { };
template<> struct JSConverter<IDLBigInt64Array> : Detail::JSTypedArrayConverter<IDLBigInt64Array> { };
template<> struct JSConverter<IDLBigUint64Array> : Detail::JSTypedArrayConverter<IDLBigUint64Array> { };
template<> struct JSConverter<IDLArrayBufferView> : Detail::JSTypedArrayConverter<IDLArrayBufferView> { };

template<typename IDL>
struct Converter<IDLAllowSharedAdaptor<IDL>> : DefaultConverter<IDL> {
    using ConverterType = Converter<IDL>;
    using WrapperType = typename ConverterType::WrapperType;
    using ReturnType = typename ConverterType::ReturnType;

    template<typename ExceptionThrower = DefaultExceptionThrower>
    static ConversionResult<IDL> convert(JSC::JSGlobalObject& lexicalGlobalObject, JSC::JSValue value, ExceptionThrower&& exceptionThrower = ExceptionThrower())
    {
        return Detail::BufferSourceConverter<IDL, Detail::BufferSourceConverterAllowSharedMode::Allow>::convert(lexicalGlobalObject, value, std::forward<ExceptionThrower>(exceptionThrower));
    }
};

} // namespace WebCore
