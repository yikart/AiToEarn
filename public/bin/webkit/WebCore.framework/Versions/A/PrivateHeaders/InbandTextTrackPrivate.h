/*
 * Copyright (C) 2012-2020 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "InbandTextTrackPrivateClient.h"
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

enum class InbandTextTrackPrivateMode : uint8_t {
    Disabled,
    Hidden,
    Showing
};

class InbandTextTrackPrivate : public TrackPrivateBase {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(InbandTextTrackPrivate);
public:
    enum class CueFormat : uint8_t {
        Data,
        Generic,
        WebVTT
    };
    static Ref<InbandTextTrackPrivate> create(CueFormat format) { return adoptRef(*new InbandTextTrackPrivate(format)); }
    virtual ~InbandTextTrackPrivate() = default;

    using Mode = InbandTextTrackPrivateMode;
    virtual void setMode(Mode mode) { m_mode = mode; };
    virtual InbandTextTrackPrivate::Mode mode() const { return m_mode; }

    enum class Kind : uint8_t {
        Subtitles,
        Captions,
        Descriptions,
        Chapters,
        Metadata,
        Forced,
        None
    };
    virtual Kind kind() const { return Kind::Subtitles; }

    virtual bool isClosedCaptions() const { return false; }
    virtual bool isSDH() const { return false; }
    virtual bool containsOnlyForcedSubtitles() const { return false; }
    virtual bool isMainProgramContent() const { return true; }
    virtual bool isEasyToRead() const { return false; }
    virtual bool isDefault() const { return false; }
    AtomString label() const override { return emptyAtom(); }
    AtomString language() const override { return emptyAtom(); }
    std::optional<AtomString> trackUID() const override { return emptyAtom(); }
    virtual AtomString inBandMetadataTrackDispatchType() const { return emptyAtom(); }

    CueFormat cueFormat() const { return m_format; }
    
    bool operator==(const InbandTextTrackPrivate& track) const
    {
        return TrackPrivateBase::operator==(track)
            && cueFormat() == track.cueFormat()
            && kind() == track.kind()
            && isClosedCaptions() == track.isClosedCaptions()
            && isSDH() == track.isSDH()
            && containsOnlyForcedSubtitles() == track.containsOnlyForcedSubtitles()
            && isMainProgramContent() == track.isMainProgramContent()
            && isEasyToRead() == track.isEasyToRead()
            && isDefault() == track.isDefault()
            && inBandMetadataTrackDispatchType() == track.inBandMetadataTrackDispatchType();
    }

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const override { return "InbandTextTrackPrivate"_s; }
#endif

    Type type() const final { return Type::Text; };

protected:
    InbandTextTrackPrivate(CueFormat format)
        : m_format(format)
    {
    }

private:
    CueFormat m_format;
    Mode m_mode { Mode::Disabled };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::InbandTextTrackPrivate)
static bool isType(const WebCore::TrackPrivateBase& track) { return track.type() == WebCore::TrackPrivateBase::Type::Text; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(VIDEO)

