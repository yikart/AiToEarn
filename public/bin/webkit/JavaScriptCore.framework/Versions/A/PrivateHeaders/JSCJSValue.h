/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2003-2021 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Library General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Library General Public License for more details.
 *
 *  You should have received a copy of the GNU Library General Public License
 *  along with this library; see the file COPYING.LIB.  If not, write to
 *  the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 *  Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "Concurrency.h"
#include "ECMAMode.h"
#include "JSExportMacros.h"
#include "PureNaN.h"
#include <functional>
#include <math.h>
#include <stddef.h>
#include <stdint.h>
#include <wtf/Assertions.h>
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/HashTraits.h>
#include <wtf/MathExtras.h>
#include <wtf/MediaTime.h>
#include <wtf/Nonmovable.h>
#include <wtf/StdIntExtras.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TriState.h>

namespace JSC {

class AssemblyHelpers;
class DeletePropertySlot;
class JSBigInt;
class CallFrame;
class JSCell;
class JSValueSource;
class VM;
class JSGlobalObject;
class JSObject;
class JSString;
class Identifier;
class PropertyName;
class PropertySlot;
class PutPropertySlot;
class Structure;
#if ENABLE(DFG_JIT)
namespace DFG {
class JITCompiler;
class OSRExitCompiler;
class SpeculativeJIT;
}
#endif
#if ENABLE(C_LOOP)
namespace LLInt {
class CLoop;
}
#endif

struct ClassInfo;
struct DumpContext;
struct MethodTable;
enum class Unknown { };

template <class T, typename Traits> class WriteBarrierBase;
template<class T>
using WriteBarrierTraitsSelect = typename std::conditional<std::is_same<T, Unknown>::value,
    RawValueTraits<T>, RawPtrTraits<T>
>::type;

enum PreferredPrimitiveType : uint8_t { NoPreference, PreferNumber, PreferString };

struct CallData;

typedef int64_t EncodedJSValue;

inline void updateEncodedJSValueConcurrent(EncodedJSValue&, EncodedJSValue);
inline void clearEncodedJSValueConcurrent(EncodedJSValue&);

union EncodedValueDescriptor {
    int64_t asInt64;
#if USE(JSVALUE32_64)
    double asDouble;
#elif USE(JSVALUE64)
    JSCell* ptr;
#endif
        
#if CPU(BIG_ENDIAN)
    struct {
        int32_t tag;
        int32_t payload;
    } asBits;
#else
    struct {
        int32_t payload;
        int32_t tag;
    } asBits;
#endif
};

#define TagOffset (offsetof(EncodedValueDescriptor, asBits.tag))
#define PayloadOffset (offsetof(EncodedValueDescriptor, asBits.payload))

#if USE(JSVALUE64)
#define CellPayloadOffset 0
#else
#define CellPayloadOffset PayloadOffset
#endif

enum WhichValueWord {
    TagWord,
    PayloadWord
};

int64_t tryConvertToInt52(double);
bool isInt52(double);

enum class SourceCodeRepresentation : uint8_t {
    Other,
    Integer,
    Double,
    LinkTimeConstant,
};

extern JS_EXPORT_PRIVATE const ASCIILiteral SymbolCoercionError;
extern JS_EXPORT_PRIVATE std::atomic<unsigned> activeJSGlobalObjectSignpostIntervalCount;

class JSValue {
    friend struct OrderedHashTableTraits;
    friend struct EncodedJSValueHashTraits;
    friend struct EncodedJSValueWithRepresentationHashTraits;
    friend class AssemblyHelpers;
    friend class JIT;
    friend class JITSlowPathCall;
    friend class JITStubs;
    friend class JITStubCall;
    friend class JSInterfaceJIT;
    friend class JSValueSource;
    friend class SpecializedThunkJIT;
#if ENABLE(DFG_JIT)
    friend class DFG::JITCompiler;
    friend class DFG::OSRExitCompiler;
    friend class DFG::SpeculativeJIT;
#endif
#if ENABLE(C_LOOP)
    friend class LLInt::CLoop;
#endif

public:
#if USE(JSVALUE32_64)
    static constexpr uint32_t Int32Tag =        0xffffffff;
    static constexpr uint32_t BooleanTag =      0xfffffffe;
    static constexpr uint32_t NullTag =         0xfffffffd;
    static constexpr uint32_t UndefinedTag =    0xfffffffc;
    static constexpr uint32_t CellTag =         0xfffffffb;
    static constexpr uint32_t NativeCalleeTag = 0xfffffffa;
    static constexpr uint32_t EmptyValueTag =   0xfffffff9;
    static constexpr uint32_t DeletedValueTag = 0xfffffff8;
    static constexpr uint32_t InvalidTag      = 0xfffffff7;

    static constexpr uint32_t LowestTag =  InvalidTag;
#endif

    static EncodedJSValue encode(JSValue);
    static JSValue decode(EncodedJSValue);

    /* read a JSValue from storage not owned by this thread
     * on 64-bit ports, or when JIT is not enabled, equivalent to
     * JSValue::decode(*ptr) */
#if USE(JSVALUE64) || !ENABLE(CONCURRENT_JS)
    static JSValue decodeConcurrent(const EncodedJSValue*);
#else
    static JSValue decodeConcurrent(const volatile EncodedJSValue*);
#endif

    enum JSNullTag { JSNull };
    enum JSUndefinedTag { JSUndefined };
    enum JSTrueTag { JSTrue };
    enum JSFalseTag { JSFalse };
    enum JSCellTag { JSCellType };
#if USE(BIGINT32)
    enum EncodeAsBigInt32Tag { EncodeAsBigInt32 };
#endif
    enum EncodeAsDoubleTag { EncodeAsDouble };
#if ENABLE(WEBASSEMBLY) && USE(JSVALUE32_64)
    enum EncodeAsUnboxedFloatTag { EncodeAsUnboxedFloat };
#endif

    JSValue();
    JSValue(JSNullTag);
    JSValue(JSUndefinedTag);
    JSValue(JSTrueTag);
    JSValue(JSFalseTag);
    JSValue(JSCell* ptr);
    JSValue(const JSCell* ptr);
#if USE(BIGINT32)
    JSValue(EncodeAsBigInt32Tag, int32_t);
#endif
#if ENABLE(WEBASSEMBLY) && USE(JSVALUE32_64)
    JSValue(EncodeAsUnboxedFloatTag, float);
#endif

    // Numbers
    JSValue(EncodeAsDoubleTag, double);
    explicit JSValue(double);
    explicit JSValue(char);
    explicit JSValue(unsigned char);
    explicit JSValue(short);
    explicit JSValue(unsigned short);
    explicit JSValue(int);
    explicit JSValue(unsigned);
    explicit JSValue(long);
    explicit JSValue(unsigned long);
    explicit JSValue(long long);
    explicit JSValue(unsigned long long);

    explicit operator bool() const;
    bool operator==(const JSValue&) const;

    bool isInt32() const;
    bool isUInt32() const;
    bool isDouble() const;
    bool isTrue() const;
    bool isFalse() const;

    int32_t asInt32() const;
    uint32_t asUInt32() const;
    std::optional<uint32_t> tryGetAsUint32Index();
    std::optional<int32_t> tryGetAsInt32();
    int64_t asAnyInt() const;
    uint32_t asUInt32AsAnyInt() const;
    int32_t asInt32AsAnyInt() const;
    double asDouble() const;
    bool asBoolean() const;
    double asNumber() const;
#if USE(BIGINT32)
    int32_t bigInt32AsInt32() const; // must only be called on a BigInt32
#endif
    
    int32_t asInt32ForArithmetic() const; // Boolean becomes an int, but otherwise like asInt32().

    // Querying the type.
    bool isEmpty() const;
    bool isCallable() const;
    template<Concurrency> TriState isCallableWithConcurrency() const;
    bool isConstructor() const;
    template<Concurrency> TriState isConstructorWithConcurrency() const;
    bool isUndefined() const;
    bool isNull() const;
    bool isUndefinedOrNull() const;
    bool isBoolean() const;
    bool isAnyInt() const;
    bool isUInt32AsAnyInt() const;
    bool isInt32AsAnyInt() const;
    bool isNumber() const;
    bool isString() const;
    bool isBigInt() const;
    bool isHeapBigInt() const;
    bool isBigInt32() const;
    bool isZeroBigInt() const;
    bool isNegativeBigInt() const;
    bool isSymbol() const;
    bool isPrimitive() const;
    bool isGetterSetter() const;
    bool isCustomGetterSetter() const;
    bool isObject() const;
    bool inherits(const ClassInfo*) const;
    template<typename Target> bool inherits() const;
    const ClassInfo* classInfoOrNull() const;

    // Extracting the value.
    bool getString(JSGlobalObject*, WTF::String&) const;
    WTF::String getString(JSGlobalObject*) const; // null string if not a string
    JSObject* getObject() const; // 0 if not an object

    // Extracting integer values.
    bool getUInt32(uint32_t&) const;
        
    // Basic conversions.
    JSValue toPrimitive(JSGlobalObject*, PreferredPrimitiveType = NoPreference) const;
    bool toBoolean(JSGlobalObject*) const;
    TriState pureToBoolean() const;

    // toNumber conversion is expected to be side effect free if an exception has
    // been set in the CallFrame already.
    double toNumber(JSGlobalObject*) const;

    JSValue toNumeric(JSGlobalObject*) const;
    JSValue toBigIntOrInt32(JSGlobalObject*) const;
    JSBigInt* asHeapBigInt() const;

    // toNumber conversion if it can be done without side effects.
    std::optional<double> toNumberFromPrimitive() const;

    JSString* toString(JSGlobalObject*) const; // On exception, this returns the empty string.
    JSString* toStringOrNull(JSGlobalObject*) const; // On exception, this returns null, to make exception checks faster.
    Identifier toPropertyKey(JSGlobalObject*) const;
    JSValue toPropertyKeyValue(JSGlobalObject*) const;
    WTF::String toWTFString(JSGlobalObject*) const;
    JS_EXPORT_PRIVATE WTF::String toWTFStringForConsole(JSGlobalObject*) const;
    JSObject* toObject(JSGlobalObject*) const;

    // Integer conversions.
    JS_EXPORT_PRIVATE double toIntegerPreserveNaN(JSGlobalObject*) const;
    double toIntegerWithTruncation(JSGlobalObject*) const;
    double toIntegerOrInfinity(JSGlobalObject*) const;
    int32_t toInt32(JSGlobalObject*) const;
    uint32_t toUInt32(JSGlobalObject*) const;
    uint32_t toIndex(JSGlobalObject*, ASCIILiteral errorName) const;
    size_t toTypedArrayIndex(JSGlobalObject*, ASCIILiteral) const;
    uint64_t toLength(JSGlobalObject*) const;

    JS_EXPORT_PRIVATE JSValue toBigInt(JSGlobalObject*) const;
    int64_t toBigInt64(JSGlobalObject*) const;
    JS_EXPORT_PRIVATE uint64_t toBigUInt64(JSGlobalObject*) const;

    std::optional<uint32_t> toUInt32AfterToNumeric(JSGlobalObject*) const;

    // Floating point conversions (this is a convenience function for WebCore;
    // single precision float is not a representation used in JS or JSC).
    float toFloat(JSGlobalObject* globalObject) const { return static_cast<float>(toNumber(globalObject)); }

    // Object operations, with the toObject operation included.
    JSValue get(JSGlobalObject*, PropertyName) const;
    JSValue get(JSGlobalObject*, PropertyName, PropertySlot&) const;
    JSValue get(JSGlobalObject*, unsigned propertyName) const;
    JSValue get(JSGlobalObject*, unsigned propertyName, PropertySlot&) const;
    JSValue get(JSGlobalObject*, uint64_t propertyName) const;

    template<typename T, typename PropertyNameType>
    T getAs(JSGlobalObject*, PropertyNameType) const;

    bool getPropertySlot(JSGlobalObject*, PropertyName, PropertySlot&) const;
    template<typename CallbackWhenNoException> typename std::invoke_result<CallbackWhenNoException, bool, PropertySlot&>::type getPropertySlot(JSGlobalObject*, PropertyName, CallbackWhenNoException) const;
    template<typename CallbackWhenNoException> typename std::invoke_result<CallbackWhenNoException, bool, PropertySlot&>::type getPropertySlot(JSGlobalObject*, PropertyName, PropertySlot&, CallbackWhenNoException) const;

    bool getOwnPropertySlot(JSGlobalObject*, PropertyName, PropertySlot&) const;

    bool put(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    bool putInline(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    JS_EXPORT_PRIVATE bool putToPrimitive(JSGlobalObject*, PropertyName, JSValue, PutPropertySlot&);
    JS_EXPORT_PRIVATE bool putToPrimitiveByIndex(JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow);
    bool putByIndex(JSGlobalObject*, unsigned propertyName, JSValue, bool shouldThrow);

    JSValue getPrototype(JSGlobalObject*) const;
    JSValue toThis(JSGlobalObject*, ECMAMode) const;

    static bool equal(JSGlobalObject*, JSValue v1, JSValue v2);
    static bool equalSlowCase(JSGlobalObject*, JSValue v1, JSValue v2);
    static bool equalSlowCaseInline(JSGlobalObject*, JSValue v1, JSValue v2);
    static bool strictEqual(JSGlobalObject*, JSValue v1, JSValue v2);
    static bool strictEqualForCells(JSGlobalObject*, JSCell* v1, JSCell* v2);
    static TriState pureStrictEqual(JSValue v1, JSValue v2);

    bool isCell() const;
    JSCell* asCell() const;

    Structure* structureOrNull() const;

    JS_EXPORT_PRIVATE void dump(PrintStream&) const;
    void dumpInContext(PrintStream&, DumpContext*) const;
    void dumpInContextAssumingStructure(PrintStream&, DumpContext*, Structure*) const;
    void dumpForBacktrace(PrintStream&) const;

    JS_EXPORT_PRIVATE JSObject* synthesizePrototype(JSGlobalObject*) const;
    bool requireObjectCoercible(JSGlobalObject*) const;

    // Constants used for Int52. Int52 isn't part of JSValue right now, but JSValues may be
    // converted to Int52s and back again.
    static constexpr const unsigned numberOfInt52Bits = 52;
    static constexpr const int64_t notInt52 = static_cast<int64_t>(1) << numberOfInt52Bits;
    static constexpr const unsigned int52ShiftAmount = 12;
    
    static constexpr ptrdiff_t offsetOfPayload() { return OBJECT_OFFSETOF(JSValue, u.asBits.payload); }
    static constexpr ptrdiff_t offsetOfTag() { return OBJECT_OFFSETOF(JSValue, u.asBits.tag); }

#if USE(JSVALUE32_64)
    /*
     * On 32-bit platforms USE(JSVALUE32_64) should be defined, and we use a NaN-encoded
     * form for immediates.
     *
     * The encoding makes use of unused NaN space in the IEEE754 representation.  Any value
     * with the top 13 bits set represents a QNaN (with the sign bit set).  QNaN values
     * can encode a 51-bit payload.  Hardware produced and C-library payloads typically
     * have a payload of zero.  We assume that non-zero payloads are available to encode
     * pointer and integer values.  Since any 64-bit bit pattern where the top 15 bits are
     * all set represents a NaN with a non-zero payload, we can use this space in the NaN
     * ranges to encode other values (however there are also other ranges of NaN space that
     * could have been selected).
     *
     * For JSValues that do not contain a double value, the high 32 bits contain the tag
     * values listed in the enums below, which all correspond to NaN-space. In the case of
     * cell, integer and bool values the lower 32 bits (the 'payload') contain the pointer
     * integer or boolean value; in the case of all other tags the payload is 0.
     */
    uint32_t tag() const;
    int32_t payload() const;

    // This should only be used by the LLInt C Loop interpreter and OSRExit code who needs
    // synthesize JSValue from its "register"s holding tag and payload values.
    explicit JSValue(int32_t tag, int32_t payload);

#elif USE(JSVALUE64)
    /*
     * On 64-bit platforms USE(JSVALUE64) should be defined, and we use a NaN-encoded
     * form for immediates.
     *
     * The encoding makes use of unused NaN space in the IEEE754 representation.  Any value
     * with the top 13 bits set represents a QNaN (with the sign bit set).  QNaN values
     * can encode a 51-bit payload.  Hardware produced and C-library payloads typically
     * have a payload of zero.  We assume that non-zero payloads are available to encode
     * pointer and integer values.  Since any 64-bit bit pattern where the top 15 bits are
     * all set represents a NaN with a non-zero payload, we can use this space in the NaN
     * ranges to encode other values (however there are also other ranges of NaN space that
     * could have been selected).
     *
     * This range of NaN space is represented by 64-bit numbers beginning with the 15-bit
     * hex patterns 0xFFFC and 0xFFFE - we rely on the fact that no valid double-precision
     * numbers will fall in these ranges.
     *
     * The top 15-bits denote the type of the encoded JSValue:
     *
     *     Pointer {  0000:PPPP:PPPP:PPPP
     *              / 0002:****:****:****
     *     Double  {         ...
     *              \ FFFC:****:****:****
     *     Integer {  FFFE:0000:IIII:IIII
     *
     * The scheme we have implemented encodes double precision values by performing a
     * 64-bit integer addition of the value 2^49 to the number. After this manipulation
     * no encoded double-precision value will begin with the pattern 0x0000 or 0xFFFE.
     * Values must be decoded by reversing this operation before subsequent floating point
     * operations may be peformed.
     *
     * 32-bit signed integers are marked with the 16-bit tag 0xFFFE.
     *
     * The tag 0x0000 denotes a pointer, or another form of tagged immediate. Boolean,
     * null and undefined values are represented by specific, invalid pointer values:
     *
     *     False:     0x06
     *     True:      0x07
     *     Undefined: 0x0a
     *     Null:      0x02
     *
     * These values have the following properties:
     * - Bit 1 (0-indexed) is set (OtherTag) for all four values, allowing real pointers to be
     *   quickly distinguished from all immediate values, including these invalid pointers.
     * - With bit 3 (0-indexed) masked out (UndefinedTag), Undefined and Null share the
     *   same value, allowing null & undefined to be quickly detected.
     *
     * No valid JSValue will have the bit pattern 0x0, this is used to represent array
     * holes, and as a C++ 'no value' result (e.g. JSValue() has an internal value of 0).
     *
     * When USE(BIGINT32), we have a special representation for BigInts that are small (32-bit at most):
     *      0000:XXXX:XXXX:0012
     * This representation works because of the following things:
     * - It cannot be confused with a Double or Integer thanks to the top bits
     * - It cannot be confused with a pointer to a Cell, thanks to bit 1 which is set to true
     * - It cannot be confused with a pointer to wasm thanks to bit 0 which is set to false
     * - It cannot be confused with true/false because bit 2 is set to false
     * - It cannot be confused for null/undefined because bit 4 is set to true
     */

    // This value is 2^49, used to encode doubles such that the encoded value will begin
    // with a 15-bit pattern within the range 0x0002..0xFFFC.
    static constexpr size_t DoubleEncodeOffsetBit = 49;
    static constexpr int64_t DoubleEncodeOffset = 1ll << DoubleEncodeOffsetBit;

    // If all bits in the mask are set, this indicates an integer number,
    // if any but not all are set this value is a double precision number.
    static constexpr int64_t NumberTag = 0xfffe000000000000ll;
    // The following constant is used for a trick in the implementation of strictEq, to detect if either of the arguments is a double
    static constexpr int64_t LowestOfHighBits = 1ULL << 49;
    static_assert(LowestOfHighBits & NumberTag);
    static_assert(!((LowestOfHighBits>>1) & NumberTag));

    // All non-numeric (bool, null, undefined) immediates have bit 1 (0-indexed) set.
    static constexpr int32_t OtherTag       = 0x2;
    static constexpr int32_t BoolTag        = 0x4;
    static constexpr int32_t UndefinedTag   = 0x8;
#if USE(BIGINT32)
    static constexpr int32_t BigInt32Tag    = 0x12;
    static constexpr int64_t BigInt32Mask   = NumberTag | BigInt32Tag;
#endif
    // Combined integer value for non-numeric immediates.
    static constexpr int32_t ValueFalse     = OtherTag | BoolTag | false;
    static constexpr int32_t ValueTrue      = OtherTag | BoolTag | true;
    static constexpr int32_t ValueUndefined = OtherTag | UndefinedTag;
    static constexpr int32_t ValueNull      = OtherTag;

    static constexpr int64_t MiscTag = OtherTag | BoolTag | UndefinedTag;

    // NotCellMask is used to check for all types of immediate values (either number or 'other').
    static constexpr int64_t NotCellMask = NumberTag | OtherTag;
    
    // These special values are never visible to JavaScript code; Empty is used to represent
    // Array holes, and for uninitialized JSValues. Deleted is used in hash table code.
    // These values would map to cell types in the JSValue encoding, but not valid GC cell
    // pointer should have either of these values (Empty is null, deleted is at an invalid
    // alignment for a GC cell, and in the zero page).
    static constexpr int32_t ValueEmpty   = 0x0;
    static constexpr int32_t ValueDeleted = 0x4;

    static constexpr int64_t NativeCalleeTag = OtherTag | 0x1;
    static constexpr int64_t NativeCalleeMask = NumberTag | 0x7;
    // We tag Wasm non-JSCell pointers with a 3 at the bottom. We can test if a 64-bit JSValue pattern
    // is a Wasm callee by masking the upper 16 bits and the lower 3 bits, and seeing if
    // the resulting value is 3. The full test is: x & NativeCalleeMask == NativeCalleeTag
    // This works because the lower 3 bits of the non-number immediate values are as follows:
    // undefined: 0b010
    // null:      0b010
    // true:      0b111
    // false:     0b110
    // The test rejects all of these because none have just the value 3 in their lower 3 bits.
    // The test rejects all numbers because they have non-zero upper 16 bits.
    // The test also rejects normal cells because they won't have the number 3 as
    // their lower 3 bits. Note, this bit pattern also allows the normal JSValue isCell(), etc,
    // predicates to work on a Wasm::Callee because the various tests will fail if you
    // bit casted a boxed Wasm::Callee* to a JSValue. isCell() would fail since it sees
    // OtherTag. The other tests also trivially fail, since it won't be a number,
    // and it won't be equal to null, undefined, true, or false. The isBoolean() predicate
    // will fail because we won't have BoolTag set.
#endif

private:
    template <class T> JSValue(WriteBarrierBase<T, WriteBarrierTraitsSelect<T>>);

    enum HashTableDeletedValueTag { HashTableDeletedValue };
    JSValue(HashTableDeletedValueTag);

    inline const JSValue asValue() const { return *this; }
    JS_EXPORT_PRIVATE double toNumberSlowCase(JSGlobalObject*) const;
    JS_EXPORT_PRIVATE JSString* toStringSlowCase(JSGlobalObject*, bool returnEmptyStringOnError) const;
    JS_EXPORT_PRIVATE WTF::String toWTFStringSlowCase(JSGlobalObject*) const;
    JS_EXPORT_PRIVATE JSObject* toObjectSlowCase(JSGlobalObject*) const;
    JS_EXPORT_PRIVATE JSValue toThisSloppySlowCase(JSGlobalObject*) const;

    EncodedValueDescriptor u;
};

#if USE(JSVALUE32_64)
struct OrderedHashTableTraits {
    ALWAYS_INLINE static void set(JSValue* value, uint32_t number)
    {
        value->u.asBits.tag = JSValue::Int32Tag;
        value->u.asBits.payload = number;
    }
    ALWAYS_INLINE static void increment(JSValue* value)
    {
        ASSERT(value->isInt32());
        value->u.asBits.payload++;
    }
    ALWAYS_INLINE static void decrement(JSValue* value)
    {
        ASSERT(value->isInt32());
        value->u.asBits.payload--;
    }
};
#else
struct OrderedHashTableTraits {
    ALWAYS_INLINE static void set(JSValue* value, uint32_t number)
    {
        value->u.asInt64 = JSValue::NumberTag | number;
    }
    ALWAYS_INLINE static void increment(JSValue* value)
    {
        ASSERT(value->isInt32());
        value->u.asInt64++;
    }
    ALWAYS_INLINE static void decrement(JSValue* value)
    {
        ASSERT(value->isInt32());
        value->u.asInt64--;
    }
};
#endif

typedef IntHash<EncodedJSValue> EncodedJSValueHash;

#if USE(JSVALUE32_64)
struct EncodedJSValueHashTraits : HashTraits<EncodedJSValue> {
    static constexpr bool emptyValueIsZero = false;
    static EncodedJSValue emptyValue() { return JSValue::encode(JSValue()); }
    static void constructDeletedValue(EncodedJSValue& slot) { slot = JSValue::encode(JSValue(JSValue::HashTableDeletedValue)); }
    static bool isDeletedValue(EncodedJSValue value) { return value == JSValue::encode(JSValue(JSValue::HashTableDeletedValue)); }
};
#else
struct EncodedJSValueHashTraits : HashTraits<EncodedJSValue> {
    static void constructDeletedValue(EncodedJSValue& slot) { slot = JSValue::encode(JSValue(JSValue::HashTableDeletedValue)); }
    static bool isDeletedValue(EncodedJSValue value) { return value == JSValue::encode(JSValue(JSValue::HashTableDeletedValue)); }
};
#endif

typedef std::pair<EncodedJSValue, SourceCodeRepresentation> EncodedJSValueWithRepresentation;

struct EncodedJSValueWithRepresentationHashTraits : HashTraits<EncodedJSValueWithRepresentation> {
    static constexpr bool emptyValueIsZero = false;
    static EncodedJSValueWithRepresentation emptyValue() { return std::make_pair(JSValue::encode(JSValue()), SourceCodeRepresentation::Other); }
    static void constructDeletedValue(EncodedJSValueWithRepresentation& slot) { slot = std::make_pair(JSValue::encode(JSValue(JSValue::HashTableDeletedValue)), SourceCodeRepresentation::Other); }
    static bool isDeletedValue(EncodedJSValueWithRepresentation value) { return value == std::make_pair(JSValue::encode(JSValue(JSValue::HashTableDeletedValue)), SourceCodeRepresentation::Other); }
};

struct EncodedJSValueWithRepresentationHash {
    static unsigned hash(const EncodedJSValueWithRepresentation& value)
    {
        return WTF::pairIntHash(EncodedJSValueHash::hash(value.first), IntHash<SourceCodeRepresentation>::hash(value.second));
    }
    static bool equal(const EncodedJSValueWithRepresentation& a, const EncodedJSValueWithRepresentation& b)
    {
        return a == b;
    }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

// Stand-alone helper functions.
inline JSValue jsNull()
{
    return JSValue(JSValue::JSNull);
}

inline JSValue jsUndefined()
{
    return JSValue(JSValue::JSUndefined);
}

inline JSValue jsTDZValue()
{
    return JSValue();
}

inline JSValue jsBoolean(bool b)
{
    return b ? JSValue(JSValue::JSTrue) : JSValue(JSValue::JSFalse);
}

#if USE(BIGINT32)
ALWAYS_INLINE JSValue jsBigInt32(int32_t intValue)
{
    return JSValue(JSValue::EncodeAsBigInt32, intValue);
}
#endif

#if ENABLE(WEBASSEMBLY) && USE(JSVALUE32_64)
ALWAYS_INLINE JSValue wasmUnboxedFloat(float f)
{
    return JSValue(JSValue::EncodeAsUnboxedFloat, f);
}
#endif

ALWAYS_INLINE JSValue jsDoubleNumber(double d)
{
    ASSERT(JSValue(JSValue::EncodeAsDouble, d).isNumber());
    return JSValue(JSValue::EncodeAsDouble, d);
}

ALWAYS_INLINE JSValue jsNumber(double d)
{
    ASSERT(JSValue(d).isNumber());
    ASSERT(!isImpureNaN(d));
    return JSValue(d);
}

ALWAYS_INLINE JSValue jsNumber(const MediaTime& t)
{
    return jsNumber(t.toDouble());
}

ALWAYS_INLINE JSValue jsNumber(char i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(unsigned char i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(short i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(unsigned short i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(int i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(unsigned i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(long i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(unsigned long i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(long long i)
{
    return JSValue(i);
}

ALWAYS_INLINE JSValue jsNumber(unsigned long long i)
{
    return JSValue(i);
}

ALWAYS_INLINE EncodedJSValue encodedJSUndefined()
{
    return JSValue::encode(jsUndefined());
}

ALWAYS_INLINE EncodedJSValue encodedJSValue()
{
    return JSValue::encode(JSValue());
}

inline bool operator==(const JSValue a, const JSCell* b) { return a == JSValue(b); }
inline bool operator==(const JSCell* a, const JSValue b) { return JSValue(a) == b; }

bool isThisValueAltered(const PutPropertySlot&, JSObject* baseObject);

// See section 7.2.9: https://tc39.github.io/ecma262/#sec-samevalue
bool sameValue(JSGlobalObject*, JSValue a, JSValue b);

ALWAYS_INLINE void ensureStillAliveHere(JSValue value)
{
#if USE(JSVALUE64)
    asm volatile ("" : : "g"(std::bit_cast<uint64_t>(value)) : "memory");
#else
    asm volatile ("" : : "g"(value.payload()) : "memory");
#endif
}

// Use EnsureStillAliveScope when you have a data structure that includes GC pointers, and you need
// to remove it from the DOM and then use it in the same scope. For example, a 'once' event listener
// needs to be removed from the DOM and then fired.
class EnsureStillAliveScope {
    WTF_FORBID_HEAP_ALLOCATION;
    WTF_MAKE_NONCOPYABLE(EnsureStillAliveScope);
    WTF_MAKE_NONMOVABLE(EnsureStillAliveScope);
public:
    EnsureStillAliveScope(JSValue value)
        : m_value(value)
    {
    }

    ~EnsureStillAliveScope()
    {
        ensureStillAliveHere(m_value);
    }

    JSValue value() const { return m_value; }

private:
    JSValue m_value;
};

#if USE(JSVALUE64) || !ENABLE(CONCURRENT_JS)

ALWAYS_INLINE JSValue JSValue::decodeConcurrent(const EncodedJSValue* encodedJSValue)
{
    return JSValue::decode(*encodedJSValue);
}

ALWAYS_INLINE void updateEncodedJSValueConcurrent(EncodedJSValue& dest, EncodedJSValue value)
{
    dest = value;
}

ALWAYS_INLINE void clearEncodedJSValueConcurrent(EncodedJSValue& dest)
{
    dest = JSValue::encode(JSValue());
}

#elif USE(JSVALUE32_64)

inline JSValue JSValue::decodeConcurrent(const volatile EncodedJSValue *encodedJSValue)
{
    for (;;) {
        auto v = JSValue::decode(reinterpret_cast<const volatile std::atomic<EncodedJSValue>*>(encodedJSValue)->load());
        if (v.tag() != InvalidTag)
            return v;
    }
}

inline void updateEncodedJSValueConcurrent(EncodedJSValue& dest, EncodedJSValue value)
{
    auto destDesc = const_cast<volatile EncodedValueDescriptor*>(reinterpret_cast<EncodedValueDescriptor*>(&dest));

    EncodedValueDescriptor desc;
    memcpy(&desc, &value, sizeof(value));

    auto destTag = const_cast<volatile int32_t*>(&destDesc->asBits.tag);
    auto destPayload = const_cast<volatile int32_t*>(&destDesc->asBits.payload);

    *destTag = JSValue::InvalidTag;
    WTF::storeStoreFence();
    *destPayload = desc.asBits.payload;
    WTF::storeStoreFence();
    *destTag = desc.asBits.tag;
}

inline void clearEncodedJSValueConcurrent(EncodedJSValue& dest)
{
    auto destDesc = const_cast<volatile EncodedValueDescriptor*>(reinterpret_cast<EncodedValueDescriptor*>(&dest));
    auto destTag = const_cast<volatile int32_t*>(&destDesc->asBits.tag);
    auto destPayload = const_cast<volatile int32_t*>(&destDesc->asBits.payload);

    *destTag = JSValue::EmptyValueTag;
    WTF::storeStoreFence();
    *destPayload = 0;
}

#else
#  error "Unsupported configuration"
#endif

} // namespace JSC
