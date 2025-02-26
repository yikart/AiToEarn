/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
 * Copyright (c) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ScriptCallStack.h"
#include <wtf/Forward.h>

namespace JSC {
class CallFrame;
class Exception;
class JSGlobalObject;
class JSValue;
}

namespace Inspector {

class ScriptArguments;

// FIXME: The subtle differences between these should be eliminated.
JS_EXPORT_PRIVATE Ref<ScriptCallStack> createScriptCallStack(JSC::JSGlobalObject*, size_t maxStackSize = ScriptCallStack::maxCallStackSizeToCapture);
JS_EXPORT_PRIVATE Ref<ScriptCallStack> createScriptCallStackForConsole(JSC::JSGlobalObject*, size_t maxStackSize = ScriptCallStack::maxCallStackSizeToCapture);
JS_EXPORT_PRIVATE Ref<ScriptCallStack> createScriptCallStackFromException(JSC::JSGlobalObject*, JSC::Exception*, size_t maxStackSize = ScriptCallStack::maxCallStackSizeToCapture);
JS_EXPORT_PRIVATE Ref<ScriptArguments> createScriptArguments(JSC::JSGlobalObject*, JSC::CallFrame*, unsigned skipArgumentCount);

} // namespace Inspector
