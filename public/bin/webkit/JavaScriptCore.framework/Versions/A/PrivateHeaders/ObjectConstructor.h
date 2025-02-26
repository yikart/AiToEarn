/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2008-2021 Apple Inc. All rights reserved.
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

#include "InternalFunction.h"
#include "JSGlobalObject.h"
#include "ObjectPrototype.h"

namespace JSC {

JSC_DECLARE_HOST_FUNCTION(objectConstructorGetOwnPropertyDescriptor);
JSC_DECLARE_HOST_FUNCTION(objectConstructorGetOwnPropertyDescriptors);
JSC_DECLARE_HOST_FUNCTION(objectConstructorGetOwnPropertySymbols);
JSC_DECLARE_HOST_FUNCTION(objectConstructorGetOwnPropertyNames);
JSC_DECLARE_HOST_FUNCTION(objectConstructorKeys);

class ObjectPrototype;

class ObjectConstructor final : public JSC::InternalFunction {
public:
    typedef JSC::InternalFunction Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | HasStaticPropertyTable;

    static ObjectConstructor* create(VM& vm, JSGlobalObject* globalObject, Structure* structure, ObjectPrototype* objectPrototype)
    {
        ObjectConstructor* constructor = new (NotNull, allocateCell<ObjectConstructor>(vm)) ObjectConstructor(vm, structure);
        constructor->finishCreation(vm, globalObject, objectPrototype);
        return constructor;
    }

    DECLARE_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    ObjectConstructor(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*, ObjectPrototype*);
};
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(ObjectConstructor, JSC::InternalFunction);

inline JSFinalObject* constructEmptyObject(VM& vm, Structure* structure)
{
    return JSFinalObject::create(vm, structure);
}

inline JSFinalObject* constructEmptyObject(JSGlobalObject* globalObject, JSObject* prototype, unsigned inlineCapacity)
{
    VM& vm = getVM(globalObject);
    Structure* structure = globalObject->structureCache().emptyObjectStructureForPrototype(globalObject, prototype, inlineCapacity);
    return constructEmptyObject(vm, structure);
}

inline JSFinalObject* constructEmptyObject(JSGlobalObject* globalObject, JSObject* prototype)
{
    return constructEmptyObject(globalObject, prototype, JSFinalObject::defaultInlineCapacity);
}

inline JSFinalObject* constructEmptyObject(JSGlobalObject* globalObject)
{
    return JSFinalObject::createDefaultEmptyObject(globalObject);
}

inline JSObject* constructObject(JSGlobalObject* globalObject, JSValue arg)
{
    if (arg.isUndefinedOrNull())
        return constructEmptyObject(globalObject, globalObject->objectPrototype());
    return arg.toObject(globalObject);
}

JS_EXPORT_PRIVATE JSObject* constructObjectFromPropertyDescriptorSlow(JSGlobalObject*, const PropertyDescriptor&);

static constexpr PropertyOffset dataPropertyDescriptorValuePropertyOffset = 0;
static constexpr PropertyOffset dataPropertyDescriptorWritablePropertyOffset = 1;
static constexpr PropertyOffset dataPropertyDescriptorEnumerablePropertyOffset = 2;
static constexpr PropertyOffset dataPropertyDescriptorConfigurablePropertyOffset = 3;

static constexpr PropertyOffset accessorPropertyDescriptorGetPropertyOffset = 0;
static constexpr PropertyOffset accessorPropertyDescriptorSetPropertyOffset = 1;
static constexpr PropertyOffset accessorPropertyDescriptorEnumerablePropertyOffset = 2;
static constexpr PropertyOffset accessorPropertyDescriptorConfigurablePropertyOffset = 3;

inline Structure* createDataPropertyDescriptorObjectStructure(VM& vm, JSGlobalObject& globalObject)
{
    Structure* structure = globalObject.structureCache().emptyObjectStructureForPrototype(&globalObject, globalObject.objectPrototype(), JSFinalObject::defaultInlineCapacity);
    PropertyOffset offset;
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->value, 0, offset);
    RELEASE_ASSERT(offset == dataPropertyDescriptorValuePropertyOffset);
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->writable, 0, offset);
    RELEASE_ASSERT(offset == dataPropertyDescriptorWritablePropertyOffset);
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->enumerable, 0, offset);
    RELEASE_ASSERT(offset == dataPropertyDescriptorEnumerablePropertyOffset);
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->configurable, 0, offset);
    RELEASE_ASSERT(offset == dataPropertyDescriptorConfigurablePropertyOffset);
    return structure;
}

inline Structure* createAccessorPropertyDescriptorObjectStructure(VM& vm, JSGlobalObject& globalObject)
{
    Structure* structure = globalObject.structureCache().emptyObjectStructureForPrototype(&globalObject, globalObject.objectPrototype(), JSFinalObject::defaultInlineCapacity);
    PropertyOffset offset;
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->get, 0, offset);
    RELEASE_ASSERT(offset == accessorPropertyDescriptorGetPropertyOffset);
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->set, 0, offset);
    RELEASE_ASSERT(offset == accessorPropertyDescriptorSetPropertyOffset);
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->enumerable, 0, offset);
    RELEASE_ASSERT(offset == accessorPropertyDescriptorEnumerablePropertyOffset);
    structure = Structure::addPropertyTransition(vm, structure, vm.propertyNames->configurable, 0, offset);
    RELEASE_ASSERT(offset == accessorPropertyDescriptorConfigurablePropertyOffset);
    return structure;
}

// https://tc39.es/ecma262/#sec-frompropertydescriptor
inline JSObject* constructObjectFromPropertyDescriptor(JSGlobalObject* globalObject, const PropertyDescriptor& descriptor)
{
    VM& vm = getVM(globalObject);

    if (descriptor.enumerablePresent() && descriptor.configurablePresent()) {
        if (descriptor.value() && descriptor.writablePresent()) {
            JSObject* result = constructEmptyObject(vm, globalObject->dataPropertyDescriptorObjectStructure());
            result->putDirectOffset(vm, dataPropertyDescriptorValuePropertyOffset, descriptor.value());
            result->putDirectOffset(vm, dataPropertyDescriptorWritablePropertyOffset, jsBoolean(descriptor.writable()));
            result->putDirectOffset(vm, dataPropertyDescriptorEnumerablePropertyOffset, jsBoolean(descriptor.enumerable()));
            result->putDirectOffset(vm, dataPropertyDescriptorConfigurablePropertyOffset, jsBoolean(descriptor.configurable()));
            return result;
        }

        if (descriptor.getterPresent() && descriptor.setterPresent()) {
            JSObject* result = constructEmptyObject(vm, globalObject->accessorPropertyDescriptorObjectStructure());
            result->putDirectOffset(vm, accessorPropertyDescriptorGetPropertyOffset, descriptor.getter());
            result->putDirectOffset(vm, accessorPropertyDescriptorSetPropertyOffset, descriptor.setter());
            result->putDirectOffset(vm, accessorPropertyDescriptorEnumerablePropertyOffset, jsBoolean(descriptor.enumerable()));
            result->putDirectOffset(vm, accessorPropertyDescriptorConfigurablePropertyOffset, jsBoolean(descriptor.configurable()));
            return result;
        }
    }
    return constructObjectFromPropertyDescriptorSlow(globalObject, descriptor);
}


JS_EXPORT_PRIVATE JSObject* objectConstructorFreeze(JSGlobalObject*, JSObject*);
JS_EXPORT_PRIVATE JSObject* objectConstructorSeal(JSGlobalObject*, JSObject*);
JSValue objectConstructorGetOwnPropertyDescriptor(JSGlobalObject*, JSObject*, const Identifier&);
JSValue objectConstructorGetOwnPropertyDescriptors(JSGlobalObject*, JSObject*);
JSArray* ownPropertyKeys(JSGlobalObject*, JSObject*, PropertyNameMode, DontEnumPropertiesMode);
bool toPropertyDescriptor(JSGlobalObject*, JSValue, PropertyDescriptor&);
void objectAssignGeneric(JSGlobalObject*, VM&, JSObject* target, JSObject* source);

JSC_DECLARE_HOST_FUNCTION(objectConstructorIs);

} // namespace JSC
