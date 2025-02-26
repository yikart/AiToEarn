/*
 * Copyright (C) 2008 Alex Mathews <possessedpenguinbob@gmail.com>
 * Copyright (C) 2009 Dirk Schulze <krit@webkit.org>
 * Copyright (C) 2021-2022 Apple Inc.  All rights reserved.
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

#include "FilterEffect.h"

namespace WebCore {

class SourceGraphic : public FilterEffect {
public:        
    WEBCORE_EXPORT static Ref<SourceGraphic> create(DestinationColorSpace = DestinationColorSpace::SRGB());

    static AtomString effectName() { return FilterEffect::sourceGraphicName(); }

private:
    explicit SourceGraphic(DestinationColorSpace);

    unsigned numberOfEffectInputs() const override { return 0; }

    OptionSet<FilterRenderingMode> supportedFilterRenderingModes() const override;
    std::unique_ptr<FilterEffectApplier> createAcceleratedApplier() const override;
    std::unique_ptr<FilterEffectApplier> createSoftwareApplier() const override;

    WTF::TextStream& externalRepresentation(WTF::TextStream&, FilterRepresentation) const override;
};

} //namespace WebCore

SPECIALIZE_TYPE_TRAITS_FILTER_FUNCTION(SourceGraphic)
