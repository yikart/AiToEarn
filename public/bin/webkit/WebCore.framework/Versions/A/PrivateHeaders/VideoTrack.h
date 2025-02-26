/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2011-2020 Apple Inc. All rights reserved.
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

#include "TrackBase.h"
#include "VideoTrackPrivateClient.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {

class MediaDescription;
class VideoTrack;
class VideoTrackClient;
class VideoTrackConfiguration;
class VideoTrackList;
class VideoTrackPrivate;

class VideoTrack final : public MediaTrackBase, private VideoTrackPrivateClient {
    WTF_MAKE_TZONE_ALLOCATED(VideoTrack);
public:
    static Ref<VideoTrack> create(ScriptExecutionContext* context, VideoTrackPrivate& trackPrivate)
    {
        return adoptRef(*new VideoTrack(context, trackPrivate));
    }
    virtual ~VideoTrack();

    static const AtomString& signKeyword();

    bool selected() const { return m_selected; }
    virtual void setSelected(const bool);

    void addClient(VideoTrackClient&);
    void clearClient(VideoTrackClient&);

    size_t inbandTrackIndex();

    void setKind(const AtomString&) final;
    void setLanguage(const AtomString&) final;

    const MediaDescription& description() const;

    VideoTrackConfiguration& configuration() const { return m_configuration; }

    void setPrivate(VideoTrackPrivate&);
#if !RELEASE_LOG_DISABLED
    void setLogger(const Logger&, uint64_t) final;
#endif

private:
    VideoTrack(ScriptExecutionContext*, VideoTrackPrivate&);

    bool isValidKind(const AtomString&) const final;

    // VideoTrackPrivateClient
    void selectedChanged(bool) final;
    void configurationChanged(const PlatformVideoTrackConfiguration&) final;

    // TrackPrivateBaseClient
    void idChanged(TrackID) final;
    void labelChanged(const AtomString&) final;
    void languageChanged(const AtomString&) final;
    void willRemove() final;

    bool enabled() const final { return selected(); }

    void updateKindFromPrivate();
    void updateConfigurationFromPrivate();

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "VideoTrack"_s; }
#endif

    WeakPtr<VideoTrackList> m_videoTrackList;
    WeakHashSet<VideoTrackClient> m_clients;
    Ref<VideoTrackPrivate> m_private;
    Ref<VideoTrackConfiguration> m_configuration;
    bool m_selected { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::VideoTrack)
    static bool isType(const WebCore::TrackBase& track) { return track.type() == WebCore::TrackBase::VideoTrack; }
SPECIALIZE_TYPE_TRAITS_END()

#endif
