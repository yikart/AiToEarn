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

#include "CSSValueTypes.h"

namespace WebCore {
namespace CSS {

struct SymbolRaw {
    CSSValueID value;

    constexpr bool operator==(const SymbolRaw&) const = default;
};

struct Symbol {
    using Raw = SymbolRaw;

    CSSValueID value;

    constexpr Symbol(SymbolRaw&& value)
        : value { value.value }
    {
    }

    constexpr Symbol(const SymbolRaw& value)
        : value { value.value }
    {
    }

    constexpr bool operator==(const Symbol&) const = default;
};

template<typename T> struct IsSymbol : public std::integral_constant<bool, std::is_same_v<T, Symbol>> { };

template<> struct Serialize<SymbolRaw> { void operator()(StringBuilder&, const SymbolRaw&); };
template<> struct Serialize<Symbol> { void operator()(StringBuilder&, const Symbol&); };

template<> struct ComputedStyleDependenciesCollector<SymbolRaw> { constexpr void operator()(ComputedStyleDependencies&, const SymbolRaw&) { } };
template<> struct ComputedStyleDependenciesCollector<Symbol> { constexpr void operator()(ComputedStyleDependencies&, const Symbol&) { } };

template<> struct CSSValueChildrenVisitor<SymbolRaw> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const SymbolRaw&) { return IterationStatus::Continue; } };
template<> struct CSSValueChildrenVisitor<Symbol> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const Symbol&) { return IterationStatus::Continue; } };

} // namespace CSS
} // namespace WebCore
