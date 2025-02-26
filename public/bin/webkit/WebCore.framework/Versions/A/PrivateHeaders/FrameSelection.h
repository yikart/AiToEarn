/*
 * Copyright (C) 2004-2020 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "AXTextStateChangeIntent.h"
#include "CaretAnimator.h"
#include "Color.h"
#include "EditingStyle.h"
#include "Element.h"
#include "IntRect.h"
#include "LayoutRect.h"
#include "Range.h"
#include "ScrollAlignment.h"
#include "ScrollBehavior.h"
#include "VisibleSelection.h"
#include <wtf/CheckedRef.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class CharacterData;
class GraphicsContext;
class HTMLFormElement;
class LocalFrame;
class MutableStyleProperties;
class RenderBlock;
class RenderObject;
class RenderView;
class VisiblePosition;

enum class UserTriggered : bool { No, Yes };
enum class RevealExtentOption : bool { RevealExtent, DoNotRevealExtent };
enum class ForceCenterScroll : bool { No, Yes };
enum class CaretVisibility : bool { Visible, Hidden };

enum class CaretVisibilitySuppressionReason : uint8_t {
    IsNotFocusedOrActive = 1 << 0,
    TextPlaceholderIsShowing = 1 << 1,
};

class CaretBase {
    WTF_MAKE_TZONE_ALLOCATED(CaretBase);
    WTF_MAKE_NONCOPYABLE(CaretBase);
public:
    WEBCORE_EXPORT static Color computeCaretColor(const RenderStyle& elementStyle, const Node*);
protected:
    explicit CaretBase(CaretVisibility = CaretVisibility::Hidden);

    void invalidateCaretRect(Node*, bool caretRectChanged = false, CaretAnimator* = nullptr);
    void clearCaretRect();
    bool updateCaretRect(Document&, const VisiblePosition& caretPosition);
    bool shouldRepaintCaret(const RenderView*, bool isContentEditable) const;
    void paintCaret(const Node&, GraphicsContext&, const LayoutPoint&, CaretAnimator*) const;

    const LayoutRect& localCaretRectWithoutUpdate() const { return m_caretLocalRect; }

    bool shouldUpdateCaretRect() const { return m_caretRectNeedsUpdate; }
    void setCaretRectNeedsUpdate() { m_caretRectNeedsUpdate = true; }

    void setCaretVisibility(CaretVisibility visibility) { m_caretVisibility = visibility; }
    bool caretIsVisible() const { return m_caretVisibility == CaretVisibility::Visible; }
    CaretVisibility caretVisibility() const { return m_caretVisibility; }

private:
    LayoutRect m_caretLocalRect; // caret rect in coords local to the renderer responsible for painting the caret
    bool m_caretRectNeedsUpdate; // true if m_caretRect (and m_absCaretBounds in FrameSelection) need to be calculated
    CaretVisibility m_caretVisibility;
};

class DragCaretController : private CaretBase {
    WTF_MAKE_TZONE_ALLOCATED(DragCaretController);
    WTF_MAKE_NONCOPYABLE(DragCaretController);
public:
    DragCaretController();

    RenderBlock* caretRenderer() const;
    void paintDragCaret(LocalFrame*, GraphicsContext&, const LayoutPoint&) const;

    bool isContentEditable() const { return m_position.rootEditableElement(); }
    WEBCORE_EXPORT bool isContentRichlyEditable() const;

    bool hasCaret() const { return m_position.isNotNull(); }
    const VisiblePosition& caretPosition() { return m_position; }
    void setCaretPosition(const VisiblePosition&);
    void clear() { setCaretPosition(VisiblePosition()); }
    WEBCORE_EXPORT IntRect caretRectInRootViewCoordinates() const;
    WEBCORE_EXPORT IntRect editableElementRectInRootViewCoordinates() const;

    void nodeWillBeRemoved(Node&);

private:
    void clearCaretPositionWithoutUpdatingStyle();

    VisiblePosition m_position;
};

class FrameSelection final : private CaretBase, public CaretAnimationClient, public CanMakeCheckedPtr<FrameSelection> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FrameSelection, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(FrameSelection);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(FrameSelection);
public:
    enum class ShouldUpdateAppearance : bool { No, Yes };
    enum class Alteration : bool { Move, Extend };
    enum class CursorAlignOnScroll : bool { IfNeeded, Always };
    enum class SetSelectionOption : uint16_t {
        FireSelectEvent = 1 << 0,
        CloseTyping = 1 << 1,
        ClearTypingStyle = 1 << 2,
        SpellCorrectionTriggered = 1 << 3,
        DoNotSetFocus = 1 << 4,
        DictationTriggered = 1 << 5,
        IsUserTriggered = 1 << 6,
        RevealSelection = 1 << 7,
        RevealSelectionUpToMainFrame = 1 << 8,
        SmoothScroll = 1 << 9,
        DelegateMainFrameScroll = 1 << 10,
        RevealSelectionBounds = 1 << 11,
        ForceCenterScroll = 1 << 12,
        ForBindings = 1 << 13,
        DoNotNotifyEditorClients = 1 << 14,
        MaintainLiveRange = 1 << 15,
    };
    static constexpr OptionSet<SetSelectionOption> defaultSetSelectionOptions(UserTriggered = UserTriggered::No);

    WEBCORE_EXPORT explicit FrameSelection(Document* = nullptr);

    WEBCORE_EXPORT virtual ~FrameSelection();

    WEBCORE_EXPORT Element* rootEditableElementOrDocumentElement() const;
     
    WEBCORE_EXPORT void moveTo(const VisiblePosition&, UserTriggered = UserTriggered::No, CursorAlignOnScroll = CursorAlignOnScroll::IfNeeded);
    WEBCORE_EXPORT void moveTo(const VisiblePosition&, const VisiblePosition&, UserTriggered = UserTriggered::No);
    void moveTo(const Position&, Affinity, UserTriggered = UserTriggered::No);
    void moveTo(const Position&, const Position&, Affinity, UserTriggered = UserTriggered::No);
    void moveWithoutValidationTo(const Position&, const Position&, bool selectionHasDirection, OptionSet<SetSelectionOption> = defaultSetSelectionOptions(), const AXTextStateChangeIntent& = AXTextStateChangeIntent());

    const VisibleSelection& selection() const { return m_selection; }
    WEBCORE_EXPORT void setSelection(const VisibleSelection&, OptionSet<SetSelectionOption> = defaultSetSelectionOptions(), AXTextStateChangeIntent = AXTextStateChangeIntent(), CursorAlignOnScroll = CursorAlignOnScroll::IfNeeded, TextGranularity = TextGranularity::CharacterGranularity);

    enum class ShouldCloseTyping : bool { No, Yes };
    WEBCORE_EXPORT bool setSelectedRange(const std::optional<SimpleRange>&, Affinity, ShouldCloseTyping, UserTriggered = UserTriggered::No);
    WEBCORE_EXPORT void selectAll();
    WEBCORE_EXPORT void clear();
    void willBeRemovedFromFrame();

    void updateAppearanceAfterUpdatingRendering();

    enum class RevealSelectionAfterUpdate : bool { NotForced, Forced };
    void setNeedsSelectionUpdate(RevealSelectionAfterUpdate = RevealSelectionAfterUpdate::NotForced);

    WEBCORE_EXPORT bool contains(const LayoutPoint&) const;

    WEBCORE_EXPORT bool modify(Alteration, SelectionDirection, TextGranularity, UserTriggered = UserTriggered::No);
    enum class VerticalDirection : bool { Up, Down };
    bool modify(Alteration, unsigned verticalDistance, VerticalDirection, UserTriggered = UserTriggered::No, CursorAlignOnScroll = CursorAlignOnScroll::IfNeeded);

    TextGranularity granularity() const { return m_granularity; }

    void setStart(const VisiblePosition&, UserTriggered = UserTriggered::No);
    void setEnd(const VisiblePosition&, UserTriggered = UserTriggered::No);
    
    WEBCORE_EXPORT void setBase(const VisiblePosition&, UserTriggered = UserTriggered::No);
    WEBCORE_EXPORT void setBase(const Position&, Affinity, UserTriggered = UserTriggered::No);
    void setExtent(const VisiblePosition&, UserTriggered = UserTriggered::No);
    void setExtent(const Position&, Affinity, UserTriggered = UserTriggered::No);

    // Return the renderer that is responsible for painting the caret (in the selection start node).
    RenderBlock* caretRendererWithoutUpdatingLayout() const;

    // Bounds of possibly-transformed caret in absolute coordinates.
    WEBCORE_EXPORT IntRect absoluteCaretBounds(bool* insideFixed = nullptr);
    void setCaretRectNeedsUpdate() { CaretBase::setCaretRectNeedsUpdate(); }

    void willBeModified(Alteration, SelectionDirection);

    bool isNone() const { return m_selection.isNone(); }
    bool isCaret() const { return m_selection.isCaret(); }
    bool isRange() const { return m_selection.isRange(); }
    bool isCaretOrRange() const { return m_selection.isCaretOrRange(); }
    bool isAll(EditingBoundaryCrossingRule rule = CannotCrossEditingBoundary) const { return m_selection.isAll(rule); }
    
    void nodeWillBeRemoved(Node&);
    void textWasReplaced(CharacterData&, unsigned offset, unsigned oldLength, unsigned newLength);

    WEBCORE_EXPORT void addCaretVisibilitySuppressionReason(CaretVisibilitySuppressionReason, ShouldUpdateAppearance = ShouldUpdateAppearance::Yes);
    WEBCORE_EXPORT void removeCaretVisibilitySuppressionReason(CaretVisibilitySuppressionReason, ShouldUpdateAppearance = ShouldUpdateAppearance::Yes);

    bool isCaretVisible() const { return CaretBase::caretIsVisible(); }
    void paintCaret(GraphicsContext&, const LayoutPoint&);

    // Used to suspend caret blinking while the mouse is down.
    WEBCORE_EXPORT void setCaretBlinkingSuspended(bool);
    WEBCORE_EXPORT bool isCaretBlinkingSuspended() const;

#if ENABLE(ACCESSIBILITY_NON_BLINKING_CURSOR)
    WEBCORE_EXPORT void setPrefersNonBlinkingCursor(bool);
#endif

    WEBCORE_EXPORT void setFocused(bool);
    bool isFocused() const { return m_focused; }
    WEBCORE_EXPORT bool isFocusedAndActive() const;
    void pageActivationChanged();

    WEBCORE_EXPORT void updateAppearance();

#if ENABLE(TREE_DEBUGGING)
    String debugDescription() const;
    void showTreeForThis() const;
#endif

    WEBCORE_EXPORT std::optional<SimpleRange> rangeByExtendingCurrentSelection(TextGranularity) const;

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void expandSelectionToElementContainingCaretSelection();
    WEBCORE_EXPORT std::optional<SimpleRange> elementRangeContainingCaretSelection() const;
    WEBCORE_EXPORT void expandSelectionToWordContainingCaretSelection();
    WEBCORE_EXPORT std::optional<SimpleRange> wordRangeContainingCaretSelection();
    WEBCORE_EXPORT void expandSelectionToStartOfWordContainingCaretSelection();
    WEBCORE_EXPORT UChar characterInRelationToCaretSelection(int amount) const;
    WEBCORE_EXPORT bool selectionAtSentenceStart() const;
    WEBCORE_EXPORT bool selectionAtWordStart() const;
    WEBCORE_EXPORT std::optional<SimpleRange> rangeByMovingCurrentSelection(int amount) const;
    WEBCORE_EXPORT std::optional<SimpleRange> rangeByExtendingCurrentSelection(int amount) const;
    WEBCORE_EXPORT void clearCurrentSelection();
    WEBCORE_EXPORT void setCaretColor(const Color&);
    WEBCORE_EXPORT static VisibleSelection wordSelectionContainingCaretSelection(const VisibleSelection&);
    bool isUpdateAppearanceEnabled() const { return m_updateAppearanceEnabled; }
    void setUpdateAppearanceEnabled(bool enabled) { m_updateAppearanceEnabled = enabled; }
    void suppressScrolling() { ++m_scrollingSuppressCount; }
    void restoreScrolling();
#endif

    bool shouldChangeSelection(const VisibleSelection&) const;
    bool shouldDeleteSelection(const VisibleSelection&) const;

    enum class EndPointsAdjustmentMode : bool { DoNotAdjust, AdjustAtBidiBoundary };
    void setSelectionByMouseIfDifferent(const VisibleSelection&, TextGranularity, EndPointsAdjustmentMode = EndPointsAdjustmentMode::DoNotAdjust);

    EditingStyle* typingStyle() const;
    WEBCORE_EXPORT RefPtr<MutableStyleProperties> copyTypingStyle() const;
    void setTypingStyle(RefPtr<EditingStyle>&& style) { m_typingStyle = WTFMove(style); }
    void clearTypingStyle();

    enum class ClipToVisibleContent : bool { No, Yes };
    WEBCORE_EXPORT FloatRect selectionBounds(ClipToVisibleContent = ClipToVisibleContent::Yes);

    enum class TextRectangleHeight : bool { TextHeight, SelectionHeight };
    WEBCORE_EXPORT void getClippedVisibleTextRectangles(Vector<FloatRect>&, TextRectangleHeight = TextRectangleHeight::SelectionHeight) const;

    WEBCORE_EXPORT RefPtr<HTMLFormElement> currentForm() const;

    WEBCORE_EXPORT void revealSelection(SelectionRevealMode = SelectionRevealMode::Reveal, const ScrollAlignment& = ScrollAlignment::alignCenterIfNeeded, RevealExtentOption = RevealExtentOption::DoNotRevealExtent, ScrollBehavior = ScrollBehavior::Instant);
    WEBCORE_EXPORT void setSelectionFromNone();

    bool shouldShowBlockCursor() const { return m_shouldShowBlockCursor; }
    void setShouldShowBlockCursor(bool);

    bool isInDocumentTree() const;
    bool isConnectedToDocument() const;

    RefPtr<Range> associatedLiveRange();
    void associateLiveRange(Range&);
    void disassociateLiveRange();
    void updateFromAssociatedLiveRange();

    CaretAnimator& caretAnimator() { return m_caretAnimator.get(); }

    const CaretAnimator& caretAnimator() const { return m_caretAnimator.get(); }
#if PLATFORM(MAC)
    WEBCORE_EXPORT void caretAnimatorInvalidated(CaretAnimatorType);
#endif
private:
    void updateSelectionAppearanceNow();
    void updateAndRevealSelection(const AXTextStateChangeIntent&, ScrollBehavior = ScrollBehavior::Instant, RevealExtentOption = RevealExtentOption::RevealExtent, ForceCenterScroll = ForceCenterScroll::No);
    void updateDataDetectorsForSelection();

    bool setSelectionWithoutUpdatingAppearance(const VisibleSelection&, OptionSet<SetSelectionOption>, CursorAlignOnScroll, TextGranularity);
    void setNodeFlags(VisibleSelection&, bool value);

    void respondToNodeModification(Node&, bool anchorRemoved, bool focusRemoved, bool baseRemoved, bool extentRemoved, bool startRemoved, bool endRemoved);
    TextDirection directionOfEnclosingBlock();
    TextDirection directionOfSelection();

    VisiblePosition positionForPlatform(bool isGetStart) const;
    VisiblePosition startForPlatform() const;
    VisiblePosition endForPlatform() const;
    VisiblePosition nextWordPositionForPlatform(const VisiblePosition&);

    VisiblePosition modifyExtendingRight(TextGranularity);
    VisiblePosition modifyExtendingForward(TextGranularity);
    VisiblePosition modifyMovingRight(TextGranularity, bool* reachedBoundary = nullptr);
    VisiblePosition modifyMovingForward(TextGranularity, bool* reachedBoundary = nullptr);
    VisiblePosition modifyExtendingLeft(TextGranularity);
    VisiblePosition modifyExtendingBackward(TextGranularity);
    VisiblePosition modifyMovingLeft(TextGranularity, bool* reachedBoundary = nullptr);
    VisiblePosition modifyMovingBackward(TextGranularity, bool* reachedBoundary = nullptr);

    enum class PositionType : uint8_t { Start, End, Extent };
    LayoutUnit lineDirectionPointForBlockDirectionNavigation(PositionType);

    AXTextStateChangeIntent textSelectionIntent(Alteration, SelectionDirection, TextGranularity);
    void notifyAccessibilityForSelectionChange(const AXTextStateChangeIntent&);

    void updateSelectionCachesIfSelectionIsInsideTextFormControl(UserTriggered);

    void selectFrameElementInParentIfFullySelected();

    void setFocusedElementIfNeeded(OptionSet<SetSelectionOption>);
    void focusedOrActiveStateChanged();

    void updateCaretVisibility(ShouldUpdateAppearance);

    bool recomputeCaretRect();
    void invalidateCaretRect();

    void caretAnimationDidUpdate(CaretAnimator&) final;

    Document* document() final;
    RefPtr<Document> protectedDocument() const { return m_document.get(); }

    Node* caretNode() final;

    bool dispatchSelectStart();

#if PLATFORM(IOS_FAMILY)
    std::optional<SimpleRange> rangeByAlteringCurrentSelection(Alteration, int amount) const;
#endif

    LayoutRect localCaretRect() const final { return localCaretRectWithoutUpdate(); }

    WeakPtr<Document, WeakPtrImplWithEventTargetData> m_document;
    RefPtr<Range> m_associatedLiveRange;
    std::optional<LayoutUnit> m_xPosForVerticalArrowNavigation;
    VisibleSelection m_selection;
    VisiblePosition m_originalBase; // Used to store base before the adjustment at bidi boundary.
    TextGranularity m_granularity { TextGranularity::CharacterGranularity };

    RefPtr<Node> m_previousCaretNode; // The last node which painted the caret. Retained for clearing the old caret when it moves.

    RefPtr<EditingStyle> m_typingStyle;
    // The painted bounds of the caret in absolute coordinates
    IntRect m_absCaretBounds;

    SelectionRevealMode m_selectionRevealMode { SelectionRevealMode::DoNotReveal };
    AXTextStateChangeIntent m_selectionRevealIntent;

    UniqueRef<CaretAnimator> m_caretAnimator;

    OptionSet<CaretVisibilitySuppressionReason> m_caretVisibilitySuppressionReasons;

    bool m_caretInsidePositionFixed : 1;
    bool m_absCaretBoundsDirty : 1;
    bool m_focused : 1;
    bool m_isActive : 1;
    bool m_shouldShowBlockCursor : 1;
    bool m_pendingSelectionUpdate : 1;
    bool m_alwaysAlignCursorOnScrollWhenRevealingSelection : 1;
    bool m_hasScheduledSelectionChangeEventOnDocument : 1 { false };

#if PLATFORM(IOS_FAMILY)
    bool m_updateAppearanceEnabled : 1;
    Color m_caretColor;
    int m_scrollingSuppressCount { 0 };
#endif
};

constexpr auto FrameSelection::defaultSetSelectionOptions(UserTriggered userTriggered) -> OptionSet<SetSelectionOption>
{
    OptionSet<SetSelectionOption> options { SetSelectionOption::CloseTyping, SetSelectionOption::ClearTypingStyle };
    if (userTriggered == UserTriggered::Yes)
        options.add({ SetSelectionOption::RevealSelection, SetSelectionOption::FireSelectEvent, SetSelectionOption::IsUserTriggered });
    return options;
}

inline EditingStyle* FrameSelection::typingStyle() const
{
    return m_typingStyle.get();
}

inline void FrameSelection::clearTypingStyle()
{
    m_typingStyle = nullptr;
}

#if !(PLATFORM(COCOA) || USE(ATSPI))

inline void FrameSelection::notifyAccessibilityForSelectionChange(const AXTextStateChangeIntent&)
{
}

#endif

#if PLATFORM(IOS_FAMILY)

inline void FrameSelection::restoreScrolling()
{
    ASSERT(m_scrollingSuppressCount);
    --m_scrollingSuppressCount;
}

#endif

} // namespace WebCore

#if ENABLE(TREE_DEBUGGING)

// Outside the WebCore namespace for ease of invocation from the debugger.
void showTree(const WebCore::FrameSelection&);
void showTree(const WebCore::FrameSelection*);

#endif
