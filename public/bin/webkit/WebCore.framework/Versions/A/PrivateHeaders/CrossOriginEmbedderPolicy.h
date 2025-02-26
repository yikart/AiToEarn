/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "FetchOptions.h"
#include <wtf/text/WTFString.h>

namespace WTF::Persistence {

class Decoder;
class Encoder;

}

namespace WebCore {

class LocalFrame;
class ResourceResponse;
class ScriptExecutionContext;

struct ReportingClient;
class SecurityOriginData;

// https://html.spec.whatwg.org/multipage/origin.html#embedder-policy-value
enum class CrossOriginEmbedderPolicyValue : bool {
    UnsafeNone,
    RequireCORP
};

// https://html.spec.whatwg.org/multipage/origin.html#embedder-policy
struct CrossOriginEmbedderPolicy {
    CrossOriginEmbedderPolicyValue value { CrossOriginEmbedderPolicyValue::UnsafeNone };
    CrossOriginEmbedderPolicyValue reportOnlyValue { CrossOriginEmbedderPolicyValue::UnsafeNone };
    String reportingEndpoint;
    String reportOnlyReportingEndpoint;

    CrossOriginEmbedderPolicy isolatedCopy() const &;
    CrossOriginEmbedderPolicy isolatedCopy() &&;
    void encode(WTF::Persistence::Encoder&) const;
    static std::optional<CrossOriginEmbedderPolicy> decode(WTF::Persistence::Decoder &);

    friend bool operator==(const CrossOriginEmbedderPolicy&, const CrossOriginEmbedderPolicy&) = default;

    void addPolicyHeadersTo(ResourceResponse&) const;
};

enum class COEPDisposition : bool { Reporting , Enforce };

WEBCORE_EXPORT CrossOriginEmbedderPolicy obtainCrossOriginEmbedderPolicy(const ResourceResponse&, const ScriptExecutionContext*);
WEBCORE_EXPORT void sendCOEPInheritenceViolation(ReportingClient&, const URL& embedderURL, const String& endpoint, COEPDisposition, const String& type, const URL& blockedURL);
WEBCORE_EXPORT void sendCOEPCORPViolation(ReportingClient&, const URL& embedderURL, const String& endpoint, COEPDisposition, FetchOptions::Destination, const URL& blockedURL);

} // namespace WebCore
