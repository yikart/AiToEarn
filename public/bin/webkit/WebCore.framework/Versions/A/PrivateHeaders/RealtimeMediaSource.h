/*
 * Copyright (C) 2011 Ericsson AB. All rights reserved.
 * Copyright (C) 2012 Google Inc. All rights reserved.
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Nokia Corporation and/or its subsidiary(-ies).
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

#include "CaptureDevice.h"
#include "Image.h"
#include "MediaAccessDenialReason.h"
#include "MediaConstraints.h"
#include "MediaDeviceHashSalts.h"
#include "PhotoCapabilities.h"
#include "PhotoSettings.h"
#include "PlatformLayer.h"
#include "RealtimeMediaSourceCapabilities.h"
#include "RealtimeMediaSourceFactory.h"
#include "RealtimeMediaSourceIdentifier.h"
#include "VideoFrameTimeMetadata.h"
#include <wtf/AbstractThreadSafeRefCountedAndCanMakeWeakPtr.h>
#include <wtf/CheckedPtr.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/Lock.h>
#include <wtf/LoggerHelper.h>
#include <wtf/NativePromise.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashSet.h>
#include <wtf/text/WTFString.h>

#if USE(GSTREAMER)
#include "GUniquePtrGStreamer.h"
#include <wtf/glib/GRefPtr.h>
#endif

namespace WebCore {
class RealtimeMediaSourceObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::RealtimeMediaSourceObserver> : std::true_type { };
}

namespace WTF {
class MediaTime;
}

namespace WebCore {

class AudioStreamDescription;
class FloatRect;
class GraphicsContext;
class MediaStreamPrivate;
class OrientationNotifier;
class PlatformAudioData;
class RealtimeMediaSourceSettings;
class VideoFrame;

enum class VideoFrameRotation : uint16_t;

struct CaptureSourceError;
struct CaptureSourceOrError;
struct VideoFrameAdaptor;

class RealtimeMediaSourceObserver : public CanMakeWeakPtr<RealtimeMediaSourceObserver> {
public:
    WEBCORE_EXPORT RealtimeMediaSourceObserver();
    WEBCORE_EXPORT virtual ~RealtimeMediaSourceObserver();

    // Source state changes.
    virtual void sourceStarted() { }
    virtual void sourceStopped() { }
    virtual void sourceMutedChanged() { }
    virtual void sourceSettingsChanged() { }
    virtual void audioUnitWillStart() { }
    virtual void sourceConfigurationChanged() { }

    // Observer state queries.
    virtual bool preventSourceFromEnding() { return false; }

    virtual void hasStartedProducingData() { }
};

class WEBCORE_EXPORT RealtimeMediaSource : public AbstractThreadSafeRefCountedAndCanMakeWeakPtr
#if !RELEASE_LOG_DISABLED
    , public LoggerHelper
#endif
{
public:
    class AudioSampleObserver {
    public:
        virtual ~AudioSampleObserver() = default;

        // CheckedPtr interface
        virtual uint32_t checkedPtrCount() const = 0;
        virtual uint32_t checkedPtrCountWithoutThreadCheck() const = 0;
        virtual void incrementCheckedPtrCount() const = 0;
        virtual void decrementCheckedPtrCount() const = 0;

        // May be called on a background thread.
        virtual void audioSamplesAvailable(const WTF::MediaTime&, const PlatformAudioData&, const AudioStreamDescription&, size_t /*numberOfFrames*/) = 0;
    };
    class VideoFrameObserver {
    public:
        virtual ~VideoFrameObserver() = default;

        // May be called on a background thread.
        virtual void videoFrameAvailable(VideoFrame&, VideoFrameTimeMetadata) = 0;

#if USE(GSTREAMER_WEBRTC)
        virtual GUniquePtr<GstStructure> queryAdditionalStats() { return nullptr; }
#endif
    };

    virtual ~RealtimeMediaSource();

    // Can be called in worker threads.
    virtual Ref<RealtimeMediaSource> clone() { return *this; }

    const String& hashedId() const;
    const MediaDeviceHashSalts& deviceIDHashSalts() const;

    const String& persistentID() const { return m_device.persistentId(); }

    enum class Type : bool { Audio, Video };
    Type type() const { return m_type; }
    bool isVideo() const { return m_type == Type::Video; }
    bool isAudio() const { return m_type == Type::Audio; }

    virtual void whenReady(CompletionHandler<void(CaptureSourceError&&)>&&);

    virtual bool isProducingData() const;
    void start();
    void stop();
    void endImmediatly() { end(nullptr); }
    virtual void requestToEnd(RealtimeMediaSourceObserver& callingObserver);
    bool isEnded() const { return m_isEnded; }

    bool muted() const { return m_muted; }
    virtual void setMuted(bool);

    bool captureDidFail() const { return m_captureDidFailed; }

    virtual bool interrupted() const { return false; }

    const String& name() const { return m_name; }

    double fitnessScore() const { return m_fitnessScore; }

    WEBCORE_EXPORT void addObserver(RealtimeMediaSourceObserver&);
    WEBCORE_EXPORT void removeObserver(RealtimeMediaSourceObserver&);

    WEBCORE_EXPORT void addAudioSampleObserver(AudioSampleObserver&);
    WEBCORE_EXPORT void removeAudioSampleObserver(AudioSampleObserver&);

    WEBCORE_EXPORT void addVideoFrameObserver(VideoFrameObserver&);
    WEBCORE_EXPORT void addVideoFrameObserver(VideoFrameObserver&, IntSize, double);
    WEBCORE_EXPORT void removeVideoFrameObserver(VideoFrameObserver&);

    virtual const IntSize size() const;
    void setSize(const IntSize&);

    IntSize intrinsicSize() const;
    void setIntrinsicSize(const IntSize&, bool notifyObservers = true);

    double frameRate() const { return m_frameRate; }
    void setFrameRate(double);

    VideoFacingMode facingMode() const { return m_facingMode; }
    void setFacingMode(VideoFacingMode);

    MeteringMode whiteBalanceMode() const { return m_whiteBalanceMode; }
    void setWhiteBalanceMode(MeteringMode);

    double volume() const { return m_volume; }
    void setVolume(double);

    double zoom() const { return m_zoom; }
    void setZoom(double);

    double torch() const { return m_torch; }
    void setTorch(bool);

    int sampleRate() const { return m_sampleRate; }
    void setSampleRate(int);
    virtual std::optional<Vector<int>> discreteSampleRates() const;

    int sampleSize() const { return m_sampleSize; }
    void setSampleSize(int);
    virtual std::optional<Vector<int>> discreteSampleSizes() const;

    bool echoCancellation() const { return m_echoCancellation; }
    void setEchoCancellation(bool);

    virtual const RealtimeMediaSourceCapabilities& capabilities() = 0;
    virtual const RealtimeMediaSourceSettings& settings() = 0;

    using TakePhotoNativePromise = NativePromise<std::pair<Vector<uint8_t>, String>, String>;
    virtual Ref<TakePhotoNativePromise> takePhoto(PhotoSettings&&);

    using PhotoCapabilitiesNativePromise = NativePromise<PhotoCapabilities, String>;
    virtual Ref<PhotoCapabilitiesNativePromise> getPhotoCapabilities();

    using PhotoSettingsNativePromise = NativePromise<PhotoSettings, String>;
    virtual Ref<PhotoSettingsNativePromise> getPhotoSettings();

    struct ApplyConstraintsError {
        MediaConstraintType invalidConstraint;
        String message;
        ApplyConstraintsError isolatedCopy() && { return { invalidConstraint, WTFMove(message).isolatedCopy() }; }
    };
    using ApplyConstraintsHandler = CompletionHandler<void(std::optional<ApplyConstraintsError>&&)>;
    virtual void applyConstraints(const MediaConstraints&, ApplyConstraintsHandler&&);
    std::optional<ApplyConstraintsError> applyConstraints(const MediaConstraints&);

    struct VideoPresetConstraints {
        std::optional<int> width;
        std::optional<int> height;
        std::optional<double> frameRate;
        std::optional<double> zoom;
        bool shouldPreferPowerEfficiency { false };

        bool hasConstraints() const { return !!width || !!height || !!frameRate || !!zoom; }
    };
    WEBCORE_EXPORT VideoPresetConstraints extractVideoPresetConstraints(const MediaConstraints&);

    std::optional<MediaConstraintType> hasAnyInvalidConstraint(const MediaConstraints&);
    bool supportsConstraint(MediaConstraintType);

    virtual bool isMockSource() const { return false; }
    virtual bool isCaptureSource() const { return false; }
    virtual CaptureDevice::DeviceType deviceType() const { return CaptureDevice::DeviceType::Unknown; }
    WEBCORE_EXPORT virtual VideoFrameRotation videoFrameRotation() const;
    WEBCORE_EXPORT virtual IntSize computeResizedVideoFrameSize(IntSize desiredSize, IntSize actualSize);

    virtual void monitorOrientation(OrientationNotifier&) { }

    virtual void captureFailed();

    virtual bool isSameAs(RealtimeMediaSource& source) const { return this == &source; }
    virtual bool isIncomingAudioSource() const { return false; }
    virtual bool isIncomingVideoSource() const { return false; }

#if !RELEASE_LOG_DISABLED
    virtual void setLogger(const Logger&, uint64_t);
    const Logger* loggerPtr() const { return m_logger.get(); }
    const Logger& logger() const final { ASSERT(m_logger); return *m_logger.get(); }
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    ASCIILiteral logClassName() const override { return "RealtimeMediaSource"_s; }
    WTFLogChannel& logChannel() const final;
#endif

    // Testing only
    virtual void delaySamples(Seconds) { };
    virtual void setInterruptedForTesting(bool);

    virtual bool setShouldApplyRotation(bool) { return false; }
    virtual void setIsInBackground(bool);

    std::optional<PageIdentifier> pageIdentifier() const { return m_pageIdentifier.asOptional(); }

    const CaptureDevice& captureDevice() const { return m_device; }
    bool isEphemeral() const { return m_device.isEphemeral(); }

    virtual double facingModeFitnessScoreAdjustment() const { return 0; }

    using OwnerCallback = std::function<void(RealtimeMediaSource&, bool isNewClonedSource)>;
    void registerOwnerCallback(OwnerCallback&&);

    virtual bool isPowerEfficient() const { return false; }

#if USE(GSTREAMER)
    virtual std::pair<GstClockTime, GstClockTime> queryCaptureLatency() const;
#endif

protected:
    RealtimeMediaSource(const CaptureDevice&, MediaDeviceHashSalts&& hashSalts = { }, std::optional<PageIdentifier> = std::nullopt);

    void scheduleDeferredTask(Function<void()>&&);

    virtual void startApplyingConstraints() { }
    virtual void endApplyingConstraints() { }

    std::optional<MediaConstraintType> selectSettings(const MediaConstraints&, MediaTrackConstraintSetMap&);

    double fitnessDistance(MediaConstraintType, const IntConstraint&);
    double fitnessDistance(MediaConstraintType, const DoubleConstraint&);
    double fitnessDistance(MediaConstraintType, const StringConstraint&);
    double fitnessDistance(MediaConstraintType, const BooleanConstraint&);
    double fitnessDistance(MediaConstraintType, const MediaConstraint&);

    void applyConstraint(MediaConstraintType, const MediaConstraint&);
    void applyConstraints(const MediaTrackConstraintSetMap&);
    VideoPresetConstraints extractVideoPresetConstraints(const MediaTrackConstraintSetMap&);
    std::optional<MediaConstraintType> hasInvalidSizeFrameRateAndZoomConstraints(std::optional<IntConstraint> width, std::optional<IntConstraint> height, std::optional<DoubleConstraint>, std::optional<DoubleConstraint>, double& fitnessDistance);

    virtual bool supportsSizeFrameRateAndZoom(const VideoPresetConstraints&);
    virtual void setSizeFrameRateAndZoom(const VideoPresetConstraints&);

    void notifyMutedObservers();
    void notifyMutedChange(bool muted);
    void notifySettingsDidChangeObservers(OptionSet<RealtimeMediaSourceSettings::Flag>);

    void initializeVolume(double volume) { m_volume = volume; }
    void initializeSampleRate(int sampleRate) { m_sampleRate = sampleRate; }
    void initializeEchoCancellation(bool echoCancellation) { m_echoCancellation = echoCancellation; }

    void videoFrameAvailable(VideoFrame&, VideoFrameTimeMetadata);
    void audioSamplesAvailable(const WTF::MediaTime&, const PlatformAudioData&, const AudioStreamDescription&, size_t);

    void forEachObserver(const Function<void(RealtimeMediaSourceObserver&)>&);
    void forEachVideoFrameObserver(const Function<void(VideoFrameObserver&)>&);

    void end(RealtimeMediaSourceObserver* = nullptr);

    void setType(Type);

    void setName(const String&);
    void setPersistentId(const String&);

    bool hasSeveralVideoFrameObserversWithAdaptors() const { return m_videoFrameObserversWithAdaptors > 1; }

    OwnerCallback m_registerOwnerCallback;

private:
    virtual void startProducingData() { }
    virtual void stopProducingData() { }
    virtual void endProducingData() { stop(); }
    virtual void settingsDidChange(OptionSet<RealtimeMediaSourceSettings::Flag>) { }

    virtual void stopBeingObserved() { stop(); }

    virtual void didEnd() { }
    virtual double observedFrameRate() const { return 0.0; }

    void updateHasStartedProducingData();
    void initializePersistentId();

#if !RELEASE_LOG_DISABLED
    RefPtr<const Logger> m_logger;
    uint64_t m_logIdentifier { 0 };
    MonotonicTime m_lastFrameLogTime;
    unsigned m_frameCount { 0 };
#endif

    Markable<PageIdentifier> m_pageIdentifier;
    MediaDeviceHashSalts m_idHashSalts;
    String m_hashedID;
    String m_ephemeralHashedID;
    Type m_type;
    String m_name;
    WeakHashSet<RealtimeMediaSourceObserver> m_observers;

    mutable Lock m_audioSampleObserversLock;
    HashSet<CheckedPtr<AudioSampleObserver>> m_audioSampleObservers WTF_GUARDED_BY_LOCK(m_audioSampleObserversLock);

    mutable Lock m_videoFrameObserversLock;
    HashMap<VideoFrameObserver*, std::unique_ptr<VideoFrameAdaptor>> m_videoFrameObservers WTF_GUARDED_BY_LOCK(m_videoFrameObserversLock);

    CaptureDevice m_device;

    // Set on the main thread from constraints.
    IntSize m_size;
    // Set on sample generation thread.
    IntSize m_intrinsicSize;
    double m_frameRate { 30 };
    double m_volume { 1 };
    double m_sampleRate { 0 };
    double m_sampleSize { 0 };
    double m_fitnessScore { 0 };
    VideoFacingMode m_facingMode { VideoFacingMode::User };

    MeteringMode m_whiteBalanceMode { MeteringMode::None };
    double m_zoom { 1 };
    bool m_torch { false };

    bool m_muted { false };
    bool m_pendingSettingsDidChangeNotification { false };
    bool m_echoCancellation { false };
    bool m_isProducingData { false };
    bool m_captureDidFailed { false };
    bool m_isEnded { false };
    bool m_hasStartedProducingData { false };

    unsigned m_videoFrameObserversWithAdaptors { 0 };
};

struct CaptureSourceError {
    CaptureSourceError() = default;
    CaptureSourceError(String&& errorMessage, MediaAccessDenialReason denialReason, MediaConstraintType invalidConstraint = MediaConstraintType::Unknown)
        : errorMessage(WTFMove(errorMessage))
        , denialReason(denialReason)
        , invalidConstraint(invalidConstraint)
    {
    }

    explicit CaptureSourceError(MediaConstraintType invalidConstraint)
        : denialReason(MediaAccessDenialReason::InvalidConstraint)
        , invalidConstraint(invalidConstraint)
    { }

    operator bool() const { return denialReason != MediaAccessDenialReason::NoReason; }

    String errorMessage;
    MediaAccessDenialReason denialReason { MediaAccessDenialReason::NoReason };
    MediaConstraintType invalidConstraint { MediaConstraintType::Unknown };
};

struct CaptureSourceOrError {
    CaptureSourceOrError() = default;
    CaptureSourceOrError(Ref<RealtimeMediaSource>&& source) : captureSource(WTFMove(source)) { }
    explicit CaptureSourceOrError(CaptureSourceError&& error) : error(WTFMove(error)) { }

    operator bool() const { return !!captureSource; }
    Ref<RealtimeMediaSource> source() { return captureSource.releaseNonNull(); }

    RefPtr<RealtimeMediaSource> captureSource;
    CaptureSourceError error;
};

String convertEnumerationToString(RealtimeMediaSource::Type);

inline void RealtimeMediaSource::setName(const String& name)
{
    m_name = name;
}

inline void RealtimeMediaSource::whenReady(CompletionHandler<void(CaptureSourceError&&)>&& callback)
{
    callback({ });
}

inline bool RealtimeMediaSource::isProducingData() const
{
    return m_isProducingData;
}

inline void RealtimeMediaSource::setIsInBackground(bool)
{
}

} // namespace WebCore

namespace WTF {

template<typename Type>
struct LogArgument;

template <>
struct LogArgument<WebCore::RealtimeMediaSource::Type> {
    static String toString(const WebCore::RealtimeMediaSource::Type type)
    {
        return convertEnumerationToString(type);
    }
};

}; // namespace WTF

#endif // ENABLE(MEDIA_STREAM)
