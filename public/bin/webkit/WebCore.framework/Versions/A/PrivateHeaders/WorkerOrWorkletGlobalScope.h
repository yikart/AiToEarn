/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "EventTarget.h"
#include "FetchOptions.h"
#include "ScriptExecutionContext.h"
#include "WorkerThreadType.h"

namespace WebCore {

class EventLoopTaskGroup;
class ScriptModuleLoader;
class WorkerEventLoop;
class WorkerInspectorController;
class WorkerOrWorkletScriptController;
class WorkerOrWorkletThread;

enum class AdvancedPrivacyProtections : uint16_t;
enum class NoiseInjectionPolicy : uint8_t;

class WorkerOrWorkletGlobalScope : public RefCounted<WorkerOrWorkletGlobalScope>, public ScriptExecutionContext, public EventTarget {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(WorkerOrWorkletGlobalScope);
    WTF_MAKE_NONCOPYABLE(WorkerOrWorkletGlobalScope);
public:
    virtual ~WorkerOrWorkletGlobalScope();

    USING_CAN_MAKE_WEAKPTR(ScriptExecutionContext);

    bool isClosing() const { return m_isClosing; }
    WorkerOrWorkletThread* workerOrWorkletThread() const { return m_thread; }

    WorkerOrWorkletScriptController* script() const { return m_script.get(); }
    void clearScript();

    JSC::VM& vm() final;
    JSC::VM* vmIfExists() const final;
    WorkerInspectorController& inspectorController() const { return *m_inspectorController; }

    ScriptModuleLoader& moduleLoader() { return *m_moduleLoader; }

    // ScriptExecutionContext.
    EventLoopTaskGroup& eventLoop() final;
    bool isContextThread() const final;
    void postTask(Task&&) final; // Executes the task on context's thread asynchronously.
    std::optional<PAL::SessionID> sessionID() const final { return m_sessionID; }

    // Defined specifcially for WorkerOrWorkletGlobalScope for cooperation with
    // WorkerEventLoop and WorkerRunLoop, not part of ScriptExecutionContext.
    void postTaskForMode(Task&&, const String&);

    virtual void prepareForDestruction();

    using RefCounted::ref;
    using RefCounted::deref;

    virtual void suspend() { }
    virtual void resume() { }

    virtual FetchOptions::Destination destination() const = 0;
    ReferrerPolicy referrerPolicy() const final { return m_referrerPolicy; }
    std::optional<uint64_t> noiseInjectionHashSalt() const final { return m_noiseInjectionHashSalt; }
    OptionSet<NoiseInjectionPolicy> noiseInjectionPolicies() const final;
    OptionSet<AdvancedPrivacyProtections> advancedPrivacyProtections() const final { return m_advancedPrivacyProtections; }

protected:
    WorkerOrWorkletGlobalScope(WorkerThreadType, PAL::SessionID, Ref<JSC::VM>&&, ReferrerPolicy, WorkerOrWorkletThread*, std::optional<uint64_t>, OptionSet<AdvancedPrivacyProtections>, std::optional<ScriptExecutionContextIdentifier> = std::nullopt);

    // ScriptExecutionContext.
    bool isJSExecutionForbidden() const final;

    void markAsClosing() { m_isClosing = true; }

private:
    // ScriptExecutionContext.
    void disableEval(const String& errorMessage) final;
    void disableWebAssembly(const String& errorMessage) final;
    void setRequiresTrustedTypes(bool required) final;

    // EventTarget.
    ScriptExecutionContext* scriptExecutionContext() const final { return const_cast<WorkerOrWorkletGlobalScope*>(this); }
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }

#if ENABLE(NOTIFICATIONS)
    NotificationClient* notificationClient() override { return nullptr; }
#endif

    std::unique_ptr<WorkerOrWorkletScriptController> m_script;
    std::unique_ptr<ScriptModuleLoader> m_moduleLoader;
    WorkerOrWorkletThread* m_thread;
    RefPtr<WorkerEventLoop> m_eventLoop;
    std::unique_ptr<EventLoopTaskGroup> m_defaultTaskGroup;
    std::unique_ptr<WorkerInspectorController> m_inspectorController;
    PAL::SessionID m_sessionID;
    ReferrerPolicy m_referrerPolicy;
    bool m_isClosing { false };
    std::optional<uint64_t> m_noiseInjectionHashSalt;
    OptionSet<AdvancedPrivacyProtections> m_advancedPrivacyProtections;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::WorkerOrWorkletGlobalScope)
    static bool isType(const WebCore::ScriptExecutionContext& context) { return context.isWorkerOrWorkletGlobalScope(); }
SPECIALIZE_TYPE_TRAITS_END()
