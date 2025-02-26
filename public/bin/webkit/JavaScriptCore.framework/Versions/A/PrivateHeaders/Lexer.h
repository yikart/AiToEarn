/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2002-2023 Apple Inc. All rights reserved.
 *  Copyright (C) 2010 Zoltan Herczeg (zherczeg@inf.u-szeged.hu)
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "Lookup.h"
#include "ParserArena.h"
#include "ParserModes.h"
#include "ParserTokens.h"
#include "SourceCode.h"
#include <wtf/ASCIICType.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/unicode/CharacterNames.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

struct ParsedUnicodeEscapeValue;

enum class LexerFlags : uint8_t {
    IgnoreReservedWords = 1 << 0, 
    DontBuildStrings = 1 << 1,
    DontBuildKeywords = 1 << 2
};

bool isLexerKeyword(const Identifier&);

template <typename T>
class Lexer {
    WTF_MAKE_NONCOPYABLE(Lexer);
    WTF_MAKE_TZONE_ALLOCATED(Lexer);

public:
    Lexer(VM&, JSParserBuiltinMode, JSParserScriptMode);
    ~Lexer();

    // Character manipulation functions.
    static bool isWhiteSpace(T character);
    static bool isLineTerminator(T character);
    static unsigned char convertHex(int c1, int c2);
    static UChar convertUnicode(int c1, int c2, int c3, int c4);

    // Functions to set up parsing.
    void setCode(const SourceCode&, ParserArena*);
    void setIsReparsingFunction() { m_isReparsingFunction = true; }
    bool isReparsingFunction() const { return m_isReparsingFunction; }

    JSTokenType lex(JSToken*, OptionSet<LexerFlags>, bool strictMode);
    JSTokenType lexWithoutClearingLineTerminator(JSToken*, OptionSet<LexerFlags>, bool strictMode);
    bool nextTokenIsColon();
    int lineNumber() const { return m_lineNumber; }
    ALWAYS_INLINE int currentOffset() const { return offsetFromSourcePtr(m_code); }
    ALWAYS_INLINE int currentLineStartOffset() const { return offsetFromSourcePtr(m_lineStart); }
    ALWAYS_INLINE JSTextPosition currentPosition() const
    {
        return JSTextPosition(m_lineNumber, currentOffset(), currentLineStartOffset());
    }
    JSTextPosition positionBeforeLastNewline() const { return m_positionBeforeLastNewline; }
    JSTokenLocation lastTokenLocation() const { return m_lastTokenLocation; }
    void setLastLineNumber(int lastLineNumber) { m_lastLineNumber = lastLineNumber; }
    int lastLineNumber() const { return m_lastLineNumber; }
    bool hasLineTerminatorBeforeToken() const { return m_hasLineTerminatorBeforeToken; }
    JSTokenType scanRegExp(JSToken*, UChar patternPrefix = 0);
    enum class RawStringsBuildMode { BuildRawStrings, DontBuildRawStrings };
    JSTokenType scanTemplateString(JSToken*, RawStringsBuildMode);

    // Functions for use after parsing.
    bool sawError() const { return m_error; }
    void setSawError(bool sawError) { m_error = sawError; }
    String getErrorMessage() const { return m_lexErrorMessage; }
    void setErrorMessage(const String& errorMessage) { m_lexErrorMessage = errorMessage; }
    String sourceURLDirective() const { return m_sourceURLDirective; }
    String sourceMappingURLDirective() const { return m_sourceMappingURLDirective; }
    void clear();
    void setOffset(int offset, int lineStartOffset)
    {
        m_error = 0;
        m_lexErrorMessage = String();

        m_code = sourcePtrFromOffset(offset);
        m_lineStart = sourcePtrFromOffset(lineStartOffset);
        ASSERT(currentOffset() >= currentLineStartOffset());

        m_buffer8.shrink(0);
        m_buffer16.shrink(0);
        if (LIKELY(m_code < m_codeEnd))
            m_current = *m_code;
        else
            m_current = 0;
    }
    void setLineNumber(int line)
    {
        ASSERT(line >= 0);
        m_lineNumber = line;
    }
    void setHasLineTerminatorBeforeToken(bool terminator)
    {
        m_hasLineTerminatorBeforeToken = terminator;
    }

    JSTokenType lexExpectIdentifier(JSToken*, OptionSet<LexerFlags>, bool strictMode);

    ALWAYS_INLINE StringView getToken(const JSToken& token)
    {
        SourceProvider* sourceProvider = m_source->provider();
        ASSERT_WITH_MESSAGE(token.m_location.startOffset <= token.m_location.endOffset, "Calling this function with the baked token.");
        return sourceProvider->getRange(token.m_location.startOffset, token.m_location.endOffset);
    }

    size_t codeLength() { return m_codeEnd - m_codeStart; }

private:
    void record8(int);
    void append8(std::span<const T>);
    void record16(int);
    void record16(T);
    void recordUnicodeCodePoint(char32_t);
    void append16(std::span<const LChar>);
    void append16(std::span<const UChar> characters) { m_buffer16.append(characters); }

    static constexpr char32_t errorCodePoint = 0xFFFFFFFFu;
    char32_t currentCodePoint() const;
    ALWAYS_INLINE void shift();
    ALWAYS_INLINE bool atEnd() const;
    ALWAYS_INLINE T peek(int offset) const;

    ParsedUnicodeEscapeValue parseUnicodeEscape();
    void shiftLineTerminator();

    ALWAYS_INLINE int offsetFromSourcePtr(const T* ptr) const { return ptr - m_codeStart; }
    ALWAYS_INLINE const T* sourcePtrFromOffset(int offset) const { return m_codeStart + offset; }

    String invalidCharacterMessage() const;
    ALWAYS_INLINE const T* currentSourcePtr() const;

    ALWAYS_INLINE void setCodeStart(StringView);

    template<typename CharacterType>
    ALWAYS_INLINE const Identifier* makeIdentifier(std::span<const CharacterType>);

    ALWAYS_INLINE const Identifier* makeLCharIdentifier(std::span<const LChar>);
    ALWAYS_INLINE const Identifier* makeLCharIdentifier(std::span<const UChar>);
    ALWAYS_INLINE const Identifier* makeRightSizedIdentifier(std::span<const UChar>, UChar orAllChars);
    ALWAYS_INLINE const Identifier* makeIdentifierLCharFromUChar(std::span<const UChar>);
    ALWAYS_INLINE const Identifier* makeEmptyIdentifier();

    ALWAYS_INLINE bool lastTokenWasRestrKeyword() const;
    
    ALWAYS_INLINE void skipWhitespace();

    template <int shiftAmount> void internalShift();
    template <bool shouldCreateIdentifier> ALWAYS_INLINE JSTokenType parseKeyword(JSTokenData*);
    template <bool shouldBuildIdentifiers> ALWAYS_INLINE JSTokenType parseIdentifier(JSTokenData*, OptionSet<LexerFlags>, bool strictMode);
    template <bool shouldBuildIdentifiers> NEVER_INLINE JSTokenType parseIdentifierSlowCase(JSTokenData*, OptionSet<LexerFlags>, bool strictMode, const T* identifierStart);
    enum StringParseResult {
        StringParsedSuccessfully,
        StringUnterminated,
        StringCannotBeParsed
    };
    template <bool shouldBuildStrings> ALWAYS_INLINE StringParseResult parseString(JSTokenData*, bool strictMode);
    template <bool shouldBuildStrings> NEVER_INLINE StringParseResult parseStringSlowCase(JSTokenData*, bool strictMode);


    template <bool shouldBuildStrings> ALWAYS_INLINE StringParseResult parseComplexEscape(bool strictMode);
    ALWAYS_INLINE StringParseResult parseTemplateLiteral(JSTokenData*, RawStringsBuildMode);
    
    using NumberParseResult = std::variant<double, const Identifier*>;
    ALWAYS_INLINE std::optional<NumberParseResult> parseHex();
    ALWAYS_INLINE std::optional<NumberParseResult> parseBinary();
    ALWAYS_INLINE std::optional<NumberParseResult> parseOctal();
    ALWAYS_INLINE std::optional<NumberParseResult> parseDecimal();
    ALWAYS_INLINE bool parseNumberAfterDecimalPoint();
    ALWAYS_INLINE bool parseNumberAfterExponentIndicator();
    ALWAYS_INLINE bool parseMultilineComment();

    ALWAYS_INLINE void parseCommentDirective();
    ALWAYS_INLINE String parseCommentDirectiveValue();

    template <unsigned length>
    ALWAYS_INLINE bool consume(const char (&input)[length]);

    void fillTokenInfo(JSToken*, JSTokenType, int lineNumber, int endOffset, int lineStartOffset, JSTextPosition endPosition);

    static constexpr size_t initialReadBufferCapacity = 32;

    int m_lineNumber;
    int m_lastLineNumber;

    Vector<LChar> m_buffer8;
    Vector<UChar> m_buffer16;
    Vector<UChar> m_bufferForRawTemplateString16;
    bool m_hasLineTerminatorBeforeToken;
    int m_lastToken;

    const SourceCode* m_source;
    unsigned m_sourceOffset;
    const T* m_code;
    const T* m_codeStart;
    const T* m_codeEnd;
    const T* m_codeStartPlusOffset;
    const T* m_lineStart;
    JSTextPosition m_positionBeforeLastNewline;
    JSTokenLocation m_lastTokenLocation;
    bool m_isReparsingFunction;
    bool m_atLineStart;
    bool m_error;
    String m_lexErrorMessage;

    String m_sourceURLDirective;
    String m_sourceMappingURLDirective;

    T m_current;

    IdentifierArena* m_arena;

    VM& m_vm;
    bool m_parsingBuiltinFunction;
    JSParserScriptMode m_scriptMode;
};

template <>
ALWAYS_INLINE bool Lexer<LChar>::isWhiteSpace(LChar ch)
{
    return ch == ' ' || ch == '\t' || ch == 0xB || ch == 0xC || ch == 0xA0;
}

template <>
ALWAYS_INLINE bool Lexer<UChar>::isWhiteSpace(UChar ch)
{
    return isLatin1(ch) ? Lexer<LChar>::isWhiteSpace(static_cast<LChar>(ch)) : (u_charType(ch) == U_SPACE_SEPARATOR || ch == byteOrderMark);
}

template <>
ALWAYS_INLINE bool Lexer<LChar>::isLineTerminator(LChar ch)
{
    return ch == '\r' || ch == '\n';
}

template <>
ALWAYS_INLINE bool Lexer<UChar>::isLineTerminator(UChar ch)
{
    return ch == '\r' || ch == '\n' || (ch & ~1) == 0x2028;
}

template <typename T>
inline unsigned char Lexer<T>::convertHex(int c1, int c2)
{
    return (toASCIIHexValue(c1) << 4) | toASCIIHexValue(c2);
}

template <typename T>
inline UChar Lexer<T>::convertUnicode(int c1, int c2, int c3, int c4)
{
    return (convertHex(c1, c2) << 8) | convertHex(c3, c4);
}

template<typename T>
template<typename CharacterType>
ALWAYS_INLINE const Identifier* Lexer<T>::makeIdentifier(std::span<const CharacterType> characters)
{
    return &m_arena->makeIdentifier(m_vm, characters);
}

template <>
ALWAYS_INLINE const Identifier* Lexer<LChar>::makeRightSizedIdentifier(std::span<const UChar> characters, UChar)
{
    return &m_arena->makeIdentifierLCharFromUChar(m_vm, characters);
}

template <>
ALWAYS_INLINE const Identifier* Lexer<UChar>::makeRightSizedIdentifier(std::span<const UChar> characters, UChar orAllChars)
{
    if (!(orAllChars & ~0xff))
        return &m_arena->makeIdentifierLCharFromUChar(m_vm, characters);

    return &m_arena->makeIdentifier(m_vm, characters);
}

template <typename T>
ALWAYS_INLINE const Identifier* Lexer<T>::makeEmptyIdentifier()
{
    return &m_arena->makeEmptyIdentifier(m_vm);
}

template <>
ALWAYS_INLINE void Lexer<LChar>::setCodeStart(StringView sourceString)
{
    ASSERT(sourceString.is8Bit());
    m_codeStart = sourceString.span8().data();
}

template <>
ALWAYS_INLINE void Lexer<UChar>::setCodeStart(StringView sourceString)
{
    ASSERT(!sourceString.is8Bit());
    m_codeStart = sourceString.span16().data();
}

template <typename T>
ALWAYS_INLINE const Identifier* Lexer<T>::makeIdentifierLCharFromUChar(std::span<const UChar> characters)
{
    return &m_arena->makeIdentifierLCharFromUChar(m_vm, characters);
}

template <typename T>
ALWAYS_INLINE const Identifier* Lexer<T>::makeLCharIdentifier(std::span<const LChar> characters)
{
    return &m_arena->makeIdentifier(m_vm, characters);
}

template <typename T>
ALWAYS_INLINE const Identifier* Lexer<T>::makeLCharIdentifier(std::span<const UChar> characters)
{
    return &m_arena->makeIdentifierLCharFromUChar(m_vm, characters);
}

#if ASSERT_ENABLED
bool isSafeBuiltinIdentifier(VM&, const Identifier*);
#else
ALWAYS_INLINE bool isSafeBuiltinIdentifier(VM&, const Identifier*) { return true; }
#endif // ASSERT_ENABLED

template <typename T>
ALWAYS_INLINE JSTokenType Lexer<T>::lexExpectIdentifier(JSToken* tokenRecord, OptionSet<LexerFlags> lexerFlags, bool strictMode)
{
    JSTokenData* tokenData = &tokenRecord->m_data;
    JSTokenLocation* tokenLocation = &tokenRecord->m_location;
    ASSERT(lexerFlags.contains(LexerFlags::IgnoreReservedWords));
    const T* start = m_code;
    const T* ptr = start;
    const T* end = m_codeEnd;
    JSTextPosition startPosition = currentPosition();
    if (ptr >= end) {
        ASSERT(ptr == end);
        goto slowCase;
    }
    if (!WTF::isASCIIAlpha(*ptr))
        goto slowCase;
    ++ptr;
    while (ptr < end) {
        if (!WTF::isASCIIAlphanumeric(*ptr))
            break;
        ++ptr;
    }

    // Here's the shift
    if (ptr < end) {
        if ((!WTF::isASCII(*ptr)) || (*ptr == '\\') || (*ptr == '_') || (*ptr == '$'))
            goto slowCase;
        m_current = *ptr;
    } else
        m_current = 0;

    m_code = ptr;
    ASSERT(currentOffset() >= currentLineStartOffset());

    // Create the identifier if needed
    if (lexerFlags.contains(LexerFlags::DontBuildKeywords)
#if ASSERT_ENABLED
        && !m_parsingBuiltinFunction
#endif
        )
        tokenData->ident = nullptr;
    else
        tokenData->ident = makeLCharIdentifier({ start, ptr });

    tokenLocation->line = m_lineNumber;
    tokenLocation->lineStartOffset = currentLineStartOffset();
    tokenLocation->startOffset = offsetFromSourcePtr(start);
    tokenLocation->endOffset = currentOffset();
    ASSERT(tokenLocation->startOffset >= tokenLocation->lineStartOffset);
    tokenRecord->m_startPosition = startPosition;
    tokenRecord->m_endPosition = currentPosition();
#if ASSERT_ENABLED
    if (m_parsingBuiltinFunction) {
        if (!isSafeBuiltinIdentifier(m_vm, tokenData->ident))
            return ERRORTOK;
    }
#endif

    m_lastToken = IDENT;
    return IDENT;
    
slowCase:
    return lex(tokenRecord, lexerFlags, strictMode);
}

template <typename T>
ALWAYS_INLINE JSTokenType Lexer<T>::lex(JSToken* tokenRecord, OptionSet<LexerFlags> lexerFlags, bool strictMode)
{
    m_hasLineTerminatorBeforeToken = false;
    return lexWithoutClearingLineTerminator(tokenRecord, lexerFlags, strictMode);
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
