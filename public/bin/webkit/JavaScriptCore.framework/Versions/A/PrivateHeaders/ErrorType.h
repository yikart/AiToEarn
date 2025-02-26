/*
 * Copyright (C) 2019 Apple Inc. All Rights Reserved.
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

#include <wtf/text/ASCIILiteral.h>

namespace JSC {

#define JSC_ERROR_TYPES(macro) \
    macro(Error) \
    macro(EvalError) \
    macro(RangeError) \
    macro(ReferenceError) \
    macro(SyntaxError) \
    macro(TypeError) \
    macro(URIError) \
    macro(AggregateError) \

#define JSC_ERROR_TYPES_WITH_EXTENSION(macro) \
    JSC_ERROR_TYPES(macro) \
    macro(OutOfMemoryError) \

enum class ErrorType : uint8_t {
#define DECLARE_ERROR_TYPES_ENUM(name) name,
    JSC_ERROR_TYPES(DECLARE_ERROR_TYPES_ENUM)
#undef DECLARE_ERROR_TYPES_ENUM
};

#define COUNT_ERROR_TYPES(name) 1 +
static constexpr unsigned NumberOfErrorType {
    JSC_ERROR_TYPES(COUNT_ERROR_TYPES) 0
};
#undef COUNT_ERROR_TYPES

enum class ErrorTypeWithExtension : uint8_t {
#define DECLARE_ERROR_TYPES_ENUM(name) name,
    JSC_ERROR_TYPES_WITH_EXTENSION(DECLARE_ERROR_TYPES_ENUM)
#undef DECLARE_ERROR_TYPES_ENUM
};

ASCIILiteral errorTypeName(ErrorType);
ASCIILiteral errorTypeName(ErrorTypeWithExtension);

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::ErrorType);
void printInternal(PrintStream&, JSC::ErrorTypeWithExtension);

} // namespace WTF
