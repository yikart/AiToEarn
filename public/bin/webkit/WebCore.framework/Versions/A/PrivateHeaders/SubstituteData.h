/**
 * Copyright (C) 2007 Apple Inc. All rights reserved.
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

#include "ResourceResponse.h"
#include "SharedBuffer.h"
#include <wtf/URL.h>

namespace WebCore {

enum class SessionHistoryVisibility : bool { Visible, Hidden };

class SubstituteData {
public:
    using SessionHistoryVisibility = WebCore::SessionHistoryVisibility;

    SubstituteData() = default;

    SubstituteData(RefPtr<FragmentedSharedBuffer>&& content, const URL& failingURL, const ResourceResponse& response, SessionHistoryVisibility shouldRevealToSessionHistory)
        : m_content(WTFMove(content))
        , m_failingURL(failingURL)
        , m_response(response)
        , m_shouldRevealToSessionHistory(shouldRevealToSessionHistory)
    {
    }

    bool isValid() const { return m_content != nullptr; }
    SessionHistoryVisibility shouldRevealToSessionHistory() const { return m_shouldRevealToSessionHistory; }

    const RefPtr<FragmentedSharedBuffer>& content() const { return m_content; }
    const String& mimeType() const { return m_response.mimeType(); }
    const String& textEncoding() const { return m_response.textEncodingName(); }
    const URL& failingURL() const { return m_failingURL; }
    const ResourceResponse& response() const { return m_response; }

private:
    RefPtr<FragmentedSharedBuffer> m_content;
    URL m_failingURL;
    ResourceResponse m_response;
    SessionHistoryVisibility m_shouldRevealToSessionHistory { SessionHistoryVisibility::Hidden };
};

} // namespace WebCore
