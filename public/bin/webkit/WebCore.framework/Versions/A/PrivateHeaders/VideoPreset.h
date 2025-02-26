/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM)

#include "ImageBuffer.h"
#include "RealtimeMediaSource.h"
#include <wtf/Lock.h>
#include <wtf/RetainPtr.h>
#include <wtf/RunLoop.h>

OBJC_CLASS AVCaptureDeviceFormat;

namespace WebCore {

struct FrameRateRange {
    double minimum;
    double maximum;
};

struct VideoPresetData {
    IntSize size;
    Vector<FrameRateRange> frameRateRanges;
    double minZoom { 1 };
    double maxZoom { 1 };
    bool isEfficient { false };
};

class VideoPreset {
public:
    explicit VideoPreset(VideoPresetData&& data)
        : m_data(WTFMove(data))
    {
    }
    VideoPreset(IntSize size, Vector<FrameRateRange>&& frameRateRanges, std::optional<double> minZoom, std::optional<double> maxZoom, bool isEfficient)
        : m_data { size, WTFMove(frameRateRanges), minZoom.value_or(1), maxZoom.value_or(1), isEfficient }
    {
        ASSERT(m_data.maxZoom >= m_data.minZoom);
    }

    IntSize size() const { return m_data.size; }
    const Vector<FrameRateRange>& frameRateRanges() const { return m_data.frameRateRanges; }
    double minZoom() const { return m_data.minZoom; }
    double maxZoom() const { return m_data.maxZoom; }

    void sortFrameRateRanges();

#if PLATFORM(COCOA) && USE(AVFOUNDATION)
    void setFormat(AVCaptureDeviceFormat* format) { m_format = format; }
    AVCaptureDeviceFormat* format() const { return m_format.get(); }
#endif

    double maxFrameRate() const;
    double minFrameRate() const;

    bool isZoomSupported() const { return m_data.minZoom != 1 || m_data.maxZoom != 1; }

    bool isEfficient() const { return m_data.isEfficient; }
    void log()const;

protected:
    VideoPresetData m_data;
#if PLATFORM(COCOA) && USE(AVFOUNDATION)
    RetainPtr<AVCaptureDeviceFormat> m_format;
#endif
};

inline void VideoPreset::log() const
{
    WTFLogAlways("VideoPreset of size (%d,%d), zoom is [%f, %f]", m_data.size.width(), m_data.size.height(), m_data.minZoom, m_data.maxZoom);
    for (auto range : m_data.frameRateRanges)
        WTFLogAlways("VideoPreset frame rate range [%f, %f]", range.minimum, range.maximum);
}

inline double VideoPreset::minFrameRate() const
{
    double minFrameRate = std::numeric_limits<double>::max();
    for (auto& range : m_data.frameRateRanges) {
        if (minFrameRate > range.minimum)
            minFrameRate = range.minimum;
    }
    return minFrameRate;
}

inline double VideoPreset::maxFrameRate() const
{
    double maxFrameRate = 0;
    for (auto& range : m_data.frameRateRanges) {
        if (maxFrameRate < range.maximum)
            maxFrameRate = range.maximum;
    }
    return maxFrameRate;
}

inline void VideoPreset::sortFrameRateRanges()
{
    std::sort(m_data.frameRateRanges.begin(), m_data.frameRateRanges.end(),
        [&] (const auto& a, const auto& b) -> bool {
            return a.minimum < b.minimum;
    });
}

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)

