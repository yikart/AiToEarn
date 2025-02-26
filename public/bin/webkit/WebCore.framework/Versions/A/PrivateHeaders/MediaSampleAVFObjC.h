/*
 * Copyright (C) 2016-2021 Apple Inc. All rights reserved.
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

#include "MediaSample.h"
#include <JavaScriptCore/Forward.h>
#include <pal/avfoundation/MediaTimeAVFoundation.h>
#include <wtf/Forward.h>
#include <wtf/TypeCasts.h>

using CVPixelBufferRef = struct __CVBuffer*;

namespace WebCore {

class SharedBuffer;
class PixelBuffer;
class VideoFrameCV;

class MediaSampleAVFObjC : public MediaSample {
public:
    static Ref<MediaSampleAVFObjC> create(CMSampleBufferRef sample, TrackID trackID) { return adoptRef(*new MediaSampleAVFObjC(sample, trackID)); }

    MediaTime presentationTime() const override;
    MediaTime decodeTime() const override;
    MediaTime duration() const override;

    TrackID trackID() const override { return m_id; }

    size_t sizeInBytes() const override;
    FloatSize presentationSize() const override;

    SampleFlags flags() const override;
    PlatformSample platformSample() const override;
    PlatformSample::Type platformSampleType() const override { return PlatformSample::CMSampleBufferType; }
    void offsetTimestampsBy(const MediaTime&) override;
    void setTimestamps(const MediaTime&, const MediaTime&) override;
    WEBCORE_EXPORT bool isDivisable() const override;
    Vector<Ref<MediaSampleAVFObjC>> divide();

    WEBCORE_EXPORT std::pair<RefPtr<MediaSample>, RefPtr<MediaSample>> divide(const MediaTime& presentationTime, UseEndTime) override;
    WEBCORE_EXPORT Ref<MediaSample> createNonDisplayingCopy() const override;

    CMSampleBufferRef sampleBuffer() const { return m_sample.get(); }

    bool isHomogeneous() const;
    Vector<Ref<MediaSampleAVFObjC>> divideIntoHomogeneousSamples();

#if ENABLE(ENCRYPTED_MEDIA) && HAVE(AVCONTENTKEYSESSION)
    using KeyIDs = Vector<Ref<SharedBuffer>>;
    void setKeyIDs(KeyIDs&& keyIDs) { m_keyIDs = WTFMove(keyIDs); }
    const KeyIDs& keyIDs() const { return m_keyIDs; }
    KeyIDs& keyIDs() { return m_keyIDs; }
#endif

    static bool isCMSampleBufferNonDisplaying(CMSampleBufferRef);

protected:
    WEBCORE_EXPORT MediaSampleAVFObjC(RetainPtr<CMSampleBufferRef>&&);
    WEBCORE_EXPORT MediaSampleAVFObjC(CMSampleBufferRef);
    WEBCORE_EXPORT MediaSampleAVFObjC(CMSampleBufferRef, TrackID);
    WEBCORE_EXPORT virtual ~MediaSampleAVFObjC();
    
    void commonInit();

    RetainPtr<CMSampleBufferRef> m_sample;
    TrackID m_id;
    
    MediaTime m_presentationTime;
    MediaTime m_decodeTime;
    MediaTime m_duration;

#if ENABLE(ENCRYPTED_MEDIA) && HAVE(AVCONTENTKEYSESSION)
    Vector<Ref<SharedBuffer>> m_keyIDs;
#endif
};

} // namespace WebCore

namespace WTF {

template<typename Type> struct LogArgument;
template <>
struct LogArgument<WebCore::MediaSampleAVFObjC> {
    static String toString(const WebCore::MediaSampleAVFObjC& sample)
    {
        return sample.toJSONString();
    }
};

} // namespace WTF

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MediaSampleAVFObjC)
static bool isType(const WebCore::MediaSample& sample) { return sample.platformSampleType() == WebCore::PlatformSample::CMSampleBufferType; }
SPECIALIZE_TYPE_TRAITS_END()
