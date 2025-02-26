/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
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

#if ENABLE(VIDEO)

#include <wtf/RefCounted.h>

namespace WebCore {

class MediaError : public RefCounted<MediaError> {
public:
    enum Code {
        MEDIA_ERR_ABORTED = 1,
        MEDIA_ERR_NETWORK,
        MEDIA_ERR_DECODE,
        MEDIA_ERR_SRC_NOT_SUPPORTED
#if ENABLE(LEGACY_ENCRYPTED_MEDIA)
        , MEDIA_ERR_ENCRYPTED
#endif
    };

    static Ref<MediaError> create(Code code, String&& message)
    {
        return adoptRef(*new MediaError(code, WTFMove(message)));
    }

    Code code() const { return m_code; }
    const String& message() const { return m_message; }

private:
    MediaError(Code code, String&& message)
        : m_code(code)
        , m_message(WTFMove(message))
    { }

    Code m_code;
    String m_message;
};

} // namespace WebCore

#endif // ENABLE(VIDEO)
