/*
 * Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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

#include "CaptureDevice.h"
#include "RealtimeMediaSource.h"
#include "VideoPreset.h"

namespace WebCore {

struct MockMicrophoneProperties {
    int defaultSampleRate { 44100 };
};

struct MockSpeakerProperties {
    String relatedMicrophoneId;
    int defaultSampleRate { 44100 };
};

// FIXME: Add support for other properties.
struct MockCameraProperties {
    double defaultFrameRate { 30 };
    VideoFacingMode facingMode { VideoFacingMode::User };
    Vector<VideoPresetData> presets { { { 640, 480 }, { { 30, 30 }, { 15, 15 } }, 1, 2, false } };
    Color fillColor { Color::black };
    Vector<MeteringMode> whiteBalanceMode { MeteringMode::None };
    bool hasTorch { false };
    bool hasBackgroundBlur { false };
};

struct MockDisplayProperties {
    CaptureDevice::DeviceType type;
    Color fillColor { Color::lightGray };
    IntSize defaultSize;
};

struct MockMediaDevice {
    bool isMicrophone() const { return std::holds_alternative<MockMicrophoneProperties>(properties); }
    bool isSpeaker() const { return std::holds_alternative<MockSpeakerProperties>(properties); }
    bool isCamera() const { return std::holds_alternative<MockCameraProperties>(properties); }
    bool isDisplay() const { return std::holds_alternative<MockDisplayProperties>(properties); }

    enum class Flag : uint8_t {
        Ephemeral   = 1 << 0,
        Invalid     = 1 << 1,
    };
    using Flags = OptionSet<Flag>;

    CaptureDevice captureDevice() const
    {
        if (isMicrophone())
            return CaptureDevice { persistentId, CaptureDevice::DeviceType::Microphone, label, persistentId, true, false, true, flags.contains(Flag::Ephemeral) };

        if (isSpeaker())
            return CaptureDevice { persistentId, CaptureDevice::DeviceType::Speaker, label, speakerProperties()->relatedMicrophoneId, true, false, true, flags.contains(Flag::Ephemeral) };

        if (isCamera())
            return CaptureDevice { persistentId, CaptureDevice::DeviceType::Camera, label, persistentId, true, false, true, flags.contains(Flag::Ephemeral) };

        ASSERT(isDisplay());
        return CaptureDevice { persistentId, std::get<MockDisplayProperties>(properties).type, label, emptyString(), true, false, true, flags.contains(Flag::Ephemeral) };
    }

    CaptureDevice::DeviceType type() const
    {
        if (isMicrophone())
            return CaptureDevice::DeviceType::Microphone;
        if (isSpeaker())
            return CaptureDevice::DeviceType::Speaker;
        if (isCamera())
            return CaptureDevice::DeviceType::Camera;

        ASSERT(isDisplay());
        return std::get<MockDisplayProperties>(properties).type;
    }

    const MockSpeakerProperties* speakerProperties() const
    {
        return isSpeaker() ? &std::get<MockSpeakerProperties>(properties) : nullptr;
    }

    const MockCameraProperties* cameraProperties() const
    {
        return isCamera() ? &std::get<MockCameraProperties>(properties) : nullptr;
    }

    String persistentId;
    String label;
    Flags flags;
    std::variant<MockMicrophoneProperties, MockSpeakerProperties, MockCameraProperties, MockDisplayProperties> properties;
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)
