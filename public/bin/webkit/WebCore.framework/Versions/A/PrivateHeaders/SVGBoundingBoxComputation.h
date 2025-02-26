/**
 * Copyright (C) 2021, 2022 Igalia S.L.
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

#include "RenderLayerModelObject.h"
#include <wtf/Noncopyable.h>
#include <wtf/OptionSet.h>

namespace WebCore {

class FloatRect;

class SVGBoundingBoxComputation {
    WTF_MAKE_NONCOPYABLE(SVGBoundingBoxComputation);
public:
    explicit SVGBoundingBoxComputation(const RenderLayerModelObject&);
    ~SVGBoundingBoxComputation() = default;

    enum class DecorationOption : uint16_t {
        IncludeFillShape                    = 1 << 0, /* corresponds to 'bool fill'     */
        IncludeStrokeShape                  = 1 << 1, /* corresponds to 'bool stroke'   */
        IncludeMarkers                      = 1 << 2, /* corresponds to 'bool markers'  */
        IncludeClippers                     = 1 << 3, /* corresponds to 'bool clippers' */
        IncludeMaskers                      = 1 << 4, /* WebKit extension - internal    */
        IncludeOutline                      = 1 << 5, /* WebKit extension - internal    */
        IgnoreTransformations               = 1 << 6, /* WebKit extension - internal    */
        OverrideBoxWithFilterBox            = 1 << 7, /* WebKit extension - internal    */
        OverrideBoxWithFilterBoxForChildren = 1 << 8, /* WebKit extension - internal    */
        CalculateFastRepaintRect            = 1 << 9, /* WebKit extension - internal    */
        UseFilterBoxOnEmptyRect             = 1 << 10  /* WebKit extension - internal    */
    };

    using DecorationOptions = OptionSet<DecorationOption>;

    static constexpr DecorationOptions objectBoundingBoxDecoration = { DecorationOption::IncludeFillShape };
    static constexpr DecorationOptions strokeBoundingBoxDecoration = { DecorationOption::IncludeFillShape, DecorationOption::IncludeStrokeShape };
    static constexpr DecorationOptions filterBoundingBoxDecoration = { DecorationOption::OverrideBoxWithFilterBox, DecorationOption::OverrideBoxWithFilterBoxForChildren };
    static constexpr DecorationOptions repaintBoundingBoxDecoration = { DecorationOption::IncludeFillShape, DecorationOption::IncludeStrokeShape, DecorationOption::IncludeMarkers, DecorationOption::IncludeClippers, DecorationOption::IncludeMaskers, DecorationOption::OverrideBoxWithFilterBox, DecorationOption::CalculateFastRepaintRect };

    FloatRect computeDecoratedBoundingBox(const DecorationOptions&, bool* boundingBoxValid = nullptr) const;

    static FloatRect computeDecoratedBoundingBox(const RenderLayerModelObject& renderer, const DecorationOptions& options)
    {
        SVGBoundingBoxComputation boundingBoxComputation(renderer);
        return boundingBoxComputation.computeDecoratedBoundingBox(options);
    }

    static FloatRect computeRepaintBoundingBox(const RenderLayerModelObject& renderer)
    {
        return computeDecoratedBoundingBox(renderer, repaintBoundingBoxDecoration);
    }

    static LayoutRect computeVisualOverflowRect(const RenderLayerModelObject&);

private:
    FloatRect handleShapeOrTextOrInline(const DecorationOptions&, bool* boundingBoxValid = nullptr) const;
    FloatRect handleRootOrContainer(const DecorationOptions&, bool* boundingBoxValid = nullptr) const;
    FloatRect handleForeignObjectOrImage(const DecorationOptions&, bool* boundingBoxValid = nullptr) const;

    void adjustBoxForClippingAndEffects(const DecorationOptions&, FloatRect& box, const DecorationOptions& optionsToCheckForFilters = filterBoundingBoxDecoration) const;

    SingleThreadWeakRef<const RenderLayerModelObject> m_renderer;
};

} // namespace WebCore
