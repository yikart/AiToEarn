/*
 * Copyright (C) 2012-2015 Apple Inc. All rights reserved.
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

#ifndef InbandTextTrackPrivateAVF_h
#define InbandTextTrackPrivateAVF_h

#if ENABLE(VIDEO) && (USE(AVFOUNDATION) || PLATFORM(IOS_FAMILY))

#include "InbandTextTrackPrivate.h"
#include "InbandTextTrackPrivateClient.h"
#include <wtf/TZoneMalloc.h>

typedef const struct opaqueCMFormatDescription* CMFormatDescriptionRef;

namespace JSC {
class ArrayBuffer;
}

namespace WebCore {

class AVFInbandTrackParent {
public:
    virtual ~AVFInbandTrackParent();
    
    virtual void trackModeChanged() = 0;
};

class InbandTextTrackPrivateAVF : public InbandTextTrackPrivate {
    WTF_MAKE_TZONE_ALLOCATED(InbandTextTrackPrivateAVF);
public:
    virtual ~InbandTextTrackPrivateAVF();

    TrackID id() const final { return m_trackID; }

    void setMode(InbandTextTrackPrivate::Mode) override;

    int trackIndex() const override { return m_index; }
    void setTextTrackIndex(int index) { m_index = index; }

    virtual void disconnect();

    bool hasBeenReported() const { return m_hasBeenReported; }
    void setHasBeenReported(bool reported) { m_hasBeenReported = reported; }

    virtual void processCue(CFArrayRef attributedStrings, CFArrayRef nativeSamples, const MediaTime&);
    virtual void resetCueValues();

    void beginSeeking();
    void endSeeking() { m_seeking = false; }
    bool seeking() const { return m_seeking; }
    
    enum Category {
        LegacyClosedCaption,
        OutOfBand,
        InBand
    };
    virtual Category textTrackCategory() const = 0;
    
    MediaTime startTimeVariance() const override { return MediaTime(1, 4); }

    virtual bool readNativeSampleBuffer(CFArrayRef nativeSamples, CFIndex, RefPtr<JSC::ArrayBuffer>&, MediaTime&, CMFormatDescriptionRef&);
    
protected:
    InbandTextTrackPrivateAVF(AVFInbandTrackParent*, TrackID, CueFormat);

    Ref<InbandGenericCue> processCueAttributes(CFAttributedStringRef);
    void processAttributedStrings(CFArrayRef, const MediaTime&);
    void processNativeSamples(CFArrayRef, const MediaTime&);
    void removeCompletedCues();

    Vector<uint8_t> m_sampleInputBuffer;

private:
#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "InbandTextTrackPrivateAVF"_s; }
#endif

    MediaTime m_currentCueStartTime;
    MediaTime m_currentCueEndTime;

    Vector<Ref<InbandGenericCue>> m_cues;
    AVFInbandTrackParent* m_owner;

    enum PendingCueStatus {
        None,
        DeliveredDuringSeek,
        Valid
    };
    PendingCueStatus m_pendingCueStatus;

    int m_index;
    bool m_hasBeenReported;
    bool m_seeking;
    bool m_haveReportedVTTHeader;
    const TrackID m_trackID { 0 };
};

} // namespace WebCore

#endif //  ENABLE(VIDEO) && (USE(AVFOUNDATION) || PLATFORM(IOS_FAMILY))

#endif // InbandTextTrackPrivateAVF_h
