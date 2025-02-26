/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003, 2005, 2006, 2007, 2008, 2014 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Graham Dennis (graham.dennis@gmail.com)
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

#include "GraphicsTypes.h"
#include "LengthSize.h"
#include "RenderStyleConstants.h"
#include "StyleImage.h"
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class RenderElement;

struct FillSize {
    FillSize()
        : type(FillSizeType::Size)
    {
    }

    FillSize(FillSizeType type, const LengthSize& size)
        : type(type)
        , size(size)
    {
    }

    friend bool operator==(const FillSize&, const FillSize&) = default;

    FillSizeType type;
    LengthSize size;
};

struct FillRepeatXY {
    FillRepeat x { FillRepeat::Repeat };
    FillRepeat y { FillRepeat::Repeat };
    
    friend bool operator==(const FillRepeatXY&, const FillRepeatXY&) = default;
};

class FillLayer : public RefCounted<FillLayer> {
    WTF_MAKE_TZONE_ALLOCATED(FillLayer);
public:
    static Ref<FillLayer> create(FillLayerType);
    static Ref<FillLayer> create(const FillLayer&);

    Ref<FillLayer> copy() const { return create(*this); }

    ~FillLayer();

    StyleImage* image() const { return m_image.get(); }
    RefPtr<StyleImage> protectedImage() const { return m_image; }
    const Length& xPosition() const { return m_xPosition; }
    const Length& yPosition() const { return m_yPosition; }
    Edge backgroundXOrigin() const { return static_cast<Edge>(m_backgroundXOrigin); }
    Edge backgroundYOrigin() const { return static_cast<Edge>(m_backgroundYOrigin); }
    FillAttachment attachment() const { return static_cast<FillAttachment>(m_attachment); }
    FillBox clip() const { return static_cast<FillBox>(m_clip); }
    FillBox origin() const { return static_cast<FillBox>(m_origin); }
    FillRepeatXY repeat() const { return m_repeat; }
    CompositeOperator composite() const { return static_cast<CompositeOperator>(m_composite); }
    BlendMode blendMode() const { return static_cast<BlendMode>(m_blendMode); }
    const LengthSize& sizeLength() const { return m_sizeLength; }
    FillSizeType sizeType() const { return static_cast<FillSizeType>(m_sizeType); }
    FillSize size() const { return FillSize(static_cast<FillSizeType>(m_sizeType), m_sizeLength); }
    MaskMode maskMode() const { return static_cast<MaskMode>(m_maskMode); }

    // https://drafts.fxtf.org/css-masking/#the-mask-composite
    // If there is no further mask layer, the compositing operator must be ignored.
    CompositeOperator compositeForPainting() const
    {
        if (type() == FillLayerType::Mask && !next())
            return CompositeOperator::SourceOver;
        return composite();
    }

    const FillLayer* next() const { return m_next.get(); }
    FillLayer* next() { return m_next.get(); }

    bool isImageSet() const { return m_imageSet; }
    bool isXPositionSet() const { return m_xPosSet; }
    bool isYPositionSet() const { return m_yPosSet; }
    bool isBackgroundXOriginSet() const { return m_backgroundXOriginSet; }
    bool isBackgroundYOriginSet() const { return m_backgroundYOriginSet; }
    bool isAttachmentSet() const { return m_attachmentSet; }
    bool isClipSet() const { return m_clipSet; }
    bool isOriginSet() const { return m_originSet; }
    bool isRepeatSet() const { return m_repeatSet; }
    bool isCompositeSet() const { return m_compositeSet; }
    bool isBlendModeSet() const { return m_blendModeSet; }
    bool isSizeSet() const { return static_cast<FillSizeType>(m_sizeType) != FillSizeType::None; }
    bool isMaskModeSet() const { return m_maskModeSet; }

    bool isEmpty() const { return (sizeType() == FillSizeType::Size && m_sizeLength.isEmpty()) || sizeType() == FillSizeType::None; }

    void setImage(RefPtr<StyleImage>&& image) { m_image = WTFMove(image); m_imageSet = true; }
    void setXPosition(Length length) { m_xPosition = WTFMove(length); m_xPosSet = true; }
    void setYPosition(Length length) { m_yPosition = WTFMove(length); m_yPosSet = true; }
    void setBackgroundXOrigin(Edge o) { m_backgroundXOrigin = static_cast<unsigned>(o); m_backgroundXOriginSet = true; }
    void setBackgroundYOrigin(Edge o) { m_backgroundYOrigin = static_cast<unsigned>(o); m_backgroundYOriginSet = true; }
    void setAttachment(FillAttachment attachment) { m_attachment = static_cast<unsigned>(attachment); m_attachmentSet = true; }
    void setClip(FillBox b) { m_clip = static_cast<unsigned>(b); m_clipSet = true; }
    void setOrigin(FillBox b) { m_origin = static_cast<unsigned>(b); m_originSet = true; }
    void setRepeat(FillRepeatXY r) { m_repeat = r; m_repeatSet = true; }
    void setComposite(CompositeOperator c) { m_composite = static_cast<unsigned>(c); m_compositeSet = true; }
    void setBlendMode(BlendMode b) { m_blendMode = static_cast<unsigned>(b); m_blendModeSet = true; }
    void setSizeType(FillSizeType b) { m_sizeType = static_cast<unsigned>(b); }
    void setSizeLength(LengthSize l) { m_sizeLength = l; }
    void setSize(FillSize f) { m_sizeType = static_cast<unsigned>(f.type); m_sizeLength = f.size; }
    void setMaskMode(MaskMode m) { m_maskMode = static_cast<unsigned>(m); m_maskModeSet = true; }

    void clearImage() { m_image = nullptr; m_imageSet = false; }

    void clearXPosition() { m_xPosSet = false; m_backgroundXOriginSet = false; }
    void clearYPosition() { m_yPosSet = false; m_backgroundYOriginSet = false; }

    void clearAttachment() { m_attachmentSet = false; }
    void clearClip() { m_clipSet = false; }
    void clearOrigin() { m_originSet = false; }
    void clearRepeat() { m_repeatSet = false; }
    void clearComposite() { m_compositeSet = false; }
    void clearBlendMode() { m_blendModeSet = false; }
    void clearSize() { m_sizeType = static_cast<unsigned>(FillSizeType::None); }
    void clearMaskMode() { m_maskModeSet = false; }

    void setNext(RefPtr<FillLayer>&& next) { m_next = WTFMove(next); }

    FillLayer& operator=(const FillLayer&);

    bool operator==(const FillLayer&) const;

    bool containsImage(StyleImage&) const;
    bool imagesAreLoaded(const RenderElement*) const;
    bool hasImage() const { return m_next ? hasImageInAnyLayer() : m_image; }
    bool hasImageWithAttachment(FillAttachment) const;
    bool hasOpaqueImage(const RenderElement&) const;
    bool hasRepeatXY() const;
    bool clipOccludesNextLayers(bool firstLayer) const;

    FillLayerType type() const { return static_cast<FillLayerType>(m_type); }

    void fillUnsetProperties();
    void cullEmptyLayers();

    static FillAttachment initialFillAttachment(FillLayerType) { return FillAttachment::ScrollBackground; }
    static FillBox initialFillClip(FillLayerType) { return FillBox::BorderBox; }
    static FillBox initialFillOrigin(FillLayerType type) { return type == FillLayerType::Background ? FillBox::PaddingBox : FillBox::BorderBox; }
    static FillRepeatXY initialFillRepeat(FillLayerType) { return { FillRepeat::Repeat, FillRepeat::Repeat }; }
    static CompositeOperator initialFillComposite(FillLayerType) { return CompositeOperator::SourceOver; }
    static BlendMode initialFillBlendMode(FillLayerType) { return BlendMode::Normal; }
    static FillSize initialFillSize(FillLayerType) { return { }; }
    static Length initialFillXPosition(FillLayerType) { return Length(0.0f, LengthType::Percent); }
    static Length initialFillYPosition(FillLayerType) { return Length(0.0f, LengthType::Percent); }
    static StyleImage* initialFillImage(FillLayerType) { return nullptr; }
    static MaskMode initialFillMaskMode(FillLayerType) { return MaskMode::MatchSource; }

private:
    friend class RenderStyle;

    explicit FillLayer(FillLayerType);
    FillLayer(const FillLayer&);

    void computeClipMax() const;

    bool hasImageInAnyLayer() const;

    RefPtr<FillLayer> m_next;

    RefPtr<StyleImage> m_image;

    Length m_xPosition;
    Length m_yPosition;

    LengthSize m_sizeLength;
    
    FillRepeatXY m_repeat;

    unsigned m_attachment : 2; // FillAttachment
    unsigned m_clip : 3; // FillBox
    unsigned m_origin : 2; // FillBox
    unsigned m_composite : 4; // CompositeOperator
    unsigned m_sizeType : 2; // FillSizeType
    unsigned m_blendMode : 5; // BlendMode
    unsigned m_maskMode : 2; // MaskMode

    unsigned m_imageSet : 1;
    unsigned m_attachmentSet : 1;
    unsigned m_clipSet : 1;
    unsigned m_originSet : 1;
    unsigned m_repeatSet : 1;
    unsigned m_xPosSet : 1;
    unsigned m_yPosSet : 1;
    unsigned m_backgroundXOriginSet : 1;
    unsigned m_backgroundYOriginSet : 1;
    unsigned m_backgroundXOrigin : 2; // Edge
    unsigned m_backgroundYOrigin : 2; // Edge
    unsigned m_compositeSet : 1;
    unsigned m_blendModeSet : 1;
    unsigned m_maskModeSet : 1;

    unsigned m_type : 1; // FillLayerType

    mutable unsigned m_clipMax : 2; // FillBox, maximum m_clip value from this to bottom layer
};

WTF::TextStream& operator<<(WTF::TextStream&, FillSize);
WTF::TextStream& operator<<(WTF::TextStream&, FillRepeatXY);
WTF::TextStream& operator<<(WTF::TextStream&, const FillLayer&);

} // namespace WebCore
