/*
 * Copyright (C) 2023 Igalia S.L
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * aint with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "MediaPlayer.h"
#include <span>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

enum class AudioSampleFormat;
class MediaSample;

class PlatformRawAudioData : public ThreadSafeRefCounted<PlatformRawAudioData> {
public:
    virtual ~PlatformRawAudioData() = default;
    static RefPtr<PlatformRawAudioData> create(std::span<const uint8_t>, AudioSampleFormat, float sampleRate, int64_t timestamp, size_t numberOfFrames, size_t numberOfChannels);
    static Ref<PlatformRawAudioData> create(Ref<MediaSample>&&);

    virtual constexpr MediaPlatformType platformType() const = 0;

    virtual AudioSampleFormat format() const = 0;
    virtual size_t sampleRate() const = 0;
    virtual size_t numberOfChannels() const = 0;
    virtual size_t numberOfFrames() const = 0;
    virtual std::optional<uint64_t> duration() const = 0;
    virtual int64_t timestamp() const = 0;

    virtual size_t memoryCost() const = 0;

    void copyTo(std::span<uint8_t>, AudioSampleFormat, size_t planeIndex, std::optional<size_t> frameOffset, std::optional<size_t> frameCount, unsigned long copyElementCount);
};

} // namespace WebCore
