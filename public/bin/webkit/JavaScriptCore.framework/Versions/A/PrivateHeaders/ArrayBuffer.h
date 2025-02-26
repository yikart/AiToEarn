/*
 * Copyright (C) 2009-2023 Apple Inc. All rights reserved.
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

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include "ArrayBufferSharingMode.h"
#include "BufferMemoryHandle.h"
#include "GCIncomingRefCounted.h"
#include "Watchpoint.h"
#include "Weak.h"
#include "WeakImpl.h"
#include <wtf/CagedPtr.h>
#include <wtf/CheckedArithmetic.h>
#include <wtf/PackedRefPtr.h>
#include <wtf/SharedTask.h>
#include <wtf/StdIntExtras.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class VM;
class ArrayBuffer;
class ArrayBufferView;
class JSArrayBuffer;

using ArrayBufferDestructorFunction = RefPtr<SharedTask<void(void*)>>;

class SharedArrayBufferContents final : public ThreadSafeRefCounted<SharedArrayBufferContents> {
public:
    enum class Mode : uint8_t {
        Default,
        WebAssembly,
    };

    JS_EXPORT_PRIVATE ~SharedArrayBufferContents();

    static Ref<SharedArrayBufferContents> create(std::span<uint8_t> data, std::optional<size_t> maxByteLength, RefPtr<BufferMemoryHandle> memoryHandle, ArrayBufferDestructorFunction&& destructor, Mode mode)
    {
        return adoptRef(*new SharedArrayBufferContents(data, maxByteLength, WTFMove(memoryHandle), WTFMove(destructor), mode));
    }
    
    void* data() const { return m_data.getMayBeNull(); }

    size_t sizeInBytes(std::memory_order order) const
    {
        return m_sizeInBytes.load(order);
    }

    std::optional<size_t> maxByteLength() const
    {
        if (m_hasMaxByteLength)
            return m_maxByteLength;
        return std::nullopt;
    }

    Mode mode() const { return m_mode; }

    Expected<int64_t, GrowFailReason> grow(VM&, size_t newByteLength);
    Expected<int64_t, GrowFailReason> grow(const AbstractLocker&, VM&, size_t newByteLength);

    void updateSize(size_t sizeInBytes, std::memory_order order = std::memory_order_seq_cst)
    {
        m_sizeInBytes.store(sizeInBytes, order);
    }

    BufferMemoryHandle* memoryHandle() const { return m_memoryHandle.get(); }

    static constexpr ptrdiff_t offsetOfSizeInBytes() { return OBJECT_OFFSETOF(SharedArrayBufferContents, m_sizeInBytes); }
    
private:
    SharedArrayBufferContents(std::span<uint8_t> data, std::optional<size_t> maxByteLength, RefPtr<BufferMemoryHandle> memoryHandle, ArrayBufferDestructorFunction&& destructor, Mode mode)
        : m_data(data.data())
        , m_destructor(WTFMove(destructor))
        , m_memoryHandle(WTFMove(memoryHandle))
        , m_sizeInBytes(data.size())
        , m_maxByteLength(maxByteLength.value_or(data.size()))
        , m_hasMaxByteLength(!!maxByteLength)
        , m_mode(mode)
    {
#if ASSERT_ENABLED
        if (m_hasMaxByteLength)
            ASSERT(m_memoryHandle);
#endif
    }

    using DataType = CagedPtr<Gigacage::Primitive, void>;
    DataType m_data;
    ArrayBufferDestructorFunction m_destructor;
    RefPtr<BufferMemoryHandle> m_memoryHandle;
    std::atomic<size_t> m_sizeInBytes { 0 };
    size_t m_maxByteLength;
    bool m_hasMaxByteLength : 1 { false };
    Mode m_mode : 1 { Mode::Default };
};

class ArrayBufferContents final {
    WTF_MAKE_NONCOPYABLE(ArrayBufferContents);
public:
    ArrayBufferContents() = default;
    ArrayBufferContents(void* data, size_t sizeInBytes, std::optional<size_t> maxByteLength, ArrayBufferDestructorFunction&& destructor)
        : m_data(data)
        , m_destructor(WTFMove(destructor))
        , m_sizeInBytes(sizeInBytes)
        , m_maxByteLength(maxByteLength.value_or(sizeInBytes))
        , m_hasMaxByteLength(!!maxByteLength)
    {
        RELEASE_ASSERT(m_sizeInBytes <= MAX_ARRAY_BUFFER_SIZE);
    }

    ArrayBufferContents(std::span<const uint8_t> data, std::optional<size_t> maxByteLength, ArrayBufferDestructorFunction&& destructor)
        : ArrayBufferContents(const_cast<uint8_t*>(data.data()), data.size(), maxByteLength, WTFMove(destructor))
    {
    }

    ArrayBufferContents(Ref<SharedArrayBufferContents>&& shared)
        : m_shared(WTFMove(shared))
        , m_memoryHandle(m_shared->memoryHandle())
        , m_sizeInBytes(m_shared->sizeInBytes(std::memory_order_seq_cst))
    {
        RELEASE_ASSERT(m_sizeInBytes <= MAX_ARRAY_BUFFER_SIZE);
        if (m_shared->mode() == SharedArrayBufferContents::Mode::WebAssembly) {
            m_hasMaxByteLength = false;
            m_maxByteLength = m_sizeInBytes;
        } else {
            m_hasMaxByteLength = !!m_shared->maxByteLength();
            m_maxByteLength = m_shared->maxByteLength().value_or(m_sizeInBytes);
        }
        m_data = DataType { m_shared->data() };
    }

    ArrayBufferContents(void* data, size_t sizeInBytes, size_t maxByteLength, Ref<BufferMemoryHandle>&& memoryHandle)
        : m_data(data)
        , m_memoryHandle(WTFMove(memoryHandle))
        , m_sizeInBytes(sizeInBytes)
        , m_maxByteLength(maxByteLength)
        , m_hasMaxByteLength(true)
    {
        RELEASE_ASSERT(m_sizeInBytes <= MAX_ARRAY_BUFFER_SIZE);
    }

    JS_EXPORT_PRIVATE static std::optional<ArrayBufferContents> fromSpan(std::span<const uint8_t>);

    ArrayBufferContents(ArrayBufferContents&& other)
    {
        swap(other);
    }

    ArrayBufferContents& operator=(ArrayBufferContents&& other)
    {
        ArrayBufferContents moved(WTFMove(other));
        swap(moved);
        return *this;
    }

    ~ArrayBufferContents()
    {
        if (m_destructor) {
            // FIXME: We shouldn't use getUnsafe here: https://bugs.webkit.org/show_bug.cgi?id=197698
            m_destructor->run(m_data.getUnsafe());
        }
    }
    
    explicit operator bool() { return !!m_data; }
    
    void* data() const { return m_data.getMayBeNull(); }
    void* dataWithoutPACValidation() const { return m_data.getUnsafe(); }
    size_t sizeInBytes(std::memory_order order = std::memory_order_seq_cst) const
    {
        if (m_hasMaxByteLength) {
            if (m_shared)
                return m_shared->sizeInBytes(order);
        }
        return m_sizeInBytes;
    }
    std::optional<size_t> maxByteLength() const
    {
        if (m_hasMaxByteLength)
            return m_maxByteLength;
        return std::nullopt;
    }

    std::span<uint8_t> mutableSpan() { return { static_cast<uint8_t*>(data()), sizeInBytes() }; }
    std::span<const uint8_t> span() const { return { static_cast<const uint8_t*>(data()), sizeInBytes() }; }
    
    bool isShared() const { return m_shared; }
    bool isResizableOrGrowableShared() const { return m_hasMaxByteLength; }
    bool isGrowableShared() const { return isResizableOrGrowableShared() && isShared(); }
    bool isResizableNonShared() const { return isResizableOrGrowableShared() && !isShared(); }
    
    void swap(ArrayBufferContents& other)
    {
        using std::swap;
        swap(m_data, other.m_data);
        swap(m_destructor, other.m_destructor);
        swap(m_shared, other.m_shared);
        swap(m_memoryHandle, other.m_memoryHandle);
        swap(m_sizeInBytes, other.m_sizeInBytes);
        swap(m_maxByteLength, other.m_maxByteLength);
        swap(m_hasMaxByteLength, other.m_hasMaxByteLength);
    }

    ArrayBufferContents detach()
    {
        ArrayBufferContents contents(WTFMove(*this));
        m_hasMaxByteLength = contents.m_hasMaxByteLength; // m_maxByteLength needs to be cleared while we need to keep the information that we had m_hasMaxByteLength.
        return contents;
    }

    JS_EXPORT_PRIVATE void shareWith(ArrayBufferContents&);

private:
    void reset()
    {
        m_data = nullptr;
        m_destructor = nullptr;
        m_shared = nullptr;
        m_memoryHandle = nullptr;
        m_sizeInBytes = 0;
        m_maxByteLength = 0;
        m_hasMaxByteLength = false;
    }

    friend class ArrayBuffer;

    enum class InitializationPolicy : uint8_t {
        ZeroInitialize,
        DontInitialize
    };

    void tryAllocate(size_t numElements, unsigned elementByteSize, InitializationPolicy);
    
    void makeShared();
    void copyTo(ArrayBufferContents&);

    using DataType = CagedPtr<Gigacage::Primitive, void>;
    DataType m_data { nullptr };
    ArrayBufferDestructorFunction m_destructor { nullptr };
    RefPtr<SharedArrayBufferContents> m_shared;
    RefPtr<BufferMemoryHandle> m_memoryHandle;
    size_t m_sizeInBytes { 0 };
    size_t m_maxByteLength { 0 };
    bool m_hasMaxByteLength { false };
};

class ArrayBuffer final : public GCIncomingRefCounted<ArrayBuffer> {
public:
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> create(size_t numElements, unsigned elementByteSize);
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> create(ArrayBuffer&);
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> create(std::span<const uint8_t> = { });
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> create(ArrayBufferContents&&);
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> createAdopted(std::span<const uint8_t>);
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> createFromBytes(std::span<const uint8_t> data, ArrayBufferDestructorFunction&&);
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> createShared(Ref<SharedArrayBufferContents>&&);
    JS_EXPORT_PRIVATE static RefPtr<ArrayBuffer> tryCreate(size_t numElements, unsigned elementByteSize, std::optional<size_t> maxByteLength = std::nullopt);
    JS_EXPORT_PRIVATE static RefPtr<ArrayBuffer> tryCreate(ArrayBuffer&);
    JS_EXPORT_PRIVATE static RefPtr<ArrayBuffer> tryCreate(std::span<const uint8_t> = { });
    JS_EXPORT_PRIVATE static RefPtr<ArrayBuffer> tryCreateShared(VM&, size_t numElements, unsigned elementByteSize, size_t maxByteLength);

    // Only for use by Uint8ClampedArray::tryCreateUninitialized and FragmentedSharedBuffer::tryCreateArrayBuffer.
    JS_EXPORT_PRIVATE static Ref<ArrayBuffer> createUninitialized(size_t numElements, unsigned elementByteSize);
    JS_EXPORT_PRIVATE static RefPtr<ArrayBuffer> tryCreateUninitialized(size_t numElements, unsigned elementByteSize);

    inline void* data();
    inline const void* data() const;
    inline size_t byteLength(std::memory_order = std::memory_order_relaxed) const;
    inline std::optional<size_t> maxByteLength() const;

    inline void* dataWithoutPACValidation();
    inline const void* dataWithoutPACValidation() const;
    
    void makeShared();
    void setSharingMode(ArrayBufferSharingMode);
    inline bool isShared() const;
    inline ArrayBufferSharingMode sharingMode() const { return isShared() ? ArrayBufferSharingMode::Shared : ArrayBufferSharingMode::Default; }
    inline bool isResizableOrGrowableShared() const { return m_contents.isResizableOrGrowableShared(); }
    inline bool isGrowableShared() const { return m_contents.isGrowableShared(); }
    inline bool isResizableNonShared() const { return m_contents.isResizableNonShared(); }

    inline size_t gcSizeEstimateInBytes() const;

    JS_EXPORT_PRIVATE RefPtr<ArrayBuffer> slice(double begin, double end) const;
    JS_EXPORT_PRIVATE RefPtr<ArrayBuffer> slice(double begin) const;
    JS_EXPORT_PRIVATE RefPtr<ArrayBuffer> sliceWithClampedIndex(size_t begin, size_t end) const;
    
    inline void pin();
    inline void unpin();
    inline bool isDetachable() const;
    inline void pinAndLock();
    inline bool isLocked();

    void makeWasmMemory();
    inline bool isWasmMemory();

    JS_EXPORT_PRIVATE bool transferTo(VM&, ArrayBufferContents&);
    JS_EXPORT_PRIVATE bool shareWith(ArrayBufferContents&);

    void detach(VM&);
    bool isDetached() { return !m_contents.m_data; }
    InlineWatchpointSet& detachingWatchpointSet() { return m_detachingWatchpointSet; }

    static constexpr ptrdiff_t offsetOfSizeInBytes() { return OBJECT_OFFSETOF(ArrayBuffer, m_contents) + OBJECT_OFFSETOF(ArrayBufferContents, m_sizeInBytes); }
    static constexpr ptrdiff_t offsetOfData() { return OBJECT_OFFSETOF(ArrayBuffer, m_contents) + OBJECT_OFFSETOF(ArrayBufferContents, m_data); }
    static constexpr ptrdiff_t offsetOfShared() { return OBJECT_OFFSETOF(ArrayBuffer, m_contents) + OBJECT_OFFSETOF(ArrayBufferContents, m_shared); }

    ~ArrayBuffer() { }

    JS_EXPORT_PRIVATE static Ref<SharedTask<void(void*)>> primitiveGigacageDestructor();

    Expected<int64_t, GrowFailReason> grow(VM&, size_t newByteLength);
    Expected<int64_t, GrowFailReason> resize(VM&, size_t newByteLength);

    std::span<uint8_t> mutableSpan() { return { static_cast<uint8_t*>(data()), byteLength() }; }
    std::span<const uint8_t> span() const { return { static_cast<const uint8_t*>(data()), byteLength() }; }
    Vector<uint8_t> toVector() const { return { span() }; }

private:
    static Ref<ArrayBuffer> create(size_t numElements, unsigned elementByteSize, ArrayBufferContents::InitializationPolicy);
    static Ref<ArrayBuffer> createInternal(ArrayBufferContents&&, const void*, size_t);
    static RefPtr<ArrayBuffer> tryCreate(size_t numElements, unsigned elementByteSize, std::optional<size_t> maxByteLength, ArrayBufferContents::InitializationPolicy);
    ArrayBuffer(ArrayBufferContents&&);
    inline size_t clampIndex(double index) const;
    static inline size_t clampValue(double x, size_t left, size_t right);

    void notifyDetaching(VM&);

    ArrayBufferContents m_contents;
    InlineWatchpointSet m_detachingWatchpointSet { IsWatched };
public:
    Weak<JSArrayBuffer> m_wrapper;
private:
    Checked<unsigned> m_pinCount { 0 };
    bool m_isWasmMemory { false };
    // m_locked == true means that some API user fetched m_contents directly from a TypedArray object,
    // the buffer is backed by a WebAssembly.Memory, or is a SharedArrayBuffer.
    bool m_locked { false };
};

void* ArrayBuffer::data()
{
    return m_contents.data();
}

const void* ArrayBuffer::data() const
{
    return m_contents.data();
}

void* ArrayBuffer::dataWithoutPACValidation()
{
    return m_contents.dataWithoutPACValidation();
}

const void* ArrayBuffer::dataWithoutPACValidation() const
{
    return m_contents.dataWithoutPACValidation();
}

size_t ArrayBuffer::byteLength(std::memory_order order) const
{
    return m_contents.sizeInBytes(order);
}

std::optional<size_t> ArrayBuffer::maxByteLength() const
{
    return m_contents.maxByteLength();
}

bool ArrayBuffer::isShared() const
{
    return m_contents.isShared();
}

size_t ArrayBuffer::gcSizeEstimateInBytes() const
{
    // FIXME: We probably want to scale this by the shared ref count or something.
    return sizeof(ArrayBuffer) + byteLength();
}

void ArrayBuffer::pin()
{
    m_pinCount++;
}

void ArrayBuffer::unpin()
{
    m_pinCount--;
}

bool ArrayBuffer::isDetachable() const
{
    return !m_pinCount && !m_locked && !isShared();
}

void ArrayBuffer::pinAndLock()
{
    m_locked = true;
}

bool ArrayBuffer::isLocked()
{
    return m_locked;
}

bool ArrayBuffer::isWasmMemory()
{
    return m_isWasmMemory;
}

JS_EXPORT_PRIVATE ASCIILiteral errorMessageForTransfer(ArrayBuffer*);

// https://tc39.es/proposal-resizablearraybuffer/#sec-makeidempotentarraybufferbytelengthgetter
template<std::memory_order order>
class IdempotentArrayBufferByteLengthGetter {
    WTF_MAKE_TZONE_ALLOCATED(IdempotentArrayBufferByteLengthGetter);
public:
    IdempotentArrayBufferByteLengthGetter() = default;

    size_t operator()(ArrayBuffer& buffer)
    {
        if (m_byteLength)
            return m_byteLength.value();
        size_t result = buffer.byteLength(order);
        m_byteLength = result;
        return result;
    }

private:
    std::optional<size_t> m_byteLength;
};

} // namespace JSC

using JSC::ArrayBuffer;

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
