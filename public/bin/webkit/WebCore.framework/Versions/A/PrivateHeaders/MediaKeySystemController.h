/*
 * Copyright (C) 2021 Igalia S.L.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(ENCRYPTED_MEDIA)

#include "MediaKeySystemClient.h"
#include "Supplementable.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class MediaKeySystemRequest;

class MediaKeySystemController : public Supplement<Page> {
    WTF_MAKE_TZONE_ALLOCATED(MediaKeySystemController);
    WTF_MAKE_NONCOPYABLE(MediaKeySystemController);
public:
    explicit MediaKeySystemController(MediaKeySystemClient&);
    ~MediaKeySystemController();

    void requestMediaKeySystem(MediaKeySystemRequest&);
    void cancelMediaKeySystemRequest(MediaKeySystemRequest&);

    void logRequestMediaKeySystemDenial(Document&);

    WEBCORE_EXPORT static ASCIILiteral supplementName();
    static MediaKeySystemController* from(Page*);

private:
    WeakPtr<MediaKeySystemClient> m_client;
};

inline void MediaKeySystemController::requestMediaKeySystem(MediaKeySystemRequest& request)
{
    if (m_client)
        m_client->requestMediaKeySystem(request);
}

inline void MediaKeySystemController::cancelMediaKeySystemRequest(MediaKeySystemRequest& request)
{
    if (m_client)
        m_client->cancelMediaKeySystemRequest(request);
}

} // namespace WebCore

#endif // ENABLE(ENCRYPTED_MEDIA)
