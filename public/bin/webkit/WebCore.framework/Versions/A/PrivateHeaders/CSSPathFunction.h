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

#include "CSSFillRule.h"
#include "CSSPrimitiveNumericTypes.h"
#include "SVGPathByteStream.h"

namespace WebCore {
namespace CSS {

// <path()> = path( <'fill-rule'>? , <string> )
// https://drafts.csswg.org/css-shapes-1/#funcdef-basic-shape-path
struct Path {
    struct Data {
        SVGPathByteStream byteStream;

        bool operator==(const Data&) const = default;
    };

    std::optional<FillRule> fillRule;
    Data data;

    bool operator==(const Path&) const = default;
};
using PathFunction = FunctionNotation<CSSValuePath, Path>;

template<size_t I> const auto& get(const Path& value)
{
    if constexpr (!I)
        return value.fillRule;
    else if constexpr (I == 1)
        return value.data;
}

template<> struct Serialize<Path> { void operator()(StringBuilder&, const Path&); };

template<> struct ComputedStyleDependenciesCollector<Path::Data> { void operator()(ComputedStyleDependencies&, const Path::Data&); };
template<> struct CSSValueChildrenVisitor<Path::Data> { IterationStatus operator()(const Function<IterationStatus(CSSValue&)>&, const Path::Data&); };

} // namespace CSS
} // namespace WebCore

CSS_TUPLE_LIKE_CONFORMANCE(Path, 2)
