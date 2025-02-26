/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

// The purpose of this header file is simply to #include all the types
// that we have Subspaces for so that Heap.cpp's #include list is not flooded
// with these, and that it'll be easier to discern between these Subspace types
// from other data structures needed for implementing Heap.

#include "BigIntObject.h"
#include "BooleanObject.h"
#include "BrandedStructure.h"
#include "ClonedArguments.h"
#include "DateInstance.h"
#include "DebuggerScope.h"
#include "GetterSetter.h"
#include "IntlCollator.h"
#include "IntlDateTimeFormat.h"
#include "IntlDisplayNames.h"
#include "IntlDurationFormat.h"
#include "IntlListFormat.h"
#include "IntlLocale.h"
#include "IntlNumberFormat.h"
#include "IntlPluralRules.h"
#include "IntlRelativeTimeFormat.h"
#include "IntlSegmentIterator.h"
#include "IntlSegmenter.h"
#include "IntlSegments.h"
#include "JSAPIGlobalObject.h"
#include "JSAPIValueWrapper.h"
#include "JSAPIWrapperObject.h"
#include "JSArray.h"
#include "JSArrayBuffer.h"
#include "JSArrayIterator.h"
#include "JSAsyncFromSyncIterator.h"
#include "JSAsyncGenerator.h"
#include "JSBigInt.h"
#include "JSBoundFunction.h"
#include "JSCallbackConstructor.h"
#include "JSCallbackFunction.h"
#include "JSCallbackObject.h"
#include "JSCallee.h"
#include "JSCustomGetterFunction.h"
#include "JSCustomSetterFunction.h"
#include "JSDataView.h"
#include "JSFunction.h"
#include "JSGlobalLexicalEnvironment.h"
#include "JSGlobalObject.h"
#include "JSGlobalProxy.h"
#include "JSInjectedScriptHost.h"
#include "JSIteratorHelper.h"
#include "JSJavaScriptCallFrame.h"
#include "JSMap.h"
#include "JSMapIterator.h"
#include "JSModuleNamespaceObject.h"
#include "JSModuleRecord.h"
#include "JSNativeStdFunction.h"
#include "JSPromise.h"
#include "JSPropertyNameEnumerator.h"
#include "JSRegExpStringIterator.h"
#include "JSScriptFetchParameters.h"
#include "JSScriptFetcher.h"
#include "JSSet.h"
#include "JSSetIterator.h"
#include "JSSourceCode.h"
#include "JSString.h"
#include "JSStringIterator.h"
#include "JSTemplateObjectDescriptor.h"
#include "JSTypedArrays.h"
#include "JSWebAssemblyArray.h"
#include "JSWebAssemblyException.h"
#include "JSWebAssemblyGlobal.h"
#include "JSWebAssemblyInstance.h"
#include "JSWebAssemblyMemory.h"
#include "JSWebAssemblyModule.h"
#include "JSWebAssemblyStruct.h"
#include "JSWebAssemblyTable.h"
#include "JSWebAssemblyTag.h"
#include "JSWithScope.h"
#include "JSWrapForValidIterator.h"
#include "NativeExecutable.h"
#include "ProgramExecutable.h"
#include "PropertyTable.h"
#include "ProxyRevoke.h"
#include "RegExpObject.h"
#include "ScopedArguments.h"
#include "ShadowRealmObject.h"
#include "StrictEvalActivation.h"
#include "StringObject.h"
#include "StructureChain.h"
#include "SymbolObject.h"
#include "SyntheticModuleRecord.h"
#include "TemporalCalendar.h"
#include "TemporalDuration.h"
#include "TemporalInstant.h"
#include "TemporalPlainDate.h"
#include "TemporalPlainDateTime.h"
#include "TemporalPlainTime.h"
#include "TemporalTimeZone.h"
#include "UnlinkedFunctionCodeBlock.h"
#include "UnlinkedModuleProgramCodeBlock.h"
#include "UnlinkedProgramCodeBlock.h"
#include "WebAssemblyFunction.h"
#include "WebAssemblyModuleRecord.h"
#include "WebAssemblyWrapperFunction.h"

#if JSC_OBJC_API_ENABLED
#include "ObjCCallbackFunction.h"
#endif

#ifdef JSC_GLIB_API_ENABLED
#include "JSAPIWrapperGlobalObject.h"
#include "JSCCallbackFunction.h"
#endif
