/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ElementIdentifier.h"
#include "FloatRect.h"
#include "Path.h"
#include "Region.h"

namespace IPC {
class Decoder;
class Encoder;
}

namespace WTF {
class TextStream;
}

namespace WebCore {

class Element;
class Page;
class RenderObject;

struct InteractionRegion {
    enum class Type : uint8_t { Interaction, Occlusion, Guard };
    enum class CornerMask : uint8_t {
        MinXMinYCorner = 1 << 0,
        MaxXMinYCorner = 1 << 1,
        MinXMaxYCorner = 1 << 2,
        MaxXMaxYCorner = 1 << 3
    };
    enum class ContentHint : bool { Default, Photo };

    Type type;
    ElementIdentifier elementIdentifier;
    FloatRect rectInLayerCoordinates;
    float cornerRadius { 0 };
    OptionSet<CornerMask> maskedCorners { };
    ContentHint contentHint { ContentHint::Default };
    std::optional<Path> clipPath { std::nullopt };
#if ENABLE(INTERACTION_REGION_TEXT_CONTENT)
    String text { };
#endif

    WEBCORE_EXPORT ~InteractionRegion();
};

inline bool operator==(const InteractionRegion& a, const InteractionRegion& b)
{
    return a.type == b.type
        && a.elementIdentifier == b.elementIdentifier
        && a.contentHint == b.contentHint
        && a.rectInLayerCoordinates == b.rectInLayerCoordinates
        && a.cornerRadius == b.cornerRadius
        && a.maskedCorners == b.maskedCorners
        && a.clipPath.has_value() == b.clipPath.has_value()
#if ENABLE(INTERACTION_REGION_TEXT_CONTENT)
        && a.text == b.text
#endif
        && (!a.clipPath || &a.clipPath.value() == &b.clipPath.value());
}

WEBCORE_EXPORT std::optional<InteractionRegion> interactionRegionForRenderedRegion(RenderObject&, const FloatRect&, const FloatSize&, const std::optional<AffineTransform>&);

WTF::TextStream& operator<<(WTF::TextStream&, const InteractionRegion&);

}
namespace WTF {
template<typename T> struct DefaultHash;
template<> struct DefaultHash<WebCore::InteractionRegion::Type> : IntHash<WebCore::InteractionRegion::Type> { };
template<> struct DefaultHash<WebCore::InteractionRegion::ContentHint> : IntHash<WebCore::InteractionRegion::ContentHint> { };
}
