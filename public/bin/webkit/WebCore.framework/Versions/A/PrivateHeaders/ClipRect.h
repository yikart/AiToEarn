/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

namespace WTF {
class TextStream;
}

namespace WebCore {

class HitTestLocation;

class ClipRect {
public:
    ClipRect() = default;
    
    ClipRect(const LayoutRect& rect)
        : m_rect(rect)
    {
    }
    
    const LayoutRect& rect() const { return m_rect; }

    void reset() { m_rect = LayoutRect::infiniteRect(); }

    bool affectedByRadius() const { return m_affectedByRadius; }
    void setAffectedByRadius(bool affectedByRadius) { m_affectedByRadius = affectedByRadius; }
    
    friend bool operator==(const ClipRect&, const ClipRect&) = default;
    
    void intersect(const LayoutRect& other);
    void intersect(const ClipRect& other);
    void move(LayoutUnit x, LayoutUnit y) { m_rect.move(x, y); }
    void move(const LayoutSize& size) { m_rect.move(size); }
    void moveBy(const LayoutPoint& point) { m_rect.moveBy(point); }
    
    bool intersects(const LayoutRect&) const;
    bool intersects(const HitTestLocation&) const;

    bool isEmpty() const { return m_rect.isEmpty(); }
    bool isInfinite() const { return m_rect.isInfinite(); }

    void inflateX(LayoutUnit dx) { m_rect.inflateX(dx); }
    void inflateY(LayoutUnit dy) { m_rect.inflateY(dy); }
    void inflate(LayoutUnit d) { inflateX(d); inflateY(d); }
    
private:
    LayoutRect m_rect;
    bool m_affectedByRadius = false;
};

inline void ClipRect::intersect(const LayoutRect& other)
{
    if (other.isInfinite())
        return;
    if (isInfinite())
        m_rect = other;
    else
        m_rect.intersect(other);
}

inline void ClipRect::intersect(const ClipRect& other)
{
    intersect(other.rect());
    if (other.affectedByRadius())
        m_affectedByRadius = true;
}
    
inline bool ClipRect::intersects(const LayoutRect& rect) const
{
    if (isInfinite() || rect.isInfinite())
        return true;
    return m_rect.intersects(rect);
}

inline ClipRect intersection(const ClipRect& a, const ClipRect& b)
{
    ClipRect c = a;
    c.intersect(b);
    return c;
}

WTF::TextStream& operator<<(WTF::TextStream&, const ClipRect&);

} // namespace WebCore
