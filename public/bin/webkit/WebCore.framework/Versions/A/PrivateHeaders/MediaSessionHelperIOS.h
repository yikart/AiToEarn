/*
 * Copyright (C) 2020-2023 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if PLATFORM(IOS_FAMILY)

#include <wtf/WeakHashSet.h>

namespace WebCore {
class MediaSessionHelperClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::MediaSessionHelperClient> : std::true_type { };
}

namespace WebCore {

class MediaPlaybackTarget;

class MediaSessionHelperClient : public CanMakeWeakPtr<MediaSessionHelperClient> {
public:
    virtual ~MediaSessionHelperClient() = default;

    enum class SuspendedUnderLock : bool { No, Yes };
    virtual void applicationWillEnterForeground(SuspendedUnderLock) = 0;
    virtual void applicationDidEnterBackground(SuspendedUnderLock) = 0;
    virtual void applicationWillBecomeInactive() = 0;
    virtual void applicationDidBecomeActive() = 0;

    enum class HasAvailableTargets : bool { No, Yes };
    virtual void externalOutputDeviceAvailableDidChange(HasAvailableTargets) = 0;

    enum class PlayingToAutomotiveHeadUnit : bool { No, Yes };
    virtual void isPlayingToAutomotiveHeadUnitDidChange(PlayingToAutomotiveHeadUnit) = 0;

    enum class ShouldPause : bool { No, Yes };
    virtual void activeAudioRouteDidChange(ShouldPause) = 0;

    enum class SupportsAirPlayVideo : bool { No, Yes };
    virtual void activeVideoRouteDidChange(SupportsAirPlayVideo, Ref<MediaPlaybackTarget>&&) = 0;

    enum class SupportsSpatialAudioPlayback : bool { No, Yes };
    virtual void activeAudioRouteSupportsSpatialPlaybackDidChange(SupportsSpatialAudioPlayback) = 0;
};

class WEBCORE_EXPORT MediaSessionHelper : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<MediaSessionHelper> {
public:
    static MediaSessionHelper& sharedHelper();
    static void setSharedHelper(Ref<MediaSessionHelper>&&);
    static void resetSharedHelper();

    MediaSessionHelper() = default;
    explicit MediaSessionHelper(bool isExternalOutputDeviceAvailable);
    virtual ~MediaSessionHelper() = default;

    void addClient(MediaSessionHelperClient&);
    void removeClient(MediaSessionHelperClient&);

    void startMonitoringWirelessRoutes();
    void stopMonitoringWirelessRoutes();

    enum class ShouldOverride : bool { No, Yes };
    void providePresentingApplicationPID(int pid) { providePresentingApplicationPID(pid, ShouldOverride::No); }
    virtual void providePresentingApplicationPID(int, ShouldOverride) = 0;

    void setIsExternalOutputDeviceAvailable(bool);

    bool isMonitoringWirelessRoutes() const { return m_monitoringWirelessRoutesCount; }
    bool isExternalOutputDeviceAvailable() const { return m_isExternalOutputDeviceAvailable; }
    bool activeVideoRouteSupportsAirPlayVideo() const { return m_activeVideoRouteSupportsAirPlayVideo; }
    bool isPlayingToAutomotiveHeadUnit() const { return m_isPlayingToAutomotiveHeadUnit; }

    MediaPlaybackTarget* playbackTarget() const { return m_playbackTarget.get(); }

    using HasAvailableTargets = MediaSessionHelperClient::HasAvailableTargets;
    using PlayingToAutomotiveHeadUnit = MediaSessionHelperClient::PlayingToAutomotiveHeadUnit;
    using ShouldPause = MediaSessionHelperClient::ShouldPause;
    using SupportsAirPlayVideo = MediaSessionHelperClient::SupportsAirPlayVideo;
    using SuspendedUnderLock = MediaSessionHelperClient::SuspendedUnderLock;
    using SupportsSpatialAudioPlayback = MediaSessionHelperClient::SupportsSpatialAudioPlayback;

    void activeAudioRouteDidChange(ShouldPause);
    void applicationWillEnterForeground(SuspendedUnderLock);
    void applicationDidEnterBackground(SuspendedUnderLock);
    void applicationWillBecomeInactive();
    void applicationDidBecomeActive();

    void setActiveAudioRouteSupportsSpatialPlayback(bool);
    void updateActiveAudioRouteSupportsSpatialPlayback();

protected:
    void externalOutputDeviceAvailableDidChange(HasAvailableTargets);
    void isPlayingToAutomotiveHeadUnitDidChange(PlayingToAutomotiveHeadUnit);
    void activeVideoRouteDidChange(SupportsAirPlayVideo, Ref<MediaPlaybackTarget>&&);
    void activeAudioRouteSupportsSpatialPlaybackDidChange(SupportsSpatialAudioPlayback);

private:
    virtual void startMonitoringWirelessRoutesInternal() = 0;
    virtual void stopMonitoringWirelessRoutesInternal() = 0;

    WeakHashSet<MediaSessionHelperClient> m_clients;
    bool m_isExternalOutputDeviceAvailable { false };
    uint32_t m_monitoringWirelessRoutesCount { 0 };
    bool m_activeVideoRouteSupportsAirPlayVideo { false };
    bool m_isPlayingToAutomotiveHeadUnit { false };
    SupportsSpatialAudioPlayback m_activeAudioRouteSupportsSpatialPlayback { SupportsSpatialAudioPlayback::No };
    RefPtr<MediaPlaybackTarget> m_playbackTarget;
};

inline MediaSessionHelper::MediaSessionHelper(bool isExternalOutputDeviceAvailable)
    : m_isExternalOutputDeviceAvailable(isExternalOutputDeviceAvailable)
{
}

inline void MediaSessionHelper::setIsExternalOutputDeviceAvailable(bool isExternalOutputDeviceAvailable)
{
    m_isExternalOutputDeviceAvailable = isExternalOutputDeviceAvailable;
}

}

#endif
