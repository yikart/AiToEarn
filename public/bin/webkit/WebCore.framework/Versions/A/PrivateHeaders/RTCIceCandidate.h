/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
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
 * 3. Neither the name of Google Inc. nor the names of its contributors
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

#include "ExceptionOr.h"
#include "RTCIceCandidateFields.h"
#include "ScriptWrappable.h"

namespace WebCore {

struct RTCIceCandidateInit;

class RTCIceCandidate final : public RefCounted<RTCIceCandidate>, public ScriptWrappable {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RTCIceCandidate);
public:
    using Fields = RTCIceCandidateFields;

    static ExceptionOr<Ref<RTCIceCandidate>> create(const RTCIceCandidateInit&);
    static Ref<RTCIceCandidate> create(const String& candidate, const String& sdpMid, std::optional<unsigned short> sdpMLineIndex);
    static Ref<RTCIceCandidate> create(const String& candidate, const String& sdpMid, Fields&& fields) { return adoptRef(*new RTCIceCandidate(candidate, sdpMid, { }, WTFMove(fields))); }

    const String& candidate() const { return m_candidate; }
    const String& sdpMid() const { return m_sdpMid; }
    std::optional<unsigned short> sdpMLineIndex() const { return m_sdpMLineIndex; }

    String foundation() const { return m_fields.foundation; }
    std::optional<RTCIceComponent> component() const { return m_fields.component; }
    std::optional<unsigned> priority() const { return m_fields.priority; }
    String address() const { return m_fields.address; }
    std::optional<RTCIceProtocol> protocol() const { return m_fields.protocol; }
    std::optional<unsigned short> port() const { return m_fields.port; }
    std::optional<RTCIceCandidateType> type() const { return m_fields.type; }
    std::optional<RTCIceTcpCandidateType> tcpType() const { return m_fields.tcpType; }
    String relatedAddress() const { return m_fields.relatedAddress; }
    std::optional<unsigned short> relatedPort() const { return m_fields.relatedPort; }

    String usernameFragment() const { return m_fields.usernameFragment; }
    RTCIceCandidateInit toJSON() const;

private:
    RTCIceCandidate(const String& candidate, const String& sdpMid, std::optional<unsigned short> sdpMLineIndex, Fields&&);

    String m_candidate;
    String m_sdpMid;
    std::optional<unsigned short> m_sdpMLineIndex;
    Fields m_fields;
};

} // namespace WebCore

#endif // ENABLE(WEB_RTC)
