/*
 * Copyright (C) 2005-2016 Apple Inc.  All rights reserved.
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
#include "FloatPoint.h"
#include "FloatPoint3D.h"
#include "IntPoint.h"
#include "Quaternion.h"
#include <array>
#include <string.h> //for memcpy
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

#if USE(CA)
typedef struct CATransform3D CATransform3D;
#endif
#if USE(CG)
typedef struct CGAffineTransform CGAffineTransform;
#endif
#if PLATFORM(COCOA)
#include <simd/simd.h>
#endif
#if USE(SKIA)
class SkM44;
#endif

#if PLATFORM(WIN) || (PLATFORM(GTK) && OS(WINDOWS))
#if COMPILER(MINGW) && !COMPILER(MINGW64)
typedef struct _XFORM XFORM;
#else
typedef struct tagXFORM XFORM;
#endif
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

class AffineTransform;
class IntRect;
class LayoutRect;
class FloatRect;
class FloatQuad;

#if CPU(X86_64)
#define TRANSFORMATION_MATRIX_USE_X86_64_SSE2
#endif

class TransformationMatrix {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(TransformationMatrix, WEBCORE_EXPORT);
public:

#if (PLATFORM(IOS_FAMILY) && CPU(ARM_THUMB2)) || defined(TRANSFORMATION_MATRIX_USE_X86_64_SSE2)
    typedef std::array<std::array<double, 4>, 4> Matrix4 __attribute__((aligned (16)));
#else
    typedef std::array<std::array<double, 4>, 4> Matrix4;
#endif

    constexpr TransformationMatrix()
        : m_matrix { {
            { 1, 0, 0, 0 },
            { 0, 1, 0, 0 },
            { 0, 0, 1, 0 },
            { 0, 0, 0, 1 },
        } }
    {
    }

    constexpr TransformationMatrix(double a, double b, double c, double d, double e, double f)
        : m_matrix { {
            { a, b, 0, 0 },
            { c, d, 0, 0 },
            { 0, 0, 1, 0 },
            { e, f, 0, 1 },
        } }
    {
    }

    constexpr TransformationMatrix(double tx, double ty)
        : m_matrix { {
            { 1, 0, 0, 0 },
            { 0, 1, 0, 0 },
            { 0, 0, 1, 0 },
            { tx, ty, 0, 1 },
        } }
    {
    }

    constexpr TransformationMatrix(
        double m11, double m12, double m13, double m14,
        double m21, double m22, double m23, double m24,
        double m31, double m32, double m33, double m34,
        double m41, double m42, double m43, double m44)
        : m_matrix { {
            { m11, m12, m13, m14 },
            { m21, m22, m23, m24 },
            { m31, m32, m33, m34 },
            { m41, m42, m43, m44 },
        } }
    {
    }

    WEBCORE_EXPORT TransformationMatrix(const AffineTransform&);

    static TransformationMatrix fromQuaternion(const Quaternion&);

    // Field of view in radians
    static TransformationMatrix fromProjection(double fovUp, double fovDown, double fovLeft, double fovRight, double depthNear, double depthFar);
    static TransformationMatrix fromProjection(double fovy, double aspect, double depthNear, double depthFar);

    WEBCORE_EXPORT static const TransformationMatrix identity;

    void setMatrix(double a, double b, double c, double d, double e, double f)
    {
        m_matrix[0][0] = a; m_matrix[0][1] = b; m_matrix[0][2] = 0; m_matrix[0][3] = 0; 
        m_matrix[1][0] = c; m_matrix[1][1] = d; m_matrix[1][2] = 0; m_matrix[1][3] = 0; 
        m_matrix[2][0] = 0; m_matrix[2][1] = 0; m_matrix[2][2] = 1; m_matrix[2][3] = 0; 
        m_matrix[3][0] = e; m_matrix[3][1] = f; m_matrix[3][2] = 0; m_matrix[3][3] = 1;
    }
    
    void setMatrix(double m11, double m12, double m13, double m14,
                   double m21, double m22, double m23, double m24,
                   double m31, double m32, double m33, double m34,
                   double m41, double m42, double m43, double m44)
    {
        m_matrix[0][0] = m11; m_matrix[0][1] = m12; m_matrix[0][2] = m13; m_matrix[0][3] = m14; 
        m_matrix[1][0] = m21; m_matrix[1][1] = m22; m_matrix[1][2] = m23; m_matrix[1][3] = m24; 
        m_matrix[2][0] = m31; m_matrix[2][1] = m32; m_matrix[2][2] = m33; m_matrix[2][3] = m34; 
        m_matrix[3][0] = m41; m_matrix[3][1] = m42; m_matrix[3][2] = m43; m_matrix[3][3] = m44;
    }

    TransformationMatrix& makeIdentity()
    {
        setMatrix(1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1);
        return *this;
    }

    bool isIdentity() const
    {
        return m_matrix[0][0] == 1 && m_matrix[0][1] == 0 && m_matrix[0][2] == 0 && m_matrix[0][3] == 0 &&
               m_matrix[1][0] == 0 && m_matrix[1][1] == 1 && m_matrix[1][2] == 0 && m_matrix[1][3] == 0 &&
               m_matrix[2][0] == 0 && m_matrix[2][1] == 0 && m_matrix[2][2] == 1 && m_matrix[2][3] == 0 &&
               m_matrix[3][0] == 0 && m_matrix[3][1] == 0 && m_matrix[3][2] == 0 && m_matrix[3][3] == 1;
    }

    // This form preserves the double math from input to output.
    void map(double x, double y, double& x2, double& y2) const { multVecMatrix(x, y, x2, y2); }
    void map4ComponentPoint(double& x, double& y, double& z, double& w) const;

    // Maps a 3D point through the transform, returning a 3D point.
    FloatPoint3D mapPoint(const FloatPoint3D&) const;

    // Maps a 2D point through the transform, returning a 2D point.
    // Note that this ignores the z component, effectively projecting the point into the z=0 plane.
    WEBCORE_EXPORT FloatPoint mapPoint(const FloatPoint&) const;

    // Like the version above, except that it rounds the mapped point to the nearest integer value.
    IntPoint mapPoint(const IntPoint& p) const
    {
        return roundedIntPoint(mapPoint(FloatPoint(p)));
    }

    // If the matrix has 3D components, the z component of the result is
    // dropped, effectively projecting the rect into the z=0 plane.
    WEBCORE_EXPORT FloatRect mapRect(const FloatRect&) const;

    // Rounds the resulting mapped rectangle out. This is helpful for bounding
    // box computations but may not be what is wanted in other contexts.
    WEBCORE_EXPORT IntRect mapRect(const IntRect&) const;
    LayoutRect mapRect(const LayoutRect&) const;

    // If the matrix has 3D components, the z component of the result is
    // dropped, effectively projecting the quad into the z=0 plane.
    WEBCORE_EXPORT FloatQuad mapQuad(const FloatQuad&) const;

    // Maps a point on the z=0 plane into a point on the plane with with the transform applied, by
    // extending a ray perpendicular to the source plane and computing the local x,y position of
    // the point where that ray intersects with the destination plane.
    FloatPoint projectPoint(const FloatPoint&, bool* clamped = 0) const;
    // Projects the four corners of the quad.
    FloatQuad projectQuad(const FloatQuad&,  bool* clamped = 0) const;
    // Projects the four corners of the quad and takes a bounding box,
    // while sanitizing values created when the w component is negative.
    LayoutRect clampedBoundsOfProjectedQuad(const FloatQuad&) const;

    double m11() const { return m_matrix[0][0]; }
    void setM11(double f) { m_matrix[0][0] = f; }
    double m12() const { return m_matrix[0][1]; }
    void setM12(double f) { m_matrix[0][1] = f; }
    double m13() const { return m_matrix[0][2]; }
    void setM13(double f) { m_matrix[0][2] = f; }
    double m14() const { return m_matrix[0][3]; }
    void setM14(double f) { m_matrix[0][3] = f; }
    double m21() const { return m_matrix[1][0]; }
    void setM21(double f) { m_matrix[1][0] = f; }
    double m22() const { return m_matrix[1][1]; }
    void setM22(double f) { m_matrix[1][1] = f; }
    double m23() const { return m_matrix[1][2]; }
    void setM23(double f) { m_matrix[1][2] = f; }
    double m24() const { return m_matrix[1][3]; }
    void setM24(double f) { m_matrix[1][3] = f; }
    double m31() const { return m_matrix[2][0]; }
    void setM31(double f) { m_matrix[2][0] = f; }
    double m32() const { return m_matrix[2][1]; }
    void setM32(double f) { m_matrix[2][1] = f; }
    double m33() const { return m_matrix[2][2]; }
    void setM33(double f) { m_matrix[2][2] = f; }
    double m34() const { return m_matrix[2][3]; }
    void setM34(double f) { m_matrix[2][3] = f; }
    double m41() const { return m_matrix[3][0]; }
    void setM41(double f) { m_matrix[3][0] = f; }
    double m42() const { return m_matrix[3][1]; }
    void setM42(double f) { m_matrix[3][1] = f; }
    double m43() const { return m_matrix[3][2]; }
    void setM43(double f) { m_matrix[3][2] = f; }
    double m44() const { return m_matrix[3][3]; }
    void setM44(double f) { m_matrix[3][3] = f; }
    
    double a() const { return m_matrix[0][0]; }
    void setA(double a) { m_matrix[0][0] = a; }

    double b() const { return m_matrix[0][1]; }
    void setB(double b) { m_matrix[0][1] = b; }

    double c() const { return m_matrix[1][0]; }
    void setC(double c) { m_matrix[1][0] = c; }

    double d() const { return m_matrix[1][1]; }
    void setD(double d) { m_matrix[1][1] = d; }

    double e() const { return m_matrix[3][0]; }
    void setE(double e) { m_matrix[3][0] = e; }

    double f() const { return m_matrix[3][1]; }
    void setF(double f) { m_matrix[3][1] = f; }

    // this = mat * this.
    WEBCORE_EXPORT TransformationMatrix& multiply(const TransformationMatrix&);
    // Identical to multiply(TransformationMatrix&), but saving a AffineTransform -> TransformationMatrix roundtrip for identity or translation matrices.
    TransformationMatrix& multiplyAffineTransform(const AffineTransform&);

    WEBCORE_EXPORT TransformationMatrix& scale(double);
    WEBCORE_EXPORT TransformationMatrix& scaleNonUniform(double sx, double sy);
    TransformationMatrix& scale3d(double sx, double sy, double sz);

    enum class RotationSnapping {
        None,
        Snap90degRotations,
    };

    // Angle is in degrees.
    WEBCORE_EXPORT TransformationMatrix& rotate(double, RotationSnapping = RotationSnapping::Snap90degRotations);
    WEBCORE_EXPORT TransformationMatrix& rotateRadians(double, RotationSnapping = RotationSnapping::Snap90degRotations);
    TransformationMatrix& rotateFromVector(double x, double y);
    WEBCORE_EXPORT TransformationMatrix& rotate3d(double rx, double ry, double rz, RotationSnapping = RotationSnapping::Snap90degRotations);

    // The vector (x,y,z) is normalized if it's not already. A vector of (0,0,0) uses a vector of (0,0,1).
    TransformationMatrix& rotate3d(double x, double y, double z, double angle, RotationSnapping = RotationSnapping::Snap90degRotations);

    WEBCORE_EXPORT TransformationMatrix& translate(double tx, double ty);
    WEBCORE_EXPORT TransformationMatrix& translate3d(double tx, double ty, double tz);

    // translation added with a post-multiply
    TransformationMatrix& translateRight(double tx, double ty);
    WEBCORE_EXPORT TransformationMatrix& translateRight3d(double tx, double ty, double tz);
    
    WEBCORE_EXPORT TransformationMatrix& flipX();
    WEBCORE_EXPORT TransformationMatrix& flipY();
    WEBCORE_EXPORT TransformationMatrix& skew(double angleX, double angleY);
    TransformationMatrix& skewX(double angle) { return skew(angle, 0); }
    TransformationMatrix& skewY(double angle) { return skew(0, angle); }

    TransformationMatrix& applyPerspective(double p);
    bool hasPerspective() const { return m_matrix[2][3] != 0.0f; }

    // Returns a transformation that maps a rect to a rect.
    WEBCORE_EXPORT static TransformationMatrix rectToRect(const FloatRect&, const FloatRect&);

    // Changes the transform to:
    //
    //     scale3d(z, z, z) * mat * scale3d(1/z, 1/z, 1/z)
    //
    // Useful for mapping zoomed points to their zoomed transformed result:
    //
    //     new_mat * (scale3d(z, z, z) * x) == scale3d(z, z, z) * (mat * x)
    //
    TransformationMatrix& zoom(double zoomFactor);

    WEBCORE_EXPORT bool isInvertible() const;
    WEBCORE_EXPORT std::optional<TransformationMatrix> inverse() const;

    // Decompose the matrix into its component parts.
    struct Decomposed2Type {
        double scaleX, scaleY;
        double translateX, translateY;
        double angle;
        double m11, m12, m21, m22;
        
        friend bool operator==(const Decomposed2Type&, const Decomposed2Type&) = default;
    };

    struct Decomposed4Type {
        double scaleX, scaleY, scaleZ;
        double skewXY, skewXZ, skewYZ;
        Quaternion quaternion;
        double translateX, translateY, translateZ;
        double perspectiveX, perspectiveY, perspectiveZ, perspectiveW;

        friend bool operator==(const Decomposed4Type&, const Decomposed4Type&) = default;
    };
    
    bool decompose2(Decomposed2Type&) const WARN_UNUSED_RETURN;
    void recompose2(const Decomposed2Type&);

    bool decompose4(Decomposed4Type&) const WARN_UNUSED_RETURN;
    void recompose4(const Decomposed4Type&);

    WEBCORE_EXPORT void blend(const TransformationMatrix& from, double progress, CompositeOperation = CompositeOperation::Replace);
    WEBCORE_EXPORT void blend2(const TransformationMatrix& from, double progress, CompositeOperation = CompositeOperation::Replace);
    WEBCORE_EXPORT void blend4(const TransformationMatrix& from, double progress, CompositeOperation = CompositeOperation::Replace);

    bool isAffine() const
    {
        return (m13() == 0 && m14() == 0 && m23() == 0 && m24() == 0 && 
                m31() == 0 && m32() == 0 && m33() == 1 && m34() == 0 && m43() == 0 && m44() == 1);
    }

    // Throw away the non-affine parts of the matrix (lossy!).
    WEBCORE_EXPORT void makeAffine();

    // Sets the 3rd row and column to (0, 0, 1, 0).
    // Should produce the same results as mapping points into 2d before
    // applying the next matrix.
    WEBCORE_EXPORT void flatten();

    WEBCORE_EXPORT AffineTransform toAffineTransform() const;

    bool operator==(const TransformationMatrix& m2) const
    {
        return (m_matrix[0][0] == m2.m_matrix[0][0] &&
                m_matrix[0][1] == m2.m_matrix[0][1] &&
                m_matrix[0][2] == m2.m_matrix[0][2] &&
                m_matrix[0][3] == m2.m_matrix[0][3] &&
                m_matrix[1][0] == m2.m_matrix[1][0] &&
                m_matrix[1][1] == m2.m_matrix[1][1] &&
                m_matrix[1][2] == m2.m_matrix[1][2] &&
                m_matrix[1][3] == m2.m_matrix[1][3] &&
                m_matrix[2][0] == m2.m_matrix[2][0] &&
                m_matrix[2][1] == m2.m_matrix[2][1] &&
                m_matrix[2][2] == m2.m_matrix[2][2] &&
                m_matrix[2][3] == m2.m_matrix[2][3] &&
                m_matrix[3][0] == m2.m_matrix[3][0] &&
                m_matrix[3][1] == m2.m_matrix[3][1] &&
                m_matrix[3][2] == m2.m_matrix[3][2] &&
                m_matrix[3][3] == m2.m_matrix[3][3]);
    }

    // *this = *this * t
    TransformationMatrix& operator*=(const TransformationMatrix& t)
    {
        return multiply(t);
    }
    
    // result = *this * t
    TransformationMatrix operator*(const TransformationMatrix& t) const
    {
        TransformationMatrix result = *this;
        result.multiply(t);
        return result;
    }

#if USE(CA)
    WEBCORE_EXPORT TransformationMatrix(const CATransform3D&);
    WEBCORE_EXPORT operator CATransform3D() const;
#endif
#if USE(CG)
    WEBCORE_EXPORT TransformationMatrix(const CGAffineTransform&);
    WEBCORE_EXPORT operator CGAffineTransform() const;
#endif
#if PLATFORM(COCOA)
    WEBCORE_EXPORT TransformationMatrix(const simd_float4x4&);
    WEBCORE_EXPORT operator simd_float4x4() const;
#endif
#if USE(SKIA)
    TransformationMatrix(const SkM44&);
    operator SkM44() const;
#endif

#if PLATFORM(WIN) || (PLATFORM(GTK) && OS(WINDOWS))
    WEBCORE_EXPORT operator XFORM() const;
#endif

    bool isIdentityOrTranslation() const
    {
        return m_matrix[0][0] == 1 && m_matrix[0][1] == 0 && m_matrix[0][2] == 0 && m_matrix[0][3] == 0
            && m_matrix[1][0] == 0 && m_matrix[1][1] == 1 && m_matrix[1][2] == 0 && m_matrix[1][3] == 0
            && m_matrix[2][0] == 0 && m_matrix[2][1] == 0 && m_matrix[2][2] == 1 && m_matrix[2][3] == 0
            && m_matrix[3][3] == 1;
    }

    bool isIntegerTranslation() const;

    bool containsOnlyFiniteValues() const;

    // Returns the matrix without 3D components.
    TransformationMatrix to2dTransform() const;
    
    using FloatMatrix4 = std::array<float, 16>;
    WEBCORE_EXPORT FloatMatrix4 toColumnMajorFloatArray() const;

    // A local-space layer is implicitly defined at the z = 0 plane, with its front side
    // facing the positive z-axis (i.e. a camera looking along the negative z-axis sees
    // the front side of the layer). This function checks if the transformed layer's back
    // face would be visible to a camera looking along the negative z-axis in the target space.
    bool isBackFaceVisible() const;

    TransformationMatrix transpose() const;

private:
    // multiply passed 2D point by matrix (assume z=0)
    void multVecMatrix(double x, double y, double& dstX, double& dstY) const;
    FloatPoint internalMapPoint(const FloatPoint& sourcePoint) const
    {
        double resultX;
        double resultY;
        multVecMatrix(sourcePoint.x(), sourcePoint.y(), resultX, resultY);
        return FloatPoint(static_cast<float>(resultX), static_cast<float>(resultY));
    }

    void multVecMatrix(double x, double y, double z, double& dstX, double& dstY, double& dstZ) const;
    FloatPoint3D internalMapPoint(const FloatPoint3D& sourcePoint) const
    {
        double resultX;
        double resultY;
        double resultZ;
        multVecMatrix(sourcePoint.x(), sourcePoint.y(), sourcePoint.z(), resultX, resultY, resultZ);
        return FloatPoint3D(static_cast<float>(resultX), static_cast<float>(resultY), static_cast<float>(resultZ));
    }

    enum class Type : uint8_t {
        IdentityOrTranslation,
        Affine,
        Other
    };

    Type type() const
    {
        if (!m13() && !m14() && !m23() && !m24() && !m34() && !m31() && !m32() && m33() == 1 && m44() == 1) {
            if (!m12() && !m21() && m11() == 1 && m22() == 1)
                return Type::IdentityOrTranslation;
            if (!m43())
                return Type::Affine;
        }
        return Type::Other;
    }

    Matrix4 m_matrix;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const TransformationMatrix&);

} // namespace WebCore
