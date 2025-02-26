/*
 * Copyright (C) 2004-2016 Apple Inc.  All rights reserved.
 * Copyright (C) 2005 Nokia.  All rights reserved.
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

#include "FloatSize.h"
#include "IntPoint.h"
#include <wtf/Hasher.h>
#include <wtf/MathExtras.h>
#include <wtf/TZoneMalloc.h>

#if USE(CG)
typedef struct CGPoint CGPoint;
#endif

#if PLATFORM(MAC)
#ifdef NSGEOMETRY_TYPES_SAME_AS_CGGEOMETRY_TYPES
typedef struct CGPoint NSPoint;
#else
typedef struct _NSPoint NSPoint;
#endif
#endif // PLATFORM(MAC)

namespace WTF {
class TextStream;
}

namespace WebCore {

class AffineTransform;
class TransformationMatrix;
class IntSize;
class FloatRect;

class FloatPoint {
    WTF_MAKE_TZONE_ALLOCATED(FloatPoint);
public:
    constexpr FloatPoint() = default;
    constexpr FloatPoint(float x, float y) : m_x(x), m_y(y) { }
    WEBCORE_EXPORT FloatPoint(const IntPoint&);
    explicit FloatPoint(const FloatSize& size) : m_x(size.width()), m_y(size.height()) { }

    static constexpr FloatPoint zero() { return FloatPoint(); }
    constexpr bool isZero() const { return !m_x && !m_y; }

    WEBCORE_EXPORT static FloatPoint narrowPrecision(double x, double y);

    constexpr float x() const { return m_x; }
    constexpr float y() const { return m_y; }

    void setX(float x) { m_x = x; }
    void setY(float y) { m_y = y; }

    void set(float x, float y)
    {
        m_x = x;
        m_y = y;
    }

    void move(float dx, float dy)
    {
        m_x += dx;
        m_y += dy;
    }

    void move(const IntSize& a)
    {
        m_x += a.width();
        m_y += a.height();
    }

    void move(const FloatSize& a)
    {
        m_x += a.width();
        m_y += a.height();
    }

    void moveBy(const IntPoint& a)
    {
        m_x += a.x();
        m_y += a.y();
    }

    void moveBy(const FloatPoint& a)
    {
        m_x += a.x();
        m_y += a.y();
    }

    void scale(float scale)
    {
        m_x *= scale;
        m_y *= scale;
    }

    void scale(float scaleX, float scaleY)
    {
        m_x *= scaleX;
        m_y *= scaleY;
    }

    constexpr FloatPoint scaled(float scale) const
    {
        return { m_x * scale, m_y * scale };
    }

    constexpr FloatPoint scaled(float scaleX, float scaleY) const
    {
        return { m_x * scaleX, m_y * scaleY };
    }

    void rotate(double angleInRadians, const FloatPoint& aboutPoint);

    WEBCORE_EXPORT void normalize();

    constexpr float dot(const FloatPoint& a) const
    {
        return m_x * a.x() + m_y * a.y();
    }

    float slopeAngleRadians() const;

    float length() const
    {
        return std::hypot(m_x, m_y);
    }

    constexpr float lengthSquared() const
    {
        return m_x * m_x + m_y * m_y;
    }

    WEBCORE_EXPORT FloatPoint constrainedBetween(const FloatPoint& min, const FloatPoint& max) const;
    
    WEBCORE_EXPORT FloatPoint constrainedWithin(const FloatRect&) const;

    constexpr FloatPoint shrunkTo(const FloatPoint& other) const
    {
        return { std::min(m_x, other.m_x), std::min(m_y, other.m_y) };
    }

    constexpr FloatPoint expandedTo(const FloatPoint& other) const
    {
        return { std::max(m_x, other.m_x), std::max(m_y, other.m_y) };
    }

    constexpr FloatPoint transposedPoint() const
    {
        return { m_y, m_x };
    }

#if USE(CG)
    WEBCORE_EXPORT FloatPoint(const CGPoint&);
    WEBCORE_EXPORT operator CGPoint() const;
#endif

#if PLATFORM(MAC) && !defined(NSGEOMETRY_TYPES_SAME_AS_CGGEOMETRY_TYPES)
    WEBCORE_EXPORT FloatPoint(const NSPoint&);
    WEBCORE_EXPORT operator NSPoint() const;
#endif

    WEBCORE_EXPORT FloatPoint matrixTransform(const TransformationMatrix&) const;
    WEBCORE_EXPORT FloatPoint matrixTransform(const AffineTransform&) const;

    static constexpr FloatPoint nanPoint();
    constexpr bool isNaN() const;

    WEBCORE_EXPORT String toJSONString() const;
    WEBCORE_EXPORT Ref<JSON::Object> toJSONObject() const;

    friend bool operator==(const FloatPoint&, const FloatPoint&) = default;

    struct MarkableTraits {
        constexpr static bool isEmptyValue(const FloatPoint& point)
        {
            return point.isNaN();
        }

        constexpr static FloatPoint emptyValue()
        {
            return FloatPoint::nanPoint();
        }
    };

private:
    float m_x { 0 };
    float m_y { 0 };
};


inline FloatPoint& operator+=(FloatPoint& a, const FloatSize& b)
{
    a.move(b.width(), b.height());
    return a;
}

inline FloatPoint& operator+=(FloatPoint& a, const FloatPoint& b)
{
    a.move(b.x(), b.y());
    return a;
}

inline FloatPoint& operator-=(FloatPoint& a, const FloatSize& b)
{
    a.move(-b.width(), -b.height());
    return a;
}

constexpr FloatPoint operator+(const FloatPoint& a, const FloatSize& b)
{
    return FloatPoint(a.x() + b.width(), a.y() + b.height());
}

constexpr FloatPoint operator+(const FloatPoint& a, const FloatPoint& b)
{
    return FloatPoint(a.x() + b.x(), a.y() + b.y());
}

constexpr FloatSize operator-(const FloatPoint& a, const FloatPoint& b)
{
    return FloatSize(a.x() - b.x(), a.y() - b.y());
}

constexpr FloatPoint operator-(const FloatPoint& a, const FloatSize& b)
{
    return FloatPoint(a.x() - b.width(), a.y() - b.height());
}

constexpr FloatPoint operator-(const FloatPoint& a)
{
    return FloatPoint(-a.x(), -a.y());
}

constexpr float operator*(const FloatPoint& a, const FloatPoint& b)
{
    // dot product
    return a.dot(b);
}

inline void FloatPoint::rotate(double angleInRadians, const FloatPoint& aboutPoint = { })
{
    auto sinAngle = sin(angleInRadians);
    auto cosAngle = cos(angleInRadians);
    m_x -= aboutPoint.x();
    m_y -= aboutPoint.y();
    auto newX = m_x * cosAngle - m_y * sinAngle + aboutPoint.x();
    m_y = m_x * sinAngle + m_y * cosAngle + aboutPoint.y();
    m_x = newX;
}

inline IntSize flooredIntSize(const FloatPoint& p)
{
    return IntSize(clampToInteger(floorf(p.x())), clampToInteger(floorf(p.y())));
}

inline IntPoint roundedIntPoint(const FloatPoint& p)
{
    return IntPoint(clampToInteger(roundf(p.x())), clampToInteger(roundf(p.y())));
}

inline IntPoint flooredIntPoint(const FloatPoint& p)
{
    return IntPoint(clampToInteger(floorf(p.x())), clampToInteger(floorf(p.y())));
}

inline IntPoint ceiledIntPoint(const FloatPoint& p)
{
    return IntPoint(clampToInteger(ceilf(p.x())), clampToInteger(ceilf(p.y())));
}

inline FloatPoint floorPointToDevicePixels(const FloatPoint& p, float deviceScaleFactor)
{
    return FloatPoint(floorf(p.x() * deviceScaleFactor)  / deviceScaleFactor, floorf(p.y() * deviceScaleFactor)  / deviceScaleFactor);
}

inline FloatPoint ceilPointToDevicePixels(const FloatPoint& p, float deviceScaleFactor)
{
    return FloatPoint(ceilf(p.x() * deviceScaleFactor)  / deviceScaleFactor, ceilf(p.y() * deviceScaleFactor)  / deviceScaleFactor);
}

inline FloatSize toFloatSize(const FloatPoint& a)
{
    return FloatSize(a.x(), a.y());
}

inline FloatPoint toFloatPoint(const FloatSize& a)
{
    return FloatPoint(a.width(), a.height());
}

inline bool areEssentiallyEqual(const FloatPoint& a, const FloatPoint& b)
{
    return WTF::areEssentiallyEqual(a.x(), b.x()) && WTF::areEssentiallyEqual(a.y(), b.y());
}

inline void add(Hasher& hasher, const FloatPoint& point)
{
    add(hasher, point.x(), point.y());
}

constexpr FloatPoint FloatPoint::nanPoint()
{
    return {
        std::numeric_limits<float>::quiet_NaN(),
        std::numeric_limits<float>::quiet_NaN()
    };
}

constexpr bool FloatPoint::isNaN() const
{
    return isNaNConstExpr(x());
}

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FloatPoint&);

}

namespace WTF {

template<typename Type> struct LogArgument;
template <>
struct LogArgument<WebCore::FloatPoint> {
    static String toString(const WebCore::FloatPoint& point)
    {
        return point.toJSONString();
    }
};

} // namespace WTF
