/*
 * Copyright (C) 2013-2022 Apple Inc. All rights reserved.
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

#include "DataView.h"
#include "JSArrayBufferView.h"

namespace JSC {

class JSDataView : public JSArrayBufferView {
public:
    using Base = JSArrayBufferView;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    static constexpr unsigned elementSize = 1;

    static constexpr TypedArrayContentType contentType = TypedArrayContentType::None;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.dataViewSpace<mode>();
    }

    JS_EXPORT_PRIVATE static JSDataView* create(JSGlobalObject*, Structure*, RefPtr<ArrayBuffer>&&, size_t byteOffset, std::optional<size_t> byteLength);
    
    // Dummy methods, which don't actually work; these are just in place to
    // placate some template specialization we do elsewhere.
    static JSDataView* createUninitialized(JSGlobalObject*, Structure*, size_t length);
    static JSDataView* create(JSGlobalObject*, Structure*, size_t length);
    bool setFromTypedArray(JSGlobalObject*, size_t offset, JSArrayBufferView*, size_t objectOffset, size_t length, CopyType);
    bool setFromArrayLike(JSGlobalObject*, size_t offset, JSObject*, size_t objectOffset, size_t length);
    bool setIndex(JSGlobalObject*, size_t, JSValue);

    template<typename Getter>
    std::optional<size_t> viewByteLength(Getter& getter)
    {
        // https://tc39.es/proposal-resizablearraybuffer/#sec-isviewoutofbounds
        // https://tc39.es/proposal-resizablearraybuffer/#sec-getviewbytelength
        if (UNLIKELY(isDetached()))
            return std::nullopt;

        if (LIKELY(canUseRawFieldsDirectly()))
            return byteLengthRaw();

        RefPtr<ArrayBuffer> buffer = possiblySharedBuffer();
        if (!buffer)
            return 0;

        size_t bufferByteLength = getter(*buffer);
        size_t byteOffset = byteOffsetRaw();
        size_t byteLength = byteLengthRaw() + byteOffset; // Keep in mind that byteLengthRaw returns 0 for AutoLength TypedArray.
        if (byteLength > bufferByteLength)
            return std::nullopt;
        if (isAutoLength())
            return bufferByteLength - byteOffset;
        return byteLengthRaw();
    }
    
    ArrayBuffer* possiblySharedBuffer() const { return m_buffer; }
    ArrayBuffer* unsharedBuffer() const
    {
        RELEASE_ASSERT(!m_buffer->isShared());
        return m_buffer;
    }
    static constexpr ptrdiff_t offsetOfBuffer() { return OBJECT_OFFSETOF(JSDataView, m_buffer); }
    
    RefPtr<DataView> possiblySharedTypedImpl();
    RefPtr<DataView> unsharedTypedImpl();
    
    static constexpr TypedArrayType TypedArrayStorageType = TypeDataView;

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);
    
    DECLARE_EXPORT_INFO;

private:
    JSDataView(VM&, ConstructionContext&, ArrayBuffer*);

    ArrayBuffer* m_buffer;
};

class JSResizableOrGrowableSharedDataView final : public JSDataView {
public:
    using Base = JSDataView;
    using Base::StructureFlags;

    static constexpr bool isResizableOrGrowableSharedTypedArray = true;

    DECLARE_EXPORT_INFO;

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);
};

} // namespace JSC
