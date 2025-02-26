/*
 * Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#if ENABLE(SAMPLING_PROFILER)

#include "CallFrame.h"
#include "CodeBlockHash.h"
#include "JITCode.h"
#include "MachineStackMarker.h"
#include "NativeCallee.h"
#include "PCToCodeOriginMap.h"
#include "WasmCompilationMode.h"
#include "WasmIndexOrName.h"
#include <wtf/Box.h>
#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/Stopwatch.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakRandom.h>

namespace JSC {

class VM;
class ExecutableBase;

class SamplingProfiler : public ThreadSafeRefCounted<SamplingProfiler> {
    WTF_MAKE_TZONE_ALLOCATED(SamplingProfiler);
public:

    struct UnprocessedStackFrame {
        UnprocessedStackFrame(CodeBlock* codeBlock, CalleeBits callee, CallSiteIndex callSiteIndex)
            : unverifiedCallee(callee)
            , verifiedCodeBlock(codeBlock)
            , callSiteIndex(callSiteIndex)
        { }

        UnprocessedStackFrame(const void* pc)
            : cCodePC(pc)
        { }

        UnprocessedStackFrame() = default;

        const void* cCodePC { nullptr };
        CalleeBits unverifiedCallee;
        CodeBlock* verifiedCodeBlock { nullptr };
        CallSiteIndex callSiteIndex;
        NativeCallee::Category nativeCalleeCategory { NativeCallee::Category::InlineCache };
#if ENABLE(WEBASSEMBLY)
        std::optional<Wasm::IndexOrName> wasmIndexOrName;
#endif
        std::optional<Wasm::CompilationMode> wasmCompilationMode;
#if ENABLE(JIT)
        Box<PCToCodeOriginMap> wasmPCMap;
#endif
    };

    enum class FrameType { 
        Executable,
        Wasm,
        Host,
        RegExp,
        C,
        Unknown,
    };

    struct StackFrame {
        StackFrame(ExecutableBase* executable)
            : frameType(FrameType::Executable)
            , executable(executable)
        { }

        StackFrame()
        { }

        FrameType frameType { FrameType::Unknown };
        const void* cCodePC { nullptr };
        ExecutableBase* executable { nullptr };
        JSObject* callee { nullptr };
        RegExp* regExp { nullptr };
#if ENABLE(WEBASSEMBLY)
        std::optional<Wasm::IndexOrName> wasmIndexOrName;
#endif
        std::optional<Wasm::CompilationMode> wasmCompilationMode;
        BytecodeIndex wasmOffset;

        struct CodeLocation {
            bool hasCodeBlockHash() const
            {
                return codeBlockHash.isSet();
            }

            bool hasBytecodeIndex() const
            {
                return !!bytecodeIndex;
            }

            bool hasExpressionInfo() const
            {
                return lineColumn.line != std::numeric_limits<unsigned>::max()
                    && lineColumn.column != std::numeric_limits<unsigned>::max();
            }

            // These attempt to be expression-level line and column number.
            LineColumn lineColumn { std::numeric_limits<unsigned>::max(), std::numeric_limits<unsigned>::max() };
            BytecodeIndex bytecodeIndex;
            CodeBlockHash codeBlockHash;
            JITType jitType { JITType::None };
            bool isRegExp { false };
        };

        CodeLocation semanticLocation;
        std::optional<std::pair<CodeLocation, CodeBlock*>> machineLocation; // This is non-null if we were inlined. It represents the machine frame we were inlined into.

        bool hasExpressionInfo() const { return semanticLocation.hasExpressionInfo(); }
        unsigned lineNumber() const
        {
            ASSERT(hasExpressionInfo());
            return semanticLocation.lineColumn.line;
        }
        unsigned columnNumber() const
        {
            ASSERT(hasExpressionInfo());
            return semanticLocation.lineColumn.column;
        }

        // These are function-level data.
        String nameFromCallee(VM&);
        String displayName(VM&);
        int functionStartLine();
        unsigned functionStartColumn();
        std::tuple<SourceProvider*, SourceID> sourceProviderAndID();
        String url();
    };

    struct UnprocessedStackTrace {
        MonotonicTime timestamp;
        Seconds stopwatchTimestamp;
        void* topPC;
        bool topFrameIsLLInt;
        void* llintPC;
        RegExp* regExp;
        Vector<UnprocessedStackFrame> frames;
    };

    struct StackTrace {
        MonotonicTime timestamp;
        Seconds stopwatchTimestamp;
        Vector<StackFrame> frames;
        StackTrace()
        { }
        StackTrace(StackTrace&& other)
            : timestamp(other.timestamp)
            , frames(WTFMove(other.frames))
        { }
    };

    SamplingProfiler(VM&, Ref<Stopwatch>&&);
    ~SamplingProfiler();
    void noticeJSLockAcquisition();
    void noticeVMEntry();
    void shutdown();
    template<typename Visitor> void visit(Visitor&) WTF_REQUIRES_LOCK(m_lock);
    Lock& getLock() WTF_RETURNS_LOCK(m_lock) { return m_lock; }
    void setTimingInterval(Seconds interval) { m_timingInterval = interval; }
    JS_EXPORT_PRIVATE void start();
    void startWithLock() WTF_REQUIRES_LOCK(m_lock);
    Vector<StackTrace> releaseStackTraces() WTF_REQUIRES_LOCK(m_lock);
    JS_EXPORT_PRIVATE Ref<JSON::Value> stackTracesAsJSON();
    JS_EXPORT_PRIVATE void noticeCurrentThreadAsJSCExecutionThread();
    void noticeCurrentThreadAsJSCExecutionThreadWithLock() WTF_REQUIRES_LOCK(m_lock);
    void processUnverifiedStackTraces() WTF_REQUIRES_LOCK(m_lock);
    void setStopWatch(Ref<Stopwatch>&& stopwatch) WTF_REQUIRES_LOCK(m_lock) { m_stopwatch = WTFMove(stopwatch); }
    void pause() WTF_REQUIRES_LOCK(m_lock);
    void clearData() WTF_REQUIRES_LOCK(m_lock);

    // Used for debugging in the JSC shell/DRT.
    void registerForReportAtExit();
    void reportDataToOptionFile();
    JS_EXPORT_PRIVATE void reportTopFunctions();
    JS_EXPORT_PRIVATE void reportTopFunctions(PrintStream&);
    JS_EXPORT_PRIVATE void reportTopBytecodes();
    JS_EXPORT_PRIVATE void reportTopBytecodes(PrintStream&);

    JS_EXPORT_PRIVATE Thread* thread() const;

private:
    void createThreadIfNecessary() WTF_REQUIRES_LOCK(m_lock);
    void timerLoop();
    void takeSample(Seconds& stackTraceProcessingTime) WTF_REQUIRES_LOCK(m_lock);

    Lock m_lock;
    bool m_isPaused WTF_GUARDED_BY_LOCK(m_lock);
    bool m_isShutDown WTF_GUARDED_BY_LOCK(m_lock);
    bool m_needsReportAtExit { false };
    VM& m_vm;
    WeakRandom m_weakRandom;
    Ref<Stopwatch> m_stopwatch WTF_GUARDED_BY_LOCK(m_lock);
    Vector<StackTrace> m_stackTraces WTF_GUARDED_BY_LOCK(m_lock);
    Vector<UnprocessedStackTrace> m_unprocessedStackTraces WTF_GUARDED_BY_LOCK(m_lock);
    Seconds m_timingInterval;
    RefPtr<Thread> m_thread;
    RefPtr<Thread> m_jscExecutionThread WTF_GUARDED_BY_LOCK(m_lock);
    HashSet<JSCell*> m_liveCellPointers WTF_GUARDED_BY_LOCK(m_lock);
    Vector<UnprocessedStackFrame> m_currentFrames WTF_GUARDED_BY_LOCK(m_lock);
};

} // namespace JSC

namespace WTF {

void printInternal(PrintStream&, JSC::SamplingProfiler::FrameType);

} // namespace WTF

#endif // ENABLE(SAMPLING_PROFILER)
