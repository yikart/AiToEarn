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

#include <wtf/text/StringView.h>

namespace WebCore {

constexpr LChar kEndOfFileMarker = 0;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(CSSTokenizerInputStream);
class CSSTokenizerInputStream {
    WTF_MAKE_NONCOPYABLE(CSSTokenizerInputStream);
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(CSSTokenizerInputStream);
public:
    explicit CSSTokenizerInputStream(const String& input);

    // Gets the char in the stream. Will return (NUL) kEndOfFileMarker when at the
    // end of the stream.
    UChar nextInputChar() const
    {
        if (m_offset >= m_stringLength)
            return kEndOfFileMarker;
        return (*m_string)[m_offset];
    }

    // Gets the char at lookaheadOffset from the current stream position. Will
    // return NUL (kEndOfFileMarker) if the stream position is at the end.
    UChar peek(unsigned lookaheadOffset) const
    {
        if ((m_offset + lookaheadOffset) >= m_stringLength)
            return kEndOfFileMarker;
        return (*m_string)[m_offset + lookaheadOffset];
    }

    void advance(unsigned offset = 1) { m_offset += offset; }
    void pushBack(UChar cc)
    {
        --m_offset;
        ASSERT_UNUSED(cc, nextInputChar() == cc);
    }

    double getDouble(unsigned start, unsigned end) const;

    template<bool characterPredicate(UChar)>
    unsigned skipWhilePredicate(unsigned offset)
    {
        if (m_string->is8Bit()) {
            auto characters8 = m_string->span8();
            while ((m_offset + offset) < m_stringLength && characterPredicate(characters8[m_offset + offset]))
                ++offset;
        } else {
            auto characters16 = m_string->span16();
            while ((m_offset + offset) < m_stringLength && characterPredicate(characters16[m_offset + offset]))
                ++offset;
        }
        return offset;
    }

    void advanceUntilNonWhitespace();
    void advanceUntilNewlineOrNonWhitespace();

    unsigned length() const { return m_stringLength; }
    unsigned offset() const { return std::min(m_offset, m_stringLength); }

    StringView rangeAt(unsigned start, unsigned length) const
    {
        ASSERT(start + length <= m_stringLength);
        return StringView(m_string.get()).substring(start, length); // FIXME: Should make a constructor on StringView for this.
    }

private:
    size_t m_offset;
    const size_t m_stringLength;
    RefPtr<StringImpl> m_string;
};

} // namespace WebCore
