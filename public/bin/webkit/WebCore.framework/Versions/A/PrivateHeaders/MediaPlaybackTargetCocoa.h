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
#include <wtf/RetainPtr.h>

OBJC_CLASS AVOutputContext;

namespace WebCore {

class WEBCORE_EXPORT MediaPlaybackTargetContextCocoa final : public MediaPlaybackTargetContext {
public:
    explicit MediaPlaybackTargetContextCocoa(RetainPtr<AVOutputContext>&&);
    ~MediaPlaybackTargetContextCocoa();

    RetainPtr<AVOutputContext> outputContext() const;
private:
    String deviceName() const final;
    bool hasActiveRoute() const final;
    bool supportsRemoteVideoPlayback() const final;

    RetainPtr<AVOutputContext> m_outputContext;
};

class MediaPlaybackTargetCocoa final : public MediaPlaybackTarget {
public:
    WEBCORE_EXPORT static Ref<MediaPlaybackTarget> create(MediaPlaybackTargetContextCocoa&&);

#if PLATFORM(IOS_FAMILY) && !PLATFORM(IOS_FAMILY_SIMULATOR) && !PLATFORM(MACCATALYST)
    WEBCORE_EXPORT static Ref<MediaPlaybackTargetCocoa> create();
#endif

    TargetType targetType() const final { return TargetType::AVFoundation; }
    const MediaPlaybackTargetContext& targetContext() const final { return m_context; }

    AVOutputContext* outputContext() { return m_context.outputContext().get(); }

private:
    explicit MediaPlaybackTargetCocoa(MediaPlaybackTargetContextCocoa&&);

    MediaPlaybackTargetContextCocoa m_context;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MediaPlaybackTargetContextCocoa)
static bool isType(const WebCore::MediaPlaybackTargetContext& context)
{
    return context.type() ==  WebCore::MediaPlaybackTargetContextType::AVOutputContext;
}
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MediaPlaybackTargetCocoa)
static bool isType(const WebCore::MediaPlaybackTarget& target)
{
    return target.targetType() ==  WebCore::MediaPlaybackTarget::TargetType::AVFoundation;
}
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET)
