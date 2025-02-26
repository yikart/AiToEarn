/*
 * Copyright (C) 2008-2021 Apple Inc. All rights reserved.
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

#include "CSSGradient.h"
#include "StyleImage.h"

namespace WebCore {

namespace Style {
class BuilderState;
}

class CSSGradientValue final : public CSSValue {
public:
    static Ref<CSSGradientValue> create(CSS::Gradient&& gradient)
    {
        return adoptRef(*new CSSGradientValue(WTFMove(gradient)));
    }

    String customCSSText() const;
    bool equals(const CSSGradientValue&) const;
    RefPtr<StyleImage> createStyleImage(const Style::BuilderState&) const;

    IterationStatus customVisitChildren(const Function<IterationStatus(CSSValue&)>&) const;

private:
    CSSGradientValue(CSS::Gradient&& gradient)
        : CSSValue(ClassType::Gradient)
        , m_gradient(WTFMove(gradient))
    {
    }

    CSSGradientValue(const CSSGradientValue& other)
        : CSSValue(ClassType::Gradient)
        , m_gradient(other.m_gradient)
        , m_cachedStyleImage(other.m_cachedStyleImage)
    {
    }

    CSS::Gradient m_gradient;
    mutable RefPtr<StyleImage> m_cachedStyleImage;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSGradientValue, isGradientValue())
