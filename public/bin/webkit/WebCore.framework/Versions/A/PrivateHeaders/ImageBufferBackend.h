/*
 * Copyright (C) 2020-2024 Apple Inc.  All rights reserved.
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

#include "CopyImageOptions.h"
#include "DestinationColorSpace.h"
#include "FloatRect.h"
#include "GraphicsLayerContentsDisplayDelegate.h"
#include "GraphicsTypesGL.h"
#include "ImageBufferAllocator.h"
#include "ImageBufferBackendParameters.h"
#include "ImagePaintingOptions.h"
#include "IntRect.h"
#include "PixelBufferFormat.h"
#include "PlatformLayer.h"
#include "RenderingMode.h"
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

#if USE(CAIRO)
#include "RefPtrCairo.h"
#include <cairo.h>
#endif

#if HAVE(IOSURFACE)
#include "IOSurface.h"
#endif

#if USE(SKIA)
class GrDirectContext;
#endif

namespace WTF {
class TextStream;
}

namespace WebCore {

struct ImageBufferCreationContext;
class GraphicsContext;
class GraphicsContextGL;
#if HAVE(IOSURFACE)
class IOSurfacePool;
#endif
class Image;
class NativeImage;
class PixelBuffer;
class ProcessIdentity;
class SharedBuffer;

enum class PreserveResolution : bool {
    No,
    Yes,
};

enum class SetNonVolatileResult : uint8_t {
    Valid,
    Empty
};

enum class VolatilityState : uint8_t {
    NonVolatile,
    Volatile
};

class ThreadSafeImageBufferFlusher {
    WTF_MAKE_TZONE_ALLOCATED(ThreadSafeImageBufferFlusher);
    WTF_MAKE_NONCOPYABLE(ThreadSafeImageBufferFlusher);
public:
    ThreadSafeImageBufferFlusher() = default;
    virtual ~ThreadSafeImageBufferFlusher() = default;
    virtual void flush() = 0;
};

class ImageBufferBackendSharing {
public:
    virtual ~ImageBufferBackendSharing() = default;
    virtual bool isImageBufferBackendHandleSharing() const { return false; }
};

class ImageBufferBackend {
public:
    using Parameters = ImageBufferBackendParameters;

    struct Info {
        RenderingMode renderingMode;
        AffineTransform baseTransform;
        size_t memoryCost;
    };

    WEBCORE_EXPORT virtual ~ImageBufferBackend();

    WEBCORE_EXPORT static IntSize calculateSafeBackendSize(const Parameters&);
    WEBCORE_EXPORT static size_t calculateMemoryCost(const IntSize& backendSize, unsigned bytesPerRow);
    WEBCORE_EXPORT static AffineTransform calculateBaseTransform(const Parameters&);

    virtual GraphicsContext& context() = 0;
    virtual void flushContext() { }

    virtual RefPtr<NativeImage> copyNativeImage() = 0;
    virtual RefPtr<NativeImage> createNativeImageReference() = 0;
    WEBCORE_EXPORT virtual RefPtr<NativeImage> sinkIntoNativeImage();

    WEBCORE_EXPORT void convertToLuminanceMask();
    virtual void transformToColorSpace(const DestinationColorSpace&) { }

    virtual void getPixelBuffer(const IntRect& srcRect, PixelBuffer& destination) = 0;
    virtual void putPixelBuffer(const PixelBuffer&, const IntRect& srcRect, const IntPoint& destPoint, AlphaPremultiplication destFormat) = 0;

    WEBCORE_EXPORT virtual RefPtr<SharedBuffer> sinkIntoPDFDocument();

#if HAVE(IOSURFACE)
    virtual IOSurface* surface() { return nullptr; }
#endif

#if USE(CAIRO)
    virtual RefPtr<cairo_surface_t> createCairoSurface() { return nullptr; }
#endif

#if USE(SKIA)
    virtual void finishAcceleratedRenderingAndCreateFence() { }
    virtual void waitForAcceleratedRenderingFenceCompletion() { }

    virtual const GrDirectContext* skiaGrContext() const { return nullptr; }
    WEBCORE_EXPORT virtual RefPtr<ImageBuffer> copyAcceleratedImageBufferBorrowingBackendRenderTarget(const ImageBuffer&) const;
#endif

    virtual bool isInUse() const { return false; }
    virtual void releaseGraphicsContext() { ASSERT_NOT_REACHED(); }

    virtual void transferToNewContext(const ImageBufferCreationContext&) { }

    // Returns true on success.
    virtual bool setVolatile() { return true; }
    virtual SetNonVolatileResult setNonVolatile() { return SetNonVolatileResult::Valid; }
    virtual VolatilityState volatilityState() const { return VolatilityState::NonVolatile; }
    virtual void setVolatilityState(VolatilityState) { }

    virtual std::unique_ptr<ThreadSafeImageBufferFlusher> createFlusher() { return nullptr; }

    static constexpr RenderingMode renderingMode = RenderingMode::Unaccelerated;

    virtual bool canMapBackingStore() const = 0;
    virtual void ensureNativeImagesHaveCopiedBackingStore() { }

    virtual ImageBufferBackendSharing* toBackendSharing() { return nullptr; }

    virtual RefPtr<GraphicsLayerContentsDisplayDelegate> layerContentsDisplayDelegate() const { return nullptr; }

    const Parameters& parameters() const { return m_parameters; }

    WEBCORE_EXPORT virtual String debugDescription() const = 0;

protected:
    WEBCORE_EXPORT ImageBufferBackend(const Parameters&);

    virtual unsigned bytesPerRow() const = 0;

    IntSize size() const { return m_parameters.backendSize; };
    float resolutionScale() const { return m_parameters.resolutionScale; }
    const DestinationColorSpace& colorSpace() const { return m_parameters.colorSpace; }
    ImageBufferPixelFormat pixelFormat() const { return m_parameters.pixelFormat; }

    WEBCORE_EXPORT void getPixelBuffer(const IntRect& srcRect, const uint8_t* data, PixelBuffer& destination);
    WEBCORE_EXPORT void putPixelBuffer(const PixelBuffer&, const IntRect& srcRect, const IntPoint& destPoint, AlphaPremultiplication destFormat, uint8_t* destination);

    Parameters m_parameters;
};

WEBCORE_EXPORT TextStream& operator<<(TextStream&, VolatilityState);
WEBCORE_EXPORT TextStream& operator<<(TextStream&, const ImageBufferBackend&);

} // namespace WebCore
