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

#include "ActiveDOMObject.h"
#include "IDLTypes.h"
#include "JSDOMPromiseDeferredForward.h"
#include "MediaKeySystemRequestIdentifier.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/Identified.h>
#include <wtf/ObjectIdentifier.h>
#include <wtf/UniqueRef.h>

namespace WebCore {

class SecurityOrigin;
class MediaKeySystem;

template <typename IDLType> class DOMPromiseDeferred;

class MediaKeySystemRequest : public RefCounted<MediaKeySystemRequest>, public ActiveDOMObject, public Identified<MediaKeySystemRequestIdentifier> {
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    WEBCORE_EXPORT static Ref<MediaKeySystemRequest> create(Document&, const String& keySystem, Ref<DeferredPromise>&&);
    virtual ~MediaKeySystemRequest();

    void setAllowCallback(CompletionHandler<void(Ref<DeferredPromise>&&)>&& callback) { m_allowCompletionHandler = WTFMove(callback); }
    WEBCORE_EXPORT void start();

    WEBCORE_EXPORT void allow();
    WEBCORE_EXPORT void deny(const String& errorMessage = emptyString());

    WEBCORE_EXPORT SecurityOrigin* topLevelDocumentOrigin() const;
    WEBCORE_EXPORT Document* document() const;

    const String keySystem() const { return m_keySystem; }

private:
    MediaKeySystemRequest(Document&, const String& keySystem, Ref<DeferredPromise>&&);

    // ActiveDOMObject.
    void stop() final;

    String m_keySystem;
    Ref<DeferredPromise> m_promise;

    CompletionHandler<void(Ref<DeferredPromise>&&)> m_allowCompletionHandler;
};

} // namespace WebCore

#endif // ENABLE(ENCRYPTED_MEDIA)
