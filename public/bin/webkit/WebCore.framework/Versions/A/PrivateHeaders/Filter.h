/*
 * Copyright (C) 2009 Dirk Schulze <krit@webkit.org>
 * Copyright (C) 2013 Google Inc. All rights reserved.
 * Copyright (C) 2021-2023 Apple Inc.  All rights reserved.
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

#include "FilterEffectVector.h"
#include "FilterFunction.h"
#include "FloatPoint3D.h"
#include "FloatRect.h"
#include "GraphicsTypes.h"
#include "ImageBuffer.h"
#include "RenderingMode.h"

namespace WebCore {

class FilterEffect;
class FilterImage;
class FilterResults;

class Filter : public FilterFunction {
    using FilterFunction::apply;
    using FilterFunction::createFilterStyles;

public:
    RenderingMode renderingMode() const;

    OptionSet<FilterRenderingMode> filterRenderingModes() const { return m_filterRenderingModes; }
    WEBCORE_EXPORT void setFilterRenderingModes(OptionSet<FilterRenderingMode> preferredFilterRenderingModes);

    FloatSize filterScale() const { return m_filterScale; }
    void setFilterScale(const FloatSize& filterScale) { m_filterScale = filterScale; }

    FloatRect filterRegion() const { return m_filterRegion; }
    void setFilterRegion(const FloatRect& filterRegion) { m_filterRegion = filterRegion; }

    virtual FloatSize resolvedSize(const FloatSize& size) const { return size; }
    virtual FloatPoint3D resolvedPoint3D(const FloatPoint3D& point) const { return point; }

    FloatPoint scaledByFilterScale(const FloatPoint&) const;
    FloatSize scaledByFilterScale(const FloatSize&) const;
    FloatRect scaledByFilterScale(const FloatRect&) const;

    FloatRect maxEffectRect(const FloatRect& primitiveSubregion) const;
    FloatRect clipToMaxEffectRect(const FloatRect& imageRect, const FloatRect& primitiveSubregion) const;

    virtual FilterEffectVector effectsOfType(FilterFunction::Type) const = 0;

    bool clampFilterRegionIfNeeded();

    WEBCORE_EXPORT RefPtr<FilterImage> apply(ImageBuffer* sourceImage, const FloatRect& sourceImageRect, FilterResults&);
    WEBCORE_EXPORT FilterStyleVector createFilterStyles(GraphicsContext&, const FloatRect& sourceImageRect) const;

protected:
    Filter(Filter::Type, std::optional<RenderingResourceIdentifier> = std::nullopt);
    Filter(Filter::Type, const FloatSize& filterScale, const FloatRect& filterRegion = { }, std::optional<RenderingResourceIdentifier> = std::nullopt);

    virtual RefPtr<FilterImage> apply(FilterImage* sourceImage, FilterResults&) = 0;
    virtual FilterStyleVector createFilterStyles(GraphicsContext&, const FilterStyle& sourceStyle) const = 0;

private:
    OptionSet<FilterRenderingMode> m_filterRenderingModes { FilterRenderingMode::Software };
    FloatSize m_filterScale;
    FloatRect m_filterRegion;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Filter)
    static bool isType(const WebCore::RenderingResource& renderingResource) { return renderingResource.isFilter(); }
SPECIALIZE_TYPE_TRAITS_END()
