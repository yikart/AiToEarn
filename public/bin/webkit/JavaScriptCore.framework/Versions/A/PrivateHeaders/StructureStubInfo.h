/*
 * Copyright (C) 2008-2024 Apple Inc. All rights reserved.
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

#include "CacheableIdentifier.h"
#include "CodeBlock.h"
#include "CodeOrigin.h"
#include "InlineCacheCompiler.h"
#include "Instruction.h"
#include "JITStubRoutine.h"
#include "MacroAssembler.h"
#include "Options.h"
#include "RegisterSet.h"
#include "Structure.h"
#include "StructureSet.h"
#include "StructureStubClearingWatchpoint.h"
#include "StubInfoSummary.h"
#include <wtf/Box.h>
#include <wtf/Lock.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

#if ENABLE(JIT)

namespace DFG {
struct UnlinkedStructureStubInfo;
}

class AccessCase;
class AccessGenerationResult;
class PolymorphicAccess;

#define JSC_FOR_EACH_STRUCTURE_STUB_INFO_ACCESS_TYPE(macro) \
    macro(GetById) \
    macro(GetByIdWithThis) \
    macro(GetByIdDirect) \
    macro(TryGetById) \
    macro(GetByVal) \
    macro(GetByValWithThis) \
    macro(PutByIdStrict) \
    macro(PutByIdSloppy) \
    macro(PutByIdDirectStrict) \
    macro(PutByIdDirectSloppy) \
    macro(PutByValStrict) \
    macro(PutByValSloppy) \
    macro(PutByValDirectStrict) \
    macro(PutByValDirectSloppy) \
    macro(DefinePrivateNameByVal) \
    macro(DefinePrivateNameById) \
    macro(SetPrivateNameByVal) \
    macro(SetPrivateNameById) \
    macro(InById) \
    macro(InByVal) \
    macro(HasPrivateName) \
    macro(HasPrivateBrand) \
    macro(InstanceOf) \
    macro(DeleteByIdStrict) \
    macro(DeleteByIdSloppy) \
    macro(DeleteByValStrict) \
    macro(DeleteByValSloppy) \
    macro(GetPrivateName) \
    macro(GetPrivateNameById) \
    macro(CheckPrivateBrand) \
    macro(SetPrivateBrand) \


enum class AccessType : int8_t {
#define JSC_DEFINE_ACCESS_TYPE(name) name,
    JSC_FOR_EACH_STRUCTURE_STUB_INFO_ACCESS_TYPE(JSC_DEFINE_ACCESS_TYPE)
#undef JSC_DEFINE_ACCESS_TYPE
};

#define JSC_INCREMENT_ACCESS_TYPE(name) + 1
static constexpr unsigned numberOfAccessTypes = 0 JSC_FOR_EACH_STRUCTURE_STUB_INFO_ACCESS_TYPE(JSC_INCREMENT_ACCESS_TYPE);
#undef JSC_INCREMENT_ACCESS_TYPE

struct UnlinkedStructureStubInfo;
struct BaselineUnlinkedStructureStubInfo;

class StructureStubInfo {
    WTF_MAKE_NONCOPYABLE(StructureStubInfo);
    WTF_MAKE_TZONE_ALLOCATED(StructureStubInfo);
public:
    StructureStubInfo(AccessType accessType, CodeOrigin codeOrigin)
        : codeOrigin(codeOrigin)
        , accessType(accessType)
        , bufferingCountdown(Options::initialRepatchBufferingCountdown())
    {
    }

    StructureStubInfo()
        : StructureStubInfo(AccessType::GetById, { })
    { }

    ~StructureStubInfo();

    void initGetByIdSelf(const ConcurrentJSLockerBase&, CodeBlock*, Structure* inlineAccessBaseStructure, PropertyOffset);
    void initArrayLength(const ConcurrentJSLockerBase&);
    void initStringLength(const ConcurrentJSLockerBase&);
    void initPutByIdReplace(const ConcurrentJSLockerBase&, CodeBlock*, Structure* inlineAccessBaseStructure, PropertyOffset);
    void initInByIdSelf(const ConcurrentJSLockerBase&, CodeBlock*, Structure* inlineAccessBaseStructure, PropertyOffset);

    AccessGenerationResult addAccessCase(const GCSafeConcurrentJSLocker&, JSGlobalObject*, CodeBlock*, ECMAMode, CacheableIdentifier, RefPtr<AccessCase>);

    void reset(const ConcurrentJSLockerBase&, CodeBlock*);

    void deref();
    void aboutToDie();

    void initializeFromUnlinkedStructureStubInfo(VM&, CodeBlock*, const BaselineUnlinkedStructureStubInfo&);
    void initializeFromDFGUnlinkedStructureStubInfo(CodeBlock*, const DFG::UnlinkedStructureStubInfo&);
    void initializePredefinedRegisters();

    DECLARE_VISIT_AGGREGATE;

    // Check if the stub has weak references that are dead. If it does, then it resets itself,
    // either entirely or just enough to ensure that those dead pointers don't get used anymore.
    void visitWeakReferences(const ConcurrentJSLockerBase&, CodeBlock*);
    
    // This returns true if it has marked everything that it will ever mark.
    template<typename Visitor> void propagateTransitions(Visitor&);
        
    StubInfoSummary summary(const ConcurrentJSLocker&, VM&) const;
    
    static StubInfoSummary summary(const ConcurrentJSLocker&, VM&, const StructureStubInfo*);

    CacheableIdentifier identifier() const { return m_identifier; }

    bool containsPC(void* pc) const;

    uint32_t inlineCodeSize() const
    {
        if (useDataIC)
            return 0;
        int32_t inlineSize = MacroAssembler::differenceBetweenCodePtr(startLocation, doneLocation);
        ASSERT(inlineSize >= 0);
        return inlineSize;
    }

    JSValueRegs valueRegs() const
    {
        return JSValueRegs(
#if USE(JSVALUE32_64)
            m_valueTagGPR,
#endif
            m_valueGPR);
    }

    JSValueRegs propertyRegs() const
    {
        return JSValueRegs(
#if USE(JSVALUE32_64)
            propertyTagGPR(),
#endif
            propertyGPR());
    }

    JSValueRegs baseRegs() const
    {
        return JSValueRegs(
#if USE(JSVALUE32_64)
            m_baseTagGPR,
#endif
            m_baseGPR);
    }

    bool thisValueIsInExtraGPR() const { return accessType == AccessType::GetByIdWithThis || accessType == AccessType::GetByValWithThis; }

#if ASSERT_ENABLED
    void checkConsistency();
#else
    ALWAYS_INLINE void checkConsistency() { }
#endif

    CacheType cacheType() const { return m_cacheType; }

    // Not ByVal and ById case: e.g. instanceof, by-index etc.
    ALWAYS_INLINE bool considerRepatchingCacheGeneric(VM& vm, CodeBlock* codeBlock, Structure* structure)
    {
        // We never cache non-cells.
        if (!structure) {
            sawNonCell = true;
            return false;
        }
        return considerRepatchingCacheImpl(vm, codeBlock, structure, CacheableIdentifier());
    }

    ALWAYS_INLINE bool considerRepatchingCacheBy(VM& vm, CodeBlock* codeBlock, Structure* structure, CacheableIdentifier impl)
    {
        // We never cache non-cells.
        if (!structure) {
            sawNonCell = true;
            return false;
        }
        return considerRepatchingCacheImpl(vm, codeBlock, structure, impl);
    }

    ALWAYS_INLINE bool considerRepatchingCacheMegamorphic(VM& vm)
    {
        return considerRepatchingCacheImpl(vm, nullptr, nullptr, CacheableIdentifier());
    }

    Structure* inlineAccessBaseStructure() const
    {
        return m_inlineAccessBaseStructureID.get();
    }

    CallLinkInfo* callLinkInfoAt(const ConcurrentJSLocker&, unsigned index, const AccessCase&);

    bool useHandlerIC() const { return useDataIC && Options::useHandlerIC(); }

    Vector<AccessCase*, 16> listedAccessCases(const AbstractLocker&) const;

private:
    AccessGenerationResult upgradeForPolyProtoIfNecessary(const GCSafeConcurrentJSLocker&, VM&, CodeBlock*, const Vector<AccessCase*, 16>&, AccessCase&);

    ALWAYS_INLINE bool considerRepatchingCacheImpl(VM& vm, CodeBlock* codeBlock, Structure* structure, CacheableIdentifier impl)
    {
        DisallowGC disallowGC;

        
        // This method is called from the Optimize variants of IC slow paths. The first part of this
        // method tries to determine if the Optimize variant should really behave like the
        // non-Optimize variant and leave the IC untouched.
        //
        // If we determine that we should do something to the IC then the next order of business is
        // to determine if this Structure would impact the IC at all. We know that it won't, if we
        // have already buffered something on its behalf. That's what the m_bufferedStructures set is
        // for.
        
        everConsidered = true;
        if (!countdown) {
            // Check if we have been doing repatching too frequently. If so, then we should cool off
            // for a while.
            WTF::incrementWithSaturation(repatchCount);
            if (repatchCount > Options::repatchCountForCoolDown()) {
                // We've been repatching too much, so don't do it now.
                repatchCount = 0;
                // The amount of time we require for cool-down depends on the number of times we've
                // had to cool down in the past. The relationship is exponential. The max value we
                // allow here is 2^256 - 2, since the slow paths may increment the count to indicate
                // that they'd like to temporarily skip patching just this once.
                countdown = WTF::leftShiftWithSaturation(
                    static_cast<uint8_t>(Options::initialCoolDownCount()),
                    numberOfCoolDowns,
                    static_cast<uint8_t>(std::numeric_limits<uint8_t>::max() - 1));
                WTF::incrementWithSaturation(numberOfCoolDowns);
                
                // We may still have had something buffered. Trigger generation now.
                bufferingCountdown = 0;
                return true;
            }
            
            // We don't want to return false due to buffering indefinitely.
            if (!bufferingCountdown) {
                // Note that when this returns true, it's possible that we will not even get an
                // AccessCase because this may cause Repatch.cpp to simply do an in-place
                // repatching.
                return true;
            }
            
            bufferingCountdown--;

            if (!structure)
                return true;
            
            // Now protect the IC buffering. We want to proceed only if this is a structure that
            // we don't already have a case buffered for. Note that if this returns true but the
            // bufferingCountdown is not zero then we will buffer the access case for later without
            // immediately generating code for it.
            //
            // NOTE: This will behave oddly for InstanceOf if the user varies the prototype but not
            // the base's structure. That seems unlikely for the canonical use of instanceof, where
            // the prototype is fixed.
            bool isNewlyAdded = false;
            StructureID structureID = structure->id();
            {
                Locker locker { m_bufferedStructuresLock };
                if (std::holds_alternative<std::monostate>(m_bufferedStructures)) {
                    if (m_identifier)
                        m_bufferedStructures = Vector<StructureID>();
                    else
                        m_bufferedStructures = Vector<std::tuple<StructureID, CacheableIdentifier>>();
                }
                WTF::switchOn(m_bufferedStructures,
                    [&](std::monostate) { },
                    [&](Vector<StructureID>& structures) {
                        for (auto bufferedStructureID : structures) {
                            if (bufferedStructureID == structureID)
                                return;
                        }
                        structures.append(structureID);
                        isNewlyAdded = true;
                    },
                    [&](Vector<std::tuple<StructureID, CacheableIdentifier>>& structures) {
                        ASSERT(!m_identifier);
                        for (auto& [bufferedStructureID, bufferedCacheableIdentifier] : structures) {
                            if (bufferedStructureID == structureID && bufferedCacheableIdentifier == impl)
                                return;
                        }
                        structures.append(std::tuple { structureID, impl });
                        isNewlyAdded = true;
                    });
            }
            if (isNewlyAdded)
                vm.writeBarrier(codeBlock);
            return isNewlyAdded;
        }
        countdown--;
        return false;
    }

    void setCacheType(const ConcurrentJSLockerBase&, CacheType);

    void clearBufferedStructures()
    {
        Locker locker { m_bufferedStructuresLock };
        WTF::switchOn(m_bufferedStructures,
            [&](std::monostate) { },
            [&](Vector<StructureID>& structures) {
                structures.shrink(0);
            },
            [&](Vector<std::tuple<StructureID, CacheableIdentifier>>& structures) {
                structures.shrink(0);
            });
    }

    void setInlinedHandler(CodeBlock*, Ref<InlineCacheHandler>&&);
    void clearInlinedHandler(CodeBlock*);
    void initializeWithUnitHandler(CodeBlock*, Ref<InlineCacheHandler>&&);
    void prependHandler(CodeBlock*, Ref<InlineCacheHandler>&&, bool isMegamorphic);
    void rewireStubAsJumpInAccess(CodeBlock*, Ref<InlineCacheHandler>&&);

public:
    static constexpr ptrdiff_t offsetOfByIdSelfOffset() { return OBJECT_OFFSETOF(StructureStubInfo, byIdSelfOffset); }
    static constexpr ptrdiff_t offsetOfInlineAccessBaseStructureID() { return OBJECT_OFFSETOF(StructureStubInfo, m_inlineAccessBaseStructureID); }
    static constexpr ptrdiff_t offsetOfInlineHolder() { return OBJECT_OFFSETOF(StructureStubInfo, m_inlineHolder); }
    static constexpr ptrdiff_t offsetOfDoneLocation() { return OBJECT_OFFSETOF(StructureStubInfo, doneLocation); }
    static constexpr ptrdiff_t offsetOfSlowPathStartLocation() { return OBJECT_OFFSETOF(StructureStubInfo, slowPathStartLocation); }
    static constexpr ptrdiff_t offsetOfSlowOperation() { return OBJECT_OFFSETOF(StructureStubInfo, m_slowOperation); }
    static constexpr ptrdiff_t offsetOfCountdown() { return OBJECT_OFFSETOF(StructureStubInfo, countdown); }
    static constexpr ptrdiff_t offsetOfCallSiteIndex() { return OBJECT_OFFSETOF(StructureStubInfo, callSiteIndex); }
    static constexpr ptrdiff_t offsetOfHandler() { return OBJECT_OFFSETOF(StructureStubInfo, m_handler); }
    static constexpr ptrdiff_t offsetOfGlobalObject() { return OBJECT_OFFSETOF(StructureStubInfo, m_globalObject); }

    JSGlobalObject* globalObject() const { return m_globalObject; }

    void resetStubAsJumpInAccess(CodeBlock*);

    GPRReg thisGPR() const { return m_extraGPR; }
    GPRReg prototypeGPR() const { return m_extraGPR; }
    GPRReg brandGPR() const { return m_extraGPR; }
    GPRReg propertyGPR() const
    {
        switch (accessType) {
        case AccessType::GetByValWithThis:
            return m_extra2GPR;
        default:
            return m_extraGPR;
        }
    }

#if USE(JSVALUE32_64)
    GPRReg thisTagGPR() const { return m_extraTagGPR; }
    GPRReg prototypeTagGPR() const { return m_extraTagGPR; }
    GPRReg propertyTagGPR() const
    {
        switch (accessType) {
        case AccessType::GetByValWithThis:
            return m_extra2TagGPR;
        default:
            return m_extraTagGPR;
        }
    }
#endif

    CodeOrigin codeOrigin { };
    PropertyOffset byIdSelfOffset;
    WriteBarrierStructureID m_inlineAccessBaseStructureID;
    JSCell* m_inlineHolder { nullptr };
    CacheableIdentifier m_identifier;
    // This is either the start of the inline IC for *byId caches. or the location of patchable jump for 'instanceof' caches.
    // If useDataIC is true, then it is nullptr.
    CodeLocationLabel<JITStubRoutinePtrTag> startLocation;
    CodeLocationLabel<JSInternalPtrTag> doneLocation;
    CodeLocationLabel<JITStubRoutinePtrTag> slowPathStartLocation;

    union {
        CodeLocationCall<JSInternalPtrTag> m_slowPathCallLocation;
        CodePtr<OperationPtrTag> m_slowOperation;
    };

    JSGlobalObject* m_globalObject { nullptr };
private:
    std::unique_ptr<PolymorphicAccess> m_stub;
    RefPtr<InlineCacheHandler> m_inlinedHandler;
    RefPtr<InlineCacheHandler> m_handler;
    // Represents those structures that already have buffered AccessCases in the PolymorphicAccess.
    // Note that it's always safe to clear this. If we clear it prematurely, then if we see the same
    // structure again during this buffering countdown, we will create an AccessCase object for it.
    // That's not so bad - we'll get rid of the redundant ones once we regenerate.
    std::variant<std::monostate, Vector<StructureID>, Vector<std::tuple<StructureID, CacheableIdentifier>>> m_bufferedStructures WTF_GUARDED_BY_LOCK(m_bufferedStructuresLock);
public:

    ScalarRegisterSet usedRegisters;

    CallSiteIndex callSiteIndex;

    GPRReg m_baseGPR { InvalidGPRReg };
    GPRReg m_valueGPR { InvalidGPRReg };
    GPRReg m_extraGPR { InvalidGPRReg };
    GPRReg m_extra2GPR { InvalidGPRReg };
    GPRReg m_stubInfoGPR { InvalidGPRReg };
    GPRReg m_arrayProfileGPR { InvalidGPRReg };
#if USE(JSVALUE32_64)
    GPRReg m_valueTagGPR { InvalidGPRReg };
    // FIXME: [32-bits] Check if StructureStubInfo::m_baseTagGPR is used somewhere.
    // https://bugs.webkit.org/show_bug.cgi?id=204726
    GPRReg m_baseTagGPR { InvalidGPRReg };
    GPRReg m_extraTagGPR { InvalidGPRReg };
    GPRReg m_extra2TagGPR { InvalidGPRReg };
#endif

    AccessType accessType { AccessType::GetById };
private:
    CacheType m_cacheType { CacheType::Unset };
public:
    CacheType preconfiguredCacheType { CacheType::Unset };
    // We repatch only when this is zero. If not zero, we decrement.
    // Setting 1 for a totally clear stub, we'll patch it after the first execution.
    uint8_t countdown { 1 };
    uint8_t repatchCount { 0 };
    uint8_t numberOfCoolDowns { 0 };
    uint8_t bufferingCountdown;
private:
    Lock m_bufferedStructuresLock;
public:
    bool resetByGC : 1 { false };
    bool tookSlowPath : 1 { false };
    bool everConsidered : 1 { false };
    bool prototypeIsKnownObject : 1 { false }; // Only relevant for InstanceOf.
    bool sawNonCell : 1 { false };
    bool propertyIsString : 1 { false };
    bool propertyIsInt32 : 1 { false };
    bool propertyIsSymbol : 1 { false };
    bool canBeMegamorphic : 1 { false };
    bool useDataIC : 1 { false };
};

inline CodeOrigin getStructureStubInfoCodeOrigin(StructureStubInfo& structureStubInfo)
{
    return structureStubInfo.codeOrigin;
}

inline auto appropriateGetByIdOptimizeFunction(AccessType type) -> decltype(&operationGetByIdOptimize)
{
    switch (type) {
    case AccessType::GetById:
        return operationGetByIdOptimize;
    case AccessType::TryGetById:
        return operationTryGetByIdOptimize;
    case AccessType::GetByIdDirect:
        return operationGetByIdDirectOptimize;
    case AccessType::GetPrivateNameById:
        return operationGetPrivateNameByIdOptimize;
    case AccessType::GetByIdWithThis:
    default:
        ASSERT_NOT_REACHED();
        return nullptr;
    }
}

inline auto appropriateGetByIdGenericFunction(AccessType type) -> decltype(&operationGetByIdGeneric)
{
    switch (type) {
    case AccessType::GetById:
        return operationGetByIdGeneric;
    case AccessType::TryGetById:
        return operationTryGetByIdGeneric;
    case AccessType::GetByIdDirect:
        return operationGetByIdDirectGeneric;
    case AccessType::GetPrivateNameById:
        return operationGetPrivateNameByIdGeneric;
    case AccessType::GetByIdWithThis:
    default:
        ASSERT_NOT_REACHED();
        return nullptr;
    }
}

inline auto appropriatePutByIdOptimizeFunction(AccessType type) -> decltype(&operationPutByIdStrictOptimize)
{
    switch (type) {
    case AccessType::PutByIdStrict:
        return operationPutByIdStrictOptimize;
    case AccessType::PutByIdSloppy:
        return operationPutByIdSloppyOptimize;
    case AccessType::PutByIdDirectStrict:
        return operationPutByIdDirectStrictOptimize;
    case AccessType::PutByIdDirectSloppy:
        return operationPutByIdDirectSloppyOptimize;
    case AccessType::DefinePrivateNameById:
        return operationPutByIdDefinePrivateFieldStrictOptimize;
    case AccessType::SetPrivateNameById:
        return operationPutByIdSetPrivateFieldStrictOptimize;
    default:
        break;
    }
    // Make win port compiler happy
    RELEASE_ASSERT_NOT_REACHED();
    return nullptr;
}

inline bool hasConstantIdentifier(AccessType accessType)
{
    switch (accessType) {
    case AccessType::DeleteByValStrict:
    case AccessType::DeleteByValSloppy:
    case AccessType::GetByVal:
    case AccessType::GetPrivateName:
    case AccessType::InstanceOf:
    case AccessType::InByVal:
    case AccessType::HasPrivateName:
    case AccessType::HasPrivateBrand:
    case AccessType::GetByValWithThis:
    case AccessType::PutByValStrict:
    case AccessType::PutByValSloppy:
    case AccessType::PutByValDirectStrict:
    case AccessType::PutByValDirectSloppy:
    case AccessType::DefinePrivateNameByVal:
    case AccessType::SetPrivateNameByVal:
    case AccessType::SetPrivateBrand:
    case AccessType::CheckPrivateBrand:
        return false;
    case AccessType::DeleteByIdStrict:
    case AccessType::DeleteByIdSloppy:
    case AccessType::InById:
    case AccessType::TryGetById:
    case AccessType::GetByIdDirect:
    case AccessType::GetById:
    case AccessType::GetPrivateNameById:
    case AccessType::GetByIdWithThis:
    case AccessType::PutByIdStrict:
    case AccessType::PutByIdSloppy:
    case AccessType::PutByIdDirectStrict:
    case AccessType::PutByIdDirectSloppy:
    case AccessType::DefinePrivateNameById:
    case AccessType::SetPrivateNameById:
        return true;
    }
    return false;
}

struct UnlinkedStructureStubInfo {
    AccessType accessType;
    CacheType preconfiguredCacheType { CacheType::Unset };
    bool propertyIsInt32 : 1 { false };
    bool propertyIsString : 1 { false };
    bool propertyIsSymbol : 1 { false };
    bool prototypeIsKnownObject : 1 { false };
    bool canBeMegamorphic : 1 { false };
    CacheableIdentifier m_identifier; // This only comes from already marked one. Thus, we do not mark it via GC.
    CodeLocationLabel<JSInternalPtrTag> doneLocation;
    CodeLocationLabel<JITStubRoutinePtrTag> slowPathStartLocation;
};

struct BaselineUnlinkedStructureStubInfo : JSC::UnlinkedStructureStubInfo {
    BytecodeIndex bytecodeIndex;
};

using StubInfoMap = UncheckedKeyHashMap<CodeOrigin, StructureStubInfo*, CodeOriginApproximateHash>;

#endif

} // namespace JSC

namespace WTF {

#if ENABLE(JIT)

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::AccessType> : public IntHash<JSC::AccessType> { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::AccessType> : public StrongEnumHashTraits<JSC::AccessType> { };

#endif

} // namespace WTF
