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

#ifndef MediaPlaybackTargetPicker_h
#define MediaPlaybackTargetPicker_h

#if ENABLE(WIRELESS_PLAYBACK_TARGET)

#include "PlatformView.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Ref.h>
#include <wtf/RunLoop.h>

namespace WebCore {

class FloatRect;
class MediaPlaybackTarget;

class MediaPlaybackTargetPicker : public CanMakeCheckedPtr<MediaPlaybackTargetPicker> {
    WTF_MAKE_FAST_ALLOCATED;
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(MediaPlaybackTargetPicker);
public:
    class Client {
    protected:
        virtual ~Client() = default;

    public:
        virtual void setPlaybackTarget(Ref<MediaPlaybackTarget>&&) = 0;
        virtual void externalOutputDeviceAvailableDidChange(bool) = 0;
        virtual void playbackTargetPickerWasDismissed() = 0;
    };

    virtual ~MediaPlaybackTargetPicker();

    virtual void showPlaybackTargetPicker(PlatformView*, const FloatRect&, bool checkActiveRoute, bool useDarkAppearance);
    virtual void startingMonitoringPlaybackTargets();
    virtual void stopMonitoringPlaybackTargets();
    virtual void invalidatePlaybackTargets();

    void availableDevicesDidChange() { addPendingAction(OutputDeviceAvailabilityChanged); }
    void currentDeviceDidChange() { addPendingAction(CurrentDeviceDidChange); }
    void playbackTargetPickerWasDismissed() { addPendingAction(PlaybackTargetPickerWasDismissed); }

protected:
    explicit MediaPlaybackTargetPicker(Client&);

    enum ActionType {
        OutputDeviceAvailabilityChanged = 1 << 0,
        CurrentDeviceDidChange = 1 << 1,
        PlaybackTargetPickerWasDismissed = 1 << 2,
    };
    typedef unsigned PendingActionFlags;

    void addPendingAction(PendingActionFlags);
    void pendingActionTimerFired();
    Client* client() const { return m_client; }
    void setClient(Client* client) { m_client = client; }

private:
    virtual bool externalOutputDeviceAvailable() = 0;
    virtual Ref<MediaPlaybackTarget> playbackTarget() = 0;

    PendingActionFlags m_pendingActionFlags { 0 };
    Client* m_client;
    RunLoop::Timer m_pendingActionTimer;
};

} // namespace WebCore

#endif // ENABLE(WIRELESS_PLAYBACK_TARGET)

#endif // MediaPlaybackTargetPicker_h
