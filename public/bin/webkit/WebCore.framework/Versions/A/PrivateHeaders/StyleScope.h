/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 *           (C) 2006 Alexey Proskuryakov (ap@webkit.org)
 * Copyright (C) 2004-2010, 2012-2013, 2015-2017 Apple Inc. All rights reserved.
 * Copyright (C) 2008, 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 * Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies)
 * Copyright (C) 2011 Google Inc. All rights reserved.
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
 *
 */

#pragma once

#include "AnchorPositionEvaluator.h"
#include "LayoutSize.h"
#include "StyleScopeOrdinal.h"
#include "Timer.h"
#include <memory>
#include <wtf/CheckedPtr.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/ListHashSet.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashMap.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakListHashSet.h>
#include <wtf/text/AtomStringHash.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CSSCounterStyleRegistry;
class CSSStyleSheet;
class Document;
class Element;
class WeakPtrImplWithEventTargetData;
class HTMLSlotElement;
class Node;
class ProcessingInstruction;
class StyleSheet;
class StyleSheetContents;
class StyleSheetList;
class ShadowRoot;
class TreeScope;

namespace Style {

class CustomPropertyRegistry;
class Resolver;
class RuleSet;
struct MatchResult;

class Scope final : public CanMakeWeakPtr<Scope>, public CanMakeCheckedPtr<Scope> {
    WTF_MAKE_TZONE_ALLOCATED(Scope);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(Scope);
public:
    explicit Scope(Document&);
    explicit Scope(ShadowRoot&);

    ~Scope();

    const Vector<RefPtr<CSSStyleSheet>>& activeStyleSheets() const { return m_activeStyleSheets; }

    const Vector<RefPtr<StyleSheet>>& styleSheetsForStyleSheetList();
    const Vector<RefPtr<CSSStyleSheet>> activeStyleSheetsForInspector();

    void addStyleSheetCandidateNode(Node&, bool createdByParser);
    void removeStyleSheetCandidateNode(Node&);

    String preferredStylesheetSetName() const { return m_preferredStylesheetSetName; }
    void setPreferredStylesheetSetName(const String&);

    void addPendingSheet(const Element&);
    void removePendingSheet(const Element&);
    void addPendingSheet(const ProcessingInstruction&);
    void removePendingSheet(const ProcessingInstruction&);
    bool hasPendingSheets() const;
    bool hasPendingSheetsBeforeBody() const;
    bool hasPendingSheetsInBody() const;
    bool hasPendingSheet(const Element&) const;
    bool hasPendingSheetInBody(const Element&) const;
    bool hasPendingSheet(const ProcessingInstruction&) const;

    bool usesStyleBasedEditability() const { return m_usesStyleBasedEditability; }
    bool usesHasPseudoClass() const { return m_usesHasPseudoClass; }

    bool activeStyleSheetsContains(const CSSStyleSheet&) const;

    void evaluateMediaQueriesForViewportChange();
    void evaluateMediaQueriesForAccessibilitySettingsChange();
    void evaluateMediaQueriesForAppearanceChange();

    // This is called when some stylesheet becomes newly enabled or disabled.
    void didChangeActiveStyleSheetCandidates();
    // This is called when contents of a stylesheet is mutated.
    void didChangeStyleSheetContents();
    // This is called when the environment where we intrepret the stylesheets changes (for example switching to printing).
    // The change is assumed to potentially affect all author and user stylesheets including shadow roots.
    WEBCORE_EXPORT void didChangeStyleSheetEnvironment();

    void didChangeViewportSize();

    void invalidateMatchedDeclarationsCache();

    bool hasPendingUpdate() const { return m_pendingUpdate || m_hasDescendantWithPendingUpdate; }
    void flushPendingUpdate();

#if ENABLE(XSLT)
    Vector<Ref<ProcessingInstruction>> collectXSLTransforms();
#endif

    WEBCORE_EXPORT Resolver& resolver();
    Resolver* resolverIfExists() { return m_resolver.get(); }
    void clearResolver();
    void releaseMemory();

    void clearViewTransitionStyles();

    const MatchResult* cachedMatchResult(const Element&);
    void updateCachedMatchResult(const Element&, const MatchResult&);

    const Document& document() const { return m_document; }
    Document& document() { return m_document; }
    const ShadowRoot* shadowRoot() const { return m_shadowRoot; }
    ShadowRoot* shadowRoot() { return m_shadowRoot; }

    static Scope& forNode(Node&);
    static const Scope& forNode(const Node&);
    static Scope* forOrdinal(Element&, ScopeOrdinal);

    struct QueryContainerUpdateContext {
        HashSet<CheckedRef<Element>> invalidatedContainers;
    };
    bool updateQueryContainerState(QueryContainerUpdateContext&);

    const CustomPropertyRegistry& customPropertyRegistry() const { return m_customPropertyRegistry.get(); }
    CustomPropertyRegistry& customPropertyRegistry() { return m_customPropertyRegistry.get(); }
    const CSSCounterStyleRegistry& counterStyleRegistry() const { return m_counterStyleRegistry.get(); }
    CSSCounterStyleRegistry& counterStyleRegistry() { return m_counterStyleRegistry.get(); }

    AnchorPositionedStates& anchorPositionedStates() { return m_anchorPositionedStates; }
    const AnchorPositionedStates& anchorPositionedStates() const { return m_anchorPositionedStates; }
    void clearAnchorPositioningState();

private:
    Scope& documentScope();
    bool isForUserAgentShadowTree() const;

    void didRemovePendingStylesheet();

    enum class UpdateType : uint8_t { ActiveSet, ContentsOrInterpretation };
    void updateActiveStyleSheets(UpdateType);
    void scheduleUpdate(UpdateType);

    using ResolverScopes = UncheckedKeyHashMap<Ref<Resolver>, Vector<WeakPtr<Scope>>>;
    ResolverScopes collectResolverScopes();
    template <typename TestFunction> void evaluateMediaQueries(TestFunction&&);

    WEBCORE_EXPORT void flushPendingSelfUpdate();
    WEBCORE_EXPORT void flushPendingDescendantUpdates();

    struct ActiveStyleSheetCollection {
        Vector<RefPtr<StyleSheet>> activeStyleSheets;
        Vector<RefPtr<StyleSheet>> styleSheetsForStyleSheetList;
    };

    ActiveStyleSheetCollection collectActiveStyleSheets();

    enum class ResolverUpdateType {
        Reconstruct,
        Reset,
        Additive
    };
    struct StyleSheetChange {
        ResolverUpdateType resolverUpdateType;
        Vector<Ref<StyleSheetContents>> addedSheets { };
    };
    StyleSheetChange analyzeStyleSheetChange(const Vector<RefPtr<CSSStyleSheet>>& newStylesheets);
    void invalidateStyleAfterStyleSheetChange(const StyleSheetChange&);

    void updateResolver(Vector<RefPtr<CSSStyleSheet>>&, ResolverUpdateType);
    void createDocumentResolver();
    void createOrFindSharedShadowTreeResolver();
    void unshareShadowTreeResolverBeforeMutation();

    using ResolverSharingKey = std::tuple<Vector<RefPtr<StyleSheetContents>>, bool, bool>;
    ResolverSharingKey makeResolverSharingKey();

    void pendingUpdateTimerFired();
    void clearPendingUpdate();

    TreeScope& treeScope();

    using MediaQueryViewportState = std::tuple<IntSize, float, bool>;
    static MediaQueryViewportState mediaQueryViewportStateForDocument(const Document&);

    CheckedRef<Document> m_document;
    ShadowRoot* m_shadowRoot { nullptr };

    RefPtr<Resolver> m_resolver;

    Vector<RefPtr<StyleSheet>> m_styleSheetsForStyleSheetList;
    Vector<RefPtr<CSSStyleSheet>> m_activeStyleSheets;

    mutable RefPtr<RuleSet> m_dynamicViewTransitionsStyle;

    Timer m_pendingUpdateTimer;

    mutable HashSet<SingleThreadWeakRef<const CSSStyleSheet>> m_weakCopyOfActiveStyleSheetListForFastLookup;

    // Track the currently loading top-level stylesheets needed for rendering.
    // Sheets loaded using the @import directive are not included in this count.
    // We use this count of pending sheets to detect when we can begin attaching
    // elements and when it is safe to execute scripts.
    WeakHashSet<const ProcessingInstruction, WeakPtrImplWithEventTargetData> m_processingInstructionsWithPendingSheets;
    WeakHashSet<const Element, WeakPtrImplWithEventTargetData> m_elementsInHeadWithPendingSheets;
    WeakHashSet<const Element, WeakPtrImplWithEventTargetData> m_elementsInBodyWithPendingSheets;

    WeakListHashSet<Node, WeakPtrImplWithEventTargetData> m_styleSheetCandidateNodes;

    String m_preferredStylesheetSetName;

    std::optional<UpdateType> m_pendingUpdate;

    bool m_hasDescendantWithPendingUpdate { false };
    bool m_usesStyleBasedEditability { false };
    bool m_usesHasPseudoClass { false };
    bool m_isUpdatingStyleResolver { false };

    std::optional<MediaQueryViewportState> m_viewportStateOnPreviousMediaQueryEvaluation;
    WeakHashMap<Element, LayoutSize, WeakPtrImplWithEventTargetData> m_queryContainerStates;
    mutable WeakHashMap<const Element, UniqueRef<MatchResult>, WeakPtrImplWithEventTargetData> m_cachedMatchResults;

    UniqueRef<CustomPropertyRegistry> m_customPropertyRegistry;
    UniqueRef<CSSCounterStyleRegistry> m_counterStyleRegistry;

    // FIXME: These (and some things above) are only relevant for the root scope.
    UncheckedKeyHashMap<ResolverSharingKey, Ref<Resolver>> m_sharedShadowTreeResolvers;

    AnchorPositionedStates m_anchorPositionedStates;
};

HTMLSlotElement* assignedSlotForScopeOrdinal(const Element&, ScopeOrdinal);
Element* hostForScopeOrdinal(const Element&, ScopeOrdinal);

inline void Scope::flushPendingUpdate()
{
    if (m_hasDescendantWithPendingUpdate)
        flushPendingDescendantUpdates();
    if (m_pendingUpdate)
        flushPendingSelfUpdate();
}

}
}
