/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "JSDataView.h"
#include "JSGenericTypedArrayView.h"
#include "TypedArrayAdaptors.h"

namespace JSC {

using JSInt8Array = JSGenericTypedArrayView<Int8Adaptor>;
using JSInt16Array = JSGenericTypedArrayView<Int16Adaptor>;
using JSInt32Array = JSGenericTypedArrayView<Int32Adaptor>;
using JSUint8Array = JSGenericTypedArrayView<Uint8Adaptor>;
using JSUint8ClampedArray = JSGenericTypedArrayView<Uint8ClampedAdaptor>;
using JSUint16Array = JSGenericTypedArrayView<Uint16Adaptor>;
using JSUint32Array = JSGenericTypedArrayView<Uint32Adaptor>;
using JSFloat16Array = JSGenericTypedArrayView<Float16Adaptor>;
using JSFloat32Array = JSGenericTypedArrayView<Float32Adaptor>;
using JSFloat64Array = JSGenericTypedArrayView<Float64Adaptor>;
using JSBigInt64Array = JSGenericTypedArrayView<BigInt64Adaptor>;
using JSBigUint64Array = JSGenericTypedArrayView<BigUint64Adaptor>;
using JSResizableOrGrowableSharedInt8Array = JSGenericResizableOrGrowableSharedTypedArrayView<Int8Adaptor>;
using JSResizableOrGrowableSharedInt16Array = JSGenericResizableOrGrowableSharedTypedArrayView<Int16Adaptor>;
using JSResizableOrGrowableSharedInt32Array = JSGenericResizableOrGrowableSharedTypedArrayView<Int32Adaptor>;
using JSResizableOrGrowableSharedUint8Array = JSGenericResizableOrGrowableSharedTypedArrayView<Uint8Adaptor>;
using JSResizableOrGrowableSharedUint8ClampedArray = JSGenericResizableOrGrowableSharedTypedArrayView<Uint8ClampedAdaptor>;
using JSResizableOrGrowableSharedUint16Array = JSGenericResizableOrGrowableSharedTypedArrayView<Uint16Adaptor>;
using JSResizableOrGrowableSharedUint32Array = JSGenericResizableOrGrowableSharedTypedArrayView<Uint32Adaptor>;
using JSResizableOrGrowableSharedFloat16Array = JSGenericResizableOrGrowableSharedTypedArrayView<Float16Adaptor>;
using JSResizableOrGrowableSharedFloat32Array = JSGenericResizableOrGrowableSharedTypedArrayView<Float32Adaptor>;
using JSResizableOrGrowableSharedFloat64Array = JSGenericResizableOrGrowableSharedTypedArrayView<Float64Adaptor>;
using JSResizableOrGrowableSharedBigInt64Array = JSGenericResizableOrGrowableSharedTypedArrayView<BigInt64Adaptor>;
using JSResizableOrGrowableSharedBigUint64Array = JSGenericResizableOrGrowableSharedTypedArrayView<BigUint64Adaptor>;

inline bool isResizableOrGrowableSharedTypedArrayIncludingDataView(const ClassInfo* classInfo)
{
    return classInfo->isResizableOrGrowableSharedTypedArray;
}

} // namespace JSC
