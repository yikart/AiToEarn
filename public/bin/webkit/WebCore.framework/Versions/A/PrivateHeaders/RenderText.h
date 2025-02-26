/*
 * (C) 1999 Lars Knoll (knoll@kde.org)
 * (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Google Inc. All rights reserved.
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

#include "RenderElement.h"
#include "RenderTextLineBoxes.h"
#include "Text.h"
#include <wtf/Forward.h>
#include <wtf/Markable.h>
#include <wtf/text/TextBreakIterator.h>

namespace WebCore {

class Font;
class LegacyInlineTextBox;
struct GlyphOverflow;
struct WordTrailingSpace;
enum class DocumentMarkerType : uint32_t;

namespace Layout {
class InlineTextBox;
}

namespace LayoutIntegration {
class LineLayout;
}

class RenderText : public RenderObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderText);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderText);
public:
    RenderText(Type, Text&, const String&);
    RenderText(Type, Document&, const String&);

    virtual ~RenderText();

    Layout::InlineTextBox* layoutBox();
    const Layout::InlineTextBox* layoutBox() const;

    WEBCORE_EXPORT Text* textNode() const;

    const RenderStyle& style() const;
    const RenderStyle& firstLineStyle() const;
    const RenderStyle* getCachedPseudoStyle(const Style::PseudoElementIdentifier&, const RenderStyle* parentStyle = nullptr) const;

    Color selectionBackgroundColor() const;
    Color selectionForegroundColor() const;
    Color selectionEmphasisMarkColor() const;
    std::unique_ptr<RenderStyle> selectionPseudoStyle() const;

    const RenderStyle* spellingErrorPseudoStyle() const;
    const RenderStyle* grammarErrorPseudoStyle() const;
    const RenderStyle* targetTextPseudoStyle() const;

    virtual String originalText() const;

    void extractTextBox(LegacyInlineTextBox& box) { m_legacyLineBoxes.extract(box); }
    void attachTextBox(LegacyInlineTextBox& box) { m_legacyLineBoxes.attach(box); }
    void removeTextBox(LegacyInlineTextBox& box) { m_legacyLineBoxes.remove(box); }

    const String& text() const { return m_text; }
    String textWithoutConvertingBackslashToYenSymbol() const;

    LegacyInlineTextBox* createInlineTextBox() { return m_legacyLineBoxes.createAndAppendLineBox(*this); }
    void dirtyLegacyLineBoxes(bool fullLayout);
    void deleteLegacyLineBoxes();

    void boundingRects(Vector<LayoutRect>&, const LayoutPoint& accumulatedOffset) const final;
    Vector<IntRect> absoluteRectsForRange(unsigned startOffset = 0, unsigned endOffset = UINT_MAX, bool useSelectionHeight = false, bool* wasFixed = nullptr) const;
#if PLATFORM(IOS_FAMILY)
    void collectSelectionGeometries(Vector<SelectionGeometry>&, unsigned startOffset = 0, unsigned endOffset = std::numeric_limits<unsigned>::max()) final;
#endif

    void absoluteQuads(Vector<FloatQuad>&, bool* wasFixed) const final;
    Vector<FloatQuad> absoluteQuadsForRange(unsigned startOffset = 0, unsigned endOffset = UINT_MAX, OptionSet<RenderObject::BoundingRectBehavior> = { }, bool* wasFixed = nullptr) const;

    Vector<FloatQuad> absoluteQuadsClippedToEllipsis() const;

    Position positionForPoint(const LayoutPoint&, HitTestSource) final;

    bool hasEmptyText() const { return m_text.isEmpty(); }

    UChar characterAt(unsigned) const;
    unsigned length() const final { return text().length(); }

    void positionLineBox(LegacyInlineTextBox&);

    float width(unsigned from, unsigned length, const FontCascade&, float xPos, SingleThreadWeakHashSet<const Font>* fallbackFonts = nullptr, GlyphOverflow* = nullptr) const;
    float width(unsigned from, unsigned length, float xPos, bool firstLine = false, SingleThreadWeakHashSet<const Font>* fallbackFonts = nullptr, GlyphOverflow* = nullptr) const;

    float minLogicalWidth() const;
    float maxLogicalWidth() const;

    struct Widths {
        float min { 0 };
        float max { 0 };
        float beginMin { 0 };
        float endMin { 0 };
        float beginMax { 0 };
        float endMax { 0 };
        bool beginWS { false };
        bool endWS { false };
        bool endZeroSpace { false };
        bool hasBreakableChar { false };
        bool hasBreak { false };
        bool endsWithBreak { false };
    };
    Widths trimmedPreferredWidths(float leadWidth, bool& stripFrontSpaces);

    float hangablePunctuationStartWidth(unsigned index) const;
    float hangablePunctuationEndWidth(unsigned index) const;
    unsigned firstCharacterIndexStrippingSpaces() const;
    unsigned lastCharacterIndexStrippingSpaces() const;
    static bool isHangableStopOrComma(UChar);
    
    WEBCORE_EXPORT virtual IntRect linesBoundingBox() const;
    WEBCORE_EXPORT IntPoint firstRunLocation() const;

    void setText(const String&, bool force = false);
    void setTextWithOffset(const String&, unsigned offset, unsigned len, bool force = false);

    bool canBeSelectionLeaf() const override { return true; }

    LayoutRect collectSelectionGeometriesForLineBoxes(const RenderLayerModelObject* repaintContainer, bool clipToVisibleContent, Vector<FloatQuad>&);

    inline LayoutUnit marginLeft() const;
    inline LayoutUnit marginRight() const;

    LegacyInlineTextBox* firstLegacyTextBox() const { return m_legacyLineBoxes.first(); }

    int caretMinOffset() const final;
    int caretMaxOffset() const final;
    unsigned countRenderedCharacterOffsetsUntil(unsigned) const;
    bool containsRenderedCharacterOffset(unsigned) const;
    bool containsCaretOffset(unsigned) const;
    bool hasRenderedText() const;

    // FIXME: These should return unsigneds.
    int previousOffset(int current) const final;
    int previousOffsetForBackwardDeletion(int current) const final;
    int nextOffset(int current) const final;

    bool needsVisualReordering() const { return m_needsVisualReordering; }
    void setNeedsVisualReordering() { m_needsVisualReordering = true; }

    void momentarilyRevealLastTypedCharacter(unsigned offsetAfterLastTypedCharacter);

    bool containsOnlyCollapsibleWhitespace() const;

    bool canUseSimpleFontCodePath() const { return m_canUseSimpleFontCodePath; }

    void removeAndDestroyLegacyTextBoxes();

    virtual void styleDidChange(StyleDifference, const RenderStyle* oldStyle);

    virtual std::unique_ptr<LegacyInlineTextBox> createTextBox();

#if ENABLE(TEXT_AUTOSIZING)
    float candidateComputedTextSize() const { return m_candidateComputedTextSize; }
    void setCandidateComputedTextSize(float size) { m_candidateComputedTextSize = size; }
#endif

    bool usesLegacyLineLayoutPath() const;

    StringView stringView(unsigned start = 0, std::optional<unsigned> stop = std::nullopt) const;
    
    bool containsOnlyCSSWhitespace(unsigned from, unsigned length) const;

    Vector<std::pair<unsigned, unsigned>> contentRangesBetweenOffsetsForType(const DocumentMarkerType, unsigned startOffset, unsigned endOffset) const;

    RenderInline* inlineWrapperForDisplayContents();
    void setInlineWrapperForDisplayContents(RenderInline*);

    template <typename MeasureTextCallback>
    static float measureTextConsideringPossibleTrailingSpace(bool currentCharacterIsSpace, unsigned startIndex, unsigned wordLength, WordTrailingSpace&, SingleThreadWeakHashSet<const Font>& fallbackFonts, MeasureTextCallback&&);

    static std::optional<bool> emphasisMarkExistsAndIsAbove(const RenderText&, const RenderStyle&);

    void resetMinMaxWidth();

    void setCanUseSimplifiedTextMeasuring(bool canUseSimplifiedTextMeasuring) { m_canUseSimplifiedTextMeasuring = canUseSimplifiedTextMeasuring; }
    std::optional<bool> canUseSimplifiedTextMeasuring() const { return m_canUseSimplifiedTextMeasuring; }
    void setHasPositionDependentContentWidth(bool hasPositionDependentContentWidth) { m_hasPositionDependentContentWidth = hasPositionDependentContentWidth; }
    std::optional<bool> hasPositionDependentContentWidth() const { return m_hasPositionDependentContentWidth; }
    void setHasStrongDirectionalityContent(bool hasStrongDirectionalityContent) { m_hasStrongDirectionalityContent = hasStrongDirectionalityContent; }
    std::optional<bool> hasStrongDirectionalityContent() const { return m_hasStrongDirectionalityContent; }

protected:
    virtual void computePreferredLogicalWidths(float leadWidth, bool forcedMinMaxWidthComputation = false);
    void willBeDestroyed() override;

    virtual void setRenderedText(const String&);
    virtual Vector<UChar> previousCharacter() const;

    virtual void setTextInternal(const String&, bool force);

    RenderTextLineBoxes m_legacyLineBoxes;

private:
    RenderText(Type, Node&, const String&);

    ASCIILiteral renderName() const override;

    bool canHaveChildren() const final { return false; }

    VisiblePosition positionForPoint(const LayoutPoint&, HitTestSource, const RenderFragmentContainer*) override;

    void setSelectionState(HighlightState) final;
    LayoutRect selectionRectForRepaint(const RenderLayerModelObject* repaintContainer, bool clipToVisibleContent = true) final;
    LayoutRect clippedOverflowRect(const RenderLayerModelObject* repaintContainer, VisibleRectContext) const final;
    RepaintRects rectsForRepaintingAfterLayout(const RenderLayerModelObject* repaintContainer, RepaintOutlineBounds) const final;

    void computePreferredLogicalWidths(float leadWidth, SingleThreadWeakHashSet<const Font>& fallbackFonts, GlyphOverflow&, bool forcedMinMaxWidthComputation = false);

    bool computeCanUseSimpleFontCodePath() const;
    
    bool nodeAtPoint(const HitTestRequest&, HitTestResult&, const HitTestLocation&, const LayoutPoint&, HitTestAction) final { ASSERT_NOT_REACHED(); return false; }

    float widthFromCache(const FontCascade&, unsigned start, unsigned len, float xPos, SingleThreadWeakHashSet<const Font>* fallbackFonts, GlyphOverflow*, const RenderStyle&) const;
    bool computeUseBackslashAsYenSymbol() const;

    void secureText(UChar mask);

    LayoutRect collectSelectionGeometriesForLineBoxes(const RenderLayerModelObject* repaintContainer, bool clipToVisibleContent, Vector<FloatQuad>*);

    void node() const = delete;
    void container() const = delete; // Use parent() instead.
    void container(const RenderLayerModelObject&, bool&) const = delete; // Use parent() instead.

    float maxWordFragmentWidth(const RenderStyle&, const FontCascade&, StringView word, unsigned minimumPrefixLength, unsigned minimumSuffixLength, bool currentCharacterIsSpace, unsigned characterIndex, float xPos, float entireWordWidth, WordTrailingSpace&, SingleThreadWeakHashSet<const Font>& fallbackFonts, GlyphOverflow&);
    float widthFromCacheConsideringPossibleTrailingSpace(const RenderStyle&, const FontCascade&, unsigned startIndex, unsigned wordLen, float xPos, bool currentCharacterIsSpace, WordTrailingSpace&, SingleThreadWeakHashSet<const Font>& fallbackFonts, GlyphOverflow&) const;
    void initiateFontLoadingByAccessingGlyphDataAndComputeCanUseSimplifiedTextMeasuring(const String&);

#if ENABLE(TEXT_AUTOSIZING)
    // FIXME: This should probably be part of the text sizing structures in Document instead. That would save some memory.
    float m_candidateComputedTextSize { 0 };
#endif
    Markable<float, WTF::FloatMarkableTraits> m_minWidth;
    Markable<float, WTF::FloatMarkableTraits> m_maxWidth;
    float m_beginMinWidth { 0 };
    float m_endMinWidth { 0 };

    String m_text;

protected:
    std::optional<bool> m_canUseSimplifiedTextMeasuring;
private:
    std::optional<bool> m_hasPositionDependentContentWidth;
    std::optional<bool> m_hasStrongDirectionalityContent;
    unsigned m_hasBreakableChar : 1 { false }; // Whether or not we can be broken into multiple lines.
    unsigned m_hasBreak : 1 { false }; // Whether or not we have a hard break (e.g., <pre> with '\n').
    unsigned m_hasTab : 1 { false }; // Whether or not we have a variable width tab character (e.g., <pre> with '\t').
    unsigned m_hasBeginWS : 1 { false }; // Whether or not we begin with WS (only true if we aren't pre)
    unsigned m_hasEndWS : 1 { false }; // Whether or not we end with WS (only true if we aren't pre)
    unsigned m_linesDirty : 1 { false }; // This bit indicates that the text run has already dirtied specific
                                         // line boxes, and this hint will enable layoutInlineChildren to avoid
                                         // just dirtying everything when character data is modified (e.g., appended/inserted
                                         // or removed).
    unsigned m_needsVisualReordering : 1 { false };
    unsigned m_containsOnlyASCII : 1 { false };
    unsigned m_canUseSimpleFontCodePath : 1 { false };
    mutable unsigned m_knownToHaveNoOverflowAndNoFallbackFonts : 1 { false };
    unsigned m_useBackslashAsYenSymbol : 1 { false };
    unsigned m_originalTextDiffersFromRendered : 1 { false };
    unsigned m_hasInlineWrapperForDisplayContents : 1 { false };
    unsigned m_hasSecureTextTimer : 1 { false };
};

String applyTextTransform(const RenderStyle&, const String&, Vector<UChar> previousCharacter);
String applyTextTransform(const RenderStyle&, const String&);
String capitalize(const String&, Vector<UChar> previousCharacter);
String capitalize(const String&);
TextBreakIterator::LineMode::Behavior mapLineBreakToIteratorMode(LineBreak);
TextBreakIterator::ContentAnalysis mapWordBreakToContentAnalysis(WordBreak);

inline UChar RenderText::characterAt(unsigned i) const
{
    return i >= length() ? 0 : text()[i];
}

inline const RenderStyle& RenderText::style() const
{
    return parent()->style();
}

inline const RenderStyle& RenderText::firstLineStyle() const
{
    return parent()->firstLineStyle();
}

inline const RenderStyle* RenderText::getCachedPseudoStyle(const Style::PseudoElementIdentifier& pseudoElementIdentifier, const RenderStyle* parentStyle) const
{
    // Pseudostyle is associated with an element, so ascend the tree until we find a non-anonymous ancestor.
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->getCachedPseudoStyle(pseudoElementIdentifier, parentStyle);
    return nullptr;
}

inline Color RenderText::selectionBackgroundColor() const
{
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->selectionBackgroundColor();
    return Color();
}

inline Color RenderText::selectionForegroundColor() const
{
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->selectionForegroundColor();
    return Color();
}

inline Color RenderText::selectionEmphasisMarkColor() const
{
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->selectionEmphasisMarkColor();
    return Color();
}

inline std::unique_ptr<RenderStyle> RenderText::selectionPseudoStyle() const
{
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->selectionPseudoStyle();
    return nullptr;
}

inline const RenderStyle* RenderText::spellingErrorPseudoStyle() const
{
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->spellingErrorPseudoStyle();
    return nullptr;
}

inline const RenderStyle* RenderText::grammarErrorPseudoStyle() const
{
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->grammarErrorPseudoStyle();
    return nullptr;
}

inline const RenderStyle* RenderText::targetTextPseudoStyle() const
{
    if (auto* ancestor = firstNonAnonymousAncestor())
        return ancestor->targetTextPseudoStyle();
    return nullptr;
}

inline RenderText* Text::renderer() const
{
    return downcast<RenderText>(Node::renderer());
}

inline void RenderText::resetMinMaxWidth()
{
    m_minWidth = { };
    m_maxWidth = { };
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderText, isRenderText())
