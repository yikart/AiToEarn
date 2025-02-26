/*
 * Copyright (C) Research In Motion Limited 2010, 2012. All rights reserved.
 * Copyright (C) 2015-2019 Apple Inc. All rights reserved.
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

#include "SVGPathConsumer.h"
#include <wtf/text/WTFString.h>

namespace WebCore {

class FloatPoint;
class Path;
class SVGPathByteStream;
class SVGPathSeg;
class SVGPathSegList;

// Path -> String
String buildStringFromPath(const Path&);

// String/SVGPathByteStream -> Path
Path buildPathFromString(StringView);
Path buildPathFromByteStream(const SVGPathByteStream&);

// SVGPathSegList/String -> SVGPathByteStream
bool buildSVGPathByteStreamFromSVGPathSegList(const SVGPathSegList&, SVGPathByteStream& result, PathParsingMode, bool checkForInitialMoveTo = true);
bool buildSVGPathByteStreamFromString(StringView, SVGPathByteStream&, PathParsingMode);

// SVGPathByteStream -> String
bool buildStringFromByteStream(const SVGPathByteStream&, String&, PathParsingMode, bool checkForInitialMoveTo = true);

// SVGPathByteStream -> SVGPathSegList
bool buildSVGPathSegListFromByteStream(const SVGPathByteStream&, SVGPathSegList&, PathParsingMode);

bool canBlendSVGPathByteStreams(const SVGPathByteStream& from, const SVGPathByteStream& to);

bool buildAnimatedSVGPathByteStream(const SVGPathByteStream& from, const SVGPathByteStream& to, SVGPathByteStream& result, float progress);
bool addToSVGPathByteStream(SVGPathByteStream& streamToAppendTo, const SVGPathByteStream& from, unsigned repeatCount = 1);

unsigned getSVGPathSegAtLengthFromSVGPathByteStream(const SVGPathByteStream&, float length);
float getTotalLengthOfSVGPathByteStream(const SVGPathByteStream&);
FloatPoint getPointAtLengthOfSVGPathByteStream(const SVGPathByteStream&, float length);

// Convert an SVG path byte stream containing a mixed of relative/absolute draw commands into another byte stream
// such that all draw commands are absolute. Returns nullptr if an error occurs.
std::optional<SVGPathByteStream> convertSVGPathByteStreamToAbsoluteCoordinates(const SVGPathByteStream&);

} // namespace WebCore
