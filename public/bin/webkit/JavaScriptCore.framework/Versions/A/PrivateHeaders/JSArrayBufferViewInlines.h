/*
 * Copyright (C) 2013, 2016 Apple Inc. All rights reserved.
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

#include "ArrayBufferView.h"
#include "JSArrayBufferView.h"
#include "JSDataView.h"
#include "TypedArrayType.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

namespace JSC {

inline bool JSArrayBufferView::isShared()
{
    switch (m_mode) {
    case WastefulTypedArray:
    case ResizableNonSharedWastefulTypedArray:
    case ResizableNonSharedAutoLengthWastefulTypedArray:
    case GrowableSharedWastefulTypedArray:
    case GrowableSharedAutoLengthWastefulTypedArray:
        return existingBufferInButterfly()->isShared();
    case DataViewMode:
    case ResizableNonSharedDataViewMode:
    case ResizableNonSharedAutoLengthDataViewMode:
    case GrowableSharedDataViewMode:
    case GrowableSharedAutoLengthDataViewMode:
        return jsCast<JSDataView*>(this)->possiblySharedBuffer()->isShared();
    default:
        return false;
    }
}

template<JSArrayBufferView::Requester requester>
inline ArrayBuffer* JSArrayBufferView::possiblySharedBufferImpl()
{
    if (requester == ConcurrentThread)
        ASSERT(m_mode != FastTypedArray && m_mode != OversizeTypedArray);

    switch (m_mode) {
    case WastefulTypedArray:
    case ResizableNonSharedWastefulTypedArray:
    case ResizableNonSharedAutoLengthWastefulTypedArray:
    case GrowableSharedWastefulTypedArray:
    case GrowableSharedAutoLengthWastefulTypedArray:
        return existingBufferInButterfly();
    case DataViewMode:
    case ResizableNonSharedDataViewMode:
    case ResizableNonSharedAutoLengthDataViewMode:
    case GrowableSharedDataViewMode:
    case GrowableSharedAutoLengthDataViewMode:
        return jsCast<JSDataView*>(this)->possiblySharedBuffer();
    case FastTypedArray:
    case OversizeTypedArray:
        return slowDownAndWasteMemory();
    }
    ASSERT_NOT_REACHED();
    return nullptr;
}

inline ArrayBuffer* JSArrayBufferView::possiblySharedBuffer()
{
    return possiblySharedBufferImpl<Mutator>();
}

inline RefPtr<ArrayBufferView> JSArrayBufferView::unsharedImpl()
{
    RefPtr<ArrayBufferView> result = possiblySharedImpl();
    RELEASE_ASSERT(!result || !result->isShared());
    return result;
}

inline RefPtr<ArrayBufferView> JSArrayBufferView::toWrapped(VM&, JSValue value)
{
    if (JSArrayBufferView* view = jsDynamicCast<JSArrayBufferView*>(value)) {
        if (!view->isShared() && !view->isResizableOrGrowableShared())
            return view->unsharedImpl();
    }
    return nullptr;
}

inline RefPtr<ArrayBufferView> JSArrayBufferView::toWrappedAllowShared(VM&, JSValue value)
{
    if (JSArrayBufferView* view = jsDynamicCast<JSArrayBufferView*>(value)) {
        if (!view->isResizableOrGrowableShared())
            return view->possiblySharedImpl();
    }
    return nullptr;
}

template<typename Getter>
bool isArrayBufferViewOutOfBounds(JSArrayBufferView* view, Getter& getter)
{
    // https://tc39.es/proposal-resizablearraybuffer/#sec-isintegerindexedobjectoutofbounds
    // https://tc39.es/proposal-resizablearraybuffer/#sec-isarraybufferviewoutofbounds
    //
    // This function should work with DataView too.

    if (UNLIKELY(view->isDetached()))
        return true;

    if (LIKELY(!view->isResizableOrGrowableShared()))
        return false;

    ASSERT(hasArrayBuffer(view->mode()) && isResizableOrGrowableShared(view->mode()));
    RefPtr<ArrayBuffer> buffer = view->possiblySharedBuffer();
    if (!buffer)
        return true;

    size_t bufferByteLength = getter(*buffer);
    size_t byteOffsetStart = view->byteOffsetRaw();
    size_t byteOffsetEnd = 0;
    if (view->isAutoLength())
        byteOffsetEnd = bufferByteLength;
    else
        byteOffsetEnd = byteOffsetStart + view->byteLengthRaw();

    return byteOffsetStart > bufferByteLength || byteOffsetEnd > bufferByteLength;
}

template<typename Getter>
bool isIntegerIndexedObjectOutOfBounds(JSArrayBufferView* typedArray, Getter& getter)
{
    return isArrayBufferViewOutOfBounds(typedArray, getter);
}

template<typename Getter>
std::optional<size_t> integerIndexedObjectLength(JSArrayBufferView* typedArray, Getter& getter)
{
    // https://tc39.es/proposal-resizablearraybuffer/#sec-integerindexedobjectlength

    if (UNLIKELY(isIntegerIndexedObjectOutOfBounds(typedArray, getter)))
        return std::nullopt;

    if (LIKELY(!typedArray->isAutoLength()))
        return typedArray->lengthRaw();

    ASSERT(hasArrayBuffer(typedArray->mode()) && isResizableOrGrowableShared(typedArray->mode()));
    RefPtr<ArrayBuffer> buffer = typedArray->possiblySharedBuffer();
    if (!buffer)
        return std::nullopt;

    size_t bufferByteLength = getter(*buffer);
    size_t byteOffset = typedArray->byteOffsetRaw();
    return (bufferByteLength - byteOffset) >> logElementSize(typedArray->type());
}

template<typename Getter>
size_t integerIndexedObjectByteLength(JSArrayBufferView* typedArray, Getter& getter)
{
    std::optional<size_t> length = integerIndexedObjectLength(typedArray, getter);
    if (!length || !length.value())
        return 0;

    if (LIKELY(!typedArray->isAutoLength()))
        return typedArray->byteLengthRaw();

    return length.value() << logElementSize(typedArray->type());
}

inline JSArrayBufferView* validateTypedArray(JSGlobalObject* globalObject, JSArrayBufferView* typedArray)
{
    // https://tc39.es/ecma262/#sec-validatetypedarray
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (UNLIKELY(!isTypedView(typedArray->type()))) {
        throwTypeError(globalObject, scope, "Argument needs to be a typed array."_s);
        return nullptr;
    }

    IdempotentArrayBufferByteLengthGetter<std::memory_order_seq_cst> getter;
    if (UNLIKELY(isIntegerIndexedObjectOutOfBounds(typedArray, getter))) {
        throwTypeError(globalObject, scope, typedArrayBufferHasBeenDetachedErrorMessage);
        return nullptr;
    }
    return typedArray;
}

inline JSArrayBufferView* validateTypedArray(JSGlobalObject* globalObject, JSValue typedArrayValue)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    if (UNLIKELY(!typedArrayValue.isCell())) {
        throwTypeError(globalObject, scope, "Argument needs to be a typed array."_s);
        return nullptr;
    }

    JSCell* typedArrayCell = typedArrayValue.asCell();
    if (UNLIKELY(!isTypedView(typedArrayCell->type()))) {
        throwTypeError(globalObject, scope, "Argument needs to be a typed array."_s);
        return nullptr;
    }

    RELEASE_AND_RETURN(scope, validateTypedArray(globalObject, jsCast<JSArrayBufferView*>(typedArrayCell)));
}

} // namespace JSC
