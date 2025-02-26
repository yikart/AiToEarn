/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2006 Allan Sandfeld Jensen (kde@carewolf.com) 
 *           (C) 2006 Samuel Weinig (sam.weinig@gmail.com)
 * Copyright (C) 2004, 2005, 2006, 2007, 2009, 2010, 2011 Apple Inc. All rights reserved.
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

#include "RenderImageResource.h"
#include "RenderReplaced.h"

namespace WebCore {

class HTMLAreaElement;
class HTMLMapElement;

enum ImageSizeChangeType {
    ImageSizeChangeNone,
    ImageSizeChangeForAltText
};

class RenderImage : public RenderReplaced {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderImage);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderImage);
public:
    RenderImage(Type, Element&, RenderStyle&&, StyleImage* = nullptr, const float imageDevicePixelRatio = 1.0f);
    RenderImage(Type, Document&, RenderStyle&&, StyleImage* = nullptr);
    virtual ~RenderImage();

    RenderImageResource& imageResource() { return *m_imageResource; }
    const RenderImageResource& imageResource() const { return *m_imageResource; }
    CheckedRef<RenderImageResource> checkedImageResource() const;
    CachedImage* cachedImage() const { return imageResource().cachedImage(); }

    ImageSizeChangeType setImageSizeForAltText(CachedImage* newImage = nullptr);

    void updateAltText();

    RefPtr<HTMLMapElement> imageMap() const;
    void areaElementFocusChanged(HTMLAreaElement*);
    
#if PLATFORM(IOS_FAMILY)
    void collectSelectionGeometries(Vector<SelectionGeometry>&, unsigned, unsigned) override;
#endif

    void setIsGeneratedContent(bool generated = true) { m_isGeneratedContent = generated; }

    bool isGeneratedContent() const { return m_isGeneratedContent; }

    const String& altText() const { return m_altText; }
    void setAltText(const String& altText) { m_altText = altText; }

    void setImageDevicePixelRatio(float factor);
    float imageDevicePixelRatio() const { return m_imageDevicePixelRatio; }

    void setHasShadowControls(bool hasShadowControls) { m_hasShadowControls = hasShadowControls; }
    void setHasImageOverlay() { m_hasImageOverlay = true; }
    
    bool isShowingMissingOrImageError() const;
    bool isShowingAltText() const;

    virtual bool shouldDisplayBrokenImageIcon() const;

    bool hasNonBitmapImage() const;

    String accessibilityDescription() const { return imageResource().image()->accessibilityDescription(); }

    bool hasAnimatedImage() const;

#if ENABLE(MULTI_REPRESENTATION_HEIC)
    bool isMultiRepresentationHEIC() const;
#endif

protected:
    RenderImage(Type, Element&, RenderStyle&&, OptionSet<ReplacedFlag>, StyleImage* = nullptr, const float imageDevicePixelRatio = 1.0f);
    void willBeDestroyed() override;

    bool needsPreferredWidthsRecalculation() const final;
    RenderBox* embeddedContentBox() const final;
    void computeIntrinsicRatioInformation(FloatSize& intrinsicSize, FloatSize& intrinsicRatio) const final;
    bool foregroundIsKnownToBeOpaqueInRect(const LayoutRect& localRect, unsigned maxDepthToTest) const override;

    void styleWillChange(StyleDifference, const RenderStyle& newStyle) override;
    void styleDidChange(StyleDifference, const RenderStyle*) override;

    void imageChanged(WrappedImagePtr, const IntRect* = nullptr) override;

    ImageDrawResult paintIntoRect(PaintInfo&, const FloatRect&);
    void paint(PaintInfo&, const LayoutPoint&) final;
    void layout() override;

    void intrinsicSizeChanged() override
    {
        imageChanged(imageResource().imagePtr());
    }

private:
    ASCIILiteral renderName() const override { return "RenderImage"_s; }

    bool canHaveChildren() const override;

    bool isImage() const override { return true; }

    void paintReplaced(PaintInfo&, const LayoutPoint&) override;
    void paintIncompleteImageOutline(PaintInfo&, LayoutPoint, LayoutUnit) const;

    bool computeBackgroundIsKnownToBeObscured(const LayoutPoint& paintOffset) final;

    LayoutUnit minimumReplacedHeight() const override;

    void notifyFinished(CachedResource&, const NetworkLoadMetrics&, LoadWillContinueInAnotherProcess) final;
    bool nodeAtPoint(const HitTestRequest&, HitTestResult&, const HitTestLocation& locationInContainer, const LayoutPoint& accumulatedOffset, HitTestAction) final;

    IntSize imageSizeForError(CachedImage*) const;
    void repaintOrMarkForLayout(ImageSizeChangeType, const IntRect* = nullptr);
    void updateIntrinsicSizeIfNeeded(const LayoutSize&);
    // Update the size of the image to be rendered. Object-fit may cause this to be different from the CSS box's content rect.
    void updateInnerContentRect();

    void paintAreaElementFocusRing(PaintInfo&, const LayoutPoint& paintOffset);

    bool hasShadowContent() const { return m_hasShadowControls || m_hasImageOverlay; }

    LayoutUnit computeReplacedLogicalWidth(ShouldComputePreferred = ShouldComputePreferred::ComputeActual) const override;
    LayoutUnit computeReplacedLogicalHeight(std::optional<LayoutUnit> estimatedUsedWidth = std::nullopt) const override;

    LayoutUnit baselinePosition(FontBaseline, bool firstLine, LineDirectionMode, LinePositionMode = PositionOnContainingLine) const override;

    bool shouldCollapseToEmpty() const;

    // Text to display as long as the image isn't available.
    String m_altText;
    std::unique_ptr<RenderImageResource> m_imageResource;
    bool m_needsToSetSizeForAltText { false };
    bool m_isGeneratedContent { false };
    bool m_hasShadowControls { false };
    bool m_hasImageOverlay { false };
    float m_imageDevicePixelRatio { 1 };

    friend class RenderImageScaleObserver;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_RENDER_OBJECT(RenderImage, isRenderImage())
