/*
 * Copyright (C) 2013-2022 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM) && USE(AVFOUNDATION)

#include "CaptureDeviceManager.h"
#include "RealtimeMediaSource.h"
#include "RealtimeMediaSourceSupportedConstraints.h"
#include <wtf/NeverDestroyed.h>
#include <wtf/RetainPtr.h>
#include <wtf/WorkQueue.h>
#include <wtf/text/WTFString.h>

OBJC_CLASS AVCaptureDevice;
OBJC_CLASS AVCaptureSession;
OBJC_CLASS NSArray;
OBJC_CLASS NSMutableArray;
OBJC_CLASS NSString;
OBJC_CLASS WebCoreAVCaptureDeviceManagerObserver;

namespace WebCore {

class AVCaptureDeviceManager final : public CaptureDeviceManager {
    friend class NeverDestroyed<AVCaptureDeviceManager>;
public:
    static AVCaptureDeviceManager& singleton();

    void refreshCaptureDevices() { refreshCaptureDevicesInternal([] { }, ShouldSetUserPreferredCamera::No); };

private:
    static bool isAvailable();

    AVCaptureDeviceManager();
    ~AVCaptureDeviceManager() final;

    void computeCaptureDevices(CompletionHandler<void()>&&) final;
    const Vector<CaptureDevice>& captureDevices() final;

    void registerForDeviceNotifications();
    void updateCachedAVCaptureDevices();
    Vector<CaptureDevice> retrieveCaptureDevices();
    RetainPtr<NSArray> currentCameras();

    enum class ShouldSetUserPreferredCamera : bool { No, Yes };
    void refreshCaptureDevicesInternal(CompletionHandler<void()>&&, ShouldSetUserPreferredCamera);
    void setUserPreferredCamera();

    RetainPtr<WebCoreAVCaptureDeviceManagerObserver> m_objcObserver;
    Vector<CaptureDevice> m_devices;
    RetainPtr<NSMutableArray> m_avCaptureDevices;
    RetainPtr<NSArray> m_avCaptureDeviceTypes;
    bool m_isInitialized { false };

    Ref<WorkQueue> m_dispatchQueue;
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM) && USE(AVFOUNDATION)
