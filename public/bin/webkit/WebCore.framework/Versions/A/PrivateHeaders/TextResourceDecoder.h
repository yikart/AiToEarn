/*
    Copyright (C) 1999 Lars Knoll (knoll@mpi-hd.mpg.de)
    Copyright (C) 2006 Alexey Proskuryakov (ap@nypop.com)
    Copyright (C) 2006-2017 Apple Inc. All rights reserved.

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.
*/

#pragma once

#include <pal/text/TextEncoding.h>
#include <wtf/RefCounted.h>

namespace PAL {
class TextCodec;
}

namespace WebCore {

class HTMLMetaCharsetParser;

class TextResourceDecoder : public RefCounted<TextResourceDecoder> {
public:
    enum EncodingSource {
        DefaultEncoding,
        AutoDetectedEncoding,
        EncodingFromXMLHeader,
        EncodingFromMetaTag,
        EncodingFromCSSCharset,
        EncodingFromHTTPHeader,
        UserChosenEncoding,
        EncodingFromParentFrame
    };

    WEBCORE_EXPORT static Ref<TextResourceDecoder> create(const String& mimeType, const PAL::TextEncoding& defaultEncoding = { }, bool usesEncodingDetector = false);
    WEBCORE_EXPORT ~TextResourceDecoder();

    static String textFromUTF8(std::span<const uint8_t>);

    void setEncoding(const PAL::TextEncoding&, EncodingSource);
    const PAL::TextEncoding& encoding() const { return m_encoding; }
    const PAL::TextEncoding* encodingForURLParsing();

    bool hasEqualEncodingForCharset(const String& charset) const;

    WEBCORE_EXPORT String decode(std::span<const uint8_t>);
    WEBCORE_EXPORT String flush();
    WEBCORE_EXPORT String decodeAndFlush(std::span<const uint8_t>);

    void setHintEncoding(const TextResourceDecoder* parentFrameDecoder);
   
    void useLenientXMLDecoding() { m_useLenientXMLDecoding = true; }
    bool sawError() const { return m_sawError; }

    void setAlwaysUseUTF8() { ASSERT(!strcmp(m_encoding.name(), "UTF-8")); m_alwaysUseUTF8 = true; }

private:
    TextResourceDecoder(const String& mimeType, const PAL::TextEncoding& defaultEncoding, bool usesEncodingDetector);

    enum ContentType { PlainText, HTML, XML, CSS }; // PlainText only checks for BOM.
    static ContentType determineContentType(const String& mimeType);
    static const PAL::TextEncoding& defaultEncoding(ContentType, const PAL::TextEncoding& defaultEncoding);

    size_t checkForBOM(std::span<const uint8_t>);
    bool checkForCSSCharset(std::span<const uint8_t>, bool& movedDataToBuffer);
    bool checkForHeadCharset(std::span<const uint8_t>, bool& movedDataToBuffer);
    bool checkForMetaCharset(std::span<const uint8_t>);
    void detectJapaneseEncoding(std::span<const uint8_t>);
    bool shouldAutoDetect() const;

    ContentType m_contentType;
    PAL::TextEncoding m_encoding;
    std::unique_ptr<PAL::TextCodec> m_codec;
    std::unique_ptr<HTMLMetaCharsetParser> m_charsetParser;
    EncodingSource m_source { DefaultEncoding };
    ASCIILiteral m_parentFrameAutoDetectedEncoding;
    Vector<uint8_t> m_buffer;
    bool m_checkedForBOM { false };
    bool m_checkedForCSSCharset { false };
    bool m_checkedForHeadCharset { false };
    bool m_useLenientXMLDecoding { false }; // Don't stop on XML decoding errors.
    bool m_sawError { false };
    bool m_usesEncodingDetector { false };
    bool m_alwaysUseUTF8 { false };
};

inline void TextResourceDecoder::setHintEncoding(const TextResourceDecoder* parentFrameDecoder)
{
    if (parentFrameDecoder && parentFrameDecoder->m_source == AutoDetectedEncoding)
        m_parentFrameAutoDetectedEncoding = parentFrameDecoder->encoding().name();
}

} // namespace WebCore
