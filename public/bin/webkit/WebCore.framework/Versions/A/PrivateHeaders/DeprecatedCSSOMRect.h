/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "DeprecatedCSSOMPrimitiveValue.h"
#include "Rect.h"

namespace WebCore {

class DeprecatedCSSOMRect final : public RefCounted<DeprecatedCSSOMRect> {
public:
    static Ref<DeprecatedCSSOMRect> create(const Rect& rect, CSSStyleDeclaration& owner)
    {
        return adoptRef(*new DeprecatedCSSOMRect(rect, owner));
    }

    DeprecatedCSSOMPrimitiveValue* top() const { return m_top.ptr(); }
    DeprecatedCSSOMPrimitiveValue* right() const { return m_right.ptr(); }
    DeprecatedCSSOMPrimitiveValue* bottom() const { return m_bottom.ptr(); }
    DeprecatedCSSOMPrimitiveValue* left() const { return m_left.ptr(); }

private:
    DeprecatedCSSOMRect(const Rect& rect, CSSStyleDeclaration& owner)
        : m_top(DeprecatedCSSOMPrimitiveValue::create(rect.top(), owner))
        , m_right(DeprecatedCSSOMPrimitiveValue::create(rect.right(), owner))
        , m_bottom(DeprecatedCSSOMPrimitiveValue::create(rect.bottom(), owner))
        , m_left(DeprecatedCSSOMPrimitiveValue::create(rect.left(), owner))
    {
    }

    Ref<DeprecatedCSSOMPrimitiveValue> m_top;
    Ref<DeprecatedCSSOMPrimitiveValue> m_right;
    Ref<DeprecatedCSSOMPrimitiveValue> m_bottom;
    Ref<DeprecatedCSSOMPrimitiveValue> m_left;
};

} // namespace WebCore
