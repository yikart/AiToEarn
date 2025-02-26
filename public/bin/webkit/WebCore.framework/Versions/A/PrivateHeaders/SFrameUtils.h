/*
 * Copyright (C) 2020-2024 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_RTC)

#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

using SFrameCompatibilityPrefixBuffer = std::variant<std::span<const uint8_t>, Vector<uint8_t>>;

size_t computeH264PrefixOffset(std::span<const uint8_t>);
SFrameCompatibilityPrefixBuffer computeH264PrefixBuffer(std::span<const uint8_t>);

WEBCORE_EXPORT bool needsRbspUnescaping(std::span<const uint8_t>);
WEBCORE_EXPORT Vector<uint8_t> fromRbsp(std::span<const uint8_t>);
WEBCORE_EXPORT void toRbsp(Vector<uint8_t>&, size_t);

size_t computeVP8PrefixOffset(std::span<const uint8_t>);
SFrameCompatibilityPrefixBuffer computeVP8PrefixBuffer(std::span<const uint8_t>);

static inline Vector<uint8_t, 8> encodeBigEndian(uint64_t value)
{
    Vector<uint8_t, 8> result(8);
    for (int i = 7; i >= 0; --i) {
        result.data()[i] = value & 0xff;
        value = value >> 8;
    }
    return result;
}

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // ENABLE(WEB_RTC)
