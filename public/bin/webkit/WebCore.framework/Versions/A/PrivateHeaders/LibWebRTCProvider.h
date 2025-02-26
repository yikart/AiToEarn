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

#if USE(LIBWEBRTC)

#include "LibWebRTCMacros.h"
#include "ScriptExecutionContextIdentifier.h"
#include "WebRTCProvider.h"
#include <wtf/Compiler.h>
#include <wtf/TZoneMalloc.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN
ALLOW_UNUSED_PARAMETERS_BEGIN
ALLOW_DEPRECATED_DECLARATIONS_BEGIN
ALLOW_COMMA_BEGIN

// See Bug 274508: Disable thread-safety-reference-return warnings in libwebrtc
IGNORE_CLANG_WARNINGS_BEGIN("thread-safety-reference-return")
#include <webrtc/api/peer_connection_interface.h>
IGNORE_CLANG_WARNINGS_END
#include <webrtc/api/scoped_refptr.h>
#include <webrtc/api/video_codecs/video_decoder_factory.h>
#include <webrtc/api/video_codecs/video_encoder_factory.h>

ALLOW_COMMA_END
ALLOW_DEPRECATED_DECLARATIONS_END
ALLOW_UNUSED_PARAMETERS_END
WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

namespace rtc {
class NetworkManager;
class PacketSocketFactory;
class Thread;
class RTCCertificateGenerator;
}

namespace webrtc {
class AsyncDnsResolverFactory;
class PeerConnectionFactoryInterface;
}

namespace WebCore {

class LibWebRTCAudioModule;
class RegistrableDomain;
struct PeerConnectionFactoryAndThreads;

class WEBCORE_EXPORT LibWebRTCProvider : public WebRTCProvider {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(LibWebRTCProvider, WEBCORE_EXPORT);
public:
    static UniqueRef<LibWebRTCProvider> create();

    virtual ~LibWebRTCProvider();

    static void setRTCLogging(WTFLogLevel);

    virtual void setEnableWebRTCEncryption(bool);
    virtual void disableNonLocalhostConnections();

    std::optional<RTCRtpCapabilities> receiverCapabilities(const String& kind) final;
    std::optional<RTCRtpCapabilities> senderCapabilities(const String& kind) final;
    void clearFactory() final;

    virtual rtc::scoped_refptr<webrtc::PeerConnectionInterface> createPeerConnection(ScriptExecutionContextIdentifier, webrtc::PeerConnectionObserver&, rtc::PacketSocketFactory*, webrtc::PeerConnectionInterface::RTCConfiguration&&);

    webrtc::PeerConnectionFactoryInterface* factory();
    LibWebRTCAudioModule* audioModule();

    // FIXME: Make these methods not static.
    static void callOnWebRTCNetworkThread(Function<void()>&&);
    static void callOnWebRTCSignalingThread(Function<void()>&&);
    static bool hasWebRTCThreads();
    static rtc::Thread& signalingThread();

    // Used for mock testing
    void setPeerConnectionFactory(rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface>&&);

    // Callback is executed on a background thread.
    void prepareCertificateGenerator(Function<void(rtc::RTCCertificateGenerator&)>&&);

    virtual void setLoggingLevel(WTFLogLevel);

    WEBCORE_EXPORT virtual void setVP9HardwareSupportForTesting(std::optional<bool> value) { m_supportsVP9VTBForTesting = value; }
    virtual bool isSupportingVP9HardwareDecoder() const { return m_supportsVP9VTBForTesting.value_or(false); }

    WEBCORE_EXPORT void disableEnumeratingAllNetworkInterfaces();
    WEBCORE_EXPORT void enableEnumeratingAllNetworkInterfaces();
    bool isEnumeratingAllNetworkInterfacesEnabled() const;
    WEBCORE_EXPORT void enableEnumeratingVisibleNetworkInterfaces();
    bool isEnumeratingVisibleNetworkInterfacesEnabled() const { return m_enableEnumeratingVisibleNetworkInterfaces; }

    class SuspendableSocketFactory : public rtc::PacketSocketFactory {
    public:
        virtual ~SuspendableSocketFactory() = default;
        virtual void suspend() { };
        virtual void resume() { };
        virtual void disableRelay() { };
    };
    virtual std::unique_ptr<SuspendableSocketFactory> createSocketFactory(String&& /* userAgent */, ScriptExecutionContextIdentifier, bool /* isFirstParty */, RegistrableDomain&&);

protected:
    LibWebRTCProvider();

    rtc::scoped_refptr<webrtc::PeerConnectionInterface> createPeerConnection(webrtc::PeerConnectionObserver&, rtc::NetworkManager&, rtc::PacketSocketFactory&, webrtc::PeerConnectionInterface::RTCConfiguration&&, std::unique_ptr<webrtc::AsyncDnsResolverFactoryInterface>&&);

    rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface> createPeerConnectionFactory(rtc::Thread* networkThread, rtc::Thread* signalingThread);
    virtual std::unique_ptr<webrtc::VideoDecoderFactory> createDecoderFactory();
    virtual std::unique_ptr<webrtc::VideoEncoderFactory> createEncoderFactory();

    virtual void startedNetworkThread();

    PeerConnectionFactoryAndThreads& getStaticFactoryAndThreads(bool useNetworkThreadWithSocketServer);

    RefPtr<LibWebRTCAudioModule> m_audioModule;
    rtc::scoped_refptr<webrtc::PeerConnectionFactoryInterface> m_factory;
    // FIXME: Remove m_useNetworkThreadWithSocketServer member variable and make it a global.
    bool m_useNetworkThreadWithSocketServer { true };

private:
    void initializeAudioDecodingCapabilities() final;
    void initializeVideoDecodingCapabilities() final;
    void initializeAudioEncodingCapabilities() final;
    void initializeVideoEncodingCapabilities() final;

    virtual void willCreatePeerConnectionFactory();

    std::optional<MediaCapabilitiesDecodingInfo> videoDecodingCapabilitiesOverride(const VideoConfiguration&) final;
    std::optional<MediaCapabilitiesEncodingInfo> videoEncodingCapabilitiesOverride(const VideoConfiguration&) final;

    std::optional<bool> m_supportsVP9VTBForTesting { false };
    bool m_disableNonLocalhostConnections { false };
    bool m_enableEnumeratingAllNetworkInterfaces { false };
    bool m_enableEnumeratingVisibleNetworkInterfaces { false };
};

inline void LibWebRTCProvider::willCreatePeerConnectionFactory()
{
}

inline LibWebRTCAudioModule* LibWebRTCProvider::audioModule()
{
    return m_audioModule.get();
}

} // namespace WebCore

#endif // USE(LIBWEBRTC)
