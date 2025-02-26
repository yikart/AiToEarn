/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

namespace JSC {
namespace MacroAssemblerHelpers {

// True if this:
//     branch8(cond, value, value)
// Is the same as this:
//     branch32(cond, signExt8(value), signExt8(value))
template<typename MacroAssemblerType>
inline bool isSigned(typename MacroAssemblerType::RelationalCondition cond)
{
    switch (cond) {
    case MacroAssemblerType::Equal:
    case MacroAssemblerType::NotEqual:
    case MacroAssemblerType::GreaterThan:
    case MacroAssemblerType::GreaterThanOrEqual:
    case MacroAssemblerType::LessThan:
    case MacroAssemblerType::LessThanOrEqual:
        return true;
    default:
        return false;
    }
}

// True if this:
//     branch8(cond, value, value)
// Is the same as this:
//     branch32(cond, zeroExt8(value), zeroExt8(value))
template<typename MacroAssemblerType>
inline bool isUnsigned(typename MacroAssemblerType::RelationalCondition cond)
{
    switch (cond) {
    case MacroAssemblerType::Equal:
    case MacroAssemblerType::NotEqual:
    case MacroAssemblerType::Above:
    case MacroAssemblerType::AboveOrEqual:
    case MacroAssemblerType::Below:
    case MacroAssemblerType::BelowOrEqual:
        return true;
    default:
        return false;
    }
}

// True if this:
//     test8(cond, value, value)
// Is the same as this:
//     test32(cond, signExt8(value), signExt8(value))
template<typename MacroAssemblerType>
inline bool isSigned(typename MacroAssemblerType::ResultCondition cond)
{
    switch (cond) {
    case MacroAssemblerType::Signed:
    case MacroAssemblerType::PositiveOrZero:
    case MacroAssemblerType::Zero:
    case MacroAssemblerType::NonZero:
        return true;
    default:
        return false;
    }
}

// True if this:
//     test8(cond, value, value)
// Is the same as this:
//     test32(cond, zeroExt8(value), zeroExt8(value))
template<typename MacroAssemblerType>
inline bool isUnsigned(typename MacroAssemblerType::ResultCondition cond)
{
    switch (cond) {
    case MacroAssemblerType::Zero:
    case MacroAssemblerType::NonZero:
        return true;
    default:
        return false;
    }
}

template<typename MacroAssemblerType>
inline typename MacroAssemblerType::TrustedImm32 mask8OnCondition(MacroAssemblerType&, typename MacroAssemblerType::RelationalCondition cond, typename MacroAssemblerType::TrustedImm32 value)
{
    if (isUnsigned<MacroAssemblerType>(cond))
        return typename MacroAssemblerType::TrustedImm32(static_cast<uint8_t>(value.m_value));
    return typename MacroAssemblerType::TrustedImm32(static_cast<int8_t>(value.m_value));
}

template<typename MacroAssemblerType>
inline typename MacroAssemblerType::TrustedImm32 mask8OnCondition(MacroAssemblerType&, typename MacroAssemblerType::ResultCondition cond, typename MacroAssemblerType::TrustedImm32 value)
{
    // If condition is Zero or NonZero, upper bits are unrelated.
    // Since branchTest32 handles -1 in an optimized manner, we keep -1 as is instead of converting it to 255.
    if (cond == MacroAssemblerType::Zero || cond == MacroAssemblerType::NonZero) {
        if (value.m_value == -1)
            return value;
    }
    if (isUnsigned<MacroAssemblerType>(cond))
        return typename MacroAssemblerType::TrustedImm32(static_cast<uint8_t>(value.m_value));
    ASSERT_WITH_MESSAGE(cond != MacroAssemblerType::Overflow, "Overflow is not used for 8bit test operations.");
    ASSERT(isSigned<MacroAssemblerType>(cond));
    return typename MacroAssemblerType::TrustedImm32(static_cast<int8_t>(value.m_value));
}

template<typename MacroAssemblerType>
inline typename MacroAssemblerType::TrustedImm32 mask16OnCondition(MacroAssemblerType&, typename MacroAssemblerType::RelationalCondition cond, typename MacroAssemblerType::TrustedImm32 value)
{
    if (isUnsigned<MacroAssemblerType>(cond))
        return typename MacroAssemblerType::TrustedImm32(static_cast<uint16_t>(value.m_value));
    return typename MacroAssemblerType::TrustedImm32(static_cast<int16_t>(value.m_value));
}

template<typename MacroAssemblerType>
inline typename MacroAssemblerType::TrustedImm32 mask16OnCondition(MacroAssemblerType&, typename MacroAssemblerType::ResultCondition cond, typename MacroAssemblerType::TrustedImm32 value)
{
    // If condition is Zero or NonZero, upper bits are unrelated.
    // Since branchTest32 handles -1 in an optimized manner, we keep -1 as is instead of converting it to 0xffff.
    if (cond == MacroAssemblerType::Zero || cond == MacroAssemblerType::NonZero) {
        if (value.m_value == -1)
            return value;
    }
    if (isUnsigned<MacroAssemblerType>(cond))
        return typename MacroAssemblerType::TrustedImm32(static_cast<uint16_t>(value.m_value));
    ASSERT_WITH_MESSAGE(cond != MacroAssemblerType::Overflow, "Overflow is not used for 16bit test operations.");
    ASSERT(isSigned<MacroAssemblerType>(cond));
    return typename MacroAssemblerType::TrustedImm32(static_cast<int16_t>(value.m_value));
}

template<typename MacroAssemblerType, typename Condition, typename ...Args>
void load8OnCondition(MacroAssemblerType& jit, Condition cond, Args... args)
{
    if (isUnsigned<MacroAssemblerType>(cond))
        return jit.load8(std::forward<Args>(args)...);
    return jit.load8SignedExtendTo32(std::forward<Args>(args)...);
}

template<typename MacroAssemblerType, typename Condition, typename ...Args>
void load16OnCondition(MacroAssemblerType& jit, Condition cond, Args... args)
{
    if (isUnsigned<MacroAssemblerType>(cond))
        return jit.load16(std::forward<Args>(args)...);
    return jit.load16SignedExtendTo32(std::forward<Args>(args)...);
}

} } // namespace JSC
