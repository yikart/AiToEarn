/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "LengthPoint.h"
#include "StyleContentAlignmentData.h"
#include "StyleSelfAlignmentData.h"
#include <memory>
#include <wtf/DataRef.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/text/WTFString.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class AnimationList;
class ContentData;
class FillLayer;
class ShadowData;
class StyleDeprecatedFlexibleBoxData;
class StyleFilterData;
class StyleFlexibleBoxData;
class StyleMultiColData;
class StyleTransformData;
class StyleVisitedLinkColorData;

constexpr int appearanceBitWidth = 7;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleMiscNonInheritedData);
class StyleMiscNonInheritedData : public RefCounted<StyleMiscNonInheritedData> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleMiscNonInheritedData);
public:
    static Ref<StyleMiscNonInheritedData> create() { return adoptRef(*new StyleMiscNonInheritedData); }
    Ref<StyleMiscNonInheritedData> copy() const;
    ~StyleMiscNonInheritedData();

    bool operator==(const StyleMiscNonInheritedData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleMiscNonInheritedData&) const;
#endif

    bool hasOpacity() const { return opacity < 1; }
    bool hasZeroOpacity() const { return !opacity; }
    bool hasFilters() const;
    bool contentDataEquivalent(const StyleMiscNonInheritedData&) const;

    // This is here to pack in with m_refCount.
    float opacity;

    DataRef<StyleDeprecatedFlexibleBoxData> deprecatedFlexibleBox; // Flexible box properties
    DataRef<StyleFlexibleBoxData> flexibleBox;
    DataRef<StyleMultiColData> multiCol; //  CSS3 multicol properties
    DataRef<StyleFilterData> filter; // Filter operations (url, sepia, blur, etc.)
    DataRef<StyleTransformData> transform; // Transform properties (rotate, scale, skew, etc.)
    DataRef<FillLayer> mask;
    DataRef<StyleVisitedLinkColorData> visitedLinkColor;

    RefPtr<AnimationList> animations;
    RefPtr<AnimationList> transitions;
    std::unique_ptr<ContentData> content;
    std::unique_ptr<ShadowData> boxShadow; // For box-shadow decorations.
    String altText;
    double aspectRatioWidth;
    double aspectRatioHeight;
    StyleContentAlignmentData alignContent;
    StyleContentAlignmentData justifyContent;
    StyleSelfAlignmentData alignItems;
    StyleSelfAlignmentData alignSelf;
    StyleSelfAlignmentData justifyItems;
    StyleSelfAlignmentData justifySelf;
    LengthPoint objectPosition;
    int order;

    unsigned hasAttrContent : 1 { false };
    unsigned hasDisplayAffectedByAnimations : 1 { false };
#if ENABLE(DARK_MODE_CSS)
    unsigned hasExplicitlySetColorScheme : 1 { false };
#endif
    unsigned hasExplicitlySetDirection : 1 { false };
    unsigned hasExplicitlySetWritingMode : 1 { false };
    unsigned tableLayout : 1; // TableLayoutType
    unsigned aspectRatioType : 2; // AspectRatioType
    unsigned appearance : appearanceBitWidth; // StyleAppearance
    unsigned usedAppearance : appearanceBitWidth; // StyleAppearance
    unsigned textOverflow : 1; // Whether or not lines that spill out should be truncated with "..."
    unsigned userDrag : 2; // UserDrag
    unsigned objectFit : 3; // ObjectFit
    unsigned resize : 3; // Resize

private:
    StyleMiscNonInheritedData();
    StyleMiscNonInheritedData(const StyleMiscNonInheritedData&);
};

} // namespace WebCore
