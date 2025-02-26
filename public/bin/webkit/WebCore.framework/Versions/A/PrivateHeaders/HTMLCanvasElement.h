/*
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2007 Alp Toker <alp@atoker.com>
 * Copyright (C) 2010 Torch Mobile (Beijing) Co. Ltd. All rights reserved.
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

#include "ActiveDOMObject.h"
#include "CanvasBase.h"
#include "Document.h"
#include "FloatRect.h"
#include "GraphicsTypes.h"
#include "HTMLElement.h"
#include <memory>
#include <wtf/Forward.h>

#if ENABLE(WEBGL)
#include "WebGLContextAttributes.h"
#endif

namespace WebCore {

class BlobCallback;
class CanvasRenderingContext;
class CanvasRenderingContext2D;
class GPU;
class GPUCanvasContext;
class GraphicsContext;
class Image;
class ImageBitmapRenderingContext;
class ImageBuffer;
class ImageData;
class MediaStream;
class OffscreenCanvas;
class VideoFrame;
class WebGLRenderingContextBase;
class WebCoreOpaqueRoot;
struct CanvasRenderingContext2DSettings;
struct ImageBitmapRenderingContextSettings;
struct UncachedString;

class HTMLCanvasElement final : public HTMLElement, public CanvasBase, public ActiveDOMObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLCanvasElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLCanvasElement);
public:
    static Ref<HTMLCanvasElement> create(Document&);
    static Ref<HTMLCanvasElement> create(const QualifiedName&, Document&);
    virtual ~HTMLCanvasElement();

    WEBCORE_EXPORT ExceptionOr<void> setWidth(unsigned);
    WEBCORE_EXPORT ExceptionOr<void> setHeight(unsigned);

    void setSize(const IntSize& newSize) override;

    CanvasRenderingContext* renderingContext() const final { return m_context.get(); }
    ExceptionOr<std::optional<RenderingContext>> getContext(JSC::JSGlobalObject&, const String& contextId, FixedVector<JSC::Strong<JSC::Unknown>>&& arguments);

    CanvasRenderingContext* getContext(const String&);

    static bool is2dType(const String&);
    CanvasRenderingContext2D* createContext2d(const String&, CanvasRenderingContext2DSettings&&);
    CanvasRenderingContext2D* getContext2d(const String&, CanvasRenderingContext2DSettings&&);

#if ENABLE(WEBGL)
    static bool isWebGLType(const String&);
    static WebGLVersion toWebGLVersion(const String&);
    WebGLRenderingContextBase* createContextWebGL(WebGLVersion type, WebGLContextAttributes&& = { });
    WebGLRenderingContextBase* getContextWebGL(WebGLVersion type, WebGLContextAttributes&& = { });
#endif

    static bool isBitmapRendererType(const String&);
    ImageBitmapRenderingContext* createContextBitmapRenderer(const String&, ImageBitmapRenderingContextSettings&&);
    ImageBitmapRenderingContext* getContextBitmapRenderer(const String&, ImageBitmapRenderingContextSettings&&);

    static bool isWebGPUType(const String&);
    GPUCanvasContext* createContextWebGPU(const String&, GPU*);
    GPUCanvasContext* getContextWebGPU(const String&, GPU*);

    WEBCORE_EXPORT ExceptionOr<UncachedString> toDataURL(const String& mimeType, JSC::JSValue quality);
    WEBCORE_EXPORT ExceptionOr<UncachedString> toDataURL(const String& mimeType);
    ExceptionOr<void> toBlob(Ref<BlobCallback>&&, const String& mimeType, JSC::JSValue quality);
#if ENABLE(OFFSCREEN_CANVAS)
    ExceptionOr<Ref<OffscreenCanvas>> transferControlToOffscreen();
#endif

    // Used for rendering
    void didDraw(const std::optional<FloatRect>&, ShouldApplyPostProcessingToDirtyRect) final;

    void paint(GraphicsContext&, const LayoutRect&);

#if ENABLE(MEDIA_STREAM) || ENABLE(WEB_CODECS)
    // Returns the context drawing buffer as a VideoFrame.
    RefPtr<VideoFrame> toVideoFrame();
#endif
#if ENABLE(MEDIA_STREAM)
    ExceptionOr<Ref<MediaStream>> captureStream(std::optional<double>&& frameRequestRate);
#endif

    const CSSParserContext& cssParserContext() const final;

    Image* copiedImage() const final;
    void clearCopiedImage() const final;
    RefPtr<ImageData> getImageData();

    SecurityOrigin* securityOrigin() const final;

    // FIXME(https://bugs.webkit.org/show_bug.cgi?id=275100): Only some canvas rendering contexts need an ImageBuffer.
    // It would be better to have the contexts own the buffers.
    void setImageBufferAndMarkDirty(RefPtr<ImageBuffer>&&) final;

    bool needsPreparationForDisplay();
    void prepareForDisplay();

    void setIsSnapshotting(bool isSnapshotting) { m_isSnapshotting = isSnapshotting; }
    bool isSnapshotting() const { return m_isSnapshotting; }

    bool isControlledByOffscreen() const;

    void queueTaskKeepingObjectAlive(TaskSource, Function<void()>&&) final;
    void dispatchEvent(Event&) final;

    // ActiveDOMObject.
    void ref() const final { HTMLElement::ref(); }
    void deref() const final { HTMLElement::deref(); }

    using HTMLElement::scriptExecutionContext;

private:
    HTMLCanvasElement(const QualifiedName&, Document&);

    bool isHTMLCanvasElement() const final { return true; }

    // ActiveDOMObject.
    bool virtualHasPendingActivity() const final;

    // EventTarget.
    void eventListenersDidChange() final;

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const final;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) final;
    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) final;
    bool isReplaced(const RenderStyle&) const final;

    bool canContainRangeEndPoint() const final;
    bool canStartSelection() const final;

    void reset();

    void createImageBuffer() const final;
    void clearImageBuffer() const;

    void setSurfaceSize(const IntSize&);

    bool usesContentsAsLayerContents() const;

    void refCanvasBase() const final { HTMLElement::ref(); }
    void derefCanvasBase() const final { HTMLElement::deref(); }

    ScriptExecutionContext* canvasBaseScriptExecutionContext() const final { return HTMLElement::scriptExecutionContext(); }

    void didMoveToNewDocument(Document& oldDocument, Document& newDocument) final;

    std::unique_ptr<CanvasRenderingContext> m_context;
    mutable RefPtr<Image> m_copiedImage; // FIXME: This is temporary for platforms that have to copy the image buffer to render (and for CSSCanvasValue).
    mutable std::unique_ptr<CSSParserContext> m_cssParserContext;
    bool m_ignoreReset { false };
    mutable bool m_didClearImageBuffer { false };
#if ENABLE(WEBGL)
    bool m_hasRelevantWebGLEventListener { false };
#endif
    bool m_isSnapshotting { false };
};

WebCoreOpaqueRoot root(HTMLCanvasElement*);

} // namespace WebCore

namespace WTF {
template<typename ArgType> class TypeCastTraits<const WebCore::HTMLCanvasElement, ArgType, false /* isBaseType */> {
public:
    static bool isOfType(ArgType& node) { return checkTagName(node); }
private:
    static bool checkTagName(const WebCore::CanvasBase& base) { return base.isHTMLCanvasElement(); }
    static bool checkTagName(const WebCore::HTMLElement& element) { return element.hasTagName(WebCore::HTMLNames::canvasTag); }
    static bool checkTagName(const WebCore::Node& node) { return node.hasTagName(WebCore::HTMLNames::canvasTag); }
    static bool checkTagName(const WebCore::EventTarget& target)
    {
        auto* node = dynamicDowncast<WebCore::Node>(target);
        return node && checkTagName(*node);
    }
};
}
