/*
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
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
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSNoConversionDataRequiredToken.h"
#include "CSSPrimitiveNumericTypes.h"
#include "CSSUnevaluatedCalc.h"

namespace WebCore {
namespace CSS {

// MARK: - Requires Conversion Data

template<typename T> bool requiresConversionData(const PrimitiveNumeric<T>& primitive)
{
    return WTF::switchOn(primitive, [&](const auto& value) { return requiresConversionData(value); });
}

// MARK: - Evaluation

// FIXME: Remove "evaluateCalc" family of functions once color code has moved to the "toStyle" family of functions.

template<RawNumeric T> auto evaluateCalc(const UnevaluatedCalc<T>& calc, NoConversionDataRequiredToken token, const CSSCalcSymbolTable& symbolTable) -> T
{
    return { unevaluatedCalcEvaluate(calc.protectedCalc(), T::category, token, symbolTable) };
}

template<typename T> constexpr auto evaluateCalc(const T& component, NoConversionDataRequiredToken, const CSSCalcSymbolTable&) -> T
{
    return component;
}

template<typename... Ts> auto evaluateCalcIfNoConversionDataRequired(const std::variant<Ts...>& component, const CSSCalcSymbolTable& symbolTable) -> std::variant<Ts...>
{
    return WTF::switchOn(component, [&](const auto& alternative) -> std::variant<Ts...> {
        if (requiresConversionData(alternative))
            return alternative;
        return evaluateCalc(alternative, NoConversionDataRequiredToken { }, symbolTable);
    });
}

template<typename T> auto evaluateCalcIfNoConversionDataRequired(const PrimitiveNumeric<T>& component, const CSSCalcSymbolTable& symbolTable) -> PrimitiveNumeric<T>
{
    return WTF::switchOn(component, [&](const auto& alternative) -> PrimitiveNumeric<T> {
        if (requiresConversionData(alternative))
            return { alternative };
        return { evaluateCalc(alternative, NoConversionDataRequiredToken { }, symbolTable) };
    });
}

template<typename T> decltype(auto) evaluateCalcIfNoConversionDataRequired(const std::optional<T>& component, const CSSCalcSymbolTable& symbolTable)
{
    return component ? std::make_optional(evaluateCalcIfNoConversionDataRequired(*component, symbolTable)) : std::nullopt;
}

// MARK: - Is UnevaluatedCalc

template<typename T> bool isUnevaluatedCalc(const PrimitiveNumeric<T>& primitive)
{
    return WTF::switchOn(primitive, [&](const auto& value) { return isUnevaluatedCalc(value); });
}

// MARK: Simplify

template<typename T> auto simplifyUnevaluatedCalc(const PrimitiveNumeric<T>& primitive, const CSSToLengthConversionData& conversionData, const CSSCalcSymbolTable& symbolTable) -> PrimitiveNumeric<T>
{
    WTF::switchOn(primitive, [&](const auto& value) { return simplifyUnevaluatedCalc(value, conversionData, symbolTable); });
}

} // namespace CSS
} // namespace WebCore
