/*
 * Copyright (C) 2007 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSPropertyNames.h"
#include "CompositeOperation.h"
#include "IterationCompositeOperation.h"
#include "WebAnimationTypes.h"
#include <wtf/HashSet.h>

namespace WebCore {

class CSSPropertyBlendingClient;
class Document;
class RenderStyle;
class Settings;

class CSSPropertyAnimation {
public:
    static bool isPropertyAnimatable(const AnimatableCSSProperty&);
    static bool isPropertyAdditiveOrCumulative(const AnimatableCSSProperty&);
    static bool propertyRequiresBlendingForAccumulativeIteration(const CSSPropertyBlendingClient&, const AnimatableCSSProperty&, const RenderStyle& a, const RenderStyle& b);
    static bool animationOfPropertyIsAccelerated(const AnimatableCSSProperty&, const Settings&);
    static bool propertiesEqual(const AnimatableCSSProperty&, const RenderStyle& a, const RenderStyle& b, const Document&);
    static bool canPropertyBeInterpolated(const AnimatableCSSProperty&, const RenderStyle& a, const RenderStyle& b, const Document&);
    static CSSPropertyID getPropertyAtIndex(int, std::optional<bool>& isShorthand);
    static std::optional<CSSPropertyID> getAcceleratedPropertyAtIndex(int, const Settings&);
    static int getNumProperties();

    static void blendProperty(const CSSPropertyBlendingClient&, const AnimatableCSSProperty&, RenderStyle& destination, const RenderStyle& from, const RenderStyle& to, double progress, CompositeOperation, IterationCompositeOperation = IterationCompositeOperation::Replace, double currentIteration = 0);
};

} // namespace WebCore
