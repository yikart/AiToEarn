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

#include "CSSConditionRule.h"

namespace WebCore {

class MediaList;
class StyleRuleMedia;

namespace MQ {
struct MediaQuery;
using MediaQueryList = Vector<MediaQuery>;
}

class CSSMediaRule final : public CSSConditionRule {
public:
    static Ref<CSSMediaRule> create(StyleRuleMedia& rule, CSSStyleSheet* sheet) { return adoptRef(*new CSSMediaRule(rule, sheet)); }
    virtual ~CSSMediaRule();

    WEBCORE_EXPORT MediaList* media() const;

private:
    friend class MediaList;

    CSSMediaRule(StyleRuleMedia&, CSSStyleSheet*);

    StyleRuleType styleRuleType() const final { return StyleRuleType::Media; }
    String cssText() const final;
    String cssTextWithReplacementURLs(const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&) const final;
    String conditionText() const final;

    const MQ::MediaQueryList& mediaQueries() const;
    void setMediaQueries(MQ::MediaQueryList&&);

    mutable RefPtr<MediaList> m_mediaCSSOMWrapper;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_RULE(CSSMediaRule, StyleRuleType::Media)
