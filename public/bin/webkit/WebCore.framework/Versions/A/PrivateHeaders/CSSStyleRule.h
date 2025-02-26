/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * (C) 2002-2003 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2002, 2006, 2008, 2012 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "CSSRule.h"
#include <wtf/WeakPtr.h>

namespace WebCore {

class CSSRuleList;
class CSSStyleDeclaration;
class DeclaredStylePropertyMap;
class StylePropertyMap;
class StyleRuleCSSStyleDeclaration;
class StyleRule;
class StyleRuleWithNesting;
class StyleRuleCSSStyleDeclaration;

class CSSStyleRule final : public CSSRule, public CanMakeWeakPtr<CSSStyleRule> {
public:
    static Ref<CSSStyleRule> create(StyleRule& rule, CSSStyleSheet* sheet) { return adoptRef(*new CSSStyleRule(rule, sheet)); }
    static Ref<CSSStyleRule> create(StyleRuleWithNesting& rule, CSSStyleSheet* sheet) { return adoptRef(* new CSSStyleRule(rule, sheet)); };

    virtual ~CSSStyleRule();

    WEBCORE_EXPORT String selectorText() const;
    WEBCORE_EXPORT void setSelectorText(const String&);

    WEBCORE_EXPORT CSSStyleDeclaration& style();

    // FIXME: Not CSSOM. Remove.
    StyleRule& styleRule() const { return m_styleRule.get(); }

    WEBCORE_EXPORT CSSRuleList& cssRules() const;
    WEBCORE_EXPORT ExceptionOr<unsigned> insertRule(const String& rule, unsigned index);
    WEBCORE_EXPORT ExceptionOr<void> deleteRule(unsigned index);
    unsigned length() const;
    CSSRule* item(unsigned index) const;

    StylePropertyMap& styleMap();

private:
    CSSStyleRule(StyleRule&, CSSStyleSheet*);
    CSSStyleRule(StyleRuleWithNesting&, CSSStyleSheet*);

    StyleRuleType styleRuleType() const final { return StyleRuleType::Style; }
    String cssText() const final;
    String cssTextWithReplacementURLs(const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&) const final;
    String cssTextInternal(StringBuilder& declarations, StringBuilder& rules) const;
    void reattach(StyleRuleBase&) final;
    void getChildStyleSheets(HashSet<RefPtr<CSSStyleSheet>>&) final;

    String generateSelectorText() const;
    Vector<Ref<StyleRuleBase>> nestedRules() const;
    void cssTextForRules(StringBuilder& rules) const;
    void cssTextForRulesWithReplacementURLs(StringBuilder& rules, const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&) const;

    Ref<StyleRule> m_styleRule;
    Ref<DeclaredStylePropertyMap> m_styleMap;
    RefPtr<StyleRuleCSSStyleDeclaration> m_propertiesCSSOMWrapper;

    mutable Vector<RefPtr<CSSRule>> m_childRuleCSSOMWrappers;
    mutable std::unique_ptr<CSSRuleList> m_ruleListCSSOMWrapper;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_RULE(CSSStyleRule, StyleRuleType::Style)
