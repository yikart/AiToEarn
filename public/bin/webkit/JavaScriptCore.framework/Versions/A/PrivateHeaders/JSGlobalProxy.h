/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
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

#include "JSObject.h"

namespace JSC {

class JSGlobalProxy : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnPropertyNames | OverridesPut | OverridesGetPrototype | OverridesIsExtensible | InterceptsGetOwnPropertySlotByIndexEvenWhenLengthIsNotZero;

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        static_assert(sizeof(CellType) == sizeof(JSGlobalProxy));
        return &vm.jsGlobalProxySpace();
    }

    static JSGlobalProxy* create(VM& vm, Structure* structure)
    {
        JSGlobalProxy* proxy = new (NotNull, allocateCell<JSGlobalProxy>(vm)) JSGlobalProxy(vm, structure, nullptr);
        proxy->finishCreation(vm);
        return proxy;
    }

    static JSGlobalProxy* create(VM& vm, Structure* structure, JSGlobalObject* globalObject)
    {
        JSGlobalProxy* proxy = new (NotNull, allocateCell<JSGlobalProxy>(vm)) JSGlobalProxy(vm, structure, globalObject);
        proxy->finishCreation(vm);
        return proxy;
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_EXPORT_INFO;

    JSGlobalObject* target() const { return m_target.get(); }
    static constexpr ptrdiff_t targetOffset() { return OBJECT_OFFSETOF(JSGlobalProxy, m_target); }

    JS_EXPORT_PRIVATE void setTarget(VM&, JSGlobalObject*);

protected:
    JSGlobalProxy(VM& vm, Structure* structure, JSGlobalObject* target)
        : Base(vm, structure)
        , m_target(target, WriteBarrierEarlyInit)
    {
    }

    DECLARE_DEFAULT_FINISH_CREATION;

    DECLARE_VISIT_CHILDREN_WITH_MODIFIER(JS_EXPORT_PRIVATE);

    JS_EXPORT_PRIVATE static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    JS_EXPORT_PRIVATE static bool getOwnPropertySlotByIndex(JSObject*, JSGlobalObject*, unsigned, PropertySlot&);
    JS_EXPORT_PRIVATE static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    JS_EXPORT_PRIVATE static bool putByIndex(JSCell*, JSGlobalObject*, unsigned, JSValue, bool shouldThrow);
    JS_EXPORT_PRIVATE static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    JS_EXPORT_PRIVATE static bool deletePropertyByIndex(JSCell*, JSGlobalObject*, unsigned);
    JS_EXPORT_PRIVATE static void getOwnPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    JS_EXPORT_PRIVATE static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);
    JS_EXPORT_PRIVATE static bool setPrototype(JSObject*, JSGlobalObject*, JSValue, bool shouldThrowIfCantSet);
    JS_EXPORT_PRIVATE static JSValue getPrototype(JSObject*, JSGlobalObject*);
    JS_EXPORT_PRIVATE static bool isExtensible(JSObject*, JSGlobalObject*);
    JS_EXPORT_PRIVATE static bool preventExtensions(JSObject*, JSGlobalObject*);

private:
    WriteBarrier<JSGlobalObject> m_target;
};

} // namespace JSC
