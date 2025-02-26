/*
 * Copyright (C) 2013-2017 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_SOURCE)

#include "AudioTrackPrivate.h"
#include "InbandTextTrackPrivate.h"
#include "MediaDescription.h"
#include "PlatformMediaError.h"
#include "VideoTrackPrivate.h"
#include <wtf/MediaTime.h>
#include <wtf/Ref.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/MakeString.h>

namespace WebCore {

class MediaSample;
class MediaDescription;
class PlatformTimeRanges;

struct SourceBufferEvictionData {
    uint64_t contentSize { 0 };
    int64_t evictableSize { 0 };
    uint64_t maximumBufferSize { 0 };
    size_t numMediaSamples { 0 };

    bool operator!=(const SourceBufferEvictionData& other)
    {
        return contentSize != other.contentSize || evictableSize != other.evictableSize || maximumBufferSize != other.maximumBufferSize || numMediaSamples != other.numMediaSamples;
    }

    void clear()
    {
        contentSize = 0;
        evictableSize = 0;
        numMediaSamples = 0;
    }
};

class SourceBufferPrivateClient : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<SourceBufferPrivateClient> {
public:
    virtual ~SourceBufferPrivateClient() = default;

    struct InitializationSegment {
        MediaTime duration;

        struct AudioTrackInformation {
            RefPtr<MediaDescription> description;
            RefPtr<AudioTrackPrivate> track;

            RefPtr<MediaDescription> protectedDescription() const { return description; }
            RefPtr<AudioTrackPrivate> protectedTrack() const { return track; }
        };
        Vector<AudioTrackInformation> audioTracks;

        struct VideoTrackInformation {
            RefPtr<MediaDescription> description;
            RefPtr<VideoTrackPrivate> track;

            RefPtr<MediaDescription> protectedDescription() const { return description; }
            RefPtr<VideoTrackPrivate> protectedTrack() const { return track; }
        };
        Vector<VideoTrackInformation> videoTracks;

        struct TextTrackInformation {
            RefPtr<MediaDescription> description;
            RefPtr<InbandTextTrackPrivate> track;

            RefPtr<MediaDescription> protectedDescription() const { return description; }
            RefPtr<InbandTextTrackPrivate> protectedTrack() const { return track; }
        };
        Vector<TextTrackInformation> textTracks;
    };

    virtual Ref<MediaPromise> sourceBufferPrivateDidReceiveInitializationSegment(InitializationSegment&&) = 0;
    virtual Ref<MediaPromise> sourceBufferPrivateBufferedChanged(const Vector<PlatformTimeRanges>&) = 0;
    virtual Ref<MediaPromise> sourceBufferPrivateDurationChanged(const MediaTime&) = 0;
    virtual void sourceBufferPrivateHighestPresentationTimestampChanged(const MediaTime&) = 0;
    virtual void sourceBufferPrivateDidDropSample() = 0;
    virtual void sourceBufferPrivateDidReceiveRenderingError(int64_t errorCode) = 0;
    virtual void sourceBufferPrivateEvictionDataChanged(const SourceBufferEvictionData&) { }
    virtual Ref<MediaPromise> sourceBufferPrivateDidAttach(InitializationSegment&&) = 0;
};

} // namespace WebCore

namespace WTF {
template<>
struct LogArgument<WebCore::SourceBufferEvictionData> {
    static String toString(const WebCore::SourceBufferEvictionData& evictionData)
    {
        return makeString("{ contentSize:"_s, evictionData.contentSize, " evictableData:"_s, evictionData.evictableSize, " maximumBufferSize:"_s, evictionData.maximumBufferSize, " numSamples:"_s, evictionData.numMediaSamples, " }"_s);
    }
};

} // namespace WTF

#endif // ENABLE(MEDIA_SOURCE)
