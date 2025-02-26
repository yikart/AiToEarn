/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#include <wtf/ArgumentCoder.h>
#include <wtf/Hasher.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>

namespace WebCore {

class ThreadSafeDataBuffer;

class ThreadSafeDataBufferImpl : public ThreadSafeRefCounted<ThreadSafeDataBufferImpl> {
private:
    friend class ThreadSafeDataBuffer;
    friend struct IPC::ArgumentCoder<ThreadSafeDataBufferImpl, void>;

    static Ref<ThreadSafeDataBufferImpl> create(Vector<uint8_t>&& data)
    {
        return adoptRef(*new ThreadSafeDataBufferImpl(WTFMove(data)));
    }

    ThreadSafeDataBufferImpl(Vector<uint8_t>&& data)
        : m_data(WTFMove(data))
    {
    }

    ThreadSafeDataBufferImpl(std::span<const uint8_t> data)
        : m_data(data)
    {
    }

    Vector<uint8_t> m_data;
};

class ThreadSafeDataBuffer {
private:
    friend struct IPC::ArgumentCoder<ThreadSafeDataBuffer, void>;
public:
    static ThreadSafeDataBuffer create(Vector<uint8_t>&& data)
    {
        return ThreadSafeDataBuffer(WTFMove(data));
    }

    static ThreadSafeDataBuffer copyData(std::span<const uint8_t> data)
    {
        return ThreadSafeDataBuffer(data);
    }

    ThreadSafeDataBuffer() = default;

    ThreadSafeDataBuffer isolatedCopy() const { return *this; }
    
    const Vector<uint8_t>* data() const
    {
        return m_impl ? &m_impl->m_data : nullptr;
    }

    size_t size() const
    {
        return m_impl ? m_impl->m_data.size() : 0;
    }

    bool operator==(const ThreadSafeDataBuffer& other) const
    {
        if (!m_impl)
            return !other.m_impl;

        return m_impl->m_data == other.m_impl->m_data;
    }

private:
    static ThreadSafeDataBuffer create(RefPtr<ThreadSafeDataBufferImpl>&& impl)
    {
        return ThreadSafeDataBuffer(WTFMove(impl));
    }

    explicit ThreadSafeDataBuffer(RefPtr<ThreadSafeDataBufferImpl>&& impl)
        : m_impl(WTFMove(impl))
    {
    }

    explicit ThreadSafeDataBuffer(Vector<uint8_t>&& data)
        : m_impl(adoptRef(new ThreadSafeDataBufferImpl(WTFMove(data))))
    {
    }

    explicit ThreadSafeDataBuffer(std::span<const uint8_t> data)
        : m_impl(adoptRef(new ThreadSafeDataBufferImpl(data)))
    {
    }

    RefPtr<ThreadSafeDataBufferImpl> m_impl;
};

inline void add(Hasher& hasher, const ThreadSafeDataBuffer& buffer)
{
    auto* data = buffer.data();
    if (!data) {
        add(hasher, true);
        return;
    }
    add(hasher, false);
    add(hasher, *data);
}

} // namespace WebCore
