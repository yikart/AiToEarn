/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#pragma once

#include "MediaPromiseTypes.h"

#include "ProcessIdentity.h"
#include <CoreMedia/CMTime.h>
#include <atomic>
#include <wtf/Deque.h>
#include <wtf/Function.h>
#include <wtf/Lock.h>
#include <wtf/MediaTime.h>
#include <wtf/MonotonicTime.h>
#include <wtf/OSObjectPtr.h>
#include <wtf/Ref.h>
#include <wtf/RetainPtr.h>
#include <wtf/ThreadSafeWeakPtr.h>
#include <wtf/WorkQueue.h>

typedef CFTypeRef CMBufferRef;
typedef const struct __CFArray * CFArrayRef;
typedef struct opaqueCMBufferQueue *CMBufferQueueRef;
typedef struct opaqueCMSampleBuffer *CMSampleBufferRef;
typedef struct OpaqueCMTimebase* CMTimebaseRef;
typedef signed long CMItemCount;
typedef struct __CVBuffer *CVPixelBufferRef;
typedef struct __CVBuffer *CVImageBufferRef;
typedef UInt32 VTDecodeInfoFlags;
typedef struct OpaqueVTDecompressionSession*  VTDecompressionSessionRef;

namespace WebCore {

class VideoDecoder;
struct PlatformVideoColorSpace;

class WEBCORE_EXPORT WebCoreDecompressionSession : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<WebCoreDecompressionSession> {
public:
    static Ref<WebCoreDecompressionSession> createOpenGL() { return adoptRef(*new WebCoreDecompressionSession(OpenGL)); }
    static Ref<WebCoreDecompressionSession> createRGB() { return adoptRef(*new WebCoreDecompressionSession(RGB)); }

    ~WebCoreDecompressionSession();
    void invalidate();
    bool isInvalidated() const { return m_invalidated; }

    void enqueueSample(CMSampleBufferRef, bool displaying = true);
    bool isReadyForMoreMediaData() const;
    void requestMediaDataWhenReady(Function<void()>&&);
    void stopRequestingMediaData();
    void notifyWhenHasAvailableVideoFrame(Function<void()>&&);

    RetainPtr<CVPixelBufferRef> decodeSampleSync(CMSampleBufferRef);

    using DecodingPromise = NativePromise<RetainPtr<CMSampleBufferRef>, OSStatus>;
    Ref<DecodingPromise> decodeSample(CMSampleBufferRef, bool displaying);

    void setTimebase(CMTimebaseRef);
    RetainPtr<CMTimebaseRef> timebase() const;

    enum ImageForTimeFlags { ExactTime, AllowEarlier, AllowLater };
    RetainPtr<CVPixelBufferRef> imageForTime(const MediaTime&, ImageForTimeFlags = ExactTime);
    void flush();

    void setErrorListener(Function<void(OSStatus)>&&);
    void removeErrorListener();

    unsigned totalVideoFrames() const { return m_totalVideoFrames; }
    unsigned droppedVideoFrames() const { return m_droppedVideoFrames; }
    unsigned corruptedVideoFrames() const { return m_corruptedVideoFrames; }
    MediaTime totalFrameDelay() const { return m_totalFrameDelay; }

    bool hardwareDecoderEnabled() const { return m_hardwareDecoderEnabled; }
    void setHardwareDecoderEnabled(bool enabled) { m_hardwareDecoderEnabled = enabled; }

    void setResourceOwner(const ProcessIdentity& resourceOwner) { m_resourceOwner = resourceOwner; }

    static RetainPtr<CMBufferQueueRef> createBufferQueue();

private:
    enum Mode {
        OpenGL,
        RGB,
    };
    WebCoreDecompressionSession(Mode);

    RetainPtr<VTDecompressionSessionRef> ensureDecompressionSessionForSample(CMSampleBufferRef);

    void setTimebaseWithLockHeld(CMTimebaseRef);
    void enqueueCompressedSample(CMSampleBufferRef, bool displaying, uint32_t flushId);
    Ref<DecodingPromise> decodeSampleInternal(CMSampleBufferRef, bool displaying);
    void enqueueDecodedSample(CMSampleBufferRef);
    void maybeDecodeNextSample();
    void handleDecompressionOutput(bool displaying, OSStatus, VTDecodeInfoFlags, CVImageBufferRef, CMTime presentationTimeStamp, CMTime presentationDuration);
    RetainPtr<CVPixelBufferRef> getFirstVideoFrame();
    void resetAutomaticDequeueTimer();
    void automaticDequeue();
    bool shouldDecodeSample(CMSampleBufferRef, bool displaying);
    void assignResourceOwner(CVImageBufferRef);

    static CMTime getDecodeTime(CMBufferRef, void* refcon);
    static CMTime getPresentationTime(CMBufferRef, void* refcon);
    static CMTime getDuration(CMBufferRef, void* refcon);
    static CFComparisonResult compareBuffers(CMBufferRef buf1, CMBufferRef buf2, void* refcon);
    void maybeBecomeReadyForMoreMediaData();

    void resetQosTier();
    void increaseQosTier();
    void decreaseQosTier();
    void updateQosWithDecodeTimeStatistics(double ratio);

    bool isUsingVideoDecoder(CMSampleBufferRef) const;
    Ref<MediaPromise> initializeVideoDecoder(FourCharCode, std::span<const uint8_t>, const std::optional<PlatformVideoColorSpace>&);

    static const CMItemCount kMaximumCapacity = 120;
    static const CMItemCount kHighWaterMark = 60;
    static const CMItemCount kLowWaterMark = 15;

    Mode m_mode;
    mutable Lock m_lock;
    RetainPtr<VTDecompressionSessionRef> m_decompressionSession WTF_GUARDED_BY_LOCK(m_lock);
    RetainPtr<CMBufferQueueRef> m_producerQueue;
    RetainPtr<CMTimebaseRef> m_timebase WTF_GUARDED_BY_LOCK(m_lock);
    const Ref<WorkQueue> m_decompressionQueue;
    const Ref<WorkQueue> m_enqueingQueue;
    OSObjectPtr<dispatch_source_t> m_timerSource WTF_GUARDED_BY_LOCK(m_lock);
    Function<void()> m_notificationCallback WTF_GUARDED_BY_CAPABILITY(mainThread);
    Function<void()> m_hasAvailableFrameCallback WTF_GUARDED_BY_CAPABILITY(mainThread);
    Function<void(RetainPtr<CMSampleBufferRef>&&)> m_newDecodedFrameCallback WTF_GUARDED_BY_CAPABILITY(mainThread);
    RetainPtr<CFArrayRef> m_qosTiers WTF_GUARDED_BY_LOCK(m_lock);
    int m_currentQosTier WTF_GUARDED_BY_LOCK(m_lock) { 0 };
    std::atomic<unsigned> m_framesSinceLastQosCheck { 0 };
    double m_decodeRatioMovingAverage { 0 };

    std::atomic<uint32_t> m_flushId { 0 };
    std::atomic<bool> m_isUsingVideoDecoder { true };
    RefPtr<VideoDecoder> m_videoDecoder WTF_GUARDED_BY_LOCK(m_lock);
    bool m_videoDecoderCreationFailed { false };
    std::atomic<bool> m_decodePending { false };
    struct PendingDecodeData {
        MonotonicTime startTime;
        bool displaying { false };
    };
    std::optional<PendingDecodeData> m_pendingDecodeData WTF_GUARDED_BY_CAPABILITY(m_decompressionQueue.get());
    // A VideoDecoder can't process more than one request at a time.
    // Handle the case should the DecompressionSession be used even if isReadyForMoreMediaData() returned false;
    Deque<std::tuple<RetainPtr<CMSampleBufferRef>, bool, uint32_t>> m_pendingSamples WTF_GUARDED_BY_CAPABILITY(m_decompressionQueue.get());
    bool m_isDecodingSample WTF_GUARDED_BY_CAPABILITY(m_decompressionQueue.get()) { false };
    RetainPtr<CMSampleBufferRef> m_lastDecodedSample WTF_GUARDED_BY_CAPABILITY(m_decompressionQueue.get());
    OSStatus m_lastDecodingError WTF_GUARDED_BY_CAPABILITY(m_decompressionQueue.get()) { noErr };

    Function<void(OSStatus)> m_errorListener WTF_GUARDED_BY_CAPABILITY(mainThread);

    std::atomic<bool> m_invalidated { false };
    std::atomic<bool> m_hardwareDecoderEnabled { true };
    std::atomic<int> m_framesBeingDecoded { 0 };
    std::atomic<unsigned> m_totalVideoFrames { 0 };
    std::atomic<unsigned> m_droppedVideoFrames { 0 };
    std::atomic<unsigned> m_corruptedVideoFrames { 0 };
    std::atomic<bool> m_deliverDecodedFrames { false };
    MediaTime m_totalFrameDelay;

    ProcessIdentity m_resourceOwner;
};

}
