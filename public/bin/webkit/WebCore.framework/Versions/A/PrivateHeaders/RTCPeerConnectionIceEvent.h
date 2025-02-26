/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(WEB_RTC)

#include "Event.h"
#include <wtf/text/AtomString.h>

namespace WebCore {
class RTCIceCandidate;

class RTCPeerConnectionIceEvent final : public Event {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(RTCPeerConnectionIceEvent);
public:
    virtual ~RTCPeerConnectionIceEvent();

    struct Init : EventInit {
        RefPtr<RTCIceCandidate> candidate;
        String url;
    };

    static Ref<RTCPeerConnectionIceEvent> create(const AtomString& type, Init&&);
    static Ref<RTCPeerConnectionIceEvent> create(CanBubble, IsCancelable, RefPtr<RTCIceCandidate>&&, String&& serverURL);

    RTCIceCandidate* candidate() const;
    const String& url() const { return m_url; }

private:
    RTCPeerConnectionIceEvent(const AtomString& type, CanBubble, IsCancelable, RefPtr<RTCIceCandidate>&&, String&& serverURL);

    RefPtr<RTCIceCandidate> m_candidate;
    String m_url;
};

} // namespace WebCore

#endif // ENABLE(WEB_RTC)
