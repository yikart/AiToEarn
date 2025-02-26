/*
 * Copyright (C) 2002, 2003 The Karbon Developers
 * Copyright (C) 2006 Alexander Kellett <lypanov@kde.org>
 * Copyright (C) 2006, 2007 Rob Buis <buis@kde.org>
 * Copyright (C) 2007, 2009, 2015 Apple Inc. All rights reserved.
 * Copyright (C) Research In Motion Limited 2010. All rights reserved.
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

#include "FloatPoint.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class SVGPathConsumer;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::SVGPathConsumer> : std::true_type { };
}

namespace WebCore {

enum PathCoordinateMode {
    AbsoluteCoordinates,
    RelativeCoordinates
};

enum PathParsingMode {
    NormalizedParsing,
    UnalteredParsing
};

class SVGPathConsumer : public CanMakeSingleThreadWeakPtr<SVGPathConsumer> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(SVGPathConsumer);
    WTF_MAKE_NONCOPYABLE(SVGPathConsumer);
public:
    SVGPathConsumer() = default;
    virtual void incrementPathSegmentCount() = 0;
    virtual bool continueConsuming() = 0;

    // Used in UnalteredParsing/NormalizedParsing modes.
    virtual void moveTo(const FloatPoint&, bool closed, PathCoordinateMode) = 0;
    virtual void lineTo(const FloatPoint&, PathCoordinateMode) = 0;
    virtual void curveToCubic(const FloatPoint& controlPoint1, const FloatPoint& controlPoint2, const FloatPoint&, PathCoordinateMode) = 0;
    virtual void closePath() = 0;

    // Only used in UnalteredParsing mode.
    virtual void lineToHorizontal(float, PathCoordinateMode) = 0;
    virtual void lineToVertical(float, PathCoordinateMode) = 0;
    virtual void curveToCubicSmooth(const FloatPoint& controlPoint2, const FloatPoint& targetPoint, PathCoordinateMode) = 0;
    virtual void curveToQuadratic(const FloatPoint& controlPoint, const FloatPoint& targetPoint, PathCoordinateMode) = 0;
    virtual void curveToQuadraticSmooth(const FloatPoint& targetPoint, PathCoordinateMode) = 0;
    virtual void arcTo(float r1, float r2, float angle, bool largeArcFlag, bool sweepFlag, const FloatPoint&, PathCoordinateMode) = 0;

protected:
    virtual ~SVGPathConsumer() = default;
};

} // namespace WebCore
