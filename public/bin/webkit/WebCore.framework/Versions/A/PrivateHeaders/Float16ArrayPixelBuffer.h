/*
 * Copyright (C) 2024 Apple Inc.  All rights reserved.
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

#if HAVE(HDR_SUPPORT)

#include "PixelBuffer.h"
#include <JavaScriptCore/Float16Array.h>

namespace WebCore {

class Float16ArrayPixelBuffer : public PixelBuffer {
public:
    WEBCORE_EXPORT static Ref<Float16ArrayPixelBuffer> create(const PixelBufferFormat&, const IntSize&, JSC::Float16Array&);
    WEBCORE_EXPORT static std::optional<Ref<Float16ArrayPixelBuffer>> create(const PixelBufferFormat&, const IntSize&, std::span<const Float16> data);

    WEBCORE_EXPORT static RefPtr<Float16ArrayPixelBuffer> tryCreate(const PixelBufferFormat&, const IntSize&);
    WEBCORE_EXPORT static RefPtr<Float16ArrayPixelBuffer> tryCreate(const PixelBufferFormat&, const IntSize&, Ref<JSC::ArrayBuffer>&&);

    JSC::Float16Array& data() const { return m_data.get(); }
    Ref<JSC::Float16Array>&& takeData() { return WTFMove(m_data); }
    WEBCORE_EXPORT std::span<const uint8_t> span() const;

    Type type() const override { return Type::Float16Array; }
    RefPtr<PixelBuffer> createScratchPixelBuffer(const IntSize&) const override;

private:
    Float16ArrayPixelBuffer(const PixelBufferFormat&, const IntSize&, Ref<JSC::Float16Array>&&);

    Ref<JSC::Float16Array> m_data;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Float16ArrayPixelBuffer)
    static bool isType(const WebCore::PixelBuffer& pixelBuffer) { return pixelBuffer.type() == WebCore::PixelBuffer::Type::Float16Array; }
SPECIALIZE_TYPE_TRAITS_END()

#endif // HAVE(HDR_SUPPORT)
