/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003-2023 Apple Inc. All rights reserved.
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

#include "ArgList.h"
#include "ArrayConventions.h"
#include "Butterfly.h"
#include "JSCell.h"
#include "JSObject.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class JSArray;
class LLIntOffsetsExtractor;

extern const ASCIILiteral LengthExceededTheMaximumArrayLengthError;

class JSArray : public JSNonFinalObject {
    friend class LLIntOffsetsExtractor;
    friend class Walker;
    friend class JIT;
    WTF_ALLOW_COMPACT_POINTERS;

public:
    typedef JSNonFinalObject Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnSpecialPropertyNames | OverridesPut;

    static size_t allocationSize(Checked<size_t> inlineCapacity)
    {
        ASSERT_UNUSED(inlineCapacity, !inlineCapacity);
        return sizeof(JSArray);
    }

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.arraySpace();
    }
        
protected:
    explicit JSArray(VM& vm, Structure* structure, Butterfly* butterfly)
        : JSNonFinalObject(vm, structure, butterfly)
    {
    }

public:
    static JSArray* tryCreate(VM&, Structure*, unsigned initialLength = 0);
    static JSArray* tryCreate(VM&, Structure*, unsigned initialLength, unsigned vectorLengthHint);
    static JSArray* create(VM&, Structure*, unsigned initialLength = 0);
    static JSArray* createWithButterfly(VM&, GCDeferralContext*, Structure*, Butterfly*);

    // tryCreateUninitializedRestricted is used for fast construction of arrays whose size and
    // contents are known at time of creation. This is a restricted API for careful use only in
    // performance critical code paths. If you don't have a good reason to use it, you probably
    // shouldn't use it. Instead, you should go with
    //   - JSArray::tryCreate() or JSArray::create() instead of tryCreateUninitializedRestricted(), and
    //   - putDirectIndex() instead of initializeIndex().
    //
    // Clients of this interface must:
    //   - null-check the result (indicating out of memory, or otherwise unable to allocate vector).
    //   - call 'initializeIndex' for all properties in sequence, for 0 <= i < initialLength.
    //   - Provide a valid GCDefferalContext* if they might garbage collect when initializing properties,
    //     otherwise the caller can provide a null GCDefferalContext*.
    //   - Provide a local stack instance of ObjectInitializationScope at the call site.
    //
    JS_EXPORT_PRIVATE static JSArray* tryCreateUninitializedRestricted(ObjectInitializationScope&, GCDeferralContext*, Structure*, unsigned initialLength);
    static JSArray* tryCreateUninitializedRestricted(ObjectInitializationScope& scope, Structure* structure, unsigned initialLength)
    {
        return tryCreateUninitializedRestricted(scope, nullptr, structure, initialLength);
    }

    static void eagerlyInitializeButterfly(ObjectInitializationScope&, JSArray*, unsigned initialLength);

    JS_EXPORT_PRIVATE static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool throwException);

    JS_EXPORT_PRIVATE static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);

    DECLARE_EXPORT_INFO;

    // OK if we know this is a JSArray, but not if it could be an object of a derived class; for RuntimeArray this always returns 0.
    unsigned length() const { return getArrayLength(); }

    // OK to use on new arrays, but not if it might be a RegExpMatchArray or RuntimeArray.
    JS_EXPORT_PRIVATE bool setLength(JSGlobalObject*, unsigned, bool throwException = false);

    void pushInline(JSGlobalObject*, JSValue);
    JS_EXPORT_PRIVATE void push(JSGlobalObject*, JSValue);
    JS_EXPORT_PRIVATE JSValue pop(JSGlobalObject*);

    static JSArray* fastSlice(JSGlobalObject*, JSObject* source, uint64_t startIndex, uint64_t count);

    bool holesMustForwardToPrototype() const;
    bool canFastCopy(JSArray* otherArray) const;
    bool canFastAppend(JSArray* otherArray) const;
    bool canDoFastIndexedAccess() const;
    // This function returns NonArray if the indexing types are not compatable for copying.
    IndexingType mergeIndexingTypeForCopying(IndexingType other, bool allowPromotion);
    bool appendMemcpy(JSGlobalObject*, VM&, unsigned startIndex, JSArray* otherArray);
    bool appendMemcpy(JSGlobalObject*, VM&, unsigned startIndex, IndexingType, std::span<const EncodedJSValue>);

    bool fastFill(VM&, unsigned startIndex, unsigned endIndex, JSValue);

    JSArray* fastToReversed(JSGlobalObject*, uint64_t length);

    ALWAYS_INLINE bool definitelyNegativeOneMiss() const;

    enum ShiftCountMode {
        // This form of shift hints that we're doing queueing. With this assumption in hand,
        // we convert to ArrayStorage, which has queue optimizations.
        ShiftCountForShift,

        // This form of shift hints that we're just doing care and feeding on an array that
        // is probably typically used for ordinary accesses. With this assumption in hand,
        // we try to preserve whatever indexing type it has already.
        ShiftCountForSplice
    };

    template<ShiftCountMode shiftCountMode>
    bool shiftCount(JSGlobalObject* globalObject, unsigned& startIndex, unsigned count)
    {
        constexpr unsigned shiftThreashold = 128;
        UNUSED_VARIABLE(shiftThreashold);
        if constexpr (shiftCountMode == ShiftCountForShift)
            return shiftCountWithAnyIndexingType(globalObject, startIndex, count, shiftThreashold);
        else if constexpr (shiftCountMode == ShiftCountForSplice)
            return shiftCountWithAnyIndexingType(globalObject, startIndex, count, UINT32_MAX);
        RELEASE_ASSERT_NOT_REACHED();
        return false;
    }

    bool unshiftCount(JSGlobalObject* globalObject, unsigned startIndex, unsigned count)
    {
        return unshiftCountWithAnyIndexingType(globalObject, startIndex, count);
    }

    JS_EXPORT_PRIVATE void fillArgList(JSGlobalObject*, MarkedArgumentBuffer&);
    JS_EXPORT_PRIVATE void copyToArguments(JSGlobalObject*, JSValue* firstElementDest, unsigned offset, unsigned length);

    JS_EXPORT_PRIVATE bool isIteratorProtocolFastAndNonObservable();

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue, IndexingType);
        
protected:
#if ASSERT_ENABLED
    void finishCreation(VM& vm)
    {
        Base::finishCreation(vm);
        ASSERT(jsDynamicCast<JSArray*>(this));
        ASSERT_WITH_MESSAGE(type() == ArrayType || type() == DerivedArrayType, "Instance inheriting JSArray should have either ArrayType or DerivedArrayType");
    }
#endif

    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);

    static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    JS_EXPORT_PRIVATE static void getOwnSpecialPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);

private:
    bool isLengthWritable()
    {
        ArrayStorage* storage = arrayStorageOrNull();
        if (!storage)
            return true;
        SparseArrayValueMap* map = storage->m_sparseMap.get();
        return !map || !map->lengthIsReadOnly();
    }
        
    bool shiftCountWithAnyIndexingType(JSGlobalObject*, unsigned& startIndex, unsigned count, unsigned shiftArrayStorageThreshold);
    JS_EXPORT_PRIVATE bool shiftCountWithArrayStorage(VM&, unsigned startIndex, unsigned count, ArrayStorage*);

    bool unshiftCountWithAnyIndexingType(JSGlobalObject*, unsigned startIndex, unsigned count);
    bool unshiftCountWithArrayStorage(JSGlobalObject*, unsigned startIndex, unsigned count, ArrayStorage*);
    bool unshiftCountSlowCase(const AbstractLocker&, VM&, DeferGC&, bool, unsigned);

    bool setLengthWithArrayStorage(JSGlobalObject*, unsigned newLength, bool throwException, ArrayStorage*);
    void setLengthWritable(JSGlobalObject*, bool writable);
};

inline Butterfly* tryCreateArrayButterfly(VM& vm, JSObject* intendedOwner, unsigned initialLength)
{
    Butterfly* butterfly = Butterfly::tryCreate(
        vm, intendedOwner, 0, 0, true, baseIndexingHeaderForArrayStorage(initialLength),
        ArrayStorage::sizeFor(BASE_ARRAY_STORAGE_VECTOR_LEN));
    if (!butterfly)
        return nullptr;
    ArrayStorage* storage = butterfly->arrayStorage();
    storage->m_sparseMap.clear();
    storage->m_indexBias = 0;
    storage->m_numValuesInVector = 0;
    return butterfly;
}

inline JSArray* JSArray::tryCreate(VM& vm, Structure* structure, unsigned initialLength, unsigned vectorLengthHint)
{
    ASSERT(vectorLengthHint >= initialLength);
    unsigned outOfLineStorage = structure->outOfLineCapacity();

    Butterfly* butterfly;
    IndexingType indexingType = structure->indexingType();
    if (LIKELY(!hasAnyArrayStorage(indexingType))) {
        ASSERT(
            hasUndecided(indexingType)
            || hasInt32(indexingType)
            || hasDouble(indexingType)
            || hasContiguous(indexingType));

        if (UNLIKELY(vectorLengthHint > MAX_STORAGE_VECTOR_LENGTH))
            return nullptr;

        unsigned vectorLength = Butterfly::optimalContiguousVectorLength(structure, vectorLengthHint);
        void* temp = vm.auxiliarySpace().allocate(
            vm,
            Butterfly::totalSize(0, outOfLineStorage, true, vectorLength * sizeof(EncodedJSValue)),
            nullptr, AllocationFailureMode::ReturnNull);
        if (!temp)
            return nullptr;
        butterfly = Butterfly::fromBase(temp, 0, outOfLineStorage);
        butterfly->setVectorLength(vectorLength);
        butterfly->setPublicLength(initialLength);
        if (hasDouble(indexingType))
            clearArray(butterfly->contiguousDouble().data(), vectorLength);
        else
            clearArray(butterfly->contiguous().data(), vectorLength);
    } else {
        ASSERT(
            indexingType == ArrayWithSlowPutArrayStorage
            || indexingType == ArrayWithArrayStorage);
        butterfly = tryCreateArrayButterfly(vm, nullptr, initialLength);
        if (!butterfly)
            return nullptr;
        for (unsigned i = 0; i < BASE_ARRAY_STORAGE_VECTOR_LEN; ++i)
            butterfly->arrayStorage()->m_vector[i].clear();
    }

    return createWithButterfly(vm, nullptr, structure, butterfly);
}

inline JSArray* JSArray::tryCreate(VM& vm, Structure* structure, unsigned initialLength)
{
    return tryCreate(vm, structure, initialLength, initialLength);
}

inline JSArray* JSArray::create(VM& vm, Structure* structure, unsigned initialLength)
{
    JSArray* result = JSArray::tryCreate(vm, structure, initialLength);
    RELEASE_ASSERT(result);

    return result;
}

inline JSArray* JSArray::createWithButterfly(VM& vm, GCDeferralContext* deferralContext, Structure* structure, Butterfly* butterfly)
{
    JSArray* array = new (NotNull, allocateCell<JSArray>(vm, deferralContext)) JSArray(vm, structure, butterfly);
    array->finishCreation(vm);
    return array;
}

ALWAYS_INLINE JSValue getProperty(JSGlobalObject*, JSObject*, uint64_t index);

enum class ArrayFillMode {
    Undefined,
    Empty,
};

template<ArrayFillMode fillMode>
bool moveArrayElements(JSGlobalObject* globalObject, VM& vm, JSArray* target, unsigned targetOffset, JSArray* source, unsigned sourceLength)
{
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (LIKELY(!hasAnyArrayStorage(source->indexingType()) && !source->holesMustForwardToPrototype())) {
        for (unsigned i = 0; i < sourceLength; ++i) {
            JSValue value = source->tryGetIndexQuickly(i);
            if constexpr (fillMode == ArrayFillMode::Empty) {
                if (!value)
                    continue;
            } else {
                if (!value)
                    value = jsUndefined();
            }
            target->putDirectIndex(globalObject, targetOffset + i, value, 0, PutDirectIndexShouldThrow);
            RETURN_IF_EXCEPTION(scope, false);
        }
    } else {
        for (unsigned i = 0; i < sourceLength; ++i) {
            JSValue value = getProperty(globalObject, source, i);
            RETURN_IF_EXCEPTION(scope, false);
            if constexpr (fillMode == ArrayFillMode::Empty) {
                if (!value)
                    continue;
            } else {
                if (!value)
                    value = jsUndefined();
            }
            target->putDirectIndex(globalObject, targetOffset + i, value, 0, PutDirectIndexShouldThrow);
            RETURN_IF_EXCEPTION(scope, false);
        }
    }
    return true;
}

template<typename T>
void clearElement(T& element)
{
    element.clear();
}

template<>
void clearElement(double& element);

template<ArrayFillMode fillMode, typename T, typename U>
ALWAYS_INLINE void copyArrayElements(T* buffer, unsigned offset, U* source, unsigned sourceSize, IndexingType sourceType)
{
    if (sourceType == ArrayWithUndecided) {
        if constexpr (fillMode == ArrayFillMode::Empty) {
            for (unsigned i = 0; i < sourceSize; ++i)
                clearElement<T>(buffer[i + offset]);
        } else {
            for (unsigned i = 0; i < sourceSize; ++i)
                buffer[i + offset].setWithoutWriteBarrier(jsUndefined());
        }
        return;
    }

    if constexpr (std::is_same_v<T, U>) {
        if constexpr (fillMode == ArrayFillMode::Empty) {
            if constexpr (std::is_same_v<T, double>)
                memcpy(buffer + offset, source, sizeof(double) * sourceSize);
            else
                gcSafeMemcpy(buffer + offset, source, sizeof(JSValue) * sourceSize);
            return;
        } else {
            for (unsigned i = 0; i < sourceSize; ++i) {
                JSValue value = source[i].get();
                if (!value)
                    value = jsUndefined();
                buffer[i + offset].setWithoutWriteBarrier(value);
            }
        }
    } else if constexpr (std::is_same_v<T, double>) {
        ASSERT(sourceType == ArrayWithInt32);
        static_assert(fillMode == ArrayFillMode::Empty);
        for (unsigned i = 0; i < sourceSize; ++i) {
            JSValue value = source[i].get();
            if (value)
                buffer[i + offset] = value.asInt32();
            else
                buffer[i + offset] = PNaN;
        }
    } else {
        static_assert(std::is_same_v<U, double>);
        for (unsigned i = 0; i < sourceSize; ++i) {
            double value = source[i];
            if (value == value)
                buffer[i + offset].setWithoutWriteBarrier(JSValue(JSValue::EncodeAsDouble, value));
            else {
                if constexpr (fillMode == ArrayFillMode::Undefined)
                    buffer[i + offset].setWithoutWriteBarrier(jsUndefined());
                else
                    buffer[i + offset].clear();
            }
        }
    }
}

JSArray* asArray(JSValue);

inline JSArray* asArray(JSCell* cell)
{
    ASSERT(cell->inherits<JSArray>());
    return jsCast<JSArray*>(cell);
}

inline JSArray* asArray(JSValue value)
{
    return asArray(value.asCell());
}

inline bool isJSArray(JSCell* cell)
{
    ASSERT((cell->classInfo() == JSArray::info()) == (cell->type() == ArrayType));
    return cell->type() == ArrayType;
}

inline bool isJSArray(JSValue v) { return v.isCell() && isJSArray(v.asCell()); }

JS_EXPORT_PRIVATE JSArray* constructArray(JSGlobalObject*, Structure*, const ArgList& values);
JS_EXPORT_PRIVATE JSArray* constructArray(JSGlobalObject*, Structure*, const JSValue* values, unsigned length);
JS_EXPORT_PRIVATE JSArray* constructArrayNegativeIndexed(JSGlobalObject*, Structure*, const JSValue* values, unsigned length);

ALWAYS_INLINE uint64_t toLength(JSGlobalObject*, JSObject*);

template<ArrayFillMode fillMode>
JSArray* tryCloneArrayFromFast(JSGlobalObject*, JSValue arrayValue);

ALWAYS_INLINE bool isHole(double value);
ALWAYS_INLINE bool isHole(const WriteBarrier<Unknown>& value);
template<typename T>
ALWAYS_INLINE bool containsHole(const T* data, unsigned length);

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
