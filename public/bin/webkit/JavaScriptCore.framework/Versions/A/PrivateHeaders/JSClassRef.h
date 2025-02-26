/*
 * Copyright (C) 2006-2022 Apple Inc.  All rights reserved.
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

#ifndef JSClassRef_h
#define JSClassRef_h

#include "OpaqueJSString.h"
#include "Protect.h"
#include "Weak.h"
#include <JavaScriptCore/JSObjectRef.h>
#include <wtf/HashMap.h>
#include <wtf/text/WTFString.h>

#define STATIC_VALUE_ENTRY_METHOD(method) \
    WTF_VTBL_FUNCPTR_PTRAUTH_STR("StaticValueEntry." #method) method

struct StaticValueEntry {
    WTF_MAKE_FAST_ALLOCATED;
public:
    StaticValueEntry(JSObjectGetPropertyCallback _getProperty, JSObjectSetPropertyCallback _setProperty, JSPropertyAttributes _attributes, String& propertyName)
        : getProperty(_getProperty)
        , setProperty(_setProperty)
        , attributes(_attributes)
        , propertyNameRef(OpaqueJSString::tryCreate(propertyName))
    {
    }
    
    JSObjectGetPropertyCallback STATIC_VALUE_ENTRY_METHOD(getProperty);
    JSObjectSetPropertyCallback STATIC_VALUE_ENTRY_METHOD(setProperty);
    JSPropertyAttributes attributes;
    RefPtr<OpaqueJSString> propertyNameRef;
};

#undef STATIC_VALUE_ENTRY_METHOD

#define STATIC_FUNCTION_ENTRY_METHOD(method) \
    WTF_VTBL_FUNCPTR_PTRAUTH_STR("StaticFunctionEntry." #method) method

struct StaticFunctionEntry {
    WTF_MAKE_FAST_ALLOCATED;
public:
    StaticFunctionEntry(JSObjectCallAsFunctionCallback _callAsFunction, JSPropertyAttributes _attributes)
        : callAsFunction(_callAsFunction), attributes(_attributes)
    {
    }

    JSObjectCallAsFunctionCallback STATIC_FUNCTION_ENTRY_METHOD(callAsFunction);
    JSPropertyAttributes attributes;
};

#undef STATIC_FUNCTION_ENTRY_METHOD

typedef UncheckedKeyHashMap<RefPtr<StringImpl>, std::unique_ptr<StaticValueEntry>> OpaqueJSClassStaticValuesTable;
typedef UncheckedKeyHashMap<RefPtr<StringImpl>, std::unique_ptr<StaticFunctionEntry>> OpaqueJSClassStaticFunctionsTable;

struct OpaqueJSClass;

// An OpaqueJSClass (JSClass) is created without a context, so it can be used with any context, even across context groups.
// This structure holds data members that vary across context groups.
struct OpaqueJSClassContextData {
    WTF_MAKE_NONCOPYABLE(OpaqueJSClassContextData); WTF_MAKE_FAST_ALLOCATED;
public:
    OpaqueJSClassContextData(JSC::VM&, OpaqueJSClass*);

    // It is necessary to keep OpaqueJSClass alive because of the following rare scenario:
    // 1. A class is created and used, so its context data is stored in VM hash map.
    // 2. The class is released, and when all JS objects that use it are collected, OpaqueJSClass
    // is deleted (that's the part prevented by this RefPtr).
    // 3. Another class is created at the same address.
    // 4. When it is used, the old context data is found in VM and used.
    RefPtr<OpaqueJSClass> m_class;

    std::unique_ptr<OpaqueJSClassStaticValuesTable> staticValues;
    std::unique_ptr<OpaqueJSClassStaticFunctionsTable> staticFunctions;
    JSC::Weak<JSC::JSObject> cachedPrototype;
};

#define OPAQUE_JSCLASS_METHOD(method) \
    WTF_VTBL_FUNCPTR_PTRAUTH_STR("OpaqueJSClass." #method) method

struct OpaqueJSClass : public ThreadSafeRefCounted<OpaqueJSClass> {
    static Ref<OpaqueJSClass> create(const JSClassDefinition*);
    static Ref<OpaqueJSClass> createNoAutomaticPrototype(const JSClassDefinition*);
    JS_EXPORT_PRIVATE ~OpaqueJSClass();
    
    String className();
    OpaqueJSClassStaticValuesTable* staticValues(JSC::JSGlobalObject*);
    OpaqueJSClassStaticFunctionsTable* staticFunctions(JSC::JSGlobalObject*);
    JSC::JSObject* prototype(JSC::JSGlobalObject*);

    OpaqueJSClass* parentClass;
    OpaqueJSClass* prototypeClass;
    
    JSObjectInitializeCallback OPAQUE_JSCLASS_METHOD(initialize);
    JSObjectFinalizeCallback OPAQUE_JSCLASS_METHOD(finalize);
    JSObjectHasPropertyCallback OPAQUE_JSCLASS_METHOD(hasProperty);
    JSObjectGetPropertyCallback OPAQUE_JSCLASS_METHOD(getProperty);
    JSObjectSetPropertyCallback OPAQUE_JSCLASS_METHOD(setProperty);
    JSObjectDeletePropertyCallback OPAQUE_JSCLASS_METHOD(deleteProperty);
    JSObjectGetPropertyNamesCallback OPAQUE_JSCLASS_METHOD(getPropertyNames);
    JSObjectCallAsFunctionCallback OPAQUE_JSCLASS_METHOD(callAsFunction);
    JSObjectCallAsConstructorCallback OPAQUE_JSCLASS_METHOD(callAsConstructor);
    JSObjectHasInstanceCallback OPAQUE_JSCLASS_METHOD(hasInstance);
    JSObjectConvertToTypeCallback OPAQUE_JSCLASS_METHOD(convertToType);

private:
    friend struct OpaqueJSClassContextData;

    OpaqueJSClass();
    OpaqueJSClass(const OpaqueJSClass&);
    OpaqueJSClass(const JSClassDefinition*, OpaqueJSClass* protoClass);

    OpaqueJSClassContextData& contextData(JSC::JSGlobalObject*);

    // Strings in these data members should not be put into any AtomStringTable.
    String m_className;
    std::unique_ptr<OpaqueJSClassStaticValuesTable> m_staticValues;
    std::unique_ptr<OpaqueJSClassStaticFunctionsTable> m_staticFunctions;
};

#undef OPAQUE_JSCLASS_METHOD

#endif // JSClassRef_h
