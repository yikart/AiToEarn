/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 * Copyright (C) 2017-2024 Apple Inc. All rights reserved.
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

#include "RTCDtlsTransportState.h"
#include "RTCIceCandidateType.h"
#include "RTCIceRole.h"
#include "RTCIceServerTransportProtocol.h"
#include "RTCIceTcpCandidateType.h"
#include "RTCIceTransportState.h"
#include <wtf/KeyValuePair.h>
#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

#if USE(GSTREAMER_WEBRTC)
#define GST_USE_UNSTABLE_API
#include <gst/webrtc/webrtc.h>
#undef GST_USE_UNSTABLE_API
#endif

#if USE(LIBWEBRTC)
namespace webrtc {
class RTCAudioPlayoutStats;
class RTCAudioSourceStats;
class RTCCertificateStats;
class RTCCodecStats;
class RTCDataChannelStats;
class RTCIceCandidatePairStats;
class RTCIceCandidateStats;
class RTCInboundRtpStreamStats;
class RTCInboundRtpStreamStats;
class RTCMediaSourceStats;
class RTCOutboundRtpStreamStats;
class RTCPeerConnectionStats;
class RTCReceivedRtpStreamStats;
class RTCRemoteIceCandidateStats;
class RTCRemoteInboundRtpStreamStats;
class RTCRemoteOutboundRtpStreamStats;
class RTCRtpStreamStats;
class RTCSentRtpStreamStats;
class RTCStats;
class RTCTransportStats;
class RTCVideoSourceStats;
}
#endif

namespace WebCore {

class DOMMapAdapter;

class RTCStatsReport : public RefCounted<RTCStatsReport> {
public:
    using MapInitializer = Function<void(DOMMapAdapter&)>;
    static Ref<RTCStatsReport> create(MapInitializer&& mapInitializer) { return adoptRef(*new RTCStatsReport(WTFMove(mapInitializer))); }

    void initializeMapLike(DOMMapAdapter& adapter) { m_mapInitializer(adapter); }

    enum class Type {
        Codec,
        InboundRtp,
        OutboundRtp,
        RemoteInboundRtp,
        RemoteOutboundRtp,
        MediaSource,
        MediaPlayout,
        PeerConnection,
        DataChannel,
        Transport,
        CandidatePair,
        LocalCandidate,
        RemoteCandidate,
        Certificate,
    };

    struct Stats {
#if USE(LIBWEBRTC)
        Stats(Type, const webrtc::RTCStats&);
#elif USE(GSTREAMER_WEBRTC)
        Stats(Type, const GstStructure*);
#endif

        double timestamp { 0 };
        Type type;
        String id;
    };
    static_assert(!std::is_default_constructible_v<Stats>);

    struct RtpStreamStats : Stats {
#if USE(LIBWEBRTC)
        RtpStreamStats(Type, const webrtc::RTCRtpStreamStats&);
#elif USE(GSTREAMER_WEBRTC)
        RtpStreamStats(Type, const GstStructure*);
#endif

        uint32_t ssrc { 0 };
        String kind;
        String transportId;
        String codecId;
    };
    static_assert(!std::is_default_constructible_v<RtpStreamStats>);

    struct ReceivedRtpStreamStats : RtpStreamStats {
#if USE(LIBWEBRTC)
        ReceivedRtpStreamStats(Type, const webrtc::RTCReceivedRtpStreamStats&);
#elif USE(GSTREAMER_WEBRTC)
        ReceivedRtpStreamStats(Type, const GstStructure*);
#endif

        std::optional<uint64_t> packetsReceived;
        std::optional<int64_t> packetsLost;
        std::optional<double> jitter;
    };
    static_assert(!std::is_default_constructible_v<ReceivedRtpStreamStats>);

    struct InboundRtpStreamStats : ReceivedRtpStreamStats {
#if USE(LIBWEBRTC)
        InboundRtpStreamStats(const webrtc::RTCInboundRtpStreamStats&);
#elif USE(GSTREAMER_WEBRTC)
        InboundRtpStreamStats(const GstStructure*);
#endif

        String trackIdentifier;
        String mid;
        String remoteId;
        std::optional<uint32_t> framesDecoded;
        std::optional<uint32_t> keyFramesDecoded;
        std::optional<uint32_t> framesRendered;
        std::optional<uint32_t> framesDropped;
        std::optional<uint32_t> frameWidth;
        std::optional<uint32_t> frameHeight;
        std::optional<double> framesPerSecond;
        std::optional<uint64_t> qpSum;
        std::optional<double> totalDecodeTime;
        std::optional<double> totalInterFrameDelay;
        std::optional<double> totalSquaredInterFrameDelay;
        std::optional<uint32_t> pauseCount;
        std::optional<double> totalPausesDuration;
        std::optional<uint32_t> freezeCount;
        std::optional<double> totalFreezesDuration;
        std::optional<double> lastPacketReceivedTimestamp;
        std::optional<uint64_t> headerBytesReceived;
        std::optional<uint64_t> packetsDiscarded;
        std::optional<uint64_t> fecBytesReceived;
        std::optional<uint64_t> fecPacketsReceived;
        std::optional<uint64_t> fecPacketsDiscarded;
        std::optional<uint64_t> bytesReceived;
        std::optional<uint64_t> packetsFailedDecryption;
        std::optional<uint64_t> packetsDuplicated;
        std::optional<uint32_t> nackCount;
        std::optional<uint32_t> firCount;
        std::optional<uint32_t> pliCount;
        std::optional<double> totalProcessingDelay;
        std::optional<double> estimatedPlayoutTimestamp;
        std::optional<double> jitterBufferDelay;
        std::optional<double> jitterBufferTargetDelay;
        std::optional<uint64_t> jitterBufferEmittedCount;
        std::optional<double> jitterBufferMinimumDelay;
        std::optional<uint64_t> totalSamplesReceived;
        std::optional<uint64_t> samplesDecodedWithSilk;
        std::optional<uint64_t> samplesDecodedWithCelt;
        std::optional<uint64_t> concealedSamples;
        std::optional<uint64_t> silentConcealedSamples;
        std::optional<uint64_t> concealmentEvents;
        std::optional<uint64_t> insertedSamplesForDeceleration;
        std::optional<uint64_t> removedSamplesForAcceleration;
        std::optional<double> audioLevel;
        std::optional<double> totalAudioEnergy;
        std::optional<double> totalSamplesDuration;
        std::optional<uint32_t> framesReceived;
        String decoderImplementation;
        String playoutId;
        std::optional<bool> powerEfficientDecoder;
        std::optional<uint32_t> framesAssembledFromMultiplePackets;
        std::optional<double> totalAssemblyTime;
        std::optional<uint64_t> retransmittedPacketsReceived;
        std::optional<uint64_t> retransmittedBytesReceived;
        std::optional<uint32_t> rtxSsrc;
        std::optional<uint32_t> fecSsrc;
    };
    static_assert(!std::is_default_constructible_v<InboundRtpStreamStats>);

    struct RemoteInboundRtpStreamStats : ReceivedRtpStreamStats {
#if USE(LIBWEBRTC)
        RemoteInboundRtpStreamStats(const webrtc::RTCRemoteInboundRtpStreamStats&);
#elif USE(GSTREAMER_WEBRTC)
        RemoteInboundRtpStreamStats(const GstStructure*);
#endif

        String localId;
        std::optional<double> roundTripTime;
        std::optional<double> totalRoundTripTime;
        std::optional<double> fractionLost;
        std::optional<uint64_t> roundTripTimeMeasurements;
    };
    static_assert(!std::is_default_constructible_v<RemoteInboundRtpStreamStats>);

    struct SentRtpStreamStats : RtpStreamStats {
#if USE(LIBWEBRTC)
        SentRtpStreamStats(Type, const webrtc::RTCSentRtpStreamStats&);
#elif USE(GSTREAMER_WEBRTC)
        SentRtpStreamStats(Type, const GstStructure*);
#endif

        std::optional<uint32_t> packetsSent;
        std::optional<uint64_t> bytesSent;
    };
    static_assert(!std::is_default_constructible_v<SentRtpStreamStats>);

    enum class QualityLimitationReason {
        None,
        Cpu,
        Bandwidth,
        Other
    };

    struct OutboundRtpStreamStats : SentRtpStreamStats {
#if USE(LIBWEBRTC)
        OutboundRtpStreamStats(const webrtc::RTCOutboundRtpStreamStats&);
#elif USE(GSTREAMER_WEBRTC)
        OutboundRtpStreamStats(const GstStructure*);
#endif

        String mid;
        String mediaSourceId;
        String remoteId;
        String rid;
        std::optional<uint64_t> headerBytesSent;
        std::optional<uint64_t> retransmittedPacketsSent;
        std::optional<uint64_t> retransmittedBytesSent;
        std::optional<uint32_t> rtxSsrc;
        std::optional<double> targetBitrate;
        std::optional<uint64_t> totalEncodedBytesTarget;
        std::optional<uint32_t> frameWidth;
        std::optional<uint32_t> frameHeight;
        std::optional<double> framesPerSecond;
        std::optional<uint32_t> framesSent;
        std::optional<uint32_t> hugeFramesSent;
        std::optional<uint32_t> framesEncoded;
        std::optional<uint32_t> keyFramesEncoded;
        std::optional<uint64_t> qpSum;
        std::optional<double> totalEncodeTime;
        std::optional<double> totalPacketSendDelay;
        std::optional<QualityLimitationReason> qualityLimitationReason;
        std::optional<Vector<KeyValuePair<String, double>>> qualityLimitationDurations;
        std::optional<uint32_t> qualityLimitationResolutionChanges;
        std::optional<uint32_t> nackCount;
        std::optional<uint32_t> firCount;
        std::optional<uint32_t> pliCount;
        std::optional<bool> active;
        String scalabilityMode;
    };
    static_assert(!std::is_default_constructible_v<OutboundRtpStreamStats>);

    struct RemoteOutboundRtpStreamStats : SentRtpStreamStats {
#if USE(LIBWEBRTC)
        RemoteOutboundRtpStreamStats(const webrtc::RTCRemoteOutboundRtpStreamStats&);
#elif USE(GSTREAMER_WEBRTC)
        RemoteOutboundRtpStreamStats(const GstStructure*);
#endif

        String localId;
        std::optional<double> remoteTimestamp;
        std::optional<uint64_t> reportsSent;
        std::optional<double> roundTripTime;
        std::optional<double> totalRoundTripTime;
        std::optional<uint64_t> roundTripTimeMeasurements;
    };
    static_assert(!std::is_default_constructible_v<RemoteOutboundRtpStreamStats>);

    struct DataChannelStats : Stats {
#if USE(LIBWEBRTC)
        DataChannelStats(const webrtc::RTCDataChannelStats&);
#elif USE(GSTREAMER_WEBRTC)
        DataChannelStats(const GstStructure*);
#endif

        String label;
        String protocol;
        std::optional<int> dataChannelIdentifier;
        String state;
        std::optional<uint32_t> messagesSent;
        std::optional<uint64_t> bytesSent;
        std::optional<uint32_t> messagesReceived;
        std::optional<uint64_t> bytesReceived;
    };
    static_assert(!std::is_default_constructible_v<DataChannelStats>);

    enum class IceCandidatePairState {
        Frozen,
        Waiting,
        InProgress,
        Failed,
        Succeeded
    };

    struct IceCandidatePairStats : Stats {
#if USE(LIBWEBRTC)
        IceCandidatePairStats(const webrtc::RTCIceCandidatePairStats&);
#elif USE(GSTREAMER_WEBRTC)
        IceCandidatePairStats(const GstStructure*);
#endif

        String transportId;
        String localCandidateId;
        String remoteCandidateId;
        IceCandidatePairState state;
        std::optional<bool> nominated;
        std::optional<uint64_t> packetsSent;
        std::optional<uint64_t> packetsReceived;
        std::optional<uint64_t> bytesSent;
        std::optional<uint64_t> bytesReceived;
        std::optional<double> lastPacketSentTimestamp;
        std::optional<double> lastPacketReceivedTimestamp;
        std::optional<double> totalRoundTripTime;
        std::optional<double> currentRoundTripTime;
        std::optional<double> availableOutgoingBitrate;
        std::optional<double> availableIncomingBitrate;
        std::optional<uint64_t> requestsReceived;
        std::optional<uint64_t> requestsSent;
        std::optional<uint64_t> responsesReceived;
        std::optional<uint64_t> responsesSent;
        std::optional<uint64_t> consentRequestsSent;
        std::optional<uint32_t> packetsDiscardedOnSend;
        std::optional<uint64_t> bytesDiscardedOnSend;
    };
    static_assert(!std::is_default_constructible_v<IceCandidatePairStats>);

    struct IceCandidateStats : Stats {
#if USE(LIBWEBRTC)
        IceCandidateStats(const webrtc::RTCIceCandidateStats&);
#elif USE(GSTREAMER_WEBRTC)
        IceCandidateStats(GstWebRTCStatsType, const GstStructure*);
#endif

        String transportId;
        String address;
        std::optional<int32_t> port;
        String protocol;
        RTCIceCandidateType candidateType;
        std::optional<int32_t> priority;
        String url;
        std::optional<RTCIceServerTransportProtocol> relayProtocol;
        String foundation;
        String relatedAddress;
        std::optional<int32_t> relatedPort;
        String usernameFragment;
        std::optional<RTCIceTcpCandidateType> tcpType;
    };
    static_assert(!std::is_default_constructible_v<IceCandidateStats>);

    struct CertificateStats : Stats {
#if USE(LIBWEBRTC)
        CertificateStats(const webrtc::RTCCertificateStats&);
#elif USE(GSTREAMER_WEBRTC)
        CertificateStats(const GstStructure*);
#endif

        String fingerprint;
        String fingerprintAlgorithm;
        String base64Certificate;
        String issuerCertificateId;
    };
    static_assert(!std::is_default_constructible_v<CertificateStats>);

    enum class CodecType {
        Encode,
        Decode
    };

    struct CodecStats : Stats {
#if USE(LIBWEBRTC)
        CodecStats(const webrtc::RTCCodecStats&);
#elif USE(GSTREAMER_WEBRTC)
        CodecStats(const GstStructure*);
#endif

        uint32_t payloadType { 0 };
        String transportId;
        String mimeType;
        std::optional<uint32_t> clockRate;
        std::optional<uint32_t> channels;
        String sdpFmtpLine;
        String implementation;
    };
    static_assert(!std::is_default_constructible_v<CodecStats>);

    enum DtlsRole {
        Client,
        Server,
        Unknown
    };

    struct TransportStats : Stats {
#if USE(LIBWEBRTC)
        TransportStats(const webrtc::RTCTransportStats&);
#elif USE(GSTREAMER_WEBRTC)
        TransportStats(const GstStructure*);
#endif

        std::optional<uint64_t> packetsSent;
        std::optional<uint64_t> packetsReceived;
        std::optional<uint64_t> bytesSent;
        std::optional<uint64_t> bytesReceived;
        std::optional<RTCIceRole> iceRole;
        String iceLocalUsernameFragment;
        RTCDtlsTransportState dtlsState;
        std::optional<RTCIceTransportState> iceState;
        String selectedCandidatePairId;
        String localCertificateId;
        String remoteCertificateId;
        String tlsVersion;
        String dtlsCipher;
        std::optional<DtlsRole> dtlsRole;
        String srtpCipher;
        std::optional<uint32_t> selectedCandidatePairChanges;
    };
    static_assert(!std::is_default_constructible_v<TransportStats>);

    struct AudioPlayoutStats : Stats {
#if USE(LIBWEBRTC)
        AudioPlayoutStats(const webrtc::RTCAudioPlayoutStats&);
#elif USE(GSTREAMER_WEBRTC)
        AudioPlayoutStats(const GstStructure*);
#endif

        String kind;
        std::optional<double> synthesizedSamplesDuration;
        std::optional<uint32_t> synthesizedSamplesEvents;
        std::optional<double> totalSamplesDuration;
        std::optional<double> totalPlayoutDelay;
        std::optional<uint64_t> totalSamplesCount;
    };
    static_assert(!std::is_default_constructible_v<AudioPlayoutStats>);

    struct PeerConnectionStats : Stats {
#if USE(LIBWEBRTC)
        PeerConnectionStats(const webrtc::RTCPeerConnectionStats&);
#elif USE(GSTREAMER_WEBRTC)
        PeerConnectionStats(const GstStructure*);
#endif

        std::optional<uint32_t> dataChannelsOpened;
        std::optional<uint32_t> dataChannelsClosed;
    };
    static_assert(!std::is_default_constructible_v<PeerConnectionStats>);

    struct MediaSourceStats : Stats {
#if USE(LIBWEBRTC)
        MediaSourceStats(Type, const webrtc::RTCMediaSourceStats&);
#elif USE(GSTREAMER_WEBRTC)
        MediaSourceStats(Type, const GstStructure*);
#endif

        String trackIdentifier;
        String kind;
        std::optional<bool> relayedSource;
    };
    static_assert(!std::is_default_constructible_v<MediaSourceStats>);

    struct AudioSourceStats : MediaSourceStats {
#if USE(LIBWEBRTC)
        AudioSourceStats(const webrtc::RTCAudioSourceStats&);
#elif USE(GSTREAMER_WEBRTC)
        AudioSourceStats(const GstStructure*);
#endif

        std::optional<double> audioLevel;
        std::optional<double> totalAudioEnergy;
        std::optional<double> totalSamplesDuration;
        std::optional<double> echoReturnLoss;
        std::optional<double> echoReturnLossEnhancement;
    };
    static_assert(!std::is_default_constructible_v<AudioSourceStats>);

    struct VideoSourceStats : MediaSourceStats {
#if USE(LIBWEBRTC)
        VideoSourceStats(const webrtc::RTCVideoSourceStats&);
#elif USE(GSTREAMER_WEBRTC)
        VideoSourceStats(const GstStructure*);
#endif

        std::optional<unsigned long> width;
        std::optional<unsigned long> height;
        std::optional<unsigned long> frames;
        std::optional<double> framesPerSecond;
    };
    static_assert(!std::is_default_constructible_v<VideoSourceStats>);

private:
    explicit RTCStatsReport(MapInitializer&&);

    MapInitializer m_mapInitializer;
};

inline RTCStatsReport::RTCStatsReport(MapInitializer&& mapInitializer)
    : m_mapInitializer(WTFMove(mapInitializer))
{
}

} // namespace WebCore
