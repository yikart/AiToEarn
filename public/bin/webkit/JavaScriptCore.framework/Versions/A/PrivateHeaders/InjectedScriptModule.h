/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 * Copyright (C) 2012 Google Inc. All rights reserved.
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

#include "InjectedScriptBase.h"
#include <wtf/text/WTFString.h>

namespace JSC {
class JSValue;
}

namespace Inspector {

class InjectedScript;
class InjectedScriptManager;

class InjectedScriptModule : public InjectedScriptBase {
public:
    JS_EXPORT_PRIVATE ~InjectedScriptModule() override;
    virtual JSC::JSFunction* injectModuleFunction(JSC::JSGlobalObject*) const = 0;
    virtual JSC::JSValue host(InjectedScriptManager*, JSC::JSGlobalObject*) const = 0;

protected:
    // Do not expose constructor in the child classes as well. Instead provide
    // a static factory method that would create a new instance of the class
    // and call its ensureInjected() method immediately.
    JS_EXPORT_PRIVATE explicit InjectedScriptModule(const String& name);
    void ensureInjected(InjectedScriptManager*, JSC::JSGlobalObject*);
    JS_EXPORT_PRIVATE void ensureInjected(InjectedScriptManager*, const InjectedScript&);
};

} // namespace Inspector
