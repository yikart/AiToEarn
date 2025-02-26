/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "WasmStreamingParser.h"

#if ENABLE(WEBASSEMBLY)

#include "DeferredWorkTimer.h"
#include "JSCJSValue.h"

namespace JSC {

class CallLinkInfo;
class JSGlobalObject;
class JSObject;
class JSPromise;
class VM;

namespace Wasm {

class EntryPlan;
class StreamingPlan;

class StreamingCompiler final : public StreamingParserClient, public ThreadSafeRefCounted<StreamingCompiler> {
public:
    JS_EXPORT_PRIVATE static Ref<StreamingCompiler> create(VM&, CompilerMode, JSGlobalObject*, JSPromise*, JSObject*);

    JS_EXPORT_PRIVATE ~StreamingCompiler();

    void addBytes(std::span<const uint8_t> bytes) { m_parser.addBytes(bytes); }
    JS_EXPORT_PRIVATE void finalize(JSGlobalObject*);
    JS_EXPORT_PRIVATE void fail(JSGlobalObject*, JSValue);
    JS_EXPORT_PRIVATE void cancel();

    void didCompileFunction(StreamingPlan&);

private:
    JS_EXPORT_PRIVATE StreamingCompiler(VM&, CompilerMode, JSGlobalObject*, JSPromise*, JSObject*);

    bool didReceiveFunctionData(FunctionCodeIndex, const FunctionData&) final;
    void didFinishParsing() final;
    void didComplete() WTF_REQUIRES_LOCK(m_lock);
    void completeIfNecessary() WTF_REQUIRES_LOCK(m_lock);

    VM& m_vm;
    CompilerMode m_compilerMode;
    bool m_eagerFailed WTF_GUARDED_BY_LOCK(m_lock) { false };
    bool m_finalized WTF_GUARDED_BY_LOCK(m_lock) { false };
    bool m_threadedCompilationStarted { false };
    Lock m_lock;
    unsigned m_remainingCompilationRequests { 0 };
    DeferredWorkTimer::Ticket m_ticket;
    Ref<Wasm::ModuleInformation> m_info;
    StreamingParser m_parser;
    RefPtr<EntryPlan> m_plan;
};


} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
