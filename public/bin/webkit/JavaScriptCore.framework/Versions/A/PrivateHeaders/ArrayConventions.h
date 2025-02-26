/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003-2019 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

#pragma once

#include "IndexingHeader.h"
#include "PureNaN.h"
#include "WriteBarrier.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

// Overview of JSArray
//
// Properties of JSArray objects may be stored in one of three locations:
//   * The regular JSObject property map.
//   * A storage vector.
//   * A sparse map of array entries.
//
// Properties with non-numeric identifiers, with identifiers that are not representable
// as an unsigned integer, or where the value is greater than  MAX_ARRAY_INDEX
// (specifically, this is only one property - the value 0xFFFFFFFFU as an unsigned 32-bit
// integer) are not considered array indices and will be stored in the JSObject property map.
//
// All properties with a numeric identifier, representable as an unsigned integer i,
// where (i <= MAX_ARRAY_INDEX), are an array index and will be stored in either the
// storage vector or the sparse map. An array index i will be handled in the following
// fashion:
//
//   * Where (i < MIN_SPARSE_ARRAY_INDEX) the value will be stored in the storage vector,
//     unless the array is in SparseMode in which case all properties go into the map.
//   * Where (MIN_SPARSE_ARRAY_INDEX <= i <= MAX_STORAGE_VECTOR_INDEX) the value will either
//     be stored in the storage vector or in the sparse array, depending on the density of
//     data that would be stored in the vector (a vector being used where at least
//     (1 / minDensityMultiplier) of the entries would be populated).
//   * Where (MAX_STORAGE_VECTOR_INDEX < i <= MAX_ARRAY_INDEX) the value will always be stored
//     in the sparse array.

// Define the maximum storage vector length to be 2^32 / sizeof(JSValue) / 2 to ensure that
// there is no risk of overflow.
#define MAX_STORAGE_VECTOR_LENGTH IndexingHeader::maximumLength

// These values have to be macros to be used in max() and min() without introducing
// a PIC branch in Mach-O binaries, see <rdar://problem/5971391>.

// If you grow an ArrayStorage array by more than this, then the array will go sparse. Note that we
// could probably make this smaller (it's large because it used to be conflated with
// MIN_ARRAY_STORAGE_CONSTRUCTION_LENGTH).
#define MIN_SPARSE_ARRAY_INDEX 100000U
// If you try to allocate a contiguous array larger than this, then we will allocate an ArrayStorage
// array instead. We allow for an array that occupies 1GB of VM.
#define MIN_ARRAY_STORAGE_CONSTRUCTION_LENGTH (1024 * 1024 * 1024 / 8)
#define MAX_STORAGE_VECTOR_INDEX (MAX_STORAGE_VECTOR_LENGTH - 1)
// 0xFFFFFFFF is a bit weird -- is not an array index even though it's an integer.
#define MAX_ARRAY_INDEX 0xFFFFFFFEU

static_assert(MIN_SPARSE_ARRAY_INDEX <= MAX_STORAGE_VECTOR_INDEX, "MIN_SPARSE_ARRAY_INDEX must be less than or equal to MAX_STORAGE_VECTOR_INDEX");
static_assert(MAX_STORAGE_VECTOR_INDEX <= MAX_ARRAY_INDEX, "MAX_STORAGE_VECTOR_INDEX must be less than or equal to MAX_ARRAY_INDEX");

// The value BASE_XXX_VECTOR_LEN is the maximum number of vector elements we'll allocate
// for an array that was created with a sepcified length (e.g. a = new Array(123))
#define BASE_CONTIGUOUS_VECTOR_LEN 3U
#define BASE_CONTIGUOUS_VECTOR_LEN_EMPTY 5U
#define BASE_CONTIGUOUS_VECTOR_LEN_MIN 3U
#define BASE_CONTIGUOUS_VECTOR_LEN_MAX 25U
#define BASE_ARRAY_STORAGE_VECTOR_LEN 4U

// The upper bound to the size we'll grow a zero length array when the first element
// is added.
#define FIRST_ARRAY_STORAGE_VECTOR_GROW 4U

#define MIN_BEYOND_LENGTH_SPARSE_INDEX 1000

// Our policy for when to use a vector and when to use a sparse map.
// For all array indices under MIN_SPARSE_ARRAY_INDEX, we always use a vector.
// When indices greater than MIN_SPARSE_ARRAY_INDEX are involved, we use a vector
// as long as it is 1/8 full. If more sparse than that, we use a map.
static constexpr unsigned minDensityMultiplier = 8;

inline bool isDenseEnoughForVector(unsigned length, unsigned numValues)
{
    return length / minDensityMultiplier <= numValues;
}

inline bool indexIsSufficientlyBeyondLengthForSparseMap(unsigned i, unsigned length)
{
    return i >= MIN_BEYOND_LENGTH_SPARSE_INDEX && i > length;
}

inline IndexingHeader indexingHeaderForArrayStorage(unsigned length, unsigned vectorLength)
{
    IndexingHeader result;
    result.setPublicLength(length);
    result.setVectorLength(vectorLength);
    return result;
}

inline IndexingHeader baseIndexingHeaderForArrayStorage(unsigned length)
{
    return indexingHeaderForArrayStorage(length, BASE_ARRAY_STORAGE_VECTOR_LEN);
}

#if USE(JSVALUE64)
JS_EXPORT_PRIVATE void clearArrayMemset(WriteBarrier<Unknown>* base, unsigned count);
JS_EXPORT_PRIVATE void clearArrayMemset(double* base, unsigned count);
#endif // USE(JSVALUE64)

ALWAYS_INLINE void clearArray(WriteBarrier<Unknown>* base, unsigned count)
{
#if USE(JSVALUE64)
    const unsigned minCountForMemset = 100;
    if (count >= minCountForMemset) {
        clearArrayMemset(base, count);
        return;
    }
#endif
    
    for (unsigned i = count; i--;)
        base[i].clear();
}

ALWAYS_INLINE void clearArray(double* base, unsigned count)
{
#if USE(JSVALUE64)
    const unsigned minCountForMemset = 100;
    if (count >= minCountForMemset) {
        clearArrayMemset(base, count);
        return;
    }
#endif
    
    for (unsigned i = count; i--;)
        base[i] = PNaN;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
