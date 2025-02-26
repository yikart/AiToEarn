/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include <optional>

namespace WebCore {

#if ENABLE(APP_HIGHLIGHTS)
class AppHighlightRangeData;
#endif
class CertificateInfo;
class ContentSecurityPolicyResponseHeaders;
class HTTPHeaderMap;
class ResourceResponse;
class ResourceRequest;

struct ClientOrigin;
struct CrossOriginEmbedderPolicy;
struct FetchOptions;
struct ImageResource;
struct ImportedScriptAttributes;
struct NavigationPreloadState;
class SecurityOriginData;

}

namespace WTF::Persistence {

template<typename> struct Coder;
class Decoder;
class Encoder;

#define DECLARE_CODER(class) \
template<> struct Coder<class> { \
    WEBCORE_EXPORT static void encodeForPersistence(Encoder&, const class&); \
    WEBCORE_EXPORT static std::optional<class> decodeForPersistence(Decoder&); \
}

#if ENABLE(APP_HIGHLIGHTS)
DECLARE_CODER(WebCore::AppHighlightRangeData);
#endif
DECLARE_CODER(WebCore::CertificateInfo);
DECLARE_CODER(WebCore::ClientOrigin);
DECLARE_CODER(WebCore::ContentSecurityPolicyResponseHeaders);
DECLARE_CODER(WebCore::CrossOriginEmbedderPolicy);
DECLARE_CODER(WebCore::FetchOptions);
DECLARE_CODER(WebCore::HTTPHeaderMap);
DECLARE_CODER(WebCore::ImportedScriptAttributes);
DECLARE_CODER(WebCore::ImageResource);
DECLARE_CODER(WebCore::ResourceResponse);
DECLARE_CODER(WebCore::ResourceRequest);
DECLARE_CODER(WebCore::SecurityOriginData);
DECLARE_CODER(WebCore::NavigationPreloadState);
#undef DECLARE_CODER

}
