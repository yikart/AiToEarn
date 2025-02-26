/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2007-2021 Apple Inc. All rights reserved.
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
#include "ProxyObject.h"

namespace JSC {

class ArrayAllocationProfile;
class ArrayPrototype;
class JSArray;
class GetterSetter;

extern const ASCIILiteral ArrayInvalidLengthError;

class ArrayConstructor final : public InternalFunction {
public:
    typedef InternalFunction Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | HasStaticPropertyTable;

    static ArrayConstructor* create(VM& vm, JSGlobalObject* globalObject, Structure* structure, ArrayPrototype* arrayPrototype)
    {
        ArrayConstructor* constructor = new (NotNull, allocateCell<ArrayConstructor>(vm)) ArrayConstructor(vm, structure);
        constructor->finishCreation(vm, globalObject, arrayPrototype);
        return constructor;
    }

    DECLARE_INFO;

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

private:
    ArrayConstructor(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*, ArrayPrototype*);
};
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(ArrayConstructor, InternalFunction);

JSArray* constructArrayWithSizeQuirk(JSGlobalObject*, ArrayAllocationProfile*, JSValue length, JSValue prototype = JSValue());

JSC_DECLARE_HOST_FUNCTION(arrayConstructorPrivateFuncIsArraySlow);
bool isArraySlow(JSGlobalObject*, ProxyObject* argument);

// ES6 7.2.2
// https://tc39.github.io/ecma262/#sec-isarray
inline bool isArray(JSGlobalObject* globalObject, JSValue argumentValue)
{
    if (!argumentValue.isObject())
        return false;

    JSObject* argument = jsCast<JSObject*>(argumentValue);
    if (argument->type() == ArrayType || argument->type() == DerivedArrayType)
        return true;

    if (argument->type() != ProxyObjectType)
        return false;
    return isArraySlow(globalObject, jsCast<ProxyObject*>(argument));
}

} // namespace JSC
