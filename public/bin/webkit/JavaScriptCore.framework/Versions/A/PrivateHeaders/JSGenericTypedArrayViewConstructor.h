/*
 * Copyright (C) 2013-2022 Apple Inc. All rights reserved.
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

#include "InternalFunction.h"

namespace JSC {

JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callInt8Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callInt16Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callInt32Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callUint8Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callUint8ClampedArray);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callUint16Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callUint32Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callFloat16Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callFloat32Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callFloat64Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callBigInt64Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callBigUint64Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(callDataView);

JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructInt8Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructInt16Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructInt32Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructUint8Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructUint8ClampedArray);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructUint16Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructUint32Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructFloat16Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructFloat32Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructFloat64Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructBigInt64Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructBigUint64Array);
JS_EXPORT_PRIVATE JSC_DECLARE_HOST_FUNCTION(constructDataView);

template<typename ViewClass>
class JSGenericTypedArrayViewConstructor final : public InternalFunction {
public:
    using Base = InternalFunction;

    static JSGenericTypedArrayViewConstructor* create(
        VM&, JSGlobalObject*, Structure*, JSObject* prototype, const String& name);

    // FIXME: We should fix the warnings for extern-template in JSObject template classes: https://bugs.webkit.org/show_bug.cgi?id=161979
    IGNORE_CLANG_WARNINGS_BEGIN("undefined-var-template")
    DECLARE_INFO;
    IGNORE_CLANG_WARNINGS_END

    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);

    static constexpr NativeFunction::Ptr callConstructor()
    {
        switch (ViewClass::TypedArrayStorageType) {
        case TypeInt8:
            return callInt8Array;
        case TypeInt16:
            return callInt16Array;
        case TypeInt32:
            return callInt32Array;
        case TypeUint8:
            return callUint8Array;
        case TypeUint8Clamped:
            return callUint8ClampedArray;
        case TypeUint16:
            return callUint16Array;
        case TypeUint32:
            return callUint32Array;
        case TypeFloat16:
            return callFloat16Array;
        case TypeFloat32:
            return callFloat32Array;
        case TypeFloat64:
            return callFloat64Array;
        case TypeBigInt64:
            return callBigInt64Array;
        case TypeBigUint64:
            return callBigUint64Array;
        case TypeDataView:
            return callDataView;
        default:
            CRASH_UNDER_CONSTEXPR_CONTEXT();
            return nullptr;
        }
    }

    static constexpr NativeFunction::Ptr constructConstructor()
    {
        switch (ViewClass::TypedArrayStorageType) {
        case TypeInt8:
            return constructInt8Array;
        case TypeInt16:
            return constructInt16Array;
        case TypeInt32:
            return constructInt32Array;
        case TypeUint8:
            return constructUint8Array;
        case TypeUint8Clamped:
            return constructUint8ClampedArray;
        case TypeUint16:
            return constructUint16Array;
        case TypeUint32:
            return constructUint32Array;
        case TypeFloat16:
            return constructFloat16Array;
        case TypeFloat32:
            return constructFloat32Array;
        case TypeFloat64:
            return constructFloat64Array;
        case TypeBigInt64:
            return constructBigInt64Array;
        case TypeBigUint64:
            return constructBigUint64Array;
        case TypeDataView:
            return constructDataView;
        default:
            CRASH_UNDER_CONSTEXPR_CONTEXT();
            return nullptr;
        }
    }

private:
    JSGenericTypedArrayViewConstructor(VM&, Structure*);
    void finishCreation(VM&, JSGlobalObject*, JSObject* prototype, const String& name);
};

JSC_DECLARE_HOST_FUNCTION(uint8ArrayConstructorFromBase64);
JSC_DECLARE_HOST_FUNCTION(uint8ArrayConstructorFromHex);

WARN_UNUSED_RETURN size_t decodeHex(std::span<const LChar>, std::span<uint8_t> result);
WARN_UNUSED_RETURN size_t decodeHex(std::span<const UChar>, std::span<uint8_t> result);

} // namespace JSC
