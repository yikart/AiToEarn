/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#include <wtf/TZoneMallocInlines.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

enum class MediaPlaybackTargetContextMockState : uint8_t {
    Unknown = 0,
    OutputDeviceUnavailable = 1,
    OutputDeviceAvailable = 2,
};

enum class MediaPlaybackTargetContextType : uint8_t {
    AVOutputContext,
    Mock,
    Serialized,
};

class MediaPlaybackTargetContext {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(MediaPlaybackTargetContext);
public:
    using Type = MediaPlaybackTargetContextType;
    using MockState = MediaPlaybackTargetContextMockState;

    WEBCORE_EXPORT virtual ~MediaPlaybackTargetContext() = default;

    Type type() const { return m_type; }
    WEBCORE_EXPORT virtual String deviceName() const = 0;
    WEBCORE_EXPORT virtual bool hasActiveRoute() const = 0;
    WEBCORE_EXPORT virtual bool supportsRemoteVideoPlayback() const = 0;

protected:
    MediaPlaybackTargetContext(Type type)
        : m_type(type)
    {
    }

private:
    // This should be const, however IPC's Decoder's handling doesn't allow for const member.
    Type m_type;
};

} // namespace WebCore

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET)
