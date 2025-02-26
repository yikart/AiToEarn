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

#include "PixelBuffer.h"
#include <JavaScriptCore/Uint8ClampedArray.h>

namespace WebCore {

class ByteArrayPixelBuffer : public PixelBuffer {
public:
    WEBCORE_EXPORT static Ref<ByteArrayPixelBuffer> create(const PixelBufferFormat&, const IntSize&, JSC::Uint8ClampedArray&);
    WEBCORE_EXPORT static std::optional<Ref<ByteArrayPixelBuffer>> create(const PixelBufferFormat&, const IntSize&, std::span<const uint8_t> data);

    WEBCORE_EXPORT static RefPtr<ByteArrayPixelBuffer> tryCreate(const PixelBufferFormat&, const IntSize&);
    WEBCORE_EXPORT static RefPtr<ByteArrayPixelBuffer> tryCreate(const PixelBufferFormat&, const IntSize&, Ref<JSC::ArrayBuffer>&&);

    JSC::Uint8ClampedArray& data() const { return m_data.get(); }
    Ref<JSC::Uint8ClampedArray>&& takeData() { return WTFMove(m_data); }
    WEBCORE_EXPORT std::span<const uint8_t> span() const;

    Type type() const override { return Type::ByteArray; }
    RefPtr<PixelBuffer> createScratchPixelBuffer(const IntSize&) const override;

private:
    ByteArrayPixelBuffer(const PixelBufferFormat&, const IntSize&, Ref<JSC::Uint8ClampedArray>&&);

    Ref<JSC::Uint8ClampedArray> m_data;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ByteArrayPixelBuffer)
    static bool isType(const WebCore::PixelBuffer& pixelBuffer) { return pixelBuffer.type() == WebCore::PixelBuffer::Type::ByteArray; }
SPECIALIZE_TYPE_TRAITS_END()
