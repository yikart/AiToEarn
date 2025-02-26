/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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

#include "CustomElementReactionQueue.h"
#include "JSDOMBinding.h"
#include "ThreadGlobalData.h"
#include <JavaScriptCore/CatchScope.h>
#include <JavaScriptCore/Completion.h>
#include <JavaScriptCore/Microtask.h>
#include <wtf/ForbidHeapAllocation.h>
#include <wtf/MainThread.h>

namespace WebCore {

class ScriptExecutionContext;

class JSExecState {
    WTF_MAKE_NONCOPYABLE(JSExecState);
    WTF_FORBID_HEAP_ALLOCATION;
    friend class JSMainThreadNullState;
public:
    static JSC::JSGlobalObject* currentState()
    {
        return threadGlobalData().currentState();
    }
    
    static JSC::JSValue call(JSC::JSGlobalObject* lexicalGlobalObject, JSC::JSValue functionObject, const JSC::CallData& callData, JSC::JSValue thisValue, const JSC::ArgList& args, NakedPtr<JSC::Exception>& returnedException)
    {
        JSC::VM& vm = JSC::getVM(lexicalGlobalObject);
        auto scope = DECLARE_CATCH_SCOPE(vm);
        JSC::JSValue returnValue;
        {
            JSExecState currentState(lexicalGlobalObject);
            returnValue = JSC::call(lexicalGlobalObject, functionObject, callData, thisValue, args, returnedException);
        }
        scope.assertNoExceptionExceptTermination();
        return returnValue;
    }

    static JSC::JSValue evaluate(JSC::JSGlobalObject* lexicalGlobalObject, const JSC::SourceCode& source, JSC::JSValue thisValue, NakedPtr<JSC::Exception>& returnedException)
    {
        JSC::VM& vm = JSC::getVM(lexicalGlobalObject);
        auto scope = DECLARE_CATCH_SCOPE(vm);
        JSC::JSValue returnValue;
        {
            JSExecState currentState(lexicalGlobalObject);
            returnValue = JSC::evaluate(lexicalGlobalObject, source, thisValue, returnedException);
        }
        scope.assertNoExceptionExceptTermination();
        return returnValue;
    }

    static JSC::JSValue evaluate(JSC::JSGlobalObject* lexicalGlobalObject, const JSC::SourceCode& source, JSC::JSValue thisValue = JSC::JSValue())
    {
        NakedPtr<JSC::Exception> unused;
        return evaluate(lexicalGlobalObject, source, thisValue, unused);
    }

    static JSC::JSValue profiledCall(JSC::JSGlobalObject* lexicalGlobalObject, JSC::ProfilingReason reason, JSC::JSValue functionObject, const JSC::CallData& callData, JSC::JSValue thisValue, const JSC::ArgList& args, NakedPtr<JSC::Exception>& returnedException)
    {
        JSC::VM& vm = JSC::getVM(lexicalGlobalObject);
        auto scope = DECLARE_CATCH_SCOPE(vm);
        JSC::JSValue returnValue;
        {
            JSExecState currentState(lexicalGlobalObject);
            returnValue = JSC::profiledCall(lexicalGlobalObject, reason, functionObject, callData, thisValue, args, returnedException);
        }
        scope.assertNoExceptionExceptTermination();
        return returnValue;
    }

    static JSC::JSValue profiledEvaluate(JSC::JSGlobalObject* lexicalGlobalObject, JSC::ProfilingReason reason, const JSC::SourceCode& source, JSC::JSValue thisValue, NakedPtr<JSC::Exception>& returnedException)
    {
        JSC::VM& vm = JSC::getVM(lexicalGlobalObject);
        auto scope = DECLARE_CATCH_SCOPE(vm);
        JSC::JSValue returnValue;
        {
            JSExecState currentState(lexicalGlobalObject);
            returnValue = JSC::profiledEvaluate(lexicalGlobalObject, reason, source, thisValue, returnedException);
        }
        scope.assertNoExceptionExceptTermination();
        return returnValue;
    }

    static JSC::JSValue profiledEvaluate(JSC::JSGlobalObject* lexicalGlobalObject, JSC::ProfilingReason reason, const JSC::SourceCode& source, JSC::JSValue thisValue = JSC::JSValue())
    {
        NakedPtr<JSC::Exception> unused;
        return profiledEvaluate(lexicalGlobalObject, reason, source, thisValue, unused);
    }

    static void runTask(JSC::JSGlobalObject* lexicalGlobalObject, JSC::Microtask& task)
    {
        JSExecState currentState(lexicalGlobalObject);
        task.run(lexicalGlobalObject);
    }

    static JSC::JSInternalPromise* loadModule(JSC::JSGlobalObject& lexicalGlobalObject, const URL& topLevelModuleURL, JSC::JSValue parameters, JSC::JSValue scriptFetcher)
    {
        JSExecState currentState(&lexicalGlobalObject);
        return JSC::loadModule(&lexicalGlobalObject, JSC::Identifier::fromString(lexicalGlobalObject.vm(), topLevelModuleURL.string()), parameters, scriptFetcher);
    }

    static JSC::JSInternalPromise* loadModule(JSC::JSGlobalObject& lexicalGlobalObject, const JSC::SourceCode& sourceCode, JSC::JSValue scriptFetcher)
    {
        JSExecState currentState(&lexicalGlobalObject);
        return JSC::loadModule(&lexicalGlobalObject, sourceCode, scriptFetcher);
    }

    static JSC::JSValue linkAndEvaluateModule(JSC::JSGlobalObject& lexicalGlobalObject, const JSC::Identifier& moduleKey, JSC::JSValue scriptFetcher, NakedPtr<JSC::Exception>& returnedException)
    {
        JSC::VM& vm = JSC::getVM(&lexicalGlobalObject);
        auto scope = DECLARE_CATCH_SCOPE(vm);
        JSC::JSValue returnValue;
        {
            JSExecState currentState(&lexicalGlobalObject);
            returnValue = JSC::linkAndEvaluateModule(&lexicalGlobalObject, moduleKey, scriptFetcher);
            if (UNLIKELY(scope.exception())) {
                returnedException = scope.exception();
                if (!vm.hasPendingTerminationException())
                    scope.clearException();
                return JSC::jsUndefined();
            }
        }
        scope.assertNoExceptionExceptTermination();
        return returnValue;
    }

    static void instrumentFunction(ScriptExecutionContext*, const JSC::CallData&);

private:
    explicit JSExecState(JSC::JSGlobalObject* lexicalGlobalObject)
        : m_previousState(currentState())
        , m_lock(lexicalGlobalObject)
    {
        setCurrentState(lexicalGlobalObject);
    };

    ~JSExecState()
    {
        JSC::VM& vm = currentState()->vm();
        auto scope = DECLARE_THROW_SCOPE(vm);
        scope.assertNoExceptionExceptTermination();

        JSC::JSGlobalObject* lexicalGlobalObject = currentState();
        bool didExitJavaScript = lexicalGlobalObject && !m_previousState;

        setCurrentState(m_previousState);

        if (didExitJavaScript) {
            didLeaveScriptContext(lexicalGlobalObject);
            // We need to clear any exceptions from microtask drain.
            if (!vm.hasPendingTerminationException())
                scope.clearException();
        }
    }

    static void setCurrentState(JSC::JSGlobalObject* lexicalGlobalObject)
    {
        threadGlobalData().setCurrentState(lexicalGlobalObject);
    }

    JSC::JSGlobalObject* const m_previousState;
    JSC::JSLockHolder m_lock;

    static void didLeaveScriptContext(JSC::JSGlobalObject*);
};

// Null lexicalGlobalObject prevents origin security checks.
// Used by non-JavaScript bindings (ObjC, GObject).
class JSMainThreadNullState {
    WTF_MAKE_NONCOPYABLE(JSMainThreadNullState);
    WTF_FORBID_HEAP_ALLOCATION;
public:
    explicit JSMainThreadNullState()
        : m_previousState(JSExecState::currentState())
        , m_customElementReactionStack(m_previousState)
    {
        ASSERT(isMainThread());
        JSExecState::setCurrentState(nullptr);
    }

    ~JSMainThreadNullState()
    {
        ASSERT(isMainThread());
        JSExecState::setCurrentState(m_previousState);
    }

private:
    JSC::JSGlobalObject* const m_previousState;
    CustomElementReactionStack m_customElementReactionStack;
};

JSC::JSValue functionCallHandlerFromAnyThread(JSC::JSGlobalObject*, JSC::JSValue functionObject, const JSC::CallData&, JSC::JSValue thisValue, const JSC::ArgList& args, NakedPtr<JSC::Exception>& returnedException);
JSC::JSValue evaluateHandlerFromAnyThread(JSC::JSGlobalObject*, const JSC::SourceCode&, JSC::JSValue thisValue, NakedPtr<JSC::Exception>& returnedException);

ScriptExecutionContext* executionContext(JSC::JSGlobalObject*);

} // namespace WebCore
