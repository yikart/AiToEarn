/*
 * Copyright (C) 2013-2021 Apple Inc. All rights reserved.
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

#include "JSGenericTypedArrayViewPrototype.h"

#include "JSTypedArrays.h"

namespace JSC {
    
template<typename ViewClass>
JSGenericTypedArrayViewPrototype<ViewClass>::JSGenericTypedArrayViewPrototype(VM& vm, Structure* structure)
    : Base(vm, structure)
{
}

template<typename ViewClass>
void JSGenericTypedArrayViewPrototype<ViewClass>::finishCreation(
    VM& vm, JSGlobalObject* globalObject)
{
    Base::finishCreation(vm);
    
    ASSERT(inherits(info()));

    putDirectWithoutTransition(vm, vm.propertyNames->BYTES_PER_ELEMENT, jsNumber(ViewClass::elementSize), PropertyAttribute::DontEnum | PropertyAttribute::ReadOnly | PropertyAttribute::DontDelete);

    if constexpr (std::is_same_v<ViewClass, JSUint8Array>) {
        if (Options::useUint8ArrayBase64Methods()) {
            JSC_NATIVE_FUNCTION_WITHOUT_TRANSITION("setFromBase64"_s, uint8ArrayPrototypeSetFromBase64, static_cast<unsigned>(PropertyAttribute::DontEnum), 1, ImplementationVisibility::Public);
            JSC_NATIVE_FUNCTION_WITHOUT_TRANSITION("setFromHex"_s, uint8ArrayPrototypeSetFromHex, static_cast<unsigned>(PropertyAttribute::DontEnum), 1, ImplementationVisibility::Public);
            JSC_NATIVE_FUNCTION_WITHOUT_TRANSITION("toBase64"_s, uint8ArrayPrototypeToBase64, static_cast<unsigned>(PropertyAttribute::DontEnum), 0, ImplementationVisibility::Public);
            JSC_NATIVE_FUNCTION_WITHOUT_TRANSITION("toHex"_s, uint8ArrayPrototypeToHex, static_cast<unsigned>(PropertyAttribute::DontEnum), 0, ImplementationVisibility::Public);
        }
    }

    globalObject->installTypedArrayIteratorProtocolWatchpoint(this, ViewClass::TypedArrayStorageType);
}

template<typename ViewClass>
JSGenericTypedArrayViewPrototype<ViewClass>*
JSGenericTypedArrayViewPrototype<ViewClass>::create(
    VM& vm, JSGlobalObject* globalObject, Structure* structure)
{
    JSGenericTypedArrayViewPrototype* prototype =
        new (NotNull, allocateCell<JSGenericTypedArrayViewPrototype>(vm))
        JSGenericTypedArrayViewPrototype(vm, structure);
    prototype->finishCreation(vm, globalObject);
    return prototype;
}

template<typename ViewClass>
Structure* JSGenericTypedArrayViewPrototype<ViewClass>::createStructure(
    VM& vm, JSGlobalObject* globalObject, JSValue prototype)
{
    return Structure::create(
        vm, globalObject, prototype, TypeInfo(ObjectType, StructureFlags), info());
}

} // namespace JSC
