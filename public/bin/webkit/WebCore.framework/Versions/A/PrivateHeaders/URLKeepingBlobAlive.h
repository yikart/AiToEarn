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

#include "SecurityOriginData.h"
#include <wtf/URL.h>

namespace WebCore {

// URL class which keeps the blob alive if the URL is a blob URL.
class URLKeepingBlobAlive {
public:
    URLKeepingBlobAlive() = default;
    URLKeepingBlobAlive(const URL&, const std::optional<SecurityOriginData>& = std::nullopt);
    WEBCORE_EXPORT ~URLKeepingBlobAlive();

    URLKeepingBlobAlive(URLKeepingBlobAlive&&) = default;
    URLKeepingBlobAlive& operator=(URLKeepingBlobAlive&&);

    URLKeepingBlobAlive(const URLKeepingBlobAlive&) = delete;
    URLKeepingBlobAlive& operator=(const URLKeepingBlobAlive&) = delete;

    operator const URL&() const { return m_url; }
    const URL& url() const { return m_url; }
    bool isEmpty() const { return m_url.isEmpty(); }
    std::optional<SecurityOriginData> topOrigin() const { return m_topOrigin; }

    void clear();

    // We do not introduce a && version since it might break the register/unregister balance.
    WEBCORE_EXPORT URLKeepingBlobAlive WARN_UNUSED_RETURN isolatedCopy() const;

private:
    void registerBlobURLHandleIfNecessary();
    void unregisterBlobURLHandleIfNecessary();

    URL m_url;
    Markable<SecurityOriginData, SecurityOriginDataMarkableTraits> m_topOrigin;
};

} // namespace WebCore
