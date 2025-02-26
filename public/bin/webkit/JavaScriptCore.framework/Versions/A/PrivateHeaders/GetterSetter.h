/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2022 Apple Inc. All rights reserved.
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

#include "JSCast.h"

#include "CallFrame.h"
#include "JSGlobalObject.h"
#include "NullGetterFunction.h"
#include "NullSetterFunction.h"
#include "Structure.h"

namespace JSC {

class JSObject;

// This is an internal value object which stores getter and setter functions
// for a property. Instances of this class have the property that once a getter
// or setter is set to a non-null value, then they cannot be changed. This means
// that if a property holding a GetterSetter reference is constant-inferred and
// that constant is observed to have a non-null setter (or getter) then we can
// constant fold that setter (or getter).
class GetterSetter final : public JSCell {
    friend class JIT;
    using Base = JSCell;
private:
    GetterSetter(VM& vm, JSGlobalObject* globalObject, JSObject* getter, JSObject* setter)
        : Base(vm, vm.getterSetterStructure.get())
    {
        WTF::storeStoreFence();
        m_getter.set(vm, this, getter ? getter : globalObject->nullGetterFunction());
        m_setter.set(vm, this, setter ? setter : globalObject->nullSetterFunction());
    }

public:

    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesPut | StructureIsImmortal;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.getterSetterSpace();
    }

    static GetterSetter* create(VM& vm, JSGlobalObject* globalObject, JSObject* getter, JSObject* setter)
    {
        GetterSetter* getterSetter = new (NotNull, allocateCell<GetterSetter>(vm)) GetterSetter(vm, globalObject, getter, setter);
        getterSetter->finishCreation(vm);
        return getterSetter;
    }

    static GetterSetter* create(VM& vm, JSGlobalObject* globalObject, JSValue getter, JSValue setter)
    {
        ASSERT(getter.isUndefined() || getter.isObject());
        ASSERT(setter.isUndefined() || setter.isObject());
        JSObject* getterObject { nullptr };
        JSObject* setterObject { nullptr };
        if (getter.isObject())
            getterObject = asObject(getter);
        if (setter.isObject())
            setterObject = asObject(setter);
        return create(vm, globalObject, getterObject, setterObject);
    }

    DECLARE_VISIT_CHILDREN;

    JSObject* getter() const { return m_getter.get(); }

    JSObject* getterConcurrently() const
    {
        JSObject* result = getter();
        WTF::dependentLoadLoadFence();
        return result;
    }

    bool isGetterNull() const { return !!jsDynamicCast<NullGetterFunction*>(m_getter.get()); }
    bool isSetterNull() const { return !!jsDynamicCast<NullSetterFunction*>(m_setter.get()); }

    JSObject* setter() const { return m_setter.get(); }

    JSObject* setterConcurrently() const
    {
        JSObject* result = setter();
        WTF::loadLoadFence();
        return result;
    }

    JSValue callGetter(JSGlobalObject*, JSValue thisValue);
    bool callSetter(JSGlobalObject*, JSValue thisValue, JSValue, bool shouldThrow);

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    static constexpr ptrdiff_t offsetOfGetter()
    {
        return OBJECT_OFFSETOF(GetterSetter, m_getter);
    }

    static constexpr ptrdiff_t offsetOfSetter()
    {
        return OBJECT_OFFSETOF(GetterSetter, m_setter);
    }

    DECLARE_EXPORT_INFO;

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&) { RELEASE_ASSERT_NOT_REACHED(); return false; }
    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&) { RELEASE_ASSERT_NOT_REACHED(); return false; }
    static bool putByIndex(JSCell*, JSGlobalObject*, unsigned, JSValue, bool) { RELEASE_ASSERT_NOT_REACHED(); return false; }
    static bool setPrototype(JSObject*, JSGlobalObject*, JSValue, bool) { RELEASE_ASSERT_NOT_REACHED(); return false; }
    static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool) { RELEASE_ASSERT_NOT_REACHED(); return false; }
    static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&) { RELEASE_ASSERT_NOT_REACHED(); return false; }

private:
    WriteBarrier<JSObject> m_getter;
    WriteBarrier<JSObject> m_setter;  
};

} // namespace JSC
