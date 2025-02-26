/*
 * Copyright (C) 2016 Ericsson AB. All rights reserved.
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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
 * 3. Neither the name of Ericsson nor the names of its contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
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

#if ENABLE(WEB_RTC)

#include "RTCRtpReceiver.h"
#include "RTCRtpSender.h"
#include "RTCRtpTransceiverBackend.h"
#include "RTCRtpTransceiverDirection.h"
#include "ScriptWrappable.h"
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class RTCPeerConnection;
struct RTCRtpCodecCapability;

class RTCRtpTransceiver final : public RefCounted<RTCRtpTransceiver>, public ScriptWrappable {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RTCRtpTransceiver);
public:
    static Ref<RTCRtpTransceiver> create(Ref<RTCRtpSender>&& sender, Ref<RTCRtpReceiver>&& receiver, std::unique_ptr<RTCRtpTransceiverBackend>&& backend) { return adoptRef(*new RTCRtpTransceiver(WTFMove(sender), WTFMove(receiver), WTFMove(backend))); }
    virtual ~RTCRtpTransceiver();

    bool hasSendingDirection() const;
    void enableSendingDirection();
    void disableSendingDirection();

    RTCRtpTransceiverDirection direction() const;
    std::optional<RTCRtpTransceiverDirection> currentDirection() const;
    void setDirection(RTCRtpTransceiverDirection);
    String mid() const;

    RTCRtpSender& sender() { return m_sender.get(); }
    RTCRtpReceiver& receiver() { return m_receiver.get(); }

    bool stopped() const;
    ExceptionOr<void> stop();
    ExceptionOr<void> setCodecPreferences(const Vector<RTCRtpCodecCapability>&);

    RTCRtpTransceiverBackend* backend() { return m_backend.get(); }
    void setConnection(RTCPeerConnection&);

    std::optional<RTCRtpTransceiverDirection> firedDirection() const { return m_firedDirection; }
    void setFiredDirection(std::optional<RTCRtpTransceiverDirection> firedDirection) { m_firedDirection = firedDirection; }

private:
    RTCRtpTransceiver(Ref<RTCRtpSender>&&, Ref<RTCRtpReceiver>&&, std::unique_ptr<RTCRtpTransceiverBackend>&&);

    RTCRtpTransceiverDirection m_direction;
    std::optional<RTCRtpTransceiverDirection> m_firedDirection;

    Ref<RTCRtpSender> m_sender;
    Ref<RTCRtpReceiver> m_receiver;

    bool m_stopped { false };

    std::unique_ptr<RTCRtpTransceiverBackend> m_backend;
    WeakPtr<RTCPeerConnection, WeakPtrImplWithEventTargetData> m_connection;
};

class RtpTransceiverSet {
public:
    const Vector<RefPtr<RTCRtpTransceiver>>& list() const { return m_transceivers; }
    void append(Ref<RTCRtpTransceiver>&&);

    Vector<std::reference_wrapper<RTCRtpSender>> senders() const;
    Vector<std::reference_wrapper<RTCRtpReceiver>> receivers() const;

private:
    Vector<RefPtr<RTCRtpTransceiver>> m_transceivers;
};

} // namespace WebCore

#endif // ENABLE(WEB_RTC)
