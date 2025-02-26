/*
 * Copyright (C) 2011-2020 Apple Inc. All rights reserved.
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

#include <wtf/Assertions.h>

namespace JSC {

// === DataFormat ===
//
// This enum tracks the current representation in which a value is being held.
// Values may be unboxed primitives (int32, double, or cell), or boxed as a JSValue.
// For boxed values, we may know the type of boxing that has taken place.
// (May also need bool, array, object, string types!)
enum DataFormat : uint8_t {
    DataFormatNone = 0,
    DataFormatInt32 = 1,
    DataFormatInt52 = 2, // Int52's are left-shifted by 12 by default.
    DataFormatStrictInt52 = 3, // "Strict" Int52 means it's not shifted.
    DataFormatDouble = 4,
    DataFormatBoolean = 5,
    DataFormatCell = 6,
    DataFormatStorage = 7,
    DataFormatBigInt32 = 8, // FIXME: https://bugs.webkit.org/show_bug.cgi?id=210957 Actually support BigInt32 DataFormat.
    DataFormatJS = 16,
    DataFormatJSInt32 = DataFormatJS | DataFormatInt32,
    DataFormatJSDouble = DataFormatJS | DataFormatDouble,
    DataFormatJSCell = DataFormatJS | DataFormatCell,
    DataFormatJSBoolean = DataFormatJS | DataFormatBoolean,
    DataFormatJSBigInt32 = DataFormatJS | DataFormatBigInt32,

    // Marker deliminating ordinary data formats and OSR-only data formats.
    DataFormatOSRMarker = 32, 
    
    // Special data formats used only for OSR.
    DataFormatDead = 33, // Implies jsUndefined().
};

inline const char* dataFormatToString(DataFormat dataFormat)
{
    switch (dataFormat) {
    case DataFormatNone:
        return "None";
    case DataFormatInt32:
        return "Int32";
    case DataFormatInt52:
        return "Int52";
    case DataFormatStrictInt52:
        return "StrictInt52";
    case DataFormatDouble:
        return "Double";
    case DataFormatCell:
        return "Cell";
    case DataFormatBoolean:
        return "Boolean";
    case DataFormatStorage:
        return "Storage";
    case DataFormatBigInt32:
        return "BigInt32";
    case DataFormatJS:
        return "JS";
    case DataFormatJSInt32:
        return "JSInt32";
    case DataFormatJSDouble:
        return "JSDouble";
    case DataFormatJSCell:
        return "JSCell";
    case DataFormatJSBoolean:
        return "JSBoolean";
    case DataFormatJSBigInt32:
        return "JSBigInt32";
    case DataFormatDead:
        return "Dead";
    default:
        RELEASE_ASSERT_NOT_REACHED();
        return "Unknown";
    }
}

inline bool isJSFormat(DataFormat format, DataFormat expectedFormat)
{
    ASSERT(expectedFormat & DataFormatJS);
    return (format | DataFormatJS) == expectedFormat;
}

inline bool isJSInt32(DataFormat format)
{
    return isJSFormat(format, DataFormatJSInt32);
}

inline bool isJSDouble(DataFormat format)
{
    return isJSFormat(format, DataFormatJSDouble);
}

inline bool isJSCell(DataFormat format)
{
    return isJSFormat(format, DataFormatJSCell);
}

inline bool isJSBoolean(DataFormat format)
{
    return isJSFormat(format, DataFormatJSBoolean);
}

} // namespace JSC

namespace WTF {

class PrintStream;
void printInternal(PrintStream&, JSC::DataFormat);

} // namespace WTF
