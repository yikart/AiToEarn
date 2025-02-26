/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
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

#include "ExceptionOr.h"
#include "ScriptWrappable.h"
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
class JSValue;
}

namespace WebCore {

class IDBKey;
class ScriptExecutionContext;

class IDBKeyRange final : public ScriptWrappable, public RefCounted<IDBKeyRange> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(IDBKeyRange);
public:
    static Ref<IDBKeyRange> create(RefPtr<IDBKey>&& lower, RefPtr<IDBKey>&& upper, bool isLowerOpen, bool isUpperOpen);
    static Ref<IDBKeyRange> create(RefPtr<IDBKey>&&);
    ~IDBKeyRange();

    IDBKey* lower() const { return m_lower.get(); }
    IDBKey* upper() const { return m_upper.get(); }
    bool lowerOpen() const { return m_isLowerOpen; }
    bool upperOpen() const { return m_isUpperOpen; }

    static ExceptionOr<Ref<IDBKeyRange>> only(RefPtr<IDBKey>&& value);
    static ExceptionOr<Ref<IDBKeyRange>> only(JSC::JSGlobalObject&, JSC::JSValue key);

    static ExceptionOr<Ref<IDBKeyRange>> lowerBound(JSC::JSGlobalObject&, JSC::JSValue bound, bool open);
    static ExceptionOr<Ref<IDBKeyRange>> upperBound(JSC::JSGlobalObject&, JSC::JSValue bound, bool open);

    static ExceptionOr<Ref<IDBKeyRange>> bound(JSC::JSGlobalObject&, JSC::JSValue lower, JSC::JSValue upper, bool lowerOpen, bool upperOpen);

    ExceptionOr<bool> includes(JSC::JSGlobalObject&, JSC::JSValue key);

    WEBCORE_EXPORT bool isOnlyKey() const;

private:
    IDBKeyRange(RefPtr<IDBKey>&& lower, RefPtr<IDBKey>&& upper, bool isLowerOpen, bool isUpperOpen);

    RefPtr<IDBKey> m_lower;
    RefPtr<IDBKey> m_upper;
    bool m_isLowerOpen;
    bool m_isUpperOpen;
};

} // namespace WebCore
