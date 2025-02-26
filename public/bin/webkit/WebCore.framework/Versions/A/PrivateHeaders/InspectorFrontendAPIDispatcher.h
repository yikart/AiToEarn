/*
 * Copyright (C) 2014-2021 Apple Inc. All rights reserved.
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

#include "ExceptionDetails.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Expected.h>
#include <wtf/JSONValues.h>
#include <wtf/RefCounted.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace JSC {
class JSValue;
}

namespace WebCore {

class DOMPromise;
class JSDOMGlobalObject;
class Page;

class InspectorFrontendAPIDispatcher final
    : public RefCounted<InspectorFrontendAPIDispatcher>
    , public CanMakeWeakPtr<InspectorFrontendAPIDispatcher> {
public:
    enum class EvaluationError { ExecutionSuspended, ContextDestroyed, InternalError };
    using ValueOrException = Expected<JSC::JSValue, ExceptionDetails>;
    using EvaluationResult = Expected<ValueOrException, EvaluationError>;
    using EvaluationResultHandler = CompletionHandler<void(EvaluationResult)>;

    enum class UnsuspendSoon : bool { No, Yes };
    
    WEBCORE_EXPORT ~InspectorFrontendAPIDispatcher();

    static Ref<InspectorFrontendAPIDispatcher> create(Page& page)
    {
        return adoptRef(*new InspectorFrontendAPIDispatcher(page));
    }

    WEBCORE_EXPORT void reset();
    WEBCORE_EXPORT void frontendLoaded();

    // If it's not currently safe to evaluate JavaScript on the frontend page, the
    // dispatcher will become suspended and dispatch any queued evaluations when unsuspended.
    WEBCORE_EXPORT void suspend(UnsuspendSoon = UnsuspendSoon::No);
    WEBCORE_EXPORT void unsuspend();
    bool isSuspended() const { return m_suspended; }

    EvaluationResult dispatchCommandWithResultSync(const String& command, Vector<Ref<JSON::Value>>&& arguments = { });
    WEBCORE_EXPORT void dispatchCommandWithResultAsync(const String& command, Vector<Ref<JSON::Value>>&& arguments = { }, EvaluationResultHandler&& handler = { });

    // Used to forward messages from the backend connection to the frontend.
    WEBCORE_EXPORT void dispatchMessageAsync(const String& message);

    WEBCORE_EXPORT void evaluateExpressionForTesting(const String&);
    
    // Convenience method to obtain a JSDOMGlobalObject for the frontend page.
    // This is used to convert between C++ values and frontend JSC::JSValue objects.
    WEBCORE_EXPORT JSDOMGlobalObject* frontendGlobalObject();
private:
    WEBCORE_EXPORT InspectorFrontendAPIDispatcher(Page&);

    void evaluateOrQueueExpression(const String&, EvaluationResultHandler&& handler = { });
    void evaluateQueuedExpressions();
    void invalidateQueuedExpressions();
    void invalidatePendingResponses();
    ValueOrException evaluateExpression(const String&);

    WeakPtr<Page> m_frontendPage;
    Vector<std::pair<String, EvaluationResultHandler>> m_queuedEvaluations;
    HashMap<Ref<DOMPromise>, EvaluationResultHandler> m_pendingResponses;
    bool m_frontendLoaded { false };
    bool m_suspended { false };
};

} // namespace WebCore
