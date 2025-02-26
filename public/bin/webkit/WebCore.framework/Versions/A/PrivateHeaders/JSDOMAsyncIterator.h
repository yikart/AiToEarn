/*
 * Copyright (C) 2021-2022 Apple Inc. All rights reserved.
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

#include "JSDOMConvert.h"
#include "JSDOMIterator.h"
#include "JSDOMPromise.h"
#include "JSDOMPromiseDeferred.h"
#include <JavaScriptCore/AsyncIteratorPrototype.h>
#include <JavaScriptCore/IteratorOperations.h>
#include <JavaScriptCore/JSBoundFunction.h>
#include <JavaScriptCore/PropertySlot.h>
#include <type_traits>
#include <wtf/CompletionHandler.h>

namespace WebCore {

// https://webidl.spec.whatwg.org/#es-asynchronous-iterator-prototype-object
template<typename JSWrapper, typename IteratorTraits> class JSDOMAsyncIteratorPrototype final : public JSC::JSNonFinalObject {
public:
    using Base = JSC::JSNonFinalObject;
    using DOMWrapped = typename JSWrapper::DOMWrapped;

    template<typename CellType, JSC::SubspaceAccess>
    static JSC::GCClient::IsoSubspace* subspaceFor(JSC::VM& vm)
    {
        STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSDOMAsyncIteratorPrototype, Base);
        return &vm.plainObjectSpace();
    }

    static JSDOMAsyncIteratorPrototype* create(JSC::VM& vm, JSC::JSGlobalObject* globalObject, JSC::Structure* structure)
    {
        STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSDOMAsyncIteratorPrototype, JSDOMAsyncIteratorPrototype::Base);
        JSDOMAsyncIteratorPrototype* prototype = new (NotNull, JSC::allocateCell<JSDOMAsyncIteratorPrototype>(vm)) JSDOMAsyncIteratorPrototype(vm, structure);
        prototype->finishCreation(vm, globalObject);
        return prototype;
    }

    DECLARE_INFO;

    static JSC::Structure* createStructure(JSC::VM& vm, JSC::JSGlobalObject* globalObject, JSC::JSValue prototype)
    {
        return JSC::Structure::create(vm, globalObject, prototype, JSC::TypeInfo(JSC::ObjectType, StructureFlags), info());
    }

    static JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES next(JSC::JSGlobalObject*, JSC::CallFrame*);

private:
    JSDOMAsyncIteratorPrototype(JSC::VM& vm, JSC::Structure* structure)
        : Base(vm, structure)
    {
    }

    void finishCreation(JSC::VM&, JSC::JSGlobalObject*);
};

template<typename JSWrapper, typename IteratorTraits> class JSDOMAsyncIteratorBase : public JSDOMObject {
public:
    using Base = JSDOMObject;

    using Wrapper = JSWrapper;
    using Traits = IteratorTraits;

    using DOMWrapped = typename Wrapper::DOMWrapped;
    using Prototype = JSDOMAsyncIteratorPrototype<Wrapper, Traits>;

    DECLARE_INFO;

    static Prototype* createPrototype(JSC::VM& vm, JSC::JSGlobalObject& globalObject)
    {
        auto* structure = Prototype::createStructure(vm, &globalObject, globalObject.asyncIteratorPrototype());
        structure->setMayBePrototype(true);
        return Prototype::create(vm, &globalObject, structure);
    }

    static void createStructure(JSC::VM&, JSC::JSGlobalObject*, JSC::JSValue); // Make use of createStructure for this compile-error.
    
    JSC::JSValue next(JSC::JSGlobalObject&);
    JSC::JSPromise* runNextSteps(JSC::JSGlobalObject&);
    JSC::JSPromise* getNextIterationResult(JSC::JSGlobalObject&);

protected:
    JSDOMAsyncIteratorBase(JSC::Structure* structure, JSWrapper& iteratedObject, IterationKind kind)
        : Base(structure, *iteratedObject.globalObject())
        , m_iterator(iteratedObject.wrapped().createIterator(iteratedObject.globalObject()->scriptExecutionContext()))
        , m_kind(kind)
    {
    }

    JSC::EncodedJSValue settle(JSC::JSGlobalObject*);
    static JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES onPromiseSettled(JSC::JSGlobalObject*, JSC::CallFrame*);
    JSC::JSBoundFunction* createOnSettledFunction(JSC::JSGlobalObject*);

    JSC::EncodedJSValue fulfill(JSC::JSGlobalObject*, JSC::JSValue);
    static JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES onPromiseFulFilled(JSC::JSGlobalObject*, JSC::CallFrame*);
    JSBoundFunction* createOnFulfilledFunction(JSC::JSGlobalObject*);

    JSC::EncodedJSValue reject(JSC::JSGlobalObject*, JSC::JSValue);
    static JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES onPromiseRejected(JSC::JSGlobalObject*, JSC::CallFrame*);
    JSBoundFunction* createOnRejectedFunction(JSC::JSGlobalObject*);

    static void destroy(JSC::JSCell*);

    RefPtr<typename DOMWrapped::Iterator> m_iterator;
    IterationKind m_kind;
    RefPtr<DOMPromise> m_ongoingPromise;
};

template<typename IteratorValue, typename IteratorTraits>
inline EnableIfMap<IteratorTraits, JSC::JSValue> convertToJS(JSC::JSGlobalObject& globalObject, JSDOMGlobalObject& domGlobalObject, IteratorValue& value, IteratorTraits, IterationKind kind)
{
    JSC::VM& vm = globalObject.vm();
    Locker<JSC::JSLock> locker(vm.apiLock());
    
    switch (kind) {
    case IterationKind::Keys:
        return toJS<typename IteratorTraits::KeyType>(globalObject, domGlobalObject, value.key);
    case IterationKind::Values:
        return toJS<typename IteratorTraits::ValueType>(globalObject, domGlobalObject, value.value);
    case IterationKind::Entries:
        return jsPair<typename IteratorTraits::KeyType, typename IteratorTraits::ValueType>(globalObject, domGlobalObject, value.key, value.value);
    };

    ASSERT_NOT_REACHED();
    return { };
}

template<typename IteratorValue, typename IteratorTraits>
inline EnableIfSet<IteratorTraits, JSC::JSValue> convertToJS(JSC::JSGlobalObject& globalObject, JSDOMGlobalObject& domGlobalObject, IteratorValue& value, IteratorTraits, IterationKind kind)
{
    JSC::VM& vm = globalObject.vm();
    Locker<JSC::JSLock> locker(vm.apiLock());

    auto result = toJS<typename IteratorTraits::ValueType>(globalObject, domGlobalObject, value);
    switch (kind) {
    case IterationKind::Keys:
    case IterationKind::Values:
        return result;
    case IterationKind::Entries:
        return jsPair(globalObject, domGlobalObject, result, result);
    };

    ASSERT_NOT_REACHED();
    return { };
}

template<typename JSWrapper, typename IteratorTraits>
void JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::destroy(JSCell* cell)
{
    JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>* thisObject = static_cast<JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>*>(cell);
    thisObject->JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::~JSDOMAsyncIteratorBase();
}

template<typename JSWrapper, typename IteratorTraits>
JSC::JSValue JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::next(JSC::JSGlobalObject& lexicalGlobalObject)
{
    JSC::VM& vm = lexicalGlobalObject.vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    
    if (!m_ongoingPromise || !m_ongoingPromise->promise()) {
        auto* promise = runNextSteps(lexicalGlobalObject);
        RETURN_IF_EXCEPTION(scope, { });

        m_ongoingPromise = DOMPromise::create(*this->globalObject(), *promise);
        return m_ongoingPromise->promise();
    }

    auto afterOngoingPromiseCapability = JSC::JSPromise::createNewPromiseCapability(&lexicalGlobalObject, lexicalGlobalObject.promiseConstructor());
    RETURN_IF_EXCEPTION(scope, { });
    
    auto data = JSC::JSPromise::convertCapabilityToDeferredData(&lexicalGlobalObject, afterOngoingPromiseCapability);
    RETURN_IF_EXCEPTION(scope, { });

    auto onSettled = createOnSettledFunction(&lexicalGlobalObject);
    RETURN_IF_EXCEPTION(scope, { });

    auto* ongoingPromise = m_ongoingPromise->promise();
    ongoingPromise->performPromiseThen(&lexicalGlobalObject, onSettled, onSettled, afterOngoingPromiseCapability);
    RETURN_IF_EXCEPTION(scope, { });

    m_ongoingPromise = DOMPromise::create(*this->globalObject(), *data.promise);
    return m_ongoingPromise->promise();
}

template<typename JSWrapper, typename IteratorTraits>
JSC::JSPromise* JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::runNextSteps(JSC::JSGlobalObject& globalObject)
{
    JSC::VM& vm = globalObject.vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto nextPromiseCapability = JSC::JSPromise::createNewPromiseCapability(&globalObject, globalObject.promiseConstructor());
    RETURN_IF_EXCEPTION(scope, nullptr);

    auto data = JSC::JSPromise::convertCapabilityToDeferredData(&globalObject, nextPromiseCapability);
    RETURN_IF_EXCEPTION(scope, nullptr);

    if (!m_iterator) {
        data.promise->resolve(&globalObject, JSC::createIteratorResultObject(&globalObject, JSC::jsUndefined(), true));
        RETURN_IF_EXCEPTION(scope, nullptr);

        return data.promise;
    }

    auto nextPromise = getNextIterationResult(globalObject);
    RETURN_IF_EXCEPTION(scope, nullptr);

    auto onFulfilled = createOnFulfilledFunction(&globalObject);
    auto onRejected = createOnRejectedFunction(&globalObject);
    RETURN_IF_EXCEPTION(scope, nullptr);

    nextPromise->performPromiseThen(&globalObject, onFulfilled, onRejected, nextPromiseCapability);
    RETURN_IF_EXCEPTION(scope, nullptr);

    return data.promise;
}

template<typename JSWrapper, typename IteratorTraits>
JSC::JSPromise* JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::getNextIterationResult(JSC::JSGlobalObject& globalObject)
{
    JSC::VM& vm = JSC::getVM(&globalObject);

    auto* promise = JSC::JSPromise::create(vm, globalObject.promiseStructure());
    auto deferred = DeferredPromise::create(*this->globalObject(), *promise);
    if (!m_iterator) {
        deferred->resolve();
        return promise;
    }

    m_iterator->next([deferred = WTFMove(deferred), traits = IteratorTraits { }, kind = m_kind](auto result) mutable {
        auto* globalObject = deferred->globalObject();
        if (!globalObject)
            return;

        if (result.hasException())
            return deferred->reject(result.releaseException());

        auto resultValue = result.releaseReturnValue();
        if (!resultValue)
            return deferred->resolve();

        deferred->resolveWithJSValue(convertToJS(*globalObject, *globalObject, *resultValue, traits, kind));
    });

    return promise;
}

template<typename JSWrapper, typename IteratorTraits>
JSC::EncodedJSValue JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::settle(JSC::JSGlobalObject* globalObject)
{
    return JSC::JSValue::encode(runNextSteps(*globalObject));
}

template<typename JSWrapper, typename IteratorTraits>
JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::onPromiseSettled(JSGlobalObject* globalObject, JSC::CallFrame* callFrame)
{
    JSC::VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    auto castedThis = JSC::jsDynamicCast<JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>*>(callFrame->thisValue());
    if (!castedThis)
        return throwThisTypeError(*globalObject, scope, JSWrapper::info()->className, "onPromiseSettled");

    return castedThis->settle(globalObject);
}

template<typename JSWrapper, typename IteratorTraits>
JSBoundFunction* JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::createOnSettledFunction(JSC::JSGlobalObject* globalObject)
{
    JSC::VM& vm = globalObject->vm();
    auto onSettled = JSC::JSFunction::create(vm, globalObject, 0, String(), onPromiseSettled, ImplementationVisibility::Public);
    return JSC::JSBoundFunction::create(vm, globalObject, onSettled, this, { }, 1, jsEmptyString(vm));
}

template<typename JSWrapper, typename IteratorTraits>
JSC::EncodedJSValue JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::fulfill(JSC::JSGlobalObject* globalObject, JSC::JSValue result)
{
    m_ongoingPromise = nullptr;
    if (result.isUndefined()) {
        m_iterator = nullptr;
        return JSC::JSValue::encode(JSC::createIteratorResultObject(globalObject, result, true));
    }

    return JSC::JSValue::encode(JSC::createIteratorResultObject(globalObject, result, false));
}

template<typename JSWrapper, typename IteratorTraits>
JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::onPromiseFulFilled(JSGlobalObject* globalObject, JSC::CallFrame* callFrame)
{
    JSC::VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    auto castedThis = JSC::jsDynamicCast<JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>*>(callFrame->thisValue());
    if (!castedThis)
        return throwThisTypeError(*globalObject, scope, JSWrapper::info()->className, "onPromiseFulfilled");

    return castedThis->fulfill(globalObject, callFrame->argument(0));
}

template<typename JSWrapper, typename IteratorTraits>
JSBoundFunction* JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::createOnFulfilledFunction(JSC::JSGlobalObject* globalObject)
{
    JSC::VM& vm = globalObject->vm();
    auto onFulFilled = JSC::JSFunction::create(vm, globalObject, 0, String(), onPromiseFulFilled, ImplementationVisibility::Public);
    return JSC::JSBoundFunction::create(vm, globalObject, onFulFilled, this, { }, 1, jsEmptyString(vm));
}

template<typename JSWrapper, typename IteratorTraits>
JSC::EncodedJSValue JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::reject(JSC::JSGlobalObject* globalObject, JSC::JSValue reason)
{
    m_ongoingPromise = nullptr;
    m_iterator = nullptr;

    JSC::VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    return throwVMError(globalObject, scope, reason);
}

template<typename JSWrapper, typename IteratorTraits>
JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::onPromiseRejected(JSC::JSGlobalObject* globalObject, JSC::CallFrame* callFrame)
{
    JSC::VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);
    auto castedThis = JSC::jsDynamicCast<JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>*>(callFrame->thisValue());
    if (!castedThis)
        return throwThisTypeError(*globalObject, scope, JSWrapper::info()->className, "onPromiseRejected");

    return castedThis->reject(globalObject, callFrame->argument(0));
}

template<typename JSWrapper, typename IteratorTraits>
JSBoundFunction* JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>::createOnRejectedFunction(JSC::JSGlobalObject* globalObject)
{
    JSC::VM& vm = globalObject->vm();
    auto onRejected = JSC::JSFunction::create(vm, globalObject, 0, String(), onPromiseRejected, ImplementationVisibility::Public);
    return JSC::JSBoundFunction::create(vm, globalObject, onRejected, this, { }, 1, jsEmptyString(vm));
}

template<typename JSWrapper, typename IteratorTraits>
JSC::EncodedJSValue JSC_HOST_CALL_ATTRIBUTES JSDOMAsyncIteratorPrototype<JSWrapper, IteratorTraits>::next(JSC::JSGlobalObject* globalObject, JSC::CallFrame* callFrame)
{
    JSC::VM& vm = globalObject->vm();
    auto scope = DECLARE_THROW_SCOPE(vm);

    auto iterator = JSC::jsDynamicCast<JSDOMAsyncIteratorBase<JSWrapper, IteratorTraits>*>(callFrame->thisValue());
    if (!iterator)
        return throwVMTypeError(globalObject, scope, "Cannot call next() on a non-Iterator object"_s);

    return JSC::JSValue::encode(iterator->next(*globalObject));
}

template<typename JSWrapper, typename IteratorTraits>
void JSDOMAsyncIteratorPrototype<JSWrapper, IteratorTraits>::finishCreation(JSC::VM& vm, JSC::JSGlobalObject* globalObject)
{
    Base::finishCreation(vm);
    ASSERT(inherits(info()));

    JSC_NATIVE_FUNCTION_WITHOUT_TRANSITION(vm.propertyNames->next, next, 0, 0, JSC::ImplementationVisibility::Public);
    JSC_TO_STRING_TAG_WITHOUT_TRANSITION();
}

}
