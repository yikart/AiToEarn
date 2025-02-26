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

#include "Exception.h"
#include "MediaPositionState.h"
#include "MediaSessionCoordinatorState.h"
#include "MediaSessionPlaybackState.h"
#include "MediaSessionReadyState.h"
#include <wtf/MonotonicTime.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class MediaSessionCoordinatorClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::MediaSessionCoordinatorClient> : std::true_type { };
}

namespace WTF {
class Logger;
}

namespace WebCore {

class MediaSessionCoordinatorClient : public CanMakeWeakPtr<MediaSessionCoordinatorClient> {
public:
    virtual ~MediaSessionCoordinatorClient() = default;

    virtual void seekSessionToTime(double, CompletionHandler<void(bool)>&&) = 0;
    virtual void playSession(std::optional<double> atTime, std::optional<MonotonicTime> hostTime, CompletionHandler<void(bool)>&&) = 0;
    virtual void pauseSession(CompletionHandler<void(bool)>&&) = 0;
    virtual void setSessionTrack(const String&, CompletionHandler<void(bool)>&&) = 0;
    virtual void coordinatorStateChanged(WebCore::MediaSessionCoordinatorState) = 0;
};

class MediaSessionCoordinatorPrivate : public RefCounted<MediaSessionCoordinatorPrivate> {
public:
    virtual ~MediaSessionCoordinatorPrivate() = default;

    virtual String identifier() const = 0;

    virtual void join(CompletionHandler<void(std::optional<Exception>&&)>&&) = 0;
    virtual void leave() = 0;

    virtual void seekTo(double, CompletionHandler<void(std::optional<Exception>&&)>&&) = 0;
    virtual void play(CompletionHandler<void(std::optional<Exception>&&)>&&) = 0;
    virtual void pause(CompletionHandler<void(std::optional<Exception>&&)>&&) = 0;
    virtual void setTrack(const String&, CompletionHandler<void(std::optional<Exception>&&)>&&) = 0;

    virtual void positionStateChanged(const std::optional<MediaPositionState>&) = 0;
    virtual void readyStateChanged(MediaSessionReadyState) = 0;
    virtual void playbackStateChanged(MediaSessionPlaybackState) = 0;
    virtual void trackIdentifierChanged(const String&) = 0;

    void setLogger(const Logger&, uint64_t);
    virtual void setClient(WeakPtr<MediaSessionCoordinatorClient> client) { m_client = client;}

protected:
    explicit MediaSessionCoordinatorPrivate() = default;

    const Logger* loggerPtr() const { return m_logger.get(); }
    uint64_t logIdentifier() const { return m_logIdentifier; }

    WeakPtr<MediaSessionCoordinatorClient> client() const { return m_client; }

private:
    RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
    WeakPtr<MediaSessionCoordinatorClient> m_client;
};

}

#endif // ENABLE(MEDIA_SESSION_COORDINATOR)
