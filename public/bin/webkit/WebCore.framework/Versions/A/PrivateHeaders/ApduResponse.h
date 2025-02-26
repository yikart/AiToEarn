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

// APDU responses are defined as part of ISO 7816-4. Serialized responses
// consist of a data field of varying length, up to a maximum 65536, and a
// two byte status field.
class WEBCORE_EXPORT ApduResponse {
    WTF_MAKE_NONCOPYABLE(ApduResponse);
public:
    // Status bytes are specified in ISO 7816-4.
    enum class Status : uint16_t {
        SW_NO_ERROR = 0x9000,
        SW_CONDITIONS_NOT_SATISFIED = 0x6985,
        SW_WRONG_DATA = 0x6A80,
        SW_WRONG_LENGTH = 0x6700,
        SW_INS_NOT_SUPPORTED = 0x6D00,
    };

    // Create a APDU response from the serialized message.
    static std::optional<ApduResponse> createFromMessage(const Vector<uint8_t>& data);

    ApduResponse(Vector<uint8_t>&& data, Status);
    ApduResponse(ApduResponse&& that) = default;
    ApduResponse& operator=(ApduResponse&& that) = default;

    Vector<uint8_t> getEncodedResponse() const;

    const Vector<uint8_t>& data() const { return m_data; }
    Vector<uint8_t>& data() { return m_data; }
    Status status() const { return m_responseStatus; }

private:
    Vector<uint8_t> m_data;
    Status m_responseStatus;
};

} // namespace apdu

#endif // ENABLE(WEB_AUTHN)
