/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "FloatSize.h"
#include "PlaneLayout.h"
#include "PlatformVideoColorSpace.h"
#include "VideoPixelFormat.h"
#include <JavaScriptCore/TypedArrays.h>
#include <wtf/CompletionHandler.h>
#include <wtf/MediaTime.h>
#include <wtf/ThreadSafeRefCounted.h>

typedef struct __CVBuffer *CVPixelBufferRef;

namespace WebCore {

class FloatRect;
class GraphicsContext;
class NativeImage;
class PixelBuffer;
class ProcessIdentity;
#if USE(AVFOUNDATION) && PLATFORM(COCOA)
class VideoFrameCV;
#endif

struct ImageOrientation;
struct PlatformVideoColorSpace;

struct ComputedPlaneLayout {
    size_t destinationOffset { 0 };
    size_t destinationStride { 0 };
    size_t sourceTop { 0 };
    size_t sourceHeight { 0 };
    size_t sourceLeftBytes { 0 };
    size_t sourceWidthBytes { 0 };
};

enum class VideoFrameRotation : uint16_t {
    None = 0,
    UpsideDown = 180,
    Right = 90,
    Left = 270,
};

// A class representing a video frame from a decoder, capture source, or similar.
class VideoFrame : public ThreadSafeRefCounted<VideoFrame> {
public:
    virtual ~VideoFrame() = default;

    static RefPtr<VideoFrame> fromNativeImage(NativeImage&);
    static RefPtr<VideoFrame> createFromPixelBuffer(Ref<PixelBuffer>&&, PlatformVideoColorSpace&& = { });
    static RefPtr<VideoFrame> createNV12(std::span<const uint8_t>, size_t width, size_t height, const ComputedPlaneLayout&, const ComputedPlaneLayout&, PlatformVideoColorSpace&&);
    static RefPtr<VideoFrame> createRGBA(std::span<const uint8_t>, size_t width, size_t height, const ComputedPlaneLayout&, PlatformVideoColorSpace&&);
    static RefPtr<VideoFrame> createBGRA(std::span<const uint8_t>, size_t width, size_t height, const ComputedPlaneLayout&, PlatformVideoColorSpace&&);
    static RefPtr<VideoFrame> createI420(std::span<const uint8_t>, size_t width, size_t height, const ComputedPlaneLayout&, const ComputedPlaneLayout&, const ComputedPlaneLayout&, PlatformVideoColorSpace&&);
    static RefPtr<VideoFrame> createI420A(std::span<const uint8_t>, size_t width, size_t height, const ComputedPlaneLayout&, const ComputedPlaneLayout&, const ComputedPlaneLayout&, const ComputedPlaneLayout&, PlatformVideoColorSpace&&);

    using Rotation = VideoFrameRotation;

    MediaTime presentationTime() const { return m_presentationTime; }
    Rotation rotation() const { return m_rotation; }
    bool isMirrored() const { return m_isMirrored; }

#if PLATFORM(COCOA) && USE(AVFOUNDATION)
    WEBCORE_EXPORT RefPtr<VideoFrameCV> asVideoFrameCV();
#endif

    enum class ShouldCloneWithDifferentTimestamp : bool { No, Yes };
    Ref<VideoFrame> updateTimestamp(MediaTime, ShouldCloneWithDifferentTimestamp);

    using CopyCallback = CompletionHandler<void(std::optional<Vector<PlaneLayout>>&&)>;
    void copyTo(std::span<uint8_t>, VideoPixelFormat, Vector<ComputedPlaneLayout>&&, CopyCallback&&);

    virtual IntSize presentationSize() const = 0;
    virtual uint32_t pixelFormat() const = 0;

    virtual bool isRemoteProxy() const { return false; }
    virtual bool isLibWebRTC() const { return false; }
    virtual bool isCV() const { return false; }
#if USE(GSTREAMER)
    virtual bool isGStreamer() const { return false; }
#endif
#if PLATFORM(COCOA)
    virtual CVPixelBufferRef pixelBuffer() const { return nullptr; };
#endif
    WEBCORE_EXPORT virtual void setOwnershipIdentity(const ProcessIdentity&) { }

    void initializeCharacteristics(MediaTime presentationTime, bool isMirrored, Rotation);

    void draw(GraphicsContext&, const FloatRect&, ImageOrientation, bool shouldDiscardAlpha);

    const PlatformVideoColorSpace& colorSpace() const { return m_colorSpace; }

protected:
    WEBCORE_EXPORT VideoFrame(MediaTime presentationTime, bool isMirrored, Rotation, PlatformVideoColorSpace&& = { });

    void initializePresentationTime(MediaTime);

private:
    virtual Ref<VideoFrame> clone() = 0;

    const MediaTime m_presentationTime;
    const bool m_isMirrored;
    const Rotation m_rotation;
    const PlatformVideoColorSpace m_colorSpace;
};

}

#endif // ENABLE(VIDEO)
