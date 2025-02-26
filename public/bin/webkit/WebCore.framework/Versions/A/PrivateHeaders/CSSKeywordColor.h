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
#include <wtf/Forward.h>

namespace WebCore {

class Color;

enum CSSValueID : uint16_t;
enum class StyleColorOptions : uint8_t;

namespace CSS {

struct PlatformColorResolutionState;

enum class ColorType : uint8_t;

struct KeywordColor {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    CSSValueID valueID;

    bool operator==(const KeywordColor&) const = default;
};

WEBCORE_EXPORT bool isAbsoluteColorKeyword(CSSValueID);
WEBCORE_EXPORT bool isCurrentColorKeyword(CSSValueID);
WEBCORE_EXPORT bool isSystemColorKeyword(CSSValueID);
WEBCORE_EXPORT bool isDeprecatedSystemColorKeyword(CSSValueID);

bool isColorKeyword(CSSValueID);
bool isColorKeyword(CSSValueID, OptionSet<ColorType>);

WebCore::Color colorFromAbsoluteKeyword(CSSValueID);
WebCore::Color colorFromKeyword(CSSValueID, OptionSet<StyleColorOptions>);

WebCore::Color createColor(const KeywordColor&, PlatformColorResolutionState&);
bool containsCurrentColor(const KeywordColor&);
bool containsColorSchemeDependentColor(const KeywordColor&);

template<> struct Serialize<KeywordColor> { void operator()(StringBuilder&, const KeywordColor&); };
template<> struct ComputedStyleDependenciesCollector<KeywordColor> { constexpr void operator()(ComputedStyleDependencies&, const KeywordColor&) { } };
template<> struct CSSValueChildrenVisitor<KeywordColor> { constexpr IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const KeywordColor&) { return IterationStatus::Continue; } };

} // namespace CSS
} // namespace WebCore
