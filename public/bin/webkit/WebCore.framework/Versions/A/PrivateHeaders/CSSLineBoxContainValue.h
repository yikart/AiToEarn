/*
 * Copyright (C) 2011 Apple Inc. All rights reserved.
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

#include "CSSValue.h"
#include <wtf/OptionSet.h>
#include <wtf/Ref.h>

namespace WebCore {

class CSSPrimitiveValue;

enum class LineBoxContain : uint8_t {
    Block           = 1 << 0,
    Inline          = 1 << 1,
    Font            = 1 << 2,
    Glyphs          = 1 << 3,
    Replaced        = 1 << 4,
    InlineBox       = 1 << 5,
    InitialLetter   = 1 << 6,
};

// Used for text-CSSLineBoxContain and box-CSSLineBoxContain
class CSSLineBoxContainValue final : public CSSValue {
public:
    static Ref<CSSLineBoxContainValue> create(OptionSet<LineBoxContain> value)
    {
        return adoptRef(*new CSSLineBoxContainValue(value));
    }

    String customCSSText() const;
    bool equals(const CSSLineBoxContainValue& other) const { return m_value == other.m_value; }
    OptionSet<LineBoxContain> value() const { return m_value; }

private:
    explicit CSSLineBoxContainValue(OptionSet<LineBoxContain>);

    OptionSet<LineBoxContain> m_value;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSLineBoxContainValue, isLineBoxContainValue())
