/*
 * Copyright (C) 2014-2022 Apple Inc. All rights reserved.
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

#if ENABLE(JIT)

#include "AccessCase.h"
#include "JITStubRoutine.h"
#include "JSFunctionInlines.h"
#include "MacroAssembler.h"
#include "ScratchRegisterAllocator.h"
#include "StructureStubClearingWatchpoint.h"
#include <wtf/FixedVector.h>
#include <wtf/Vector.h>

namespace JSC {
namespace DOMJIT {
class GetterSetter;
}

class CCallHelpers;
class CodeBlock;
class PolymorphicAccess;
class StructureStubInfo;
class InlineCacheHandler;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(PolymorphicAccess);

enum class CacheType : int8_t {
    Unset,
    GetByIdSelf,
    GetByIdPrototype,
    PutByIdReplace,
    InByIdSelf,
    Stub,
    ArrayLength,
    StringLength,
};

class AccessGenerationResult {
public:
    enum Kind {
        MadeNoChanges,
        GaveUp,
        Buffered,
        GeneratedNewCode,
        GeneratedFinalCode, // Generated so much code that we never want to generate code again.
        GeneratedMegamorphicCode, // Generated so much code that we never want to generate code again. And this is megamorphic code.
        ResetStubAndFireWatchpoints // We found out some data that makes us want to start over fresh with this stub. Currently, this happens when we detect poly proto.
    };


    AccessGenerationResult() = default;
    AccessGenerationResult(AccessGenerationResult&&) = default;
    AccessGenerationResult& operator=(AccessGenerationResult&&) = default;

    AccessGenerationResult(Kind kind)
        : m_kind(kind)
    {
        RELEASE_ASSERT(kind != GeneratedNewCode);
        RELEASE_ASSERT(kind != GeneratedFinalCode);
        RELEASE_ASSERT(kind != GeneratedMegamorphicCode);
    }

    AccessGenerationResult(Kind, Ref<InlineCacheHandler>&&);

    Kind kind() const { return m_kind; }

    bool madeNoChanges() const { return m_kind == MadeNoChanges; }
    bool gaveUp() const { return m_kind == GaveUp; }
    bool buffered() const { return m_kind == Buffered; }
    bool generatedNewCode() const { return m_kind == GeneratedNewCode; }
    bool generatedFinalCode() const { return m_kind == GeneratedFinalCode; }
    bool generatedMegamorphicCode() const { return m_kind == GeneratedMegamorphicCode; }
    bool shouldResetStubAndFireWatchpoints() const { return m_kind == ResetStubAndFireWatchpoints; }

    // If we gave up on this attempt to generate code, or if we generated the "final" code, then we
    // should give up after this.
    bool shouldGiveUpNow() const { return gaveUp() || generatedFinalCode(); }

    bool generatedSomeCode() const { return generatedNewCode() || generatedFinalCode() || generatedMegamorphicCode(); }

    void dump(PrintStream&) const;

    void addWatchpointToFire(InlineWatchpointSet& set, StringFireDetail detail)
    {
        m_watchpointsToFire.append(std::pair<InlineWatchpointSet&, StringFireDetail>(set, detail));
    }
    void fireWatchpoints(VM& vm)
    {
        ASSERT(m_kind == ResetStubAndFireWatchpoints);
        for (auto& pair : m_watchpointsToFire)
            pair.first.invalidate(vm, pair.second);
    }

    InlineCacheHandler* handler() const { return m_handler.get(); }

private:
    Kind m_kind { MadeNoChanges };
    RefPtr<InlineCacheHandler> m_handler;
    Vector<std::pair<InlineWatchpointSet&, StringFireDetail>> m_watchpointsToFire;
};

class PolymorphicAccess {
    WTF_MAKE_NONCOPYABLE(PolymorphicAccess);
    WTF_MAKE_STRUCT_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(PolymorphicAccess);
public:
    friend class InlineCacheCompiler;

    using ListType = Vector<Ref<AccessCase>, 4>;

    PolymorphicAccess();
    ~PolymorphicAccess();

    // When this fails (returns GaveUp), this will leave the old stub intact but you should not try
    // to call this method again for that PolymorphicAccess instance.
    AccessGenerationResult addCases(const GCSafeConcurrentJSLocker&, VM&, CodeBlock*, StructureStubInfo&, RefPtr<AccessCase>&& previousCase, Ref<AccessCase>);

    bool isEmpty() const { return m_list.isEmpty(); }
    unsigned size() const { return m_list.size(); }
    const AccessCase& at(unsigned i) const { return m_list[i].get(); }
    const AccessCase& operator[](unsigned i) const { return m_list[i].get(); }
    AccessCase& at(unsigned i) { return m_list[i].get(); }
    AccessCase& operator[](unsigned i) { return m_list[i].get(); }

    DECLARE_VISIT_AGGREGATE;

    // If this returns false then we are requesting a reset of the owning StructureStubInfo.
    bool visitWeak(VM&);

    // This returns true if it has marked everything it will ever marked. This can be used as an
    // optimization to then avoid calling this method again during the fixpoint.
    template<typename Visitor> void propagateTransitions(Visitor&) const;

    void dump(PrintStream& out) const;

private:
    friend class AccessCase;
    friend class CodeBlock;
    friend class InlineCacheCompiler;

    ListType m_list;
};

class InlineCacheHandler final : public RefCounted<InlineCacheHandler>, public TrailingArray<InlineCacheHandler, DataOnlyCallLinkInfo> {
    WTF_MAKE_NONCOPYABLE(InlineCacheHandler);
    friend class InlineCacheCompiler;
public:
    using Base = TrailingArray<InlineCacheHandler, DataOnlyCallLinkInfo>;

    static Ref<InlineCacheHandler> create(Ref<InlineCacheHandler>&&, CodeBlock*, StructureStubInfo&, Ref<PolymorphicAccessJITStubRoutine>&&, std::unique_ptr<StructureStubInfoClearingWatchpoint>&&, unsigned callLinkInfoCount);
    static Ref<InlineCacheHandler> createPreCompiled(Ref<InlineCacheHandler>&&, CodeBlock*, StructureStubInfo&, Ref<PolymorphicAccessJITStubRoutine>&&, std::unique_ptr<StructureStubInfoClearingWatchpoint>&&, AccessCase&, CacheType);

    CodePtr<JITStubRoutinePtrTag> callTarget() const { return m_callTarget; }
    CodePtr<JITStubRoutinePtrTag> jumpTarget() const { return m_jumpTarget; }

    void aboutToDie();
    bool containsPC(void* pc) const
    {
        if (!m_stubRoutine)
            return false;

        uintptr_t pcAsInt = std::bit_cast<uintptr_t>(pc);
        return m_stubRoutine->startAddress() <= pcAsInt && pcAsInt <= m_stubRoutine->endAddress();
    }

    CallLinkInfo* callLinkInfoAt(const ConcurrentJSLocker&, unsigned index);

    // If this returns false then we are requesting a reset of the owning StructureStubInfo.
    bool visitWeak(VM&);

    void dump(PrintStream&) const;

    static Ref<InlineCacheHandler> createNonHandlerSlowPath(CodePtr<JITStubRoutinePtrTag>);

    void addOwner(CodeBlock*);
    void removeOwner(CodeBlock*);

    PolymorphicAccessJITStubRoutine* stubRoutine() { return m_stubRoutine.get(); }

    InlineCacheHandler* next() const { return m_next.get(); }
    void setNext(RefPtr<InlineCacheHandler>&& next)
    {
        m_next = WTFMove(next);
    }

    AccessCase* accessCase() const { return m_accessCase.get(); }
    void setAccessCase(RefPtr<AccessCase>&& accessCase)
    {
        m_accessCase = WTFMove(accessCase);
    }

    static constexpr ptrdiff_t offsetOfCallTarget() { return OBJECT_OFFSETOF(InlineCacheHandler, m_callTarget); }
    static constexpr ptrdiff_t offsetOfJumpTarget() { return OBJECT_OFFSETOF(InlineCacheHandler, m_jumpTarget); }
    static constexpr ptrdiff_t offsetOfNext() { return OBJECT_OFFSETOF(InlineCacheHandler, m_next); }
    static constexpr ptrdiff_t offsetOfUid() { return OBJECT_OFFSETOF(InlineCacheHandler, m_uid); }
    static constexpr ptrdiff_t offsetOfStructureID() { return OBJECT_OFFSETOF(InlineCacheHandler, m_structureID); }
    static constexpr ptrdiff_t offsetOfOffset() { return OBJECT_OFFSETOF(InlineCacheHandler, m_offset); }
    static constexpr ptrdiff_t offsetOfNewStructureID() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s2.m_newStructureID); }
    static constexpr ptrdiff_t offsetOfNewSize() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s2.m_newSize); }
    static constexpr ptrdiff_t offsetOfOldSize() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s2.m_oldSize); }
    static constexpr ptrdiff_t offsetOfHolder() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s1.m_holder); }
    static constexpr ptrdiff_t offsetOfGlobalObject() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s1.m_globalObject); }
    static constexpr ptrdiff_t offsetOfCustomAccessor() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s1.m_customAccessor); }
    static constexpr ptrdiff_t offsetOfModuleNamespaceObject() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s3.m_moduleNamespaceObject); }
    static constexpr ptrdiff_t offsetOfModuleVariableSlot() { return OBJECT_OFFSETOF(InlineCacheHandler, u.s3.m_moduleVariableSlot); }
    static constexpr ptrdiff_t offsetOfCallLinkInfos() { return Base::offsetOfData(); }

    StructureID structureID() const { return m_structureID; }
    PropertyOffset offset() const { return m_offset; }
    JSCell* holder() const { return u.s1.m_holder; }
    size_t newSize() const { return u.s2.m_newSize; }
    size_t oldSize() const { return u.s2.m_oldSize; }
    StructureID newStructureID() const { return u.s2.m_newStructureID; }

    CacheType cacheType() const { return m_cacheType; }

    DECLARE_VISIT_AGGREGATE;

    // This returns true if it has marked everything it will ever marked. This can be used as an
    // optimization to then avoid calling this method again during the fixpoint.
    template<typename Visitor> void propagateTransitions(Visitor&) const;

private:
    InlineCacheHandler()
        : Base(0)
    {
        disableThreadingChecks();
    }

    InlineCacheHandler(Ref<InlineCacheHandler>&&, Ref<PolymorphicAccessJITStubRoutine>&&, std::unique_ptr<StructureStubInfoClearingWatchpoint>&&, unsigned callLinkInfoCount, CacheType);

    static Ref<InlineCacheHandler> createSlowPath(VM&, AccessType);

    CodePtr<JITStubRoutinePtrTag> m_callTarget;
    CodePtr<JITStubRoutinePtrTag> m_jumpTarget;
    StructureID m_structureID { };
    PropertyOffset m_offset { invalidOffset };
    UniquedStringImpl* m_uid { nullptr };
    union {
        struct {
            StructureID m_newStructureID { };
            unsigned m_newSize { };
            unsigned m_oldSize { };
        } s2 { };
        struct {
            JSCell* m_holder;
            JSGlobalObject* m_globalObject;
            void* m_customAccessor;
        } s1;
        struct {
            JSObject* m_moduleNamespaceObject;
            WriteBarrierBase<Unknown>* m_moduleVariableSlot;
        } s3;
    } u;
    CacheType m_cacheType { CacheType::Unset };
    RefPtr<InlineCacheHandler> m_next;
    RefPtr<PolymorphicAccessJITStubRoutine> m_stubRoutine;
    RefPtr<AccessCase> m_accessCase;
    std::unique_ptr<StructureStubInfoClearingWatchpoint> m_watchpoint;
};

inline bool canUseMegamorphicGetById(VM& vm, UniquedStringImpl* uid)
{
    return !parseIndex(*uid) && uid != vm.propertyNames->length && uid != vm.propertyNames->name && uid != vm.propertyNames->prototype && uid != vm.propertyNames->underscoreProto;
}

inline bool canUseMegamorphicInById(VM& vm, UniquedStringImpl* uid)
{
    return canUseMegamorphicGetById(vm, uid);
}

inline bool canUseMegamorphicPutById(VM& vm, UniquedStringImpl* uid)
{
    return !parseIndex(*uid) && uid != vm.propertyNames->underscoreProto;
}

bool canBeViaGlobalProxy(AccessCase::AccessType);

inline AccessGenerationResult::AccessGenerationResult(Kind kind, Ref<InlineCacheHandler>&& handler)
    : m_kind(kind)
    , m_handler(WTFMove(handler))
{
    RELEASE_ASSERT(kind == GeneratedNewCode || kind == GeneratedFinalCode || kind == GeneratedMegamorphicCode);
}

class InlineCacheCompiler {
public:
    InlineCacheCompiler(JITType jitType, VM& vm, JSGlobalObject* globalObject, ECMAMode ecmaMode, StructureStubInfo& stubInfo)
        : m_vm(vm)
        , m_globalObject(globalObject)
        , m_stubInfo(stubInfo)
        , m_ecmaMode(ecmaMode)
        , m_jitType(jitType)
    {
    }

    void restoreScratch();
    void succeed();

    struct SpillState {
        SpillState() = default;
        SpillState(ScalarRegisterSet&& regs, unsigned usedStackBytes)
            : spilledRegisters(WTFMove(regs))
            , numberOfStackBytesUsedForRegisterPreservation(usedStackBytes)
        {
        }

        ScalarRegisterSet spilledRegisters { };
        unsigned numberOfStackBytesUsedForRegisterPreservation { std::numeric_limits<unsigned>::max() };

        bool isEmpty() const { return numberOfStackBytesUsedForRegisterPreservation == std::numeric_limits<unsigned>::max(); }
    };

    const ScalarRegisterSet& calculateLiveRegistersForCallAndExceptionHandling();

    SpillState preserveLiveRegistersToStackForCall(const RegisterSet& extra = { });
    SpillState preserveLiveRegistersToStackForCallWithoutExceptions();

    void restoreLiveRegistersFromStackForCallWithThrownException(const SpillState&);
    void restoreLiveRegistersFromStackForCall(const SpillState&, const RegisterSet& dontRestore = { });

    const ScalarRegisterSet& liveRegistersForCall();

    DisposableCallSiteIndex callSiteIndexForExceptionHandling();

    const HandlerInfo& originalExceptionHandler();

    bool needsToRestoreRegistersIfException() const { return m_needsToRestoreRegistersIfException; }
    CallSiteIndex originalCallSiteIndex() const;

    void emitExplicitExceptionHandler();

    void setSpillStateForJSCall(SpillState& spillState)
    {
        if (!m_spillStateForJSCall.isEmpty()) {
            RELEASE_ASSERT(m_spillStateForJSCall.numberOfStackBytesUsedForRegisterPreservation == spillState.numberOfStackBytesUsedForRegisterPreservation,
                m_spillStateForJSCall.numberOfStackBytesUsedForRegisterPreservation,
                spillState.numberOfStackBytesUsedForRegisterPreservation);
            RELEASE_ASSERT(m_spillStateForJSCall.spilledRegisters == spillState.spilledRegisters,
                m_spillStateForJSCall.spilledRegisters.bitsForDebugging(),
                spillState.spilledRegisters.bitsForDebugging());
        }
        RELEASE_ASSERT(spillState.spilledRegisters.numberOfSetRegisters() || !spillState.numberOfStackBytesUsedForRegisterPreservation,
            spillState.spilledRegisters.numberOfSetRegisters(),
            spillState.numberOfStackBytesUsedForRegisterPreservation);
        m_spillStateForJSCall = spillState;
    }
    SpillState spillStateForJSCall() const
    {
        RELEASE_ASSERT(m_spillStateForJSCall.spilledRegisters.numberOfSetRegisters() || !m_spillStateForJSCall.numberOfStackBytesUsedForRegisterPreservation,
            m_spillStateForJSCall.spilledRegisters.numberOfSetRegisters(),
            m_spillStateForJSCall.numberOfStackBytesUsedForRegisterPreservation);
        return m_spillStateForJSCall;
    }

    ScratchRegisterAllocator makeDefaultScratchAllocator(GPRReg extraToLock = InvalidGPRReg);

    // Fall through on success. Two kinds of failures are supported: fall-through, which means that we
    // should try a different case; and failure, which means that this was the right case but it needs
    // help from the slow path.
    void generateWithGuard(unsigned index, AccessCase&, MacroAssembler::JumpList& fallThrough);

    // Fall through on success, add a jump to the failure list on failure.
    void generateWithoutGuard(unsigned index, AccessCase&);

    static bool canEmitIntrinsicGetter(StructureStubInfo&, JSFunction*, Structure*);

    VM& vm() { return m_vm; }

    AccessGenerationResult compile(const GCSafeConcurrentJSLocker&, PolymorphicAccess&, CodeBlock*);
    AccessGenerationResult compileHandler(const GCSafeConcurrentJSLocker&, Vector<AccessCase*, 16>&&, CodeBlock*, AccessCase&);

    static MacroAssemblerCodeRef<JITThunkPtrTag> generateSlowPathCode(VM&, AccessType);
    static Ref<InlineCacheHandler> generateSlowPathHandler(VM&, AccessType);

    static void emitDataICPrologue(CCallHelpers&);
    static void emitDataICEpilogue(CCallHelpers&);
    static CCallHelpers::Jump emitDataICCheckStructure(CCallHelpers&, GPRReg baseGPR, GPRReg scratchGPR);
    static CCallHelpers::JumpList emitDataICCheckUid(CCallHelpers&, bool isSymbol, JSValueRegs, GPRReg scratchGPR);
    static void emitDataICJumpNextHandler(CCallHelpers&);

    bool useHandlerIC() const;

private:
    CallSiteIndex callSiteIndexForExceptionHandlingOrOriginal();
    const ScalarRegisterSet& liveRegistersToPreserveAtExceptionHandlingCallSite();

    AccessGenerationResult compileOneAccessCaseHandler(const Vector<AccessCase*, 16>&, CodeBlock*, AccessCase&, Vector<WatchpointSet*, 8>&&);

    void emitDOMJITGetter(JSGlobalObject*, const DOMJIT::GetterSetter*, GPRReg baseForGetGPR);
    void emitModuleNamespaceLoad(ModuleNamespaceAccessCase&, MacroAssembler::JumpList& fallThrough);
    void emitProxyObjectAccess(unsigned index, AccessCase&, MacroAssembler::JumpList& fallThrough);
    void emitIntrinsicGetter(IntrinsicGetterAccessCase&);

    void generateWithConditionChecks(unsigned index, AccessCase&);
    void generateAccessCase(unsigned index, AccessCase&);

    MacroAssemblerCodeRef<JITStubRoutinePtrTag> compileGetByDOMJITHandler(CodeBlock*, const DOMJIT::GetterSetter*, std::optional<bool> isSymbol);
    template<typename Container> RefPtr<AccessCase> tryFoldToMegamorphic(CodeBlock*, const Container&);

    VM& m_vm;
    JSGlobalObject* const m_globalObject;
    StructureStubInfo& m_stubInfo;
    const ECMAMode m_ecmaMode { ECMAMode::sloppy() };
    JITType m_jitType;
    CCallHelpers* m_jit { nullptr };
    ScratchRegisterAllocator* m_allocator { nullptr };
    MacroAssembler::JumpList m_success;
    MacroAssembler::JumpList m_failAndRepatch;
    MacroAssembler::JumpList m_failAndIgnore;
    ScratchRegisterAllocator::PreservedState m_preservedReusedRegisterState;
    GPRReg m_scratchGPR { InvalidGPRReg };
    FPRReg m_scratchFPR { InvalidFPRReg };
    ScalarRegisterSet m_liveRegistersToPreserveAtExceptionHandlingCallSite;
    ScalarRegisterSet m_liveRegistersForCall;
    CallSiteIndex m_callSiteIndex;
    SpillState m_spillStateForJSCall;
    bool m_calculatedRegistersForCallAndExceptionHandling : 1 { false };
    bool m_needsToRestoreRegistersIfException : 1 { false };
    bool m_calculatedCallSiteIndex : 1 { false };
    Vector<StructureID, 4> m_weakStructures;
    Vector<ObjectPropertyCondition, 64> m_conditions;
    Vector<std::unique_ptr<OptimizingCallLinkInfo>, 16> m_callLinkInfos;
};

MacroAssemblerCodeRef<JITThunkPtrTag> getByIdLoadOwnPropertyHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByIdLoadPrototypePropertyHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByIdMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByIdCustomAccessorHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByIdCustomValueHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByIdGetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByIdProxyObjectLoadHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByIdModuleNamespaceLoadHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdReplaceHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdTransitionNonAllocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdTransitionNewlyAllocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdTransitionReallocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdTransitionReallocatingOutOfLineHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdCustomAccessorHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdCustomValueHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdStrictSetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByIdSloppySetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> inByIdHitHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> inByIdMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByIdDeleteHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByIdDeleteNonConfigurableHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByIdDeleteMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> instanceOfHitHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> instanceOfMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithStringLoadOwnPropertyHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithStringLoadPrototypePropertyHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithStringMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithStringCustomAccessorHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithStringCustomValueHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithStringGetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithSymbolLoadOwnPropertyHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithSymbolLoadPrototypePropertyHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithSymbolMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithSymbolCustomAccessorHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithSymbolCustomValueHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> getByValWithSymbolGetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringReplaceHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringTransitionNonAllocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringTransitionNewlyAllocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringTransitionReallocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringTransitionReallocatingOutOfLineHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringCustomAccessorHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringCustomValueHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringStrictSetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithStringSloppySetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolReplaceHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolTransitionNonAllocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolTransitionNewlyAllocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolTransitionReallocatingHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolTransitionReallocatingOutOfLineHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolCustomAccessorHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolCustomValueHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolStrictSetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> putByValWithSymbolSloppySetterHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> inByValWithStringHitHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> inByValWithStringMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> inByValWithSymbolHitHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> inByValWithSymbolMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByValWithStringDeleteHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByValWithStringDeleteNonConfigurableHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByValWithStringDeleteMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByValWithSymbolDeleteHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByValWithSymbolDeleteNonConfigurableHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> deleteByValWithSymbolDeleteMissHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> checkPrivateBrandHandler(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> setPrivateBrandHandler(VM&);

} // namespace JSC

namespace WTF {

void printInternal(PrintStream&, JSC::AccessGenerationResult::Kind);
void printInternal(PrintStream&, JSC::AccessCase::AccessType);
void printInternal(PrintStream&, JSC::AccessType);

} // namespace WTF

#endif // ENABLE(JIT)
