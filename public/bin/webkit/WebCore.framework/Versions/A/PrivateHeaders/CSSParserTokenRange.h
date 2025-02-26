// Copyright 2014 The Chromium Authors. All rights reserved.
// Copyright (C) 2016 Apple Inc. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//    * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//    * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#pragma once

#include "CSSParserToken.h"
#include "CSSTokenizer.h"
#include <wtf/Forward.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

class StyleSheetContents;

// A CSSParserTokenRange is an iterator over a subrange of a vector of CSSParserTokens.
// Accessing outside of the range will return an endless stream of EOF tokens.
// This class refers to half-open intervals [first, last).
class CSSParserTokenRange {
public:
    CSSParserTokenRange() = default;

    template<size_t inlineBuffer>
    CSSParserTokenRange(const Vector<CSSParserToken, inlineBuffer>& vector)
        : m_first(vector.begin())
        , m_last(vector.end())
    {
    }

    // This should be called on a range with tokens returned by that range.
    CSSParserTokenRange makeSubRange(const CSSParserToken* first, const CSSParserToken* last) const;

    bool atEnd() const { return m_first == m_last; }
    const CSSParserToken* end() const { return m_last; }

    size_t size() const { return end() - begin(); }

    const CSSParserToken& peek(unsigned offset = 0) const
    {
        if (m_first + offset >= m_last)
            return eofToken();
        return *(m_first + offset);
    }

    const CSSParserToken& consume()
    {
        if (m_first == m_last)
            return eofToken();
        return *m_first++;
    }

    const CSSParserToken& consumeIncludingWhitespace()
    {
        const CSSParserToken& result = consume();
        consumeWhitespace();
        return result;
    }

    // The returned range doesn't include the brackets
    CSSParserTokenRange consumeBlock();
    CSSParserTokenRange consumeBlockCheckingForEditability(StyleSheetContents*);

    void consumeComponentValue();

    void consumeWhitespace()
    {
        while (CSSTokenizer::isWhitespace(peek().type()))
            ++m_first;
    }

    void trimTrailingWhitespace();
    const CSSParserToken& consumeLast();

    CSSParserTokenRange consumeAll() { return { std::exchange(m_first, m_last), m_last }; }

    String serialize(CSSParserToken::SerializationMode = CSSParserToken::SerializationMode::Normal) const;

    const CSSParserToken* begin() const { return m_first; }
    std::span<const CSSParserToken> span() const { return std::span { begin(), size() }; }

    static CSSParserToken& eofToken();

private:
    CSSParserTokenRange(const CSSParserToken* first, const CSSParserToken* last)
        : m_first(first)
        , m_last(last)
    { }

    const CSSParserToken* m_first { nullptr };
    const CSSParserToken* m_last { nullptr };
};

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
