/*
 * Copyright (c) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2018-2020 Apple Inc. All rights reserved.
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

#include "CharacterRange.h"
#include "TextCheckingRequestIdentifier.h"
#include <wtf/ObjectIdentifier.h>
#include <wtf/OptionSet.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

enum class TextCheckingType : uint8_t {
    None                    = 0,
    Spelling                = 1 << 0,
    Grammar                 = 1 << 1,
    Link                    = 1 << 2,
    Quote                   = 1 << 3,
    Dash                    = 1 << 4,
    Replacement             = 1 << 5,
    Correction              = 1 << 6,
    ShowCorrectionPanel     = 1 << 7,
};

#if PLATFORM(MAC)
typedef uint64_t NSTextCheckingTypes;
WEBCORE_EXPORT NSTextCheckingTypes nsTextCheckingTypes(OptionSet<TextCheckingType>);
#endif

enum class TextCheckingProcessType : bool {
    TextCheckingProcessBatch,
    TextCheckingProcessIncremental
};

struct GrammarDetail {
    CharacterRange range;
    Vector<String> guesses;
    String userDescription;
};

struct TextCheckingResult {
    OptionSet<TextCheckingType> type;
    CharacterRange range;
    Vector<GrammarDetail> details;
    String replacement;
};

struct TextCheckingGuesses {
    Vector<String> guesses;
    bool misspelled { false };
    bool ungrammatical { false };
};


class TextCheckingRequestData {
    friend class SpellCheckRequest; // For access to m_identifier.
public:
    TextCheckingRequestData() = default;
    TextCheckingRequestData(std::optional<TextCheckingRequestIdentifier> identifier, const String& text, OptionSet<TextCheckingType> checkingTypes, TextCheckingProcessType processType)
        : m_text { text }
        , m_identifier { identifier }
        , m_processType { processType }
        , m_checkingTypes { checkingTypes }
    {
    }

    std::optional<TextCheckingRequestIdentifier> identifier() const { return m_identifier; }
    const String& text() const { return m_text; }
    OptionSet<TextCheckingType> checkingTypes() const { return m_checkingTypes; }
    TextCheckingProcessType processType() const { return m_processType; }

private:
    String m_text;
    std::optional<TextCheckingRequestIdentifier> m_identifier;
    TextCheckingProcessType m_processType { TextCheckingProcessType::TextCheckingProcessIncremental };
    OptionSet<TextCheckingType> m_checkingTypes;
};

class TextCheckingRequest : public RefCounted<TextCheckingRequest> {
public:
    virtual ~TextCheckingRequest() = default;

    virtual const TextCheckingRequestData& data() const = 0;
    virtual void didSucceed(const Vector<TextCheckingResult>&) = 0;
    virtual void didCancel() = 0;
};

} // namespace WebCore
