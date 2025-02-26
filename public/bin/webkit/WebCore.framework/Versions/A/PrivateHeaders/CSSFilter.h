/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
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

#include "Filter.h"
#include "LengthBox.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class FilterOperations;
class GraphicsContext;
class RenderElement;

class CSSFilter final : public Filter {
    WTF_MAKE_TZONE_ALLOCATED(CSSFilter);
public:
    static RefPtr<CSSFilter> create(RenderElement&, const FilterOperations&, OptionSet<FilterRenderingMode> preferredFilterRenderingModes, const FloatSize& filterScale, const FloatRect& targetBoundingBox, const GraphicsContext& destinationContext);
    WEBCORE_EXPORT static Ref<CSSFilter> create(Vector<Ref<FilterFunction>>&&);
    WEBCORE_EXPORT static Ref<CSSFilter> create(Vector<Ref<FilterFunction>>&&, OptionSet<FilterRenderingMode>, const FloatSize& filterScale, const FloatRect& filterRegion);

    const Vector<Ref<FilterFunction>>& functions() const { return m_functions; }

    void setFilterRegion(const FloatRect&);

    bool hasFilterThatMovesPixels() const { return m_hasFilterThatMovesPixels; }
    bool hasFilterThatShouldBeRestrictedBySecurityOrigin() const { return m_hasFilterThatShouldBeRestrictedBySecurityOrigin; }

    FilterEffectVector effectsOfType(FilterFunction::Type) const final;

    RefPtr<FilterImage> apply(FilterImage* sourceImage, FilterResults&) final;
    FilterStyleVector createFilterStyles(GraphicsContext&, const FilterStyle& sourceStyle) const final;

    static bool isIdentity(RenderElement&, const FilterOperations&);
    static IntOutsets calculateOutsets(RenderElement&, const FilterOperations&, const FloatRect& targetBoundingBox);

private:
    CSSFilter(const FloatSize& filterScale, bool hasFilterThatMovesPixels, bool hasFilterThatShouldBeRestrictedBySecurityOrigin);
    CSSFilter(Vector<Ref<FilterFunction>>&&);
    CSSFilter(Vector<Ref<FilterFunction>>&&, const FloatSize& filterScale, const FloatRect& filterRegion);

    bool buildFilterFunctions(RenderElement&, const FilterOperations&, OptionSet<FilterRenderingMode> preferredFilterRenderingModes, const FloatRect& targetBoundingBox, const GraphicsContext& destinationContext);

    OptionSet<FilterRenderingMode> supportedFilterRenderingModes() const final;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const final;

    bool m_hasFilterThatMovesPixels { false };
    bool m_hasFilterThatShouldBeRestrictedBySecurityOrigin { false };

    Vector<Ref<FilterFunction>> m_functions;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(CSSFilter);
