/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Graham Dennis (graham.dennis@gmail.com)
 * Copyright (C) 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
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

#include <initializer_list>
#include <optional>

namespace WTF {
class TextStream;
}

namespace WebCore {

enum class DumpStyleValues {
    All,
    NonInitial,
};

enum class PrintColorAdjust : bool {
    Economy,
    Exact
};

// The difference between two styles.  The following values are used:
// - StyleDifference::Equal - The two styles are identical
// - StyleDifference::RecompositeLayer - The layer needs its position and transform updated, but no repaint
// - StyleDifference::Repaint - The object just needs to be repainted.
// - StyleDifference::RepaintIfText - The object needs to be repainted if it contains text.
// - StyleDifference::RepaintLayer - The layer and its descendant layers needs to be repainted.
// - StyleDifference::LayoutPositionedMovementOnly - Only the position of this positioned object has been updated
// - StyleDifference::SimplifiedLayout - Only overflow needs to be recomputed
// - StyleDifference::SimplifiedLayoutAndPositionedMovement - Both positioned movement and simplified layout updates are required.
// - StyleDifference::Layout - A full layout is required.
enum class StyleDifference : uint8_t {
    Equal,
    RecompositeLayer,
    Repaint,
    RepaintIfText,
    RepaintLayer,
    LayoutPositionedMovementOnly,
    SimplifiedLayout,
    SimplifiedLayoutAndPositionedMovement,
    Layout,
    NewStyle
};

// When some style properties change, different amounts of work have to be done depending on
// context (e.g. whether the property is changing on an element which has a compositing layer).
// A simple StyleDifference does not provide enough information so we return a bit mask of
// StyleDifferenceContextSensitiveProperties from RenderStyle::diff() too.
enum class StyleDifferenceContextSensitiveProperty : uint8_t {
    Transform   = 1 << 0,
    Opacity     = 1 << 1,
    Filter      = 1 << 2,
    ClipRect    = 1 << 3,
    ClipPath    = 1 << 4,
    WillChange  = 1 << 5,
};

// Static pseudo styles. Dynamic ones are produced on the fly.
enum class PseudoId : uint32_t {
    // The order must be None, public IDs, and then internal IDs.
    None,

    // Public:
    FirstLine,
    FirstLetter,
    GrammarError,
    Highlight,
    Marker,
    Before,
    After,
    Selection,
    Backdrop,
    WebKitScrollbar,
    SpellingError,
    TargetText,
    ViewTransition,
    ViewTransitionGroup,
    ViewTransitionImagePair,
    ViewTransitionOld,
    ViewTransitionNew,

    // Internal:
    WebKitScrollbarThumb,
    WebKitScrollbarButton,
    WebKitScrollbarTrack,
    WebKitScrollbarTrackPiece,
    WebKitScrollbarCorner,
    WebKitResizer,
    InternalWritingSuggestions,

    AfterLastInternalPseudoId,

    FirstPublicPseudoId = FirstLine,
    FirstInternalPseudoId = WebKitScrollbarThumb,
    PublicPseudoIdMask = ((1 << FirstInternalPseudoId) - 1) & ~((1 << FirstPublicPseudoId) - 1)
};

inline std::optional<PseudoId> parentPseudoElement(PseudoId pseudoId)
{
    switch (pseudoId) {
    case PseudoId::FirstLetter: return PseudoId::FirstLine;
    case PseudoId::ViewTransitionGroup: return PseudoId::ViewTransition;
    case PseudoId::ViewTransitionImagePair: return PseudoId::ViewTransitionGroup;
    case PseudoId::ViewTransitionNew: return PseudoId::ViewTransitionImagePair;
    case PseudoId::ViewTransitionOld: return PseudoId::ViewTransitionImagePair;
    default: return std::nullopt;
    }
}

class PseudoIdSet {
public:
    PseudoIdSet()
        : m_data(0)
    {
    }

    PseudoIdSet(std::initializer_list<PseudoId> initializerList)
        : m_data(0)
    {
        for (PseudoId pseudoId : initializerList)
            add(pseudoId);
    }

    static PseudoIdSet fromMask(unsigned rawPseudoIdSet)
    {
        return PseudoIdSet(rawPseudoIdSet);
    }

    bool has(PseudoId pseudoId) const
    {
        ASSERT((sizeof(m_data) * 8) > static_cast<unsigned>(pseudoId));
        return m_data & (1U << static_cast<unsigned>(pseudoId));
    }

    void add(PseudoId pseudoId)
    {
        ASSERT((sizeof(m_data) * 8) > static_cast<unsigned>(pseudoId));
        m_data |= (1U << static_cast<unsigned>(pseudoId));
    }

    void remove(PseudoId pseudoId)
    {
        ASSERT((sizeof(m_data) * 8) > static_cast<unsigned>(pseudoId));
        m_data &= ~(1U << static_cast<unsigned>(pseudoId));
    }

    void merge(PseudoIdSet source)
    {
        m_data |= source.m_data;
    }

    PseudoIdSet operator &(const PseudoIdSet& pseudoIdSet) const
    {
        return PseudoIdSet(m_data & pseudoIdSet.m_data);
    }

    PseudoIdSet operator |(const PseudoIdSet& pseudoIdSet) const
    {
        return PseudoIdSet(m_data | pseudoIdSet.m_data);
    }

    explicit operator bool() const
    {
        return m_data;
    }

    unsigned data() const { return m_data; }

    static constexpr ptrdiff_t dataMemoryOffset() { return OBJECT_OFFSETOF(PseudoIdSet, m_data); }

private:
    explicit PseudoIdSet(unsigned rawPseudoIdSet)
        : m_data(rawPseudoIdSet)
    {
    }

    unsigned m_data;
};

enum class ColumnFill : bool {
    Balance,
    Auto
};

enum class ColumnSpan : bool {
    None,
    All
};

enum class BorderCollapse : bool {
    Separate,
    Collapse
};

// These have been defined in the order of their precedence for border-collapsing. Do
// not change this order! This order also must match the order in CSSValueKeywords.in.
enum class BorderStyle : uint8_t {
    None,
    Hidden,
    Inset,
    Groove,
    Outset,
    Ridge,
    Dotted,
    Dashed,
    Solid,
    Double
};

enum class BorderPrecedence : uint8_t {
    Off,
    Table,
    ColumnGroup,
    Column,
    RowGroup,
    Row,
    Cell
};

enum class OutlineIsAuto : bool {
    Off,
    On
};

enum class PositionType : uint8_t {
    Static = 0,
    Relative = 1,
    Absolute = 2,
    Sticky = 3,
    // This value is required to pack our bits efficiently in RenderObject.
    Fixed = 6
};

enum class Float : uint8_t {
    None,
    Left,
    Right,
    InlineStart,
    InlineEnd,
};

enum class UsedFloat : uint8_t {
    None  = 1 << 0,
    Left  = 1 << 1,
    Right = 1 << 2
};

// Box decoration attributes. Not inherited.

enum class BoxDecorationBreak : bool {
    Slice,
    Clone
};

// Box attributes. Not inherited.

enum class BoxSizing : bool {
    ContentBox,
    BorderBox
};

// Random visual rendering model attributes. Not inherited.

enum class Overflow : uint8_t {
    Visible,
    Hidden,
    Clip,
    Scroll,
    Auto,
    PagedX,
    PagedY
};

enum class VerticalAlign : uint8_t {
    Baseline,
    Middle,
    Sub,
    Super,
    TextTop,
    TextBottom,
    Top,
    Bottom,
    BaselineMiddle,
    Length
};

enum class Clear : uint8_t {
    None,
    Left,
    Right,
    InlineStart,
    InlineEnd,
    Both
};

enum class UsedClear : uint8_t {
    None,
    Left,
    Right,
    Both
};

enum class TableLayoutType : bool {
    Auto,
    Fixed
};

enum class TextCombine : bool {
    None,
    All
};

enum class FillAttachment : uint8_t {
    ScrollBackground,
    LocalBackground,
    FixedBackground
};

enum class FillBox : uint8_t {
    BorderBox,
    PaddingBox,
    ContentBox,
    BorderArea,
    Text,
    NoClip
};

enum class FillRepeat : uint8_t {
    Repeat,
    NoRepeat,
    Round,
    Space
};

enum class FillLayerType : bool {
    Background,
    Mask
};

// CSS3 Background Values
enum class FillSizeType : uint8_t {
    Contain,
    Cover,
    Size,
    None
};

// CSS3 <position>
enum class Edge : uint8_t {
    Top,
    Right,
    Bottom,
    Left
};

// CSS3 Mask Mode

enum class MaskMode : uint8_t {
    Alpha,
    Luminance,
    MatchSource,
};

// CSS3 Marquee Properties

enum class MarqueeBehavior : uint8_t {
    None,
    Scroll,
    Slide,
    Alternate
};

enum class MarqueeDirection : uint8_t {
    Auto,
    Left,
    Right,
    Up,
    Down,
    Forward,
    Backward
};

// Deprecated Flexible Box Properties

enum class BoxPack : uint8_t {
    Start,
    Center,
    End,
    Justify
};

enum class BoxAlignment : uint8_t {
    Stretch,
    Start,
    Center,
    End,
    Baseline
};

enum class BoxOrient : bool {
    Horizontal,
    Vertical
};

enum class BoxLines : bool {
    Single,
    Multiple
};

enum class BoxDirection : bool {
    Normal,
    Reverse
};

// CSS3 Flexbox Properties

enum class FlexDirection : uint8_t {
    Row,
    RowReverse,
    Column,
    ColumnReverse
};

enum class FlexWrap : uint8_t {
    NoWrap,
    Wrap,
    Reverse
};

enum class ItemPosition : uint8_t {
    Legacy,
    Auto,
    Normal,
    Stretch,
    Baseline,
    LastBaseline,
    Center,
    Start,
    End,
    SelfStart,
    SelfEnd,
    FlexStart,
    FlexEnd,
    Left,
    Right,
    AnchorCenter,
};

enum class OverflowAlignment : uint8_t {
    Default,
    Unsafe,
    Safe
};

enum class ItemPositionType : bool {
    NonLegacy,
    Legacy
};

enum class ContentPosition : uint8_t {
    Normal,
    Baseline,
    LastBaseline,
    Center,
    Start,
    End,
    FlexStart,
    FlexEnd,
    Left,
    Right
};

enum class ContentDistribution : uint8_t {
    Default,
    SpaceBetween,
    SpaceAround,
    SpaceEvenly,
    Stretch
};


enum class TextSecurity : uint8_t {
    None,
    Disc,
    Circle,
    Square
};

enum class InputSecurity : bool {
    Auto,
    None
};

// CSS3 User Modify Properties

enum class UserModify : uint8_t {
    ReadOnly,
    ReadWrite,
    ReadWritePlaintextOnly
};

// CSS3 User Drag Values

enum class UserDrag : uint8_t {
    Auto,
    None,
    Element
};

// CSS3 User Select Values

enum class UserSelect : uint8_t {
    None,
    Text,
    All
};

// CSS3 Image Values
enum class ObjectFit : uint8_t {
    Fill,
    Contain,
    Cover,
    None,
    ScaleDown
};

enum class AspectRatioType : uint8_t {
    Auto,
    Ratio,
    AutoAndRatio,
    AutoZero
};

enum class WordBreak : uint8_t {
    Normal,
    BreakAll,
    KeepAll,
    BreakWord,
    AutoPhrase
};

enum class OverflowWrap : uint8_t {
    Normal,
    BreakWord,
    Anywhere
};

enum class NBSPMode : bool {
    Normal,
    Space
};

enum class LineBreak : uint8_t {
    Auto,
    Loose,
    Normal,
    Strict,
    AfterWhiteSpace,
    Anywhere
};

enum class Resize : uint8_t {
    None,
    Both,
    Horizontal,
    Vertical,
    Block,
    Inline,
};

enum class QuoteType : uint8_t {
    OpenQuote,
    CloseQuote,
    NoOpenQuote,
    NoCloseQuote
};

enum class AnimationFillMode : uint8_t {
    None,
    Forwards,
    Backwards,
    Both
};

enum class AnimationPlayState : bool {
    Playing,
    Paused
};

enum class WhiteSpace : uint8_t {
    Normal,
    Pre,
    PreWrap,
    PreLine,
    NoWrap,
    BreakSpaces
};

enum class WhiteSpaceCollapse : uint8_t {
    Collapse,
    Preserve,
    PreserveBreaks,
    BreakSpaces
};

enum class ReflectionDirection : uint8_t {
    Below,
    Above,
    Left,
    Right
};

// The order of this enum must match the order of the text align values in CSSValueKeywords.in.
enum class TextAlignMode : uint8_t {
    Left,
    Right,
    Center,
    Justify,
    WebKitLeft,
    WebKitRight,
    WebKitCenter,
    Start,
    End,
};

enum class TextTransform : uint8_t {
    Capitalize    = 1 << 0,
    Uppercase     = 1 << 1,
    Lowercase     = 1 << 2,
    FullSizeKana  = 1 << 3,
    FullWidth     = 1 << 4,
};
constexpr auto maxTextTransformValue = TextTransform::FullWidth;

enum class TextDecorationLine : uint8_t {
    Underline     = 1 << 0,
    Overline      = 1 << 1,
    LineThrough   = 1 << 2,
    Blink         = 1 << 3,
};
constexpr auto maxTextDecorationLineValue = TextDecorationLine::Blink;

enum class TextDecorationStyle : uint8_t {
    Solid,
    Double,
    Dotted,
    Dashed,
    Wavy
};

enum class TextAlignLast : uint8_t {
    Auto,
    Start,
    End,
    Left,
    Right,
    Center,
    Justify
};

enum class TextJustify : uint8_t {
    Auto,
    None,
    InterWord,
    InterCharacter
};

enum class TextDecorationSkipInk : uint8_t {
    None,
    Auto,
    All
};

enum class TextGroupAlign : uint8_t {
    None,
    Start,
    End,
    Left,
    Right,
    Center
};

enum class TextBoxTrim : uint8_t {
    None,
    TrimStart,
    TrimEnd,
    TrimBoth
};

enum class MarginTrimType : uint8_t {
    BlockStart = 1 << 0,
    BlockEnd = 1 << 1,
    InlineStart = 1 << 2,
    InlineEnd = 1 << 3
};

enum class TextEdgeType : uint8_t {
    // Note that TextEdgeType is shared between text-box-edge and line-fit-edge,
    // where text-box-edge's default value is auto, and line-fit-edge has leading.
    Auto,
    Leading,
    Text,
    CapHeight,
    ExHeight,
    Alphabetic,
    CJKIdeographic,
    CJKIdeographicInk
};

enum class TextZoom : bool {
    Normal,
    Reset
};

enum class BreakBetween : uint8_t {
    Auto,
    Avoid,
    AvoidColumn,
    AvoidPage,
    Column,
    Page,
    LeftPage,
    RightPage,
    RectoPage,
    VersoPage
};
bool alwaysPageBreak(BreakBetween);
    
enum class BreakInside : uint8_t {
    Auto,
    Avoid,
    AvoidColumn,
    AvoidPage
};

enum class HangingPunctuation : uint8_t {
    First     = 1 << 0,
    Last      = 1 << 1,
    AllowEnd  = 1 << 2,
    ForceEnd  = 1 << 3
};

enum class EmptyCell : bool {
    Show,
    Hide
};

enum class CaptionSide : uint8_t {
    Top,
    Bottom
};

enum class ListStylePosition : bool {
    Outside,
    Inside
};

enum class Visibility : uint8_t {
    Visible,
    Hidden,
    Collapse
};

enum class CursorType : uint8_t {
    // The following must match the order in CSSValueKeywords.in.
    Auto,
    Default,
    // None
    ContextMenu,
    Help,
    Pointer,
    Progress,
    Wait,
    Cell,
    Crosshair,
    Text,
    VerticalText,
    Alias,
    // Copy
    Move,
    NoDrop,
    NotAllowed,
    Grab,
    Grabbing,
    EResize,
    NResize,
    NEResize,
    NWResize,
    SResize,
    SEResize,
    SWResize,
    WResize,
    EWResize,
    NSResize,
    NESWResize,
    NWSEResize,
    ColumnResize,
    RowResize,
    AllScroll,
    ZoomIn,
    ZoomOut,

    // The following are handled as exceptions so don't need to match.
    Copy,
    None
};

#if ENABLE(CURSOR_VISIBILITY)
enum class CursorVisibility : bool {
    Auto,
    AutoHide,
};
#endif

enum class DisplayType : uint8_t {
    Inline,
    Block,
    ListItem,
    InlineBlock,
    Table,
    InlineTable,
    TableRowGroup,
    TableHeaderGroup,
    TableFooterGroup,
    TableRow,
    TableColumnGroup,
    TableColumn,
    TableCell,
    TableCaption,
    Box,
    InlineBox,
    Flex,
    InlineFlex,
    Contents,
    Grid,
    InlineGrid,
    FlowRoot,
    Ruby,
    RubyBlock,
    RubyBase,
    RubyAnnotation,
    None
};

enum class InsideLink : uint8_t {
    NotInside,
    InsideUnvisited,
    InsideVisited
};
    
enum class PointerEvents : uint8_t {
    None,
    Auto,
    Stroke,
    Fill,
    Painted,
    Visible,
    VisibleStroke,
    VisibleFill,
    VisiblePainted,
    BoundingBox,
    All
};

enum class TransformStyle3D : uint8_t {
    Flat,
    Preserve3D,
#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    Separated
#endif
};

enum class BackfaceVisibility : uint8_t {
    Visible,
    Hidden
};

enum class TransformBox : uint8_t {
    StrokeBox,
    ContentBox,
    BorderBox,
    FillBox,
    ViewBox
};

enum class LineClamp : bool {
    LineCount,
    Percentage
};

enum class OverflowContinue : bool {
    Auto,
    Discard
};

enum class Hyphens : uint8_t {
    None,
    Manual,
    Auto
};

enum class SpeakAs : uint8_t {
    SpellOut           = 1 << 0,
    Digits             = 1 << 1,
    LiteralPunctuation = 1 << 2,
    NoPunctuation      = 1 << 3
};

enum class TextEmphasisFill : bool {
    Filled,
    Open
};

enum class TextEmphasisMark : uint8_t {
    None,
    Auto,
    Dot,
    Circle,
    DoubleCircle,
    Triangle,
    Sesame,
    Custom
};

enum class TextEmphasisPosition : uint8_t {
    Over  = 1 << 0,
    Under = 1 << 1,
    Left  = 1 << 2,
    Right = 1 << 3
};

enum class TextUnderlinePosition : uint8_t {
    Under    = 1 << 0,
    FromFont = 1 << 1,
    Left     = 1 << 2,
    Right    = 1 << 3
};

enum class TextOverflow : bool {
    Clip,
    Ellipsis
};

enum class TextWrapMode : bool {
    Wrap,
    NoWrap
};

enum class TextWrapStyle : uint8_t {
    Auto,
    Balance,
    Pretty,
    Stable
};

enum class ImageRendering : uint8_t {
    Auto = 0,
    OptimizeSpeed,
    OptimizeQuality,
    CrispEdges,
    Pixelated
};

enum class Order : bool {
    Logical,
    Visual
};

enum class ColumnAxis : uint8_t {
    Horizontal,
    Vertical,
    Auto
};

enum class ColumnProgression : bool {
    Normal,
    Reverse
};

enum class LineSnap : uint8_t {
    None,
    Baseline,
    Contain
};

enum class LineAlign : bool {
    None,
    Edges
};

enum class RubyPosition : uint8_t {
    Over,
    Under,
    InterCharacter,
    LegacyInterCharacter
};

enum class RubyAlign : uint8_t {
    Start,
    Center,
    SpaceBetween,
    SpaceAround
};

enum class RubyOverhang : bool {
    Auto,
    None
};

#if ENABLE(DARK_MODE_CSS)
enum class ColorScheme : uint8_t {
    Light = 1 << 0,
    Dark = 1 << 1
};

constexpr size_t ColorSchemeBits = 2;
#endif

constexpr size_t GridAutoFlowBits = 4;
enum InternalGridAutoFlow : uint8_t {
    InternalAutoFlowAlgorithmSparse = 1 << 0,
    InternalAutoFlowAlgorithmDense  = 1 << 1,
    InternalAutoFlowDirectionRow    = 1 << 2,
    InternalAutoFlowDirectionColumn = 1 << 3
};

enum GridAutoFlow : uint8_t {
    AutoFlowRow = InternalAutoFlowAlgorithmSparse | InternalAutoFlowDirectionRow,
    AutoFlowColumn = InternalAutoFlowAlgorithmSparse | InternalAutoFlowDirectionColumn,
    AutoFlowRowDense = InternalAutoFlowAlgorithmDense | InternalAutoFlowDirectionRow,
    AutoFlowColumnDense = InternalAutoFlowAlgorithmDense | InternalAutoFlowDirectionColumn
};

enum class MasonryAutoFlowPlacementAlgorithm {
    Pack,
    Next
};

enum class MasonryAutoFlowPlacementOrder {
    DefiniteFirst,
    Ordered
};

enum class AutoRepeatType : uint8_t {
    None,
    Fill,
    Fit
};

#if USE(FREETYPE)
// The maximum allowed font size is 32767 because `hb_position_t` is `int32_t`,
// where the first 16 bits are used to represent the integer part which effectively makes it `signed short`
constexpr float maximumAllowedFontSize = std::numeric_limits<short>::max();
#else
// Reasonable maximum to prevent insane font sizes from causing crashes on some platforms (such as Windows).
constexpr float maximumAllowedFontSize = 1000000.0f;
#endif

enum class TextIndentLine : bool {
    FirstLine,
    EachLine
};

enum class TextIndentType : bool {
    Normal,
    Hanging
};

enum class Isolation : bool {
    Auto,
    Isolate
};

// Fill, Stroke, ViewBox are just used for SVG.
enum class CSSBoxType : uint8_t {
    BoxMissing = 0,
    MarginBox,
    BorderBox,
    PaddingBox,
    ContentBox,
    FillBox,
    StrokeBox,
    ViewBox
};

enum class ScrollSnapStrictness : uint8_t {
    None,
    Proximity,
    Mandatory
};

enum class ScrollSnapAxis : uint8_t {
    XAxis,
    YAxis,
    Block,
    Inline,
    Both
};

enum class ScrollSnapAxisAlignType : uint8_t {
    None,
    Start,
    Center,
    End
};

enum class ScrollSnapStop : bool {
    Normal,
    Always,
};

// These are all minimized combinations of paint-order.
enum class PaintOrder : uint8_t {
    Normal,
    Fill,
    FillMarkers,
    Stroke,
    StrokeMarkers,
    Markers,
    MarkersStroke
};

enum class PaintType : uint8_t {
    Fill,
    Stroke,
    Markers
};

enum class FontLoadingBehavior : uint8_t {
    Auto,
    Block,
    Swap,
    Fallback,
    Optional
};

enum class EventListenerRegionType : uint8_t {
    Wheel           = 1 << 0,
    NonPassiveWheel = 1 << 1,
    MouseClick      = 1 << 2,
};

enum class MathStyle : bool {
    Normal,
    Compact,
};

enum class Containment : uint8_t {
    Layout      = 1 << 0,
    Paint       = 1 << 1,
    Size        = 1 << 2,
    InlineSize  = 1 << 3,
    Style       = 1 << 4,
};

enum class ContainerType : uint8_t {
    Normal,
    Size,
    InlineSize,
};

enum class ContainIntrinsicSizeType : uint8_t {
    None,
    Length,
    AutoAndLength,
    AutoAndNone,
};

enum class ContentVisibility : uint8_t {
    Visible,
    Auto,
    Hidden,
};

enum class BlockStepAlign : uint8_t {
    Auto,
    Center,
    Start,
    End
};

enum class BlockStepInsert : uint8_t {
    MarginBox,
    PaddingBox,
    ContentBox
};

enum class BlockStepRound : uint8_t {
    Up,
    Down,
    Nearest
};

enum class FieldSizing : bool {
    Fixed,
    Content
};

CSSBoxType transformBoxToCSSBoxType(TransformBox);

constexpr float defaultMiterLimit = 4;

WTF::TextStream& operator<<(WTF::TextStream&, AnimationFillMode);
WTF::TextStream& operator<<(WTF::TextStream&, AnimationPlayState);
WTF::TextStream& operator<<(WTF::TextStream&, AspectRatioType);
WTF::TextStream& operator<<(WTF::TextStream&, AutoRepeatType);
WTF::TextStream& operator<<(WTF::TextStream&, BackfaceVisibility);
WTF::TextStream& operator<<(WTF::TextStream&, BlockStepAlign);
WTF::TextStream& operator<<(WTF::TextStream&, BlockStepInsert);
WTF::TextStream& operator<<(WTF::TextStream&, BlockStepRound);
WTF::TextStream& operator<<(WTF::TextStream&, BorderCollapse);
WTF::TextStream& operator<<(WTF::TextStream&, BorderStyle);
WTF::TextStream& operator<<(WTF::TextStream&, BoxAlignment);
WTF::TextStream& operator<<(WTF::TextStream&, BoxDecorationBreak);
WTF::TextStream& operator<<(WTF::TextStream&, BoxDirection);
WTF::TextStream& operator<<(WTF::TextStream&, BoxLines);
WTF::TextStream& operator<<(WTF::TextStream&, BoxOrient);
WTF::TextStream& operator<<(WTF::TextStream&, BoxPack);
WTF::TextStream& operator<<(WTF::TextStream&, BoxSizing);
WTF::TextStream& operator<<(WTF::TextStream&, BreakBetween);
WTF::TextStream& operator<<(WTF::TextStream&, BreakInside);
WTF::TextStream& operator<<(WTF::TextStream&, CSSBoxType);
WTF::TextStream& operator<<(WTF::TextStream&, CaptionSide);
WTF::TextStream& operator<<(WTF::TextStream&, Clear);
WTF::TextStream& operator<<(WTF::TextStream&, UsedClear);
#if ENABLE(DARK_MODE_CSS)
WTF::TextStream& operator<<(WTF::TextStream&, ColorScheme);
#endif
WTF::TextStream& operator<<(WTF::TextStream&, ColumnAxis);
WTF::TextStream& operator<<(WTF::TextStream&, ColumnFill);
WTF::TextStream& operator<<(WTF::TextStream&, ColumnProgression);
WTF::TextStream& operator<<(WTF::TextStream&, ColumnSpan);
WTF::TextStream& operator<<(WTF::TextStream&, ContentDistribution);
WTF::TextStream& operator<<(WTF::TextStream&, ContentPosition);
WTF::TextStream& operator<<(WTF::TextStream&, ContentVisibility);
WTF::TextStream& operator<<(WTF::TextStream&, CursorType);
#if ENABLE(CURSOR_VISIBILITY)
WTF::TextStream& operator<<(WTF::TextStream&, CursorVisibility);
#endif
WTF::TextStream& operator<<(WTF::TextStream&, DisplayType);
WTF::TextStream& operator<<(WTF::TextStream&, Edge);
WTF::TextStream& operator<<(WTF::TextStream&, EmptyCell);
WTF::TextStream& operator<<(WTF::TextStream&, EventListenerRegionType);
WTF::TextStream& operator<<(WTF::TextStream&, FillAttachment);
WTF::TextStream& operator<<(WTF::TextStream&, FillBox);
WTF::TextStream& operator<<(WTF::TextStream&, FillRepeat);
WTF::TextStream& operator<<(WTF::TextStream&, FillSizeType);
WTF::TextStream& operator<<(WTF::TextStream&, FlexDirection);
WTF::TextStream& operator<<(WTF::TextStream&, FlexWrap);
WTF::TextStream& operator<<(WTF::TextStream&, Float);
WTF::TextStream& operator<<(WTF::TextStream&, UsedFloat);
WTF::TextStream& operator<<(WTF::TextStream&, GridAutoFlow);
WTF::TextStream& operator<<(WTF::TextStream&, HangingPunctuation);
WTF::TextStream& operator<<(WTF::TextStream&, Hyphens);
WTF::TextStream& operator<<(WTF::TextStream&, ImageRendering);
WTF::TextStream& operator<<(WTF::TextStream&, InsideLink);
WTF::TextStream& operator<<(WTF::TextStream&, Isolation);
WTF::TextStream& operator<<(WTF::TextStream&, ItemPosition);
WTF::TextStream& operator<<(WTF::TextStream&, ItemPositionType);
WTF::TextStream& operator<<(WTF::TextStream&, LineAlign);
WTF::TextStream& operator<<(WTF::TextStream&, LineBreak);
WTF::TextStream& operator<<(WTF::TextStream&, LineSnap);
WTF::TextStream& operator<<(WTF::TextStream&, ListStylePosition);
WTF::TextStream& operator<<(WTF::TextStream&, MarginTrimType);
WTF::TextStream& operator<<(WTF::TextStream&, MarqueeBehavior);
WTF::TextStream& operator<<(WTF::TextStream&, MarqueeDirection);
WTF::TextStream& operator<<(WTF::TextStream&, MaskMode);
WTF::TextStream& operator<<(WTF::TextStream&, NBSPMode);
WTF::TextStream& operator<<(WTF::TextStream&, ObjectFit);
WTF::TextStream& operator<<(WTF::TextStream&, Order);
WTF::TextStream& operator<<(WTF::TextStream&, WebCore::Overflow);
WTF::TextStream& operator<<(WTF::TextStream&, OverflowAlignment);
WTF::TextStream& operator<<(WTF::TextStream&, OverflowWrap);
WTF::TextStream& operator<<(WTF::TextStream&, PaintOrder);
WTF::TextStream& operator<<(WTF::TextStream&, PointerEvents);
WTF::TextStream& operator<<(WTF::TextStream&, PositionType);
WTF::TextStream& operator<<(WTF::TextStream&, PrintColorAdjust);
WTF::TextStream& operator<<(WTF::TextStream&, PseudoId);
WTF::TextStream& operator<<(WTF::TextStream&, QuoteType);
WTF::TextStream& operator<<(WTF::TextStream&, ReflectionDirection);
WTF::TextStream& operator<<(WTF::TextStream&, Resize);
WTF::TextStream& operator<<(WTF::TextStream&, RubyPosition);
WTF::TextStream& operator<<(WTF::TextStream&, RubyAlign);
WTF::TextStream& operator<<(WTF::TextStream&, RubyOverhang);
WTF::TextStream& operator<<(WTF::TextStream&, ScrollSnapAxis);
WTF::TextStream& operator<<(WTF::TextStream&, ScrollSnapAxisAlignType);
WTF::TextStream& operator<<(WTF::TextStream&, ScrollSnapStop);
WTF::TextStream& operator<<(WTF::TextStream&, ScrollSnapStrictness);
WTF::TextStream& operator<<(WTF::TextStream&, SpeakAs);
WTF::TextStream& operator<<(WTF::TextStream&, StyleDifference);
WTF::TextStream& operator<<(WTF::TextStream&, StyleDifferenceContextSensitiveProperty);
WTF::TextStream& operator<<(WTF::TextStream&, TableLayoutType);
WTF::TextStream& operator<<(WTF::TextStream&, TextAlignMode);
WTF::TextStream& operator<<(WTF::TextStream&, TextAlignLast);
WTF::TextStream& operator<<(WTF::TextStream&, TextCombine);
WTF::TextStream& operator<<(WTF::TextStream&, TextDecorationLine);
WTF::TextStream& operator<<(WTF::TextStream&, TextDecorationSkipInk);
WTF::TextStream& operator<<(WTF::TextStream&, TextDecorationStyle);
WTF::TextStream& operator<<(WTF::TextStream&, TextEmphasisFill);
WTF::TextStream& operator<<(WTF::TextStream&, TextEmphasisMark);
WTF::TextStream& operator<<(WTF::TextStream&, TextEmphasisPosition);
WTF::TextStream& operator<<(WTF::TextStream&, TextGroupAlign);
WTF::TextStream& operator<<(WTF::TextStream&, TextJustify);
WTF::TextStream& operator<<(WTF::TextStream&, TextOverflow);
WTF::TextStream& operator<<(WTF::TextStream&, TextSecurity);
WTF::TextStream& operator<<(WTF::TextStream&, TextTransform);
WTF::TextStream& operator<<(WTF::TextStream&, TextUnderlinePosition);
WTF::TextStream& operator<<(WTF::TextStream&, TextWrapMode);
WTF::TextStream& operator<<(WTF::TextStream&, TextWrapStyle);
WTF::TextStream& operator<<(WTF::TextStream&, TextBoxTrim);
WTF::TextStream& operator<<(WTF::TextStream&, TextEdgeType);
WTF::TextStream& operator<<(WTF::TextStream&, TextZoom);
WTF::TextStream& operator<<(WTF::TextStream&, TransformBox);
WTF::TextStream& operator<<(WTF::TextStream&, TransformStyle3D);
WTF::TextStream& operator<<(WTF::TextStream&, UserDrag);
WTF::TextStream& operator<<(WTF::TextStream&, UserModify);
WTF::TextStream& operator<<(WTF::TextStream&, UserSelect);
WTF::TextStream& operator<<(WTF::TextStream&, VerticalAlign);
WTF::TextStream& operator<<(WTF::TextStream&, Visibility);
WTF::TextStream& operator<<(WTF::TextStream&, WhiteSpace);
WTF::TextStream& operator<<(WTF::TextStream&, WhiteSpaceCollapse);
WTF::TextStream& operator<<(WTF::TextStream&, WordBreak);
WTF::TextStream& operator<<(WTF::TextStream&, MathStyle);
WTF::TextStream& operator<<(WTF::TextStream&, ContainIntrinsicSizeType);
WTF::TextStream& operator<<(WTF::TextStream&, FieldSizing);
WTF::TextStream& operator<<(WTF::TextStream&, OverflowContinue);

} // namespace WebCore
