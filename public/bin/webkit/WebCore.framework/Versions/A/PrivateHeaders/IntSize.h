/*
 * Copyright (C) 2003-2021 Apple Inc. All rights reserved.
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

#include "PlatformExportMacros.h"
#include <algorithm>
#include <wtf/JSONValues.h>
#include <wtf/Forward.h>

#if USE(CG)
typedef struct CGSize CGSize;
#endif

#if PLATFORM(MAC)
#ifdef NSGEOMETRY_TYPES_SAME_AS_CGGEOMETRY_TYPES
typedef struct CGSize NSSize;
#else
typedef struct _NSSize NSSize;
#endif
#endif

#if PLATFORM(IOS_FAMILY)
#ifndef NSSize
#define NSSize CGSize
#endif
#endif

#if PLATFORM(WIN)
typedef struct tagSIZE SIZE;
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

class FloatSize;

class IntSize {
public:
    constexpr IntSize() = default;
    constexpr IntSize(int width, int height) : m_width(width), m_height(height) { }
    WEBCORE_EXPORT explicit IntSize(const FloatSize&); // don't do this implicitly since it's lossy

    constexpr int width() const { return m_width; }
    constexpr int height() const { return m_height; }

    constexpr int minDimension() const { return std::min(m_width, m_height); }
    constexpr int maxDimension() const { return std::max(m_width, m_height); }

    void setWidth(int width) { m_width = width; }
    void setHeight(int height) { m_height = height; }

    constexpr bool isEmpty() const { return m_width <= 0 || m_height <= 0; }
    constexpr bool isZero() const { return !m_width && !m_height; }

    constexpr float aspectRatio() const { return static_cast<float>(m_width) / static_cast<float>(m_height); }

    void expand(int width, int height)
    {
        m_width += width;
        m_height += height;
    }

    void contract(int width, int height)
    {
        m_width -= width;
        m_height -= height;
    }

    void scale(float widthScale, float heightScale)
    {
        m_width = static_cast<int>(static_cast<float>(m_width) * widthScale);
        m_height = static_cast<int>(static_cast<float>(m_height) * heightScale);
    }

    void scale(float scale)
    {
        this->scale(scale, scale);
    }

    constexpr IntSize expandedTo(const IntSize& other) const
    {
        return IntSize(std::max(m_width, other.m_width), std::max(m_height, other.m_height));
    }

    constexpr IntSize shrunkTo(const IntSize& other) const
    {
        return IntSize(std::min(m_width, other.m_width), std::min(m_height, other.m_height));
    }

    void clampNegativeToZero()
    {
        *this = expandedTo(IntSize());
    }

    void clampToMinimumSize(const IntSize& minimumSize)
    {
        m_width = std::max(m_width, minimumSize.width());
        m_height = std::max(m_height, minimumSize.height());
    }

    void clampToMaximumSize(const IntSize& maximumSize)
    {
        m_width = std::min(m_width, maximumSize.width());
        m_height = std::min(m_height, maximumSize.height());
    }

    WEBCORE_EXPORT IntSize constrainedBetween(const IntSize& min, const IntSize& max) const;

    template<typename T = CrashOnOverflow> Checked<unsigned, T> area() const
    {
        return Checked<unsigned, T>(std::abs(m_width)) * std::abs(m_height);
    }

    uint64_t unclampedArea() const
    {
        return static_cast<uint64_t>(std::abs(m_width)) * std::abs(m_height);
    }

    constexpr int diagonalLengthSquared() const
    {
        return m_width * m_width + m_height * m_height;
    }

    constexpr IntSize transposedSize() const
    {
        return IntSize(m_height, m_width);
    }

    friend constexpr bool operator==(const IntSize&, const IntSize&) = default;

#if USE(CG)
    WEBCORE_EXPORT explicit IntSize(const CGSize&); // don't do this implicitly since it's lossy
    WEBCORE_EXPORT operator CGSize() const;
#endif

#if PLATFORM(MAC) && !defined(NSGEOMETRY_TYPES_SAME_AS_CGGEOMETRY_TYPES)
    WEBCORE_EXPORT explicit IntSize(const NSSize &); // don't do this implicitly since it's lossy
    WEBCORE_EXPORT operator NSSize() const;
#endif

#if PLATFORM(WIN)
    WEBCORE_EXPORT IntSize(const SIZE&);
    WEBCORE_EXPORT operator SIZE() const;
#endif

    String toJSONString() const;
    Ref<JSON::Object> toJSONObject() const;

private:
    int m_width { 0 };
    int m_height { 0 };
};

inline IntSize& operator+=(IntSize& a, const IntSize& b)
{
    a.setWidth(a.width() + b.width());
    a.setHeight(a.height() + b.height());
    return a;
}

inline IntSize& operator-=(IntSize& a, const IntSize& b)
{
    a.setWidth(a.width() - b.width());
    a.setHeight(a.height() - b.height());
    return a;
}

constexpr IntSize operator+(const IntSize& a, const IntSize& b)
{
    return IntSize(a.width() + b.width(), a.height() + b.height());
}

constexpr IntSize operator-(const IntSize& a, const IntSize& b)
{
    return IntSize(a.width() - b.width(), a.height() - b.height());
}

constexpr IntSize operator-(const IntSize& size)
{
    return IntSize(-size.width(), -size.height());
}

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const IntSize&);

} // namespace WebCore

namespace WTF {

template<> struct DefaultHash<WebCore::IntSize>;
template<> struct HashTraits<WebCore::IntSize>;

template<typename> struct LogArgument;
template<> struct LogArgument<WebCore::IntSize> {
    static String toString(const WebCore::IntSize& size) { return size.toJSONString(); }
};

}
