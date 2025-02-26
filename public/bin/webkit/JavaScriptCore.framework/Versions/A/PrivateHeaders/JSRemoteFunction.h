/*
 * Copyright (C) 2021 Igalia S.L.
 * Author: Caitlin Potter <caitp@igalia.com>
 * Copyright (C) 2022 Apple Inc. All Rights Reserved.
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

#include "AuxiliaryBarrier.h"
#include "JSFunction.h"
#include "JSObject.h"
#include <wtf/TaggedArrayStoragePtr.h>

namespace JSC {

JSC_DECLARE_HOST_FUNCTION(remoteFunctionCallForJSFunction);
JSC_DECLARE_HOST_FUNCTION(remoteFunctionCallGeneric);
JSC_DECLARE_HOST_FUNCTION(isRemoteFunction);
JSC_DECLARE_HOST_FUNCTION(createRemoteFunction);

// JSRemoteFunction creates a bridge between its native Realm and a remote one.
// When invoked, arguments are wrapped to prevent leaking information across the realm boundary.
// The return value and any abrupt completions are also filtered.
class JSRemoteFunction final : public JSFunction {
public:
    using Base = JSFunction;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.remoteFunctionSpace<mode>();
    }

    JS_EXPORT_PRIVATE static JSRemoteFunction* tryCreate(JSGlobalObject*, VM&, JSObject* targetCallable);

    JSObject* targetFunction() { return m_targetFunction.get(); }
    JSGlobalObject* targetGlobalObject() { return targetFunction()->globalObject(); }
    JSString* nameMayBeNull() const { return m_nameMayBeNull.get(); }
    String nameString()
    {
        if (!m_nameMayBeNull)
            return emptyString();
        ASSERT(!m_nameMayBeNull->isRope());
        bool allocationAllowed = false;
        return m_nameMayBeNull->tryGetValue(allocationAllowed);
    }

    double length(VM&) const { return m_length; }

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);
    
    static constexpr ptrdiff_t offsetOfTargetFunction() { return OBJECT_OFFSETOF(JSRemoteFunction, m_targetFunction); }

    DECLARE_EXPORT_INFO;

private:
    JSRemoteFunction(VM&, NativeExecutable*, JSGlobalObject*, Structure*, JSObject* targetCallable);

    void copyNameAndLength(JSGlobalObject*);

    void finishCreation(JSGlobalObject*, VM&);
    DECLARE_VISIT_CHILDREN;

    WriteBarrier<JSObject> m_targetFunction;
    WriteBarrier<JSString> m_nameMayBeNull;
    double m_length;
};

}
