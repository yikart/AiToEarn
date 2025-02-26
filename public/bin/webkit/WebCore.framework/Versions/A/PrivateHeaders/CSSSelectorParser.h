// Copyright 2014 The Chromium Authors. All rights reserved.
// Copyright (C) 2016-2020 Apple Inc. All rights reserved.
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

#include "CSSParserContext.h"
#include "CSSParserEnum.h"
#include "CSSParserTokenRange.h"
#include "CSSSelectorList.h"
#include "CSSSelectorParserContext.h"
#include "MutableCSSSelector.h"
#include "StyleSheetContents.h"

namespace WebCore {

class CSSParserTokenRange;
class CSSSelectorList;
class StyleSheetContents;
class StyleRule;

namespace Style {

struct PseudoElementIdentifier;

}

class CSSSelectorParser {
public:
    CSSSelectorParser(const CSSSelectorParserContext&, StyleSheetContents*, CSSParserEnum::NestedContext = { });

    MutableCSSSelectorList consumeComplexSelectorList(CSSParserTokenRange&);
    MutableCSSSelectorList consumeNestedSelectorList(CSSParserTokenRange&);
    MutableCSSSelectorList consumeComplexForgivingSelectorList(CSSParserTokenRange&);
    MutableCSSSelectorList consumeNestedComplexForgivingSelectorList(CSSParserTokenRange&);

    static bool supportsComplexSelector(CSSParserTokenRange, const CSSSelectorParserContext&);
    static CSSSelectorList resolveNestingParent(const CSSSelectorList& nestedSelectorList, const CSSSelectorList* parentResolvedSelectorList);
    static std::pair<bool, std::optional<Style::PseudoElementIdentifier>> parsePseudoElement(const String&, const CSSSelectorParserContext&);

private:
    template<typename ConsumeSelector> MutableCSSSelectorList consumeSelectorList(CSSParserTokenRange&, ConsumeSelector&&);
    template<typename ConsumeSelector> MutableCSSSelectorList consumeForgivingSelectorList(CSSParserTokenRange&, ConsumeSelector&&);

    MutableCSSSelectorList consumeCompoundSelectorList(CSSParserTokenRange&);
    MutableCSSSelectorList consumeRelativeSelectorList(CSSParserTokenRange&);

    std::unique_ptr<MutableCSSSelector> consumeComplexSelector(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumeNestedComplexSelector(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumeCompoundSelector(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumeRelativeScopeSelector(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumeRelativeNestedSelector(CSSParserTokenRange&);

    // This doesn't include element names, since they're handled specially.
    std::unique_ptr<MutableCSSSelector> consumeSimpleSelector(CSSParserTokenRange&);

    bool consumeName(CSSParserTokenRange&, AtomString& name, AtomString& namespacePrefix);

    // These will return nullptr when the selector is invalid.
    std::unique_ptr<MutableCSSSelector> consumeId(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumeClass(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumePseudo(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumeAttribute(CSSParserTokenRange&);
    std::unique_ptr<MutableCSSSelector> consumeNesting(CSSParserTokenRange&);

    CSSSelector::Relation consumeCombinator(CSSParserTokenRange&);
    CSSSelector::Match consumeAttributeMatch(CSSParserTokenRange&);
    CSSSelector::AttributeMatchType consumeAttributeFlags(CSSParserTokenRange&);

    const AtomString& defaultNamespace() const;
    const AtomString& determineNamespace(const AtomString& prefix);
    void prependTypeSelectorIfNeeded(const AtomString& namespacePrefix, const AtomString& elementName, MutableCSSSelector&);
    static std::unique_ptr<MutableCSSSelector> splitCompoundAtImplicitShadowCrossingCombinator(std::unique_ptr<MutableCSSSelector> compoundSelector, const CSSSelectorParserContext&);
    static bool containsUnknownWebKitPseudoElements(const CSSSelector& complexSelector);

    class DisallowPseudoElementsScope;

    const CSSSelectorParserContext m_context;
    const RefPtr<StyleSheetContents> m_styleSheet;
    CSSParserEnum::NestedContext m_nestedContext;

    // FIXME: This m_failedParsing is ugly and confusing, we should look into removing it (the return value of each function already convey this information).
    bool m_failedParsing { false };

    bool m_disallowPseudoElements { false };
    bool m_disallowHasPseudoClass { false };
    bool m_resistDefaultNamespace { false };
    bool m_ignoreDefaultNamespace { false };
    bool m_disableForgivingParsing { false };
    std::optional<CSSSelector::PseudoElement> m_precedingPseudoElement;
};

std::optional<CSSSelectorList> parseCSSSelectorList(CSSParserTokenRange, const CSSSelectorParserContext&, StyleSheetContents* = nullptr, CSSParserEnum::NestedContext = { });

MutableCSSSelectorList parseMutableCSSSelectorList(CSSParserTokenRange&, const CSSSelectorParserContext&, StyleSheetContents*, CSSParserEnum::NestedContext, CSSParserEnum::IsForgiving);

} // namespace WebCore
