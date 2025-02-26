/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "JSInternalFieldObjectImpl.h"

namespace JSC {

class ProxyObject final : public JSInternalFieldObjectImpl<2> {
public:
    using Base = JSInternalFieldObjectImpl<2>;

    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnPropertyNames | OverridesGetPrototype | OverridesGetCallData | OverridesPut | OverridesIsExtensible | InterceptsGetOwnPropertySlotByIndexEvenWhenLengthIsNotZero | ProhibitsPropertyCaching;

    enum class Field : uint32_t {
        Target = 0,
        Handler,
    };
    static_assert(numberOfInternalFields == 2);
    static std::array<JSValue, numberOfInternalFields> initialValues()
    {
        return { {
            jsNull(),
            jsUndefined(),
        } };
    }

    enum class HandlerTrap : uint8_t {
        Has = 0,
        Get,
        GetOwnPropertyDescriptor,
        OwnKeys,
        Set,
    };

    static constexpr unsigned numberOfCachedHandlerTrapsOffsets = 5;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.proxyObjectSpace<mode>();
    }

    static ProxyObject* create(JSGlobalObject* globalObject, JSValue target, JSValue handler)
    {
        VM& vm = getVM(globalObject);
        Structure* structure = ProxyObject::structureForTarget(globalObject, target);
        ProxyObject* proxy = new (NotNull, allocateCell<ProxyObject>(vm)) ProxyObject(vm, structure);
        proxy->finishCreation(vm, globalObject, target, handler);
        return proxy;
    }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue, bool);

    DECLARE_EXPORT_INFO;

    JSObject* target() const { return jsCast<JSObject*>(internalField(Field::Target).get()); }
    JSValue handler() const { return internalField(Field::Handler).get(); }

    static void validateNegativeHasTrapResult(JSGlobalObject*, JSObject*, PropertyName);
    static void validatePositiveSetTrapResult(JSGlobalObject*, JSObject*, PropertyName, JSValue putValue);
    static void validateGetTrapResult(JSGlobalObject*, JSValue trapResult, JSObject*, PropertyName);

    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    static bool putByIndex(JSCell*, JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow);
    bool putByIndexCommon(JSGlobalObject*, JSValue thisValue, unsigned propertyName, JSValue putValue, bool shouldThrow);
    JSValue performGetPrototype(JSGlobalObject*);
    void revoke(VM&);
    bool isRevoked() const;

    const WriteBarrier<Unknown>& internalField(Field field) const { return Base::internalField(static_cast<uint32_t>(field)); }
    WriteBarrier<Unknown>& internalField(Field field) { return Base::internalField(static_cast<uint32_t>(field)); }

    JSObject* getHandlerTrap(JSGlobalObject*, JSObject*, CallData&, const Identifier&, HandlerTrap);
    bool forwardsGetOwnPropertyNamesToTarget(DontEnumPropertiesMode);

private:
    JS_EXPORT_PRIVATE ProxyObject(VM&, Structure*);
    JS_EXPORT_PRIVATE void finishCreation(VM&, JSGlobalObject*, JSValue target, JSValue handler);
    JS_EXPORT_PRIVATE static Structure* structureForTarget(JSGlobalObject*, JSValue target);

    bool isHandlerTrapsCacheValid(JSObject* handler);
    void clearHandlerTrapsOffsetsCache();

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    static bool getOwnPropertySlotByIndex(JSObject*, JSGlobalObject*, unsigned propertyName, PropertySlot&);
    static CallData getCallData(JSCell*);
    static CallData getConstructData(JSCell*);
    static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    static bool deletePropertyByIndex(JSCell*, JSGlobalObject*, unsigned propertyName);
    static bool preventExtensions(JSObject*, JSGlobalObject*);
    static bool isExtensible(JSObject*, JSGlobalObject*);
    static bool defineOwnProperty(JSObject*, JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);
    static void getOwnPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);
    static bool setPrototype(JSObject*, JSGlobalObject*, JSValue prototype, bool shouldThrowIfCantSet);
    static JSValue getPrototype(JSObject*, JSGlobalObject*);
    DECLARE_VISIT_CHILDREN;

    bool getOwnPropertySlotCommon(JSGlobalObject*, PropertyName, PropertySlot&);
    bool performInternalMethodGetOwnProperty(JSGlobalObject*, PropertyName, PropertySlot&);
    bool performGet(JSGlobalObject*, PropertyName, PropertySlot&);
    bool performHasProperty(JSGlobalObject*, PropertyName, PropertySlot&);
    template <typename DefaultDeleteFunction>
    bool performDelete(JSGlobalObject*, PropertyName, DefaultDeleteFunction);
    template <typename PerformDefaultPutFunction>
    bool performPut(JSGlobalObject*, JSValue putValue, JSValue thisValue, PropertyName, PerformDefaultPutFunction, bool shouldThrow);
    bool performPreventExtensions(JSGlobalObject*);
    bool performIsExtensible(JSGlobalObject*);
    bool performDefineOwnProperty(JSGlobalObject*, PropertyName, const PropertyDescriptor&, bool shouldThrow);
    void performGetOwnPropertyNames(JSGlobalObject*, PropertyNameArray&);
    void performGetOwnEnumerablePropertyNames(JSGlobalObject*, PropertyNameArray&);
    bool performSetPrototype(JSGlobalObject*, JSValue prototype, bool shouldThrowIfCantSet);

    bool m_isCallable : 1 { false };
    bool m_isConstructible : 1 { false };
    PropertyOffset m_handlerTrapsOffsetsCache[numberOfCachedHandlerTrapsOffsets];
    WriteBarrierStructureID m_handlerStructureID;
    WriteBarrierStructureID m_handlerPrototypeStructureID;
};

ALWAYS_INLINE bool ProxyObject::isHandlerTrapsCacheValid(JSObject* handler)
{
    return handler->structureID() == m_handlerStructureID.value() && asObject(handler->getPrototypeDirect())->structureID() == m_handlerPrototypeStructureID.value();
}

} // namespace JSC
