/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include "IntSize.h"

#include <wtf/Forward.h>
#include <wtf/WorkQueue.h>

namespace WebCore {

class ShareableBitmap;
class SharedBuffer;

WEBCORE_EXPORT WorkQueue& sharedImageTranscodingQueue();

// Given a list of files' 'paths' and 'allowedMIMETypes', the function returns a list
// of strings whose size is the same as the size of 'paths' and its entries are all
// null strings except the ones whose MIME types are not in 'allowedMIMETypes'.
WEBCORE_EXPORT Vector<String> findImagesForTranscoding(const Vector<String>& paths, const Vector<String>& allowedMIMETypes);

// Given a list of images' 'paths', this function transcodes these images to a new
// format whose UTI is destinationUTI. The result of the transcoding will be written
// to temporary files whose extensions are 'destinationExtension'. It returns a list
// of paths to the result temporary files. If an entry in 'paths' is null or an error
// happens while transcoding, a null string will be added to the returned list.
WEBCORE_EXPORT Vector<String> transcodeImages(const Vector<String>& paths, const String& destinationUTI, const String& destinationExtension);

enum class ImageDecodingError : uint8_t {
    Internal,
    BadData,
    UnsupportedType
};
WEBCORE_EXPORT String descriptionString(ImageDecodingError);
WEBCORE_EXPORT Expected<std::pair<String, Vector<IntSize>>, ImageDecodingError> utiAndAvailableSizesFromImageData(std::span<const uint8_t>);
WEBCORE_EXPORT RefPtr<SharedBuffer> createIconDataFromImageData(std::span<const uint8_t> data, std::span<const unsigned> lengths);
WEBCORE_EXPORT RefPtr<ShareableBitmap> decodeImageWithSize(std::span<const uint8_t> data, std::optional<FloatSize>);

} // namespace WebCore

