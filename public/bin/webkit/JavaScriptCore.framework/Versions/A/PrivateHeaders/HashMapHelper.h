/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "ExceptionExpectation.h"
#include "ExceptionHelpers.h"
#include "JSCJSValueInlines.h"
#include "JSObject.h"
#include "VMTrapsInlines.h"

namespace JSC {

ALWAYS_INLINE bool areKeysEqual(JSGlobalObject* globalObject, JSValue a, JSValue b)
{
    // We want +0 and -0 to be compared to true here. sameValue() itself doesn't
    // guarantee that, however, we normalize all keys before comparing and storing
    // them in the map. The normalization will convert -0.0 and 0.0 to the integer
    // representation for 0.
    return sameValue(globalObject, a, b);
}

// Note that normalization is inlined in DFG's NormalizeMapKey.
// Keep in sync with the implementation of DFG and FTL normalization.
ALWAYS_INLINE JSValue normalizeMapKey(JSValue key)
{
    if (!key.isNumber()) {
        if (key.isHeapBigInt())
            return tryConvertToBigInt32(key.asHeapBigInt());
        return key;
    }

    if (key.isInt32())
        return key;

    double d = key.asDouble();
    if (std::isnan(d))
        return jsNaN();

    int i = static_cast<int>(d);
    if (i == d) {
        // When a key is -0, we convert it to positive zero.
        // When a key is the double representation for an integer, we convert it to an integer.
        return jsNumber(i);
    }
    // This means key is definitely not negative zero, and it's definitely not a double representation of an integer.
    return key;
}

ALWAYS_INLINE uint32_t wangsInt64Hash(uint64_t key)
{
    key += ~(key << 32);
    key ^= (key >> 22);
    key += ~(key << 13);
    key ^= (key >> 8);
    key += (key << 3);
    key ^= (key >> 15);
    key += ~(key << 27);
    key ^= (key >> 31);
    return static_cast<unsigned>(key);
}

ALWAYS_INLINE uint32_t jsMapHash(JSBigInt* bigInt)
{
    return bigInt->hash();
}

template<ExceptionExpectation expection>
ALWAYS_INLINE uint32_t jsMapHashImpl(JSGlobalObject* globalObject, VM& vm, JSValue value)
{
    ASSERT_WITH_MESSAGE(normalizeMapKey(value) == value, "We expect normalized values flowing into this function.");

    if (value.isString()) {
        auto scope = DECLARE_THROW_SCOPE(vm);
        auto wtfString = asString(value)->value(globalObject);
        if constexpr (expection == ExceptionExpectation::CanThrow)
            RETURN_IF_EXCEPTION(scope, UINT_MAX);
        else
            EXCEPTION_ASSERT_UNUSED(scope, !scope.exception());
        return wtfString->impl()->hash();
    }

    if (value.isHeapBigInt())
        return jsMapHash(value.asHeapBigInt());

    return wangsInt64Hash(JSValue::encode(value));
}

ALWAYS_INLINE uint32_t jsMapHash(JSGlobalObject* globalObject, VM& vm, JSValue value)
{
    return jsMapHashImpl<ExceptionExpectation::CanThrow>(globalObject, vm, value);
}

ALWAYS_INLINE uint32_t jsMapHashForAlreadyHashedValue(JSGlobalObject* globalObject, VM& vm, JSValue value)
{
    return jsMapHashImpl<ExceptionExpectation::ShouldNotThrow>(globalObject, vm, value);
}

ALWAYS_INLINE std::optional<uint32_t> concurrentJSMapHash(JSValue key)
{
    key = normalizeMapKey(key);
    if (key.isString()) {
        JSString* string = asString(key);
        if (string->length() > 10 * 1024)
            return std::nullopt;
        const StringImpl* impl = string->tryGetValueImpl();
        if (!impl)
            return std::nullopt;
        return impl->concurrentHash();
    }

    if (key.isHeapBigInt())
        return key.asHeapBigInt()->concurrentHash();

    uint64_t rawValue = JSValue::encode(key);
    return wangsInt64Hash(rawValue);
}

static constexpr uint32_t hashMapInitialCapacity = 4;

ALWAYS_INLINE uint32_t shouldShrink(uint32_t capacity, uint32_t keyCount)
{
    return 8 * keyCount <= capacity && capacity > hashMapInitialCapacity;
}

ALWAYS_INLINE uint32_t shouldRehash(uint32_t capacity, uint32_t keyCount, uint32_t deleteCount)
{
    return 2 * (keyCount + deleteCount) >= capacity;
}

ALWAYS_INLINE uint32_t nextCapacity(uint32_t capacity, uint32_t keyCount)
{
    if (!capacity)
        return hashMapInitialCapacity;

    if (shouldShrink(capacity, keyCount)) {
        ASSERT((capacity / 2) >= hashMapInitialCapacity);
        return capacity / 2;
    }

    if (3 * keyCount <= capacity && capacity > 64) {
        // We stay at the same size if rehashing would cause us to be no more than
        // 1/3rd full. This comes up for programs like this:
        // Say the hash table grew to a key count of 64, causing it to grow to a capacity of 256.
        // Then, the table added 63 items. The load is now 127. Then, 63 items are deleted.
        // The load is still 127. Then, another item is added. The load is now 128, and we
        // decide that we need to rehash. The key count is 65, almost exactly what it was
        // when we grew to a capacity of 256. We don't really need to grow to a capacity
        // of 512 in this situation. Instead, we choose to rehash at the same size. This
        // will bring the load down to 65. We rehash into the same size when we determine
        // that the new load ratio will be under 1/3rd. (We also pick a minumum capacity
        // at which this rule kicks in because otherwise we will be too sensitive to rehashing
        // at the same capacity).
        return capacity;
    }
    return Checked<uint32_t>(capacity) * 2;
}

} // namespace JSC
