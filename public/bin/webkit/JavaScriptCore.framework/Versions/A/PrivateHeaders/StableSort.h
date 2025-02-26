/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "ArgList.h"
#include <wtf/StdLibExtras.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

static ALWAYS_INLINE bool coerceComparatorResultToBoolean(JSGlobalObject* globalObject, JSValue comparatorResult)
{
    if (LIKELY(comparatorResult.isInt32()))
        return comparatorResult.asInt32() < 0;

    // See https://bugs.webkit.org/show_bug.cgi?id=47825 on boolean special-casing
    if (comparatorResult.isBoolean())
        return !comparatorResult.asBoolean();

    return comparatorResult.toNumber(globalObject) < 0;
}

template<typename ElementType, typename Functor>
static ALWAYS_INLINE void arrayInsertionSort(VM& vm, std::span<ElementType> span, const Functor& comparator)
{
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto* array = span.data();
    size_t length = span.size();
    for (size_t i = 1; i < length; ++i) {
        auto value = array[i];
        size_t j = i;
        for (; j > 0; --j) {
            auto target = array[j - 1];
            bool result = comparator(value, target);
            RETURN_IF_EXCEPTION_WITH_TRAPS_DEFERRED(scope, void());
            if (!result)
                break;
            array[j] = target;
        }
        array[j] = value;
    }
}

template<typename ElementType, typename Functor>
static ALWAYS_INLINE void arrayMerge(VM& vm, ElementType* dst, ElementType* src, size_t srcIndex, size_t srcEnd, size_t width, const Functor& comparator)
{
    auto scope = DECLARE_THROW_SCOPE(vm);

    size_t left = srcIndex;
    size_t leftEnd = std::min<size_t>(left + width, srcEnd);
    size_t right = leftEnd;
    size_t rightEnd = std::min<size_t>(right + width, srcEnd);

    if (right >= rightEnd) {
        // The right subarray does not exist. Just copy src to dst.
        // This is OK to use WTF::copyElements since both src and dst comes from MarkedArgumentBuffer when using this function for EncodedJSValue,
        // thus marking happens after suspending the main thread completely.
        WTF::copyElements(dst + left, src + left, rightEnd - left);
        return;
    }

    bool result = comparator(src[right], src[right - 1]);
    RETURN_IF_EXCEPTION_WITH_TRAPS_DEFERRED(scope, void());
    if (!result) {
        // This entire array is already sorted.
        // This is OK to use WTF::copyElements since both src and dst comes from MarkedArgumentBuffer when using this function for EncodedJSValue,
        // thus marking happens after suspending the main thread completely.
        WTF::copyElements(dst + left, src + left, rightEnd - left);
        return;
    }

    for (size_t dstIndex = left; dstIndex < rightEnd; ++dstIndex) {
        if (right < rightEnd) {
            if (left >= leftEnd) {
                dst[dstIndex] = src[right++];
                continue;
            }
            bool result = comparator(src[right], src[left]);
            RETURN_IF_EXCEPTION_WITH_TRAPS_DEFERRED(scope, void());
            if (result) {
                dst[dstIndex] = src[right++];
                continue;
            }
        }

        dst[dstIndex] = src[left++];
    }
}

template<typename ElementType, typename Functor, size_t initialWidth = 4>
static ALWAYS_INLINE std::span<ElementType> arrayStableSort(VM& vm, std::span<ElementType> src, std::span<ElementType> dst, const Functor& comparator)
{
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto* to = dst.data();
    auto* from = src.data();
    size_t length = src.size();

    for (size_t i = 0; i < length; i += initialWidth) {
        arrayInsertionSort(vm, std::span { from + i, std::min(i + initialWidth, length) - i }, comparator);
        RETURN_IF_EXCEPTION_WITH_TRAPS_DEFERRED(scope, src);
    }

    for (size_t width = initialWidth; width < length; width *= 2) {
        for (size_t srcIndex = 0; srcIndex < length; srcIndex += 2 * width) {
            arrayMerge(vm, to, from, srcIndex, length, width, comparator);
            RETURN_IF_EXCEPTION_WITH_TRAPS_DEFERRED(scope, src);
        }
        std::swap(to, from);
    }

    return (from == src.data()) ? src : dst;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
