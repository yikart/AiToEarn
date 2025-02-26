/*
 * Copyright (C) 2007-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2015 Google Inc. All rights reserved.
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

#if ENABLE(VIDEO)

#include "ActiveDOMObject.h"
#include "AudioSession.h"
#include "AudioTrackClient.h"
#include "AutoplayEvent.h"
#include "CaptionUserPreferences.h"
#include "HTMLElement.h"
#include "HTMLMediaElementEnums.h"
#include "HTMLMediaElementIdentifier.h"
#include "MediaCanStartListener.h"
#include "MediaControllerInterface.h"
#include "MediaElementSession.h"
#include "MediaPlayer.h"
#include "MediaProducer.h"
#include "MediaResourceSniffer.h"
#include "MediaUniqueIdentifier.h"
#include "ReducedResolutionSeconds.h"
#include "TextTrackClient.h"
#include "URLKeepingBlobAlive.h"
#include "VideoTrackClient.h"
#include "VisibilityChangeClient.h"
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/Identified.h>
#include <wtf/LoggerHelper.h>
#include <wtf/Observer.h>
#include <wtf/WallTime.h>
#include <wtf/WeakPtr.h>

#if USE(AUDIO_SESSION) && PLATFORM(MAC)
#include "AudioSession.h"
#endif

#if ENABLE(ENCRYPTED_MEDIA)
#include "CDMClient.h"
#endif

#ifndef NDEBUG
#include <wtf/StringPrintStream.h>
#endif

namespace WTF {
class MachSendRight;
class Stopwatch;
}

namespace JSC {
class JSValue;
}

namespace PAL {
class SessionID;
}

namespace WebCore {

class AudioSourceProvider;
class AudioTrackList;
class AudioTrackPrivate;
class Blob;
class DOMException;
class DOMWrapperWorld;
class DeferredPromise;
class Event;
class HTMLSourceElement;
class HTMLTrackElement;
class InbandTextTrackPrivate;
class JSDOMGlobalObject;
class MediaController;
class MediaControls;
class MediaControlsHost;
class MediaElementAudioSourceNode;
class MediaError;
class MediaKeys;
class MediaResourceLoader;
class MediaSession;
class MediaSource;
class MediaSourceHandle;
class MediaSourceInterfaceProxy;
class MediaStream;
class PausableIntervalTimer;
class RenderMedia;
class ScriptController;
class ScriptExecutionContext;
class SleepDisabler;
class SourceBuffer;
class SpeechSynthesis;
class TextTrackList;
class TimeRanges;
class VideoPlaybackQuality;
class VideoTrackList;
class VideoTrackPrivate;
class WebKitMediaKeys;

enum class DynamicRangeMode : uint8_t;

template<typename> class DOMPromiseDeferred;
template<typename, typename> class PODInterval;

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
class RemotePlayback;
#endif

using CueInterval = PODInterval<MediaTime, TextTrackCue*>;
using CueList = Vector<CueInterval>;

enum class HTMLMediaElementSourceType : uint8_t {
    File,
    HLS,
    MediaSource,
    ManagedMediaSource,
    MediaStream,
    LiveStream,
    StoredStream,
};

using MediaProvider = std::optional < std::variant <
#if ENABLE(MEDIA_STREAM)
    RefPtr<MediaStream>,
#endif
#if ENABLE(MEDIA_SOURCE)
    RefPtr<MediaSource>,
#endif
#if ENABLE(MEDIA_SOURCE_IN_WORKERS)
    RefPtr<MediaSourceHandle>,
#endif
    RefPtr<Blob>>>;

class HTMLMediaElement
    : public HTMLElement
    , public ActiveDOMObject
    , public MediaControllerInterface
    , public PlatformMediaSessionClient
    , public Identified<HTMLMediaElementIdentifier>
    , private MediaCanStartListener
    , private MediaPlayerClient
    , private MediaProducer
    , private VisibilityChangeClient
    , private AudioTrackClient
    , private TextTrackClient
    , private VideoTrackClient
#if USE(AUDIO_SESSION) && PLATFORM(MAC)
    , private AudioSessionConfigurationChangeObserver
#endif
#if ENABLE(ENCRYPTED_MEDIA)
    , private CDMClient
#endif
#if !RELEASE_LOG_DISABLED
    , private LoggerHelper
#endif
    , public CanMakeWeakPtr<HTMLMediaElement, WeakPtrFactoryInitialization::Eager>
{
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLMediaElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLMediaElement);
public:
    USING_CAN_MAKE_WEAKPTR(SINGLE_ARG(CanMakeWeakPtr<HTMLMediaElement, WeakPtrFactoryInitialization::Eager>));

    // ActiveDOMObject.
    void ref() const final { HTMLElement::ref(); }
    void deref() const final { HTMLElement::deref(); }

    MediaPlayer* player() const { return m_player.get(); }
    RefPtr<MediaPlayer> protectedPlayer() const { return m_player; }
    WEBCORE_EXPORT std::optional<MediaPlayerIdentifier> playerIdentifier() const;

    virtual bool isVideo() const { return false; }
    bool hasVideo() const override { return false; }
    WEBCORE_EXPORT bool hasAudio() const override;
    bool hasRenderer() const { return static_cast<bool>(renderer()); }

    WEBCORE_EXPORT static HashSet<WeakRef<HTMLMediaElement>>& allMediaElements();

    WEBCORE_EXPORT static RefPtr<HTMLMediaElement> bestMediaElementForRemoteControls(MediaElementSession::PlaybackControlsPurpose, const Document* = nullptr);

    WEBCORE_EXPORT void rewind(double timeDelta);
    WEBCORE_EXPORT void returnToRealtime() override;

    // Eventually overloaded in HTMLVideoElement
    bool supportsFullscreen(HTMLMediaElementEnums::VideoFullscreenMode) const override { return false; };

    bool supportsScanning() const override;

    bool canSaveMediaData() const;

    bool doesHaveAttribute(const AtomString&, AtomString* value = nullptr) const override;

    PlatformLayer* platformLayer() const;
    bool isVideoLayerInline();
    void setPreparedToReturnVideoLayerToInline(bool);
    void waitForPreparedForInlineThen(Function<void()>&& completionHandler);
#if ENABLE(VIDEO_PRESENTATION_MODE)
    RetainPtr<PlatformLayer> createVideoFullscreenLayer();
    WEBCORE_EXPORT void setVideoFullscreenLayer(PlatformLayer*, Function<void()>&& completionHandler = [] { });
#ifdef __OBJC__
    PlatformLayer* videoFullscreenLayer() const { return m_videoFullscreenLayer.get(); }
#endif
    virtual void setVideoFullscreenFrame(const FloatRect&);
    void setVideoFullscreenGravity(MediaPlayer::VideoGravity);
    MediaPlayer::VideoGravity videoFullscreenGravity() const { return m_videoFullscreenGravity; }
#endif

    void checkPlaybackTargetCompatibility();
    void scheduleResolvePendingPlayPromises();
    void scheduleRejectPendingPlayPromises(Ref<DOMException>&&);
    using PlayPromiseVector = Vector<DOMPromiseDeferred<void>>;
    void rejectPendingPlayPromises(PlayPromiseVector&&, Ref<DOMException>&&);
    void resolvePendingPlayPromises(PlayPromiseVector&&);
    void scheduleNotifyAboutPlaying();
    void notifyAboutPlaying(PlayPromiseVector&&);
    void durationChanged();
    
    MediaPlayer::MovieLoadType movieLoadType() const;
    
    bool inActiveDocument() const { return m_inActiveDocument; }

    std::optional<MediaSessionGroupIdentifier> mediaSessionGroupIdentifier() const final;

    WEBCORE_EXPORT bool isActiveNowPlayingSession() const;
    void isActiveNowPlayingSessionChanged() final;
    ProcessID presentingApplicationPID() const final;

// DOM API
// error state
    WEBCORE_EXPORT MediaError* error() const;

    const URL& currentSrc() const { return m_currentSrc; }

    const MediaProvider& srcObject() const { return m_mediaProvider; }
    void setSrcObject(MediaProvider&&);

    WEBCORE_EXPORT void setCrossOrigin(const AtomString&);
    WEBCORE_EXPORT String crossOrigin() const;

// network state
    using HTMLMediaElementEnums::NetworkState;
    WEBCORE_EXPORT NetworkState networkState() const;

    WEBCORE_EXPORT String preload() const;
    WEBCORE_EXPORT void setPreload(const AtomString&);

    Ref<TimeRanges> buffered() const override;
    WEBCORE_EXPORT void load();
    WEBCORE_EXPORT String canPlayType(const String& mimeType) const;

// ready state
    using HTMLMediaElementEnums::ReadyState;
    ReadyState readyState() const override;
    WEBCORE_EXPORT bool seeking() const;
    void setSeeking(bool);

// playback state
    WEBCORE_EXPORT double currentTime() const override;
    WEBCORE_EXPORT void setCurrentTime(double) override;
    void setCurrentTimeWithTolerance(double, double toleranceBefore, double toleranceAfter);
    double currentTimeForBindings() const { return currentTime(); }
    WEBCORE_EXPORT ExceptionOr<void> setCurrentTimeForBindings(double);
    WEBCORE_EXPORT WallTime getStartDate() const;
    WEBCORE_EXPORT double duration() const override;
    WEBCORE_EXPORT bool paused() const override;
    void setPaused(bool);
    double defaultPlaybackRate() const override;
    void setDefaultPlaybackRate(double) override;
    WEBCORE_EXPORT double playbackRate() const override;
    void setPlaybackRate(double) override;
    WEBCORE_EXPORT bool preservesPitch() const;
    WEBCORE_EXPORT void setPreservesPitch(bool);


// MediaTime versions of playback state
    MediaTime currentMediaTime() const;
    void setCurrentTime(const MediaTime&);
    MediaTime durationMediaTime() const;
    WEBCORE_EXPORT void fastSeek(const MediaTime&);

    void updatePlaybackRate();
    Ref<TimeRanges> played() override;
    Ref<TimeRanges> seekable() const override;
    double seekableTimeRangesLastModifiedTime() const;
    double liveUpdateInterval() const;
    WEBCORE_EXPORT bool ended() const;
    bool autoplay() const;
    bool isAutoplaying() const { return m_autoplaying; }
    bool loop() const;
    void setLoop(bool b);

    void play(DOMPromiseDeferred<void>&&);

    WEBCORE_EXPORT void play() override;
    WEBCORE_EXPORT void pause() override;
    WEBCORE_EXPORT void fastSeek(double);
    double minFastReverseRate() const;
    double maxFastForwardRate() const;

#if ENABLE(MEDIA_STREAM)
    void setAudioOutputDevice(String&& deviceId, DOMPromiseDeferred<void>&&);
    String audioOutputHashedDeviceId() const { return m_audioOutputHashedDeviceId; }
#endif

    using HTMLMediaElementEnums::BufferingPolicy;
    WEBCORE_EXPORT void setBufferingPolicy(BufferingPolicy);
    WEBCORE_EXPORT BufferingPolicy bufferingPolicy() const;
    WEBCORE_EXPORT void purgeBufferedDataIfPossible();

#if ENABLE(MEDIA_STATISTICS)
// Statistics
    unsigned webkitAudioDecodedByteCount() const;
    unsigned webkitVideoDecodedByteCount() const;
#endif

#if ENABLE(MEDIA_SOURCE)
//  Media Source.
    void detachMediaSource();
    void incrementDroppedFrameCount() { ++m_droppedVideoFrames; }
    bool deferredMediaSourceOpenCanProgress() const;
#endif

#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
    WebKitMediaKeys* webkitKeys() const { return m_webKitMediaKeys.get(); }
    void webkitSetMediaKeys(WebKitMediaKeys*);

    void keyAdded();
#endif

#if ENABLE(ENCRYPTED_MEDIA)
    MediaKeys* mediaKeys() const;

    void setMediaKeys(MediaKeys*, Ref<DeferredPromise>&&);
#endif

// controls
    WEBCORE_EXPORT bool controls() const;
    WEBCORE_EXPORT void setControls(bool);
    WEBCORE_EXPORT double volume() const override;
    WEBCORE_EXPORT ExceptionOr<void> setVolume(double) override;
    WEBCORE_EXPORT bool muted() const override;
    WEBCORE_EXPORT void setMuted(bool) override;

    bool volumeLocked() const { return m_volumeLocked; }
    WEBCORE_EXPORT void setVolumeLocked(bool);

    bool buffering() const { return m_buffering; }
    void updateBufferingState();

    bool stalled() const { return m_stalled; }
    void updateStalledState();

    WEBCORE_EXPORT void togglePlayState();
    WEBCORE_EXPORT void beginScrubbing() override;
    WEBCORE_EXPORT void endScrubbing() override;

    void beginScanning(ScanDirection) override;
    void endScanning() override;
    double nextScanRate();

    WEBCORE_EXPORT bool canPlay() const override;

    bool shouldForceControlsDisplay() const;

    ExceptionOr<Ref<TextTrack>> addTextTrack(const AtomString& kind, const AtomString& label, const AtomString& language);

    AudioTrackList& ensureAudioTracks();
    TextTrackList& ensureTextTracks();
    VideoTrackList& ensureVideoTracks();
    AudioTrackList* audioTracks() const { return m_audioTracks.get(); }
    TextTrackList* textTracks() const { return m_textTracks.get(); }
    VideoTrackList* videoTracks() const { return m_videoTracks.get(); }

    CueList currentlyActiveCues() const;

    void addAudioTrack(Ref<AudioTrack>&&);
    void addTextTrack(Ref<TextTrack>&&);
    void addVideoTrack(Ref<VideoTrack>&&);
    void removeAudioTrack(Ref<AudioTrack>&&);
    void removeAudioTrack(TrackID);
    void removeTextTrack(TextTrack&, bool scheduleEvent = true);
    void removeTextTrack(TrackID, bool scheduleEvent = true);
    void removeVideoTrack(Ref<VideoTrack>&&);
    void removeVideoTrack(TrackID);
    void forgetResourceSpecificTracks();
    void closeCaptionTracksChanged();
    void notifyMediaPlayerOfTextTrackChanges();

    virtual void didAddTextTrack(HTMLTrackElement&);
    virtual void didRemoveTextTrack(HTMLTrackElement&);

    void mediaPlayerDidAddAudioTrack(AudioTrackPrivate&) final;
    void mediaPlayerDidAddTextTrack(InbandTextTrackPrivate&) final;
    void mediaPlayerDidAddVideoTrack(VideoTrackPrivate&) final;
    void mediaPlayerDidRemoveAudioTrack(AudioTrackPrivate&) final;
    void mediaPlayerDidRemoveTextTrack(InbandTextTrackPrivate&) final;
    void mediaPlayerDidRemoveVideoTrack(VideoTrackPrivate&) final;

    Vector<RefPtr<PlatformTextTrack>> outOfBandTrackSources() final;

    struct TrackGroup;
    void configureTextTrackGroupForLanguage(const TrackGroup&) const;
    void scheduleConfigureTextTracks();
    void configureTextTracks();
    void configureTextTrackGroup(const TrackGroup&);
    void configureMetadataTextTrackGroup(const TrackGroup&);

    void setSelectedTextTrack(TextTrack*);

    // AudioTrackClient
    void audioTrackEnabledChanged(AudioTrack&) final;
    void audioTrackKindChanged(AudioTrack&) final;
    void audioTrackLabelChanged(AudioTrack&) final;
    void audioTrackLanguageChanged(AudioTrack&) final;
    void willRemoveAudioTrack(AudioTrack&) final;

    // TextTrackClient
    void textTrackKindChanged(TextTrack&) final;
    void textTrackModeChanged(TextTrack&) final;
    void textTrackLabelChanged(TextTrack&) final;
    void textTrackLanguageChanged(TextTrack&) final;
    void textTrackAddCues(TextTrack&, const TextTrackCueList&) final;
    void textTrackRemoveCues(TextTrack&, const TextTrackCueList&) final;
    void textTrackAddCue(TextTrack&, TextTrackCue&) final;
    void textTrackRemoveCue(TextTrack&, TextTrackCue&) final;
    void willRemoveTextTrack(TextTrack&) final;

    // VideoTrackClient
    void videoTrackKindChanged(VideoTrack&) final;
    void videoTrackLabelChanged(VideoTrack&) final;
    void videoTrackLanguageChanged(VideoTrack&) final;
    void videoTrackSelectedChanged(VideoTrack&) final;
    void willRemoveVideoTrack(VideoTrack&) final;

    void setTextTrackRepresentataionBounds(const IntRect&);
    void setRequiresTextTrackRepresentation(bool);
    bool requiresTextTrackRepresentation() const;
    void setTextTrackRepresentation(TextTrackRepresentation*);
    void syncTextTrackBounds();

    void captionPreferencesChanged();
    using HTMLMediaElementEnums::TextTrackVisibilityCheckType;
    void textTrackReadyStateChanged(TextTrack*);
    void updateTextTrackRepresentationImageIfNeeded();

    WEBCORE_EXPORT bool addEventListener(const AtomString& eventType, Ref<EventListener>&&, const AddEventListenerOptions&) override;
    WEBCORE_EXPORT bool removeEventListener(const AtomString& eventType, EventListener&, const EventListenerOptions&) override;

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    void webkitShowPlaybackTargetPicker();

    void wirelessRoutesAvailableDidChange() override;
    void setWirelessPlaybackTarget(Ref<MediaPlaybackTarget>&&) override;
    void setShouldPlayToPlaybackTarget(bool) override;
    void playbackTargetPickerWasDismissed() override;
    bool hasWirelessPlaybackTargetAlternative() const;
    bool isWirelessPlaybackTargetDisabled() const;
    void isWirelessPlaybackTargetDisabledChanged();
    bool hasTargetAvailabilityListeners();
    bool hasEnabledTargetAvailabilityListeners();
#endif

    bool isPlayingToWirelessPlaybackTarget() const override { return m_isPlayingToWirelessTarget; };
    void setIsPlayingToWirelessTarget(bool);

    bool webkitCurrentPlaybackTargetIsWireless() const;

    void setPlayingOnSecondScreen(bool value);
    bool isPlayingOnSecondScreen() const override { return m_playingOnSecondScreen; }

    bool isPlayingToExternalTarget() const { return isPlayingToWirelessPlaybackTarget() || isPlayingOnSecondScreen(); }

    // EventTarget function.
    // Both Node (via HTMLElement) and ActiveDOMObject define this method, which
    // causes an ambiguity error at compile time. This class's constructor
    // ensures that both implementations return document, so return the result
    // of one of them here.
    using HTMLElement::scriptExecutionContext;

    bool didPassCORSAccessCheck() const { return m_player && m_player->didPassCORSAccessCheck(); }
    bool taintsOrigin(const SecurityOrigin&) const;
    
    WEBCORE_EXPORT bool isFullscreen() const override;
    bool isStandardFullscreen() const;
    void toggleStandardFullscreenState();

    using MediaPlayerEnums::VideoFullscreenMode;
    VideoFullscreenMode fullscreenMode() const { return m_videoFullscreenMode; }

    void enterFullscreen(VideoFullscreenMode);
    WEBCORE_EXPORT void enterFullscreen() override;
    WEBCORE_EXPORT void exitFullscreen();
    WEBCORE_EXPORT void prepareForVideoFullscreenStandby();

    bool hasClosedCaptions() const override;
    bool closedCaptionsVisible() const override;
    void setClosedCaptionsVisible(bool) override;

    void sourceWasRemoved(HTMLSourceElement&);
    void sourceWasAdded(HTMLSourceElement&);

    // Media cache management.
    WEBCORE_EXPORT static void setMediaCacheDirectory(const String&);
    WEBCORE_EXPORT static const String& mediaCacheDirectory();
    WEBCORE_EXPORT static HashSet<SecurityOriginData> originsInMediaCache(const String&);
    WEBCORE_EXPORT static void clearMediaCache(const String&, WallTime modifiedSince = { });
    WEBCORE_EXPORT static void clearMediaCacheForOrigins(const String&, const HashSet<SecurityOriginData>&);

    bool isPlaying() const final { return m_playing; }

#if ENABLE(WEB_AUDIO)
    MediaElementAudioSourceNode* audioSourceNode();
    void setAudioSourceNode(MediaElementAudioSourceNode*);

    AudioSourceProvider* audioSourceProvider();
#endif

    using HTMLMediaElementEnums::InvalidURLAction;
    bool isSafeToLoadURL(const URL&, InvalidURLAction, bool shouldLog = true) const;

    const String& mediaGroup() const;
    void setMediaGroup(const String&);

    MediaController* controller() const;
    void setController(RefPtr<MediaController>&&);

    MediaController* controllerForBindings() const { return controller(); }
    void setControllerForBindings(MediaController*);

    void enteredOrExitedFullscreen() { configureMediaControls(); }

    unsigned long long fileSize() const;

    void mediaLoadingFailed(MediaPlayer::NetworkState);
    void mediaLoadingFailedFatally(MediaPlayer::NetworkState);

    RefPtr<VideoPlaybackQuality> getVideoPlaybackQuality() const;

    MediaPlayer::Preload preloadValue() const { return m_preload; }
    MediaElementSession* mediaSessionIfExists() const { return m_mediaSession.get(); }
    WEBCORE_EXPORT MediaElementSession& mediaSession() const;

    void pageScaleFactorChanged();
    void userInterfaceLayoutDirectionChanged();
    WEBCORE_EXPORT String getCurrentMediaControlsStatus();
    WEBCORE_EXPORT void setMediaControlsMaximumRightContainerButtonCountOverride(size_t);
    WEBCORE_EXPORT void setMediaControlsHidePlaybackRates(bool);
    MediaControlsHost* mediaControlsHost() { return m_mediaControlsHost.get(); }

    bool isDisablingSleep() const { return m_sleepDisabler.get(); }

    double maxBufferedTime() const;

    MediaProducerMediaStateFlags mediaState() const override;

    void layoutSizeChanged();
    void visibilityDidChange();

    void allowsMediaDocumentInlinePlaybackChanged();
    void updateShouldPlay();

    RenderMedia* renderer() const;

    void resetPlaybackSessionState();
    WEBCORE_EXPORT bool isVisibleInViewport() const;
    bool hasEverNotifiedAboutPlaying() const;
    void setShouldDelayLoadEvent(bool);

    bool hasEverHadAudio() const { return m_hasEverHadAudio; }
    bool hasEverHadVideo() const { return m_hasEverHadVideo; }

    double playbackStartedTime() const { return m_playbackStartedTime; }

    bool isTemporarilyAllowingInlinePlaybackAfterFullscreen() const {return m_temporarilyAllowingInlinePlaybackAfterFullscreen; }

    void isVisibleInViewportChanged();
    void updateRateChangeRestrictions();

    WEBCORE_EXPORT const MediaResourceLoader* lastMediaResourceLoaderForTesting() const;

#if ENABLE(MEDIA_STREAM)
    void mediaStreamCaptureStarted();
    bool hasMediaStreamSrcObject() const { return m_mediaProvider && std::holds_alternative<RefPtr<MediaStream>>(*m_mediaProvider); }
#endif

    bool supportsSeeking() const override;

    using Identified<HTMLMediaElementIdentifier>::identifier;

#if !RELEASE_LOG_DISABLED
    const Logger& logger() const final { return *m_logger.get(); }
    Ref<Logger> protectedLogger() const;
    uint64_t logIdentifier() const final { return m_logIdentifier; }
    ASCIILiteral logClassName() const final { return "HTMLMediaElement"_s; }
    WTFLogChannel& logChannel() const final;
#endif

    bool willLog(WTFLogLevel) const;

    bool isAudible() const final { return canProduceAudio(); }
    bool isSuspended() const final;

    WEBCORE_EXPORT void didBecomeFullscreenElement() final;
    WEBCORE_EXPORT void willExitFullscreen();
    WEBCORE_EXPORT void didStopBeingFullscreenElement() final;
    void willBecomeFullscreenElement(VideoFullscreenMode = VideoFullscreenModeStandard);

    void scheduleEvent(Ref<Event>&&);

    enum class AutoplayEventPlaybackState { None, PreventedAutoplay, StartedWithUserGesture, StartedWithoutUserGesture };

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    RemotePlayback& remote() { return m_remote; }
    void remoteHasAvailabilityCallbacksChanged();
#endif

    void privateBrowsingStateDidChange(PAL::SessionID);
    void mediaVolumeDidChange();
    void applicationWillResignActive();
    void applicationDidBecomeActive();

    MediaUniqueIdentifier mediaUniqueIdentifier() const;
    String mediaSessionTitle() const;
    String sourceApplicationIdentifier() const;

    WEBCORE_EXPORT void setOverridePreferredDynamicRangeMode(DynamicRangeMode);
    void setPreferredDynamicRangeMode(DynamicRangeMode);

    void didReceiveRemoteControlCommand(PlatformMediaSession::RemoteControlCommandType, const PlatformMediaSession::RemoteCommandArgument&) override;

    using EventTarget::dispatchEvent;
    void dispatchEvent(Event&) override;

#if USE(AUDIO_SESSION)
    AudioSessionCategory categoryAtMostRecentPlayback() const { return m_categoryAtMostRecentPlayback; }
    AudioSessionMode modeAtMostRecentPlayback() const { return m_modeAtMostRecentPlayback; }
#endif

    void updateMediaPlayer(IntSize, bool);
    WEBCORE_EXPORT bool elementIsHidden() const;

    bool showingStats() const { return m_showingStats; }
    void setShowingStats(bool);

    enum class SpeechSynthesisState : uint8_t { None, Speaking, CompletingExtendedDescription, Paused };
    WEBCORE_EXPORT RefPtr<TextTrackCue> cueBeingSpoken() const;
#if ENABLE(SPEECH_SYNTHESIS)
    WEBCORE_EXPORT SpeechSynthesis& speechSynthesis();
    Ref<SpeechSynthesis> protectedSpeechSynthesis();
#endif

    bool hasSource() const { return hasCurrentSrc() || srcObject(); }

    WEBCORE_EXPORT void requestHostingContextID(Function<void(LayerHostingContextID)>&&);
    WEBCORE_EXPORT LayerHostingContextID layerHostingContextID();
    WEBCORE_EXPORT WebCore::FloatSize naturalSize();

    WEBCORE_EXPORT WebCore::FloatSize videoLayerSize() const;
    void setVideoLayerSizeFenced(const FloatSize&, WTF::MachSendRight&&);
    void updateMediaState();

    using SourceType = HTMLMediaElementSourceType;
    std::optional<SourceType> sourceType() const;
    String localizedSourceType() const;

    LayoutRect contentBoxRect() const { return mediaPlayerContentBoxRect(); }

#if HAVE(SPATIAL_TRACKING_LABEL)
    void updateSpatialTrackingLabel();
    void defaultSpatialTrackingLabelChanged(const String&);

    const String& spatialTrackingLabel() const;
    void setSpatialTrackingLabel(const String&);
#endif

    void mediaSourceWasDetached();

protected:
    HTMLMediaElement(const QualifiedName&, Document&, bool createdByParser);
    virtual ~HTMLMediaElement();

    void removeAllEventListeners() final;

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) override;
    void finishParsingChildren() override;
    bool isURLAttribute(const Attribute&) const override;
    void willAttachRenderers() override;
    void didAttachRenderers() override;
    void willDetachRenderers() override;
    void didDetachRenderers() override;

    void didMoveToNewDocument(Document& oldDocument, Document& newDocument) override;

    bool isMediaElement() const final { return true; }

    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) override;
    bool isReplaced(const RenderStyle&) const override { return true; }

    SecurityOriginData documentSecurityOrigin() const final;

    String audioOutputDeviceId() const final { return m_audioOutputPersistentDeviceId; }
    String audioOutputDeviceIdOverride() const final { return m_audioOutputPersistentDeviceId; }

    bool mediaControlsDependOnPageScaleFactor() const { return m_mediaControlsDependOnPageScaleFactor; }
    void setMediaControlsDependOnPageScaleFactor(bool);
    void updateMediaControlsAfterPresentationModeChange();

    void scheduleEvent(const AtomString&);
    template<typename T> void scheduleEventOn(T& target, Ref<Event>&&);

    bool showPosterFlag() const { return m_showPoster; }
    void setShowPosterFlag(bool);

    void setChangingVideoFullscreenMode(bool value) { m_changingVideoFullscreenMode = value; }
    bool isChangingVideoFullscreenMode() const { return m_changingVideoFullscreenMode; }

    void mediaPlayerEngineUpdated() override;
    void visibilityStateChanged() final;
    void mediaPlayerNetworkStateChanged() final;
    void mediaPlayerReadyStateChanged() final;
    void mediaPlayerTimeChanged() final;
    void mediaPlayerVolumeChanged() final;
    void mediaPlayerMuteChanged() final;
    void mediaPlayerSeeked(const MediaTime&) final;
    void mediaPlayerDurationChanged() final;
    void mediaPlayerRateChanged() final;
    void mediaPlayerPlaybackStateChanged() final;
    void mediaPlayerResourceNotSupported() final;
    void mediaPlayerRepaint() final;
    void mediaPlayerSizeChanged() final;
    bool mediaPlayerAcceleratedCompositingEnabled() final;
    void mediaPlayerWillInitializeMediaEngine() final;
    void mediaPlayerDidInitializeMediaEngine() final;
    void mediaPlayerReloadAndResumePlaybackIfNeeded() final;
    void mediaPlayerQueueTaskOnEventLoop(Function<void()>&&) final;
    void mediaPlayerCharacteristicChanged() final;

    bool videoFullscreenStandby() const { return m_videoFullscreenStandby; }
    void setVideoFullscreenStandbyInternal(bool videoFullscreenStandby) { m_videoFullscreenStandby = videoFullscreenStandby; }

    void ignoreFullscreenPermissionPolicyOnNextCallToEnterFullscreen() { m_ignoreFullscreenPermissionsPolicy = true; }

protected:
    // ActiveDOMObject
    void stop() override;

private:
    friend class Internals;

    void createMediaPlayer();

    bool supportsFocus() const override;
    bool isMouseFocusable() const override;
    bool rendererIsNeeded(const RenderStyle&) override;
    bool childShouldCreateRenderer(const Node&) const override;
    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) override;
    void didFinishInsertingNode() override;
    void removedFromAncestor(RemovalType, ContainerNode&) override;
    void didRecalcStyle(Style::Change) override;
    bool canStartSelection() const override { return false; } 
    bool isInteractiveContent() const override;

    void setFullscreenMode(VideoFullscreenMode);
    void willStopBeingFullscreenElement() override;

    // ActiveDOMObject.
    void suspend(ReasonForSuspension) override;
    void resume() override;
    bool virtualHasPendingActivity() const override;

    void stopWithoutDestroyingMediaPlayer();
    void contextDestroyed() override;
    
    void setReadyState(MediaPlayer::ReadyState);
    void setNetworkState(MediaPlayer::NetworkState);

    WEBCORE_EXPORT double effectivePlaybackRate() const;
    double requestedPlaybackRate() const;

    void scheduleMediaEngineWasUpdated();
    void mediaEngineWasUpdated();


#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
    RefPtr<ArrayBuffer> mediaPlayerCachedKeyForKeyId(const String& keyId) const final;
    void mediaPlayerKeyNeeded(const SharedBuffer&) final;
    String mediaPlayerMediaKeysStorageDirectory() const final;
#endif

#if ENABLE(ENCRYPTED_MEDIA)
    void mediaPlayerInitializationDataEncountered(const String&, RefPtr<ArrayBuffer>&&) final;
    void mediaPlayerWaitingForKeyChanged() final;

    void attemptToDecrypt();
    void attemptToResumePlaybackIfNecessary();

    // CDMClient
    void cdmClientAttemptToResumePlaybackIfNecessary() final;
    void cdmClientUnrequestedInitializationDataReceived(const String&, Ref<SharedBuffer>&&) final;
#endif

#if ENABLE(LEGACY_ENCRYPTED_MEDIA) && ENABLE(ENCRYPTED_MEDIA)
    void updateShouldContinueAfterNeedKey();
#endif

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    void mediaPlayerCurrentPlaybackTargetIsWirelessChanged(bool) final;

    enum class EnqueueBehavior : uint8_t { Always, OnlyWhenChanged };
    void enqueuePlaybackTargetAvailabilityChangedEvent(EnqueueBehavior);
#endif

    String mediaPlayerReferrer() const override;
    String mediaPlayerUserAgent() const override;

    bool mediaPlayerIsFullscreen() const override;
    bool mediaPlayerIsFullscreenPermitted() const override;
    bool mediaPlayerIsVideo() const override;
    LayoutRect mediaPlayerContentBoxRect() const override;
    float mediaPlayerContentsScale() const override;
    bool mediaPlayerPlatformVolumeConfigurationRequired() const override;
    bool mediaPlayerIsLooping() const override;
    CachedResourceLoader* mediaPlayerCachedResourceLoader() override;
    Ref<PlatformMediaResourceLoader> mediaPlayerCreateResourceLoader() override;
    bool mediaPlayerShouldUsePersistentCache() const override;
    const String& mediaPlayerMediaCacheDirectory() const override;

    void mediaPlayerActiveSourceBuffersChanged() override;

    String mediaPlayerSourceApplicationIdentifier() const override { return sourceApplicationIdentifier(); }
    Vector<String> mediaPlayerPreferredAudioCharacteristics() const override;

    String mediaPlayerElementId() const override { return m_id; }

#if PLATFORM(IOS_FAMILY)
    String mediaPlayerNetworkInterfaceName() const override;
    void mediaPlayerGetRawCookies(const URL&, MediaPlayerClient::GetRawCookiesCallback&&) const final;
#endif

    void mediaPlayerEngineFailedToLoad() final;

    double mediaPlayerRequestedPlaybackRate() const final;
    VideoFullscreenMode mediaPlayerFullscreenMode() const final { return fullscreenMode(); }
    bool mediaPlayerIsVideoFullscreenStandby() const final { return m_videoFullscreenStandby; }
    bool mediaPlayerShouldDisableSleep() const final { return shouldDisableSleep() == SleepType::Display; }
    bool mediaPlayerShouldCheckHardwareSupport() const final;
    const Vector<ContentType>& mediaContentTypesRequiringHardwareSupport() const final;
    const std::optional<Vector<String>>& allowedMediaContainerTypes() const final;
    const std::optional<Vector<String>>& allowedMediaCodecTypes() const final;
    const std::optional<Vector<FourCC>>& allowedMediaVideoCodecIDs() const final;
    const std::optional<Vector<FourCC>>& allowedMediaAudioCodecIDs() const final;
    const std::optional<Vector<FourCC>>& allowedMediaCaptionFormatTypes() const final;

    void mediaPlayerBufferedTimeRangesChanged() final;
    bool mediaPlayerPrefersSandboxedParsing() const final;

    bool mediaPlayerShouldDisableHDR() const final { return shouldDisableHDR(); }

    FloatSize mediaPlayerVideoLayerSize() const final { return videoLayerSize(); }
    void mediaPlayerVideoLayerSizeDidChange(const FloatSize& size) final { m_videoLayerSize = size; }

    std::optional<MediaPlayerClientIdentifier> mediaPlayerClientIdentifier() const final { return identifier(); }

    void pendingActionTimerFired();
    void progressEventTimerFired();
    void playbackProgressTimerFired();
    void scanTimerFired();
    void seekTask();
    void startPlaybackProgressTimer();
    void startProgressEventTimer();
    void stopPeriodicTimers();
    void cancelPendingTasks();
    void closeTaskQueues();

    void seek(const MediaTime&);
    void seekInternal(const MediaTime&);
    void seekWithTolerance(const SeekTarget&, bool fromDOM);
    void finishSeek();
    void clearSeeking();
    void addPlayedRange(const MediaTime& start, const MediaTime& end);
    
    void scheduleTimeupdateEvent(bool periodicEvent);
    virtual void scheduleResizeEvent(const FloatSize&) { }
    virtual void scheduleResizeEventIfSizeChanged(const FloatSize&) { }

    void selectMediaResource();
    void queueLoadMediaResourceTask();
    void loadResource(const URL&, const ContentType&, const String& keySystem);
    void scheduleNextSourceChild();
    void loadNextSourceChild();
    void userCancelledLoad();
    void clearMediaPlayer();
    bool havePotentialSourceChild();
    void noneSupported();
    void cancelPendingEventsAndCallbacks();
    void waitForSourceChange();
    void prepareToPlay();

    URL selectNextSourceChild(ContentType*, String* keySystem, InvalidURLAction);

    bool ignoreTrackDisplayUpdateRequests() const;
    void beginIgnoringTrackDisplayUpdateRequests();
    void endIgnoringTrackDisplayUpdateRequests();

    void updateActiveTextTrackCues(const MediaTime&);

    enum class CueAction : uint8_t { Enter, Exit };
    void executeCueEnterOrExitActionForTime(TextTrackCue&, CueAction);
    void speakCueText(TextTrackCue&);
    void pauseSpeakingCueText();
    void resumeSpeakingCueText();
    void cancelSpeakingCueText();
    bool shouldSpeakCueTextForTime(const MediaTime&);
    void pausePlaybackForExtendedTextDescription();

    void setSpeechSynthesisState(SpeechSynthesisState);

    enum ReconfigureMode { Immediately, AfterDelay };
    void markCaptionAndSubtitleTracksAsUnconfigured(ReconfigureMode);
    CaptionUserPreferences::CaptionDisplayMode captionDisplayMode();

    bool textTracksAreReady() const;
    void configureTextTrackDisplay(TextTrackVisibilityCheckType = CheckTextTrackVisibility);
    void updateTextTrackDisplay();

    // These "internal" functions do not check user gesture restrictions.
    void playInternal();
    void pauseInternal();

    void prepareForLoad();
    void allowVideoRendering();

    bool processingMediaPlayerCallback() const { return m_processingMediaPlayerCallback > 0; }
    void beginProcessingMediaPlayerCallback() { ++m_processingMediaPlayerCallback; }
    void endProcessingMediaPlayerCallback() { ASSERT(m_processingMediaPlayerCallback); --m_processingMediaPlayerCallback; }

    void scheduleUpdatePlayState();
    void updatePlayState();

    void updateVolume();
    void setPlaying(bool);
    bool potentiallyPlaying() const;
    bool endedPlayback() const;
    bool stoppedDueToErrors() const;
    bool pausedForUserInteraction() const;
    bool couldPlayIfEnoughData() const;
    void dispatchPlayPauseEventsIfNeedsQuirks();
    Expected<void, MediaPlaybackDenialReason> canTransitionFromAutoplayToPlay() const;

    void setAutoplayEventPlaybackState(AutoplayEventPlaybackState);
    void userDidInterfereWithAutoplay();
    void handleAutoplayEvent(AutoplayEvent);

    MediaTime minTimeSeekable() const;
    MediaTime maxTimeSeekable() const;

    // Pauses playback without changing any states or generating events
    void setPausedInternal(bool);
    void pauseAndUpdatePlayStateImmediately();

    void setPlaybackRateInternal(double);

    void mediaCanStart(Document&) final;

    void invalidateCachedTime() const;
    void refreshCachedTime() const;

    void configureMediaControls();

    void prepareMediaFragmentURI();
    void applyMediaFragmentURI();

    void changeNetworkStateFromLoadingToIdle();

    void removeBehaviorRestrictionsAfterFirstUserGesture(MediaElementSession::BehaviorRestrictions mask = MediaElementSession::AllRestrictions);

    void updateMediaController();
    bool isBlocked() const;
    bool isBlockedOnMediaController() const;
    void setCurrentSrc(const URL&);
    bool hasCurrentSrc() const override { return !m_currentSrc.isEmpty(); }
    bool isLiveStream() const override { return movieLoadType() == MovieLoadType::LiveStream; }

    void updateSleepDisabling();
    enum class SleepType : uint8_t { None, Display, System };
    SleepType shouldDisableSleep() const;

    DOMWrapperWorld& ensureIsolatedWorld();

    PlatformMediaSession::MediaType mediaType() const override;
    PlatformMediaSession::MediaType presentationType() const override;
    PlatformMediaSession::DisplayType displayType() const override;

    void suspendPlayback() override;
    void resumeAutoplaying() override;
    void mayResumePlayback(bool shouldResume) override;
    bool canReceiveRemoteControlCommands() const override { return true; }
    bool shouldOverrideBackgroundPlaybackRestriction(PlatformMediaSession::InterruptionType) const override;
    bool shouldOverrideBackgroundLoadingRestriction() const override;
    bool canProduceAudio() const final;
    bool isEnded() const final { return ended(); }
    MediaTime mediaSessionDuration() const final;
    bool hasMediaStreamSource() const final;
    void processIsSuspendedChanged() final;
    bool shouldOverridePauseDuringRouteChange() const final;
    bool isNowPlayingEligible() const final;
    std::optional<NowPlayingInfo> nowPlayingInfo() const final;
    WeakPtr<PlatformMediaSession> selectBestMediaSession(const Vector<WeakPtr<PlatformMediaSession>>&, PlatformMediaSession::PlaybackControlsPurpose) final;

    void visibilityAdjustmentStateDidChange() final;
    void pageMutedStateDidChange() override;

#if USE(AUDIO_SESSION) && PLATFORM(MAC)
    void hardwareMutedStateDidChange(const AudioSession&) final;
#endif

    bool hasMediaSource() const;
    bool hasManagedMediaSource() const;

    bool processingUserGestureForMedia() const;

    WEBCORE_EXPORT bool effectiveMuted() const;
    double effectiveVolume() const;

    void registerWithDocument(Document&);
    void unregisterWithDocument(Document&);

    void initializeMediaSession();

    void updateCaptionContainer();
    bool ensureMediaControls();

    using JSSetupFunction = Function<bool(JSDOMGlobalObject&, JSC::JSGlobalObject&, ScriptController&, DOMWrapperWorld&)>;
    bool setupAndCallJS(const JSSetupFunction&);

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    void prepareForDocumentSuspension() final;
    void resumeFromDocumentSuspension() final;

    void scheduleUpdateMediaState();
    bool hasPlaybackTargetAvailabilityListeners() const { return m_hasPlaybackTargetAvailabilityListeners; }
#endif

    bool isVideoTooSmallForInlinePlayback();
    void updateShouldAutoplay();
    void scheduleUpdateShouldAutoplay();

    void pauseAfterDetachedTask();
    void schedulePlaybackControlsManagerUpdate();
    void playbackControlsManagerBehaviorRestrictionsTimerFired();

    void updateRenderer();

    void updatePageScaleFactorJSProperty();
    void updateUsesLTRUserInterfaceLayoutDirectionJSProperty();
    void setControllerJSProperty(ASCIILiteral, JSC::JSValue);

    void addBehaviorRestrictionsOnEndIfNecessary();
    void handleSeekToPlaybackPosition(double);
    void seekToPlaybackPositionEndedTimerFired();

    void setInActiveDocument(bool);

    void checkForAudioAndVideo();

    bool needsContentTypeToPlay() const;
    using SnifferPromise = MediaResourceSniffer::Promise;
    Ref<SnifferPromise> sniffForContentType(const URL&);
    void cancelSniffer();

    void playPlayer();
    void pausePlayer();

    virtual void computeAcceleratedRenderingStateAndUpdateMediaPlayer() { }

    struct RemotePlaybackConfiguration {
        MediaTime currentTime;
        double rate;
        bool paused;
    };
    void applyConfiguration(const RemotePlaybackConfiguration&);

    bool videoUsesElementFullscreen() const;

#if !RELEASE_LOG_DISABLED
    uint64_t mediaPlayerLogIdentifier() final { return logIdentifier(); }
    const Logger& mediaPlayerLogger() final { return logger(); }
#endif

    bool shouldDisableHDR() const;

    bool shouldLogWatchtimeEvent() const;
    bool isWatchtimeTimerActive() const;
    void startWatchtimeTimer();
    void pauseWatchtimeTimer();
    void invalidateWatchtimeTimer();
    void watchtimeTimerFired();
    void startBufferingStopwatch();
    void invalidateBufferingStopwatch();
    void logTextTrackDiagnostics(Ref<TextTrack>, double);


    enum ForceMuteChange { False, True };
    void setMutedInternal(bool muted, ForceMuteChange);
    bool implicitlyMuted() const { return m_implicitlyMuted.value_or(false); }

    Timer m_progressEventTimer;
    Timer m_playbackProgressTimer;
    Timer m_scanTimer;
    Timer m_playbackControlsManagerBehaviorRestrictionsTimer;
    Timer m_seekToPlaybackPositionEndedTimer;
    Timer m_checkPlaybackTargetCompatibilityTimer;
    TaskCancellationGroup m_configureTextTracksTaskCancellationGroup;
    TaskCancellationGroup m_updateTextTracksTaskCancellationGroup;
    TaskCancellationGroup m_updateMediaStateTaskCancellationGroup;
    TaskCancellationGroup m_mediaEngineUpdatedTaskCancellationGroup;
    TaskCancellationGroup m_updatePlayStateTaskCancellationGroup;
    TaskCancellationGroup m_resumeTaskCancellationGroup;
    TaskCancellationGroup m_seekTaskCancellationGroup;
    TaskCancellationGroup m_playbackControlsManagerBehaviorRestrictionsTaskCancellationGroup;
    TaskCancellationGroup m_bufferedTimeRangesChangedTaskCancellationGroup;
    TaskCancellationGroup m_resourceSelectionTaskCancellationGroup;
    TaskCancellationGroup m_updateShouldAutoplayTaskCancellationGroup;
    RefPtr<TimeRanges> m_playedTimeRanges;
    TaskCancellationGroup m_asyncEventsCancellationGroup;
#if PLATFORM(IOS_FAMILY)
    TaskCancellationGroup m_volumeRevertTaskCancellationGroup;
#endif

    PlayPromiseVector m_pendingPlayPromises;

    double m_requestedPlaybackRate { 1 };
    double m_reportedPlaybackRate { 1 };
    double m_defaultPlaybackRate { 1 };
    bool m_preservesPitch { true };
    NetworkState m_networkState { NETWORK_EMPTY };
    ReadyState m_readyState { HAVE_NOTHING };
    ReadyState m_readyStateMaximum { HAVE_NOTHING };
    URL m_currentSrc;
    MediaUniqueIdentifier m_currentIdentifier;

    RefPtr<MediaError> m_error;

    struct PendingSeek {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;
        PendingSeek(const MediaTime& now, const SeekTarget& inTarget)
            : now(now)
            , target(inTarget)
        {
        }
        MediaTime now;
        SeekTarget target;
    };
    std::unique_ptr<PendingSeek> m_pendingSeek;
    SeekType m_pendingSeekType { NoSeek };

    double m_volume { 1 };
    bool m_volumeInitialized { false };
    MediaTime m_lastSeekTime;
    
    MonotonicTime m_previousProgressTime { MonotonicTime::infinity() };
    double m_playbackStartedTime { 0 };

    // The last time a timeupdate event was sent (based on monotonic clock).
    MonotonicTime m_clockTimeAtLastUpdateEvent;

    // The last time a timeupdate event was sent in movie time.
    MediaTime m_lastTimeUpdateEventMovieTime;
    
    // Loading state.
    enum LoadState { WaitingForSource, LoadingFromSrcAttr, LoadingFromSourceElement };
    LoadState m_loadState { WaitingForSource };
    RefPtr<HTMLSourceElement> m_currentSourceNode;
    RefPtr<HTMLSourceElement> m_nextChildNodeToConsider;

    VideoFullscreenMode m_videoFullscreenMode { VideoFullscreenModeNone };
    bool m_videoFullscreenStandby { false };
    bool m_preparedForInline;
    Function<void()> m_preparedForInlineCompletionHandler;

    bool m_temporarilyAllowingInlinePlaybackAfterFullscreen { false };

#if ENABLE(VIDEO_PRESENTATION_MODE)
    RetainPtr<PlatformLayer> m_videoFullscreenLayer;
    FloatRect m_videoFullscreenFrame;
    MediaPlayer::VideoGravity m_videoFullscreenGravity { MediaPlayer::VideoGravity::ResizeAspect };
#endif

    RefPtr<MediaPlayer> m_player;

    MediaPlayer::Preload m_preload { Preload::Auto };

    // Counter incremented while processing a callback from the media player, so we can avoid
    // calling the media engine recursively.
    int m_processingMediaPlayerCallback { 0 };

#if ENABLE(MEDIA_SOURCE)
    RefPtr<MediaSourceInterfaceProxy> m_mediaSource;
    unsigned m_droppedVideoFrames { 0 };
#endif

    MediaTime m_defaultPlaybackStartPosition = MediaTime::zeroTime();
    mutable MediaTime m_cachedTime;
    mutable MonotonicTime m_clockTimeAtLastCachedTimeUpdate;
    mutable MonotonicTime m_minimumClockTimeToUpdateCachedTime;

    MediaTime m_fragmentStartTime;
    MediaTime m_fragmentEndTime;

    using PendingActionFlags = unsigned;
    PendingActionFlags m_pendingActionFlags { 0 };

    enum ActionAfterScanType { Nothing, Play, Pause };
    ActionAfterScanType m_actionAfterScan { Nothing };

    enum ScanType { Seek, Scan };
    ScanType m_scanType { Scan };
    ScanDirection m_scanDirection { Forward };

    BufferingPolicy m_bufferingPolicy { BufferingPolicy::Default };

    std::optional<bool> m_implicitlyMuted;

    bool m_firstTimePlaying : 1;
    bool m_playing : 1;
    bool m_isWaitingUntilMediaCanStart : 1;
    bool m_shouldDelayLoadEvent : 1;
    bool m_haveFiredLoadedData : 1;
    bool m_inActiveDocument : 1;
    bool m_autoplaying : 1;
    bool m_muted : 1;
    bool m_explicitlyMuted : 1;
    bool m_paused : 1;
    bool m_seeking : 1;
    bool m_buffering : 1;
    bool m_stalled : 1;
    bool m_seekRequested : 1;
    bool m_wasPlayingBeforeSeeking : 1;

    // data has not been loaded since sending a "stalled" event
    bool m_sentStalledEvent : 1;

    // time has not changed since sending an "ended" event
    bool m_sentEndEvent : 1;

    bool m_pausedInternal : 1;

    bool m_closedCaptionsVisible : 1;
    bool m_completelyLoaded : 1;
    bool m_havePreparedToPlay : 1;
    bool m_parsingInProgress : 1;
    bool m_elementIsHidden : 1;
    bool m_elementWasRemovedFromDOM : 1;
    bool m_receivedLayoutSizeChanged : 1;
    bool m_hasEverNotifiedAboutPlaying : 1;

    bool m_hasEverHadAudio : 1;
    bool m_hasEverHadVideo : 1;

    bool m_mediaControlsDependOnPageScaleFactor : 1;
    bool m_haveSetUpCaptionContainer : 1;

    bool m_isScrubbingRemotely : 1;
    bool m_waitingToEnterFullscreen : 1;
    bool m_changingVideoFullscreenMode : 1;

    bool m_showPoster : 1;
    bool m_tracksAreReady : 1;
    bool m_haveVisibleTextTrack : 1;
    bool m_processingPreferenceChange : 1;
    bool m_shouldAudioPlaybackRequireUserGesture : 1;
    bool m_shouldVideoPlaybackRequireUserGesture : 1;
    bool m_volumeLocked : 1;
    bool m_cachedIsInVisibilityAdjustmentSubtree : 1 { false };
    bool m_requiresTextTrackRepresentation : 1 { false };
    bool m_isResumingPlayback : 1 { false };
    bool m_seekAfterPlaybackEnded : 1 { false };

    IntRect m_textTrackRepresentationBounds;

    enum class ControlsState : uint8_t { None, Initializing, Ready, PartiallyDeinitialized };
    friend String convertEnumerationToString(HTMLMediaElement::ControlsState enumerationValue);
    ControlsState m_controlsState { ControlsState::None };

    AutoplayEventPlaybackState m_autoplayEventPlaybackState { AutoplayEventPlaybackState::None };

    String m_subtitleTrackLanguage;
    std::optional<String> m_languageOfPrimaryAudioTrack;
    MediaTime m_lastTextTrackUpdateTime { -1, 1 };

    std::optional<CaptionUserPreferences::CaptionDisplayMode> m_captionDisplayMode;

    RefPtr<AudioTrackList> m_audioTracks;
    RefPtr<TextTrackList> m_textTracks;
    RefPtr<VideoTrackList> m_videoTracks;
    Vector<RefPtr<TextTrack>> m_textTracksWhenResourceSelectionBegan;

    struct CueData;
    std::unique_ptr<CueData> m_cueData;

    int m_ignoreTrackDisplayUpdate { 0 };

    bool m_requireCaptionPreferencesChangedCallbacks { false };

#if ENABLE(WEB_AUDIO)
    // This is a weak reference, since m_audioSourceNode holds a reference to us.
    // The value is set just after the MediaElementAudioSourceNode is created.
    // The value is cleared in MediaElementAudioSourceNode::~MediaElementAudioSourceNode().
    WeakPtr<MediaElementAudioSourceNode, WeakPtrImplWithEventTargetData> m_audioSourceNode;
#endif

    String m_mediaGroup;
    friend class MediaController;
    RefPtr<MediaController> m_mediaController;

    std::unique_ptr<SleepDisabler> m_sleepDisabler;

    WeakPtr<const MediaResourceLoader> m_lastMediaResourceLoaderForTesting;

    std::optional<DynamicRangeMode> m_overrideDynamicRangeMode;

    friend class TrackDisplayUpdateScope;

    RefPtr<Blob> m_blob;
    URLKeepingBlobAlive m_blobURLForReading;
    MediaProvider m_mediaProvider;
    WTF::Observer<WebCoreOpaqueRoot()> m_opaqueRootProvider;

#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
    bool m_hasNeedkeyListener { false };
    RefPtr<WebKitMediaKeys> m_webKitMediaKeys;
#endif

#if ENABLE(ENCRYPTED_MEDIA)
    RefPtr<MediaKeys> m_mediaKeys;
    bool m_attachingMediaKeys { false };
    bool m_playbackBlockedWaitingForKey { false };
#endif

    std::unique_ptr<MediaElementSession> m_mediaSession;
    size_t m_reportedExtraMemoryCost { 0 };

    friend class MediaControlsHost;
    RefPtr<MediaControlsHost> m_mediaControlsHost;
    RefPtr<DOMWrapperWorld> m_isolatedWorld;

#if ENABLE(MEDIA_STREAM)
    RefPtr<MediaStream> m_mediaStreamSrcObject;
    bool m_settingMediaStreamSrcObject { false };
#endif

    MediaProducerMediaStateFlags m_mediaState;

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    bool m_hasPlaybackTargetAvailabilityListeners { false };
    bool m_failedToPlayToWirelessTarget { false };
    bool m_lastTargetAvailabilityEventState { false };
#endif

    std::optional<RemotePlaybackConfiguration> m_remotePlaybackConfiguration;

    bool m_wirelessPlaybackTargetDisabled { false };
    bool m_isPlayingToWirelessTarget { false };
    bool m_playingOnSecondScreen { false };
    bool m_removedBehaviorRestrictionsAfterFirstUserGesture { false };

    String m_audioOutputPersistentDeviceId;
#if ENABLE(MEDIA_STREAM)
    String m_audioOutputHashedDeviceId;
#endif
    String m_id;

#if USE(AUDIO_SESSION)
    AudioSessionCategory m_categoryAtMostRecentPlayback;
    AudioSessionMode m_modeAtMostRecentPlayback;
#endif
    bool m_wasInterruptedForInvisibleAutoplay { false };

    bool m_showingStats { false };

#if ENABLE(SPEECH_SYNTHESIS)
    RefPtr<SpeechSynthesis> m_speechSynthesis;
#endif
    SpeechSynthesisState m_speechState { SpeechSynthesisState::None };
    RefPtr<TextTrackCue> m_cueBeingSpoken;
    double m_volumeMultiplierForSpeechSynthesis { 1 };
    bool m_userPrefersTextDescriptions { false };
    bool m_userPrefersExtendedDescriptions { false };
    bool m_changingSynthesisState { false };

    FloatSize m_videoLayerSize { };
    RefPtr<MediaResourceSniffer> m_sniffer;
    bool m_networkErrorOccured { false };
    std::optional<ContentType> m_lastContentTypeUsed;

#if HAVE(SPATIAL_TRACKING_LABEL)
    using DefaultSpatialTrackingLabelChangedObserver = WTF::Observer<void(String&&)>;
    DefaultSpatialTrackingLabelChangedObserver m_defaultSpatialTrackingLabelChangedObserver;
    String m_spatialTrackingLabel;
#endif

#if !RELEASE_LOG_DISABLED
    RefPtr<Logger> m_logger;
    const uint64_t m_logIdentifier;
#endif

#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    Ref<RemotePlayback> m_remote;
#endif

    bool m_isChangingReadyStateWhileSuspended { false };
    Atomic<unsigned> m_remainingReadyStateChangedAttempts;

    std::unique_ptr<PausableIntervalTimer> m_watchtimeTimer;
    RefPtr<WTF::Stopwatch> m_bufferingStopwatch;

    bool m_ignoreFullscreenPermissionsPolicy { false };
};

String convertEnumerationToString(HTMLMediaElement::AutoplayEventPlaybackState);
String convertEnumerationToString(HTMLMediaElement::SpeechSynthesisState);

} // namespace WebCore

namespace WTF {

template<> struct LogArgument<WebCore::HTMLMediaElement::AutoplayEventPlaybackState> {
    static String toString(WebCore::HTMLMediaElement::AutoplayEventPlaybackState reason) { return convertEnumerationToString(reason); }
};

template<> struct LogArgument<WebCore::HTMLMediaElement::SpeechSynthesisState> {
    static String toString(WebCore::HTMLMediaElement::SpeechSynthesisState state) { return convertEnumerationToString(state); }
};

} // namespace WTF

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::HTMLMediaElement)
    static bool isType(const WebCore::Element& element) { return element.isMediaElement(); }
    static bool isType(const WebCore::Node& node)
    {
        auto* element = dynamicDowncast<WebCore::Element>(node);
        return element && isType(*element);
    }
SPECIALIZE_TYPE_TRAITS_END()

#endif
