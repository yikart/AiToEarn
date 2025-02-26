/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#include "Error.h"
#include "ExceptionHelpers.h"
#include "GenericTypedArrayViewInlines.h"
#include "JSArrayBuffer.h"
#include "JSArrayBufferViewInlines.h"
#include "JSCellInlines.h"
#include "JSGenericTypedArrayView.h"
#include "TypeError.h"
#include "TypedArrays.h"
#include <wtf/CheckedArithmetic.h>
#include <wtf/text/MakeString.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

template<typename Adaptor>
JSGenericTypedArrayView<Adaptor>::JSGenericTypedArrayView(
    VM& vm, ConstructionContext& context)
    : Base(vm, context)
{
}

template<typename Adaptor>
JSGenericTypedArrayView<Adaptor>* JSGenericTypedArrayView<Adaptor>::create(
    JSGlobalObject* globalObject, Structure* structure, size_t length)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    ConstructionContext context(vm, structure, length, sizeof(typename Adaptor::Type));
    if (!context) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }
    JSGenericTypedArrayView* result =
        new (NotNull, allocateCell<JSGenericTypedArrayView>(vm))
        JSGenericTypedArrayView(vm, context);
    result->finishCreation(vm);
    return result;
}

template<typename Adaptor>
JSGenericTypedArrayView<Adaptor>* JSGenericTypedArrayView<Adaptor>::createWithFastVector(
    JSGlobalObject* globalObject, Structure* structure, size_t length, void* vector)
{
    VM& vm = globalObject->vm();
    ConstructionContext context(structure, length, vector);
    RELEASE_ASSERT(context);
    JSGenericTypedArrayView* result =
        new (NotNull, allocateCell<JSGenericTypedArrayView>(vm))
        JSGenericTypedArrayView(vm, context);
    result->finishCreation(vm);
    return result;
}

template<typename Adaptor>
JSGenericTypedArrayView<Adaptor>* JSGenericTypedArrayView<Adaptor>::createUninitialized(JSGlobalObject* globalObject, Structure* structure, size_t length)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    ConstructionContext context(
        vm, structure, length, sizeof(typename Adaptor::Type),
        ConstructionContext::DontInitialize);
    if (!context) {
        throwOutOfMemoryError(globalObject, scope);
        return nullptr;
    }
    JSGenericTypedArrayView* result =
        new (NotNull, allocateCell<JSGenericTypedArrayView>(vm))
        JSGenericTypedArrayView(vm, context);
    result->finishCreation(vm);
    return result;
}

template<typename Adaptor>
JSGenericTypedArrayView<Adaptor>* JSGenericTypedArrayView<Adaptor>::create(JSGlobalObject* globalObject, Structure* structure, RefPtr<ArrayBuffer>&& buffer, size_t byteOffset, std::optional<size_t> length)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    size_t elementSize = sizeof(typename Adaptor::Type);
    ASSERT(buffer);
    if (buffer->isDetached()) {
        throwTypeError(globalObject, scope, typedArrayBufferHasBeenDetachedErrorMessage);
        return nullptr;
    }

    ASSERT(length || buffer->isResizableOrGrowableShared());

    if (!ArrayBufferView::verifySubRangeLength(buffer->byteLength(), byteOffset, length.value_or(0), elementSize)) {
        throwException(globalObject, scope, createRangeError(globalObject, "Length out of range of buffer"_s));
        return nullptr;
    }

    if (!ArrayBufferView::verifyByteOffsetAlignment(byteOffset, elementSize)) {
        throwException(globalObject, scope, createRangeError(globalObject, "Byte offset is not aligned"_s));
        return nullptr;
    }

    ConstructionContext context(vm, structure, WTFMove(buffer), byteOffset, length);
    ASSERT(context);
    JSGenericTypedArrayView* result =
        new (NotNull, allocateCell<JSGenericTypedArrayView>(vm))
        JSGenericTypedArrayView(vm, context);
    result->finishCreation(vm);
    return result;
}

template<typename Adaptor>
JSGenericTypedArrayView<Adaptor>* JSGenericTypedArrayView<Adaptor>::create(VM& vm, Structure* structure, RefPtr<typename Adaptor::ViewType>&& impl)
{
    ConstructionContext context(vm, structure, impl->possiblySharedBuffer(), impl->byteOffsetRaw(), impl->isAutoLength() ? std::nullopt : std::optional { impl->lengthRaw() });
    ASSERT(context);
    JSGenericTypedArrayView* result =
        new (NotNull, allocateCell<JSGenericTypedArrayView>(vm))
        JSGenericTypedArrayView(vm, context);
    result->finishCreation(vm);
    return result;
}

template<typename Adaptor>
JSGenericTypedArrayView<Adaptor>* JSGenericTypedArrayView<Adaptor>::create(Structure* structure, JSGlobalObject* globalObject, RefPtr<typename Adaptor::ViewType>&& impl)
{
    return create(globalObject->vm(), structure, WTFMove(impl));
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::validateRange(
    JSGlobalObject* globalObject, size_t offset, size_t length)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    if (canAccessRangeQuickly(offset, length))
        return true;
    
    throwException(globalObject, scope, createRangeError(globalObject, "Range consisting of offset and length are out of bounds"_s));
    return false;
}

template<typename Adaptor>
template<typename OtherAdaptor>
bool JSGenericTypedArrayView<Adaptor>::setWithSpecificType(
    JSGlobalObject* globalObject, size_t offset, JSGenericTypedArrayView<OtherAdaptor>* other,
    size_t otherOffset, size_t length, CopyType type)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    // Handle the hilarious case: the act of getting the length could have resulted
    // in detaching. Well, no. That'll never happen because there cannot be
    // side-effects on getting the length of a typed array. But predicting where there
    // are, or aren't, side-effects is a fool's game so we resort to this cheap
    // check. Worst case, if we're wrong, people start seeing less things get copied
    // but we won't have a security vulnerability.
    length = std::min(length, other->length());

    RELEASE_ASSERT(other->canAccessRangeQuickly(otherOffset, length));
    bool success = validateRange(globalObject, offset, length);
    EXCEPTION_ASSERT_UNUSED(scope, !scope.exception() == success);
    if (!success)
        return false;

    if constexpr (Adaptor::contentType != OtherAdaptor::contentType) {
        throwTypeError(globalObject, scope, "Content types of source and destination typed arrays are different"_s);
        return false;
    }
    
    // This method doesn't support copying between the same array. Note that
    // set() will only call this if the types differ, which implicitly guarantees
    // that we can't be the same array. This is relevant because the way we detect
    // non-overlapping is by checking if either (a) either array doesn't have a
    // backing buffer or (b) the backing buffers are different, but that doesn't
    // catch the case where it's the *same* array - fortunately though, this code
    // path never needs to worry about that case.
    ASSERT(static_cast<JSCell*>(this) != static_cast<JSCell*>(other));
    
    // 1) If the two arrays are non-overlapping, we can copy in any order we like
    //    and we don't need an intermediate buffer. Arrays are definitely
    //    non-overlapping if either one of them has no backing buffer (that means
    //    that it *owns* its philosophical backing buffer) or if they have
    //    different backing buffers.
    // 2) If the two arrays overlap but have the same element size, we can do a
    //    memmove-like copy where we flip-flop direction based on which vector
    //    starts before the other:
    //    A) If the destination vector is before the source vector, then a forward
    //       copy is in order.
    //    B) If the destination vector is after the source vector, then a backward
    //       copy is in order.
    // 3) If we have different element sizes and there is a chance of overlap then
    //    we need an intermediate vector.
    
    // NB. Comparisons involving elementSize will be constant-folded by template
    // specialization.

    unsigned otherElementSize = sizeof(typename OtherAdaptor::Type);

    // Handle cases (1) and (2A).
    if (!hasArrayBuffer() || !other->hasArrayBuffer()
        || existingBuffer() != other->existingBuffer()
        || (elementSize == otherElementSize && (static_cast<void*>(typedVector() + offset) <= static_cast<void*>(other->typedVector() + otherOffset)))
        || type == CopyType::LeftToRight) {
        for (size_t i = 0; i < length; ++i) {
            setIndexQuicklyToNativeValue(
                offset + i, OtherAdaptor::template convertTo<Adaptor>(
                    other->getIndexQuicklyAsNativeValue(i + otherOffset)));
        }
        return true;
    }

    // Now we either have (2B) or (3) - so first we try to cover (2B).
    if (elementSize == otherElementSize) {
        for (size_t i = length; i--;) {
            setIndexQuicklyToNativeValue(
                offset + i, OtherAdaptor::template convertTo<Adaptor>(
                    other->getIndexQuicklyAsNativeValue(i + otherOffset)));
        }
        return true;
    }
    
    // Fail: we need an intermediate transfer buffer (i.e. case (3)).
    auto transfer = [&] (auto& buffer) {
        for (size_t i = length; i--;) {
            buffer[i] = OtherAdaptor::template convertTo<Adaptor>(
                other->getIndexQuicklyAsNativeValue(i + otherOffset));
        }
        for (size_t i = length; i--;)
            setIndexQuicklyToNativeValue(offset + i, buffer[i]);
    };

    if (WTF::isValidCapacityForVector<typename Adaptor::Type>(length)) {
        Vector<typename Adaptor::Type, 32> buffer(length);
        transfer(buffer);
    } else {
        Checked<size_t> sizeToAllocate = length;
        sizeToAllocate *= sizeof(typename Adaptor::Type);
        UniqueArray<typename Adaptor::Type> buffer = makeUniqueArray<typename Adaptor::Type>(sizeToAllocate);
        transfer(buffer);
    }

    return true;
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::setFromTypedArray(JSGlobalObject* globalObject, size_t offset, JSArrayBufferView* object, size_t objectOffset, size_t length, CopyType type)
{
    // https://tc39.es/proposal-resizablearraybuffer/#sec-settypedarrayfromtypedarray

    ASSERT(isTypedView(object->type()));

    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto memmoveFastPath = [&] (JSArrayBufferView* other) {
        // The super fast case: we can just memmove since we're the same underlying storage type.
        length = std::min(length, other->length());

        bool success = validateRange(globalObject, offset, length);
        EXCEPTION_ASSERT(!scope.exception() == success);
        if (!success)
            return false;

        RELEASE_ASSERT(JSC::elementSize(Adaptor::typeValue) == JSC::elementSize(other->type()));
        memmove(typedVector() + offset, std::bit_cast<typename Adaptor::Type*>(other->vector()) + objectOffset, length * elementSize);
        return true;
    };

    TypedArrayType typedArrayType = JSC::typedArrayType(object->type());
    if (typedArrayType == Adaptor::typeValue)
        return memmoveFastPath(jsCast<JSArrayBufferView*>(object));

    if (isSomeUint8(typedArrayType) && isSomeUint8(Adaptor::typeValue))
        return memmoveFastPath(jsCast<JSArrayBufferView*>(object));

    if (isInt(Adaptor::typeValue) && isInt(typedArrayType) && !isClamped(Adaptor::typeValue) && JSC::elementSize(Adaptor::typeValue) == JSC::elementSize(typedArrayType))
        return memmoveFastPath(jsCast<JSArrayBufferView*>(object));

    switch (typedArrayType) {
    case TypeInt8:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Int8Adaptor>(
            globalObject, offset, jsCast<JSInt8Array*>(object), objectOffset, length, type));
    case TypeInt16:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Int16Adaptor>(
            globalObject, offset, jsCast<JSInt16Array*>(object), objectOffset, length, type));
    case TypeInt32:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Int32Adaptor>(
            globalObject, offset, jsCast<JSInt32Array*>(object), objectOffset, length, type));
    case TypeUint8:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Uint8Adaptor>(
            globalObject, offset, jsCast<JSUint8Array*>(object), objectOffset, length, type));
    case TypeUint8Clamped:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Uint8ClampedAdaptor>(
            globalObject, offset, jsCast<JSUint8ClampedArray*>(object), objectOffset, length, type));
    case TypeUint16:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Uint16Adaptor>(
            globalObject, offset, jsCast<JSUint16Array*>(object), objectOffset, length, type));
    case TypeUint32:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Uint32Adaptor>(
            globalObject, offset, jsCast<JSUint32Array*>(object), objectOffset, length, type));
    case TypeFloat16:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Float16Adaptor>(
            globalObject, offset, jsCast<JSFloat16Array*>(object), objectOffset, length, type));
    case TypeFloat32:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Float32Adaptor>(
            globalObject, offset, jsCast<JSFloat32Array*>(object), objectOffset, length, type));
    case TypeFloat64:
        RELEASE_AND_RETURN(scope, setWithSpecificType<Float64Adaptor>(
            globalObject, offset, jsCast<JSFloat64Array*>(object), objectOffset, length, type));
    case TypeBigInt64:
        RELEASE_AND_RETURN(scope, setWithSpecificType<BigInt64Adaptor>(
            globalObject, offset, jsCast<JSBigInt64Array*>(object), objectOffset, length, type));
    case TypeBigUint64:
        RELEASE_AND_RETURN(scope, setWithSpecificType<BigUint64Adaptor>(
            globalObject, offset, jsCast<JSBigUint64Array*>(object), objectOffset, length, type));
    case NotTypedArray:
    case TypeDataView: {
        RELEASE_ASSERT_NOT_REACHED();
        return true;
    } }

    RELEASE_ASSERT_NOT_REACHED();
    return false;
}

template<typename Adaptor>
void JSGenericTypedArrayView<Adaptor>::copyFromInt32ShapeArray(size_t offset, JSArray* array, size_t objectOffset, size_t length)
{
    ASSERT(canAccessRangeQuickly(offset, length));
    ASSERT((array->indexingType() & IndexingShapeMask) == Int32Shape);
    ASSERT(Adaptor::typeValue != TypeBigInt64 && Adaptor::typeValue != TypeBigUint64);
    ASSERT((length + objectOffset) <= array->length());
    ASSERT(array->isIteratorProtocolFastAndNonObservable());

    // If the destination is uint32_t or int32_t, we can use copyElements.
    // 1. int32_t -> uint32_t conversion does not change any bit representation. So we can simply copy them.
    // 2. Hole is represented as JSEmpty in Int32Shape, which lower 32bits is zero. And we expect 0 for undefined, thus this copying simply works.
    if constexpr (Adaptor::typeValue == TypeUint8 || Adaptor::typeValue == TypeInt8) {
        WTF::copyElements(std::bit_cast<uint8_t*>(typedVector() + offset), std::bit_cast<const uint64_t*>(array->butterfly()->contiguous().data() + objectOffset), length);
        return;
    }
    if constexpr (Adaptor::typeValue == TypeUint16 || Adaptor::typeValue == TypeInt16) {
        WTF::copyElements(std::bit_cast<uint16_t*>(typedVector() + offset), std::bit_cast<const uint64_t*>(array->butterfly()->contiguous().data() + objectOffset), length);
        return;
    }
    if constexpr (Adaptor::typeValue == TypeUint32 || Adaptor::typeValue == TypeInt32) {
        WTF::copyElements(std::bit_cast<uint32_t*>(typedVector() + offset), std::bit_cast<const uint64_t*>(array->butterfly()->contiguous().data() + objectOffset), length);
        return;
    }
    for (size_t i = 0; i < length; ++i) {
        JSValue value = array->butterfly()->contiguous().at(array, static_cast<unsigned>(i + objectOffset)).get();
        if (LIKELY(!!value))
            setIndexQuicklyToNativeValue(offset + i, Adaptor::toNativeFromInt32(value.asInt32()));
        else
            setIndexQuicklyToNativeValue(offset + i, Adaptor::toNativeFromUndefined());
    }
}

template<typename Adaptor>
void JSGenericTypedArrayView<Adaptor>::copyFromDoubleShapeArray(size_t offset, JSArray* array, size_t objectOffset, size_t length)
{
    ASSERT(canAccessRangeQuickly(offset, length));
    ASSERT((array->indexingType() & IndexingShapeMask) == DoubleShape);
    ASSERT(Adaptor::typeValue != TypeBigInt64 && Adaptor::typeValue != TypeBigUint64);
    ASSERT((length + objectOffset) <= array->length());
    ASSERT(array->isIteratorProtocolFastAndNonObservable());

    if constexpr (Adaptor::typeValue == TypeFloat64) {
        // Double to double copy. Thus we can use memcpy (since Array will never overlap with TypedArrays' backing store).
        WTF::copyElements(typedVector() + offset, array->butterfly()->contiguousDouble().data() + objectOffset, length);
        return;
    }
    for (size_t i = 0; i < length; ++i) {
        double d = array->butterfly()->contiguousDouble().at(array, static_cast<unsigned>(i + objectOffset));
        setIndexQuicklyToNativeValue(offset + i, Adaptor::toNativeFromDouble(d));
    }
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::setFromArrayLike(JSGlobalObject* globalObject, size_t offset, JSObject* object, size_t objectOffset, size_t length)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    bool success = validateRange(globalObject, offset, length);
    EXCEPTION_ASSERT(!scope.exception() == success);
    if (!success)
        return false;

    // It is not valid to ever call object->get() with an index of more than MAX_ARRAY_INDEX.
    // So we iterate in the optimized loop up to MAX_ARRAY_INDEX, then if there is anything to do beyond this, we rely on slower code.
    size_t safeUnadjustedLength = std::min(length, static_cast<size_t>(MAX_ARRAY_INDEX) + 1);
    size_t safeLength = objectOffset <= safeUnadjustedLength ? safeUnadjustedLength - objectOffset : 0;

    if constexpr (TypedArrayStorageType != TypeBigInt64 && TypedArrayStorageType != TypeBigUint64) {
        if (JSArray* array = jsDynamicCast<JSArray*>(object); LIKELY(array && isJSArray(array))) {
            if (safeLength == length && (safeLength + objectOffset) <= array->length() && array->isIteratorProtocolFastAndNonObservable()) {
                IndexingType indexingType = array->indexingType() & IndexingShapeMask;
                if (indexingType == Int32Shape) {
                    copyFromInt32ShapeArray(offset, array, objectOffset, safeLength);
                    return true;
                }
                if (indexingType == DoubleShape) {
                    copyFromDoubleShapeArray(offset, array, objectOffset, safeLength);
                    return true;
                }
            }
        }
    }

    for (size_t i = 0; i < safeLength; ++i) {
        ASSERT(i + objectOffset <= MAX_ARRAY_INDEX);
        JSValue value = object->get(globalObject, static_cast<unsigned>(i + objectOffset));
        RETURN_IF_EXCEPTION(scope, false);
        bool success = setIndex(globalObject, offset + i, value);
        EXCEPTION_ASSERT(!scope.exception() || !success);
        if (!success)
            return false;
    }
    for (size_t i = safeLength; i < length; ++i) {
        JSValue value = object->get(globalObject, static_cast<uint64_t>(i + objectOffset));
        RETURN_IF_EXCEPTION(scope, false);
        bool success = setIndex(globalObject, offset + i, value);
        EXCEPTION_ASSERT(!scope.exception() || !success);
        if (!success)
            return false;
    }
    return true;
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::setFromArrayLike(JSGlobalObject* globalObject, size_t offset, JSValue sourceValue)
{
    // https://tc39.es/ecma262/#sec-settypedarrayfromarraylike

    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (isDetached()) {
        throwTypeError(globalObject, scope, typedArrayBufferHasBeenDetachedErrorMessage);
        return false;
    }

    if (JSArray* array = jsDynamicCast<JSArray*>(sourceValue); LIKELY(array && isJSArray(array)))
        RELEASE_AND_RETURN(scope, setFromArrayLike(globalObject, offset, array, 0, array->length()));

    size_t targetLength = this->length();

    JSObject* source = sourceValue.toObject(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    JSValue sourceLengthValue = source->get(globalObject, vm.propertyNames->length);
    RETURN_IF_EXCEPTION(scope, { });
    size_t sourceLength = sourceLengthValue.toLength(globalObject);
    RETURN_IF_EXCEPTION(scope, { });

    if (offset > MAX_ARRAY_BUFFER_SIZE || !isSumSmallerThanOrEqual(sourceLength, offset, targetLength)) {
        throwRangeError(globalObject, scope, "Range consisting of offset and length are out of bounds"_s);
        return false;
    }

    // It is not valid to ever call source->get() with an index of more than MAX_ARRAY_INDEX.
    // So we iterate in the optimized loop up to MAX_ARRAY_INDEX, then if there is anything to do beyond this, we rely on slower code.
    size_t safeLength = std::min(sourceLength, static_cast<size_t>(MAX_ARRAY_INDEX) + 1);
    for (size_t i = 0; i < safeLength; ++i) {
        ASSERT(i <= MAX_ARRAY_INDEX);
        JSValue value = source->get(globalObject, static_cast<unsigned>(i));
        RETURN_IF_EXCEPTION(scope, false);
        bool success = setIndex(globalObject, offset + i, value);
        EXCEPTION_ASSERT(!scope.exception() || !success);
        if (UNLIKELY(!success))
            return false;
    }
    for (size_t i = safeLength; i < sourceLength; ++i) {
        JSValue value = source->get(globalObject, static_cast<uint64_t>(i));
        RETURN_IF_EXCEPTION(scope, false);
        bool success = setIndex(globalObject, offset + i, value);
        EXCEPTION_ASSERT(!scope.exception() || !success);
        if (UNLIKELY(!success))
            return false;
    }
    return true;
}

template<typename Adaptor>
RefPtr<typename Adaptor::ViewType> JSGenericTypedArrayView<Adaptor>::possiblySharedTypedImpl()
{
    return Adaptor::ViewType::tryCreate(possiblySharedBuffer(), byteOffsetRaw(), isAutoLength() ? std::nullopt : std::optional { lengthRaw() });
}

template<typename Adaptor>
RefPtr<typename Adaptor::ViewType> JSGenericTypedArrayView<Adaptor>::unsharedTypedImpl()
{
    return Adaptor::ViewType::tryCreate(unsharedBuffer(), byteOffsetRaw(), isAutoLength() ? std::nullopt : std::optional { lengthRaw() });
}

template<typename Adaptor> inline RefPtr<typename Adaptor::ViewType> toPossiblySharedNativeTypedView(VM&, JSValue value)
{
    auto* wrapper = jsDynamicCast<typename Adaptor::JSViewType*>(value);
    if (!wrapper)
        return nullptr;
    return wrapper->possiblySharedTypedImpl();
}

template<typename Adaptor> inline RefPtr<typename Adaptor::ViewType> toUnsharedNativeTypedView(VM& vm, JSValue value)
{
    auto result = toPossiblySharedNativeTypedView<Adaptor>(vm, value);
    if (!result || result->isShared())
        return nullptr;
    return result;
}

template<typename Adaptor>
ArrayBuffer* JSGenericTypedArrayView<Adaptor>::existingBuffer()
{
    return existingBufferInButterfly();
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::getOwnPropertySlot(
    JSObject* object, JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot)
{
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(object);

    if (std::optional<uint32_t> index = parseIndex(propertyName))
        return getOwnPropertySlotByIndex(thisObject, globalObject, index.value(), slot);

    if (isCanonicalNumericIndexString(propertyName.uid()))
        return false;

    return Base::getOwnPropertySlot(thisObject, globalObject, propertyName, slot);
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::put(
    JSCell* cell, JSGlobalObject* globalObject, PropertyName propertyName, JSValue value,
    PutPropertySlot& slot)
{
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(cell);

    if (std::optional<uint32_t> index = parseIndex(propertyName))
        return putByIndex(thisObject, globalObject, index.value(), value, slot.isStrictMode());

    if (isCanonicalNumericIndexString(propertyName.uid())) {
        // Cases like '-0', '1.1', etc. are still obliged to give the RHS a chance to throw.
        toNativeFromValue<Adaptor>(globalObject, value);
        return true;
    }

    return Base::put(thisObject, globalObject, propertyName, value, slot);
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::defineOwnProperty(
    JSObject* object, JSGlobalObject* globalObject, PropertyName propertyName,
    const PropertyDescriptor& descriptor, bool shouldThrow)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(object);

    if (std::optional<uint32_t> index = parseIndex(propertyName)) {
        auto throwTypeErrorIfNeeded = [&] (ASCIILiteral errorMessage) -> bool {
            if (shouldThrow)
                throwTypeError(globalObject, scope, makeString(errorMessage, *index));
            return false;
        };

        if (thisObject->isDetached())
            return typeError(globalObject, scope, shouldThrow, typedArrayBufferHasBeenDetachedErrorMessage);

        if (!thisObject->inBounds(index.value()))
            return throwTypeErrorIfNeeded("Attempting to store out-of-bounds property on a typed array at index: "_s);

        if (descriptor.isAccessorDescriptor())
            return throwTypeErrorIfNeeded("Attempting to store accessor property on a typed array at index: "_s);

        if (descriptor.configurablePresent() && !descriptor.configurable())
            return throwTypeErrorIfNeeded("Attempting to store non-configurable property on a typed array at index: "_s);

        if (descriptor.enumerablePresent() && !descriptor.enumerable())
            return throwTypeErrorIfNeeded("Attempting to store non-enumerable property on a typed array at index: "_s);

        if (descriptor.writablePresent() && !descriptor.writable())
            return throwTypeErrorIfNeeded("Attempting to store non-writable property on a typed array at index: "_s);

        scope.release();
        if (descriptor.value())
            thisObject->setIndex(globalObject, index.value(), descriptor.value());

        return true;
    }

    if (isCanonicalNumericIndexString(propertyName.uid()))
        return typeError(globalObject, scope, shouldThrow, "Attempting to store canonical numeric string property on a typed array"_s);

    RELEASE_AND_RETURN(scope, Base::defineOwnProperty(thisObject, globalObject, propertyName, descriptor, shouldThrow));
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::deleteProperty(
    JSCell* cell, JSGlobalObject* globalObject, PropertyName propertyName, DeletePropertySlot& slot)
{
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(cell);

    if (std::optional<uint32_t> index = parseIndex(propertyName))
        return deletePropertyByIndex(thisObject, globalObject, index.value());

    if (isCanonicalNumericIndexString(propertyName.uid()))
        return true;

    return Base::deleteProperty(thisObject, globalObject, propertyName, slot);
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::getOwnPropertySlotByIndex(
    JSObject* object, JSGlobalObject* globalObject, unsigned propertyName, PropertySlot& slot)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(object);

    if (thisObject->isDetached() || !thisObject->inBounds(propertyName))
        return false;

    JSValue value;
    if constexpr (Adaptor::canConvertToJSQuickly) {
        UNUSED_VARIABLE(scope);
        value = thisObject->getIndexQuickly(propertyName);
    } else {
        auto nativeValue = thisObject->getIndexQuicklyAsNativeValue(propertyName);
        value = Adaptor::toJSValue(globalObject, nativeValue);
        RETURN_IF_EXCEPTION(scope, false);
    }
    slot.setValue(thisObject, static_cast<unsigned>(PropertyAttribute::None), value);
    return true;
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::putByIndex(
    JSCell* cell, JSGlobalObject* globalObject, unsigned propertyName, JSValue value, bool)
{
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(cell);
    thisObject->setIndex(globalObject, propertyName, value);
    return true;
}

template<typename Adaptor>
bool JSGenericTypedArrayView<Adaptor>::deletePropertyByIndex(
    JSCell* cell, JSGlobalObject*, unsigned propertyName)
{
    // Integer-indexed elements can't be deleted, so we must return false when the index is valid.
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(cell);
    return thisObject->isDetached() || !thisObject->inBounds(propertyName);
}

template<typename Adaptor>
void JSGenericTypedArrayView<Adaptor>::getOwnPropertyNames(
    JSObject* object, JSGlobalObject* globalObject, PropertyNameArray& array, DontEnumPropertiesMode mode)
{
    VM& vm = globalObject->vm();
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(object);

    if (array.includeStringProperties()) {
        uint64_t length = thisObject->length();
        for (uint64_t i = 0; i < length; ++i)
            array.add(Identifier::from(vm, i));
    }
    
    thisObject->getOwnNonIndexPropertyNames(globalObject, array, mode);
}

template<typename Adaptor>
size_t JSGenericTypedArrayView<Adaptor>::estimatedSize(JSCell* cell, VM& vm)
{
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(cell);

    if (thisObject->m_mode == OversizeTypedArray)
        return Base::estimatedSize(thisObject, vm) + thisObject->byteLengthRaw();
    if (thisObject->m_mode == FastTypedArray && thisObject->hasVector())
        return Base::estimatedSize(thisObject, vm) + thisObject->byteLengthRaw();

    return Base::estimatedSize(thisObject, vm);
}

template<typename Adaptor>
template<typename Visitor>
void JSGenericTypedArrayView<Adaptor>::visitChildrenImpl(JSCell* cell, Visitor& visitor)
{
    JSGenericTypedArrayView* thisObject = jsCast<JSGenericTypedArrayView*>(cell);
    ASSERT_GC_OBJECT_INHERITS(thisObject, info());
    Base::visitChildren(thisObject, visitor);

    TypedArrayMode mode;
    void* vector;
    size_t byteSize;
    
    {
        Locker locker { thisObject->cellLock() };
        mode = thisObject->m_mode;
        vector = thisObject->vector();
        byteSize = thisObject->byteLengthRaw();
    }
    
    switch (mode) {
    case FastTypedArray: {
        if (vector)
            visitor.markAuxiliary(vector);
        break;
    }
        
    case OversizeTypedArray: {
        visitor.reportExtraMemoryVisited(byteSize);
        break;
    }
        
    case WastefulTypedArray:
    case ResizableNonSharedWastefulTypedArray:
    case ResizableNonSharedAutoLengthWastefulTypedArray:
    case GrowableSharedWastefulTypedArray:
    case GrowableSharedAutoLengthWastefulTypedArray:
        break;
        
    case DataViewMode:
    case ResizableNonSharedDataViewMode:
    case ResizableNonSharedAutoLengthDataViewMode:
    case GrowableSharedDataViewMode:
    case GrowableSharedAutoLengthDataViewMode:
        RELEASE_ASSERT_NOT_REACHED();
        break;
    }
}

DEFINE_VISIT_CHILDREN_WITH_MODIFIER(template<typename Adaptor>, JSGenericTypedArrayView<Adaptor>);

template<typename Adaptor> inline size_t JSGenericTypedArrayView<Adaptor>::byteLength() const
{
    // https://tc39.es/proposal-resizablearraybuffer/#sec-get-%typedarray%.prototype.bytelength
    if (LIKELY(canUseRawFieldsDirectly()))
        return byteLengthRaw();
    IdempotentArrayBufferByteLengthGetter<std::memory_order_seq_cst> getter;
    return integerIndexedObjectByteLength(const_cast<JSGenericTypedArrayView*>(this), getter);
}

template<typename Adaptor> inline size_t JSGenericTypedArrayView<Adaptor>::byteLengthRaw() const
{
    return lengthRaw() << logElementSize(Adaptor::typeValue);
}

template<typename Adaptor> inline const typename Adaptor::Type* JSGenericTypedArrayView<Adaptor>::typedVector() const
{
    return std::bit_cast<const typename Adaptor::Type*>(vector());
}

template<typename Adaptor> inline typename Adaptor::Type* JSGenericTypedArrayView<Adaptor>::typedVector()
{
    return std::bit_cast<typename Adaptor::Type*>(vector());
}

template<typename Adaptor> inline bool JSGenericTypedArrayView<Adaptor>::inBounds(size_t i) const
{
    if (LIKELY(canUseRawFieldsDirectly()))
        return i < lengthRaw();
    size_t bufferByteLength = const_cast<JSGenericTypedArrayView*>(this)->existingBufferInButterfly()->byteLength();
    size_t byteOffset = const_cast<JSGenericTypedArrayView*>(this)->byteOffsetRaw();
    size_t byteLength = byteLengthRaw() + byteOffset; // Keep in mind that byteLengthRaw returns 0 for AutoLength TypedArray.
    if (byteLength > bufferByteLength)
        return false;
    if (isAutoLength()) {
        constexpr size_t logSize = logElementSize(Adaptor::typeValue);
        size_t remainingLength = bufferByteLength - byteOffset;
        return i < (remainingLength >> logSize);
    }
    return i < lengthRaw();
}

// These methods are meant to match indexed access methods that JSObject
// supports - hence the slight redundancy.
template<typename Adaptor> inline bool JSGenericTypedArrayView<Adaptor>::canGetIndexQuickly(size_t i) const
{
    return inBounds(i) && Adaptor::canConvertToJSQuickly;
}

template<typename Adaptor> inline bool JSGenericTypedArrayView<Adaptor>::canSetIndexQuickly(size_t i, JSValue value) const
{
    return inBounds(i) && value.isNumber() && Adaptor::canConvertToJSQuickly;
}

template<typename Adaptor> inline typename Adaptor::Type JSGenericTypedArrayView<Adaptor>::getIndexQuicklyAsNativeValue(size_t i) const
{
    ASSERT(inBounds(i));
    return typedVector()[i];
}

template<typename Adaptor> inline JSValue JSGenericTypedArrayView<Adaptor>::getIndexQuickly(size_t i) const
{
    return Adaptor::toJSValue(nullptr, getIndexQuicklyAsNativeValue(i));
}

template<typename Adaptor> inline void JSGenericTypedArrayView<Adaptor>::setIndexQuicklyToNativeValue(size_t i, typename Adaptor::Type value)
{
    ASSERT(inBounds(i));
    typedVector()[i] = value;
}

template<typename Adaptor> inline void JSGenericTypedArrayView<Adaptor>::setIndexQuickly(size_t i, JSValue value)
{
    ASSERT(!value.isObject());
    setIndexQuicklyToNativeValue(i, toNativeFromValue<Adaptor>(value));
}

template<typename Adaptor> inline bool JSGenericTypedArrayView<Adaptor>::setIndex(JSGlobalObject* globalObject, size_t i, JSValue jsValue)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    typename Adaptor::Type value = toNativeFromValue<Adaptor>(globalObject, jsValue);
    RETURN_IF_EXCEPTION(scope, false);

    if (isDetached())
        return true;

    if (!inBounds(i))
        return false;

    setIndexQuicklyToNativeValue(i, value);
    return true;
}

template<typename Adaptor> inline auto JSGenericTypedArrayView<Adaptor>::toAdaptorNativeFromValue(JSGlobalObject* globalObject, JSValue jsValue) -> ElementType
{
    return toNativeFromValue<Adaptor>(globalObject, jsValue);
}

template<typename Adaptor> inline auto JSGenericTypedArrayView<Adaptor>::toAdaptorNativeFromValueWithoutCoercion(JSValue jsValue) -> std::optional<ElementType>
{
    return toNativeFromValueWithoutCoercion<Adaptor>(jsValue);
}

template<typename Adaptor> inline auto JSGenericTypedArrayView<Adaptor>::sort() -> SortResult
{
    RELEASE_ASSERT(!isDetached());
    Vector<ElementType, 16> forShared;
    IdempotentArrayBufferByteLengthGetter<std::memory_order_seq_cst> getter;
    auto lengthValue = integerIndexedObjectLength(this, getter);
    if (!lengthValue)
        return SortResult::Failed;

    size_t length = lengthValue.value();

    ElementType* originalArray = typedVector();
    ElementType* array = originalArray;
    if (isShared()) {
        if (UNLIKELY(!forShared.tryGrow(length)))
            return SortResult::OutOfMemory;
        WTF::copyElements(forShared.data(), originalArray, length);
        array = forShared.data();
    }

    switch (Adaptor::typeValue) {
    case TypeFloat16:
        sortFloat<int16_t>(array, array + length);
        break;
    case TypeFloat32:
        sortFloat<int32_t>(array, array + length);
        break;
    case TypeFloat64:
        sortFloat<int64_t>(array, array + length);
        break;
    default:
        std::sort(array, array + length);
        break;
    }

    if (isShared())
        WTF::copyElements(originalArray, forShared.data(), length);

    return SortResult::Success;
}

template<typename Adaptor> inline bool JSGenericTypedArrayView<Adaptor>::canAccessRangeQuickly(size_t offset, size_t length)
{
    return isSumSmallerThanOrEqual(offset, length, this->length());
}

template<typename Adaptor> inline Structure* JSGenericTypedArrayView<Adaptor>::createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype)
{
    return Structure::create(vm, globalObject, prototype, TypeInfo(typeForTypedArrayType(Adaptor::typeValue), StructureFlags), info(), NonArray);
}

template<typename Adaptor> inline const ClassInfo* JSGenericTypedArrayView<Adaptor>::info()
{
#define JSC_GET_CLASS_INFO(type) case Type##type: return get##type##ArrayClassInfo();
    switch (Adaptor::typeValue) {
        FOR_EACH_TYPED_ARRAY_TYPE_EXCLUDING_DATA_VIEW(JSC_GET_CLASS_INFO)
    default:
        RELEASE_ASSERT_NOT_REACHED();
        return nullptr;
    }
#undef JSC_GET_CLASS_INFO
}

template<typename Adaptor> template<typename, SubspaceAccess access>
inline GCClient::IsoSubspace* JSGenericTypedArrayView<Adaptor>::subspaceFor(VM& vm)
{
    switch (Adaptor::typeValue) {
    case TypeInt8:
        return vm.int8ArraySpace<access>();
    case TypeInt16:
        return vm.int16ArraySpace<access>();
    case TypeInt32:
        return vm.int32ArraySpace<access>();
    case TypeUint8:
        return vm.uint8ArraySpace<access>();
    case TypeUint8Clamped:
        return vm.uint8ClampedArraySpace<access>();
    case TypeUint16:
        return vm.uint16ArraySpace<access>();
    case TypeUint32:
        return vm.uint32ArraySpace<access>();
    case TypeFloat16:
        return vm.float16ArraySpace<access>();
    case TypeFloat32:
        return vm.float32ArraySpace<access>();
    case TypeFloat64:
        return vm.float64ArraySpace<access>();
    case TypeBigInt64:
        return vm.bigInt64ArraySpace<access>();
    case TypeBigUint64:
        return vm.bigUint64ArraySpace<access>();
    default:
        RELEASE_ASSERT_NOT_REACHED();
        return nullptr;
    }
}

template<typename Adaptor>  template<typename IntegralType>
inline void JSGenericTypedArrayView<Adaptor>::sortFloat(ElementType* begin, ElementType* end)
{
    // FIXME: Need to get m_length once.
    ASSERT(sizeof(IntegralType) == sizeof(ElementType));

    // Since there might be another view that sets the bits of
    // our floats to NaNs with negative sign bits we need to
    // purify the array.
    // We use a separate function here to avoid the strict aliasing rule.
    // We could use a union but ASAN seems to frown upon that.
    for (auto it = begin; it != end; ++it)
        *it = purifyNaN(*it);

    std::sort(reinterpret_cast_ptr<IntegralType*>(begin), reinterpret_cast_ptr<IntegralType*>(end), [](IntegralType a, IntegralType b) {
        if (a >= 0 || b >= 0)
            return a < b;
        return a > b;
    });
}

template<typename Adaptor> RefPtr<typename Adaptor::ViewType> JSGenericTypedArrayView<Adaptor>::toWrapped(VM& vm, JSValue value)
{
    auto result = JSC::toUnsharedNativeTypedView<Adaptor>(vm, value);
    if (!result || result->isResizableOrGrowableShared())
        return nullptr;
    return result;
}

template<typename Adaptor> RefPtr<typename Adaptor::ViewType> JSGenericTypedArrayView<Adaptor>::toWrappedAllowShared(VM& vm, JSValue value)
{
    auto result = JSC::toPossiblySharedNativeTypedView<Adaptor>(vm, value);
    if (!result || result->isResizableOrGrowableShared())
        return nullptr;
    return result;
}

template<typename PassedAdaptor> inline const ClassInfo* JSGenericResizableOrGrowableSharedTypedArrayView<PassedAdaptor>::info()
{
    switch (Base::Adaptor::typeValue) {
#define JSC_GET_CLASS_INFO(type) \
    case Type##type: return getResizableOrGrowableShared##type##ArrayClassInfo();
        FOR_EACH_TYPED_ARRAY_TYPE_EXCLUDING_DATA_VIEW(JSC_GET_CLASS_INFO)
#undef JSC_GET_CLASS_INFO
    default:
        RELEASE_ASSERT_NOT_REACHED();
        return nullptr;
    }
}

template<typename PassedAdaptor> inline Structure* JSGenericResizableOrGrowableSharedTypedArrayView<PassedAdaptor>::createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype)
{
    return Structure::create(vm, globalObject, prototype, TypeInfo(typeForTypedArrayType(Base::Adaptor::typeValue), StructureFlags), info(), NonArray);
}

template<typename PassedAdaptor> inline bool JSGenericResizableOrGrowableSharedTypedArrayView<PassedAdaptor>::preventExtensions(JSObject* cell, JSGlobalObject* globalObject)
{
    // https://tc39.es/ecma262/#sec-typedarray-preventextensions
    auto* object = jsCast<JSGenericResizableOrGrowableSharedTypedArrayView<PassedAdaptor>*>(cell);
    if (object->isAutoLength())
        return false;
    if (object->isResizableNonShared())
        return false;
    return Base::preventExtensions(object, globalObject);
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
