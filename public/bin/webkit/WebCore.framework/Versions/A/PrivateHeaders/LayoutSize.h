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

#include "FloatSize.h"
#include "IntSize.h"
#include "LayoutUnit.h"

namespace WTF {
class TextStream;
}

namespace WebCore {

class LayoutPoint;

enum AspectRatioFit {
    AspectRatioFitShrink,
    AspectRatioFitGrow
};

class LayoutSize {
public:
    LayoutSize() = default;
    LayoutSize(const IntSize& size) : m_width(size.width()), m_height(size.height()) { }
    template<typename T, typename U> LayoutSize(T width, U height) : m_width(width), m_height(height) { }

    explicit LayoutSize(const FloatSize& size) : m_width(size.width()), m_height(size.height()) { }
    
    LayoutUnit width() const { return m_width; }
    LayoutUnit height() const { return m_height; }

    LayoutUnit minDimension() const { return std::min(m_width, m_height); }
    LayoutUnit maxDimension() const { return std::max(m_width, m_height); }

    template<typename T> void setWidth(T width) { m_width = width; }
    template<typename T> void setHeight(T height) { m_height = height; }

    bool isEmpty() const { return m_width.rawValue() <= 0 || m_height.rawValue() <= 0; }
    bool isZero() const { return !m_width && !m_height; }

    float aspectRatio() const { return static_cast<float>(m_width) / static_cast<float>(m_height); }
    
    template<typename T, typename U>
    void expand(T width, U height)
    {
        m_width += width;
        m_height += height;
    }
    
    void shrink(LayoutUnit width, LayoutUnit height)
    {
        m_width -= width;
        m_height -= height;
    }
    
    void scale(float scale)
    {
        m_width *= scale;
        m_height *= scale;
    }

    void scale(float widthScale, float heightScale)
    {
        m_width *= widthScale;
        m_height *= heightScale;
    }

    LayoutSize constrainedBetween(const LayoutSize& min, const LayoutSize& max) const;
    
    LayoutSize expandedTo(const LayoutSize& other) const
    {
        return LayoutSize(m_width > other.m_width ? m_width : other.m_width,
            m_height > other.m_height ? m_height : other.m_height);
    }

    LayoutSize shrunkTo(const LayoutSize& other) const
    {
        return LayoutSize(m_width < other.m_width ? m_width : other.m_width,
            m_height < other.m_height ? m_height : other.m_height);
    }

    void clampNegativeToZero()
    {
        *this = expandedTo(LayoutSize());
    }
    
    void clampToMinimumSize(const LayoutSize& minimumSize)
    {
        if (m_width < minimumSize.width())
            m_width = minimumSize.width();
        if (m_height < minimumSize.height())
            m_height = minimumSize.height();
    }

    LayoutSize transposedSize() const
    {
        return LayoutSize(m_height, m_width);
    }

    operator FloatSize() const { return FloatSize(m_width, m_height); }

    LayoutSize fitToAspectRatio(const LayoutSize& aspectRatio, AspectRatioFit fit) const
    {
        float heightScale = height().toFloat() / aspectRatio.height().toFloat();
        float widthScale = width().toFloat() / aspectRatio.width().toFloat();

        if ((widthScale > heightScale) != (fit == AspectRatioFitGrow))
            return LayoutSize(height() * aspectRatio.width() / aspectRatio.height(), height());

        return LayoutSize(width(), width() * aspectRatio.height() / aspectRatio.width());
    }

    bool mightBeSaturated() const
    {
        return m_width.mightBeSaturated() || m_height.mightBeSaturated();
    }

    friend bool operator==(const LayoutSize&, const LayoutSize&) = default;
private:
    LayoutUnit m_width;
    LayoutUnit m_height;
};

inline LayoutSize& operator+=(LayoutSize& a, const LayoutSize& b)
{
    a.setWidth(a.width() + b.width());
    a.setHeight(a.height() + b.height());
    return a;
}

inline LayoutSize& operator-=(LayoutSize& a, const LayoutSize& b)
{
    a.setWidth(a.width() - b.width());
    a.setHeight(a.height() - b.height());
    return a;
}

inline LayoutSize operator+(const LayoutSize& a, const LayoutSize& b)
{
    return LayoutSize(a.width() + b.width(), a.height() + b.height());
}

inline LayoutSize operator-(const LayoutSize& a, const LayoutSize& b)
{
    return LayoutSize(a.width() - b.width(), a.height() - b.height());
}

inline LayoutSize operator-(const LayoutSize& size)
{
    return LayoutSize(-size.width(), -size.height());
}

inline IntSize flooredIntSize(const LayoutSize& s)
{
    return IntSize(s.width().floor(), s.height().floor());
}

inline IntSize ceiledIntSize(const LayoutSize& s)
{
    return IntSize(s.width().ceil(), s.height().ceil());
}

inline IntSize roundedIntSize(const LayoutSize& s)
{
    return IntSize(s.width().round(), s.height().round());
}

inline FloatSize floorSizeToDevicePixels(const LayoutSize& size, float pixelSnappingFactor)
{
    return FloatSize(floorToDevicePixel(size.width(), pixelSnappingFactor), floorToDevicePixel(size.height(), pixelSnappingFactor));
}

inline FloatSize roundSizeToDevicePixels(const LayoutSize& size, float pixelSnappingFactor)
{
    return FloatSize(roundToDevicePixel(size.width(), pixelSnappingFactor), roundToDevicePixel(size.height(), pixelSnappingFactor));
}

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const LayoutSize&);

} // namespace WebCore

