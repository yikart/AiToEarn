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

#include "AudioTrack.h"
#include "TextTrack.h"
#include "Timer.h"
#include <wtf/EnumTraits.h>
#include <wtf/HashSet.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class CaptionUserPreferencesTestingModeToken;
class HTMLMediaElement;
class Page;
class PageGroup;
class AudioTrackList;
class TextTrackList;
struct MediaSelectionOption;

enum class CaptionUserPreferencesDisplayMode : uint8_t {
    Automatic,
    ForcedOnly,
    AlwaysOn,
    Manual,
};

class CaptionUserPreferences : public RefCountedAndCanMakeWeakPtr<CaptionUserPreferences> {
    WTF_MAKE_TZONE_ALLOCATED(CaptionUserPreferences);
public:
    static Ref<CaptionUserPreferences> create(PageGroup&);
    virtual ~CaptionUserPreferences();

    using CaptionDisplayMode = CaptionUserPreferencesDisplayMode;
    virtual CaptionDisplayMode captionDisplayMode() const;
    virtual void setCaptionDisplayMode(CaptionDisplayMode);

    virtual int textTrackSelectionScore(TextTrack*, HTMLMediaElement*) const;
    virtual int textTrackLanguageSelectionScore(TextTrack*, const Vector<String>&) const;

    virtual bool userPrefersCaptions() const;
    virtual void setUserPrefersCaptions(bool);

    virtual bool userPrefersSubtitles() const;
    virtual void setUserPrefersSubtitles(bool preference);
    
    virtual bool userPrefersTextDescriptions() const;
    virtual void setUserPrefersTextDescriptions(bool preference);

    virtual float captionFontSizeScaleAndImportance(bool& important) const { important = false; return 0.05f; }

    virtual bool captionStrokeWidthForFont(float, const String&, float&, bool&) const { return false; }

    virtual String captionsStyleSheetOverride() const { return m_captionsStyleSheetOverride; }
    virtual void setCaptionsStyleSheetOverride(const String&);

    virtual void setInterestedInCaptionPreferenceChanges() { }

    virtual void captionPreferencesChanged();

    virtual void setPreferredLanguage(const String&);
    virtual Vector<String> preferredLanguages() const;

    virtual void setPreferredAudioCharacteristic(const String&);
    virtual Vector<String> preferredAudioCharacteristics() const;

    virtual String displayNameForTrack(TextTrack*) const;
    MediaSelectionOption mediaSelectionOptionForTrack(TextTrack*) const;
    virtual Vector<RefPtr<TextTrack>> sortedTrackListForMenu(TextTrackList*, HashSet<TextTrack::Kind>);

    virtual String displayNameForTrack(AudioTrack*) const;
    MediaSelectionOption mediaSelectionOptionForTrack(AudioTrack*) const;
    virtual Vector<RefPtr<AudioTrack>> sortedTrackListForMenu(AudioTrackList*);

    void setPrimaryAudioTrackLanguageOverride(const String& language) { m_primaryAudioTrackLanguageOverride = language;  }
    String primaryAudioTrackLanguageOverride() const;

    virtual bool testingMode() const { return m_testingModeCount; }

    friend class CaptionUserPreferencesTestingModeToken;
    WEBCORE_EXPORT UniqueRef<CaptionUserPreferencesTestingModeToken> createTestingModeToken();
    
    PageGroup& pageGroup() const;

protected:
    explicit CaptionUserPreferences(PageGroup&);

    void updateCaptionStyleSheetOverride();
    void beginBlockingNotifications();
    void endBlockingNotifications();

private:
    void incrementTestingModeCount() { ++m_testingModeCount; }
    void decrementTestingModeCount()
    {
        ASSERT(m_testingModeCount);
        if (m_testingModeCount)
            --m_testingModeCount;
    }

    void timerFired();
    void notify();
    Page* currentPage() const;

    WeakRef<PageGroup> m_pageGroup;
    mutable CaptionDisplayMode m_displayMode;
    Timer m_timer;
    String m_userPreferredLanguage;
    String m_userPreferredAudioCharacteristic;
    String m_captionsStyleSheetOverride;
    String m_primaryAudioTrackLanguageOverride;
    unsigned m_blockNotificationsCounter { 0 };
    bool m_havePreferences { false };
    unsigned m_testingModeCount { 0 };
};

class CaptionUserPreferencesTestingModeToken {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(CaptionUserPreferencesTestingModeToken, WEBCORE_EXPORT);
public:
    CaptionUserPreferencesTestingModeToken(CaptionUserPreferences& parent)
        : m_parent(parent)
    {
        parent.incrementTestingModeCount();
    }
    ~CaptionUserPreferencesTestingModeToken()
    {
        if (m_parent)
            m_parent->decrementTestingModeCount();
    }
private:
    WeakPtr<CaptionUserPreferences> m_parent;
};
    
}

namespace WTF {

template<> struct EnumTraits<WebCore::CaptionUserPreferences::CaptionDisplayMode> {
    static std::optional<WebCore::CaptionUserPreferences::CaptionDisplayMode> fromString(const String& mode)
    {
        if (equalLettersIgnoringASCIICase(mode, "forcedonly"_s))
            return WebCore::CaptionUserPreferences::CaptionDisplayMode::ForcedOnly;
        if (equalLettersIgnoringASCIICase(mode, "manual"_s))
            return WebCore::CaptionUserPreferences::CaptionDisplayMode::Manual;
        if (equalLettersIgnoringASCIICase(mode, "automatic"_s))
            return WebCore::CaptionUserPreferences::CaptionDisplayMode::Automatic;
        if (equalLettersIgnoringASCIICase(mode, "alwayson"_s))
            return WebCore::CaptionUserPreferences::CaptionDisplayMode::AlwaysOn;
        return std::nullopt;
    }
};

} // namespace WTF

#endif
