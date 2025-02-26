/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include <wtf/text/WTFString.h>

namespace WebCore {

enum class MediaPlayerNetworkState : uint8_t {
    Empty,
    Idle,
    Loading,
    Loaded,
    FormatError,
    NetworkError,
    DecodeError
};

enum class MediaPlayerReadyState : uint8_t {
    HaveNothing,
    HaveMetadata,
    HaveCurrentData,
    HaveFutureData,
    HaveEnoughData
};

enum class MediaPlayerMovieLoadType : uint8_t {
    Unknown,
    Download,
    StoredStream,
    LiveStream,
    HttpLiveStream,
};

enum class MediaPlayerPreload : uint8_t {
    None,
    MetaData,
    Auto
};

enum class MediaPlayerVideoGravity : uint8_t {
    Resize,
    ResizeAspect,
    ResizeAspectFill
};

enum class MediaPlayerSupportsType : uint8_t {
    IsNotSupported,
    IsSupported,
    MayBeSupported
};

enum class MediaPlayerBufferingPolicy : uint8_t {
    Default,
    LimitReadAhead,
    MakeResourcesPurgeable,
    PurgeResources,
};

enum class MediaPlayerMediaEngineIdentifier : uint8_t {
    AVFoundation,
    AVFoundationMSE,
    AVFoundationMediaStream,
    AVFoundationCF,
    GStreamer,
    GStreamerMSE,
    HolePunch,
    MediaFoundation,
    MockMSE,
    CocoaWebM
};

enum class MediaPlayerWirelessPlaybackTargetType : uint8_t {
    TargetTypeNone,
    TargetTypeAirPlay,
    TargetTypeTVOut
};

enum class MediaPlayerPitchCorrectionAlgorithm : uint8_t {
    BestAllAround,
    BestForMusic,
    BestForSpeech,
};

enum class MediaPlayerNeedsRenderingModeChanged : bool {
    No,
    Yes,
};

class MediaPlayerEnums {
public:
    using NetworkState = MediaPlayerNetworkState;
    using ReadyState = MediaPlayerReadyState;
    using MovieLoadType = MediaPlayerMovieLoadType;
    using Preload = MediaPlayerPreload;
    using VideoGravity = MediaPlayerVideoGravity;
    using SupportsType = MediaPlayerSupportsType;
    using BufferingPolicy = MediaPlayerBufferingPolicy;
    using MediaEngineIdentifier = MediaPlayerMediaEngineIdentifier;
    using WirelessPlaybackTargetType = MediaPlayerWirelessPlaybackTargetType;
    using PitchCorrectionAlgorithm = MediaPlayerPitchCorrectionAlgorithm;
    using NeedsRenderingModeChanged = MediaPlayerNeedsRenderingModeChanged;

    enum {
        VideoFullscreenModeNone = 0,
        VideoFullscreenModeStandard = 1 << 0,
        VideoFullscreenModePictureInPicture = 1 << 1,
        VideoFullscreenModeInWindow = 1 << 2,
        VideoFullscreenModeAllValidBitsMask = (VideoFullscreenModeStandard | VideoFullscreenModePictureInPicture | VideoFullscreenModeInWindow)
    };
    typedef uint32_t VideoFullscreenMode;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, MediaPlayerEnums::VideoGravity);
WEBCORE_EXPORT String convertEnumerationToString(MediaPlayerEnums::ReadyState);
String convertEnumerationToString(MediaPlayerEnums::NetworkState);
String convertEnumerationToString(MediaPlayerEnums::Preload);
String convertEnumerationToString(MediaPlayerEnums::SupportsType);
String convertEnumerationToString(MediaPlayerEnums::BufferingPolicy);

} // namespace WebCore


namespace WTF {

template<typename Type>
struct LogArgument;

template <>
struct LogArgument<WebCore::MediaPlayerEnums::ReadyState> {
    static String toString(const WebCore::MediaPlayerEnums::ReadyState state)
    {
        return convertEnumerationToString(state);
    }
};

template <>
struct LogArgument<WebCore::MediaPlayerEnums::NetworkState> {
    static String toString(const WebCore::MediaPlayerEnums::NetworkState state)
    {
        return convertEnumerationToString(state);
    }
};

template <>
struct LogArgument<WebCore::MediaPlayerEnums::BufferingPolicy> {
    static String toString(const WebCore::MediaPlayerEnums::BufferingPolicy policy)
    {
        return convertEnumerationToString(policy);
    }
};

}; // namespace WTF
