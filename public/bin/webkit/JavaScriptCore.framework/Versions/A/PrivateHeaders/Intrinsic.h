/*
 * Copyright (C) 2011-2017 Apple Inc. All rights reserved.
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

#include "IterationKind.h"
#include <optional>
#include <wtf/text/ASCIILiteral.h>

namespace JSC {

#define JSC_FOR_EACH_INTRINSIC(macro) \
    /* Call intrinsics. */ \
    macro(NoIntrinsic) \
    macro(AbsIntrinsic) \
    macro(ACosIntrinsic) \
    macro(ASinIntrinsic) \
    macro(ATanIntrinsic) \
    macro(ACoshIntrinsic) \
    macro(ASinhIntrinsic) \
    macro(ATanhIntrinsic) \
    macro(MinIntrinsic) \
    macro(MaxIntrinsic) \
    macro(SqrtIntrinsic) \
    macro(SinIntrinsic) \
    macro(CbrtIntrinsic) \
    macro(Clz32Intrinsic) \
    macro(CosIntrinsic) \
    macro(TanIntrinsic) \
    macro(CoshIntrinsic) \
    macro(SinhIntrinsic) \
    macro(TanhIntrinsic) \
    macro(ArrayPushIntrinsic) \
    macro(ArrayPopIntrinsic) \
    macro(ArraySliceIntrinsic) \
    macro(ArraySpliceIntrinsic) \
    macro(ArrayIndexOfIntrinsic) \
    macro(ArrayValuesIntrinsic) \
    macro(ArrayKeysIntrinsic) \
    macro(ArrayEntriesIntrinsic) \
    macro(AsyncIteratorIntrinsic) \
    macro(BooleanConstructorIntrinsic) \
    macro(CharCodeAtIntrinsic) \
    macro(CharAtIntrinsic) \
    macro(DatePrototypeGetTimeIntrinsic) \
    macro(DatePrototypeGetFullYearIntrinsic) \
    macro(DatePrototypeGetUTCFullYearIntrinsic) \
    macro(DatePrototypeGetMonthIntrinsic) \
    macro(DatePrototypeGetUTCMonthIntrinsic) \
    macro(DatePrototypeGetDateIntrinsic) \
    macro(DatePrototypeGetUTCDateIntrinsic) \
    macro(DatePrototypeGetDayIntrinsic) \
    macro(DatePrototypeGetUTCDayIntrinsic) \
    macro(DatePrototypeGetHoursIntrinsic) \
    macro(DatePrototypeGetUTCHoursIntrinsic) \
    macro(DatePrototypeGetMinutesIntrinsic) \
    macro(DatePrototypeGetUTCMinutesIntrinsic) \
    macro(DatePrototypeGetSecondsIntrinsic) \
    macro(DatePrototypeGetUTCSecondsIntrinsic) \
    macro(DatePrototypeGetMillisecondsIntrinsic) \
    macro(DatePrototypeGetUTCMillisecondsIntrinsic) \
    macro(DatePrototypeGetTimezoneOffsetIntrinsic) \
    macro(DatePrototypeGetYearIntrinsic) \
    macro(DatePrototypeSetTimeIntrinsic) \
    macro(FromCharCodeIntrinsic) \
    macro(GlobalIsNaNIntrinsic) \
    macro(PowIntrinsic) \
    macro(FloorIntrinsic) \
    macro(CeilIntrinsic) \
    macro(RoundIntrinsic) \
    macro(ExpIntrinsic) \
    macro(Expm1Intrinsic) \
    macro(LogIntrinsic) \
    macro(Log10Intrinsic) \
    macro(Log1pIntrinsic) \
    macro(Log2Intrinsic) \
    macro(RegExpExecIntrinsic) \
    macro(RegExpTestIntrinsic) \
    macro(RegExpTestFastIntrinsic) \
    macro(RegExpMatchFastIntrinsic) \
    macro(ObjectAssignIntrinsic) \
    macro(ObjectCreateIntrinsic) \
    macro(ObjectGetOwnPropertyNamesIntrinsic) \
    macro(ObjectGetOwnPropertySymbolsIntrinsic) \
    macro(ObjectGetPrototypeOfIntrinsic) \
    macro(ObjectIsIntrinsic) \
    macro(ObjectKeysIntrinsic) \
    macro(ObjectToStringIntrinsic) \
    macro(ReflectGetPrototypeOfIntrinsic) \
    macro(ReflectOwnKeysIntrinsic) \
    macro(StringConstructorIntrinsic) \
    macro(StringPrototypeAtIntrinsic) \
    macro(StringPrototypeCodePointAtIntrinsic) \
    macro(StringPrototypeIndexOfIntrinsic) \
    macro(StringPrototypeLocaleCompareIntrinsic) \
    macro(StringPrototypeValueOfIntrinsic) \
    macro(StringPrototypeReplaceIntrinsic) \
    macro(StringPrototypeReplaceRegExpIntrinsic) \
    macro(StringPrototypeReplaceStringIntrinsic) \
    macro(StringPrototypeSliceIntrinsic) \
    macro(StringPrototypeSubstringIntrinsic) \
    macro(StringPrototypeToLowerCaseIntrinsic) \
    macro(NumberPrototypeToStringIntrinsic) \
    macro(NumberIsNaNIntrinsic) \
    macro(NumberIsIntegerIntrinsic) \
    macro(NumberConstructorIntrinsic) \
    macro(IMulIntrinsic) \
    macro(RandomIntrinsic) \
    macro(FRoundIntrinsic) \
    macro(F16RoundIntrinsic) \
    macro(ToIntegerOrInfinityIntrinsic) \
    macro(ToLengthIntrinsic) \
    macro(TruncIntrinsic) \
    macro(TypedArrayValuesIntrinsic) \
    macro(TypedArrayKeysIntrinsic) \
    macro(TypedArrayEntriesIntrinsic) \
    macro(IsTypedArrayViewIntrinsic) \
    macro(BoundFunctionCallIntrinsic) \
    macro(RemoteFunctionCallIntrinsic) \
    macro(IteratorIntrinsic) \
    macro(JSMapGetIntrinsic) \
    macro(JSMapHasIntrinsic) \
    macro(JSMapSetIntrinsic) \
    macro(JSMapDeleteIntrinsic) \
    macro(JSMapValuesIntrinsic) \
    macro(JSMapKeysIntrinsic) \
    macro(JSMapEntriesIntrinsic) \
    macro(JSMapStorageIntrinsic) \
    macro(JSMapIterationNextIntrinsic) \
    macro(JSMapIterationEntryIntrinsic) \
    macro(JSMapIterationEntryKeyIntrinsic) \
    macro(JSMapIterationEntryValueIntrinsic) \
    macro(JSSetStorageIntrinsic) \
    macro(JSSetIterationNextIntrinsic) \
    macro(JSSetIterationEntryIntrinsic) \
    macro(JSSetIterationEntryKeyIntrinsic) \
    macro(JSMapIteratorNextIntrinsic) \
    macro(JSMapIteratorKeyIntrinsic) \
    macro(JSMapIteratorValueIntrinsic) \
    macro(JSSetIteratorNextIntrinsic) \
    macro(JSSetIteratorKeyIntrinsic) \
    macro(JSSetHasIntrinsic) \
    macro(JSSetAddIntrinsic) \
    macro(JSSetDeleteIntrinsic) \
    macro(JSSetValuesIntrinsic) \
    macro(JSSetEntriesIntrinsic) \
    macro(JSWeakMapGetIntrinsic) \
    macro(JSWeakMapHasIntrinsic) \
    macro(JSWeakMapSetIntrinsic) \
    macro(JSWeakSetHasIntrinsic) \
    macro(JSWeakSetAddIntrinsic) \
    macro(HasOwnPropertyIntrinsic) \
    macro(AtomicsAddIntrinsic) \
    macro(AtomicsAndIntrinsic) \
    macro(AtomicsCompareExchangeIntrinsic) \
    macro(AtomicsExchangeIntrinsic) \
    macro(AtomicsIsLockFreeIntrinsic) \
    macro(AtomicsLoadIntrinsic) \
    macro(AtomicsNotifyIntrinsic) \
    macro(AtomicsOrIntrinsic) \
    macro(AtomicsPauseIntrinsic) \
    macro(AtomicsStoreIntrinsic) \
    macro(AtomicsSubIntrinsic) \
    macro(AtomicsWaitIntrinsic) \
    macro(AtomicsWaitAsyncIntrinsic) \
    macro(AtomicsXorIntrinsic) \
    macro(ParseIntIntrinsic) \
    macro(FunctionToStringIntrinsic) \
    macro(FunctionBindIntrinsic) \
    macro(IteratorHelperCreateIntrinsic) \
    \
    /* Getter intrinsics. */ \
    macro(TypedArrayLengthIntrinsic) \
    macro(TypedArrayByteLengthIntrinsic) \
    macro(TypedArrayByteOffsetIntrinsic) \
    macro(UnderscoreProtoIntrinsic) \
    macro(SpeciesGetterIntrinsic) \
    macro(WebAssemblyInstanceExportsIntrinsic) \
    \
    /* Debugging intrinsics. These are meant to be used as testing hacks within jsc.cpp and should never be exposed to users.*/ \
    macro(DFGTrueIntrinsic) \
    macro(FTLTrueIntrinsic) \
    macro(OSRExitIntrinsic) \
    macro(IsFinalTierIntrinsic) \
    macro(SetInt32HeapPredictionIntrinsic) \
    macro(CheckInt32Intrinsic) \
    macro(FiatInt52Intrinsic) \
    \
    /* These are used for $vm performance debugging features. */ \
    macro(CPUMfenceIntrinsic) \
    macro(CPURdtscIntrinsic) \
    macro(CPUCpuidIntrinsic) \
    macro(CPUPauseIntrinsic) \
    \
    macro(DataViewGetInt8) \
    macro(DataViewGetUint8) \
    macro(DataViewGetInt16) \
    macro(DataViewGetUint16) \
    macro(DataViewGetInt32) \
    macro(DataViewGetUint32) \
    macro(DataViewGetFloat16) \
    macro(DataViewGetFloat32) \
    macro(DataViewGetFloat64) \
    macro(DataViewSetInt8) \
    macro(DataViewSetUint8) \
    macro(DataViewSetInt16) \
    macro(DataViewSetUint16) \
    macro(DataViewSetInt32) \
    macro(DataViewSetUint32) \
    macro(DataViewSetFloat16) \
    macro(DataViewSetFloat32) \
    macro(DataViewSetFloat64) \
    \
    macro(WasmFunctionIntrinsic) \

enum Intrinsic : uint8_t {
#define JSC_DEFINE_INTRINSIC(name) name,
    JSC_FOR_EACH_INTRINSIC(JSC_DEFINE_INTRINSIC)
#undef JSC_DEFINE_INTRINSIC
};

std::optional<IterationKind> interationKindForIntrinsic(Intrinsic);

ASCIILiteral intrinsicName(Intrinsic);

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::Intrinsic);

} // namespace WTF


