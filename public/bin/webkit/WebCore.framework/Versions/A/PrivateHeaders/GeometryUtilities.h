/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "FloatRect.h"
#include "IntRect.h"
#include <wtf/Forward.h>

#include <wtf/Vector.h>

namespace WebCore {

class FloatQuad;

float euclidianDistance(const FloatSize&);
WEBCORE_EXPORT float euclidianDistance(const FloatPoint&, const FloatPoint&);

// Find point where lines through the two pairs of points intersect. Returns false if the lines don't intersect.
WEBCORE_EXPORT bool findIntersection(const FloatPoint& p1, const FloatPoint& p2, const FloatPoint& d1, const FloatPoint& d2, FloatPoint& intersection);

WEBCORE_EXPORT IntRect unionRect(const Vector<IntRect>&);
WEBCORE_EXPORT IntRect unionRectIgnoringZeroRects(const Vector<IntRect>&);
WEBCORE_EXPORT FloatRect unionRect(const Vector<FloatRect>&);
WEBCORE_EXPORT FloatRect unionRectIgnoringZeroRects(const Vector<FloatRect>&);

// Map point from srcRect to an equivalent point in destRect.
FloatPoint mapPoint(FloatPoint, const FloatRect& srcRect, const FloatRect& destRect);

// Map rect from srcRect to an equivalent rect in destRect.
WEBCORE_EXPORT FloatRect mapRect(const FloatRect&, const FloatRect& srcRect, const FloatRect& destRect);

WEBCORE_EXPORT FloatRect largestRectWithAspectRatioInsideRect(float aspectRatio, const FloatRect&);
WEBCORE_EXPORT FloatRect smallestRectWithAspectRatioAroundRect(float aspectRatio, const FloatRect&);

FloatSize sizeWithAreaAndAspectRatio(float area, float aspectRatio);

// Compute a rect that encloses all points covered by the given rect if it were rotated a full turn around (0,0).
FloatRect boundsOfRotatingRect(const FloatRect&);

bool ellipseContainsPoint(const FloatPoint& center, const FloatSize& radii, const FloatPoint&);

FloatPoint midPoint(const FloatPoint&, const FloatPoint&);

// -------------
// |   h\  |s  |
// |     \a|   |
// |      \|   |
// |       *   |
// |     (x,y) |
// -------------
// Given a box and a ray (described by an offset from the top left corner of the box and angle from vertical in degrees), compute
// the length from the starting position to the intersection of the ray with the box. Given the above diagram, we are
// trying to calculate h, with lengthOfPointToSideOfIntersection computing the length of s, and angleOfPointToSideOfIntersection
// computing a.
double lengthOfRayIntersectionWithBoundingBox(const FloatRect& boundingRect, const std::pair<const FloatPoint&, float> ray);

// Given a box and a ray (described by an offset from the top left corner of the box and angle from vertical in degrees),
// compute the closest length from the starting position to the side that the ray intersects with.
double lengthOfPointToSideOfIntersection(const FloatRect& boundingRect, const std::pair<const FloatPoint&, float> ray);

// Given a box and a ray (described by an offset from the top left corner of the box and angle from vertical in degrees)
// compute the acute angle between the ray and the line segment from the starting point to the closest point on the
// side that the ray intersects with.
float angleOfPointToSideOfIntersection(const FloatRect& boundingRect, const std::pair<const FloatPoint&, float> ray);

// Given a box and an offset from the top left corner, calculate the distance of the point from each side
RectEdges<double> distanceOfPointToSidesOfRect(const FloatRect&, const FloatPoint&);

float distanceToClosestSide(FloatPoint, FloatSize);
float distanceToFarthestSide(FloatPoint, FloatSize);
float distanceToClosestCorner(FloatPoint, FloatSize);
float distanceToFarthestCorner(FloatPoint, FloatSize);

// Given a box and an offset from the top left corner, construct a coordinate system with this offset as the origin,
// and return the vertices of the box in this coordinate system
std::array<FloatPoint, 4> verticesForBox(const FloatRect&, const FloatPoint);

float toPositiveAngle(float angle);
float toRelatedAcuteAngle(float angle);

float normalizeAngleInRadians(float radians);

struct RotatedRect {
    FloatPoint center;
    FloatSize size;
    float angleInRadians;
};

WEBCORE_EXPORT RotatedRect rotatedBoundingRectWithMinimumAngleOfRotation(const FloatQuad&, std::optional<float> minRotationInRadians = std::nullopt);

static inline float min4(float a, float b, float c, float d)
{
    return std::min(std::min(a, b), std::min(c, d));
}

static inline float max4(float a, float b, float c, float d)
{
    return std::max(std::max(a, b), std::max(c, d));
}

}
