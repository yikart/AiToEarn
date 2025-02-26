/*
 * Copyright (C) 2011-2021 Apple Inc. All rights reserved.
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

#include "CodeBlock.h"
#include "CodeSpecializationKind.h"
#include "DirectArguments.h"
#include "ExceptionHelpers.h"
#include "FunctionCodeBlock.h"
#include "JSImmutableButterfly.h"
#include "JSPropertyNameEnumerator.h"
#include "ScopedArguments.h"
#include "SlowPathFunction.h"
#include "StackAlignment.h"
#include "TypeError.h"
#include "VMInlines.h"
#include <wtf/StdLibExtras.h>

namespace JSC {

// The purpose of this namespace is to include slow paths that are shared
// between the interpreter and baseline JIT. They are written to be agnostic
// with respect to the slow-path calling convention, but they do rely on the
// JS code being executed more-or-less directly from bytecode (so the call
// frame layout is unmodified, making it potentially awkward to use these
// from any optimizing JIT, like the DFG).

namespace CommonSlowPaths {

ALWAYS_INLINE int numberOfStackPaddingSlots(CodeBlock* codeBlock, int argumentCountIncludingThis)
{
    if (static_cast<unsigned>(argumentCountIncludingThis) >= codeBlock->numParameters())
        return 0;
    int alignedFrameSize = WTF::roundUpToMultipleOf(stackAlignmentRegisters(), argumentCountIncludingThis + CallFrame::headerSizeInRegisters);
    int alignedFrameSizeForParameters = WTF::roundUpToMultipleOf(stackAlignmentRegisters(), codeBlock->numParameters() + CallFrame::headerSizeInRegisters);
    return alignedFrameSizeForParameters - alignedFrameSize;
}

inline JSValue opEnumeratorGetByVal(JSGlobalObject* globalObject, JSValue baseValue, JSValue propertyNameValue, unsigned index, JSPropertyNameEnumerator::Flag mode, JSPropertyNameEnumerator* enumerator, ArrayProfile* arrayProfile = nullptr, uint8_t* enumeratorMetadata = nullptr)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    switch (mode) {
    case JSPropertyNameEnumerator::IndexedMode: {
        if (arrayProfile && LIKELY(baseValue.isCell()))
            arrayProfile->observeStructureID(baseValue.asCell()->structureID());
        RELEASE_AND_RETURN(scope, baseValue.get(globalObject, static_cast<unsigned>(index)));
    }
    case JSPropertyNameEnumerator::OwnStructureMode: {
        if (LIKELY(baseValue.isCell()) && baseValue.asCell()->structureID() == enumerator->cachedStructureID()) {
            // We'll only match the structure ID if the base is an object.
            ASSERT(index < enumerator->endStructurePropertyIndex());
            RELEASE_AND_RETURN(scope, baseValue.getObject()->getDirect(index < enumerator->cachedInlineCapacity() ? index : index - enumerator->cachedInlineCapacity() + firstOutOfLineOffset));
        } else {
            if (enumeratorMetadata)
                *enumeratorMetadata |= static_cast<uint8_t>(JSPropertyNameEnumerator::HasSeenOwnStructureModeStructureMismatch);
        }
        FALLTHROUGH;
    }

    case JSPropertyNameEnumerator::GenericMode: {
        if (arrayProfile && baseValue.isCell() && mode != JSPropertyNameEnumerator::OwnStructureMode)
            arrayProfile->observeStructureID(baseValue.asCell()->structureID());
        JSString* string = asString(propertyNameValue);
        auto propertyName = string->toIdentifier(globalObject);
        RETURN_IF_EXCEPTION(scope, { });
        RELEASE_AND_RETURN(scope, baseValue.get(globalObject, propertyName));
    }

    default:
        RELEASE_ASSERT_NOT_REACHED();
        break;
    };
    RELEASE_ASSERT_NOT_REACHED();
}

inline bool opInByVal(JSGlobalObject* globalObject, JSValue baseVal, JSValue propName, ArrayProfile* arrayProfile = nullptr)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);
    if (!baseVal.isObject()) {
        throwException(globalObject, scope, createInvalidInParameterError(globalObject, baseVal));
        return false;
    }

    JSObject* baseObj = asObject(baseVal);
    uint32_t i;
    if (propName.getUInt32(i)) {
        if (arrayProfile)
            arrayProfile->observeIndexedRead(baseObj, i);
        RELEASE_AND_RETURN(scope, baseObj->hasProperty(globalObject, i));
    }

    auto property = propName.toPropertyKey(globalObject);
    RETURN_IF_EXCEPTION(scope, false);
    RELEASE_AND_RETURN(scope, baseObj->hasProperty(globalObject, property));
}

inline bool canAccessArgumentIndexQuickly(JSObject& object, uint32_t index)
{
    switch (object.type()) {
    case DirectArgumentsType: {
        DirectArguments* directArguments = jsCast<DirectArguments*>(&object);
        if (directArguments->isMappedArgumentInDFG(index))
            return true;
        break;
    }
    case ScopedArgumentsType: {
        ScopedArguments* scopedArguments = jsCast<ScopedArguments*>(&object);
        if (scopedArguments->isMappedArgumentInDFG(index))
            return true;
        break;
    }
    default:
        break;
    }
    return false;
}

ALWAYS_INLINE Structure* originalStructureBeforePut(JSCell* cell)
{
    if (cell->type() == GlobalProxyType)
        return jsCast<JSGlobalProxy*>(cell)->target()->structure();
    return cell->structure();
}

ALWAYS_INLINE Structure* originalStructureBeforePut(JSValue value)
{
    if (!value.isCell())
        return nullptr;
    return originalStructureBeforePut(value.asCell());
}

static ALWAYS_INLINE bool canPutDirectFast(VM& vm, Structure* structure, PropertyName propertyName, bool isJSFunction)
{
    if (!structure->isStructureExtensible())
        return false;

    unsigned currentAttributes = 0;
    structure->get(vm, propertyName, currentAttributes);
    if (currentAttributes & PropertyAttribute::DontDelete)
        return false;

    if (!isJSFunction) {
        if (structure->hasNonReifiedStaticProperties())
            return false;
        if (structure->classInfoForCells()->methodTable.defineOwnProperty != &JSObject::defineOwnProperty)
            return false;
    }

    return true;
}

static ALWAYS_INLINE void putDirectWithReify(VM& vm, JSGlobalObject* globalObject, JSObject* baseObject, PropertyName propertyName, JSValue value, PutPropertySlot& slot, Structure** result = nullptr)
{
    auto scope = DECLARE_THROW_SCOPE(vm);
    bool isJSFunction = baseObject->inherits<JSFunction>();
    if (isJSFunction) {
        JSFunction* jsFunction = jsCast<JSFunction*>(baseObject);

        if (propertyName == vm.propertyNames->prototype) {
            slot.disableCaching();
            if (FunctionRareData* rareData = jsFunction->rareData())
                rareData->clear("Store to prototype property of a function");
        }

        jsFunction->reifyLazyPropertyIfNeeded<>(vm, globalObject, propertyName);
        RETURN_IF_EXCEPTION(scope, void());
    }

    Structure* structure = originalStructureBeforePut(baseObject);
    if (result)
        *result = structure;

    if (LIKELY(canPutDirectFast(vm, structure, propertyName, isJSFunction))) {
        bool success = baseObject->putDirect(vm, propertyName, value, 0, slot);
        ASSERT_UNUSED(success, success);
    } else {
        slot.disableCaching();
        scope.release();
        PropertyDescriptor descriptor(value, 0);
        baseObject->methodTable()->defineOwnProperty(baseObject, globalObject, propertyName, descriptor, slot.isStrictMode());
    }
}

static ALWAYS_INLINE void putDirectAccessorWithReify(VM& vm, JSGlobalObject* globalObject, JSObject* baseObject, PropertyName propertyName, GetterSetter* accessor, unsigned attribute)
{
    // baseObject is either JSFinalObject during object literal construction, or a userland JSFunction class
    // constructor, both of which are guaranteed to be extensible and without non-configurable |propertyName|.
    // Please also note that static "prototype" accessor in a `class` literal is a syntax error.

    auto scope = DECLARE_THROW_SCOPE(vm);
    bool isJSFunction = baseObject->inherits<JSFunction>();
    if (isJSFunction) {
        ASSERT(propertyName != vm.propertyNames->prototype);
        jsCast<JSFunction*>(baseObject)->reifyLazyPropertyIfNeeded<>(vm, globalObject, propertyName);
        RETURN_IF_EXCEPTION(scope, void());
    }

    ASSERT(canPutDirectFast(vm, originalStructureBeforePut(baseObject), propertyName, isJSFunction));
    scope.release();
    baseObject->putDirectAccessor(globalObject, propertyName, accessor, attribute);
}

inline JSArray* allocateNewArrayBuffer(VM& vm, Structure* structure, JSImmutableButterfly* immutableButterfly)
{
    JSGlobalObject* globalObject = structure->globalObject();
    Structure* originalStructure = globalObject->originalArrayStructureForIndexingType(immutableButterfly->indexingMode());
    ASSERT(originalStructure->indexingMode() == immutableButterfly->indexingMode());
    ASSERT(isCopyOnWrite(immutableButterfly->indexingMode()));
    ASSERT(!structure->outOfLineCapacity());

    JSArray* result = JSArray::createWithButterfly(vm, nullptr, originalStructure, immutableButterfly->toButterfly());
    // FIXME: This works but it's slow. If we cared enough about the perf when having a bad time then we could fix it.
    if (UNLIKELY(originalStructure != structure)) {
        ASSERT(hasSlowPutArrayStorage(structure->indexingMode()));
        ASSERT(globalObject->isHavingABadTime());

        result->switchToSlowPutArrayStorage(vm);
        ASSERT(result->butterfly() != immutableButterfly->toButterfly());
        ASSERT(!result->butterfly()->arrayStorage()->m_sparseMap.get());
        ASSERT(result->structureID() == structure->id());
    }

    return result;
}

} // namespace CommonSlowPaths

class CallFrame;

#define JSC_DECLARE_COMMON_SLOW_PATH(name) JSC_DECLARE_JIT_OPERATION(name, UGPRPair, (CallFrame*, const JSInstruction*))
#define JSC_DEFINE_COMMON_SLOW_PATH(name) JSC_DEFINE_JIT_OPERATION(name, UGPRPair, (CallFrame* callFrame, const JSInstruction* pc))

JSC_DECLARE_COMMON_SLOW_PATH(slow_path_create_this);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_enter);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_this);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_check_tdz);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_throw_strict_mode_readonly_property_write_error);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_not);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_eq);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_neq);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_stricteq);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_nstricteq);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_inc);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_dec);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_number);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_numeric);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_string);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_object);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_negate);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_add);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_mul);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_sub);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_div);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_mod);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_pow);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_lshift);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_rshift);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_urshift);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_unsigned);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_bitnot);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_bitand);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_bitor);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_bitxor);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_typeof);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_typeof_is_object);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_typeof_is_function);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_is_callable);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_is_constructor);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_strcat);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_primitive);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_property_key);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_to_property_key_or_number);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_get_property_enumerator);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_enumerator_next);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_enumerator_get_by_val);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_enumerator_in_by_val);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_enumerator_put_by_val);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_enumerator_has_own_property);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_profile_type_clear_log);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_unreachable);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_push_with_scope);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_resolve_scope);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_resolve_scope_for_hoisting_func_decl_in_eval);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_create_promise);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_create_generator);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_create_async_generator);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_create_rest);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_get_by_val_with_this);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_get_prototype_of);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_put_by_id_with_this);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_put_by_val_with_this);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_define_data_property);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_define_accessor_property);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_throw_static_error);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_instanceof_custom_from_instanceof);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_throw_static_error_from_instanceof);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_new_promise);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_new_generator);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_new_array_with_spread);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_new_array_with_species);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_new_array_buffer);
JSC_DECLARE_COMMON_SLOW_PATH(slow_path_spread);
JSC_DECLARE_COMMON_SLOW_PATH(iterator_open_try_fast_narrow);
JSC_DECLARE_COMMON_SLOW_PATH(iterator_open_try_fast_wide16);
JSC_DECLARE_COMMON_SLOW_PATH(iterator_open_try_fast_wide32);
JSC_DECLARE_COMMON_SLOW_PATH(iterator_next_try_fast_narrow);
JSC_DECLARE_COMMON_SLOW_PATH(iterator_next_try_fast_wide16);
JSC_DECLARE_COMMON_SLOW_PATH(iterator_next_try_fast_wide32);

} // namespace JSC
