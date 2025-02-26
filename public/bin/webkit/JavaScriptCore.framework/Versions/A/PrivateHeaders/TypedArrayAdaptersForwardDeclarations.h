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

namespace JSC {

struct Int8Adaptor;
struct Int16Adaptor;
struct Int32Adaptor;
struct Uint8Adaptor;
struct Uint8ClampedAdaptor;
struct Uint16Adaptor;
struct Uint32Adaptor;
struct Float16Adaptor;
struct Float32Adaptor;
struct Float64Adaptor;
struct BigInt64Adaptor;
struct BigUint64Adaptor;

template<typename Adaptor> class GenericTypedArrayView;
typedef GenericTypedArrayView<Int8Adaptor> Int8Array;
typedef GenericTypedArrayView<Int16Adaptor> Int16Array;
typedef GenericTypedArrayView<Int32Adaptor> Int32Array;
typedef GenericTypedArrayView<Uint8Adaptor> Uint8Array;
typedef GenericTypedArrayView<Uint8ClampedAdaptor> Uint8ClampedArray;
typedef GenericTypedArrayView<Uint16Adaptor> Uint16Array;
typedef GenericTypedArrayView<Uint32Adaptor> Uint32Array;
typedef GenericTypedArrayView<Float16Adaptor> Float16Array;
typedef GenericTypedArrayView<Float32Adaptor> Float32Array;
typedef GenericTypedArrayView<Float64Adaptor> Float64Array;
typedef GenericTypedArrayView<BigInt64Adaptor> BigInt64Array;
typedef GenericTypedArrayView<BigUint64Adaptor> BigUint64Array;

}

using JSC::Int8Array;
using JSC::Int16Array;
using JSC::Int32Array;
using JSC::Uint8Array;
using JSC::Uint8ClampedArray;
using JSC::Uint16Array;
using JSC::Uint32Array;
using JSC::Float16Array;
using JSC::Float32Array;
using JSC::Float64Array;
using JSC::BigInt64Array;
using JSC::BigUint64Array;
