/*
 * Copyright (C) 2010 Google Inc. All rights reserved.
 * Copyright (C) 2014-2021 Apple Inc. All rights reserved.
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

#include "IDBKeyPath.h"
#include "IndexKey.h"
#include <wtf/Forward.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
class JSValue;
}

namespace WebCore {

class IDBIndexInfo;
class IDBKey;
class IDBKeyData;
class IDBObjectStoreInfo;
class IDBValue;
class IndexKey;
class JSDOMGlobalObject;

RefPtr<IDBKey> maybeCreateIDBKeyFromScriptValueAndKeyPath(JSC::JSGlobalObject&, JSC::JSValue, const IDBKeyPath&);
bool canInjectIDBKeyIntoScriptValue(JSC::JSGlobalObject&, JSC::JSValue, const IDBKeyPath&);
bool injectIDBKeyIntoScriptValue(JSC::JSGlobalObject&, const IDBKeyData&, JSC::JSValue, const IDBKeyPath&);

void generateIndexKeyForValue(JSC::JSGlobalObject&, const IDBIndexInfo&, JSC::JSValue, IndexKey& outKey, const std::optional<IDBKeyPath>&, const IDBKeyData&);

IndexIDToIndexKeyMap generateIndexKeyMapForValueIsolatedCopy(JSC::JSGlobalObject&, const IDBObjectStoreInfo&, const IDBKeyData&, const IDBValue&);

Ref<IDBKey> scriptValueToIDBKey(JSC::JSGlobalObject&, JSC::JSValue);

JSC::JSValue deserializeIDBValueToJSValue(JSC::JSGlobalObject&, const IDBValue&, Vector<std::pair<String, String>>&);
WEBCORE_EXPORT JSC::JSValue deserializeIDBValueToJSValue(JSC::JSGlobalObject&, const IDBValue&);
JSC::JSValue toJS(JSC::JSGlobalObject*, JSDOMGlobalObject*, const IDBValue&);
JSC::JSValue toJS(JSC::JSGlobalObject&, JSC::JSGlobalObject&, IDBKey*);
JSC::JSValue toJS(JSC::JSGlobalObject*, JSDOMGlobalObject*, const IDBKeyData&);

std::optional<JSC::JSValue> deserializeIDBValueWithKeyInjection(JSC::JSGlobalObject&, const IDBValue&, const IDBKeyData&, const std::optional<IDBKeyPath>&);

WEBCORE_EXPORT void callOnIDBSerializationThreadAndWait(Function<void(JSC::JSGlobalObject&)>&&);

}
