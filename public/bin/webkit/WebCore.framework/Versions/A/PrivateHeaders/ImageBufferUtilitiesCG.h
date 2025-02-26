/*
 * Copyright (C) 2018-2021 Apple Inc. All rights reserved.
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

#if USE(CG)

#include <optional>
#include <wtf/Forward.h>

namespace WebCore {

class PixelBuffer;

WEBCORE_EXPORT uint8_t verifyImageBufferIsBigEnough(std::span<const uint8_t> buffer);

RetainPtr<CFStringRef> utiFromImageBufferMIMEType(const String& mimeType);
CFStringRef jpegUTI();
WEBCORE_EXPORT Vector<uint8_t> encodeData(CGImageRef, const String& mimeType, std::optional<double> quality);
Vector<uint8_t> encodeData(const PixelBuffer&, const String& mimeType, std::optional<double> quality);
Vector<uint8_t> encodeData(std::span<const uint8_t>, const String& mimeType, std::optional<double> quality);

WEBCORE_EXPORT String dataURL(CGImageRef, const String& mimeType, std::optional<double> quality);
String dataURL(const PixelBuffer&, const String& mimeType, std::optional<double> quality);

} // namespace WebCore

#endif // USE(CG)
