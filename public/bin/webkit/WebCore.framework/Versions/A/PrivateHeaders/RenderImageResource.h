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

#include "CachedImage.h"
#include "CachedResourceHandle.h"
#include "StyleImage.h"
#include <wtf/CheckedPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class CachedImage;
class RenderElement;

class RenderImageResource : public CanMakeCheckedPtr<RenderImageResource> {
    WTF_MAKE_NONCOPYABLE(RenderImageResource);
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RenderImageResource);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(RenderImageResource);
public:
    RenderImageResource();
    virtual ~RenderImageResource();

    virtual void initialize(RenderElement& renderer) { initialize(renderer, nullptr); }
    virtual void shutdown();

    void setCachedImage(CachedResourceHandle<CachedImage>&&);
    CachedImage* cachedImage() const { return m_cachedImage.get(); }

    void resetAnimation();

    virtual RefPtr<Image> image(const IntSize& size = { }) const;
    virtual bool errorOccurred() const { return m_cachedImage && m_cachedImage->errorOccurred(); }

    virtual void setContainerContext(const IntSize&, const URL&);

    virtual bool imageHasRelativeWidth() const { return m_cachedImage && m_cachedImage->imageHasRelativeWidth(); }
    virtual bool imageHasRelativeHeight() const { return m_cachedImage && m_cachedImage->imageHasRelativeHeight(); }

    inline LayoutSize imageSize(float multiplier) const { return imageSize(multiplier, CachedImage::UsedSize); }
    inline LayoutSize intrinsicSize(float multiplier) const { return imageSize(multiplier, CachedImage::IntrinsicSize); }

    virtual WrappedImagePtr imagePtr() const { return m_cachedImage.get(); }

protected:
    RenderElement* renderer() const { return m_renderer.get(); }
    void initialize(RenderElement&, CachedImage*);
    
private:
    virtual LayoutSize imageSize(float multiplier, CachedImage::SizeType) const;

    SingleThreadWeakPtr<RenderElement> m_renderer;
    CachedResourceHandle<CachedImage> m_cachedImage;
    bool m_cachedImageRemoveClientIsNeeded { true };
};

} // namespace WebCore
