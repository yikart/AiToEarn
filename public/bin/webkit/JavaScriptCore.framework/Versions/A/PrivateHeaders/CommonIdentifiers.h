/*
 *  Copyright (C) 2003-2023 Apple Inc. All rights reserved.
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

#include "Identifier.h"
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

// MarkedArgumentBuffer of property names, passed to a macro so we can do set them up various
// ways without repeating the list.
#define JSC_COMMON_IDENTIFIERS_EACH_PROPERTY_NAME(macro) \
    macro(Array) \
    macro(ArrayBuffer) \
    macro(Atomics) \
    macro(BYTES_PER_ELEMENT) \
    macro(BigInt) \
    macro(Boolean) \
    macro(Collator) \
    macro(DurationFormat) \
    macro(Date) \
    macro(DateTimeFormat) \
    macro(DisplayNames) \
    macro(Error) \
    macro(EvalError) \
    macro(FinalizationRegistry) \
    macro(Function) \
    macro(Infinity) \
    macro(Intl) \
    macro(Iterator) \
    macro(ListFormat) \
    macro(Loader) \
    macro(Locale) \
    macro(Map) \
    macro(NaN) \
    macro(Number) \
    macro(NumberFormat) \
    macro(Object) \
    macro(PluralRules) \
    macro(Promise) \
    macro(ShadowRealm) \
    macro(Reflect) \
    macro(RegExp) \
    macro(RelativeTimeFormat) \
    macro(RemotePlayback) \
    macro(Segmenter) \
    macro(Set) \
    macro(SharedArrayBuffer) \
    macro(String) \
    macro(Symbol) \
    macro(Temporal) \
    macro(WeakRef) \
    macro(__defineGetter__) \
    macro(__defineSetter__) \
    macro(__lookupGetter__) \
    macro(__lookupSetter__) \
    macro(add) \
    macro(additionalJettisonReason) \
    macro(alphabet) \
    macro(anonymous) \
    macro(arguments) \
    macro(as) \
    macro(async) \
    macro(back) \
    macro(bind) \
    macro(byteLength) \
    macro(byteOffset) \
    macro(bytecode) \
    macro(bytecodeIndex) \
    macro(bytecodes) \
    macro(bytecodesID) \
    macro(calendar) \
    macro(callee) \
    macro(caller) \
    macro(captureStackTrace) \
    macro(caseFirst) \
    macro(cause) \
    macro(clear) \
    macro(collation) \
    macro(column) \
    macro(compilationKind) \
    macro(compilationUID) \
    macro(compilations) \
    macro(compile) \
    macro(configurable) \
    macro(constructor) \
    macro(count) \
    macro(counters) \
    macro(dateStyle) \
    macro(day) \
    macro(days) \
    macro(daysDisplay) \
    macro(dayPeriod) \
    macro(defineProperty) \
    macro(deref) \
    macro(description) \
    macro(descriptions) \
    macro(detached) \
    macro(detail) \
    macro(displayName) \
    macro(done) \
    macro(dotAll) \
    macro(enumerable) \
    macro(era) \
    macro(eraYear) \
    macro(errors) \
    macro(eval) \
    macro(events) \
    macro(exec) \
    macro(executionCount) \
    macro(exitKind) \
    macro(exports) \
    macro(fallback) \
    macro(fill) \
    macro(flags) \
    macro(firstDayOfWeek) \
    macro(forEach) \
    macro(formatMatcher) \
    macro(formatToParts) \
    macro(forward) \
    macro(fractionalDigits) \
    macro(fractionalSecondDigits) \
    macro(from) \
    macro(fromCharCode) \
    macro(get) \
    macro(getOwnPropertyDescriptor) \
    macro(global) \
    macro(go) \
    macro(granularity) \
    macro(groups) \
    macro(grow) \
    macro(growable) \
    macro(has) \
    macro(hasIndices) \
    macro(hasOwn) \
    macro(hasOwnProperty) \
    macro(hash) \
    macro(header) \
    macro(hour) \
    macro(hours) \
    macro(hoursDisplay) \
    macro(hourCycle) \
    macro(hour12) \
    macro(id) \
    macro(ignoreCase) \
    macro(ignorePunctuation) \
    macro(index) \
    macro(indices) \
    macro(inferredName) \
    macro(input) \
    macro(isoDay) \
    macro(isoHour) \
    macro(isoMicrosecond) \
    macro(isoMillisecond) \
    macro(isoMinute) \
    macro(isoMonth) \
    macro(isoNanosecond) \
    macro(isoSecond) \
    macro(isoYear) \
    macro(instructionCount) \
    macro(isArray) \
    macro(isEnabled) \
    macro(isPrototypeOf) \
    macro(isView) \
    macro(isWatchpoint) \
    macro(isWellFormed) \
    macro(isWordLike) \
    macro(jettisonReason) \
    macro(join) \
    macro(language) \
    macro(languageDisplay) \
    macro(largestUnit) \
    macro(lastChunkHandling) \
    macro(lastIndex) \
    macro(length) \
    macro(line) \
    macro(locale) \
    macro(localeMatcher) \
    macro(maxByteLength) \
    macro(maximumFractionDigits) \
    macro(maximumSignificantDigits) \
    macro(message) \
    macro(microsecond) \
    macro(microseconds) \
    macro(microsecondsDisplay) \
    macro(millisecond) \
    macro(milliseconds) \
    macro(millisecondsDisplay) \
    macro(minimumFractionDigits) \
    macro(minimumIntegerDigits) \
    macro(minimumSignificantDigits) \
    macro(minute) \
    macro(minutes) \
    macro(minutesDisplay) \
    macro(month) \
    macro(monthCode) \
    macro(months) \
    macro(monthsDisplay) \
    macro(multiline) \
    macro(name) \
    macro(nanosecond) \
    macro(nanoseconds) \
    macro(nanosecondsDisplay) \
    macro(next) \
    macro(now) \
    macro(numInlinedCalls) \
    macro(numInlinedGetByIds) \
    macro(numInlinedPutByIds) \
    macro(numberingSystem) \
    macro(numeric) \
    macro(of) \
    macro(omitPadding) \
    macro(opcode) \
    macro(origin) \
    macro(osrExitSites) \
    macro(osrExits) \
    macro(overflow) \
    macro(ownKeys) \
    macro(parse) \
    macro(parseInt) \
    macro(parseFloat) \
    macro(pluralCategories) \
    macro(profiledBytecodes) \
    macro(propertyIsEnumerable) \
    macro(prototype) \
    macro(raw) \
    macro(read) \
    macro(region) \
    macro(replace) \
    macro(resizable) \
    macro(resize) \
    macro(resolve) \
    macro(roundingIncrement) \
    macro(roundingMode) \
    macro(roundingPriority) \
    macro(script) \
    macro(second) \
    macro(seconds) \
    macro(secondsDisplay) \
    macro(segment) \
    macro(selectRange) \
    macro(sensitivity) \
    macro(set) \
    macro(size) \
    macro(slice) \
    macro(smallestUnit) \
    macro(sort) \
    macro(source) \
    macro(sourceCode) \
    macro(sourceURL) \
    macro(stack) \
    macro(stackTraceLimit) \
    macro(sticky) \
    macro(style) \
    macro(subarray) \
    macro(summary) \
    macro(target) \
    macro(test) \
    macro(then) \
    macro(time) \
    macro(timeStyle) \
    macro(timeZone) \
    macro(timeZoneName) \
    macro(toArray) \
    macro(toExponential) \
    macro(toFixed) \
    macro(toISOString) \
    macro(toJSON) \
    macro(toLocaleString) \
    macro(toPrecision) \
    macro(toReversed) \
    macro(toSorted) \
    macro(toString) \
    macro(toTemporalInstant) \
    macro(toWellFormed) \
    macro(trailingZeroDisplay) \
    macro(transfer) \
    macro(transferToFixedLength) \
    macro(type) \
    macro(uid) \
    macro(unicode) \
    macro(unicodeSets) \
    macro(unit) \
    macro(usage) \
    macro(value) \
    macro(valueOf) \
    macro(week) \
    macro(weekday) \
    macro(weeks) \
    macro(weeksDisplay) \
    macro(writable) \
    macro(written) \
    macro(year) \
    macro(years) \
    macro(yearsDisplay)

#define JSC_COMMON_IDENTIFIERS_EACH_PRIVATE_FIELD(macro) \
    macro(constructor)

#define JSC_COMMON_IDENTIFIERS_EACH_KEYWORD(macro) \
    macro(await) \
    macro(break) \
    macro(case) \
    macro(catch) \
    macro(class) \
    macro(const) \
    macro(continue) \
    macro(debugger) \
    macro(default) \
    macro(defer) \
    macro(delete) \
    macro(do) \
    macro(else) \
    macro(enum) \
    macro(export) \
    macro(extends) \
    macro(false) \
    macro(finally) \
    macro(for) \
    macro(function) \
    macro(if) \
    macro(implements) \
    macro(import) \
    macro(in) \
    macro(instanceof) \
    macro(interface) \
    macro(let) \
    macro(new) \
    macro(null) \
    macro(package) \
    macro(private) \
    macro(protected) \
    macro(public) \
    macro(return) \
    macro(static) \
    macro(super) \
    macro(switch) \
    macro(this) \
    macro(throw) \
    macro(true) \
    macro(try) \
    macro(typeof) \
    macro(undefined) \
    macro(var) \
    macro(void) \
    macro(while) \
    macro(with) \
    macro(yield)

#define JSC_COMMON_PRIVATE_IDENTIFIERS_EACH_WELL_KNOWN_SYMBOL(macro) \
    macro(hasInstance) \
    macro(isConcatSpreadable) \
    macro(asyncIterator) \
    macro(iterator) \
    macro(match) \
    macro(matchAll) \
    macro(replace) \
    macro(search) \
    macro(species) \
    macro(split) \
    macro(toPrimitive) \
    macro(toStringTag) \
    macro(unscopables)

#define JSC_PARSER_PRIVATE_NAMES(macro) \
    macro(generator) \
    macro(generatorState) \
    macro(generatorValue) \
    macro(generatorResumeMode) \
    macro(generatorFrame) \
    macro(meta) \
    macro(starDefault) \
    macro(starNamespace) \
    macro(undefined) \

namespace JSC {
    
    class BuiltinNames;
    
    class CommonIdentifiers {
        WTF_MAKE_NONCOPYABLE(CommonIdentifiers);
        WTF_MAKE_TZONE_ALLOCATED(CommonIdentifiers);
    private:
        CommonIdentifiers(VM&);
        ~CommonIdentifiers();
        friend class VM;
        
    public:
        const BuiltinNames& builtinNames() const { return *m_builtinNames; }
        const Identifier nullIdentifier;
        const Identifier emptyIdentifier;
        const Identifier underscoreProto;
        const Identifier useStrictIdentifier;
        const Identifier timesIdentifier;
        const Identifier negativeOneIdentifier;
    private:
        std::unique_ptr<BuiltinNames> m_builtinNames;

    public:

#define JSC_IDENTIFIER_DECLARE_PARSER_PRIVATE_NAME(name) const Identifier name##PrivateName;
        JSC_PARSER_PRIVATE_NAMES(JSC_IDENTIFIER_DECLARE_PARSER_PRIVATE_NAME)
#undef JSC_IDENTIFIER_DECLARE_PARSER_PRIVATE_NAME
        
#define JSC_IDENTIFIER_DECLARE_KEYWORD_NAME_GLOBAL(name) const Identifier name##Keyword;
        JSC_COMMON_IDENTIFIERS_EACH_KEYWORD(JSC_IDENTIFIER_DECLARE_KEYWORD_NAME_GLOBAL)
#undef JSC_IDENTIFIER_DECLARE_KEYWORD_NAME_GLOBAL
        
#define JSC_IDENTIFIER_DECLARE_PROPERTY_NAME_GLOBAL(name) const Identifier name;
        JSC_COMMON_IDENTIFIERS_EACH_PROPERTY_NAME(JSC_IDENTIFIER_DECLARE_PROPERTY_NAME_GLOBAL)
#undef JSC_IDENTIFIER_DECLARE_PROPERTY_NAME_GLOBAL

#define JSC_IDENTIFIER_DECLARE_PRIVATE_WELL_KNOWN_SYMBOL_GLOBAL(name) const Identifier name##Symbol;
        JSC_COMMON_PRIVATE_IDENTIFIERS_EACH_WELL_KNOWN_SYMBOL(JSC_IDENTIFIER_DECLARE_PRIVATE_WELL_KNOWN_SYMBOL_GLOBAL)
#undef JSC_IDENTIFIER_DECLARE_PRIVATE_WELL_KNOWN_SYMBOL_GLOBAL
        const Identifier intlLegacyConstructedSymbol;

#define JSC_IDENTIFIER_DECLARE_PRIVATE_FIELD_GLOBAL(name) const Identifier name##PrivateField;
        JSC_COMMON_IDENTIFIERS_EACH_PRIVATE_FIELD(JSC_IDENTIFIER_DECLARE_PRIVATE_FIELD_GLOBAL)
#undef JSC_IDENTIFIER_DECLARE_PRIVATE_FIELD_GLOBAL

        // Callers of this method should make sure that identifiers given to this method 
        // survive the lifetime of CommonIdentifiers and related VM.
        JS_EXPORT_PRIVATE void appendExternalName(const Identifier& publicName, const Identifier& privateName);
    };

} // namespace JSC
