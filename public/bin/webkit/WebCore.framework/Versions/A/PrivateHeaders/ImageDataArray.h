/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ImageDataStorageFormat.h"
#include <JavaScriptCore/Float16Array.h>
#include <JavaScriptCore/Uint8ClampedArray.h>
#include <optional>
#include <variant>
#include <wtf/JSONValues.h>

namespace WebCore {

class ImageDataArray {
public:
    static constexpr bool isSupported(JSC::TypedArrayType type) { return !!toImageDataStorageFormat(type); }
    static bool isSupported(const JSC::ArrayBufferView&);

    ImageDataArray(Ref<JSC::Uint8ClampedArray>&&);
    ImageDataArray(Ref<JSC::Float16Array>&&);

    static std::optional<ImageDataArray> tryCreate(size_t, ImageDataStorageFormat, std::span<const uint8_t> = { });

    ImageDataStorageFormat storageFormat() const;
    size_t length() const;

    JSC::ArrayBufferView& arrayBufferView() const { return m_arrayBufferView.get(); }
    Ref<JSC::ArrayBufferView> protectedArrayBufferView() const { return m_arrayBufferView; }
    auto byteLength() const { return protectedArrayBufferView()->byteLength(); }
    auto isDetached() const { return protectedArrayBufferView()->isDetached(); }
    auto span() const { return protectedArrayBufferView()->span(); }

    Ref<JSC::Uint8ClampedArray> asUint8ClampedArray() const;
    Ref<JSC::Float16Array> asFloat16Array() const;

    Ref<JSON::Value> copyToJSONArray() const;

private:
    ImageDataArray(Ref<JSC::ArrayBufferView>&&);

    // Needed by `toJS<IDLUnion<IDLUint8ClampedArray, ...>, const ImageDataArray&>()`
    template<typename IDL, bool needsState, bool needsGlobalObject> friend struct JSConverterOverloader;
    using Variant = std::variant<RefPtr<JSC::Uint8ClampedArray>, RefPtr<JSC::Float16Array>>;
    operator Variant() const;

    Ref<JSC::ArrayBufferView> m_arrayBufferView;
};

} // namespace WebCore
