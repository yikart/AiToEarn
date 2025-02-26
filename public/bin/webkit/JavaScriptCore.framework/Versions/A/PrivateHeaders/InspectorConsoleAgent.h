/*
* Copyright (C) 2014-2023 Apple Inc. All rights reserved.
* Copyright (C) 2011 Google Inc. All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions
* are met:
* 1.  Redistributions of source code must retain the above copyright
*     notice, this list of conditions and the following disclaimer.
* 2.  Redistributions in binary form must reproduce the above copyright
*     notice, this list of conditions and the following disclaimer in the
*     documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
* EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
* ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

#pragma once

#include "InspectorAgentBase.h"
#include "InspectorBackendDispatchers.h"
#include "InspectorFrontendDispatchers.h"
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/MonotonicTime.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/StringHash.h>

namespace JSC {
class CallFrame;
}

namespace Inspector {

class ConsoleMessage;
class InjectedScriptManager;
class InspectorHeapAgent;
class ScriptArguments;
class ScriptCallStack;

class JS_EXPORT_PRIVATE InspectorConsoleAgent : public InspectorAgentBase, public ConsoleBackendDispatcherHandler {
    WTF_MAKE_NONCOPYABLE(InspectorConsoleAgent);
    WTF_MAKE_TZONE_ALLOCATED(InspectorConsoleAgent);
public:
    InspectorConsoleAgent(AgentContext&);
    ~InspectorConsoleAgent() override;

    // InspectorAgentBase
    void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*) final;
    void willDestroyFrontendAndBackend(DisconnectReason) final;
    void discardValues() final;

    // ConsoleBackendDispatcherHandler
    Protocol::ErrorStringOr<void> enable() final;
    Protocol::ErrorStringOr<void> disable() final;
    Protocol::ErrorStringOr<void> clearMessages() override;
    Protocol::ErrorStringOr<void> setConsoleClearAPIEnabled(bool) override;
    Protocol::ErrorStringOr<Ref<JSON::ArrayOf<Protocol::Console::Channel>>> getLoggingChannels() override;
    Protocol::ErrorStringOr<void> setLoggingChannelLevel(Protocol::Console::ChannelSource, Protocol::Console::ChannelLevel) override;

    void setHeapAgent(InspectorHeapAgent* agent) { m_heapAgent = agent; }

    bool enabled() const { return m_enabled; }
    bool developerExtrasEnabled() const;

    // InspectorInstrumentation
    void mainFrameNavigated();

    void addMessageToConsole(std::unique_ptr<ConsoleMessage>);

    void startTiming(JSC::JSGlobalObject*, const String& label);
    void logTiming(JSC::JSGlobalObject*, const String& label, Ref<ScriptArguments>&&);
    void stopTiming(JSC::JSGlobalObject*, const String& label);
    void takeHeapSnapshot(const String& title);
    void count(JSC::JSGlobalObject*, const String& label);
    void countReset(JSC::JSGlobalObject*, const String& label);

protected:
    void addConsoleMessage(std::unique_ptr<ConsoleMessage>);
    void clearMessages(Protocol::Console::ClearReason);

    InjectedScriptManager& m_injectedScriptManager;
    std::unique_ptr<ConsoleFrontendDispatcher> m_frontendDispatcher;
    RefPtr<ConsoleBackendDispatcher> m_backendDispatcher;
    InspectorHeapAgent* m_heapAgent { nullptr };

    Vector<std::unique_ptr<ConsoleMessage>> m_consoleMessages;
    int m_expiredConsoleMessageCount { 0 };
    UncheckedKeyHashMap<String, unsigned> m_counts;
    UncheckedKeyHashMap<String, MonotonicTime> m_times;
    bool m_enabled { false };
    bool m_isAddingMessageToFrontend { false };
    bool m_consoleClearAPIEnabled { true };
};

} // namespace Inspector
