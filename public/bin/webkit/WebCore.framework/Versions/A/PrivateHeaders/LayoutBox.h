/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "LayoutUnits.h"
#include "RenderStyle.h"
#include "RenderStyleConstants.h"
#include <wtf/CheckedPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class LayoutShape;
class RenderObject;

namespace Layout {

class ElementBox;
class BoxGeometry;
class InitialContainingBlock;
class LayoutState;
class TreeBuilder;

class Box : public CanMakeCheckedPtr<Box> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(Box);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(Box);
public:
    enum class NodeType : uint8_t {
        Text,
        GenericElement,
        ReplacedElement,
        DocumentElement,
        Body,
        TableWrapperBox, // The table generates a principal block container box called the table wrapper box that contains the table box and any caption boxes.
        TableBox, // The table box is a block-level box that contains the table's internal table boxes.
        Image,
        IFrame,
        LineBreak,
        WordBreakOpportunity,
        ListMarker,
        ImplicitFlexBox // These boxes are implicit flex boxes with no flex display type and they should probably turned into proper flex boxes.
    };

    enum class IsAnonymous : bool { No, Yes };

    struct ElementAttributes {
        NodeType nodeType;
        IsAnonymous isAnonymous;
    };

    enum BaseTypeFlag : uint8_t {
        InlineTextBoxFlag          = 1 << 0,
        ElementBoxFlag             = 1 << 1,
        InitialContainingBlockFlag = 1 << 2,
    };

    virtual ~Box();

    bool establishesFormattingContext() const;
    bool establishesBlockFormattingContext() const;
    bool establishesInlineFormattingContext() const;
    bool establishesTableFormattingContext() const;
    bool establishesFlexFormattingContext() const;
    bool establishesGridFormattingContext() const;
    bool establishesIndependentFormattingContext() const;

    bool isInFlow() const { return !isFloatingOrOutOfFlowPositioned(); }
    bool isPositioned() const { return isInFlowPositioned() || isOutOfFlowPositioned(); }
    bool isInFlowPositioned() const { return isRelativelyPositioned() || isStickyPositioned(); }
    bool isOutOfFlowPositioned() const { return isAbsolutelyPositioned(); }
    bool isRelativelyPositioned() const;
    bool isStickyPositioned() const;
    bool isAbsolutelyPositioned() const;
    bool isFixedPositioned() const;
    bool isFloatingPositioned() const;
    bool hasFloatClear() const;
    bool isFloatAvoider() const;

    bool isFloatingOrOutOfFlowPositioned() const { return isFloatingPositioned() || isOutOfFlowPositioned(); }

    bool isContainingBlockForInFlow() const;
    inline bool isContainingBlockForFixedPosition() const;
    inline bool isContainingBlockForOutOfFlowPosition() const;

    bool isAnonymous() const { return m_isAnonymous; }

    // Block level elements generate block level boxes.
    bool isBlockLevelBox() const;
    // A block-level box that is also a block container.
    bool isBlockBox() const;
    // A block-level box is also a block container box unless it is a table box or the principal box of a replaced element.
    bool isBlockContainer() const;
    bool isInlineLevelBox() const;
    bool isInlineBox() const;
    bool isAtomicInlineBox() const;
    bool isInlineBlockBox() const;
    bool isInlineTableBox() const;
    bool isInitialContainingBlock() const { return baseTypeFlags().contains(InitialContainingBlockFlag); }
    bool isLayoutContainmentBox() const;
    bool isSizeContainmentBox() const;
    bool isInternalRubyBox() const;
    bool isRubyAnnotationBox() const;
    bool isInterlinearRubyAnnotationBox() const;

    bool isDocumentBox() const { return m_nodeType == NodeType::DocumentElement; }
    bool isBodyBox() const { return m_nodeType == NodeType::Body; }
    bool isRuby() const { return style().display() == DisplayType::Ruby; }
    bool isRubyBase() const { return style().display() == DisplayType::RubyBase; }
    bool isRubyInlineBox() const { return isRuby() || isRubyBase(); }
    bool isTableWrapperBox() const { return m_nodeType == NodeType::TableWrapperBox; }
    bool isTableBox() const { return m_nodeType == NodeType::TableBox; }
    bool isTableCaption() const { return style().display() == DisplayType::TableCaption; }
    bool isTableHeader() const { return style().display() == DisplayType::TableHeaderGroup; }
    bool isTableBody() const { return style().display() == DisplayType::TableRowGroup; }
    bool isTableFooter() const { return style().display() == DisplayType::TableFooterGroup; }
    bool isTableRow() const { return style().display() == DisplayType::TableRow; }
    bool isTableColumnGroup() const { return style().display() == DisplayType::TableColumnGroup; }
    bool isTableColumn() const { return style().display() == DisplayType::TableColumn; }
    bool isTableCell() const { return style().display() == DisplayType::TableCell; }
    bool isInternalTableBox() const;
    bool isFlexBox() const { return style().display() == DisplayType::Flex || style().display() == DisplayType::InlineFlex || m_nodeType == NodeType::ImplicitFlexBox; }
    bool isFlexItem() const;
    bool isGridBox() const { return style().display() == DisplayType::Grid || style().display() == DisplayType::InlineGrid; }
    bool isIFrame() const { return m_nodeType == NodeType::IFrame; }
    bool isImage() const { return m_nodeType == NodeType::Image; }
    bool isLineBreakBox() const { return m_nodeType == NodeType::LineBreak || m_nodeType == NodeType::WordBreakOpportunity; }
    bool isWordBreakOpportunity() const { return m_nodeType == NodeType::WordBreakOpportunity; }
    bool isListMarkerBox() const { return m_nodeType == NodeType::ListMarker; }
    bool isReplacedBox() const { return m_nodeType == NodeType::ReplacedElement || m_nodeType == NodeType::Image || m_nodeType == NodeType::ListMarker; }

    bool isInlineIntegrationRoot() const { return m_isInlineIntegrationRoot; }
    bool isFirstChildForIntegration() const { return m_isFirstChildForIntegration; }

    const ElementBox& parent() const { return *m_parent; }
    const Box* nextSibling() const { return m_nextSibling.get(); }
    const Box* nextInFlowSibling() const;
    const Box* nextInFlowOrFloatingSibling() const;
    const Box* nextOutOfFlowSibling() const;
    const Box* previousSibling() const { return m_previousSibling.get(); }
    const Box* previousInFlowSibling() const;
    const Box* previousInFlowOrFloatingSibling() const;
    const Box* previousOutOfFlowSibling() const;
    bool isDescendantOf(const ElementBox&) const;
    bool isInFormattingContextEstablishedBy(const ElementBox& formattingContextRoot) const;

    // FIXME: This is currently needed for style updates.
    Box* nextSibling() { return m_nextSibling.get(); }

    bool isElementBox() const { return baseTypeFlags().contains(ElementBoxFlag); }
    bool isInlineTextBox() const { return baseTypeFlags().contains(InlineTextBoxFlag); }

    bool isPaddingApplicable() const;
    bool isOverflowVisible() const;

    void updateStyle(RenderStyle&& newStyle, std::unique_ptr<RenderStyle>&& newFirstLineStyle);
    const RenderStyle& style() const { return m_style; }
    const RenderStyle& firstLineStyle() const { return hasRareData() && rareData().firstLineStyle ? *rareData().firstLineStyle : m_style; }
    WritingMode writingMode() const { return style().writingMode(); }

    // FIXME: Find a better place for random DOM things.
    void setRowSpan(size_t);
    size_t rowSpan() const;

    void setColumnSpan(size_t);
    size_t columnSpan() const;

    void setColumnWidth(LayoutUnit);
    std::optional<LayoutUnit> columnWidth() const;

    void setIsInlineIntegrationRoot() { m_isInlineIntegrationRoot = true; }
    void setIsFirstChildForIntegration(bool value) { m_isFirstChildForIntegration = value; }

    const LayoutShape* shape() const;
    void setShape(RefPtr<const LayoutShape>);

    const ElementBox* associatedRubyAnnotationBox() const;

    RenderObject* rendererForIntegration() const { return m_renderer.get(); }
    void setRendererForIntegration(RenderObject* renderer) { m_renderer = renderer; }

    UniqueRef<Box> removeFromParent();

protected:
    Box(ElementAttributes&&, RenderStyle&&, std::unique_ptr<RenderStyle>&& firstLineStyle, OptionSet<BaseTypeFlag>);

private:
    friend class ElementBox;
    friend class LayoutState;

    class BoxRareData {
        WTF_MAKE_TZONE_ALLOCATED(BoxRareData);
    public:
        BoxRareData() = default;

        CellSpan tableCellSpan;
        std::optional<LayoutUnit> columnWidth;
        std::unique_ptr<RenderStyle> firstLineStyle;
        RefPtr<const LayoutShape> shape;
    };

    bool hasRareData() const { return m_hasRareData; }
    void setHasRareData(bool hasRareData) { m_hasRareData = hasRareData; }
    const BoxRareData& rareData() const;
    Box::BoxRareData& rareData();
    BoxRareData& ensureRareData();
    void removeRareData();
    
    OptionSet<BaseTypeFlag> baseTypeFlags() const { return OptionSet<BaseTypeFlag>::fromRaw(m_baseTypeFlags); }

    typedef UncheckedKeyHashMap<const Box*, std::unique_ptr<BoxRareData>> RareDataMap;

    static RareDataMap& rareDataMap();

    NodeType m_nodeType : 4;
    bool m_isAnonymous : 1;

    unsigned m_baseTypeFlags : 4; // OptionSet<BaseTypeFlag>
    bool m_hasRareData : 1 { false };
    bool m_isInlineIntegrationRoot : 1 { false };
    bool m_isFirstChildForIntegration : 1 { false };

    RenderStyle m_style;

    CheckedPtr<ElementBox> m_parent;

    std::unique_ptr<Box> m_nextSibling;
    CheckedPtr<Box> m_previousSibling;

    // Primary LayoutState gets a direct cache.
#if ASSERT_ENABLED
    mutable WeakPtr<LayoutState> m_primaryLayoutState;
#endif
    mutable std::unique_ptr<BoxGeometry> m_cachedGeometryForPrimaryLayoutState;

    CheckedPtr<RenderObject> m_renderer;
};

inline bool Box::isContainingBlockForInFlow() const
{
    return isBlockContainer() || establishesFormattingContext();
}

}

}

#define SPECIALIZE_TYPE_TRAITS_LAYOUT_BOX(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Layout::ToValueTypeName) \
    static bool isType(const WebCore::Layout::Box& box) { return box.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
