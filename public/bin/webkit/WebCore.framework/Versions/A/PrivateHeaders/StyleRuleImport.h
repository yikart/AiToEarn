/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * (C) 2002-2003 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2002-2022 Apple Inc. All rights reserved.
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

#include "CachedResourceHandle.h"
#include "CachedStyleSheetClient.h"
#include "MediaQuery.h"
#include "StyleRule.h"
#include <wtf/TypeCasts.h>

namespace WebCore {

class CachedCSSStyleSheet;
class StyleSheetContents;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleRuleImport);
class StyleRuleImport final : public StyleRuleBase {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleRuleImport);
public:
    struct SupportsCondition {
        String text;
        bool conditionMatches { true };
    };

    static Ref<StyleRuleImport> create(const String& href, MQ::MediaQueryList&&, std::optional<CascadeLayerName>&&, SupportsCondition&&);
    ~StyleRuleImport();

    Ref<StyleRuleImport> copy() const { RELEASE_ASSERT_NOT_REACHED(); }

    StyleSheetContents* parentStyleSheet() const { return m_parentStyleSheet; }
    void setParentStyleSheet(StyleSheetContents* sheet) { ASSERT(sheet); m_parentStyleSheet = sheet; }
    void clearParentStyleSheet() { m_parentStyleSheet = nullptr; }
    void cancelLoad();

    String href() const { return m_strHref; }
    StyleSheetContents* styleSheet() const { return m_styleSheet.get(); }

    bool isLoading() const;
    
    const MQ::MediaQueryList& mediaQueries() const { return m_mediaQueries; }
    void setMediaQueries(MQ::MediaQueryList&& queries) { m_mediaQueries = WTFMove(queries); }

    void requestStyleSheet();
    const CachedCSSStyleSheet* cachedCSSStyleSheet() const { return m_cachedSheet.get(); }

    const std::optional<CascadeLayerName>& cascadeLayerName() const { return m_cascadeLayerName; }
    const String& supportsText() const { return m_supportsCondition.text; }
    bool supportsMatches() const { return m_supportsCondition.conditionMatches; }

private:
    // NOTE: We put the CachedStyleSheetClient in a member instead of inheriting from it
    // to avoid adding a vptr to StyleRuleImport.
    class ImportedStyleSheetClient final : public CachedStyleSheetClient {
    public:
        ImportedStyleSheetClient(StyleRuleImport* ownerRule) : m_ownerRule(ownerRule) { }
        virtual ~ImportedStyleSheetClient() = default;
        void setCSSStyleSheet(const String& href, const URL& baseURL, ASCIILiteral charset, const CachedCSSStyleSheet* sheet) final
        {
            m_ownerRule->setCSSStyleSheet(href, baseURL, charset, sheet);
        }
    private:
        StyleRuleImport* m_ownerRule;
    };

    void setCSSStyleSheet(const String& href, const URL& baseURL, ASCIILiteral charset, const CachedCSSStyleSheet*);
    friend class ImportedStyleSheetClient;

    StyleRuleImport(const String& href, MQ::MediaQueryList&&, std::optional<CascadeLayerName>&&, SupportsCondition&&);

    StyleSheetContents* m_parentStyleSheet { nullptr };

    ImportedStyleSheetClient m_styleSheetClient;
    String m_strHref;
    MQ::MediaQueryList m_mediaQueries;
    RefPtr<StyleSheetContents> m_styleSheet;
    std::optional<CascadeLayerName> m_cascadeLayerName;
    CachedResourceHandle<CachedCSSStyleSheet> m_cachedSheet;
    bool m_loading { false };
    SupportsCondition m_supportsCondition;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::StyleRuleImport)
    static bool isType(const WebCore::StyleRuleBase& rule) { return rule.isImportRule(); }
SPECIALIZE_TYPE_TRAITS_END()
