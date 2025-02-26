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

#include "ConcurrentJSLock.h"
#include "Structure.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class CodeBlock;
class LLIntOffsetsExtractor;
class UnlinkedArrayProfile;

// This is a bitfield where each bit represents an type of array access that we have seen.
// There are 19 indexing types that use the lower bits.
// There are 11 typed array types taking the bits 16-20 and 26-31.
typedef unsigned ArrayModes;

// The possible IndexingTypes are limited within (0 - 16, 21, 23, 25).
// This is because CoW types only appear for JSArrays.
static_assert(CopyOnWriteArrayWithInt32 == 21);
static_assert(CopyOnWriteArrayWithDouble == 23);
static_assert(CopyOnWriteArrayWithContiguous == 25);
const ArrayModes CopyOnWriteArrayWithInt32ArrayMode = 1 << CopyOnWriteArrayWithInt32;
const ArrayModes CopyOnWriteArrayWithDoubleArrayMode = 1 << CopyOnWriteArrayWithDouble;
const ArrayModes CopyOnWriteArrayWithContiguousArrayMode = 1 << CopyOnWriteArrayWithContiguous;

const ArrayModes Int8ArrayMode = 1U << 16;
const ArrayModes Int16ArrayMode = 1U << 17;
const ArrayModes Int32ArrayMode = 1U << 18;
const ArrayModes Uint8ArrayMode = 1U << 19;
const ArrayModes Uint8ClampedArrayMode = 1U << 20;
// 21, 23, 25 are used for CoW arrays.
const ArrayModes Float16ArrayMode = 1U << 22;
const ArrayModes Uint16ArrayMode = 1U << 26;
const ArrayModes Uint32ArrayMode = 1U << 27;
const ArrayModes Float32ArrayMode = 1U << 28;
const ArrayModes Float64ArrayMode = 1U << 29;
const ArrayModes BigInt64ArrayMode = 1U << 30;
const ArrayModes BigUint64ArrayMode = 1U << 31;

JS_EXPORT_PRIVATE extern const ArrayModes typedArrayModes[NumberOfTypedArrayTypesExcludingDataView];

constexpr ArrayModes asArrayModesIgnoringTypedArrays(IndexingType indexingMode)
{
    return static_cast<unsigned>(1) << static_cast<unsigned>(indexingMode);
}

#define ALL_TYPED_ARRAY_MODES \
    (Int8ArrayMode            \
    | Int16ArrayMode          \
    | Int32ArrayMode          \
    | Uint8ArrayMode          \
    | Uint8ClampedArrayMode   \
    | Uint16ArrayMode         \
    | Uint32ArrayMode         \
    | Float16ArrayMode        \
    | Float32ArrayMode        \
    | Float64ArrayMode        \
    | BigInt64ArrayMode       \
    | BigUint64ArrayMode      \
    )

#define ALL_NON_ARRAY_ARRAY_MODES                       \
    (asArrayModesIgnoringTypedArrays(NonArray)                             \
    | asArrayModesIgnoringTypedArrays(NonArrayWithInt32)                   \
    | asArrayModesIgnoringTypedArrays(NonArrayWithDouble)                  \
    | asArrayModesIgnoringTypedArrays(NonArrayWithContiguous)              \
    | asArrayModesIgnoringTypedArrays(NonArrayWithArrayStorage)            \
    | asArrayModesIgnoringTypedArrays(NonArrayWithSlowPutArrayStorage)     \
    | ALL_TYPED_ARRAY_MODES)

#define ALL_COPY_ON_WRITE_ARRAY_MODES                   \
    (CopyOnWriteArrayWithInt32ArrayMode                 \
    | CopyOnWriteArrayWithDoubleArrayMode               \
    | CopyOnWriteArrayWithContiguousArrayMode)

#define ALL_WRITABLE_ARRAY_ARRAY_MODES                  \
    (asArrayModesIgnoringTypedArrays(ArrayClass)                           \
    | asArrayModesIgnoringTypedArrays(ArrayWithUndecided)                  \
    | asArrayModesIgnoringTypedArrays(ArrayWithInt32)                      \
    | asArrayModesIgnoringTypedArrays(ArrayWithDouble)                     \
    | asArrayModesIgnoringTypedArrays(ArrayWithContiguous)                 \
    | asArrayModesIgnoringTypedArrays(ArrayWithArrayStorage)               \
    | asArrayModesIgnoringTypedArrays(ArrayWithSlowPutArrayStorage))

#define ALL_ARRAY_ARRAY_MODES                           \
    (ALL_WRITABLE_ARRAY_ARRAY_MODES                     \
    | ALL_COPY_ON_WRITE_ARRAY_MODES)

#define ALL_ARRAY_MODES (ALL_NON_ARRAY_ARRAY_MODES | ALL_ARRAY_ARRAY_MODES)

inline ArrayModes arrayModesFromStructure(Structure* structure)
{
    JSType type = structure->typeInfo().type();
    if (isTypedArrayType(type))
        return typedArrayModes[type - FirstTypedArrayType];
    return asArrayModesIgnoringTypedArrays(structure->indexingMode());
}

void dumpArrayModes(PrintStream&, ArrayModes);
MAKE_PRINT_ADAPTOR(ArrayModesDump, ArrayModes, dumpArrayModes);

inline bool mergeArrayModes(ArrayModes& left, ArrayModes right)
{
    ArrayModes newModes = left | right;
    if (newModes == left)
        return false;
    left = newModes;
    return true;
}

inline bool arrayModesAreClearOrTop(ArrayModes modes)
{
    return !modes || modes == ALL_ARRAY_MODES;
}

// Checks if proven is a subset of expected.
inline bool arrayModesAlreadyChecked(ArrayModes proven, ArrayModes expected)
{
    return (expected | proven) == expected;
}

inline bool arrayModesIncludeIgnoringTypedArrays(ArrayModes arrayModes, IndexingType shape)
{
    ArrayModes modes = asArrayModesIgnoringTypedArrays(NonArray | shape) | asArrayModesIgnoringTypedArrays(ArrayClass | shape);
    if (hasInt32(shape) || hasDouble(shape) || hasContiguous(shape))
        modes |= asArrayModesIgnoringTypedArrays(ArrayClass | shape | CopyOnWrite);
    return !!(arrayModes & modes);
}

inline bool shouldUseSlowPutArrayStorage(ArrayModes arrayModes)
{
    return arrayModesIncludeIgnoringTypedArrays(arrayModes, SlowPutArrayStorageShape);
}

inline bool shouldUseFastArrayStorage(ArrayModes arrayModes)
{
    return arrayModesIncludeIgnoringTypedArrays(arrayModes, ArrayStorageShape);
}

inline bool shouldUseContiguous(ArrayModes arrayModes)
{
    return arrayModesIncludeIgnoringTypedArrays(arrayModes, ContiguousShape);
}

inline bool shouldUseDouble(ArrayModes arrayModes)
{
    ASSERT(Options::allowDoubleShape());
    return arrayModesIncludeIgnoringTypedArrays(arrayModes, DoubleShape);
}

inline bool shouldUseInt32(ArrayModes arrayModes)
{
    return arrayModesIncludeIgnoringTypedArrays(arrayModes, Int32Shape);
}

inline bool hasSeenArray(ArrayModes arrayModes)
{
    return arrayModes & ALL_ARRAY_ARRAY_MODES;
}

inline bool hasSeenNonArray(ArrayModes arrayModes)
{
    return arrayModes & ALL_NON_ARRAY_ARRAY_MODES;
}

inline bool hasSeenWritableArray(ArrayModes arrayModes)
{
    return arrayModes & ALL_WRITABLE_ARRAY_ARRAY_MODES;
}

inline bool hasSeenCopyOnWriteArray(ArrayModes arrayModes)
{
    return arrayModes & ALL_COPY_ON_WRITE_ARRAY_MODES;
}

enum class ArrayProfileFlag : uint32_t {
    MayStoreHole = 1 << 0, // This flag may become overloaded to indicate other special cases that were encountered during array access, as it depends on indexing type. Since we currently have basically just one indexing type (two variants of ArrayStorage), this flag for now just means exactly what its name implies.
    OutOfBounds = 1 << 1,
    MayBeLargeTypedArray = 1 << 2,
    MayInterceptIndexedAccesses = 1 << 3,
    UsesNonOriginalArrayStructures = 1 << 4,
    MayBeResizableOrGrowableSharedTypedArray = 1 << 5,
    DidPerformFirstRunPruning = 1 << 6,
};

class ArrayProfile {
    friend class CodeBlock;
    friend class UnlinkedArrayProfile;
public:
    explicit ArrayProfile() = default;

    void clear()
    {
        m_lastSeenStructureID = { };
        m_speculationFailureStructureID = { };
        m_arrayProfileFlags = { };
        m_observedArrayModes = { };
    }

    static constexpr uint64_t s_smallTypedArrayMaxLength = std::numeric_limits<int32_t>::max();
    void setMayBeLargeTypedArray() { m_arrayProfileFlags.add(ArrayProfileFlag::MayBeLargeTypedArray); }
    bool mayBeLargeTypedArray(const ConcurrentJSLocker&) const { return m_arrayProfileFlags.contains(ArrayProfileFlag::MayBeLargeTypedArray); }

    bool mayBeResizableOrGrowableSharedTypedArray(const ConcurrentJSLocker&) const { return m_arrayProfileFlags.contains(ArrayProfileFlag::MayBeResizableOrGrowableSharedTypedArray); }

    StructureID* addressOfSpeculationFailureStructureID() { return &m_speculationFailureStructureID; }
    ArrayModes* addressOfArrayModes() { return &m_observedArrayModes; }

    static constexpr ptrdiff_t offsetOfLastSeenStructureID() { return OBJECT_OFFSETOF(ArrayProfile, m_lastSeenStructureID); }
    static constexpr ptrdiff_t offsetOfSpeculationFailureStructureID() { return OBJECT_OFFSETOF(ArrayProfile, m_speculationFailureStructureID); }
    static constexpr ptrdiff_t offsetOfArrayProfileFlags() { return OBJECT_OFFSETOF(ArrayProfile, m_arrayProfileFlags); }
    static constexpr ptrdiff_t offsetOfArrayModes() { return OBJECT_OFFSETOF(ArrayProfile, m_observedArrayModes); }

    void setOutOfBounds() { m_arrayProfileFlags.add(ArrayProfileFlag::OutOfBounds); }
    
    void observeStructureID(StructureID structureID) { m_lastSeenStructureID = structureID; }
    void observeStructure(Structure* structure) { m_lastSeenStructureID = structure->id(); }

    void computeUpdatedPrediction(CodeBlock*);
    void computeUpdatedPrediction(CodeBlock*, Structure* lastSeenStructure);
    
    void observeArrayMode(ArrayModes mode) { m_observedArrayModes |= mode; }
    void observeIndexedRead(JSCell*, unsigned index);

    ArrayModes observedArrayModes(const ConcurrentJSLocker&) const { return m_observedArrayModes; }
    bool mayInterceptIndexedAccesses(const ConcurrentJSLocker&) const { return m_arrayProfileFlags.contains(ArrayProfileFlag::MayInterceptIndexedAccesses);; }
    
    bool mayStoreToHole(const ConcurrentJSLocker&) const { return m_arrayProfileFlags.contains(ArrayProfileFlag::MayStoreHole); }
    bool outOfBounds(const ConcurrentJSLocker&) const { return m_arrayProfileFlags.contains(ArrayProfileFlag::OutOfBounds); }
    
    bool usesOriginalArrayStructures(const ConcurrentJSLocker&) const { return !m_arrayProfileFlags.contains(ArrayProfileFlag::UsesNonOriginalArrayStructures); }

    CString briefDescription(CodeBlock*);
    CString briefDescriptionWithoutUpdating();
    
private:
    friend class LLIntOffsetsExtractor;
    
    static Structure* polymorphicStructure() { return static_cast<Structure*>(reinterpret_cast<void*>(1)); }
    
    StructureID m_lastSeenStructureID;
    StructureID m_speculationFailureStructureID;
    OptionSet<ArrayProfileFlag> m_arrayProfileFlags;
    ArrayModes m_observedArrayModes { 0 };
};
static_assert(sizeof(ArrayProfile) == 16);

class UnlinkedArrayProfile {
public:
    explicit UnlinkedArrayProfile() = default;

    void update(ArrayProfile& arrayProfile)
    {
        ArrayModes newModes = arrayProfile.m_observedArrayModes | m_observedArrayModes;
        m_observedArrayModes = newModes;
        arrayProfile.m_observedArrayModes = newModes;

        arrayProfile.m_arrayProfileFlags.add(m_arrayProfileFlags);
        auto unlinkedArrayProfileFlags = arrayProfile.m_arrayProfileFlags;
        unlinkedArrayProfileFlags.remove(ArrayProfileFlag::DidPerformFirstRunPruning); // We do not propagate DidPerformFirstRunPruning.
        m_arrayProfileFlags = unlinkedArrayProfileFlags;
    }

private:
    ArrayModes m_observedArrayModes { 0 };
    OptionSet<ArrayProfileFlag> m_arrayProfileFlags { };
};
static_assert(sizeof(UnlinkedArrayProfile) <= 8);

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
