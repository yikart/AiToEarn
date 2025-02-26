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
#include "ColorTypes.h"

namespace WebCore {
namespace CSS {

struct PlatformColorResolutionState;

struct HexColor {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    SRGBA<uint8_t> value;

    bool operator==(const HexColor&) const = default;
};

inline WebCore::Color createColor(const HexColor& unresolved, PlatformColorResolutionState&)
{
    return WebCore::Color { unresolved.value };
}

constexpr bool containsCurrentColor(const HexColor&)
{
    return false;
}

constexpr bool containsColorSchemeDependentColor(const HexColor&)
{
    return false;
}

template<> struct Serialize<HexColor> { void operator()(StringBuilder&, const HexColor&); };
template<> struct ComputedStyleDependenciesCollector<HexColor> { constexpr void operator()(ComputedStyleDependencies&, const HexColor&) { } };
template<> struct CSSValueChildrenVisitor<HexColor> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const HexColor&) { return IterationStatus::Continue; } };

} // namespace CSS
} // namespace WebCore
