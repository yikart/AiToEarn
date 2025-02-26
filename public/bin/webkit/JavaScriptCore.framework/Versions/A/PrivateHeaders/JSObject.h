/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2024 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "ArrayConventions.h"
#include "ArrayStorage.h"
#include "Butterfly.h"
#include "CPU.h"
#include "CagedBarrierPtr.h"
#include "CallFrame.h"
#include "ClassInfo.h"
#include "CustomGetterSetter.h"
#include "DOMAttributeGetterSetter.h"
#include "DeletePropertySlot.h"
#include "Heap.h"
#include "IndexingHeaderInlines.h"
#include "JSCast.h"
#include "MathCommon.h"
#include "ObjectInitializationScope.h"
#include "PropertySlot.h"
#include "PropertyStorage.h"
#include "PutDirectIndexMode.h"
#include "PutPropertySlot.h"
#include "Structure.h"
#include "StructureTransitionTable.h"
#include "VM.h"
#include "JSString.h"
#include "SparseArrayValueMap.h"
#include <wtf/StdLibExtras.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {
namespace DOMJIT {
class Signature;
}

inline JSCell* getJSFunction(JSValue value)
{
    if (value.isCell() && (value.asCell()->type() == JSFunctionType))
        return value.asCell();
    return nullptr;
}

class ArrayProfile;
class Exception;
class GetterSetter;
class InternalFunction;
class JSFunction;
class LLIntOffsetsExtractor;
class MarkedBlock;
class PropertyDescriptor;
class PropertyNameArray;
class Structure;
class ThrowScope;
struct HashTable;
struct HashTableValue;

JS_EXPORT_PRIVATE Exception* throwTypeError(JSGlobalObject*, ThrowScope&, const String&);
extern JS_EXPORT_PRIVATE const ASCIILiteral NonExtensibleObjectPropertyDefineError;
extern JS_EXPORT_PRIVATE const ASCIILiteral ReadonlyPropertyWriteError;
extern JS_EXPORT_PRIVATE const ASCIILiteral ReadonlyPropertyChangeError;
extern JS_EXPORT_PRIVATE const ASCIILiteral UnableToDeletePropertyError;
extern JS_EXPORT_PRIVATE const ASCIILiteral UnconfigurablePropertyChangeAccessMechanismError;
extern JS_EXPORT_PRIVATE const ASCIILiteral UnconfigurablePropertyChangeConfigurabilityError;
extern JS_EXPORT_PRIVATE const ASCIILiteral UnconfigurablePropertyChangeEnumerabilityError;
extern JS_EXPORT_PRIVATE const ASCIILiteral UnconfigurablePropertyChangeWritabilityError;
extern JS_EXPORT_PRIVATE const ASCIILiteral PrototypeValueCanOnlyBeAnObjectOrNullTypeError;

class JSFinalObject;

#if ASSERT_ENABLED
#define JS_EXPORT_PRIVATE_IF_ASSERT_ENABLED JS_EXPORT_PRIVATE
#else
#define JS_EXPORT_PRIVATE_IF_ASSERT_ENABLED
#endif

class JSObject : public JSCell {
    friend class BatchedTransitionOptimizer;
    friend class JIT;
    friend class JSCell;
    friend class JSFinalObject;
    friend class MarkedBlock;

    enum PutMode : uint8_t {
        PutModePut,
        PutModeDefineOwnProperty,
        PutModeDefineOwnPropertyForJSONSlow,
    };

public:
    using Base = JSCell;

    DECLARE_VISIT_CHILDREN_WITH_MODIFIER(JS_EXPORT_PRIVATE);

    JS_EXPORT_PRIVATE static size_t estimatedSize(JSCell*, VM&);
    JS_EXPORT_PRIVATE static void analyzeHeap(JSCell*, HeapAnalyzer&);

    JS_EXPORT_PRIVATE static String calculatedClassName(JSObject*);

    // This is the fully virtual [[GetPrototypeOf]] internal function defined
    // in the ECMAScript 6 specification. Use this when doing a [[GetPrototypeOf]] 
    // operation as dictated in the specification.
    JSValue getPrototype(VM&, JSGlobalObject*);
    JS_EXPORT_PRIVATE static JSValue getPrototype(JSObject*, JSGlobalObject*);
    // This gets the prototype directly off of the structure. This does not do
    // dynamic dispatch on the getPrototype method table method. It is not valid 
    // to use this when performing a [[GetPrototypeOf]] operation in the specification.
    // It is valid to use though when you know that you want to directly get it
    // without consulting the method table. This is akin to getting the [[Prototype]]
    // internal field directly as described in the specification.
    JSValue getPrototypeDirect() const;

    // This sets the prototype without checking for cycles and without
    // doing dynamic dispatch on [[SetPrototypeOf]] operation in the specification.
    // It is not valid to use this when performing a [[SetPrototypeOf]] operation in
    // the specification. It is valid to use though when you know that you want to directly
    // set it without consulting the method table and when you definitely won't
    // introduce a cycle in the prototype chain. This is akin to setting the
    // [[Prototype]] internal field directly as described in the specification.
    JS_EXPORT_PRIVATE void setPrototypeDirect(VM&, JSValue prototype);
private:
    // This is OrdinarySetPrototypeOf in the specification. Section 9.1.2.1
    // https://tc39.github.io/ecma262/#sec-ordinarysetprototypeof
    JS_EXPORT_PRIVATE bool setPrototypeWithCycleCheck(VM&, JSGlobalObject*, JSValue prototype, bool shouldThrowIfCantSet);
public:
    // This is the fully virtual [[SetPrototypeOf]] internal function defined
    // in the ECMAScript 6 specification. Use this when doing a [[SetPrototypeOf]] 
    // operation as dictated in the specification.
    bool setPrototype(VM&, JSGlobalObject*, JSValue prototype, bool shouldThrowIfCantSet = false);
    JS_EXPORT_PRIVATE static bool setPrototype(JSObject*, JSGlobalObject*, JSValue prototype, bool shouldThrowIfCantSet);
        
    inline bool mayInterceptIndexedAccesses();

    JSValue get(JSGlobalObject*, PropertyName) const;
    JSValue get(JSGlobalObject*, unsigned propertyName) const;
    JSValue get(JSGlobalObject*, uint64_t propertyName) const;

    template<typename T, typename PropertyNameType>
    T getAs(JSGlobalObject*, PropertyNameType) const;

    template<bool checkNullStructure = false>
    bool getPropertySlot(JSGlobalObject*, PropertyName, PropertySlot&);
    bool getPropertySlot(JSGlobalObject*, unsigned propertyName, PropertySlot&);
    bool getPropertySlot(JSGlobalObject*, uint64_t propertyName, PropertySlot&);
    template<typename CallbackWhenNoException> typename std::invoke_result<CallbackWhenNoException, bool, PropertySlot&>::type getPropertySlot(JSGlobalObject*, PropertyName, CallbackWhenNoException) const;
    template<typename CallbackWhenNoException> typename std::invoke_result<CallbackWhenNoException, bool, PropertySlot&>::type getPropertySlot(JSGlobalObject*, PropertyName, PropertySlot&, CallbackWhenNoException) const;

    template<typename PropertyNameType> JSValue getIfPropertyExists(JSGlobalObject*, const PropertyNameType&);
    bool noSideEffectMayHaveNonIndexProperty(VM&, PropertyName);

    enum class SortMode { Default, Ascending };
    template<SortMode mode = SortMode::Default, typename Functor>
    void forEachOwnIndexedProperty(JSGlobalObject*, const Functor&);

private:
    static bool getOwnPropertySlotImpl(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
public:
    JS_EXPORT_PRIVATE_IF_ASSERT_ENABLED static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);

    JS_EXPORT_PRIVATE static bool getOwnPropertySlotByIndex(JSObject*, JSGlobalObject*, unsigned propertyName, PropertySlot&);
    bool getOwnPropertySlotInline(JSGlobalObject*, PropertyName, PropertySlot&);

    // The key difference between this and getOwnPropertySlot is that getOwnPropertySlot
    // currently returns incorrect results for the DOM window (with non-own properties)
    // being returned. Once this is fixed we should migrate code & remove this method.
    JS_EXPORT_PRIVATE bool getOwnPropertyDescriptor(JSGlobalObject*, PropertyName, PropertyDescriptor&);

    static bool getPrivateFieldSlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    inline bool hasPrivateField(JSGlobalObject*, PropertyName);
    inline bool getPrivateField(JSGlobalObject*, PropertyName, PropertySlot&);
    inline void setPrivateField(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    inline void definePrivateField(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    inline bool hasPrivateBrand(JSGlobalObject*, JSValue brand);
    inline void checkPrivateBrand(JSGlobalObject*, JSValue brand);
    inline void setPrivateBrand(JSGlobalObject*, JSValue brand);

    unsigned getArrayLength() const
    {
        if (!hasIndexedProperties(indexingType()))
            return 0;
        return m_butterfly->publicLength();
    }
        
    unsigned getVectorLength()
    {
        if (!hasIndexedProperties(indexingType()))
            return 0;
        return m_butterfly->vectorLength();
    }
    
    bool canHaveExistingOwnIndexedGetterSetterProperties()
    {
        if (!hasIndexedProperties(indexingType()))
            return false;

        switch (indexingType()) {
        case ALL_BLANK_INDEXING_TYPES:
        case ALL_UNDECIDED_INDEXING_TYPES:
        case ALL_INT32_INDEXING_TYPES:
        case ALL_CONTIGUOUS_INDEXING_TYPES:
        case ALL_DOUBLE_INDEXING_TYPES:
            return false;
        case ALL_ARRAY_STORAGE_INDEXING_TYPES: {
            SparseArrayValueMap* map = m_butterfly->arrayStorage()->m_sparseMap.get();
            if (!map)
                return false;
            return map->hasAnyKindOfGetterSetterProperties();
        }
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    // This is only valid after using canPerformFastPropertyEnumerationCommon().
    // This code is not checking getOwnPropertySlot override etc.
    unsigned canHaveExistingOwnIndexedProperties() const
    {
        if (!hasIndexedProperties(indexingType()))
            return false;

        switch (indexingType()) {
        case ALL_BLANK_INDEXING_TYPES:
        case ALL_UNDECIDED_INDEXING_TYPES:
            return false;
        case ALL_INT32_INDEXING_TYPES:
        case ALL_CONTIGUOUS_INDEXING_TYPES:
        case ALL_DOUBLE_INDEXING_TYPES:
            return m_butterfly->publicLength();
        case ALL_ARRAY_STORAGE_INDEXING_TYPES: {
            ArrayStorage* storage = m_butterfly->arrayStorage();
            unsigned usedVectorLength = std::min(storage->length(), storage->vectorLength());
            if (usedVectorLength)
                return true;
            SparseArrayValueMap* map = storage->m_sparseMap.get();
            if (!map)
                return false;
            return map->size();
        }
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    static bool putInlineForJSObject(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    
    JS_EXPORT_PRIVATE static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    static bool mightBeSpecialProperty(VM&, JSType, UniquedStringImpl*);
    JS_EXPORT_PRIVATE NEVER_INLINE static bool definePropertyOnReceiver(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    // putByIndex assumes that the receiver is this JSCell object.
    JS_EXPORT_PRIVATE static bool putByIndex(JSCell*, JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow);
        
    // This performs the ECMAScript Set() operation.
    ALWAYS_INLINE bool putByIndexInline(JSGlobalObject* globalObject, unsigned propertyName, JSValue value, bool shouldThrow)
    {
        VM& vm = getVM(globalObject);
        if (trySetIndexQuickly(vm, propertyName, value))
            return true;
        return methodTable()->putByIndex(this, globalObject, propertyName, value, shouldThrow);
    }

    ALWAYS_INLINE bool putByIndexInline(JSGlobalObject* globalObject, uint64_t propertyName, JSValue value, bool shouldThrow)
    {
        VM& vm = getVM(globalObject);
        if (LIKELY(propertyName <= MAX_ARRAY_INDEX))
            return putByIndexInline(globalObject, static_cast<uint32_t>(propertyName), value, shouldThrow);

        ASSERT(propertyName <= maxSafeInteger());
        PutPropertySlot slot(this, shouldThrow);
        return methodTable()->put(this, globalObject, Identifier::from(vm, propertyName), value, slot);
    }
        
    // This is similar to the putDirect* methods:
    //  - the prototype chain is not consulted
    //  - accessors are not called.
    //  - it will ignore extensibility and read-only properties if PutDirectIndexLikePutDirect is passed as the mode (the default).
    // This method creates a property with attributes writable, enumerable and configurable all set to true if attributes is zero,
    // otherwise, it creates a property with the provided attributes. Semantically, this is performing defineOwnProperty.
    bool putDirectIndex(JSGlobalObject* globalObject, unsigned propertyName, JSValue value, unsigned attributes, PutDirectIndexMode mode)
    {
        ASSERT(!value.isCustomGetterSetter());
        auto canSetIndexQuicklyForPutDirect = [&] () -> bool {
            switch (indexingMode()) {
            case ALL_BLANK_INDEXING_TYPES:
            case ALL_UNDECIDED_INDEXING_TYPES:
                return false;
            case ALL_WRITABLE_INT32_INDEXING_TYPES:
            case ALL_WRITABLE_DOUBLE_INDEXING_TYPES:
            case ALL_WRITABLE_CONTIGUOUS_INDEXING_TYPES:
            case ALL_ARRAY_STORAGE_INDEXING_TYPES:
                return propertyName < m_butterfly->vectorLength();
            default:
                if (isCopyOnWrite(indexingMode()))
                    return false;
                RELEASE_ASSERT_NOT_REACHED();
                return false;
            }
        };
        
        if (!attributes && canSetIndexQuicklyForPutDirect()) {
            setIndexQuickly(getVM(globalObject), propertyName, value);
            return true;
        }
        return putDirectIndexSlowOrBeyondVectorLength(globalObject, propertyName, value, attributes, mode);
    }
    // This is semantically equivalent to performing defineOwnProperty(propertyName, {configurable:true, writable:true, enumerable:true, value:value}).
    bool putDirectIndex(JSGlobalObject* globalObject, unsigned propertyName, JSValue value)
    {
        return putDirectIndex(globalObject, propertyName, value, 0, PutDirectIndexLikePutDirect);
    }

    ALWAYS_INLINE bool putDirectIndex(JSGlobalObject* globalObject, uint64_t propertyName, JSValue value, unsigned attributes, PutDirectIndexMode mode)
    {
        if (LIKELY(propertyName <= MAX_ARRAY_INDEX))
            return putDirectIndex(globalObject, static_cast<uint32_t>(propertyName), value, attributes, mode);
        return putDirect(getVM(globalObject), Identifier::from(getVM(globalObject), propertyName), value, attributes);
    }

    // A generally non-throwing version of putDirect and putDirectIndex.
    // However, it's only guaranteed to not throw based on what the receiver is.
    // For example, if the receiver is a ProxyObject, this is not guaranteed, since
    // it may call into arbitrary JS code. It's the responsibility of the user of
    // this API to ensure that the receiver object is a well known type if they
    // want to ensure that this won't throw an exception.
    JS_EXPORT_PRIVATE bool putDirectMayBeIndex(JSGlobalObject*, PropertyName, JSValue);
        
    bool hasIndexingHeader() const
    {
        return structure()->hasIndexingHeader(this);
    }

    bool canGetIndexQuicklyForTypedArray(unsigned) const;
    JSValue getIndexQuicklyForTypedArray(unsigned, ArrayProfile* = nullptr) const;
    
    bool canGetIndexQuickly(unsigned i) const
    {
        const Butterfly* butterfly = this->butterfly();
        switch (indexingType()) {
        case ALL_BLANK_INDEXING_TYPES:
            return canGetIndexQuicklyForTypedArray(i);
        case ALL_UNDECIDED_INDEXING_TYPES:
            return false;
        case ALL_INT32_INDEXING_TYPES:
        case ALL_CONTIGUOUS_INDEXING_TYPES:
            return i < butterfly->vectorLength() && butterfly->contiguous().at(this, i);
        case ALL_DOUBLE_INDEXING_TYPES: {
            if (i >= butterfly->vectorLength())
                return false;
            double value = butterfly->contiguousDouble().at(this, i);
            if (value != value)
                return false;
            return true;
        }
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            return i < butterfly->arrayStorage()->vectorLength() && butterfly->arrayStorage()->m_vector[i];
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return false;
        }
    }

    bool canGetIndexQuickly(uint64_t i) const
    {
        ASSERT(i <= maxSafeInteger());
        if (LIKELY(i <= MAX_ARRAY_INDEX))
            return canGetIndexQuickly(static_cast<uint32_t>(i));
        return false;
    }
        
    JSValue getIndexQuickly(unsigned i) const
    {
        const Butterfly* butterfly = this->butterfly();
        switch (indexingType()) {
        case ALL_INT32_INDEXING_TYPES:
            return jsNumber(butterfly->contiguous().at(this, i).get().asInt32());
        case ALL_CONTIGUOUS_INDEXING_TYPES:
            return butterfly->contiguous().at(this, i).get();
        case ALL_DOUBLE_INDEXING_TYPES:
            return JSValue(JSValue::EncodeAsDouble, butterfly->contiguousDouble().at(this, i));
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            return butterfly->arrayStorage()->m_vector[i].get();
        case ALL_BLANK_INDEXING_TYPES:
            return getIndexQuicklyForTypedArray(i);
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return JSValue();
        }
    }

    // Uses the (optional) array profile to set the m_mayBeLargeTypedArray bit when relevant
    JSValue tryGetIndexQuickly(unsigned i, ArrayProfile* arrayProfile = nullptr) const
    {
        const Butterfly* butterfly = this->butterfly();
        switch (indexingType()) {
        case ALL_BLANK_INDEXING_TYPES:
            if (canGetIndexQuicklyForTypedArray(i))
                return getIndexQuicklyForTypedArray(i, arrayProfile);
            break;
        case ALL_UNDECIDED_INDEXING_TYPES:
            break;
        case ALL_INT32_INDEXING_TYPES:
            if (i < butterfly->publicLength()) {
                JSValue result = butterfly->contiguous().at(this, i).get();
                ASSERT(result.isInt32() || !result);
                return result;
            }
            break;
        case ALL_CONTIGUOUS_INDEXING_TYPES:
            if (i < butterfly->publicLength())
                return butterfly->contiguous().at(this, i).get();
            break;
        case ALL_DOUBLE_INDEXING_TYPES: {
            if (i >= butterfly->publicLength())
                break;
            double result = butterfly->contiguousDouble().at(this, i);
            if (result != result)
                break;
            return JSValue(JSValue::EncodeAsDouble, result);
        }
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            if (i < butterfly->arrayStorage()->vectorLength())
                return butterfly->arrayStorage()->m_vector[i].get();
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            break;
        }
        return JSValue();
    }

    JSValue tryGetIndexQuickly(uint64_t i) const
    {
        ASSERT(i <= maxSafeInteger());
        if (LIKELY(i <= MAX_ARRAY_INDEX))
            return tryGetIndexQuickly(static_cast<uint32_t>(i));
        return JSValue();
    }
        
    JSValue getDirectIndex(JSGlobalObject* globalObject, unsigned i)
    {
        if (JSValue result = tryGetIndexQuickly(i))
            return result;
        PropertySlot slot(this, PropertySlot::InternalMethodType::Get);
        if (methodTable()->getOwnPropertySlotByIndex(this, globalObject, i, slot))
            return slot.getValue(globalObject, i);
        return JSValue();
    }
        
    JSValue getIndex(JSGlobalObject* globalObject, uint64_t i) const
    {
        if (JSValue result = tryGetIndexQuickly(i))
            return result;
        return get(globalObject, i);
    }

    void setIndexQuicklyForTypedArray(unsigned, JSValue);
    void setIndexQuicklyForArrayStorageIndexingType(VM&, unsigned, JSValue);

    // Return true to indicate success
    // Use the (optional) array profile to set the m_mayBeLargeTypedArray bit when relevant
    bool trySetIndexQuicklyForTypedArray(unsigned, JSValue, ArrayProfile*);
    bool trySetIndexQuickly(VM& vm, unsigned i, JSValue v, ArrayProfile* arrayProfile = nullptr)
    {
        Butterfly* butterfly = this->butterfly();
        switch (indexingMode()) {
        case ALL_BLANK_INDEXING_TYPES:
            return trySetIndexQuicklyForTypedArray(i, v, arrayProfile);
        case ALL_UNDECIDED_INDEXING_TYPES:
            return false;
        case ALL_WRITABLE_INT32_INDEXING_TYPES: {
            if (i >= butterfly->vectorLength())
                return false;
            if (!v.isInt32()) {
                convertInt32ToDoubleOrContiguousWhilePerformingSetIndex(vm, i, v);
                return true;
            }
            FALLTHROUGH;
        }
        case ALL_WRITABLE_CONTIGUOUS_INDEXING_TYPES: {
            if (i >= butterfly->vectorLength())
                return false;
            butterfly->contiguous().at(this, i).setWithoutWriteBarrier(v);
            if (i >= butterfly->publicLength())
                butterfly->setPublicLength(i + 1);
            vm.writeBarrier(this, v);
            return true;
        }
        case ALL_WRITABLE_DOUBLE_INDEXING_TYPES: {
            if (i >= butterfly->vectorLength())
                return false;
            if (!v.isNumber()) {
                convertDoubleToContiguousWhilePerformingSetIndex(vm, i, v);
                return true;
            }
            double value = v.asNumber();
            if (value != value) {
                convertDoubleToContiguousWhilePerformingSetIndex(vm, i, v);
                return true;
            }
            butterfly->contiguousDouble().at(this, i) = value;
            if (i >= butterfly->publicLength())
                butterfly->setPublicLength(i + 1);
            return true;
        }
        case NonArrayWithArrayStorage:
        case ArrayWithArrayStorage:
            if (i >= butterfly->vectorLength())
                return false;
            setIndexQuicklyForArrayStorageIndexingType(vm, i, v);
            return true;
        case NonArrayWithSlowPutArrayStorage:
        case ArrayWithSlowPutArrayStorage:
            if (i >= butterfly->arrayStorage()->vectorLength() || !butterfly->arrayStorage()->m_vector[i])
                return false;
            setIndexQuicklyForArrayStorageIndexingType(vm, i, v);
            return true;
        default:
            RELEASE_ASSERT(isCopyOnWrite(indexingMode()));
            return false;
        }
    }

    void setIndexQuickly(VM& vm, unsigned i, JSValue v)
    {
        Butterfly* butterfly = m_butterfly.get();
        ASSERT(!isCopyOnWrite(indexingMode()));
        switch (indexingType()) {
        case ALL_INT32_INDEXING_TYPES: {
            ASSERT(i < butterfly->vectorLength());
            if (!v.isInt32()) {
                convertInt32ToDoubleOrContiguousWhilePerformingSetIndex(vm, i, v);
                return;
            }
            FALLTHROUGH;
        }
        case ALL_CONTIGUOUS_INDEXING_TYPES: {
            ASSERT(i < butterfly->vectorLength());
            butterfly->contiguous().at(this, i).setWithoutWriteBarrier(v);
            if (i >= butterfly->publicLength())
                butterfly->setPublicLength(i + 1);
            vm.writeBarrier(this, v);
            break;
        }
        case ALL_DOUBLE_INDEXING_TYPES: {
            ASSERT(i < butterfly->vectorLength());
            if (!v.isNumber()) {
                convertDoubleToContiguousWhilePerformingSetIndex(vm, i, v);
                return;
            }
            double value = v.asNumber();
            if (value != value) {
                convertDoubleToContiguousWhilePerformingSetIndex(vm, i, v);
                return;
            }
            butterfly->contiguousDouble().at(this, i) = value;
            if (i >= butterfly->publicLength())
                butterfly->setPublicLength(i + 1);
            break;
        }
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            setIndexQuicklyForArrayStorageIndexingType(vm, i, v);
            break;
        case ALL_BLANK_INDEXING_TYPES:
            setIndexQuicklyForTypedArray(i, v);
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }

    void initializeIndex(ObjectInitializationScope& scope, unsigned i, JSValue v)
    {
        initializeIndex(scope, i, v, indexingType());
    }

    // NOTE: Clients of this method may call it more than once for any index, and this is supposed
    // to work.
    ALWAYS_INLINE void initializeIndex(ObjectInitializationScope& scope, unsigned i, JSValue v, IndexingType indexingType)
    {
        VM& vm = scope.vm();
        Butterfly* butterfly = m_butterfly.get();
        switch (indexingType) {
        case ALL_UNDECIDED_INDEXING_TYPES: {
            setIndexQuicklyToUndecided(vm, i, v);
            break;
        }
        case ALL_INT32_INDEXING_TYPES: {
            ASSERT(i < butterfly->publicLength());
            ASSERT(i < butterfly->vectorLength());
            if (!v.isInt32()) {
                convertInt32ToDoubleOrContiguousWhilePerformingSetIndex(vm, i, v);
                break;
            }
            FALLTHROUGH;
        }
        case ALL_CONTIGUOUS_INDEXING_TYPES: {
            ASSERT(i < butterfly->publicLength());
            ASSERT(i < butterfly->vectorLength());
            butterfly->contiguous().at(this, i).set(vm, this, v);
            break;
        }
        case ALL_DOUBLE_INDEXING_TYPES: {
            ASSERT(i < butterfly->publicLength());
            ASSERT(i < butterfly->vectorLength());
            if (!v.isNumber()) {
                convertDoubleToContiguousWhilePerformingSetIndex(vm, i, v);
                return;
            }
            double value = v.asNumber();
            if (value != value) {
                convertDoubleToContiguousWhilePerformingSetIndex(vm, i, v);
                return;
            }
            butterfly->contiguousDouble().at(this, i) = value;
            break;
        }
        case ALL_ARRAY_STORAGE_INDEXING_TYPES: {
            ArrayStorage* storage = butterfly->arrayStorage();
            ASSERT(i < storage->length());
            ASSERT(i < storage->m_numValuesInVector);
            storage->m_vector[i].set(vm, this, v);
            break;
        }
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }
        
    void initializeIndexWithoutBarrier(ObjectInitializationScope& scope, unsigned i, JSValue v)
    {
        initializeIndexWithoutBarrier(scope, i, v, indexingType());
    }

    // This version of initializeIndex is for cases where you know that you will not need any
    // barriers. This implies not having any data format conversions.
    ALWAYS_INLINE void initializeIndexWithoutBarrier(ObjectInitializationScope&, unsigned i, JSValue v, IndexingType indexingType)
    {
        Butterfly* butterfly = m_butterfly.get();
        switch (indexingType) {
        case ALL_UNDECIDED_INDEXING_TYPES: {
            RELEASE_ASSERT_NOT_REACHED();
            break;
        }
        case ALL_INT32_INDEXING_TYPES: {
            ASSERT(i < butterfly->publicLength());
            ASSERT(i < butterfly->vectorLength());
            RELEASE_ASSERT(v.isInt32());
            FALLTHROUGH;
        }
        case ALL_CONTIGUOUS_INDEXING_TYPES: {
            ASSERT(i < butterfly->publicLength());
            ASSERT(i < butterfly->vectorLength());
            butterfly->contiguous().at(this, i).setWithoutWriteBarrier(v);
            break;
        }
        case ALL_DOUBLE_INDEXING_TYPES: {
            ASSERT(i < butterfly->publicLength());
            ASSERT(i < butterfly->vectorLength());
            RELEASE_ASSERT(v.isNumber());
            double value = v.asNumber();
            RELEASE_ASSERT(value == value);
            butterfly->contiguousDouble().at(this, i) = value;
            break;
        }
        case ALL_ARRAY_STORAGE_INDEXING_TYPES: {
            ArrayStorage* storage = butterfly->arrayStorage();
            ASSERT(i < storage->length());
            ASSERT(i < storage->m_numValuesInVector);
            storage->m_vector[i].setWithoutWriteBarrier(v);
            break;
        }
        default:
            RELEASE_ASSERT_NOT_REACHED();
        }
    }
        
    bool hasSparseMap()
    {
        switch (indexingType()) {
        case ALL_BLANK_INDEXING_TYPES:
        case ALL_UNDECIDED_INDEXING_TYPES:
        case ALL_INT32_INDEXING_TYPES:
        case ALL_DOUBLE_INDEXING_TYPES:
        case ALL_CONTIGUOUS_INDEXING_TYPES:
            return false;
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            return !!m_butterfly->arrayStorage()->m_sparseMap;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return false;
        }
    }
        
    bool inSparseIndexingMode()
    {
        switch (indexingType()) {
        case ALL_BLANK_INDEXING_TYPES:
        case ALL_UNDECIDED_INDEXING_TYPES:
        case ALL_INT32_INDEXING_TYPES:
        case ALL_DOUBLE_INDEXING_TYPES:
        case ALL_CONTIGUOUS_INDEXING_TYPES:
            return false;
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            return m_butterfly->arrayStorage()->inSparseMode();
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return false;
        }
    }
        
    void enterDictionaryIndexingMode(VM&);

    // putDirect is effectively an unchecked vesion of 'defineOwnProperty':
    //  - the prototype chain is not consulted
    //  - accessors are not called.
    //  - attributes will be respected (after the call the property will exist with the given attributes)
    //  - the property name is assumed to not be an index.
    bool putDirect(VM&, PropertyName, JSValue, unsigned attributes = 0);
    bool putDirect(VM&, PropertyName, JSValue, unsigned attributes, PutPropertySlot&);
    bool putDirect(VM&, PropertyName, JSValue, PutPropertySlot&);
    void putDirectForJSONSlow(VM&, PropertyName, JSValue);
    void putDirectWithoutTransition(VM&, PropertyName, JSValue, unsigned attributes = 0);
    bool putDirectNonIndexAccessor(VM&, PropertyName, GetterSetter*, unsigned attributes);
    void putDirectNonIndexAccessorWithoutTransition(VM&, PropertyName, GetterSetter*, unsigned attributes);
    bool putDirectAccessor(JSGlobalObject*, PropertyName, GetterSetter*, unsigned attributes);
    JS_EXPORT_PRIVATE bool putDirectCustomAccessor(VM&, PropertyName, JSValue, unsigned attributes);
    void putDirectCustomGetterSetterWithoutTransition(VM&, PropertyName, JSValue, unsigned attributes);

    bool putGetter(JSGlobalObject*, PropertyName, JSValue, unsigned attributes);
    bool putSetter(JSGlobalObject*, PropertyName, JSValue, unsigned attributes);

    JS_EXPORT_PRIVATE bool hasProperty(JSGlobalObject*, PropertyName) const;
    JS_EXPORT_PRIVATE bool hasProperty(JSGlobalObject*, unsigned propertyName) const;
    bool hasProperty(JSGlobalObject*, uint64_t propertyName) const;
    bool hasEnumerableProperty(JSGlobalObject*, PropertyName) const;
    bool hasEnumerableProperty(JSGlobalObject*, unsigned propertyName) const;
    bool hasOwnProperty(JSGlobalObject*, PropertyName, PropertySlot&) const;
    bool hasOwnProperty(JSGlobalObject*, PropertyName) const;
    bool hasOwnProperty(JSGlobalObject*, unsigned) const;

    JS_EXPORT_PRIVATE static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    JS_EXPORT_PRIVATE static bool deletePropertyByIndex(JSCell*, JSGlobalObject*, unsigned propertyName);
    bool deleteProperty(JSGlobalObject*, PropertyName);
    bool deleteProperty(JSGlobalObject*, uint32_t propertyName);
    bool deleteProperty(JSGlobalObject*, uint64_t propertyName);

    JSValue ordinaryToPrimitive(JSGlobalObject*, PreferredPrimitiveType) const;

    JS_EXPORT_PRIVATE bool hasInstance(JSGlobalObject*, JSValue value, JSValue hasInstanceValue);
    JS_EXPORT_PRIVATE bool hasInstance(JSGlobalObject*, JSValue);
    static bool defaultHasInstance(JSGlobalObject*, JSValue, JSValue prototypeProperty);

    static constexpr unsigned maximumPrototypeChainDepth = 40000;
    JS_EXPORT_PRIVATE void getPropertyNames(JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    JS_EXPORT_PRIVATE static void getOwnPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    JS_EXPORT_PRIVATE static void getOwnSpecialPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    JS_EXPORT_PRIVATE void getOwnIndexedPropertyNames(JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    JS_EXPORT_PRIVATE void getOwnNonIndexPropertyNames(JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    void getNonReifiedStaticPropertyNames(VM&, PropertyNameArray&, DontEnumPropertiesMode);

    JS_EXPORT_PRIVATE uint32_t getEnumerableLength();

    JS_EXPORT_PRIVATE JSValue toPrimitive(JSGlobalObject*, PreferredPrimitiveType = NoPreference) const;
    JS_EXPORT_PRIVATE double toNumber(JSGlobalObject*) const;
    JS_EXPORT_PRIVATE JSString* toString(JSGlobalObject*) const;

    // This get function only looks at the property map.
    JSValue getDirect(VM& vm, PropertyName propertyName) const
    {
        Structure* structure = this->structure();
        PropertyOffset offset = structure->get(vm, propertyName);
        checkOffset(offset, structure->inlineCapacity());
        return offset != invalidOffset ? getDirect(offset) : JSValue();
    }
    
    JSValue getDirect(VM& vm, PropertyName propertyName, unsigned& attributes) const
    {
        Structure* structure = this->structure();
        PropertyOffset offset = structure->get(vm, propertyName, attributes);
        checkOffset(offset, structure->inlineCapacity());
        return offset != invalidOffset ? getDirect(offset) : JSValue();
    }

    PropertyOffset getDirectOffset(VM& vm, PropertyName propertyName)
    {
        Structure* structure = this->structure();
        PropertyOffset offset = structure->get(vm, propertyName);
        checkOffset(offset, structure->inlineCapacity());
        return offset;
    }

    PropertyOffset getDirectOffset(VM& vm, PropertyName propertyName, unsigned& attributes)
    {
        Structure* structure = this->structure();
        PropertyOffset offset = structure->get(vm, propertyName, attributes);
        checkOffset(offset, structure->inlineCapacity());
        return offset;
    }

    bool hasInlineStorage() const { return structure()->hasInlineStorage(); }
    ConstPropertyStorage inlineStorageUnsafe() const
    {
        return std::bit_cast<ConstPropertyStorage>(this + 1);
    }
    PropertyStorage inlineStorageUnsafe()
    {
        return std::bit_cast<PropertyStorage>(this + 1);
    }
    ConstPropertyStorage inlineStorage() const
    {
        ASSERT(hasInlineStorage());
        return inlineStorageUnsafe();
    }
    PropertyStorage inlineStorage()
    {
        ASSERT(hasInlineStorage());
        return inlineStorageUnsafe();
    }
        
    const Butterfly* butterfly() const { return m_butterfly.get(); }
    Butterfly* butterfly() { return m_butterfly.get(); }
    Dependency fencedButterfly(Butterfly*& butterfly)
    {
        return Dependency::loadAndFence(static_cast<Butterfly**>(butterflyAddress()), butterfly);
    }
    
    ConstPropertyStorage outOfLineStorage() const { return m_butterfly->propertyStorage(); }
    PropertyStorage outOfLineStorage() { return m_butterfly->propertyStorage(); }

    ALWAYS_INLINE const WriteBarrierBase<Unknown>* locationForOffset(PropertyOffset offset) const
    {
        if (isInlineOffset(offset))
            return &inlineStorage()[offsetInInlineStorage(offset)];
        return &outOfLineStorage()[offsetInOutOfLineStorage(offset)];
    }

    ALWAYS_INLINE WriteBarrierBase<Unknown>* locationForOffset(PropertyOffset offset)
    {
        if (isInlineOffset(offset))
            return &inlineStorage()[offsetInInlineStorage(offset)];
        return &outOfLineStorage()[offsetInOutOfLineStorage(offset)];
    }

    void transitionTo(VM&, Structure*);

    bool hasCustomProperties() { return structure()->didTransition(); }

    bool hasNonReifiedStaticProperties()
    {
        return TypeInfo::hasStaticPropertyTable(inlineTypeFlags()) && !structure()->staticPropertiesReified();
    }

    // putOwnDataProperty has 'put' like semantics, however this method:
    //  - assumes the object contains no own getter/setter properties.
    //  - provides no special handling for __proto__
    //  - does not walk the prototype chain (to check for accessors or non-writable properties).
    // This is used by JSLexicalEnvironment.
    bool putOwnDataProperty(VM&, PropertyName, JSValue, PutPropertySlot&);
    bool putOwnDataPropertyMayBeIndex(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);

    void putOwnDataPropertyBatching(VM&, const RefPtr<UniquedStringImpl>*, const EncodedJSValue*, unsigned size);
private:
    void validatePutOwnDataProperty(VM&, PropertyName, JSValue);
public:

    // Fast access to known property offsets.
    ALWAYS_INLINE JSValue getDirect(PropertyOffset offset) const { return locationForOffset(offset)->get(); }
    JSValue getDirect(Locker<JSCellLock>&, Concurrency, Structure* expectedStructure, PropertyOffset) const;
    JSValue getDirectConcurrently(Locker<JSCellLock>&, Structure* expectedStructure, PropertyOffset) const;
    void putDirectOffset(VM& vm, PropertyOffset offset, JSValue value) { locationForOffset(offset)->set(vm, this, value); }
    void putDirectWithoutBarrier(PropertyOffset offset, JSValue value) { locationForOffset(offset)->setWithoutWriteBarrier(value); }

    JS_EXPORT_PRIVATE bool putDirectNativeIntrinsicGetter(VM&, JSGlobalObject*, Identifier, NativeFunction, Intrinsic, unsigned attributes);
    JS_EXPORT_PRIVATE void putDirectNativeIntrinsicGetterWithoutTransition(VM&, JSGlobalObject*, Identifier, NativeFunction, Intrinsic, unsigned attributes);
    JS_EXPORT_PRIVATE bool putDirectNativeFunction(VM&, JSGlobalObject*, const PropertyName&, unsigned functionLength, NativeFunction, ImplementationVisibility, Intrinsic, unsigned attributes);
    JS_EXPORT_PRIVATE bool putDirectNativeFunction(VM&, JSGlobalObject*, const PropertyName&, unsigned functionLength, NativeFunction, ImplementationVisibility, Intrinsic, const DOMJIT::Signature*, unsigned attributes);
    JS_EXPORT_PRIVATE void putDirectNativeFunctionWithoutTransition(VM&, JSGlobalObject*, const PropertyName&, unsigned functionLength, NativeFunction, ImplementationVisibility, Intrinsic, unsigned attributes);

    JS_EXPORT_PRIVATE JSFunction* putDirectBuiltinFunction(VM&, JSGlobalObject*, const PropertyName&, FunctionExecutable*, unsigned attributes);
    JSFunction* putDirectBuiltinFunctionWithoutTransition(VM&, JSGlobalObject*, const PropertyName&, FunctionExecutable*, unsigned attributes);

    JS_EXPORT_PRIVATE static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);
    bool createDataProperty(JSGlobalObject*, PropertyName, JSValue, bool shouldThrow);

    bool isEnvironment() const;
    bool isGlobalObject() const;
    bool isJSLexicalEnvironment() const;
    bool isGlobalLexicalEnvironment() const;
    bool isStrictEvalActivation() const;
    bool isWithScope() const;

    bool isErrorInstance() const;

    JS_EXPORT_PRIVATE void seal(VM&);
    JS_EXPORT_PRIVATE void freeze(VM&);
    JS_EXPORT_PRIVATE static bool preventExtensions(JSObject*, JSGlobalObject*);
    JS_EXPORT_PRIVATE static bool isExtensible(JSObject*, JSGlobalObject*);
    bool isSealed(VM& vm) { return structure()->isSealed(vm); }
    bool isFrozen(VM& vm) { return structure()->isFrozen(vm); }

    JS_EXPORT_PRIVATE bool anyObjectInChainMayInterceptIndexedAccesses() const;
    bool needsSlowPutIndexing() const;

private:
    TransitionKind suggestedArrayStorageTransition() const;
public:
    // You should only call isStructureExtensible() when:
    // - Performing this check in a way that isn't described in the specification 
    //   as calling the virtual [[IsExtensible]] trap.
    // - When you're guaranteed that object->methodTable()->isExtensible isn't
    //   overridden.
    ALWAYS_INLINE bool isStructureExtensible() { return structure()->isStructureExtensible(); }
    // You should call this when performing [[IsExtensible]] trap in a place
    // that is described in the specification. This performs the fully virtual
    // [[IsExtensible]] trap.
    bool isExtensible(JSGlobalObject*);
    bool indexingShouldBeSparse()
    {
        return !isStructureExtensible()
            || structure()->typeInfo().interceptsGetOwnPropertySlotByIndexEvenWhenLengthIsNotZero();
    }

    bool staticPropertiesReified() { return structure()->staticPropertiesReified(); }
    void reifyAllStaticProperties(JSGlobalObject*);

    JS_EXPORT_PRIVATE Butterfly* allocateMoreOutOfLineStorage(VM&, size_t oldSize, size_t newSize);

    // Call this when you do not need to change the structure.
    void setButterfly(VM&, Butterfly*);
    
    // Call this if you do need to change the structure, or if you changed something about a structure
    // in-place.
    void nukeStructureAndSetButterfly(VM&, StructureID oldStructureID, Butterfly*);

    void setStructure(VM&, Structure*);

    JS_EXPORT_PRIVATE void convertToDictionary(VM&);
    JS_EXPORT_PRIVATE void convertToUncacheableDictionary(VM&);

    void flattenDictionaryObject(VM& vm)
    {
        structure()->flattenDictionaryStructure(vm, this);
    }
    void shiftButterflyAfterFlattening(const GCSafeConcurrentJSLocker&, VM&, Structure* structure, size_t outOfLineCapacityAfter);

    JSGlobalObject* globalObject() const
    {
        ASSERT(structure()->globalObject());
        ASSERT(!isGlobalObject() || ((JSObject*)structure()->globalObject()) == this);
        return structure()->globalObject();
    }

    void switchToSlowPutArrayStorage(VM&);
        
    // The receiver is the prototype in this case. The following:
    //
    // asObject(foo->structure()->storedPrototype())->attemptToInterceptPutByIndexOnHoleForPrototype(...)
    //
    // is equivalent to:
    //
    // foo->attemptToInterceptPutByIndexOnHole(...);
    bool attemptToInterceptPutByIndexOnHoleForPrototype(JSGlobalObject*, JSValue thisValue, unsigned propertyName, JSValue, bool shouldThrow, bool& putResult);
        
    // Returns 0 if int32 storage cannot be created - either because
    // indexing should be sparse, we're having a bad time, or because
    // we already have a more general form of storage (double,
    // contiguous, array storage).
    ContiguousJSValues tryMakeWritableInt32(VM& vm)
    {
        if (LIKELY(hasInt32(indexingType()) && !isCopyOnWrite(indexingMode())))
            return m_butterfly->contiguousInt32();
            
        return tryMakeWritableInt32Slow(vm);
    }
        
    // Returns 0 if double storage cannot be created - either because
    // indexing should be sparse, we're having a bad time, or because
    // we already have a more general form of storage (contiguous,
    // or array storage).
    ContiguousDoubles tryMakeWritableDouble(VM& vm)
    {
        if (LIKELY(hasDouble(indexingType()) && !isCopyOnWrite(indexingMode())))
            return m_butterfly->contiguousDouble();
            
        return tryMakeWritableDoubleSlow(vm);
    }
        
    // Returns 0 if contiguous storage cannot be created - either because
    // indexing should be sparse or because we're having a bad time.
    ContiguousJSValues tryMakeWritableContiguous(VM& vm)
    {
        if (LIKELY(hasContiguous(indexingType()) && !isCopyOnWrite(indexingMode())))
            return m_butterfly->contiguous();
            
        return tryMakeWritableContiguousSlow(vm);
    }

    // Ensure that the object is in a mode where it has array storage. Use
    // this if you're about to perform actions that would have required the
    // object to be converted to have array storage, if it didn't have it
    // already.
    ArrayStorage* ensureArrayStorage(VM& vm)
    {
        if (LIKELY(hasAnyArrayStorage(indexingType())))
            return m_butterfly->arrayStorage();

        return ensureArrayStorageSlow(vm);
    }

    void ensureWritable(VM& vm)
    {
        if (isCopyOnWrite(indexingMode()))
            convertFromCopyOnWrite(vm);
    }

    static constexpr size_t offsetOfInlineStorage()
    {
        return sizeof(JSObject);
    }

    static constexpr ptrdiff_t butterflyOffset()
    {
        return OBJECT_OFFSETOF(JSObject, m_butterfly);
    }
    void* butterflyAddress()
    {
        return &m_butterfly;
    }

    JS_EXPORT_PRIVATE JSValue getMethod(JSGlobalObject*, CallData&, const Identifier&, const String& errorMessage);

    bool canPerformFastPutInline(VM&, PropertyName);
    bool canPerformFastPutInlineExcludingProto();

    bool mayBePrototype() const;
    void didBecomePrototype(VM&);

    std::optional<Structure::PropertyHashEntry> findPropertyHashEntry(PropertyName) const;

    DECLARE_EXPORT_INFO;

    bool getOwnNonIndexPropertySlot(VM&, Structure*, PropertyName, PropertySlot&);
    bool getNonIndexPropertySlot(JSGlobalObject*, PropertyName, PropertySlot&);

    JS_EXPORT_PRIVATE NEVER_INLINE bool putInlineSlow(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    JS_EXPORT_PRIVATE NEVER_INLINE bool putInlineFastReplacingStaticPropertyIfNeeded(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    bool putInlineFast(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);

protected:
#if ASSERT_ENABLED
    void finishCreation(VM& vm)
    {
        Base::finishCreation(vm);
        ASSERT(jsDynamicCast<JSObject*>(this));
        ASSERT(structure()->hasPolyProto() || getPrototypeDirect().isNull() || Heap::heap(this) == Heap::heap(getPrototypeDirect()));
        ASSERT(structure()->isObject());
        ASSERT(classInfo());
    }
#endif

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    // To instantiate objects you likely want JSFinalObject, below.
    // To create derived types you likely want JSNonFinalObject, below.
    JSObject(VM&, Structure*, Butterfly* = nullptr);

    JSObject(CreatingWellDefinedBuiltinCellTag, StructureID structureID, int32_t blob)
        : JSCell(CreatingWellDefinedBuiltinCell, structureID, blob)
        , m_butterfly(nullptr, WriteBarrierEarlyInit)
    {
    }

    // Visits the butterfly unless there is a race. Returns the structure if there was no race.
    template<typename Visitor> Structure* visitButterfly(Visitor&);
    
    template<typename Visitor> Structure* visitButterflyImpl(Visitor&);
    
    template<typename Visitor> void markAuxiliaryAndVisitOutOfLineProperties(Visitor&, Butterfly*, Structure*, PropertyOffset maxOffset);

    // Call this if you know that the object is in a mode where it has array
    // storage. This will assert otherwise.
    ArrayStorage* arrayStorage()
    {
        ASSERT(hasAnyArrayStorage(indexingType()));
        return m_butterfly->arrayStorage();
    }
        
    // Call this if you want to predicate some actions on whether or not the
    // object is in a mode where it has array storage.
    ArrayStorage* arrayStorageOrNull()
    {
        switch (indexingType()) {
        case ALL_ARRAY_STORAGE_INDEXING_TYPES:
            return m_butterfly->arrayStorage();
                
        default:
            return nullptr;
        }
    }
        
    size_t butterflyTotalSize();
    size_t butterflyPreCapacity();

    Butterfly* createInitialUndecided(VM&, unsigned length);
    ContiguousJSValues createInitialInt32(VM&, unsigned length);
    ContiguousDoubles createInitialDouble(VM&, unsigned length);
    ContiguousJSValues createInitialContiguous(VM&, unsigned length);

    void convertUndecidedForValue(VM&, JSValue);
    void createInitialForValueAndSet(VM&, unsigned index, JSValue);
    void convertInt32ForValue(VM&, JSValue);
    void convertDoubleForValue(VM&, JSValue);
    void convertFromCopyOnWrite(VM&);

    static Butterfly* createArrayStorageButterfly(VM&, JSObject* intendedOwner, Structure*, unsigned length, unsigned vectorLength, Butterfly* oldButterfly = nullptr);
    static Butterfly* tryCreateArrayStorageButterfly(VM&, JSObject* intendedOwner, Structure*, unsigned length, unsigned vectorLength, Butterfly* oldButterfly = nullptr);

    ArrayStorage* createArrayStorage(VM&, unsigned length, unsigned vectorLength);
    ArrayStorage* createInitialArrayStorage(VM&);
        
    ContiguousJSValues convertUndecidedToInt32(VM&);
    ContiguousDoubles convertUndecidedToDouble(VM&);
    ContiguousJSValues convertUndecidedToContiguous(VM&);
    ArrayStorage* convertUndecidedToArrayStorage(VM&, TransitionKind);
    ArrayStorage* convertUndecidedToArrayStorage(VM&);
        
    ContiguousDoubles convertInt32ToDouble(VM&);
    ContiguousJSValues convertInt32ToContiguous(VM&);
    ArrayStorage* convertInt32ToArrayStorage(VM&, TransitionKind);
    ArrayStorage* convertInt32ToArrayStorage(VM&);

    ContiguousJSValues convertDoubleToContiguous(VM&);
    ArrayStorage* convertDoubleToArrayStorage(VM&, TransitionKind);
    ArrayStorage* convertDoubleToArrayStorage(VM&);
        
    ArrayStorage* convertContiguousToArrayStorage(VM&, TransitionKind);
    ArrayStorage* convertContiguousToArrayStorage(VM&);

        
    ArrayStorage* ensureArrayStorageExistsAndEnterDictionaryIndexingMode(VM&);
        
    bool defineOwnNonIndexProperty(JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool throwException);

    template<IndexingType indexingShape>
    bool putByIndexBeyondVectorLengthWithoutAttributes(JSGlobalObject*, unsigned propertyName, JSValue);
    bool putByIndexBeyondVectorLengthWithArrayStorage(JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow, ArrayStorage*);

    bool increaseVectorLength(VM&, unsigned newLength);
    void deallocateSparseIndexMap();
    bool defineOwnIndexedProperty(JSGlobalObject*, unsigned, const PropertyDescriptor&, bool throwException);
    SparseArrayValueMap* allocateSparseIndexMap(VM&);
        
    void notifyPresenceOfIndexedAccessors(VM&);
        
    bool attemptToInterceptPutByIndexOnHole(JSGlobalObject*, unsigned index, JSValue, bool shouldThrow, bool& putResult);
        
    // Call this if you want setIndexQuickly to succeed and you're sure that
    // the array is contiguous.
    bool WARN_UNUSED_RETURN ensureLength(VM& vm, unsigned length)
    {
        RELEASE_ASSERT(length <= MAX_STORAGE_VECTOR_LENGTH);
        ASSERT(hasContiguous(indexingType()) || hasInt32(indexingType()) || hasDouble(indexingType()) || hasUndecided(indexingType()));

        if (m_butterfly->vectorLength() < length || isCopyOnWrite(indexingMode())) {
            if (!ensureLengthSlow(vm, length))
                return false;
        }
            
        if (m_butterfly->publicLength() < length)
            m_butterfly->setPublicLength(length);
        return true;
    }
        
    // Call this if you want to shrink the butterfly backing store, and you're
    // sure that the array is contiguous.
    void reallocateAndShrinkButterfly(VM&, unsigned length);
    
    template<IndexingType indexingShape>
    unsigned countElements(Butterfly*);
        
    // This is relevant to undecided, int32, double, and contiguous.
    unsigned countElements();

private:
    friend class LLIntOffsetsExtractor;
    friend class VMInspector;

    // Nobody should ever ask any of these questions on something already known to be a JSObject.
    using JSCell::isAPIValueWrapper;
    using JSCell::isGetterSetter;
    void getObject();
    void getString(JSGlobalObject* globalObject);
    void isObject();
    void isString();
        
    Butterfly* createInitialIndexedStorage(VM&, unsigned length);
        
    ArrayStorage* enterDictionaryIndexingModeWhenArrayStorageAlreadyExists(VM&, ArrayStorage*);
        
    template<PutMode>
    ASCIILiteral putDirectInternal(VM&, PropertyName, JSValue, unsigned attr, PutPropertySlot&);

    JS_EXPORT_PRIVATE NEVER_INLINE ASCIILiteral putDirectToDictionaryWithoutExtensibility(VM&, PropertyName, JSValue, PutPropertySlot&);
    JS_EXPORT_PRIVATE void fillGetterPropertySlot(VM&, PropertySlot&, JSCell*, unsigned, PropertyOffset);
    void fillCustomGetterPropertySlot(PropertySlot&, CustomGetterSetter*, unsigned, Structure*);

    JS_EXPORT_PRIVATE bool getOwnStaticPropertySlot(VM&, PropertyName, PropertySlot&);
        
    bool putByIndexBeyondVectorLength(JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow);
    bool putDirectIndexBeyondVectorLengthWithArrayStorage(JSGlobalObject*, unsigned propertyName, JSValue, unsigned attributes, PutDirectIndexMode, ArrayStorage*);
    JS_EXPORT_PRIVATE bool putDirectIndexSlowOrBeyondVectorLength(JSGlobalObject*, unsigned propertyName, JSValue, unsigned attributes, PutDirectIndexMode);
        
    unsigned getNewVectorLength(unsigned indexBias, unsigned currentVectorLength, unsigned currentLength, unsigned desiredLength);
    unsigned getNewVectorLength(unsigned desiredLength);

    ArrayStorage* constructConvertedArrayStorageWithoutCopyingElements(VM&, unsigned neededLength);
        
    JS_EXPORT_PRIVATE void setIndexQuicklyToUndecided(VM&, unsigned index, JSValue);
    JS_EXPORT_PRIVATE void convertInt32ToDoubleOrContiguousWhilePerformingSetIndex(VM&, unsigned index, JSValue);
    JS_EXPORT_PRIVATE void convertDoubleToContiguousWhilePerformingSetIndex(VM&, unsigned index, JSValue);
        
    bool ensureLengthSlow(VM&, unsigned length);
        
    ContiguousJSValues tryMakeWritableInt32Slow(VM&);
    ContiguousDoubles tryMakeWritableDoubleSlow(VM&);
    ContiguousJSValues tryMakeWritableContiguousSlow(VM&);
    JS_EXPORT_PRIVATE ArrayStorage* ensureArrayStorageSlow(VM&);

    PropertyOffset prepareToPutDirectWithoutTransition(VM&, PropertyName, unsigned attributes, StructureID, Structure*);

    AuxiliaryBarrier<Butterfly*> m_butterfly;
#if CPU(ADDRESS32)
    unsigned m_32BitPadding;
#endif
};

// JSNonFinalObject is a type of JSObject that has some internal storage,
// but also preserves some space in the collector cell for additional
// data members in derived types.
class JSNonFinalObject : public JSObject {
    friend class JSObject;

public:
    typedef JSObject Base;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

protected:
    explicit JSNonFinalObject(VM& vm, Structure* structure, Butterfly* butterfly = nullptr)
        : JSObject(vm, structure, butterfly)
    {
    }

#if ASSERT_ENABLED
    void finishCreation(VM& vm)
    {
        Base::finishCreation(vm);
        ASSERT(!this->structure()->hasInlineStorage());
        ASSERT(classInfo());
    }
#endif
};

// JSFinalObject is a type of JSObject that contains sufficient internal
// storage to fully make use of the collector cell containing it.
class JSFinalObject final : public JSObject {
    friend class JSObject;
public:
    using Base = JSObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    template<typename CellType, SubspaceAccess>
    static CompleteSubspace* subspaceFor(VM&);

    static size_t allocationSize(Checked<size_t> inlineCapacity)
    {
        return sizeof(JSObject) + inlineCapacity * sizeof(WriteBarrierBase<Unknown>);
    }

    static inline constexpr TypeInfo typeInfo() { return TypeInfo(FinalObjectType, StructureFlags); }
    static constexpr IndexingType defaultIndexingType = NonArray;
    static constexpr int32_t defaultTypeInfoBlob()
    {
        return TypeInfoBlob::typeInfoBlob(defaultIndexingType, typeInfo().type(), typeInfo().inlineTypeFlags());
    }

    static constexpr unsigned defaultSizeInBytes = 64;
    static constexpr unsigned defaultInlineCapacity = (defaultSizeInBytes - sizeof(JSObject)) / sizeof(WriteBarrier<Unknown>);
    static_assert(defaultInlineCapacity < firstOutOfLineOffset);

    static constexpr unsigned maxSizeInBytes = 512;
    static constexpr unsigned maxInlineCapacity = (maxSizeInBytes - sizeof(JSObject)) / sizeof(WriteBarrier<Unknown>);
    static_assert(maxInlineCapacity < firstOutOfLineOffset);

    static JSFinalObject* create(VM&, Structure*);
    static JSFinalObject* createWithButterfly(VM&, Structure*, Butterfly*);
    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue, unsigned);

    static JSFinalObject* createDefaultEmptyObject(JSGlobalObject*);

    DECLARE_VISIT_CHILDREN_WITH_MODIFIER(JS_EXPORT_PRIVATE);

    DECLARE_EXPORT_INFO;

private:
    friend class LLIntOffsetsExtractor;

    explicit JSFinalObject(VM& vm, Structure* structure, Butterfly* butterfly, size_t inlineCapacity)
        : JSObject(vm, structure, butterfly)
    {
        // We do not need to use gcSafeMemcpy since this object is not exposed yet.
        memset(inlineStorageUnsafe(), 0, inlineCapacity * sizeof(EncodedJSValue));
    }

    explicit JSFinalObject(CreatingWellDefinedBuiltinCellTag, StructureID structureID)
        : JSObject(CreatingWellDefinedBuiltinCell, structureID, defaultTypeInfoBlob())
    {
        // We do not need to use gcSafeMemcpy since this object is not exposed yet.
        memset(inlineStorageUnsafe(), 0, defaultInlineCapacity * sizeof(EncodedJSValue));
     }

#if ASSERT_ENABLED
    void finishCreation(VM& vm)
    {
        Base::finishCreation(vm);
        ASSERT(butterfly() || structure()->totalStorageCapacity() == structure()->inlineCapacity());
        ASSERT(classInfo());
    }
#endif
};

JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(objectPrivateFuncInstanceOf);

inline JSFinalObject* JSFinalObject::createWithButterfly(VM& vm, Structure* structure, Butterfly* butterfly)
{
    size_t inlineCapacity = structure->inlineCapacity();
    JSFinalObject* finalObject = new (
        NotNull,
        allocateCell<JSFinalObject>(vm, allocationSize(inlineCapacity))
    ) JSFinalObject(vm, structure, butterfly, inlineCapacity);
    finalObject->finishCreation(vm);
    return finalObject;
}

inline JSFinalObject* JSFinalObject::create(VM& vm, Structure* structure)
{
    return createWithButterfly(vm, structure, nullptr);
}

inline bool JSObject::isGlobalObject() const
{
    return type() == GlobalObjectType;
}

inline bool JSObject::isJSLexicalEnvironment() const
{
    return type() == LexicalEnvironmentType || type() == ModuleEnvironmentType;
}

inline bool JSObject::isGlobalLexicalEnvironment() const
{
    return type() == GlobalLexicalEnvironmentType;
}

inline bool JSObject::isStrictEvalActivation() const
{
    return type() == StrictEvalActivationType;
}

inline bool JSObject::isEnvironment() const
{
    bool result = GlobalObjectType <= type() && type() <= StrictEvalActivationType;
    ASSERT((isGlobalObject() || isJSLexicalEnvironment() || isGlobalLexicalEnvironment() || isStrictEvalActivation()) == result);
    return result;
}

inline bool JSObject::isErrorInstance() const
{
    return type() == ErrorInstanceType;
}

inline bool JSObject::isWithScope() const
{
    return type() == WithScopeType;
}

inline void JSObject::setStructure(VM& vm, Structure* structure)
{
    ASSERT(structure);
    ASSERT(!m_butterfly == !(structure->outOfLineCapacity() || structure->hasIndexingHeader(this)));
    JSCell::setStructure(vm, structure);
}

inline void JSObject::setButterfly(VM& vm, Butterfly* butterfly)
{
    if (isX86() || vm.heap.mutatorShouldBeFenced()) {
        WTF::storeStoreFence();
        m_butterfly.set(vm, this, butterfly);
        WTF::storeStoreFence();
        return;
    }

    m_butterfly.set(vm, this, butterfly);
}

inline void JSObject::nukeStructureAndSetButterfly(VM& vm, StructureID oldStructureID, Butterfly* butterfly)
{
    if (isX86() || vm.heap.mutatorShouldBeFenced()) {
        setStructureIDDirectly(oldStructureID.nuke());
        WTF::storeStoreFence();
        m_butterfly.set(vm, this, butterfly);
        WTF::storeStoreFence();
        return;
    }

    m_butterfly.set(vm, this, butterfly);
}

inline JSObject* asObject(JSCell* cell)
{
    ASSERT(cell);
    ASSERT(cell->isObject());
    return jsCast<JSObject*>(cell);
}

inline JSObject* asObject(JSValue value)
{
    return asObject(value.asCell());
}

inline JSObject::JSObject(VM& vm, Structure* structure, Butterfly* butterfly)
    : JSCell(vm, structure)
    , m_butterfly(butterfly, WriteBarrierEarlyInit)
{
}

inline JSValue JSObject::getPrototypeDirect() const
{
    return structure()->storedPrototype(this);
}

inline JSValue JSObject::getPrototype(VM&, JSGlobalObject* globalObject)
{
    if (LIKELY(!structure()->typeInfo().overridesGetPrototype()))
        return getPrototypeDirect();
    return methodTable()->getPrototype(this, globalObject);
}

// Normally, we never shrink the butterfly so if we know an offset is valid for some
// past structure then it should be valid for any new structure. However, we may sometimes
// shrink the butterfly when we are holding the Structure's ConcurrentJSLock, such as when we
// flatten an object.
IGNORE_RETURN_TYPE_WARNINGS_BEGIN
ALWAYS_INLINE JSValue JSObject::getDirect(Locker<JSCellLock>& cellLock, Concurrency concurrency, Structure* expectedStructure, PropertyOffset offset) const
{
    switch (concurrency) {
    case Concurrency::MainThread:
        ASSERT(!isCompilationThread() && !Thread::mayBeGCThread());
        return getDirect(offset);
    case Concurrency::ConcurrentThread:
        return getDirectConcurrently(cellLock, expectedStructure, offset);
    }
}
IGNORE_RETURN_TYPE_WARNINGS_END

inline JSValue JSObject::getDirectConcurrently(Locker<JSCellLock>&, Structure* expectedStructure, PropertyOffset offset) const
{
    // We always take the cell lock before the structure lock.
    // We must take the cell lock to prevent places like JSArray::unshiftCountWithArrayStorage
    // from changing the butterfly out from under us.
    ConcurrentJSLocker locker { expectedStructure->lock() };
    if (!expectedStructure->isValidOffset(offset))
        return { };
    return getDirect(offset);
}

// It is safe to call this method with a PropertyName that is actually an index,
// but if so will always return false (doesn't search index storage).
ALWAYS_INLINE bool JSObject::getOwnNonIndexPropertySlot(VM& vm, Structure* structure, PropertyName propertyName, PropertySlot& slot)
{
    unsigned attributes;
    PropertyOffset offset = structure->get(vm, propertyName, attributes);
    if (!isValidOffset(offset)) {
        if (!TypeInfo::hasStaticPropertyTable(inlineTypeFlags()))
            return false;
        return getOwnStaticPropertySlot(vm, propertyName, slot);
    }
    
    // getPropertySlot relies on this method never returning index properties!
    ASSERT(!parseIndex(propertyName));

    JSValue value = getDirect(offset);
    if (value.isCell()) {
        ASSERT(value);
        JSCell* cell = value.asCell();
        JSType type = cell->type();
        switch (type) {
        case GetterSetterType:
            ASSERT(attributes & PropertyAttribute::Accessor);
            fillGetterPropertySlot(vm, slot, cell, attributes, offset);
            return true;
        case CustomGetterSetterType:
            ASSERT(attributes & PropertyAttribute::CustomAccessorOrValue);
            fillCustomGetterPropertySlot(slot, jsCast<CustomGetterSetter*>(cell), attributes, structure);
            return true;
        default:
            break;
        }
    }
    
    slot.setValue(this, attributes, value, offset);
    return true;
}

ALWAYS_INLINE void JSObject::fillCustomGetterPropertySlot(PropertySlot& slot, CustomGetterSetter* customGetterSetter, unsigned attributes, Structure* structure)
{
    ASSERT(attributes & PropertyAttribute::CustomAccessorOrValue);
    if (customGetterSetter->inherits<DOMAttributeGetterSetter>()) {
        auto* domAttribute = jsCast<DOMAttributeGetterSetter*>(customGetterSetter);
        if (structure->isUncacheableDictionary())
            slot.setCustom(this, attributes, domAttribute->getter(), domAttribute->setter(), domAttribute->domAttribute());
        else
            slot.setCacheableCustom(this, attributes, domAttribute->getter(), domAttribute->setter(), domAttribute->domAttribute());
        return;
    }

    if (structure->isUncacheableDictionary())
        slot.setCustom(this, attributes, customGetterSetter->getter(), customGetterSetter->setter());
    else
        slot.setCacheableCustom(this, attributes, customGetterSetter->getter(), customGetterSetter->setter());
}

// It may seem crazy to inline a function this large, especially a virtual function,
// but it makes a big difference to property lookup that derived classes can inline their
// base class call to this.
ALWAYS_INLINE bool JSObject::getOwnPropertySlotImpl(JSObject* object, JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot)
{
    VM& vm = getVM(globalObject);
    Structure* structure = object->structure();
    if (object->getOwnNonIndexPropertySlot(vm, structure, propertyName, slot))
        return true;
    if (std::optional<uint32_t> index = parseIndex(propertyName))
        return getOwnPropertySlotByIndex(object, globalObject, index.value(), slot);
    return false;
}

#if !ASSERT_ENABLED
ALWAYS_INLINE bool JSObject::getOwnPropertySlot(JSObject* object, JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot)
{
    return getOwnPropertySlotImpl(object, globalObject, propertyName, slot);
}
#endif

// It may seem crazy to inline a function this large but it makes a big difference
// since this is function very hot in variable lookup
template<bool checkNullStructure>
ALWAYS_INLINE bool JSObject::getPropertySlot(JSGlobalObject* globalObject, PropertyName propertyName, PropertySlot& slot)
{
    VM& vm = getVM(globalObject);
    JSObject* object = this;
    while (true) {
        if (UNLIKELY(TypeInfo::overridesGetOwnPropertySlot(object->inlineTypeFlags()))) {
            // If propertyName is an index then we may have missed it (as this loop is using
            // getOwnNonIndexPropertySlot), so we cannot safely call the overridden getOwnPropertySlot
            // (lest we return a property from a prototype that is shadowed). Check now for an index,
            // if so we need to start afresh from this object.
            if (std::optional<uint32_t> index = parseIndex(propertyName))
                return getPropertySlot(globalObject, index.value(), slot);
            // Safe to continue searching from current position; call getNonIndexPropertySlot to avoid
            // parsing the int again.
            return object->getNonIndexPropertySlot(globalObject, propertyName, slot);
        }
        ASSERT(object->type() != ProxyObjectType);
        Structure* structure = object->structureID().decode();
#if USE(JSVALUE64)
        if (checkNullStructure && UNLIKELY(!structure))
            CRASH_WITH_INFO(object->type(), object->structureID().bits());
#endif
        if (object->getOwnNonIndexPropertySlot(vm, structure, propertyName, slot))
            return true;
        // FIXME: This doesn't look like it's following the specification:
        // https://bugs.webkit.org/show_bug.cgi?id=172572
        JSValue prototype = structure->storedPrototype(object);
        if (!prototype.isObject())
            break;
        object = asObject(prototype);
    }

    if (std::optional<uint32_t> index = parseIndex(propertyName))
        return getPropertySlot(globalObject, index.value(), slot);
    return false;
}

inline JSValue JSObject::get(JSGlobalObject* globalObject, PropertyName propertyName) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    PropertySlot slot(this, PropertySlot::InternalMethodType::Get);
    bool hasProperty = const_cast<JSObject*>(this)->getPropertySlot(globalObject, propertyName, slot);

    EXCEPTION_ASSERT(!scope.exception() || vm.hasPendingTerminationException() || !hasProperty);
    RETURN_IF_EXCEPTION(scope, jsUndefined());

    if (hasProperty)
        RELEASE_AND_RETURN(scope, slot.getValue(globalObject, propertyName));

    return jsUndefined();
}

inline JSValue JSObject::get(JSGlobalObject* globalObject, unsigned propertyName) const
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    PropertySlot slot(this, PropertySlot::InternalMethodType::Get);
    bool hasProperty = const_cast<JSObject*>(this)->getPropertySlot(globalObject, propertyName, slot);

    EXCEPTION_ASSERT(!scope.exception() || vm.hasPendingTerminationException() || !hasProperty);
    RETURN_IF_EXCEPTION(scope, jsUndefined());

    if (hasProperty)
        RELEASE_AND_RETURN(scope, slot.getValue(globalObject, propertyName));

    return jsUndefined();
}

template<typename T, typename PropertyNameType>
inline T JSObject::getAs(JSGlobalObject* globalObject, PropertyNameType propertyName) const
{
    JSValue value = get(globalObject, propertyName);
#if ASSERT_ENABLED || ENABLE(SECURITY_ASSERTIONS)
    VM& vm = getVM(globalObject);
    if (vm.exceptionForInspection())
        return nullptr;
#endif
    return jsCast<T>(value);
}

inline bool JSObject::putDirect(VM& vm, PropertyName propertyName, JSValue value, unsigned attributes)
{
    ASSERT(!value.isGetterSetter() && !(attributes & PropertyAttribute::Accessor));
    ASSERT(!value.isCustomGetterSetter() && !(attributes & PropertyAttribute::CustomAccessorOrValue));
    PutPropertySlot slot(this);
    return putDirectInternal<PutModeDefineOwnProperty>(vm, propertyName, value, attributes, slot).isNull();
}

inline bool JSObject::putDirect(VM& vm, PropertyName propertyName, JSValue value, unsigned attributes, PutPropertySlot& slot)
{
    ASSERT(!value.isGetterSetter());
    ASSERT(!value.isCustomGetterSetter());
    return putDirectInternal<PutModeDefineOwnProperty>(vm, propertyName, value, attributes, slot).isNull();
}

inline bool JSObject::putDirect(VM& vm, PropertyName propertyName, JSValue value, PutPropertySlot& slot)
{
    ASSERT(!value.isGetterSetter());
    ASSERT(!value.isCustomGetterSetter());
    return putDirectInternal<PutModeDefineOwnProperty>(vm, propertyName, value, 0, slot).isNull();
}

constexpr inline intptr_t offsetInButterfly(PropertyOffset offset)
{
    return offsetInOutOfLineStorage(offset) + Butterfly::indexOfPropertyStorage();
}

inline size_t JSObject::butterflyPreCapacity()
{
    if (UNLIKELY(hasIndexingHeader()))
        return butterfly()->indexingHeader()->preCapacity(structure());
    return 0;
}

inline size_t JSObject::butterflyTotalSize()
{
    Structure* structure = this->structure();
    Butterfly* butterfly = this->butterfly();
    size_t preCapacity;
    size_t indexingPayloadSizeInBytes;
    bool hasIndexingHeader = this->hasIndexingHeader();

    if (UNLIKELY(hasIndexingHeader)) {
        preCapacity = butterfly->indexingHeader()->preCapacity(structure);
        indexingPayloadSizeInBytes = butterfly->indexingHeader()->indexingPayloadSizeInBytes(structure);
    } else {
        preCapacity = 0;
        indexingPayloadSizeInBytes = 0;
    }

    return Butterfly::totalSize(preCapacity, structure->outOfLineCapacity(), hasIndexingHeader, indexingPayloadSizeInBytes);
}

inline int indexRelativeToBase(PropertyOffset offset)
{
    if (isOutOfLineOffset(offset))
        return offsetInOutOfLineStorage(offset) + Butterfly::indexOfPropertyStorage();
    static_assert(!(JSObject::offsetOfInlineStorage() % sizeof(EncodedJSValue)));
    return JSObject::offsetOfInlineStorage() / sizeof(EncodedJSValue) + offsetInInlineStorage(offset);
}

inline int offsetRelativeToBase(PropertyOffset offset)
{
    if (isOutOfLineOffset(offset))
        return offsetInOutOfLineStorage(offset) * sizeof(EncodedJSValue) + Butterfly::offsetOfPropertyStorage();
    return JSObject::offsetOfInlineStorage() + offsetInInlineStorage(offset) * sizeof(EncodedJSValue);
}

// Returns the maximum offset (away from zero) a load instruction will encode.
inline size_t maxOffsetRelativeToBase(PropertyOffset offset)
{
    ptrdiff_t addressOffset = offsetRelativeToBase(offset);
#if USE(JSVALUE32_64)
    if (addressOffset >= 0)
        return static_cast<size_t>(addressOffset) + OBJECT_OFFSETOF(EncodedValueDescriptor, asBits.tag);
#endif
    return static_cast<size_t>(addressOffset);
}

static_assert(!(sizeof(JSObject) % sizeof(WriteBarrierBase<Unknown>)), "JSObject inline storage has correct alignment");

ALWAYS_INLINE Identifier makeIdentifier(VM& vm, ASCIILiteral literal)
{
    return Identifier::fromString(vm, literal);
}

ALWAYS_INLINE Identifier makeIdentifier(VM&, const Identifier& name)
{
    return name;
}

bool validateAndApplyPropertyDescriptor(JSGlobalObject*, JSObject*, PropertyName, bool isExtensible,
    const PropertyDescriptor& descriptor, bool isCurrentDefined, const PropertyDescriptor& current, bool throwException);

JS_EXPORT_PRIVATE NEVER_INLINE bool ordinarySetSlow(JSGlobalObject*, JSObject*, PropertyName, JSValue, JSValue receiver, bool shouldThrow);
JS_EXPORT_PRIVATE NEVER_INLINE bool ordinarySetWithOwnDescriptor(JSGlobalObject*, JSObject*, PropertyName, JSValue, JSValue receiver, PropertyDescriptor&& ownDescriptor, bool shouldThrow);

bool setterThatIgnoresPrototypeProperties(JSGlobalObject*, JSValue thisValue, JSObject* homeObject, PropertyName, JSValue, bool shouldThrow);

// Helper for defining native functions, if you're not using a static hash table.
// Use this macro from within finishCreation() methods in prototypes. This assumes
// you've defined variables called globalObject, globalObject, and vm, and they
// have the expected meanings.
#define JSC_NATIVE_INTRINSIC_FUNCTION(jsName, cppName, attributes, length, implementationVisibility, intrinsic) \
    putDirectNativeFunction(\
        vm, globalObject, makeIdentifier(vm, (jsName)), (length), cppName, \
        (implementationVisibility), (intrinsic), (attributes))

#define JSC_NATIVE_INTRINSIC_FUNCTION_WITHOUT_TRANSITION(jsName, cppName, attributes, length, implementationVisibility, intrinsic) \
    putDirectNativeFunctionWithoutTransition(\
        vm, globalObject, makeIdentifier(vm, (jsName)), (length), cppName, \
        (implementationVisibility), (intrinsic), (attributes))

// As above, but this assumes that the function you're defining doesn't have an
// intrinsic.
#define JSC_NATIVE_FUNCTION(jsName, cppName, attributes, length, implementationVisibility) \
    JSC_NATIVE_INTRINSIC_FUNCTION(jsName, cppName, (attributes), (length), (implementationVisibility), JSC::NoIntrinsic)

#define JSC_NATIVE_FUNCTION_WITHOUT_TRANSITION(jsName, cppName, attributes, length, implementationVisibility) \
    JSC_NATIVE_INTRINSIC_FUNCTION_WITHOUT_TRANSITION(jsName, cppName, (attributes), (length), (implementationVisibility), JSC::NoIntrinsic)

// Identical helpers but for builtins. Note that currently, we don't support builtins that are
// also intrinsics, but we probably will do that eventually.
#define JSC_BUILTIN_FUNCTION(jsName, generatorName, attributes) \
    putDirectBuiltinFunction(\
        vm, globalObject, makeIdentifier(vm, (jsName)), (generatorName)(vm), (attributes))

#define JSC_BUILTIN_FUNCTION_WITHOUT_TRANSITION(jsName, generatorName, attributes) \
    putDirectBuiltinFunctionWithoutTransition(\
        vm, globalObject, makeIdentifier(vm, (jsName)), (generatorName)(vm), (attributes))

#define JSC_TO_STRING_TAG_WITHOUT_TRANSITION() \
    putDirectWithoutTransition(vm, vm.propertyNames->toStringTagSymbol, \
        jsNontrivialString(vm, info()->className), JSC::PropertyAttribute::DontEnum | JSC::PropertyAttribute::ReadOnly)

// Helper for defining native getters on properties.
#define JSC_NATIVE_INTRINSIC_GETTER(jsName, cppName, attributes, intrinsic)  \
    putDirectNativeIntrinsicGetter(\
        vm, globalObject, makeIdentifier(vm, (jsName)), (cppName), \
        (intrinsic), ((attributes) | JSC::PropertyAttribute::Accessor))

#define JSC_NATIVE_INTRINSIC_GETTER_WITHOUT_TRANSITION(jsName, cppName, attributes, intrinsic)  \
    putDirectNativeIntrinsicGetterWithoutTransition(\
        vm, globalObject, makeIdentifier(vm, (jsName)), (cppName), \
        (intrinsic), ((attributes) | JSC::PropertyAttribute::Accessor))

#define JSC_NATIVE_GETTER(jsName, cppName, attributes) \
    JSC_NATIVE_INTRINSIC_GETTER((jsName), (cppName), (attributes), JSC::NoIntrinsic)

#define JSC_NATIVE_GETTER_WITHOUT_TRANSITION(jsName, cppName, attributes) \
    JSC_NATIVE_INTRINSIC_GETTER_WITHOUT_TRANSITION((jsName), (cppName), (attributes), JSC::NoIntrinsic)


#define STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(DerivedClass, BaseClass) \
    static_assert(sizeof(DerivedClass) == sizeof(BaseClass)); \
    static_assert(DerivedClass::destroy == BaseClass::destroy);

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
