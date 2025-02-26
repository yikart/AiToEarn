/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef MediaPlaybackTargetPickerMock_h
#define MediaPlaybackTargetPickerMock_h

#if ENABLE(WIRELESS_PLAYBACK_TARGET) && !PLATFORM(IOS_FAMILY)

#include "MediaPlaybackTargetContext.h"
#include "MediaPlaybackTargetPicker.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace WebCore {
class MediaPlaybackTargetPickerMock;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::MediaPlaybackTargetPickerMock> : std::true_type { };
}

namespace WebCore {

class MediaPlaybackTargetPickerMock final : public MediaPlaybackTargetPicker, public CanMakeWeakPtr<MediaPlaybackTargetPickerMock> {
    WTF_MAKE_TZONE_ALLOCATED(MediaPlaybackTargetPickerMock);
    WTF_MAKE_NONCOPYABLE(MediaPlaybackTargetPickerMock);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(MediaPlaybackTargetPickerMock);
public:
    explicit MediaPlaybackTargetPickerMock(MediaPlaybackTargetPicker::Client&);

    virtual ~MediaPlaybackTargetPickerMock();

    void showPlaybackTargetPicker(PlatformView*, const FloatRect&, bool checkActiveRoute, bool useDarkAppearance) override;
    void startingMonitoringPlaybackTargets() override;
    void stopMonitoringPlaybackTargets() override;
    void invalidatePlaybackTargets() override;

    void setState(const String&, MediaPlaybackTargetContext::MockState);
    void dismissPopup();

private:
    bool externalOutputDeviceAvailable() override;
    Ref<MediaPlaybackTarget> playbackTarget() override;

    String m_deviceName;
    MediaPlaybackTargetContext::MockState m_state { MediaPlaybackTargetContext::MockState::Unknown };
    bool m_showingMenu { false };
};

} // namespace WebCore

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET) && !PLATFORM(IOS_FAMILY)

#endif // WebContextMenuProxyMac_h
