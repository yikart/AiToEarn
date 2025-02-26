/*
 * Copyright (C) 2013 Nokia Corporation and/or its subsidiary(-ies).
 * Copyright (C) 2015 Ericsson AB. All rights reserved.
 * Copyright (C) 2013-2022 Apple Inc. All rights reserved.
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

#include "MediaStreamTrackHintValue.h"
#include "RealtimeMediaSource.h"
#include <wtf/LoggerHelper.h>
#include <wtf/RefCounted.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {
class MediaStreamTrackPrivateObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::MediaStreamTrackPrivateObserver> : std::true_type { };
}

namespace WebCore {

class GraphicsContext;
class MediaSample;
class MediaStreamTrackPrivate;
class MediaStreamTrackPrivateSourceObserver;
class RealtimeMediaSourceCapabilities;
class WebAudioSourceProvider;

struct MediaStreamTrackDataHolder;

class MediaStreamTrackPrivateObserver : public CanMakeWeakPtr<MediaStreamTrackPrivateObserver> {
public:
    virtual ~MediaStreamTrackPrivateObserver() = default;

    virtual void trackStarted(MediaStreamTrackPrivate&) { };
    virtual void trackEnded(MediaStreamTrackPrivate&) = 0;
    virtual void trackMutedChanged(MediaStreamTrackPrivate&) = 0;
    virtual void trackSettingsChanged(MediaStreamTrackPrivate&) = 0;
    virtual void trackConfigurationChanged(MediaStreamTrackPrivate&) { };
    virtual void trackEnabledChanged(MediaStreamTrackPrivate&) = 0;
    virtual void readyStateChanged(MediaStreamTrackPrivate&) { };
    virtual void dataFlowStarted(MediaStreamTrackPrivate&) { };
};

class MediaStreamTrackPrivate final
    : public RefCounted<MediaStreamTrackPrivate>
    , public CanMakeWeakPtr<MediaStreamTrackPrivate>
#if !RELEASE_LOG_DISABLED
    , public LoggerHelper
#endif
{
public:
    static Ref<MediaStreamTrackPrivate> create(Ref<const Logger>&&, UniqueRef<MediaStreamTrackDataHolder>&&, std::function<void(Function<void()>&&)>&&);
    static Ref<MediaStreamTrackPrivate> create(Ref<const Logger>&&, Ref<RealtimeMediaSource>&&, std::function<void(Function<void()>&&)>&& postTask = { });
    static Ref<MediaStreamTrackPrivate> create(Ref<const Logger>&&, Ref<RealtimeMediaSource>&&, String&& id, std::function<void(Function<void()>&&)>&& postTask = { });

    WEBCORE_EXPORT virtual ~MediaStreamTrackPrivate();

    const String& id() const { return m_id; }
    const String& label() const { return m_label; }

    bool isActive() const { return enabled() && !ended() && !muted(); }

    bool ended() const { return m_isEnded; }

    MediaStreamTrackHintValue contentHint() const { return m_contentHint; }
    void setContentHint(MediaStreamTrackHintValue);
    
    void startProducingData();
    void stopProducingData();
    bool isProducingData() const { return m_isProducingData; }

    void dataFlowStarted();

    bool muted() const { return m_isMuted; }
    void setMuted(bool);
    bool interrupted() const { return m_isInterrupted; }
    bool captureDidFail() const { return m_captureDidFail; }

    void setIsInBackground(bool);

    bool isCaptureTrack() const { return m_isCaptureTrack; }

    bool enabled() const { return m_isEnabled; }
    void setEnabled(bool);

    Ref<MediaStreamTrackPrivate> clone();

    WEBCORE_EXPORT RealtimeMediaSource& source();
    const RealtimeMediaSource& source() const;
    RealtimeMediaSource& sourceForProcessor();
    bool hasSource(const RealtimeMediaSource*) const;

    RealtimeMediaSource::Type type() const { return m_type; }
    CaptureDevice::DeviceType deviceType() const { return m_deviceType; }
    bool isVideo() const { return m_type == RealtimeMediaSource::Type::Video; }
    bool isAudio() const { return m_type == RealtimeMediaSource::Type::Audio; }

    void endTrack();

    void addObserver(MediaStreamTrackPrivateObserver&);
    void removeObserver(MediaStreamTrackPrivateObserver&);
    bool hasObserver(MediaStreamTrackPrivateObserver& observer) const { return m_observers.contains(observer); }

    const RealtimeMediaSourceSettings& settings() const { return m_settings; }
    const RealtimeMediaSourceCapabilities& capabilities() const { return m_capabilities; }

    Ref<RealtimeMediaSource::TakePhotoNativePromise> takePhoto(PhotoSettings&&);
    Ref<RealtimeMediaSource::PhotoCapabilitiesNativePromise> getPhotoCapabilities();
    Ref<RealtimeMediaSource::PhotoSettingsNativePromise> getPhotoSettings();

    void applyConstraints(const MediaConstraints&, RealtimeMediaSource::ApplyConstraintsHandler&&);

#if ENABLE(WEB_AUDIO)
    RefPtr<WebAudioSourceProvider> createAudioSourceProvider();
#endif

    void paintCurrentFrameInContext(GraphicsContext&, const FloatRect&);

    enum class ReadyState { None, Live, Ended };
    ReadyState readyState() const { return m_readyState; }

    void setIdForTesting(String&& id) { m_id = WTFMove(id); }

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final { return m_logger; }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
#endif

    friend class MediaStreamTrackPrivateSourceObserver;
    friend class MediaStreamTrackPrivateSourceObserverSourceProxy;

    void initializeSettings(RealtimeMediaSourceSettings&& settings) { m_settings = WTFMove(settings); }
    void initializeCapabilities(RealtimeMediaSourceCapabilities&& capabilities) { m_capabilities = WTFMove(capabilities); }

    enum class ShouldClone : bool { No, Yes };
    UniqueRef<MediaStreamTrackDataHolder> toDataHolder(ShouldClone = ShouldClone::No);

private:
    MediaStreamTrackPrivate(Ref<const Logger>&&, Ref<RealtimeMediaSource>&&, String&& id, std::function<void(Function<void()>&&)>&&);
    MediaStreamTrackPrivate(Ref<const Logger>&&, UniqueRef<MediaStreamTrackDataHolder>&&, std::function<void(Function<void()>&&)>&&);

    void initialize();

    void sourceStarted();
    void hasStartedProducingData();

    void sourceStopped(bool captureDidFail);
    void sourceMutedChanged(bool interrupted, bool muted);
    void sourceSettingsChanged(RealtimeMediaSourceSettings&&, RealtimeMediaSourceCapabilities&&);
    void sourceConfigurationChanged(String&&, RealtimeMediaSourceSettings&&, RealtimeMediaSourceCapabilities&&);

    void updateReadyState();

    void forEachObserver(const Function<void(MediaStreamTrackPrivateObserver&)>&);

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "MediaStreamTrackPrivate"_s; }
    WTFLogChannel& logChannel() const final;
#endif

#if ASSERT_ENABLED
    bool isOnCreationThread();
#endif

    WeakHashSet<MediaStreamTrackPrivateObserver> m_observers;
    Ref<MediaStreamTrackPrivateSourceObserver> m_sourceObserver;

    String m_id;
    String m_label;
    RealtimeMediaSource::Type m_type;
    CaptureDevice::DeviceType m_deviceType;
    ReadyState m_readyState { ReadyState::None };
    bool m_isCaptureTrack { false };
    bool m_isEnabled { true };
    bool m_isEnded { false };
    bool m_captureDidFail { false };
    bool m_hasStartedProducingData { false };
    MediaStreamTrackHintValue m_contentHint { MediaStreamTrackHintValue::Empty };
    Ref<const Logger> m_logger;
#if !RELEASE_LOG_DISABLED
    const uint64_t m_logIdentifier;
#endif
    bool m_isProducingData { false };
    bool m_isMuted { false };
    bool m_isInterrupted { false };
    RealtimeMediaSourceSettings m_settings;
    RealtimeMediaSourceCapabilities m_capabilities;
#if ASSERT_ENABLED
    uint32_t m_creationThreadId { 0 };
#endif
};

typedef Vector<Ref<MediaStreamTrackPrivate>> MediaStreamTrackPrivateVector;

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)
