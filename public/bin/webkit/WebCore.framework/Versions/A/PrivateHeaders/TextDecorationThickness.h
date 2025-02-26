/*
 * Copyright (C) 2018-2020 Apple Inc. All rights reserved.
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

#include "FontMetrics.h"
#include "Length.h"
#include <wtf/text/TextStream.h>

namespace WebCore {

class TextDecorationThickness {
public:
    static TextDecorationThickness createWithAuto()
    {
        return TextDecorationThickness(Type::Auto);
    }
    static TextDecorationThickness createFromFont()
    {
        return TextDecorationThickness(Type::FromFont);
    }
    static TextDecorationThickness createWithLength(Length&& length)
    {
        return { Type::Length, WTFMove(length) };
    }

    constexpr bool isAuto() const
    {
        return m_type == Type::Auto;
    }

    constexpr bool isFromFont() const
    {
        return m_type == Type::FromFont;
    }

    constexpr bool isLength() const
    {
        return m_type == Type::Length;
    }

    const Length& length() const
    {
        ASSERT(isLength());
        return m_length;
    }

    float resolve(float fontSize, const FontMetrics& metrics) const
    {
        if (isAuto()) {
            const float textDecorationBaseFontSize = 16;
            return fontSize / textDecorationBaseFontSize;
        }
        if (isFromFont())
            return metrics.underlineThickness().value_or(0);

        ASSERT(isLength());
        if (m_length.isPercent())
            return fontSize * (m_length.percent() / 100.0f);
        if (m_length.isCalculated())
            return m_length.nonNanCalculatedValue(fontSize);
        return m_length.value();
    }

    constexpr bool operator==(const TextDecorationThickness& other) const
    {
        switch (m_type) {
        case Type::Auto:
        case Type::FromFont:
            return m_type == other.m_type;
        case Type::Length:
            return m_type == other.m_type && m_length == other.m_length;
        default:
            ASSERT_NOT_REACHED();
            return true;
        }
    }

private:
    enum class Type : uint8_t {
        Auto,
        FromFont,
        Length
    };

    TextDecorationThickness(Type type)
        : m_type(type)
    {
    }

    TextDecorationThickness(Type type, Length&& length)
        : m_type(type)
        , m_length(WTFMove(length))
    {
    }

    Type m_type;
    Length m_length;
};

inline TextStream& operator<<(TextStream& ts, const TextDecorationThickness& thickness)
{
    if (thickness.isAuto())
        ts << "auto";
    else if (thickness.isFromFont())
        ts << "from-font";
    else
        ts << thickness.length();
    return ts;
}

} // namespace WebCore
