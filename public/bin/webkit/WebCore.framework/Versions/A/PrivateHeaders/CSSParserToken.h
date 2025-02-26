// Copyright 2014 The Chromium Authors. All rights reserved.
// Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#include "CSSPrimitiveValue.h"
#include <wtf/text/StringView.h>

namespace WebCore {

enum CSSParserTokenType {
    IdentToken = 0,
    FunctionToken,
    AtKeywordToken,
    HashToken,
    UrlToken,
    BadUrlToken,
    DelimiterToken,
    NumberToken,
    PercentageToken,
    DimensionToken,
    IncludeMatchToken,
    DashMatchToken,
    PrefixMatchToken,
    SuffixMatchToken,
    SubstringMatchToken,
    ColumnToken,
    NonNewlineWhitespaceToken,
    NewlineToken,
    CDOToken,
    CDCToken,
    ColonToken,
    SemicolonToken,
    CommaToken,
    LeftParenthesisToken,
    RightParenthesisToken,
    LeftBracketToken,
    RightBracketToken,
    LeftBraceToken,
    RightBraceToken,
    StringToken,
    BadStringToken,
    EOFToken,
    CommentToken,
    LastCSSParserTokenType = CommentToken,
};

constexpr std::underlying_type_t<CSSParserTokenType> numberOfCSSParserTokenTypes = LastCSSParserTokenType + 1;

enum NumericSign {
    NoSign,
    PlusSign,
    MinusSign,
};

enum NumericValueType {
    IntegerValueType,
    NumberValueType,
};

enum HashTokenType {
    HashTokenId,
    HashTokenUnrestricted,
};

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(CSSParserToken);
class CSSParserToken {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(CSSParserToken);
public:
    enum BlockType {
        NotBlock,
        BlockStart,
        BlockEnd,
    };

    CSSParserToken(CSSParserTokenType, BlockType = NotBlock);
    CSSParserToken(CSSParserTokenType, StringView, BlockType = NotBlock);

    explicit CSSParserToken(unsigned nonNewlineWhitespaceCount); // NonNewlineWhitespaceToken
    CSSParserToken(CSSParserTokenType, UChar); // for DelimiterToken
    CSSParserToken(double, NumericValueType, NumericSign, StringView originalText); // for NumberToken

    CSSParserToken(HashTokenType, StringView);

    static CSSUnitType stringToUnitType(StringView);

    bool operator==(const CSSParserToken& other) const;

    // Converts NumberToken to DimensionToken.
    void convertToDimensionWithUnit(StringView);

    // Converts NumberToken to PercentageToken.
    void convertToPercentage();

    CSSParserTokenType type() const { return static_cast<CSSParserTokenType>(m_type); }
    StringView value() const { return { m_valueDataCharRaw, m_valueLength, m_valueIs8Bit }; }

    UChar delimiter() const;
    NumericSign numericSign() const;
    NumericValueType numericValueType() const;
    double numericValue() const;
    StringView originalText() const;
    HashTokenType getHashTokenType() const { ASSERT(m_type == HashToken); return m_hashTokenType; }
    BlockType getBlockType() const { return static_cast<BlockType>(m_blockType); }
    CSSUnitType unitType() const { return static_cast<CSSUnitType>(m_unit); }
    StringView unitString() const;
    CSSValueID id() const;
    CSSValueID functionId() const;

    bool hasStringBacking() const;
    bool tryUseStringLiteralBacking();
    bool isBackedByStringLiteral() const { return m_isBackedByStringLiteral; }

    CSSPropertyID parseAsCSSPropertyID() const;

    enum class SerializationMode : bool {
        Normal,
        // "Specified values of custom properties must be serialized exactly as specified by the author.
        // Simplifications that might occur in other properties, such as dropping comments, normalizing whitespace,
        // reserializing numeric tokens from their value, etc., must not occur."
        // https://drafts.csswg.org/css-variables-2/#serializing-custom-props
        CustomProperty
    };
    void serialize(StringBuilder&, const CSSParserToken* nextToken = nullptr, SerializationMode = SerializationMode::Normal) const;

    template<typename CharacterType>
    void updateCharacters(std::span<const CharacterType> characters);

private:
    void initValueFromStringView(StringView string)
    {
        m_valueLength = string.length();
        m_valueIs8Bit = string.is8Bit();
        m_valueDataCharRaw = string.rawCharacters();
        m_isBackedByStringLiteral = false;
    }
    CSSValueID identOrFunctionId() const;

    unsigned m_type : 6 { 0 }; // CSSParserTokenType
    unsigned m_blockType : 2 { 0 }; // BlockType
    unsigned m_numericValueType : 1 { 0 }; // NumericValueType
    unsigned m_numericSign : 2 { 0 }; // NumericSign
    unsigned m_unit : 7 { 0 }; // CSSUnitType
    unsigned m_nonUnitPrefixLength : 4 { 0 }; // Only for DimensionType, only needs to be long enough for UnicodeRange parsing.

    // m_value... is an unpacked StringView so that we can pack it
    // tightly with the rest of this object for a smaller object size.
    bool m_valueIs8Bit : 1 { false };
    bool m_isBackedByStringLiteral : 1 { false };
    unsigned m_valueLength { 0 };
    const void* m_valueDataCharRaw { nullptr }; // Either LChar* or UChar*.

    union {
        UChar m_delimiter;
        HashTokenType m_hashTokenType;
        double m_numericValue;
        mutable int m_id;
        unsigned m_whitespaceCount;
    };
};

template<typename CharacterType>
inline void CSSParserToken::updateCharacters(std::span<const CharacterType> characters)
{
    m_valueLength = characters.size();
    m_valueIs8Bit = (sizeof(CharacterType) == 1);
    m_valueDataCharRaw = characters.data();
}

} // namespace WebCore
