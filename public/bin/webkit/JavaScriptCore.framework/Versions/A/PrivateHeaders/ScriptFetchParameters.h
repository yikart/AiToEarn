/*
 * Copyright (C) 2017 Yusuke Suzuki <utatane.tea@gmail.com>
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

#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class ScriptFetchParameters : public RefCounted<ScriptFetchParameters> {
public:
    enum Type : uint8_t {
        None,
        JavaScript,
        WebAssembly,
        JSON,
    };

    ScriptFetchParameters(Type type)
        : m_type(type)
    {
    }

    virtual ~ScriptFetchParameters() = default;

    Type type() const { return m_type; }

    virtual const String& integrity() const { return nullString(); }
    virtual bool isTopLevelModule() const { return false; }

    static Ref<ScriptFetchParameters> create(Type type)
    {
        return adoptRef(*new ScriptFetchParameters(type));
    }

    static std::optional<Type> parseType(StringView string)
    {
        if (string == "json"_s)
            return Type::JSON;
        if (string == "webassembly"_s)
            return Type::WebAssembly;
        return std::nullopt;
    }

private:
    Type m_type { Type::None };
};

} // namespace JSC
