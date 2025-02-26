/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "StyleScopeOrdinal.h"

namespace WebCore::Style {

class ViewTransitionName {
public:
    enum class Type : uint8_t {
        None,
        Auto,
        MatchElement,
        CustomIdent,
    };

    static ViewTransitionName createWithNone()
    {
        return ViewTransitionName(Type::None);
    }

    static ViewTransitionName createWithAuto(ScopeOrdinal ordinal)
    {
        return ViewTransitionName(Type::Auto, ordinal);
    }

    static ViewTransitionName createWithMatchElement(ScopeOrdinal ordinal)
    {
        return ViewTransitionName(Type::MatchElement, ordinal);
    }

    static ViewTransitionName createWithCustomIdent(ScopeOrdinal ordinal, AtomString ident)
    {
        return ViewTransitionName(ordinal, ident);
    }

    bool isNone() const
    {
        return m_type == Type::None;
    }

    bool isAuto() const
    {
        return m_type == Type::Auto;
    }

    bool isMatchElement() const
    {
        return m_type == Type::MatchElement;
    }

    bool isCustomIdent() const
    {
        return m_type == Type::CustomIdent;
    }

    AtomString customIdent() const
    {
        ASSERT(isCustomIdent());
        return m_customIdent;
    }

    ScopeOrdinal scopeOrdinal() const
    {
        ASSERT(!isNone());
        return m_scopeOrdinal;
    }

    bool operator==(const ViewTransitionName& other) const = default;
private:
    Type m_type;
    ScopeOrdinal m_scopeOrdinal;
    AtomString m_customIdent;

    ViewTransitionName(Type type, ScopeOrdinal scopeOrdinal = ScopeOrdinal::Element)
        : m_type(type)
        , m_scopeOrdinal(scopeOrdinal)
    {
    }

    ViewTransitionName(ScopeOrdinal scopeOrdinal, AtomString ident)
        : m_type(Type::CustomIdent)
        , m_scopeOrdinal(scopeOrdinal)
        , m_customIdent(ident)
    {
    }

};

inline TextStream& operator<<(TextStream& ts, const ViewTransitionName& name)
{
    if (name.isAuto())
        ts << "auto"_s;
    else if (name.isMatchElement())
        ts << "match-element"_s;
    else if (name.isNone())
        ts << "none"_s;
    else
        ts << name.customIdent();
    return ts;
}

} // namespace WebCore::Style
