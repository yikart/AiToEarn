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

#include "InspectorProtocolObjects.h"
#include <wtf/Forward.h>
#include <wtf/RefCounted.h>

namespace Inspector {

class ScriptCallFrame;
class ScriptCallStack;

class AsyncStackTrace : public RefCounted<AsyncStackTrace> {
public:
    enum class State : uint8_t {
        Pending,
        Active,
        Dispatched,
        Canceled,
    };

    static Ref<AsyncStackTrace> create(Ref<ScriptCallStack>&&, bool singleShot, RefPtr<AsyncStackTrace> parent);

    bool isPending() const;
    bool isLocked() const;

    JS_EXPORT_PRIVATE const ScriptCallFrame& at(size_t) const;
    JS_EXPORT_PRIVATE size_t size() const;
    JS_EXPORT_PRIVATE bool topCallFrameIsBoundary() const;
    bool truncated() const { return m_truncated; }

    const RefPtr<AsyncStackTrace>& parentStackTrace() const { return m_parent; }

    void willDispatchAsyncCall(size_t maxDepth);
    void didDispatchAsyncCall();
    void didCancelAsyncCall();

    Ref<Protocol::Console::StackTrace> buildInspectorObject() const;

    JS_EXPORT_PRIVATE ~AsyncStackTrace();

private:
    AsyncStackTrace(Ref<ScriptCallStack>&&, bool, RefPtr<AsyncStackTrace>);

    void truncate(size_t maxDepth);
    void remove();

    Ref<ScriptCallStack> m_callStack;
    RefPtr<AsyncStackTrace> m_parent;
    unsigned m_childCount { 0 };
    State m_state { State::Pending };
    bool m_truncated { false };
    bool m_singleShot { true };
};

} // namespace Inspector
