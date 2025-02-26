/*
 * Copyright (C) 2019 Igalia S.L.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSPrimitiveValue.h"
#include "CSSValueList.h"

namespace WebCore {

// CSSGridIntegerRepeatValue stores the track sizes and line numbers when the
// integer-repeat syntax is used.
//
// Right now the integer-repeat syntax is as follows:
// <track-repeat> = repeat( [ <positive-integer> ],
//                          [ <line-names>? <track-size> ]+ <line-names>? )
// <fixed-repeat> = repeat( [ <positive-integer> ],
//                          [ <line-names>? <fixed-size> ]+ <line-names>? )
class CSSGridIntegerRepeatValue final : public CSSValueContainingVector {
public:
    static Ref<CSSGridIntegerRepeatValue> create(Ref<CSSPrimitiveValue>&& repetitions, CSSValueListBuilder);

    const CSSPrimitiveValue& repetitions() const { return m_repetitions; }

    String customCSSText() const;
    bool equals(const CSSGridIntegerRepeatValue&) const;

    IterationStatus customVisitChildren(const Function<IterationStatus(CSSValue&)>& func) const
    {
        if (CSSValueContainingVector::customVisitChildren(func) == IterationStatus::Done)
            return IterationStatus::Done;
        if (func(m_repetitions.get()) == IterationStatus::Done)
            return IterationStatus::Done;
        return IterationStatus::Continue;
    }

private:
    CSSGridIntegerRepeatValue(Ref<CSSPrimitiveValue>&& repetitions, CSSValueListBuilder);

    Ref<CSSPrimitiveValue> m_repetitions;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSGridIntegerRepeatValue, isGridIntegerRepeatValue());
