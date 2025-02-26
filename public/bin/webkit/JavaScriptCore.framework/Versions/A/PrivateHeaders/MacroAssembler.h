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

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#if ENABLE(ASSEMBLER)

#include "JSCJSValue.h"

#define DEFINE_SIMD_FUNC(name, func, lane) \
    template <typename ...Args> \
    void name(Args&&... args) { func(lane, std::forward<Args>(args)...); }

#define DEFINE_SIMD_FUNC_WITH_SIGN_EXTEND_MODE(name, func, lane, mode) \
    template <typename ...Args> \
    void name(Args&&... args) { func(lane, mode, std::forward<Args>(args)...); }

#define DEFINE_SIMD_FUNCS(name) \
    DEFINE_SIMD_FUNC(name##Int8, name, SIMDLane::i8x16) \
    DEFINE_SIMD_FUNC(name##Int16, name, SIMDLane::i16x8) \
    DEFINE_SIMD_FUNC(name##Int32, name, SIMDLane::i32x4) \
    DEFINE_SIMD_FUNC(name##Int64, name, SIMDLane::i64x2) \
    DEFINE_SIMD_FUNC(name##Float32, name, SIMDLane::f32x4) \
    DEFINE_SIMD_FUNC(name##Float64, name, SIMDLane::f64x2)

#define DEFINE_SIGNED_SIMD_FUNCS(name) \
    DEFINE_SIMD_FUNC_WITH_SIGN_EXTEND_MODE(name##SignedInt8, name, SIMDLane::i8x16, SIMDSignMode::Signed) \
    DEFINE_SIMD_FUNC_WITH_SIGN_EXTEND_MODE(name##UnsignedInt8, name, SIMDLane::i8x16, SIMDSignMode::Unsigned) \
    DEFINE_SIMD_FUNC_WITH_SIGN_EXTEND_MODE(name##SignedInt16, name, SIMDLane::i16x8, SIMDSignMode::Signed) \
    DEFINE_SIMD_FUNC_WITH_SIGN_EXTEND_MODE(name##UnsignedInt16, name, SIMDLane::i16x8, SIMDSignMode::Unsigned) \
    DEFINE_SIMD_FUNC_WITH_SIGN_EXTEND_MODE(name##Int32, name, SIMDLane::i32x4, SIMDSignMode::None) \
    DEFINE_SIMD_FUNC_WITH_SIGN_EXTEND_MODE(name##Int64, name, SIMDLane::i64x2, SIMDSignMode::None) \
    DEFINE_SIMD_FUNC(name##Float32, name, SIMDLane::f32x4) \
    DEFINE_SIMD_FUNC(name##Float64, name, SIMDLane::f64x2)

#if CPU(ARM_THUMB2)
#define TARGET_ASSEMBLER ARMv7Assembler
#define TARGET_MACROASSEMBLER MacroAssemblerARMv7
#include "MacroAssemblerARMv7.h"

#elif CPU(ARM64E)
#define TARGET_ASSEMBLER ARM64EAssembler
#define TARGET_MACROASSEMBLER MacroAssemblerARM64E
#include "MacroAssemblerARM64E.h"

#elif CPU(ARM64)
#define TARGET_ASSEMBLER ARM64Assembler
#define TARGET_MACROASSEMBLER MacroAssemblerARM64
#include "MacroAssemblerARM64.h"

#elif CPU(X86_64)
#define TARGET_ASSEMBLER X86Assembler
#define TARGET_MACROASSEMBLER MacroAssemblerX86_64
#include "MacroAssemblerX86_64.h"

#elif CPU(RISCV64)
#define TARGET_ASSEMBLER RISCV64Assembler
#define TARGET_MACROASSEMBLER MacroAssemblerRISCV64
#include "MacroAssemblerRISCV64.h"

#else
#error "The MacroAssembler is not supported on this platform."
#endif

#include "MacroAssemblerHelpers.h"

namespace WTF {

template<typename FunctionType>
class ScopedLambda;

} // namespace WTF

namespace JSC {

namespace Probe {

enum class SavedFPWidth {
    SaveVectors,
    DontSaveVectors
};

class Context;
typedef void (SYSV_ABI *Function)(Context&);

} // namespace Probe

using Probe::SavedFPWidth;

namespace Printer {

struct PrintRecord;
typedef Vector<PrintRecord> PrintRecordList;

} // namespace Printer

using MacroAssemblerBase = TARGET_MACROASSEMBLER;

class MacroAssembler : public MacroAssemblerBase {
    WTF_MAKE_TZONE_ALLOCATED(MacroAssembler);
public:
    using Base = MacroAssemblerBase;

    static constexpr RegisterID nextRegister(RegisterID reg)
    {
        return static_cast<RegisterID>(reg + 1);
    }
    
    static constexpr FPRegisterID nextFPRegister(FPRegisterID reg)
    {
        return static_cast<FPRegisterID>(reg + 1);
    }
    
    static constexpr unsigned registerIndex(RegisterID reg)
    {
        return reg - firstRegister();
    }
    
    static constexpr unsigned fpRegisterIndex(FPRegisterID reg)
    {
        return reg - firstFPRegister();
    }
    
    static constexpr unsigned registerIndex(FPRegisterID reg)
    {
        return fpRegisterIndex(reg) + numberOfRegisters();
    }
    
    static constexpr unsigned totalNumberOfRegisters()
    {
        return numberOfRegisters() + numberOfFPRegisters();
    }

    using MacroAssemblerBase::pop;
    using MacroAssemblerBase::jump;
    using MacroAssemblerBase::farJump;
    using MacroAssemblerBase::branch32;
    using MacroAssemblerBase::compare32;
    using MacroAssemblerBase::move;
    using MacroAssemblerBase::move32ToFloat;
    using MacroAssemblerBase::moveDouble;
    using MacroAssemblerBase::move64ToDouble;
    using MacroAssemblerBase::add32;
    using MacroAssemblerBase::mul32;
    using MacroAssemblerBase::and32;
    using MacroAssemblerBase::branchAdd32;
    using MacroAssemblerBase::branchMul32;
#if CPU(ARM64) || CPU(ARM_THUMB2) || CPU(X86_64) || CPU(RISCV64)
    using MacroAssemblerBase::branchPtr;
#endif
#if CPU(X86_64)
    using MacroAssemblerBase::branch64;
#endif
#if CPU(RISCV64)
    using MacroAssemblerRISCV64::lshift64;
#endif
    using MacroAssemblerBase::branchSub32;
    using MacroAssemblerBase::lshift32;
    using MacroAssemblerBase::or32;
    using MacroAssemblerBase::rshift32;
    using MacroAssemblerBase::store32;
    using MacroAssemblerBase::sub32;
    using MacroAssemblerBase::urshift32;
    using MacroAssemblerBase::xor32;

#if CPU(ARM64) || CPU(X86_64) || CPU(RISCV64) || CPU(ARM_THUMB2)
    using MacroAssemblerBase::convertInt32ToDouble;
#endif
#if CPU(ARM64) || CPU(X86_64) || CPU(RISCV64)
    using MacroAssemblerBase::add64;
    using MacroAssemblerBase::sub64;
    using MacroAssemblerBase::and64;
    using MacroAssemblerBase::or64;
    using MacroAssemblerBase::xor64;
    using MacroAssemblerBase::store64;
    using MacroAssemblerBase::compare64;
#endif

    static bool isPtrAlignedAddressOffset(ptrdiff_t value)
    {
        return value == static_cast<int32_t>(value);
    }

    static const double twoToThe32; // This is super useful for some double code.

    // Utilities used by the DFG JIT.
    using AbstractMacroAssemblerBase::invert;
    using MacroAssemblerBase::invert;
    
    static DoubleCondition invert(DoubleCondition cond)
    {
        switch (cond) {
        case DoubleEqualAndOrdered:
            return DoubleNotEqualOrUnordered;
        case DoubleNotEqualAndOrdered:
            return DoubleEqualOrUnordered;
        case DoubleGreaterThanAndOrdered:
            return DoubleLessThanOrEqualOrUnordered;
        case DoubleGreaterThanOrEqualAndOrdered:
            return DoubleLessThanOrUnordered;
        case DoubleLessThanAndOrdered:
            return DoubleGreaterThanOrEqualOrUnordered;
        case DoubleLessThanOrEqualAndOrdered:
            return DoubleGreaterThanOrUnordered;
        case DoubleEqualOrUnordered:
            return DoubleNotEqualAndOrdered;
        case DoubleNotEqualOrUnordered:
            return DoubleEqualAndOrdered;
        case DoubleGreaterThanOrUnordered:
            return DoubleLessThanOrEqualAndOrdered;
        case DoubleGreaterThanOrEqualOrUnordered:
            return DoubleLessThanAndOrdered;
        case DoubleLessThanOrUnordered:
            return DoubleGreaterThanOrEqualAndOrdered;
        case DoubleLessThanOrEqualOrUnordered:
            return DoubleGreaterThanAndOrdered;
        }
        RELEASE_ASSERT_NOT_REACHED();
        return DoubleEqualAndOrdered; // make compiler happy
    }
    
    static bool isInvertible(ResultCondition cond)
    {
        switch (cond) {
        case Zero:
        case NonZero:
        case Signed:
        case PositiveOrZero:
            return true;
        default:
            return false;
        }
    }
    
    static ResultCondition invert(ResultCondition cond)
    {
        switch (cond) {
        case Zero:
            return NonZero;
        case NonZero:
            return Zero;
        case Signed:
            return PositiveOrZero;
        case PositiveOrZero:
            return Signed;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            return Zero; // Make compiler happy for release builds.
        }
    }

    static RelationalCondition flip(RelationalCondition cond)
    {
        switch (cond) {
        case Equal:
        case NotEqual:
            return cond;
        case Above:
            return Below;
        case AboveOrEqual:
            return BelowOrEqual;
        case Below:
            return Above;
        case BelowOrEqual:
            return AboveOrEqual;
        case GreaterThan:
            return LessThan;
        case GreaterThanOrEqual:
            return LessThanOrEqual;
        case LessThan:
            return GreaterThan;
        case LessThanOrEqual:
            return GreaterThanOrEqual;
        }

        RELEASE_ASSERT_NOT_REACHED();
        return Equal;
    }

    static bool isSigned(RelationalCondition cond)
    {
        return MacroAssemblerHelpers::isSigned<MacroAssembler>(cond);
    }

    static bool isUnsigned(RelationalCondition cond)
    {
        return MacroAssemblerHelpers::isUnsigned<MacroAssembler>(cond);
    }

    static bool isSigned(ResultCondition cond)
    {
        return MacroAssemblerHelpers::isSigned<MacroAssembler>(cond);
    }

    static bool isUnsigned(ResultCondition cond)
    {
        return MacroAssemblerHelpers::isUnsigned<MacroAssembler>(cond);
    }

    // Platform agnostic convenience functions,
    // described in terms of other macro assembly methods.
    void pop()
    {
        addPtr(TrustedImm32(sizeof(void*)), stackPointerRegister);
    }
    
    void peek(RegisterID dest, int index = 0)
    {
        loadPtr(Address(stackPointerRegister, (index * sizeof(void*))), dest);
    }

    Address addressForPoke(int index)
    {
        return Address(stackPointerRegister, (index * sizeof(void*)));
    }
    
    void poke(RegisterID src, int index = 0)
    {
        storePtr(src, addressForPoke(index));
    }

    void poke(TrustedImm32 value, int index = 0)
    {
        store32(value, addressForPoke(index));
    }

    void poke(TrustedImmPtr imm, int index = 0)
    {
        storePtr(imm, addressForPoke(index));
    }

    void poke(FPRegisterID src, int index = 0)
    {
        storeDouble(src, addressForPoke(index));
    }

#if !CPU(ARM64)
    void pushToSave(RegisterID src)
    {
        push(src);
    }
    void pushToSaveImmediateWithoutTouchingRegisters(TrustedImm32 imm)
    {
        push(imm);
    }
    void popToRestore(RegisterID dest)
    {
        pop(dest);
    }
    void pushToSave(FPRegisterID src)
    {
        subPtr(TrustedImm32(sizeof(double)), stackPointerRegister);
        storeDouble(src, Address(stackPointerRegister));
    }
    void popToRestore(FPRegisterID dest)
    {
        loadDouble(Address(stackPointerRegister), dest);
        addPtr(TrustedImm32(sizeof(double)), stackPointerRegister);
    }
    
    static constexpr ptrdiff_t pushToSaveByteOffset() { return sizeof(void*); }
#endif // !CPU(ARM64)

#if CPU(X86_64) || CPU(ARM64) || CPU(RISCV64)
    void peek64(RegisterID dest, int index = 0)
    {
        load64(Address(stackPointerRegister, (index * sizeof(void*))), dest);
    }

    void poke(TrustedImm64 value, int index = 0)
    {
        store64(value, addressForPoke(index));
    }

    void poke64(RegisterID src, int index = 0)
    {
        store64(src, addressForPoke(index));
    }
#endif

    // Immediate shifts only have 5 controllable bits
    // so we'll consider them safe for now.
    TrustedImm32 trustedImm32ForShift(Imm32 imm)
    {
        return TrustedImm32(imm.asTrustedImm32().m_value & 31);
    }

    // Backwards banches, these are currently all implemented using existing forwards branch mechanisms.
    void branchPtr(RelationalCondition cond, RegisterID op1, TrustedImmPtr imm, Label target)
    {
        branchPtr(cond, op1, imm).linkTo(target, this);
    }
    void branchPtr(RelationalCondition cond, RegisterID op1, ImmPtr imm, Label target)
    {
        branchPtr(cond, op1, imm).linkTo(target, this);
    }

    Jump branch32(RelationalCondition cond, RegisterID left, AbsoluteAddress right)
    {
        return branch32(flip(cond), right, left);
    }

    void branch32(RelationalCondition cond, RegisterID op1, RegisterID op2, Label target)
    {
        branch32(cond, op1, op2).linkTo(target, this);
    }

    void branch32(RelationalCondition cond, RegisterID op1, TrustedImm32 imm, Label target)
    {
        branch32(cond, op1, imm).linkTo(target, this);
    }
    
    void branch32(RelationalCondition cond, RegisterID op1, Imm32 imm, Label target)
    {
        branch32(cond, op1, imm).linkTo(target, this);
    }

    void branch32(RelationalCondition cond, RegisterID left, Address right, Label target)
    {
        branch32(cond, left, right).linkTo(target, this);
    }

    Jump branch32(RelationalCondition cond, TrustedImm32 left, RegisterID right)
    {
        return branch32(commute(cond), right, left);
    }

    Jump branch32(RelationalCondition cond, Imm32 left, RegisterID right)
    {
        return branch32(commute(cond), right, left);
    }

    void compare32(RelationalCondition cond, Imm32 left, RegisterID right, RegisterID dest)
    {
        compare32(commute(cond), right, left, dest);
    }

    void branchTestPtr(ResultCondition cond, RegisterID reg, Label target)
    {
        branchTestPtr(cond, reg).linkTo(target, this);
    }

#if !CPU(ARM_THUMB2) && !CPU(ARM64)
    PatchableJump patchableBranchPtr(RelationalCondition cond, Address left, TrustedImmPtr right = TrustedImmPtr(nullptr))
    {
        padBeforePatch();
        return PatchableJump(branchPtr(cond, left, right));
    }
    
    PatchableJump patchableBranchPtrWithPatch(RelationalCondition cond, Address left, DataLabelPtr& dataLabel, TrustedImmPtr initialRightValue = TrustedImmPtr(nullptr))
    {
        padBeforePatch();
        return PatchableJump(branchPtrWithPatch(cond, left, dataLabel, initialRightValue));
    }

    PatchableJump patchableBranch32WithPatch(RelationalCondition cond, Address left, DataLabel32& dataLabel, TrustedImm32 initialRightValue = TrustedImm32(0))
    {
        padBeforePatch();
        return PatchableJump(branch32WithPatch(cond, left, dataLabel, initialRightValue));
    }

    PatchableJump patchableJump()
    {
        padBeforePatch();
        return PatchableJump(jump());
    }

    PatchableJump patchableBranchTest32(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        padBeforePatch();
        return PatchableJump(branchTest32(cond, reg, mask));
    }

    PatchableJump patchableBranch32(RelationalCondition cond, RegisterID reg, TrustedImm32 imm)
    {
        padBeforePatch();
        return PatchableJump(branch32(cond, reg, imm));
    }

    PatchableJump patchableBranch8(RelationalCondition cond, Address address, TrustedImm32 imm)
    {
        padBeforePatch();
        return PatchableJump(branch8(cond, address, imm));
    }

    PatchableJump patchableBranch16(RelationalCondition cond, Address address, TrustedImm32 imm)
    {
        padBeforePatch();
        return PatchableJump(branch16(cond, address, imm));
    }

    PatchableJump patchableBranch32(RelationalCondition cond, Address address, TrustedImm32 imm)
    {
        padBeforePatch();
        return PatchableJump(branch32(cond, address, imm));
    }
#endif

    void jump(Label target)
    {
        jump().linkTo(target, this);
    }

    // Commute a relational condition, returns a new condition that will produce
    // the same results given the same inputs but with their positions exchanged.
    static RelationalCondition commute(RelationalCondition condition)
    {
        switch (condition) {
        case Above:
            return Below;
        case AboveOrEqual:
            return BelowOrEqual;
        case Below:
            return Above;
        case BelowOrEqual:
            return AboveOrEqual;
        case GreaterThan:
            return LessThan;
        case GreaterThanOrEqual:
            return LessThanOrEqual;
        case LessThan:
            return GreaterThan;
        case LessThanOrEqual:
            return GreaterThanOrEqual;
        default:
            break;
        }

        ASSERT(condition == Equal || condition == NotEqual);
        return condition;
    }

    void oops()
    {
        abortWithReason(B3Oops);
    }

    // B3 has additional pseudo-opcodes for returning, when it wants to signal that the return
    // consumes some register in some way.
    void retVoid() { ret(); }
    void ret32(RegisterID) { ret(); }
#if CPU(ARM_THUMB2)
    void ret64(RegisterID, RegisterID) { ret(); }
#else
    void ret64(RegisterID) { ret(); }
#endif
    void retFloat(FPRegisterID) { ret(); }
    void retDouble(FPRegisterID) { ret(); }

    static constexpr unsigned BlindingModulus = 64;
    bool shouldConsiderBlinding()
    {
        return !(random() & (BlindingModulus - 1));
    }

    void move(Address src, Address dest, RegisterID scratch)
    {
        loadPtr(src, scratch);
        storePtr(scratch, dest);
    }
    
    void move32(Address src, Address dest, RegisterID scratch)
    {
        load32(src, scratch);
        store32(scratch, dest);
    }
    
    void moveFloat(Address src, Address dest, FPRegisterID scratch)
    {
        loadFloat(src, scratch);
        storeFloat(scratch, dest);
    }

    void moveDouble(Address src, Address dest, FPRegisterID scratch)
    {
        loadDouble(src, scratch);
        storeDouble(scratch, dest);
    }

    // Ptr methods
    // On 32-bit platforms (i.e. x86), these methods directly map onto their 32-bit equivalents.
#if !CPU(ADDRESS64)
    void addPtr(Address src, RegisterID dest)
    {
        add32(src, dest);
    }

    void addPtr(AbsoluteAddress src, RegisterID dest)
    {
        add32(src, dest);
    }

    void addPtr(RegisterID src, RegisterID dest)
    {
        add32(src, dest);
    }

    void addPtr(RegisterID left, RegisterID right, RegisterID dest)
    {
        add32(left, right, dest);
    }

    void addPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        add32(imm, srcDest);
    }

    void addPtr(TrustedImmPtr imm, RegisterID dest)
    {
        add32(TrustedImm32(imm), dest);
    }

    void addPtr(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        add32(imm, src, dest);
    }

    void addPtr(TrustedImm32 imm, AbsoluteAddress address)
    {
        add32(imm, address);
    }
    
    void andPtr(RegisterID src, RegisterID dest)
    {
        and32(src, dest);
    }

    void andPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        and32(imm, srcDest);
    }

    void andPtr(TrustedImmPtr imm, RegisterID srcDest)
    {
        and32(TrustedImm32(imm), srcDest);
    }

    void lshiftPtr(Imm32 imm, RegisterID srcDest)
    {
        lshift32(trustedImm32ForShift(imm), srcDest);
    }
    
    void lshiftPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        lshift32(imm, srcDest);
    }
    
    void rshiftPtr(Imm32 imm, RegisterID srcDest)
    {
        rshift32(trustedImm32ForShift(imm), srcDest);
    }

    void rshiftPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        rshift32(imm, srcDest);
    }

    void urshiftPtr(Imm32 imm, RegisterID srcDest)
    {
        urshift32(trustedImm32ForShift(imm), srcDest);
    }

    void urshiftPtr(RegisterID shiftAmmount, RegisterID srcDest)
    {
        urshift32(shiftAmmount, srcDest);
    }

    void negPtr(RegisterID dest)
    {
        neg32(dest);
    }

    void negPtr(RegisterID src, RegisterID dest)
    {
        neg32(src, dest);
    }

    void orPtr(RegisterID src, RegisterID dest)
    {
        or32(src, dest);
    }

    void orPtr(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        or32(op1, op2, dest);
    }

    void orPtr(TrustedImmPtr imm, RegisterID dest)
    {
        or32(TrustedImm32(imm), dest);
    }

    void orPtr(TrustedImm32 imm, RegisterID dest)
    {
        or32(imm, dest);
    }

    void rotateRightPtr(TrustedImm32 imm, RegisterID srcDst)
    {
        rotateRight32(imm, srcDst);
    }

    void subPtr(RegisterID src, RegisterID dest)
    {
        sub32(src, dest);
    }

    void subPtr(RegisterID left, RegisterID right, RegisterID dest)
    {
        sub32(left, right, dest);
    }

    void subPtr(TrustedImm32 imm, RegisterID dest)
    {
        sub32(imm, dest);
    }

    void subPtr(RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        sub32(left, right, dest);
    }

    void subPtr(TrustedImmPtr imm, RegisterID dest)
    {
        sub32(TrustedImm32(imm), dest);
    }

    void xorPtr(RegisterID src, RegisterID dest)
    {
        xor32(src, dest);
    }

    void xorPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        xor32(imm, srcDest);
    }

    void xorPtr(TrustedImmPtr imm, RegisterID srcDest)
    {
        xor32(TrustedImm32(imm), srcDest);
    }

    void xorPtr(Address src, RegisterID dest)
    {
        xor32(src, dest);
    }

    void loadPtr(Address address, RegisterID dest)
    {
        load32(address, dest);
    }

    void loadPtr(BaseIndex address, RegisterID dest)
    {
#if CPU(NEEDS_ALIGNED_ACCESS)
        ASSERT(address.scale == ScalePtr || address.scale == TimesOne);
#endif
        load32(address, dest);
    }

    void loadPtr(const void* address, RegisterID dest)
    {
        load32(address, dest);
    }

    void loadPairPtr(RegisterID src, RegisterID dest1, RegisterID dest2)
    {
        loadPair32(src, dest1, dest2);
    }

    void loadPairPtr(RegisterID src, TrustedImm32 offset, RegisterID dest1, RegisterID dest2)
    {
        loadPair32(src, offset, dest1, dest2);
    }

    void loadPairPtr(Address src, RegisterID dest1, RegisterID dest2)
    {
        loadPair32(src, dest1, dest2);
    }

#if ENABLE(FAST_TLS_JIT)
    void loadFromTLSPtr(uint32_t offset, RegisterID dst)
    {
        loadFromTLS32(offset, dst);
    }

    void storeToTLSPtr(RegisterID src, uint32_t offset)
    {
        storeToTLS32(src, offset);
    }
#endif

    void comparePtr(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        compare32(cond, left, right, dest);
    }

    void comparePtr(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID dest)
    {
        compare32(cond, left, right, dest);
    }
    
    void storePtr(RegisterID src, Address address)
    {
        store32(src, address);
    }

    void storePtr(RegisterID src, BaseIndex address)
    {
        store32(src, address);
    }

    void storePtr(RegisterID src, void* address)
    {
        store32(src, address);
    }

    void storePtr(TrustedImmPtr imm, Address address)
    {
        store32(TrustedImm32(imm), address);
    }
    
    void storePtr(ImmPtr imm, Address address)
    {
        store32(Imm32(imm.asTrustedImmPtr()), address);
    }

    void storePtr(TrustedImmPtr imm, void* address)
    {
        store32(TrustedImm32(imm), address);
    }

    void storePtr(TrustedImm32 imm, Address address)
    {
        store32(imm, address);
    }

    void storePtr(TrustedImmPtr imm, BaseIndex address)
    {
        store32(TrustedImm32(imm), address);
    }

    void storePairPtr(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        storePair32(src1, src2, dest);
    }

    void storePairPtr(RegisterID src1, RegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        storePair32(src1, src2, dest, offset);
    }

    void storePairPtr(RegisterID src1, RegisterID src2, Address dest)
    {
        storePair32(src1, src2, dest);
    }

    Jump branchPtr(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        return branch32(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, RegisterID left, TrustedImmPtr right)
    {
        return branch32(cond, left, TrustedImm32(right));
    }
    
    Jump branchPtr(RelationalCondition cond, RegisterID left, ImmPtr right)
    {
        return branch32(cond, left, Imm32(right.asTrustedImmPtr()));
    }

    Jump branchPtr(RelationalCondition cond, RegisterID left, Address right)
    {
        return branch32(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, Address left, RegisterID right)
    {
        return branch32(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, AbsoluteAddress left, RegisterID right)
    {
        return branch32(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, Address left, TrustedImmPtr right)
    {
        return branch32(cond, left, TrustedImm32(right));
    }
    
    Jump branchPtr(RelationalCondition cond, AbsoluteAddress left, TrustedImmPtr right)
    {
        return branch32(cond, left, TrustedImm32(right));
    }

    Jump branchSubPtr(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchSub32(cond, src, dest);
    }

    Jump branchTestPtr(ResultCondition cond, RegisterID reg, RegisterID mask)
    {
        return branchTest32(cond, reg, mask);
    }

    Jump branchTestPtr(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest32(cond, reg, mask);
    }

    Jump branchTestPtr(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest32(cond, address, mask);
    }

    Jump branchTestPtr(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest32(cond, address, mask);
    }

    Jump branchTestPtr(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest32(cond, address, mask);
    }

    Jump branchAddPtr(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchAdd32(cond, src, dest);
    }

    Jump branchSubPtr(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        return branchSub32(cond, imm, dest);
    }
    using MacroAssemblerBase::branchTest8;
    Jump branchTest8(ResultCondition cond, ExtendedAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return MacroAssemblerBase::branchTest8(cond, Address(address.base, address.offset), mask);
    }

    using MacroAssemblerBase::branchTest16;
    Jump branchTest16(ResultCondition cond, ExtendedAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return MacroAssemblerBase::branchTest16(cond, Address(address.base, address.offset), mask);
    }

#else // !CPU(ADDRESS64)

    void addPtr(RegisterID src, RegisterID dest)
    {
        add64(src, dest);
    }

    void addPtr(RegisterID left, RegisterID right, RegisterID dest)
    {
        add64(left, right, dest);
    }
    
    void addPtr(Address src, RegisterID dest)
    {
        add64(src, dest);
    }

    void addPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        add64(imm, srcDest);
    }

    void addPtr(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        add64(imm, src, dest);
    }

    void addPtr(TrustedImm32 imm, Address address)
    {
        add64(imm, address);
    }

    void addPtr(AbsoluteAddress src, RegisterID dest)
    {
        add64(src, dest);
    }

    void addPtr(TrustedImmPtr imm, RegisterID dest)
    {
        add64(TrustedImm64(imm), dest);
    }

    void addPtr(TrustedImm32 imm, AbsoluteAddress address)
    {
        add64(imm, address);
    }

    void andPtr(RegisterID src, RegisterID dest)
    {
        and64(src, dest);
    }

    void andPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        and64(imm, srcDest);
    }
    
    void andPtr(TrustedImmPtr imm, RegisterID srcDest)
    {
        and64(imm, srcDest);
    }
    
    void lshiftPtr(Imm32 imm, RegisterID srcDest)
    {
        lshift64(trustedImm32ForShift(imm), srcDest);
    }

    void lshiftPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        lshift64(imm, srcDest);
    }

    void lshiftPtr(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        lshift64(src, imm, dest);
    }

    void lshiftPtr(TrustedImm32 imm, RegisterID shiftAmount, RegisterID dest)
    {
        lshift64(imm, shiftAmount, dest);
    }

    void rshiftPtr(Imm32 imm, RegisterID srcDest)
    {
        rshift64(trustedImm32ForShift(imm), srcDest);
    }

    void rshiftPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        rshift64(imm, srcDest);
    }

    void rshiftPtr(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        rshift64(src, imm, dest);
    }

    void urshiftPtr(Imm32 imm, RegisterID srcDest)
    {
        urshift64(trustedImm32ForShift(imm), srcDest);
    }

    void urshiftPtr(RegisterID shiftAmmount, RegisterID srcDest)
    {
        urshift64(shiftAmmount, srcDest);
    }

    void urshiftPtr(RegisterID src, TrustedImm32 imm, RegisterID dest)
    {
        urshift64(src, imm, dest);
    }

    void negPtr(RegisterID dest)
    {
        neg64(dest);
    }

    void negPtr(RegisterID src, RegisterID dest)
    {
        neg64(src, dest);
    }

    void orPtr(RegisterID src, RegisterID dest)
    {
        or64(src, dest);
    }

    void orPtr(TrustedImm32 imm, RegisterID dest)
    {
        or64(imm, dest);
    }

    void orPtr(TrustedImmPtr imm, RegisterID dest)
    {
        or64(TrustedImm64(imm), dest);
    }

    void orPtr(RegisterID op1, RegisterID op2, RegisterID dest)
    {
        or64(op1, op2, dest);
    }

    void orPtr(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        or64(imm, src, dest);
    }
    
    void rotateRightPtr(TrustedImm32 imm, RegisterID srcDst)
    {
        rotateRight64(imm, srcDst);
    }

    void subPtr(RegisterID src, RegisterID dest)
    {
        sub64(src, dest);
    }

    void subPtr(RegisterID left, RegisterID right, RegisterID dest)
    {
        sub64(left, right, dest);
    }

    void subPtr(TrustedImm32 imm, RegisterID dest)
    {
        sub64(imm, dest);
    }

    void subPtr(RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        sub64(left, right, dest);
    }

    void subPtr(TrustedImmPtr imm, RegisterID dest)
    {
        sub64(TrustedImm64(imm), dest);
    }

    void xorPtr(RegisterID src, RegisterID dest)
    {
        xor64(src, dest);
    }
    
    void xorPtr(Address src, RegisterID dest)
    {
        xor64(src, dest);
    }
    
    void xorPtr(RegisterID src, Address dest)
    {
        xor64(src, dest);
    }

    void xorPtr(TrustedImm32 imm, RegisterID srcDest)
    {
        xor64(imm, srcDest);
    }

    // FIXME: Look into making the need for a scratch register explicit, or providing the option to specify a scratch register.
    void xorPtr(TrustedImmPtr imm, RegisterID srcDest)
    {
        xor64(TrustedImm64(imm), srcDest);
    }

    void loadPtr(Address address, RegisterID dest)
    {
        load64(address, dest);
    }

    void loadPtr(BaseIndex address, RegisterID dest)
    {
#if CPU(NEEDS_ALIGNED_ACCESS)
        ASSERT(address.scale == ScalePtr || address.scale == TimesOne);
#endif
        load64(address, dest);
    }

    void loadPtr(const void* address, RegisterID dest)
    {
        load64(address, dest);
    }

    void loadPairPtr(RegisterID src, RegisterID dest1, RegisterID dest2)
    {
        loadPair64(src, dest1, dest2);
    }

    void loadPairPtr(RegisterID src, TrustedImm32 offset, RegisterID dest1, RegisterID dest2)
    {
        loadPair64(src, offset, dest1, dest2);
    }

    void loadPairPtr(Address src, RegisterID dest1, RegisterID dest2)
    {
        loadPair64(src, dest1, dest2);
    }

#if ENABLE(FAST_TLS_JIT)
    void loadFromTLSPtr(uint32_t offset, RegisterID dst)
    {
        loadFromTLS64(offset, dst);
    }
    void storeToTLSPtr(RegisterID src, uint32_t offset)
    {
        storeToTLS64(src, offset);
    }
#endif

    void storePtr(RegisterID src, Address address)
    {
        store64(src, address);
    }

    void storePtr(RegisterID src, BaseIndex address)
    {
        store64(src, address);
    }
    
    void storePtr(RegisterID src, void* address)
    {
        store64(src, address);
    }

    void storePtr(TrustedImmPtr imm, Address address)
    {
        store64(TrustedImm64(imm), address);
    }

    void storePtr(TrustedImm32 imm, Address address)
    {
        store64(imm, address);
    }

    void storePtr(TrustedImmPtr imm, BaseIndex address)
    {
        store64(TrustedImm64(imm), address);
    }

    void storePairPtr(RegisterID src1, RegisterID src2, RegisterID dest)
    {
        storePair64(src1, src2, dest);
    }

    void storePairPtr(RegisterID src1, RegisterID src2, RegisterID dest, TrustedImm32 offset)
    {
        storePair64(src1, src2, dest, offset);
    }

    void storePairPtr(RegisterID src1, RegisterID src2, Address dest)
    {
        storePair64(src1, src2, dest);
    }

    void comparePtr(RelationalCondition cond, RegisterID left, TrustedImm32 right, RegisterID dest)
    {
        compare64(cond, left, right, dest);
    }
    
    void comparePtr(RelationalCondition cond, RegisterID left, RegisterID right, RegisterID dest)
    {
        compare64(cond, left, right, dest);
    }
    
    void testPtr(ResultCondition cond, RegisterID reg, TrustedImm32 mask, RegisterID dest)
    {
        test64(cond, reg, mask, dest);
    }

    void testPtr(ResultCondition cond, RegisterID reg, RegisterID mask, RegisterID dest)
    {
        test64(cond, reg, mask, dest);
    }

    Jump branchPtr(RelationalCondition cond, RegisterID left, RegisterID right)
    {
        return branch64(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, RegisterID left, TrustedImmPtr right)
    {
        return branch64(cond, left, TrustedImm64(right));
    }
    
    Jump branchPtr(RelationalCondition cond, RegisterID left, Address right)
    {
        return branch64(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, Address left, RegisterID right)
    {
        return branch64(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, AbsoluteAddress left, RegisterID right)
    {
        return branch64(cond, left, right);
    }

    Jump branchPtr(RelationalCondition cond, Address left, TrustedImmPtr right)
    {
        return branch64(cond, left, TrustedImm64(right));
    }

    Jump branchTestPtr(ResultCondition cond, RegisterID reg, RegisterID mask)
    {
        return branchTest64(cond, reg, mask);
    }
    
    Jump branchTestPtr(ResultCondition cond, RegisterID reg, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest64(cond, reg, mask);
    }

    Jump branchTestPtr(ResultCondition cond, Address address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest64(cond, address, mask);
    }

    Jump branchTestPtr(ResultCondition cond, Address address, RegisterID reg)
    {
        return branchTest64(cond, address, reg);
    }

    Jump branchTestPtr(ResultCondition cond, BaseIndex address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest64(cond, address, mask);
    }

    Jump branchTestPtr(ResultCondition cond, AbsoluteAddress address, TrustedImm32 mask = TrustedImm32(-1))
    {
        return branchTest64(cond, address, mask);
    }

    Jump branchAddPtr(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        return branchAdd64(cond, imm, dest);
    }

    Jump branchAddPtr(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchAdd64(cond, src, dest);
    }

    Jump branchSubPtr(ResultCondition cond, TrustedImm32 imm, RegisterID dest)
    {
        return branchSub64(cond, imm, dest);
    }

    Jump branchSubPtr(ResultCondition cond, RegisterID src, RegisterID dest)
    {
        return branchSub64(cond, src, dest);
    }

    Jump branchSubPtr(ResultCondition cond, RegisterID src1, TrustedImm32 src2, RegisterID dest)
    {
        return branchSub64(cond, src1, src2, dest);
    }

    Jump branchPtr(RelationalCondition cond, RegisterID left, ImmPtr right)
    {
        if (shouldBlind(right) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(right), scratchRegister);
            return branchPtr(cond, left, scratchRegister);
        }
        return branchPtr(cond, left, right.asTrustedImmPtr());
    }

    void storePtr(ImmPtr imm, Address dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            storePtr(scratchRegister, dest);
        } else
            storePtr(imm.asTrustedImmPtr(), dest);
    }

#endif // !CPU(ADDRESS64)

#if CPU(REGISTER64)
    void loadRegWord(Address address, RegisterID dest)
    {
        load64(address, dest);
    }

    void loadRegWord(BaseIndex address, RegisterID dest)
    {
#if CPU(NEEDS_ALIGNED_ACCESS)
        ASSERT(address.scale == ScaleRegWord || address.scale == TimesOne);
#endif
        load64(address, dest);
    }

    void loadRegWord(const void* address, RegisterID dest)
    {
        load64(address, dest);
    }

    void storeRegWord(RegisterID src, Address address)
    {
        store64(src, address);
    }

    void storeRegWord(RegisterID src, BaseIndex address)
    {
        store64(src, address);
    }

    void storeRegWord(RegisterID src, void* address)
    {
        store64(src, address);
    }

    void storeRegWord(TrustedImm64 imm, Address address)
    {
        store64(imm, address);
    }

#elif CPU(REGISTER32)
    void loadRegWord(Address address, RegisterID dest)
    {
        load32(address, dest);
    }

    void loadRegWord(BaseIndex address, RegisterID dest)
    {
#if CPU(NEEDS_ALIGNED_ACCESS)
        ASSERT(address.scale == ScaleRegWord || address.scale == TimesOne);
#endif
        load32(address, dest);
    }

    void loadRegWord(const void* address, RegisterID dest)
    {
        load32(address, dest);
    }

    void storeRegWord(RegisterID src, Address address)
    {
        store32(src, address);
    }

    void storeRegWord(RegisterID src, BaseIndex address)
    {
        store32(src, address);
    }

    void storeRegWord(RegisterID src, void* address)
    {
        store32(src, address);
    }

    void storeRegWord(TrustedImm32 imm, Address address)
    {
        store32(imm, address);
    }
#else
#  error "Unknown register size"
#endif

#if USE(JSVALUE64)
    bool shouldBlindDouble(double value)
    {
        // Don't trust NaN or +/-Infinity
        if (!std::isfinite(value))
            return shouldConsiderBlinding();

        // Try to force normalisation, and check that there's no change
        // in the bit pattern
        if (std::bit_cast<uint64_t>(value * 1.0) != std::bit_cast<uint64_t>(value))
            return shouldConsiderBlinding();

        value = std::abs(value);
        // Only allow a limited set of fractional components
        double scaledValue = value * 8;
        if (scaledValue / 8 != value)
            return shouldConsiderBlinding();
        double frac = scaledValue - floor(scaledValue);
        if (frac != 0.0)
            return shouldConsiderBlinding();

        return value > 0xff;
    }
    
    bool shouldBlindPointerForSpecificArch(uintptr_t value)
    {
        if (sizeof(void*) == 4)
            return shouldBlindForSpecificArch(static_cast<uint32_t>(value));
        return shouldBlindForSpecificArch(static_cast<uint64_t>(value));
    }

#if CPU(X86_64)
    bool shouldBlind(ImmPtr imm)
    {
        static_assert(canBlind());
        
#if ENABLE(FORCED_JIT_BLINDING)
        UNUSED_PARAM(imm);
        // Debug always blind all constants, if only so we know
        // if we've broken blinding during patch development.
        return true;
#endif

        // First off we'll special case common, "safe" values to avoid hurting
        // performance too much
        uint64_t value = imm.asTrustedImmPtr().asIntptr();
        switch (value) {
        case 0xffff:
        case 0xffffff:
        case 0xffffffffL:
        case 0xffffffffffL:
        case 0xffffffffffffL:
        case 0xffffffffffffffL:
        case 0xffffffffffffffffL:
            return false;
        default: {
            if (value <= 0xff)
                return false;
            if (~value <= 0xff)
                return false;
        }
        }

        if (!shouldConsiderBlinding())
            return false;

        return shouldBlindPointerForSpecificArch(static_cast<uintptr_t>(value));
    }
#else
    static constexpr bool shouldBlind(ImmPtr)
    {
        static_assert(!canBlind());
        return false;
    }
#endif

    uint8_t generateRotationSeed(size_t widthInBits)
    {
        // Generate the seed in [1, widthInBits - 1]. We should not generate widthInBits or 0
        // since it leads to `<< widthInBits` or `>> widthInBits`, which cause undefined behaviors.
        return (random() % (widthInBits - 1)) + 1;
    }
    
    struct RotatedImmPtr {
        RotatedImmPtr(uintptr_t v1, uint8_t v2)
            : value(v1)
            , rotation(v2)
        {
        }
        TrustedImmPtr value;
        TrustedImm32 rotation;
    };
    
    RotatedImmPtr rotationBlindConstant(ImmPtr imm)
    {
        uint8_t rotation = generateRotationSeed(sizeof(void*) * 8);
        uintptr_t value = imm.asTrustedImmPtr().asIntptr();
        value = (value << rotation) | (value >> (sizeof(void*) * 8 - rotation));
        return RotatedImmPtr(value, rotation);
    }
    
    void loadRotationBlindedConstant(RotatedImmPtr constant, RegisterID dest)
    {
        move(constant.value, dest);
        rotateRightPtr(constant.rotation, dest);
    }

#if CPU(X86_64)
    bool shouldBlind(Imm64 imm)
    {
        static_assert(canBlind());

#if ENABLE(FORCED_JIT_BLINDING)
        UNUSED_PARAM(imm);
        // Debug always blind all constants, if only so we know
        // if we've broken blinding during patch development.
        return true;        
#endif

        // First off we'll special case common, "safe" values to avoid hurting
        // performance too much
        uint64_t value = imm.asTrustedImm64().m_value;
        switch (value) {
        case 0xffff:
        case 0xffffff:
        case 0xffffffffL:
        case 0xffffffffffL:
        case 0xffffffffffffL:
        case 0xffffffffffffffL:
        case 0xffffffffffffffffL:
            return false;
        default: {
            if (value <= 0xff)
                return false;
            if (~value <= 0xff)
                return false;

            JSValue jsValue = JSValue::decode(value);
            if (jsValue.isInt32())
                return shouldBlind(Imm32(jsValue.asInt32()));
            if (jsValue.isDouble() && !shouldBlindDouble(jsValue.asDouble()))
                return false;

            if (!shouldBlindDouble(std::bit_cast<double>(value)))
                return false;
        }
        }

        if (!shouldConsiderBlinding())
            return false;

        return shouldBlindForSpecificArch(value);
    }
#else
    static constexpr bool shouldBlind(Imm64)
    {
        static_assert(!canBlind());
        return false;
    }
#endif
    
    struct RotatedImm64 {
        RotatedImm64(uint64_t v1, uint8_t v2)
            : value(v1)
            , rotation(v2)
        {
        }
        TrustedImm64 value;
        TrustedImm32 rotation;
    };
    
    RotatedImm64 rotationBlindConstant(Imm64 imm)
    {
        uint8_t rotation = generateRotationSeed(sizeof(int64_t) * 8);
        uint64_t value = imm.asTrustedImm64().m_value;
        value = (value << rotation) | (value >> (sizeof(int64_t) * 8 - rotation));
        return RotatedImm64(value, rotation);
    }
    
    void loadRotationBlindedConstant(RotatedImm64 constant, RegisterID dest)
    {
        move(constant.value, dest);
        rotateRight64(constant.rotation, dest);
    }

    void convertInt32ToDouble(Imm32 imm, FPRegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadXorBlindedConstant(xorBlindConstant(imm), scratchRegister);
            convertInt32ToDouble(scratchRegister, dest);
        } else
            convertInt32ToDouble(imm.asTrustedImm32(), dest);
    }

    void move(ImmPtr imm, RegisterID dest)
    {
        if (shouldBlind(imm))
            loadRotationBlindedConstant(rotationBlindConstant(imm), dest);
        else
            move(imm.asTrustedImmPtr(), dest);
    }

    void move(Imm64 imm, RegisterID dest)
    {
        if (shouldBlind(imm))
            loadRotationBlindedConstant(rotationBlindConstant(imm), dest);
        else
            move(imm.asTrustedImm64(), dest);
    }

    void and64(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = andBlindedConstant(imm);
            and64(key.value1, dest);
            and64(key.value2, dest);
        } else
            and64(imm.asTrustedImm32(), dest);
    }

    void and64(Imm32 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            move(src, dest);
            and64(imm, dest);
        } else
            and64(imm.asTrustedImm32(), src, dest);
    }

    void and64(Imm64 imm, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            and64(scratchRegister, dest);
        } else
            and64(imm.asTrustedImm64(), dest);
    }

    void and64(Imm64 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            and64(scratchRegister, dest);
        } else
            and64(imm.asTrustedImm64(), src, dest);
    }

    void xor64(Imm64 imm, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            xor64(scratchRegister, dest);
        } else
            xor64(imm.asTrustedImm64(), dest);
    }

    void xor64(Imm64 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            xor64(scratchRegister, dest);
        } else
            xor64(imm.asTrustedImm64(), src, dest);
    }

    void or64(Imm64 imm, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            or64(scratchRegister, dest);
        } else
            or64(imm.asTrustedImm64(), dest);
    }

    void or64(Imm64 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            or64(scratchRegister, dest);
        } else
            or64(imm.asTrustedImm64(), src, dest);
    }

    void add64(Imm64 imm, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            add64(scratchRegister, dest);
        } else
            add64(imm.asTrustedImm64(), dest);
    }

    void add64(Imm64 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            move(src, dest);
            add64(imm, dest);
        } else
            add64(imm.asTrustedImm64(), src, dest);
    }

    void sub64(Imm64 imm, RegisterID dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            sub64(scratchRegister, dest);
        } else
            sub64(imm.asTrustedImm64(), dest);
    }

    void sub64(RegisterID src, Imm64 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            move(src, dest);
            sub64(imm, dest);
        } else
            sub64(src, imm.asTrustedImm64(), dest);
    }

    void compare64(RelationalCondition cond, Imm64 left, RegisterID right, RegisterID dest)
    {
        compare64(commute(cond), right, left, dest);
    }

    void compare64(RelationalCondition cond, RegisterID left, Imm64 right, RegisterID dest)
    {
        if (shouldBlind(right)) {
            if (left != dest || haveScratchRegisterForBlinding()) {
                RegisterID blindedConstantReg = dest;
                if (left == dest)
                    blindedConstantReg = scratchRegisterForBlinding();
                loadRotationBlindedConstant(rotationBlindConstant(right), blindedConstantReg);
                compare64(cond, left, blindedConstantReg, dest);
                return;
            }
            // If we don't have a scratch register available for use, we'll just
            // place a random number of nops.
            uint32_t nopCount = random() & 3;
            while (nopCount--)
                nop();
            compare64(cond, left, right.asTrustedImm64(), dest);
            return;
        }

        compare64(cond, left, right.asTrustedImm64(), dest);
    }

#endif // USE(JSVALUE64)

#if CPU(X86_64)
    void move32ToFloat(Imm32 imm, FPRegisterID dest)
    {
        move(imm, scratchRegister());
        move32ToFloat(scratchRegister(), dest);
    }

    void move64ToDouble(Imm64 imm, FPRegisterID dest)
    {
        move(imm, scratchRegister());
        move64ToDouble(scratchRegister(), dest);
    }
#else
    void move32ToFloat(Imm32 imm, FPRegisterID dest)
    {
        MacroAssemblerBase::move32ToFloat(imm.asTrustedImm32(), dest);
    }

    void move64ToDouble(Imm64 imm, FPRegisterID dest)
    {
        MacroAssemblerBase::move64ToDouble(imm.asTrustedImm64(), dest);
    }
#endif

#if !CPU(X86_64) && !CPU(ARM64)
    // We should implement this the right way eventually, but for now, it's fine because it arises so
    // infrequently.
    void compareDouble(DoubleCondition cond, FPRegisterID left, FPRegisterID right, RegisterID dest)
    {
        move(TrustedImm32(0), dest);
        Jump falseCase = branchDouble(invert(cond), left, right);
        move(TrustedImm32(1), dest);
        falseCase.link(this);
    }

    void compareDoubleWithZero(DoubleCondition cond, FPRegisterID left, RegisterID dest)
    {
        UNUSED_PARAM(cond);
        UNUSED_PARAM(left);
        UNUSED_PARAM(dest);
        UNREACHABLE_FOR_PLATFORM();
    }
#endif

    void lea32(Address address, RegisterID dest)
    {
        add32(TrustedImm32(address.offset), address.base, dest);
    }

#if CPU(X86_64) || CPU(ARM64) || CPU(RISCV64)
    void lea64(Address address, RegisterID dest)
    {
        add64(TrustedImm32(address.offset), address.base, dest);
    }
#endif // CPU(X86_64) || CPU(ARM64) || CPU(RISCV64)

#if CPU(X86_64)
    bool shouldBlind(Imm32 imm)
    {
        static_assert(canBlind());

#if ENABLE(FORCED_JIT_BLINDING)
        UNUSED_PARAM(imm);
        // Debug always blind all constants, if only so we know
        // if we've broken blinding during patch development.
        return true;
#else // ENABLE(FORCED_JIT_BLINDING)

        // First off we'll special case common, "safe" values to avoid hurting
        // performance too much
        uint32_t value = imm.asTrustedImm32().m_value;
        switch (value) {
        case 0xffff:
        case 0xffffff:
        case 0xffffffff:
            return false;
        default:
            if (value <= 0xff)
                return false;
            if (~value <= 0xff)
                return false;
        }

        if (!shouldConsiderBlinding())
            return false;

        return shouldBlindForSpecificArch(value);
#endif // ENABLE(FORCED_JIT_BLINDING)
    }
#else
    static constexpr bool shouldBlind(Imm32)
    {
        static_assert(!canBlind());
        return false;
    }
#endif

    struct BlindedImm32 {
        BlindedImm32(int32_t v1, int32_t v2)
            : value1(v1)
            , value2(v2)
        {
        }
        TrustedImm32 value1;
        TrustedImm32 value2;
    };

    uint32_t keyForConstant(uint32_t value, uint32_t& mask)
    {
        uint32_t key = random();
        if (value <= 0xff)
            mask = 0xff;
        else if (value <= 0xffff)
            mask = 0xffff;
        else if (value <= 0xffffff)
            mask = 0xffffff;
        else
            mask = 0xffffffff;
        return key & mask;
    }

    uint32_t keyForConstant(uint32_t value)
    {
        uint32_t mask = 0;
        return keyForConstant(value, mask);
    }

    BlindedImm32 xorBlindConstant(Imm32 imm)
    {
        uint32_t baseValue = imm.asTrustedImm32().m_value;
        uint32_t key = keyForConstant(baseValue);
        return BlindedImm32(baseValue ^ key, key);
    }

    BlindedImm32 additionBlindedConstant(Imm32 imm)
    {
        // The addition immediate may be used as a pointer offset. Keep aligned based on "imm".
        static const uint32_t maskTable[4] = { 0xfffffffc, 0xffffffff, 0xfffffffe, 0xffffffff };

        uint32_t baseValue = imm.asTrustedImm32().m_value;
        uint32_t key = keyForConstant(baseValue) & maskTable[baseValue & 3];
        if (key > baseValue)
            key = key - baseValue;
        return BlindedImm32(baseValue - key, key);
    }
    
    BlindedImm32 andBlindedConstant(Imm32 imm)
    {
        uint32_t baseValue = imm.asTrustedImm32().m_value;
        uint32_t mask = 0;
        uint32_t key = keyForConstant(baseValue, mask);
        ASSERT((baseValue & mask) == baseValue);
        return BlindedImm32(((baseValue & key) | ~key) & mask, ((baseValue & ~key) | key) & mask);
    }
    
    BlindedImm32 orBlindedConstant(Imm32 imm)
    {
        uint32_t baseValue = imm.asTrustedImm32().m_value;
        uint32_t mask = 0;
        uint32_t key = keyForConstant(baseValue, mask);
        ASSERT((baseValue & mask) == baseValue);
        return BlindedImm32((baseValue & key) & mask, (baseValue & ~key) & mask);
    }
    
    void loadXorBlindedConstant(BlindedImm32 constant, RegisterID dest)
    {
        move(constant.value1, dest);
        xor32(constant.value2, dest);
    }
    
    void add32(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = additionBlindedConstant(imm);
            add32(key.value1, dest);
            add32(key.value2, dest);
        } else
            add32(imm.asTrustedImm32(), dest);
    }

    void add32(Imm32 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = additionBlindedConstant(imm);
            add32(key.value1, src, dest);
            add32(key.value2, dest);
        } else
            add32(imm.asTrustedImm32(), src, dest);
    }
    
    void addPtr(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = additionBlindedConstant(imm);
            addPtr(key.value1, dest);
            addPtr(key.value2, dest);
        } else
            addPtr(imm.asTrustedImm32(), dest);
    }

    void mul32(Imm32 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            if (src != dest || haveScratchRegisterForBlinding()) {
                if (src == dest) {
                    move(src, scratchRegisterForBlinding());
                    src = scratchRegisterForBlinding();
                }
                loadXorBlindedConstant(xorBlindConstant(imm), dest);
                mul32(src, dest);
                return;
            }
            // If we don't have a scratch register available for use, we'll just
            // place a random number of nops.
            uint32_t nopCount = random() & 3;
            while (nopCount--)
                nop();
        }
        mul32(imm.asTrustedImm32(), src, dest);
    }

    void and32(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = andBlindedConstant(imm);
            and32(key.value1, dest);
            and32(key.value2, dest);
        } else
            and32(imm.asTrustedImm32(), dest);
    }

    void andPtr(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = andBlindedConstant(imm);
            andPtr(key.value1, dest);
            andPtr(key.value2, dest);
        } else
            andPtr(imm.asTrustedImm32(), dest);
    }
    
    void and32(Imm32 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            if (src == dest)
                return and32(imm.asTrustedImm32(), dest);
            loadXorBlindedConstant(xorBlindConstant(imm), dest);
            and32(src, dest);
        } else
            and32(imm.asTrustedImm32(), src, dest);
    }

    void move(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm))
            loadXorBlindedConstant(xorBlindConstant(imm), dest);
        else
            move(imm.asTrustedImm32(), dest);
    }
    
    void or32(Imm32 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            if (src == dest)
                return or32(imm, dest);
            loadXorBlindedConstant(xorBlindConstant(imm), dest);
            or32(src, dest);
        } else
            or32(imm.asTrustedImm32(), src, dest);
    }
    
    void or32(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = orBlindedConstant(imm);
            or32(key.value1, dest);
            or32(key.value2, dest);
        } else
            or32(imm.asTrustedImm32(), dest);
    }
    
    void poke(Imm32 value, int index = 0)
    {
        store32(value, addressForPoke(index));
    }
    
    void poke(ImmPtr value, int index = 0)
    {
        storePtr(value, addressForPoke(index));
    }
    
#if CPU(X86_64) || CPU(ARM64) || CPU(RISCV64)
    void poke(Imm64 value, int index = 0)
    {
        store64(value, addressForPoke(index));
    }

    void store64(Imm64 imm, Address dest)
    {
        if (shouldBlind(imm) && haveScratchRegisterForBlinding()) {
            RegisterID scratchRegister = scratchRegisterForBlinding();
            loadRotationBlindedConstant(rotationBlindConstant(imm), scratchRegister);
            store64(scratchRegister, dest);
        } else
            store64(imm.asTrustedImm64(), dest);
    }

#endif // CPU(X86_64) || CPU(ARM64) || CPU(RISCV64)
    
    void store32(Imm32 imm, Address dest)
    {
        if (shouldBlind(imm)) {
#if CPU(X86_64)
            BlindedImm32 blind = xorBlindConstant(imm);
            store32(blind.value1, dest);
            xor32(blind.value2, dest);
#else // CPU(X86_64)
            if (haveScratchRegisterForBlinding()) {
                loadXorBlindedConstant(xorBlindConstant(imm), scratchRegisterForBlinding());
                store32(scratchRegisterForBlinding(), dest);
            } else {
                // If we don't have a scratch register available for use, we'll just 
                // place a random number of nops.
                uint32_t nopCount = random() & 3;
                while (nopCount--)
                    nop();
                store32(imm.asTrustedImm32(), dest);
            }
#endif // CPU(X86_64)
        } else
            store32(imm.asTrustedImm32(), dest);
    }
    
    void sub32(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = additionBlindedConstant(imm);
            sub32(key.value1, dest);
            sub32(key.value2, dest);
        } else
            sub32(imm.asTrustedImm32(), dest);
    }

    void sub32(RegisterID src, Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = additionBlindedConstant(imm);
            sub32(src, key.value1, dest);
            sub32(key.value2, dest);
        } else
            sub32(src, imm.asTrustedImm32(), dest);
    }
    
    void subPtr(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 key = additionBlindedConstant(imm);
            subPtr(key.value1, dest);
            subPtr(key.value2, dest);
        } else
            subPtr(imm.asTrustedImm32(), dest);
    }
    
    void xor32(Imm32 imm, RegisterID src, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 blind = xorBlindConstant(imm);
            xor32(blind.value1, src, dest);
            xor32(blind.value2, dest);
        } else
            xor32(imm.asTrustedImm32(), src, dest);
    }
    
    void xor32(Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            BlindedImm32 blind = xorBlindConstant(imm);
            xor32(blind.value1, dest);
            xor32(blind.value2, dest);
        } else
            xor32(imm.asTrustedImm32(), dest);
    }

    Jump branch32(RelationalCondition cond, RegisterID left, Imm32 right)
    {
        if (shouldBlind(right)) {
            if (haveScratchRegisterForBlinding()) {
                loadXorBlindedConstant(xorBlindConstant(right), scratchRegisterForBlinding());
                return branch32(cond, left, scratchRegisterForBlinding());
            }
            // If we don't have a scratch register available for use, we'll just 
            // place a random number of nops.
            uint32_t nopCount = random() & 3;
            while (nopCount--)
                nop();
            return branch32(cond, left, right.asTrustedImm32());
        }
        
        return branch32(cond, left, right.asTrustedImm32());
    }

#if CPU(X86_64)
    // Other 64-bit platforms don't need blinding, and have branch64(RelationalCondition, RegisterID, Imm64) directly defined in the right file.
    // We cannot put this in MacroAssemblerX86_64.h, because it uses shouldBlind(), loadRoationBlindedConstant, etc.. which are only defined here and not there.
    Jump branch64(RelationalCondition cond, RegisterID left, Imm64 right)
    {
        if (shouldBlind(right)) {
            if (haveScratchRegisterForBlinding()) {
                loadRotationBlindedConstant(rotationBlindConstant(right), scratchRegisterForBlinding());
                return branch64(cond, left, scratchRegisterForBlinding());
            }

            // If we don't have a scratch register available for use, we'll just
            // place a random number of nops.
            uint32_t nopCount = random() & 3;
            while (nopCount--)
                nop();
            return branch64(cond, left, right.asTrustedImm64());
        }
        return branch64(cond, left, right.asTrustedImm64());
    }
#endif // CPU(X86_64)

    void compare32(RelationalCondition cond, RegisterID left, Imm32 right, RegisterID dest)
    {
        if (shouldBlind(right)) {
            if (left != dest || haveScratchRegisterForBlinding()) {
                RegisterID blindedConstantReg = dest;
                if (left == dest)
                    blindedConstantReg = scratchRegisterForBlinding();
                loadXorBlindedConstant(xorBlindConstant(right), blindedConstantReg);
                compare32(cond, left, blindedConstantReg, dest);
                return;
            }
            // If we don't have a scratch register available for use, we'll just
            // place a random number of nops.
            uint32_t nopCount = random() & 3;
            while (nopCount--)
                nop();
            compare32(cond, left, right.asTrustedImm32(), dest);
            return;
        }

        compare32(cond, left, right.asTrustedImm32(), dest);
    }

    Jump branchAdd32(ResultCondition cond, RegisterID src, Imm32 imm, RegisterID dest)
    {
        if (shouldBlind(imm)) {
            if (src != dest || haveScratchRegisterForBlinding()) {
                if (src == dest) {
                    move(src, scratchRegisterForBlinding());
                    src = scratchRegisterForBlinding();
                }
                loadXorBlindedConstant(xorBlindConstant(imm), dest);
                return branchAdd32(cond, src, dest);
            }
            // If we don't have a scratch register available for use, we'll just
            // place a random number of nops.
            uint32_t nopCount = random() & 3;
            while (nopCount--)
                nop();
        }
        return branchAdd32(cond, src, imm.asTrustedImm32(), dest);            
    }
    
    Jump branchMul32(ResultCondition cond, RegisterID src, Imm32 imm, RegisterID dest)
    {
        if (src == dest)
            ASSERT(haveScratchRegisterForBlinding());

        if (shouldBlind(imm)) {
            if (src == dest) {
                move(src, scratchRegisterForBlinding());
                src = scratchRegisterForBlinding();
            }
            loadXorBlindedConstant(xorBlindConstant(imm), dest);
            return branchMul32(cond, src, dest);  
        }
        return branchMul32(cond, src, imm.asTrustedImm32(), dest);
    }

    // branchSub32 takes a scratch register as 32 bit platforms make use of this,
    // with src == dst, and on x86-32 we don't have a platform scratch register.
    Jump branchSub32(ResultCondition cond, RegisterID src, Imm32 imm, RegisterID dest, RegisterID scratch)
    {
        if (shouldBlind(imm)) {
            ASSERT(scratch != dest);
            ASSERT(scratch != src);
            loadXorBlindedConstant(xorBlindConstant(imm), scratch);
            return branchSub32(cond, src, scratch, dest);
        }
        return branchSub32(cond, src, imm.asTrustedImm32(), dest);            
    }
    
    void lshift32(Imm32 imm, RegisterID dest)
    {
        lshift32(trustedImm32ForShift(imm), dest);
    }
    
    void lshift32(RegisterID src, Imm32 amount, RegisterID dest)
    {
        lshift32(src, trustedImm32ForShift(amount), dest);
    }

    void lshift32(Imm32 amount, RegisterID shiftAmount, RegisterID dest)
    {
        lshift32(trustedImm32ForShift(amount), shiftAmount, dest);
    }
    
    void rshift32(Imm32 imm, RegisterID dest)
    {
        rshift32(trustedImm32ForShift(imm), dest);
    }
    
    void rshift32(RegisterID src, Imm32 amount, RegisterID dest)
    {
        rshift32(src, trustedImm32ForShift(amount), dest);
    }
    
    void urshift32(Imm32 imm, RegisterID dest)
    {
        urshift32(trustedImm32ForShift(imm), dest);
    }
    
    void urshift32(RegisterID src, Imm32 amount, RegisterID dest)
    {
        urshift32(src, trustedImm32ForShift(amount), dest);
    }

    void mul32(TrustedImm32 imm, RegisterID src, RegisterID dest)
    {
        if (hasOneBitSet(imm.m_value)) {
            lshift32(src, TrustedImm32(getLSBSet(imm.m_value)), dest);
            return;
        }
        MacroAssemblerBase::mul32(imm, src, dest);
    }

    void jitAssert(const WTF::ScopedLambda<Jump(void)>&);

    // This function emits code to preserve the CPUState (e.g. registers),
    // call a user supplied probe function, and restore the CPUState before
    // continuing with other JIT generated code.
    //
    // The user supplied probe function will be called with a single pointer to
    // a Probe::State struct (defined below) which contains, among other things,
    // the preserved CPUState. This allows the user probe function to inspect
    // the CPUState at that point in the JIT generated code.
    //
    // If the user probe function alters the register values in the Probe::State,
    // the altered values will be loaded into the CPU registers when the probe
    // returns.
    //
    // The Probe::State is stack allocated and is only valid for the duration
    // of the call to the user probe function.
    //
    // The probe function may choose to move the stack pointer (in any direction).
    // To do this, the probe function needs to set the new sp value in the CPUState.
    //
    // The probe function may also choose to fill stack space with some values.
    // To do this, the probe function must first:
    // 1. Set the new sp value in the Probe::State's CPUState.
    // 2. Set the Probe::State's initializeStackFunction to a Probe::Function callback
    //    which will do the work of filling in the stack values after the probe
    //    trampoline has adjusted the machine stack pointer.
    // 3. Set the Probe::State's initializeStackArgs to any value that the client wants
    //    to pass to the initializeStackFunction callback.
    // 4. Return from the probe function.
    //
    // Upon returning from the probe function, the probe trampoline will adjust the
    // the stack pointer based on the sp value in CPUState. If initializeStackFunction
    // is not set, the probe trampoline will restore registers and return to its caller.
    //
    // If initializeStackFunction is set, the trampoline will move the Probe::State
    // beyond the range of the stack pointer i.e. it will place the new Probe::State at
    // an address lower than where CPUState.sp() points. This ensures that the
    // Probe::State will not be trashed by the initializeStackFunction when it writes to
    // the stack. Then, the trampoline will call back to the initializeStackFunction
    // Probe::Function to let it fill in the stack values as desired. The
    // initializeStackFunction Probe::Function will be passed the moved Probe::State at
    // the new location.
    //
    // initializeStackFunction may now write to the stack at addresses greater or
    // equal to CPUState.sp(), but not below that. initializeStackFunction is also
    // not allowed to change CPUState.sp(). If the initializeStackFunction does not
    // abide by these rules, then behavior is undefined, and bad things may happen.
    //
    // Note: this version of probe() should be implemented by the target specific
    // MacroAssembler.
    void probe(Probe::Function, void* arg, SavedFPWidth = SavedFPWidth::DontSaveVectors);

    // This leaks memory. Must not be used for production.
    JS_EXPORT_PRIVATE void probeDebug(Function<void(Probe::Context&)>);
    JS_EXPORT_PRIVATE void probeDebugSIMD(Function<void(Probe::Context&)>);

    // Let's you print from your JIT generated code.
    // See comments in MacroAssemblerPrinter.h for examples of how to use this.
    void print(auto&&... args);
    void println(auto&&... args);

    void print(Printer::PrintRecordList*);

    template<PtrTag tag>
    void nearCallThunk(CodeLocationLabel<tag> label)
    {
        nearCall().linkThunk(label, this);
    }

    template<PtrTag tag>
    void nearTailCallThunk(CodeLocationLabel<tag> label)
    {
        nearTailCall().linkThunk(label, this);
    }

    template<PtrTag tag>
    void jumpThunk(CodeLocationLabel<tag> label)
    {
        jump().linkThunk(label, this);
    }
};

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::MacroAssembler::RelationalCondition);
void printInternal(PrintStream&, JSC::MacroAssembler::ResultCondition);
void printInternal(PrintStream&, JSC::MacroAssembler::DoubleCondition);

} // namespace WTF

#else // ENABLE(ASSEMBLER)

namespace JSC {

// If there is no assembler for this platform, at least allow code to make references to
// some of the things it would otherwise define, albeit without giving that code any way
// of doing anything useful.
class MacroAssembler {
private:
    MacroAssembler() { }
    
public:
    
    enum RegisterID : int8_t { NoRegister, InvalidGPRReg = -1 };
    enum FPRegisterID : int8_t { NoFPRegister, InvalidFPRReg = -1 };
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER)

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
