/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "MDNSRegisterError.h"
#include "MediaCapabilitiesInfo.h"
#include "RTCDataChannelRemoteHandlerConnection.h"
#include "RTCRtpCapabilities.h"
#include "ScriptExecutionContextIdentifier.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Expected.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class ContentType;
struct VideoConfiguration;
struct MediaCapabilitiesDecodingInfo;
struct MediaCapabilitiesEncodingInfo;
struct MediaDecodingConfiguration;
struct MediaEncodingConfiguration;

class WEBCORE_EXPORT WebRTCProvider {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WebRTCProvider, WEBCORE_EXPORT);
public:
    static UniqueRef<WebRTCProvider> create();
    WebRTCProvider() = default;
    virtual ~WebRTCProvider() = default;

    static bool webRTCAvailable();
    static void setH264HardwareEncoderAllowed(bool);

    virtual RefPtr<RTCDataChannelRemoteHandlerConnection> createRTCDataChannelRemoteHandlerConnection();

    using DecodingConfigurationCallback = Function<void(MediaCapabilitiesDecodingInfo&&)>;
    using EncodingConfigurationCallback = Function<void(MediaCapabilitiesEncodingInfo&&)>;
    void createDecodingConfiguration(MediaDecodingConfiguration&&, DecodingConfigurationCallback&&);
    void createEncodingConfiguration(MediaEncodingConfiguration&&, EncodingConfigurationCallback&&);

    void setAV1Support(bool);
    void setH265Support(bool);
    void setVP9Support(bool supportsVP9Profile0, bool supportsVP9Profile2);
    bool isSupportingAV1() const;
    bool isSupportingH265() const;
    bool isSupportingVP9Profile0() const;
    bool isSupportingVP9Profile2() const;

    bool isSupportingMDNS() const;

#if ENABLE(WEB_RTC)
    virtual std::optional<RTCRtpCapabilities> receiverCapabilities(const String&);
    virtual std::optional<RTCRtpCapabilities> senderCapabilities(const String&);
#endif

    virtual void setLoggingLevel(WTFLogLevel);
    virtual void clearFactory();

    void setPortAllocatorRange(StringView);
    std::optional<std::pair<int, int>> portAllocatorRange() const;

protected:
#if ENABLE(WEB_RTC)
    std::optional<RTCRtpCapabilities>& audioDecodingCapabilities();
    std::optional<RTCRtpCapabilities>& videoDecodingCapabilities();
    std::optional<RTCRtpCapabilities>& audioEncodingCapabilities();
    std::optional<RTCRtpCapabilities>& videoEncodingCapabilities();

    std::optional<RTCRtpCodecCapability> codecCapability(const ContentType&, const std::optional<RTCRtpCapabilities>&);

    std::optional<RTCRtpCapabilities> m_audioDecodingCapabilities;
    std::optional<RTCRtpCapabilities> m_videoDecodingCapabilities;
    std::optional<RTCRtpCapabilities> m_audioEncodingCapabilities;
    std::optional<RTCRtpCapabilities> m_videoEncodingCapabilities;
#endif

    virtual std::optional<MediaCapabilitiesInfo> computeVPParameters(const VideoConfiguration&);
    virtual bool isVPSoftwareDecoderSmooth(const VideoConfiguration&);
    virtual bool isVPXEncoderSmooth(const VideoConfiguration&);
    virtual bool isH264EncoderSmooth(const VideoConfiguration&);

    bool m_supportsAV1 { false };
    bool m_supportsH265 { false };
    bool m_supportsVP9Profile0 { false };
    bool m_supportsVP9Profile2 { false };
    bool m_supportsMDNS { false };

    std::optional<std::pair<int, int>> m_portAllocatorRange;

private:
    virtual void initializeAudioDecodingCapabilities();
    virtual void initializeVideoDecodingCapabilities();
    virtual void initializeAudioEncodingCapabilities();
    virtual void initializeVideoEncodingCapabilities();

    virtual std::optional<MediaCapabilitiesDecodingInfo> videoDecodingCapabilitiesOverride(const VideoConfiguration&);
    virtual std::optional<MediaCapabilitiesEncodingInfo> videoEncodingCapabilitiesOverride(const VideoConfiguration&);
};

} // namespace WebCore
