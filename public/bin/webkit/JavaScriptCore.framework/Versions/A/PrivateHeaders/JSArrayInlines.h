/*
 *  Copyright (C) 2016-2022 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

#pragma once

#include "ArrayPrototype.h"
#include "ButterflyInlines.h"
#include "ClonedArguments.h"
#include "DirectArguments.h"
#include "Error.h"
#include "JSArray.h"
#include "JSCellInlines.h"
#include "ScopedArguments.h"
#include "Structure.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

inline Structure* JSArray::createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype, IndexingType indexingType)
{
    return Structure::create(vm, globalObject, prototype, TypeInfo(ArrayType, StructureFlags), info(), indexingType);
}

inline IndexingType JSArray::mergeIndexingTypeForCopying(IndexingType other, bool allowPromotion)
{
    IndexingType type = indexingType();
    if (!(type & IsArray && other & IsArray))
        return NonArray;

    if (hasAnyArrayStorage(type) || hasAnyArrayStorage(other))
        return NonArray;

    if (type == ArrayWithUndecided)
        return other;

    if (other == ArrayWithUndecided)
        return type;

    // We can memcpy an Int32 and a Contiguous into a Contiguous array since
    // both share the same memory layout for Int32 numbers.
    if ((type == ArrayWithInt32 || type == ArrayWithContiguous)
        && (other == ArrayWithInt32 || other == ArrayWithContiguous)) {
        if (other == ArrayWithContiguous)
            return other;
        return type;
    }

    if (allowPromotion) {
        if ((type == ArrayWithInt32 || type == ArrayWithDouble) && (other == ArrayWithInt32 || other == ArrayWithDouble)) {
            if (type == other)
                return type;
            return ArrayWithDouble;
        }
    }

    if (type != other)
        return NonArray;

    return type;
}

ALWAYS_INLINE bool JSArray::holesMustForwardToPrototype() const
{
    Structure* structure = this->structure();
    if (LIKELY(type() == ArrayType)) {
        ASSERT(!structure->mayInterceptIndexedAccesses());
        JSGlobalObject* globalObject = structure->globalObject();
        if (LIKELY(structure->hasMonoProto() && structure->storedPrototype() == globalObject->arrayPrototype() && globalObject->arrayPrototypeChainIsSane()))
            return false;
    }
    return structure->holesMustForwardToPrototype(const_cast<JSArray*>(this));
}

inline bool JSArray::canFastCopy(JSArray* otherArray) const
{
    if (hasAnyArrayStorage(indexingType()) || hasAnyArrayStorage(otherArray->indexingType()))
        return false;
    if (holesMustForwardToPrototype() || otherArray->holesMustForwardToPrototype())
        return false;
    return true;
}

inline bool JSArray::canFastAppend(JSArray* otherArray) const
{
    // Append can modify itself, thus, we cannot do fast-append if |this| and otherArray are the same.
    if (otherArray == this)
        return false;
    return canFastCopy(otherArray);
}

inline bool JSArray::canDoFastIndexedAccess() const
{
    JSGlobalObject* globalObject = this->globalObject();
    if (!globalObject->arrayPrototypeChainIsSane())
        return false;

    Structure* structure = this->structure();
    // This is the fast case. Many arrays will be an original array.
    if (globalObject->isOriginalArrayStructure(structure))
        return true;

    if (structure->mayInterceptIndexedAccesses())
        return false;

    if (getPrototypeDirect() != globalObject->arrayPrototype())
        return false;

    return true;
}

ALWAYS_INLINE bool JSArray::definitelyNegativeOneMiss() const
{
    JSGlobalObject* globalObject = this->globalObject();
    if (!globalObject->arrayPrototypeChainIsSane())
        return false;

    if (!globalObject->arrayNegativeOneWatchpointSet().isStillValid())
        return false;

    Structure* structure = this->structure();
    // This is the fast case. Many arrays will be an original array.
    if (globalObject->isOriginalArrayStructure(structure))
        return true;

    if (getPrototypeDirect() != globalObject->arrayPrototype())
        return false;

    if (structure->seenProperties().bits())
        return false;

    return true;
}


ALWAYS_INLINE uint64_t toLength(JSGlobalObject* globalObject, JSObject* object)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    if (LIKELY(isJSArray(object)))
        return jsCast<JSArray*>(object)->length();

    switch (object->type()) {
    case DirectArgumentsType:
        RELEASE_AND_RETURN(scope, jsCast<DirectArguments*>(object)->length(globalObject));
    case ScopedArgumentsType:
        RELEASE_AND_RETURN(scope, jsCast<ScopedArguments*>(object)->length(globalObject));
    case ClonedArgumentsType:
        RELEASE_AND_RETURN(scope, jsCast<ClonedArguments*>(object)->length(globalObject));
    default:
        break;
    }
    JSValue lengthValue = object->get(globalObject, vm.propertyNames->length);
    RETURN_IF_EXCEPTION(scope, { });
    RELEASE_AND_RETURN(scope, lengthValue.toLength(globalObject));
}

ALWAYS_INLINE void JSArray::pushInline(JSGlobalObject* globalObject, JSValue value)
{
    VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    ensureWritable(vm);

    Butterfly* butterfly = this->butterfly();

    switch (indexingMode()) {
    case ArrayClass: {
        createInitialUndecided(vm, 0);
        FALLTHROUGH;
    }

    case ArrayWithUndecided: {
        convertUndecidedForValue(vm, value);
        scope.release();
        push(globalObject, value);
        return;
    }

    case ArrayWithInt32: {
        if (!value.isInt32()) {
            convertInt32ForValue(vm, value);
            scope.release();
            push(globalObject, value);
            return;
        }

        unsigned length = butterfly->publicLength();
        ASSERT(length <= butterfly->vectorLength());
        if (length < butterfly->vectorLength()) {
            butterfly->contiguousInt32().at(this, length).setWithoutWriteBarrier(value);
            butterfly->setPublicLength(length + 1);
            return;
        }

        if (UNLIKELY(length > MAX_ARRAY_INDEX)) {
            methodTable()->putByIndex(this, globalObject, length, value, true);
            if (!scope.exception())
                throwException(globalObject, scope, createRangeError(globalObject, LengthExceededTheMaximumArrayLengthError));
            return;
        }

        scope.release();
        putByIndexBeyondVectorLengthWithoutAttributes<Int32Shape>(globalObject, length, value);
        return;
    }

    case ArrayWithContiguous: {
        unsigned length = butterfly->publicLength();
        ASSERT(length <= butterfly->vectorLength());
        if (length < butterfly->vectorLength()) {
            butterfly->contiguous().at(this, length).setWithoutWriteBarrier(value);
            butterfly->setPublicLength(length + 1);
            vm.writeBarrier(this, value);
            return;
        }

        if (UNLIKELY(length > MAX_ARRAY_INDEX)) {
            methodTable()->putByIndex(this, globalObject, length, value, true);
            if (!scope.exception())
                throwException(globalObject, scope, createRangeError(globalObject, LengthExceededTheMaximumArrayLengthError));
            return;
        }

        scope.release();
        putByIndexBeyondVectorLengthWithoutAttributes<ContiguousShape>(globalObject, length, value);
        return;
    }

    case ArrayWithDouble: {
        ASSERT(Options::allowDoubleShape());
        if (!value.isNumber()) {
            convertDoubleToContiguous(vm);
            scope.release();
            push(globalObject, value);
            return;
        }
        double valueAsDouble = value.asNumber();
        if (valueAsDouble != valueAsDouble) {
            convertDoubleToContiguous(vm);
            scope.release();
            push(globalObject, value);
            return;
        }

        unsigned length = butterfly->publicLength();
        ASSERT(length <= butterfly->vectorLength());
        if (length < butterfly->vectorLength()) {
            butterfly->contiguousDouble().at(this, length) = valueAsDouble;
            butterfly->setPublicLength(length + 1);
            return;
        }

        if (UNLIKELY(length > MAX_ARRAY_INDEX)) {
            methodTable()->putByIndex(this, globalObject, length, value, true);
            if (!scope.exception())
                throwException(globalObject, scope, createRangeError(globalObject, LengthExceededTheMaximumArrayLengthError));
            return;
        }

        scope.release();
        putByIndexBeyondVectorLengthWithoutAttributes<DoubleShape>(globalObject, length, value);
        return;
    }

    case ArrayWithSlowPutArrayStorage: {
        unsigned oldLength = length();
        bool putResult = false;
        bool result = attemptToInterceptPutByIndexOnHole(globalObject, oldLength, value, true, putResult);
        RETURN_IF_EXCEPTION(scope, void());
        if (result) {
            if (oldLength < 0xFFFFFFFFu) {
                scope.release();
                setLength(globalObject, oldLength + 1, true);
            }
            return;
        }
        FALLTHROUGH;
    }

    case ArrayWithArrayStorage: {
        ArrayStorage* storage = butterfly->arrayStorage();

        // Fast case - push within vector, always update m_length & m_numValuesInVector.
        unsigned length = storage->length();
        if (length < storage->vectorLength()) {
            storage->m_vector[length].set(vm, this, value);
            storage->setLength(length + 1);
            ++storage->m_numValuesInVector;
            return;
        }

        // Pushing to an array of invalid length (2^31-1) stores the property, but throws a range error.
        if (UNLIKELY(storage->length() > MAX_ARRAY_INDEX)) {
            methodTable()->putByIndex(this, globalObject, storage->length(), value, true);
            // Per ES5.1 15.4.4.7 step 6 & 15.4.5.1 step 3.d.
            if (!scope.exception())
                throwException(globalObject, scope, createRangeError(globalObject, LengthExceededTheMaximumArrayLengthError));
            return;
        }

        // Handled the same as putIndex.
        scope.release();
        putByIndexBeyondVectorLengthWithArrayStorage(globalObject, storage->length(), value, true, storage);
        return;
    }

    default:
        RELEASE_ASSERT_NOT_REACHED();
    }
}

ALWAYS_INLINE JSValue getProperty(JSGlobalObject* globalObject, JSObject* object, uint64_t index)
{
    if (JSValue result = object->tryGetIndexQuickly(index))
        return result;

    // Don't return undefined if the property is not found.
    return object->getIfPropertyExists(globalObject, index);
}

ALWAYS_INLINE bool isHole(double value)
{
    return std::isnan(value);
}

ALWAYS_INLINE bool isHole(const WriteBarrier<Unknown>& value)
{
    return !value;
}

template<typename T>
ALWAYS_INLINE bool containsHole(const T* data, unsigned length)
{
    for (unsigned i = 0; i < length; ++i) {
        if (isHole(data[i]))
            return true;
    }
    return false;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
