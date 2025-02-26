/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "Document.h"
#include "ElementIdentifier.h"
#include "ElementTargetingTypes.h"
#include "EventTarget.h"
#include "IntRectHash.h"
#include "Region.h"
#include "ScriptExecutionContextIdentifier.h"
#include "Timer.h"
#include <wtf/ApproximateTime.h>
#include <wtf/CheckedPtr.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class Element;
class Document;
class Image;
class Node;
class Page;

class ElementTargetingController final : public CanMakeCheckedPtr<ElementTargetingController> {
    WTF_MAKE_TZONE_ALLOCATED(ElementTargetingController);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ElementTargetingController);
public:
    ElementTargetingController(Page&);

    WEBCORE_EXPORT Vector<TargetedElementInfo> findTargets(TargetedElementRequest&&);
    WEBCORE_EXPORT Vector<Vector<TargetedElementInfo>> findAllTargets(float);

    WEBCORE_EXPORT bool adjustVisibility(Vector<TargetedElementAdjustment>&&);
    void adjustVisibilityInRepeatedlyTargetedRegions(Document&);

    void reset();
    void didChangeMainDocument(Document* newDocument);

    WEBCORE_EXPORT uint64_t numberOfVisibilityAdjustmentRects();
    WEBCORE_EXPORT bool resetVisibilityAdjustments(const Vector<TargetedElementIdentifiers>&);

    WEBCORE_EXPORT RefPtr<Image> snapshotIgnoringVisibilityAdjustment(ElementIdentifier, ScriptExecutionContextIdentifier);

private:
    void cleanUpAdjustmentClientRects();

    void applyVisibilityAdjustmentFromSelectors();

    struct FindElementFromSelectorsResult {
        RefPtr<Element> element;
        String lastSelectorIncludingPseudo;
    };
    FindElementFromSelectorsResult findElementFromSelectors(const TargetedElementSelectors&);

    RefPtr<Document> mainDocument() const;

    void dispatchVisibilityAdjustmentStateDidChange();
    void selectorBasedVisibilityAdjustmentTimerFired();

    std::pair<Vector<Ref<Node>>, RefPtr<Element>> findNodes(FloatPoint location, bool shouldIgnorePointerEventsNone);
    std::pair<Vector<Ref<Node>>, RefPtr<Element>> findNodes(const String& searchText);
    std::pair<Vector<Ref<Node>>, RefPtr<Element>> findNodes(const TargetedElementSelectors&);

    Vector<TargetedElementInfo> extractTargets(Vector<Ref<Node>>&&, RefPtr<Element>&& innerElement, bool canIncludeNearbyElements);

    void recomputeAdjustedElementsIfNeeded();

    void topologicallySortElementsHelper(ElementIdentifier currentElementID, Vector<ElementIdentifier>& depthSortedIDs, HashSet<ElementIdentifier>& processingIDs, HashSet<ElementIdentifier>& unprocessedIDs, const UncheckedKeyHashMap<ElementIdentifier, HashSet<ElementIdentifier>>& elementIDToOccludedElementIDs);
    Vector<ElementIdentifier> topologicallySortElements(const UncheckedKeyHashMap<ElementIdentifier, HashSet<ElementIdentifier>>& elementIDToOccludedElementIDs);

    WeakPtr<Page> m_page;
    DeferrableOneShotTimer m_recentAdjustmentClientRectsCleanUpTimer;
    WeakHashSet<Document, WeakPtrImplWithEventTargetData> m_documentsAffectedByVisibilityAdjustment;
    UncheckedKeyHashMap<ElementIdentifier, IntRect> m_recentAdjustmentClientRects;
    ApproximateTime m_startTimeForSelectorBasedVisibilityAdjustment;
    Timer m_selectorBasedVisibilityAdjustmentTimer;
    Vector<std::pair<Markable<ElementIdentifier>, TargetedElementSelectors>> m_visibilityAdjustmentSelectors;
    Vector<TargetedElementSelectors> m_initialVisibilityAdjustmentSelectors;
    Region m_adjustmentClientRegion;
    Region m_repeatedAdjustmentClientRegion;
    WeakHashSet<Element, WeakPtrImplWithEventTargetData> m_adjustedElements;
    FloatSize m_viewportSizeForVisibilityAdjustment;
    unsigned m_additionalAdjustmentCount { 0 };
    bool m_didCollectInitialAdjustments { false };
    bool m_shouldRecomputeAdjustedElements { false };
};

} // namespace WebCore
