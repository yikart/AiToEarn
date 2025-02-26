/*
 * Copyright (C) 2013-2023 Apple Inc. All Rights Reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
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

#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace JSC {
class JSGlobalObject;
}

namespace Inspector {

class BackendDispatcher;
class FrontendRouter;
class InjectedScriptManager;
class InspectorEnvironment;

struct AgentContext {
    InspectorEnvironment& environment;
    InjectedScriptManager& injectedScriptManager;
    FrontendRouter& frontendRouter;
    BackendDispatcher& backendDispatcher;
};

struct JSAgentContext : public AgentContext {
    JSAgentContext(AgentContext& context, JSC::JSGlobalObject& globalObject)
        : AgentContext(context)
        , inspectedGlobalObject(globalObject)
    {
    }

    JSC::JSGlobalObject& inspectedGlobalObject;
};

enum class DisconnectReason {
    InspectedTargetDestroyed,
    InspectorDestroyed
};

class InspectorAgentBase {
    WTF_MAKE_TZONE_ALLOCATED(InspectorAgentBase);
public:
    virtual ~InspectorAgentBase() { }

    String domainName() const { return m_name; }

    virtual void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*) = 0;
    virtual void willDestroyFrontendAndBackend(DisconnectReason) = 0;
    virtual void discardValues() { }
    virtual void discardAgent() { }

protected:
    InspectorAgentBase(const String& name)
        : m_name(name)
    {
    }

    String m_name;
};

} // namespace Inspector
