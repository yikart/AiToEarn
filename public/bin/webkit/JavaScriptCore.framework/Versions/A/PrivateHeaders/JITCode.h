/*
 * Copyright (C) 2008-2023 Apple Inc. All rights reserved.
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

#include "ArityCheckMode.h"
#include "CallFrame.h"
#include "CodeOrigin.h"
#include "JSCJSValue.h"
#include "MacroAssemblerCodeRef.h"
#include "RegisterAtOffsetList.h"
#include "RegisterSet.h"


namespace JSC {

class PCToCodeOriginMap;

namespace DFG {
class CommonData;
class JITCode;
}
namespace FTL {
class ForOSREntryJITCode;
class JITCode;
}
namespace DOMJIT {
class Signature;
}

class TrackedReferences;
class VM;

struct StructureStubInfoIndex {
    explicit StructureStubInfoIndex(unsigned index)
        : m_index(index)
    { }

    unsigned m_index { 0 };
};

enum class JITType : uint8_t {
    None = 0b000,
    HostCallThunk = 0b001,
    InterpreterThunk = 0b010,
    BaselineJIT = 0b011,
    DFGJIT = 0b100,
    FTLJIT = 0b101,
};
static constexpr unsigned widthOfJITType = 3;
static_assert(WTF::getMSBSetConstexpr(static_cast<std::underlying_type_t<JITType>>(JITType::FTLJIT)) + 1 == widthOfJITType);

#if CPU(ADDRESS64)
template<typename ByteSizedEnumType>
class JITConstant {
    static_assert(sizeof(ByteSizedEnumType) == 1);
    static constexpr uint64_t typeShift = 48;
    static constexpr uint64_t typeMask = 0xffull << typeShift;
    uint64_t m_encodedPointer;

    inline uint64_t encode(void* pointer, ByteSizedEnumType type)
    {
        uint64_t pointerBits = std::bit_cast<uint64_t>(pointer);
        return pointerBits | static_cast<uint64_t>(type) << 48;
    }
public:
    inline JITConstant()
        : m_encodedPointer(0)
    { }

    inline JITConstant(void* pointer, ByteSizedEnumType type)
        : m_encodedPointer(encode(pointer, type))
    { }

    template<typename OtherPointerType>
    JITConstant(CompactPointerTuple<OtherPointerType, ByteSizedEnumType> other)
        : m_encodedPointer(encode(other.pointer(), other.type()))
    { }

    inline uint32_t hash() const { return computeHash(m_encodedPointer); }
    inline void* pointer() const { return std::bit_cast<void*>(m_encodedPointer & ~typeMask); }
    void setPointer(void* pointer) { m_encodedPointer = encode(pointer, type()); }
    inline ByteSizedEnumType type() const { return static_cast<ByteSizedEnumType>((m_encodedPointer & typeMask) >> typeShift); }
    void setType(ByteSizedEnumType type) { m_encodedPointer = encode(pointer(), type); }

    friend bool operator==(const JITConstant&, const JITConstant&) = default;
};
#else
template<typename ByteSizedEnumType>
class JITConstant {
    void* m_pointer;
    ByteSizedEnumType m_type;
public:
    inline JITConstant()
        : m_pointer(nullptr)
    { }

    inline JITConstant(void* pointer, ByteSizedEnumType type)
        : m_pointer(pointer)
        , m_type(type)
    { }

    template<typename OtherPointerType>
    JITConstant(CompactPointerTuple<OtherPointerType, ByteSizedEnumType> other)
        : m_pointer(other.pointer())
        , m_type(other.type())
    { }

    inline uint32_t hash() const { return computeHash(m_pointer) * 31 + computeHash((unsigned)m_type); }
    inline void* pointer() const { return m_pointer; }
    void setPointer(void* pointer) { m_pointer = pointer; }
    inline ByteSizedEnumType type() const { return m_type; }
    void setType(ByteSizedEnumType type) { m_type = type; }

    friend bool operator==(const JITConstant&, const JITConstant&) = default;
};
#endif


class JITCode : public ThreadSafeRefCounted<JSC::JITCode> {
public:
    template<PtrTag tag> using CodeRef = MacroAssemblerCodeRef<tag>;

    static ASCIILiteral typeName(JITType);

    static JITType bottomTierJIT()
    {
        return JITType::BaselineJIT;
    }
    
    static JITType topTierJIT()
    {
        return JITType::FTLJIT;
    }
    
    static JITType nextTierJIT(JITType jitType)
    {
        switch (jitType) {
        case JITType::BaselineJIT:
            return JITType::DFGJIT;
        case JITType::DFGJIT:
            return JITType::FTLJIT;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return JITType::None;
        }
    }
    
    static bool isExecutableScript(JITType jitType)
    {
        switch (jitType) {
        case JITType::None:
        case JITType::HostCallThunk:
            return false;
        default:
            return true;
        }
    }
    
    static bool couldBeInterpreted(JITType jitType)
    {
        switch (jitType) {
        case JITType::InterpreterThunk:
        case JITType::BaselineJIT:
            return true;
        default:
            return false;
        }
    }
    
    static bool isJIT(JITType jitType)
    {
        switch (jitType) {
        case JITType::BaselineJIT:
        case JITType::DFGJIT:
        case JITType::FTLJIT:
            return true;
        default:
            return false;
        }
    }

    static bool isLowerTierPrecise(JITType expectedLower, JITType expectedHigher)
    {
        RELEASE_ASSERT(isExecutableScript(expectedLower));
        RELEASE_ASSERT(isExecutableScript(expectedHigher));
        return expectedLower < expectedHigher;
    }
    
    static bool isHigherTier(JITType expectedHigher, JITType expectedLower)
    {
        return isLowerTierPrecise(expectedLower, expectedHigher);
    }
    
    static bool isLowerOrSameTier(JITType expectedLower, JITType expectedHigher)
    {
        return !isHigherTier(expectedLower, expectedHigher);
    }
    
    static bool isHigherOrSameTier(JITType expectedHigher, JITType expectedLower)
    {
        return isLowerOrSameTier(expectedLower, expectedHigher);
    }
    
    static bool isOptimizingJIT(JITType jitType)
    {
        return jitType == JITType::DFGJIT || jitType == JITType::FTLJIT;
    }
    
    static bool isBaselineCode(JITType jitType)
    {
        return jitType == JITType::InterpreterThunk || jitType == JITType::BaselineJIT;
    }

    virtual const DOMJIT::Signature* signature() const { return nullptr; }

    virtual bool canSwapCodeRefForDebugger() const { return false; }
    virtual CodeRef<JSEntryPtrTag> swapCodeRefForDebugger(CodeRef<JSEntryPtrTag>);
    
    enum class ShareAttribute : uint8_t {
        NotShared,
        Shared
    };

protected:
    JITCode(JITType, CodePtr<JSEntryPtrTag> = nullptr, JITCode::ShareAttribute = JITCode::ShareAttribute::NotShared);
    
public:
    virtual ~JITCode();
    
    JITType jitType() const
    {
        return m_jitType;
    }

    bool isUnlinked() const;
    
    template<typename PointerType>
    static JITType jitTypeFor(PointerType jitCode)
    {
        if (!jitCode)
            return JITType::None;
        return jitCode->jitType();
    }

    void* addressForCall() const { return m_addressForCall.taggedPtr(); }

    virtual CodePtr<JSEntryPtrTag> addressForCall(ArityCheckMode) = 0;
    virtual void* executableAddressAtOffset(size_t offset) = 0;
    void* executableAddress() { return executableAddressAtOffset(0); }
    virtual void* dataAddressAtOffset(size_t offset) = 0;
    virtual unsigned offsetOf(void* pointerIntoCode) = 0;
    
    virtual DFG::CommonData* dfgCommon();
    virtual const DFG::CommonData* dfgCommon() const;
    virtual DFG::JITCode* dfg();
    virtual FTL::JITCode* ftl();
    virtual FTL::ForOSREntryJITCode* ftlForOSREntry();
    virtual void shrinkToFit();
    
    virtual void validateReferences(const TrackedReferences&);
    
    void* start() { return dataAddressAtOffset(0); }
    virtual size_t size() = 0;
    void* end() { return reinterpret_cast<void*>(reinterpret_cast<uintptr_t>(start()) + size()); }
    
    virtual bool contains(void*) = 0;

#if ENABLE(JIT)
    virtual RegisterSetBuilder liveRegistersToPreserveAtExceptionHandlingCallSite(CodeBlock*, CallSiteIndex);
    virtual std::optional<CodeOrigin> findPC(CodeBlock*, void* pc) { UNUSED_PARAM(pc); return std::nullopt; }
#endif

    Intrinsic intrinsic() { return m_intrinsic; }

    bool isShared() const { return m_shareAttribute == ShareAttribute::Shared; }

    virtual PCToCodeOriginMap* pcToCodeOriginMap() { return nullptr; }

    const RegisterAtOffsetList* calleeSaveRegisters() const;

    static constexpr ptrdiff_t offsetOfJITType() { return OBJECT_OFFSETOF(JSC::JITCode, m_jitType); }

private:
    const JITType m_jitType;
    const ShareAttribute m_shareAttribute;
protected:
    Intrinsic m_intrinsic { NoIntrinsic }; // Effective only in NativeExecutable.
    CodePtr<JSEntryPtrTag> m_addressForCall;
};

class JITCodeWithCodeRef : public JSC::JITCode {
protected:
    JITCodeWithCodeRef(JITType);
    JITCodeWithCodeRef(CodeRef<JSEntryPtrTag>, JITType, JITCode::ShareAttribute);

public:
    ~JITCodeWithCodeRef() override;

    void* executableAddressAtOffset(size_t offset) override;
    void* dataAddressAtOffset(size_t offset) override;
    unsigned offsetOf(void* pointerIntoCode) override;
    size_t size() override;
    bool contains(void*) override;

    CodeRef<JSEntryPtrTag> swapCodeRefForDebugger(CodeRef<JSEntryPtrTag>) override;

protected:
    RefPtr<ExecutableMemoryHandle> m_executableMemory;
};

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(DirectJITCode);
class DirectJITCode : public JITCodeWithCodeRef {
    WTF_MAKE_STRUCT_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(DirectJITCode);
public:
    DirectJITCode(JITType);
    DirectJITCode(CodeRef<JSEntryPtrTag>, CodePtr<JSEntryPtrTag> withArityCheck, JITType, JITCode::ShareAttribute = JITCode::ShareAttribute::NotShared);
    DirectJITCode(CodeRef<JSEntryPtrTag>, CodePtr<JSEntryPtrTag> withArityCheck, JITType, Intrinsic, JITCode::ShareAttribute = JITCode::ShareAttribute::NotShared); // For generated thunk.
    ~DirectJITCode() override;
    
    CodePtr<JSEntryPtrTag> addressForCall(ArityCheckMode) override;

protected:
    void initializeCodeRefForDFG(CodeRef<JSEntryPtrTag>, CodePtr<JSEntryPtrTag> withArityCheck);

private:
    CodePtr<JSEntryPtrTag> m_withArityCheck;
};

class NativeJITCode : public JITCodeWithCodeRef {
public:
    NativeJITCode(JITType);
    NativeJITCode(CodeRef<JSEntryPtrTag>, JITType, Intrinsic, JITCode::ShareAttribute = JITCode::ShareAttribute::NotShared);
    ~NativeJITCode() override;

    CodePtr<JSEntryPtrTag> addressForCall(ArityCheckMode) override;

    bool canSwapCodeRefForDebugger() const override { return true; }
};

class NativeDOMJITCode final : public NativeJITCode {
public:
    NativeDOMJITCode(CodeRef<JSEntryPtrTag>, JITType, Intrinsic, const DOMJIT::Signature*);
    ~NativeDOMJITCode() final = default;

    const DOMJIT::Signature* signature() const final { return m_signature; }

private:
    const DOMJIT::Signature* m_signature;
};

} // namespace JSC

namespace WTF {

class PrintStream;
void printInternal(PrintStream&, JSC::JITType);

} // namespace WTF
