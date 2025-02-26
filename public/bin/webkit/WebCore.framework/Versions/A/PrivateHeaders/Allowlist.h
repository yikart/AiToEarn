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

#include "SecurityOriginData.h"

namespace WebCore {

// https://w3c.github.io/webappsec-permissions-policy/#allowlists
class Allowlist {
public:
    Allowlist() = default;
    struct AllowAllOrigins { };
    Allowlist(AllowAllOrigins allow)
        : m_origins(allow)
    {
    }
    explicit Allowlist(const SecurityOriginData& origin)
        : m_origins(HashSet<SecurityOriginData> { origin })
    {
    }
    explicit Allowlist(HashSet<SecurityOriginData>&& origins)
        : m_origins(WTFMove(origins))
    {
    }

    using OriginsVariant = std::variant<HashSet<SecurityOriginData>, AllowAllOrigins>;
    explicit Allowlist(OriginsVariant&& origins)
        : m_origins(WTFMove(origins))
    {
    }
    const OriginsVariant& origins() const { return m_origins; }

    // This is simplified version of https://w3c.github.io/webappsec-permissions-policy/#matches.
    bool matches(const SecurityOriginData& origin) const
    {
        return std::visit(WTF::makeVisitor([&origin](const HashSet<SecurityOriginData>& origins) -> bool {
            return origins.contains(origin);
        }, [&] (const auto&) {
            return true;
        }), m_origins);
    }

private:
    OriginsVariant m_origins;
};

} // namespace WebCore
