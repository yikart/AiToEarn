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

#include "AudioTrackPrivateClient.h"
#include "PlatformAudioTrackConfiguration.h"
#include "TrackPrivateBase.h"
#include <wtf/Function.h>
#include <wtf/TZoneMallocInlines.h>

#if ENABLE(VIDEO)

namespace WebCore {

struct AudioInfo;

class AudioTrackPrivate : public TrackPrivateBase {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(AudioTrackPrivate);
public:
    virtual void setEnabled(bool enabled)
    {
        if (m_enabled == enabled)
            return;
        m_enabled = enabled;
        notifyClients([enabled](auto& client) {
            downcast<AudioTrackPrivateClient>(client).enabledChanged(enabled);
        });
        if (m_enabledChangedCallback)
            m_enabledChangedCallback(*this, m_enabled);
    }

    bool enabled() const { return m_enabled; }

    enum class Kind : uint8_t { Alternative, Description, Main, MainDesc, Translation, Commentary, None };
    virtual Kind kind() const { return Kind::None; }

    virtual bool isBackedByMediaStreamTrack() const { return false; }

    using EnabledChangedCallback = Function<void(AudioTrackPrivate&, bool enabled)>;
    void setEnabledChangedCallback(EnabledChangedCallback&& callback) { m_enabledChangedCallback = WTFMove(callback); }

    const PlatformAudioTrackConfiguration& configuration() const { return m_configuration; }
    void setConfiguration(PlatformAudioTrackConfiguration&& configuration)
    {
        if (configuration == m_configuration)
            return;
        m_configuration = WTFMove(configuration);
        notifyClients([configuration = m_configuration](auto& client) {
            downcast<AudioTrackPrivateClient>(client).configurationChanged(configuration);
        });
    }

    virtual void setFormatDescription(Ref<AudioInfo>&&) { }

    bool operator==(const AudioTrackPrivate& track) const
    {
        return TrackPrivateBase::operator==(track)
            && configuration() == track.configuration()
            && kind() == track.kind();
    }

#if !RELEASE_LOG_DISABLED
    ASCIILiteral logClassName() const override { return "AudioTrackPrivate"_s; }
#endif

    Type type() const final { return Type::Audio; }

protected:
    AudioTrackPrivate() = default;

private:
    bool m_enabled { false };
    PlatformAudioTrackConfiguration m_configuration;
    EnabledChangedCallback m_enabledChangedCallback;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::AudioTrackPrivate)
static bool isType(const WebCore::TrackPrivateBase& track) { return track.type() == WebCore::TrackPrivateBase::Type::Audio; }
SPECIALIZE_TYPE_TRAITS_END()

#endif
