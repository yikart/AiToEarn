/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2017 Apple Inc. All rights reserved.
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

#include "LengthBox.h"
#include "StyleImage.h"
#include <wtf/DataRef.h>
#include <wtf/Vector.h>

namespace WebCore {

class LayoutSize;
class LayoutRect;
class RenderStyle;

enum class NinePieceImageRule : uint8_t {
    Stretch,
    Round,
    Space,
    Repeat,
};

// Used for array indexing, so not an enum class.
enum ImagePiece {
    MinPiece = 0,
    TopLeftPiece = MinPiece,
    LeftPiece,
    BottomLeftPiece,
    TopRightPiece,
    RightPiece,
    BottomRightPiece,
    TopPiece,
    BottomPiece,
    MiddlePiece,
    MaxPiece
};

inline ImagePiece& operator++(ImagePiece& piece)
{
    piece = static_cast<ImagePiece>(enumToUnderlyingType(piece) + 1);
    return piece;
}

inline bool isCornerPiece(ImagePiece piece)
{
    return piece == TopLeftPiece || piece == TopRightPiece || piece == BottomLeftPiece || piece == BottomRightPiece;
}

inline bool isMiddlePiece(ImagePiece piece)
{
    return piece == MiddlePiece;
}

inline bool isHorizontalPiece(ImagePiece piece)
{
    return piece == TopPiece || piece == BottomPiece || piece == MiddlePiece;
}

inline bool isVerticalPiece(ImagePiece piece)
{
    return piece == LeftPiece || piece == RightPiece || piece == MiddlePiece;
}

inline std::optional<BoxSide> imagePieceHorizontalSide(ImagePiece piece)
{
    if (piece == TopLeftPiece || piece == TopPiece || piece == TopRightPiece)
        return BoxSide::Top;

    if (piece == BottomLeftPiece || piece == BottomPiece || piece == BottomRightPiece)
        return BoxSide::Bottom;

    return std::nullopt;
}

inline std::optional<BoxSide> imagePieceVerticalSide(ImagePiece piece)
{
    if (piece == TopLeftPiece || piece == LeftPiece || piece == BottomLeftPiece)
        return BoxSide::Left;

    if (piece == TopRightPiece || piece == RightPiece || piece == BottomRightPiece)
        return BoxSide::Right;

    return std::nullopt;
}

class NinePieceImage {
public:
    enum class Type {
        Normal,
        Mask
    };

    NinePieceImage(Type = Type::Normal);
    NinePieceImage(RefPtr<StyleImage>&&, LengthBox imageSlices, bool fill, LengthBox borderSlices, bool overridesBorderWidths, LengthBox outset, NinePieceImageRule horizontalRule, NinePieceImageRule verticalRule);

    friend bool operator==(const NinePieceImage&, const NinePieceImage&) = default;

    bool hasImage() const { return m_data->image; }
    StyleImage* image() const { return m_data->image.get(); }
    RefPtr<StyleImage> protectedImage() const { return image(); }
    void setImage(RefPtr<StyleImage>&& image) { m_data.access().image = WTFMove(image); }

    const LengthBox& imageSlices() const { return m_data->imageSlices; }
    void setImageSlices(LengthBox slices) { m_data.access().imageSlices = WTFMove(slices); }

    bool fill() const { return m_data->fill; }
    void setFill(bool fill) { m_data.access().fill = fill; }

    const LengthBox& borderSlices() const { return m_data->borderSlices; }
    void setBorderSlices(LengthBox slices) { m_data.access().borderSlices = WTFMove(slices); }

    bool overridesBorderWidths() const { return m_data->overridesBorderWidths; }
    void setOverridesBorderWidths(bool v) { m_data.access().overridesBorderWidths = v; }

    const LengthBox& outset() const { return m_data->outset; }
    void setOutset(LengthBox outset) { m_data.access().outset = WTFMove(outset); }

    NinePieceImageRule horizontalRule() const { return m_data->horizontalRule; }
    void setHorizontalRule(NinePieceImageRule rule) { m_data.access().horizontalRule = rule; }
    
    NinePieceImageRule verticalRule() const { return m_data->verticalRule; }
    void setVerticalRule(NinePieceImageRule rule) { m_data.access().verticalRule = rule; }

    void copyImageSlicesFrom(const NinePieceImage& other)
    {
        m_data.access().imageSlices = other.m_data->imageSlices;
        m_data.access().fill = other.m_data->fill;
    }

    void copyBorderSlicesFrom(const NinePieceImage& other)
    {
        m_data.access().borderSlices = other.m_data->borderSlices;
        m_data.access().overridesBorderWidths = other.m_data->overridesBorderWidths;
    }
    
    void copyOutsetFrom(const NinePieceImage& other)
    {
        m_data.access().outset = other.m_data->outset;
    }

    void copyRepeatFrom(const NinePieceImage& other)
    {
        m_data.access().horizontalRule = other.m_data->horizontalRule;
        m_data.access().verticalRule = other.m_data->verticalRule;
    }

    static LayoutUnit computeOutset(const Length& outset, LayoutUnit borderWidth)
    {
        if (outset.isRelative())
            return LayoutUnit(outset.value() * borderWidth);
        return LayoutUnit(outset.value());
    }

    static LayoutUnit computeSlice(Length, LayoutUnit width, LayoutUnit slice, LayoutUnit extent);
    static LayoutBoxExtent computeSlices(const LayoutSize&, const LengthBox& lengths, int scaleFactor);
    static LayoutBoxExtent computeSlices(const LayoutSize&, const LengthBox& lengths, const FloatBoxExtent& widths, const LayoutBoxExtent& slices);

    static bool isEmptyPieceRect(ImagePiece, const LayoutBoxExtent& slices);
    static bool isEmptyPieceRect(ImagePiece, const Vector<FloatRect>& destinationRects, const Vector<FloatRect>& sourceRects);

    static Vector<FloatRect> computeNineRects(const FloatRect& outer, const LayoutBoxExtent& slices, float deviceScaleFactor);

    static void scaleSlicesIfNeeded(const LayoutSize&, LayoutBoxExtent& slices, float deviceScaleFactor);

    static FloatSize computeSideTileScale(ImagePiece, const Vector<FloatRect>& destinationRects, const Vector<FloatRect>& sourceRects);
    static FloatSize computeMiddleTileScale(const Vector<FloatSize>& scales, const Vector<FloatRect>& destinationRects, const Vector<FloatRect>& sourceRects, NinePieceImageRule hRule, NinePieceImageRule vRule);
    static Vector<FloatSize> computeTileScales(const Vector<FloatRect>& destinationRects, const Vector<FloatRect>& sourceRects, NinePieceImageRule hRule, NinePieceImageRule vRule);

    void paint(GraphicsContext&, const RenderElement*, const RenderStyle&, const LayoutRect& destination, const LayoutSize& source, float deviceScaleFactor, CompositeOperator) const;

private:
    struct Data : RefCounted<Data> {
        static Ref<Data> create();
        static Ref<Data> create(RefPtr<StyleImage>&&, LengthBox imageSlices, bool fill, LengthBox borderSlices, bool overridesBorderWidths, LengthBox outset, NinePieceImageRule horizontalRule, NinePieceImageRule verticalRule);
        Ref<Data> copy() const;

        bool operator==(const Data&) const;

        bool fill { false };
        bool overridesBorderWidths { false };
        NinePieceImageRule horizontalRule { NinePieceImageRule::Stretch };
        NinePieceImageRule verticalRule { NinePieceImageRule::Stretch };
        RefPtr<StyleImage> image;
        LengthBox imageSlices { { 100, LengthType::Percent }, { 100, LengthType::Percent }, { 100, LengthType::Percent }, { 100, LengthType::Percent } };
        LengthBox borderSlices { { 1, LengthType::Relative }, { 1, LengthType::Relative }, { 1, LengthType::Relative }, { 1, LengthType::Relative } };
        LengthBox outset { LengthType::Relative };

    private:
        Data();
        Data(RefPtr<StyleImage>&&, LengthBox imageSlices, bool fill, LengthBox borderSlices, bool overridesBorderWidths, LengthBox outset, NinePieceImageRule horizontalRule, NinePieceImageRule verticalRule);
        Data(const Data&);
    };

    static DataRef<Data>& defaultData();
    static DataRef<Data>& defaultMaskData();

    DataRef<Data> m_data;
};

WTF::TextStream& operator<<(WTF::TextStream&, const NinePieceImage&);
WTF::TextStream& operator<<(WTF::TextStream&, NinePieceImageRule);

} // namespace WebCore
