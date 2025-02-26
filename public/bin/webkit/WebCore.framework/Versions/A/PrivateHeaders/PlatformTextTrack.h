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

#if ENABLE(VIDEO)

#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class TextTrack;
class InbandTextTrackPrivate;

struct PlatformTextTrackData {
    enum class TrackKind : uint8_t {
        Subtitle = 0,
        Caption = 1,
        Description = 2,
        Chapter = 3,
        MetaData = 4,
        Forced = 5,
    };
    enum class TrackType : uint8_t {
        InBand = 0,
        OutOfBand = 1,
        Script = 2
    };
    enum class TrackMode : uint8_t {
        Disabled,
        Hidden,
        Showing
    };

    PlatformTextTrackData() = default;
    PlatformTextTrackData(const String& label, const String& language, const String& url, TrackMode mode, TrackKind kind, TrackType type, int uniqueId, bool isDefault)
        : m_label(label)
        , m_language(language)
        , m_url(url)
        , m_mode(mode)
        , m_kind(kind)
        , m_type(type)
        , m_uniqueId(uniqueId)
        , m_isDefault(isDefault)
    {
    }

    String m_label;
    String m_language;
    String m_url;
    TrackMode m_mode;
    TrackKind m_kind;
    TrackType m_type;
    int m_uniqueId;
    bool m_isDefault;
};

class PlatformTextTrackClient {
public:
    virtual ~PlatformTextTrackClient() = default;
    
    virtual TextTrack* publicTrack() = 0;
    virtual InbandTextTrackPrivate* privateTrack() { return 0; }
};

class PlatformTextTrack : public RefCounted<PlatformTextTrack> {
public:
    static Ref<PlatformTextTrack> create(PlatformTextTrackClient* client, const String& label, const String& language, PlatformTextTrackData::TrackMode mode, PlatformTextTrackData::TrackKind kind, PlatformTextTrackData::TrackType type, int uniqueId)
    {
        return adoptRef(*new PlatformTextTrack(client, label, language, String(), mode, kind, type, uniqueId, false));
    }

    static Ref<PlatformTextTrack> createOutOfBand(const String& label, const String& language, const String& url, PlatformTextTrackData::TrackMode mode, PlatformTextTrackData::TrackKind kind, int uniqueId, bool isDefault)
    {
        return adoptRef(*new PlatformTextTrack(nullptr, label, language, url, mode, kind, PlatformTextTrackData::TrackType::OutOfBand, uniqueId, isDefault));
    }
    
    static Ref<PlatformTextTrack> create(PlatformTextTrackData&& data)
    {
        return adoptRef(*new PlatformTextTrack(WTFMove(data)));
    }

    virtual ~PlatformTextTrack() = default;
    
    PlatformTextTrackData::TrackType type() const { return m_trackData.m_type; }
    PlatformTextTrackData::TrackKind kind() const { return m_trackData.m_kind; }
    PlatformTextTrackData::TrackMode mode() const { return m_trackData.m_mode; }
    const String& label() const { return m_trackData.m_label; }
    const String& language() const { return m_trackData.m_language; }
    const String& url() const { return m_trackData.m_url; }
    int uniqueId() const { return m_trackData.m_uniqueId; }
    bool isDefault() const { return m_trackData.m_isDefault; }
    PlatformTextTrackClient* client() const { return m_client; }
    
    PlatformTextTrackData data() const { return m_trackData; }

protected:
    PlatformTextTrack(PlatformTextTrackClient* client, const String& label, const String& language, const String& url, PlatformTextTrackData::TrackMode mode, PlatformTextTrackData::TrackKind kind, PlatformTextTrackData::TrackType type, int uniqueId, bool isDefault)
        : m_client(client)
    {
        m_trackData = {
            label,
            language,
            url,
            mode,
            kind,
            type,
            uniqueId,
            isDefault,
        };
    }
    
    PlatformTextTrack(PlatformTextTrackData&& data)
        : m_trackData(WTFMove(data))
    {
    }

    PlatformTextTrackData m_trackData;
    PlatformTextTrackClient* m_client;
};

} // namespace WebCore

#endif // ENABLE(VIDEO)
