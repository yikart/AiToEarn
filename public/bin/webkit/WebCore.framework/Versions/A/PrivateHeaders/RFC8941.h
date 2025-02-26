/*
 * Copyright (C) 2021-2022 Apple Inc. All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/text/StringHash.h>
#include <wtf/text/WTFString.h>

namespace RFC8941 {

class Token {
public:
    explicit Token(String&& token) : m_token(WTFMove(token)) { }
    const String& string() const { return m_token; }
private:
    String m_token;
};

using BareItem = std::variant<String, Token, bool>; // FIXME: The specification supports more BareItem types.

class Parameters {
public:
    Parameters() = default;
    explicit Parameters(HashMap<String, BareItem>&& parameters)
        : m_parameters(WTFMove(parameters)) { }
    const HashMap<String, BareItem>& map() const { return m_parameters; }
    template<typename T> const T* getIf(ASCIILiteral key) const;
private:
    HashMap<String, BareItem> m_parameters;
};

template<typename T> const T* Parameters::getIf(ASCIILiteral key) const
{
    auto it = m_parameters.find<HashTranslatorASCIILiteral>(key);
    if (it == m_parameters.end())
        return nullptr;
    return std::get_if<T>(&(it->value));
}

using InnerList = Vector<std::pair<BareItem, Parameters>>;
using ItemOrInnerList = std::variant<BareItem, InnerList>;

WEBCORE_EXPORT std::optional<std::pair<BareItem, Parameters>> parseItemStructuredFieldValue(StringView header);
WEBCORE_EXPORT std::optional<HashMap<String, std::pair<ItemOrInnerList, Parameters>>> parseDictionaryStructuredFieldValue(StringView header);

} // namespace RFC8941

