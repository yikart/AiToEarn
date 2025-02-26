/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#include "JSPromise.h"

namespace JSC {

class JSFunction;

// JSInternalPromise is completely separated instance from the JSPromise.
// Since its prototype and constructor are different from the exposed Promises' ones,
// all the user modification onto the exposed Promise does not have effect on JSInternalPromise.
//
// e.g.
//     Replacing Promise.prototype.then with the user-customized one does not effect on JSInternalPromise.
//
// CAUTION: Must not leak the JSInternalPromise to the user space to keep its integrity.
class JSInternalPromise final : public JSPromise {
public:
    typedef JSPromise Base;

    JS_EXPORT_PRIVATE static JSInternalPromise* create(VM&, Structure*);
    static JSInternalPromise* createWithInitialValues(VM&, Structure*);
    static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_EXPORT_INFO;

    JS_EXPORT_PRIVATE JSInternalPromise* then(JSGlobalObject*, JSFunction* = nullptr, JSFunction* = nullptr);

    JS_EXPORT_PRIVATE JSInternalPromise* rejectWithCaughtException(JSGlobalObject*, ThrowScope&);

private:
    JSInternalPromise(VM&, Structure*);
};

} // namespace JSC
