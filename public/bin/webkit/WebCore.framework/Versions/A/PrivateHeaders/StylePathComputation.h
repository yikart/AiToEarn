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

#include "FloatRect.h"
#include "Path.h"
#include "StyleValueTypes.h"

namespace WebCore {
namespace Style {

// All types that want to expose a generated WebCore::Path must specialize PathComputation the following member function:
//
//    template<> struct WebCore::Style::PathComputation<StyleType> {
//        WebCore::Path operator()(const StyleType&, const FloatRect&);
//    };

template<typename StyleType> struct PathComputation;

template<typename StyleType> WebCore::Path path(const StyleType& value, const FloatRect& referenceBox)
{
    return PathComputation<StyleType>{}(value, referenceBox);
}

// Specialization for `FunctionNotation`.
template<CSSValueID Name, typename StyleType> struct PathComputation<FunctionNotation<Name, StyleType>> {
    WebCore::Path operator()(const FunctionNotation<Name, StyleType>& value, const FloatRect& referenceBox)
    {
        return WebCore::Style::path(value.parameters, referenceBox);
    }
};

} // namespace Style
} // namespace WebCore
