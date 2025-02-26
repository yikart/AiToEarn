/*
 * Copyright (C) 2011, 2013 Google Inc.  All rights reserved.
 * Copyright (C) 2013 Cable Television Labs, Inc.
 * Copyright (C) 2014 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(VIDEO)

#include "BufferedLineReader.h"
#include "DocumentFragment.h"
#include "HTMLNames.h"
#include "TextResourceDecoder.h"
#include "VTTRegion.h"
#include <memory>
#include <wtf/MediaTime.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/StringBuilder.h>

namespace WebCore {

using namespace HTMLNames;

class Document;
class ISOWebVTTCue;
class VTTScanner;

class WebVTTParserClient {
public:
    virtual ~WebVTTParserClient() = default;

    virtual void newCuesParsed() = 0;
    virtual void newRegionsParsed() = 0;
    virtual void newStyleSheetsParsed() = 0;
    virtual void fileFailedToParse() = 0;
};

class WebVTTCueData final : public RefCounted<WebVTTCueData> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WebVTTCueData, WEBCORE_EXPORT);
public:

    static Ref<WebVTTCueData> create() { return adoptRef(*new WebVTTCueData()); }
    ~WebVTTCueData() = default;

    MediaTime startTime() const { return m_startTime; }
    void setStartTime(const MediaTime& startTime) { m_startTime = startTime; }

    MediaTime endTime() const { return m_endTime; }
    void setEndTime(const MediaTime& endTime) { m_endTime = endTime; }

    AtomString id() const { return m_id; }
    void setId(const AtomString& id) { m_id = id; }

    String content() const { return m_content; }
    void setContent(const String& content) { m_content = content; }

    String settings() const { return m_settings; }
    void setSettings(const String& settings) { m_settings = settings; }

    MediaTime originalStartTime() const { return m_originalStartTime; }
    void setOriginalStartTime(const MediaTime& time) { m_originalStartTime = time; }

private:
    WebVTTCueData() = default;

    MediaTime m_startTime;
    MediaTime m_endTime;
    MediaTime m_originalStartTime;
    AtomString m_id;
    String m_content;
    String m_settings;
};

class WEBCORE_EXPORT WebVTTParser final {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WebVTTParser, WEBCORE_EXPORT);
public:
    enum ParseState {
        Initial,
        Header,
        Id,
        TimingsAndSettings,
        CueText,
        Region,
        Style,
        BadCue,
        Finished
    };

    WebVTTParser() = delete;
    WebVTTParser(WebVTTParserClient&, Document&);

    static inline bool isRecognizedTag(const AtomString& tagName)
    {
        return tagName == iTag
            || tagName == bTag
            || tagName == uTag
            || tagName == rubyTag
            || tagName == rtTag;
    }

    static bool collectTimeStamp(const String&, MediaTime&);

    // Useful functions for parsing percentage settings.
    static bool parseFloatPercentageValue(VTTScanner& valueScanner, float&);
    static bool parseFloatPercentageValuePair(VTTScanner& valueScanner, char, FloatPoint&);

    // Input data to the parser to parse.
    void parseBytes(std::span<const uint8_t>);
    void parseFileHeader(String&&);
    void parseCueData(const ISOWebVTTCue&);
    void flush();
    void fileFinished();

    // Transfers ownership of last parsed cues to caller.
    Vector<Ref<WebVTTCueData>> takeCues();
    Vector<Ref<VTTRegion>> takeRegions();
    Vector<String> takeStyleSheets();
    
    // Create the DocumentFragment representation of the WebVTT cue text.
    static Ref<DocumentFragment> createDocumentFragmentFromCueText(Document&, const String&);

private:
    void parse();
    void flushPendingCue();
    bool hasRequiredFileIdentifier(const String&);
    ParseState collectCueId(const String&);
    ParseState collectTimingsAndSettings(const String&);
    ParseState collectCueText(const String&);
    ParseState recoverCue(const String&);
    ParseState ignoreBadCue(const String&);
    ParseState collectRegionSettings(const String&);
    ParseState collectWebVTTBlock(const String&);
    ParseState checkAndRecoverCue(const String& line);
    ParseState collectStyleSheet(const String&);
    bool checkAndCreateRegion(StringView line);
    bool checkAndStoreRegion(StringView line);
    bool checkStyleSheet(StringView line);
    bool checkAndStoreStyleSheet(StringView line);

    void createNewCue();
    void resetCueValues();

    static bool collectTimeStamp(VTTScanner& input, MediaTime& timeStamp);

    Document& m_document;
    ParseState m_state { Initial };

    BufferedLineReader m_lineReader;
    RefPtr<TextResourceDecoder> m_decoder;
    AtomString m_currentId;
    MediaTime m_currentStartTime;
    MediaTime m_currentEndTime;
    StringBuilder m_currentContent;
    String m_previousLine;
    String m_currentSettings;
    RefPtr<VTTRegion> m_currentRegion;
    StringBuilder m_currentSourceStyleSheet;
    
    WebVTTParserClient& m_client;

    Vector<Ref<WebVTTCueData>> m_cuelist;
    Vector<Ref<VTTRegion>> m_regionList;
    Vector<String> m_styleSheets;
};

} // namespace WebCore

#endif // ENABLE(VIDEO)
