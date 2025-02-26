/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSPrimitiveValue.h"
#include "RenderStyleConstants.h"

namespace WebCore {

// Class containing the value of a view() function, as used in animation-timeline:
// https://drafts.csswg.org/scroll-animations-1/#funcdef-view.
class CSSViewValue final : public CSSValue {
public:
    static Ref<CSSViewValue> create()
    {
        return adoptRef(*new CSSViewValue(nullptr, nullptr, nullptr));
    }

    static Ref<CSSViewValue> create(RefPtr<CSSValue>&& axis, RefPtr<CSSValue>&& startInset, RefPtr<CSSValue>&& endInset)
    {
        return adoptRef(*new CSSViewValue(WTFMove(axis), WTFMove(startInset), WTFMove(endInset)));
    }

    String customCSSText() const;

    const RefPtr<CSSValue>& axis() const { return m_axis; }
    const RefPtr<CSSValue>& startInset() const { return m_startInset; }
    const RefPtr<CSSValue>& endInset() const { return m_endInset; }

    bool equals(const CSSViewValue&) const;

    IterationStatus customVisitChildren(const Function<IterationStatus(CSSValue&)>& func) const
    {
        if (m_axis) {
            if (func(*m_axis) == IterationStatus::Done)
                return IterationStatus::Done;
        }
        if (m_startInset) {
            if (func(*m_startInset) == IterationStatus::Done)
                return IterationStatus::Done;
        }
        if (m_endInset) {
            if (func(*m_endInset) == IterationStatus::Done)
                return IterationStatus::Done;
        }
        return IterationStatus::Continue;
    }


private:
    CSSViewValue(RefPtr<CSSValue>&& axis, RefPtr<CSSValue>&& startInset, RefPtr<CSSValue>&& endInset)
        : CSSValue(ClassType::View)
        , m_axis(WTFMove(axis))
        , m_startInset(WTFMove(startInset))
        , m_endInset(WTFMove(endInset))
    {
    }

    RefPtr<CSSValue> m_axis;
    RefPtr<CSSValue> m_startInset;
    RefPtr<CSSValue> m_endInset;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSViewValue, isViewValue())
