/*
 * Copyright (C) 2019-2023 Apple Inc. All rights reserved.
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

#include "InspectorAgentBase.h"
#include "InspectorBackendDispatchers.h"
#include "JSCInlines.h"
#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {
class Debugger;
}

namespace Inspector {

class InjectedScript;
class InjectedScriptManager;

class JS_EXPORT_PRIVATE InspectorAuditAgent : public InspectorAgentBase, public AuditBackendDispatcherHandler {
    WTF_MAKE_NONCOPYABLE(InspectorAuditAgent);
    WTF_MAKE_TZONE_ALLOCATED(InspectorAuditAgent);
public:
    ~InspectorAuditAgent() override;

    // InspectorAgentBase
    void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*) final;
    void willDestroyFrontendAndBackend(DisconnectReason) final;

    // AuditBackendDispatcherHandler
    Protocol::ErrorStringOr<void> setup(std::optional<Protocol::Runtime::ExecutionContextId>&&) final;
    Protocol::ErrorStringOr<std::tuple<Ref<Protocol::Runtime::RemoteObject>, std::optional<bool> /* wasThrown */>> run(const String& test, std::optional<Protocol::Runtime::ExecutionContextId>&&) final;
    Protocol::ErrorStringOr<void> teardown() final;

    bool hasActiveAudit() const;

protected:
    InspectorAuditAgent(AgentContext&);

    InjectedScriptManager& injectedScriptManager() { return m_injectedScriptManager; }

    virtual InjectedScript injectedScriptForEval(Protocol::ErrorString&, std::optional<Protocol::Runtime::ExecutionContextId>&&) = 0;

    virtual void populateAuditObject(JSC::JSGlobalObject*, JSC::Strong<JSC::JSObject>& auditObject);

    virtual void muteConsole() { };
    virtual void unmuteConsole() { };

private:
    RefPtr<AuditBackendDispatcher> m_backendDispatcher;
    InjectedScriptManager& m_injectedScriptManager;
    JSC::Debugger& m_debugger;

    JSC::Strong<JSC::JSObject> m_injectedWebInspectorAuditValue;
};

} // namespace Inspector
