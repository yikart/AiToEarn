/*
 *  Copyright (C) 2007 Eric Seidel <eric@webkit.org>
 *  Copyright (C) 2007-2023 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include <wtf/Forward.h>

namespace JSC {

class Identifier;
class JSGlobalObject;
class JSInternalPromise;
class JSModuleLoader;
class JSModuleRecord;
class JSObject;
class JSPromise;
class JSString;
class JSValue;
class Microtask;
class RuntimeFlags;
class SourceOrigin;
class Structure;

enum class CompilationType;
enum class ScriptExecutionStatus;

enum class JSPromiseRejectionOperation : unsigned {
    Reject, // When a promise is rejected without any handlers.
    Handle, // When a handler is added to a rejected promise for the first time.
};

struct GlobalObjectMethodTable {
    bool (*supportsRichSourceInfo)(const JSGlobalObject*);
    bool (*shouldInterruptScript)(const JSGlobalObject*);
    RuntimeFlags (*javaScriptRuntimeFlags)(const JSGlobalObject*);
    void (*queueMicrotaskToEventLoop)(JSGlobalObject&, Ref<Microtask>&&);
    bool (*shouldInterruptScriptBeforeTimeout)(const JSGlobalObject*);

    JSInternalPromise* (*moduleLoaderImportModule)(JSGlobalObject*, JSModuleLoader*, JSString*, JSValue, const SourceOrigin&);
    Identifier (*moduleLoaderResolve)(JSGlobalObject*, JSModuleLoader*, JSValue, JSValue, JSValue);
    JSInternalPromise* (*moduleLoaderFetch)(JSGlobalObject*, JSModuleLoader*, JSValue, JSValue, JSValue);
    JSObject* (*moduleLoaderCreateImportMetaProperties)(JSGlobalObject*, JSModuleLoader*, JSValue, JSModuleRecord*, JSValue);
    JSValue (*moduleLoaderEvaluate)(JSGlobalObject*, JSModuleLoader*, JSValue key, JSValue moduleRecordValue, JSValue scriptFetcher, JSValue awaitedValue, JSValue resumeMode);

    void (*promiseRejectionTracker)(JSGlobalObject*, JSPromise*, JSPromiseRejectionOperation);
    void (*reportUncaughtExceptionAtEventLoop)(JSGlobalObject*, Exception*);

    // For most contexts this is just the global object. For JSDOMWindow, however, this is the JSDocument.
    JSObject* (*currentScriptExecutionOwner)(JSGlobalObject*);

    ScriptExecutionStatus (*scriptExecutionStatus)(JSGlobalObject*, JSObject* scriptExecutionOwner);
    void (*reportViolationForUnsafeEval)(JSGlobalObject*, const String&);
    String (*defaultLanguage)();
    JSPromise* (*compileStreaming)(JSGlobalObject*, JSValue);
    JSPromise* (*instantiateStreaming)(JSGlobalObject*, JSValue, JSObject*);
    JSGlobalObject* (*deriveShadowRealmGlobalObject)(JSGlobalObject*);
    String (*codeForEval)(JSGlobalObject*, JSValue);
    bool (*canCompileStrings)(JSGlobalObject*, CompilationType, String, const ArgList&);
    Structure* (*trustedScriptStructure)(JSGlobalObject*);
};

} // namespace JSC
