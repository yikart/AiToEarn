/*
 * Copyright (C) 2008-2021 Apple Inc. All rights reserved.
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
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSValueTypes.h"
#include <wtf/Vector.h>
#include <wtf/text/AtomString.h>

#if ENABLE(DARK_MODE_CSS)

namespace WebCore {
namespace CSS {

// <'color-scheme'> = normal | [ light | dark | <custom-ident> ]+ && only?
// https://drafts.csswg.org/css-color-adjust/#propdef-color-scheme
struct ColorScheme {
    SpaceSeparatedVector<CustomIdentifier> schemes;
    std::optional<Keyword::Only> only;

    // As an optimization, if `schemes` is empty, that indicates the
    // entire value should be considered `normal`.
    bool isNormal() const { return schemes.isEmpty(); }

    bool operator==(const ColorScheme&) const = default;
};

template<> struct Serialize<ColorScheme> { void operator()(StringBuilder&, const ColorScheme&); };

template<size_t I> const auto& get(const ColorScheme& colorScheme)
{
    if constexpr (!I)
        return colorScheme.schemes;
    else if constexpr (I == 1)
        return colorScheme.only;
}

} // namespace CSS
} // namespace WebCore

CSS_TUPLE_LIKE_CONFORMANCE(ColorScheme, 2)

#endif
