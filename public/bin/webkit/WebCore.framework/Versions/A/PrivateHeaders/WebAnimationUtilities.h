/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "ExceptionOr.h"
#include "RenderStyleConstants.h"
#include "WebAnimationTypes.h"
#include <wtf/Forward.h>
#include <wtf/Markable.h>
#include <wtf/Seconds.h>

namespace WebCore {

enum class PseudoId : uint32_t;

class AnimationEventBase;
class Document;
class Element;
class WebAnimation;

namespace Style {
struct PseudoElementIdentifier;
}

inline double secondsToWebAnimationsAPITime(const Seconds time)
{
    // Precision of time values
    // https://drafts.csswg.org/web-animations-1/#precision-of-time-values

    // The internal representation of time values is implementation dependent however, it is RECOMMENDED that user
    // agents be able to represent input time values with microsecond precision so that a time value (which nominally
    // represents milliseconds) of 0.001 is distinguishable from 0.0.
    auto roundedTime = std::round(time.microseconds()) / 1000;
    if (roundedTime == -0)
        return 0;
    return roundedTime;
}

const auto timeEpsilon = Seconds::fromMilliseconds(0.001);

bool compareAnimationsByCompositeOrder(const WebAnimation&, const WebAnimation&);
bool compareAnimationEventsByCompositeOrder(const AnimationEventBase&, const AnimationEventBase&);
String pseudoElementIdentifierAsString(const std::optional<Style::PseudoElementIdentifier>&);
std::pair<bool, std::optional<Style::PseudoElementIdentifier>> pseudoElementIdentifierFromString(const String&, Document*);
AtomString animatablePropertyAsString(AnimatableCSSProperty);

} // namespace WebCore

