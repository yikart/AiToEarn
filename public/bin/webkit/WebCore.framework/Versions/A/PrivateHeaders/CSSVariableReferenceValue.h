// Copyright 2015 The Chromium Authors. All rights reserved.
// Copyright (C) 2016-2021 Apple Inc. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#pragma once

#include "CSSValue.h"
#include "CSSValueKeywords.h"
#include "CSSVariableData.h"
#include <wtf/PointerComparison.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CSSParserToken;
class CSSParserTokenRange;
struct CSSParserContext;

namespace Style {
class BuilderState;
}

enum CSSPropertyID : uint16_t;

class CSSVariableReferenceValue final : public CSSValue {
public:
    static Ref<CSSVariableReferenceValue> create(const CSSParserTokenRange&, const CSSParserContext&);
    static Ref<CSSVariableReferenceValue> create(Ref<CSSVariableData>&&);

    bool equals(const CSSVariableReferenceValue&) const;
    String customCSSText() const;

    RefPtr<CSSVariableData> resolveVariableReferences(Style::BuilderState&) const;
    const CSSParserContext& context() const;

    RefPtr<CSSValue> resolveSingleValue(Style::BuilderState&, CSSPropertyID) const;

    // The maximum number of tokens that may be produced by a var() reference or var() fallback value.
    // https://drafts.csswg.org/css-variables/#long-variables
    static constexpr size_t maxSubstitutionTokens = 65536;
    
    const CSSVariableData& data() const { return m_data.get(); }

    template<typename CacheFunction> bool resolveAndCacheValue(Style::BuilderState&, CacheFunction&&) const;

private:
    explicit CSSVariableReferenceValue(Ref<CSSVariableData>&&);

    std::optional<Vector<CSSParserToken>> resolveTokenRange(CSSParserTokenRange, Style::BuilderState&) const;
    bool resolveVariableReference(CSSParserTokenRange, CSSValueID, Vector<CSSParserToken>&, Style::BuilderState&) const;
    enum class FallbackResult : uint8_t { None, Valid, Invalid };
    std::pair<FallbackResult, Vector<CSSParserToken>> resolveVariableFallback(const AtomString& variableName, CSSParserTokenRange, CSSValueID functionId, Style::BuilderState&) const;

    void cacheSimpleReference();
    RefPtr<CSSVariableData> tryResolveSimpleReference(Style::BuilderState&) const;

    Ref<CSSVariableData> m_data;
    mutable String m_stringValue;

    // For quicky resolving simple var(--foo) values.
    struct SimpleReference {
        AtomString name;
        CSSValueID functionId;
    };
    std::optional<SimpleReference> m_simpleReference;

    mutable RefPtr<CSSVariableData> m_cacheDependencyData;
    mutable RefPtr<CSSValue> m_cachedValue;
#if ASSERT_ENABLED
    mutable CSSPropertyID m_cachePropertyID { CSSPropertyInvalid };
#endif
};

template<typename CacheFunction>
bool CSSVariableReferenceValue::resolveAndCacheValue(Style::BuilderState& builderState, CacheFunction&& cacheFunction) const

{
    if (auto data = tryResolveSimpleReference(builderState)) {
        if (!arePointingToEqualData(m_cacheDependencyData, data))
            cacheFunction(data);
        m_cacheDependencyData = WTFMove(data);
        return true;
    }

    auto resolvedTokens = resolveTokenRange(m_data->tokenRange(), builderState);
    if (!resolvedTokens)
        return false;

    if (!m_cacheDependencyData || m_cacheDependencyData->tokens() != *resolvedTokens) {
        m_cacheDependencyData = CSSVariableData::create(*resolvedTokens, context());
        cacheFunction(m_cacheDependencyData);
    }
    return true;
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSVariableReferenceValue, isVariableReferenceValue())
