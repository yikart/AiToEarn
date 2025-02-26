/*
 * Copyright (C) 2004, 2005, 2008 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) 2004, 2005, 2006, 2007 Rob Buis <buis@kde.org>
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

#include "ExceptionOr.h"
#include "SVGPropertyTraits.h"
#include <wtf/TZoneMalloc.h>

namespace IPC {
template<typename T, typename> struct ArgumentCoder;
}

namespace WebCore {

class AffineTransform;
class FloatRect;

class SVGPreserveAspectRatioValue {
    WTF_MAKE_TZONE_ALLOCATED(SVGPreserveAspectRatioValue);
public:
    enum SVGPreserveAspectRatioType : uint8_t {
        SVG_PRESERVEASPECTRATIO_UNKNOWN = 0,
        SVG_PRESERVEASPECTRATIO_NONE = 1,
        SVG_PRESERVEASPECTRATIO_XMINYMIN = 2,
        SVG_PRESERVEASPECTRATIO_XMIDYMIN = 3,
        SVG_PRESERVEASPECTRATIO_XMAXYMIN = 4,
        SVG_PRESERVEASPECTRATIO_XMINYMID = 5,
        SVG_PRESERVEASPECTRATIO_XMIDYMID = 6,
        SVG_PRESERVEASPECTRATIO_XMAXYMID = 7,
        SVG_PRESERVEASPECTRATIO_XMINYMAX = 8,
        SVG_PRESERVEASPECTRATIO_XMIDYMAX = 9,
        SVG_PRESERVEASPECTRATIO_XMAXYMAX = 10
    };

    enum SVGMeetOrSliceType : uint8_t {
        SVG_MEETORSLICE_UNKNOWN = 0,
        SVG_MEETORSLICE_MEET = 1,
        SVG_MEETORSLICE_SLICE = 2
    };

    SVGPreserveAspectRatioValue() = default;
    SVGPreserveAspectRatioValue(StringView);
    WEBCORE_EXPORT SVGPreserveAspectRatioValue(SVGPreserveAspectRatioType, SVGMeetOrSliceType);

    bool operator==(const SVGPreserveAspectRatioValue&) const = default;

    ExceptionOr<void> setAlign(unsigned short);
    unsigned short align() const { return m_align; }

    ExceptionOr<void> setMeetOrSlice(unsigned short);
    unsigned short meetOrSlice() const { return m_meetOrSlice; }

    void transformRect(FloatRect& destRect, FloatRect& srcRect) const;

    AffineTransform getCTM(float logicalX, float logicalY, float logicalWidth, float logicalHeight, float physicalWidth, float physicalHeight) const;

    bool parse(StringView);
    bool parse(StringParsingBuffer<LChar>&, bool validate);
    bool parse(StringParsingBuffer<UChar>&, bool validate);

    String valueAsString() const;

private:
    friend struct IPC::ArgumentCoder<SVGPreserveAspectRatioValue, void>;
    SVGPreserveAspectRatioType m_align { SVGPreserveAspectRatioValue::SVG_PRESERVEASPECTRATIO_XMIDYMID };
    SVGMeetOrSliceType m_meetOrSlice { SVGPreserveAspectRatioValue::SVG_MEETORSLICE_MEET };

    template<typename CharacterType> bool parseInternal(StringParsingBuffer<CharacterType>&, bool validate);
};

template<> struct SVGPropertyTraits<SVGPreserveAspectRatioValue> {
    static SVGPreserveAspectRatioValue initialValue() { return SVGPreserveAspectRatioValue(); }
    static SVGPreserveAspectRatioValue fromString(const String& string) { return SVGPreserveAspectRatioValue(string); }
    static std::optional<SVGPreserveAspectRatioValue> parse(const QualifiedName&, const String&) { ASSERT_NOT_REACHED(); return initialValue(); }
    static String toString(const SVGPreserveAspectRatioValue& type) { return type.valueAsString(); }
};

} // namespace WebCore
