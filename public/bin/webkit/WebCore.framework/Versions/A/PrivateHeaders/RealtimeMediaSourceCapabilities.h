/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM)

#include "MeteringMode.h"
#include "RealtimeMediaSourceSettings.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

template<typename T>
class CapabilityRange {
public:
    CapabilityRange() = default;
    CapabilityRange(T min, T max)
        : m_min(min)
        , m_max(max)
    {
        RELEASE_ASSERT(min <= max);
    }

    T min() const { return m_min; }
    T max() const { return m_max; }

private:
    T m_min { 0 };
    T m_max { 0 };
};

class LongCapabilityRange : public CapabilityRange<int> {
public:
    LongCapabilityRange() = default;
    LongCapabilityRange(int min, int max)
        : CapabilityRange(min, max)
    {
    }
};

class DoubleCapabilityRange : public CapabilityRange<double> {
public:
    DoubleCapabilityRange() = default;
    DoubleCapabilityRange(double min, double max)
        : CapabilityRange(min, max)
    {
    }
};

class RealtimeMediaSourceCapabilities {
public:
    RealtimeMediaSourceCapabilities() = default;
    RealtimeMediaSourceCapabilities(const RealtimeMediaSourceSupportedConstraints& supportedConstraints)
        : m_supportedConstraints(supportedConstraints)
    {
    }
    
    enum class EchoCancellation : bool {
        ReadOnly = 0,
        ReadWrite = 1,
    };
    enum class BackgroundBlur : uint8_t {
        Off,
        On,
        OnOff,
    };

    RealtimeMediaSourceCapabilities(LongCapabilityRange width, LongCapabilityRange height, DoubleCapabilityRange aspectRatio, DoubleCapabilityRange frameRate, Vector<VideoFacingMode>&& facingMode, DoubleCapabilityRange volume, LongCapabilityRange sampleRate, LongCapabilityRange sampleSize, EchoCancellation echoCancellation, String&& deviceId, String&& groupId, DoubleCapabilityRange focusDistance, Vector<MeteringMode>&& whiteBalanceModes, DoubleCapabilityRange zoom, bool torch, BackgroundBlur backgroundBlur, bool powerEfficient, RealtimeMediaSourceSupportedConstraints&& supportedConstraints)
        : m_width(WTFMove(width))
        , m_height(WTFMove(height))
        , m_aspectRatio(WTFMove(aspectRatio))
        , m_frameRate(WTFMove(frameRate))
        , m_facingMode(WTFMove(facingMode))
        , m_volume(WTFMove(volume))
        , m_sampleRate(WTFMove(sampleRate))
        , m_sampleSize(WTFMove(sampleSize))
        , m_echoCancellation(WTFMove(echoCancellation))
        , m_deviceId(WTFMove(deviceId))
        , m_groupId(WTFMove(groupId))
        , m_focusDistance(WTFMove(focusDistance))
        , m_whiteBalanceModes(whiteBalanceModes)
        , m_zoom(WTFMove(zoom))
        , m_torch(torch)
        , m_backgroundBlur(backgroundBlur)
        , m_powerEfficient(powerEfficient)
        , m_supportedConstraints(WTFMove(supportedConstraints))
    {
    }

    ~RealtimeMediaSourceCapabilities() = default;

    static const RealtimeMediaSourceCapabilities& emptyCapabilities()
    {
        static NeverDestroyed<RealtimeMediaSourceCapabilities> emptyCapabilities;
        return emptyCapabilities;
    }

    bool supportsWidth() const { return m_supportedConstraints.supportsWidth(); }
    const LongCapabilityRange& width() const { return m_width; }
    void setWidth(const LongCapabilityRange& width) { m_width = width; }

    bool supportsHeight() const { return m_supportedConstraints.supportsHeight(); }
    const LongCapabilityRange& height() const { return m_height; }
    void setHeight(const LongCapabilityRange& height) { m_height = height; }

    bool supportsFrameRate() const { return m_supportedConstraints.supportsFrameRate(); }
    const DoubleCapabilityRange& frameRate() const { return m_frameRate; }
    void setFrameRate(const DoubleCapabilityRange& frameRate) { m_frameRate = frameRate; }

    bool supportsFacingMode() const { return m_supportedConstraints.supportsFacingMode(); }
    const Vector<VideoFacingMode>& facingMode() const { return m_facingMode; }
    void addFacingMode(VideoFacingMode mode) { m_facingMode.append(mode); }

    bool supportsAspectRatio() const { return m_supportedConstraints.supportsAspectRatio(); }
    const DoubleCapabilityRange& aspectRatio() const { return m_aspectRatio; }
    void setAspectRatio(const DoubleCapabilityRange& aspectRatio) { m_aspectRatio = aspectRatio; }

    bool supportsVolume() const { return m_supportedConstraints.supportsVolume(); }
    const DoubleCapabilityRange& volume() const { return m_volume; }
    void setVolume(const DoubleCapabilityRange& volume) { m_volume = volume; }

    bool supportsSampleRate() const { return m_supportedConstraints.supportsSampleRate(); }
    const LongCapabilityRange& sampleRate() const { return m_sampleRate; }
    void setSampleRate(const LongCapabilityRange& sampleRate) { m_sampleRate = sampleRate; }

    bool supportsSampleSize() const { return m_supportedConstraints.supportsSampleSize(); }
    const LongCapabilityRange& sampleSize() const { return m_sampleSize; }
    void setSampleSize(const LongCapabilityRange& sampleSize) { m_sampleSize = sampleSize; }

    bool supportsEchoCancellation() const { return m_supportedConstraints.supportsEchoCancellation(); }
    EchoCancellation echoCancellation() const { return m_echoCancellation; }
    void setEchoCancellation(EchoCancellation echoCancellation) { m_echoCancellation = echoCancellation; }

    bool supportsDeviceId() const { return m_supportedConstraints.supportsDeviceId(); }
    const String& deviceId() const { return m_deviceId; }
    void setDeviceId(const String& id)  { m_deviceId = id; }

    bool supportsGroupId() const { return m_supportedConstraints.supportsGroupId(); }
    const String& groupId() const { return m_groupId; }
    void setGroupId(const String& id)  { m_groupId = id; }

    bool supportsFocusDistance() const { return m_supportedConstraints.supportsFocusDistance(); }
    const DoubleCapabilityRange& focusDistance() const { return m_focusDistance; }
    void setFocusDistance(const DoubleCapabilityRange& focusDistance) { m_focusDistance = focusDistance; }

    bool supportsWhiteBalanceMode() const { return m_supportedConstraints.supportsWhiteBalanceMode(); }
    const Vector<MeteringMode>& whiteBalanceModes() const { return m_whiteBalanceModes; }
    void setWhiteBalanceModes(Vector<MeteringMode>&& modes) { m_whiteBalanceModes = WTFMove(modes); }

    bool supportsZoom() const { return m_supportedConstraints.supportsZoom(); }
    const DoubleCapabilityRange& zoom() const { return m_zoom; }
    void setZoom(const DoubleCapabilityRange& zoom) { m_zoom = zoom; }

    bool supportsTorch() const { return m_supportedConstraints.supportsTorch(); }
    bool torch() const { return m_torch; }
    void setTorch(bool torch) { m_torch = torch; }

    bool supportsBackgroundBlur() const { return m_supportedConstraints.supportsBackgroundBlur(); }
    BackgroundBlur backgroundBlur() const { return m_backgroundBlur; }
    void setBackgroundBlur(BackgroundBlur backgroundBlur) { m_backgroundBlur = backgroundBlur; }

    bool supportsPowerEfficient() const { return m_supportedConstraints.supportsPowerEfficient(); }
    bool powerEfficient() const { return m_powerEfficient; }
    void setPowerEfficient(bool value) { m_powerEfficient = value; }

    const RealtimeMediaSourceSupportedConstraints& supportedConstraints() const { return m_supportedConstraints; }
    void setSupportedConstraints(const RealtimeMediaSourceSupportedConstraints& constraints) { m_supportedConstraints = constraints; }

    RealtimeMediaSourceCapabilities isolatedCopy() const { return { m_width, m_height, m_aspectRatio, m_frameRate, Vector<VideoFacingMode> { m_facingMode }, m_volume, m_sampleRate, m_sampleSize, m_echoCancellation, m_deviceId.isolatedCopy(), m_groupId.isolatedCopy(), m_focusDistance, Vector<MeteringMode> { m_whiteBalanceModes }, m_zoom, m_torch, m_backgroundBlur, m_powerEfficient, RealtimeMediaSourceSupportedConstraints { m_supportedConstraints } }; }

private:
    LongCapabilityRange m_width;
    LongCapabilityRange m_height;
    DoubleCapabilityRange m_aspectRatio;
    DoubleCapabilityRange m_frameRate;
    Vector<VideoFacingMode> m_facingMode;
    DoubleCapabilityRange m_volume;
    LongCapabilityRange m_sampleRate;
    LongCapabilityRange m_sampleSize;
    EchoCancellation m_echoCancellation { EchoCancellation::ReadOnly };
    String m_deviceId;
    String m_groupId;
    DoubleCapabilityRange m_focusDistance;

    Vector<MeteringMode> m_whiteBalanceModes;
    DoubleCapabilityRange m_zoom;
    bool m_torch { false };

    BackgroundBlur m_backgroundBlur { BackgroundBlur::Off };
    bool m_powerEfficient { false };

    RealtimeMediaSourceSupportedConstraints m_supportedConstraints;
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)
