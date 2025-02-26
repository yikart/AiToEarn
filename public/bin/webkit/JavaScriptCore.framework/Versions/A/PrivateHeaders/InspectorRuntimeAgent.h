/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "InspectorAgentBase.h"
#include "InspectorBackendDispatchers.h"
#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {
class Debugger;
class VM;
}

namespace Inspector {

class InjectedScript;
class InjectedScriptManager;

class JS_EXPORT_PRIVATE InspectorRuntimeAgent : public InspectorAgentBase, public RuntimeBackendDispatcherHandler {
    WTF_MAKE_NONCOPYABLE(InspectorRuntimeAgent);
    WTF_MAKE_TZONE_ALLOCATED(InspectorRuntimeAgent);
public:
    ~InspectorRuntimeAgent() override;

    // InspectorAgentBase
    void didCreateFrontendAndBackend(Inspector::FrontendRouter*, Inspector::BackendDispatcher*) final;
    void willDestroyFrontendAndBackend(DisconnectReason) final;

    // RuntimeBackendDispatcherHandler
    Protocol::ErrorStringOr<void> enable() override;
    Protocol::ErrorStringOr<void> disable() override;
    Protocol::ErrorStringOr<std::tuple<Protocol::Runtime::SyntaxErrorType, String /* message */, RefPtr<Protocol::Runtime::ErrorRange>>> parse(const String& expression) final;
    Protocol::ErrorStringOr<std::tuple<Ref<Protocol::Runtime::RemoteObject>, std::optional<bool> /* wasThrown */, std::optional<int> /* savedResultIndex */>> evaluate(const String& expression, const String& objectGroup, std::optional<bool>&& includeCommandLineAPI, std::optional<bool>&& doNotPauseOnExceptionsAndMuteConsole, std::optional<Protocol::Runtime::ExecutionContextId>&&, std::optional<bool>&& returnByValue, std::optional<bool>&& generatePreview, std::optional<bool>&& saveResult, std::optional<bool>&& emulateUserGesture) override;
    void awaitPromise(const Protocol::Runtime::RemoteObjectId&, std::optional<bool>&& returnByValue, std::optional<bool>&& generatePreview, std::optional<bool>&& saveResult, Ref<AwaitPromiseCallback>&&) final;
    void callFunctionOn(const Protocol::Runtime::RemoteObjectId&, const String& functionDeclaration, RefPtr<JSON::Array>&& arguments, std::optional<bool>&& doNotPauseOnExceptionsAndMuteConsole, std::optional<bool>&& returnByValue, std::optional<bool>&& generatePreview, std::optional<bool>&& emulateUserGesture, std::optional<bool>&& awaitPromise, Ref<CallFunctionOnCallback>&&) override;
    Protocol::ErrorStringOr<void> addBinding(const String& name) override;
    Protocol::ErrorStringOr<void> releaseObject(const Protocol::Runtime::RemoteObjectId&) final;
    Protocol::ErrorStringOr<Ref<Protocol::Runtime::ObjectPreview>> getPreview(const Protocol::Runtime::RemoteObjectId&) final;
    Protocol::ErrorStringOr<std::tuple<Ref<JSON::ArrayOf<Protocol::Runtime::PropertyDescriptor>>, RefPtr<JSON::ArrayOf<Protocol::Runtime::InternalPropertyDescriptor>>>> getProperties(const Protocol::Runtime::RemoteObjectId&, std::optional<bool>&& ownProperties, std::optional<int>&& fetchStart, std::optional<int>&& fetchCount, std::optional<bool>&& generatePreview) final;
    Protocol::ErrorStringOr<std::tuple<Ref<JSON::ArrayOf<Protocol::Runtime::PropertyDescriptor>>, RefPtr<JSON::ArrayOf<Protocol::Runtime::InternalPropertyDescriptor>>>> getDisplayableProperties(const Protocol::Runtime::RemoteObjectId&, std::optional<int>&& fetchStart, std::optional<int>&& fetchCount, std::optional<bool>&& generatePreview) final;
    Protocol::ErrorStringOr<Ref<JSON::ArrayOf<Protocol::Runtime::CollectionEntry>>> getCollectionEntries(const Protocol::Runtime::RemoteObjectId&, const String& objectGroup, std::optional<int>&& fetchStart, std::optional<int>&& fetchCount) final;
    Protocol::ErrorStringOr<std::optional<int> /* saveResultIndex */> saveResult(Ref<JSON::Object>&& callArgument, std::optional<Protocol::Runtime::ExecutionContextId>&&) final;
    Protocol::ErrorStringOr<void> setSavedResultAlias(const String&) final;
    Protocol::ErrorStringOr<void> releaseObjectGroup(const String&) final;
    Protocol::ErrorStringOr<Ref<JSON::ArrayOf<Protocol::Runtime::TypeDescription>>> getRuntimeTypesForVariablesAtOffsets(Ref<JSON::Array>&& locations) final;
    Protocol::ErrorStringOr<void> enableTypeProfiler() final;
    Protocol::ErrorStringOr<void> disableTypeProfiler() final;
    Protocol::ErrorStringOr<void> enableControlFlowProfiler() final;
    Protocol::ErrorStringOr<void> disableControlFlowProfiler() final;
    Protocol::ErrorStringOr<Ref<JSON::ArrayOf<Protocol::Runtime::BasicBlock>>> getBasicBlocks(const String& sourceID) final;

protected:
    InspectorRuntimeAgent(AgentContext&);

    Protocol::ErrorStringOr<std::tuple<Ref<Protocol::Runtime::RemoteObject>, std::optional<bool> /* wasThrown */, std::optional<int> /* savedResultIndex */>> evaluate(InjectedScript&, const String& expression, const String& objectGroup, std::optional<bool>&& includeCommandLineAPI, std::optional<bool>&& doNotPauseOnExceptionsAndMuteConsole, std::optional<bool>&& returnByValue, std::optional<bool>&& generatePreview, std::optional<bool>&& saveResult, std::optional<bool>&& emulateUserGesture);
    void callFunctionOn(InjectedScript&, const Protocol::Runtime::RemoteObjectId&, const String& functionDeclaration, RefPtr<JSON::Array>&& arguments, std::optional<bool>&& doNotPauseOnExceptionsAndMuteConsole, std::optional<bool>&& returnByValue, std::optional<bool>&& generatePreview, std::optional<bool>&& emulateUserGesture, std::optional<bool>&& awaitPromise, Ref<CallFunctionOnCallback>&&);

    InjectedScriptManager& injectedScriptManager() { return m_injectedScriptManager; }

    virtual InjectedScript injectedScriptForEval(Protocol::ErrorString&, std::optional<Protocol::Runtime::ExecutionContextId>&&) = 0;

    virtual void muteConsole() = 0;
    virtual void unmuteConsole() = 0;

private:
    void setTypeProfilerEnabledState(bool);
    void setControlFlowProfilerEnabledState(bool);

    InjectedScriptManager& m_injectedScriptManager;
    JSC::Debugger& m_debugger;
    JSC::VM& m_vm;
    bool m_enabled {false};
    bool m_isTypeProfilingEnabled {false};
    bool m_isControlFlowProfilingEnabled {false};
};

} // namespace Inspector
