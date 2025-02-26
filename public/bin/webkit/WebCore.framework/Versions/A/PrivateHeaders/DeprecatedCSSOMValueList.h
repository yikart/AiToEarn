/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "CSSValueList.h"
#include "DeprecatedCSSOMValue.h"

namespace WebCore {
    
class DeprecatedCSSOMValueList : public DeprecatedCSSOMValue {
public:
    static Ref<DeprecatedCSSOMValueList> create(Vector<Ref<DeprecatedCSSOMValue>, 4> values, CSSValue::ValueSeparator separator, CSSStyleDeclaration& owner)
    {
        return adoptRef(*new DeprecatedCSSOMValueList(WTFMove(values), separator, owner));
    }

    static Ref<DeprecatedCSSOMValueList> create(const CSSValueContainingVector& values, CSSStyleDeclaration& owner)
    {
        return adoptRef(*new DeprecatedCSSOMValueList(values, owner));
    }

    String cssText() const;

    size_t length() const { return m_values.size(); }
    DeprecatedCSSOMValue* item(size_t index) { return index < m_values.size() ? m_values[index].ptr() : nullptr; }
    bool isSupportedPropertyIndex(unsigned index) const { return index < m_values.size(); }

private:
    DeprecatedCSSOMValueList(Vector<Ref<DeprecatedCSSOMValue>, 4> values, CSSValue::ValueSeparator separator, CSSStyleDeclaration& owner)
        : DeprecatedCSSOMValue(ClassType::List, owner)
        , m_values { WTFMove(values) }
    {
        m_valueSeparator = separator;
    }

    DeprecatedCSSOMValueList(const CSSValueContainingVector& values, CSSStyleDeclaration& owner)
        : DeprecatedCSSOMValue(ClassType::List, owner)
        , m_values(WTF::map(values, [&](auto& value) { return value.createDeprecatedCSSOMWrapper(owner); }))
    {
        m_valueSeparator = values.separator();
    }

    Vector<Ref<DeprecatedCSSOMValue>, 4> m_values;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSSOM_VALUE(DeprecatedCSSOMValueList, isValueList())
