/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_SOURCE)

#include "ExceptionOr.h"
#include "LibWebRTCMacros.h"
#include "MediaSample.h"
#include "SharedBuffer.h"
#include "SourceBufferParser.h"
#include <CoreAudio/CoreAudioTypes.h>
#include <pal/spi/cf/CoreMediaSPI.h>
#include <variant>
#include <webm/callback.h>
#include <webm/common/vp9_header_parser.h>
#include <webm/status.h>
#include <wtf/Deque.h>
#include <wtf/LoggerHelper.h>
#include <wtf/MediaTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/Vector.h>

typedef const struct opaqueCMFormatDescription* CMFormatDescriptionRef;

namespace webm {
class WebmParser;
}

namespace WebCore {

class PacketDurationParser;
struct TrackInfo;

class WebMParser
    : private webm::Callback
    , private LoggerHelper {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WebMParser, WEBCORE_EXPORT);
public:
    class Callback {
    public:
        virtual void parsedTrimmingData(uint64_t, const MediaTime&) { }
        virtual void parsedInitializationData(SourceBufferParser::InitializationSegment&&) = 0;
        virtual void parsedMediaData(MediaSamplesBlock&&) = 0;
        virtual bool canDecrypt() const { return false; }
        virtual void contentKeyRequestInitializationDataForTrackID(Ref<SharedBuffer>&&, uint64_t) { }
        virtual void formatDescriptionChangedForTrackID(Ref<TrackInfo>&&, uint64_t) { }
        virtual ~Callback() = default;
    };

    WEBCORE_EXPORT WebMParser(Callback&);
    WEBCORE_EXPORT ~WebMParser();

    class SegmentReader;

    WEBCORE_EXPORT void createByteRangeSamples();
    WEBCORE_EXPORT ExceptionOr<int> parse(SourceBufferParser::Segment&&);
    WEBCORE_EXPORT void resetState();
    WEBCORE_EXPORT void reset();
    WEBCORE_EXPORT void invalidate();
    const webm::Status& status() const { return m_status; }

    void provideMediaData(MediaSamplesBlock&&);

    WEBCORE_EXPORT void setLogger(const Logger&, uint64_t identifier);
    WTFLogChannel& logChannel() const final;

    enum class ErrorCode : int32_t {
        SourceBufferParserWebMErrorCodeStart = 2000,
        InvalidDocType,
        InvalidInitSegment,
        ReceivedEbmlInsideSegment,
        UnsupportedVideoCodec,
        UnsupportedAudioCodec,
        ContentEncrypted,
        VariableFrameDuration,
        ReaderFailed,
        ParserShutdown,
    };

    enum class State : uint8_t {
        None,
        ReadingEbml,
        ReadEbml,
        ReadingSegment,
        ReadingInfo,
        ReadInfo,
        ReadingTracks,
        ReadingTrack,
        ReadTrack,
        ReadingCluster,
    };

    enum class CodecType : uint8_t {
        Unsupported,
        VP8,
        VP9,
        Vorbis,
        Opus,
    };

    using ConsumeFrameDataResult = std::variant<MediaTime, webm::Status>;

    class TrackData {
        WTF_MAKE_TZONE_ALLOCATED(TrackData);
    public:
        static auto create(CodecType codecType, const webm::TrackEntry& trackEntry, WebMParser& parser) -> UniqueRef<TrackData>
        {
            return makeUniqueRef<TrackData>(codecType, trackEntry, TrackInfo::TrackType::Unknown, parser);
        }

        TrackData(CodecType codecType, const webm::TrackEntry& trackEntry, TrackInfo::TrackType trackType, WebMParser& parser)
            : m_codec { codecType }
            , m_track { webm::TrackEntry { trackEntry } }
            , m_trackType { trackType }
            , m_parser { parser }
        {
        }
        virtual ~TrackData() = default;

        CodecType codec() const { return m_codec; }
        webm::TrackEntry& track() { return m_track; }
        TrackInfo::TrackType trackType() const { return m_trackType; }

        RefPtr<TrackInfo> formatDescription() const { return m_formatDescription.copyRef(); }
        void setFormatDescription(Ref<TrackInfo>&& description)
        {
            m_formatDescription = WTFMove(description);
            m_formatDescription->trackID = track().track_uid.value();
        }

        WebMParser& parser() const { return m_parser; }

        using ConsumeFrameDataResult = WebMParser::ConsumeFrameDataResult;
        virtual ConsumeFrameDataResult consumeFrameData(webm::Reader&, const webm::FrameMetadata&, uint64_t*, const MediaTime&)
        {
            ASSERT_NOT_REACHED();
            return webm::Status(webm::Status::kInvalidElementId);
        }

        virtual void resetCompletedFramesState()
        {
            m_completeBlockBuffer = nullptr;
            m_processedMediaSamples = { };
            m_processedMediaSamples.setInfo(formatDescription());
        }

        void reset()
        {
            resetCompletedFramesState();
            m_completePacketSize = std::nullopt;
            m_partialBytesRead = 0;
            m_currentBlockBuffer.reset();
        }

        void drainPendingSamples()
        {
            if (!m_processedMediaSamples.size())
                return;
            m_parser.provideMediaData(WTFMove(m_processedMediaSamples));
            resetCompletedFramesState();
        }

    protected:
        RefPtr<SharedBuffer> contiguousCompleteBlockBuffer(size_t offset, size_t length) const;
        webm::Status readFrameData(webm::Reader&, const webm::FrameMetadata&, uint64_t* bytesRemaining);
        WTFLogChannel& logChannel() const { return m_parser.logChannel(); }
        MediaSamplesBlock m_processedMediaSamples;
        MediaSamplesBlock::MediaSampleDataType m_completeFrameData;
        RefPtr<TrackInfo> m_trackInfo;

    private:
        CodecType m_codec;
        webm::TrackEntry m_track;
        const TrackInfo::TrackType m_trackType;
        RefPtr<TrackInfo> m_formatDescription;
        SharedBufferBuilder m_currentBlockBuffer;
        RefPtr<FragmentedSharedBuffer> m_completeBlockBuffer;
        WebMParser& m_parser;
        std::optional<size_t> m_completePacketSize;
        // Size of the currently incomplete parsed packet.
        size_t m_partialBytesRead { 0 };
    };

    class VideoTrackData : public TrackData {
        WTF_MAKE_TZONE_ALLOCATED(VideoTrackData);
    public:
        static auto create(CodecType codecType, const webm::TrackEntry& trackEntry, WebMParser& parser) -> UniqueRef<VideoTrackData>
        {
            return makeUniqueRef<VideoTrackData>(codecType, trackEntry, parser);
        }

        VideoTrackData(CodecType codecType, const webm::TrackEntry& trackEntry, WebMParser& parser)
            : TrackData(codecType, trackEntry, TrackInfo::TrackType::Video, parser)
        {
        }

        void flushPendingSamples();

    private:
        ASCIILiteral logClassName() const { return "VideoTrackData"_s; }
        ConsumeFrameDataResult consumeFrameData(webm::Reader&, const webm::FrameMetadata&, uint64_t*, const MediaTime&) final;
        void resetCompletedFramesState() final;
        void processPendingMediaSamples(const MediaTime&);
        WTF::Deque<MediaSamplesBlock::MediaSampleItem> m_pendingMediaSamples;
        std::optional<MediaTime> m_lastDuration;
        std::optional<MediaTime> m_lastPresentationTime;

#if ENABLE(VP9)
        vp9_parser::Vp9HeaderParser m_headerParser;
#endif
    };

    class AudioTrackData : public TrackData {
        WTF_MAKE_TZONE_ALLOCATED(AudioTrackData);
    public:
        static auto create(CodecType codecType, const webm::TrackEntry& trackEntry, WebMParser& parser) -> UniqueRef<AudioTrackData>
        {
            return makeUniqueRef<AudioTrackData>(codecType, trackEntry, parser);
        }

        AudioTrackData(CodecType, const webm::TrackEntry&, WebMParser&);
        ~AudioTrackData();

    private:
        ConsumeFrameDataResult consumeFrameData(webm::Reader&, const webm::FrameMetadata&, uint64_t*, const MediaTime&) final;
        void resetCompletedFramesState() final;
        ASCIILiteral logClassName() const { return "AudioTrackData"_s; }

        std::unique_ptr<PacketDurationParser> m_packetDurationParser;
#if !HAVE(AUDIOFORMATPROPERTY_VARIABLEPACKET_SUPPORTED)
        Seconds m_frameDuration { 0_s };
        uint8_t m_framesPerPacket { 0 };
#endif
        size_t mNumFramesInCompleteBlock { 0 };
        MediaTime m_lastPresentationEndTime { MediaTime::invalidTime() };
        MediaTime m_remainingTrimDuration;
        MediaTime m_presentationTimeShift;
    };

    void formatDescriptionChangedForTrackData(TrackData&);

private:
    TrackData* trackDataForTrackNumber(uint64_t);
    static bool isSupportedVideoCodec(StringView);
    static bool isSupportedAudioCodec(StringView);
    void flushPendingVideoSamples();

    // webm::Callback
    webm::Status OnElementBegin(const webm::ElementMetadata&, webm::Action*) final;
    webm::Status OnElementEnd(const webm::ElementMetadata&) final;
    webm::Status OnEbml(const webm::ElementMetadata&, const webm::Ebml&) final;
    webm::Status OnSegmentBegin(const webm::ElementMetadata&, webm::Action*) final;
    webm::Status OnInfo(const webm::ElementMetadata&, const webm::Info&) final;
    webm::Status OnClusterBegin(const webm::ElementMetadata&, const webm::Cluster&, webm::Action*) final;
    webm::Status OnTrackEntry(const webm::ElementMetadata&, const webm::TrackEntry&) final;
    webm::Status OnBlockBegin(const webm::ElementMetadata&, const webm::Block&, webm::Action*) final;
    webm::Status OnBlockEnd(const webm::ElementMetadata&, const webm::Block&) final;
    webm::Status OnSimpleBlockBegin(const webm::ElementMetadata&, const webm::SimpleBlock&, webm::Action*) final;
    webm::Status OnSimpleBlockEnd(const webm::ElementMetadata&, const webm::SimpleBlock&) final;
    webm::Status OnBlockGroupBegin(const webm::ElementMetadata& , webm::Action*);
    webm::Status OnBlockGroupEnd(const webm::ElementMetadata&, const webm::BlockGroup&);
    webm::Status OnFrame(const webm::FrameMetadata&, webm::Reader*, uint64_t* bytesRemaining) final;

    const Logger* loggerPtr() const { return m_logger.get(); }
    const Logger& logger() const final { ASSERT(m_logger); return *m_logger.get(); }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    ASCIILiteral logClassName() const final { return "WebMParser"_s; }

    std::unique_ptr<SourceBufferParser::InitializationSegment> m_initializationSegment;
    Vector<std::pair<uint64_t, Ref<SharedBuffer>>> m_keyIds;
    webm::Status m_status;
    std::unique_ptr<webm::WebmParser> m_parser;
    bool m_initializationSegmentEncountered { false };
    bool m_initializationSegmentProcessed { false };
    uint32_t m_timescale { 1000 };
    uint64_t m_currentTimecode { 0 };
    MediaTime m_currentDuration;

    State m_state { State::None };

    UniqueRef<SegmentReader> m_reader;

    Vector<UniqueRef<TrackData>> m_tracks;
    using BlockVariant = std::variant<webm::Block, webm::SimpleBlock>;
    std::optional<BlockVariant> m_currentBlock;
    std::optional<uint64_t> m_rewindToPosition;

    RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
    uint64_t m_nextChildIdentifier { 0 };
    Callback& m_callback;
    bool m_createByteRangeSamples { false };
};

class SourceBufferParserWebM
    : public SourceBufferParser
    , public WebMParser::Callback
    , private LoggerHelper {
    WTF_MAKE_TZONE_ALLOCATED(SourceBufferParserWebM);
public:
    static MediaPlayerEnums::SupportsType isContentTypeSupported(const ContentType&);
    static std::span<const ASCIILiteral> supportedMIMETypes();
    WEBCORE_EXPORT static RefPtr<SourceBufferParserWebM> create();

    ~SourceBufferParserWebM();

    static bool isAvailable();

    Type type() const { return Type::WebM; }
    WEBCORE_EXPORT Expected<void, PlatformMediaError> appendData(Segment&&, AppendFlags = AppendFlags::None) final;
    void flushPendingMediaData() final;
    void resetParserState() final { m_parser.resetState(); }
    void invalidate() final;

    using DidParseTrimmingDataCallback = Function<void(uint64_t trackID, const MediaTime& discardPadding)>;
    void setDidParseTrimmingDataCallback(DidParseTrimmingDataCallback&& callback)
    {
        m_didParseTrimmingDataCallback = WTFMove(callback);
    }

    void flushPendingAudioSamples();
    void setMinimumAudioSampleDuration(float);

    WEBCORE_EXPORT void setLogger(const Logger&, uint64_t identifier) final;

private:
    SourceBufferParserWebM();
    // WebMParser::Callback
    void parsedInitializationData(SourceBufferParser::InitializationSegment&&) final;
    void parsedMediaData(MediaSamplesBlock&&) final;
    bool canDecrypt() const final { return !!m_didProvideContentKeyRequestInitializationDataForTrackIDCallback; }
    void contentKeyRequestInitializationDataForTrackID(Ref<SharedBuffer>&&, uint64_t) final;
    void parsedTrimmingData(uint64_t, const MediaTime&) final;
    void formatDescriptionChangedForTrackID(Ref<TrackInfo>&&, uint64_t) final;

    void returnSamples(MediaSamplesBlock&&, CMFormatDescriptionRef);

    const Logger* loggerPtr() const { return m_logger.get(); }
    const Logger& logger() const final { ASSERT(m_logger); return *m_logger.get(); }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    ASCIILiteral logClassName() const final { return "SourceBufferParserWebM"_s; }
    WTFLogChannel& logChannel() const final;

    DidParseTrimmingDataCallback m_didParseTrimmingDataCallback;
    WebMParser m_parser;
    RetainPtr<CMFormatDescriptionRef> m_audioFormatDescription;
    RefPtr<const TrackInfo> m_audioInfo;
    RetainPtr<CMFormatDescriptionRef> m_videoFormatDescription;
    RefPtr<const TrackInfo> m_videoInfo;
    MediaTime m_minimumAudioSampleDuration { 96000, 48000 };
    MediaSamplesBlock m_queuedAudioSamples;
    MediaTime m_queuedAudioDuration;
    bool m_audioDiscontinuity { true };
    RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
};

}

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::SourceBufferParserWebM)
    static bool isType(const WebCore::SourceBufferParser& parser) { return parser.type() == WebCore::SourceBufferParser::Type::WebM; }
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::WebMParser::VideoTrackData)
    static bool isType(const WebCore::WebMParser::TrackData& trackData) { return trackData.trackType() == WebCore::TrackInfo::TrackType::Video; }
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::WebMParser::AudioTrackData)
    static bool isType(const WebCore::WebMParser::TrackData& trackData) { return trackData.trackType() == WebCore::TrackInfo::TrackType::Audio; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(MEDIA_SOURCE)
