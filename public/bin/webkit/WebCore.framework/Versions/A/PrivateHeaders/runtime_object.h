/*
 * Copyright (C) 2003-2022 Apple Inc. All rights reserved.
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

#ifndef KJS_RUNTIME_OBJECT_H
#define KJS_RUNTIME_OBJECT_H

#include "BridgeJSC.h"
#include <JavaScriptCore/JSGlobalObject.h>

namespace JSC {
namespace Bindings {

Exception* throwRuntimeObjectInvalidAccessError(JSGlobalObject*, ThrowScope&);

class WEBCORE_EXPORT RuntimeObject : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags | OverridesGetOwnPropertySlot | OverridesGetOwnPropertyNames | OverridesGetCallData | OverridesPut | GetOwnPropertySlotMayBeWrongAboutDontEnum;
    static constexpr bool needsDestruction = true;

    template<typename CellType, JSC::SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(JSC::VM& vm)
    {
        static_assert(sizeof(CellType) == sizeof(RuntimeObject), "RuntimeObject subclasses that add fields need to override subspaceFor<>()");
        static_assert(CellType::destroy == RuntimeObject::destroy);
        return subspaceForImpl(vm);
    }

    static RuntimeObject* create(VM& vm, Structure* structure, RefPtr<Instance>&& instance)
    {
        RuntimeObject* object = new (NotNull, allocateCell<RuntimeObject>(vm)) RuntimeObject(vm, structure, WTFMove(instance));
        object->finishCreation(vm);
        return object;
    }

    static void destroy(JSCell*);

    static bool getOwnPropertySlot(JSObject*, JSGlobalObject*, PropertyName, PropertySlot&);
    static bool put(JSCell*, JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    static bool deleteProperty(JSCell*, JSGlobalObject*, PropertyName, DeletePropertySlot&);
    static CallData getCallData(JSCell*);
    static CallData getConstructData(JSCell*);

    static void getOwnPropertyNames(JSObject*, JSGlobalObject*, PropertyNameArray&, DontEnumPropertiesMode);

    void invalidate();

    Instance* getInternalInstance() const { return m_instance.get(); }

    DECLARE_INFO;

    static ObjectPrototype* createPrototype(VM&, JSGlobalObject& globalObject)
    {
        return globalObject.objectPrototype();
    }

    static Structure* createStructure(VM& vm, JSGlobalObject* globalObject, JSValue prototype)
    {
        return Structure::create(vm, globalObject, prototype, TypeInfo(ObjectType, StructureFlags), info());
    }

protected:
    RuntimeObject(VM&, Structure*, RefPtr<Instance>&&);
    void finishCreation(VM&);

private:
    static GCClient::IsoSubspace* subspaceForImpl(VM&);

    RefPtr<Instance> m_instance;
};
    
}
}

#endif
