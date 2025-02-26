/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include <wtf/OptionSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class MediaProducer;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::MediaProducer> : std::true_type { };
}

namespace WebCore {

enum class MediaProducerMediaState : uint32_t {
    IsPlayingAudio = 1 << 0,
    IsPlayingVideo = 1 << 1,
    IsPlayingToExternalDevice = 1 << 2,
    RequiresPlaybackTargetMonitoring = 1 << 3,
    ExternalDeviceAutoPlayCandidate = 1 << 4,
    DidPlayToEnd = 1 << 5,
    IsSourceElementPlaying = 1 << 6,
    IsNextTrackControlEnabled = 1 << 7,
    IsPreviousTrackControlEnabled = 1 << 8,
    HasPlaybackTargetAvailabilityListener = 1 << 9,
    HasAudioOrVideo = 1 << 10,
    HasActiveAudioCaptureDevice = 1 << 11,
    HasActiveVideoCaptureDevice = 1 << 12,
    HasMutedAudioCaptureDevice = 1 << 13,
    HasMutedVideoCaptureDevice = 1 << 14,
    HasInterruptedAudioCaptureDevice = 1 << 15,
    HasInterruptedVideoCaptureDevice = 1 << 16,
    HasUserInteractedWithMediaElement = 1 << 17,
    HasActiveScreenCaptureDevice = 1 << 18,
    HasMutedScreenCaptureDevice = 1 << 19,
    HasInterruptedScreenCaptureDevice = 1 << 20,
    HasActiveWindowCaptureDevice = 1 << 21,
    HasMutedWindowCaptureDevice = 1 << 22,
    HasInterruptedWindowCaptureDevice = 1 << 23,
    HasActiveSystemAudioCaptureDevice = 1 << 24,
    HasMutedSystemAudioCaptureDevice = 1 << 25,
    HasInterruptedSystemAudioCaptureDevice = 1 << 26,
    HasStreamingActivity = 1 << 27,
};
using MediaProducerMediaStateFlags = OptionSet<MediaProducerMediaState>;

enum class MediaProducerMediaCaptureKind : uint8_t {
    Microphone = 1 << 0,
    Camera = 1 << 1,
    Display = 1 << 2,
    SystemAudio = 1 << 3,
    EveryKind = 1 << 4,
};

enum class MediaProducerMutedState : uint8_t {
    AudioIsMuted = 1 << 0,
    AudioCaptureIsMuted = 1 << 1,
    VideoCaptureIsMuted = 1 << 2,
    ScreenCaptureIsMuted = 1 << 3,
    WindowCaptureIsMuted = 1 << 4,
    SystemAudioCaptureIsMuted = 1 << 5,
};
using MediaProducerMutedStateFlags = OptionSet<MediaProducerMutedState>;

class MediaProducer : public CanMakeWeakPtr<MediaProducer> {
public:
    using MediaState = MediaProducerMediaState;
    using MutedState = MediaProducerMutedState;
    using MediaStateFlags = MediaProducerMediaStateFlags;
    using MutedStateFlags = MediaProducerMutedStateFlags;

    static constexpr MediaStateFlags IsNotPlaying = { };
    static constexpr MediaStateFlags MicrophoneCaptureMask = { MediaState::HasActiveAudioCaptureDevice, MediaState::HasMutedAudioCaptureDevice, MediaState::HasInterruptedAudioCaptureDevice };
    static constexpr MediaStateFlags VideoCaptureMask = { MediaState::HasActiveVideoCaptureDevice, MediaState::HasMutedVideoCaptureDevice, MediaState::HasInterruptedVideoCaptureDevice };

    static constexpr MediaStateFlags ScreenCaptureMask = { MediaState::HasActiveScreenCaptureDevice, MediaState::HasMutedScreenCaptureDevice, MediaState::HasInterruptedScreenCaptureDevice };
    static constexpr MediaStateFlags WindowCaptureMask = { MediaState::HasActiveWindowCaptureDevice, MediaState::HasMutedWindowCaptureDevice, MediaState::HasInterruptedWindowCaptureDevice };
    static constexpr MediaStateFlags ActiveDisplayCaptureMask = { MediaState::HasActiveScreenCaptureDevice, MediaState::HasActiveWindowCaptureDevice };
    static constexpr MediaStateFlags MutedDisplayCaptureMask = { MediaState::HasMutedScreenCaptureDevice, MediaState::HasMutedWindowCaptureDevice };
    static constexpr MediaStateFlags DisplayCaptureMask = { ActiveDisplayCaptureMask | MutedDisplayCaptureMask };

    static constexpr MediaStateFlags SystemAudioCaptureMask = { MediaState::HasActiveSystemAudioCaptureDevice, MediaState::HasMutedSystemAudioCaptureDevice, MediaState::HasInterruptedSystemAudioCaptureDevice };

    static constexpr MediaStateFlags ActiveCaptureMask = { MediaState::HasActiveAudioCaptureDevice, MediaState::HasActiveVideoCaptureDevice, MediaState::HasActiveScreenCaptureDevice, MediaState::HasActiveWindowCaptureDevice, MediaState::HasActiveSystemAudioCaptureDevice };
    static constexpr MediaStateFlags MutedCaptureMask = { MediaState::HasMutedAudioCaptureDevice, MediaState::HasMutedVideoCaptureDevice, MediaState::HasMutedScreenCaptureDevice, MediaState::HasMutedWindowCaptureDevice, MediaState::HasMutedSystemAudioCaptureDevice };

    static constexpr MediaStateFlags MediaCaptureMask = {
        MediaState::HasActiveAudioCaptureDevice,
        MediaState::HasMutedAudioCaptureDevice,
        MediaState::HasInterruptedAudioCaptureDevice,
        MediaState::HasActiveVideoCaptureDevice,
        MediaState::HasMutedVideoCaptureDevice,
        MediaState::HasInterruptedVideoCaptureDevice,
        MediaState::HasActiveScreenCaptureDevice,
        MediaState::HasMutedScreenCaptureDevice,
        MediaState::HasInterruptedScreenCaptureDevice,
        MediaState::HasActiveWindowCaptureDevice,
        MediaState::HasMutedWindowCaptureDevice,
        MediaState::HasInterruptedWindowCaptureDevice,
        MediaState::HasActiveSystemAudioCaptureDevice,
        MediaState::HasMutedSystemAudioCaptureDevice,
        MediaState::HasInterruptedSystemAudioCaptureDevice
    };
    static constexpr MediaStateFlags IsCapturingAudioMask = { MicrophoneCaptureMask | SystemAudioCaptureMask };
    static constexpr MediaStateFlags IsCapturingVideoMask = { VideoCaptureMask | DisplayCaptureMask };

    static bool isCapturing(MediaStateFlags state) { return state.containsAny(ActiveCaptureMask) || state.containsAny(MutedCaptureMask); }

    virtual MediaStateFlags mediaState() const = 0;

    static constexpr MutedStateFlags AudioAndVideoCaptureIsMuted = { MutedState::AudioCaptureIsMuted, MutedState::VideoCaptureIsMuted };
    static constexpr MutedStateFlags MediaStreamCaptureIsMuted = { MutedState::AudioCaptureIsMuted, MutedState::VideoCaptureIsMuted, MutedState::ScreenCaptureIsMuted, MutedState::WindowCaptureIsMuted, MutedState::SystemAudioCaptureIsMuted };

    virtual void visibilityAdjustmentStateDidChange() { }
    virtual void pageMutedStateDidChange() = 0;

protected:
    virtual ~MediaProducer() = default;
};

} // namespace WebCore
