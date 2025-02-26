/*
 * Copyright (C) 2013-2019 Apple Inc. All rights reserved.
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

#if USE(AUDIO_SESSION)

#include <memory>
#include <wtf/CompletionHandler.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/Noncopyable.h>
#include <wtf/Observer.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>
#include <wtf/WeakHashSet.h>
#include <wtf/text/WTFString.h>

namespace WebCore {
class AudioSessionInterruptionObserver;
class AudioSessionRoutingArbitrationClient;
class AudioSessionConfigurationChangeObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::AudioSessionInterruptionObserver> : std::true_type { };
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::AudioSessionRoutingArbitrationClient> : std::true_type { };
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::AudioSessionConfigurationChangeObserver> : std::true_type { };
}

namespace WTF {
class Logger;
}

namespace WebCore {

enum class RouteSharingPolicy : uint8_t {
    Default,
    LongFormAudio,
    Independent,
    LongFormVideo
};

enum class AudioSessionCategory : uint8_t {
    None,
    AmbientSound,
    SoloAmbientSound,
    MediaPlayback,
    RecordAudio,
    PlayAndRecord,
    AudioProcessing,
};

enum class AudioSessionMode : uint8_t {
    // FIXME: This is not exhaustive.
    Default,
    VideoChat,
    MoviePlayback,
};

enum class AudioSessionSoundStageSize : uint8_t {
    Automatic,
    Small,
    Medium,
    Large,
};

class AudioSession;
class AudioSessionRoutingArbitrationClient;
class AudioSessionInterruptionObserver;

class AudioSessionConfigurationChangeObserver : public CanMakeWeakPtr<AudioSessionConfigurationChangeObserver> {
public:
    virtual ~AudioSessionConfigurationChangeObserver() = default;

    virtual void hardwareMutedStateDidChange(const AudioSession&) = 0;
    virtual void bufferSizeDidChange(const AudioSession&) { }
    virtual void sampleRateDidChange(const AudioSession&) { }
};

class WEBCORE_EXPORT AudioSession : public ThreadSafeRefCounted<AudioSession> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(AudioSession, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(AudioSession);
public:
    static Ref<AudioSession> create();
    static void setSharedSession(Ref<AudioSession>&&);
    static AudioSession& sharedSession();
    static Ref<AudioSession> protectedSharedSession() { return sharedSession(); }

    static bool enableMediaPlayback();

    using ChangedObserver = WTF::Observer<void(AudioSession&)>;
    static void addAudioSessionChangedObserver(const ChangedObserver&);

    virtual ~AudioSession();

    using CategoryType = AudioSessionCategory;
    virtual CategoryType category() const;
    using Mode = AudioSessionMode;
    virtual Mode mode() const;
    virtual void setCategory(CategoryType, Mode, RouteSharingPolicy);

    virtual void setCategoryOverride(CategoryType);
    virtual CategoryType categoryOverride() const;

    virtual RouteSharingPolicy routeSharingPolicy() const;
    virtual String routingContextUID() const;

    virtual float sampleRate() const;
    virtual size_t bufferSize() const;
    virtual size_t numberOfOutputChannels() const;
    virtual size_t maximumNumberOfOutputChannels() const;

    bool tryToSetActive(bool);

    virtual size_t preferredBufferSize() const;
    virtual void setPreferredBufferSize(size_t);

    virtual void addConfigurationChangeObserver(AudioSessionConfigurationChangeObserver&);
    virtual void removeConfigurationChangeObserver(AudioSessionConfigurationChangeObserver&);

    virtual void audioOutputDeviceChanged();
    virtual void setIsPlayingToBluetoothOverride(std::optional<bool>);

    virtual bool isMuted() const { return false; }
    virtual void handleMutedStateChange() { }

    virtual void beginInterruption();
    enum class MayResume : bool { No, Yes };
    virtual void endInterruption(MayResume);

    virtual void beginInterruptionForTesting() { beginInterruption(); }
    virtual void endInterruptionForTesting() { endInterruption(MayResume::Yes); }
    virtual void clearInterruptionFlagForTesting() { }

    virtual void addInterruptionObserver(AudioSessionInterruptionObserver&);
    virtual void removeInterruptionObserver(AudioSessionInterruptionObserver&);

    virtual bool isActive() const { return m_active; }

    virtual void setRoutingArbitrationClient(WeakPtr<AudioSessionRoutingArbitrationClient>&& client) { m_routingArbitrationClient = client; }

    static bool shouldManageAudioSessionCategory();
    static void setShouldManageAudioSessionCategory(bool);

    virtual void setHostProcessAttribution(audit_token_t) { };
    virtual void setPresentingProcesses(Vector<audit_token_t>&&) { };

    bool isInterrupted() const { return m_isInterrupted; }

    virtual void setSceneIdentifier(const String&) { }
    virtual const String& sceneIdentifier() const { return nullString(); }

    using SoundStageSize = AudioSessionSoundStageSize;
    virtual void setSoundStageSize(SoundStageSize) { }
    virtual SoundStageSize soundStageSize() const { return SoundStageSize::Automatic; }

protected:
    friend class NeverDestroyed<AudioSession>;
    AudioSession();

    virtual bool tryToSetActiveInternal(bool);
    void activeStateChanged();

    Logger& logger();
    ASCIILiteral logClassName() const { return "AudioSession"_s; }
    WTFLogChannel& logChannel() const;
    uint64_t logIdentifier() const { return 0; }

    mutable RefPtr<Logger> m_logger;

    WeakHashSet<AudioSessionInterruptionObserver> m_interruptionObservers;

    WeakPtr<AudioSessionRoutingArbitrationClient> m_routingArbitrationClient;
    AudioSession::CategoryType m_categoryOverride { AudioSession::CategoryType::None };
    bool m_active { false }; // Used only for testing.
    bool m_isInterrupted { false };
};

class AudioSessionInterruptionObserver : public CanMakeWeakPtr<AudioSessionInterruptionObserver> {
public:
    virtual ~AudioSessionInterruptionObserver() = default;

    virtual void beginAudioSessionInterruption() = 0;
    virtual void endAudioSessionInterruption(AudioSession::MayResume) = 0;
    virtual void audioSessionActiveStateChanged() { }
};

enum class AudioSessionRoutingArbitrationError : uint8_t { None, Failed, Cancelled };

class WEBCORE_EXPORT AudioSessionRoutingArbitrationClient : public CanMakeWeakPtr<AudioSessionRoutingArbitrationClient> {
public:
    USING_CAN_MAKE_WEAKPTR(CanMakeWeakPtr<AudioSessionRoutingArbitrationClient>);

    virtual ~AudioSessionRoutingArbitrationClient() = default;
    using RoutingArbitrationError = AudioSessionRoutingArbitrationError;

    enum class DefaultRouteChanged : bool { No, Yes };

    using ArbitrationCallback = CompletionHandler<void(RoutingArbitrationError, DefaultRouteChanged)>;

    virtual void beginRoutingArbitrationWithCategory(AudioSession::CategoryType, ArbitrationCallback&&) = 0;
    virtual void leaveRoutingAbritration() = 0;

    virtual uint64_t logIdentifier() const = 0;
    virtual bool canLog() const = 0;
};

WEBCORE_EXPORT String convertEnumerationToString(RouteSharingPolicy);
WEBCORE_EXPORT String convertEnumerationToString(AudioSession::CategoryType);
WEBCORE_EXPORT String convertEnumerationToString(AudioSession::Mode);
WEBCORE_EXPORT String convertEnumerationToString(AudioSessionRoutingArbitrationClient::RoutingArbitrationError);
WEBCORE_EXPORT String convertEnumerationToString(AudioSessionRoutingArbitrationClient::DefaultRouteChanged);
WEBCORE_EXPORT String convertEnumerationToString(AudioSession::SoundStageSize);

} // namespace WebCore

namespace WTF {

template<typename Type>
struct LogArgument;

template <>
struct LogArgument<WebCore::RouteSharingPolicy> {
    static String toString(const WebCore::RouteSharingPolicy policy)
    {
        return convertEnumerationToString(policy);
    }
};

template <>
struct LogArgument<WebCore::AudioSession::CategoryType> {
    static String toString(const WebCore::AudioSession::CategoryType category)
    {
        return convertEnumerationToString(category);
    }
};

template <>
struct LogArgument<WebCore::AudioSession::Mode> {
    static String toString(const WebCore::AudioSession::Mode mode)
    {
        return convertEnumerationToString(mode);
    }
};

template <>
struct LogArgument<WebCore::AudioSessionRoutingArbitrationClient::RoutingArbitrationError> {
    static String toString(const WebCore::AudioSessionRoutingArbitrationClient::RoutingArbitrationError error)
    {
        return convertEnumerationToString(error);
    }
};

template <>
struct LogArgument<WebCore::AudioSessionRoutingArbitrationClient::DefaultRouteChanged> {
    static String toString(const WebCore::AudioSessionRoutingArbitrationClient::DefaultRouteChanged changed)
    {
        return convertEnumerationToString(changed);
    }
};

template <>
struct LogArgument<WebCore::AudioSession::SoundStageSize> {
    static String toString(const WebCore::AudioSession::SoundStageSize size)
    {
        return convertEnumerationToString(size);
    }
};

} // namespace WTF

#endif // USE(AUDIO_SESSION)
