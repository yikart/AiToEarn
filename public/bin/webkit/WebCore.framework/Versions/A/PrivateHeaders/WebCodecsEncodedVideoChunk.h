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

#if ENABLE(WEB_CODECS)

#include "BufferSource.h"
#include "ExceptionOr.h"
#include "WebCodecsEncodedVideoChunkData.h"
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class WebCodecsEncodedVideoChunkStorage : public ThreadSafeRefCounted<WebCodecsEncodedVideoChunkStorage> {
public:
    static Ref<WebCodecsEncodedVideoChunkStorage> create(WebCodecsEncodedVideoChunkType type, int64_t timestamp, std::optional<uint64_t> duration, Vector<uint8_t>&& buffer) { return create(WebCodecsEncodedVideoChunkData { type, timestamp, duration, WTFMove(buffer) }); }
    static Ref<WebCodecsEncodedVideoChunkStorage> create(WebCodecsEncodedVideoChunkData&& data) { return adoptRef(* new WebCodecsEncodedVideoChunkStorage(WTFMove(data))); }

    const WebCodecsEncodedVideoChunkData& data() const { return m_data; }
    uint64_t memoryCost() const { return m_data.buffer.size(); }

private:
    explicit WebCodecsEncodedVideoChunkStorage(WebCodecsEncodedVideoChunkData&&);

    const WebCodecsEncodedVideoChunkData m_data;
};

class WebCodecsEncodedVideoChunk : public RefCounted<WebCodecsEncodedVideoChunk> {
public:
    ~WebCodecsEncodedVideoChunk() = default;

    struct Init {
        WebCodecsEncodedVideoChunkType type { WebCodecsEncodedVideoChunkType::Key };
        int64_t timestamp { 0 };
        std::optional<uint64_t> duration;
        BufferSource data;
    };

    static Ref<WebCodecsEncodedVideoChunk> create(Init&& init) { return adoptRef(*new WebCodecsEncodedVideoChunk(WTFMove(init))); }
    static Ref<WebCodecsEncodedVideoChunk> create(Ref<WebCodecsEncodedVideoChunkStorage>&& storage) { return adoptRef(*new WebCodecsEncodedVideoChunk(WTFMove(storage))); }

    WebCodecsEncodedVideoChunkType type() const { return m_storage->data().type; };
    int64_t timestamp() const { return m_storage->data().timestamp; }
    std::optional<uint64_t> duration() const { return m_storage->data().duration; }
    size_t byteLength() const { return m_storage->data().buffer.size(); }

    ExceptionOr<void> copyTo(BufferSource&&);

    std::span<const uint8_t> span() const { return m_storage->data().buffer.span(); }
    WebCodecsEncodedVideoChunkStorage& storage() { return m_storage.get(); }

private:
    explicit WebCodecsEncodedVideoChunk(Init&&);
    explicit WebCodecsEncodedVideoChunk(Ref<WebCodecsEncodedVideoChunkStorage>&&);

    Ref<WebCodecsEncodedVideoChunkStorage> m_storage;
};

inline WebCodecsEncodedVideoChunkStorage::WebCodecsEncodedVideoChunkStorage(WebCodecsEncodedVideoChunkData&& data)
    : m_data { WTFMove(data) }
{
}

inline WebCodecsEncodedVideoChunk::WebCodecsEncodedVideoChunk(Ref<WebCodecsEncodedVideoChunkStorage>&& storage)
    : m_storage(WTFMove(storage))
{
}

}

#endif // ENABLE(WEB_CODECS)
