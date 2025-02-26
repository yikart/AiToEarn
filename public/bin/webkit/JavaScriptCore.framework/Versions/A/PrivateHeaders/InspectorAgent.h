/*
 * Copyright (C) 2007-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "InspectorAgentBase.h"
#include "InspectorBackendDispatchers.h"
#include "InspectorFrontendDispatchers.h"
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace Inspector {

class BackendDispatcher;
class InspectorEnvironment;

class JS_EXPORT_PRIVATE InspectorAgent final : public InspectorAgentBase, public InspectorBackendDispatcherHandler {
    WTF_MAKE_NONCOPYABLE(InspectorAgent);
    WTF_MAKE_TZONE_ALLOCATED(InspectorAgent);
public:
    InspectorAgent(AgentContext&);
    ~InspectorAgent() final;

    // InspectorAgentBase
    void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*) final;
    void willDestroyFrontendAndBackend(DisconnectReason) final;

    // InspectorBackendDispatcherHandler
    Protocol::ErrorStringOr<void> enable() final;
    Protocol::ErrorStringOr<void> disable() final;
    Protocol::ErrorStringOr<void> initialized() final;

    // CommandLineAPI
    void inspect(Ref<Protocol::Runtime::RemoteObject>&&, Ref<JSON::Object>&& hints);

    void evaluateForTestInFrontend(const String& script);

private:
    InspectorEnvironment& m_environment;
    std::unique_ptr<InspectorFrontendDispatcher> m_frontendDispatcher;
    Ref<InspectorBackendDispatcher> m_backendDispatcher;

    Vector<String> m_pendingEvaluateTestCommands;
    std::pair<RefPtr<Protocol::Runtime::RemoteObject>, RefPtr<JSON::Object>> m_pendingInspectData;
    bool m_enabled { false };
};

} // namespace Inspector
