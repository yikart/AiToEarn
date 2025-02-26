/*
 * Copyright (C) 2012-2017 Apple Inc. All rights reserved.
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

#include "PlatformVideoTrackConfiguration.h"
#include "TrackPrivateBase.h"
#include "VideoTrackPrivateClient.h"
#include <wtf/Function.h>
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

struct VideoInfo;

class VideoTrackPrivate : public TrackPrivateBase {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(VideoTrackPrivate);
public:
    virtual void setSelected(bool selected)
    {
        if (m_selected == selected)
            return;
        m_selected = selected;
        notifyClients([selected](auto& client) {
            downcast<VideoTrackPrivateClient>(client).selectedChanged(selected);
        });
        if (m_selectedChangedCallback)
            m_selectedChangedCallback(*this, m_selected);
    }
    virtual bool selected() const { return m_selected; }

    enum class Kind : uint8_t { Alternative, Captions, Main, Sign, Subtitles, Commentary, None };
    virtual Kind kind() const { return Kind::None; }

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "VideoTrackPrivate"_s; }
#endif

    using SelectedChangedCallback = Function<void(VideoTrackPrivate&, bool selected)>;
    void setSelectedChangedCallback(SelectedChangedCallback&& callback) { m_selectedChangedCallback = WTFMove(callback); }

    const PlatformVideoTrackConfiguration& configuration() const { return m_configuration; }
    void setConfiguration(PlatformVideoTrackConfiguration&& configuration)
    {
        if (configuration == m_configuration)
            return;
        m_configuration = WTFMove(configuration);
        notifyClients([configuration = m_configuration](auto& client) {
            downcast<VideoTrackPrivateClient>(client).configurationChanged(configuration);
        });
    }
    
    bool operator==(const VideoTrackPrivate& track) const
    {
        return TrackPrivateBase::operator==(track)
            && configuration() == track.configuration()
            && kind() == track.kind();
    }

    Type type() const final { return Type::Video; }

    virtual void setFormatDescription(Ref<VideoInfo>&&) { }

protected:
    VideoTrackPrivate() = default;

private:
    bool m_selected { false };
    PlatformVideoTrackConfiguration m_configuration;

    SelectedChangedCallback m_selectedChangedCallback;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::VideoTrackPrivate)
static bool isType(const WebCore::TrackPrivateBase& track) { return track.type() == WebCore::TrackPrivateBase::Type::Video; }
SPECIALIZE_TYPE_TRAITS_END()

#endif
