/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(SPEECH_SYNTHESIS)

#include <wtf/AbstractRefCountedAndCanMakeWeakPtr.h>

namespace WebCore {

class PlatformSpeechSynthesisUtterance;
class SpeechSynthesisClientObserver;
class PlatformSpeechSynthesisVoice;
    
class SpeechSynthesisClient : public AbstractRefCountedAndCanMakeWeakPtr<SpeechSynthesisClient> {
public:
    virtual ~SpeechSynthesisClient() = default;

    virtual void setObserver(WeakPtr<SpeechSynthesisClientObserver>) = 0;
    virtual WeakPtr<SpeechSynthesisClientObserver> observer() const = 0;
    
    virtual const Vector<RefPtr<PlatformSpeechSynthesisVoice>>& voiceList() = 0;
    virtual void speak(RefPtr<PlatformSpeechSynthesisUtterance>) = 0;
    virtual void cancel() = 0;
    virtual void pause() = 0;
    virtual void resume() = 0;
    virtual void resetState() = 0;

};

class SpeechSynthesisClientObserver : public AbstractRefCountedAndCanMakeWeakPtr<SpeechSynthesisClientObserver>  {
public:
    virtual ~SpeechSynthesisClientObserver() = default;

    virtual void didStartSpeaking() = 0;
    virtual void didFinishSpeaking() = 0;
    virtual void didPauseSpeaking() = 0;
    virtual void didResumeSpeaking() = 0;
    virtual void speakingErrorOccurred() = 0;
    virtual void boundaryEventOccurred(bool wordBoundary, unsigned charIndex, unsigned charLength) = 0;
    virtual void voicesChanged() = 0;
};

} // namespace WebCore

#endif // ENABLE(SPEECH_SYNTHESIS)
