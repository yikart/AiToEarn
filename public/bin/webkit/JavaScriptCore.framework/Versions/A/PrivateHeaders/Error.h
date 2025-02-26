/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2024 Apple Inc. All rights reserved.
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

#include "ErrorInstance.h"
#include "ErrorType.h"
#include "Exception.h"
#include "InternalFunction.h"
#include "JSObject.h"
#include "LineColumn.h"
#include "ThrowScope.h"
#include <stdint.h>


namespace JSC {

class CallFrame;
class VM;
class JSGlobalObject;
class JSObject;
class SourceCode;
class Structure;

JSObject* createError(JSGlobalObject*, const String&, ErrorInstance::SourceAppender);
JSObject* createEvalError(JSGlobalObject*, const String&, ErrorInstance::SourceAppender);
JSObject* createRangeError(JSGlobalObject*, const String&, ErrorInstance::SourceAppender);
JSObject* createReferenceError(JSGlobalObject*, const String&, ErrorInstance::SourceAppender);
JSObject* createSyntaxError(JSGlobalObject*, const String&, ErrorInstance::SourceAppender);
JSObject* createTypeError(JSGlobalObject*, const String&, ErrorInstance::SourceAppender, RuntimeType);
JSObject* createNotEnoughArgumentsError(JSGlobalObject*, ErrorInstance::SourceAppender);
JSObject* createURIError(JSGlobalObject*, const String&, ErrorInstance::SourceAppender);

JS_EXPORT_PRIVATE JSObject* createError(JSGlobalObject*, const String&);
JS_EXPORT_PRIVATE JSObject* createEvalError(JSGlobalObject*, const String&);
JS_EXPORT_PRIVATE JSObject* createRangeError(JSGlobalObject*, const String&);
JS_EXPORT_PRIVATE JSObject* createReferenceError(JSGlobalObject*, const String&);
JS_EXPORT_PRIVATE JSObject* createSyntaxError(JSGlobalObject*, const String&);
JS_EXPORT_PRIVATE JSObject* createSyntaxError(JSGlobalObject*);
JS_EXPORT_PRIVATE JSObject* createTypeError(JSGlobalObject*);
JS_EXPORT_PRIVATE JSObject* createTypeError(JSGlobalObject*, const String&);
JS_EXPORT_PRIVATE JSObject* createNotEnoughArgumentsError(JSGlobalObject*);
JS_EXPORT_PRIVATE JSObject* createURIError(JSGlobalObject*, const String&);
JS_EXPORT_PRIVATE JSObject* createOutOfMemoryError(JSGlobalObject*);
JS_EXPORT_PRIVATE JSObject* createOutOfMemoryError(JSGlobalObject*, const String&);

JS_EXPORT_PRIVATE JSObject* createError(JSGlobalObject*, ErrorType, const String&);
JS_EXPORT_PRIVATE JSObject* createError(JSGlobalObject*, ErrorTypeWithExtension, const String&);

std::unique_ptr<Vector<StackFrame>> getStackTrace(VM&, JSObject*, bool useCurrentFrame, JSCell* ownerOfCallLinkInfo = nullptr, CallLinkInfo* = nullptr);
std::tuple<CodeBlock*, BytecodeIndex> getBytecodeIndex(VM&, CallFrame*);
bool getLineColumnAndSource(VM&, Vector<StackFrame>* stackTrace, LineColumn&, String& sourceURL);
bool addErrorInfo(VM&, Vector<StackFrame>*, JSObject*);
JS_EXPORT_PRIVATE void addErrorInfo(JSGlobalObject*, JSObject*, bool);
JSObject* addErrorInfo(VM&, JSObject* error, int line, const SourceCode&);

// https://github.com/tc39/proposal-shadowrealm/pull/382
//
// When an crosses the ShadowRealm barrier, it is converted to a TypeError,
// without invoking any observable operations. It attempts to maintain the
// error message of the original error, if possible, and may include additional
// information.
JSObject* createTypeErrorCopy(JSGlobalObject*, JSValue error);

// Methods to throw Errors.

// Convenience wrappers, create an throw an exception with a default message.
JS_EXPORT_PRIVATE Exception* throwConstructorCannotBeCalledAsFunctionTypeError(JSGlobalObject*, ThrowScope&, ASCIILiteral constructorName);
JS_EXPORT_PRIVATE Exception* throwTypeError(JSGlobalObject*, ThrowScope&);
JS_EXPORT_PRIVATE Exception* throwTypeError(JSGlobalObject*, ThrowScope&, ASCIILiteral errorMessage);
JS_EXPORT_PRIVATE Exception* throwTypeError(JSGlobalObject*, ThrowScope&, const String& errorMessage);
JS_EXPORT_PRIVATE Exception* throwSyntaxError(JSGlobalObject*, ThrowScope&);
JS_EXPORT_PRIVATE Exception* throwSyntaxError(JSGlobalObject*, ThrowScope&, const String& errorMessage);
inline Exception* throwRangeError(JSGlobalObject* globalObject, ThrowScope& scope, const String& errorMessage) { return throwException(globalObject, scope, createRangeError(globalObject, errorMessage)); }

JS_EXPORT_PRIVATE String makeDOMAttributeGetterTypeErrorMessage(const char* interfaceName, const String& attributeName);
JS_EXPORT_PRIVATE String makeDOMAttributeSetterTypeErrorMessage(const char* interfaceName, const String& attributeName);

JS_EXPORT_PRIVATE JSValue throwDOMAttributeGetterTypeError(JSGlobalObject*, ThrowScope&, const ClassInfo*, PropertyName);
JS_EXPORT_PRIVATE JSValue throwDOMAttributeSetterTypeError(JSGlobalObject*, ThrowScope&, const ClassInfo*, PropertyName);

// Convenience wrappers, wrap result as an EncodedJSValue.
inline void throwVMError(JSGlobalObject* globalObject, ThrowScope& scope, Exception* exception) { throwException(globalObject, scope, exception); }
inline EncodedJSValue throwVMError(JSGlobalObject* globalObject, ThrowScope& scope, JSValue error) { return JSValue::encode(throwException(globalObject, scope, error)); }
inline EncodedJSValue throwVMError(JSGlobalObject* globalObject, ThrowScope& scope, const String& errorMessage) { return JSValue::encode(throwException(globalObject, scope, createError(globalObject, errorMessage))); }
inline EncodedJSValue throwVMTypeError(JSGlobalObject* globalObject, ThrowScope& scope) { return JSValue::encode(throwTypeError(globalObject, scope)); }
inline EncodedJSValue throwVMTypeError(JSGlobalObject* globalObject, ThrowScope& scope, ASCIILiteral errorMessage) { return JSValue::encode(throwTypeError(globalObject, scope, errorMessage)); }
inline EncodedJSValue throwVMTypeError(JSGlobalObject* globalObject, ThrowScope& scope, const String& errorMessage) { return JSValue::encode(throwTypeError(globalObject, scope, errorMessage)); }
inline EncodedJSValue throwVMRangeError(JSGlobalObject* globalObject, ThrowScope& scope, const String& errorMessage) { return JSValue::encode(throwRangeError(globalObject, scope, errorMessage)); }
inline EncodedJSValue throwVMDOMAttributeGetterTypeError(JSGlobalObject* globalObject, ThrowScope& scope, const ClassInfo* classInfo, PropertyName propertyName) { return JSValue::encode(throwDOMAttributeGetterTypeError(globalObject, scope, classInfo, propertyName)); }
inline EncodedJSValue throwVMDOMAttributeSetterTypeError(JSGlobalObject* globalObject, ThrowScope& scope, const ClassInfo* classInfo, PropertyName propertyName) { return JSValue::encode(throwDOMAttributeSetterTypeError(globalObject, scope, classInfo, propertyName)); }

} // namespace JSC
