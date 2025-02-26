/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "LayoutRect.h"
#include "LayoutUnits.h"

namespace WebCore {
namespace Layout {

class Rect {
public:
    Rect() = default;
    Rect(LayoutUnit top, LayoutUnit left, LayoutUnit width, LayoutUnit height);
    Rect(LayoutPoint topLeft, LayoutUnit width, LayoutUnit height);
    Rect(const LayoutPoint& topLeft, const LayoutSize&);
    explicit Rect(const FloatRect&);
    
    LayoutUnit top() const;
    LayoutUnit left() const;
    LayoutPoint topLeft() const;

    LayoutUnit bottom() const;
    LayoutUnit right() const;        
    LayoutPoint bottomRight() const;

    LayoutUnit width() const;
    LayoutUnit height() const;
    LayoutSize size() const;

    void setTop(LayoutUnit);
    void setLeft(LayoutUnit);
    void setTopLeft(const LayoutPoint&);
    void setWidth(LayoutUnit);
    void setHeight(LayoutUnit);
    void setSize(const LayoutSize&);

    void shiftLeftTo(LayoutUnit);
    void shiftRightTo(LayoutUnit);
    void shiftTopTo(LayoutUnit);
    void shiftBottomTo(LayoutUnit);

    void moveHorizontally(LayoutUnit);
    void moveVertically(LayoutUnit);
    void moveBy(LayoutPoint);

    void expand(std::optional<LayoutUnit>, std::optional<LayoutUnit>);
    void expandHorizontally(LayoutUnit delta) { expand(delta, { }); }
    void expandVertically(LayoutUnit delta) { expand({ }, delta); }
    void expandToContain(const Rect&);
    bool intersects(const Rect& rect) const { return m_rect.intersects(rect); }

    bool isEmpty() const { return m_rect.isEmpty(); }

    Rect clone() const;
    operator LayoutRect() const;
    operator FloatRect() const;

private:
#if ASSERT_ENABLED
    void invalidateTop() { m_hasValidTop = false; }
    void invalidateLeft() { m_hasValidLeft = false; }
    void invalidateWidth() { m_hasValidWidth = false; }
    void invalidateHeight() { m_hasValidHeight = false; }
    void invalidatePosition();

    bool hasValidPosition() const { return m_hasValidTop && m_hasValidLeft; }
    bool hasValidSize() const { return m_hasValidWidth && m_hasValidHeight; }
    bool hasValidGeometry() const { return hasValidPosition() && hasValidSize(); }

    void setHasValidPosition();
    void setHasValidSize();

    bool m_hasValidTop { false };
    bool m_hasValidLeft { false };
    bool m_hasValidWidth { false };
    bool m_hasValidHeight { false };
#endif // ASSERT_ENABLED
    LayoutRect m_rect;
};

inline Rect::Rect(LayoutUnit top, LayoutUnit left, LayoutUnit width, LayoutUnit height)
    : m_rect(left, top, width, height)
{
#if ASSERT_ENABLED
    m_hasValidTop = true;
    m_hasValidLeft = true;
    m_hasValidWidth = true;
    m_hasValidHeight = true;
#endif
}

inline Rect::Rect(LayoutPoint topLeft, LayoutUnit width, LayoutUnit height)
    : Rect(topLeft.y(), topLeft.x(), width, height)
{
}

inline Rect::Rect(const LayoutPoint& topLeft, const LayoutSize& size)
    : Rect(topLeft.y(), topLeft.x(), size.width(), size.height())
{
}

inline Rect::Rect(const FloatRect& rect)
    : Rect(LayoutPoint(rect.location()), LayoutSize(rect.size()))
{
}

#if ASSERT_ENABLED
inline void Rect::invalidatePosition()
{
    invalidateTop();
    invalidateLeft();
}

inline void Rect::setHasValidPosition()
{
    m_hasValidTop = true;
    m_hasValidLeft = true;
}

inline void Rect::setHasValidSize()
{
    m_hasValidWidth = true;
    m_hasValidHeight = true;
}
#endif

inline LayoutUnit Rect::top() const
{
    ASSERT(m_hasValidTop);
    return m_rect.y();
}

inline LayoutUnit Rect::left() const
{
    ASSERT(m_hasValidLeft);
    return m_rect.x();
}

inline LayoutUnit Rect::bottom() const
{
    ASSERT(m_hasValidTop && m_hasValidHeight);
    return m_rect.maxY();
}

inline LayoutUnit Rect::right() const
{
    ASSERT(m_hasValidLeft && m_hasValidWidth);
    return m_rect.maxX();
}

inline LayoutPoint Rect::topLeft() const
{
    ASSERT(hasValidPosition());
    return m_rect.minXMinYCorner();
}

inline LayoutPoint Rect::bottomRight() const
{
    ASSERT(hasValidGeometry());
    return m_rect.maxXMaxYCorner();
}

inline LayoutSize Rect::size() const
{
    ASSERT(hasValidSize());
    return m_rect.size();
}

inline LayoutUnit Rect::width() const
{
    ASSERT(m_hasValidWidth);
    return m_rect.width();
}

inline LayoutUnit Rect::height() const
{
    ASSERT(m_hasValidHeight);
    return m_rect.height();
}

inline void Rect::setTopLeft(const LayoutPoint& topLeft)
{
#if ASSERT_ENABLED
    setHasValidPosition();
#endif
    m_rect.setLocation(topLeft);
}

inline void Rect::setTop(LayoutUnit top)
{
#if ASSERT_ENABLED
    m_hasValidTop = true;
#endif
    m_rect.setY(top);
}

inline void Rect::setLeft(LayoutUnit left)
{
#if ASSERT_ENABLED
    m_hasValidLeft = true;
#endif
    m_rect.setX(left);
}

inline void Rect::setWidth(LayoutUnit width)
{
#if ASSERT_ENABLED
    m_hasValidWidth = true;
#endif
    m_rect.setWidth(width);
}

inline void Rect::setHeight(LayoutUnit height)
{
#if ASSERT_ENABLED
    m_hasValidHeight = true;
#endif
    m_rect.setHeight(height);
}

inline void Rect::setSize(const LayoutSize& size)
{
#if ASSERT_ENABLED
    setHasValidSize();
#endif
    m_rect.setSize(size);
}

inline void Rect::shiftLeftTo(LayoutUnit left)
{
    ASSERT(m_hasValidLeft);
    m_rect.shiftXEdgeTo(left);
}

inline void Rect::shiftRightTo(LayoutUnit right)
{
    ASSERT(m_hasValidLeft && m_hasValidWidth);
    m_rect.shiftMaxXEdgeTo(right);
}

inline void Rect::shiftTopTo(LayoutUnit top)
{
    ASSERT(m_hasValidTop);
    m_rect.shiftYEdgeTo(top);
}

inline void Rect::shiftBottomTo(LayoutUnit bottom)
{
    ASSERT(m_hasValidTop && m_hasValidHeight);
    m_rect.shiftMaxYEdgeTo(bottom);
}

inline void Rect::moveHorizontally(LayoutUnit offset)
{
    ASSERT(m_hasValidLeft);
    m_rect.move(LayoutSize { offset, 0 });
}

inline void Rect::moveVertically(LayoutUnit offset)
{
    ASSERT(m_hasValidTop);
    m_rect.move(LayoutSize { 0, offset });
}

inline void Rect::moveBy(LayoutPoint offset)
{
    ASSERT(m_hasValidTop);
    ASSERT(m_hasValidLeft);
    m_rect.moveBy(offset);
}

inline void Rect::expand(std::optional<LayoutUnit> width, std::optional<LayoutUnit> height)
{
    ASSERT(!width || m_hasValidWidth);
    ASSERT(!height || m_hasValidHeight);
    m_rect.expand(width.value_or(0), height.value_or(0));
}

inline void Rect::expandToContain(const Rect& rect)
{
    ASSERT(m_hasValidWidth);
    ASSERT(m_hasValidHeight);
    m_rect.uniteEvenIfEmpty(rect);
}

inline Rect Rect::clone() const
{
    Rect rect;
#if ASSERT_ENABLED
    rect.m_hasValidTop = m_hasValidTop;
    rect.m_hasValidLeft = m_hasValidLeft;
    rect.m_hasValidWidth = m_hasValidWidth;
    rect.m_hasValidHeight  = m_hasValidHeight;
#endif 
    rect.m_rect = m_rect;
    return rect;
}

inline Rect::operator LayoutRect() const
{
    ASSERT(hasValidGeometry());
    return m_rect;
}

inline Rect::operator FloatRect() const
{
    ASSERT(hasValidGeometry());
    return m_rect;
}

}
}
