/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2022 Apple Inc. All rights reserved.
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

#include "CSSRuleList.h"
#include "CommonAtomStrings.h"
#include "ExceptionOr.h"
#include "MediaList.h"
#include "MediaQuery.h"
#include "StyleSheet.h"
#include <memory>
#include <variant>
#include <wtf/CheckedPtr.h>
#include <wtf/Noncopyable.h>
#include <wtf/TypeCasts.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/AtomStringHash.h>
#include <wtf/text/TextPosition.h>

namespace WebCore {

class CSSImportRule;
class CSSParser;
class CSSRule;
class CSSStyleSheet;
class CachedCSSStyleSheet;
class ContainerNode;
class DeferredPromise;
class Document;
class Element;
class WeakPtrImplWithEventTargetData;
class StyleRule;
class StyleRuleBase;
class StyleRuleKeyframes;
class StyleRuleWithNesting;
class StyleSheetContents;

namespace Style {
class Scope;
}

class CSSStyleSheet final : public StyleSheet, public CanMakeSingleThreadWeakPtr<CSSStyleSheet> {
public:
    struct Init {
        String baseURL;
        std::variant<RefPtr<MediaList>, String> media { emptyString() };
        bool disabled { false };
    };
    static Ref<CSSStyleSheet> create(Ref<StyleSheetContents>&&, CSSImportRule* ownerRule = 0);
    static Ref<CSSStyleSheet> create(Ref<StyleSheetContents>&&, Node& ownerNode, const std::optional<bool>& isOriginClean = std::nullopt);
    static Ref<CSSStyleSheet> createInline(Ref<StyleSheetContents>&&, Element& owner, const TextPosition& startPosition);
    static ExceptionOr<Ref<CSSStyleSheet>> create(Document&, Init&&);

    virtual ~CSSStyleSheet();

    CSSStyleSheet* parentStyleSheet() const final;
    Node* ownerNode() const final;
    MediaList* media() const final;
    String href() const final;
    String title() const final { return !m_title.isEmpty() ? m_title : String(); }
    bool disabled() const final { return m_isDisabled; }
    void setDisabled(bool) final;

    WEBCORE_EXPORT RefPtr<CSSRuleList> cssRules();
    ExceptionOr<Ref<CSSRuleList>> cssRulesForBindings();
    ExceptionOr<Ref<CSSRuleList>> rules() { return this->cssRulesForBindings(); }

    WEBCORE_EXPORT ExceptionOr<unsigned> insertRule(const String& rule, unsigned index);
    WEBCORE_EXPORT ExceptionOr<void> deleteRule(unsigned index);

    WEBCORE_EXPORT ExceptionOr<int> addRule(const String& selector, const String& style, std::optional<unsigned> index);
    ExceptionOr<void> removeRule(unsigned index) { return deleteRule(index); }

    void replace(String&&, Ref<DeferredPromise>&&);
    ExceptionOr<void> replaceSync(String&&);

    bool wasConstructedByJS() const { return m_wasConstructedByJS; }
    Document* constructorDocument() const;

    // For CSSRuleList.
    unsigned length() const;
    CSSRule* item(unsigned index);

    void clearOwnerNode() final;
    WEBCORE_EXPORT CSSImportRule* ownerRule() const final;
    URL baseURL() const final;
    bool isLoading() const final;

    void clearOwnerRule() { m_ownerRule = nullptr; }

    void removeAdoptingTreeScope(ContainerNode&);
    void addAdoptingTreeScope(ContainerNode&);

    Document* ownerDocument() const;
    CSSStyleSheet& rootStyleSheet();
    const CSSStyleSheet& rootStyleSheet() const;
    Style::Scope* styleScope();

    const MQ::MediaQueryList& mediaQueries() const { return m_mediaQueries; }
    void setMediaQueries(MQ::MediaQueryList&&);
    void setTitle(const String& title) { m_title = title; }

    bool hadRulesMutation() const { return m_mutatedRules; }
    void clearHadRulesMutation() { m_mutatedRules = false; }
    RefPtr<StyleRuleWithNesting> prepareChildStyleRuleForNesting(StyleRule&);

    enum RuleMutationType { OtherMutation, RuleInsertion, KeyframesRuleMutation, RuleReplace };
    enum class ContentsClonedForMutation : bool { No, Yes };

    class RuleMutationScope {
        WTF_MAKE_NONCOPYABLE(RuleMutationScope);
    public:
        RuleMutationScope(CSSStyleSheet*, RuleMutationType = OtherMutation, StyleRuleKeyframes* insertedKeyframesRule = nullptr);
        RuleMutationScope(CSSRule*);
        ~RuleMutationScope();

    private:
        CSSStyleSheet* m_styleSheet;
        RuleMutationType m_mutationType;
        ContentsClonedForMutation m_contentsClonedForMutation;
        RefPtr<StyleRuleKeyframes> m_insertedKeyframesRule;
        String m_modifiedKeyframesRuleName;
    };

    ContentsClonedForMutation willMutateRules();
    void didMutateRules(RuleMutationType, ContentsClonedForMutation, StyleRuleKeyframes* insertedKeyframesRule, const String& modifiedKeyframesRuleName);
    void didMutateRuleFromCSSStyleDeclaration();
    void didMutate();
    
    void clearChildRuleCSSOMWrappers();
    void reattachChildRuleCSSOMWrappers();

    StyleSheetContents& contents() { return m_contents; }
    Ref<StyleSheetContents> protectedContents();

    bool isInline() const { return m_isInlineStylesheet; }
    TextPosition startPosition() const { return m_startPosition; }

    void detachFromDocument() { clearOwnerNode(); }

    bool canAccessRules() const;

    String debugDescription() const final;
    String cssTextWithReplacementURLs(const UncheckedKeyHashMap<String, String>&, const UncheckedKeyHashMap<RefPtr<CSSStyleSheet>, String>&);
    void getChildStyleSheets(HashSet<RefPtr<CSSStyleSheet>>&);

    bool isDetached() const;

private:
    CSSStyleSheet(Ref<StyleSheetContents>&&, CSSImportRule* ownerRule);
    CSSStyleSheet(Ref<StyleSheetContents>&&, Node* ownerNode, const TextPosition& startPosition, bool isInlineStylesheet);
    CSSStyleSheet(Ref<StyleSheetContents>&&, Node& ownerNode, const TextPosition& startPosition, bool isInlineStylesheet, const std::optional<bool>&);
    CSSStyleSheet(Ref<StyleSheetContents>&&, Document&, Init&&);

    void forEachStyleScope(const Function<void(Style::Scope&)>&);

    bool isCSSStyleSheet() const final { return true; }
    String type() const final { return cssContentTypeAtom(); }
    RefPtr<CSSRuleList> cssRulesSkippingAccessCheck();

    Ref<StyleSheetContents> m_contents;
    bool m_isInlineStylesheet { false };
    bool m_isDisabled { false };
    bool m_mutatedRules { false };
    bool m_wasConstructedByJS { false }; // constructed flag in the spec.
    std::optional<bool> m_isOriginClean;
    String m_title;
    MQ::MediaQueryList m_mediaQueries;
    WeakPtr<Style::Scope> m_styleScope;
    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_constructorDocument;
    WeakHashSet<ContainerNode, WeakPtrImplWithEventTargetData> m_adoptingTreeScopes;

    WeakPtr<Node, WeakPtrImplWithEventTargetData> m_ownerNode;
    WeakPtr<CSSImportRule> m_ownerRule;

    TextPosition m_startPosition;

    mutable RefPtr<MediaList> m_mediaCSSOMWrapper;
    mutable Vector<RefPtr<CSSRule>> m_childRuleCSSOMWrappers;
    mutable std::unique_ptr<CSSRuleList> m_ruleListCSSOMWrapper;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::CSSStyleSheet)
    static bool isType(const WebCore::StyleSheet& styleSheet) { return styleSheet.isCSSStyleSheet(); }
SPECIALIZE_TYPE_TRAITS_END()
