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

#include <wtf/Noncopyable.h>
#include <wtf/Vector.h>

namespace apdu {

// APDU commands are defined as part of ISO 7816-4. Commands can be serialized
// into either short length encodings, where the maximum data length is 256
// bytes, or an extended length encoding, where the maximum data length is 65536
// bytes. This class implements only the extended length encoding. Serialized
// commands consist of a CLA byte, denoting the class of instruction, an INS
// byte, denoting the instruction code, P1 and P2, each one byte denoting
// instruction parameters, a length field (Lc), a data field of length Lc, and
// a maximum expected response length (Le).
class WEBCORE_EXPORT ApduCommand {
    WTF_MAKE_NONCOPYABLE(ApduCommand);
public:
    // Constructs an APDU command from the serialized message data.
    static std::optional<ApduCommand> createFromMessage(const Vector<uint8_t>&);

    ApduCommand() = default;
    ApduCommand(
        uint8_t cla,
        uint8_t ins,
        uint8_t p1,
        uint8_t p2,
        size_t responseLength,
        Vector<uint8_t>&& data);
    ApduCommand(ApduCommand&&) = default;
    ApduCommand& operator=(ApduCommand&&) = default;

    // Returns serialized message data.
    Vector<uint8_t> getEncodedCommand() const;

    void setCla(uint8_t cla) { m_cla = cla; }
    void setIns(uint8_t ins) { m_ins = ins; }
    void setP1(uint8_t p1) { m_p1 = p1; }
    void setP2(uint8_t p2) { m_p2 = p2; }
    void setData(Vector<uint8_t>&& data) { m_data = WTFMove(data); }
    void setResponseLength(size_t responseLength) { m_responseLength = responseLength; }

    uint8_t cla() const { return m_cla; }
    uint8_t ins() const { return m_ins; }
    uint8_t p1() const { return m_p1; }
    uint8_t p2() const { return m_p2; }
    size_t responseLength() const { return m_responseLength; }
    const Vector<uint8_t>& data() const { return m_data; }

    static constexpr size_t kApduMaxResponseLength = 65536;

    static constexpr size_t kApduMinHeader = 4;
    static constexpr size_t kApduMaxHeader = 7;
    static constexpr size_t kApduCommandDataOffset = 7;
    static constexpr size_t kApduCommandLengthOffset = 5;

    // As defined in ISO7816-4, extended length APDU request data is limited to
    // 16 bits in length with a maximum value of 65535. Response data length is
    // also limited to 16 bits in length with a value of 0x0000 corresponding to
    // a length of 65536.
    static constexpr size_t kApduMaxDataLength = 65535;
    static constexpr size_t kApduMaxLength = kApduMaxDataLength + kApduMaxHeader + 2;

private:
    uint8_t m_cla { 0 };
    uint8_t m_ins { 0 };
    uint8_t m_p1 { 0 };
    uint8_t m_p2 { 0 };
    size_t m_responseLength { 0 };
    Vector<uint8_t> m_data;
};

} // namespace apdu

#endif // ENABLE(WEB_AUTHN)
