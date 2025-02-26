/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
 */

#pragma once

#if ENABLE(WEBXR) && PLATFORM(COCOA)

#include <WebCore/PlatformXR.h>
#include <simd/simd.h>
#include <wtf/TZoneMalloc.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

class PlatformXRPose {
    WTF_MAKE_TZONE_ALLOCATED(PlatformXRPose);

public:
    simd_float4x4 simdTransform() const { return m_simdTransform; }
    simd_float3 simdPosition() const { return m_simdTransform.columns[3].xyz; }
    simd_quatf simdOrientation() const { return simd_quaternion(m_simdTransform); }
    WEBCORE_EXPORT WebCore::FloatPoint3D position() const;
    WEBCORE_EXPORT PlatformXR::FrameData::FloatQuaternion orientation() const;
    WEBCORE_EXPORT PlatformXR::FrameData::Pose pose() const;

    using FloatMatrix4 = std::array<float, 16>;
    WEBCORE_EXPORT FloatMatrix4 toColumnMajorFloatArray() const;

    WEBCORE_EXPORT float distanceToPose(const PlatformXRPose&) const;
    WEBCORE_EXPORT PlatformXRPose verticalTransformPose() const;

    WEBCORE_EXPORT PlatformXRPose(const simd_float4x4&);
    WEBCORE_EXPORT PlatformXRPose(const simd_float4x4&, const simd_float4x4& parentTransform);

private:
    simd_float4x4 m_simdTransform;
};

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(WEBXR) && PLATFORM(COCOA)
