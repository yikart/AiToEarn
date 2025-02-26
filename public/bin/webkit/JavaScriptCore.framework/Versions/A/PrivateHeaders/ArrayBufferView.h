/*
 * Copyright (C) 2009-2021 Apple Inc. All rights reserved.
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

#include "ArrayBuffer.h"
#include "TypedArrayType.h"
#include <algorithm>
#include <limits.h>
#include <wtf/CheckedArithmetic.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class JSArrayBufferView;
class JSGlobalObject;
class CallFrame;

class ArrayBufferView : public RefCounted<ArrayBufferView> {
public:
    TypedArrayType getType() const { return m_type; }

    bool isDetached() const
    {
        return !m_buffer || m_buffer->isDetached();
    }
    
    RefPtr<ArrayBuffer> possiblySharedBuffer() const
    {
        if (isDetached())
            return nullptr;
        return m_buffer;
    }
    
    RefPtr<ArrayBuffer> unsharedBuffer() const
    {
        RefPtr<ArrayBuffer> result = possiblySharedBuffer();
        RELEASE_ASSERT(!result->isShared());
        return result;
    }
    
    bool isShared() const
    {
        if (isDetached())
            return false;
        return m_buffer->isShared();
    }

    void* baseAddress() const
    {
        if (isDetached())
            return nullptr;
        return m_baseAddress.getMayBeNull();
    }

    void* data() const { return baseAddress(); }
    std::span<const uint8_t> span() const { return { static_cast<const uint8_t*>(data()), byteLength() }; }
    std::span<uint8_t> mutableSpan() const { return { static_cast<uint8_t*>(data()), byteLength() }; }
    Vector<uint8_t> toVector() const { return span(); }

    size_t byteOffsetRaw() const { return m_byteOffset; }

    size_t byteOffset() const
    {
        if (UNLIKELY(isDetached()))
            return 0;

        if (LIKELY(!isResizableOrGrowableShared()))
            return byteOffsetRaw();

        size_t bufferByteLength = m_buffer->byteLength(std::memory_order_seq_cst);
        size_t byteOffsetStart = byteOffsetRaw();
        size_t byteOffsetEnd = 0;
        if (isAutoLength())
            byteOffsetEnd = bufferByteLength;
        else
            byteOffsetEnd = byteOffsetStart + byteLengthRaw();
        if (UNLIKELY(!(byteOffsetStart > bufferByteLength || byteOffsetEnd > bufferByteLength)))
            return 0;
        return byteOffsetRaw();
    }

    size_t byteLengthRaw() const { return m_byteLength; }

    size_t byteLength() const
    {
        if (UNLIKELY(isDetached()))
            return 0;

        if (LIKELY(!isResizableOrGrowableShared()))
            return byteLengthRaw();

        size_t bufferByteLength = m_buffer->byteLength(std::memory_order_seq_cst);
        size_t byteOffsetStart = byteOffsetRaw();
        size_t byteOffsetEnd = 0;
        if (isAutoLength())
            byteOffsetEnd = bufferByteLength;
        else
            byteOffsetEnd = byteOffsetStart + byteLengthRaw();
        if (UNLIKELY(!(byteOffsetStart > bufferByteLength || byteOffsetEnd > bufferByteLength)))
            return 0;
        if (!isAutoLength())
            return byteLengthRaw();
        return roundDownToMultipleOf(JSC::elementSize(m_type), bufferByteLength - byteOffsetStart);
    }

    JS_EXPORT_PRIVATE void setDetachable(bool);
    bool isDetachable() const { return m_isDetachable; }
    bool isResizableOrGrowableShared() const { return m_isResizableNonShared || m_isGrowableShared; }
    bool isResizableNonShared() const { return m_isResizableNonShared; }
    bool isGrowableShared() const { return m_isGrowableShared; }
    bool isAutoLength() const { return m_isAutoLength; }

    inline ~ArrayBufferView();

    // Helper to verify byte offset is size aligned.
    static bool verifyByteOffsetAlignment(size_t byteOffset, size_t elementSize)
    {
        return !(byteOffset & (elementSize - 1));
    }

    // Helper to verify that a given sub-range of an ArrayBuffer is within range.
    static bool verifySubRangeLength(size_t byteLength, size_t byteOffset, size_t numElements, unsigned elementSize)
    {
        if (byteOffset > byteLength)
            return false;
        size_t remainingElements = (byteLength - byteOffset) / static_cast<size_t>(elementSize);
        if (numElements > remainingElements)
            return false;
        return true;
    }

    JS_EXPORT_PRIVATE JSArrayBufferView* wrap(JSGlobalObject* lexicalGlobalObject, JSGlobalObject* globalObject);

    JS_EXPORT_PRIVATE void operator delete(ArrayBufferView*, std::destroying_delete_t);

protected:
    JS_EXPORT_PRIVATE ArrayBufferView(TypedArrayType, RefPtr<ArrayBuffer>&&, size_t byteOffset, std::optional<size_t> byteLength);

    inline bool setImpl(ArrayBufferView*, size_t byteOffset);

    inline bool setRangeImpl(const void* data, size_t dataByteLength, size_t byteOffset);
    inline bool getRangeImpl(void* destination, size_t dataByteLength, size_t byteOffset);

    inline bool zeroRangeImpl(size_t byteOffset, size_t rangeByteLength);

    // Input offset is in number of elements from this array's view;
    // output offset is in number of bytes from the underlying buffer's view.
    template <typename T>
    static void clampOffsetAndNumElements(
        const ArrayBuffer& buffer,
        size_t arrayByteOffset,
        size_t *offset,
        size_t *numElements)
    {
        size_t byteLength = buffer.byteLength();
        size_t maxOffset = (std::numeric_limits<size_t>::max() - arrayByteOffset) / sizeof(T);
        if (*offset > maxOffset) {
            *offset = byteLength;
            *numElements = 0;
            return;
        }
        CheckedSize adjustedOffset = *offset;
        adjustedOffset *= sizeof(T);
        adjustedOffset += arrayByteOffset;
        if (adjustedOffset.hasOverflowed() || adjustedOffset.value() > byteLength)
            *offset = byteLength;
        else
            *offset = adjustedOffset.value();
        size_t remainingElements = (byteLength - *offset) / sizeof(T);
        *numElements = std::min(remainingElements, *numElements);
    }

    TypedArrayType m_type { TypedArrayType::NotTypedArray };
    bool m_isDetachable { true };
    bool m_isResizableNonShared : 1 { false };
    bool m_isGrowableShared : 1 { false };
    bool m_isAutoLength : 1 { false };
    size_t m_byteOffset;
    size_t m_byteLength;

    using BaseAddress = CagedPtr<Gigacage::Primitive, void>;
    // This is the address of the ArrayBuffer's storage, plus the byte offset.
    BaseAddress m_baseAddress;

private:
    friend class ArrayBuffer;
    template<typename Visitor> constexpr decltype(auto) visitDerived(Visitor&&);
    template<typename Visitor> constexpr decltype(auto) visitDerived(Visitor&&) const;

    RefPtr<ArrayBuffer> m_buffer;
};

ArrayBufferView::~ArrayBufferView()
{
    if (!m_isDetachable)
        m_buffer->unpin();
}

bool ArrayBufferView::setImpl(ArrayBufferView* array, size_t byteOffset)
{
    size_t byteLength = this->byteLength();
    size_t arrayByteLength = array->byteLength();
    if (!isSumSmallerThanOrEqual(byteOffset, arrayByteLength, byteLength))
        return false;

    uint8_t* base = static_cast<uint8_t*>(baseAddress());
    memmove(base + byteOffset, array->baseAddress(), arrayByteLength);
    return true;
}

bool ArrayBufferView::setRangeImpl(const void* data, size_t dataByteLength, size_t byteOffset)
{
    size_t byteLength = this->byteLength();
    if (!isSumSmallerThanOrEqual(byteOffset, dataByteLength, byteLength))
        return false;

    uint8_t* base = static_cast<uint8_t*>(baseAddress());
    memmove(base + byteOffset, data, dataByteLength);
    return true;
}

bool ArrayBufferView::getRangeImpl(void* destination, size_t dataByteLength, size_t byteOffset)
{
    if (!isSumSmallerThanOrEqual(byteOffset, dataByteLength, byteLength()))
        return false;

    const uint8_t* base = static_cast<const uint8_t*>(baseAddress());
    memmove(destination, base + byteOffset, dataByteLength);
    return true;
}

bool ArrayBufferView::zeroRangeImpl(size_t byteOffset, size_t rangeByteLength)
{
    if (!isSumSmallerThanOrEqual(byteOffset, rangeByteLength, byteLength()))
        return false;

    uint8_t* base = static_cast<uint8_t*>(baseAddress());
    memset(base + byteOffset, 0, rangeByteLength);
    return true;
}

} // namespace JSC

using JSC::ArrayBufferView;

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
