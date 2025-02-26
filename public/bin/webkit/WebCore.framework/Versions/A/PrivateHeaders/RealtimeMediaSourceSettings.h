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
#include "RealtimeMediaSourceSupportedConstraints.h"
#include <wtf/OptionSet.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

enum class VideoFacingMode : uint8_t {
    Unknown,
    User,
    Environment,
    Left,
    Right
};

enum class DisplaySurfaceType : uint8_t {
    Monitor,
    Window,
    Application,
    Browser,
    Invalid,
};

class RealtimeMediaSourceSettings {
public:
    static VideoFacingMode videoFacingModeEnum(const String&);
    static String displaySurface(DisplaySurfaceType);

    enum Flag {
        Width = 1 << 0,
        Height = 1 << 1,
        FrameRate = 1 << 2,
        FacingMode = 1 << 3,
        Volume = 1 << 4,
        SampleRate = 1 << 5,
        SampleSize = 1 << 6,
        EchoCancellation = 1 << 7,
        DeviceId = 1 << 8,
        GroupId = 1 << 9,
        Label = 1 << 10,
        DisplaySurface = 1 << 11,
        LogicalSurface = 1 << 12,
        WhiteBalanceMode = 1 << 13,
        Zoom = 1 << 14,
        Torch = 1 << 15,
        BackgroundBlur = 1 << 16,
        PowerEfficient = 1 << 17,
    };

    static constexpr OptionSet<Flag> allFlags() { return { Width, Height, FrameRate, FacingMode, Volume, SampleRate, SampleSize, EchoCancellation, DeviceId, GroupId, Label, DisplaySurface, LogicalSurface, WhiteBalanceMode, Zoom, Torch, BackgroundBlur, PowerEfficient }; }

    WEBCORE_EXPORT OptionSet<RealtimeMediaSourceSettings::Flag> difference(const RealtimeMediaSourceSettings&) const;

    RealtimeMediaSourceSettings() = default;
    RealtimeMediaSourceSettings(uint32_t width, uint32_t height, float frameRate, VideoFacingMode facingMode, double volume, uint32_t sampleRate, uint32_t sampleSize, bool echoCancellation, String&& deviceId, String&& groupId, String&& label, DisplaySurfaceType displaySurface, bool logicalSurface, MeteringMode whiteBalanceMode, double zoom, bool torch, bool backgroundBlur, bool powerEfficient, RealtimeMediaSourceSupportedConstraints&& supportedConstraints)
        : m_width(width)
        , m_height(height)
        , m_frameRate(frameRate)
        , m_facingMode(facingMode)
        , m_volume(volume)
        , m_sampleRate(sampleRate)
        , m_sampleSize(sampleSize)
        , m_echoCancellation(echoCancellation)
        , m_deviceId(WTFMove(deviceId))
        , m_groupId(WTFMove(groupId))
        , m_label(WTFMove(label))
        , m_displaySurface(displaySurface)
        , m_logicalSurface(logicalSurface)
        , m_whiteBalanceMode(whiteBalanceMode)
        , m_zoom(zoom)
        , m_torch(torch)
        , m_backgroundBlur(backgroundBlur)
        , m_powerEfficient(powerEfficient)
        , m_supportedConstraints(WTFMove(supportedConstraints))
    {
    }

    bool supportsWidth() const { return m_supportedConstraints.supportsWidth(); }
    uint32_t width() const { return m_width; }
    void setWidth(uint32_t width) { m_width = width; }

    bool supportsHeight() const { return m_supportedConstraints.supportsHeight(); }
    uint32_t height() const { return m_height; }
    void setHeight(uint32_t height) { m_height = height; }

    bool supportsAspectRatio() const { return m_supportedConstraints.supportsAspectRatio(); }

    bool supportsFrameRate() const { return m_supportedConstraints.supportsFrameRate(); }
    float frameRate() const { return m_frameRate; }
    void setFrameRate(float frameRate) { m_frameRate = frameRate; }

    bool supportsFacingMode() const { return m_supportedConstraints.supportsFacingMode(); }
    VideoFacingMode facingMode() const { return m_facingMode; }
    void setFacingMode(VideoFacingMode facingMode) { m_facingMode = facingMode; }

    bool supportsVolume() const { return m_supportedConstraints.supportsVolume(); }
    double volume() const { return m_volume; }
    void setVolume(double volume) { m_volume = volume; }

    bool supportsSampleRate() const { return m_supportedConstraints.supportsSampleRate(); }
    uint32_t sampleRate() const { return m_sampleRate; }
    void setSampleRate(uint32_t sampleRate) { m_sampleRate = sampleRate; }

    bool supportsSampleSize() const { return m_supportedConstraints.supportsSampleSize(); }
    uint32_t sampleSize() const { return m_sampleSize; }
    void setSampleSize(uint32_t sampleSize) { m_sampleSize = sampleSize; }

    bool supportsEchoCancellation() const { return m_supportedConstraints.supportsEchoCancellation(); }
    bool echoCancellation() const { return m_echoCancellation; }
    void setEchoCancellation(bool echoCancellation) { m_echoCancellation = echoCancellation; }

    bool supportsDeviceId() const { return m_supportedConstraints.supportsDeviceId(); }
    const String& deviceId() const { return m_deviceId; }
    void setDeviceId(const String& deviceId) { m_deviceId = deviceId; }

    bool supportsGroupId() const { return m_supportedConstraints.supportsGroupId(); }
    const String& groupId() const { return m_groupId; }
    void setGroupId(const String& groupId) { m_groupId = groupId; }

    bool supportsDisplaySurface() const { return m_supportedConstraints.supportsDisplaySurface(); }
    DisplaySurfaceType displaySurface() const { return m_displaySurface; }
    void setDisplaySurface(DisplaySurfaceType displaySurface) { m_displaySurface = displaySurface; }

    bool supportsLogicalSurface() const { return m_supportedConstraints.supportsLogicalSurface(); }
    bool logicalSurface() const { return m_logicalSurface; }
    void setLogicalSurface(bool logicalSurface) { m_logicalSurface = logicalSurface; }

    bool supportsWhiteBalanceMode() const { return m_supportedConstraints.supportsWhiteBalanceMode(); }
    MeteringMode whiteBalanceMode() const { return m_whiteBalanceMode; }
    void setWhiteBalanceMode(MeteringMode mode) { m_whiteBalanceMode = mode; }

    bool supportsZoom() const { return m_supportedConstraints.supportsZoom(); }
    double zoom() const { return m_zoom; }
    void setZoom(double zoom) { m_zoom = zoom; }

    bool supportsTorch() const { return m_supportedConstraints.supportsTorch(); }
    bool torch() const { return m_torch; }
    void setTorch(bool torch) { m_torch = torch; }

    bool supportsBackgroundBlur() const { return m_supportedConstraints.supportsBackgroundBlur(); }
    bool backgroundBlur() const { return m_backgroundBlur; }
    void setBackgroundBlur(bool backgroundBlur) { m_backgroundBlur = backgroundBlur; }

    bool supportsPowerEfficient() const { return m_supportedConstraints.supportsPowerEfficient(); }
    bool powerEfficient() const { return m_powerEfficient; }
    void setPowerEfficient(bool value) { m_powerEfficient = value; }

    const RealtimeMediaSourceSupportedConstraints& supportedConstraints() const { return m_supportedConstraints; }
    void setSupportedConstraints(const RealtimeMediaSourceSupportedConstraints& supportedConstraints) { m_supportedConstraints = supportedConstraints; }

    const String& label() const { return m_label; }
    void setLabel(const String& label) { m_label = label; }

    static String convertFlagsToString(const OptionSet<RealtimeMediaSourceSettings::Flag>);

    RealtimeMediaSourceSettings isolatedCopy() const;

private:
    uint32_t m_width { 0 };
    uint32_t m_height { 0 };
    float m_frameRate { 0 };
    VideoFacingMode m_facingMode { VideoFacingMode::Unknown };
    double m_volume { 0 };
    uint32_t m_sampleRate { 0 };
    uint32_t m_sampleSize { 0 };
    bool m_echoCancellation { 0 };

    String m_deviceId;
    String m_groupId;
    String m_label;

    DisplaySurfaceType m_displaySurface { DisplaySurfaceType::Invalid };
    bool m_logicalSurface { 0 };

    MeteringMode m_whiteBalanceMode { MeteringMode::None };
    double m_zoom { 1.0 };
    bool m_torch { false };
    bool m_backgroundBlur { false };
    bool m_powerEfficient { false };

    RealtimeMediaSourceSupportedConstraints m_supportedConstraints;
};

String convertEnumerationToString(VideoFacingMode);

} // namespace WebCore

namespace WTF {

template<typename Type>
struct LogArgument;

template <>
struct LogArgument<WebCore::VideoFacingMode> {
    static String toString(const WebCore::VideoFacingMode mode)
    {
        return convertEnumerationToString(mode);
    }
};

template <>
struct LogArgument<OptionSet<WebCore::RealtimeMediaSourceSettings::Flag>> {
    static String toString(const OptionSet<WebCore::RealtimeMediaSourceSettings::Flag> flags)
    {
        return WebCore::RealtimeMediaSourceSettings::convertFlagsToString(flags);
    }
};

}; // namespace WTF

#endif
