/*
 * Copyright 2017 The Chromium Authors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Forward.h>
#include <wtf/Noncopyable.h>
#include <wtf/RefPtr.h>

namespace WebCore {

class AudioBus;

// PushPullFIFO class is an intermediate audio sample storage between
// WebKit-WebAudio and the renderer. The renderer's hardware callback buffer size
// varies on the platform, but the WebAudio always renders 128 frames (render
// quantum, RQ) thus FIFO is needed to handle the general case.
class PushPullFIFO {
    WTF_MAKE_NONCOPYABLE(PushPullFIFO);

public:
    // Maximum FIFO length. (512 render quanta)
    static constexpr size_t maxFIFOLength { 65536 };

    // |fifoLength| cannot exceed |maxFIFOLength|. Otherwise it crashes.
    WEBCORE_EXPORT PushPullFIFO(unsigned numberOfChannels, size_t fifoLength);
    WEBCORE_EXPORT ~PushPullFIFO();

    // Pushes the rendered frames by WebAudio engine.
    //  - The |inputBus| length is 128 frames (1 render quantum), fixed.
    //  - In case of overflow (FIFO full while push), the existing frames in FIFO
    //    will be overwritten and |indexRead| will be forcibly moved to
    //    |indexWrite| to avoid reading overwritten frames.
    WEBCORE_EXPORT void push(const AudioBus* inputBus);

    // Pulls |framesRequested| by the audio device thread and returns the actual
    // number of frames to be rendered by the source. (i.e. WebAudio graph)
    WEBCORE_EXPORT size_t pull(AudioBus* outputBus, size_t framesRequested);

    size_t framesAvailable() const { return m_framesAvailable; }
    size_t length() const { return m_fifoLength; }
    unsigned numberOfChannels() const;
    AudioBus* bus() const { return m_fifoBus.get(); }

private:
    // The size of the FIFO.
    const size_t m_fifoLength = 0;

    RefPtr<AudioBus> m_fifoBus;

    // The number of frames in the FIFO actually available for pulling.
    size_t m_framesAvailable { 0 };

    size_t m_indexRead { 0 };
    size_t m_indexWrite { 0 };
};

} // namespace WebCore


