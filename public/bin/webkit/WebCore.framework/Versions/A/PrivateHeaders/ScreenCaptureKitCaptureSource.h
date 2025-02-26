/*
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
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

#if HAVE(SCREEN_CAPTURE_KIT)

#include "DisplayCaptureManager.h"
#include "DisplayCaptureSourceCocoa.h"
#include "ScreenCaptureKitSharingSessionManager.h"
#include <wtf/BlockPtr.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/OSObjectPtr.h>
#include <wtf/RetainPtr.h>

OBJC_CLASS NSDictionary;
OBJC_CLASS NSError;
OBJC_CLASS SCDisplay;
OBJC_CLASS SCShareableContent;
OBJC_CLASS SCStream;
OBJC_CLASS SCContentFilter;
OBJC_CLASS SCContentSharingSession;
OBJC_CLASS SCStreamConfiguration;
OBJC_CLASS SCWindow;
OBJC_CLASS WebCoreScreenCaptureKitHelper;
using CMSampleBufferRef = struct opaqueCMSampleBuffer*;

namespace WebCore {

class ImageTransferSessionVT;

class ScreenCaptureKitCaptureSource final
    : public DisplayCaptureSourceCocoa::Capturer
    , public ScreenCaptureSessionSourceObserver {
public:
    static Expected<uint32_t, CaptureSourceError> computeDeviceID(const CaptureDevice&);

    ScreenCaptureKitCaptureSource(CapturerObserver&, const CaptureDevice&, uint32_t);
    virtual ~ScreenCaptureKitCaptureSource();

    WEBCORE_EXPORT static bool isAvailable();

    static std::optional<CaptureDevice> screenCaptureDeviceWithPersistentID(const String&);
    static std::optional<CaptureDevice> windowCaptureDeviceWithPersistentID(const String&);

    using Content = std::variant<RetainPtr<SCWindow>, RetainPtr<SCDisplay>>;
    void streamDidOutputVideoSampleBuffer(RetainPtr<CMSampleBufferRef>);
    void sessionFailedWithError(RetainPtr<NSError>&&, const String&);
    void outputVideoEffectDidStartForStream() { m_isVideoEffectEnabled = true; }
    void outputVideoEffectDidStopForStream() { m_isVideoEffectEnabled = false; }

private:
    // DisplayCaptureSourceCocoa::Capturer
    bool start() final;
    void stop() final { stopInternal([] { }); }
    void end() final;
    DisplayCaptureSourceCocoa::DisplayFrameType generateFrame() final;
    CaptureDevice::DeviceType deviceType() const final;
    DisplaySurfaceType surfaceType() const final;
    void commitConfiguration(const RealtimeMediaSourceSettings&) final;
    IntSize intrinsicSize() const final;
    void whenReady(CompletionHandler<void(CaptureSourceError&&)>&&) final;

    // LoggerHelper
    ASCIILiteral logClassName() const final { return "ScreenCaptureKitCaptureSource"_s; }

    // ScreenCaptureKitSharingSessionManager::Observer
    void sessionFilterDidChange(SCContentFilter*) final;
    void sessionStreamDidEnd(SCStream*) final;

    void stopInternal(CompletionHandler<void()>&&);
    void startContentStream();
    void findShareableContent();
    RetainPtr<SCStreamConfiguration> streamConfiguration();
    void updateStreamConfiguration();

    dispatch_queue_t captureQueue();

    SCStream* contentStream() const { return m_sessionSource ? m_sessionSource->stream() : nullptr; }
    SCContentFilter* contentFilter() const { return m_sessionSource ? m_sessionSource->contentFilter() : nullptr; }

    void clearSharingSession();

    std::optional<Content> m_content;
    RetainPtr<WebCoreScreenCaptureKitHelper> m_captureHelper;
    RetainPtr<SCContentSharingSession> m_sharingSession;
    RetainPtr<SCContentFilter> m_contentFilter;
    RetainPtr<CMSampleBufferRef> m_currentFrame;
    RefPtr<ScreenCaptureSessionSource> m_sessionSource;
    RetainPtr<SCStreamConfiguration> m_streamConfiguration;
    OSObjectPtr<dispatch_queue_t> m_captureQueue;
    CaptureDevice m_captureDevice;
    uint32_t m_deviceID { 0 };
    mutable std::optional<IntSize> m_intrinsicSize;
    std::unique_ptr<ImageTransferSessionVT> m_transferSession;

    FloatSize m_contentSize;
    uint32_t m_width { 0 };
    uint32_t m_height { 0 };
    float m_frameRate { 0 };
    bool m_isRunning { false };
    bool m_isVideoEffectEnabled { false };
    bool m_didReceiveVideoFrame { false };
    CompletionHandler<void(CaptureSourceError&&)> m_whenReadyCallback;
};

} // namespace WebCore

#endif // HAVE(SCREEN_CAPTURE_KIT)
