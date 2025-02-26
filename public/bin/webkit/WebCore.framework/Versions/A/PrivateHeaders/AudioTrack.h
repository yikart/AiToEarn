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

#include "AudioTrackPrivateClient.h"
#include "TrackBase.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {

class AudioTrackClient;
class AudioTrackConfiguration;
class AudioTrackList;

class AudioTrack final : public MediaTrackBase, private AudioTrackPrivateClient {
    WTF_MAKE_TZONE_ALLOCATED(AudioTrack);
public:
    static Ref<AudioTrack> create(ScriptExecutionContext* context, AudioTrackPrivate& trackPrivate)
    {
        return adoptRef(*new AudioTrack(context, trackPrivate));
    }
    virtual ~AudioTrack();

    static const AtomString& descriptionKeyword();
    static const AtomString& mainDescKeyword();
    static const AtomString& translationKeyword();

    bool enabled() const final { return m_enabled; }
    void setEnabled(const bool);

    void addClient(AudioTrackClient&);
    void clearClient(AudioTrackClient&);

    size_t inbandTrackIndex() const;

    const AudioTrackPrivate& privateTrack() const { return m_private; }
    void setPrivate(AudioTrackPrivate&);

    void setLanguage(const AtomString&) final;

    AudioTrackConfiguration& configuration() const { return m_configuration; }

#if !RELEASE_LOG_DISABLED
    void setLogger(const Logger&, uint64_t) final;
#endif

private:
    AudioTrack(ScriptExecutionContext*, AudioTrackPrivate&);

    bool isValidKind(const AtomString&) const final;

    // AudioTrackPrivateClient
    void enabledChanged(bool) final;
    void configurationChanged(const PlatformAudioTrackConfiguration&) final;

    // TrackPrivateBaseClient
    void idChanged(TrackID) final;
    void labelChanged(const AtomString&) final;
    void languageChanged(const AtomString&) final;
    void willRemove() final;

    void updateKindFromPrivate();
    void updateConfigurationFromPrivate();

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const final { return "AudioTrack"_s; }
#endif

    WeakPtr<AudioTrackList> m_audioTrackList;
    WeakHashSet<AudioTrackClient> m_clients;
    Ref<AudioTrackPrivate> m_private;
    bool m_enabled { false };

    Ref<AudioTrackConfiguration> m_configuration;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::AudioTrack)
    static bool isType(const WebCore::TrackBase& track) { return track.type() == WebCore::TrackBase::AudioTrack; }
SPECIALIZE_TYPE_TRAITS_END()

#endif
