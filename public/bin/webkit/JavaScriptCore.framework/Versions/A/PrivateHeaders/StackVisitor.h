/*
 * Copyright (C) 2013-2024 Apple Inc. All rights reserved.
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

#include "BytecodeIndex.h"
#include "CalleeBits.h"
#include "LineColumn.h"
#include "SourceID.h"
#include "WasmIndexOrName.h"
#include <wtf/Function.h>
#include <wtf/Indenter.h>
#include <wtf/IterationStatus.h>
#include <wtf/text/WTFString.h>

namespace JSC {

struct EntryFrame;
struct InlineCallFrame;

class CallFrame;
class CodeBlock;
class CodeOrigin;
class JSCell;
class JSFunction;
class ClonedArguments;
class Register;
class RegisterAtOffsetList;

class StackVisitor {
public:
    class Frame {
    public:
        enum CodeType {
            Global,
            Eval,
            Function,
            Module,
            Native,
            Wasm
        };

        size_t index() const { return m_index; }
        size_t argumentCountIncludingThis() const { return m_argumentCountIncludingThis; }
        bool callerIsEntryFrame() const { return m_callerIsEntryFrame; }
        CallFrame* callerFrame() const { return m_callerFrame; }
        EntryFrame* entryFrame() const { return m_entryFrame; }
        CalleeBits callee() const { return m_callee; }
        CodeBlock* codeBlock() const { return m_codeBlock; }
        BytecodeIndex bytecodeIndex() const { return m_bytecodeIndex; }
        InlineCallFrame* inlineCallFrame() const {
#if ENABLE(DFG_JIT)
            return m_inlineDFGCallFrame;
#else
            return nullptr;
#endif
        }

        bool isNativeFrame() const { return !codeBlock() && !isNativeCalleeFrame(); }
        bool isInlinedDFGFrame() const { return !isNativeCalleeFrame() && !!inlineCallFrame(); }
        bool isNativeCalleeFrame() const { return m_callee.isNativeCallee(); }
        Wasm::IndexOrName const wasmFunctionIndexOrName()
        {
            ASSERT(isNativeCalleeFrame());
            return m_wasmFunctionIndexOrName;
        }

        JS_EXPORT_PRIVATE String functionName() const;
        JS_EXPORT_PRIVATE String sourceURL() const;
        JS_EXPORT_PRIVATE String preRedirectURL() const;
        JS_EXPORT_PRIVATE String toString() const;

        JS_EXPORT_PRIVATE SourceID sourceID();

        CodeType codeType() const;
        bool hasLineAndColumnInfo() const;
        JS_EXPORT_PRIVATE LineColumn computeLineAndColumn() const;

#if ENABLE(ASSEMBLER)
        std::optional<RegisterAtOffsetList> calleeSaveRegistersForUnwinding();
#endif

        ClonedArguments* createArguments(VM&);
        CallFrame* callFrame() const { return m_callFrame; }

        JS_EXPORT_PRIVATE bool isImplementationVisibilityPrivate() const;

        void dump(PrintStream&, Indenter = Indenter()) const;
        void dump(PrintStream&, Indenter, WTF::Function<void(PrintStream&)> prefix) const;

    private:
        Frame() { }
        ~Frame() { }

        void setToEnd();

#if ENABLE(DFG_JIT)
        InlineCallFrame* m_inlineDFGCallFrame;
#endif
        unsigned m_wasmDistanceFromDeepestInlineFrame { 0 };
        CallFrame* m_callFrame;
        EntryFrame* m_entryFrame;
        EntryFrame* m_callerEntryFrame;
        CallFrame* m_callerFrame;
        CalleeBits m_callee;
        CodeBlock* m_codeBlock;
        size_t m_index;
        size_t m_argumentCountIncludingThis;
        BytecodeIndex m_bytecodeIndex;
        bool m_callerIsEntryFrame : 1;
        bool m_isWasmFrame : 1;
        Wasm::IndexOrName m_wasmFunctionIndexOrName;

        friend class StackVisitor;
    };

    // StackVisitor::visit() expects a Functor that implements the following method:
    //     IterationStatus operator()(StackVisitor&) const;

    enum EmptyEntryFrameAction {
        ContinueIfTopEntryFrameIsEmpty,
        TerminateIfTopEntryFrameIsEmpty,
    };

    template <EmptyEntryFrameAction action = ContinueIfTopEntryFrameIsEmpty, typename Functor>
    static void visit(CallFrame* startFrame, VM& vm, const Functor& functor, bool skipFirstFrame = false)
    {
        StackVisitor visitor(startFrame, vm, skipFirstFrame);
        if (action == TerminateIfTopEntryFrameIsEmpty && visitor.topEntryFrameIsEmpty())
            return;
        while (visitor->callFrame()) {
            IterationStatus status = functor(visitor);
            if (status != IterationStatus::Continue)
                break;
            visitor.gotoNextFrame();
        }
    }

    Frame& operator*() { return m_frame; }
    ALWAYS_INLINE Frame* operator->() { return &m_frame; }
    void unwindToMachineCodeBlockFrame();

    bool topEntryFrameIsEmpty() const { return m_topEntryFrameIsEmpty; }

private:
    JS_EXPORT_PRIVATE StackVisitor(CallFrame* startFrame, VM&, bool skipFirstFrame);

    JS_EXPORT_PRIVATE void gotoNextFrame();

    void readFrame(CallFrame*);
    void readInlinableNativeCalleeFrame(CallFrame*);
    void readNonInlinedFrame(CallFrame*, CodeOrigin* = nullptr);
#if ENABLE(DFG_JIT)
    void readInlinedFrame(CallFrame*, CodeOrigin*);
#endif

    Frame m_frame;
    bool m_topEntryFrameIsEmpty { false };
};

class CallerFunctor {
public:
    CallerFunctor()
        : m_hasSkippedFirstFrame(false)
        , m_callerFrame(nullptr)
    {
    }

    CallFrame* callerFrame() const { return m_callerFrame; }

    IterationStatus operator()(StackVisitor& visitor) const
    {
        if (!m_hasSkippedFirstFrame) {
            m_hasSkippedFirstFrame = true;
            return IterationStatus::Continue;
        }

        m_callerFrame = visitor->callFrame();
        return IterationStatus::Done;
    }

private:
    mutable bool m_hasSkippedFirstFrame;
    mutable CallFrame* m_callerFrame;
};

} // namespace JSC
