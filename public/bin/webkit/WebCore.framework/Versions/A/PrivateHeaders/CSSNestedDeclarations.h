/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

namespace WebCore {

class CSSRuleList;
class CSSStyleDeclaration;
class DeclaredStylePropertyMap;
class StylePropertyMap;
class StyleRuleCSSStyleDeclaration;
class StyleRuleNestedDeclarations;

class CSSNestedDeclarations final : public CSSRule, public CanMakeWeakPtr<CSSNestedDeclarations> {
public:
    static Ref<CSSNestedDeclarations> create(StyleRuleNestedDeclarations& rule, CSSStyleSheet* sheet) { return adoptRef(* new CSSNestedDeclarations(rule, sheet)); };

    virtual ~CSSNestedDeclarations();

    WEBCORE_EXPORT CSSStyleDeclaration& style();

private:
    CSSNestedDeclarations(StyleRuleNestedDeclarations&, CSSStyleSheet*);

    String cssText() const final;
    String cssTextInternal(StringBuilder& declarations, StringBuilder& rules) const;

    void reattach(StyleRuleBase&) final;
    StyleRuleType styleRuleType() const final { return StyleRuleType::NestedDeclarations; }

    Ref<StyleRuleNestedDeclarations> m_styleRule;
    RefPtr<StyleRuleCSSStyleDeclaration> m_propertiesCSSOMWrapper;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_RULE(CSSNestedDeclarations, StyleRuleType::NestedDeclarations)
