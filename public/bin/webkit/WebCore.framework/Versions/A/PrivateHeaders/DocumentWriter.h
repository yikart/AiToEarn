/*
 * Copyright (C) 2010. Adam Barth. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Adam Barth. ("Adam Barth") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "NavigationAction.h"
#include "ScriptExecutionContextIdentifier.h"
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class Document;
class DocumentParser;
class LocalFrame;
class SharedBuffer;
class TextResourceDecoder;

class DocumentWriter {
    WTF_MAKE_NONCOPYABLE(DocumentWriter);
public:
    DocumentWriter() = default;

    void replaceDocumentWithResultOfExecutingJavascriptURL(const String&, Document* ownerDocument);

    bool begin();
    bool begin(const URL&, bool dispatchWindowObjectAvailable = true, Document* ownerDocument = nullptr, std::optional<ScriptExecutionContextIdentifier> = std::nullopt, const NavigationAction* triggeringAction = nullptr);
    void addData(const SharedBuffer&);
    void insertDataSynchronously(const String&); // For an internal use only to prevent the parser from yielding.
    WEBCORE_EXPORT void end();

    void setFrame(LocalFrame&);

    enum class IsEncodingUserChosen : bool { No, Yes };
    WEBCORE_EXPORT void setEncoding(const String& encoding, IsEncodingUserChosen);

    const String& mimeType() const { return m_mimeType; }
    void setMIMEType(const String& type) { m_mimeType = type; }

    // Exposed for DocumentParser::appendBytes.
    TextResourceDecoder& decoder();
    void reportDataReceived();

    void setDocumentWasLoadedAsPartOfNavigation();

private:
    Ref<Document> createDocument(const URL&, std::optional<ScriptExecutionContextIdentifier>);
    void clear();
    RefPtr<DocumentParser> protectedParser() const;

    WeakPtr<LocalFrame> m_frame;

    String m_mimeType;

    String m_encoding;
    RefPtr<TextResourceDecoder> m_decoder;
    RefPtr<DocumentParser> m_parser;

    enum class State : uint8_t { NotStarted, Started, Finished };
    State m_state { State::NotStarted };

    bool m_hasReceivedSomeData { false };
    bool m_encodingWasChosenByUser { false };
};

} // namespace WebCore
