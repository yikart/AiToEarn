/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2019 Apple Inc. All rights reserved.
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

#include "CallData.h"
#include "Identifier.h"
#include "JSCJSValue.h"
#include "ScriptFetchParameters.h"
#include <wtf/FileSystem.h>
#include <wtf/NakedPtr.h>

namespace JSC {

class BytecodeCacheError;
class CachedBytecode;
class CallFrame;
class Exception;
class JSObject;
class ParserError;
class SourceCode;
class Symbol;
class VM;
class JSInternalPromise;

JS_EXPORT_PRIVATE bool checkSyntax(VM&, const SourceCode&, ParserError&);
JS_EXPORT_PRIVATE bool checkSyntax(JSGlobalObject*, const SourceCode&, JSValue* exception = nullptr);
JS_EXPORT_PRIVATE bool checkModuleSyntax(JSGlobalObject*, const SourceCode&, ParserError&);

JS_EXPORT_PRIVATE RefPtr<CachedBytecode> generateProgramBytecode(VM&, const SourceCode&, FileSystem::PlatformFileHandle fd, BytecodeCacheError&);
JS_EXPORT_PRIVATE RefPtr<CachedBytecode> generateModuleBytecode(VM&, const SourceCode&, FileSystem::PlatformFileHandle fd, BytecodeCacheError&);

JS_EXPORT_PRIVATE JSValue evaluate(JSGlobalObject*, const SourceCode&, JSValue thisValue, NakedPtr<Exception>& returnedException);
inline JSValue evaluate(JSGlobalObject* globalObject, const SourceCode& sourceCode, JSValue thisValue = JSValue())
{
    NakedPtr<Exception> unused;
    return evaluate(globalObject, sourceCode, thisValue, unused);
}

JS_EXPORT_PRIVATE JSValue profiledEvaluate(JSGlobalObject*, ProfilingReason, const SourceCode&, JSValue thisValue, NakedPtr<Exception>& returnedException);
inline JSValue profiledEvaluate(JSGlobalObject* globalObject, ProfilingReason reason, const SourceCode& sourceCode, JSValue thisValue = JSValue())
{
    NakedPtr<Exception> unused;
    return profiledEvaluate(globalObject, reason, sourceCode, thisValue, unused);
}

JS_EXPORT_PRIVATE JSValue evaluateWithScopeExtension(JSGlobalObject*, const SourceCode&, JSObject* scopeExtension, NakedPtr<Exception>& returnedException);

// Load the module source and evaluate it.
JS_EXPORT_PRIVATE JSInternalPromise* loadAndEvaluateModule(JSGlobalObject*, Symbol* moduleId, JSValue parameters, JSValue scriptFetcher);
JS_EXPORT_PRIVATE JSInternalPromise* loadAndEvaluateModule(JSGlobalObject*, const String& moduleName, JSValue parameters, JSValue scriptFetcher);
JS_EXPORT_PRIVATE JSInternalPromise* loadAndEvaluateModule(JSGlobalObject*, const SourceCode&, JSValue scriptFetcher);

// Fetch the module source, and instantiate the module record.
JS_EXPORT_PRIVATE JSInternalPromise* loadModule(JSGlobalObject*, const Identifier& moduleKey, JSValue parameters, JSValue scriptFetcher);
JS_EXPORT_PRIVATE JSInternalPromise* loadModule(JSGlobalObject*, const SourceCode&, JSValue scriptFetcher);

// Link and evaluate the already linked module. This function is called in a sync manner.
JS_EXPORT_PRIVATE JSValue linkAndEvaluateModule(JSGlobalObject*, const Identifier& moduleKey, JSValue scriptFetcher);

JS_EXPORT_PRIVATE JSInternalPromise* importModule(JSGlobalObject*, const Identifier& moduleName, JSValue referrer, JSValue parameters, JSValue scriptFetcher);

JS_EXPORT_PRIVATE UncheckedKeyHashMap<RefPtr<UniquedStringImpl>, String> retrieveImportAttributesFromDynamicImportOptions(JSGlobalObject*, JSValue, const Vector<RefPtr<UniquedStringImpl>>& supportedAssertions);
JS_EXPORT_PRIVATE std::optional<ScriptFetchParameters::Type> retrieveTypeImportAttribute(JSGlobalObject*, const UncheckedKeyHashMap<RefPtr<UniquedStringImpl>, String>&);

} // namespace JSC
