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
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace fido {

// HID Packets are defined by the specification at
// https://fidoalliance.org/specs/fido-v2.0-ps-20170927/fido-client-to-authenticator-protocol-v2.0-ps-20170927.html#message-and-packet-structure
// Packets are one of two types, initialization packets and continuation
// packets. HID Packets have header information and a payload. If a
// FidoHidInitPacket cannot store the entire payload, further payload
// information is stored in HidContinuationPackets.
class WEBCORE_EXPORT FidoHidPacket {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FidoHidPacket, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(FidoHidPacket);
public:
    FidoHidPacket(Vector<uint8_t>&& data, uint32_t channelId);
    virtual ~FidoHidPacket() = default;

    virtual Vector<uint8_t> getSerializedData() const = 0;
    const Vector<uint8_t>& getPacketPayload() const { return m_data; }
    uint32_t channelId() const { return m_channelId; }

protected:
    FidoHidPacket();

    Vector<uint8_t> m_data;
    uint32_t m_channelId = kHidBroadcastChannel;
};

// FidoHidInitPacket, based on the CTAP specification consists of a header with
// data that is serialized into a IOBuffer. A channel identifier is allocated by
// the CTAP device to ensure its system-wide uniqueness. Command identifiers
// determine the type of message the packet corresponds to. Payload length
// is the length of the entire message payload, and the data is only the portion
// of the payload that will fit into the HidInitPacket.
class WEBCORE_EXPORT FidoHidInitPacket : public FidoHidPacket {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FidoHidInitPacket, WEBCORE_EXPORT);
public:
    // Creates a packet from the serialized data of an initialization packet. As
    // this is the first packet, the payload length of the entire message will be
    // included within the serialized data. Remaining size will be returned to
    // inform the callee how many additional packets to expect.
    static std::unique_ptr<FidoHidInitPacket> createFromSerializedData(const Vector<uint8_t>&, size_t* remainingSize);

    FidoHidInitPacket(uint32_t channelId, FidoHidDeviceCommand, Vector<uint8_t>&& data, uint16_t payloadLength);

    Vector<uint8_t> getSerializedData() const final;
    FidoHidDeviceCommand command() const { return m_command; }
    uint16_t payloadLength() const { return m_payloadLength; }

private:
    FidoHidDeviceCommand m_command;
    uint16_t m_payloadLength;
};

// FidoHidContinuationPacket, based on the CTAP Specification consists of a
// header with data that is serialized into an IOBuffer. The channel identifier
// will be identical to the identifier in all other packets of the message. The
// packet sequence will be the sequence number of this particular packet, from
// 0x00 to 0x7f.
class WEBCORE_EXPORT FidoHidContinuationPacket : public FidoHidPacket {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(FidoHidContinuationPacket, WEBCORE_EXPORT);
public:
    // Creates a packet from the serialized data of a continuation packet. As an
    // HidInitPacket would have arrived earlier with the total payload size,
    // the remaining size should be passed to inform the packet of how much data
    // to expect.
    static std::unique_ptr<FidoHidContinuationPacket> createFromSerializedData(const Vector<uint8_t>&, size_t* remainingSize);

    FidoHidContinuationPacket(uint32_t channelId, uint8_t sequence, Vector<uint8_t>&& data);

    Vector<uint8_t> getSerializedData() const final;
    uint8_t sequence() const { return m_sequence; }

private:
    uint8_t m_sequence;
};

} // namespace fido

#endif // ENABLE(WEB_AUTHN)
