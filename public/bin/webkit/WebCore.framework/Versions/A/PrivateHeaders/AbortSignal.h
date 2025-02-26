/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

#include "ContextDestructionObserverInlines.h"
#include "EventTarget.h"
#include "JSValueInWrappedObject.h"
#include <wtf/Function.h>
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/WeakListHashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class AbortAlgorithm;
class ScriptExecutionContext;
class WebCoreOpaqueRoot;

class AbortSignal final : public RefCounted<AbortSignal>, public EventTarget, private ContextDestructionObserver {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(AbortSignal, WEBCORE_EXPORT);
public:
    static Ref<AbortSignal> create(ScriptExecutionContext*);
    WEBCORE_EXPORT ~AbortSignal();

    static Ref<AbortSignal> abort(JSDOMGlobalObject&, ScriptExecutionContext&, JSC::JSValue reason);
    static Ref<AbortSignal> timeout(ScriptExecutionContext&, uint64_t milliseconds);
    static Ref<AbortSignal> any(ScriptExecutionContext&, const Vector<Ref<AbortSignal>>&);

    static uint32_t addAbortAlgorithmToSignal(AbortSignal&, Ref<AbortAlgorithm>&&);
    static void removeAbortAlgorithmFromSignal(AbortSignal&, uint32_t algorithmIdentifier);

    void signalAbort(JSC::JSValue reason);
    void signalFollow(AbortSignal&);

    bool aborted() const { return m_aborted; }
    const JSValueInWrappedObject& reason() const { return m_reason; }

    bool hasActiveTimeoutTimer() const { return m_hasActiveTimeoutTimer; }
    bool hasAbortEventListener() const { return m_hasAbortEventListener; }

    using RefCounted::ref;
    using RefCounted::deref;

    using Algorithm = Function<void(JSC::JSValue reason)>;
    uint32_t addAlgorithm(Algorithm&&);
    void removeAlgorithm(uint32_t);

    bool isFollowingSignal() const { return !!m_followingSignal; }

    void throwIfAborted(JSC::JSGlobalObject&);

    using AbortSignalSet = WeakListHashSet<AbortSignal, WeakPtrImplWithEventTargetData>;
    const AbortSignalSet& sourceSignals() const { return m_sourceSignals; }
    AbortSignalSet& sourceSignals() { return m_sourceSignals; }

    bool isDependent() const { return m_isDependent; }

private:
    enum class Aborted : bool { No, Yes };
    explicit AbortSignal(ScriptExecutionContext*, Aborted = Aborted::No, JSC::JSValue reason = JSC::jsUndefined());

    void setHasActiveTimeoutTimer(bool hasActiveTimeoutTimer) { m_hasActiveTimeoutTimer = hasActiveTimeoutTimer; }

    void markAsDependent() { m_isDependent = true; }
    void addSourceSignal(AbortSignal&);
    void addDependentSignal(AbortSignal&);

    void markAborted(JSC::JSValue);
    void runAbortSteps();

    // EventTarget.
    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::AbortSignal; }
    ScriptExecutionContext* scriptExecutionContext() const final { return ContextDestructionObserver::scriptExecutionContext(); }
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }
    void eventListenersDidChange() final;

    Vector<std::pair<uint32_t, Algorithm>> m_algorithms;
    WeakPtr<AbortSignal, WeakPtrImplWithEventTargetData> m_followingSignal;
    AbortSignalSet m_sourceSignals;
    AbortSignalSet m_dependentSignals;
    JSValueInWrappedObject m_reason;
    uint32_t m_algorithmIdentifier { 0 };
    bool m_aborted { false };
    bool m_hasActiveTimeoutTimer { false };
    bool m_hasAbortEventListener { false };
    bool m_isDependent { false };
};

WebCoreOpaqueRoot root(AbortSignal*);

} // namespace WebCore
