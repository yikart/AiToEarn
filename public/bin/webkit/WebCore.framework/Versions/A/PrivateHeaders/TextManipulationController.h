/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "Position.h"
#include "QualifiedName.h"
#include "TextManipulationControllerExclusionRule.h"
#include "TextManipulationControllerManipulationFailure.h"
#include "TextManipulationItem.h"
#include <wtf/CheckedRef.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Markable.h>
#include <wtf/ObjectIdentifier.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class Document;
class Element;
class VisiblePosition;

class TextManipulationController final : public CanMakeWeakPtr<TextManipulationController>, public CanMakeCheckedPtr<TextManipulationController> {
    WTF_MAKE_TZONE_ALLOCATED(TextManipulationController);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(TextManipulationController);
public:
    TextManipulationController(Document&);
    
    using ManipulationFailure = TextManipulationControllerManipulationFailure;
    using ExclusionRule = TextManipulationControllerExclusionRule;

    using ManipulationItemCallback = Function<void(Document&, const Vector<TextManipulationItem>&)>;
    WEBCORE_EXPORT void startObservingParagraphs(ManipulationItemCallback&&, Vector<ExclusionRule>&& = { });

    void didUpdateContentForNode(Node&);
    void didAddOrCreateRendererForNode(Node&);
    void removeNode(Node&);

    WEBCORE_EXPORT Vector<ManipulationFailure> completeManipulation(const Vector<TextManipulationItem>&);

private:
    void observeParagraphs(const Position& start, const Position& end);
    void scheduleObservationUpdate();

    struct ManipulationItemData {
        Position start;
        Position end;

        WeakPtr<Element, WeakPtrImplWithEventTargetData> element;
        QualifiedName attributeName { nullQName() };

        Vector<TextManipulationToken> tokens;
    };

    struct ManipulationUnit {
        Ref<Node> node;
        Vector<TextManipulationToken> tokens;
        bool areAllTokensExcluded { true };
        bool firstTokenContainsDelimiter { false };
        bool lastTokenContainsDelimiter { false };
    };
    ManipulationUnit createUnit(const Vector<String>&, Node&);
    void parse(ManipulationUnit&, const String&, Node&);

    bool shouldExcludeNodeBasedOnStyle(const Node&);

    void addItem(ManipulationItemData&&);
    void addItemIfPossible(Vector<ManipulationUnit>&&);
    void flushPendingItemsForCallback();

    enum class IsNodeManipulated : bool { No, Yes };
    struct NodeInsertion {
        RefPtr<Node> parentIfDifferentFromCommonAncestor;
        Ref<Node> child;
        IsNodeManipulated isChildManipulated { IsNodeManipulated::Yes };
    };
    using NodeEntry = std::pair<Ref<Node>, Ref<Node>>;
    Vector<Ref<Node>> getPath(Node*, Node*);
    void updateInsertions(Vector<NodeEntry>&, const Vector<Ref<Node>>&, Node*, HashSet<Ref<Node>>&, Vector<NodeInsertion>&);
    std::optional<ManipulationFailure::Type> replace(const ManipulationItemData&, const Vector<TextManipulationToken>&, HashSet<Ref<Node>>& containersWithoutVisualOverflowBeforeReplacement);

    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document;
    WeakHashSet<Node, WeakPtrImplWithEventTargetData> m_manipulatedNodes;
    WeakHashSet<Node, WeakPtrImplWithEventTargetData> m_manipulatedNodesWithNewContent;
    WeakHashSet<Node, WeakPtrImplWithEventTargetData> m_addedOrNewlyRenderedNodes;

    UncheckedKeyHashMap<String, bool> m_cachedFontFamilyExclusionResults;

    bool m_didScheduleObservationUpdate { false };

    ManipulationItemCallback m_callback;
    Vector<TextManipulationItem> m_pendingItemsForCallback;

    Vector<ExclusionRule> m_exclusionRules;
    UncheckedKeyHashMap<TextManipulationItemIdentifier, ManipulationItemData> m_items;
};

} // namespace WebCore
