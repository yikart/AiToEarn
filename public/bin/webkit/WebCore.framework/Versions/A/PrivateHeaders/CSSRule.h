/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * (C) 2002-2003 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2002-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2011 Andreas Kling (kling@webkit.org)
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

#include "CSSParserEnum.h"
#include "ExceptionOr.h"
#include "StyleRuleType.h"
#include <wtf/TypeCasts.h>

namespace WebCore {

class CSSStyleSheet;
class StyleRuleBase;
class StyleRule;
class StyleRuleWithNesting;

struct CSSParserContext;

class CSSRule : public RefCounted<CSSRule> {
public:
    virtual ~CSSRule() = default;

    WEBCORE_EXPORT unsigned short typeForCSSOM() const;

    virtual StyleRuleType styleRuleType() const = 0;
    virtual bool isGroupingRule() const { return false; }
    virtual String cssText() const = 0;
    virtual String cssTextWithReplacementURLs(const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&) const { return cssText(); }
    virtual void reattach(StyleRuleBase&) = 0;

    void setParentStyleSheet(CSSStyleSheet*);
    void setParentRule(CSSRule*);
    CSSStyleSheet* parentStyleSheet() const;
    CSSRule* parentRule() const { return m_parentIsRule ? m_parentRule : nullptr; }
    bool hasStyleRuleAncestor() const;
    CSSParserEnum::NestedContext nestedContext() const;
    virtual RefPtr<StyleRuleWithNesting> prepareChildStyleRuleForNesting(StyleRule&);
    virtual void getChildStyleSheets(HashSet<RefPtr<CSSStyleSheet>>&) { }

    WEBCORE_EXPORT ExceptionOr<void> setCssText(const String&);

protected:
    explicit CSSRule(CSSStyleSheet*);

    bool hasCachedSelectorText() const { return m_hasCachedSelectorText; }
    void setHasCachedSelectorText(bool hasCachedSelectorText) const { m_hasCachedSelectorText = hasCachedSelectorText; }

    const CSSParserContext& parserContext() const;

private:
    mutable unsigned char m_hasCachedSelectorText : 1;
    unsigned char m_parentIsRule : 1;
    union {
        CSSRule* m_parentRule;
        CSSStyleSheet* m_parentStyleSheet;
    };
};

inline CSSRule::CSSRule(CSSStyleSheet* parent)
    : m_hasCachedSelectorText(false)
    , m_parentIsRule(false)
    , m_parentStyleSheet(parent)
{
}

inline void CSSRule::setParentStyleSheet(CSSStyleSheet* styleSheet)
{
    m_parentIsRule = false;
    m_parentStyleSheet = styleSheet;
}

inline void CSSRule::setParentRule(CSSRule* rule)
{
    m_parentIsRule = true;
    m_parentRule = rule;
}

inline CSSStyleSheet* CSSRule::parentStyleSheet() const
{
    if (m_parentIsRule)
        return m_parentRule ? m_parentRule->parentStyleSheet() : nullptr;
    return m_parentStyleSheet;
}

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CSS_RULE(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::CSSRule& rule) { return rule.styleRuleType() == WebCore::predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
