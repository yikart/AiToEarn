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

#include "CSSNone.h"
#include "StyleValueTypes.h"

namespace WebCore {
namespace Style {

struct None {
    using CSS = WebCore::CSS::None;
    using Raw = WebCore::CSS::NoneRaw;

    constexpr bool operator==(const None&) const = default;
};

template<> struct ToCSSMapping<None> { using type = CSS::None; };
template<> struct ToCSS<None> {
    template<typename... Rest> constexpr auto operator()(const None&, Rest&&...) -> CSS::None { return { }; }
};

template<> struct ToStyleMapping<CSS::None> { using type = None; };
template<> struct ToStyle<CSS::None> {
    template<typename... Rest> constexpr auto operator()(const CSS::None&, Rest&&...) -> None { return { }; }
};

template<> struct Blending<None> {
    constexpr auto canBlend(const None&, const None&) -> bool { return true; }
    constexpr auto blend(const None&, const None&, const BlendingContext&) -> None { return { }; }
};

WTF::TextStream& operator<<(WTF::TextStream&, const None&);

} // namespace Style
} // namespace WebCore
