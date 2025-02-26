/*
 * Copyright (C) 2016-2020 Apple Inc. All rights reserved.
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

#include "IDLTypes.h"
#include "JSDOMBinding.h"
#include "JSDOMConvertBase.h"
#include "JSDOMConvertBoolean.h"
#include "JSDOMConvertBufferSource.h"
#include "JSDOMConvertInterface.h"
#include "JSDOMConvertNull.h"
#include "JSDOMConvertUndefined.h"
#include <JavaScriptCore/IteratorOperations.h>
#include <JavaScriptCore/JSArrayBufferViewInlines.h>
#include <variant>

namespace WebCore {

namespace Detail {

/// Version of `brigand::front` that lazy evaluation to allow `List` to be invalid when the condition is `false`.
template<typename List, bool condition>
struct ConditionalFront;

template<typename List>
struct ConditionalFront<List, true> {
    using type = brigand::front<List>;
};

template<typename List>
struct ConditionalFront<List, false> {
    using type = void;
};

template<class F, class...Ts> F forEachArgs(F f)
{
    return (void)std::initializer_list<int> {
        (
            (void)f.template operator()<Ts>(),
            0
        )...
    }, f;
}

template<template<class...> class List, typename... Elements, typename Functor>
Functor forEachImpl(List<Elements...>&&, Functor f)
{
    return forEachArgs<Functor, Elements...>(f);
}

}

/// Version of `brigand::for_each` that utilizes template lambdas to avoid the need to pass a dummy parameter.
template<typename List, typename Functor> Functor forEach(Functor f)
{
    return Detail::forEachImpl(List { }, f);
}

template<typename List, bool condition>
using ConditionalFront = typename Detail::ConditionalFront<List, condition>::type;


template<typename... T> struct Converter<IDLUnion<T...>> : DefaultConverter<IDLUnion<T...>> {
    using Type = IDLUnion<T...>;
    using TypeList = typename Type::TypeList;
    using ReturnType = typename Type::ImplementationType;
    using Result = ConversionResult<Type>;

    using NumericTypeList = brigand::filter<TypeList, IsIDLNumber<brigand::_1>>;
    static constexpr size_t numberOfNumericTypes = brigand::size<NumericTypeList>::value;
    static_assert(numberOfNumericTypes == 0 || numberOfNumericTypes == 1, "There can be 0 or 1 numeric types in an IDLUnion.");
    using NumericType = ConditionalFront<NumericTypeList, numberOfNumericTypes != 0>;

    using StringTypeList = brigand::filter<TypeList, IsIDLStringOrEnumeration<brigand::_1>>;
    static constexpr size_t numberOfStringTypes = brigand::size<StringTypeList>::value;
    static_assert(numberOfStringTypes == 0 || numberOfStringTypes == 1, "There can be 0 or 1 string types in an IDLUnion.");
    using StringType = ConditionalFront<StringTypeList, numberOfStringTypes != 0>;

    using SequenceTypeList = brigand::filter<TypeList, IsIDLSequence<brigand::_1>>;
    static constexpr size_t numberOfSequenceTypes = brigand::size<SequenceTypeList>::value;
    static_assert(numberOfSequenceTypes == 0 || numberOfSequenceTypes == 1, "There can be 0 or 1 sequence types in an IDLUnion.");
    using SequenceType = ConditionalFront<SequenceTypeList, numberOfSequenceTypes != 0>;

    using FrozenArrayTypeList = brigand::filter<TypeList, IsIDLFrozenArray<brigand::_1>>;
    static constexpr size_t numberOfFrozenArrayTypes = brigand::size<FrozenArrayTypeList>::value;
    static_assert(numberOfFrozenArrayTypes == 0 || numberOfFrozenArrayTypes == 1, "There can be 0 or 1 FrozenArray types in an IDLUnion.");
    using FrozenArrayType = ConditionalFront<FrozenArrayTypeList, numberOfFrozenArrayTypes != 0>;

    using DictionaryTypeList = brigand::filter<TypeList, IsIDLDictionary<brigand::_1>>;
    static constexpr size_t numberOfDictionaryTypes = brigand::size<DictionaryTypeList>::value;
    static_assert(numberOfDictionaryTypes == 0 || numberOfDictionaryTypes == 1, "There can be 0 or 1 dictionary types in an IDLUnion.");
    static constexpr bool hasDictionaryType = numberOfDictionaryTypes != 0;
    using DictionaryType = ConditionalFront<DictionaryTypeList, hasDictionaryType>;

    using RecordTypeList = brigand::filter<TypeList, IsIDLRecord<brigand::_1>>;
    static constexpr size_t numberOfRecordTypes = brigand::size<RecordTypeList>::value;
    static_assert(numberOfRecordTypes == 0 || numberOfRecordTypes == 1, "There can be 0 or 1 record types in an IDLUnion.");
    static constexpr bool hasRecordType = numberOfRecordTypes != 0;
    using RecordType = ConditionalFront<RecordTypeList, hasRecordType>;

    using ObjectTypeList = brigand::filter<TypeList, std::is_same<IDLObject, brigand::_1>>;
    static constexpr size_t numberOfObjectTypes = brigand::size<ObjectTypeList>::value;
    static_assert(numberOfObjectTypes == 0 || numberOfObjectTypes == 1, "There can be 0 or 1 object types in an IDLUnion.");
    static constexpr bool hasObjectType = numberOfObjectTypes != 0;
    using ObjectType = ConditionalFront<ObjectTypeList, hasObjectType>;

    static constexpr bool hasAnyObjectType = (numberOfSequenceTypes + numberOfFrozenArrayTypes + numberOfDictionaryTypes + numberOfRecordTypes + numberOfObjectTypes) > 0;

    using InterfaceTypeList = brigand::filter<TypeList, IsIDLInterface<brigand::_1>>;
    using TypedArrayTypeList = brigand::filter<TypeList, IsIDLTypedArray<brigand::_1>>;

    using CallbackFunctionTypeList = brigand::filter<TypeList, IsIDLCallbackFunction<brigand::_1>>;
    static constexpr size_t numberOfCallbackFunctionTypes = brigand::size<CallbackFunctionTypeList>::value;
    static_assert(numberOfCallbackFunctionTypes < 2, "There can be 0 or 1 callback function types in an IDLUnion.");
    static constexpr bool hasCallbackFunctionType = numberOfCallbackFunctionTypes > 0;
    using CallbackFunctionType = ConditionalFront<CallbackFunctionTypeList, hasCallbackFunctionType>;

    static Result convert(JSC::JSGlobalObject& lexicalGlobalObject, JSC::JSValue value)
    {
        JSC::VM& vm = JSC::getVM(&lexicalGlobalObject);
        auto scope = DECLARE_THROW_SCOPE(vm);

        // 1. If the union type includes undefined and V is undefined, then return the unique undefined value.
        constexpr bool hasUndefinedType = brigand::any<TypeList, std::is_same<IDLUndefined, brigand::_1>>::value;
        if constexpr (hasUndefinedType) {
            if (value.isUndefined())
                RELEASE_AND_RETURN(scope, (Converter<IDLUndefined>::convert(lexicalGlobalObject, value)));
        }

        // 2. If the union type includes a nullable type and V is null or undefined, then return the IDL value null.
        constexpr bool hasNullType = brigand::any<TypeList, std::is_same<IDLNull, brigand::_1>>::value;
        if constexpr (hasNullType) {
            if (value.isUndefinedOrNull())
                RELEASE_AND_RETURN(scope, (Converter<IDLNull>::convert(lexicalGlobalObject, value)));
        }
        
        // 3. Let types be the flattened member types of the union type.
        // NOTE: Union is expected to be pre-flattened.
        
        // 4. If V is null or undefined then:
        //     1. If types includes a dictionary type, then return the result of converting V to that dictionary type.
        if constexpr (hasDictionaryType) {
            if (value.isUndefinedOrNull()) {
                RELEASE_AND_RETURN(scope, (Converter<DictionaryType>::convert(lexicalGlobalObject, value)));
            }
        }

        // 5. If V is a platform object, then:
        //     1. If types includes an interface type that V implements, then return the IDL value that is a reference to the object V.
        //     2. If types includes object, then return the IDL value that is a reference to the object V.
        //         (FIXME: Add support for object and step 4.2)
        if constexpr (brigand::any<TypeList, IsIDLInterface<brigand::_1>>::value) {
            std::optional<ReturnType> returnValue;
            forEach<InterfaceTypeList>([&]<typename Type>() {
                if (returnValue)
                    return;
                
                using ImplementationType = typename Type::ImplementationType;
                using RawType = typename Type::RawType;

                auto castedValue = JSToWrappedOverloader<RawType>::toWrapped(lexicalGlobalObject, value);
                if (!castedValue)
                    return;
                
                returnValue = ReturnType(ImplementationType(castedValue));
            });

            if (returnValue)
                return WTFMove(*returnValue);
        }

        // 6. If V is an Object, V has an [[ArrayBufferData]] internal slot, and IsSharedArrayBuffer(V) is false, then:
        //     1. If types includes ArrayBuffer, then return the result of converting V to ArrayBuffer.
        //     2. If types includes object, then return the IDL value that is a reference to the object V.
        constexpr bool hasArrayBufferType = brigand::any<TypeList, IsIDLArrayBuffer<brigand::_1>>::value;
        if constexpr (hasArrayBufferType || hasObjectType) {
            auto arrayBuffer = (brigand::any<TypeList, IsIDLArrayBufferAllowShared<brigand::_1>>::value) ? JSC::JSArrayBuffer::toWrappedAllowShared(vm, value) : JSC::JSArrayBuffer::toWrapped(vm, value);
            if (arrayBuffer) {
                if constexpr (hasArrayBufferType)
                    return { WTFMove(arrayBuffer) };
                else if constexpr (hasObjectType)
                    RELEASE_AND_RETURN(scope, (Converter<ObjectType>::convert(lexicalGlobalObject, value)));
            }
        }

        constexpr bool hasArrayBufferViewType = brigand::any<TypeList, IsIDLArrayBufferView<brigand::_1>>::value;
        if constexpr (hasArrayBufferViewType || hasObjectType) {
            auto arrayBufferView = (brigand::any<TypeList, IsIDLArrayBufferViewAllowShared<brigand::_1>>::value) ? JSC::JSArrayBufferView::toWrappedAllowShared(vm, value) : JSC::JSArrayBufferView::toWrapped(vm, value);
            if (arrayBufferView) {
                if constexpr (hasArrayBufferViewType)
                    return { WTFMove(arrayBufferView) };
                else if constexpr (hasObjectType)
                    RELEASE_AND_RETURN(scope, (Converter<ObjectType>::convert(lexicalGlobalObject, value)));
            }
        }

        // FIXME: Add support for step 7.
        //
        // 7. If V is an Object, V, has an [[ArrayBufferData]] internal slot, and IsSharedArrayBuffer(V) is true, then:
        //     1. If types includes SharedArrayBuffer, then return the result of converting V to SharedArrayBuffer..
        //     2. If types includes object, then return the IDL value that is a reference to the object V.

        // 8. If Type(V) is Object and V has a [[DataView]] internal slot, then:
        //     1. If types includes DataView, then return the result of converting V to DataView.
        //     2. If types includes object, then return the IDL value that is a reference to the object V.
        constexpr bool hasDataViewType = brigand::any<TypeList, std::is_same<IDLDataView, brigand::_1>>::value;
        if constexpr (hasDataViewType || hasObjectType) {
            auto dataView = JSC::JSDataView::toWrapped(vm, value);
            if (dataView) {
                if constexpr (hasDataViewType)
                    return { WTFMove(dataView) };
                else if constexpr (hasObjectType)
                    RELEASE_AND_RETURN(scope, (Converter<ObjectType>::convert(lexicalGlobalObject, value)));
            }
        }

        // 9. If Type(V) is Object and V has a [[TypedArrayName]] internal slot, then:
        //     1. If types includes a typed array type whose name is the value of V’s [[TypedArrayName]] internal slot, then return the result of converting V to that type.
        //     2. If types includes object, then return the IDL value that is a reference to the object V.
        //         (FIXME: Add support for step 9.2)
        constexpr bool hasTypedArrayType = brigand::any<TypeList, IsIDLTypedArray<brigand::_1>>::value;
        if constexpr (hasTypedArrayType) {
            std::optional<ReturnType> returnValue;
            forEach<TypedArrayTypeList>([&]<typename Type>() {
                if (returnValue)
                    return;

                using ImplementationType = typename Type::ImplementationType;
                using WrapperType = typename Converter<Type>::WrapperType;

                auto castedValue = (brigand::any<TypeList, IsIDLTypedArrayAllowShared<brigand::_1>>::value) ? WrapperType::toWrappedAllowShared(vm, value) : WrapperType::toWrapped(vm, value);
                if (!castedValue)
                    return;

                returnValue = ReturnType(ImplementationType(castedValue));
            });

            if (returnValue)
                return WTFMove(*returnValue);
        }

        // 10. If IsCallable(V) is true, then:
        //     1. If types includes a callback function type, then return the result of converting V to that callback function type.
        //     2. If types includes object, then return the IDL value that is a reference to the object V.
        //         (FIXME: Add support for step 10.2)
        if (value.isCallable()) {
            if constexpr (hasCallbackFunctionType)
                RELEASE_AND_RETURN(scope, (Converter<CallbackFunctionType>::convert(lexicalGlobalObject, value, *JSC::jsCast<JSDOMGlobalObject*>(&lexicalGlobalObject))));
        }

        // 11. If V is an Object, then:
        if constexpr (hasAnyObjectType) {
            if (value.isCell()) {
                JSC::JSCell* cell = value.asCell();
                if (cell->isObject()) {
                    auto object = asObject(value);
                
                    //     1. If types includes a sequence type, then:
                    //         1. Let method be ? GetMethod(V, %Symbol.iterator%).
                    //         2. If method is not undefined, return the result of creating a sequence of that type from V and method.
                    constexpr bool hasSequenceType = numberOfSequenceTypes != 0;
                    if constexpr (hasSequenceType) {
                        auto method = JSC::iteratorMethod(&lexicalGlobalObject, object);
                        RETURN_IF_EXCEPTION(scope, Result::exception());
                        if (!method.isUndefined())
                            RELEASE_AND_RETURN(scope, (Converter<SequenceType>::convert(lexicalGlobalObject, object, method)));
                    }

                    //     2. If types includes a frozen array type, then:
                    //         1. Let method be ? GetMethod(V, %Symbol.iterator%).
                    //         2. If method is not undefined, return the result of creating a frozen array of that type from V and method.
                    constexpr bool hasFrozenArrayType = numberOfFrozenArrayTypes != 0;
                    if constexpr (hasFrozenArrayType) {
                        auto method = JSC::iteratorMethod(&lexicalGlobalObject, object);
                        RETURN_IF_EXCEPTION(scope, ReturnType());
                        if (!method.isUndefined())
                            RELEASE_AND_RETURN(scope, (Converter<FrozenArrayType>::convert(lexicalGlobalObject, object, method)));
                    }

                    //     3. If types includes a dictionary type, then return the result of
                    //        converting V to that dictionary type.
                    if constexpr (hasDictionaryType)
                        RELEASE_AND_RETURN(scope, (Converter<DictionaryType>::convert(lexicalGlobalObject, value)));

                    //     4. If types includes a record type, then return the result of converting V to that record type.
                    if constexpr (hasRecordType)
                        RELEASE_AND_RETURN(scope, (Converter<RecordType>::convert(lexicalGlobalObject, value)));

                    //     5. If types includes a callback interface type, then return the result of converting V to that interface type.
                    //         (FIXME: Add support for callback interface type and step 12.5)

                    //     6. If types includes object, then return the IDL value that is a reference to the object V.
                    if constexpr (hasObjectType)
                        RELEASE_AND_RETURN(scope, (Converter<ObjectType>::convert(lexicalGlobalObject, value)));
                }
            }
        }

        // 12. If V is a Boolean value, then:
        //     1. If types includes a boolean, then return the result of converting V to boolean.
        constexpr bool hasBooleanType = brigand::any<TypeList, std::is_same<IDLBoolean, brigand::_1>>::value;
        if constexpr (hasBooleanType) {
            if (value.isBoolean())
                RELEASE_AND_RETURN(scope, (Converter<IDLBoolean>::convert(lexicalGlobalObject, value)));
        }
        
        // 13. If V is a Number value, then:
        //     1. If types includes a numeric type, then return the result of converting V to that numeric type.
        constexpr bool hasNumericType = brigand::size<NumericTypeList>::value != 0;
        if constexpr (hasNumericType) {
            if (value.isNumber())
                RELEASE_AND_RETURN(scope, (Converter<NumericType>::convert(lexicalGlobalObject, value)));
        }

        // FIXME: Add support for step 14.
        //
        // 14. If V is a BigInt, then:
        //     1. If types includes bigint, then return the result of converting V to bigint.

        // 15. If types includes a string type, then return the result of converting V to that type.
        constexpr bool hasStringType = brigand::size<StringTypeList>::value != 0;
        if constexpr (hasStringType)
            RELEASE_AND_RETURN(scope, (Converter<StringType>::convert(lexicalGlobalObject, value)));

        // FIXME: Add support for step 16.
        //
        // 16. If types includes a numeric type and bigint, then return the result of converting V to either that numeric type or bigint.

        // 17. If types includes a numeric type, then return the result of converting V to that numeric type.
        if constexpr (hasNumericType)
            RELEASE_AND_RETURN(scope, (Converter<NumericType>::convert(lexicalGlobalObject, value)));

        // 18. If types includes a boolean, then return the result of converting V to boolean.
        if constexpr (hasBooleanType)
            RELEASE_AND_RETURN(scope, (Converter<IDLBoolean>::convert(lexicalGlobalObject, value)));

        // FIXME: Add support for step 19.
        //
        // 19. If types includes bigint, then return the result of converting V to bigint.

        // 20. Throw a TypeError.
        throwTypeError(&lexicalGlobalObject, scope);
        return Result::exception();
    }
};

template<typename... T> struct JSConverter<IDLUnion<T...>> {
    using Type = IDLUnion<T...>;
    using TypeList = typename Type::TypeList;
    using ImplementationType = typename Type::ImplementationType;

    static constexpr bool needsState = true;
    static constexpr bool needsGlobalObject = true;

    using Sequence = brigand::make_sequence<brigand::ptrdiff_t<0>, std::variant_size<ImplementationType>::value>;

    static JSC::JSValue convert(JSC::JSGlobalObject& lexicalGlobalObject, JSDOMGlobalObject& globalObject, const ImplementationType& variant)
    {
        auto index = variant.index();

        std::optional<JSC::JSValue> returnValue;
        forEach<Sequence>([&]<typename I>() {
            if (I::value == index) {
                ASSERT(!returnValue);
                returnValue = toJS<brigand::at<TypeList, I>>(lexicalGlobalObject, globalObject, std::get<I::value>(variant));
            }
        });

        ASSERT(returnValue);
        return returnValue.value();
    }
};

// BufferSource specialization. In WebKit, BufferSource is defined as IDLUnion<IDLArrayBufferView, IDLArrayBuffer> as a hack, and it is not compatible to
// annotation described in WebIDL.
template<> struct Converter<IDLAllowSharedAdaptor<IDLUnion<IDLArrayBufferView, IDLArrayBuffer>>> : DefaultConverter<IDLUnion<IDLArrayBufferView, IDLArrayBuffer>> {
    static decltype(auto) convert(JSC::JSGlobalObject& lexicalGlobalObject, JSC::JSValue value)
    {
        return WebCore::convert<IDLUnion<IDLAllowSharedAdaptor<IDLArrayBufferView>, IDLAllowSharedAdaptor<IDLArrayBuffer>>>(lexicalGlobalObject, value);
    }
};

template<>
struct JSConverter<IDLAllowSharedAdaptor<IDLUnion<IDLArrayBufferView, IDLArrayBuffer>>> {
    static constexpr bool needsState = true;
    static constexpr bool needsGlobalObject = true;

    template<typename U>
    static JSC::JSValue convert(JSC::JSGlobalObject& lexicalGlobalObject, JSDOMGlobalObject& globalObject, const U& value)
    {
        return toJS<IDLUnion<IDLArrayBufferView, IDLArrayBuffer>>(lexicalGlobalObject, globalObject, value);
    }
};


template<> struct Converter<IDLBufferSource> : DefaultConverter<IDLBufferSource> {
    using Result = ConversionResult<IDLBufferSource>;

    static Result convert(JSC::JSGlobalObject& globalObject, JSC::JSValue value)
    {
        return WebCore::convert<IDLUnion<IDLAllowSharedAdaptor<IDLArrayBufferView>, IDLAllowSharedAdaptor<IDLArrayBuffer>>>(globalObject, value);
    }
};

} // namespace WebCore
