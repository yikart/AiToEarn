/*
 * Copyright (C) 2018-2024 Apple Inc. All rights reserved.
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

#include "MediaRecorderPrivateWriter.h"
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS AVAssetWriter;
OBJC_CLASS AVAssetWriterInput;
OBJC_CLASS WebAVAssetWriterDelegate;
typedef const struct opaqueCMFormatDescription *CMFormatDescriptionRef;

namespace WebCore {

class MediaRecorderPrivateWriterAVFObjC : public MediaRecorderPrivateWriter {
    WTF_MAKE_TZONE_ALLOCATED(MediaRecorderPrivateWriterAVFObjC);
public:
    static std::unique_ptr<MediaRecorderPrivateWriter> create(MediaRecorderPrivateWriterListener&);
    ~MediaRecorderPrivateWriterAVFObjC();

private:
    MediaRecorderPrivateWriterAVFObjC(RetainPtr<AVAssetWriter>&&, MediaRecorderPrivateWriterListener&);

    std::optional<uint8_t> addAudioTrack(const AudioInfo&) final;
    std::optional<uint8_t> addVideoTrack(const VideoInfo&, const std::optional<CGAffineTransform>&) final;
    bool allTracksAdded() final;
    Result writeFrame(const MediaSamplesBlock&) final;
    void forceNewSegment(const WTF::MediaTime&) final;
    Ref<GenericPromise> close(const WTF::MediaTime&) final;

    RetainPtr<AVAssetWriterInput> m_audioAssetWriterInput;
    RetainPtr<AVAssetWriterInput> m_videoAssetWriterInput;
    bool m_hasAddedVideoFrame { false };

    uint8_t m_currentTrackIndex { 0 };
    uint8_t m_audioTrackIndex { 0 };
    uint8_t m_videoTrackIndex  { 0 };
    RetainPtr<CMFormatDescriptionRef> m_audioDescription;
    RetainPtr<CMFormatDescriptionRef> m_videoDescription;
    const RetainPtr<WebAVAssetWriterDelegate> m_delegate;
    const RetainPtr<AVAssetWriter> m_writer;
};

} // namespace WebCore

#endif // ENABLE(MEDIA_RECORDER)
