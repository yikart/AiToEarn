/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "CSSParserContext.h"
#include "CSSValueKeywords.h"
#include <wtf/ASCIICType.h>

namespace WebCore {
    
// Space characters as defined by the CSS specification.
// http://www.w3.org/TR/css3-syntax/#whitespace

template<typename CharacterType>
inline bool isCSSSpace(CharacterType c)
{
    return c == ' ' || c == '\t' || c == '\n';
}

// http://dev.w3.org/csswg/css-syntax/#name-start-code-point
template <typename CharacterType>
bool isNameStartCodePoint(CharacterType c)
{
    return isASCIIAlpha(c) || c == '_' || !isASCII(c);
}

// http://dev.w3.org/csswg/css-syntax/#name-code-point
template <typename CharacterType>
bool isNameCodePoint(CharacterType c)
{
    return isNameStartCodePoint(c) || isASCIIDigit(c) || c == '-';
}

bool isColorKeywordAllowedInMode(CSSValueID, CSSParserMode);

inline bool isCSSWideKeyword(CSSValueID valueID)
{
    switch (valueID) {
    case CSSValueInitial:
    case CSSValueInherit:
    case CSSValueUnset:
    case CSSValueRevert:
    case CSSValueRevertLayer:
        return true;
    default:
        return false;
    };
}

inline bool isValidCustomIdentifier(CSSValueID valueID)
{
    // "default" is obsolete as a CSS-wide keyword but is still not allowed as a custom identifier.
    return !isCSSWideKeyword(valueID) && valueID != CSSValueDefault;
}

} // namespace WebCore
