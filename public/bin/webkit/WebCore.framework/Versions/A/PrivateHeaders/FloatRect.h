/*
 * Copyright (C) 2003-2024 Apple Inc.  All rights reserved.
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

#include "FloatPoint.h"
#include "LengthBox.h"

#if USE(CG)
typedef struct CGRect CGRect;
#endif

#if PLATFORM(MAC)
#ifdef NSGEOMETRY_TYPES_SAME_AS_CGGEOMETRY_TYPES
typedef struct CGRect NSRect;
#else
typedef struct _NSRect NSRect;
#endif
#endif // PLATFORM(MAC)

#if USE(CAIRO)
typedef struct _cairo_rectangle cairo_rectangle_t;
#endif

#if USE(SKIA)
struct SkRect;
#endif

#if PLATFORM(WIN)
typedef struct tagRECT RECT;
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

class IntRect;
class IntPoint;

class FloatRect {
public:
    enum ContainsMode {
        InsideOrOnStroke,
        InsideButNotOnStroke
    };

    constexpr FloatRect() = default;
    constexpr FloatRect(const FloatPoint& location, const FloatSize& size)
        : m_location(location), m_size(size) { }
    constexpr FloatRect(float x, float y, float width, float height)
        : m_location(FloatPoint(x, y)), m_size(FloatSize(width, height)) { }
    constexpr FloatRect(const FloatPoint& topLeft, const FloatPoint& bottomRight)
        : m_location(topLeft), m_size(FloatSize(bottomRight.x() - topLeft.x(), bottomRight.y() - topLeft.y())) { }
    WEBCORE_EXPORT FloatRect(const IntRect&);

    static FloatRect narrowPrecision(double x, double y, double width, double height);

    constexpr FloatPoint location() const { return m_location; }
    constexpr FloatSize size() const { return m_size; }

    void setLocation(const FloatPoint& location) { m_location = location; }
    void setSize(const FloatSize& size) { m_size = size; }

    constexpr float x() const { return m_location.x(); }
    constexpr float y() const { return m_location.y(); }
    constexpr float maxX() const { return x() + width(); }
    constexpr float maxY() const { return y() + height(); }
    constexpr float width() const { return m_size.width(); }
    constexpr float height() const { return m_size.height(); }

    constexpr float area() const { return m_size.area(); }

    void setX(float x) { m_location.setX(x); }
    void setY(float y) { m_location.setY(y); }
    void setWidth(float width) { m_size.setWidth(width); }
    void setHeight(float height) { m_size.setHeight(height); }

    constexpr bool isEmpty() const { return m_size.isEmpty(); }
    constexpr bool isZero() const { return m_size.isZero(); }
    bool isExpressibleAsIntRect() const;

    constexpr FloatPoint center() const { return location() + size() / 2; }

    void move(const FloatSize& delta) { m_location += delta; } 
    void moveBy(const FloatPoint& delta) { m_location.move(delta.x(), delta.y()); }
    void move(float dx, float dy) { m_location.move(dx, dy); }

    void expand(const FloatSize& size) { m_size += size; }
    void expand(const FloatBoxExtent& box)
    {
        m_location.move(-box.left(), -box.top());
        m_size.expand(box.left() + box.right(), box.top() + box.bottom());
    }
    void expand(float dw, float dh) { m_size.expand(dw, dh); }
    void contract(const FloatSize& size) { m_size -= size; }
    void contract(const FloatBoxExtent& box)
    {
        m_location.move(box.left(), box.top());
        m_size.expand(-(box.left() + box.right()), -(box.top() + box.bottom()));
    }
    void contract(float dw, float dh) { m_size.expand(-dw, -dh); }

    void shiftXEdgeTo(float edge)
    {
        float delta = edge - x();
        setX(edge);
        setWidth(std::max(0.0f, width() - delta));
    }

    void shiftMaxXEdgeTo(float edge)
    {
        float delta = edge - maxX();
        setWidth(std::max(0.0f, width() + delta));
    }

    void shiftYEdgeTo(float edge)
    {
        float delta = edge - y();
        setY(edge);
        setHeight(std::max(0.0f, height() - delta));
    }

    void shiftMaxYEdgeTo(float edge)
    {
        float delta = edge - maxY();
        setHeight(std::max(0.0f, height() + delta));
    }

    void shiftXEdgeBy(float delta)
    {
        move(delta, 0);
        setWidth(std::max(0.0f, width() - delta));
    }

    void shiftMaxXEdgeBy(float delta)
    {
        shiftMaxXEdgeTo(maxX() + delta);
    }

    void shiftYEdgeBy(float delta)
    {
        move(0, delta);
        setHeight(std::max(0.0f, height() - delta));
    }

    void shiftMaxYEdgeBy(float delta)
    {
        shiftMaxYEdgeTo(maxY() + delta);
    }

    constexpr FloatPoint minXMinYCorner() const { return m_location; } // typically topLeft
    constexpr FloatPoint maxXMinYCorner() const { return FloatPoint(m_location.x() + m_size.width(), m_location.y()); } // typically topRight
    constexpr FloatPoint minXMaxYCorner() const { return FloatPoint(m_location.x(), m_location.y() + m_size.height()); } // typically bottomLeft
    constexpr FloatPoint maxXMaxYCorner() const { return FloatPoint(m_location.x() + m_size.width(), m_location.y() + m_size.height()); } // typically bottomRight

    WEBCORE_EXPORT bool intersects(const FloatRect&) const;
    WEBCORE_EXPORT bool inclusivelyIntersects(const FloatRect&) const;
    WEBCORE_EXPORT bool contains(const FloatRect&) const;
    WEBCORE_EXPORT bool contains(const FloatPoint&, ContainsMode = InsideOrOnStroke) const;

    WEBCORE_EXPORT void intersect(const FloatRect&);
    bool edgeInclusiveIntersect(const FloatRect&);
    WEBCORE_EXPORT void unite(const FloatRect&);
    void uniteEvenIfEmpty(const FloatRect&);
    void uniteIfNonZero(const FloatRect&);
    WEBCORE_EXPORT void extend(const FloatPoint&);

    // Note, this doesn't match what IntRect::contains(IntPoint&) does; the int version
    // is really checking for containment of 1x1 rect, but that doesn't make sense with floats.
    constexpr bool contains(float px, float py) const
        { return px >= x() && px <= maxX() && py >= y() && py <= maxY(); }

    constexpr bool overlapsYRange(float y1, float y2) const { return !isEmpty() && y2 >= y1 && y2 >= y() && y1 <= maxY(); }
    constexpr bool overlapsXRange(float x1, float x2) const { return !isEmpty() && x2 >= x1 && x2 >= x() && x1 <= maxX(); }

    void inflateX(float dx) {
        m_location.setX(m_location.x() - dx);
        m_size.setWidth(m_size.width() + dx + dx);
    }
    void inflateY(float dy) {
        m_location.setY(m_location.y() - dy);
        m_size.setHeight(m_size.height() + dy + dy);
    }
    void inflate(float d) { inflateX(d); inflateY(d); }
    void inflate(FloatSize size) { inflateX(size.width()); inflateY(size.height()); }
    void inflate(float dx, float dy, float dmaxX, float dmaxY);

    void scale(float s) { scale(s, s); }
    WEBCORE_EXPORT void scale(float sx, float sy);
    void scale(FloatSize size) { scale(size.width(), size.height()); }

    constexpr FloatRect transposedRect() const { return FloatRect(m_location.transposedPoint(), m_size.transposedSize()); }

#if USE(CG)
    WEBCORE_EXPORT FloatRect(const CGRect&);
    WEBCORE_EXPORT operator CGRect() const;
#endif

#if PLATFORM(MAC) && !defined(NSGEOMETRY_TYPES_SAME_AS_CGGEOMETRY_TYPES)
    WEBCORE_EXPORT FloatRect(const NSRect&);
    WEBCORE_EXPORT operator NSRect() const;
#endif

#if USE(SKIA)
    FloatRect(const SkRect&);
    operator SkRect() const;
#endif

#if USE(CAIRO)
    FloatRect(const cairo_rectangle_t&);
    operator cairo_rectangle_t() const;
#endif

#if PLATFORM(WIN)
    WEBCORE_EXPORT FloatRect(const RECT&);
#endif

    static constexpr FloatRect infiniteRect();
    constexpr bool isInfinite() const;

    static constexpr FloatRect smallestRect();
    constexpr bool isSmallest() const;

    static constexpr FloatRect nanRect();
    constexpr bool isNaN() const;

    WEBCORE_EXPORT String toJSONString() const;
    WEBCORE_EXPORT Ref<JSON::Object> toJSONObject() const;

    friend bool operator==(const FloatRect&, const FloatRect&) = default;

    struct MarkableTraits {
        constexpr static bool isEmptyValue(const FloatRect& rect)
        {
            return rect.isNaN();
        }

        constexpr static FloatRect emptyValue()
        {
            return FloatRect::nanRect();
        }
    };

private:
    FloatPoint m_location;
    FloatSize m_size;

    void setLocationAndSizeFromEdges(float left, float top, float right, float bottom)
    {
        m_location.set(left, top);
        m_size.setWidth(right - left);
        m_size.setHeight(bottom - top);
    }
};

inline FloatRect intersection(const FloatRect& a, const FloatRect& b)
{
    FloatRect c = a;
    c.intersect(b);
    return c;
}

inline FloatRect unionRect(const FloatRect& a, const FloatRect& b)
{
    FloatRect c = a;
    c.unite(b);
    return c;
}

inline FloatRect& operator+=(FloatRect& a, const FloatRect& b)
{
    a.move(b.x(), b.y());
    a.setWidth(a.width() + b.width());
    a.setHeight(a.height() + b.height());
    return a;
}

constexpr FloatRect operator+(const FloatRect& a, const FloatRect& b)
{
    return FloatRect {
        a.x() + b.x(),
        a.y() + b.y(),
        a.width() + b.width(),
        a.height() + b.height(),
    };
}

inline FloatRect operator+(const FloatRect& a, const FloatBoxExtent& b)
{
    FloatRect c = a;
    c.expand(b);
    return c;
}

inline bool areEssentiallyEqual(const FloatRect& a, const FloatRect& b)
{
    return areEssentiallyEqual(a.location(), b.location()) && areEssentiallyEqual(a.size(), b.size());
}

constexpr FloatRect FloatRect::infiniteRect()
{
    return {
        -std::numeric_limits<float>::max() / 2,
        -std::numeric_limits<float>::max() / 2,
        std::numeric_limits<float>::max(),
        std::numeric_limits<float>::max()
    };
}

constexpr bool FloatRect::isInfinite() const
{
    return *this == infiniteRect();
}

constexpr FloatRect FloatRect::smallestRect()
{
    return {
        std::numeric_limits<float>::max() / 2,
        std::numeric_limits<float>::max() / 2,
        -std::numeric_limits<float>::max(),
        -std::numeric_limits<float>::max()
    };
}

constexpr bool FloatRect::isSmallest() const
{
    return *this == smallestRect();
}

constexpr FloatRect FloatRect::nanRect()
{
    return {
        std::numeric_limits<float>::quiet_NaN(),
        std::numeric_limits<float>::quiet_NaN(),
        std::numeric_limits<float>::quiet_NaN(),
        std::numeric_limits<float>::quiet_NaN()
    };
}

constexpr bool FloatRect::isNaN() const
{
    return isNaNConstExpr(x());
}

inline void FloatRect::inflate(float deltaX, float deltaY, float deltaMaxX, float deltaMaxY)
{
    setX(x() - deltaX);
    setY(y() - deltaY);
    setWidth(width() + deltaX + deltaMaxX);
    setHeight(height() + deltaY + deltaMaxY);
}

FloatRect normalizeRect(const FloatRect&);
WEBCORE_EXPORT FloatRect encloseRectToDevicePixels(const FloatRect&, float deviceScaleFactor);
WEBCORE_EXPORT IntRect enclosingIntRect(const FloatRect&);
WEBCORE_EXPORT IntRect enclosingIntRectPreservingEmptyRects(const FloatRect&);
WEBCORE_EXPORT IntRect roundedIntRect(const FloatRect&);

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FloatRect&);

#ifdef __OBJC__
WEBCORE_EXPORT id makeNSArrayElement(const FloatRect&);
#endif

}

namespace WTF {

template<typename Type> struct LogArgument;
template <>
struct LogArgument<WebCore::FloatRect> {
    static String toString(const WebCore::FloatRect& rect)
    {
        return rect.toJSONString();
    }
};

} // namespace WTF
