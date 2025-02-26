/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_RECORDER)

#include <memory>
#include <optional>
#include <wtf/Deque.h>
#include <wtf/Forward.h>
#include <wtf/MediaTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>

typedef const struct opaqueCMFormatDescription* CMFormatDescriptionRef;
struct CGAffineTransform;

namespace WebCore {

class MediaSamplesBlock;
struct AudioInfo;
struct VideoInfo;

class MediaRecorderPrivateWriterListener : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<MediaRecorderPrivateWriterListener> {
public:
    virtual void appendData(std::span<const uint8_t>) = 0;
    virtual ~MediaRecorderPrivateWriterListener() = default;
};

class MediaRecorderPrivateWriter {
    WTF_MAKE_TZONE_ALLOCATED(MediaRecorderPrivateWriter);
public:
    WEBCORE_EXPORT static std::unique_ptr<MediaRecorderPrivateWriter> create(String type, MediaRecorderPrivateWriterListener&);

    WEBCORE_EXPORT MediaRecorderPrivateWriter();
    WEBCORE_EXPORT virtual ~MediaRecorderPrivateWriter();

    virtual std::optional<uint8_t> addAudioTrack(const AudioInfo&) = 0;
    virtual std::optional<uint8_t> addVideoTrack(const VideoInfo&, const std::optional<CGAffineTransform>&) = 0;
    virtual bool allTracksAdded() = 0;
    enum class Result : uint8_t { Success, Failure, NotReady };
    using WriterPromise = NativePromise<void, Result>;
    WEBCORE_EXPORT virtual Ref<WriterPromise> writeFrames(Deque<UniqueRef<MediaSamplesBlock>>&&, const MediaTime&);
    WEBCORE_EXPORT virtual Ref<GenericPromise> close();

private:
    virtual Result writeFrame(const MediaSamplesBlock&) = 0;
    virtual void forceNewSegment(const MediaTime&) = 0;
    virtual Ref<GenericPromise> close(const MediaTime&) = 0;
    Deque<UniqueRef<MediaSamplesBlock>> m_pendingFrames;
    MediaTime m_lastEndTime { MediaTime::invalidTime() };
};

} // namespace WebCore

#endif // ENABLE(MEDIA_RECORDER)
