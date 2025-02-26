/*
 * Copyright (c) 2012-2013, Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FloatPoint.h"
#include "LayoutSize.h"

namespace WebCore {

class LayoutPoint {
public:
    constexpr LayoutPoint() = default;
    template<typename T, typename U> LayoutPoint(T x, U y) : m_x(x), m_y(y) { }
    LayoutPoint(const IntPoint& point) : m_x(point.x()), m_y(point.y()) { }
    explicit LayoutPoint(const FloatPoint& size) : m_x(size.x()), m_y(size.y()) { }
    explicit LayoutPoint(const LayoutSize& size) : m_x(size.width()), m_y(size.height()) { }

    static constexpr LayoutPoint zero() { return LayoutPoint(); }
    constexpr bool isZero() const { return !m_x && !m_y; }

    LayoutUnit x() const { return m_x; }
    LayoutUnit y() const { return m_y; }

    template<typename T> void setX(T x) { m_x = x; }
    template<typename T> void setY(T y) { m_y = y; }

    void move(const LayoutSize& s) { move(s.width(), s.height()); } 
    void moveBy(const LayoutPoint& offset) { move(offset.x(), offset.y()); }
    template<typename T, typename U> void move(T dx, U dy) { m_x += dx; m_y += dy; }
    
    friend bool operator==(const LayoutPoint&, const LayoutPoint&) = default;

    void scale(float s)
    {
        m_x *= s;
        m_y *= s;
    }
    
    void scale(float sx, float sy)
    {
        m_x *= sx;
        m_y *= sy;
    }

    LayoutPoint scaled(float s) const
    {
        return { m_x * s, m_y * s };
    }

    LayoutPoint scaled(float sx, float sy) const
    {
        return { m_x * sx, m_y * sy };
    }

    LayoutPoint constrainedBetween(const LayoutPoint& min, const LayoutPoint& max) const;

    LayoutPoint expandedTo(const LayoutPoint& other) const
    {
        return { std::max(m_x, other.m_x), std::max(m_y, other.m_y) };
    }

    LayoutPoint shrunkTo(const LayoutPoint& other) const
    {
        return { std::min(m_x, other.m_x), std::min(m_y, other.m_y) };
    }

    void clampNegativeToZero()
    {
        *this = expandedTo(zero());
    }

    LayoutPoint transposedPoint() const
    {
        return { m_y, m_x };
    }

    LayoutPoint fraction() const
    {
        return { m_x.fraction(), m_y.fraction() };
    }

    operator FloatPoint() const { return { m_x, m_y }; }

private:
    LayoutUnit m_x, m_y;
};

inline LayoutPoint& operator+=(LayoutPoint& a, const LayoutSize& b)
{
    a.move(b.width(), b.height());
    return a;
}

inline LayoutPoint& operator-=(LayoutPoint& a, const LayoutSize& b)
{
    a.move(-b.width(), -b.height());
    return a;
}

inline LayoutPoint operator+(const LayoutPoint& a, const LayoutSize& b)
{
    return LayoutPoint(a.x() + b.width(), a.y() + b.height());
}

inline LayoutPoint operator+(const LayoutPoint& a, const LayoutPoint& b)
{
    return LayoutPoint(a.x() + b.x(), a.y() + b.y());
}

inline LayoutSize operator-(const LayoutPoint& a, const LayoutPoint& b)
{
    return LayoutSize(a.x() - b.x(), a.y() - b.y());
}

inline LayoutPoint operator-(const LayoutPoint& a, const LayoutSize& b)
{
    return LayoutPoint(a.x() - b.width(), a.y() - b.height());
}

inline LayoutPoint operator-(const LayoutPoint& point)
{
    return LayoutPoint(-point.x(), -point.y());
}

inline LayoutPoint toLayoutPoint(const LayoutSize& size)
{
    return LayoutPoint(size.width(), size.height());
}

inline LayoutSize toLayoutSize(const LayoutPoint& point)
{
    return LayoutSize(point.x(), point.y());
}

inline IntPoint flooredIntPoint(const LayoutPoint& point)
{
    return IntPoint(point.x().floor(), point.y().floor());
}

inline IntPoint roundedIntPoint(const LayoutPoint& point)
{
    return IntPoint(point.x().round(), point.y().round());
}

inline IntPoint roundedIntPoint(const LayoutSize& size)
{
    return roundedIntPoint(toLayoutPoint(size));
}

inline IntPoint ceiledIntPoint(const LayoutPoint& point)
{
    return IntPoint(point.x().ceil(), point.y().ceil());
}

inline LayoutPoint flooredLayoutPoint(const FloatPoint& p)
{
    return LayoutPoint(LayoutUnit::fromFloatFloor(p.x()), LayoutUnit::fromFloatFloor(p.y()));
}

inline LayoutPoint ceiledLayoutPoint(const FloatPoint& p)
{
    return LayoutPoint(LayoutUnit::fromFloatCeil(p.x()), LayoutUnit::fromFloatCeil(p.y()));
}

inline IntSize snappedIntSize(const LayoutSize& size, const LayoutPoint& location)
{
    auto snap = [] (LayoutUnit a, LayoutUnit b) {
        LayoutUnit fraction = b.fraction();
        return roundToInt(fraction + a) - roundToInt(fraction);
    };
    return IntSize(snap(size.width(), location.x()), snap(size.height(), location.y()));
}

inline FloatPoint roundPointToDevicePixels(const LayoutPoint& point, float pixelSnappingFactor, bool directionalRoundingToRight = true, bool directionalRoundingToBottom = true)
{
    return FloatPoint(roundToDevicePixel(point.x(), pixelSnappingFactor, !directionalRoundingToRight), roundToDevicePixel(point.y(), pixelSnappingFactor, !directionalRoundingToBottom));
}

inline FloatPoint floorPointToDevicePixels(const LayoutPoint& point, float pixelSnappingFactor)
{
    return FloatPoint(floorToDevicePixel(point.x(), pixelSnappingFactor), floorToDevicePixel(point.y(), pixelSnappingFactor));
}

inline FloatPoint ceilPointToDevicePixels(const LayoutPoint& point, float pixelSnappingFactor)
{
    return FloatPoint(ceilToDevicePixel(point.x(), pixelSnappingFactor), ceilToDevicePixel(point.y(), pixelSnappingFactor));
}

inline FloatSize snapSizeToDevicePixel(const LayoutSize& size, const LayoutPoint& location, float pixelSnappingFactor)
{
    auto snap = [&] (LayoutUnit a, LayoutUnit b) {
        LayoutUnit fraction = b.fraction();
        return roundToDevicePixel(fraction + a, pixelSnappingFactor) - roundToDevicePixel(fraction, pixelSnappingFactor);
    };
    return FloatSize(snap(size.width(), location.x()), snap(size.height(), location.y()));
}

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const LayoutPoint&);

} // namespace WebCore

