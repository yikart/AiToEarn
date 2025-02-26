/*
 * Copyright (C) 2011-2020 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CPU.h"
#include "JSCJSValue.h"
#include "TypedArrayType.h"
#include <wtf/PrintStream.h>

namespace JSC {

class Structure;

typedef uint64_t SpeculatedType;
static constexpr SpeculatedType SpecNone                              = 0; // We don't know anything yet.
static constexpr SpeculatedType SpecFinalObject                       = 1ull << 0; // It's definitely a JSFinalObject.
static constexpr SpeculatedType SpecArray                             = 1ull << 1; // It's definitely a JSArray.
static constexpr SpeculatedType SpecFunction                          = 1ull << 2; // It's definitely a JSFunction.
static constexpr SpeculatedType SpecInt8Array                         = 1ull << 4; // It's definitely an Int8Array or one of its subclasses.
static constexpr SpeculatedType SpecInt16Array                        = 1ull << 5; // It's definitely an Int16Array or one of its subclasses.
static constexpr SpeculatedType SpecInt32Array                        = 1ull << 6; // It's definitely an Int32Array or one of its subclasses.
static constexpr SpeculatedType SpecUint8Array                        = 1ull << 7; // It's definitely an Uint8Array or one of its subclasses.
static constexpr SpeculatedType SpecUint8ClampedArray                 = 1ull << 8; // It's definitely an Uint8ClampedArray or one of its subclasses.
static constexpr SpeculatedType SpecUint16Array                       = 1ull << 9; // It's definitely an Uint16Array or one of its subclasses.
static constexpr SpeculatedType SpecUint32Array                       = 1ull << 10; // It's definitely an Uint32Array or one of its subclasses.
static constexpr SpeculatedType SpecFloat16Array                      = 1ull << 11; // It's definitely an Float16Array or one of its subclasses.
static constexpr SpeculatedType SpecFloat32Array                      = 1ull << 12; // It's definitely an Float32Array or one of its subclasses.
static constexpr SpeculatedType SpecFloat64Array                      = 1ull << 13; // It's definitely an Float64Array or one of its subclasses.
static constexpr SpeculatedType SpecBigInt64Array                     = 1ull << 14; // It's definitely an BigInt64Array or one of its subclasses.
static constexpr SpeculatedType SpecBigUint64Array                    = 1ull << 15; // It's definitely an BigUint64Array or one of its subclasses.
static constexpr SpeculatedType SpecTypedArrayView                    = SpecInt8Array | SpecInt16Array | SpecInt32Array | SpecUint8Array | SpecUint8ClampedArray | SpecUint16Array | SpecUint32Array | SpecFloat16Array | SpecFloat32Array | SpecFloat64Array | SpecBigInt64Array | SpecBigUint64Array;
static constexpr SpeculatedType SpecDirectArguments                   = 1ull << 16; // It's definitely a DirectArguments object.
static constexpr SpeculatedType SpecScopedArguments                   = 1ull << 17; // It's definitely a ScopedArguments object.
static constexpr SpeculatedType SpecStringObject                      = 1ull << 18; // It's definitely a StringObject.
static constexpr SpeculatedType SpecRegExpObject                      = 1ull << 19; // It's definitely a RegExpObject (and not any subclass of RegExpObject).
static constexpr SpeculatedType SpecDateObject                        = 1ull << 20; // It's definitely a Date object or one of its subclasses.
static constexpr SpeculatedType SpecPromiseObject                     = 1ull << 21; // It's definitely a Promise object or one of its subclasses.
static constexpr SpeculatedType SpecMapObject                         = 1ull << 22; // It's definitely a Map object or one of its subclasses.
static constexpr SpeculatedType SpecSetObject                         = 1ull << 23; // It's definitely a Set object or one of its subclasses.
static constexpr SpeculatedType SpecWeakMapObject                     = 1ull << 24; // It's definitely a WeakMap object or one of its subclasses.
static constexpr SpeculatedType SpecWeakSetObject                     = 1ull << 25; // It's definitely a WeakSet object or one of its subclasses.
static constexpr SpeculatedType SpecProxyObject                       = 1ull << 26; // It's definitely a Proxy object or one of its subclasses.
static constexpr SpeculatedType SpecGlobalProxy                       = 1ull << 27; // It's definitely a Proxy object or one of its subclasses.
static constexpr SpeculatedType SpecDerivedArray                      = 1ull << 28; // It's definitely a DerivedArray object.
static constexpr SpeculatedType SpecObjectOther                       = 1ull << 29; // It's definitely an object but not JSFinalObject, JSArray, or JSFunction.
static constexpr SpeculatedType SpecStringIdent                       = 1ull << 30; // It's definitely a JSString, and it's an identifier.
static constexpr SpeculatedType SpecStringVar                         = 1ull << 31; // It's definitely a JSString, and it's not an identifier.
static constexpr SpeculatedType SpecString                            = SpecStringIdent | SpecStringVar; // It's definitely a JSString.
static constexpr SpeculatedType SpecSymbol                            = 1ull << 32; // It's definitely a Symbol.
static constexpr SpeculatedType SpecCellOther                         = 1ull << 33; // It's definitely a JSCell but not a subclass of JSObject and definitely not a JSString, BigInt, or Symbol.
static constexpr SpeculatedType SpecBoolInt32                         = 1ull << 34; // It's definitely an Int32 with value 0 or 1.
static constexpr SpeculatedType SpecNonBoolInt32                      = 1ull << 35; // It's definitely an Int32 with value other than 0 or 1.
static constexpr SpeculatedType SpecInt32Only                         = SpecBoolInt32 | SpecNonBoolInt32; // It's definitely an Int32.

static constexpr SpeculatedType SpecInt32AsInt52                      = 1ull << 36; // It's an Int52 and it can fit in an int32.
static constexpr SpeculatedType SpecNonInt32AsInt52                   = 1ull << 37; // It's an Int52 and it can't fit in an int32.
static constexpr SpeculatedType SpecInt52Any                          = SpecInt32AsInt52 | SpecNonInt32AsInt52; // It's any kind of Int52.

static constexpr SpeculatedType SpecAnyIntAsDouble                    = 1ull << 38; // It's definitely an Int52 and it's inside a double.
static constexpr SpeculatedType SpecNonIntAsDouble                    = 1ull << 39; // It's definitely not an Int52 but it's a real number and it's a double.
static constexpr SpeculatedType SpecDoubleReal                        = SpecNonIntAsDouble | SpecAnyIntAsDouble; // It's definitely a non-NaN double.
static constexpr SpeculatedType SpecDoublePureNaN                     = 1ull << 40; // It's definitely a NaN that is safe to tag (i.e. pure).
static constexpr SpeculatedType SpecDoubleImpureNaN                   = 1ull << 41; // It's definitely a NaN that is unsafe to tag (i.e. impure).
static constexpr SpeculatedType SpecDoubleNaN                         = SpecDoublePureNaN | SpecDoubleImpureNaN; // It's definitely some kind of NaN.
static constexpr SpeculatedType SpecBytecodeDouble                    = SpecDoubleReal | SpecDoublePureNaN; // It's either a non-NaN or a NaN double, but it's definitely not impure NaN.
static constexpr SpeculatedType SpecFullDouble                        = SpecDoubleReal | SpecDoubleNaN; // It's either a non-NaN or a NaN double.
static constexpr SpeculatedType SpecBytecodeRealNumber                = SpecInt32Only | SpecDoubleReal; // It's either an Int32 or a DoubleReal.
static constexpr SpeculatedType SpecFullRealNumber                    = SpecInt32Only | SpecInt52Any | SpecDoubleReal; // It's either an Int32 or a DoubleReal, or an Int52.
static constexpr SpeculatedType SpecBytecodeNumber                    = SpecInt32Only | SpecBytecodeDouble; // It's either an Int32 or a Double, and the Double cannot be an impure NaN.
static constexpr SpeculatedType SpecIntAnyFormat                      = SpecInt52Any | SpecInt32Only | SpecAnyIntAsDouble;

static constexpr SpeculatedType SpecFullNumber                        = SpecIntAnyFormat | SpecFullDouble; // It's either an Int32, Int52, or a Double, and the Double can be impure NaN.
static constexpr SpeculatedType SpecBoolean                           = 1ull << 42; // It's definitely a Boolean.
static constexpr SpeculatedType SpecOther                             = 1ull << 43; // It's definitely either Null or Undefined.
static constexpr SpeculatedType SpecMisc                              = SpecBoolean | SpecOther; // It's definitely either a boolean, Null, or Undefined.
static constexpr SpeculatedType SpecEmpty                             = 1ull << 44; // It's definitely an empty value marker.
static constexpr SpeculatedType SpecHeapBigInt                        = 1ull << 45; // It's definitely a BigInt that is allocated on the heap
static constexpr SpeculatedType SpecBigInt32                          = 1ull << 46; // It's definitely a small BigInt that is inline the JSValue
#if USE(BIGINT32)
static constexpr SpeculatedType SpecBigInt                            = SpecBigInt32 | SpecHeapBigInt;
#else
// We should not include SpecBigInt32. We are using SpecBigInt in various places like prediction. If this includes SpecBigInt32, fixup phase is confused if !USE(BIGINT32) since it is not using AnyBigIntUse.
static constexpr SpeculatedType SpecBigInt                            = SpecHeapBigInt;
#endif
static constexpr SpeculatedType SpecDataViewObject                    = 1ull << 47; // It's definitely a JSDataView.
static constexpr SpeculatedType SpecPrimitive                         = SpecString | SpecSymbol | SpecBytecodeNumber | SpecMisc | SpecBigInt; // It's any non-Object JSValue.
static constexpr SpeculatedType SpecObject                            = SpecFinalObject | SpecArray | SpecFunction | SpecTypedArrayView | SpecDirectArguments | SpecScopedArguments | SpecStringObject | SpecRegExpObject | SpecDateObject | SpecPromiseObject | SpecMapObject | SpecSetObject | SpecWeakMapObject | SpecWeakSetObject | SpecProxyObject | SpecGlobalProxy | SpecDerivedArray | SpecObjectOther | SpecDataViewObject; // Bitmask used for testing for any kind of object prediction.
static constexpr SpeculatedType SpecCell                              = SpecObject | SpecString | SpecSymbol | SpecCellOther | SpecHeapBigInt; // It's definitely a JSCell.
static constexpr SpeculatedType SpecHeapTop                           = SpecCell | SpecBigInt32 | SpecBytecodeNumber | SpecMisc; // It can be any of the above, except for SpecInt52Only and SpecDoubleImpureNaN.
static constexpr SpeculatedType SpecBytecodeTop                       = SpecHeapTop | SpecEmpty; // It can be any of the above, except for SpecInt52Only and SpecDoubleImpureNaN. Corresponds to what could be found in a bytecode local.
static constexpr SpeculatedType SpecFullTop                           = SpecBytecodeTop | SpecFullNumber; // It can be anything that bytecode could see plus exotic encodings of numbers.

static constexpr SpeculatedType SpecTypeofMightBeFunction             = SpecFunction | SpecObjectOther | SpecProxyObject; // If you don't see these types, you can't be callable, and you can't have typeof produce "function". Inverse is not true, however. If you only see these types, you may produce more things than "function" in typeof, and you might not be callable.

// SpecCellCheck is the type set representing the values that can flow through a cell check.
// On 64-bit platforms, the empty value passes a cell check. Also, ~SpecCellCheck is the type
// set that representing the values that flow through when testing that something is not a cell.
static constexpr SpeculatedType SpecCellCheck          = is64Bit() ? (SpecCell | SpecEmpty) : SpecCell;

typedef bool (*SpeculatedTypeChecker)(SpeculatedType);

// Dummy prediction checker, only useful if someone insists on requiring a prediction checker.
inline bool isAnySpeculation(SpeculatedType)
{
    return true;
}

inline bool isSubtypeSpeculation(SpeculatedType value, SpeculatedType category)
{
    return !(value & ~category) && value;
}

inline bool speculationContains(SpeculatedType value, SpeculatedType category)
{
    return !!(value & category) && value;
}

inline bool isCellSpeculation(SpeculatedType value)
{
    return !!(value & SpecCell) && !(value & ~SpecCell);
}

inline bool isCellOrOtherSpeculation(SpeculatedType value)
{
    return !!value && !(value & ~(SpecCell | SpecOther));
}

inline bool isNotCellSpeculation(SpeculatedType value)
{
    return !(value & SpecCellCheck) && value;
}

inline bool isNotCellNorBigIntSpeculation(SpeculatedType value)
{
    return !(value & (SpecCellCheck | SpecBigInt)) && value;
}

inline bool isObjectSpeculation(SpeculatedType value)
{
    return !!(value & SpecObject) && !(value & ~SpecObject);
}

inline bool isObjectOrOtherSpeculation(SpeculatedType value)
{
    return !!(value & (SpecObject | SpecOther)) && !(value & ~(SpecObject | SpecOther));
}

inline bool isFinalObjectSpeculation(SpeculatedType value)
{
    return value == SpecFinalObject;
}

inline bool isFinalObjectOrOtherSpeculation(SpeculatedType value)
{
    return !!(value & (SpecFinalObject | SpecOther)) && !(value & ~(SpecFinalObject | SpecOther));
}

inline bool isStringIdentSpeculation(SpeculatedType value)
{
    return value == SpecStringIdent;
}

inline bool isNotStringVarSpeculation(SpeculatedType value)
{
    return !(value & SpecStringVar);
}

inline bool isStringSpeculation(SpeculatedType value)
{
    return !!value && (value & SpecString) == value;
}

inline bool isNotStringSpeculation(SpeculatedType value)
{
    return value && !(value & SpecString);
}

inline bool isStringOrOtherSpeculation(SpeculatedType value)
{
    return !!value && (value & (SpecString | SpecOther)) == value;
}

inline bool isSymbolSpeculation(SpeculatedType value)
{
    return value == SpecSymbol;
}

inline bool isBigInt32Speculation(SpeculatedType value)
{
    return value == SpecBigInt32;
}

inline bool isHeapBigIntSpeculation(SpeculatedType value)
{
    return value == SpecHeapBigInt;
}

inline bool isBigIntSpeculation(SpeculatedType value)
{
    return !!value && (value & SpecBigInt) == value;
}

inline bool isArraySpeculation(SpeculatedType value)
{
    return value == SpecArray;
}

inline bool isFunctionSpeculation(SpeculatedType value)
{
    return value == SpecFunction;
}

inline bool isProxyObjectSpeculation(SpeculatedType value)
{
    return value == SpecProxyObject;
}

inline bool isGlobalProxySpeculation(SpeculatedType value)
{
    return value == SpecGlobalProxy;
}

inline bool isDerivedArraySpeculation(SpeculatedType value)
{
    return value == SpecDerivedArray;
}

inline bool isInt8ArraySpeculation(SpeculatedType value)
{
    return value == SpecInt8Array;
}

inline bool isInt16ArraySpeculation(SpeculatedType value)
{
    return value == SpecInt16Array;
}

inline bool isInt32ArraySpeculation(SpeculatedType value)
{
    return value == SpecInt32Array;
}

inline bool isUint8ArraySpeculation(SpeculatedType value)
{
    return value == SpecUint8Array;
}

inline bool isUint8ClampedArraySpeculation(SpeculatedType value)
{
    return value == SpecUint8ClampedArray;
}

inline bool isUint16ArraySpeculation(SpeculatedType value)
{
    return value == SpecUint16Array;
}

inline bool isUint32ArraySpeculation(SpeculatedType value)
{
    return value == SpecUint32Array;
}

inline bool isFloat16ArraySpeculation(SpeculatedType value)
{
    return value == SpecFloat16Array;
}

inline bool isFloat32ArraySpeculation(SpeculatedType value)
{
    return value == SpecFloat32Array;
}

inline bool isFloat64ArraySpeculation(SpeculatedType value)
{
    return value == SpecFloat64Array;
}

inline bool isBigInt64ArraySpeculation(SpeculatedType value)
{
    return value == SpecBigInt64Array;
}

inline bool isBigUint64ArraySpeculation(SpeculatedType value)
{
    return value == SpecBigUint64Array;
}

inline bool isDirectArgumentsSpeculation(SpeculatedType value)
{
    return value == SpecDirectArguments;
}

inline bool isScopedArgumentsSpeculation(SpeculatedType value)
{
    return value == SpecScopedArguments;
}

inline bool isArrayOrOtherSpeculation(SpeculatedType value)
{
    return !!(value & (SpecArray | SpecOther)) && !(value & ~(SpecArray | SpecOther));
}

inline bool isStringObjectSpeculation(SpeculatedType value)
{
    return value == SpecStringObject;
}

inline bool isStringOrStringObjectSpeculation(SpeculatedType value)
{
    return !!value && !(value & ~(SpecString | SpecStringObject));
}

inline bool isRegExpObjectSpeculation(SpeculatedType value)
{
    return value == SpecRegExpObject;
}

inline bool isBoolInt32Speculation(SpeculatedType value)
{
    return value == SpecBoolInt32;
}

inline bool isInt32Speculation(SpeculatedType value)
{
    return value && !(value & ~SpecInt32Only);
}

inline bool isNotInt32Speculation(SpeculatedType value)
{
    return value && !(value & SpecInt32Only);
}

inline bool isInt32OrBooleanSpeculation(SpeculatedType value)
{
    return value && !(value & ~(SpecBoolean | SpecInt32Only));
}

inline bool isInt32SpeculationForArithmetic(SpeculatedType value)
{
    return !(value & (SpecFullDouble | SpecNonInt32AsInt52 | SpecBigInt));
}

inline bool isInt32OrBooleanSpeculationForArithmetic(SpeculatedType value)
{
    return !(value & (SpecFullDouble | SpecNonInt32AsInt52 | SpecBigInt));
}

inline bool isInt32OrBooleanSpeculationExpectingDefined(SpeculatedType value)
{
    return isInt32OrBooleanSpeculation(value & ~SpecOther);
}

inline bool isAnyInt52Speculation(SpeculatedType value)
{
    return !!value && (value & SpecInt52Any) == value;
}

inline bool isInt32OrInt52Speculation(SpeculatedType value)
{
    return !!value && (value & (SpecInt32Only | SpecInt52Any)) == value;
}

inline bool isIntAnyFormat(SpeculatedType value)
{
    return !!value && (value & SpecIntAnyFormat) == value;
}

inline bool isAnyIntAsDoubleSpeculation(SpeculatedType value)
{
    return value == SpecAnyIntAsDouble;
}

inline bool isDoubleRealSpeculation(SpeculatedType value)
{
    return !!value && (value & SpecDoubleReal) == value;
}

inline bool isDoubleSpeculation(SpeculatedType value)
{
    return !!value && (value & SpecFullDouble) == value;
}

inline bool isDoubleSpeculationForArithmetic(SpeculatedType value)
{
    return !!(value & SpecFullDouble);
}

inline bool isBytecodeRealNumberSpeculation(SpeculatedType value)
{
    return !!(value & SpecBytecodeRealNumber) && !(value & ~SpecBytecodeRealNumber);
}

inline bool isFullRealNumberSpeculation(SpeculatedType value)
{
    return !!(value & SpecFullRealNumber) && !(value & ~SpecFullRealNumber);
}

inline bool isBytecodeNumberSpeculation(SpeculatedType value)
{
    return !!(value & SpecBytecodeNumber) && !(value & ~SpecBytecodeNumber);
}

inline bool isFullNumberSpeculation(SpeculatedType value)
{
    return !!(value & SpecFullNumber) && !(value & ~SpecFullNumber);
}

inline bool isFullNumberOrBooleanSpeculation(SpeculatedType value)
{
    return value && !(value & ~(SpecFullNumber | SpecBoolean));
}

inline bool isFullNumberOrBooleanSpeculationExpectingDefined(SpeculatedType value)
{
    return isFullNumberOrBooleanSpeculation(value & ~SpecOther);
}

inline bool isBooleanSpeculation(SpeculatedType value)
{
    return value == SpecBoolean;
}

inline bool isNotBooleanSpeculation(SpeculatedType value)
{
    return value && !(value & SpecBoolean);
}

inline bool isNotDoubleSpeculation(SpeculatedType type)
{
    return !(type & SpecFullDouble);
}

inline bool isNeitherDoubleNorHeapBigIntNorStringSpeculation(SpeculatedType type)
{
    return !(type & (SpecFullDouble | SpecHeapBigInt | SpecString));
}

inline bool isNeitherDoubleNorHeapBigIntSpeculation(SpeculatedType type)
{
    return !(type & (SpecFullDouble | SpecHeapBigInt));
}

inline bool isOtherSpeculation(SpeculatedType value)
{
    return value == SpecOther;
}

inline bool isMiscSpeculation(SpeculatedType value)
{
    return !!value && !(value & ~SpecMisc);
}

inline bool isOtherOrEmptySpeculation(SpeculatedType value)
{
    return !value || value == SpecOther;
}

inline bool isEmptySpeculation(SpeculatedType value)
{
    return value == SpecEmpty;
}

inline bool isUntypedSpeculationForArithmetic(SpeculatedType value)
{
    return !!(value & ~(SpecFullNumber | SpecBoolean));
}

inline bool isUntypedSpeculationForBitOps(SpeculatedType value)
{
    return !!(value & ~(SpecFullNumber | SpecBoolean | SpecOther));
}

void dumpSpeculation(PrintStream&, SpeculatedType);
void dumpSpeculationAbbreviated(PrintStream&, SpeculatedType);

MAKE_PRINT_ADAPTOR(SpeculationDump, SpeculatedType, dumpSpeculation);
MAKE_PRINT_ADAPTOR(AbbreviatedSpeculationDump, SpeculatedType, dumpSpeculationAbbreviated);

// Merge two predictions. Note that currently this just does left | right. It may
// seem tempting to do so directly, but you would be doing so at your own peril,
// since the merging protocol SpeculatedType may change at any time (and has already
// changed several times in its history).
inline SpeculatedType mergeSpeculations(SpeculatedType left, SpeculatedType right)
{
    return left | right;
}

template<typename T>
inline bool mergeSpeculation(T& left, SpeculatedType right)
{
    SpeculatedType newSpeculation = static_cast<T>(mergeSpeculations(static_cast<SpeculatedType>(left), right));
    bool result = newSpeculation != static_cast<SpeculatedType>(left);
    left = newSpeculation;
    return result;
}

inline bool speculationChecked(SpeculatedType actual, SpeculatedType desired)
{
    return (actual | desired) == desired;
}

// The SpeculatedType returned by this function for any cell, c, has the following invariant:
// ASSERT(!c->inherits(classInfo) || speculationChecked(speculationFromCell(c), speculationFromClassInfoInheritance(classInfo)));
SpeculatedType speculationFromClassInfoInheritance(const ClassInfo*);

SpeculatedType speculationFromStructure(Structure*);
SpeculatedType speculationFromCell(JSCell*);
SpeculatedType speculationFromValue(JSValue);
// If it's an anyInt(), it'll return speculated types from the Int52 lattice.
// Otherwise, it'll return types from the JSValue lattice.
JS_EXPORT_PRIVATE SpeculatedType int52AwareSpeculationFromValue(JSValue);
std::optional<SpeculatedType> speculationFromJSType(JSType);

SpeculatedType speculationFromTypedArrayType(TypedArrayType); // only valid for typed views.
TypedArrayType typedArrayTypeFromSpeculation(SpeculatedType);

SpeculatedType leastUpperBoundOfStrictlyEquivalentSpeculations(SpeculatedType);

bool valuesCouldBeEqual(SpeculatedType, SpeculatedType);

// Precise computation of the type of the result of a double computation after we
// already know that the inputs are doubles and that the result must be a double. Use
// the closest one of these that applies.
SpeculatedType typeOfDoubleSum(SpeculatedType, SpeculatedType);
SpeculatedType typeOfDoubleDifference(SpeculatedType, SpeculatedType);
SpeculatedType typeOfDoubleIncOrDec(SpeculatedType);
SpeculatedType typeOfDoubleProduct(SpeculatedType, SpeculatedType);
SpeculatedType typeOfDoubleQuotient(SpeculatedType, SpeculatedType);
SpeculatedType typeOfDoubleMinMax(SpeculatedType, SpeculatedType);
SpeculatedType typeOfDoubleNegation(SpeculatedType);
SpeculatedType typeOfDoubleAbs(SpeculatedType);
SpeculatedType typeOfDoubleRounding(SpeculatedType);
SpeculatedType typeOfDoublePow(SpeculatedType, SpeculatedType);

// This conservatively models the behavior of arbitrary double operations.
SpeculatedType typeOfDoubleBinaryOp(SpeculatedType, SpeculatedType);
SpeculatedType typeOfDoubleUnaryOp(SpeculatedType);

// This is mostly for debugging so we can fill profiles from strings.
SpeculatedType speculationFromString(const char*);

} // namespace JSC
