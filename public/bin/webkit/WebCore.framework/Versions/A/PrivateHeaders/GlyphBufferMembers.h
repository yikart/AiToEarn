/*
 * Copyright (C) 2006-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2007-2008 Torch Mobile Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FloatPoint.h"
#include "FloatSize.h"
#include "Glyph.h"
#include <wtf/Vector.h>

#if USE(CG)
#include <CoreGraphics/CGFont.h>
#include <CoreGraphics/CGGeometry.h>
#endif

namespace WebCore {

// The CG ports use the CG types directly, so an array of these types can be fed directly into CTFontShapeGlyphs().
// When you write code that interacts with these types, use the functions below!
#if USE(CG)
using GlyphBufferGlyph = CGGlyph;
using GlyphBufferAdvance = CGSize;
using GlyphBufferOrigin = CGPoint;
using GlyphBufferStringOffset = CFIndex;
#else
using GlyphBufferGlyph = Glyph;
using GlyphBufferAdvance = FloatSize;
using GlyphBufferOrigin = FloatPoint;
using GlyphBufferStringOffset = unsigned;
#endif

inline GlyphBufferAdvance makeGlyphBufferAdvance(const FloatSize&);
inline GlyphBufferAdvance makeGlyphBufferAdvance(float = 0, float = 0);
inline FloatSize size(const GlyphBufferAdvance&);
inline void setWidth(GlyphBufferAdvance&, float);
inline void setHeight(GlyphBufferAdvance&, float);
inline float width(const GlyphBufferAdvance&);
inline float height(const GlyphBufferAdvance&);
inline GlyphBufferOrigin makeGlyphBufferOrigin(const FloatPoint&);
inline GlyphBufferOrigin makeGlyphBufferOrigin(float = 0, float = 0);
inline FloatPoint point(const GlyphBufferOrigin&);
inline void setX(GlyphBufferOrigin&, float);
inline void setY(GlyphBufferOrigin&, float);
inline float x(const GlyphBufferOrigin&);
inline float y(const GlyphBufferOrigin&);

#if USE(CG)

inline GlyphBufferAdvance makeGlyphBufferAdvance(const FloatSize& size)
{
    return CGSizeMake(size.width(), size.height());
}

inline GlyphBufferAdvance makeGlyphBufferAdvance(float width, float height)
{
    return CGSizeMake(width, height);
}

inline FloatSize size(const GlyphBufferAdvance& advance)
{
    return FloatSize(advance.width, advance.height);
}

inline void setWidth(GlyphBufferAdvance& advance, float width)
{
    advance.width = width;
}

inline void setHeight(GlyphBufferAdvance& advance, float height)
{
    advance.height = height;
}

inline float width(const GlyphBufferAdvance& advance)
{
    return advance.width;
}

inline float height(const GlyphBufferAdvance& advance)
{
    return advance.height;
}

inline GlyphBufferOrigin makeGlyphBufferOrigin(const FloatPoint& point)
{
    return CGPointMake(point.x(), point.y());
}

inline GlyphBufferOrigin makeGlyphBufferOrigin(float x, float y)
{
    return CGPointMake(x, y);
}

inline FloatPoint point(const GlyphBufferOrigin& origin)
{
    return FloatPoint(origin.x, origin.y);
}

inline void setX(GlyphBufferOrigin& origin, float x)
{
    origin.x = x;
}

inline void setY(GlyphBufferOrigin& origin, float y)
{
    origin.y = y;
}

inline float x(const GlyphBufferOrigin& origin)
{
    return origin.x;
}

inline float y(const GlyphBufferOrigin& origin)
{
    return origin.y;
}

#else

inline GlyphBufferAdvance makeGlyphBufferAdvance(const FloatSize& size)
{
    return size;
}

inline GlyphBufferAdvance makeGlyphBufferAdvance(float width, float height)
{
    return FloatSize(width, height);
}

inline FloatSize size(const GlyphBufferAdvance& advance)
{
    return advance;
}

inline void setWidth(GlyphBufferAdvance& advance, float width)
{
    advance.setWidth(width);
}

inline void setHeight(GlyphBufferAdvance& advance, float height)
{
    advance.setHeight(height);
}

inline float width(const GlyphBufferAdvance& advance)
{
    return advance.width();
}

inline float height(const GlyphBufferAdvance& advance)
{
    return advance.height();
}

inline GlyphBufferOrigin makeGlyphBufferOrigin(const FloatPoint& point)
{
    return point;
}

inline GlyphBufferOrigin makeGlyphBufferOrigin(float x, float y)
{
    return FloatPoint(x, y);
}

inline FloatPoint point(const GlyphBufferOrigin& origin)
{
    return origin;
}

inline void setX(GlyphBufferOrigin& origin, float x)
{
    origin.setX(x);
}

inline void setY(GlyphBufferOrigin& origin, float y)
{
    origin.setY(y);
}

inline float x(const GlyphBufferOrigin& origin)
{
    return origin.x();
}

inline float y(const GlyphBufferOrigin& origin)
{
    return origin.y();
}

#endif // #if USE(CG)

}
