/*
 * Copyright (C) 2022 Apple Inc.  All rights reserved.
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

#include "PlatformScreen.h"
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

class DestinationColorSpace;
class GraphicsContextGL;
class ImageBuffer;
class SerializedImageBuffer;

struct GraphicsContextGLAttributes;

enum class ImageBufferPixelFormat : uint8_t;
enum class RenderingMode : uint8_t;
enum class RenderingPurpose : uint8_t;

namespace WebGPU {
class GPU;
}

class GraphicsClient {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(GraphicsClient);
    WTF_MAKE_NONCOPYABLE(GraphicsClient);
public:
    GraphicsClient() = default;
    virtual ~GraphicsClient() = default;

    virtual PlatformDisplayID displayID() const = 0;

#if ENABLE(WEBGL)
    virtual RefPtr<GraphicsContextGL> createGraphicsContextGL(const GraphicsContextGLAttributes&) const = 0;
#endif
#if HAVE(WEBGPU_IMPLEMENTATION)
    virtual RefPtr<WebCore::WebGPU::GPU> createGPUForWebGPU() const = 0;
#endif

private:
    // Called by passing GraphicsClient into ImageBuffer functions.
    virtual RefPtr<ImageBuffer> createImageBuffer(const FloatSize&, RenderingMode, RenderingPurpose, float resolutionScale, const DestinationColorSpace&, ImageBufferPixelFormat) const = 0;

    // Called by passing GraphicsClient into SerializedImageBuffer functions.
    virtual RefPtr<WebCore::ImageBuffer> sinkIntoImageBuffer(std::unique_ptr<WebCore::SerializedImageBuffer>) = 0;

    friend class ImageBuffer;
    friend class SerializedImageBuffer;
};

} // namespace WebCore
