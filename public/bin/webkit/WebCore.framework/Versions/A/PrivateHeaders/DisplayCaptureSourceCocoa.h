/*
 * Copyright (C) 2017-2022 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM) && PLATFORM(COCOA)

#include "CaptureDevice.h"
#include "RealtimeMediaSource.h"
#include "RealtimeMediaSourceSettings.h"
#include "UserActivity.h"
#include <wtf/AbstractRefCountedAndCanMakeWeakPtr.h>
#include <wtf/Observer.h>
#include <wtf/RefPtr.h>
#include <wtf/RunLoop.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/text/WTFString.h>

using CGImageRef = CGImage*;
using CVPixelBufferRef = struct __CVBuffer*;
using IOSurfaceRef = struct __IOSurface*;
using CMSampleBufferRef = struct opaqueCMSampleBuffer*;

namespace WebCore {
class CapturerObserver;
}

namespace WTF {
class MediaTime;
}

namespace WebCore {

class CaptureDeviceInfo;
class ImageTransferSessionVT;
class PixelBufferConformerCV;

class CapturerObserver : public AbstractRefCountedAndCanMakeWeakPtr<CapturerObserver> {
public:
    virtual ~CapturerObserver() = default;

    virtual void capturerIsRunningChanged(bool) { }
    virtual void capturerFailed() { };
    virtual void capturerConfigurationChanged() { };
};

class DisplayCaptureSourceCocoa final
    : public RealtimeMediaSource
    , public CapturerObserver
    , public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<DisplayCaptureSourceCocoa, WTF::DestructionThread::MainRunLoop> {
    WTF_MAKE_TZONE_ALLOCATED(DisplayCaptureSourceCocoa);
public:
    using DisplayFrameType = std::variant<RefPtr<NativeImage>, RetainPtr<IOSurfaceRef>, RetainPtr<CMSampleBufferRef>>;

    class Capturer : public LoggerHelper {
        WTF_MAKE_TZONE_ALLOCATED(Capturer);
    public:

        virtual ~Capturer() = default;

        virtual bool start() = 0;
        virtual void stop() = 0;
        virtual void end() { stop(); }
        virtual DisplayFrameType generateFrame() = 0;
        virtual CaptureDevice::DeviceType deviceType() const = 0;
        virtual DisplaySurfaceType surfaceType() const = 0;
        virtual void commitConfiguration(const RealtimeMediaSourceSettings&) = 0;
        virtual IntSize intrinsicSize() const = 0;
        virtual void whenReady(CompletionHandler<void(CaptureSourceError&&)>&& callback) { callback({ }); }

        virtual void setLogger(const Logger&, uint64_t);
        const Logger* loggerPtr() const { return m_logger.get(); }
        const Logger& logger() const final { ASSERT(m_logger); return *m_logger.get(); }
        uint64_t logIdentifier() const final { return m_logIdentifier; }
        WTFLogChannel& logChannel() const final;

        void ref() { m_observer->ref(); }
        void deref() { m_observer->deref(); }

    protected:
        explicit Capturer(CapturerObserver& observer)
            : m_observer(observer)
        {
        }

        void isRunningChanged(bool running)
        {
            if (m_observer)
                m_observer->capturerIsRunningChanged(running);
        }
        void captureFailed()
        {
            if (m_observer)
                m_observer->capturerFailed();
        }
        void configurationChanged()
        {
            if (m_observer)
                m_observer->capturerConfigurationChanged();
        }

    private:
        WeakPtr<CapturerObserver> m_observer;
        RefPtr<const Logger> m_logger;
        uint64_t m_logIdentifier { 0 };
    };

    static CaptureSourceOrError create(const CaptureDevice&, MediaDeviceHashSalts&&, const MediaConstraints*, std::optional<PageIdentifier>);
    static CaptureSourceOrError create(const std::function<UniqueRef<Capturer>(CapturerObserver&)>&, const CaptureDevice&, MediaDeviceHashSalts&&, const MediaConstraints*, std::optional<PageIdentifier>);

    Seconds elapsedTime();

    WTF_ABSTRACT_THREAD_SAFE_REF_COUNTED_AND_CAN_MAKE_WEAK_PTR_IMPL;
    virtual ~DisplayCaptureSourceCocoa();

private:
    DisplayCaptureSourceCocoa(const std::function<UniqueRef<Capturer>(CapturerObserver&)>&, const CaptureDevice&, MediaDeviceHashSalts&&, std::optional<PageIdentifier>);

    // RealtimeMediaSource
    void startProducingData() final;
    void stopProducingData() final;
    void endProducingData() final;
    void settingsDidChange(OptionSet<RealtimeMediaSourceSettings::Flag>) final;
    bool isCaptureSource() const final { return true; }
    const RealtimeMediaSourceCapabilities& capabilities() final;
    const RealtimeMediaSourceSettings& settings() final;
    CaptureDevice::DeviceType deviceType() const { return m_capturer->deviceType(); }
    void endApplyingConstraints() final { commitConfiguration(); }
    IntSize computeResizedVideoFrameSize(IntSize desiredSize, IntSize actualSize) final;
    void setSizeFrameRateAndZoom(const VideoPresetConstraints&) final;
    double observedFrameRate() const final;
    void whenReady(CompletionHandler<void(CaptureSourceError&&)>&&) final;

    ASCIILiteral logClassName() const final { return "DisplayCaptureSourceCocoa"_s; }
    void setLogger(const Logger&, uint64_t) final;

    // CapturerObserver
    void capturerIsRunningChanged(bool isRunning) final { notifyMutedChange(!isRunning); }
    void capturerFailed() final { captureFailed(); }
    void capturerConfigurationChanged() final;

    void commitConfiguration() { m_capturer->commitConfiguration(settings()); }
    void emitFrame();

    UniqueRef<Capturer> m_capturer;
    std::optional<RealtimeMediaSourceCapabilities> m_capabilities;
    std::optional<RealtimeMediaSourceSettings> m_currentSettings;
    RealtimeMediaSourceSupportedConstraints m_supportedConstraints;

    MonotonicTime m_startTime { MonotonicTime::nan() };
    Seconds m_elapsedTime { 0_s };

    RunLoop::Timer m_timer;
    UserActivity m_userActivity;

    std::unique_ptr<ImageTransferSessionVT> m_imageTransferSession;
};

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM) && PLATFORM(COCOA)
