/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_SESSION_COORDINATOR)

#include "ActiveDOMObject.h"
#include "EventTarget.h"
#include "MediaSession.h"
#include "MediaSessionCoordinatorPrivate.h"
#include "MediaSessionCoordinatorState.h"
#include <wtf/Logger.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

template<typename> class DOMPromiseDeferred;

class MediaSessionCoordinator
    : public RefCounted<MediaSessionCoordinator>
    , public MediaSessionCoordinatorClient
    , public MediaSessionObserver
    , public ActiveDOMObject
    , public EventTarget  {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(MediaSessionCoordinator, WEBCORE_EXPORT);
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    WEBCORE_EXPORT static Ref<MediaSessionCoordinator> create(ScriptExecutionContext*);
    WEBCORE_EXPORT ~MediaSessionCoordinator();
    WEBCORE_EXPORT void setMediaSessionCoordinatorPrivate(Ref<MediaSessionCoordinatorPrivate>&&);

    void join(DOMPromiseDeferred<void>&&);
    ExceptionOr<void> leave();
    void close();

    String identifier() const { return m_privateCoordinator ? m_privateCoordinator->identifier() : String(); }
    MediaSessionCoordinatorState state() const { return m_state; }

    void seekTo(double, DOMPromiseDeferred<void>&&);
    void play(DOMPromiseDeferred<void>&&);
    void pause(DOMPromiseDeferred<void>&&);
    void setTrack(const String&, DOMPromiseDeferred<void>&&);

    void setMediaSession(MediaSession*);

    USING_CAN_MAKE_WEAKPTR(MediaSessionCoordinatorClient);

    struct PlaySessionCommand {
        std::optional<double> atTime;
        std::optional<MonotonicTime> hostTime;
    };
    std::optional<PlaySessionCommand> takeCurrentPlaySessionCommand() { return WTFMove(m_currentPlaySessionCommand); }

private:
    MediaSessionCoordinator(ScriptExecutionContext*);

    // EventTarget
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }
    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::MediaSessionCoordinator; }
    ScriptExecutionContext* scriptExecutionContext() const final { return ContextDestructionObserver::scriptExecutionContext(); }
    void eventListenersDidChange() final;

    // ActiveDOMObject.
    bool virtualHasPendingActivity() const final;

    // MediaSessionObserver
    void metadataChanged(const RefPtr<MediaMetadata>&) final;
    void positionStateChanged(const std::optional<MediaPositionState>&) final;
    void playbackStateChanged(MediaSessionPlaybackState) final;
    void readyStateChanged(MediaSessionReadyState) final;

    // MediaSessionCoordinatorClient
    void seekSessionToTime(double, CompletionHandler<void(bool)>&&) final;
    void playSession(std::optional<double> atTime, std::optional<MonotonicTime> hostTime, CompletionHandler<void(bool)>&&) final;
    void pauseSession(CompletionHandler<void(bool)>&&) final;
    void setSessionTrack(const String&, CompletionHandler<void(bool)>&&) final;
    void coordinatorStateChanged(WebCore::MediaSessionCoordinatorState) final;

    bool currentPositionApproximatelyEqualTo(double) const;

    const Logger& logger() const { return m_logger; }
    uint64_t logIdentifier() const { return m_logIdentifier; }
    static WTFLogChannel& logChannel();
    static ASCIILiteral logClassName() { return "MediaSessionCoordinator"_s; }
    bool shouldFireEvents() const;

    WeakPtr<MediaSession> m_session;
    RefPtr<MediaSessionCoordinatorPrivate> m_privateCoordinator;
    const Ref<const Logger> m_logger;
    const uint64_t m_logIdentifier;
    MediaSessionCoordinatorState m_state { MediaSessionCoordinatorState::Closed };
    bool m_hasCoordinatorsStateChangeEventListener { false };
    std::optional<PlaySessionCommand> m_currentPlaySessionCommand;
};

}

#endif // ENABLE(MEDIA_SESSION_COORDINATOR)
