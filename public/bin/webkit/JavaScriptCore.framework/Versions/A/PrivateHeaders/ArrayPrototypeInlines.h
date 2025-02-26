/*
 * Copyright (C) 2022 Apple, Inc. All rights reserved.
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

#include "ArrayConstructor.h"
#include "ArrayPrototype.h"
#include "Error.h"
#include "ExceptionHelpers.h"
#include "GetVM.h"
#include "JSGlobalObject.h"
#include "ObjectPrototype.h"

namespace JSC {

enum class SpeciesConstructResult : uint8_t {
    FastPath,
    Exception,
    CreatedObject
};

ALWAYS_INLINE bool arraySpeciesWatchpointIsValid(VM& vm, JSObject* thisObject)
{
    JSGlobalObject* globalObject = thisObject->globalObject();
    ArrayPrototype* arrayPrototype = globalObject->arrayPrototype();

    ASSERT(globalObject->arraySpeciesWatchpointSet().state() != ClearWatchpoint);
    if (arrayPrototype != thisObject->getPrototypeDirect())
        return false;

    if (globalObject->arraySpeciesWatchpointSet().state() != IsWatched)
        return false;

    if (!thisObject->hasCustomProperties())
        return true;

    return thisObject->getDirectOffset(vm, vm.propertyNames->constructor) == invalidOffset;
}

ALWAYS_INLINE bool arrayMissingIsConcatSpreadable(VM& vm, JSObject* thisObject)
{
    JSGlobalObject* globalObject = thisObject->globalObject();
    ASSERT(globalObject->arrayIsConcatSpreadableWatchpointSet().state() != ClearWatchpoint);
    if (globalObject->arrayIsConcatSpreadableWatchpointSet().state() != IsWatched)
        return false;

    if (isJSArray(thisObject)) {
        ArrayPrototype* arrayPrototype = globalObject->arrayPrototype();
        if (arrayPrototype != thisObject->getPrototypeDirect())
            return false;
    } else {
        if (globalObject->objectPrototype() != thisObject->getPrototypeDirect())
            return false;
    }

    if (!thisObject->hasCustomProperties())
        return true;

    return thisObject->getDirectOffset(vm, vm.propertyNames->isConcatSpreadableSymbol) == invalidOffset;
}

ALWAYS_INLINE std::pair<SpeciesConstructResult, JSObject*> speciesConstructArray(JSGlobalObject* globalObject, JSObject* thisObject, uint64_t length)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    constexpr std::pair<SpeciesConstructResult, JSObject*> exceptionResult { SpeciesConstructResult::Exception, nullptr };

    // ECMA 9.4.2.3: https://tc39.github.io/ecma262/#sec-arrayspeciescreate
    JSValue constructor = jsUndefined();
    bool thisIsArray = isArray(globalObject, thisObject);
    RETURN_IF_EXCEPTION(scope, exceptionResult);
    if (LIKELY(thisIsArray)) {
        // Fast path in the normal case where the user has not set an own constructor and the Array.prototype.constructor is normal.
        // We need prototype check for subclasses of Array, which are Array objects but have a different prototype by default.
        bool isValid = arraySpeciesWatchpointIsValid(vm, thisObject);
        RETURN_IF_EXCEPTION(scope, exceptionResult);
        if (LIKELY(isValid))
            return std::pair { SpeciesConstructResult::FastPath, nullptr };

        constructor = thisObject->get(globalObject, vm.propertyNames->constructor);
        RETURN_IF_EXCEPTION(scope, exceptionResult);
        if (constructor.isConstructor()) {
            JSObject* constructorObject = jsCast<JSObject*>(constructor);
            bool isArrayConstructorFromAnotherRealm = globalObject != constructorObject->globalObject()
                && constructorObject->inherits<ArrayConstructor>();
            if (isArrayConstructorFromAnotherRealm)
                return std::pair { SpeciesConstructResult::FastPath, nullptr };
        }
        if (constructor.isObject()) {
            constructor = constructor.get(globalObject, vm.propertyNames->speciesSymbol);
            RETURN_IF_EXCEPTION(scope, exceptionResult);
            if (constructor.isNull())
                return std::pair { SpeciesConstructResult::FastPath, nullptr };
        }
    } else {
        // If isArray is false, return ? ArrayCreate(length).
        return std::pair { SpeciesConstructResult::FastPath, nullptr };
    }

    if (constructor.isUndefined())
        return std::pair { SpeciesConstructResult::FastPath, nullptr };

    MarkedArgumentBuffer args;
    args.append(jsNumber(length));
    ASSERT(!args.hasOverflowed());
    JSObject* newObject = construct(globalObject, constructor, args, "Species construction did not get a valid constructor"_s);
    RETURN_IF_EXCEPTION(scope, exceptionResult);
    return std::pair { SpeciesConstructResult::CreatedObject, newObject };
}

ALWAYS_INLINE void setLength(JSGlobalObject* globalObject, VM& vm, JSObject* obj, uint64_t value)
{
    auto scope = DECLARE_THROW_SCOPE(vm);
    static constexpr bool throwException = true;
    if (LIKELY(isJSArray(obj))) {
        if (UNLIKELY(value > UINT32_MAX)) {
            throwRangeError(globalObject, scope, "Invalid array length"_s);
            return;
        }
        scope.release();
        jsCast<JSArray*>(obj)->setLength(globalObject, static_cast<uint32_t>(value), throwException);
        return;
    }
    scope.release();
    PutPropertySlot slot(obj, throwException);
    obj->methodTable()->put(obj, globalObject, vm.propertyNames->length, jsNumber(value), slot);
}

// The shift/unshift function implement the shift/unshift behaviour required
// by the corresponding array prototype methods, and by splice. In both cases,
// the methods are operating an an array or array like object.
//
//  header  currentCount  (remainder)
// [------][------------][-----------]
//  header  resultCount  (remainder)
// [------][-----------][-----------]
//
// The set of properties in the range 'header' must be unchanged. The set of
// properties in the range 'remainder' (where remainder = length - header -
// currentCount) will be shifted to the left or right as appropriate; in the
// case of shift this must be removing values, in the case of unshift this
// must be introducing new values.

template<JSArray::ShiftCountMode shiftCountMode>
void shift(JSGlobalObject* globalObject, JSObject* thisObj, uint64_t header, uint64_t currentCount, uint64_t resultCount, uint64_t length)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    RELEASE_ASSERT(currentCount > resultCount);
    uint64_t count = currentCount - resultCount;

    RELEASE_ASSERT(header <= length);
    RELEASE_ASSERT(currentCount <= (length - header));

    if (isJSArray(thisObj)) {
        JSArray* array = asArray(thisObj);
        uint32_t header32 = static_cast<uint32_t>(header);
        ASSERT(header32 == header);
        if (array->length() == length && array->shiftCount<shiftCountMode>(globalObject, header32, static_cast<uint32_t>(count)))
            return;
        header = header32;
    }

    for (uint64_t k = header; k < length - currentCount; ++k) {
        uint64_t from = k + currentCount;
        uint64_t to = k + resultCount;
        JSValue value = getProperty(globalObject, thisObj, from);
        RETURN_IF_EXCEPTION(scope, void());
        if (value) {
            thisObj->putByIndexInline(globalObject, to, value, true);
            RETURN_IF_EXCEPTION(scope, void());
        } else {
            bool success = thisObj->deleteProperty(globalObject, to);
            RETURN_IF_EXCEPTION(scope, void());
            if (!success) {
                throwTypeError(globalObject, scope, UnableToDeletePropertyError);
                return;
            }
        }
    }
    for (uint64_t k = length; k > length - count; --k) {
        bool success = thisObj->deleteProperty(globalObject, k - 1);
        RETURN_IF_EXCEPTION(scope, void());
        if (!success) {
            throwTypeError(globalObject, scope, UnableToDeletePropertyError);
            return;
        }
    }
}

inline void unshift(JSGlobalObject* globalObject, JSObject* thisObj, uint64_t header, uint64_t currentCount, uint64_t resultCount, uint64_t length)
{
    ASSERT(header <= maxSafeInteger());
    ASSERT(currentCount <= maxSafeInteger());
    ASSERT(resultCount <= maxSafeInteger());
    ASSERT(length <= maxSafeInteger());

    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    RELEASE_ASSERT(resultCount > currentCount);
    uint64_t count = resultCount - currentCount;

    RELEASE_ASSERT(header <= length);
    RELEASE_ASSERT(currentCount <= (length - header));

    if (isJSArray(thisObj)) {
        // Spec says if we would produce an array of this size, we must throw a range error.
        if (count + length > std::numeric_limits<uint32_t>::max()) {
            throwRangeError(globalObject, scope, LengthExceededTheMaximumArrayLengthError);
            return;
        }

        JSArray* array = asArray(thisObj);
        if (array->length() == length) {
            bool handled = array->unshiftCount(globalObject, static_cast<uint32_t>(header), static_cast<uint32_t>(count));
            EXCEPTION_ASSERT(!scope.exception() || handled);
            if (handled)
                return;
        }
    }

    for (uint64_t k = length - currentCount; k > header; --k) {
        uint64_t from = k + currentCount - 1;
        uint64_t to = k + resultCount - 1;
        JSValue value = getProperty(globalObject, thisObj, from);
        RETURN_IF_EXCEPTION(scope, void());
        if (value) {
            thisObj->putByIndexInline(globalObject, to, value, true);
            RETURN_IF_EXCEPTION(scope, void());
        } else {
            bool success = thisObj->deleteProperty(globalObject, to);
            RETURN_IF_EXCEPTION(scope, void());
            if (UNLIKELY(!success)) {
                throwTypeError(globalObject, scope, UnableToDeletePropertyError);
                return;
            }
        }
    }
}

inline Structure* ArrayPrototype::createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype)
{
    return Structure::create(vm, globalObject, prototype, TypeInfo(DerivedArrayType, StructureFlags), info(), ArrayClass);
}

} // namespace JSC
