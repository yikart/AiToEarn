/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(WIRELESS_PLAYBACK_TARGET)

#include "ActiveDOMObject.h"
#include "EventTarget.h"
#include "WebCoreOpaqueRoot.h"
#include <wtf/HashMap.h>
#include <wtf/LoggerHelper.h>
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>

namespace WebCore {

class DeferredPromise;
class HTMLMediaElement;
class MediaPlaybackTarget;
class Node;
class RemotePlaybackAvailabilityCallback;

class RemotePlayback final
    : public RefCounted<RemotePlayback>
    , public ActiveDOMObject
    , public EventTarget
{
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RemotePlayback);
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    static Ref<RemotePlayback> create(HTMLMediaElement&);
    ~RemotePlayback();

    void watchAvailability(Ref<RemotePlaybackAvailabilityCallback>&&, Ref<DeferredPromise>&&);
    void cancelWatchAvailability(std::optional<int32_t> id, Ref<DeferredPromise>&&);
    void prompt(Ref<DeferredPromise>&&);

    bool hasAvailabilityCallbacks() const;
    void availabilityChanged(bool);
    void playbackTargetPickerWasDismissed();
    void shouldPlayToRemoteTargetChanged(bool);
    void isPlayingToRemoteTargetChanged(bool);

    enum class State {
        Connecting,
        Connected,
        Disconnected,
    };
    State state() const { return m_state; }

    void invalidate();

    WebCoreOpaqueRoot opaqueRootConcurrently() const;
    Node* ownerNode() const;

private:
    explicit RemotePlayback(HTMLMediaElement&);

    void setState(State);
    void establishConnection();
    void disconnect();

    // EventTarget.
    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::RemotePlayback; }
    ScriptExecutionContext* scriptExecutionContext() const final { return ActiveDOMObject::scriptExecutionContext(); }
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }

    // ActiveDOMObject
    void stop() final;

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const { return m_logger.get(); }
    uint64_t logIdentifier() const { return m_logIdentifier; }
    WTFLogChannel& logChannel() const;
    ASCIILiteral logClassName() const { return "RemotePlayback"_s; }

    Ref<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
#endif

    WeakPtr<HTMLMediaElement> m_mediaElement;
    uint32_t m_nextId { 0 };

    using CallbackMap = HashMap<int32_t, Ref<RemotePlaybackAvailabilityCallback>>;
    CallbackMap m_callbackMap;

    using PromiseVector = Vector<Ref<DeferredPromise>>;
    PromiseVector m_availabilityPromises;
    PromiseVector m_cancelAvailabilityPromises;
    PromiseVector m_promptPromises;
    State m_state { State::Disconnected };
    bool m_available { false };
};

}

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET)

