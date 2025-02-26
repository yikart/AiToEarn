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

#include <CoreAudio/CoreAudioTypes.h>
#include <span>
#include <wtf/StdLibExtras.h>

namespace WebCore {

inline std::span<uint8_t> dataMutableByteSpan(AudioBuffer& buffer)
{
    return unsafeMakeSpan(static_cast<uint8_t*>(buffer.mData), buffer.mDataByteSize);
}

inline std::span<float> dataMutableFloatSpan(AudioBuffer& buffer)
{
    return unsafeMakeSpan(static_cast<float*>(buffer.mData), buffer.mDataByteSize / sizeof(float));
}

inline std::span<const uint8_t> dataByteSpan(const AudioBuffer& buffer)
{
    return unsafeMakeSpan(static_cast<const uint8_t*>(buffer.mData), buffer.mDataByteSize);
}

inline std::span<const float> dataFloatSpan(AudioBuffer& buffer)
{
    return unsafeMakeSpan(static_cast<const float*>(buffer.mData), buffer.mDataByteSize / sizeof(float));
}

} // namespace WebCore
