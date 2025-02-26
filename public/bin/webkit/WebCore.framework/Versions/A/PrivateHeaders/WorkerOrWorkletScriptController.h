/*
 * Copyright (C) 2008-2021 Apple Inc. All Rights Reserved.
 * Copyright (C) 2012 Google Inc. All Rights Reserved.
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

#include <wtf/Compiler.h>

#include "FetchOptions.h"
#include "WorkerThreadType.h"
#include <JavaScriptCore/Debugger.h>
#include <JavaScriptCore/JSRunLoopTimer.h>
#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/Lock.h>
#include <wtf/MessageQueue.h>
#include <wtf/NakedPtr.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {
class AbstractModuleRecord;
class Exception;
class JSGlobalObject;
class JSModuleRecord;
class VM;
}

namespace WebCore {

class Exception;
class JSDOMGlobalObject;
class ScriptSourceCode;
class WorkerConsoleClient;
class WorkerOrWorkletGlobalScope;
class WorkerScriptFetcher;

class WorkerOrWorkletScriptController final : public CanMakeCheckedPtr<WorkerOrWorkletScriptController> {
    WTF_MAKE_TZONE_ALLOCATED(WorkerOrWorkletScriptController);
    WTF_MAKE_NONCOPYABLE(WorkerOrWorkletScriptController);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(WorkerOrWorkletScriptController);
public:
    WorkerOrWorkletScriptController(WorkerThreadType, Ref<JSC::VM>&&, WorkerOrWorkletGlobalScope*);
    ~WorkerOrWorkletScriptController();

    void releaseHeapAccess();
    void acquireHeapAccess();

    void addTimerSetNotification(JSC::JSRunLoopTimer::TimerNotificationCallback);
    void removeTimerSetNotification(JSC::JSRunLoopTimer::TimerNotificationCallback);

    JSDOMGlobalObject* globalScopeWrapper()
    {
        initScriptIfNeeded();
        return m_globalScopeWrapper.get();
    }

    void attachDebugger(JSC::Debugger*);
    void detachDebugger(JSC::Debugger*);

    // Async request to terminate a JS run execution. Eventually causes termination
    // exception raised during JS execution, if the worker thread happens to run JS.
    // After JS execution was terminated in this way, the Worker thread has to use
    // forbidExecution()/isExecutionForbidden() to guard against reentry into JS.
    // Can be called from any thread.
    void scheduleExecutionTermination();
    bool isTerminatingExecution() const;

    // Called on Worker thread when JS exits with termination exception caused by forbidExecution() request,
    // or by Worker thread termination code to prevent future entry into JS.
    void forbidExecution();
    bool isExecutionForbidden() const;

    JSC::VM& vm() { return *m_vm; }

    void setException(JSC::Exception*);

    void disableEval(const String& errorMessage);
    void disableWebAssembly(const String& errorMessage);
    void setRequiresTrustedTypes(bool required);

    void evaluate(const ScriptSourceCode&, String* returnedExceptionMessage = nullptr);
    void evaluate(const ScriptSourceCode&, NakedPtr<JSC::Exception>& returnedException, String* returnedExceptionMessage = nullptr);

    JSC::JSValue evaluateModule(JSC::AbstractModuleRecord&, JSC::JSValue awaitedValue, JSC::JSValue resumeMode);

    void linkAndEvaluateModule(WorkerScriptFetcher&, const ScriptSourceCode&, String* returnedExceptionMessage = nullptr);
    bool loadModuleSynchronously(WorkerScriptFetcher&, const ScriptSourceCode&);

    void loadAndEvaluateModule(const URL& moduleURL, FetchOptions::Credentials, CompletionHandler<void(std::optional<Exception>&&)>&&);

protected:
    WorkerOrWorkletGlobalScope* globalScope() const { return m_globalScope; }

    void initScriptIfNeeded()
    {
        if (!m_globalScopeWrapper)
            initScript();
    }
    WEBCORE_EXPORT void initScript();

private:
    template<typename JSGlobalScopePrototype, typename JSGlobalScope, typename GlobalScope>
    void initScriptWithSubclass();

    RefPtr<JSC::VM> m_vm;
    WorkerOrWorkletGlobalScope* m_globalScope;
    JSC::Strong<JSDOMGlobalObject> m_globalScopeWrapper;
    std::unique_ptr<WorkerConsoleClient> m_consoleClient;
    mutable Lock m_scheduledTerminationLock;
    bool m_isTerminatingExecution WTF_GUARDED_BY_LOCK(m_scheduledTerminationLock) { false };
};

} // namespace WebCore
