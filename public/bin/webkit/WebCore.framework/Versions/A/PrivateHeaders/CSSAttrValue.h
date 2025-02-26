/*
 * Copyright (C) 2024 Alexsander Borges Damaceno <alexbdamac@gmail.com>. All rights reserved.
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

#include <wtf/text/WTFString.h>

namespace WebCore {

class Element;

class CSSAttrValue final : public CSSValue {
public:
    static Ref<CSSAttrValue> create(String attributeName, RefPtr<CSSValue>&& fallback = nullptr);
    const String attributeName() const { return m_attributeName; }
    const CSSValue* fallback() const { return m_fallback.get(); }
    bool equals(const CSSAttrValue& other) const;
    String customCSSText() const;

private:
    explicit CSSAttrValue(String&& attributeName, RefPtr<CSSValue>&& fallback)
        : CSSValue(ClassType::Attr)
        , m_attributeName(WTFMove(attributeName))
        , m_fallback(WTFMove(fallback))
    {
    }

    String m_attributeName;
    RefPtr<CSSValue> m_fallback;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSAttrValue, isAttrValue())
