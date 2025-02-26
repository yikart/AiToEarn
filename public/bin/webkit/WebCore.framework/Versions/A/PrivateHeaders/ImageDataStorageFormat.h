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

#include "PixelFormat.h"
#include <JavaScriptCore/TypedArrayType.h>

namespace WebCore {

enum class ImageDataStorageFormat : bool {
    Uint8,
    Float16,
};

constexpr PixelFormat toPixelFormat(ImageDataStorageFormat storageFormat)
{
    switch (storageFormat) {
    case ImageDataStorageFormat::Uint8:
        break;
    case ImageDataStorageFormat::Float16:
#if HAVE(HDR_SUPPORT)
        return PixelFormat::RGBA16F;
#else
        break;
#endif
    }
    return PixelFormat::RGBA8;
}

constexpr std::optional<ImageDataStorageFormat> toImageDataStorageFormat(JSC::TypedArrayType typedArrayType)
{
    switch (typedArrayType) {
    case JSC::TypeUint8Clamped: return ImageDataStorageFormat::Uint8;
    case JSC::TypeFloat16: return ImageDataStorageFormat::Float16;
    default: return std::nullopt;
    }
}

}
