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
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/RefPtr.h>

namespace Deprecated {
class ScriptObject;
}

namespace Inspector {

class InjectedScriptModule;
class InspectorEnvironment;

class InjectedScript final : public InjectedScriptBase {
public:
    JS_EXPORT_PRIVATE InjectedScript();
    JS_EXPORT_PRIVATE InjectedScript(const InjectedScript&);
    InjectedScript(JSC::JSGlobalObject*, JSC::JSObject*, InspectorEnvironment*);
    JS_EXPORT_PRIVATE ~InjectedScript() final;

    JS_EXPORT_PRIVATE InjectedScript& operator=(const InjectedScript&);

    struct ExecuteOptions {
        String objectGroup;
        bool includeCommandLineAPI { false };
        bool returnByValue { false };
        bool generatePreview { false };
        bool saveResult { false };
        Vector<JSC::JSValue> args;
    };
    void execute(Protocol::ErrorString&, const String& functionString, ExecuteOptions&&, RefPtr<Protocol::Runtime::RemoteObject>& result, std::optional<bool>& wasThrown, std::optional<int>& savedResultIndex);

    void evaluate(Protocol::ErrorString&, const String& expression, const String& objectGroup, bool includeCommandLineAPI, bool returnByValue, bool generatePreview, bool saveResult, RefPtr<Protocol::Runtime::RemoteObject>& result, std::optional<bool>& wasThrown, std::optional<int>& savedResultIndex);
    void awaitPromise(const String& promiseObjectId, bool returnByValue, bool generatePreview, bool saveResult, AsyncCallCallback&&);
    void evaluateOnCallFrame(Protocol::ErrorString&, JSC::JSValue callFrames, const String& callFrameId, const String& expression, const String& objectGroup, bool includeCommandLineAPI, bool returnByValue, bool generatePreview, bool saveResult, RefPtr<Protocol::Runtime::RemoteObject>& result, std::optional<bool>& wasThrown, std::optional<int>& savedResultIndex);
    void callFunctionOn(const String& objectId, const String& expression, const String& arguments, bool returnByValue, bool generatePreview, bool awaitPromise, AsyncCallCallback&&);
    void getFunctionDetails(Protocol::ErrorString&, const String& functionId, RefPtr<Protocol::Debugger::FunctionDetails>& result);
    void functionDetails(Protocol::ErrorString&, JSC::JSValue, RefPtr<Protocol::Debugger::FunctionDetails>& result);
    void getPreview(Protocol::ErrorString&, const String& objectId, RefPtr<Protocol::Runtime::ObjectPreview>& result);
    void getProperties(Protocol::ErrorString&, const String& objectId, bool ownProperties, int fetchStart, int fetchCount, bool generatePreview, RefPtr<JSON::ArrayOf<Protocol::Runtime::PropertyDescriptor>>& result);
    void getDisplayableProperties(Protocol::ErrorString&, const String& objectId, int fetchStart, int fetchCount, bool generatePreview, RefPtr<JSON::ArrayOf<Protocol::Runtime::PropertyDescriptor>>& result);
    void getInternalProperties(Protocol::ErrorString&, const String& objectId, bool generatePreview, RefPtr<JSON::ArrayOf<Protocol::Runtime::InternalPropertyDescriptor>>& result);
    void getCollectionEntries(Protocol::ErrorString&, const String& objectId, const String& objectGroup, int fetchStart, int fetchCount, RefPtr<JSON::ArrayOf<Protocol::Runtime::CollectionEntry>>& entries);
    void saveResult(Protocol::ErrorString&, const String& callArgumentJSON, std::optional<int>& savedResultIndex);

    Ref<JSON::ArrayOf<Protocol::Debugger::CallFrame>> wrapCallFrames(JSC::JSValue) const;
    JS_EXPORT_PRIVATE RefPtr<Protocol::Runtime::RemoteObject> wrapObject(JSC::JSValue, const String& groupName, bool generatePreview = false) const;
    RefPtr<Protocol::Runtime::RemoteObject> wrapJSONString(const String& json, const String& groupName, bool generatePreview = false) const;
    RefPtr<Protocol::Runtime::RemoteObject> wrapTable(JSC::JSValue table, JSC::JSValue columns) const;
    RefPtr<Protocol::Runtime::ObjectPreview> previewValue(JSC::JSValue) const;

    JS_EXPORT_PRIVATE void setEventValue(JSC::JSValue);
    JS_EXPORT_PRIVATE void clearEventValue();

    void setExceptionValue(JSC::JSValue);
    void clearExceptionValue();

    JS_EXPORT_PRIVATE JSC::JSValue findObjectById(const String& objectId) const;
    JS_EXPORT_PRIVATE void inspectObject(JSC::JSValue);
    void releaseObject(const String& objectId);
    void releaseObjectGroup(const String& objectGroup);

    JSC::JSObject* createCommandLineAPIObject(JSC::JSValue callFrame = { }) const;

private:
    JSC::JSValue arrayFromVector(Vector<JSC::JSValue>&&);

    friend class InjectedScriptModule;
};

} // namespace Inspector
