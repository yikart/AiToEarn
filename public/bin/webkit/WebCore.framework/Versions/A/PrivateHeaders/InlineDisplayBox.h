/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "GlyphDisplayListCacheRemoval.h"
#include "InlineRect.h"
#include "LayoutBox.h"
#include "TextFlags.h"
#include <unicode/ubidi.h>
#include <wtf/OptionSet.h>

namespace WebCore {
namespace InlineDisplay {

struct Box {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

#pragma pack(push, 4)
    struct Text {
    public:
        Text() = default;
        Text(size_t position, size_t length, const String& originalContent, String adjustedContentToRender = String(), bool hasHyphen = false);

        size_t start() const { return m_start; }
        size_t end() const { return start() + length(); }
        size_t length() const { return m_length; }
        StringView originalContent() const { return StringView(m_originalContent).substring(m_start, m_length); }
        StringView renderedContent() const { return m_adjustedContentToRender.isNull() ? originalContent() : m_adjustedContentToRender; }
        bool hasHyphen() const { return m_hasHyphen; }
        std::optional<size_t> partiallyVisibleContentLength() const;
        void setPartiallyVisibleContentLength(size_t truncatedLength);

    private:
        friend struct Box;

        String m_originalContent;
        String m_adjustedContentToRender;

        unsigned m_start { 0 };
        unsigned m_length { 0 };
        unsigned m_partiallyVisibleContentLength : 30 { };
        bool m_hasPartiallyVisibleContentLength : 1 { false };
        bool m_hasHyphen : 1 { false };
    };
#pragma pack(pop)

    enum class Type : uint8_t {
        Text,
        WordSeparator,
        Ellipsis,
        SoftLineBreak,
        LineBreakBox,
        AtomicInlineBox,
        NonRootInlineBox,
        RootInlineBox,
        GenericInlineLevelBox
    };
    struct Expansion;
    enum class PositionWithinInlineLevelBox : uint8_t {
        First = 1 << 0,
        Last  = 1 << 1
    };
    Box(size_t lineIndex, Type, const Layout::Box&, UBiDiLevel, const FloatRect&, const FloatRect& inkOverflow, Expansion, std::optional<Text> = std::nullopt, bool hasContent = true, bool isFullyTruncated = false, OptionSet<PositionWithinInlineLevelBox> = { });
    ~Box();

    bool isText() const { return m_type == Type::Text || isWordSeparator(); }
    bool isWordSeparator() const { return m_type == Type::WordSeparator; }
    bool isEllipsis() const { return m_type == Type::Ellipsis; }
    bool isSoftLineBreak() const { return m_type == Type::SoftLineBreak; }
    bool isTextOrSoftLineBreak() const { return isText() || isSoftLineBreak(); }
    bool isLineBreakBox() const { return m_type == Type::LineBreakBox; }
    bool isLineBreak() const { return isSoftLineBreak() || isLineBreakBox(); }
    bool isAtomicInlineBox() const { return m_type == Type::AtomicInlineBox; }
    bool isInlineBox() const { return isNonRootInlineBox() || isRootInlineBox(); }
    bool isNonRootInlineBox() const { return m_type == Type::NonRootInlineBox; }
    bool isRootInlineBox() const { return m_type == Type::RootInlineBox; }
    bool isGenericInlineLevelBox() const { return m_type == Type::GenericInlineLevelBox; }
    bool isInlineLevelBox() const { return isAtomicInlineBox() || isLineBreakBox() || isInlineBox() || isGenericInlineLevelBox(); }
    bool isNonRootInlineLevelBox() const { return isInlineLevelBox() && !isRootInlineBox(); }

    UBiDiLevel bidiLevel() const { return m_bidiLevel; }

    inline bool isHorizontal() const;

    bool hasContent() const { return m_hasContent; }
    bool isVisible() const { return !isFullyTruncated() && style().usedVisibility() == Visibility::Visible; }
    bool isVisibleIgnoringUsedVisibility() const { return !isFullyTruncated() && style().visibility() == Visibility::Visible; }
    bool isFullyTruncated() const { return m_isFullyTruncated; } 

    const FloatRect& visualRectIgnoringBlockDirection() const { return m_unflippedVisualRect; }
    static FloatRect visibleRectIgnoringBlockDirection(const Box&, const FloatRect& visibleLineRect);
    const FloatRect& inkOverflow() const { return m_inkOverflow; }

    float top() const { return visualRectIgnoringBlockDirection().y(); }
    float bottom() const { return visualRectIgnoringBlockDirection().maxY(); }
    float left() const { return visualRectIgnoringBlockDirection().x(); }
    float right() const { return visualRectIgnoringBlockDirection().maxX(); }

    float width() const { return visualRectIgnoringBlockDirection().width(); }
    float height() const { return visualRectIgnoringBlockDirection().height(); }

    void moveVertically(float offset);
    void moveHorizontally(float offset);
    void expandVertically(float delta);
    void expandHorizontally(float delta);

    void adjustInkOverflow(const FloatRect& childBorderBox) { return m_inkOverflow.uniteEvenIfEmpty(childBorderBox); }
    void setLeft(float physicalLeft);
    void setRight(float physicalRight);
    void setTop(float physicalTop);
    void setBottom(float physicalBottom);
    void setRect(const FloatRect&, const FloatRect& inkOverflow);
    void setHasContent() { m_hasContent = true; }
    void setIsFullyTruncated() { m_isFullyTruncated = true; }

    Text& text() { ASSERT(isTextOrSoftLineBreak()); return m_text; }
    const Text& text() const { ASSERT(isTextOrSoftLineBreak()); return m_text; }

    struct Expansion {
        ExpansionBehavior behavior { ExpansionBehavior::defaultBehavior() };
        float horizontalExpansion { 0 };
    };
    void setExpansion(Expansion);
    Expansion expansion() const { return { m_expansionBehavior, m_horizontalExpansion }; }

    const Layout::Box& layoutBox() const { return m_layoutBox; }
    const RenderStyle& style() const { return !lineIndex() ? layoutBox().firstLineStyle() : layoutBox().style(); }
    WritingMode writingMode() const { return style().writingMode(); }

    void moveToLine(unsigned lineIndex) { m_lineIndex = lineIndex; }
    size_t lineIndex() const { return m_lineIndex; }
    // These functions tell you whether this display box is the first/last for the associated inline level box (Layout::Box) and not whether it's the first/last box on the line.
    // (e.g. always true for atomic boxes, but inline boxes spanning over multiple lines can produce individual first/last boxes).
    bool isFirstForLayoutBox() const { return m_isFirstForLayoutBox; }
    bool isLastForLayoutBox() const { return m_isLastForLayoutBox; }

    void setIsFirstForLayoutBox(bool isFirstBox) { m_isFirstForLayoutBox = isFirstBox; }
    void setIsLastForLayoutBox(bool isLastBox) { m_isLastForLayoutBox = isLastBox; }

    bool isInGlyphDisplayListCache() const { return m_isInGlyphDisplayListCache; }
    void setIsInGlyphDisplayListCache() { m_isInGlyphDisplayListCache = true; }
    void removeFromGlyphDisplayListCache();

private:
    CheckedRef<const Layout::Box> m_layoutBox;
    FloatRect m_unflippedVisualRect;
    FloatRect m_inkOverflow;

    unsigned m_lineIndex { 0 };

    float m_horizontalExpansion { 0 };
    
    ExpansionBehavior m_expansionBehavior { ExpansionBehavior::defaultBehavior() };

    UBiDiLevel m_bidiLevel { UBIDI_DEFAULT_LTR };
    const Type m_type : 4 { Type::GenericInlineLevelBox };
    bool m_hasContent : 1 { false };
    bool m_isFirstForLayoutBox : 1 { false };
    bool m_isLastForLayoutBox : 1 { false };
    bool m_isFullyTruncated : 1 { false };
    bool m_isInGlyphDisplayListCache : 1 { false };

    Text m_text;
};

inline Box::Box(size_t lineIndex, Type type, const Layout::Box& layoutBox, UBiDiLevel bidiLevel, const FloatRect& physicalRect, const FloatRect& inkOverflow, Expansion expansion, std::optional<Text> text, bool hasContent, bool isFullyTruncated, OptionSet<PositionWithinInlineLevelBox> positionWithinInlineLevelBox)
    : m_layoutBox(layoutBox)
    , m_unflippedVisualRect(physicalRect)
    , m_inkOverflow(inkOverflow)
    , m_lineIndex(lineIndex)
    , m_horizontalExpansion(expansion.horizontalExpansion)
    , m_expansionBehavior(expansion.behavior)
    , m_bidiLevel(bidiLevel)
    , m_type(type)
    , m_hasContent(hasContent)
    , m_isFirstForLayoutBox(positionWithinInlineLevelBox.contains(PositionWithinInlineLevelBox::First))
    , m_isLastForLayoutBox(positionWithinInlineLevelBox.contains(PositionWithinInlineLevelBox::Last))
    , m_isFullyTruncated(isFullyTruncated)
    , m_text(text ? WTFMove(*text) : Text { })
{
}

inline Box::~Box()
{
    if (m_isInGlyphDisplayListCache)
        removeBoxFromGlyphDisplayListCache(*this);
}

inline Box::Text::Text(size_t start, size_t length, const String& originalContent, String adjustedContentToRender, bool hasHyphen)
    : m_originalContent(originalContent)
    , m_adjustedContentToRender(adjustedContentToRender)
    , m_start(start)
    , m_length(length)
    , m_hasHyphen(hasHyphen)
{
}

inline FloatRect Box::visibleRectIgnoringBlockDirection(const Box& box, const FloatRect& visibleLineRect)
{
    auto visualRectIgnoringBlockDirection = box.visualRectIgnoringBlockDirection();
    auto visibleBoxLeft = std::max(visualRectIgnoringBlockDirection.x(), visibleLineRect.x());
    visualRectIgnoringBlockDirection.setX(visibleBoxLeft);

    auto visibleBoxRight = std::min(visualRectIgnoringBlockDirection.maxX(), visibleLineRect.maxX());
    visualRectIgnoringBlockDirection.shiftMaxXEdgeTo(visibleBoxRight);

    return visualRectIgnoringBlockDirection;
}

inline void Box::setExpansion(Expansion expansion)
{
    m_horizontalExpansion = expansion.horizontalExpansion;
    m_expansionBehavior = expansion.behavior;
}

inline void Box::moveVertically(float offset)
{
    m_unflippedVisualRect.move({ { }, offset });
    m_inkOverflow.move({ { }, offset });
}

inline void Box::moveHorizontally(float offset)
{
    m_unflippedVisualRect.move({ offset, { } });
    m_inkOverflow.move({ offset, { } });
}

inline void Box::expandVertically(float delta)
{
    m_unflippedVisualRect.expand({ { }, delta });
    m_inkOverflow.expand({ { }, delta });
}

inline void Box::expandHorizontally(float delta)
{
    m_unflippedVisualRect.expand({ delta, { } });
    m_inkOverflow.expand({ delta, { } });
}

inline void Box::setLeft(float physicalLeft)
{
    auto offset = physicalLeft - left();
    m_unflippedVisualRect.setX(physicalLeft);
    m_inkOverflow.setX(m_inkOverflow.x() + offset);
}

inline void Box::setRight(float physicalRight)
{
    auto offset = physicalRight - right();
    m_unflippedVisualRect.shiftMaxXEdgeTo(physicalRight);
    m_inkOverflow.shiftMaxXEdgeTo(m_inkOverflow.maxX() + offset);
}

inline void Box::setTop(float physicalTop)
{
    auto offset = physicalTop - top();
    m_unflippedVisualRect.setY(physicalTop);
    m_inkOverflow.setY(m_inkOverflow.y() + offset);
}

inline void Box::setBottom(float physicalBottom)
{
    auto offset = physicalBottom - bottom();
    m_unflippedVisualRect.shiftMaxYEdgeTo(physicalBottom);
    m_inkOverflow.shiftMaxYEdgeTo(m_inkOverflow.maxY() + offset);
}

inline void Box::setRect(const FloatRect& rect, const FloatRect& inkOverflow)
{
    m_unflippedVisualRect = rect;
    m_inkOverflow = inkOverflow;
}

inline void Box::removeFromGlyphDisplayListCache()
{
    if (m_isInGlyphDisplayListCache) {
        removeBoxFromGlyphDisplayListCache(*this);
        m_isInGlyphDisplayListCache = false;
    }
}

inline std::optional<size_t> Box::Text::partiallyVisibleContentLength() const
{
    if (!m_hasPartiallyVisibleContentLength)
        return { };
    return m_partiallyVisibleContentLength;
}

inline void Box::Text::setPartiallyVisibleContentLength(size_t truncatedLength)
{
    m_partiallyVisibleContentLength = truncatedLength;
    m_hasPartiallyVisibleContentLength = true;
}

inline bool operator==(const Box::Text& a, const Box::Text& b)
{
    return a.start() == b.start()
        && a.length() == b.length()
        && a.renderedContent() == b.renderedContent();
}

inline bool operator==(const Box& a, const Box& b)
{
    return &a.layoutBox() == &b.layoutBox()
        && a.style() == b.style()
        && a.lineIndex() == b.lineIndex()
        && a.bidiLevel() == b.bidiLevel()
        && a.visualRectIgnoringBlockDirection() == b.visualRectIgnoringBlockDirection()
        && a.inkOverflow() == b.inkOverflow()
        && (!a.isTextOrSoftLineBreak() || (a.text() == b.text()));
}

}
}
