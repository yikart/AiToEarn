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

#include "ExtendableEvent.h"
#include "FetchIdentifier.h"
#include "JSDOMPromiseDeferredForward.h"
#include "ResourceError.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Expected.h>

namespace JSC {
class JSGlobalObject;
}

namespace WebCore {

class DOMPromise;
class FetchRequest;
class FetchResponse;
class ResourceResponse;

class FetchEvent final : public ExtendableEvent {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(FetchEvent);
public:
    struct Init : ExtendableEventInit {
        RefPtr<FetchRequest> request;
        String clientId;
        String resultingClientId;
        RefPtr<DOMPromise> handled;
    };

    WEBCORE_EXPORT static Ref<FetchEvent> createForTesting(ScriptExecutionContext&);

    static Ref<FetchEvent> create(JSC::JSGlobalObject& globalObject, const AtomString& type, Init&& initializer, IsTrusted isTrusted = IsTrusted::No)
    {
        return adoptRef(*new FetchEvent(globalObject, type, WTFMove(initializer), isTrusted));
    }
    ~FetchEvent();

    ExceptionOr<void> respondWith(Ref<DOMPromise>&&);

    using ResponseCallback = CompletionHandler<void(Expected<Ref<FetchResponse>, std::optional<ResourceError>>&&)>;
    WEBCORE_EXPORT void onResponse(ResponseCallback&&);

    FetchRequest& request() { return m_request.get(); }
    const String& clientId() const { return m_clientId; }
    const String& resultingClientId() const { return m_resultingClientId; }
    DOMPromise& handled() const { return m_handled.get(); }

    bool respondWithEntered() const { return m_respondWithEntered; }

    static ResourceError createResponseError(const URL&, const String&, ResourceError::IsSanitized = ResourceError::IsSanitized::No);

    using PreloadResponsePromise = DOMPromiseProxy<IDLAny>;
    PreloadResponsePromise& preloadResponse(ScriptExecutionContext&);

    void setNavigationPreloadIdentifier(FetchIdentifier);
    WEBCORE_EXPORT void navigationPreloadIsReady(ResourceResponse&&);
    WEBCORE_EXPORT void navigationPreloadFailed(ResourceError&&);

private:
    WEBCORE_EXPORT FetchEvent(JSC::JSGlobalObject&, const AtomString&, Init&&, IsTrusted);

    void promiseIsSettled();
    void processResponse(Expected<Ref<FetchResponse>, std::optional<ResourceError>>&&);
    void respondWithError(ResourceError&&);

    Ref<FetchRequest> m_request;
    String m_clientId;
    String m_resultingClientId;

    bool m_respondWithEntered { false };
    bool m_waitToRespond { false };
    bool m_respondWithError { false };
    RefPtr<DOMPromise> m_respondPromise;
    Ref<DOMPromise> m_handled;

    ResponseCallback m_onResponse;

    Markable<FetchIdentifier> m_navigationPreloadIdentifier;
    std::unique_ptr<PreloadResponsePromise> m_preloadResponsePromise;
};

inline void FetchEvent::setNavigationPreloadIdentifier(FetchIdentifier identifier)
{
    ASSERT(!m_navigationPreloadIdentifier);
    m_navigationPreloadIdentifier = identifier;
}

} // namespace WebCore
