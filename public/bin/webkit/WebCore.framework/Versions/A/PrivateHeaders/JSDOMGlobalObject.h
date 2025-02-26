/*
 * Copyright (C) 2008-2021 Apple Inc. All Rights Reserved.
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
 *
 */

#pragma once

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include <JavaScriptCore/JSGlobalObject.h>
#include <JavaScriptCore/WeakGCMap.h>
#include <wtf/Forward.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

namespace JSC {

enum class JSPromiseRejectionOperation : unsigned;

}

namespace WebCore {

class DOMConstructors;
class DOMGuardedObject;
class JSBuiltinInternalFunctions;
class Event;
class DOMWrapperWorld;
class ScriptExecutionContext;

using JSDOMStructureMap = UncheckedKeyHashMap<const JSC::ClassInfo*, JSC::WriteBarrier<JSC::Structure>>;
using DOMGuardedObjectSet = HashSet<DOMGuardedObject*>;

class WEBCORE_EXPORT JSDOMGlobalObject : public JSC::JSGlobalObject {
public:
    struct JSDOMGlobalObjectData;

    using Base = JSC::JSGlobalObject;

    static const JSC::ClassInfo s_info;

    template<typename, JSC::SubspaceAccess>
    static void subspaceFor(JSC::VM&) { RELEASE_ASSERT_NOT_REACHED(); }

    static void destroy(JSC::JSCell*);

public:
    Lock& gcLock() WTF_RETURNS_LOCK(m_gcLock) { return m_gcLock; }

    JSDOMStructureMap& structures() WTF_REQUIRES_LOCK(m_gcLock) { return m_structures; }
    DOMGuardedObjectSet& guardedObjects() WTF_REQUIRES_LOCK(m_gcLock) { return m_guardedObjects; }
    DOMConstructors& constructors() { return *m_constructors; }

    // No locking is necessary for call sites that do not mutate the containers and are not on the GC thread.
    const JSDOMStructureMap& structures() const WTF_IGNORES_THREAD_SAFETY_ANALYSIS { ASSERT(!Thread::mayBeGCThread()); return m_structures; }
    const DOMGuardedObjectSet& guardedObjects() const WTF_IGNORES_THREAD_SAFETY_ANALYSIS { ASSERT(!Thread::mayBeGCThread()); return m_guardedObjects; }
    const DOMConstructors& constructors() const { ASSERT(!Thread::mayBeGCThread()); return *m_constructors; }

    // The following don't require grabbing the gcLock first and should only be called when the Heap says that mutators don't have to be fenced.
    inline JSDOMStructureMap& structures(NoLockingNecessaryTag);
    inline DOMGuardedObjectSet& guardedObjects(NoLockingNecessaryTag);

    ScriptExecutionContext* scriptExecutionContext() const;

    static String codeForEval(JSC::JSGlobalObject*, JSC::JSValue);
    static bool canCompileStrings(JSC::JSGlobalObject*, JSC::CompilationType, String, const JSC::ArgList&);
    static JSC::Structure* trustedScriptStructure(JSC::JSGlobalObject*);

    // https://tc39.es/ecma262/#sec-agent-clusters
    String agentClusterID() const;
    static String defaultAgentClusterID();

    // Make binding code generation easier.
    JSDOMGlobalObject* globalObject() { return this; }

    DECLARE_VISIT_CHILDREN;

    DOMWrapperWorld& world() { return m_world.get(); }
    bool worldIsNormal() const { return m_worldIsNormal; }
    static constexpr ptrdiff_t offsetOfWorldIsNormal() { return OBJECT_OFFSETOF(JSDOMGlobalObject, m_worldIsNormal); }

    JSBuiltinInternalFunctions& builtinInternalFunctions() { return m_builtinInternalFunctions; }

    static void reportUncaughtExceptionAtEventLoop(JSGlobalObject*, JSC::Exception*);
    static JSC::JSGlobalObject* deriveShadowRealmGlobalObject(JSC::JSGlobalObject*);

    void clearDOMGuardedObjects() const;

    JSC::JSGlobalProxy& proxy() const { ASSERT(m_proxy); return *m_proxy.get(); }

    JSC::JSFunction* createCrossOriginFunction(JSC::JSGlobalObject*, JSC::PropertyName, JSC::NativeFunction, unsigned length);
    JSC::GetterSetter* createCrossOriginGetterSetter(JSC::JSGlobalObject*, JSC::PropertyName, JSC::GetValueFunc, JSC::PutValueFunc);

public:
    ~JSDOMGlobalObject();

    static constexpr const JSC::ClassInfo* info() { return &s_info; }

    inline static JSC::Structure* createStructure(JSC::VM&, JSC::JSValue);

protected:
    JSDOMGlobalObject(JSC::VM&, JSC::Structure*, Ref<DOMWrapperWorld>&&, const JSC::GlobalObjectMethodTable* = nullptr);
    void finishCreation(JSC::VM&);
    void finishCreation(JSC::VM&, JSC::JSObject*);

    static void promiseRejectionTracker(JSC::JSGlobalObject*, JSC::JSPromise*, JSC::JSPromiseRejectionOperation);

#if ENABLE(WEBASSEMBLY)
    static JSC::JSPromise* compileStreaming(JSC::JSGlobalObject*, JSC::JSValue);
    static JSC::JSPromise* instantiateStreaming(JSC::JSGlobalObject*, JSC::JSValue, JSC::JSObject*);
#endif

    static JSC::Identifier moduleLoaderResolve(JSC::JSGlobalObject*, JSC::JSModuleLoader*, JSC::JSValue, JSC::JSValue, JSC::JSValue);
    static JSC::JSInternalPromise* moduleLoaderFetch(JSC::JSGlobalObject*, JSC::JSModuleLoader*, JSC::JSValue, JSC::JSValue, JSC::JSValue);
    static JSC::JSValue moduleLoaderEvaluate(JSC::JSGlobalObject*, JSC::JSModuleLoader*, JSC::JSValue, JSC::JSValue, JSC::JSValue, JSC::JSValue, JSC::JSValue);
    static JSC::JSInternalPromise* moduleLoaderImportModule(JSC::JSGlobalObject*, JSC::JSModuleLoader*, JSC::JSString*, JSC::JSValue, const JSC::SourceOrigin&);
    static JSC::JSObject* moduleLoaderCreateImportMetaProperties(JSC::JSGlobalObject*, JSC::JSModuleLoader*, JSC::JSValue, JSC::JSModuleRecord*, JSC::JSValue);

    JSDOMStructureMap m_structures WTF_GUARDED_BY_LOCK(m_gcLock);
    DOMGuardedObjectSet m_guardedObjects WTF_GUARDED_BY_LOCK(m_gcLock);
    std::unique_ptr<DOMConstructors> m_constructors;

    Ref<DOMWrapperWorld> m_world;
    uint8_t m_worldIsNormal;
    Lock m_gcLock;
    JSC::WriteBarrier<JSC::JSGlobalProxy> m_proxy;

private:
    void addBuiltinGlobals(JSC::VM&);
    friend JSBuiltinInternalFunctions;

    using CrossOriginMapKey = std::pair<JSC::JSGlobalObject*, void*>;

    UniqueRef<JSBuiltinInternalFunctions> m_builtinInternalFunctions;
    JSC::WeakGCMap<CrossOriginMapKey, JSC::JSFunction> m_crossOriginFunctionMap;
    JSC::WeakGCMap<CrossOriginMapKey, JSC::GetterSetter> m_crossOriginGetterSetterMap;
};

JSDOMGlobalObject* toJSDOMGlobalObject(ScriptExecutionContext&, DOMWrapperWorld&);
WEBCORE_EXPORT JSDOMGlobalObject& callerGlobalObject(JSC::JSGlobalObject&, JSC::CallFrame*);
JSDOMGlobalObject& legacyActiveGlobalObjectForAccessor(JSC::JSGlobalObject&, JSC::CallFrame*);

template<class JSClass>
inline JSClass* toJSDOMGlobalObject(JSC::VM&, JSC::JSValue);

} // namespace WebCore
