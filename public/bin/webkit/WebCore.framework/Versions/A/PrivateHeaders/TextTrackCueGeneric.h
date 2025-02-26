/*
 * Copyright (C) 2013, 2014 Apple Inc. All rights reserved.
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

#include "Color.h"
#include "VTTCue.h"

namespace WebCore {

// A "generic" cue is a non-WebVTT cue, so it is not positioned/sized with the WebVTT logic.
class TextTrackCueGeneric final : public VTTCue {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(TextTrackCueGeneric, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT static Ref<TextTrackCueGeneric> create(ScriptExecutionContext&, const MediaTime& start, const MediaTime& end, const String& content);

    ExceptionOr<void> setPosition(const LineAndPositionSetting&) final;

    bool useDefaultPosition() const { return m_useDefaultPosition; }

    double baseFontSizeRelativeToVideoHeight() const { return m_baseFontSizeRelativeToVideoHeight; }
    void setBaseFontSizeRelativeToVideoHeight(double);

    double fontSizeMultiplier() const { return m_fontSizeMultiplier; }
    void setFontSizeMultiplier(double);

    const String& fontName() const { return m_fontName; }
    void setFontName(const String& name) { m_fontName = name; }

    const Color& foregroundColor() const { return m_foregroundColor; }
    void setForegroundColor(const Color& color) { m_foregroundColor = color; }
    
    const Color& backgroundColor() const { return m_backgroundColor; }
    void setBackgroundColor(const Color& color) { m_backgroundColor = color; }
    
    const Color& highlightColor() const { return m_highlightColor; }
    void setHighlightColor(const Color& color) { m_highlightColor = color; }

private:
    TextTrackCueGeneric(Document&, const MediaTime& start, const MediaTime& end, const String&);

    bool isOrderedBefore(const TextTrackCue*) const final;
    bool isPositionedAbove(const TextTrackCue*) const final;

    RefPtr<VTTCueBox> createDisplayTree() final;

    bool cueContentsMatch(const TextTrackCue&) const final;

    CueType cueType() const final { return ConvertedToWebVTT; }

    void toJSON(JSON::Object&) const final;

    Color m_foregroundColor;
    Color m_backgroundColor;
    Color m_highlightColor;
    double m_baseFontSizeRelativeToVideoHeight { 0 };
    double m_fontSizeMultiplier { 0 };
    String m_fontName;
    bool m_useDefaultPosition { true };
};

} // namespace WebCore

namespace WTF {

template<> struct LogArgument<WebCore::TextTrackCueGeneric> : LogArgument<WebCore::TextTrackCue> { };

}

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::TextTrackCueGeneric)
static bool isType(const WebCore::TextTrackCue& cue) { return cue.cueType() == WebCore::TextTrackCue::ConvertedToWebVTT; }
SPECIALIZE_TYPE_TRAITS_END()

#endif
