/*
 * Copyright (C) 2007 Alexey Proskuryakov <ap@nypop.com>.
 * Copyright (C) 2008-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 * Copyright (C) 2009 Jeff Schiller <codedread@gmail.com>
 * Copyright (C) Research In Motion Limited 2010. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "AnchorPositionEvaluator.h"
#include "CSSCalcSymbolTable.h"
#include "CSSCalcValue.h"
#include "CSSFontFaceSrcValue.h"
#include "CSSPrimitiveValue.h"
#include "CSSToLengthConversionData.h"
#include "CSSValueKeywords.h"
#include "FontSizeAdjust.h"
#include "GraphicsTypes.h"
#include "Length.h"
#include "ListStyleType.h"
#include "PositionTryFallback.h"
#include "RenderStyleConstants.h"
#include "SVGRenderStyleDefs.h"
#include "ScrollAxis.h"
#include "ScrollTypes.h"
#include "StyleBuilderState.h"
#include "TextFlags.h"
#include "ThemeTypes.h"
#include "TouchAction.h"
#include "UnicodeBidi.h"
#include "WritingMode.h"
#include <wtf/MathExtras.h>

#if ENABLE(APPLE_PAY)
#include "ApplePayButtonPart.h"
#endif

#if HAVE(CORE_MATERIAL)
#include "AppleVisualEffect.h"
#endif

namespace WebCore {

template<typename TargetType> TargetType fromCSSValue(const CSSValue& value)
{
    return fromCSSValueID<TargetType>(value.valueID());
}

class TypeDeducingCSSValueMapper {
public:
    TypeDeducingCSSValueMapper(const Style::BuilderState& builderState, const CSSValue& value)
        : m_builderState { builderState }
        , m_value { value }
    {
    }

    template<typename TargetType> operator TargetType() const
    {
        return fromCSSValue<TargetType>(m_value);
    }

    operator const CSSPrimitiveValue&() const
    {
        return downcast<CSSPrimitiveValue>(m_value);
    }

    operator const CSSValue&() const
    {
        return m_value;
    }

    operator unsigned short() const
    {
        return numericValue().resolveAsNumber<unsigned short>(m_builderState.cssToLengthConversionData());
    }

    operator int() const
    {
        return numericValue().resolveAsNumber<int>(m_builderState.cssToLengthConversionData());
    }

    operator unsigned() const
    {
        return numericValue().resolveAsNumber<unsigned>(m_builderState.cssToLengthConversionData());
    }

    operator float() const
    {
        return numericValue().resolveAsNumber<float>(m_builderState.cssToLengthConversionData());
    }

    operator double() const
    {
        return numericValue().resolveAsNumber<double>(m_builderState.cssToLengthConversionData());
    }

private:
    const CSSPrimitiveValue& numericValue() const
    {
        auto& value = downcast<CSSPrimitiveValue>(m_value);
        ASSERT(value.isNumberOrInteger());
        return value;
    }

    const Style::BuilderState& m_builderState;
    const CSSValue& m_value;
};

inline TypeDeducingCSSValueMapper fromCSSValueDeducingType(const Style::BuilderState& builderState, const CSSValue& value)
{
    return { builderState, value };
}

#define EMIT_TO_CSS_SWITCH_CASE(VALUE) case TYPE::VALUE: return CSSValue##VALUE;
#define EMIT_FROM_CSS_SWITCH_CASE(VALUE) case CSSValue##VALUE: return TYPE::VALUE;

#define DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS \
constexpr CSSValueID toCSSValueID(TYPE value) { \
    switch (value) { \
    FOR_EACH(EMIT_TO_CSS_SWITCH_CASE) \
    } \
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT(); \
    return CSSValueInvalid; \
} \
\
template<> constexpr TYPE fromCSSValueID(CSSValueID value) { \
    switch (value) { \
    FOR_EACH(EMIT_FROM_CSS_SWITCH_CASE) \
    default: \
        break; \
    } \
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT(); \
    return { }; \
}

#define TYPE ReflectionDirection
#define FOR_EACH(CASE) CASE(Above) CASE(Below) CASE(Left) CASE(Right)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ColumnFill
#define FOR_EACH(CASE) CASE(Auto) CASE(Balance)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ColumnSpan
#define FOR_EACH(CASE) CASE(All) CASE(None)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE PrintColorAdjust
#define FOR_EACH(CASE) CASE(Exact) CASE(Economy)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BlockStepAlign
#define FOR_EACH(CASE) CASE(Auto) CASE(Center) CASE(Start) CASE(End)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BlockStepInsert
#define FOR_EACH(CASE) CASE(MarginBox) CASE(PaddingBox) CASE(ContentBox)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BlockStepRound
#define FOR_EACH(CASE) CASE(Up) CASE(Down) CASE(Nearest)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH


constexpr CSSValueID toCSSValueID(BorderStyle e)
{
    switch (e) {
    case BorderStyle::None:
        return CSSValueNone;
    case BorderStyle::Hidden:
        return CSSValueHidden;
    case BorderStyle::Inset:
        return CSSValueInset;
    case BorderStyle::Groove:
        return CSSValueGroove;
    case BorderStyle::Ridge:
        return CSSValueRidge;
    case BorderStyle::Outset:
        return CSSValueOutset;
    case BorderStyle::Dotted:
        return CSSValueDotted;
    case BorderStyle::Dashed:
        return CSSValueDashed;
    case BorderStyle::Solid:
        return CSSValueSolid;
    case BorderStyle::Double:
        return CSSValueDouble;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr BorderStyle fromCSSValueID(CSSValueID valueID)
{
    if (valueID == CSSValueAuto) // Valid for CSS outline-style
        return BorderStyle::Dotted;
    return static_cast<BorderStyle>(valueID - CSSValueNone);
}

template<> constexpr OutlineIsAuto fromCSSValueID(CSSValueID valueID)
{
    if (valueID == CSSValueAuto)
        return OutlineIsAuto::On;
    return OutlineIsAuto::Off;
}

constexpr CSSValueID toCSSValueID(CompositeOperator e, CSSPropertyID propertyID)
{
    if (propertyID == CSSPropertyMaskComposite) {
        switch (e) {
        case CompositeOperator::SourceOver:
            return CSSValueAdd;
        case CompositeOperator::SourceIn:
            return CSSValueIntersect;
        case CompositeOperator::SourceOut:
            return CSSValueSubtract;
        case CompositeOperator::XOR:
            return CSSValueExclude;
        default:
            break;
        }
    } else {
        switch (e) {
        case CompositeOperator::Clear:
            return CSSValueClear;
        case CompositeOperator::Copy:
            return CSSValueCopy;
        case CompositeOperator::SourceOver:
            return CSSValueSourceOver;
        case CompositeOperator::SourceIn:
            return CSSValueSourceIn;
        case CompositeOperator::SourceOut:
            return CSSValueSourceOut;
        case CompositeOperator::SourceAtop:
            return CSSValueSourceAtop;
        case CompositeOperator::DestinationOver:
            return CSSValueDestinationOver;
        case CompositeOperator::DestinationIn:
            return CSSValueDestinationIn;
        case CompositeOperator::DestinationOut:
            return CSSValueDestinationOut;
        case CompositeOperator::DestinationAtop:
            return CSSValueDestinationAtop;
        case CompositeOperator::XOR:
            return CSSValueXor;
        case CompositeOperator::PlusDarker:
            return CSSValuePlusDarker;
        case CompositeOperator::PlusLighter:
            return CSSValuePlusLighter;
        case CompositeOperator::Difference:
            break;
        }
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr CompositeOperator fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueClear:
        return CompositeOperator::Clear;
    case CSSValueCopy:
        return CompositeOperator::Copy;
    case CSSValueSourceOver:
    case CSSValueAdd:
        return CompositeOperator::SourceOver;
    case CSSValueSourceIn:
    case CSSValueIntersect:
        return CompositeOperator::SourceIn;
    case CSSValueSourceOut:
    case CSSValueSubtract:
        return CompositeOperator::SourceOut;
    case CSSValueSourceAtop:
        return CompositeOperator::SourceAtop;
    case CSSValueDestinationOver:
        return CompositeOperator::DestinationOver;
    case CSSValueDestinationIn:
        return CompositeOperator::DestinationIn;
    case CSSValueDestinationOut:
        return CompositeOperator::DestinationOut;
    case CSSValueDestinationAtop:
        return CompositeOperator::DestinationAtop;
    case CSSValueXor:
    case CSSValueExclude:
        return CompositeOperator::XOR;
    case CSSValuePlusDarker:
        return CompositeOperator::PlusDarker;
    case CSSValuePlusLighter:
        return CompositeOperator::PlusLighter;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CompositeOperator::Clear;
}

constexpr CSSValueID toCSSValueID(StyleAppearance e)
{
    switch (e) {
    case StyleAppearance::None:
        return CSSValueNone;
    case StyleAppearance::Auto:
        return CSSValueAuto;
    case StyleAppearance::Base:
        return CSSValueBase;
    case StyleAppearance::Checkbox:
        return CSSValueCheckbox;
    case StyleAppearance::Radio:
        return CSSValueRadio;
    case StyleAppearance::PushButton:
        return CSSValuePushButton;
    case StyleAppearance::SquareButton:
        return CSSValueSquareButton;
    case StyleAppearance::Button:
        return CSSValueButton;
    case StyleAppearance::DefaultButton:
        return CSSValueDefaultButton;
    case StyleAppearance::Listbox:
        return CSSValueListbox;
    case StyleAppearance::Menulist:
        return CSSValueMenulist;
    case StyleAppearance::MenulistButton:
        return CSSValueMenulistButton;
    case StyleAppearance::Meter:
        return CSSValueMeter;
    case StyleAppearance::ProgressBar:
        return CSSValueProgressBar;
    case StyleAppearance::SliderHorizontal:
        return CSSValueSliderHorizontal;
    case StyleAppearance::SliderVertical:
        return CSSValueSliderVertical;
    case StyleAppearance::SearchField:
        return CSSValueSearchfield;
    case StyleAppearance::TextField:
        return CSSValueTextfield;
    case StyleAppearance::TextArea:
        return CSSValueTextarea;
#if ENABLE(ATTACHMENT_ELEMENT)
    case StyleAppearance::Attachment:
        return CSSValueAttachment;
    case StyleAppearance::BorderlessAttachment:
        return CSSValueBorderlessAttachment;
#endif
#if ENABLE(APPLE_PAY)
    case StyleAppearance::ApplePayButton:
        return CSSValueApplePayButton;
#endif
#if ENABLE(INPUT_TYPE_COLOR)
    case StyleAppearance::ColorWell:
#endif
#if ENABLE(SERVICE_CONTROLS)
    case StyleAppearance::ImageControlsButton:
#endif
    case StyleAppearance::InnerSpinButton:
#if ENABLE(DATALIST_ELEMENT)
    case StyleAppearance::ListButton:
#endif
    case StyleAppearance::SearchFieldDecoration:
    case StyleAppearance::SearchFieldResultsDecoration:
    case StyleAppearance::SearchFieldResultsButton:
    case StyleAppearance::SearchFieldCancelButton:
    case StyleAppearance::SliderThumbHorizontal:
    case StyleAppearance::SliderThumbVertical:
    case StyleAppearance::Switch:
    case StyleAppearance::SwitchThumb:
    case StyleAppearance::SwitchTrack:
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return CSSValueNone;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr StyleAppearance fromCSSValueID(CSSValueID valueID)
{
    if (valueID == CSSValueNone)
        return StyleAppearance::None;

    if (valueID == CSSValueAuto)
        return StyleAppearance::Auto;

    return StyleAppearance(valueID - CSSValueBase + static_cast<unsigned>(StyleAppearance::Base));
}

#define TYPE BackfaceVisibility
#define FOR_EACH(CASE) CASE(Visible) CASE(Hidden)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE FieldSizing
#define FOR_EACH(CASE) CASE(Fixed) CASE(Content)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(FillAttachment e)
{
    switch (e) {
    case FillAttachment::ScrollBackground:
        return CSSValueScroll;
    case FillAttachment::LocalBackground:
        return CSSValueLocal;
    case FillAttachment::FixedBackground:
        return CSSValueFixed;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FillAttachment fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueScroll:
        return FillAttachment::ScrollBackground;
    case CSSValueLocal:
        return FillAttachment::LocalBackground;
    case CSSValueFixed:
        return FillAttachment::FixedBackground;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FillAttachment::ScrollBackground;
}

constexpr CSSValueID toCSSValueID(FillBox e)
{
    switch (e) {
    case FillBox::BorderBox:
        return CSSValueBorderBox;
    case FillBox::PaddingBox:
        return CSSValuePaddingBox;
    case FillBox::ContentBox:
        return CSSValueContentBox;
    case FillBox::BorderArea:
        return CSSValueBorderArea;
    case FillBox::Text:
        return CSSValueText;
    case FillBox::NoClip:
        return CSSValueNoClip;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FillBox fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueBorder:
    case CSSValueBorderBox:
        return FillBox::BorderBox;
    case CSSValuePadding:
    case CSSValuePaddingBox:
        return FillBox::PaddingBox;
    case CSSValueContent:
    case CSSValueContentBox:
        return FillBox::ContentBox;
    case CSSValueBorderArea:
        return FillBox::BorderArea;
    case CSSValueText:
    case CSSValueWebkitText:
        return FillBox::Text;
    case CSSValueNoClip:
        return FillBox::NoClip;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FillBox::BorderBox;
}

#define TYPE FillRepeat
#define FOR_EACH(CASE) CASE(Repeat) CASE(NoRepeat) CASE(Round) CASE(Space)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BoxPack
#define FOR_EACH(CASE) CASE(Start) CASE(Center) CASE(End) CASE(Justify)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BoxAlignment
#define FOR_EACH(CASE) CASE(Stretch) CASE(Start) CASE(Center) CASE(End) CASE(Baseline)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BoxDecorationBreak
#define FOR_EACH(CASE) CASE(Slice) CASE(Clone)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE Edge
#define FOR_EACH(CASE) CASE(Top) CASE(Right) CASE(Bottom) CASE(Left)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BoxSizing
#define FOR_EACH(CASE) CASE(BorderBox) CASE(ContentBox)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BoxDirection
#define FOR_EACH(CASE) CASE(Normal) CASE(Reverse)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BoxLines
#define FOR_EACH(CASE) CASE(Single) CASE(Multiple)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(BoxOrient e)
{
    switch (e) {
    case BoxOrient::Horizontal:
        return CSSValueHorizontal;
    case BoxOrient::Vertical:
        return CSSValueVertical;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr BoxOrient fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueHorizontal:
    case CSSValueInlineAxis:
        return BoxOrient::Horizontal;
    case CSSValueVertical:
    case CSSValueBlockAxis:
        return BoxOrient::Vertical;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return BoxOrient::Horizontal;
}

#define TYPE CaptionSide
#define FOR_EACH(CASE) CASE(Top) CASE(Bottom)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE Clear
#define FOR_EACH(CASE) CASE(None) CASE(Left) CASE(Right) CASE(InlineStart) CASE(InlineEnd) CASE(Both)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextBoxTrim
#define FOR_EACH(CASE) CASE(None) CASE(TrimStart) CASE(TrimEnd) CASE(TrimBoth)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(CursorType e)
{
    switch (e) {
    case CursorType::Auto:
        return CSSValueAuto;
    case CursorType::Default:
        return CSSValueDefault;
    case CursorType::None:
        return CSSValueNone;
    case CursorType::ContextMenu:
        return CSSValueContextMenu;
    case CursorType::Help:
        return CSSValueHelp;
    case CursorType::Pointer:
        return CSSValuePointer;
    case CursorType::Progress:
        return CSSValueProgress;
    case CursorType::Wait:
        return CSSValueWait;
    case CursorType::Cell:
        return CSSValueCell;
    case CursorType::Crosshair:
        return CSSValueCrosshair;
    case CursorType::Text:
        return CSSValueText;
    case CursorType::VerticalText:
        return CSSValueVerticalText;
    case CursorType::Alias:
        return CSSValueAlias;
    case CursorType::Copy:
        return CSSValueCopy;
    case CursorType::Move:
        return CSSValueMove;
    case CursorType::NoDrop:
        return CSSValueNoDrop;
    case CursorType::NotAllowed:
        return CSSValueNotAllowed;
    case CursorType::Grab:
        return CSSValueGrab;
    case CursorType::Grabbing:
        return CSSValueGrabbing;
    case CursorType::EResize:
        return CSSValueEResize;
    case CursorType::NResize:
        return CSSValueNResize;
    case CursorType::NEResize:
        return CSSValueNeResize;
    case CursorType::NWResize:
        return CSSValueNwResize;
    case CursorType::SResize:
        return CSSValueSResize;
    case CursorType::SEResize:
        return CSSValueSeResize;
    case CursorType::SWResize:
        return CSSValueSwResize;
    case CursorType::WResize:
        return CSSValueWResize;
    case CursorType::EWResize:
        return CSSValueEwResize;
    case CursorType::NSResize:
        return CSSValueNsResize;
    case CursorType::NESWResize:
        return CSSValueNeswResize;
    case CursorType::NWSEResize:
        return CSSValueNwseResize;
    case CursorType::ColumnResize:
        return CSSValueColResize;
    case CursorType::RowResize:
        return CSSValueRowResize;
    case CursorType::AllScroll:
        return CSSValueAllScroll;
    case CursorType::ZoomIn:
        return CSSValueZoomIn;
    case CursorType::ZoomOut:
        return CSSValueZoomOut;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr CursorType fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueCopy:
        return CursorType::Copy;
    case CSSValueWebkitGrab:
        return CursorType::Grab;
    case CSSValueWebkitGrabbing:
        return CursorType::Grabbing;
    case CSSValueWebkitZoomIn:
        return CursorType::ZoomIn;
    case CSSValueWebkitZoomOut:
        return CursorType::ZoomOut;
    case CSSValueNone:
        return CursorType::None;
    default:
        return static_cast<CursorType>(valueID - CSSValueAuto);
    }
}

#if ENABLE(CURSOR_VISIBILITY)

#define TYPE CursorVisibility
#define FOR_EACH(CASE) CASE(Auto) CASE(AutoHide)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#endif

constexpr CSSValueID toCSSValueID(DisplayType e)
{
    switch (e) {
    case DisplayType::Inline:
        return CSSValueInline;
    case DisplayType::Block:
        return CSSValueBlock;
    case DisplayType::ListItem:
        return CSSValueListItem;
    case DisplayType::InlineBlock:
        return CSSValueInlineBlock;
    case DisplayType::Table:
        return CSSValueTable;
    case DisplayType::InlineTable:
        return CSSValueInlineTable;
    case DisplayType::TableRowGroup:
        return CSSValueTableRowGroup;
    case DisplayType::TableHeaderGroup:
        return CSSValueTableHeaderGroup;
    case DisplayType::TableFooterGroup:
        return CSSValueTableFooterGroup;
    case DisplayType::TableRow:
        return CSSValueTableRow;
    case DisplayType::TableColumnGroup:
        return CSSValueTableColumnGroup;
    case DisplayType::TableColumn:
        return CSSValueTableColumn;
    case DisplayType::TableCell:
        return CSSValueTableCell;
    case DisplayType::TableCaption:
        return CSSValueTableCaption;
    case DisplayType::Box:
        return CSSValueWebkitBox;
    case DisplayType::InlineBox:
        return CSSValueWebkitInlineBox;
    case DisplayType::Flex:
        return CSSValueFlex;
    case DisplayType::InlineFlex:
        return CSSValueInlineFlex;
    case DisplayType::Grid:
        return CSSValueGrid;
    case DisplayType::InlineGrid:
        return CSSValueInlineGrid;
    case DisplayType::None:
        return CSSValueNone;
    case DisplayType::Contents:
        return CSSValueContents;
    case DisplayType::FlowRoot:
        return CSSValueFlowRoot;
    case DisplayType::Ruby:
        return CSSValueRuby;
    case DisplayType::RubyBlock:
        return CSSValueBlockRuby;
    case DisplayType::RubyBase:
        return CSSValueRubyBase;
    case DisplayType::RubyAnnotation:
        return CSSValueRubyText;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr DisplayType fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueInline:
        return DisplayType::Inline;
    case CSSValueBlock:
        return DisplayType::Block;
    case CSSValueListItem:
        return DisplayType::ListItem;
    case CSSValueInlineBlock:
        return DisplayType::InlineBlock;
    case CSSValueTable:
        return DisplayType::Table;
    case CSSValueInlineTable:
        return DisplayType::InlineTable;
    case CSSValueTableRowGroup:
        return DisplayType::TableRowGroup;
    case CSSValueTableHeaderGroup:
        return DisplayType::TableHeaderGroup;
    case CSSValueTableFooterGroup:
        return DisplayType::TableFooterGroup;
    case CSSValueTableRow:
        return DisplayType::TableRow;
    case CSSValueTableColumnGroup:
        return DisplayType::TableColumnGroup;
    case CSSValueTableColumn:
        return DisplayType::TableColumn;
    case CSSValueTableCell:
        return DisplayType::TableCell;
    case CSSValueTableCaption:
        return DisplayType::TableCaption;
    case CSSValueWebkitBox:
        return DisplayType::Box;
    case CSSValueWebkitInlineBox:
        return DisplayType::InlineBox;
    case CSSValueFlex:
        return DisplayType::Flex;
    case CSSValueInlineFlex:
        return DisplayType::InlineFlex;
    case CSSValueGrid:
        return DisplayType::Grid;
    case CSSValueInlineGrid:
        return DisplayType::InlineGrid;
    case CSSValueNone:
        return DisplayType::None;
    case CSSValueContents:
        return DisplayType::Contents;
    case CSSValueFlowRoot:
        return DisplayType::FlowRoot;
    case CSSValueRuby:
        return DisplayType::Ruby;
    case CSSValueBlockRuby:
        return DisplayType::RubyBlock;
    case CSSValueRubyBase:
        return DisplayType::RubyBase;
    case CSSValueRubyText:
        return DisplayType::RubyAnnotation;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return DisplayType::Inline;
}

#define TYPE EmptyCell
#define FOR_EACH(CASE) CASE(Show) CASE(Hide)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE FlexDirection
#define FOR_EACH(CASE) CASE(Row) CASE(RowReverse) CASE(Column) CASE(ColumnReverse)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(FlexWrap e)
{
    switch (e) {
    case FlexWrap::NoWrap:
        return CSSValueNowrap;
    case FlexWrap::Wrap:
        return CSSValueWrap;
    case FlexWrap::Reverse:
        return CSSValueWrapReverse;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FlexWrap fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNowrap:
        return FlexWrap::NoWrap;
    case CSSValueWrap:
        return FlexWrap::Wrap;
    case CSSValueWrapReverse:
        return FlexWrap::Reverse;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FlexWrap::NoWrap;
}

#define TYPE Float
#define FOR_EACH(CASE) CASE(None) CASE(Left) CASE(Right) CASE(InlineStart) CASE(InlineEnd)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE LineBreak
#define FOR_EACH(CASE) CASE(Auto) CASE(Loose) CASE(Normal) CASE(Strict) CASE(AfterWhiteSpace) CASE(Anywhere)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE HangingPunctuation
#define FOR_EACH(CASE) CASE(First) CASE(Last) CASE(AllowEnd) CASE(ForceEnd)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ListStylePosition
#define FOR_EACH(CASE) CASE(Outside) CASE(Inside)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(ListStyleType::Type style)
{
    switch (style) {
    case ListStyleType::Type::None:
        return CSSValueNone;
    default:
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return CSSValueInvalid;
    }
}

template<> constexpr ListStyleType::Type fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNone:
        return ListStyleType::Type::None;
    default:
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return ListStyleType::Type::None;
    }
}

#define TYPE MarqueeBehavior
#define FOR_EACH(CASE) CASE(None) CASE(Scroll) CASE(Slide) CASE(Alternate)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(MarqueeDirection direction)
{
    switch (direction) {
    case MarqueeDirection::Forward:
        return CSSValueForwards;
    case MarqueeDirection::Backward:
        return CSSValueBackwards;
    case MarqueeDirection::Auto:
        return CSSValueAuto;
    case MarqueeDirection::Up:
        return CSSValueUp;
    case MarqueeDirection::Down:
        return CSSValueDown;
    case MarqueeDirection::Left:
        return CSSValueLeft;
    case MarqueeDirection::Right:
        return CSSValueRight;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr MarqueeDirection fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueForwards:
        return MarqueeDirection::Forward;
    case CSSValueBackwards:
        return MarqueeDirection::Backward;
    case CSSValueAuto:
        return MarqueeDirection::Auto;
    case CSSValueAhead:
    case CSSValueUp: // We don't support vertical languages, so AHEAD just maps to UP.
        return MarqueeDirection::Up;
    case CSSValueReverse:
    case CSSValueDown: // REVERSE just maps to DOWN, since we don't do vertical text.
        return MarqueeDirection::Down;
    case CSSValueLeft:
        return MarqueeDirection::Left;
    case CSSValueRight:
        return MarqueeDirection::Right;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return MarqueeDirection::Auto;
}

#define TYPE NBSPMode
#define FOR_EACH(CASE) CASE(Normal) CASE(Space)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(Overflow e)
{
    switch (e) {
    case Overflow::Visible:
        return CSSValueVisible;
    case Overflow::Hidden:
        return CSSValueHidden;
    case Overflow::Scroll:
        return CSSValueScroll;
    case Overflow::Auto:
        return CSSValueAuto;
    case Overflow::PagedX:
        return CSSValueWebkitPagedX;
    case Overflow::PagedY:
        return CSSValueWebkitPagedY;
    case Overflow::Clip:
        return CSSValueClip;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr Overflow fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueVisible:
        return Overflow::Visible;
    case CSSValueHidden:
        return Overflow::Hidden;
    case CSSValueScroll:
        return Overflow::Scroll;
    case CSSValueOverlay:
    case CSSValueAuto:
        return Overflow::Auto;
    case CSSValueWebkitPagedX:
        return Overflow::PagedX;
    case CSSValueWebkitPagedY:
        return Overflow::PagedY;
    case CSSValueClip:
        return Overflow::Clip;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return Overflow::Visible;
}

#define TYPE OverscrollBehavior
#define FOR_EACH(CASE) CASE(Contain) CASE(None) CASE(Auto)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE OverflowAnchor
#define FOR_EACH(CASE) CASE(None) CASE(Auto)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(BreakBetween e)
{
    switch (e) {
    case BreakBetween::Auto:
        return CSSValueAuto;
    case BreakBetween::Avoid:
        return CSSValueAvoid;
    case BreakBetween::AvoidColumn:
        return CSSValueAvoidColumn;
    case BreakBetween::AvoidPage:
        return CSSValueAvoidPage;
    case BreakBetween::Column:
        return CSSValueColumn;
    case BreakBetween::Page:
        return CSSValuePage;
    case BreakBetween::LeftPage:
        return CSSValueLeft;
    case BreakBetween::RightPage:
        return CSSValueRight;
    case BreakBetween::RectoPage:
        return CSSValueRecto;
    case BreakBetween::VersoPage:
        return CSSValueVerso;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr BreakBetween fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return BreakBetween::Auto;
    case CSSValueAvoid:
        return BreakBetween::Avoid;
    case CSSValueAvoidColumn:
        return BreakBetween::AvoidColumn;
    case CSSValueAvoidPage:
        return BreakBetween::AvoidPage;
    case CSSValueColumn:
        return BreakBetween::Column;
    case CSSValuePage:
        return BreakBetween::Page;
    case CSSValueLeft:
        return BreakBetween::LeftPage;
    case CSSValueRight:
        return BreakBetween::RightPage;
    case CSSValueRecto:
        return BreakBetween::RectoPage;
    case CSSValueVerso:
        return BreakBetween::VersoPage;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return BreakBetween::Auto;
}

#define TYPE BreakInside
#define FOR_EACH(CASE) CASE(Auto) CASE(Avoid) CASE(AvoidColumn) CASE(AvoidPage)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(PositionType e)
{
    switch (e) {
    case PositionType::Static:
        return CSSValueStatic;
    case PositionType::Relative:
        return CSSValueRelative;
    case PositionType::Absolute:
        return CSSValueAbsolute;
    case PositionType::Fixed:
        return CSSValueFixed;
    case PositionType::Sticky:
        return CSSValueSticky;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr PositionType fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueStatic:
        return PositionType::Static;
    case CSSValueRelative:
        return PositionType::Relative;
    case CSSValueAbsolute:
        return PositionType::Absolute;
    case CSSValueFixed:
        return PositionType::Fixed;
    case CSSValueSticky:
    case CSSValueWebkitSticky:
        return PositionType::Sticky;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return PositionType::Static;
}

#define TYPE Resize
#define FOR_EACH(CASE) CASE(Both) CASE(Horizontal) CASE(Vertical) CASE(Block) CASE(Inline) CASE(None)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TableLayoutType
#define FOR_EACH(CASE) CASE(Auto) CASE(Fixed)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(TextAlignMode e)
{
    switch (e) {
    case TextAlignMode::Start:
        return CSSValueStart;
    case TextAlignMode::End:
        return CSSValueEnd;
    case TextAlignMode::Left:
        return CSSValueLeft;
    case TextAlignMode::Right:
        return CSSValueRight;
    case TextAlignMode::Center:
        return CSSValueCenter;
    case TextAlignMode::Justify:
        return CSSValueJustify;
    case TextAlignMode::WebKitLeft:
        return CSSValueWebkitLeft;
    case TextAlignMode::WebKitRight:
        return CSSValueWebkitRight;
    case TextAlignMode::WebKitCenter:
        return CSSValueWebkitCenter;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextAlignMode fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueWebkitAuto: // Legacy -webkit-auto. Eqiuvalent to start.
    case CSSValueStart:
        return TextAlignMode::Start;
    case CSSValueEnd:
        return TextAlignMode::End;
    default:
        return static_cast<TextAlignMode>(valueID - CSSValueLeft);
    }
}

#define TYPE TextAlignLast
#define FOR_EACH(CASE) CASE(Start) CASE(End) CASE(Left) CASE(Right) CASE(Center) CASE(Justify) CASE(Auto)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextGroupAlign
#define FOR_EACH(CASE) CASE(None) CASE(Start) CASE(End) CASE(Left) CASE(Right) CASE(Center)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(TextJustify e)
{
    switch (e) {
    case TextJustify::Auto:
        return CSSValueAuto;
    case TextJustify::None:
        return CSSValueNone;
    case TextJustify::InterWord:
        return CSSValueInterWord;
    case TextJustify::InterCharacter:
        return CSSValueInterCharacter;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextJustify fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return TextJustify::Auto;
    case CSSValueNone:
        return TextJustify::None;
    case CSSValueInterWord:
        return TextJustify::InterWord;
    case CSSValueInterCharacter:
    case CSSValueDistribute:
        return TextJustify::InterCharacter;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TextJustify::Auto;
}

#define TYPE TextDecorationLine
#define FOR_EACH(CASE) CASE(Underline) CASE(Overline) CASE(LineThrough) CASE(Blink)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextDecorationStyle
#define FOR_EACH(CASE) CASE(Solid) CASE(Double) CASE(Dotted) CASE(Dashed) CASE(Wavy)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextSecurity
#define FOR_EACH(CASE) CASE(None) CASE(Disc) CASE(Circle) CASE(Square)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextDecorationSkipInk
#define FOR_EACH(CASE) CASE(None) CASE(Auto) CASE(All)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextTransform
#define FOR_EACH(CASE) CASE(Capitalize) CASE(Uppercase) CASE(Lowercase) CASE(FullSizeKana) CASE(FullWidth)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(UnicodeBidi e)
{
    switch (e) {
    case UnicodeBidi::Normal:
        return CSSValueNormal;
    case UnicodeBidi::Embed:
        return CSSValueEmbed;
    case UnicodeBidi::Override:
        return CSSValueBidiOverride;
    case UnicodeBidi::Isolate:
        return CSSValueIsolate;
    case UnicodeBidi::IsolateOverride:
        return CSSValueIsolateOverride;
    case UnicodeBidi::Plaintext:
        return CSSValuePlaintext;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr UnicodeBidi fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNormal:
        return UnicodeBidi::Normal;
    case CSSValueEmbed:
        return UnicodeBidi::Embed;
    case CSSValueBidiOverride:
        return UnicodeBidi::Override;
    case CSSValueIsolate:
    case CSSValueWebkitIsolate:
        return UnicodeBidi::Isolate;
    case CSSValueIsolateOverride:
    case CSSValueWebkitIsolateOverride:
        return UnicodeBidi::IsolateOverride;
    case CSSValuePlaintext:
    case CSSValueWebkitPlaintext:
        return UnicodeBidi::Plaintext;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return UnicodeBidi::Normal;
}

#define TYPE UserDrag
#define FOR_EACH(CASE) CASE(Auto) CASE(None) CASE(Element)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE UserModify
#define FOR_EACH(CASE) CASE(ReadOnly) CASE(ReadWrite) CASE(ReadWritePlaintextOnly)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(UserSelect e)
{
    switch (e) {
    case UserSelect::None:
        return CSSValueNone;
    case UserSelect::Text:
        return CSSValueText;
    case UserSelect::All:
        return CSSValueAll;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr UserSelect fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return UserSelect::Text;
    case CSSValueNone:
        return UserSelect::None;
    case CSSValueText:
        return UserSelect::Text;
    case CSSValueAll:
        return UserSelect::All;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return UserSelect::Text;
}

constexpr CSSValueID toCSSValueID(VerticalAlign a)
{
    switch (a) {
    case VerticalAlign::Top:
        return CSSValueTop;
    case VerticalAlign::Bottom:
        return CSSValueBottom;
    case VerticalAlign::Middle:
        return CSSValueMiddle;
    case VerticalAlign::Baseline:
        return CSSValueBaseline;
    case VerticalAlign::TextBottom:
        return CSSValueTextBottom;
    case VerticalAlign::TextTop:
        return CSSValueTextTop;
    case VerticalAlign::Sub:
        return CSSValueSub;
    case VerticalAlign::Super:
        return CSSValueSuper;
    case VerticalAlign::BaselineMiddle:
        return CSSValueWebkitBaselineMiddle;
    case VerticalAlign::Length:
        return CSSValueInvalid;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr VerticalAlign fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueTop:
        return VerticalAlign::Top;
    case CSSValueBottom:
        return VerticalAlign::Bottom;
    case CSSValueMiddle:
        return VerticalAlign::Middle;
    case CSSValueBaseline:
        return VerticalAlign::Baseline;
    case CSSValueTextBottom:
        return VerticalAlign::TextBottom;
    case CSSValueTextTop:
        return VerticalAlign::TextTop;
    case CSSValueSub:
        return VerticalAlign::Sub;
    case CSSValueSuper:
        return VerticalAlign::Super;
    case CSSValueWebkitBaselineMiddle:
        return VerticalAlign::BaselineMiddle;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return VerticalAlign::Top;
}

#define TYPE Visibility
#define FOR_EACH(CASE) CASE(Visible) CASE(Hidden) CASE(Collapse)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE WhiteSpaceCollapse
#define FOR_EACH(CASE) CASE(Collapse) CASE(Preserve) CASE(PreserveBreaks) CASE(BreakSpaces)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE WordBreak
#define FOR_EACH(CASE) CASE(Normal) CASE(BreakAll) CASE(KeepAll) CASE(BreakWord) CASE(AutoPhrase)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE OverflowWrap
#define FOR_EACH(CASE) CASE(Normal) CASE(Anywhere) CASE(BreakWord)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(TextDirection e)
{
    switch (e) {
    case TextDirection::LTR:
        return CSSValueLtr;
    case TextDirection::RTL:
        return CSSValueRtl;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextDirection fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueLtr:
        return TextDirection::LTR;
    case CSSValueRtl:
        return TextDirection::RTL;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TextDirection::LTR;
}

constexpr CSSValueID toCSSValueID(StyleWritingMode e)
{
    switch (e) {
    case StyleWritingMode::HorizontalTb:
        return CSSValueHorizontalTb;
    case StyleWritingMode::VerticalRl:
        return CSSValueVerticalRl;
    case StyleWritingMode::VerticalLr:
        return CSSValueVerticalLr;
    case StyleWritingMode::SidewaysRl:
        return CSSValueSidewaysRl;
    case StyleWritingMode::SidewaysLr:
        return CSSValueSidewaysLr;
    case StyleWritingMode::HorizontalBt:
        return CSSValueHorizontalBt;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr StyleWritingMode fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueHorizontalTb:
    case CSSValueLr:
    case CSSValueLrTb:
    case CSSValueRl:
    case CSSValueRlTb:
        return StyleWritingMode::HorizontalTb;
    case CSSValueVerticalRl:
    case CSSValueTb:
    case CSSValueTbRl:
        return StyleWritingMode::VerticalRl;
    case CSSValueVerticalLr:
        return StyleWritingMode::VerticalLr;
    case CSSValueSidewaysLr:
        return StyleWritingMode::SidewaysLr;
    case CSSValueSidewaysRl:
        return StyleWritingMode::SidewaysRl;
    case CSSValueHorizontalBt:
        return StyleWritingMode::HorizontalBt;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return StyleWritingMode::HorizontalTb;
}

constexpr CSSValueID toCSSValueID(TextCombine e)
{
    switch (e) {
    case TextCombine::None:
        return CSSValueNone;
    case TextCombine::All:
        return CSSValueAll;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextCombine fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNone:
        return TextCombine::None;
    case CSSValueAll:
    case CSSValueHorizontal: // -webkit-text-combine only
        return TextCombine::All;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TextCombine::None;
}

constexpr CSSValueID toCSSValueID(RubyPosition e)
{
    switch (e) {
    case RubyPosition::Over:
        return CSSValueOver;
    case RubyPosition::Under:
        return CSSValueUnder;
    case RubyPosition::InterCharacter:
        return CSSValueInterCharacter;
    case RubyPosition::LegacyInterCharacter:
        return CSSValueLegacyInterCharacter;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr RubyPosition fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueOver:
    case CSSValueBefore: // -webkit-ruby-position only
        return RubyPosition::Over;
    case CSSValueUnder:
    case CSSValueAfter: // -webkit-ruby-position only
        return RubyPosition::Under;
    case CSSValueInterCharacter:
        return RubyPosition::InterCharacter;
    case CSSValueLegacyInterCharacter:
        return RubyPosition::LegacyInterCharacter;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return RubyPosition::Over;
}

#define TYPE RubyAlign
#define FOR_EACH(CASE) CASE(Start) CASE(Center) CASE(SpaceBetween) CASE(SpaceAround)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE RubyOverhang
#define FOR_EACH(CASE) CASE(Auto) CASE(None)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextOverflow
#define FOR_EACH(CASE) CASE(Clip) CASE(Ellipsis)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(TextWrapMode wrap)
{
    switch (wrap) {
    case TextWrapMode::Wrap:
        return CSSValueWrap;
    case TextWrapMode::NoWrap:
        return CSSValueNowrap;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextWrapMode fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueWrap:
        return TextWrapMode::Wrap;
    case CSSValueNowrap:
        return TextWrapMode::NoWrap;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TextWrapMode::Wrap;
}

#define TYPE TextWrapStyle
#define FOR_EACH(CASE) CASE(Auto) CASE(Balance) CASE(Pretty) CASE(Stable)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextEmphasisFill
#define FOR_EACH(CASE) CASE(Filled) CASE(Open)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(TextEmphasisMark mark)
{
    switch (mark) {
    case TextEmphasisMark::Dot:
        return CSSValueDot;
    case TextEmphasisMark::Circle:
        return CSSValueCircle;
    case TextEmphasisMark::DoubleCircle:
        return CSSValueDoubleCircle;
    case TextEmphasisMark::Triangle:
        return CSSValueTriangle;
    case TextEmphasisMark::Sesame:
        return CSSValueSesame;
    case TextEmphasisMark::None:
    case TextEmphasisMark::Auto:
    case TextEmphasisMark::Custom:
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return CSSValueNone;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextEmphasisMark fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNone:
        return TextEmphasisMark::None;
    case CSSValueDot:
        return TextEmphasisMark::Dot;
    case CSSValueCircle:
        return TextEmphasisMark::Circle;
    case CSSValueDoubleCircle:
        return TextEmphasisMark::DoubleCircle;
    case CSSValueTriangle:
        return TextEmphasisMark::Triangle;
    case CSSValueSesame:
        return TextEmphasisMark::Sesame;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TextEmphasisMark::None;
}

#define TYPE TextOrientation
#define FOR_EACH(CASE) CASE(Sideways) CASE(Mixed) CASE(Upright)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE PointerEvents
#define FOR_EACH(CASE) CASE(None) CASE(Stroke) CASE(Fill) CASE(Painted) \
    CASE(Visible) CASE(VisibleStroke) CASE(VisibleFill) CASE(VisiblePainted) \
    CASE(BoundingBox) CASE(Auto) CASE(All)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(Kerning kerning)
{
    switch (kerning) {
    case Kerning::Auto:
        return CSSValueAuto;
    case Kerning::Normal:
        return CSSValueNormal;
    case Kerning::NoShift:
        return CSSValueNone;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr Kerning fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return Kerning::Auto;
    case CSSValueNormal:
        return Kerning::Normal;
    case CSSValueNone:
        return Kerning::NoShift;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return Kerning::Auto;
}

#define TYPE ObjectFit
#define FOR_EACH(CASE) CASE(Fill) CASE(Contain) CASE(Cover) CASE(None) CASE(ScaleDown)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(FontSizeAdjust::Metric metric)
{
    switch (metric) {
    case FontSizeAdjust::Metric::ExHeight:
        return CSSValueExHeight;
    case FontSizeAdjust::Metric::CapHeight:
        return CSSValueCapHeight;
    case FontSizeAdjust::Metric::ChWidth:
        return CSSValueChWidth;
    case FontSizeAdjust::Metric::IcWidth:
        return CSSValueIcWidth;
    case FontSizeAdjust::Metric::IcHeight:
        return CSSValueIcHeight;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueAuto;
}

template<> constexpr FontSizeAdjust::Metric fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueExHeight:
        return FontSizeAdjust::Metric::ExHeight;
    case CSSValueCapHeight:
        return FontSizeAdjust::Metric::CapHeight;
    case CSSValueChWidth:
        return FontSizeAdjust::Metric::ChWidth;
    case CSSValueIcWidth:
        return FontSizeAdjust::Metric::IcWidth;
    case CSSValueIcHeight:
        return FontSizeAdjust::Metric::IcHeight;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FontSizeAdjust::Metric::ExHeight;
}

constexpr CSSValueID toCSSValueID(FontSmoothingMode smoothing)
{
    switch (smoothing) {
    case FontSmoothingMode::AutoSmoothing:
        return CSSValueAuto;
    case FontSmoothingMode::NoSmoothing:
        return CSSValueNone;
    case FontSmoothingMode::Antialiased:
        return CSSValueAntialiased;
    case FontSmoothingMode::SubpixelAntialiased:
        return CSSValueSubpixelAntialiased;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FontSmoothingMode fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return FontSmoothingMode::AutoSmoothing;
    case CSSValueNone:
        return FontSmoothingMode::NoSmoothing;
    case CSSValueAntialiased:
        return FontSmoothingMode::Antialiased;
    case CSSValueSubpixelAntialiased:
        return FontSmoothingMode::SubpixelAntialiased;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FontSmoothingMode::AutoSmoothing;
}

constexpr CSSValueID toCSSValueID(FontSmallCaps smallCaps)
{
    switch (smallCaps) {
    case FontSmallCaps::Off:
        return CSSValueNormal;
    case FontSmallCaps::On:
        return CSSValueSmallCaps;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FontSmallCaps fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueSmallCaps:
        return FontSmallCaps::On;
    case CSSValueNormal:
        return FontSmallCaps::Off;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FontSmallCaps::Off;
}

constexpr CSSValueID toCSSValueID(TextRenderingMode e)
{
    switch (e) {
    case TextRenderingMode::AutoTextRendering:
        return CSSValueAuto;
    case TextRenderingMode::OptimizeSpeed:
        return CSSValueOptimizeSpeed;
    case TextRenderingMode::OptimizeLegibility:
        return CSSValueOptimizeLegibility;
    case TextRenderingMode::GeometricPrecision:
        return CSSValueGeometricPrecision;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextRenderingMode fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return TextRenderingMode::AutoTextRendering;
    case CSSValueOptimizeSpeed:
        return TextRenderingMode::OptimizeSpeed;
    case CSSValueOptimizeLegibility:
        return TextRenderingMode::OptimizeLegibility;
    case CSSValueGeometricPrecision:
        return TextRenderingMode::GeometricPrecision;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TextRenderingMode::AutoTextRendering;
}

#define TYPE Hyphens
#define FOR_EACH(CASE) CASE(None) CASE(Manual) CASE(Auto)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE LineSnap
#define FOR_EACH(CASE) CASE(None) CASE(Baseline) CASE(Contain)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE LineAlign
#define FOR_EACH(CASE) CASE(None) CASE(Edges)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE SpeakAs
#define FOR_EACH(CASE) CASE(SpellOut) CASE(Digits) CASE(LiteralPunctuation) CASE(NoPunctuation)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE Order
#define FOR_EACH(CASE) CASE(Logical) CASE(Visual)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BlendMode
#define FOR_EACH(CASE) CASE(Normal) CASE(Multiply) CASE(Screen) CASE(Overlay) \
    CASE(Darken) CASE(Lighten) CASE(ColorDodge) CASE(ColorBurn) \
    CASE(HardLight) CASE(SoftLight) CASE(Difference) CASE(Exclusion) \
    CASE(Hue) CASE(Saturation) CASE(Color) CASE(Luminosity) CASE(PlusDarker) CASE(PlusLighter)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE Isolation
#define FOR_EACH(CASE) CASE(Auto) CASE(Isolate)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE LineCap
#define FOR_EACH(CASE) CASE(Butt) CASE(Round) CASE(Square)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE LineJoin
#define FOR_EACH(CASE) CASE(Miter) CASE(Round) CASE(Bevel)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(WindRule e)
{
    switch (e) {
    case WindRule::NonZero:
        return CSSValueNonzero;
    case WindRule::EvenOdd:
        return CSSValueEvenodd;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr WindRule fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNonzero:
        return WindRule::NonZero;
    case CSSValueEvenodd:
        return WindRule::EvenOdd;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return WindRule::NonZero;
}

#define TYPE AlignmentBaseline
#define FOR_EACH(CASE) CASE(AfterEdge) CASE(Alphabetic) CASE(Baseline) \
    CASE(BeforeEdge) CASE(Central) CASE(Hanging) CASE(Ideographic) CASE(Mathematical) \
    CASE(Middle) CASE(TextAfterEdge) CASE(TextBeforeEdge)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE BorderCollapse
#define FOR_EACH(CASE) CASE(Separate) CASE(Collapse)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(ImageRendering imageRendering)
{
    switch (imageRendering) {
    case ImageRendering::Auto:
        return CSSValueAuto;
    case ImageRendering::CrispEdges:
        return CSSValueCrispEdges;
    case ImageRendering::Pixelated:
        return CSSValuePixelated;
    case ImageRendering::OptimizeSpeed:
        return CSSValueOptimizeSpeed;
    case ImageRendering::OptimizeQuality:
        return CSSValueOptimizeQuality;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr ImageRendering fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return ImageRendering::Auto;
    case CSSValueWebkitOptimizeContrast:
    case CSSValueCrispEdges:
    case CSSValueWebkitCrispEdges:
        return ImageRendering::CrispEdges;
    case CSSValuePixelated:
        return ImageRendering::Pixelated;
    case CSSValueOptimizeSpeed:
        return ImageRendering::OptimizeSpeed;
    case CSSValueOptimizeQuality:
        return ImageRendering::OptimizeQuality;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return ImageRendering::Auto;
}

#if HAVE(CORE_MATERIAL)

constexpr CSSValueID toCSSValueID(AppleVisualEffect effect)
{
    switch (effect) {
    case AppleVisualEffect::None:
        return CSSValueNone;
    case AppleVisualEffect::BlurUltraThinMaterial:
        return CSSValueAppleSystemBlurMaterialUltraThin;
    case AppleVisualEffect::BlurThinMaterial:
        return CSSValueAppleSystemBlurMaterialThin;
    case AppleVisualEffect::BlurMaterial:
        return CSSValueAppleSystemBlurMaterial;
    case AppleVisualEffect::BlurThickMaterial:
        return CSSValueAppleSystemBlurMaterialThick;
    case AppleVisualEffect::BlurChromeMaterial:
        return CSSValueAppleSystemBlurMaterialChrome;
    case AppleVisualEffect::VibrancyLabel:
        return CSSValueAppleSystemVibrancyLabel;
    case AppleVisualEffect::VibrancySecondaryLabel:
        return CSSValueAppleSystemVibrancySecondaryLabel;
    case AppleVisualEffect::VibrancyTertiaryLabel:
        return CSSValueAppleSystemVibrancyTertiaryLabel;
    case AppleVisualEffect::VibrancyQuaternaryLabel:
        return CSSValueAppleSystemVibrancyQuaternaryLabel;
    case AppleVisualEffect::VibrancyFill:
        return CSSValueAppleSystemVibrancyFill;
    case AppleVisualEffect::VibrancySecondaryFill:
        return CSSValueAppleSystemVibrancySecondaryFill;
    case AppleVisualEffect::VibrancyTertiaryFill:
        return CSSValueAppleSystemVibrancyTertiaryFill;
    case AppleVisualEffect::VibrancySeparator:
        return CSSValueAppleSystemVibrancySeparator;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr AppleVisualEffect fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNone:
        return AppleVisualEffect::None;
    case CSSValueAppleSystemBlurMaterialUltraThin:
        return AppleVisualEffect::BlurUltraThinMaterial;
    case CSSValueAppleSystemBlurMaterialThin:
        return AppleVisualEffect::BlurThinMaterial;
    case CSSValueAppleSystemBlurMaterial:
        return AppleVisualEffect::BlurMaterial;
    case CSSValueAppleSystemBlurMaterialThick:
        return AppleVisualEffect::BlurThickMaterial;
    case CSSValueAppleSystemBlurMaterialChrome:
        return AppleVisualEffect::BlurChromeMaterial;
    case CSSValueAppleSystemVibrancyLabel:
        return AppleVisualEffect::VibrancyLabel;
    case CSSValueAppleSystemVibrancySecondaryLabel:
        return AppleVisualEffect::VibrancySecondaryLabel;
    case CSSValueAppleSystemVibrancyTertiaryLabel:
        return AppleVisualEffect::VibrancyTertiaryLabel;
    case CSSValueAppleSystemVibrancyQuaternaryLabel:
        return AppleVisualEffect::VibrancyQuaternaryLabel;
    case CSSValueAppleSystemVibrancyFill:
        return AppleVisualEffect::VibrancyFill;
    case CSSValueAppleSystemVibrancySecondaryFill:
        return AppleVisualEffect::VibrancySecondaryFill;
    case CSSValueAppleSystemVibrancyTertiaryFill:
        return AppleVisualEffect::VibrancyTertiaryFill;
    case CSSValueAppleSystemVibrancySeparator:
        return AppleVisualEffect::VibrancySeparator;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return AppleVisualEffect::None;
}

#endif // HAVE(CORE_MATERIAL)

#define TYPE InputSecurity
#define FOR_EACH(CASE) CASE(Auto) CASE(None)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(TransformStyle3D e)
{
    switch (e) {
    case TransformStyle3D::Flat:
        return CSSValueFlat;
    case TransformStyle3D::Preserve3D:
        return CSSValuePreserve3d;
#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    case TransformStyle3D::Separated:
        return CSSValueSeparated;
#endif
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TransformStyle3D fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueFlat:
        return TransformStyle3D::Flat;
    case CSSValuePreserve3d:
        return TransformStyle3D::Preserve3D;
#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    case CSSValueSeparated:
        return TransformStyle3D::Separated;
#endif
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TransformStyle3D::Flat;
}

#define TYPE TransformBox
#define FOR_EACH(CASE) CASE(StrokeBox) CASE(ContentBox) CASE(BorderBox) CASE(FillBox) CASE(ViewBox)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ColumnAxis
#define FOR_EACH(CASE) CASE(Horizontal) CASE(Vertical) CASE(Auto)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ColumnProgression
#define FOR_EACH(CASE) CASE(Normal) CASE(Reverse)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

enum LengthConversion {
    AnyConversion = ~0,
    FixedIntegerConversion = 1 << 0,
    FixedFloatConversion = 1 << 1,
    AutoConversion = 1 << 2,
    PercentConversion = 1 << 3,
    CalculatedConversion = 1 << 4
};

template<int supported> Length CSSPrimitiveValue::convertToLength(const CSSToLengthConversionData& conversionData) const
{
    if (!convertingToLengthHasRequiredConversionData(supported, conversionData))
        return Length(LengthType::Undefined);
    if ((supported & FixedIntegerConversion) && isLength())
        return resolveAsLength<Length>(conversionData);
    if ((supported & FixedFloatConversion) && isLength())
        return Length(resolveAsLength<double>(conversionData), LengthType::Fixed);
    if ((supported & PercentConversion) && isPercentage())
        return Length(resolveAsPercentage<double>(conversionData), LengthType::Percent);
    if ((supported & AutoConversion) && valueID() == CSSValueAuto)
        return Length(LengthType::Auto);
    if ((supported & CalculatedConversion) && isCalculated())
        return Length(cssCalcValue()->createCalculationValue(conversionData, CSSCalcSymbolTable { }));
    return Length(LengthType::Undefined);
}

#define TYPE BufferedRendering
#define FOR_EACH(CASE) CASE(Auto) CASE(Dynamic) CASE(Static)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ColorInterpolation
#define FOR_EACH(CASE) CASE(Auto) CASE(SRGB) CASE(LinearRGB)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ColorRendering
#define FOR_EACH(CASE) CASE(Auto) CASE(OptimizeSpeed) CASE(OptimizeQuality)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE DominantBaseline
#define FOR_EACH(CASE) CASE(Auto) CASE(UseScript) CASE(NoChange) CASE(ResetSize) CASE(Central) \
    CASE(Middle) CASE(TextBeforeEdge) CASE(TextAfterEdge) CASE(Ideographic) CASE(Alphabetic) \
    CASE(Hanging) CASE(Mathematical)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(ShapeRendering e)
{
    switch (e) {
    case ShapeRendering::Auto:
        return CSSValueAuto;
    case ShapeRendering::OptimizeSpeed:
        return CSSValueOptimizeSpeed;
    case ShapeRendering::CrispEdges:
        return CSSValueCrispedges; // "crispedges", not "crisp-edges"
    case ShapeRendering::GeometricPrecision:
        return CSSValueGeometricPrecision;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr ShapeRendering fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return ShapeRendering::Auto;
    case CSSValueOptimizeSpeed:
        return ShapeRendering::OptimizeSpeed;
    case CSSValueCrispedges: // "crispedges", not "crisp-edges"
        return ShapeRendering::CrispEdges;
    case CSSValueGeometricPrecision:
        return ShapeRendering::GeometricPrecision;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return ShapeRendering::Auto;
}

#define TYPE TextAnchor
#define FOR_EACH(CASE) CASE(Start) CASE(Middle) CASE(End)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE VectorEffect
#define FOR_EACH(CASE) CASE(None) CASE(NonScalingStroke)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE MaskType
#define FOR_EACH(CASE) CASE(Luminance) CASE(Alpha)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(CSSBoxType cssBox)
{
    switch (cssBox) {
    case CSSBoxType::MarginBox:
        return CSSValueMarginBox;
    case CSSBoxType::BorderBox:
        return CSSValueBorderBox;
    case CSSBoxType::PaddingBox:
        return CSSValuePaddingBox;
    case CSSBoxType::ContentBox:
        return CSSValueContentBox;
    case CSSBoxType::FillBox:
        return CSSValueFillBox;
    case CSSBoxType::StrokeBox:
        return CSSValueStrokeBox;
    case CSSBoxType::ViewBox:
        return CSSValueViewBox;
    case CSSBoxType::BoxMissing:
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return CSSValueNone;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr CSSBoxType fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueMarginBox:
        return CSSBoxType::MarginBox;
    case CSSValueBorderBox:
        return CSSBoxType::BorderBox;
    case CSSValuePaddingBox:
        return CSSBoxType::PaddingBox;
    case CSSValueContentBox:
        return CSSBoxType::ContentBox;
    // The following are used in an SVG context.
    case CSSValueFillBox:
        return CSSBoxType::FillBox;
    case CSSValueStrokeBox:
        return CSSBoxType::StrokeBox;
    case CSSValueViewBox:
        return CSSBoxType::ViewBox;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSBoxType::BoxMissing;
}

#define TYPE ItemPosition
#define FOR_EACH(CASE) CASE(Legacy) CASE(Auto) CASE(Normal) CASE(Stretch) CASE(Baseline) \
    CASE(LastBaseline) CASE(Center) CASE(Start) CASE(End) CASE(SelfStart) CASE(SelfEnd) \
    CASE(FlexStart) CASE(FlexEnd) CASE(Left) CASE(Right) CASE(AnchorCenter)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE OverflowAlignment
#define FOR_EACH(CASE) CASE(Default) CASE(Unsafe) CASE(Safe)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ContentPosition
#define FOR_EACH(CASE) CASE(Normal) CASE(Baseline) CASE(LastBaseline) CASE(Center) CASE(Start) \
    CASE(End) CASE(FlexStart) CASE(FlexEnd) CASE(Left) CASE(Right)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ContentDistribution
#define FOR_EACH(CASE) CASE(Default) CASE(SpaceBetween) CASE(SpaceAround) CASE(SpaceEvenly) CASE(Stretch)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TextZoom
#define FOR_EACH(CASE) CASE(Normal) CASE(Reset)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE TouchAction
#define FOR_EACH(CASE) CASE(Auto) CASE(Manipulation) CASE(None) CASE(PanX) CASE(PanY) CASE(PinchZoom)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ScrollSnapStrictness
#define FOR_EACH(CASE) CASE(None) CASE(Proximity) CASE(Mandatory)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(ScrollSnapAxis axis)
{
    switch (axis) {
    case ScrollSnapAxis::XAxis:
        return CSSValueX;
    case ScrollSnapAxis::YAxis:
        return CSSValueY;
    case ScrollSnapAxis::Block:
        return CSSValueBlock;
    case ScrollSnapAxis::Inline:
        return CSSValueInline;
    case ScrollSnapAxis::Both:
        return CSSValueBoth;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr ScrollSnapAxis fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueX:
        return ScrollSnapAxis::XAxis;
    case CSSValueY:
        return ScrollSnapAxis::YAxis;
    case CSSValueBlock:
        return ScrollSnapAxis::Block;
    case CSSValueInline:
        return ScrollSnapAxis::Inline;
    case CSSValueBoth:
        return ScrollSnapAxis::Both;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return ScrollSnapAxis::Both;
}

#define TYPE ScrollSnapAxisAlignType
#define FOR_EACH(CASE) CASE(None) CASE(Start) CASE(Center) CASE(End)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ScrollSnapStop
#define FOR_EACH(CASE) CASE(Normal) CASE(Always)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ScrollbarWidth
#define FOR_EACH(CASE) CASE(Auto) CASE(Thin) CASE(None)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(TextEdgeType textEdgeType)
{
    switch (textEdgeType) {
    case TextEdgeType::Auto:
        return CSSValueAuto;
    case TextEdgeType::Leading:
        return CSSValueLeading;
    case TextEdgeType::Text:
        return CSSValueText;
    case TextEdgeType::CapHeight:
        return CSSValueCap;
    case TextEdgeType::ExHeight:
        return CSSValueEx;
    case TextEdgeType::Alphabetic:
        return CSSValueAlphabetic;
    case TextEdgeType::CJKIdeographic:
        return CSSValueIdeographic;
    case TextEdgeType::CJKIdeographicInk:
        return CSSValueIdeographicInk;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr TextEdgeType fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return TextEdgeType::Auto;
    case CSSValueLeading:
        return TextEdgeType::Leading;
    case CSSValueText:
        return TextEdgeType::Text;
    case CSSValueCap:
        return TextEdgeType::CapHeight;
    case CSSValueEx:
        return TextEdgeType::ExHeight;
    case CSSValueAlphabetic:
        return TextEdgeType::Alphabetic;
    case CSSValueIdeographic:
        return TextEdgeType::CJKIdeographic;
    case CSSValueIdeographicInk:
        return TextEdgeType::CJKIdeographicInk;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return TextEdgeType::Auto;
}

#if ENABLE(APPLE_PAY)

#define TYPE ApplePayButtonStyle
#define FOR_EACH(CASE) CASE(White) CASE(WhiteOutline) CASE(Black)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ApplePayButtonType
#if !ENABLE(APPLE_PAY_NEW_BUTTON_TYPES)
#define FOR_EACH(CASE) CASE(Plain) CASE(Buy) CASE(SetUp) CASE(Donate) CASE(CheckOut) CASE(Book) CASE(Subscribe)
#else
#define FOR_EACH(CASE) CASE(Plain) CASE(Buy) CASE(SetUp) CASE(Donate) CASE(CheckOut) CASE(Book) CASE(Subscribe) \
    CASE(Reload) CASE(AddMoney) CASE(TopUp) CASE(Order) CASE(Rent) CASE(Support) CASE(Contribute) CASE(Tip)
#endif
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#endif

constexpr CSSValueID toCSSValueID(FontVariantPosition position)
{
    switch (position) {
    case FontVariantPosition::Normal:
        return CSSValueNormal;
    case FontVariantPosition::Subscript:
        return CSSValueSub;
    case FontVariantPosition::Superscript:
        return CSSValueSuper;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FontVariantPosition fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNormal:
        return FontVariantPosition::Normal;
    case CSSValueSub:
        return FontVariantPosition::Subscript;
    case CSSValueSuper:
        return FontVariantPosition::Superscript;
    default:
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return FontVariantPosition::Normal;
    }
}

constexpr CSSValueID toCSSValueID(FontVariantCaps caps)
{
    switch (caps) {
    case FontVariantCaps::Normal:
        return CSSValueNormal;
    case FontVariantCaps::Small:
        return CSSValueSmallCaps;
    case FontVariantCaps::AllSmall:
        return CSSValueAllSmallCaps;
    case FontVariantCaps::Petite:
        return CSSValuePetiteCaps;
    case FontVariantCaps::AllPetite:
        return CSSValueAllPetiteCaps;
    case FontVariantCaps::Unicase:
        return CSSValueUnicase;
    case FontVariantCaps::Titling:
        return CSSValueTitlingCaps;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FontVariantCaps fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueNormal:
        return FontVariantCaps::Normal;
    case CSSValueSmallCaps:
        return FontVariantCaps::Small;
    case CSSValueAllSmallCaps:
        return FontVariantCaps::AllSmall;
    case CSSValuePetiteCaps:
        return FontVariantCaps::Petite;
    case CSSValueAllPetiteCaps:
        return FontVariantCaps::AllPetite;
    case CSSValueUnicase:
        return FontVariantCaps::Unicase;
    case CSSValueTitlingCaps:
        return FontVariantCaps::Titling;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FontVariantCaps::Normal;
}

#define TYPE FontVariantEmoji
#define FOR_EACH(CASE) CASE(Normal) CASE(Text) CASE(Emoji) CASE(Unicode)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

constexpr CSSValueID toCSSValueID(FontOpticalSizing sizing)
{
    switch (sizing) {
    case FontOpticalSizing::Enabled:
        return CSSValueAuto;
    case FontOpticalSizing::Disabled:
        return CSSValueNone;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return CSSValueInvalid;
}

template<> constexpr FontOpticalSizing fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueAuto:
        return FontOpticalSizing::Enabled;
    case CSSValueNone:
        return FontOpticalSizing::Disabled;
    default:
        break;
    }
    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return FontOpticalSizing::Enabled;
}

template<> constexpr FontTechnology fromCSSValueID(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueColorColrv0:
        return FontTechnology::ColorColrv0;
    case CSSValueColorColrv1:
        return FontTechnology::ColorColrv1;
    case CSSValueColorCbdt:
        return FontTechnology::ColorCbdt;
    case CSSValueColorSbix:
        return FontTechnology::ColorSbix;
    case CSSValueColorSvg:
        return FontTechnology::ColorSvg;
    case CSSValueFeaturesAat:
        return FontTechnology::FeaturesAat;
    case CSSValueFeaturesGraphite:
        return FontTechnology::FeaturesGraphite;
    case CSSValueFeaturesOpentype:
        return FontTechnology::FeaturesOpentype;
    case CSSValueIncremental:
        return FontTechnology::Incremental;
    case CSSValuePalettes:
        return FontTechnology::Palettes;
    case CSSValueVariations:
        return FontTechnology::Variations;
    default:
        break;
    }
    return FontTechnology::Invalid;
}

#define TYPE FontSynthesisLonghandValue
#define FOR_EACH(CASE) CASE(Auto) CASE(None)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE FontLoadingBehavior
#define FOR_EACH(CASE) CASE(Auto) CASE(Block) CASE(Swap) CASE(Fallback) CASE(Optional)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE MathStyle
#define FOR_EACH(CASE) CASE(Normal) CASE(Compact)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ContainerType
#define FOR_EACH(CASE) CASE(Normal) CASE(Size) CASE(InlineSize)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ContentVisibility
#define FOR_EACH(CASE) CASE(Visible) CASE(Hidden) CASE(Auto)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE ScrollAxis
#define FOR_EACH(CASE) CASE(Block) CASE(Inline) CASE(X) CASE(Y)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE QuoteType
#define FOR_EACH(CASE) CASE(OpenQuote) CASE(CloseQuote) CASE(NoOpenQuote) CASE(NoCloseQuote)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE OverflowContinue
#define FOR_EACH(CASE) CASE(Auto) CASE(Discard)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE Style::PositionTryOrder
#define FOR_EACH(CASE) CASE(Normal) CASE(MostWidth) CASE(MostHeight) CASE(MostBlockSize) CASE(MostInlineSize)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#define TYPE PositionTryFallback::Tactic
#define FOR_EACH(CASE) CASE(FlipBlock) CASE(FlipInline) CASE(FlipStart)
DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS
#undef TYPE
#undef FOR_EACH

#undef EMIT_TO_CSS_SWITCH_CASE
#undef EMIT_FROM_CSS_SWITCH_CASE
#undef DEFINE_TO_FROM_CSS_VALUE_ID_FUNCTIONS

}
