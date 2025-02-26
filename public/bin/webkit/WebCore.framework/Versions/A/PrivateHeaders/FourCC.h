/*
 * Copyright (C) 2017-2022 Apple Inc. All rights reserved.
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

#include <wtf/text/WTFString.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

struct FourCC {
    constexpr FourCC() = default;
    constexpr FourCC(uint32_t value) : value { value } { }
    constexpr FourCC(const char (&nullTerminatedString)[5]);
    constexpr std::array<char, 5> string() const;
    static std::optional<FourCC> fromString(StringView);
    friend constexpr bool operator==(FourCC, FourCC) = default;

    uint32_t value { 0 };
};

constexpr FourCC::FourCC(const char (&data)[5])
    : value(data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3])
{
    ASSERT_UNDER_CONSTEXPR_CONTEXT(isASCII(data[0]));
    ASSERT_UNDER_CONSTEXPR_CONTEXT(isASCII(data[1]));
    ASSERT_UNDER_CONSTEXPR_CONTEXT(isASCII(data[2]));
    ASSERT_UNDER_CONSTEXPR_CONTEXT(isASCII(data[3]));
    ASSERT_UNDER_CONSTEXPR_CONTEXT(data[4] == '\0');
}

constexpr std::array<char, 5> FourCC::string() const
{
    return {
        static_cast<char>(value >> 24),
        static_cast<char>(value >> 16),
        static_cast<char>(value >> 8),
        static_cast<char>(value),
        '\0'
    };
}

} // namespace WebCore

namespace WTF {

template<typename> struct LogArgument;

template<> struct LogArgument<WebCore::FourCC> {
    static String toString(const WebCore::FourCC& code) { return String::fromLatin1(code.string().data()); }
};

} // namespace WTF

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
