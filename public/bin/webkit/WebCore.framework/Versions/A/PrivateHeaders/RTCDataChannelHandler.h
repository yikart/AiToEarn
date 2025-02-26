/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "RTCPriorityType.h"
#include "ScriptExecutionContextIdentifier.h"
#include <wtf/text/WTFString.h>

namespace WebCore {

struct RTCDataChannelInit {
    std::optional<bool> ordered;
    std::optional<unsigned short> maxPacketLifeTime;
    std::optional<unsigned short> maxRetransmits;
    String protocol;
    std::optional<bool> negotiated;
    std::optional<unsigned short> id;
    RTCPriorityType priority { RTCPriorityType::Low };

    RTCDataChannelInit isolatedCopy() const &;
    RTCDataChannelInit isolatedCopy() &&;
};

inline RTCDataChannelInit RTCDataChannelInit::isolatedCopy() const &
{
    auto copy = *this;
    copy.protocol = protocol.isolatedCopy();
    return copy;
}

inline RTCDataChannelInit RTCDataChannelInit::isolatedCopy() &&
{
    auto copy = WTFMove(*this);
    copy.protocol = WTFMove(copy.protocol).isolatedCopy();
    return copy;
}

class RTCDataChannelHandlerClient;

class RTCDataChannelHandler {
public:
    virtual ~RTCDataChannelHandler() = default;

    virtual void setClient(RTCDataChannelHandlerClient&, std::optional<ScriptExecutionContextIdentifier>) = 0;

    virtual bool sendStringData(const CString&) = 0;
    virtual bool sendRawData(std::span<const uint8_t>) = 0;
    virtual void close() = 0;

    virtual std::optional<unsigned short> id() const { return { }; }
};

} // namespace WebCore

#endif // ENABLE(WEB_RTC)
