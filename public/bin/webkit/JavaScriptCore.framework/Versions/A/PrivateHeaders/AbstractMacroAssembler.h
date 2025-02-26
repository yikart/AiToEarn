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

#include "ARM64Assembler.h"
#include "AbortReason.h"
#include "AssemblerBuffer.h"
#include "AssemblerCommon.h"
#include "AssemblyComments.h"
#include "CPU.h"
#include "CodeLocation.h"
#include "JSCJSValue.h"
#include "JSCPtrTag.h"
#include "MacroAssemblerCodeRef.h"
#include "MacroAssemblerHelpers.h"
#include "Options.h"
#include <wtf/Noncopyable.h>
#include <wtf/SetForScope.h>
#include <wtf/SharedTask.h>
#include <wtf/StringPrintStream.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakRandom.h>

namespace JSC {

#if ENABLE(ASSEMBLER)

class AllowMacroScratchRegisterUsage;
class LinkBuffer;
class Watchpoint;

template<typename T> class DisallowMacroScratchRegisterUsage;

namespace DFG {
struct OSRExit;
}

#define JIT_COMMENT(jit, ...) do { if (UNLIKELY(Options::needDisassemblySupport())) { (jit).comment(__VA_ARGS__); } else { (void) jit; } } while (0)

class AbstractMacroAssemblerBase {
    WTF_MAKE_TZONE_ALLOCATED(AbstractMacroAssemblerBase);
public:
    enum StatusCondition {
        Success,
        Failure
    };
    
    static StatusCondition invert(StatusCondition condition)
    {
        switch (condition) {
        case Success:
            return Failure;
        case Failure:
            return Success;
        }
        RELEASE_ASSERT_NOT_REACHED();
        return Success;
    }

protected:
    uint32_t random()
    {
        if (!m_randomSource)
            initializeRandom();
        return m_randomSource->getUint32();
    }

private:
    JS_EXPORT_PRIVATE void initializeRandom();

    std::optional<WeakRandom> m_randomSource;
};

template <class AssemblerType>
class AbstractMacroAssembler : public AbstractMacroAssemblerBase {
public:
    typedef AbstractMacroAssembler<AssemblerType> AbstractMacroAssemblerType;
    typedef AssemblerType AssemblerType_T;
    friend class SuppressRegisetrAllocationValidation;

    template<PtrTag tag> using CodeRef = MacroAssemblerCodeRef<tag>;

    enum class CPUIDCheckState {
        NotChecked,
        Clear,
        Set
    };

    class Jump;

    typedef typename AssemblerType::RegisterID RegisterID;
    typedef typename AssemblerType::SPRegisterID SPRegisterID;
    typedef typename AssemblerType::FPRegisterID FPRegisterID;
    
    static constexpr RegisterID firstRegister() { return AssemblerType::firstRegister(); }
    static constexpr RegisterID lastRegister() { return AssemblerType::lastRegister(); }
    static constexpr unsigned numberOfRegisters() { return AssemblerType::numberOfRegisters(); }
    static ASCIILiteral gprName(RegisterID id) { return AssemblerType::gprName(id); }

    static constexpr SPRegisterID firstSPRegister() { return AssemblerType::firstSPRegister(); }
    static constexpr SPRegisterID lastSPRegister() { return AssemblerType::lastSPRegister(); }
    static constexpr unsigned numberOfSPRegisters() { return AssemblerType::numberOfSPRegisters(); }
    static ASCIILiteral sprName(SPRegisterID id) { return AssemblerType::sprName(id); }

    static constexpr FPRegisterID firstFPRegister() { return AssemblerType::firstFPRegister(); }
    static constexpr FPRegisterID lastFPRegister() { return AssemblerType::lastFPRegister(); }
    static constexpr unsigned numberOfFPRegisters() { return AssemblerType::numberOfFPRegisters(); }
    static ASCIILiteral fprName(FPRegisterID id) { return AssemblerType::fprName(id); }

    // Section 1: MacroAssembler operand types
    //
    // The following types are used as operands to MacroAssembler operations,
    // describing immediate  and memory operands to the instructions to be planted.

    enum Scale {
        TimesOne,
        TimesTwo,
        TimesFour,
        TimesEight,
        ScalePtr = isAddress64Bit() ? TimesEight : TimesFour,
        ScaleRegWord = isRegister64Bit() ? TimesEight : TimesFour,
    };

    enum class Extend : uint8_t {
        ZExt32,
        SExt32,
        None
    };

    struct BaseIndex;
    
    static RegisterID withSwappedRegister(RegisterID original, RegisterID left, RegisterID right)
    {
        if (original == left)
            return right;
        if (original == right)
            return left;
        return original;
    }
    
    // Address:
    //
    // Describes a simple base-offset address.
    struct Address {
        explicit Address(RegisterID base, int32_t offset = 0)
            : base(base)
            , offset(offset)
        {
        }
        
        Address withOffset(int32_t additionalOffset)
        {
            return Address(base, offset + additionalOffset);
        }
        
        Address withSwappedRegister(RegisterID left, RegisterID right)
        {
            return Address(AbstractMacroAssembler::withSwappedRegister(base, left, right), offset);
        }
        
        BaseIndex indexedBy(RegisterID index, Scale) const;
        
        friend bool operator==(const Address&, const Address&) = default;

        RegisterID base;
        int32_t offset;
    };

    struct ExtendedAddress {
        explicit ExtendedAddress(RegisterID base, intptr_t offset = 0)
            : base(base)
            , offset(offset)
        {
        }
        
        friend bool operator==(const ExtendedAddress&, const ExtendedAddress&) = default;

        RegisterID base;
        intptr_t offset;
    };

    // BaseIndex:
    //
    // Describes a complex addressing mode.
    struct BaseIndex {
        BaseIndex(RegisterID base, RegisterID index, Scale scale, int32_t offset = 0, Extend extend = Extend::None)
            : base(base)
            , index(index)
            , scale(scale)
            , offset(offset)
            , extend(extend)
        {
#if !CPU(ARM64)
            ASSERT(extend == Extend::None);
#endif
        }
        
        BaseIndex withOffset(int32_t additionalOffset)
        {
            return BaseIndex(base, index, scale, offset + additionalOffset);
        }

        BaseIndex withSwappedRegister(RegisterID left, RegisterID right)
        {
            return BaseIndex(AbstractMacroAssembler::withSwappedRegister(base, left, right), AbstractMacroAssembler::withSwappedRegister(index, left, right), scale, offset);
        }

        friend bool operator==(const BaseIndex&, const BaseIndex&) = default;

        RegisterID base;
        RegisterID index;
        Scale scale;
        int32_t offset;
        Extend extend;
    };

    // PreIndexAddress:
    //
    // Describes an address with base address and pre-increment/decrement index.
    struct PreIndexAddress {
        PreIndexAddress(RegisterID base, int index)
            : base(base)
            , index(index)
        {
        }

        RegisterID base;
        int index;
    };

    // PostIndexAddress:
    //
    // Describes an address with base address and post-increment/decrement index.
    struct PostIndexAddress {
        PostIndexAddress(RegisterID base, int index)
            : base(base)
            , index(index)
        {
        }

        RegisterID base;
        int index;
    };

    // AbsoluteAddress:
    //
    // Describes an memory operand given by a pointer.  For regular load & store
    // operations an unwrapped void* will be used, rather than using this.
    struct AbsoluteAddress {
        explicit AbsoluteAddress(const void* ptr)
            : m_ptr(ptr)
        {
        }

        const void* m_ptr;
    };

    // TrustedImm:
    //
    // An empty super class of each of the TrustedImm types. This class is used for template overloads
    // on a TrustedImm type via std::is_base_of.
    struct TrustedImm { };

    // TrustedImmPtr:
    //
    // A pointer sized immediate operand to an instruction - this is wrapped
    // in a class requiring explicit construction in order to differentiate
    // from pointers used as absolute addresses to memory operations
    struct TrustedImmPtr : public TrustedImm {
        constexpr TrustedImmPtr() { }
        
        explicit constexpr TrustedImmPtr(const void* value)
            : m_value(value)
        {
        }

        template<typename ReturnType, typename... Arguments>
        explicit TrustedImmPtr(ReturnType(*value)(Arguments...))
            : m_value(reinterpret_cast<void*>(value))
        {
        }

#if OS(WINDOWS)
        template<typename ReturnType, typename... Arguments>
        explicit TrustedImmPtr(ReturnType(SYSV_ABI *value)(Arguments...))
            : m_value(reinterpret_cast<void*>(value))
        {
        }
#endif

        explicit constexpr TrustedImmPtr(std::nullptr_t)
        {
        }

        explicit constexpr TrustedImmPtr(size_t value)
            : m_value(reinterpret_cast<void*>(value))
        {
        }

        constexpr intptr_t asIntptr()
        {
            return reinterpret_cast<intptr_t>(m_value);
        }

        constexpr void* asPtr()
        {
            return const_cast<void*>(m_value);
        }

        const void* m_value { nullptr };
    };

    struct ImmPtr : private TrustedImmPtr
    {
        explicit constexpr ImmPtr(const void* value)
            : TrustedImmPtr(value)
        {
        }

        constexpr TrustedImmPtr asTrustedImmPtr() { return *this; }
    };

    // TrustedImm32:
    //
    // A 32bit immediate operand to an instruction - this is wrapped in a
    // class requiring explicit construction in order to prevent RegisterIDs
    // (which are implemented as an enum) from accidentally being passed as
    // immediate values.
    struct TrustedImm32 : public TrustedImm {
        constexpr TrustedImm32() = default;
        
        explicit constexpr TrustedImm32(int32_t value)
            : m_value(value)
        {
        }

#if !CPU(X86_64)
        explicit constexpr TrustedImm32(TrustedImmPtr ptr)
            : m_value(ptr.asIntptr())
        {
        }
#endif

        int32_t m_value { 0 };
    };


    struct Imm32 : private TrustedImm32 {
        explicit constexpr Imm32(int32_t value)
            : TrustedImm32(value)
        {
        }
#if !CPU(X86_64)
        explicit constexpr Imm32(TrustedImmPtr ptr)
            : TrustedImm32(ptr)
        {
        }
#endif
        constexpr const TrustedImm32& asTrustedImm32() const { return *this; }

    };
    
    // TrustedImm64:
    //
    // A 64bit immediate operand to an instruction - this is wrapped in a
    // class requiring explicit construction in order to prevent RegisterIDs
    // (which are implemented as an enum) from accidentally being passed as
    // immediate values.
    struct TrustedImm64 : TrustedImm {
        constexpr TrustedImm64() { }
        
        explicit constexpr TrustedImm64(int64_t value)
            : m_value(value)
        {
        }

#if CPU(X86_64) || CPU(ARM64) || CPU(RISCV64)
        explicit constexpr TrustedImm64(TrustedImmPtr ptr)
            : m_value(ptr.asIntptr())
        {
        }
#endif

        int64_t m_value;
    };

    struct Imm64 : private TrustedImm64 {
        explicit constexpr Imm64(int64_t value)
            : TrustedImm64(value)
        {
        }
#if CPU(X86_64) || CPU(ARM64) || CPU(RISCV64)
        explicit constexpr Imm64(TrustedImmPtr ptr)
            : TrustedImm64(ptr)
        {
        }
#endif
        constexpr const TrustedImm64& asTrustedImm64() const { return *this; }
    };
    
    // Section 2: MacroAssembler code buffer handles
    //
    // The following types are used to reference items in the code buffer
    // during JIT code generation.  For example, the type Jump is used to
    // track the location of a jump instruction so that it may later be
    // linked to a label marking its destination.


    // Label:
    //
    // A Label records a point in the generated instruction stream, typically such that
    // it may be used as a destination for a jump.
    class Label {
        friend class AbstractMacroAssembler<AssemblerType>;
        friend struct DFG::OSRExit;
        friend class Jump;
        template<PtrTag> friend class MacroAssemblerCodeRef;
        friend class LinkBuffer;
        friend class Watchpoint;

    public:
        Label() = default;

        Label(AbstractMacroAssemblerType* masm)
            : m_label(masm->m_assembler.label())
        {
            masm->invalidateAllTempRegisters();
        }

        friend bool operator==(const Label&, const Label&) = default;

        bool isSet() const { return m_label.isSet(); }
    private:
        AssemblerLabel m_label;
    };
    
    // ConvertibleLoadLabel:
    //
    // A ConvertibleLoadLabel records a loadPtr instruction that can be patched to an addPtr
    // so that:
    //
    // loadPtr(Address(a, i), b)
    //
    // becomes:
    //
    // addPtr(TrustedImmPtr(i), a, b)
    class ConvertibleLoadLabel {
        friend class AbstractMacroAssembler<AssemblerType>;
        friend class LinkBuffer;
        
    public:
        ConvertibleLoadLabel()
        {
        }
        
        ConvertibleLoadLabel(AbstractMacroAssemblerType* masm)
            : m_label(masm->m_assembler.labelIgnoringWatchpoints())
        {
        }
        
        bool isSet() const { return m_label.isSet(); }
    private:
        AssemblerLabel m_label;
    };

    // DataLabelPtr:
    //
    // A DataLabelPtr is used to refer to a location in the code containing a pointer to be
    // patched after the code has been generated.
    class DataLabelPtr {
        friend class AbstractMacroAssembler<AssemblerType>;
        friend class LinkBuffer;
    public:
        DataLabelPtr()
        {
        }

        DataLabelPtr(AbstractMacroAssemblerType* masm)
            : m_label(masm->m_assembler.label())
        {
        }

        bool isSet() const { return m_label.isSet(); }
        
    private:
        AssemblerLabel m_label;
    };

    // DataLabel32:
    //
    // A DataLabel32 is used to refer to a location in the code containing a 32-bit constant to be
    // patched after the code has been generated.
    class DataLabel32 {
        friend class AbstractMacroAssembler<AssemblerType>;
        friend class LinkBuffer;
    public:
        DataLabel32()
        {
        }

        DataLabel32(AbstractMacroAssemblerType* masm)
            : m_label(masm->m_assembler.label())
        {
        }

        AssemblerLabel label() const { return m_label; }

    private:
        AssemblerLabel m_label;
    };

    // DataLabelCompact:
    //
    // A DataLabelCompact is used to refer to a location in the code containing a
    // compact immediate to be patched after the code has been generated.
    class DataLabelCompact {
        friend class AbstractMacroAssembler<AssemblerType>;
        friend class LinkBuffer;
    public:
        DataLabelCompact()
        {
        }
        
        DataLabelCompact(AbstractMacroAssemblerType* masm)
            : m_label(masm->m_assembler.label())
        {
        }

        DataLabelCompact(AssemblerLabel label)
            : m_label(label)
        {
        }

        AssemblerLabel label() const { return m_label; }

    private:
        AssemblerLabel m_label;
    };

    // Call:
    //
    // A Call object is a reference to a call instruction that has been planted
    // into the code buffer - it is typically used to link the call, setting the
    // relative offset such that when executed it will call to the desired
    // destination.
    class Call {
        friend class AbstractMacroAssembler<AssemblerType>;

    public:
        enum Flags {
            None = 0x0,
            Linkable = 0x1,
            Near = 0x2,
            Tail = 0x4,
            LinkableNear = Linkable | Near,
            LinkableNearTail = Linkable | Near | Tail,
        };

        Call()
            : m_flags(None)
        {
        }
        
        Call(AssemblerLabel jmp, Flags flags)
            : m_label(jmp)
            , m_flags(flags)
        {
        }

        bool isFlagSet(Flags flag) const
        {
            return m_flags & flag;
        }

        static Call fromTailJump(Jump jump)
        {
            return Call(jump.m_label, Linkable);
        }

        template<PtrTag tag>
        void linkThunk(CodeLocationLabel<tag> label, AbstractMacroAssemblerType* masm) const
        {
            ASSERT(isFlagSet(Near));
            ASSERT(isFlagSet(Linkable));
#if CPU(ARM64)
            if (isFlagSet(Tail))
                masm->m_assembler.linkJumpThunk(m_label, label.dataLocation(), ARM64Assembler::JumpNoCondition, ARM64Assembler::ConditionInvalid);
            else
                masm->m_assembler.linkNearCallThunk(m_label, label.dataLocation());
#else
            Call target = *this;
            masm->addLinkTask([=](auto& linkBuffer) {
                linkBuffer.link(target, label);
            });
#endif
        }

        AssemblerLabel m_label;
    private:
        Flags m_flags;
    };

    // Jump:
    //
    // A jump object is a reference to a jump instruction that has been planted
    // into the code buffer - it is typically used to link the jump, setting the
    // relative offset such that when executed it will jump to the desired
    // destination.
    class Jump {
        friend class AbstractMacroAssembler<AssemblerType>;
        friend class Call;
        friend struct DFG::OSRExit;
        friend class LinkBuffer;
    public:
        Jump() = default;

#if CPU(ARM_THUMB2)
        // Fixme: this information should be stored in the instruction stream, not in the Jump object.
        Jump(AssemblerLabel jmp, ARMv7Assembler::JumpType type = ARMv7Assembler::JumpNoCondition, ARMv7Assembler::Condition condition = ARMv7Assembler::ConditionInvalid)
            : m_label(jmp)
            , m_type(type)
            , m_condition(condition)
        {
        }
#elif CPU(ARM64)
        Jump(AssemblerLabel jmp, ARM64Assembler::JumpType type = ARM64Assembler::JumpNoCondition, ARM64Assembler::Condition condition = ARM64Assembler::ConditionInvalid)
            : m_label(jmp)
            , m_type(type)
            , m_condition(condition)
        {
        }

        Jump(AssemblerLabel jmp, ARM64Assembler::JumpType type, ARM64Assembler::Condition condition, bool is64Bit, ARM64Assembler::RegisterID compareRegister)
            : m_label(jmp)
            , m_type(type)
            , m_condition(condition)
            , m_is64Bit(is64Bit)
            , m_compareRegister(compareRegister)
        {
            ASSERT((type == ARM64Assembler::JumpCompareAndBranch) || (type == ARM64Assembler::JumpCompareAndBranchFixedSize));
        }

        Jump(AssemblerLabel jmp, ARM64Assembler::JumpType type, ARM64Assembler::Condition condition, unsigned bitNumber, ARM64Assembler::RegisterID compareRegister)
            : m_label(jmp)
            , m_bitNumber(bitNumber)
            , m_type(type)
            , m_condition(condition)
            , m_compareRegister(compareRegister)
        {
            ASSERT((type == ARM64Assembler::JumpTestBit) || (type == ARM64Assembler::JumpTestBitFixedSize));
        }
#else
        Jump(AssemblerLabel jmp)    
            : m_label(jmp)
        {
        }
#endif
        
        Label label() const
        {
            Label result;
            result.m_label = m_label;
            return result;
        }

        void link(AbstractMacroAssemblerType* masm) const
        {
            masm->invalidateAllTempRegisters();

#if ENABLE(DFG_REGISTER_ALLOCATION_VALIDATION)
            masm->checkRegisterAllocationAgainstBranchRange(m_label.offset(), masm->debugOffset());
#endif

#if CPU(ARM_THUMB2)
            masm->m_assembler.linkJump(m_label, masm->m_assembler.label(), m_type, m_condition);
#elif CPU(ARM64)
            if ((m_type == ARM64Assembler::JumpCompareAndBranch) || (m_type == ARM64Assembler::JumpCompareAndBranchFixedSize))
                masm->m_assembler.linkJump(m_label, masm->m_assembler.label(), m_type, m_condition, m_is64Bit, m_compareRegister);
            else if ((m_type == ARM64Assembler::JumpTestBit) || (m_type == ARM64Assembler::JumpTestBitFixedSize))
                masm->m_assembler.linkJump(m_label, masm->m_assembler.label(), m_type, m_condition, m_bitNumber, m_compareRegister);
            else
                masm->m_assembler.linkJump(m_label, masm->m_assembler.label(), m_type, m_condition);
#else
            masm->m_assembler.linkJump(m_label, masm->m_assembler.label());
#endif
        }
        
        void linkTo(Label label, AbstractMacroAssemblerType* masm) const
        {
#if ENABLE(DFG_REGISTER_ALLOCATION_VALIDATION)
            masm->checkRegisterAllocationAgainstBranchRange(label.m_label.offset(), m_label.offset());
#endif

#if CPU(ARM_THUMB2)
            masm->m_assembler.linkJump(m_label, label.m_label, m_type, m_condition);
#elif CPU(ARM64)
            if ((m_type == ARM64Assembler::JumpCompareAndBranch) || (m_type == ARM64Assembler::JumpCompareAndBranchFixedSize))
                masm->m_assembler.linkJump(m_label, label.m_label, m_type, m_condition, m_is64Bit, m_compareRegister);
            else if ((m_type == ARM64Assembler::JumpTestBit) || (m_type == ARM64Assembler::JumpTestBitFixedSize))
                masm->m_assembler.linkJump(m_label, label.m_label, m_type, m_condition, m_bitNumber, m_compareRegister);
            else
                masm->m_assembler.linkJump(m_label, label.m_label, m_type, m_condition);
#else
            masm->m_assembler.linkJump(m_label, label.m_label);
#endif
        }

        template<PtrTag tag>
        void linkThunk(CodeLocationLabel<tag> label, AbstractMacroAssemblerType* masm) const
        {
#if CPU(ARM64)
            if ((m_type == ARM64Assembler::JumpCompareAndBranch) || (m_type == ARM64Assembler::JumpCompareAndBranchFixedSize))
                masm->m_assembler.linkJumpThunk(m_label, label.dataLocation(), m_type, m_condition, m_is64Bit, m_compareRegister);
            else if ((m_type == ARM64Assembler::JumpTestBit) || (m_type == ARM64Assembler::JumpTestBitFixedSize))
                masm->m_assembler.linkJumpThunk(m_label, label.dataLocation(), m_type, m_condition, m_bitNumber, m_compareRegister);
            else
                masm->m_assembler.linkJumpThunk(m_label, label.dataLocation(), m_type, m_condition);
#else
            Jump target = *this;
            masm->addLinkTask([=](auto& linkBuffer) {
                linkBuffer.link(target, label);
            });
#endif
        }

        bool isSet() const { return m_label.isSet(); }

    private:
        AssemblerLabel m_label;
#if CPU(ARM_THUMB2)
        ARMv7Assembler::JumpType m_type { ARMv7Assembler::JumpNoCondition };
        ARMv7Assembler::Condition m_condition { ARMv7Assembler::ConditionInvalid };
#elif CPU(ARM64)
        unsigned m_bitNumber { 0 };
        ARM64Assembler::JumpType m_type { ARM64Assembler::JumpNoCondition };
        ARM64Assembler::Condition m_condition { ARM64Assembler::ConditionInvalid };
        bool m_is64Bit { false };
        ARM64Assembler::RegisterID m_compareRegister { ARM64Registers::InvalidGPRReg };
#endif
    };

    struct PatchableJump {
        PatchableJump()
        {
        }

        explicit PatchableJump(Jump jump)
            : m_jump(jump)
        {
        }

        operator Jump&() { return m_jump; }

        template<PtrTag tag>
        void linkThunk(CodeLocationLabel<tag> label, AbstractMacroAssemblerType* masm) const
        {
            m_jump.linkThunk(label, masm);
        }

        Jump m_jump;
    };

    // JumpList:
    //
    // A JumpList is a set of Jump objects.
    // All jumps in the set will be linked to the same destination.
    class JumpList {
    public:
        using JumpVector = Vector<Jump, 2>;

        JumpList() = default;

        JumpList(Jump jump)
        {
            if (jump.isSet())
                append(jump);
        }

        void link(AbstractMacroAssemblerType* masm) const
        {
            size_t size = m_jumps.size();
            for (size_t i = 0; i < size; ++i)
                m_jumps[i].link(masm);
        }
        
        void linkTo(Label label, AbstractMacroAssemblerType* masm) const
        {
            for (auto& jump : m_jumps)
                jump.linkTo(label, masm);
        }

        template<PtrTag tag>
        void linkThunk(CodeLocationLabel<tag> label, AbstractMacroAssemblerType* masm) const
        {
            for (auto& jump : m_jumps)
                jump.linkThunk(label, masm);
        }
        
        void append(Jump jump)
        {
            if (jump.isSet())
                m_jumps.append(jump);
        }
        
        void append(const JumpList& other)
        {
            m_jumps.appendVector(other.m_jumps);
        }

        bool empty() const
        {
            return !m_jumps.size();
        }
        
        void clear()
        {
            m_jumps.clear();
        }

        void shrink(size_t size)
        {
            m_jumps.shrink(size);
        }

        const JumpVector& jumps() const { return m_jumps; }

    private:
        JumpVector m_jumps;
    };


    // Section 3: Misc admin methods
#if ENABLE(DFG_JIT)
    Label labelIgnoringWatchpoints()
    {
        Label result;
        result.m_label = m_assembler.labelIgnoringWatchpoints();
        return result;
    }
#else
    Label labelIgnoringWatchpoints()
    {
        return label();
    }
#endif
    
    Label label()
    {
        return Label(this);
    }
    
    void padBeforePatch()
    {
        // Rely on the fact that asking for a label already does the padding.
        (void)label();
    }
    
    Label watchpointLabel()
    {
        Label result;
        result.m_label = m_assembler.labelForWatchpoint();
        return result;
    }
    
    Label align()
    {
        m_assembler.align(16);
        return Label(this);
    }

    // DFG register allocation validation is broken in various cases. We need suppression mechanism otherwise, it introduces a new bug rather to bypass the issue.
    class SuppressRegisetrAllocationValidation {
    public:
#if ENABLE(DFG_REGISTER_ALLOCATION_VALIDATION)
        SuppressRegisetrAllocationValidation(AbstractMacroAssemblerType& assembler)
            : m_suppressRegisterValidation(assembler.m_suppressRegisterValidation, true)
        {
        }

    private:
        SetForScope<bool> m_suppressRegisterValidation;
#else
        SuppressRegisetrAllocationValidation(AbstractMacroAssemblerType&) { }
#endif
    };

#if ENABLE(DFG_REGISTER_ALLOCATION_VALIDATION)
    class RegisterAllocationOffset {
    public:
        RegisterAllocationOffset(unsigned offset)
            : m_offset(offset)
        {
        }

        void checkOffsets(unsigned low, unsigned high)
        {
            RELEASE_ASSERT_WITH_MESSAGE(!(low <= m_offset && m_offset <= high), "Unsafe branch over register allocation at instruction offset %u in jump offset range %u..%u", m_offset, low, high);
        }

    private:
        unsigned m_offset;
    };

    void addRegisterAllocationAtOffset(unsigned offset)
    {
        m_registerAllocationForOffsets.append(RegisterAllocationOffset(offset));
    }

    void clearRegisterAllocationOffsets()
    {
        m_registerAllocationForOffsets.clear();
    }

    void checkRegisterAllocationAgainstBranchRange(unsigned offset1, unsigned offset2)
    {
        if (m_suppressRegisterValidation)
            return;

        if (offset1 > offset2)
            std::swap(offset1, offset2);

        for (auto& offset : m_registerAllocationForOffsets)
            offset.checkOffsets(offset1, offset2);
    }
#endif

    template<typename T, typename U>
    static ptrdiff_t differenceBetween(T from, U to)
    {
        return AssemblerType::getDifferenceBetweenLabels(from.m_label, to.m_label);
    }

    template<PtrTag aTag, PtrTag bTag>
    static ptrdiff_t differenceBetweenCodePtr(const CodePtr<aTag>& a, const CodePtr<bTag>& b)
    {
        return b.template dataLocation<ptrdiff_t>() - a.template dataLocation<ptrdiff_t>();
    }

    unsigned debugOffset() { return m_assembler.debugOffset(); }

    ALWAYS_INLINE static void cacheFlush(void* code, size_t size)
    {
        AssemblerType::cacheFlush(code, size);
    }

    template<PtrTag tag>
    static void linkJump(void* code, Jump jump, CodeLocationLabel<tag> target)
    {
        AssemblerType::linkJump(code, jump.m_label, target.dataLocation());
    }

    static void linkPointer(void* code, AssemblerLabel label, void* value)
    {
        AssemblerType::linkPointer(code, label, value);
    }

    template<PtrTag tag>
    static void linkPointer(void* code, AssemblerLabel label, CodePtr<tag> value)
    {
        AssemblerType::linkPointer(code, label, value.taggedPtr());
    }

    template<PtrTag tag>
    static void* getLinkerAddress(void* code, AssemblerLabel label)
    {
        return tagCodePtr<tag>(AssemblerType::getRelocatedAddress(code, label));
    }

    static unsigned getLinkerCallReturnOffset(Call call)
    {
        return AssemblerType::getCallReturnOffset(call.m_label);
    }

    template<PtrTag jumpTag, PtrTag destTag>
    static void repatchJump(CodeLocationJump<jumpTag> jump, CodeLocationLabel<destTag> destination)
    {
        AssemblerType::relinkJump(jump.dataLocation(), destination.dataLocation());
    }
    
    template<PtrTag callTag, PtrTag destTag>
    static void repatchNearCall(CodeLocationNearCall<callTag> nearCall, CodeLocationLabel<destTag> destination)
    {
        switch (nearCall.callMode()) {
        case NearCallMode::Tail:
            AssemblerType::relinkTailCall(nearCall.dataLocation(), destination.dataLocation());
            return;
        case NearCallMode::Regular:
            AssemblerType::relinkCall(nearCall.dataLocation(), destination.untaggedPtr());
            return;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

    template<PtrTag callTag, PtrTag destTag>
    static CodeLocationLabel<destTag> prepareForAtomicRepatchNearCallConcurrently(CodeLocationNearCall<callTag> nearCall, CodeLocationLabel<destTag> destination)
    {
#if ENABLE(JUMP_ISLANDS)
        switch (nearCall.callMode()) {
        case NearCallMode::Tail:
            return CodeLocationLabel<destTag>(tagCodePtr<destTag>(AssemblerType::prepareForAtomicRelinkJumpConcurrently(nearCall.dataLocation(), destination.dataLocation())));
        case NearCallMode::Regular:
            return CodeLocationLabel<destTag>(tagCodePtr<destTag>(AssemblerType::prepareForAtomicRelinkCallConcurrently(nearCall.dataLocation(), destination.untaggedPtr())));
        }
        RELEASE_ASSERT_NOT_REACHED();
#else
        UNUSED_PARAM(nearCall);
        return destination;
#endif
    }

    template<PtrTag tag>
    static void repatchPointer(CodeLocationDataLabelPtr<tag> dataLabelPtr, void* value)
    {
        AssemblerType::repatchPointer(dataLabelPtr.dataLocation(), value);
    }

    template<PtrTag tag>
    static void* readPointer(CodeLocationDataLabelPtr<tag> dataLabelPtr)
    {
        return AssemblerType::readPointer(dataLabelPtr.dataLocation());
    }

    template<typename Functor>
    void addLinkTask(const Functor& functor)
    {
        m_linkTasks.append(createSharedTask<void(LinkBuffer&)>(functor));
    }

    template<typename Functor>
    void addLateLinkTask(const Functor& functor) // Run after all link tasks
    {
        m_lateLinkTasks.append(createSharedTask<void(LinkBuffer&)>(functor));
    }

#if COMPILER(GCC)
    // Workaround for GCC demanding that memcpy "must be the name of a function with external linkage".
    static void* memcpy(void* dst, const void* src, size_t size)
    {
        return std::memcpy(dst, src, size);
    }
#endif

    void emitNops(size_t memoryToFillWithNopsInBytes)
    {
#if CPU(ARM64)
        RELEASE_ASSERT(memoryToFillWithNopsInBytes % 4 == 0);
        for (unsigned i = 0; i < memoryToFillWithNopsInBytes / 4; ++i)
            m_assembler.nop();
#else
        AssemblerBuffer& buffer = m_assembler.buffer();
        size_t startCodeSize = buffer.codeSize();
        size_t targetCodeSize = startCodeSize + memoryToFillWithNopsInBytes;
        buffer.ensureSpace(memoryToFillWithNopsInBytes);
        AssemblerType::template fillNops<MachineCodeCopyMode::Memcpy>(static_cast<char*>(buffer.data()) + startCodeSize, memoryToFillWithNopsInBytes);
        buffer.setCodeSize(targetCodeSize);
#endif
    }

    ALWAYS_INLINE void tagReturnAddress() { }
    ALWAYS_INLINE void untagReturnAddress(RegisterID = RegisterID::InvalidGPRReg) { }

    ALWAYS_INLINE void tagPtr(PtrTag, RegisterID) { }
    ALWAYS_INLINE void tagPtr(RegisterID, RegisterID) { }
    ALWAYS_INLINE void untagPtr(PtrTag, RegisterID) { }
    ALWAYS_INLINE void untagPtr(RegisterID, RegisterID) { }
    ALWAYS_INLINE void removePtrTag(RegisterID) { }
    ALWAYS_INLINE void validateUntaggedPtr(RegisterID, RegisterID = RegisterID::InvalidGPRReg) { }

    template<typename... Types>
    void comment(const Types&... values)
    {
        if (LIKELY(!Options::needDisassemblySupport()))
            return;
        StringPrintStream s;
        s.print(values...);
        commentImpl(s.toString());
    }

protected:
    AbstractMacroAssembler()
        : m_assembler()
    {
        invalidateAllTempRegisters();
    }

public:
    AssemblerType m_assembler;
protected:

#if ENABLE(DFG_REGISTER_ALLOCATION_VALIDATION)
    bool m_suppressRegisterValidation { false };
    Vector<RegisterAllocationOffset, 10> m_registerAllocationForOffsets;
#endif

    static bool haveScratchRegisterForBlinding()
    {
        return false;
    }
    static RegisterID scratchRegisterForBlinding()
    {
        UNREACHABLE_FOR_PLATFORM();
        return firstRegister();
    }
    static constexpr bool canBlind() { return false; }
    static constexpr bool shouldBlindForSpecificArch(uint32_t) { return false; }
    static constexpr bool shouldBlindForSpecificArch(uint64_t) { return false; }

    class CachedTempRegister {
        friend class DataLabelPtr;
        friend class DataLabel32;
        friend class DataLabelCompact;
        friend class Jump;
        friend class Label;

    public:
        CachedTempRegister(AbstractMacroAssemblerType* masm, RegisterID registerID)
            : m_masm(masm)
            , m_registerID(registerID)
            , m_value(0)
            , m_validBit(1 << static_cast<unsigned>(registerID))
        {
            ASSERT(static_cast<unsigned>(registerID) < (sizeof(unsigned) * 8));
        }

        ALWAYS_INLINE RegisterID registerIDInvalidate() { invalidate(); return m_registerID; }

        ALWAYS_INLINE RegisterID registerIDNoInvalidate() { return m_registerID; }

        WARN_UNUSED_RETURN bool value(intptr_t& value)
        {
            value = m_value;
            return m_masm->isTempRegisterValid(m_validBit);
        }

        void setValue(intptr_t value)
        {
            m_value = value;
            m_masm->setTempRegisterValid(m_validBit);
        }

        ALWAYS_INLINE void invalidate() { m_masm->clearTempRegisterValid(m_validBit); }

    private:
        AbstractMacroAssemblerType* m_masm;
        RegisterID m_registerID;
        intptr_t m_value;
        unsigned m_validBit;
    };

    ALWAYS_INLINE void invalidateAllTempRegisters()
    {
        m_tempRegistersValidBits = 0;
    }

    ALWAYS_INLINE bool isTempRegisterValid(unsigned registerMask)
    {
        return (m_tempRegistersValidBits & registerMask);
    }

    ALWAYS_INLINE void clearTempRegisterValid(unsigned registerMask)
    {
        m_tempRegistersValidBits &=  ~registerMask;
    }

    ALWAYS_INLINE void setTempRegisterValid(unsigned registerMask)
    {
        m_tempRegistersValidBits |= registerMask;
    }

    void commentImpl(String&& str) { m_comments.append({ labelIgnoringWatchpoints(), WTFMove(str) }); }

    friend class AllowMacroScratchRegisterUsage;
    friend class AllowMacroScratchRegisterUsageIf;
    template<typename T> friend class DisallowMacroScratchRegisterUsage;
    unsigned m_tempRegistersValidBits;
    bool m_allowScratchRegister { true };

    Vector<std::pair<Label, String>> m_comments;

    Vector<RefPtr<SharedTask<void(LinkBuffer&)>>> m_linkTasks;
    Vector<RefPtr<SharedTask<void(LinkBuffer&)>>> m_lateLinkTasks;

    friend class LinkBuffer;
}; // class AbstractMacroAssembler

template <class AssemblerType>
inline typename AbstractMacroAssembler<AssemblerType>::BaseIndex
AbstractMacroAssembler<AssemblerType>::Address::indexedBy(
    typename AbstractMacroAssembler<AssemblerType>::RegisterID index,
    typename AbstractMacroAssembler<AssemblerType>::Scale scale) const
{
    return BaseIndex(base, index, scale, offset);
}

#endif // ENABLE(ASSEMBLER)

} // namespace JSC

#if ENABLE(ASSEMBLER)

namespace WTF {

class PrintStream;

void printInternal(PrintStream& out, JSC::AbstractMacroAssemblerBase::StatusCondition);

} // namespace WTF

#endif // ENABLE(ASSEMBLER)

