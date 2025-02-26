/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2007-2022 Apple Inc. All rights reserved.
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

#include "JSWrapperObject.h"
#include "JSString.h"

namespace JSC {

class StringObject : public JSWrapperObject {
public:
    using Base = JSWrapperObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnPropertyNames | OverridesPut | InterceptsGetOwnPropertySlotByIndexEvenWhenLengthIsNotZero;

    template<typename, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.stringObjectSpace();
    }

    static StringObject* create(VM& vm, Structure* structure)
    {
        JSString* string = jsEmptyString(vm);
        StringObject* object = new (NotNull, allocateCell<StringObject>(vm)) StringObject(vm, structure);
        object->finishCreation(vm, string);
        return object;
    }
    static StringObject* create(VM& vm, Structure* structure, JSString* string)
    {
        StringObject* object = new (NotNull, allocateCell<StringObject>(vm)) StringObject(vm, structure);
        object->finishCreation(vm, string);
        return object;
    }
    static StringObject* create(VM&, JSGlobalObject*, JSString*);

    JS_EXPORT_PRIVATE static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    JS_EXPORT_PRIVATE static bool getOwnPropertySlotByIndex(JSObject*, JSGlobalObject*, unsigned propertyName, PropertySlot&);

    JS_EXPORT_PRIVATE static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    JS_EXPORT_PRIVATE static bool putByIndex(JSCell*, JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow);

    JS_EXPORT_PRIVATE static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    JS_EXPORT_PRIVATE static bool deletePropertyByIndex(JSCell*, JSGlobalObject*, unsigned propertyName);
    JS_EXPORT_PRIVATE static void getOwnPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    JS_EXPORT_PRIVATE static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);

    DECLARE_EXPORT_INFO;

    JSString* internalValue() const { return asString(JSWrapperObject::internalValue()); }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

protected:
    JS_EXPORT_PRIVATE void finishCreation(VM&, JSString*);
    JS_EXPORT_PRIVATE StringObject(VM&, Structure*);
};
static_assert(sizeof(StringObject) == sizeof(JSWrapperObject));

JS_EXPORT_PRIVATE StringObject* constructString(VM&, JSGlobalObject*, JSValue);

// Helper for producing a JSString for 'string', where 'string' was been produced by
// calling ToString on 'originalValue'. In cases where 'originalValue' already was a
// string primitive we can just use this, otherwise we need to allocate a new JSString.
// FIXME: Basically any use of this is bad. toString() returns a JSString* so we don't need to
// pass around the originalValue; we could just pass around the JSString*. Then you don't need
// this function. You just use the JSString* that toString() returned.
static inline JSString* jsStringWithReuse(JSGlobalObject* globalObject, JSValue originalValue, const String& string)
{
    if (originalValue.isString()) {
        ASSERT(asString(originalValue)->value(globalObject) == string);
        return asString(originalValue);
    }
    return jsString(getVM(globalObject), string);
}

// Helper that tries to use the JSString substring sharing mechanism if 'originalValue' is a JSString.
// FIXME: Basically any use of this is bad. toString() returns a JSString* so we don't need to
// pass around the originalValue; we could just pass around the JSString*. And since we've
// resolved it, we know that we can just allocate the substring cell directly.
// https://bugs.webkit.org/show_bug.cgi?id=158140
static inline JSString* jsSubstring(JSGlobalObject* globalObject, JSValue originalValue, const String& string, unsigned offset, unsigned length)
{
    if (originalValue.isString()) {
        ASSERT(asString(originalValue)->value(globalObject) == string);
        return jsSubstring(globalObject, asString(originalValue), offset, length);
    }
    return jsSubstring(getVM(globalObject), string, offset, length);
}

} // namespace JSC
