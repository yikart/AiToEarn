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

#include "WasmName.h"
#include <wtf/Noncopyable.h>
#include <wtf/text/CString.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>
#include <utility>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC { namespace Wasm {

struct NameSection : public ThreadSafeRefCounted<NameSection> {
    WTF_MAKE_NONCOPYABLE(NameSection);
public:
    NameSection()
    {
        setHash(std::nullopt);
    }

    static Ref<NameSection> create()
    {
        return adoptRef(*new NameSection);
    }

    void setHash(const std::optional<CString> &hash)
    {
        moduleHash = Name(hash ? hash->length() : 3);
        if (hash) {
            for (size_t i = 0; i < hash->length(); ++i)
                moduleHash[i] = static_cast<uint8_t>(*(hash->data() + i));
        } else {
            moduleHash[0] = '<';
            moduleHash[1] = '?';
            moduleHash[2] = '>';
        }
    }

    std::pair<const Name*, RefPtr<NameSection>> get(size_t functionIndexSpace)
    {
        return std::make_pair(functionIndexSpace < functionNames.size() ? &functionNames[functionIndexSpace] : nullptr, RefPtr { this });
    }
    Name moduleName;
    Name moduleHash;
    Vector<Name> functionNames;
};

} } // namespace JSC::Wasm

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
