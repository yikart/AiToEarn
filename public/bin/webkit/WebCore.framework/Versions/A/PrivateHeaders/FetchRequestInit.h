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

#include "AbortSignal.h"
#include "FetchBody.h"
#include "FetchHeaders.h"
#include "FetchOptions.h"
#include "RequestPriority.h"
#include <JavaScriptCore/JSCJSValue.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

struct FetchRequestInit {
    String method;
    std::optional<FetchHeaders::Init> headers;
    std::optional<FetchBody::Init> body;
    String referrer;
    std::optional<ReferrerPolicy> referrerPolicy;
    std::optional<FetchOptions::Mode> mode;
    std::optional<FetchOptions::Credentials> credentials;
    std::optional<FetchOptions::Cache> cache;
    std::optional<FetchOptions::Redirect> redirect;
    String integrity;
    std::optional<bool> keepalive;
    JSC::JSValue signal;
    std::optional<RequestPriority> priority;
    JSC::JSValue window;

    bool hasMembers() const { return !method.isEmpty() || headers || body || !referrer.isEmpty() || referrerPolicy || mode || credentials || cache || redirect || !integrity.isEmpty() || keepalive || !window.isUndefined() || !signal.isUndefined(); }
};

}
