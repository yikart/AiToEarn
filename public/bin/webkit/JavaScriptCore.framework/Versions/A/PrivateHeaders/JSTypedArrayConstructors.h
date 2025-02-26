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
#include "JSGenericTypedArrayViewConstructor.h"
#include "JSTypedArrays.h"

namespace JSC {

using JSInt8ArrayConstructor = JSGenericTypedArrayViewConstructor<JSInt8Array>;
using JSInt16ArrayConstructor = JSGenericTypedArrayViewConstructor<JSInt16Array>;
using JSInt32ArrayConstructor = JSGenericTypedArrayViewConstructor<JSInt32Array>;
using JSUint8ArrayConstructor = JSGenericTypedArrayViewConstructor<JSUint8Array>;
using JSUint8ClampedArrayConstructor = JSGenericTypedArrayViewConstructor<JSUint8ClampedArray>;
using JSUint16ArrayConstructor = JSGenericTypedArrayViewConstructor<JSUint16Array>;
using JSUint32ArrayConstructor = JSGenericTypedArrayViewConstructor<JSUint32Array>;
using JSFloat16ArrayConstructor = JSGenericTypedArrayViewConstructor<JSFloat16Array>;
using JSFloat32ArrayConstructor = JSGenericTypedArrayViewConstructor<JSFloat32Array>;
using JSFloat64ArrayConstructor = JSGenericTypedArrayViewConstructor<JSFloat64Array>;
using JSBigInt64ArrayConstructor = JSGenericTypedArrayViewConstructor<JSBigInt64Array>;
using JSBigUint64ArrayConstructor = JSGenericTypedArrayViewConstructor<JSBigUint64Array>;
using JSDataViewConstructor = JSGenericTypedArrayViewConstructor<JSDataView>;
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSInt8ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSInt16ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSInt32ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSUint8ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSUint8ClampedArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSUint16ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSUint32ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSFloat16ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSFloat32ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSFloat64ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSBigInt64ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSBigUint64ArrayConstructor, InternalFunction);
STATIC_ASSERT_ISO_SUBSPACE_SHARABLE(JSDataViewConstructor, InternalFunction);

} // namespace JSC
