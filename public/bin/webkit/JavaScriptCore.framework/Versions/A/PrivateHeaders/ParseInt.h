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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "JSCJSValue.h"
#include "Lexer.h"
#include <wtf/dtoa.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

static constexpr double mantissaOverflowLowerBound = 9007199254740992.0;

ALWAYS_INLINE static int parseDigit(unsigned short c, int radix)
{
    int digit = -1;

    if (isASCIIDigit(c))
        digit = c - '0';
    else if (isASCIIUpper(c))
        digit = c - 'A' + 10;
    else if (isASCIILower(c))
        digit = c - 'a' + 10;

    if (digit >= radix)
        return -1;
    return digit;
}

static double parseIntOverflow(std::span<const LChar> s, int radix)
{
    double number = 0.0;
    double radixMultiplier = 1.0;

    for (const LChar* p = s.data() + s.size() - 1; p >= s.data(); p--) {
        if (radixMultiplier == std::numeric_limits<double>::infinity()) {
            if (*p != '0') {
                number = std::numeric_limits<double>::infinity();
                break;
            }
        } else {
            int digit = parseDigit(*p, radix);
            number += digit * radixMultiplier;
        }

        radixMultiplier *= radix;
    }

    return number;
}

static double parseIntOverflow(std::span<const UChar> s, int radix)
{
    double number = 0.0;
    double radixMultiplier = 1.0;

    for (const UChar* p = s.data() + s.size() - 1; p >= s.data(); p--) {
        if (radixMultiplier == std::numeric_limits<double>::infinity()) {
            if (*p != '0') {
                number = std::numeric_limits<double>::infinity();
                break;
            }
        } else {
            int digit = parseDigit(*p, radix);
            number += digit * radixMultiplier;
        }

        radixMultiplier *= radix;
    }

    return number;
}

ALWAYS_INLINE static bool isStrWhiteSpace(UChar c)
{
    // https://tc39.github.io/ecma262/#sec-tonumber-applied-to-the-string-type
    return Lexer<UChar>::isWhiteSpace(c) || Lexer<UChar>::isLineTerminator(c);
}

inline static std::optional<double> parseIntDouble(double n)
{
    // Optimized handling for numbers:
    // If the argument is 0 or a number in range 10^-6 <= n < maxSafeInteger, then parseInt
    // results in a truncation to integer. In the case of -0, this is converted to 0.
    //
    // This is also a truncation for values in the range maxSafeInteger <= n < 10^21,
    // however these values cannot be trivially truncated to int since 10^21 exceeds
    // even the int64_t range. Negative numbers are a little trickier, the case for
    // values in the range -10^21 < n <= -1 are similar to those for integer, but
    // values in the range -1 < n <= -10^-6 need to truncate to -0, not 0.
    constexpr double tenToTheMinus6 = 0.000001;
    if (!n)
        return 0;
    static_assert(maxSafeInteger() < 1e+21);
    static_assert(maxSafeInteger() < mantissaOverflowLowerBound);
    if (std::abs(n) <= maxSafeInteger()) {
        if (n >= tenToTheMinus6 || n <= -1.0)
            return std::trunc(n);
    }
    return std::nullopt;
}

// ES5.1 15.1.2.2
template <typename CharType>
ALWAYS_INLINE
static double parseInt(std::span<const CharType> data, int radix)
{
    // 1. Let inputString be ToString(string).
    // 2. Let S be a newly created substring of inputString consisting of the first character that is not a
    //    StrWhiteSpaceChar and all characters following that character. (In other words, remove leading white
    //    space.) If inputString does not contain any such characters, let S be the empty string.
    size_t length = data.size();
    size_t p = 0;
    while (p < length && isStrWhiteSpace(data[p]))
        ++p;

    // 3. Let sign be 1.
    // 4. If S is not empty and the first character of S is a minus sign -, let sign be -1.
    // 5. If S is not empty and the first character of S is a plus sign + or a minus sign -, then remove the first character from S.
    double sign = 1;
    if (p < length) {
        if (data[p] == '+')
            ++p;
        else if (data[p] == '-') {
            sign = -1;
            ++p;
        }
    }

    // 6. Let R = ToInt32(radix).
    // 7. Let stripPrefix be true.
    // 8. If R != 0,then
    //   b. If R != 16, let stripPrefix be false.
    // 9. Else, R == 0
    //   a. LetR = 10.
    // 10. If stripPrefix is true, then
    //   a. If the length of S is at least 2 and the first two characters of S are either ―0x or ―0X,
    //      then remove the first two characters from S and let R = 16.
    // 11. If S contains any character that is not a radix-R digit, then let Z be the substring of S
    //     consisting of all characters before the first such character; otherwise, let Z be S.
    if ((radix == 0 || radix == 16) && length - p >= 2 && data[p] == '0' && (data[p + 1] == 'x' || data[p + 1] == 'X')) {
        radix = 16;
        p += 2;
    } else if (radix == 0)
        radix = 10;

    // 8.a If R < 2 or R > 36, then return NaN.
    if (radix < 2 || radix > 36)
        return PNaN;

    // 13. Let mathInt be the mathematical integer value that is represented by Z in radix-R notation, using the letters
    //     A-Z and a-z for digits with values 10 through 35. (However, if R is 10 and Z contains more than 20 significant
    //     digits, every significant digit after the 20th may be replaced by a 0 digit, at the option of the implementation;
    //     and if R is not 2, 4, 8, 10, 16, or 32, then mathInt may be an implementation-dependent approximation to the
    //     mathematical integer value that is represented by Z in radix-R notation.)
    // 14. Let number be the Number value for mathInt.
    int firstDigitPosition = p;
    bool sawDigit = false;
    double number = 0;
    while (p < length) {
        int digit = parseDigit(data[p], radix);
        if (digit == -1)
            break;
        sawDigit = true;
        number *= radix;
        number += digit;
        ++p;
    }

    // 12. If Z is empty, return NaN.
    if (!sawDigit)
        return PNaN;

    // Alternate code path for certain large numbers.
    if (number >= mantissaOverflowLowerBound) {
        if (radix == 10) {
            size_t parsedLength;
            number = parseDouble(data.subspan(firstDigitPosition, p - firstDigitPosition), parsedLength);
        } else if (radix == 2 || radix == 4 || radix == 8 || radix == 16 || radix == 32)
            number = parseIntOverflow(data.subspan(firstDigitPosition, p - firstDigitPosition), radix);
    }

    // 15. Return sign x number.
    return sign * number;
}

ALWAYS_INLINE static double parseInt(StringView s, int radix)
{
    if (s.is8Bit())
        return parseInt(s.span8(), radix);
    return parseInt(s.span16(), radix);
}

template<typename CallbackWhenNoException>
static ALWAYS_INLINE typename std::invoke_result<CallbackWhenNoException, StringView>::type toStringView(JSGlobalObject* globalObject, JSValue value, CallbackWhenNoException callback)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    JSString* string = value.toStringOrNull(globalObject);
    EXCEPTION_ASSERT(!!scope.exception() == !string);
    if (UNLIKELY(!string))
        return { };
    auto view = string->view(globalObject);
    RETURN_IF_EXCEPTION(scope, { });
    RELEASE_AND_RETURN(scope, callback(view));
}

// Mapping from integers 0..35 to digit identifying this value, for radix 2..36.
const char radixDigits[] = "0123456789abcdefghijklmnopqrstuvwxyz";

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
