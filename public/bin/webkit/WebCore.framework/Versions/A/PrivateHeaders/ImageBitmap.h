/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

#include "ExceptionOr.h"
#include "IDLTypes.h"
#include "ScriptWrappable.h"
#include <atomic>
#include <wtf/RefCounted.h>
#include <wtf/UniqueRef.h>

namespace JSC {
class ArrayBuffer;
}

using JSC::ArrayBuffer;

namespace WebCore {

class Blob;
class CachedImage;
class CanvasBase;
class CSSStyleImageValue;
class DestinationColorSpace;
class FloatSize;
class HTMLCanvasElement;
class HTMLImageElement;
class HTMLVideoElement;
class ImageBitmapImageObserver;
class ImageData;
class ImageBuffer;
class IntRect;
class IntSize;
#if ENABLE(OFFSCREEN_CANVAS)
class OffscreenCanvas;
#endif
class PendingImageBitmap;
class RenderElement;
class ScriptExecutionContext;
class SerializedImageBuffer;
class SVGImageElement;
#if ENABLE(WEB_CODECS)
class WebCodecsVideoFrame;
#endif
enum class RenderingMode : uint8_t;

struct ImageBitmapOptions;

template<typename IDLType> class DOMPromiseDeferred;

class DetachedImageBitmap {
public:
    DetachedImageBitmap(DetachedImageBitmap&&);
    WEBCORE_EXPORT ~DetachedImageBitmap();
    DetachedImageBitmap& operator=(DetachedImageBitmap&&);
    size_t memoryCost() const;
private:
    DetachedImageBitmap(UniqueRef<SerializedImageBuffer>, bool originClean, bool premultiplyAlpha, bool forciblyPremultiplyAlpha);
    UniqueRef<SerializedImageBuffer> m_bitmap;
    bool m_originClean : 1 { false };
    bool m_premultiplyAlpha : 1 { false };
    bool m_forciblyPremultiplyAlpha : 1 { false };
    friend class ImageBitmap;
};

class ImageBitmap final : public ScriptWrappable, public RefCounted<ImageBitmap> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(ImageBitmap);
public:
    using Source = std::variant<
        RefPtr<HTMLImageElement>,
#if ENABLE(VIDEO)
        RefPtr<HTMLVideoElement>,
#endif
        RefPtr<HTMLCanvasElement>,
        RefPtr<SVGImageElement>,
        RefPtr<ImageBitmap>,
#if ENABLE(OFFSCREEN_CANVAS)
        RefPtr<OffscreenCanvas>,
#endif
        RefPtr<CSSStyleImageValue>,
#if ENABLE(WEB_CODECS)
        RefPtr<WebCodecsVideoFrame>,
#endif
        RefPtr<Blob>,
        RefPtr<ImageData>
    >;

    using Promise = DOMPromiseDeferred<IDLInterface<ImageBitmap>>;

    using ImageBitmapCompletionHandler = CompletionHandler<void(ExceptionOr<Ref<ImageBitmap>>&&)>;
    static void createCompletionHandler(ScriptExecutionContext&, Source&&, ImageBitmapOptions&&, ImageBitmapCompletionHandler&&);

    static void createPromise(ScriptExecutionContext&, Source&&, ImageBitmapOptions&&, Promise&&);
    static void createPromise(ScriptExecutionContext&, Source&&, ImageBitmapOptions&&, int sx, int sy, int sw, int sh, Promise&&);

    static RefPtr<ImageBuffer> createImageBuffer(ScriptExecutionContext&, const FloatSize&, RenderingMode, DestinationColorSpace, float resolutionScale = 1);
    static RefPtr<ImageBuffer> createImageBuffer(ScriptExecutionContext&, const FloatSize&, DestinationColorSpace, float resolutionScale = 1);

    static RefPtr<ImageBitmap> create(ScriptExecutionContext&, const IntSize&, DestinationColorSpace);
    static Ref<ImageBitmap> create(ScriptExecutionContext&, DetachedImageBitmap);
    static Ref<ImageBitmap> create(Ref<ImageBuffer>, bool originClean, bool premultiplyAlpha = false, bool forciblyPremultiplyAlpha = false);

    ~ImageBitmap();

    ImageBuffer* buffer() const;

    RefPtr<ImageBuffer> takeImageBuffer();

    unsigned width() const;
    unsigned height() const;

    bool originClean() const { return m_originClean; }
    bool premultiplyAlpha() const { return m_premultiplyAlpha; }
    bool forciblyPremultiplyAlpha() const { return m_forciblyPremultiplyAlpha; }

    std::optional<DetachedImageBitmap> detach();
    bool isDetached() const { return !m_bitmap; }
    void close();

#if USE(SKIA)
    void prepareForCrossThreadTransfer();
    void finalizeCrossThreadTransfer();
#endif

    size_t memoryCost() const;
private:
    friend class ImageBitmapImageObserver;
    friend class PendingImageBitmap;
    ImageBitmap(Ref<ImageBuffer>, bool originClean, bool premultiplyAlpha, bool forciblyPremultiplyAlpha);
    static Ref<ImageBitmap> createBlankImageBuffer(ScriptExecutionContext&, bool originClean);

    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<HTMLImageElement>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<SVGImageElement>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    static void createCompletionHandler(ScriptExecutionContext&, CachedImage*, RenderElement*, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
#if ENABLE(VIDEO)
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<HTMLVideoElement>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
#endif
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<ImageBitmap>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<HTMLCanvasElement>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
#if ENABLE(OFFSCREEN_CANVAS)
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<OffscreenCanvas>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
#endif
#if ENABLE(WEB_CODECS)
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<WebCodecsVideoFrame>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
#endif
    static void createCompletionHandler(ScriptExecutionContext&, CanvasBase&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<Blob>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<ImageData>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    static void createCompletionHandler(ScriptExecutionContext&, RefPtr<CSSStyleImageValue>&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    static void createFromBuffer(ScriptExecutionContext&, Ref<ArrayBuffer>&&, String mimeType, long long expectedContentLength, const URL&, ImageBitmapOptions&&, std::optional<IntRect>, ImageBitmapCompletionHandler&&);
    void updateMemoryCost();

    RefPtr<ImageBuffer> m_bitmap;
    std::atomic<size_t> m_memoryCost { 0 };
    const bool m_originClean : 1 { false };
    const bool m_premultiplyAlpha : 1 { false };
    const bool m_forciblyPremultiplyAlpha : 1 { false };
};

}
