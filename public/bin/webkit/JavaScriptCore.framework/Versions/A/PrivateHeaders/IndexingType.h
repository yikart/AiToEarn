/*
 * Copyright (C) 2012-2022 Apple Inc. All rights reserved.
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

#include "Options.h"
#include "SpeculatedType.h"
#include <wtf/LockAlgorithm.h>
#include <wtf/StdLibExtras.h>

namespace JSC {

/*
    Structure of the IndexingType
    =============================
    Conceptually, the IndexingTypeAndMisc looks like this:

    struct IndexingTypeAndMisc {
        struct IndexingModeIncludingHistory {
            struct IndexingMode {
                struct IndexingType {
                    uint8_t isArray:1;          // bit 0
                    uint8_t shape:3;            // bit 1 - 3
                };
                uint8_t copyOnWrite:1;          // bit 4
            };
            uint8_t mayHaveIndexedAccessors:1;  // bit 5
        };
        uint8_t cellLockBits:2;                 // bit 6 - 7
    };

    The shape values (e.g. Int32Shape, ContiguousShape, etc) are an enumeration of
    various shapes (though not necessarily sequential in terms of their values).
    Hence, shape values are not bitwise exclusive with respect to each other.

    It's also common to refer to shape + copyOnWrite as IndexingShapeWithWritability.
*/

typedef uint8_t IndexingType;

// Flags for testing the presence of capabilities.
static const IndexingType IsArray                  = 0x01;

// The shape of the indexed property storage.
static const IndexingType NoIndexingShape                 = 0x00;
static const IndexingType UndecidedShape                  = 0x02; // Only useful for arrays.
static const IndexingType Int32Shape                      = 0x04;
static const IndexingType DoubleShape                     = 0x06;
static const IndexingType ContiguousShape                 = 0x08;
static const IndexingType ArrayStorageShape               = 0x0A;
static const IndexingType SlowPutArrayStorageShape        = 0x0C;

static const IndexingType IndexingShapeMask               = 0x0E;
static const IndexingType IndexingShapeShift              = 1;
static const IndexingType NumberOfIndexingShapes          = 7;
static const IndexingType IndexingTypeMask                = IndexingShapeMask | IsArray;

// Whether or not the butterfly is copy on write. If it is copy on write then the butterfly is actually a JSImmutableButterfly. This should only ever be set if there are no named properties.
static const IndexingType CopyOnWrite                      = 0x10;
static const IndexingType IndexingShapeAndWritabilityMask  = CopyOnWrite | IndexingShapeMask;
static const IndexingType IndexingModeMask                 = CopyOnWrite | IndexingTypeMask;
static const IndexingType NumberOfCopyOnWriteIndexingModes = 3; // We only have copy on write for int32, double, and contiguous shapes.
static const IndexingType NumberOfArrayIndexingModes       = NumberOfIndexingShapes + NumberOfCopyOnWriteIndexingModes;

// Additional flags for tracking the history of the type. These are usually
// masked off unless you ask for them directly.
// FIXME: We only seem to use MayHaveIndexedAccessors for checking if the prototype chain may intercept indexed properties. We should probably be able to compute that same information via (indexingShape != SlowPutArrayStorageShape || classInfo().getOwnPropertySlotByIndex != JSObject::getOwnPropertySlotByIndex || globalObject().isHavingABadTime()) since we will already get the structure in order to do the prototype chain walk.
// See: https://bugs.webkit.org/show_bug.cgi?id=209757
static const IndexingType MayHaveIndexedAccessors         = 0x20;

// The IndexingType field of JSCells is stolen for locks and remembering if the object has been a
// prototype.
static const IndexingType IndexingTypeLockIsHeld          = 0x40;
static const IndexingType IndexingTypeLockHasParked       = 0x80;

// List of acceptable array types.
static const IndexingType NonArray                        = 0x0;
static const IndexingType NonArrayWithInt32               = Int32Shape;
static const IndexingType NonArrayWithDouble              = DoubleShape;
static const IndexingType NonArrayWithContiguous          = ContiguousShape;
static const IndexingType NonArrayWithArrayStorage        = ArrayStorageShape;
static const IndexingType NonArrayWithSlowPutArrayStorage = SlowPutArrayStorageShape;
static const IndexingType ArrayClass                      = IsArray; // I'd want to call this "Array" but this would lead to disastrous namespace pollution.
static const IndexingType ArrayWithUndecided              = IsArray | UndecidedShape;
static const IndexingType ArrayWithInt32                  = IsArray | Int32Shape;
static const IndexingType ArrayWithDouble                 = IsArray | DoubleShape;
static const IndexingType ArrayWithContiguous             = IsArray | ContiguousShape;
static const IndexingType ArrayWithArrayStorage           = IsArray | ArrayStorageShape;
static const IndexingType ArrayWithSlowPutArrayStorage    = IsArray | SlowPutArrayStorageShape;
static const IndexingType CopyOnWriteArrayWithInt32       = IsArray | Int32Shape | CopyOnWrite;
static const IndexingType CopyOnWriteArrayWithDouble      = IsArray | DoubleShape | CopyOnWrite;
static const IndexingType CopyOnWriteArrayWithContiguous  = IsArray | ContiguousShape | CopyOnWrite;

#define ALL_BLANK_INDEXING_TYPES \
    NonArray:                    \
    case ArrayClass

#define ALL_UNDECIDED_INDEXING_TYPES \
    ArrayWithUndecided

#define ALL_WRITABLE_INT32_INDEXING_TYPES      \
    NonArrayWithInt32:                         \
    case ArrayWithInt32

#define ALL_INT32_INDEXING_TYPES        \
    ALL_WRITABLE_INT32_INDEXING_TYPES:  \
    case CopyOnWriteArrayWithInt32

#define ALL_WRITABLE_DOUBLE_INDEXING_TYPES     \
    NonArrayWithDouble:                        \
    case ArrayWithDouble                       \

#define ALL_DOUBLE_INDEXING_TYPES       \
    ALL_WRITABLE_DOUBLE_INDEXING_TYPES: \
    case CopyOnWriteArrayWithDouble

#define ALL_WRITABLE_CONTIGUOUS_INDEXING_TYPES    \
    NonArrayWithContiguous:                       \
    case ArrayWithContiguous                      \

#define ALL_CONTIGUOUS_INDEXING_TYPES        \
    ALL_WRITABLE_CONTIGUOUS_INDEXING_TYPES:  \
    case CopyOnWriteArrayWithContiguous

#define ARRAY_WITH_ARRAY_STORAGE_INDEXING_TYPES \
    ArrayWithArrayStorage:                      \
    case ArrayWithSlowPutArrayStorage
    
#define ALL_ARRAY_STORAGE_INDEXING_TYPES                \
    NonArrayWithArrayStorage:                           \
    case NonArrayWithSlowPutArrayStorage:               \
    case ARRAY_WITH_ARRAY_STORAGE_INDEXING_TYPES

inline bool hasIndexedProperties(IndexingType indexingType)
{
    return (indexingType & IndexingShapeMask) != NoIndexingShape;
}

inline bool hasUndecided(IndexingType indexingType)
{
    return (indexingType & IndexingShapeMask) == UndecidedShape;
}

inline bool hasInt32(IndexingType indexingType)
{
    return (indexingType & IndexingShapeMask) == Int32Shape;
}

inline bool hasDouble(IndexingType indexingType)
{
    return (indexingType & IndexingShapeMask) == DoubleShape;
}

inline bool hasContiguous(IndexingType indexingType)
{
    return (indexingType & IndexingShapeMask) == ContiguousShape;
}

inline bool hasArrayStorage(IndexingType indexingType)
{
    return (indexingType & IndexingShapeMask) == ArrayStorageShape;
}

inline bool hasAnyArrayStorage(IndexingType indexingType)
{
    return static_cast<uint8_t>(indexingType & IndexingShapeMask) >= ArrayStorageShape;
}

inline bool hasSlowPutArrayStorage(IndexingType indexingType)
{
    return (indexingType & IndexingShapeMask) == SlowPutArrayStorageShape;
}

inline bool shouldUseSlowPut(IndexingType indexingType)
{
    return hasSlowPutArrayStorage(indexingType);
}

constexpr bool isCopyOnWrite(IndexingType indexingMode)
{
    return indexingMode & CopyOnWrite;
}

inline unsigned arrayIndexFromIndexingType(IndexingType indexingType)
{
    if (isCopyOnWrite(indexingType))
        return ((indexingType & IndexingShapeMask) - UndecidedShape + SlowPutArrayStorageShape) >> IndexingShapeShift;
    return (indexingType & IndexingShapeMask) >> IndexingShapeShift;
}

inline IndexingType indexingTypeForValue(JSValue value)
{
    if (value.isInt32())
        return Int32Shape;

    if (value.isNumber() && value.asNumber() == value.asNumber() && Options::allowDoubleShape())
        return DoubleShape;

    return ContiguousShape;
}

// Return an indexing type that can handle all of the elements of both indexing types.
IndexingType leastUpperBoundOfIndexingTypes(IndexingType, IndexingType);

IndexingType leastUpperBoundOfIndexingTypeAndType(IndexingType, SpeculatedType);
IndexingType leastUpperBoundOfIndexingTypeAndValue(IndexingType, JSValue);

void dumpIndexingType(PrintStream&, IndexingType);
MAKE_PRINT_ADAPTOR(IndexingTypeDump, IndexingType, dumpIndexingType);

static const IndexingType AllWritableArrayTypes    = IndexingShapeMask | IsArray;
static const IndexingType AllArrayTypes            = AllWritableArrayTypes | CopyOnWrite;
static const IndexingType AllWritableArrayTypesAndHistory = AllWritableArrayTypes | MayHaveIndexedAccessors;
static const IndexingType AllArrayTypesAndHistory  = AllArrayTypes | MayHaveIndexedAccessors;

typedef LockAlgorithm<IndexingType, IndexingTypeLockIsHeld, IndexingTypeLockHasParked> IndexingTypeLockAlgorithm;

} // namespace JSC
