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

namespace WebCore {

class MediaList;
class StyleRuleImport;

namespace MQ {
struct MediaQuery;
using MediaQueryList = Vector<MediaQuery>;
}

class CSSImportRule final : public CSSRule, public CanMakeWeakPtr<CSSImportRule> {
public:
    static Ref<CSSImportRule> create(StyleRuleImport& rule, CSSStyleSheet* sheet) { return adoptRef(*new CSSImportRule(rule, sheet)); }

    virtual ~CSSImportRule();

    WEBCORE_EXPORT String href() const;
    WEBCORE_EXPORT MediaList& media() const;
    WEBCORE_EXPORT CSSStyleSheet* styleSheet() const;
    RefPtr<CSSStyleSheet> protectedStyleSheet() const;
    String layerName() const;
    String supportsText() const;

private:
    friend class MediaList;

    CSSImportRule(StyleRuleImport&, CSSStyleSheet*);

    StyleRuleType styleRuleType() const final { return StyleRuleType::Import; }
    String cssText() const final;
    String cssTextWithReplacementURLs(const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&) const final;
    void reattach(StyleRuleBase&) final;
    void getChildStyleSheets(HashSet<RefPtr<CSSStyleSheet>>&) final;

    String cssTextInternal(const String& urlString) const;
    const MQ::MediaQueryList& mediaQueries() const;
    void setMediaQueries(MQ::MediaQueryList&&);

    Ref<StyleRuleImport> m_importRule;
    mutable RefPtr<MediaList> m_mediaCSSOMWrapper;
    mutable RefPtr<CSSStyleSheet> m_styleSheetCSSOMWrapper;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_RULE(CSSImportRule, StyleRuleType::Import)
