/*
 * Copyright (C) 2015-2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer
 *    in the documentation and/or other materials provided with the
 *    distribution.
 * 3. Neither the name of Ericsson nor the names of its contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(MEDIA_STREAM)

#include "FontCascade.h"
#include "ImageBuffer.h"
#include "MockMediaDevice.h"
#include "OrientationNotifier.h"
#include "RealtimeMediaSourceFactory.h"
#include "RealtimeVideoCaptureSource.h"
#include <wtf/Lock.h>
#include <wtf/RunLoop.h>

namespace WebCore {

class FloatRect;
class GraphicsContext;

enum class VideoFrameRotation : uint16_t;

class MockRealtimeVideoSource : public RealtimeVideoCaptureSource, private OrientationNotifier::Observer {
public:
    static CaptureSourceOrError create(String&& deviceID, AtomString&& name, MediaDeviceHashSalts&&, const MediaConstraints*, std::optional<PageIdentifier>);
    virtual ~MockRealtimeVideoSource();

    static void setIsInterrupted(bool);

    ImageBuffer* imageBuffer();

protected:
    MockRealtimeVideoSource(String&& deviceID, AtomString&& name, MediaDeviceHashSalts&&, std::optional<PageIdentifier>);

    virtual void updateSampleBuffer() = 0;

    Seconds elapsedTime();
    void settingsDidChange(OptionSet<RealtimeMediaSourceSettings::Flag>) override;
    VideoFrameRotation videoFrameRotation() const final;
    void generatePresets() override;

    IntSize captureSize() const;

    ImageBuffer* imageBufferInternal();

private:
    friend class MockDisplayCaptureSourceGStreamer;
    friend class MockRealtimeVideoSourceGStreamer;

    const RealtimeMediaSourceCapabilities& capabilities() final;
    const RealtimeMediaSourceSettings& settings() final;
    Ref<TakePhotoNativePromise> takePhotoInternal(PhotoSettings&&) final;
    Ref<PhotoCapabilitiesNativePromise> getPhotoCapabilities() final;
    Ref<PhotoSettingsNativePromise> getPhotoSettings() final;

    void startProducingData() override;
    void stopProducingData() override;
    bool isCaptureSource() const final { return true; }
    CaptureDevice::DeviceType deviceType() const final { return mockCamera() ? CaptureDevice::DeviceType::Camera : CaptureDevice::DeviceType::Screen; }
    bool supportsSizeFrameRateAndZoom(const VideoPresetConstraints&) final;
    void setSizeFrameRateAndZoom(const VideoPresetConstraints&) override;
    void applyFrameRateAndZoomWithPreset(double, double, std::optional<VideoPreset>&&) final;

    bool isMockSource() const final { return true; }

    // OrientationNotifier::Observer
    void orientationChanged(IntDegrees orientation) final;
    void rotationAngleForHorizonLevelDisplayChanged(const String&, VideoFrameRotation) final;
    void monitorOrientation(OrientationNotifier&) final;

    void drawAnimation(GraphicsContext&);
    void drawText(GraphicsContext&);
    void drawBoxes(GraphicsContext&);

    void generateFrame();
    RefPtr<ImageBuffer> generateFrameInternal();
    void startCaptureTimer();
    RefPtr<ImageBuffer> generatePhoto();

    void delaySamples(Seconds) final;

    bool mockCamera() const { return std::holds_alternative<MockCameraProperties>(m_device.properties); }
    bool mockDisplay() const { return std::holds_alternative<MockDisplayProperties>(m_device.properties); }
    bool mockScreen() const { return mockDisplayType(CaptureDevice::DeviceType::Screen); }
    bool mockWindow() const { return mockDisplayType(CaptureDevice::DeviceType::Window); }
    bool mockDisplayType(CaptureDevice::DeviceType) const;

    void startApplyingConstraints() final;
    void endApplyingConstraints() final;

    class DrawingState {
    public:
        explicit DrawingState(float baseFontSize)
            : m_baseFontSize(baseFontSize)
            , m_bipBopFontSize(baseFontSize * 2.5)
            , m_statsFontSize(baseFontSize * .5)
        {
        }

        float baseFontSize() const { return m_baseFontSize; }
        float statsFontSize() const { return m_statsFontSize; }

        const FontCascade& timeFont();
        const FontCascade& bipBopFont();
        const FontCascade& statsFont();

    private:
        FontCascadeDescription& fontDescription();

        float m_baseFontSize { 0 };
        float m_bipBopFontSize { 0 };
        float m_statsFontSize { 0 };
        std::optional<FontCascade> m_timeFont;
        std::optional<FontCascade> m_bipBopFont;
        std::optional<FontCascade> m_statsFont;
        std::optional<FontCascadeDescription> m_fontDescription;
    };

    DrawingState& drawingState();
    void invalidateDrawingState();

    std::optional<DrawingState> m_drawingState;
    mutable RefPtr<ImageBuffer> m_imageBuffer WTF_GUARDED_BY_LOCK(m_imageBufferLock);

    Path m_path;
    DashArray m_dashWidths;

    MonotonicTime m_startTime { MonotonicTime::nan() };
    Seconds m_elapsedTime { 0_s };
    MonotonicTime m_delayUntil;

    unsigned m_frameNumber { 0 };
    Ref<RunLoop> m_runLoop;
    RunLoop::Timer m_emitFrameTimer;
    std::optional<RealtimeMediaSourceCapabilities> m_capabilities;
    std::optional<RealtimeMediaSourceSettings> m_currentSettings;
    RealtimeMediaSourceSupportedConstraints m_supportedConstraints;
    Color m_fillColor { Color::black };
    Color m_fillColorWithZoom { Color::red };
    MockMediaDevice m_device;
    std::optional<VideoPreset> m_preset;
    VideoFrameRotation m_deviceOrientation;

    Lock m_imageBufferLock;
    std::optional<PhotoCapabilities> m_photoCapabilities;
    std::optional<PhotoSettings> m_photoSettings;
    bool m_beingConfigured { false };
    bool m_isUsingRotationAngleForHorizonLevelDisplayChanged { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::MockRealtimeVideoSource)
    static bool isType(const WebCore::RealtimeMediaSource& source) { return source.isCaptureSource() && source.isMockSource() && (source.deviceType() == WebCore::CaptureDevice::DeviceType::Camera || source.deviceType() == WebCore::CaptureDevice::DeviceType::Screen || source.deviceType() == WebCore::CaptureDevice::DeviceType::Window); }
SPECIALIZE_TYPE_TRAITS_END()

#endif // ENABLE(MEDIA_STREAM)
