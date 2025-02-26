/*
 * Copyright (C) 2011 Research In Motion Limited. All rights reserved.
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
 */

#pragma once

#include "FloatSize.h"
#include "Image.h"
#include <wtf/HashMap.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class CachedImage;
class CachedImageClient;
class ImageBuffer;
class LayoutSize;
class SVGImage;
class SVGImageForContainer;
class RenderObject;

class SVGImageCache {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SVGImageCache, WEBCORE_EXPORT);
public:
    explicit SVGImageCache(SVGImage*);
    ~SVGImageCache();

    void removeClientFromCache(const CachedImageClient*);

    void setContainerContextForClient(const CachedImageClient&, const LayoutSize&, float, const URL&);
    FloatSize imageSizeForRenderer(const RenderObject*) const;

    Image* imageForRenderer(const RenderObject*) const;

private:
    Image* findImageForRenderer(const RenderObject*) const;
    RefPtr<SVGImage> protectedSVGImage() const;

    typedef UncheckedKeyHashMap<const CachedImageClient*, RefPtr<SVGImageForContainer>> ImageForContainerMap;

    WeakPtr<SVGImage> m_svgImage;
    ImageForContainerMap m_imageForContainerMap;
};

} // namespace WebCore
