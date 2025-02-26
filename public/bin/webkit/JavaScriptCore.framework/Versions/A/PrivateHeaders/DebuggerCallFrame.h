/*
 * Copyright (C) 2008, 2013, 2014 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 
#pragma once

#include "CallFrame.h"
#include "DebuggerPrimitives.h"
#include "ShadowChicken.h"
#include "Strong.h"
#include <wtf/NakedPtr.h>
#include <wtf/RefCounted.h>
#include <wtf/text/TextPosition.h>

namespace JSC {

class DebuggerScope;
class Exception;

class DebuggerCallFrame : public RefCounted<DebuggerCallFrame> {
public:
    enum Type { ProgramType, FunctionType };

    static Ref<DebuggerCallFrame> create(VM&, CallFrame*);

    JS_EXPORT_PRIVATE RefPtr<DebuggerCallFrame> callerFrame();
    JSGlobalObject* globalObject(VM&);
    JS_EXPORT_PRIVATE SourceID sourceID() const;

    // line and column are in base 0 e.g. the first line is line 0.
    int line() const { return m_position.m_line.zeroBasedInt(); }
    int column() const { return m_position.m_column.zeroBasedInt(); }
    JS_EXPORT_PRIVATE const TextPosition& position() const { return m_position; }

    JS_EXPORT_PRIVATE DebuggerScope* scope(VM&);
    JS_EXPORT_PRIVATE String functionName(VM&) const;
    JS_EXPORT_PRIVATE Type type(VM&) const;
    JS_EXPORT_PRIVATE JSValue thisValue(VM&) const;

    JSValue evaluateWithScopeExtension(VM&, const String&, JSObject* scopeExtensionObject, NakedPtr<Exception>&);

    bool isValid() const { return !!m_validMachineFrame || isTailDeleted(); }
    JS_EXPORT_PRIVATE void invalidate();

    // The following are only public for the Debugger's use only. They will be
    // made private soon. Other clients should not use these.

    JS_EXPORT_PRIVATE TextPosition currentPosition(VM&);
    JS_EXPORT_PRIVATE static TextPosition positionForCallFrame(VM&, CallFrame*);
    JS_EXPORT_PRIVATE static SourceID sourceIDForCallFrame(CallFrame*);

    bool isTailDeleted() const { return m_shadowChickenFrame.isTailDeleted; }

private:
    DebuggerCallFrame(VM&, CallFrame*, const ShadowChicken::Frame&);

    CallFrame* m_validMachineFrame;
    RefPtr<DebuggerCallFrame> m_caller;
    TextPosition m_position;
    // The DebuggerPausedScope is responsible for calling invalidate() which,
    // in turn, will clear this strong ref.
    Strong<DebuggerScope> m_scope;
    ShadowChicken::Frame m_shadowChickenFrame;
};

} // namespace JSC
