/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_SESSION)

#include "ActiveDOMObject.h"
#include "ExceptionOr.h"
#include "MediaPositionState.h"
#include "MediaProducer.h"
#include "MediaSessionAction.h"
#include "MediaSessionActionHandler.h"
#include "MediaSessionPlaybackState.h"
#include "MediaSessionReadyState.h"
#include <wtf/Logger.h>
#include <wtf/MonotonicTime.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/WeakHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class MediaSessionObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::MediaSessionObserver> : std::true_type { };
}

namespace WebCore {

class Document;
class HTMLMediaElement;
class MediaMetadata;
class MediaSessionCoordinator;
class MediaSessionCoordinatorPrivate;
class Navigator;
template<typename> class DOMPromiseDeferred;
struct NowPlayingInfo;

class MediaSessionObserver : public CanMakeWeakPtr<MediaSessionObserver> {
public:
    virtual ~MediaSessionObserver() = default;

    virtual void metadataChanged(const RefPtr<MediaMetadata>&) { }
    virtual void positionStateChanged(const std::optional<MediaPositionState>&) { }
    virtual void playbackStateChanged(MediaSessionPlaybackState) { }
    virtual void actionHandlersChanged() { }

#if ENABLE(MEDIA_SESSION_COORDINATOR)
    virtual void readyStateChanged(MediaSessionReadyState) { }
#endif
};

class MediaSession : public RefCountedAndCanMakeWeakPtr<MediaSession>, public ActiveDOMObject {
    WTF_MAKE_TZONE_ALLOCATED(MediaSession);
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    static Ref<MediaSession> create(Navigator&);
    ~MediaSession();

    MediaMetadata* metadata() const { return m_metadata.get(); };
    void setMetadata(RefPtr<MediaMetadata>&&);
    void metadataUpdated(const MediaMetadata&);

    MediaSessionPlaybackState playbackState() const { return m_playbackState; };
    void setPlaybackState(MediaSessionPlaybackState);

    ExceptionOr<void> setActionHandler(MediaSessionAction, RefPtr<MediaSessionActionHandler>&&);

    void callActionHandler(const MediaSessionActionDetails&, DOMPromiseDeferred<void>&&);

    template <typename Visitor> void visitActionHandlers(Visitor&) const;

    ExceptionOr<void> setPositionState(std::optional<MediaPositionState>&&);
    std::optional<MediaPositionState> positionState() const { return m_positionState; }

    WEBCORE_EXPORT std::optional<double> currentPosition() const;
    void willBeginPlayback();
    void willPausePlayback();

    Document* document() const;
    
#if ENABLE(MEDIA_SESSION_COORDINATOR)
    MediaSessionReadyState readyState() const { return m_readyState; };
    void setReadyState(MediaSessionReadyState);

    MediaSessionCoordinator& coordinator() const { return m_coordinator.get(); }
#endif

#if ENABLE(MEDIA_SESSION_PLAYLIST)
    const Vector<Ref<MediaMetadata>>& playlist() const { return m_playlist; }
    ExceptionOr<void> setPlaylist(ScriptExecutionContext&, Vector<Ref<MediaMetadata>>&&);
#endif

    bool hasActiveActionHandlers() const;

    enum class TriggerGestureIndicator {
        No,
        Yes,
    };
    WEBCORE_EXPORT bool callActionHandler(const MediaSessionActionDetails&, TriggerGestureIndicator = TriggerGestureIndicator::Yes);

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const { return *m_logger.get(); }
#endif

    bool hasObserver(MediaSessionObserver&) const;
    void addObserver(MediaSessionObserver&);
    void removeObserver(MediaSessionObserver&);

    RefPtr<HTMLMediaElement> activeMediaElement() const;

    void updateNowPlayingInfo(NowPlayingInfo&);

#if ENABLE(MEDIA_STREAM)
    void setMicrophoneActive(bool isActive, DOMPromiseDeferred<void>&& promise) { updateCaptureState(isActive, WTFMove(promise), MediaProducerMediaCaptureKind::Microphone); }
    void setCameraActive(bool isActive, DOMPromiseDeferred<void>&& promise) { updateCaptureState(isActive, WTFMove(promise), MediaProducerMediaCaptureKind::Camera); }
    void setScreenshareActive(bool isActive, DOMPromiseDeferred<void>&& promise) { updateCaptureState(isActive, WTFMove(promise), MediaProducerMediaCaptureKind::Display); }
#endif

private:
    explicit MediaSession(Navigator&);

    uint64_t logIdentifier() const { return m_logIdentifier; }

    void updateReportedPosition();

    void forEachObserver(const Function<void(MediaSessionObserver&)>&);
    void notifyMetadataObservers(const RefPtr<MediaMetadata>&);
    void notifyPositionStateObservers();
    void notifyPlaybackStateObservers();
    void notifyActionHandlerObservers();
    void notifyReadyStateObservers();

#if ENABLE(MEDIA_STREAM)
    void updateCaptureState(bool, DOMPromiseDeferred<void>&&, MediaProducerMediaCaptureKind);
#endif

    // ActiveDOMObject.
    void suspend(ReasonForSuspension) final;
    void stop() final;
    bool virtualHasPendingActivity() const final;

    WeakPtr<Navigator> m_navigator;
    RefPtr<MediaMetadata> m_metadata;
    RefPtr<MediaMetadata> m_defaultMetadata;
    MediaSessionPlaybackState m_playbackState { MediaSessionPlaybackState::None };
    std::optional<MediaPositionState> m_positionState;
    std::optional<double> m_lastReportedPosition;
    MonotonicTime m_timeAtLastPositionUpdate;
    HashMap<MediaSessionAction, RefPtr<MediaSessionActionHandler>, IntHash<MediaSessionAction>, WTF::StrongEnumHashTraits<MediaSessionAction>> m_actionHandlers WTF_GUARDED_BY_LOCK(m_actionHandlersLock);
    RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };

    WeakHashSet<MediaSessionObserver> m_observers;

#if ENABLE(MEDIA_SESSION_COORDINATOR)
    MediaSessionReadyState m_readyState { MediaSessionReadyState::Havenothing };
    const Ref<MediaSessionCoordinator> m_coordinator;
#endif

#if ENABLE(MEDIA_SESSION_PLAYLIST)
    Vector<Ref<MediaMetadata>> m_playlist;
#endif
    mutable Lock m_actionHandlersLock;
    mutable bool m_defaultArtworkAttempted { false };
};

String convertEnumerationToString(MediaSessionPlaybackState);
String convertEnumerationToString(MediaSessionAction);

inline bool MediaSession::hasActiveActionHandlers() const
{
    Locker lock { m_actionHandlersLock };
    return !m_actionHandlers.isEmpty();
}

template <typename Visitor>
void MediaSession::visitActionHandlers(Visitor& visitor) const
{
    Locker lock { m_actionHandlersLock };
    for (auto& actionHandler : m_actionHandlers) {
        if (actionHandler.value)
            actionHandler.value->visitJSFunction(visitor);
    }
}

}

namespace WTF {

template<> struct LogArgument<WebCore::MediaSessionPlaybackState> {
    static String toString(WebCore::MediaSessionPlaybackState state) { return convertEnumerationToString(state); }
};

template<> struct LogArgument<WebCore::MediaSessionAction> {
    static String toString(WebCore::MediaSessionAction action) { return convertEnumerationToString(action); }
};

}

#endif // ENABLE(MEDIA_SESSION)
