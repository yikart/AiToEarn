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

#ifndef MediaPlaybackTargetPickerMac_h
#define MediaPlaybackTargetPickerMac_h

#if ENABLE(WIRELESS_PLAYBACK_TARGET) && !PLATFORM(IOS_FAMILY)

#include "AVPlaybackTargetPicker.h"
#include "MediaPlaybackTargetPicker.h"
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class MediaPlaybackTargetPickerMac final : public MediaPlaybackTargetPicker, public AVPlaybackTargetPickerClient {
    WTF_MAKE_TZONE_ALLOCATED(MediaPlaybackTargetPickerMac);
    WTF_MAKE_NONCOPYABLE(MediaPlaybackTargetPickerMac);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(MediaPlaybackTargetPickerMac);
public:
    explicit MediaPlaybackTargetPickerMac(MediaPlaybackTargetPicker::Client&);
    virtual ~MediaPlaybackTargetPickerMac();

    void showPlaybackTargetPicker(PlatformView*, const FloatRect&, bool checkActiveRoute, bool useDarkAppearance) final;
    void startingMonitoringPlaybackTargets() final;
    void stopMonitoringPlaybackTargets() final;
    void invalidatePlaybackTargets() final;

private:
    bool externalOutputDeviceAvailable() final;
    Ref<MediaPlaybackTarget> playbackTarget() final;

    // AVPlaybackTargetPickerClient
    void pickerWasDismissed() final;
    void availableDevicesChanged() final;
    void currentDeviceChanged() final;

    AVPlaybackTargetPicker& routePicker();

    std::unique_ptr<AVPlaybackTargetPicker> m_routePicker;
};

} // namespace WebCore

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET)

#endif // WebContextMenuProxyMac_h
