/*
 * Copyright (C) 2012-2021 Apple Inc. All rights reserved.
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

#include "CSSPropertyNames.h"
#include "CaptionPreferencesDelegate.h"
#include "CaptionUserPreferences.h"
#include "Color.h"
#include <wtf/TZoneMalloc.h>

#if PLATFORM(COCOA)
OBJC_CLASS WebCaptionUserPreferencesMediaAFWeakObserver;
#endif

namespace WebCore {

class CaptionUserPreferencesMediaAF : public CaptionUserPreferences {
    WTF_MAKE_TZONE_ALLOCATED(CaptionUserPreferencesMediaAF);
public:
    static Ref<CaptionUserPreferencesMediaAF> create(PageGroup&);
    virtual ~CaptionUserPreferencesMediaAF();

#if HAVE(MEDIA_ACCESSIBILITY_FRAMEWORK)
    CaptionDisplayMode captionDisplayMode() const override;
    void setCaptionDisplayMode(CaptionDisplayMode) override;

    WEBCORE_EXPORT static CaptionDisplayMode platformCaptionDisplayMode();
    WEBCORE_EXPORT static void platformSetCaptionDisplayMode(CaptionDisplayMode);
    WEBCORE_EXPORT static void setCachedCaptionDisplayMode(CaptionDisplayMode);

    bool userPrefersCaptions() const override;
    bool userPrefersSubtitles() const override;
    bool userPrefersTextDescriptions() const final;

    float captionFontSizeScaleAndImportance(bool&) const override;
    bool captionStrokeWidthForFont(float fontSize, const String& language, float& strokeWidth, bool& important) const override;

    void setInterestedInCaptionPreferenceChanges() override;

    void setPreferredLanguage(const String&) override;
    Vector<String> preferredLanguages() const override;

    WEBCORE_EXPORT static Vector<String> platformPreferredLanguages();
    WEBCORE_EXPORT static void platformSetPreferredLanguage(const String&);
    WEBCORE_EXPORT static void setCachedPreferredLanguages(const Vector<String>&);

    void setPreferredAudioCharacteristic(const String&) override;
    Vector<String> preferredAudioCharacteristics() const override;

    void captionPreferencesChanged() override;

    bool shouldFilterTrackMenu() const { return true; }
    
    WEBCORE_EXPORT static void setCaptionPreferencesDelegate(std::unique_ptr<CaptionPreferencesDelegate>&&);
#else
    bool shouldFilterTrackMenu() const { return false; }
#endif

#if HAVE(MEDIA_ACCESSIBILITY_FRAMEWORK) && PLATFORM(COCOA)
    static RefPtr<CaptionUserPreferencesMediaAF> extractCaptionUserPreferencesMediaAF(void* observer);
#endif

    String captionsStyleSheetOverride() const override;
    Vector<RefPtr<AudioTrack>> sortedTrackListForMenu(AudioTrackList*) override;
    Vector<RefPtr<TextTrack>> sortedTrackListForMenu(TextTrackList*, HashSet<TextTrack::Kind>) override;
    String displayNameForTrack(AudioTrack*) const override;
    String displayNameForTrack(TextTrack*) const override;

private:
    CaptionUserPreferencesMediaAF(PageGroup&);

#if HAVE(MEDIA_ACCESSIBILITY_FRAMEWORK)
    void updateTimerFired();

    String captionsWindowCSS() const;
    String captionsBackgroundCSS() const;
    String captionsTextColorCSS() const;
    Color captionsTextColor(bool&) const;
    String captionsDefaultFontCSS() const;
    String windowRoundedCornerRadiusCSS() const;
    String captionsTextEdgeCSS() const;
    String colorPropertyCSS(CSSPropertyID, const Color&, bool) const;
#endif

#if HAVE(MEDIA_ACCESSIBILITY_FRAMEWORK) && PLATFORM(COCOA)
    static RetainPtr<WebCaptionUserPreferencesMediaAFWeakObserver> createWeakObserver(CaptionUserPreferencesMediaAF*);

    RetainPtr<WebCaptionUserPreferencesMediaAFWeakObserver> m_observer;
#endif

#if HAVE(MEDIA_ACCESSIBILITY_FRAMEWORK)
    Timer m_updateStyleSheetTimer;
    bool m_listeningForPreferenceChanges { false };
    bool m_registeringForNotification { false };
#endif
};

} // namespace WebCore

#endif // ENABLE(VIDEO)
