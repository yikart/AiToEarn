/*
 * Copyright (C) 2012-2014 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO) && USE(AVFOUNDATION)

#include "InbandTextTrackPrivateAVF.h"
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS AVAsset;
OBJC_CLASS AVMediaSelectionGroup;
OBJC_CLASS AVMediaSelectionOption;

namespace WebCore {

class InbandTextTrackPrivateAVFObjC : public InbandTextTrackPrivateAVF {
    WTF_MAKE_TZONE_ALLOCATED(InbandTextTrackPrivateAVFObjC);
public:
    static Ref<InbandTextTrackPrivateAVFObjC> create(AVFInbandTrackParent* player,  AVMediaSelectionGroup *group, AVMediaSelectionOption *selection, TrackID trackID, InbandTextTrackPrivate::CueFormat format)
    {
        return adoptRef(*new InbandTextTrackPrivateAVFObjC(player, group, selection, trackID, format));
    }

    ~InbandTextTrackPrivateAVFObjC() = default;

    InbandTextTrackPrivate::Kind kind() const override;
    bool isClosedCaptions() const override;
    bool isSDH() const override;
    bool containsOnlyForcedSubtitles() const override;
    bool isMainProgramContent() const override;
    bool isEasyToRead() const override;
    AtomString label() const override;
    AtomString language() const override;
    bool isDefault() const override;

    void disconnect() override;

    Category textTrackCategory() const override { return InBand; }
    
    AVMediaSelectionOption *mediaSelectionOption() const { return m_mediaSelectionOption.get(); }

protected:
    InbandTextTrackPrivateAVFObjC(AVFInbandTrackParent*, AVMediaSelectionGroup *, AVMediaSelectionOption *, TrackID, InbandTextTrackPrivate::CueFormat);
    
    RetainPtr<AVMediaSelectionGroup> m_mediaSelectionGroup;
    RetainPtr<AVMediaSelectionOption> m_mediaSelectionOption;
};

}

#endif
