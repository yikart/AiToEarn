/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * (C) 2002-2003 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2002-2020 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Samuel Weinig (sam@webkit.org)
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
#include <memory>
#include <wtf/Vector.h>

namespace WebCore {

class CSSRuleList;
class StyleRuleGroup;

class CSSGroupingRule : public CSSRule {
public:
    virtual ~CSSGroupingRule();

    WEBCORE_EXPORT CSSRuleList& cssRules() const;
    WEBCORE_EXPORT ExceptionOr<unsigned> insertRule(const String& rule, unsigned index);
    WEBCORE_EXPORT ExceptionOr<void> deleteRule(unsigned index);
    unsigned length() const;
    CSSRule* item(unsigned index) const;

protected:
    CSSGroupingRule(StyleRuleGroup&, CSSStyleSheet* parent);
    const StyleRuleGroup& groupRule() const { return m_groupRule; }
    StyleRuleGroup& groupRule() { return m_groupRule; }
    void reattach(StyleRuleBase&) override;
    void appendCSSTextForItems(StringBuilder&) const;
    void appendCSSTextWithReplacementURLsForItems(StringBuilder&, const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&) const;
    RefPtr<StyleRuleWithNesting> prepareChildStyleRuleForNesting(StyleRule&) override;

private:
    bool isGroupingRule() const final { return true; }
    void appendCSSTextForItemsInternal(StringBuilder&, StringBuilder&) const;
    void cssTextForRules(StringBuilder&) const;
    void cssTextForRulesWithReplacementURLs(StringBuilder&, const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&) const;

    Ref<StyleRuleGroup> m_groupRule;
    mutable Vector<RefPtr<CSSRule>> m_childRuleCSSOMWrappers;
    mutable std::unique_ptr<CSSRuleList> m_ruleListCSSOMWrapper;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::CSSGroupingRule)
    static bool isType(const WebCore::CSSRule& rule) { return rule.isGroupingRule(); }
SPECIALIZE_TYPE_TRAITS_END()
