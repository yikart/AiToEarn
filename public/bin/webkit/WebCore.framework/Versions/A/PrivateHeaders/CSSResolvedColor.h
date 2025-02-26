/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "CSSValueTypes.h"
#include "Color.h"
#include <wtf/Forward.h>

namespace WebCore {
namespace CSS {

struct PlatformColorResolutionState;

struct ResolvedColor {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    WebCore::Color value;

    bool operator==(const ResolvedColor&) const = default;
};

inline WebCore::Color createColor(const ResolvedColor& unresolved, PlatformColorResolutionState&)
{
    return unresolved.value;
}

constexpr bool containsColorSchemeDependentColor(const ResolvedColor&)
{
    return false;
}

constexpr bool containsCurrentColor(const ResolvedColor&)
{
    return false;
}

template<> struct Serialize<ResolvedColor> { void operator()(StringBuilder&, const ResolvedColor&); };
template<> struct ComputedStyleDependenciesCollector<ResolvedColor> { constexpr void operator()(ComputedStyleDependencies&, const ResolvedColor&) { } };
template<> struct CSSValueChildrenVisitor<ResolvedColor> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const ResolvedColor&) { return IterationStatus::Continue; } };

} // namespace CSS
} // namespace WebCore
