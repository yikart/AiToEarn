/*
 * Copyright (C) 2005-2016 Apple Inc.  All rights reserved.
 * Copyright (C) 2014 Google Inc.  All rights reserved.
 *               2010 Dirk Schulze <krit@webkit.org>
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

#include "CompositeOperation.h"
#include "FloatConversion.h"
#include "FloatPoint.h"
#include "FloatSize.h"
#include <array>
#include <optional>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

#if USE(CG)
typedef struct CGAffineTransform CGAffineTransform;
#endif

#if USE(SKIA)
class SkMatrix;
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

class FloatPoint;
class FloatQuad;
class FloatRect;
class FloatSize;
class IntPoint;
class IntSize;
class IntRect;
class Region;
class TransformationMatrix;

class AffineTransform {
    WTF_MAKE_TZONE_ALLOCATED(AffineTransform);
public:
    constexpr AffineTransform();
    constexpr AffineTransform(double a, double b, double c, double d, double e, double f);

#if USE(CG)
    WEBCORE_EXPORT AffineTransform(const CGAffineTransform&);
#endif

#if USE(SKIA)
    AffineTransform(const SkMatrix&);
#endif

    void setMatrix(double a, double b, double c, double d, double e, double f);

    void map(double x, double y, double& x2, double& y2) const;

    // Rounds the mapped point to the nearest integer value.
    WEBCORE_EXPORT IntPoint mapPoint(const IntPoint&) const;

    WEBCORE_EXPORT FloatPoint mapPoint(const FloatPoint&) const;

    WEBCORE_EXPORT IntSize mapSize(const IntSize&) const;

    WEBCORE_EXPORT FloatSize mapSize(const FloatSize&) const;

    // Rounds the resulting mapped rectangle out. This is helpful for bounding
    // box computations but may not be what is wanted in other contexts.
    WEBCORE_EXPORT IntRect mapRect(const IntRect&) const;

    WEBCORE_EXPORT FloatRect mapRect(const FloatRect&) const;
    WEBCORE_EXPORT FloatQuad mapQuad(const FloatQuad&) const;

    WEBCORE_EXPORT Region mapRegion(const Region&) const;

    WEBCORE_EXPORT bool isIdentity() const;

    double a() const { return m_transform[0]; }
    void setA(double a) { m_transform[0] = a; }
    double b() const { return m_transform[1]; }
    void setB(double b) { m_transform[1] = b; }
    double c() const { return m_transform[2]; }
    void setC(double c) { m_transform[2] = c; }
    double d() const { return m_transform[3]; }
    void setD(double d) { m_transform[3] = d; }
    double e() const { return m_transform[4]; }
    void setE(double e) { m_transform[4] = e; }
    double f() const { return m_transform[5]; }
    void setF(double f) { m_transform[5] = f; }

    WEBCORE_EXPORT void makeIdentity();

    WEBCORE_EXPORT AffineTransform& multiply(const AffineTransform& other);
    WEBCORE_EXPORT AffineTransform& scale(double);
    WEBCORE_EXPORT AffineTransform& scale(double sx, double sy);
    WEBCORE_EXPORT AffineTransform& scaleNonUniform(double sx, double sy); // Same as scale(sx, sy).
    WEBCORE_EXPORT AffineTransform& scale(const FloatSize&);
    WEBCORE_EXPORT AffineTransform& rotate(double);
    WEBCORE_EXPORT AffineTransform& rotateRadians(double);
    AffineTransform& rotateFromVector(double x, double y);
    WEBCORE_EXPORT AffineTransform& translate(double tx, double ty);
    WEBCORE_EXPORT AffineTransform& translate(const FloatPoint&);
    WEBCORE_EXPORT AffineTransform& translate(const FloatSize&);
    WEBCORE_EXPORT AffineTransform& shear(double sx, double sy);
    WEBCORE_EXPORT AffineTransform& flipX();
    WEBCORE_EXPORT AffineTransform& flipY();
    WEBCORE_EXPORT AffineTransform& skew(double angleX, double angleY);
    AffineTransform& skewX(double angle);
    AffineTransform& skewY(double angle);

    // These functions get the length of an axis-aligned unit vector
    // once it has been mapped through the transform
    WEBCORE_EXPORT double xScale() const;
    WEBCORE_EXPORT double yScale() const;

    bool isInvertible() const; // If you call this, you're probably doing it wrong.
    WEBCORE_EXPORT std::optional<AffineTransform> inverse() const;

    WEBCORE_EXPORT void blend(const AffineTransform& from, double progress, CompositeOperation = CompositeOperation::Replace);

    WEBCORE_EXPORT TransformationMatrix toTransformationMatrix() const;

    bool isIdentityOrTranslation() const
    {
        return m_transform[0] == 1 && m_transform[1] == 0 && m_transform[2] == 0 && m_transform[3] == 1;
    }
    
    bool isIdentityOrTranslationOrFlipped() const
    {
        return m_transform[0] == 1 && m_transform[1] == 0 && m_transform[2] == 0 && (m_transform[3] == 1 || m_transform[3] == -1);
    }
    
    bool isRotateOrShear() const
    {
        return m_transform[1] || m_transform[2];
    }

    bool preservesAxisAlignment() const
    {
        return (m_transform[1] == 0 && m_transform[2] == 0) || (m_transform[0] == 0 && m_transform[3] == 0);
    }

    bool isEssentiallyEqualToAsFloats(const AffineTransform& m2) const
    {
        return WTF::areEssentiallyEqual(narrowPrecisionToFloat(m_transform[0]), narrowPrecisionToFloat(m2.m_transform[0]))
            && WTF::areEssentiallyEqual(narrowPrecisionToFloat(m_transform[1]), narrowPrecisionToFloat(m2.m_transform[1]))
            && WTF::areEssentiallyEqual(narrowPrecisionToFloat(m_transform[2]), narrowPrecisionToFloat(m2.m_transform[2]))
            && WTF::areEssentiallyEqual(narrowPrecisionToFloat(m_transform[3]), narrowPrecisionToFloat(m2.m_transform[3]))
            && WTF::areEssentiallyEqual(narrowPrecisionToFloat(m_transform[4]), narrowPrecisionToFloat(m2.m_transform[4]))
            && WTF::areEssentiallyEqual(narrowPrecisionToFloat(m_transform[5]), narrowPrecisionToFloat(m2.m_transform[5]));
    }

    friend bool operator==(const AffineTransform&, const AffineTransform&) = default;

    // *this = *this * t (i.e., a multRight)
    AffineTransform& operator*=(const AffineTransform& t)
    {
        return multiply(t);
    }
    
    // result = *this * t (i.e., a multRight)
    AffineTransform operator*(const AffineTransform& t) const
    {
        AffineTransform result = *this;
        result *= t;
        return result;
    }

#if USE(CG)
    WEBCORE_EXPORT operator CGAffineTransform() const;
#endif

#if USE(SKIA)
    operator SkMatrix() const;
#endif

    static AffineTransform makeTranslation(FloatSize delta)
    {
        return AffineTransform(1, 0, 0, 1, delta.width(), delta.height());
    }

    static AffineTransform makeScale(FloatSize scale)
    {
        return AffineTransform(scale.width(), 0, 0, scale.height(), 0, 0);
    }

    WEBCORE_EXPORT static AffineTransform makeRotation(double angleInDegrees, FloatPoint center);
    WEBCORE_EXPORT static AffineTransform makeRotation(double angleInDegrees);

    // decompose the matrix into its component parts
    typedef struct {
        double scaleX, scaleY;
        double angle;
        double remainderA, remainderB, remainderC, remainderD;
        double translateX, translateY;
    } DecomposedType;
    
    bool decompose(DecomposedType&) const;
    void recompose(const DecomposedType&);

private:
    std::array<double, 6> m_transform;
};

WEBCORE_EXPORT AffineTransform makeMapBetweenRects(const FloatRect& source, const FloatRect& dest);

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const AffineTransform&);

constexpr AffineTransform::AffineTransform()
    : m_transform { { 1, 0, 0, 1, 0, 0 } }
{
}

constexpr AffineTransform::AffineTransform(double a, double b, double c, double d, double e, double f)
    : m_transform { { a, b, c, d, e, f } }
{
}

static constexpr inline AffineTransform identity;

}
