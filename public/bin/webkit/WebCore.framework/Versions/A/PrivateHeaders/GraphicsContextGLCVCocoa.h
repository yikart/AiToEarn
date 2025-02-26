/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#if ENABLE(WEBGL) && ENABLE(VIDEO) && USE(AVFOUNDATION)

#include "GraphicsContextGLCV.h"
#include "ImageOrientation.h"
#include <memory>
#include <wtf/TZoneMalloc.h>

typedef struct __CVBuffer* CVPixelBufferRef;

namespace WebCore {
class GraphicsContextGLCocoa;

// GraphicsContextGLCV implementation for GraphicsContextGLCocoa.
// This class is part of the internal implementation of GraphicsContextGLCocoa.
class GraphicsContextGLCVCocoa final : public GraphicsContextGLCV {
    WTF_MAKE_TZONE_ALLOCATED(GraphicsContextGLCVCocoa);
public:
    static std::unique_ptr<GraphicsContextGLCVCocoa> create(GraphicsContextGLCocoa&);

    ~GraphicsContextGLCVCocoa() final;

    bool copyVideoSampleToTexture(const VideoFrameCV&, PlatformGLObject outputTexture, GCGLint level, GCGLenum internalFormat, GCGLenum format, GCGLenum type, FlipY) final;

    void invalidateKnownTextureContent(GCGLuint texture);
private:
    GraphicsContextGLCVCocoa(GraphicsContextGLCocoa&);

    RetainPtr<CVPixelBufferRef> convertPixelBuffer(CVPixelBufferRef);

    GraphicsContextGLCocoa& m_owner;
    GCGLDisplay m_display { nullptr };
    GCGLContext m_context { nullptr };
    GCGLConfig m_config { nullptr };

    PlatformGLObject m_framebuffer { 0 };
    PlatformGLObject m_yuvVertexBuffer { 0 };
    GCGLint m_yTextureUniformLocation { -1 };
    GCGLint m_uvTextureUniformLocation { -1 };
    GCGLint m_yuvFlipYUniformLocation { -1 };
    GCGLint m_yuvFlipXUniformLocation { -1 };
    GCGLint m_yuvSwapXYUniformLocation { -1 };
    GCGLint m_colorMatrixUniformLocation { -1 };
    GCGLint m_yuvPositionAttributeLocation { -1 };
    GCGLint m_yTextureSizeUniformLocation { -1 };
    GCGLint m_uvTextureSizeUniformLocation { -1 };

    struct TextureContent {
        intptr_t surface { 0 };
        uint32_t surfaceID { 0 };
        uint32_t surfaceSeed { 0 };
        GCGLint level { 0 };
        GCGLenum internalFormat { 0 };
        GCGLenum format { 0 };
        GCGLenum type { 0 };
        FlipY unpackFlipY { FlipY::No };
        ImageOrientation orientation;

        friend bool operator==(const TextureContent&, const TextureContent&) = default;
    };
    using TextureContentMap = UncheckedKeyHashMap<GCGLuint, TextureContent, IntHash<GCGLuint>, WTF::UnsignedWithZeroKeyHashTraits<GCGLuint>>;
    TextureContentMap m_knownContent;
};

}

#endif
