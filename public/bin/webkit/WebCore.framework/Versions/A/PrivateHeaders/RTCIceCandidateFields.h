/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "RTCIceCandidateType.h"
#include "RTCIceComponent.h"
#include "RTCIceProtocol.h"
#include "RTCIceTcpCandidateType.h"
#include <optional>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct RTCIceCandidateFields {
    String foundation;
    std::optional<RTCIceComponent> component;
    std::optional<unsigned> priority;
    String address;
    std::optional<RTCIceProtocol> protocol;
    std::optional<unsigned short> port;
    std::optional<RTCIceCandidateType> type;
    std::optional<RTCIceTcpCandidateType> tcpType;
    String relatedAddress;
    std::optional<unsigned short> relatedPort;
    String usernameFragment;

    RTCIceCandidateFields isolatedCopy() && { return { WTFMove(foundation).isolatedCopy(), component, priority, WTFMove(address).isolatedCopy(), protocol, port, type, tcpType, WTFMove(relatedAddress).isolatedCopy(), relatedPort, WTFMove(usernameFragment).isolatedCopy() }; }
};

std::optional<RTCIceCandidateFields> parseIceCandidateSDP(const String&);

} // namespace WebCore
