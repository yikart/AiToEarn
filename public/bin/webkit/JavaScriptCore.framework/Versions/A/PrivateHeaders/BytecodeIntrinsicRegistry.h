/*
 * Copyright (C) 2015 Yusuke Suzuki <utatane.tea@gmail.com>.
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
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

#include "Identifier.h"
#include <wtf/Noncopyable.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class CommonIdentifiers;
class BytecodeGenerator;
class BytecodeIntrinsicNode;
class RegisterID;
enum class LinkTimeConstant : int32_t;

#define JSC_COMMON_BYTECODE_INTRINSIC_FUNCTIONS_EACH_NAME(macro) \
    macro(argument) \
    macro(argumentCount) \
    macro(arrayPush) \
    macro(getByIdDirect) \
    macro(getByIdDirectPrivate) \
    macro(getByValWithThis) \
    macro(getPrototypeOf) \
    macro(getPromiseInternalField) \
    macro(getGeneratorInternalField) \
    macro(getIteratorHelperInternalField) \
    macro(getAsyncFromSyncIteratorInternalField) \
    macro(getAsyncGeneratorInternalField) \
    macro(getAbstractModuleRecordInternalField) \
    macro(getArrayIteratorInternalField) \
    macro(getStringIteratorInternalField) \
    macro(getMapIteratorInternalField) \
    macro(getSetIteratorInternalField) \
    macro(getRegExpStringIteratorInternalField) \
    macro(getProxyInternalField) \
    macro(getWrapForValidIteratorInternalField) \
    macro(idWithProfile) \
    macro(isAsyncFromSyncIterator) \
    macro(isObject) \
    macro(isCallable) \
    macro(isConstructor) \
    macro(isJSArray) \
    macro(isProxyObject) \
    macro(isDerivedArray) \
    macro(isGenerator) \
    macro(isIteratorHelper) \
    macro(isAsyncGenerator) \
    macro(isPromise) \
    macro(isRegExpObject) \
    macro(isMap) \
    macro(isSet) \
    macro(isShadowRealm) \
    macro(isStringIterator) \
    macro(isArrayIterator) \
    macro(isMapIterator) \
    macro(isSetIterator) \
    macro(isUndefinedOrNull) \
    macro(isWrapForValidIterator) \
    macro(isRegExpStringIterator) \
    macro(tailCallForwardArguments) \
    macro(throwTypeError) \
    macro(throwRangeError) \
    macro(throwOutOfMemoryError) \
    macro(tryGetById) \
    macro(tryGetByIdWithWellKnownSymbol) \
    macro(putByIdDirect) \
    macro(putByIdDirectPrivate) \
    macro(putByValDirect) \
    macro(putByValWithThisSloppy) \
    macro(putByValWithThisStrict) \
    macro(putPromiseInternalField) \
    macro(putGeneratorInternalField) \
    macro(putAsyncGeneratorInternalField) \
    macro(putArrayIteratorInternalField) \
    macro(putStringIteratorInternalField) \
    macro(putMapIteratorInternalField) \
    macro(putSetIteratorInternalField) \
    macro(putRegExpStringIteratorInternalField) \
    macro(superSamplerBegin) \
    macro(superSamplerEnd) \
    macro(toNumber) \
    macro(toString) \
    macro(toPropertyKey) \
    macro(toObject) \
    macro(toThis) \
    macro(mustValidateResultOfProxyGetAndSetTraps) \
    macro(mustValidateResultOfProxyTrapsExceptGetAndSet) \
    macro(newArrayWithSize) \
    macro(newArrayWithSpecies) \
    macro(newPromise) \
    macro(iteratorGenericClose) \
    macro(iteratorGenericNext) \
    macro(ifAbruptCloseIterator) \
    macro(createPromise) \

#define JSC_COMMON_BYTECODE_INTRINSIC_CONSTANTS_EACH_NAME(macro) \
    JSC_COMMON_BYTECODE_INTRINSIC_CONSTANTS_SIMPLE_EACH_NAME(macro) \
    JSC_COMMON_BYTECODE_INTRINSIC_CONSTANTS_CUSTOM_EACH_NAME(macro) \

#define JSC_COMMON_BYTECODE_INTRINSIC_CONSTANTS_SIMPLE_EACH_NAME(macro) \
    macro(undefined) \
    macro(Infinity) \
    macro(iterationKindKey) \
    macro(iterationKindValue) \
    macro(iterationKindEntries) \
    macro(MAX_ARRAY_INDEX) \
    macro(MAX_STRING_LENGTH) \
    macro(MAX_SAFE_INTEGER) \
    macro(ModuleFetch) \
    macro(ModuleTranslate) \
    macro(ModuleInstantiate) \
    macro(ModuleSatisfy) \
    macro(ModuleLink) \
    macro(ModuleReady) \
    macro(promiseRejectionReject) \
    macro(promiseRejectionHandle) \
    macro(promiseStatePending) \
    macro(promiseStateFulfilled) \
    macro(promiseStateRejected) \
    macro(promiseStateMask) \
    macro(promiseFlagsIsHandled) \
    macro(promiseFlagsIsFirstResolvingFunctionCalled) \
    macro(promiseFieldFlags) \
    macro(promiseFieldReactionsOrResult) \
    macro(proxyFieldTarget) \
    macro(proxyFieldHandler) \
    macro(generatorFieldState) \
    macro(generatorFieldNext) \
    macro(generatorFieldThis) \
    macro(generatorFieldFrame) \
    macro(generatorFieldContext) \
    macro(GeneratorResumeModeNormal) \
    macro(GeneratorResumeModeThrow) \
    macro(GeneratorResumeModeReturn) \
    macro(GeneratorStateCompleted) \
    macro(GeneratorStateExecuting) \
    macro(GeneratorStateInit) \
    macro(iteratorHelperFieldGenerator) \
    macro(iteratorHelperFieldUnderlyingIterator) \
    macro(arrayIteratorFieldIndex) \
    macro(arrayIteratorFieldIteratedObject) \
    macro(arrayIteratorFieldKind) \
    macro(mapIteratorFieldEntry) \
    macro(mapIteratorFieldIteratedObject) \
    macro(mapIteratorFieldStorage) \
    macro(mapIteratorFieldKind) \
    macro(setIteratorFieldEntry) \
    macro(setIteratorFieldIteratedObject) \
    macro(setIteratorFieldStorage) \
    macro(setIteratorFieldKind) \
    macro(stringIteratorFieldIndex) \
    macro(stringIteratorFieldIteratedString) \
    macro(asyncGeneratorFieldSuspendReason) \
    macro(asyncGeneratorFieldQueueFirst) \
    macro(asyncGeneratorFieldQueueLast) \
    macro(AsyncGeneratorStateCompleted) \
    macro(AsyncGeneratorStateExecuting) \
    macro(AsyncGeneratorStateAwaitingReturn) \
    macro(AsyncGeneratorStateSuspendedStart) \
    macro(AsyncGeneratorStateSuspendedYield) \
    macro(AsyncGeneratorSuspendReasonYield) \
    macro(AsyncGeneratorSuspendReasonAwait) \
    macro(AsyncGeneratorSuspendReasonNone) \
    macro(asyncFromSyncIteratorFieldSyncIterator) \
    macro(asyncFromSyncIteratorFieldNextMethod) \
    macro(abstractModuleRecordFieldState) \
    macro(wrapForValidIteratorFieldIteratedIterator) \
    macro(wrapForValidIteratorFieldIteratedNextMethod) \
    macro(regExpStringIteratorFieldRegExp) \
    macro(regExpStringIteratorFieldString) \
    macro(regExpStringIteratorFieldGlobal) \
    macro(regExpStringIteratorFieldFullUnicode) \
    macro(regExpStringIteratorFieldDone) \


#define JSC_COMMON_BYTECODE_INTRINSIC_CONSTANTS_CUSTOM_EACH_NAME(macro) \
    macro(orderedHashTableSentinel)

class BytecodeIntrinsicRegistry {
    WTF_MAKE_NONCOPYABLE(BytecodeIntrinsicRegistry);
    WTF_MAKE_TZONE_ALLOCATED(BytecodeIntrinsicRegistry);
public:
    explicit BytecodeIntrinsicRegistry(VM&);

    typedef RegisterID* (BytecodeIntrinsicNode::* EmitterType)(BytecodeGenerator&, RegisterID*);

    enum class Type : uint8_t {
        Emitter = 0,
        LinkTimeConstant = 1,
    };

    class Entry {
    public:
        Entry()
            : m_type(Type::Emitter)
        {
            m_emitter = nullptr;
        }

        Entry(EmitterType emitter)
            : m_type(Type::Emitter)
        {
            m_emitter = emitter;
        }

        Entry(LinkTimeConstant linkTimeConstant)
            : m_type(Type::LinkTimeConstant)
        {
            m_linkTimeConstant = linkTimeConstant;
        }

        Type type() const { return m_type; }
        LinkTimeConstant linkTimeConstant() const { return m_linkTimeConstant; }
        EmitterType emitter() const { return m_emitter; }

    private:
        union {
            EmitterType m_emitter;
            LinkTimeConstant m_linkTimeConstant;
        };
        Type m_type;
    };

    std::optional<Entry> lookup(const Identifier&) const;

#define JSC_DECLARE_BYTECODE_INTRINSIC_CONSTANT_GENERATORS(name) JSValue name##Value(BytecodeGenerator&);
    JSC_COMMON_BYTECODE_INTRINSIC_CONSTANTS_EACH_NAME(JSC_DECLARE_BYTECODE_INTRINSIC_CONSTANT_GENERATORS)
#undef JSC_DECLARE_BYTECODE_INTRINSIC_CONSTANT_GENERATORS

private:
    VM& m_vm;
    MemoryCompactLookupOnlyRobinHoodHashMap<RefPtr<UniquedStringImpl>, Entry, IdentifierRepHash> m_bytecodeIntrinsicMap;

#define JSC_DECLARE_BYTECODE_INTRINSIC_CONSTANT_GENERATORS(name) Strong<Unknown> m_##name;
    JSC_COMMON_BYTECODE_INTRINSIC_CONSTANTS_SIMPLE_EACH_NAME(JSC_DECLARE_BYTECODE_INTRINSIC_CONSTANT_GENERATORS)
#undef JSC_DECLARE_BYTECODE_INTRINSIC_CONSTANT_GENERATORS
};

} // namespace JSC
