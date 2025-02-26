/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

#if ENABLE(WIRELESS_PLAYBACK_TARGET)

#include "MediaPlaybackTarget.h"
#include <wtf/text/WTFString.h>

namespace WebCore {

class MediaPlaybackTargetContextMock final : public MediaPlaybackTargetContext {
public:
    using State = MediaPlaybackTargetContextMockState;

    MediaPlaybackTargetContextMock(const String& mockDeviceName, State mockState)
        : MediaPlaybackTargetContext(Type::Mock)
        , m_mockDeviceName(mockDeviceName)
        , m_mockState(mockState)
    {
    }

    State state() const
    {
        return m_mockState;
    }

    String deviceName() const final { return m_mockDeviceName; }
    bool hasActiveRoute() const final { return !m_mockDeviceName.isEmpty(); }
    bool supportsRemoteVideoPlayback() const final { return !m_mockDeviceName.isEmpty(); }

private:
    String m_mockDeviceName;
    State m_mockState { State::Unknown };
};

class MediaPlaybackTargetMock final : public MediaPlaybackTarget {
public:
    WEBCORE_EXPORT static Ref<MediaPlaybackTarget> create(MediaPlaybackTargetContextMock&&);

    MediaPlaybackTargetContextMock::State state() const { return m_context.state(); }

private:
    explicit MediaPlaybackTargetMock(MediaPlaybackTargetContextMock&&);
    TargetType targetType() const final { return MediaPlaybackTarget::TargetType::Mock; }
    const MediaPlaybackTargetContext& targetContext() const final { return m_context; }

    MediaPlaybackTargetContextMock m_context;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MediaPlaybackTargetContextMock)
static bool isType(const WebCore::MediaPlaybackTargetContext& context)
{
    return context.type() ==  WebCore::MediaPlaybackTargetContextType::Mock;
}
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MediaPlaybackTargetMock)
static bool isType(const WebCore::MediaPlaybackTarget& target)
{
    return target.targetType() ==  WebCore::MediaPlaybackTarget::TargetType::Mock;
}
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET)
