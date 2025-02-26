/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#pragma once

#include "CSSColorScheme.h"
#include "RenderStyleConstants.h"
#include "StyleValueTypes.h"
#include <wtf/OptionSet.h>

#if ENABLE(DARK_MODE_CSS)

namespace WebCore {
namespace Style {

struct ColorScheme {
    SpaceSeparatedVector<CustomIdentifier> schemes;
    std::optional<CSS::Keyword::Only> only;

    // As an optimization, if `schemes` is empty, that indicates the
    // entire value should be considered `normal`.
    bool isNormal() const { return schemes.isEmpty(); }

    OptionSet<WebCore::ColorScheme> colorScheme() const;

    bool operator==(const ColorScheme&) const = default;
};

template<size_t I> const auto& get(const ColorScheme& colorScheme)
{
    if constexpr (!I)
        return colorScheme.schemes;
    else if constexpr (I == 1)
        return colorScheme.only;
}

DEFINE_TYPE_MAPPING(CSS::ColorScheme, ColorScheme)

TextStream& operator<<(TextStream&, const ColorScheme&);

} // namespace Style
} // namespace WebCore

STYLE_TUPLE_LIKE_CONFORMANCE(ColorScheme, 2)

#endif
