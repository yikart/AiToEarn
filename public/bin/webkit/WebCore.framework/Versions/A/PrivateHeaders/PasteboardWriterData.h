/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include <wtf/URL.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class SharedBuffer;

class PasteboardWriterData final {
public:
    WEBCORE_EXPORT PasteboardWriterData();
    WEBCORE_EXPORT ~PasteboardWriterData();

    WEBCORE_EXPORT bool isEmpty() const;

    struct PlainText {
        bool canSmartCopyOrDelete;
        String text;
    };

    struct WebContent {
        WebContent();
        WEBCORE_EXPORT ~WebContent();

#if PLATFORM(COCOA)
        String contentOrigin;
        bool canSmartCopyOrDelete;
        RefPtr<SharedBuffer> dataInWebArchiveFormat;
        RefPtr<SharedBuffer> dataInRTFDFormat;
        RefPtr<SharedBuffer> dataInRTFFormat;
        RefPtr<SharedBuffer> dataInAttributedStringFormat;
        String dataInHTMLFormat;
        String dataInStringFormat;
        Vector<std::pair<String, RefPtr<WebCore::SharedBuffer>>> clientTypesAndData;
#endif
    };

    const std::optional<PlainText>& plainText() const { return m_plainText; }
    void setPlainText(PlainText);

    struct URLData {
        URL url;
        String title;
#if PLATFORM(MAC)
        String userVisibleForm;
#elif PLATFORM(GTK)
        String markup;
#endif
    };

    const std::optional<URLData>& urlData() const { return m_url; }
    void setURLData(URLData);

    const std::optional<WebContent>& webContent() const { return m_webContent; }
    void setWebContent(WebContent);

private:
    std::optional<PlainText> m_plainText;
    std::optional<URLData> m_url;
    std::optional<WebContent> m_webContent;
};

}
