/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "JSCJSValue.h"
#include <wtf/AccessibleAddress.h>
#include <wtf/StdLibExtras.h>

namespace JSC {

class JSCell;
class NativeCallee;

class CalleeBits {
public:
    CalleeBits() = default;
    CalleeBits(int64_t value)
#if USE(JSVALUE64)
        : m_ptr { reinterpret_cast<void*>(value) }
#elif USE(JSVALUE32_64)
        : m_ptr { reinterpret_cast<void*>(JSValue::decode(value).payload()) }
        , m_tag { JSValue::decode(value).tag() }
#endif
    { }

    CalleeBits& operator=(JSCell* cell)
    {
        m_ptr = cell;
#if USE(JSVALUE32_64)
        m_tag = JSValue::CellTag;
#endif
        ASSERT(isCell());
        return *this;
    }

#if USE(JSVALUE32_64)
    static EncodedJSValue encodeNullCallee()
    {
        return JSValue::encode(jsNull());
    }

    static EncodedJSValue encodeJSCallee(const JSCell* cell)
    {
        if (!cell)
            return encodeNullCallee();
        return JSValue::encode(JSValue(cell));
    }

    static EncodedJSValue encodeBoxedNativeCallee(void* boxedCallee)
    {
        if (!boxedCallee)
            return encodeNullCallee();
        EncodedValueDescriptor ret;
        ret.asBits.tag = JSValue::NativeCalleeTag;
        ret.asBits.payload = reinterpret_cast<intptr_t>(boxedCallee);
        return std::bit_cast<EncodedJSValue>(ret);
    }

#elif USE(JSVALUE64)
    static EncodedJSValue encodeNullCallee()
    {
        return reinterpret_cast<EncodedJSValue>(nullptr);
    }

    static EncodedJSValue encodeJSCallee(const JSCell* cell)
    {
        if (!cell)
            return encodeNullCallee();
        return reinterpret_cast<EncodedJSValue>(cell);
    }

    static EncodedJSValue encodeBoxedNativeCallee(void* boxedCallee)
    {
        return reinterpret_cast<EncodedJSValue>(boxedCallee);
    }
#else
#error "Unsupported configuration"
#endif

    static EncodedJSValue encodeNativeCallee(NativeCallee* callee)
    {
        if (!callee)
            return encodeNullCallee();
        return encodeBoxedNativeCallee(boxNativeCallee(callee));
    }

    static void* boxNativeCalleeIfExists(NativeCallee* callee)
    {
        if (callee)
            return boxNativeCallee(callee);
        return nullptr;
    }

#if CPU(ARM64)
    // NativeCallees are sometimes stored in ThreadSafeWeakOrStrongPtr, which relies on top byte ignore, so we need to strip the top byte on ARM64.
    static constexpr uintptr_t nativeCalleeTopByteMask = std::numeric_limits<uintptr_t>::max() >> CHAR_BIT;
#endif

    static void* boxNativeCallee(NativeCallee* callee)
    {
#if USE(JSVALUE64)
        auto bits = std::bit_cast<uintptr_t>(callee);
#if CPU(ARM64)
        bits &= nativeCalleeTopByteMask;
#endif
        CalleeBits result { static_cast<int64_t>((bits - lowestAccessibleAddress()) | JSValue::NativeCalleeTag) };
        ASSERT(result.isNativeCallee());
        return result.rawPtr();
#elif USE(JSVALUE32_64)
        return std::bit_cast<void*>(std::bit_cast<uintptr_t>(callee) - lowestAccessibleAddress());
#endif
    }

    bool isNativeCallee() const
    {
#if USE(JSVALUE64)
        return (reinterpret_cast<uintptr_t>(m_ptr) & JSValue::NativeCalleeMask) == JSValue::NativeCalleeTag;
#elif USE(JSVALUE32_64)
        return m_tag == JSValue::NativeCalleeTag;
#endif
    }
    bool isCell() const { return !isNativeCallee(); }

    JSCell* asCell() const
    {
        ASSERT(!isNativeCallee());
        return static_cast<JSCell*>(m_ptr);
    }

    NativeCallee* asNativeCallee() const
    {
        ASSERT(isNativeCallee());
#if USE(JSVALUE64)
        return std::bit_cast<NativeCallee*>(static_cast<uintptr_t>(std::bit_cast<uintptr_t>(m_ptr) & ~JSValue::NativeCalleeTag) + lowestAccessibleAddress());
#elif USE(JSVALUE32_64)
        return std::bit_cast<NativeCallee*>(std::bit_cast<uintptr_t>(m_ptr) + lowestAccessibleAddress());
#endif
    }

    void* rawPtr() const { return m_ptr; }

private:
    void* m_ptr { nullptr };
#if USE(JSVALUE32_64)
    uint32_t m_tag { JSValue::EmptyValueTag };
#endif
};

} // namespace JSC
