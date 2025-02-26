/*
 * Copyright (C) 2021 Igalia S.L.
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

#include "JSShadowRealmGlobalScopeBase.h"
#include <JavaScriptCore/Weak.h>
#include <memory>
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class JSDOMGlobalObject;
class ScriptExecutionContext;
class ScriptModuleLoader;

class ShadowRealmGlobalScope : public RefCounted<ShadowRealmGlobalScope> {
    friend class JSShadowRealmGlobalScopeBase;
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ShadowRealmGlobalScope);

public:
    static Ref<ShadowRealmGlobalScope> create(JSDOMGlobalObject*, ScriptModuleLoader*);
    ~ShadowRealmGlobalScope();

    ShadowRealmGlobalScope& self();
    ScriptModuleLoader& moduleLoader();
    JSShadowRealmGlobalScopeBase* wrapper();

protected:
    ShadowRealmGlobalScope(JSDOMGlobalObject*, ScriptModuleLoader*);

private:
    JSC::Weak<JSDOMGlobalObject> m_incubatingWrapper;
    ScriptModuleLoader* m_parentLoader { nullptr };
    JSC::Weak<JSShadowRealmGlobalScopeBase> m_wrapper;
    std::unique_ptr<ScriptModuleLoader> m_moduleLoader;
};

inline ShadowRealmGlobalScope& ShadowRealmGlobalScope::self()
{
    return *this;
}

inline JSShadowRealmGlobalScopeBase* ShadowRealmGlobalScope::wrapper()
{
    return m_wrapper.get();
}

} // namespace WebCore
