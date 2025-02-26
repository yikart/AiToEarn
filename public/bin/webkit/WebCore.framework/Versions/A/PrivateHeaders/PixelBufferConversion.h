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

#include "PixelBufferFormat.h"
#include <span>

namespace WebCore {

class IntSize;

struct PixelBufferConversionView {
    PixelBufferFormat format;
    unsigned bytesPerRow;
    uint8_t* rows;
};

struct ConstPixelBufferConversionView {
    PixelBufferFormat format;
    unsigned bytesPerRow;
    const uint8_t* rows;
};

void convertImagePixels(const ConstPixelBufferConversionView& source, const PixelBufferConversionView& destination, const IntSize&);

WEBCORE_EXPORT void copyRows(unsigned sourceBytesPerRow, const uint8_t* source, unsigned destinationBytesPerRow, uint8_t* destination, unsigned rows, unsigned copyBytesPerRow);

inline void copyRows(unsigned sourceBytesPerRow, std::span<const uint8_t> source, unsigned destinationBytesPerRow, std::span<uint8_t> destination, unsigned rows, unsigned copyBytesPerRow)
{
    if (!rows || !copyBytesPerRow)
        return;
    unsigned requiredSourceBytes = sourceBytesPerRow * (rows - 1) + copyBytesPerRow;
    if (source.size() < requiredSourceBytes) {
        ASSERT_NOT_REACHED();
        return;
    }
    unsigned requiredDestinationBytes = destinationBytesPerRow * (rows - 1) + copyBytesPerRow;
    if (destination.size() < requiredDestinationBytes) {
        ASSERT_NOT_REACHED();
        return;
    }
    if (rows > 1 && (sourceBytesPerRow < copyBytesPerRow || destinationBytesPerRow < copyBytesPerRow)) {
        ASSERT_NOT_REACHED();
        return;
    }
    copyRows(sourceBytesPerRow, source.data(), destinationBytesPerRow, destination.data(), rows, copyBytesPerRow);
}

}
