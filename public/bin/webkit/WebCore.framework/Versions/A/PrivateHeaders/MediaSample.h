/*
 * Copyright (C) 2013-2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "FloatSize.h"
#include "FourCC.h"
#include "PlatformVideoColorSpace.h"
#include "SharedBuffer.h"
#include <functional>
#include <wtf/MediaTime.h>
#include <wtf/PrintStream.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/AtomString.h>

typedef struct opaqueCMSampleBuffer *CMSampleBufferRef;
typedef struct __CVBuffer *CVPixelBufferRef;
typedef struct _GstSample GstSample;
typedef const struct opaqueCMFormatDescription *CMFormatDescriptionRef;

namespace WebCore {

class FragmentedSharedBuffer;
class MockSampleBox;
class ProcessIdentity;
class SharedBuffer;
struct TrackInfo;

using TrackID = uint64_t;

struct PlatformSample {
    enum Type {
        None,
        MockSampleBoxType,
        CMSampleBufferType,
        GStreamerSampleType,
    } type;
    union {
        const MockSampleBox* mockSampleBox;
        CMSampleBufferRef cmSampleBuffer;
        GstSample* gstSample;
    } sample;
};

class MediaSample : public ThreadSafeRefCounted<MediaSample> {
public:
    virtual ~MediaSample() = default;

    virtual MediaTime presentationTime() const = 0;
    virtual MediaTime decodeTime() const = 0;
    virtual MediaTime duration() const = 0;
    virtual MediaTime presentationEndTime() const { return presentationTime() + duration(); }
    virtual TrackID trackID() const = 0;
    virtual size_t sizeInBytes() const = 0;
    virtual FloatSize presentationSize() const = 0;
    virtual void offsetTimestampsBy(const MediaTime&) = 0;
    virtual void setTimestamps(const MediaTime&, const MediaTime&) = 0;
    virtual bool isDivisable() const { return false; };
    enum DivideFlags { BeforePresentationTime, AfterPresentationTime };
    enum class UseEndTime : bool {
        DoNotUse,
        Use,
    };
    virtual std::pair<RefPtr<MediaSample>, RefPtr<MediaSample>> divide(const MediaTime&, UseEndTime = UseEndTime::DoNotUse)
    {
        ASSERT_NOT_REACHED();
        return { nullptr, nullptr };
    }
    virtual Ref<MediaSample> createNonDisplayingCopy() const = 0;

    enum SampleFlags {
        None = 0,
        IsSync = 1 << 0,
        IsNonDisplaying = 1 << 1,
        HasAlpha = 1 << 2,
        HasSyncInfo = 1 << 3,
        IsProtected = 1 << 4,
    };
    virtual SampleFlags flags() const = 0;
    virtual PlatformSample platformSample() const = 0;
    virtual PlatformSample::Type platformSampleType() const = 0;

    struct ByteRange {
        size_t byteOffset { 0 };
        size_t byteLength { 0 };
    };
    virtual std::optional<ByteRange> byteRange() const { return std::nullopt; }

    bool isSync() const { return flags() & IsSync; }
    bool isNonDisplaying() const { return flags() & IsNonDisplaying; }
    bool hasAlpha() const { return flags() & HasAlpha; }
    bool hasSyncInfo() const { return flags() & HasSyncInfo; }
    bool isProtected() const { return flags() & IsProtected; }

    virtual void dump(PrintStream& out) const
    {
        out.print("{PTS(", presentationTime(), "), DTS(", decodeTime(), "), duration(", duration(), "), flags(", (int)flags(), "), presentationSize(", presentationSize().width(), "x", presentationSize().height(), ")}");
    }

    String toJSONString() const
    {
        auto object = JSON::Object::create();

        object->setObject("pts"_s, presentationTime().toJSONObject());
        object->setObject("dts"_s, decodeTime().toJSONObject());
        object->setObject("duration"_s, duration().toJSONObject());
        object->setInteger("flags"_s, static_cast<unsigned>(flags()));
        object->setObject("presentationSize"_s, presentationSize().toJSONObject());

        return object->toJSONString();
    }
};

struct AudioInfo;
struct VideoInfo;

struct TrackInfo : public ThreadSafeRefCounted<TrackInfo> {
    enum class TrackType : uint8_t { Unknown, Audio, Video };

    bool isAudio() const { return type() == TrackType::Audio; }
    bool isVideo() const { return type() == TrackType::Video; }

    TrackType type() const { return m_type; }

    bool operator==(const TrackInfo& other) const
    {
        if (type() != other.type() || codecName != other.codecName || trackID != other.trackID)
            return false;
        return equalTo(other);
    }

    FourCC codecName;
    String codecString;
    TrackID trackID { 0 };

    virtual ~TrackInfo() = default;

protected:
    virtual bool equalTo(const TrackInfo& other) const = 0;
    TrackInfo(TrackType type)
        : m_type(type) { }

private:
    const TrackType m_type { TrackType::Unknown };
};

struct VideoInfo : public TrackInfo {
    static Ref<VideoInfo> create() { return adoptRef(*new VideoInfo()); }

    FloatSize size;
    // Size in pixels at which the video is rendered. This is after it has
    // been scaled by its aspect ratio.
    FloatSize displaySize;
    uint8_t bitDepth { 8 };
    PlatformVideoColorSpace colorSpace;

    RefPtr<SharedBuffer> atomData;

private:
    VideoInfo()
        : TrackInfo(TrackType::Video) { }
    bool equalTo(const TrackInfo& otherVideoInfo) const final
    {
        auto& other = downcast<const VideoInfo>(otherVideoInfo);
        return size == other.size && displaySize == other.displaySize && bitDepth == other.bitDepth && colorSpace == other.colorSpace && ((!atomData && !other.atomData) || (atomData && other.atomData && *atomData == *other.atomData));
    }
};

struct AudioInfo : public TrackInfo {
    static Ref<AudioInfo> create() { return adoptRef(*new AudioInfo()); }

    uint32_t rate { 0 };
    uint32_t channels { 0 };
    uint32_t framesPerPacket { 0 };
    uint8_t bitDepth { 16 };

    RefPtr<SharedBuffer> cookieData;

private:
    AudioInfo()
        : TrackInfo(TrackType::Audio) { }
    bool equalTo(const TrackInfo& otherAudioInfo) const final
    {
        auto& other = downcast<const AudioInfo>(otherAudioInfo);
        return rate == other.rate && channels == other.channels && bitDepth == other.bitDepth && framesPerPacket == other.framesPerPacket && ((!cookieData && !other.cookieData) || (cookieData && other.cookieData && *cookieData == *other.cookieData));
    }
};

class MediaSamplesBlock {
    WTF_MAKE_FAST_ALLOCATED;
public:
    struct MediaSampleItem {
        using MediaSampleDataType = RefPtr<FragmentedSharedBuffer>;
        MediaTime presentationTime;
        MediaTime decodeTime { MediaTime::indefiniteTime() };
        MediaTime duration { MediaTime::zeroTime() };
        std::pair<MediaTime, MediaTime> trimInterval { MediaTime::zeroTime(), MediaTime::zeroTime() };
        MediaSampleDataType data;
        uint32_t flags { };
        bool isSync() const { return flags & MediaSample::IsSync; }
    };

    using MediaSampleDataType = MediaSampleItem::MediaSampleDataType;
    using SamplesVector = Vector<MediaSampleItem>;

    MediaSamplesBlock() = default;
    MediaSamplesBlock(const TrackInfo* info, SamplesVector&& items)
        : m_info(info)
        , m_samples(WTFMove(items))
    {
    }

    void setInfo(RefPtr<const TrackInfo>&& info) { m_info = WTFMove(info); }
    const TrackInfo* info() const { return m_info.get(); }
    MediaTime presentationTime() const { return isEmpty() ? MediaTime::invalidTime() : first().presentationTime; }
    MediaTime duration() const
    {
        MediaTime duration = MediaTime::zeroTime();
        for (auto& sample : *this)
            duration += sample.duration;
        return duration;
    }
    MediaTime presentationEndTime() const { return presentationTime() + duration(); }
    bool isSync() const { return size() ? (first().flags & MediaSample::IsSync) : false; }
    TrackID trackID() const { return m_info ? m_info->trackID : -1; }
    bool isVideo() const { return m_info && m_info->isVideo(); }
    bool isAudio() const { return m_info && m_info->isAudio(); }
    TrackInfo::TrackType type() const { return m_info ? m_info->type() : TrackInfo::TrackType::Unknown; }
    void append(MediaSampleItem&& item) { m_samples.append(WTFMove(item)); }
    void append(MediaSamplesBlock&& block) { append(std::exchange(block.m_samples, { })); }
    void append(SamplesVector&& samples) { m_samples.appendVector(WTFMove(samples)); }
    size_t size() const { return m_samples.size(); };
    bool isEmpty() const { return m_samples.isEmpty(); }
    void clear() { m_samples.clear(); }
    SamplesVector takeSamples() { return std::exchange(m_samples, { }); }

    // Indicate that this MediaSampleBlock follows a discontinuity from the previous block.
    std::optional<bool> discontinuity() const { return m_discontinuity; }
    void setDiscontinuity(bool discontinuity) { m_discontinuity = discontinuity; }

    const MediaSampleItem& operator[](size_t index) const { return m_samples[index]; }
    const MediaSampleItem& first() const { return m_samples.first(); }
    const MediaSampleItem& last() const { return m_samples.last(); }
    SamplesVector::const_iterator begin() const { return m_samples.begin(); }
    SamplesVector::const_iterator end() const { return m_samples.end(); }

private:
    RefPtr<const TrackInfo> m_info;
    SamplesVector m_samples;
    std::optional<bool> m_discontinuity;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::VideoInfo)
    static bool isType(const WebCore::TrackInfo& info) { return info.isVideo(); }
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::AudioInfo)
    static bool isType(const WebCore::TrackInfo& info) { return info.isAudio(); }
SPECIALIZE_TYPE_TRAITS_END()

namespace WTF {

template<typename Type> struct LogArgument;
template <>
struct LogArgument<WebCore::MediaSample> {
    static String toString(const WebCore::MediaSample& sample)
    {
        return sample.toJSONString();
    }
};

} // namespace WTF
