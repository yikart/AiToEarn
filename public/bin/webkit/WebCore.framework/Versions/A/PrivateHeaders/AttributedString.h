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

#import "Color.h"
#import "TextAttachmentForSerialization.h"
#import <wtf/ObjectIdentifier.h>
#import <wtf/RetainPtr.h>
#import <wtf/URL.h>
#import <wtf/Vector.h>

#if PLATFORM(MAC)
#define PlatformColor                   NSColor
#define PlatformColorClass              NSColor.class
#define PlatformFont                    NSFont
#define PlatformFontClass               NSFont.class
#define PlatformImageClass              NSImage
#define PlatformNSColorClass            NSColor
#define PlatformNSParagraphStyle        NSParagraphStyle.class
#define PlatformNSPresentationIntent    NSPresentationIntent.class
#define PlatformNSShadow                NSShadow.class
#define PlatformNSTextAttachment        NSTextAttachment.class
#define PlatformNSTextList              NSTextList.class
#define PlatformNSTextTab               NSTextTab
#define PlatformNSTextTable             NSTextTable
#define PlatformNSTextTableBlock        NSTextTableBlock.class
#else
#define PlatformColor                   UIColor
#define PlatformColorClass              PAL::getUIColorClass()
#define PlatformFont                    UIFont
#define PlatformFontClass               PAL::getUIFontClass()
#define PlatformImageClass              PAL::getUIImageClass()
#define PlatformNSColorClass            getNSColorClass()
#define PlatformNSParagraphStyle        PAL::getNSParagraphStyleClass()
#define PlatformNSPresentationIntent    PAL::getNSPresentationIntentClass()
#define PlatformNSShadow                PAL::getNSShadowClass()
#define PlatformNSTextAttachment        getNSTextAttachmentClass()
#define PlatformNSTextList              getNSTextListClass()
#define PlatformNSTextTab               getNSTextTabClass()
#define PlatformNSTextTable             getNSTextTableClass()
#define PlatformNSTextTableBlock        getNSTextTableBlockClass()
#endif

OBJC_CLASS NSAttributedString;
OBJC_CLASS NSDate;
OBJC_CLASS NSDictionary;
OBJC_CLASS NSParagraphStyle;
OBJC_CLASS NSPresentationIntent;
OBJC_CLASS NSShadow;
OBJC_CLASS NSTextAttachment;
OBJC_CLASS PlatformColor;

namespace WebCore {

class Font;

struct AttributedStringTextTableIDType;
using AttributedStringTextTableID = ObjectIdentifier<AttributedStringTextTableIDType>;

struct AttributedStringTextTableBlockIDType;
using AttributedStringTextTableBlockID = ObjectIdentifier<AttributedStringTextTableBlockIDType>;

struct AttributedStringTextListIDType;
using AttributedStringTextListID = ObjectIdentifier<AttributedStringTextListIDType>;

enum class TextTableLayoutAlgorithm : bool {
    Automatic,
    Fixed
};

enum class TextTableBlockVerticalAlignment : uint8_t {
    Top,
    Middle,
    Bottom,
    Baseline,
};

enum class ParagraphStyleAlignment : uint8_t {
    Natural,
    Left,
    Right,
    Centre,
    Justified,
};

enum class ParagraphStyleWritingDirection: uint8_t {
    Natural,
    LeftToRight,
    RightToLeft,
};

struct ParagraphStyleTextList {
    AttributedStringTextListID thisID;
    String markerFormat;
    long startingItemNumber { 0 };
};

struct ParagraphStyleCommonTableAttributes {
    CGFloat width { 0 };
    CGFloat minimumWidth { 0 };
    CGFloat maximumWidth { 0 };
    CGFloat minimumHeight { 0 };
    CGFloat maximumHeight { 0 };

    CGFloat paddingMinXEdge { 0 };
    CGFloat paddingMinYEdge { 0 };
    CGFloat paddingMaxXEdge { 0 };
    CGFloat paddingMaxYEdge { 0 };

    CGFloat borderMinXEdge { 0 };
    CGFloat borderMinYEdge { 0 };
    CGFloat borderMaxXEdge { 0 };
    CGFloat borderMaxYEdge { 0 };

    CGFloat marginMinXEdge { 0 };
    CGFloat marginMinYEdge { 0 };
    CGFloat marginMaxXEdge { 0 };
    CGFloat marginMaxYEdge { 0 };

    RetainPtr<PlatformColor> backgroundColor;
    RetainPtr<PlatformColor> borderMinXEdgeColor;
    RetainPtr<PlatformColor> borderMinYEdgeColor;
    RetainPtr<PlatformColor> borderMaxXEdgeColor;
    RetainPtr<PlatformColor> borderMaxYEdgeColor;
};

struct TextTable : ParagraphStyleCommonTableAttributes {
    AttributedStringTextTableID thisID;
    unsigned long numberOfColumns { 0 };
    TextTableLayoutAlgorithm layout { TextTableLayoutAlgorithm::Automatic };
    bool collapsesBorders { false };
    bool hidesEmptyCells { false };
};

struct TextTableBlock : ParagraphStyleCommonTableAttributes {
    AttributedStringTextTableBlockID thisID;
    AttributedStringTextTableID tableID;
    long startingRow { 0 };
    long rowSpan { 1 };
    long startingColumn { 0 };
    long columnSpan { 1 };
    TextTableBlockVerticalAlignment verticalAlignment { TextTableBlockVerticalAlignment::Top };
};

struct TextTab {
    CGFloat location { 0 };
    ParagraphStyleAlignment alignment { ParagraphStyleAlignment::Natural };
};

struct ParagraphStyle {
    double defaultTabInterval { 36 };
    ParagraphStyleAlignment alignment { ParagraphStyleAlignment::Natural };
    ParagraphStyleWritingDirection writingDirection { ParagraphStyleWritingDirection::Natural };
    float hyphenationFactor { 0 };
    CGFloat firstLineHeadIndent { 0 };
    CGFloat headIndent { 0 };
    long headerLevel { 0 };
    CGFloat tailIndent { 0 };
    CGFloat paragraphSpacing { 0 };
    Vector<AttributedStringTextTableBlockID> textTableBlockIDs;
    Vector<AttributedStringTextListID> textListIDs;
    Vector<TextTableBlock> textTableBlocks;
    Vector<TextTable> textTables;
    Vector<ParagraphStyleTextList> textLists;
    Vector<TextTab> textTabs;
};

struct WEBCORE_EXPORT AttributedString {
    struct Range {
        size_t location { 0 };
        size_t length { 0 };
    };

    using TextTableID = AttributedStringTextTableID;
    using TextTableBlockID = AttributedStringTextTableBlockID;
    using TextListID = AttributedStringTextListID;

    struct ColorFromCGColor {
        Color color;
    };

    struct ColorFromPlatformColor {
        Color color;
    };

    struct AttributeValue {
        std::variant<
            double,
            String,
            URL,
            Ref<Font>,
            Vector<String>,
            Vector<double>,
            ParagraphStyle,
            RetainPtr<NSPresentationIntent>,
            RetainPtr<NSShadow>,
            RetainPtr<NSDate>,
            ColorFromCGColor,
            ColorFromPlatformColor,
#if ENABLE(MULTI_REPRESENTATION_HEIC)
            MultiRepresentationHEICAttachmentData,
#endif
            TextAttachmentFileWrapper,
            TextAttachmentMissingImage
        > value;
    };

    String string;
    Vector<std::pair<Range, HashMap<String, AttributeValue>>> attributes;
    std::optional<HashMap<String, AttributeValue>> documentAttributes;

    AttributedString();
    AttributedString(String&&, Vector<std::pair<Range, HashMap<String, AttributeValue>>>&&, std::optional<HashMap<String, AttributeValue>>&&);
    AttributedString(AttributedString&&);
    AttributedString(const AttributedString&);
    AttributedString& operator=(AttributedString&&);
    AttributedString& operator=(const AttributedString&);
    ~AttributedString();

    static AttributedString fromNSAttributedStringAndDocumentAttributes(RetainPtr<NSAttributedString>&&, RetainPtr<NSDictionary>&& documentAttributes);
    static AttributedString fromNSAttributedString(RetainPtr<NSAttributedString>&&);
    static bool rangesAreSafe(const String&, const Vector<std::pair<Range, HashMap<String, AttributeValue>>>&);
    RetainPtr<NSDictionary> documentAttributesAsNSDictionary() const;
    RetainPtr<NSAttributedString> nsAttributedString() const;
    bool isNull() const;
};

} // namespace WebCore
