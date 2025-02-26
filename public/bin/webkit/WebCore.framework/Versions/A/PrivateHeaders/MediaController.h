/*
 * Copyright (C) 2011 Apple Inc.  All rights reserved.
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

#if ENABLE(VIDEO)

#include "ContextDestructionObserver.h"
#include "Event.h"
#include "EventTarget.h"
#include "MediaControllerInterface.h"
#include "Timer.h"
#include <wtf/Vector.h>

namespace PAL {
class Clock;
}

namespace WebCore {

class HTMLMediaElement;

class MediaController final
    : public RefCounted<MediaController>
    , public MediaControllerInterface
    , public ContextDestructionObserver
    , public EventTarget {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(MediaController);
public:
    static Ref<MediaController> create(ScriptExecutionContext&);
    virtual ~MediaController();

    Ref<TimeRanges> buffered() const final;
    Ref<TimeRanges> seekable() const final;
    Ref<TimeRanges> played() final;

    double duration() const final;
    double currentTime() const final;
    void setCurrentTime(double) final;

    bool paused() const final { return m_paused; }
    void play() final;
    void pause() final;
    void unpause();

    double defaultPlaybackRate() const final { return m_defaultPlaybackRate; }
    void setDefaultPlaybackRate(double) final;
    
    double playbackRate() const final;
    void setPlaybackRate(double) final;

    double volume() const final { return m_volume; }
    ExceptionOr<void> setVolume(double) final;

    bool muted() const final { return m_muted; }
    void setMuted(bool) final;

    const AtomString& playbackState() const;

    using RefCounted::ref;
    using RefCounted::deref;

private:
    explicit MediaController(ScriptExecutionContext&);

    void reportControllerState();
    void updateReadyState();
    void updatePlaybackState();
    void updateMediaElements();
    void bringElementUpToSpeed(HTMLMediaElement&);
    void scheduleEvent(const AtomString& eventName);
    void asyncEventTimerFired();
    void clearPositionTimerFired();
    bool hasEnded() const;
    void scheduleTimeupdateEvent();
    void startTimeupdateTimer();

    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }
    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::MediaController; }
    ScriptExecutionContext* scriptExecutionContext() const final { return ContextDestructionObserver::scriptExecutionContext(); };

    void addMediaElement(HTMLMediaElement&);
    void removeMediaElement(HTMLMediaElement&);

    bool supportsFullscreen(HTMLMediaElementEnums::VideoFullscreenMode) const final { return false; }
    bool isFullscreen() const final { return false; }
    void enterFullscreen() final { }

    bool hasAudio() const final;
    bool hasVideo() const final;
    bool hasClosedCaptions() const final;
    void setClosedCaptionsVisible(bool) final;
    bool closedCaptionsVisible() const final { return m_closedCaptionsVisible; }

    bool supportsScanning() const final;
    void beginScrubbing() final;
    void endScrubbing() final;
    void beginScanning(ScanDirection) final;
    void endScanning() final;

    bool canPlay() const final;
    bool isLiveStream() const final;
    bool hasCurrentSrc() const final;
    bool isBlocked() const;

    void returnToRealtime() final;

    ReadyState readyState() const final { return m_readyState; }

    enum PlaybackState { WAITING, PLAYING, ENDED };

    friend class HTMLMediaElement;
    friend class MediaControllerEventListener;

    Vector<HTMLMediaElement*> m_mediaElements;
    bool m_paused;
    double m_defaultPlaybackRate;
    double m_volume;
    mutable double m_position;
    bool m_muted;
    ReadyState m_readyState;
    PlaybackState m_playbackState;
    Vector<Ref<Event>> m_pendingEvents;
    Timer m_asyncEventTimer;
    mutable Timer m_clearPositionTimer;
    bool m_closedCaptionsVisible;
    std::unique_ptr<PAL::Clock> m_clock;
    Timer m_timeupdateTimer;
    MonotonicTime m_previousTimeupdateTime;
    bool m_resetCurrentTimeInNextPlay { false };
};

} // namespace WebCore

#endif
