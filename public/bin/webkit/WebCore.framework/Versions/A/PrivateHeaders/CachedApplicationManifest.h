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

#if ENABLE(APPLICATION_MANIFEST)

#include "ApplicationManifest.h"
#include "CachedResource.h"

namespace WebCore {

class Document;
class TextResourceDecoder;

class CachedApplicationManifest final : public CachedResource {
public:
    CachedApplicationManifest(CachedResourceRequest&&, PAL::SessionID, const CookieJar*);

    std::optional<struct ApplicationManifest> process(const URL& manifestURL, const URL& documentURL, Document* = nullptr);

private:
    void finishLoading(const FragmentedSharedBuffer*, const NetworkLoadMetrics&) final;
    const TextResourceDecoder* textResourceDecoder() const final { return m_decoder.ptr(); }
    Ref<TextResourceDecoder> protectedDecoder() const;
    void setEncoding(const String&) final;
    ASCIILiteral encoding() const final;

    Ref<TextResourceDecoder> m_decoder;
    std::optional<String> m_text;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CACHED_RESOURCE(CachedApplicationManifest, CachedResource::Type::ApplicationManifest)

#endif // ENABLE(APPLICATION_MANIFEST)
