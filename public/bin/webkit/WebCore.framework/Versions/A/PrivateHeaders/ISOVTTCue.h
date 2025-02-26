/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#include "ISOBox.h"
#include <wtf/MediaTime.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

// 4 bytes : 4CC : identifier = 'vttc'
// 4 bytes : unsigned : length
// N bytes : CueSourceIDBox : box : optional
// N bytes : CueIDBox : box : optional
// N bytes : CueTimeBox : box : optional
// N bytes : CueSettingsBox : box : optional
// N bytes : CuePayloadBox : box : required

class ISOWebVTTCue final : public ISOBox {
public:
    ISOWebVTTCue(const MediaTime& presentationTime, const MediaTime& duration);
    WEBCORE_EXPORT ISOWebVTTCue(MediaTime&& presentationTime, MediaTime&& duration, AtomString&& cueID, String&& cueText, String&& settings = { }, String&& sourceID = { }, String&& originalStartTime = { });
    ISOWebVTTCue(const ISOWebVTTCue&) = default;
    WEBCORE_EXPORT ISOWebVTTCue();
    WEBCORE_EXPORT ISOWebVTTCue(ISOWebVTTCue&&);
    WEBCORE_EXPORT ~ISOWebVTTCue();

    ISOWebVTTCue& operator=(const ISOWebVTTCue&) = default;
    ISOWebVTTCue& operator=(ISOWebVTTCue&&) = default;

    static FourCC boxTypeName() { return "vttc"; }

    const MediaTime& presentationTime() const { return m_presentationTime; }
    const MediaTime& duration() const { return m_duration; }

    const String& sourceID() const { return m_sourceID; }
    const AtomString& id() const { return m_identifier; }
    const String& originalStartTime() const { return m_originalStartTime; }
    const String& settings() const { return m_settings; }
    const String& cueText() const { return m_cueText; }

    String toJSONString() const;

    WEBCORE_EXPORT bool parse(JSC::DataView&, unsigned& offset) override;

private:
    MediaTime m_presentationTime;
    MediaTime m_duration;

    String m_sourceID;
    AtomString m_identifier;
    String m_originalStartTime;
    String m_settings;
    String m_cueText;
};

} // namespace WebCore

namespace WTF {

template<typename Type>
struct LogArgument;

template <>
struct LogArgument<WebCore::ISOWebVTTCue> {
    static String toString(const WebCore::ISOWebVTTCue& cue)
    {
        return cue.toJSONString();
    }
};

} // namespace WTF
