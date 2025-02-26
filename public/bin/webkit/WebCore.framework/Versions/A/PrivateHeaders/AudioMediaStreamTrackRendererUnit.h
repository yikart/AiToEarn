/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

#if ENABLE(MEDIA_STREAM)

#include "AudioMediaStreamTrackRendererInternalUnit.h"
#include "BaseAudioMediaStreamTrackRendererUnit.h"
#include "Timer.h"
#include <wtf/FastMalloc.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/Vector.h>
#include <wtf/WeakHashSet.h>

namespace WebCore {
class AudioMediaStreamTrackRendererUnit;
}

namespace WebCore {

class AudioSampleDataSource;
class AudioSampleBufferList;
class CAAudioStreamDescription;

class AudioMediaStreamTrackRendererUnit : public BaseAudioMediaStreamTrackRendererUnit {
    WTF_MAKE_FAST_ALLOCATED;
public:
    WEBCORE_EXPORT static AudioMediaStreamTrackRendererUnit& singleton();
    static bool supportsPerDeviceRendering();

    ~AudioMediaStreamTrackRendererUnit();

    void setLastDeviceUsed(const String&);
    void retrieveFormatDescription(CompletionHandler<void(std::optional<CAAudioStreamDescription>)>&&);

    // BaseAudioMediaStreamTrackRendererUnit
    void addSource(const String&, Ref<AudioSampleDataSource>&&) final;
    void removeSource(const String&, AudioSampleDataSource&) final;
    void addResetObserver(const String&, ResetObserver&) final;

private:
    AudioMediaStreamTrackRendererUnit();

    void deleteUnitsIfPossible();

    class Unit : public AudioMediaStreamTrackRendererInternalUnit::Client {
    public:
        static Ref<Unit> create(const String& deviceID) { return adoptRef(*new Unit(deviceID)); }
        ~Unit();

        void addSource(Ref<AudioSampleDataSource>&&);
        bool removeSource(AudioSampleDataSource&);
        void addResetObserver(ResetObserver&);
        bool hasSources() const
        {
            assertIsMainThread();
            return !m_sources.isEmpty();
        }

        bool isDefault() const { return m_isDefaultUnit; }

        void close();
        void retrieveFormatDescription(CompletionHandler<void(std::optional<CAAudioStreamDescription>)>&&);
        void setLastDeviceUsed(const String&);

    private:
        explicit Unit(const String&);

        void start();
        void stop();
        void updateRenderSourcesIfNecessary();

        // AudioMediaStreamTrackRendererInternalUnit::Client
        OSStatus render(size_t sampleCount, AudioBufferList&, uint64_t sampleTime, double hostTime, AudioUnitRenderActionFlags&) final;
        void reset() final;

        HashSet<Ref<AudioSampleDataSource>> m_sources WTF_GUARDED_BY_CAPABILITY(mainThread);
        Vector<Ref<AudioSampleDataSource>> m_renderSources;

        Lock m_pendingRenderSourcesLock;
        std::atomic<bool> m_hasPendingRenderSources WTF_GUARDED_BY_LOCK(m_pendingRenderSourcesLock) { false };
        Vector<Ref<AudioSampleDataSource>> m_pendingRenderSources WTF_GUARDED_BY_LOCK(m_pendingRenderSourcesLock);

        const Ref<AudioMediaStreamTrackRendererInternalUnit> m_internalUnit WTF_GUARDED_BY_CAPABILITY(mainThread);
        WeakHashSet<ResetObserver> m_resetObservers WTF_GUARDED_BY_CAPABILITY(mainThread);
        const bool m_isDefaultUnit { false };
    };

    Ref<Unit> ensureDeviceUnit(const String&);
    RefPtr<Unit> getDeviceUnit(const String&);

    HashMap<String, Ref<Unit>> m_units WTF_GUARDED_BY_CAPABILITY(mainThread);
    Timer m_deleteUnitsTimer;
};

}

#endif // ENABLE(MEDIA_STREAM)
