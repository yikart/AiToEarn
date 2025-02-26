/*
 * Copyright (C) 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials
 *    provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef FloatRoundedRect_h
#define FloatRoundedRect_h

#include "FloatRect.h"
#include "FloatSize.h"
#include "Region.h"
#include "RoundedRect.h"
#include <wtf/TZoneMalloc.h>

#if USE(SKIA)
class SkRRect;
#endif

namespace WebCore {

class FloatRoundedRect {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FloatRoundedRect, WEBCORE_EXPORT);
public:
    class Radii {
        WTF_MAKE_TZONE_ALLOCATED(Radii);
    public:
        Radii() = default;
        Radii(const FloatSize& topLeft, const FloatSize& topRight, const FloatSize& bottomLeft, const FloatSize& bottomRight)
            : m_topLeft(topLeft)
            , m_topRight(topRight)
            , m_bottomLeft(bottomLeft)
            , m_bottomRight(bottomRight)
        {
        }

        Radii(const RoundedRect::Radii& intRadii)
            : m_topLeft(intRadii.topLeft())
            , m_topRight(intRadii.topRight())
            , m_bottomLeft(intRadii.bottomLeft())
            , m_bottomRight(intRadii.bottomRight())
        {
        }

        explicit Radii(float uniformRadius)
            : m_topLeft(uniformRadius, uniformRadius)
            , m_topRight(uniformRadius, uniformRadius)
            , m_bottomLeft(uniformRadius, uniformRadius)
            , m_bottomRight(uniformRadius, uniformRadius)
        {
        }

        explicit Radii(float uniformRadiusWidth, float uniformRadiusHeight)
            : m_topLeft(uniformRadiusWidth, uniformRadiusHeight)
            , m_topRight(uniformRadiusWidth, uniformRadiusHeight)
            , m_bottomLeft(uniformRadiusWidth, uniformRadiusHeight)
            , m_bottomRight(uniformRadiusWidth, uniformRadiusHeight)
        {
        }

        void setTopLeft(const FloatSize& size) { m_topLeft = size; }
        void setTopRight(const FloatSize& size) { m_topRight = size; }
        void setBottomLeft(const FloatSize& size) { m_bottomLeft = size; }
        void setBottomRight(const FloatSize& size) { m_bottomRight = size; }
        const FloatSize& topLeft() const { return m_topLeft; }
        const FloatSize& topRight() const { return m_topRight; }
        const FloatSize& bottomLeft() const { return m_bottomLeft; }
        const FloatSize& bottomRight() const { return m_bottomRight; }

        bool isZero() const;
        bool hasEvenCorners() const;
        bool isUniformCornerRadius() const; // Including no radius.

        void scale(float factor);
        void scale(float horizontalFactor, float verticalFactor);
        void expandEvenIfZero(float size);
        void expand(float topWidth, float bottomWidth, float leftWidth, float rightWidth);
        void expand(float size) { expand(size, size, size, size); }
        void shrink(float topWidth, float bottomWidth, float leftWidth, float rightWidth) { expand(-topWidth, -bottomWidth, -leftWidth, -rightWidth); }
        void shrink(float size) { shrink(size, size, size, size); }

        friend bool operator==(const Radii&, const Radii&) = default;

    private:
        FloatSize m_topLeft;
        FloatSize m_topRight;
        FloatSize m_bottomLeft;
        FloatSize m_bottomRight;
    };

    WEBCORE_EXPORT explicit FloatRoundedRect(const FloatRect& = FloatRect(), const Radii& = Radii());
    WEBCORE_EXPORT FloatRoundedRect(const FloatRect&, const FloatSize& topLeft, const FloatSize& topRight, const FloatSize& bottomLeft, const FloatSize& bottomRight);
    explicit FloatRoundedRect(const RoundedRect&);
    FloatRoundedRect(float x, float y, float width, float height);

    const FloatRect& rect() const { return m_rect; }
    const Radii& radii() const { return m_radii; }
    bool isRounded() const { return !m_radii.isZero(); }
    bool isEmpty() const { return m_rect.isEmpty(); }

    void setRect(const FloatRect& rect) { m_rect = rect; }
    void setLocation(FloatPoint location) { m_rect.setLocation(location); }
    void setRadii(const Radii& radii) { m_radii = radii; }

    void move(const FloatSize& size) { m_rect.move(size); }
    void inflate(float size) { m_rect.inflate(size);  }
    void expandRadii(float size) { m_radii.expand(size); }
    void shrinkRadii(float size) { m_radii.shrink(size); }
    void inflateWithRadii(float size);
    void adjustRadii();

    FloatRect topLeftCorner() const
    {
        return FloatRect(m_rect.x(), m_rect.y(), m_radii.topLeft().width(), m_radii.topLeft().height());
    }
    FloatRect topRightCorner() const
    {
        return FloatRect(m_rect.maxX() - m_radii.topRight().width(), m_rect.y(), m_radii.topRight().width(), m_radii.topRight().height());
    }
    FloatRect bottomLeftCorner() const
    {
        return FloatRect(m_rect.x(), m_rect.maxY() - m_radii.bottomLeft().height(), m_radii.bottomLeft().width(), m_radii.bottomLeft().height());
    }
    FloatRect bottomRightCorner() const
    {
        return FloatRect(m_rect.maxX() - m_radii.bottomRight().width(), m_rect.maxY() - m_radii.bottomRight().height(), m_radii.bottomRight().width(), m_radii.bottomRight().height());
    }

    bool isRenderable() const;
    bool xInterceptsAtY(float y, float& minXIntercept, float& maxXIntercept) const;

    bool intersectionIsRectangular(const FloatRect&) const;

    friend bool operator==(const FloatRoundedRect&, const FloatRoundedRect&) = default;

#if USE(SKIA)
    FloatRoundedRect(const SkRRect&);
    operator SkRRect() const;
#endif

private:
    FloatRect m_rect;
    Radii m_radii;
};

inline float calcBorderRadiiConstraintScaleFor(const FloatRect& rect, const FloatRoundedRect::Radii& radii)
{
    // Constrain corner radii using CSS3 rules:
    // http://www.w3.org/TR/css3-background/#the-border-radius

    float factor = 1;
    float radiiSum;

    // top
    radiiSum = radii.topLeft().width() + radii.topRight().width(); // Casts to avoid integer overflow.
    if (radiiSum > rect.width())
        factor = std::min(rect.width() / radiiSum, factor);

    // bottom
    radiiSum = radii.bottomLeft().width() + radii.bottomRight().width();
    if (radiiSum > rect.width())
        factor = std::min(rect.width() / radiiSum, factor);

    // left
    radiiSum = radii.topLeft().height() + radii.bottomLeft().height();
    if (radiiSum > rect.height())
        factor = std::min(rect.height() / radiiSum, factor);

    // right
    radiiSum = radii.topRight().height() + radii.bottomRight().height();
    if (radiiSum > rect.height())
        factor = std::min(rect.height() / radiiSum, factor);

    ASSERT(factor <= 1);
    return factor;
}

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FloatRoundedRect&);

// Snip away rectangles from corners, roughly one per step length of arc.
WEBCORE_EXPORT Region approximateAsRegion(const FloatRoundedRect&, unsigned stepLength = 20);

} // namespace WebCore

#endif // FloatRoundedRect_h
