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

enum class EventInterfaceType {
    Invalid = 0,
#if ENABLE(APPLE_PAY)
    ApplePayCancelEvent = 1,
    ApplePayPaymentAuthorizedEvent = 2,
    ApplePayPaymentMethodSelectedEvent = 3,
    ApplePayShippingContactSelectedEvent = 4,
    ApplePayShippingMethodSelectedEvent = 5,
    ApplePayValidateMerchantEvent = 6,
#endif
#if ENABLE(APPLE_PAY_COUPON_CODE)
    ApplePayCouponCodeChangedEvent = 7,
#endif
#if ENABLE(DEVICE_ORIENTATION)
    DeviceMotionEvent = 8,
    DeviceOrientationEvent = 9,
#endif
#if ENABLE(ENCRYPTED_MEDIA)
    MediaEncryptedEvent = 10,
    MediaKeyMessageEvent = 11,
#endif
#if ENABLE(GAMEPAD)
    GamepadEvent = 12,
#endif
#if ENABLE(IOS_GESTURE_EVENTS) || ENABLE(MAC_GESTURE_EVENTS)
    GestureEvent = 13,
#endif
#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
    WebKitMediaKeyMessageEvent = 14,
    WebKitMediaKeyNeededEvent = 15,
#endif
#if ENABLE(MEDIA_RECORDER)
    BlobEvent = 16,
    MediaRecorderErrorEvent = 17,
#endif
#if ENABLE(MEDIA_SOURCE)
    BufferedChangeEvent = 18,
#endif
#if ENABLE(MEDIA_STREAM)
    MediaStreamTrackEvent = 19,
    OverconstrainedErrorEvent = 20,
#endif
#if ENABLE(NOTIFICATION_EVENT)
    NotificationEvent = 21,
#endif
#if ENABLE(ORIENTATION_EVENTS)
#endif
#if ENABLE(PAYMENT_REQUEST)
    MerchantValidationEvent = 22,
    PaymentMethodChangeEvent = 23,
    PaymentRequestUpdateEvent = 24,
#endif
#if ENABLE(PICTURE_IN_PICTURE_API)
    PictureInPictureEvent = 25,
#endif
#if ENABLE(SPEECH_SYNTHESIS)
    SpeechSynthesisErrorEvent = 26,
    SpeechSynthesisEvent = 27,
#endif
#if ENABLE(TOUCH_EVENTS)
    TouchEvent = 28,
#endif
#if ENABLE(VIDEO)
    TrackEvent = 29,
#endif
#if ENABLE(WEBGL)
    WebGLContextEvent = 30,
#endif
#if ENABLE(WEBXR)
    XRInputSourceEvent = 31,
    XRInputSourcesChangeEvent = 32,
    XRReferenceSpaceEvent = 33,
    XRSessionEvent = 34,
#endif
#if ENABLE(WEBXR_LAYERS)
    XRLayerEvent = 35,
#endif
#if ENABLE(WEB_AUDIO)
    AudioProcessingEvent = 36,
    OfflineAudioCompletionEvent = 37,
#endif
#if ENABLE(WEB_RTC)
    RTCDTMFToneChangeEvent = 38,
    RTCDataChannelEvent = 39,
    RTCErrorEvent = 40,
    RTCPeerConnectionIceErrorEvent = 41,
    RTCPeerConnectionIceEvent = 42,
    RTCRtpSFrameTransformErrorEvent = 43,
    RTCTrackEvent = 44,
    RTCTransformEvent = 45,
#endif
#if ENABLE(WIRELESS_PLAYBACK_TARGET_AVAILABILITY_API)
    WebKitPlaybackTargetAvailabilityEvent = 46,
#endif
    AnimationPlaybackEvent = 47,
    BackgroundFetchEvent = 48,
    BackgroundFetchUpdateUIEvent = 49,
    BeforeUnloadEvent = 50,
    CSSAnimationEvent = 51,
    CSSTransitionEvent = 52,
    ClipboardEvent = 53,
    CloseEvent = 54,
    CommandEvent = 55,
    CompositionEvent = 56,
    ContentVisibilityAutoStateChangeEvent = 57,
    CookieChangeEvent = 58,
    CustomEvent = 59,
    DragEvent = 60,
    ErrorEvent = 61,
    Event = 62,
    ExtendableCookieChangeEvent = 63,
    ExtendableEvent = 64,
    ExtendableMessageEvent = 65,
    FetchEvent = 66,
    FocusEvent = 67,
    FormDataEvent = 68,
    GPUUncapturedErrorEvent = 69,
    HashChangeEvent = 70,
    IDBVersionChangeEvent = 71,
    InputEvent = 72,
    KeyboardEvent = 73,
    MediaQueryListEvent = 74,
    MessageEvent = 75,
    MouseEvent = 76,
    MutationEvent = 77,
    NavigateEvent = 78,
    NavigationCurrentEntryChangeEvent = 79,
    PageRevealEvent = 80,
    PageSwapEvent = 81,
    PageTransitionEvent = 82,
    PointerEvent = 83,
    PopStateEvent = 84,
    ProgressEvent = 85,
    PromiseRejectionEvent = 86,
    PushEvent = 87,
    PushSubscriptionChangeEvent = 88,
    SecurityPolicyViolationEvent = 89,
    SpeechRecognitionErrorEvent = 90,
    SpeechRecognitionEvent = 91,
    StorageEvent = 92,
    SubmitEvent = 93,
    TextEvent = 94,
    ToggleEvent = 95,
    UIEvent = 96,
    WheelEvent = 97,
    XMLHttpRequestProgressEvent = 98,
};

} // namespace WebCore
