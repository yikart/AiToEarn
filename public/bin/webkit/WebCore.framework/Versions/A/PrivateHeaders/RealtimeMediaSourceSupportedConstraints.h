/*
 * Copyright (C) 2015-2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer
 *    in the documentation and/or other materials provided with the
 *    distribution.
 * 3. Neither the name of Google Inc. nor the names of its contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
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

#if ENABLE(MEDIA_STREAM)

#include "MediaConstraintType.h"

namespace WebCore {

class RealtimeMediaSourceSupportedConstraints {
public:
    RealtimeMediaSourceSupportedConstraints()
    {
    }
    
    RealtimeMediaSourceSupportedConstraints(bool supportsWidth, bool supportsHeight, bool supportsAspectRatio, bool supportsFrameRate, bool supportsFacingMode, bool supportsVolume, bool supportsSampleRate, bool supportsSampleSize, bool supportsEchoCancellation, bool supportsDeviceId, bool supportsGroupId, bool supportsDisplaySurface, bool supportsLogicalSurface, bool supportsFocusDistance, bool supportsWhiteBalanceMode, bool supportsZoom, bool supportsTorch, bool supportsBackgroundBlur, bool supportsPowerEfficient)
        : m_supportsWidth(supportsWidth)
        , m_supportsHeight(supportsHeight)
        , m_supportsAspectRatio(supportsAspectRatio)
        , m_supportsFrameRate(supportsFrameRate)
        , m_supportsFacingMode(supportsFacingMode)
        , m_supportsVolume(supportsVolume)
        , m_supportsSampleRate(supportsSampleRate)
        , m_supportsSampleSize(supportsSampleSize)
        , m_supportsEchoCancellation(supportsEchoCancellation)
        , m_supportsDeviceId(supportsDeviceId)
        , m_supportsGroupId(supportsGroupId)
        , m_supportsDisplaySurface(supportsDisplaySurface)
        , m_supportsLogicalSurface(supportsLogicalSurface)
        , m_supportsFocusDistance(supportsFocusDistance)
        , m_supportsWhiteBalanceMode(supportsWhiteBalanceMode)
        , m_supportsZoom(supportsZoom)
        , m_supportsTorch(supportsTorch)
        , m_supportsBackgroundBlur(supportsBackgroundBlur)
        , m_supportsPowerEfficient(supportsPowerEfficient)
    {
    }

    bool supportsWidth() const { return m_supportsWidth; }
    void setSupportsWidth(bool value) { m_supportsWidth = value; }

    bool supportsHeight() const { return m_supportsHeight; }
    void setSupportsHeight(bool value) { m_supportsHeight = value; }

    bool supportsAspectRatio() const { return m_supportsAspectRatio; }
    void setSupportsAspectRatio(bool value) { m_supportsAspectRatio = value; }

    bool supportsFrameRate() const { return m_supportsFrameRate; }
    void setSupportsFrameRate(bool value) { m_supportsFrameRate = value; }

    bool supportsFacingMode() const { return m_supportsFacingMode; }
    void setSupportsFacingMode(bool value) { m_supportsFacingMode = value; }

    bool supportsVolume() const { return m_supportsVolume; }
    void setSupportsVolume(bool value) { m_supportsVolume = value; }

    bool supportsSampleRate() const { return m_supportsSampleRate; }
    void setSupportsSampleRate(bool value) { m_supportsSampleRate = value; }

    bool supportsSampleSize() const { return m_supportsSampleSize; }
    void setSupportsSampleSize(bool value) { m_supportsSampleSize = value; }

    bool supportsEchoCancellation() const { return m_supportsEchoCancellation; }
    void setSupportsEchoCancellation(bool value) { m_supportsEchoCancellation = value; }

    bool supportsDeviceId() const { return m_supportsDeviceId; }
    void setSupportsDeviceId(bool value) { m_supportsDeviceId = value; }

    bool supportsGroupId() const { return m_supportsGroupId; }
    void setSupportsGroupId(bool value) { m_supportsGroupId = value; }

    bool supportsDisplaySurface() const { return m_supportsDisplaySurface; }
    void setSupportsDisplaySurface(bool value) { m_supportsDisplaySurface = value; }

    bool supportsLogicalSurface() const { return m_supportsLogicalSurface; }
    void setSupportsLogicalSurface(bool value) { m_supportsLogicalSurface = value; }

    bool supportsConstraint(MediaConstraintType) const;

    bool supportsFocusDistance() const { return m_supportsFocusDistance; }
    void setSupportsFocusDistance(bool value) { m_supportsFocusDistance = value; }

    bool supportsWhiteBalanceMode() const { return m_supportsWhiteBalanceMode; }
    void setSupportsWhiteBalanceMode(bool value) { m_supportsWhiteBalanceMode = value; }

    bool supportsZoom() const { return m_supportsZoom; }
    void setSupportsZoom(bool value) { m_supportsZoom = value; }

    bool supportsTorch() const { return m_supportsTorch; }
    void setSupportsTorch(bool value) { m_supportsTorch = value; }

    bool supportsBackgroundBlur() const { return m_supportsBackgroundBlur; }
    void setSupportsBackgroundBlur(bool value) { m_supportsBackgroundBlur = value; }

    bool supportsPowerEfficient() const { return m_supportsPowerEfficient; }
    void setSupportsPowerEfficient(bool value) { m_supportsPowerEfficient = value; }

private:
    bool m_supportsWidth { false };
    bool m_supportsHeight { false };
    bool m_supportsAspectRatio { false };
    bool m_supportsFrameRate { false };
    bool m_supportsFacingMode { false };
    bool m_supportsVolume { false };
    bool m_supportsSampleRate { false };
    bool m_supportsSampleSize { false };
    bool m_supportsEchoCancellation { false };
    bool m_supportsDeviceId { false };
    bool m_supportsGroupId { false };
    bool m_supportsDisplaySurface { false };
    bool m_supportsLogicalSurface { false };
    bool m_supportsFocusDistance { false };
    bool m_supportsWhiteBalanceMode { false };
    bool m_supportsZoom { false };
    bool m_supportsTorch { false };
    bool m_supportsBackgroundBlur { false };
    bool m_supportsPowerEfficient { false };
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)
