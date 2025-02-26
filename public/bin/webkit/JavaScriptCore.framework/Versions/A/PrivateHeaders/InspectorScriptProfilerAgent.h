/*
 * Copyright (C) 2015-2023 Apple Inc. All rights reserved.
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

#include "Debugger.h"
#include "InspectorAgentBase.h"
#include "InspectorBackendDispatchers.h"
#include "InspectorFrontendDispatchers.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {
class Profile;
}

namespace Inspector {

class JS_EXPORT_PRIVATE InspectorScriptProfilerAgent final : public InspectorAgentBase, public ScriptProfilerBackendDispatcherHandler, public JSC::Debugger::ProfilingClient {
    WTF_MAKE_NONCOPYABLE(InspectorScriptProfilerAgent);
    WTF_MAKE_TZONE_ALLOCATED(InspectorScriptProfilerAgent);
public:
    InspectorScriptProfilerAgent(AgentContext&);
    ~InspectorScriptProfilerAgent() final;

    // InspectorAgentBase
    void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*) final;
    void willDestroyFrontendAndBackend(DisconnectReason) final;

    // ScriptProfilerBackendDispatcherHandler
    Protocol::ErrorStringOr<void> startTracking(std::optional<bool>&& includeSamples) final;
    Protocol::ErrorStringOr<void> stopTracking() final;

    // JSC::Debugger::ProfilingClient
    bool isAlreadyProfiling() const final;
    Seconds willEvaluateScript() final;
    void didEvaluateScript(Seconds, JSC::ProfilingReason) final;

private:
    void addEvent(Seconds startTime, Seconds endTime, JSC::ProfilingReason);
    void trackingComplete();
    void stopSamplingWhenDisconnecting();

    std::unique_ptr<ScriptProfilerFrontendDispatcher> m_frontendDispatcher;
    RefPtr<ScriptProfilerBackendDispatcher> m_backendDispatcher;
    InspectorEnvironment& m_environment;
    bool m_tracking { false };
#if ENABLE(SAMPLING_PROFILER)
    bool m_enabledSamplingProfiler { false };
#endif
    bool m_activeEvaluateScript { false };
};

} // namespace Inspector
