/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003, 2006, 2007, 2008, 2009, 2010 Apple Inc. All rights reserved.
 *  Copyright (C) 2007 Cameron Zwarich (cwzwarich@uwaterloo.ca)
 *  Copyright (C) 2007 Maks Orlovich
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

#include "JSCJSValue.h"
#include <unicode/uchar.h>

namespace JSC {

class ArgList;
class CallFrame;
class JSObject;

// FIXME: These functions should really be in JSGlobalObject.cpp, but putting them there
// is a 0.5% reduction.

extern const ASCIILiteral ObjectProtoCalledOnNullOrUndefinedError;
extern const ASCIILiteral RestrictedPropertyAccessError;

JSC_DECLARE_HOST_FUNCTION(globalFuncEval);
JSC_DECLARE_HOST_FUNCTION(globalFuncParseInt);
JSC_DECLARE_HOST_FUNCTION(globalFuncParseFloat);
JSC_DECLARE_HOST_FUNCTION(globalFuncDecodeURI);
JSC_DECLARE_HOST_FUNCTION(globalFuncDecodeURIComponent);
JSC_DECLARE_HOST_FUNCTION(globalFuncEncodeURI);
JSC_DECLARE_HOST_FUNCTION(globalFuncEncodeURIComponent);
JSC_DECLARE_HOST_FUNCTION(globalFuncEscape);
JSC_DECLARE_HOST_FUNCTION(globalFuncUnescape);
JSC_DECLARE_HOST_FUNCTION(globalFuncThrowTypeError);
JSC_DECLARE_HOST_FUNCTION(globalFuncThrowTypeErrorArgumentsCalleeAndCaller);
JSC_DECLARE_HOST_FUNCTION(globalFuncMakeTypeError);
JSC_DECLARE_HOST_FUNCTION(globalFuncProtoGetter);
JSC_DECLARE_HOST_FUNCTION(globalFuncProtoSetter);
JSC_DECLARE_HOST_FUNCTION(globalFuncSetPrototypeDirect);
JSC_DECLARE_HOST_FUNCTION(globalFuncSetPrototypeDirectOrThrow);
JSC_DECLARE_HOST_FUNCTION(globalFuncHostPromiseRejectionTracker);
JSC_DECLARE_HOST_FUNCTION(globalFuncBuiltinLog);
JSC_DECLARE_HOST_FUNCTION(globalFuncBuiltinDescribe);
JSC_DECLARE_HOST_FUNCTION(globalFuncImportMapStatus);
JSC_DECLARE_HOST_FUNCTION(globalFuncImportModule);
JSC_DECLARE_HOST_FUNCTION(globalFuncCopyDataProperties);
JSC_DECLARE_HOST_FUNCTION(globalFuncCloneObject);
JSC_DECLARE_HOST_FUNCTION(globalFuncHandleNegativeProxyHasTrapResult);
JSC_DECLARE_HOST_FUNCTION(globalFuncHandlePositiveProxySetTrapResult);
JSC_DECLARE_HOST_FUNCTION(globalFuncHandleProxyGetTrapResult);
JSC_DECLARE_HOST_FUNCTION(globalFuncIsNaN);
JSC_DECLARE_HOST_FUNCTION(globalFuncToIntegerOrInfinity);
JSC_DECLARE_HOST_FUNCTION(globalFuncToLength);
JSC_DECLARE_HOST_FUNCTION(globalFuncSpeciesGetter);

JS_EXPORT_PRIVATE double jsToNumber(StringView);

} // namespace JSC
