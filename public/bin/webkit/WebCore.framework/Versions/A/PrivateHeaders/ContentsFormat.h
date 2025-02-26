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

#include <optional>

namespace WTF {
class TextStream;
}

namespace WebCore {

class DestinationColorSpace;

enum class ContentsFormat : uint8_t {
    RGBA8,
#if HAVE(IOSURFACE_RGB10)
    RGBA10,
#endif
#if HAVE(HDR_SUPPORT)
    RGBA16F,
#endif
};

constexpr unsigned contentsFormatBytesPerPixel(ContentsFormat contentsFormat, bool isOpaque)
{
#if !HAVE(IOSURFACE_RGB10)
    UNUSED_PARAM(isOpaque);
#endif

    switch (contentsFormat) {
    case ContentsFormat::RGBA8:
        return 4;
#if HAVE(IOSURFACE_RGB10)
    case ContentsFormat::RGBA10:
        return isOpaque ? 4 : 5;
#endif
#if HAVE(HDR_SUPPORT)
    case ContentsFormat::RGBA16F:
        return 8;
#endif
    }

    ASSERT_NOT_REACHED();
    return 4;
}

WEBCORE_EXPORT std::optional<DestinationColorSpace> contentsFormatExtendedColorSpace(ContentsFormat);
WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ContentsFormat);

} // namespace WebCore
