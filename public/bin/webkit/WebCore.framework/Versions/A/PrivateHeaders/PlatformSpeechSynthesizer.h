/*
 * Copyright (C) 2013 Apple Inc.  All rights reserved.
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

#if ENABLE(SPEECH_SYNTHESIS)

#include "PlatformSpeechSynthesisVoice.h"
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

#if PLATFORM(COCOA)
#include <wtf/RetainPtr.h>
OBJC_CLASS WebSpeechSynthesisWrapper;
#endif

namespace WebCore {

#if USE(SPIEL)
class SpielSpeechWrapper;
#endif

enum class SpeechBoundary : uint8_t {
    SpeechWordBoundary,
    SpeechSentenceBoundary
};

#if USE(FLITE) && USE(GSTREAMER)
class GstSpeechSynthesisWrapper;
#endif
class PlatformSpeechSynthesisUtterance;

class PlatformSpeechSynthesizerClient {
public:
    virtual void didStartSpeaking(PlatformSpeechSynthesisUtterance&) = 0;
    virtual void didFinishSpeaking(PlatformSpeechSynthesisUtterance&) = 0;
    virtual void didPauseSpeaking(PlatformSpeechSynthesisUtterance&) = 0;
    virtual void didResumeSpeaking(PlatformSpeechSynthesisUtterance&) = 0;
    virtual void speakingErrorOccurred(PlatformSpeechSynthesisUtterance&) = 0;
    virtual void boundaryEventOccurred(PlatformSpeechSynthesisUtterance&, SpeechBoundary, unsigned charIndex, unsigned charLength) = 0;
    virtual void voicesDidChange() = 0;
protected:
    virtual ~PlatformSpeechSynthesizerClient() = default;
};

class WEBCORE_EXPORT PlatformSpeechSynthesizer : public RefCounted<PlatformSpeechSynthesizer> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PlatformSpeechSynthesizer, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT static Ref<PlatformSpeechSynthesizer> create(PlatformSpeechSynthesizerClient&);

    // FIXME: We have multiple virtual functions just so we can support a mock for testing.
    // Seems wasteful. Would be nice to find a better way.
    WEBCORE_EXPORT virtual ~PlatformSpeechSynthesizer();

    const Vector<RefPtr<PlatformSpeechSynthesisVoice>>& voiceList() const;
    virtual void speak(RefPtr<PlatformSpeechSynthesisUtterance>&&);
    virtual void pause();
    virtual void resume();
    virtual void cancel();
    virtual void resetState();
    virtual void voicesDidChange();

    PlatformSpeechSynthesizerClient& client() const { return m_speechSynthesizerClient; }

protected:
    explicit PlatformSpeechSynthesizer(PlatformSpeechSynthesizerClient&);
    Vector<RefPtr<PlatformSpeechSynthesisVoice>> m_voiceList;

private:
    virtual void initializeVoiceList();
    virtual void resetVoiceList();

    bool m_voiceListIsInitialized { false };
    PlatformSpeechSynthesizerClient& m_speechSynthesizerClient;

#if PLATFORM(COCOA)
    RetainPtr<WebSpeechSynthesisWrapper> m_platformSpeechWrapper;
#elif USE(FLITE) && USE(GSTREAMER)
    std::unique_ptr<GstSpeechSynthesisWrapper> m_platformSpeechWrapper;
#elif USE(SPIEL)
    std::unique_ptr<SpielSpeechWrapper> m_platformSpeechWrapper;
#endif
};

} // namespace WebCore

#endif // ENABLE(SPEECH_SYNTHESIS)
