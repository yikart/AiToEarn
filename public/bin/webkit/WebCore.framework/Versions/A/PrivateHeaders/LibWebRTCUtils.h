/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_RTC) && USE(LIBWEBRTC)

#include "ExceptionCode.h"
#include "RTCIceCandidateFields.h"
#include <webrtc/api/media_types.h>
#include <wtf/text/WTFString.h>

namespace cricket {
class Candidate;
}

namespace webrtc {
struct RtpParameters;
struct RtpTransceiverInit;

class RTCError;

enum class DtlsTransportState;
enum class Priority;
class PriorityValue;
enum class RTCErrorType;
enum class RtpTransceiverDirection;
}

namespace WebCore {

class Exception;
class RTCError;

struct RTCRtpParameters;
struct RTCRtpSendParameters;
struct RTCRtpTransceiverInit;

enum class RTCPriorityType : uint8_t;
enum class RTCRtpTransceiverDirection;

RTCRtpParameters toRTCRtpParameters(const webrtc::RtpParameters&);
void updateRTCRtpSendParameters(const RTCRtpSendParameters&, webrtc::RtpParameters&);
RTCRtpSendParameters toRTCRtpSendParameters(const webrtc::RtpParameters&);
webrtc::RtpParameters fromRTCRtpSendParameters(const RTCRtpSendParameters&, const webrtc::RtpParameters& currentParameters);

RTCRtpTransceiverDirection toRTCRtpTransceiverDirection(webrtc::RtpTransceiverDirection);
webrtc::RtpTransceiverDirection fromRTCRtpTransceiverDirection(RTCRtpTransceiverDirection);
webrtc::RtpTransceiverInit fromRtpTransceiverInit(const RTCRtpTransceiverInit&, cricket::MediaType);

ExceptionCode toExceptionCode(webrtc::RTCErrorType);
Exception toException(const webrtc::RTCError&);
RefPtr<RTCError> toRTCError(const webrtc::RTCError&);

RTCPriorityType toRTCPriorityType(webrtc::PriorityValue);
RTCPriorityType toRTCPriorityType(webrtc::Priority);
webrtc::Priority fromRTCPriorityType(RTCPriorityType);

inline String fromStdString(const std::string& value)
{
    return String::fromUTF8(value);
}

RTCIceCandidateFields convertIceCandidate(const cricket::Candidate&);

} // namespace WebCore

#endif // ENABLE(WEB_RTC) && USE(LIBWEBRTC)
