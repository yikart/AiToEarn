/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2008-2023 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

#pragma once

#include "Breakpoint.h"
#include "CallData.h"
#include "DebuggerCallFrame.h"
#include "DebuggerParseData.h"
#include "DebuggerPrimitives.h"
#include "JSCJSValue.h"
#include <wtf/DoublyLinkedList.h>
#include <wtf/Forward.h>
#include <wtf/ListHashSet.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class CallFrame;
class CodeBlock;
class Exception;
class JSGlobalObject;
class Microtask;
class SourceProvider;
class VM;

class Debugger : public DoublyLinkedListNode<Debugger> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(Debugger, JS_EXPORT_PRIVATE);
public:
    JS_EXPORT_PRIVATE Debugger(VM&);
    JS_EXPORT_PRIVATE virtual ~Debugger();

    VM& vm() { return m_vm; }

    bool needsExceptionCallbacks() const { return m_breakpointsActivated && (m_pauseOnAllExceptionsBreakpoint || m_pauseOnUncaughtExceptionsBreakpoint); }
    bool isInteractivelyDebugging() const { return m_breakpointsActivated; }

    enum ReasonForDetach {
        TerminatingDebuggingSession,
        GlobalObjectIsDestructing
    };
    JS_EXPORT_PRIVATE void attach(JSGlobalObject*);
    JS_EXPORT_PRIVATE void detach(JSGlobalObject*, ReasonForDetach);
    JS_EXPORT_PRIVATE bool isAttached(JSGlobalObject*);

    void forEachBreakpointLocation(SourceID, SourceProvider*, int startLine, int startColumn, int endLine, int endColumn, Function<void(int, int)>&&);

    bool resolveBreakpoint(Breakpoint&, SourceProvider*);
    bool setBreakpoint(Breakpoint&);
    bool removeBreakpoint(Breakpoint&);
    void clearBreakpoints();

    void activateBreakpoints() { setBreakpointsActivated(true); }
    void deactivateBreakpoints() { setBreakpointsActivated(false); }
    bool breakpointsActive() const { return m_breakpointsActivated; }

    // Breakpoint "delegate" functionality.
    bool evaluateBreakpointCondition(Breakpoint&, JSGlobalObject*);
    void evaluateBreakpointActions(Breakpoint&, JSGlobalObject*);

    void setPauseOnDebuggerStatementsBreakpoint(RefPtr<Breakpoint>&& breakpoint) { m_pauseOnDebuggerStatementsBreakpoint = WTFMove(breakpoint); }

    class TemporarilyDisableExceptionBreakpoints {
    public:
        TemporarilyDisableExceptionBreakpoints(Debugger&);
        ~TemporarilyDisableExceptionBreakpoints();

        void replace();
        void restore();

    private:
        Debugger& m_debugger;
        RefPtr<Breakpoint> m_pauseOnAllExceptionsBreakpoint;
        RefPtr<Breakpoint> m_pauseOnUncaughtExceptionsBreakpoint;
    };
    void setPauseOnAllExceptionsBreakpoint(RefPtr<Breakpoint>&& breakpoint) { m_pauseOnAllExceptionsBreakpoint = WTFMove(breakpoint); }
    void setPauseOnUncaughtExceptionsBreakpoint(RefPtr<Breakpoint>&& breakpoint) { m_pauseOnUncaughtExceptionsBreakpoint = WTFMove(breakpoint); }

    enum ReasonForPause {
        NotPaused,
        PausedForException,
        PausedAtStatement,
        PausedAtExpression,
        PausedBeforeReturn,
        PausedAtEndOfProgram,
        PausedForBreakpoint,
        PausedForDebuggerStatement,
        PausedAfterBlackboxedScript,
    };
    ReasonForPause reasonForPause() const { return m_reasonForPause; }
    BreakpointID pausingBreakpointID() const { return m_pausingBreakpointID; }

    void schedulePauseAtNextOpportunity();
    void cancelPauseAtNextOpportunity();
    bool schedulePauseForSpecialBreakpoint(Breakpoint&);
    bool cancelPauseForSpecialBreakpoint(Breakpoint&);
    void breakProgram(RefPtr<Breakpoint>&& specialBreakpoint = nullptr);
    void continueProgram();
    void stepNextExpression();
    void stepIntoStatement();
    void stepOverStatement();
    void stepOutOfFunction();

    using BlackboxRange = std::pair<TextPosition, TextPosition>;
    enum class BlackboxFlag : uint8_t {
        Ignore = 1 << 0,
        Defer = 1 << 1,
    };
    using BlackboxFlags = OptionSet<BlackboxFlag>;
    using BlackboxConfiguration = UncheckedKeyHashMap<BlackboxRange, BlackboxFlags>;
    void setBlackboxConfiguration(SourceID, BlackboxConfiguration&&);
    void setBlackboxBreakpointEvaluations(bool);
    void clearBlackbox();

    bool isPaused() const { return m_isPaused; }
    bool isStepping() const { return m_steppingMode == SteppingModeEnabled; }

    bool suppressAllPauses() const { return m_suppressAllPauses; }
    void setSuppressAllPauses(bool suppress) { m_suppressAllPauses = suppress; }

    JS_EXPORT_PRIVATE virtual void sourceParsed(JSGlobalObject*, SourceProvider*, int errorLineNumber, const WTF::String& errorMessage);

    void exception(JSGlobalObject*, CallFrame*, JSValue exceptionValue, bool hasCatchHandler);
    void atStatement(CallFrame*);
    void atExpression(CallFrame*);
    void callEvent(CallFrame*);
    void returnEvent(CallFrame*);
    void unwindEvent(CallFrame*);
    void willExecuteProgram(CallFrame*);
    void didExecuteProgram(CallFrame*);
    void didReachDebuggerStatement(CallFrame*);

    JS_EXPORT_PRIVATE void didQueueMicrotask(JSGlobalObject*, MicrotaskIdentifier);
    JS_EXPORT_PRIVATE void willRunMicrotask(JSGlobalObject*, MicrotaskIdentifier);
    JS_EXPORT_PRIVATE void didRunMicrotask(JSGlobalObject*, MicrotaskIdentifier);

    void registerCodeBlock(CodeBlock*);
    void forEachRegisteredCodeBlock(const Function<void(CodeBlock*)>&);

    void didCreateNativeExecutable(NativeExecutable&);
    void willCallNativeExecutable(CallFrame*);

    class Client {
    public:
        virtual ~Client() = default;

        virtual bool isInspectorDebuggerAgent() const { return false; }

        virtual JSObject* debuggerScopeExtensionObject(Debugger&, JSGlobalObject*, DebuggerCallFrame&) { return nullptr; }
        virtual void debuggerWillEvaluate(Debugger&, JSGlobalObject*, const Breakpoint::Action&) { }
        virtual void debuggerDidEvaluate(Debugger&, JSGlobalObject*, const Breakpoint::Action&) { }
    };

    Client* client() const { return m_client; }
    void setClient(Client*);

    // FIXME: <https://webkit.org/b/162773> Web Inspector: Simplify Debugger::Script to use SourceProvider
    struct Script {
        String url;
        String source;
        String sourceURL;
        String sourceMappingURL;
        RefPtr<SourceProvider> sourceProvider;
        int startLine { 0 };
        int startColumn { 0 };
        int endLine { 0 };
        int endColumn { 0 };
        bool isContentScript { false };
    };

    class Observer {
    public:
        virtual ~Observer() { }

        virtual void didParseSource(SourceID, const Debugger::Script&) { }
        virtual void failedToParseSource(const String& /* url */, const String& /* data */, int /* firstLine */, int /* errorLine */, const String& /* errorMessage */) { }

        virtual void didCreateNativeExecutable(NativeExecutable&) { }
        virtual void willCallNativeExecutable(CallFrame*) { }

        virtual void willEnter(CallFrame*) { }

        virtual void didQueueMicrotask(JSGlobalObject*, MicrotaskIdentifier) { }
        virtual void willRunMicrotask(JSGlobalObject*, MicrotaskIdentifier) { }
        virtual void didRunMicrotask(JSGlobalObject*, MicrotaskIdentifier) { }

        virtual void didPause(JSGlobalObject*, DebuggerCallFrame&, JSValue /* exceptionOrCaughtValue */) { }
        virtual void didContinue() { }

        virtual void applyBreakpoints(CodeBlock*) { }
        virtual void breakpointActionLog(JSGlobalObject*, const String& /* data */) { }
        virtual void breakpointActionSound(BreakpointActionID) { }
        virtual void breakpointActionProbe(JSGlobalObject*, BreakpointActionID, unsigned /* batchId */, unsigned /* sampleId */, JSValue /* result */) { }
        virtual void didDeferBreakpointPause(BreakpointID) { }
    };

    JS_EXPORT_PRIVATE void addObserver(Observer&);
    JS_EXPORT_PRIVATE void removeObserver(Observer&, bool isBeingDestroyed);

    class ProfilingClient {
    public:
        virtual ~ProfilingClient();
        virtual bool isAlreadyProfiling() const = 0;
        virtual Seconds willEvaluateScript() = 0;
        virtual void didEvaluateScript(Seconds startTime, ProfilingReason) = 0;
    };

    void setProfilingClient(ProfilingClient*);
    bool hasProfilingClient() const { return m_profilingClient != nullptr; }
    bool isAlreadyProfiling() const { return m_profilingClient && m_profilingClient->isAlreadyProfiling(); }
    Seconds willEvaluateScript();
    void didEvaluateScript(Seconds startTime, ProfilingReason);

protected:
    JS_EXPORT_PRIVATE JSC::DebuggerCallFrame& currentDebuggerCallFrame();

    bool hasHandlerForExceptionCallback() const
    {
        ASSERT(m_reasonForPause == PausedForException);
        return m_hasHandlerForExceptionCallback;
    }

    JSValue currentException()
    {
        ASSERT(m_reasonForPause == PausedForException);
        return m_currentException;
    }

    virtual void attachDebugger() { }
    virtual void detachDebugger(bool /* isBeingDestroyed */) { }
    JS_EXPORT_PRIVATE virtual void recompileAllJSFunctions();

    virtual void didPause(JSGlobalObject*) { }
    JS_EXPORT_PRIVATE virtual void handlePause(JSGlobalObject*, ReasonForPause);
    virtual void didContinue(JSGlobalObject*) { }
    virtual void runEventLoopWhilePaused() { }

    virtual bool isContentScript(JSGlobalObject*) const { return false; }

    // NOTE: Currently all exceptions are reported at the API boundary through reportAPIException.
    // Until a time comes where an exception can be caused outside of the API (e.g. setTimeout
    // or some other async operation in a pure JSContext) we can ignore exceptions reported here.
    virtual void reportException(JSGlobalObject*, Exception*) const { }

    bool m_doneProcessingDebuggerEvents { true };

private:
    JSValue exceptionOrCaughtValue(JSGlobalObject*);

    class ClearCodeBlockDebuggerRequestsFunctor;
    class ClearDebuggerRequestsFunctor;
    class SetSteppingModeFunctor;
    class ToggleBreakpointFunctor;

    class PauseReasonDeclaration {
    public:
        PauseReasonDeclaration(Debugger& debugger, ReasonForPause reason)
            : m_debugger(debugger)
        {
            m_debugger.m_reasonForPause = reason;
        }

        ~PauseReasonDeclaration()
        {
            m_debugger.m_reasonForPause = NotPaused;
        }
    private:
        Debugger& m_debugger;
    };

    RefPtr<Breakpoint> didHitBreakpoint(SourceID, const TextPosition&);

    DebuggerParseData& debuggerParseData(SourceID, SourceProvider*);

    void updateNeedForOpDebugCallbacks();

    // These update functions are only needed because our current breakpoints are
    // key'ed off the source position instead of the bytecode PC. This ensures
    // that we don't break on the same line more than once. Once we switch to a
    // bytecode PC key'ed breakpoint, we will not need these anymore and should
    // be able to remove them.
    enum CallFrameUpdateAction { AttemptPause, NoPause };
    void updateCallFrame(JSC::JSGlobalObject*, JSC::CallFrame*, CallFrameUpdateAction);
    void updateCallFrameInternal(JSC::CallFrame*);
    void pauseIfNeeded(JSC::JSGlobalObject*);
    void resetImmediatePauseState();
    void resetEventualPauseState();

    enum SteppingMode {
        SteppingModeDisabled,
        SteppingModeEnabled
    };
    void setSteppingMode(SteppingMode);

    enum BreakpointState {
        BreakpointDisabled,
        BreakpointEnabled
    };
    JS_EXPORT_PRIVATE void setBreakpointsActivated(bool);
    void toggleBreakpoint(CodeBlock*, Breakpoint&, BreakpointState);
    void applyBreakpoints(CodeBlock*);
    void toggleBreakpoint(Breakpoint&, BreakpointState);

    void clearDebuggerRequests(JSGlobalObject*);
    void clearParsedData();

    bool canDispatchFunctionToObservers() const;
    void dispatchFunctionToObservers(Function<void(Observer&)>);

    VM& m_vm;
    HashSet<JSGlobalObject*> m_globalObjects;
    UncheckedKeyHashMap<SourceID, DebuggerParseData, WTF::IntHash<SourceID>, WTF::UnsignedWithZeroKeyHashTraits<SourceID>> m_parseDataMap;
    UncheckedKeyHashMap<SourceID, BlackboxConfiguration, WTF::IntHash<SourceID>, WTF::UnsignedWithZeroKeyHashTraits<SourceID>> m_blackboxConfigurations;
    bool m_blackboxBreakpointEvaluations : 1;

    bool m_pauseAtNextOpportunity : 1;
    bool m_pauseOnStepNext : 1;
    bool m_pauseOnStepOut : 1;
    bool m_pastFirstExpressionInStatement : 1;
    bool m_isPaused : 1;
    bool m_breakpointsActivated : 1;
    bool m_hasHandlerForExceptionCallback : 1;
    bool m_suppressAllPauses : 1;
    unsigned m_steppingMode : 1; // SteppingMode

    ReasonForPause m_reasonForPause;
    JSValue m_currentException;
    CallFrame* m_pauseOnCallFrame { nullptr };
    CallFrame* m_currentCallFrame { nullptr };
    unsigned m_lastExecutedLine;
    SourceID m_lastExecutedSourceID;
    bool m_afterBlackboxedScript { false };

    using LineToBreakpointsMap = UncheckedKeyHashMap<unsigned, BreakpointsVector, WTF::IntHash<int>, WTF::UnsignedWithZeroKeyHashTraits<int>>;
    UncheckedKeyHashMap<SourceID, LineToBreakpointsMap, WTF::IntHash<SourceID>, WTF::UnsignedWithZeroKeyHashTraits<SourceID>> m_breakpointsForSourceID;
    HashSet<Ref<Breakpoint>> m_breakpoints;
    RefPtr<Breakpoint> m_specialBreakpoint;
    ListHashSet<Ref<Breakpoint>> m_deferredBreakpoints;
    BreakpointID m_pausingBreakpointID;

    RefPtr<Breakpoint> m_pauseOnAllExceptionsBreakpoint;
    RefPtr<Breakpoint> m_pauseOnUncaughtExceptionsBreakpoint;
    RefPtr<Breakpoint> m_pauseOnDebuggerStatementsBreakpoint;

    unsigned m_nextProbeSampleId { 1 };
    unsigned m_currentProbeBatchId { 0 };

    RefPtr<JSC::DebuggerCallFrame> m_currentDebuggerCallFrame;

    HashSet<Observer*> m_observers;

    Client* m_client { nullptr };
    ProfilingClient* m_profilingClient { nullptr };

    Debugger* m_prev; // Required by DoublyLinkedListNode.
    Debugger* m_next; // Required by DoublyLinkedListNode.

    friend class DebuggerPausedScope;
    friend class TemporaryPausedState;
    friend class LLIntOffsetsExtractor;
    friend class WTF::DoublyLinkedListNode<Debugger>;
};

} // namespace JSC
