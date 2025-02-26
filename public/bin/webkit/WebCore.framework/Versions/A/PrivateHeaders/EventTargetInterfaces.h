/*
 * THIS FILE WAS AUTOMATICALLY GENERATED, DO NOT EDIT.
 *
 * Copyright (C) 2011 Google Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY GOOGLE, INC. ``AS IS'' AND ANY
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

namespace WebCore {

enum class EventTargetInterfaceType {
    Invalid = 0,
#if ENABLE(APPLE_PAY)
    ApplePaySession = 1,
#endif
#if ENABLE(DOM_AUDIO_SESSION)
    DOMAudioSession = 2,
#endif
#if ENABLE(ENCRYPTED_MEDIA)
    MediaKeySession = 3,
#endif
#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
    WebKitMediaKeySession = 4,
#endif
#if ENABLE(MEDIA_RECORDER)
    MediaRecorder = 5,
#endif
#if ENABLE(MEDIA_SESSION_COORDINATOR)
    MediaSessionCoordinator = 6,
#endif
#if ENABLE(MEDIA_SOURCE)
    ManagedMediaSource = 7,
    ManagedSourceBuffer = 8,
    MediaSource = 9,
    SourceBuffer = 10,
    SourceBufferList = 11,
#endif
#if ENABLE(MEDIA_STREAM)
    MediaDevices = 12,
    MediaStream = 13,
    MediaStreamTrack = 14,
#endif
#if ENABLE(NOTIFICATIONS)
    Notification = 15,
#endif
#if ENABLE(OFFSCREEN_CANVAS)
    OffscreenCanvas = 16,
#endif
#if ENABLE(PAYMENT_REQUEST)
    PaymentRequest = 17,
    PaymentResponse = 18,
#endif
#if ENABLE(PICTURE_IN_PICTURE_API)
    PictureInPictureWindow = 19,
#endif
#if ENABLE(SPEECH_SYNTHESIS)
    SpeechSynthesis = 20,
    SpeechSynthesisUtterance = 21,
#endif
#if ENABLE(VIDEO)
    AudioTrackList = 22,
    MediaController = 23,
    TextTrack = 24,
    TextTrackCue = 25,
    TextTrackCueGeneric = 26,
    TextTrackList = 27,
    VideoTrackList = 28,
#endif
#if ENABLE(WEBXR)
    WebXRLayer = 29,
    WebXRSession = 30,
    WebXRSpace = 31,
    WebXRSystem = 32,
#endif
#if ENABLE(WEB_AUDIO)
    AudioNode = 33,
    BaseAudioContext = 34,
#endif
#if ENABLE(WEB_CODECS)
    WebCodecsAudioDecoder = 35,
    WebCodecsAudioEncoder = 36,
    WebCodecsVideoDecoder = 37,
    WebCodecsVideoEncoder = 38,
#endif
#if ENABLE(WEB_RTC)
    RTCDTMFSender = 39,
    RTCDataChannel = 40,
    RTCDtlsTransport = 41,
    RTCIceTransport = 42,
    RTCPeerConnection = 43,
    RTCRtpSFrameTransform = 44,
    RTCSctpTransport = 45,
#endif
#if ENABLE(WIRELESS_PLAYBACK_TARGET)
    RemotePlayback = 46,
#endif
    EventTarget = 47,
    AbortSignal = 48,
    BackgroundFetchRegistration = 49,
    BroadcastChannel = 50,
    Clipboard = 51,
    CookieStore = 52,
    DOMApplicationCache = 53,
    DOMWindow = 54,
    DedicatedWorkerGlobalScope = 55,
    EventSource = 56,
    FileReader = 57,
    FontFaceSet = 58,
    GPUDevice = 59,
    IDBDatabase = 60,
    IDBOpenDBRequest = 61,
    IDBRequest = 62,
    IDBTransaction = 63,
    MediaQueryList = 64,
    MessagePort = 65,
    Navigation = 66,
    NavigationHistoryEntry = 67,
    Node = 68,
    Performance = 69,
    PermissionStatus = 70,
    ScreenOrientation = 71,
    ServiceWorker = 72,
    ServiceWorkerContainer = 73,
    ServiceWorkerGlobalScope = 74,
    ServiceWorkerRegistration = 75,
    SharedWorker = 76,
    SharedWorkerGlobalScope = 77,
    SpeechRecognition = 78,
    VisualViewport = 79,
    WakeLockSentinel = 80,
    WebAnimation = 81,
    WebSocket = 82,
    Worker = 83,
    WorkletGlobalScope = 84,
    XMLHttpRequest = 85,
    XMLHttpRequestUpload = 86,
};

} // namespace WebCore
