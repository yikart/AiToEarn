/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_RTC)

#include "DOMException.h"
#include "RTCErrorDetailType.h"
#include <optional>
#include <wtf/text/WTFString.h>

namespace WebCore {

class RTCError final : public DOMException {
public:
    struct Init {
        RTCErrorDetailType errorDetail;
        std::optional<int> sdpLineNumber;
        std::optional<int> sctpCauseCode;
        std::optional<unsigned> receivedAlert;
        std::optional<unsigned> sentAlert;
    };

    static Ref<RTCError> create(const Init& init, String&& message) { return adoptRef(*new RTCError(init, WTFMove(message))); }
    static Ref<RTCError> create(RTCErrorDetailType type, String&& message) { return create({ type, { }, { }, { }, { } }, WTFMove(message)); }

    RTCErrorDetailType errorDetail() const { return m_values.errorDetail; }
    std::optional<int> sdpLineNumber() const  { return m_values.sdpLineNumber; }
    std::optional<int> sctpCauseCode() const  { return m_values.sctpCauseCode; }
    std::optional<unsigned> receivedAlert() const  { return m_values.receivedAlert; }
    std::optional<unsigned> sentAlert() const  { return m_values.sentAlert; }

private:
    WEBCORE_EXPORT RTCError(const Init&, String&&);

    Init m_values;
};

} // namespace WebCore

#endif // ENABLE(WEB_RTC)
