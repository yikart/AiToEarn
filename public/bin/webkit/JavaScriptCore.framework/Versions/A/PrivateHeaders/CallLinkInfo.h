/*
 * Copyright (C) 2012-2018 Apple Inc. All rights reserved.
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

#include "BaselineJITRegisters.h"
#include "CallFrame.h"
#include "CallFrameShuffleData.h"
#include "CallLinkInfoBase.h"
#include "CallMode.h"
#include "CodeLocation.h"
#include "CodeOrigin.h"
#include "CodeSpecializationKind.h"
#include "PolymorphicCallStubRoutine.h"
#include "WriteBarrier.h"
#include <wtf/ScopedLambda.h>
#include <wtf/SentinelLinkedList.h>

namespace JSC {
namespace DFG {
struct UnlinkedCallLinkInfo;
}

class CCallHelpers;
class ExecutableBase;
class FunctionCodeBlock;
class JSFunction;
class OptimizingCallLinkInfo;
class PolymorphicCallStubRoutine;
enum OpcodeID : unsigned;

struct CallFrameShuffleData;
struct UnlinkedCallLinkInfo;
struct BaselineUnlinkedCallLinkInfo;

using CompileTimeCallLinkInfo = std::variant<OptimizingCallLinkInfo*, BaselineUnlinkedCallLinkInfo*, DFG::UnlinkedCallLinkInfo*>;

class CallLinkInfo : public CallLinkInfoBase {
public:
    friend class LLIntOffsetsExtractor;

    static constexpr uint8_t maxProfiledArgumentCountIncludingThisForVarargs = UINT8_MAX;

    enum class Type : uint8_t {
        DataOnly,
        Optimizing,
    };

    enum class Mode : uint8_t {
        Init,
        Monomorphic,
        Polymorphic,
        Virtual,
    };

    static constexpr uintptr_t polymorphicCalleeMask = 1;
    
    static CallType callTypeFor(OpcodeID opcodeID);

    static bool isVarargsCallType(CallType callType)
    {
        switch (callType) {
        case CallVarargs:
        case ConstructVarargs:
        case TailCallVarargs:
            return true;

        default:
            return false;
        }
    }

    ~CallLinkInfo();
    
    static CodeSpecializationKind specializationKindFor(CallType callType)
    {
        return specializationFromIsConstruct(callType == Construct || callType == ConstructVarargs || callType == DirectConstruct);
    }
    CodeSpecializationKind specializationKind() const
    {
        return specializationKindFor(static_cast<CallType>(m_callType));
    }

    CallMode callMode() const
    {
        return callModeFor(static_cast<CallType>(m_callType));
    }

    bool isTailCall() const
    {
        return callMode() == CallMode::Tail;
    }
    
    NearCallMode nearCallMode() const
    {
        return isTailCall() ? NearCallMode::Tail : NearCallMode::Regular;
    }

    bool isVarargs() const
    {
        return isVarargsCallType(static_cast<CallType>(m_callType));
    }

    bool isLinked() const { return mode() != Mode::Init && mode() != Mode::Virtual; }
    void unlinkOrUpgradeImpl(VM&, CodeBlock* oldCodeBlock, CodeBlock* newCodeBlock);

#if ENABLE(JIT)
protected:
    static void emitFastPathImpl(CallLinkInfo*, CCallHelpers&, bool isTailCall, ScopedLambda<void()>&& prepareForTailCall);
public:
    static void emitDataICFastPath(CCallHelpers&);
    static void emitTailCallDataICFastPath(CCallHelpers&, ScopedLambda<void()>&& prepareForTailCall);

    static void emitFastPath(CCallHelpers&, CompileTimeCallLinkInfo);
    static void emitTailCallFastPath(CCallHelpers&, CompileTimeCallLinkInfo, ScopedLambda<void()>&& prepareForTailCall);
#endif

    void revertCallToStub();

    void setMonomorphicCallee(VM&, JSCell*, JSObject* callee, CodeBlock*, CodePtr<JSEntryPtrTag>);
    void clearCallee();
    JSObject* callee();

    void setLastSeenCallee(VM&, const JSCell* owner, JSObject* callee);
    JSObject* lastSeenCallee() const;
    bool haveLastSeenCallee() const;
    
    void setExecutableDuringCompilation(ExecutableBase*);
    ExecutableBase* executable();
    
    void setStub(Ref<PolymorphicCallStubRoutine>&&);
    void clearStub();

    void setVirtualCall(VM&);

    void revertCall(VM&);

    PolymorphicCallStubRoutine* stub() const
    {
        return m_stub.get();
    }

    bool seenOnce()
    {
        return m_hasSeenShouldRepatch;
    }

    void clearSeen()
    {
        m_hasSeenShouldRepatch = false;
    }

    void setSeen()
    {
        m_hasSeenShouldRepatch = true;
    }

    bool hasSeenClosure()
    {
        return m_hasSeenClosure;
    }

    void setHasSeenClosure()
    {
        m_hasSeenClosure = true;
    }

    bool clearedByGC()
    {
        return m_clearedByGC;
    }
    
    bool clearedByVirtual()
    {
        return m_clearedByVirtual;
    }

    void setClearedByVirtual()
    {
        m_clearedByVirtual = true;
    }
    
    void setCallType(CallType callType)
    {
        m_callType = callType;
    }

    CallType callType()
    {
        return static_cast<CallType>(m_callType);
    }

    static constexpr ptrdiff_t offsetOfMaxArgumentCountIncludingThisForVarargs()
    {
        return OBJECT_OFFSETOF(CallLinkInfo, m_maxArgumentCountIncludingThisForVarargs);
    }

    uint32_t maxArgumentCountIncludingThisForVarargs()
    {
        return m_maxArgumentCountIncludingThisForVarargs;
    }
    
    void updateMaxArgumentCountIncludingThisForVarargs(unsigned argumentCountIncludingThisForVarargs)
    {
        if (m_maxArgumentCountIncludingThisForVarargs < argumentCountIncludingThisForVarargs)
            m_maxArgumentCountIncludingThisForVarargs = std::min<unsigned>(argumentCountIncludingThisForVarargs, maxProfiledArgumentCountIncludingThisForVarargs);
    }

    static constexpr ptrdiff_t offsetOfSlowPathCount()
    {
        return OBJECT_OFFSETOF(CallLinkInfo, m_slowPathCount);
    }

    static constexpr ptrdiff_t offsetOfCallee()
    {
        return OBJECT_OFFSETOF(CallLinkInfo, m_callee);
    }

    static constexpr ptrdiff_t offsetOfCodeBlock()
    {
        return OBJECT_OFFSETOF(CallLinkInfo, m_codeBlock);
    }

    static constexpr ptrdiff_t offsetOfMonomorphicCallDestination()
    {
        return OBJECT_OFFSETOF(CallLinkInfo, m_monomorphicCallDestination);
    }

    static constexpr ptrdiff_t offsetOfStub()
    {
        return OBJECT_OFFSETOF(CallLinkInfo, m_stub);
    }

    uint32_t slowPathCount()
    {
        return m_slowPathCount;
    }

    CodeOrigin codeOrigin() const { return m_codeOrigin; }

    template<typename Functor>
    void forEachDependentCell(const Functor& functor) const
    {
        if (isLinked()) {
            if (stub())
                stub()->forEachDependentCell(functor);
            else
                functor(m_callee.get());
        }
        if (haveLastSeenCallee())
            functor(lastSeenCallee());
    }

    void visitWeak(VM&);

    Type type() const { return static_cast<Type>(m_type); }

    Mode mode() const { return static_cast<Mode>(m_mode); }

    JSCell* owner() const { return m_owner; }

    JSCell* ownerForSlowPath(CallFrame* calleeFrame);

    JSGlobalObject* globalObjectForSlowPath(JSCell* owner);

    std::tuple<CodeBlock*, BytecodeIndex> retrieveCaller(JSCell* owner);

protected:
    CallLinkInfo(Type type, JSCell* owner, CodeOrigin codeOrigin)
        : CallLinkInfoBase(CallSiteType::CallLinkInfo)
        , m_type(static_cast<unsigned>(type))
        , m_owner(owner)
        , m_codeOrigin(codeOrigin)
    {
        ASSERT(type == this->type());
    }

    void reset(VM&);

    bool m_hasSeenShouldRepatch : 1 { false };
    bool m_hasSeenClosure : 1 { false };
    bool m_clearedByGC : 1 { false };
    bool m_clearedByVirtual : 1 { false };
    unsigned m_callType : 4 { CallType::None }; // CallType
    unsigned m_type : 1; // Type
    unsigned m_mode : 3 { static_cast<unsigned>(Mode::Init) }; // Mode
    uint8_t m_maxArgumentCountIncludingThisForVarargs { 0 }; // For varargs: the profiled maximum number of arguments. For direct: the number of stack slots allocated for arguments.
    uint32_t m_slowPathCount { 0 };

    CodeBlock* m_codeBlock { nullptr }; // This is weakly held. And cleared whenever m_monomorphicCallDestination is changed.
    CodePtr<JSEntryPtrTag> m_monomorphicCallDestination { nullptr };
    WriteBarrier<JSObject> m_callee;
    WriteBarrier<JSObject> m_lastSeenCallee;
    RefPtr<PolymorphicCallStubRoutine> m_stub;
    JSCell* m_owner { nullptr };
    CodeOrigin m_codeOrigin { };
};

class DataOnlyCallLinkInfo final : public CallLinkInfo {
public:
    DataOnlyCallLinkInfo()
        : CallLinkInfo(Type::DataOnly, nullptr, CodeOrigin { })
    {
    }

    void initialize(VM&, CodeBlock*, CallType, CodeOrigin);
};

struct UnlinkedCallLinkInfo { };

struct BaselineUnlinkedCallLinkInfo : public JSC::UnlinkedCallLinkInfo {
    BytecodeIndex bytecodeIndex; // Currently, only used by baseline, so this can trivially produce a CodeOrigin.
    CodeLocationLabel<JSInternalPtrTag> doneLocation;

#if ENABLE(JIT)
    void setUpCall(CallLinkInfo::CallType) { }
#endif
};

#if ENABLE(JIT)

class DirectCallLinkInfo final : public CallLinkInfoBase {
    WTF_MAKE_NONCOPYABLE(DirectCallLinkInfo);
public:
    DirectCallLinkInfo(CodeOrigin codeOrigin, UseDataIC useDataIC, JSCell* owner, ExecutableBase* executable)
        : CallLinkInfoBase(CallSiteType::DirectCall)
        , m_useDataIC(useDataIC)
        , m_codeOrigin(codeOrigin)
        , m_owner(owner)
        , m_executable(executable)
    { }

    ~DirectCallLinkInfo()
    {
        m_target = { };
        m_codeBlock = nullptr;
    }

    void setCallType(CallType callType)
    {
        m_callType = callType;
    }

    CallType callType()
    {
        return static_cast<CallType>(m_callType);
    }

    CallMode callMode() const
    {
        return callModeFor(static_cast<CallType>(m_callType));
    }

    bool isTailCall() const
    {
        return callMode() == CallMode::Tail;
    }

    CodeSpecializationKind specializationKind() const
    {
        auto callType = static_cast<CallType>(m_callType);
        return specializationFromIsConstruct(callType == DirectConstruct);
    }

    void setSlowPathStart(CodeLocationLabel<JSInternalPtrTag> slowPathStart)
    {
        m_slowPathStart = slowPathStart;
    }

    static constexpr ptrdiff_t offsetOfTarget() { return OBJECT_OFFSETOF(DirectCallLinkInfo, m_target); };
    static constexpr ptrdiff_t offsetOfCodeBlock() { return OBJECT_OFFSETOF(DirectCallLinkInfo, m_codeBlock); };

    JSCell* owner() const { return m_owner; }

    void unlinkOrUpgradeImpl(VM&, CodeBlock* oldCodeBlock, CodeBlock* newCodeBlock);

    void visitWeak(VM&);

    CodeOrigin codeOrigin() const { return m_codeOrigin; }
    bool isDataIC() const { return m_useDataIC == UseDataIC::Yes; }

    MacroAssembler::JumpList emitDirectFastPath(CCallHelpers&);
    MacroAssembler::JumpList emitDirectTailCallFastPath(CCallHelpers&, ScopedLambda<void()>&& prepareForTailCall);
    void setCallTarget(CodeBlock*, CodeLocationLabel<JSEntryPtrTag>);
    void setMaxArgumentCountIncludingThis(unsigned);
    unsigned maxArgumentCountIncludingThis() const { return m_maxArgumentCountIncludingThis; }

    void reset();

    void validateSpeculativeRepatchOnMainThread(VM&);

private:
    CodeLocationLabel<JSInternalPtrTag> slowPathStart() const { return m_slowPathStart; }
    CodeLocationLabel<JSInternalPtrTag> fastPathStart() const { return m_fastPathStart; }

    void initialize();
    void repatchSpeculatively();

    CodeBlock* retrieveCodeBlock(FunctionExecutable*);
    CodePtr<JSEntryPtrTag> retrieveCodePtr(const ConcurrentJSLocker&, CodeBlock*);

    CallType m_callType : 4;
    UseDataIC m_useDataIC : 1;
    unsigned m_maxArgumentCountIncludingThis { 0 };
    CodePtr<JSEntryPtrTag> m_target;
    CodeBlock* m_codeBlock { nullptr }; // This is weakly held. And cleared whenever m_target is changed.
    CodeOrigin m_codeOrigin { };
    CodeLocationLabel<JSInternalPtrTag> m_slowPathStart;
    CodeLocationLabel<JSInternalPtrTag> m_fastPathStart;
    CodeLocationDataLabelPtr<JSInternalPtrTag> m_codeBlockLocation;
    CodeLocationNearCall<JSInternalPtrTag> m_callLocation NO_UNIQUE_ADDRESS;
    JSCell* m_owner;
    ExecutableBase* m_executable { nullptr }; // This is weakly held. DFG / FTL CommonData already ensures this.
};

class OptimizingCallLinkInfo final : public CallLinkInfo {
public:
    friend class CallLinkInfo;

    OptimizingCallLinkInfo()
        : CallLinkInfo(Type::Optimizing, nullptr, CodeOrigin { })
    {
    }

    OptimizingCallLinkInfo(CodeOrigin codeOrigin, JSCell* owner)
        : CallLinkInfo(Type::Optimizing, owner, codeOrigin)
    {
    }

    void setUpCall(CallType callType)
    {
        m_callType = callType;
    }

    void initializeFromDFGUnlinkedCallLinkInfo(VM&, const DFG::UnlinkedCallLinkInfo&, CodeBlock*);

private:
    void emitFastPath(CCallHelpers&);
    void emitTailCallFastPath(CCallHelpers&, ScopedLambda<void()>&& prepareForTailCall);

    CodeLocationNearCall<JSInternalPtrTag> m_callLocation NO_UNIQUE_ADDRESS;
};

#endif

inline JSCell* CallLinkInfo::ownerForSlowPath(CallFrame* calleeFrame)
{
    if (m_owner)
        return m_owner;

    // Right now, IC (Getter, Setter, Proxy IC etc.) / WasmToJS sets nullptr intentionally since we would like to share IC / WasmToJS thunk eventually.
    // However, in that case, each IC's data side will have CallLinkInfo.
    // At that time, they should have appropriate owner. So this is a hack only for now.
    // This should always works since IC only performs regular-calls and it never does tail-calls.
    return calleeFrame->callerFrame()->codeOwnerCell();
}

} // namespace JSC
