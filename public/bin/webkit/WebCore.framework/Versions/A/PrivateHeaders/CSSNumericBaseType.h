/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include <array>
#include <wtf/text/ASCIILiteral.h>

namespace WebCore {

enum class CSSNumericBaseType : uint8_t {
    Length,
    Angle,
    Time,
    Frequency,
    Resolution,
    Flex,
    Percent,
};

constexpr std::array<CSSNumericBaseType, 7> eachBaseType()
{
    return {
        CSSNumericBaseType::Length,
        CSSNumericBaseType::Angle,
        CSSNumericBaseType::Time,
        CSSNumericBaseType::Frequency,
        CSSNumericBaseType::Resolution,
        CSSNumericBaseType::Flex,
        CSSNumericBaseType::Percent
    };
}

constexpr ASCIILiteral debugString(CSSNumericBaseType type)
{
    switch (type) {
    case CSSNumericBaseType::Length:
        return "length"_s;
    case CSSNumericBaseType::Angle:
        return "angle"_s;
    case CSSNumericBaseType::Time:
        return "time"_s;
    case CSSNumericBaseType::Frequency:
        return "frequency"_s;
    case CSSNumericBaseType::Resolution:
        return "resolution"_s;
    case CSSNumericBaseType::Flex:
        return "flex"_s;
    case CSSNumericBaseType::Percent:
        return "percent"_s;
    }
    return "invalid"_s;
}

} // namespace WebCore
