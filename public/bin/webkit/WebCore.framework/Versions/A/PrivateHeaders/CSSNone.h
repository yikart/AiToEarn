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

struct NoneRaw {
    constexpr bool operator==(const NoneRaw&) const = default;
};

struct None {
    using Raw = NoneRaw;

    constexpr None() = default;
    constexpr None(NoneRaw&&) { }
    constexpr None(const NoneRaw&) { }

    constexpr bool operator==(const None&) const = default;
};

template<> struct Serialize<NoneRaw> { void operator()(StringBuilder&, const NoneRaw&); };
template<> struct Serialize<None> { void operator()(StringBuilder&, const None&); };

template<> struct ComputedStyleDependenciesCollector<NoneRaw> { constexpr void operator()(ComputedStyleDependencies&, const NoneRaw&) { } };
template<> struct ComputedStyleDependenciesCollector<None> { constexpr void operator()(ComputedStyleDependencies&, const None&) { } };

template<> struct CSSValueChildrenVisitor<NoneRaw> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const NoneRaw&) { return IterationStatus::Continue; } };
template<> struct CSSValueChildrenVisitor<None> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const None&) { return IterationStatus::Continue; } };

} // namespace CSS
} // namespace WebCore
