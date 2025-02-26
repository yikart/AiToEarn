/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#if USE(AUDIO_SESSION) && PLATFORM(IOS_FAMILY)

#include "AudioSessionCocoa.h"
#include <wtf/TZoneMalloc.h>

OBJC_CLASS WebInterruptionObserverHelper;

namespace WTF {
class WorkQueue;
}

namespace WebCore {

class AudioSessionIOS final : public AudioSessionCocoa {
    WTF_MAKE_TZONE_ALLOCATED(AudioSessionIOS);
public:
    static Ref<AudioSessionIOS> create();
    virtual ~AudioSessionIOS();

    void setHostProcessAttribution(audit_token_t) final;
    void setPresentingProcesses(Vector<audit_token_t>&&) final;

    using CategoryChangedObserver = WTF::Observer<void(AudioSession&, CategoryType)>;
    WEBCORE_EXPORT static void addAudioSessionCategoryChangedObserver(const CategoryChangedObserver&);

private:
    AudioSessionIOS();

    // AudioSession
    CategoryType category() const final;
    Mode mode() const final;
    void setCategory(CategoryType, Mode, RouteSharingPolicy) final;
    float sampleRate() const final;
    size_t bufferSize() const final;
    size_t numberOfOutputChannels() const final;
    size_t maximumNumberOfOutputChannels() const final;
    RouteSharingPolicy routeSharingPolicy() const final;
    String routingContextUID() const final;
    size_t preferredBufferSize() const final;
    void setPreferredBufferSize(size_t) final;
    bool isMuted() const final;
    void handleMutedStateChange() final;

    void updateSpatialExperience();

    void setSceneIdentifier(const String&) final;
    const String& sceneIdentifier() const final { return m_sceneIdentifier; }

    void setSoundStageSize(SoundStageSize) final;
    SoundStageSize soundStageSize() const final { return m_soundStageSize; }

    String m_lastSetPreferredMicrophoneID;
    RetainPtr<WebInterruptionObserverHelper> m_interruptionObserverHelper;
    String m_sceneIdentifier;
    SoundStageSize m_soundStageSize { SoundStageSize::Automatic };
};

}

#endif
