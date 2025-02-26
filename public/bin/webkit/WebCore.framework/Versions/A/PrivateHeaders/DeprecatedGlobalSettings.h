/*
 * Copyright (C) 2003-2022 Apple Inc. All rights reserved.
 *           (C) 2006 Graham Dennis (graham.dennis@gmail.com)
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

#include <wtf/Forward.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class DeprecatedGlobalSettings {
public:
#if USE(AVFOUNDATION)
    WEBCORE_EXPORT static void setAVFoundationEnabled(bool);
    static bool isAVFoundationEnabled() { return shared().m_AVFoundationEnabled; }
#endif

#if USE(GSTREAMER)
    WEBCORE_EXPORT static void setGStreamerEnabled(bool);
    static bool isGStreamerEnabled() { return shared().m_GStreamerEnabled; }
#endif

    WEBCORE_EXPORT static void setMockScrollbarsEnabled(bool);
    static bool mockScrollbarsEnabled() { return shared().m_mockScrollbarsEnabled; }

    WEBCORE_EXPORT static void setUsesOverlayScrollbars(bool);
    static bool usesOverlayScrollbars() { return shared().m_usesOverlayScrollbars; }

    static bool lowPowerVideoAudioBufferSizeEnabled() { return shared().m_lowPowerVideoAudioBufferSizeEnabled; }
    static void setLowPowerVideoAudioBufferSizeEnabled(bool flag) { shared().m_lowPowerVideoAudioBufferSizeEnabled = flag; }

    static bool trackingPreventionEnabled() { return shared().m_trackingPreventionEnabled; }
    WEBCORE_EXPORT static void setTrackingPreventionEnabled(bool);

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT static void setAudioSessionCategoryOverride(unsigned);
    static unsigned audioSessionCategoryOverride();

    WEBCORE_EXPORT static void setNetworkDataUsageTrackingEnabled(bool);
    static bool networkDataUsageTrackingEnabled() { return shared().m_networkDataUsageTrackingEnabled; }

    WEBCORE_EXPORT static void setNetworkInterfaceName(const String&);
    static const String& networkInterfaceName() { return shared().m_networkInterfaceName; }

    static void setDisableScreenSizeOverride(bool flag) { shared().m_disableScreenSizeOverride = flag; }
    static bool disableScreenSizeOverride() { return shared().m_disableScreenSizeOverride; }

    static void setShouldOptOutOfNetworkStateObservation(bool flag) { shared().m_shouldOptOutOfNetworkStateObservation = flag; }
    static bool shouldOptOutOfNetworkStateObservation() { return shared().m_shouldOptOutOfNetworkStateObservation; }
#endif

#if USE(AUDIO_SESSION)
    WEBCORE_EXPORT static void setShouldManageAudioSessionCategory(bool);
    WEBCORE_EXPORT static bool shouldManageAudioSessionCategory();
#endif

    WEBCORE_EXPORT static void setAllowsAnySSLCertificate(bool);
    WEBCORE_EXPORT static bool allowsAnySSLCertificate();

    static void setCustomPasteboardDataEnabled(bool isEnabled) { shared().m_isCustomPasteboardDataEnabled = isEnabled; }
    static bool customPasteboardDataEnabled() { return shared().m_isCustomPasteboardDataEnabled; }

    static void setRestrictedHTTPResponseAccess(bool isEnabled) { shared().m_isRestrictedHTTPResponseAccess = isEnabled; }
    static bool restrictedHTTPResponseAccess() { return shared().m_isRestrictedHTTPResponseAccess; }

    static void setAttrStyleEnabled(bool isEnabled) { shared().m_attrStyleEnabled = isEnabled; }
    static bool attrStyleEnabled() { return shared().m_attrStyleEnabled; }

    static void setWebSQLEnabled(bool isEnabled) { shared().m_webSQLEnabled = isEnabled; }
    static bool webSQLEnabled() { return shared().m_webSQLEnabled; }

#if ENABLE(ATTACHMENT_ELEMENT)
    static void setAttachmentElementEnabled(bool areEnabled) { shared().m_isAttachmentElementEnabled = areEnabled; }
    static bool attachmentElementEnabled() { return shared().m_isAttachmentElementEnabled; }
#endif

    static bool webRTCAudioLatencyAdaptationEnabled() { return shared().m_isWebRTCAudioLatencyAdaptationEnabled; }
    static void setWebRTCAudioLatencyAdaptationEnabled(bool isEnabled) { shared().m_isWebRTCAudioLatencyAdaptationEnabled = isEnabled; }

    static void setReadableByteStreamAPIEnabled(bool isEnabled) { shared().m_isReadableByteStreamAPIEnabled = isEnabled; }
    static bool readableByteStreamAPIEnabled() { return shared().m_isReadableByteStreamAPIEnabled; }

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    static void setIsAccessibilityIsolatedTreeEnabled(bool isEnabled) { shared().m_accessibilityIsolatedTree = isEnabled; }
    static bool isAccessibilityIsolatedTreeEnabled() { return shared().m_accessibilityIsolatedTree; }
#endif

#if ENABLE(AX_THREAD_TEXT_APIS)
    static void setAccessibilityThreadTextApisEnabled(bool isEnabled) { shared().m_accessibilityThreadTextApis = isEnabled; }
    static bool accessibilityThreadTextApisEnabled() { return shared().m_accessibilityThreadTextApis; }
#endif

    static void setArePDFImagesEnabled(bool isEnabled) { shared().m_arePDFImagesEnabled = isEnabled; }
    static bool arePDFImagesEnabled() { return shared().m_arePDFImagesEnabled; }

#if ENABLE(MEDIA_SOURCE)
    static void setWebMParserEnabled(bool isEnabled) { shared().m_webMParserEnabled = isEnabled; }
    static bool webMParserEnabled() { return shared().m_webMParserEnabled; }
#endif

#if ENABLE(VORBIS)
    WEBCORE_EXPORT static void setVorbisDecoderEnabled(bool);
    static bool vorbisDecoderEnabled() { return shared().m_vorbisDecoderEnabled; }
#endif

#if ENABLE(OPUS)
    WEBCORE_EXPORT static void setOpusDecoderEnabled(bool);
    static bool opusDecoderEnabled() { return shared().m_opusDecoderEnabled; }
#endif

#if ENABLE(WEB_PUSH_NOTIFICATIONS)
    static void setBuiltInNotificationsEnabled(bool isEnabled) { shared().m_builtInNotificationsEnabled = isEnabled; }
    WEBCORE_EXPORT static bool builtInNotificationsEnabled();
#endif

#if ENABLE(MODEL_ELEMENT)
    static void setModelDocumentEnabled(bool isEnabled) { shared().m_modelDocumentEnabled = isEnabled; }
    static bool modelDocumentEnabled() { return shared().m_modelDocumentEnabled; }
#endif


private:
    WEBCORE_EXPORT static DeprecatedGlobalSettings& shared();
    DeprecatedGlobalSettings() = default;
    ~DeprecatedGlobalSettings() = default;

#if USE(AVFOUNDATION)
    bool m_AVFoundationEnabled { true };
#endif

#if USE(GSTREAMER)
    bool m_GStreamerEnabled { true };
#endif

    bool m_mockScrollbarsEnabled { false };
    bool m_usesOverlayScrollbars { false };

#if PLATFORM(IOS_FAMILY)
    bool m_networkDataUsageTrackingEnabled { false };
    String m_networkInterfaceName;
    bool m_shouldOptOutOfNetworkStateObservation { false };
    bool m_disableScreenSizeOverride { false };
#endif

    bool m_lowPowerVideoAudioBufferSizeEnabled { false };
    bool m_trackingPreventionEnabled { false };
    bool m_allowsAnySSLCertificate { false };

    bool m_isCustomPasteboardDataEnabled { false };
    bool m_isRestrictedHTTPResponseAccess { true };
    bool m_attrStyleEnabled { false };
    bool m_webSQLEnabled { false };

#if ENABLE(ATTACHMENT_ELEMENT)
    bool m_isAttachmentElementEnabled { false };
#endif

    bool m_isWebRTCAudioLatencyAdaptationEnabled { true };

    bool m_isReadableByteStreamAPIEnabled { false };

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    bool m_accessibilityIsolatedTree { false };
#endif

#if ENABLE(AX_THREAD_TEXT_APIS)
    bool m_accessibilityThreadTextApis { false };
#endif

    bool m_arePDFImagesEnabled { true };

#if ENABLE(MEDIA_SOURCE)
    bool m_webMParserEnabled { false };
#endif

#if ENABLE(VORBIS)
    bool m_vorbisDecoderEnabled { false };
#endif

#if ENABLE(OPUS)
    bool m_opusDecoderEnabled { false };
#endif

#if ENABLE(WEB_PUSH_NOTIFICATIONS)
    bool m_builtInNotificationsEnabled { false };
#endif

#if ENABLE(MODEL_ELEMENT)
    bool m_modelDocumentEnabled { false };
#endif

    friend class NeverDestroyed<DeprecatedGlobalSettings>;
};

} // namespace WebCore
