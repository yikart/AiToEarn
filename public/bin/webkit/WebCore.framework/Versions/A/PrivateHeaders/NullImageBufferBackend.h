/*
 * Copyright (C) 2023-2024 Apple Inc.  All rights reserved.
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

#include "ImageBufferBackend.h"
#include "NullGraphicsContext.h"
#include <memory.h>

namespace WebCore {

// Used for ImageBuffers that return NullGraphicsContext as the ImageBuffer::context().
// Solves the problem of holding NullGraphicsContext similarly to holding other
// GraphicsContext instances, via a ImageBuffer reference.
class WEBCORE_EXPORT NullImageBufferBackend : public ImageBufferBackend {
public:
    static std::unique_ptr<NullImageBufferBackend> create(const Parameters&, const ImageBufferCreationContext&);
    ~NullImageBufferBackend();
    static size_t calculateMemoryCost(const Parameters&) { return 0; }

    NullGraphicsContext& context() override;
    RefPtr<NativeImage> copyNativeImage() override;
    RefPtr<NativeImage> createNativeImageReference() override;
    void getPixelBuffer(const IntRect&, PixelBuffer&) override;
    void putPixelBuffer(const PixelBuffer&, const IntRect&, const IntPoint&, AlphaPremultiplication) override;
    bool canMapBackingStore() const override;
    String debugDescription() const override;

protected:
    using ImageBufferBackend::ImageBufferBackend;
    unsigned bytesPerRow() const override;

    NullGraphicsContext m_context;
};

} // namespace WebCore
