/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "FilterOperations.h"
#include "GraphicsTypes.h"
#include "PlatformLayer.h"
#include <wtf/RetainPtr.h>

OBJC_CLASS NSValue;

#if PLATFORM(MAC)
OBJC_CLASS CAPresentationModifier;
OBJC_CLASS CAPresentationModifierGroup;
#endif

namespace WebCore {

class PlatformCALayer;

#if PLATFORM(MAC)
using TypedFilterPresentationModifier = std::pair<FilterOperation::Type, RetainPtr<CAPresentationModifier>>;
#endif

class PlatformCAFilters {
public:
    WEBCORE_EXPORT static void setFiltersOnLayer(PlatformLayer*, const FilterOperations&, bool backdropIsOpaque);
    WEBCORE_EXPORT static void setBlendingFiltersOnLayer(PlatformLayer*, const BlendMode);
    static bool isAnimatedFilterProperty(FilterOperation::Type);
    static String animatedFilterPropertyName(FilterOperation::Type);
    static bool isValidAnimatedFilterPropertyName(const String&);

    WEBCORE_EXPORT static RetainPtr<NSValue> filterValueForOperation(const FilterOperation&);

    // A null operation indicates that we should make a "no-op" filter of the given type.
    static RetainPtr<NSValue> colorMatrixValueForFilter(FilterOperation::Type, const FilterOperation*);

#if PLATFORM(MAC)
    WEBCORE_EXPORT static void presentationModifiers(const FilterOperations& initialFilters, const FilterOperations* canonicalFilters, Vector<TypedFilterPresentationModifier>& presentationModifiers, RetainPtr<CAPresentationModifierGroup>&);
    WEBCORE_EXPORT static void updatePresentationModifiers(const FilterOperations& filters, const Vector<TypedFilterPresentationModifier>& presentationModifiers);
    WEBCORE_EXPORT static size_t presentationModifierCount(const FilterOperations&);
#endif
};

}
