/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "ActiveDOMObject.h"
#include "EventTarget.h"
#include "PlatformSpeechSynthesisUtterance.h"
#include "SpeechSynthesisErrorCode.h"
#include "SpeechSynthesisVoice.h"
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class WEBCORE_EXPORT SpeechSynthesisUtterance final : public PlatformSpeechSynthesisUtteranceClient, public RefCounted<SpeechSynthesisUtterance>, public ActiveDOMObject, public EventTarget {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(SpeechSynthesisUtterance, WEBCORE_EXPORT);
public:
    void ref() const final;
    void deref() const final;

    using UtteranceCompletionHandler = Function<void(const SpeechSynthesisUtterance&)>;
    static Ref<SpeechSynthesisUtterance> create(ScriptExecutionContext&, const String&, UtteranceCompletionHandler&&);
    static Ref<SpeechSynthesisUtterance> create(ScriptExecutionContext&, const String&);

    // Create an empty default constructor so SpeechSynthesisEventInit compiles.
    SpeechSynthesisUtterance();

    virtual ~SpeechSynthesisUtterance();

    const String& text() const { return m_platformUtterance->text(); }
    void setText(const String& text) { m_platformUtterance->setText(text); }

    const String& lang() const { return m_platformUtterance->lang(); }
    void setLang(const String& lang) { m_platformUtterance->setLang(lang); }

    SpeechSynthesisVoice* voice() const;
    void setVoice(SpeechSynthesisVoice*);

    float volume() const { return m_platformUtterance->volume(); }
    void setVolume(float volume) { m_platformUtterance->setVolume(volume); }

    float rate() const { return m_platformUtterance->rate(); }
    void setRate(float rate) { m_platformUtterance->setRate(rate); }

    float pitch() const { return m_platformUtterance->pitch(); }
    void setPitch(float pitch) { m_platformUtterance->setPitch(pitch); }

    MonotonicTime startTime() const { return m_platformUtterance->startTime(); }
    void setStartTime(MonotonicTime startTime) { m_platformUtterance->setStartTime(startTime); }

    PlatformSpeechSynthesisUtterance* platformUtterance() const { return m_platformUtterance.get(); }

    void eventOccurred(const AtomString& type, unsigned long charIndex, unsigned long charLength, const String& name);
    void errorEventOccurred(const AtomString& type, SpeechSynthesisErrorCode);
    void setIsActiveForEventDispatch(bool);

private:
    SpeechSynthesisUtterance(ScriptExecutionContext&, const String&, UtteranceCompletionHandler&&);
    void dispatchEventAndUpdateState(Event&);
    void incrementActivityCountForEventDispatch();
    void decrementActivityCountForEventDispatch();

    // ActiveDOMObject
    bool virtualHasPendingActivity() const final;

    // EventTarget
    ScriptExecutionContext* scriptExecutionContext() const final { return ActiveDOMObject::scriptExecutionContext(); }
    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::SpeechSynthesisUtterance; }
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }

    friend class SpeechSynthesisUtteranceActivity;
    RefPtr<PlatformSpeechSynthesisUtterance> m_platformUtterance;
    RefPtr<SpeechSynthesisVoice> m_voice;
    UtteranceCompletionHandler m_completionHandler;
    unsigned m_activityCountForEventDispatch { 0 };
};

class SpeechSynthesisUtteranceActivity {
    WTF_MAKE_TZONE_ALLOCATED(SpeechSynthesisUtteranceActivity);
public:
    SpeechSynthesisUtteranceActivity(Ref<SpeechSynthesisUtterance>&& utterance)
        : m_utterance(utterance)
    {
        m_utterance->incrementActivityCountForEventDispatch();
    }

    ~SpeechSynthesisUtteranceActivity()
    {
        m_utterance->decrementActivityCountForEventDispatch();
    }

    SpeechSynthesisUtterance& utterance() { return m_utterance.get(); }

private:
    Ref<SpeechSynthesisUtterance> m_utterance;
};

} // namespace WebCore

#endif // ENABLE(SPEECH_SYNTHESIS)
