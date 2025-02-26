// Copyright 2017 The Chromium Authors. All rights reserved.
// Copyright (C) 2018 Apple Inc. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#pragma once

#if ENABLE(WEB_AUTHN)

#include "FidoConstants.h"
#include "FidoHidPacket.h"
#include <wtf/Deque.h>

namespace fido {

// Represents HID message format defined by the specification at
// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#message-and-packet-structure
class WEBCORE_EXPORT FidoHidMessage {
    WTF_MAKE_NONCOPYABLE(FidoHidMessage);
public:
    // Static functions to create CTAP/U2F HID commands.
    static std::optional<FidoHidMessage> create(uint32_t channelId, FidoHidDeviceCommand, const Vector<uint8_t>& data);

    // Reconstruct a message from serialized message data.
    static std::optional<FidoHidMessage> createFromSerializedData(const Vector<uint8_t>&);

    FidoHidMessage(FidoHidMessage&& that) = default;
    FidoHidMessage& operator=(FidoHidMessage&& other) = default;

    bool messageComplete() const;
    Vector<uint8_t> getMessagePayload() const;
    // Pop front of queue with next packet.
    Vector<uint8_t> popNextPacket();
    // Adds a continuation packet to the packet list, from the serialized
    // response value.
    bool addContinuationPacket(const Vector<uint8_t>&);

    size_t numPackets() const;
    uint32_t channelId() const { return m_channelId; }
    FidoHidDeviceCommand cmd() const { return m_cmd; }
    const Deque<std::unique_ptr<FidoHidPacket>>& getPacketsForTesting() const { return m_packets; }

private:
    FidoHidMessage(uint32_t channelId, FidoHidDeviceCommand, const Vector<uint8_t>& data);
    FidoHidMessage(std::unique_ptr<FidoHidInitPacket>, size_t remainingSize);

    uint32_t m_channelId = kHidBroadcastChannel;
    FidoHidDeviceCommand m_cmd = FidoHidDeviceCommand::kMsg;
    Deque<std::unique_ptr<FidoHidPacket>> m_packets;
    size_t m_remainingSize = 0;
};

} // namespace fido

#endif // ENABLE(WEB_AUTHN)
