/*
 * Copyright (C) 1999 Lars Knoll <knoll@kde.org>
 * Copyright (C) 1999 Antti Koivisto <koivisto@kde.org>
 * Copyright (C) 2006 Allan Sandfeld Jensen <kde@carewolf.com>
 * Copyright (C) 2006 Samuel Weinig <sam.weinig@gmail.com>
 * Copyright (C) 2004, 2005, 2006, 2007, 2009, 2010 Apple Inc. All rights reserved.
 * Copyright (C) 2010 Patrick Gansterer <paroga@paroga.com>
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
#include "StyleImage.h"
#include <wtf/RefPtr.h>

namespace WebCore {

class RenderElement;

class RenderImageResourceStyleImage final : public RenderImageResource {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderImageResourceStyleImage);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderImageResourceStyleImage);
public:
    explicit RenderImageResourceStyleImage(StyleImage&);

private:
    void initialize(RenderElement&) final;
    void shutdown() final;

    RefPtr<Image> image(const IntSize& = { }) const final;
    bool errorOccurred() const final { return m_styleImage->errorOccurred(); }

    void setContainerContext(const IntSize&, const URL&) final;

    bool imageHasRelativeWidth() const final { return m_styleImage->imageHasRelativeWidth(); }
    bool imageHasRelativeHeight() const final { return m_styleImage->imageHasRelativeHeight(); }

    WrappedImagePtr imagePtr() const final { return m_styleImage->data(); }
    LayoutSize imageSize(float multiplier, CachedImage::SizeType) const final { return LayoutSize(m_styleImage->imageSize(renderer(), multiplier)); }

    Ref<StyleImage> m_styleImage;
};

} // namespace WebCore
