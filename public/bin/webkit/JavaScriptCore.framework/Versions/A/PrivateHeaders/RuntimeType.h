/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 * Copyright (C) Saam Barati <saambarati1@gmail.com>. All rights reserved.
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

#include "VM.h"
#include <wtf/text/WTFString.h>

namespace JSC {

enum RuntimeType : uint16_t {
    TypeNothing            = 0x0,
    TypeFunction           = 0x1,
    TypeUndefined          = 0x2,
    TypeNull               = 0x4,
    TypeBoolean            = 0x8,
    TypeAnyInt             = 0x10,
    TypeNumber             = 0x20,
    TypeString             = 0x40,
    TypeObject             = 0x80,
    TypeSymbol             = 0x100,
    TypeBigInt             = 0x200,
};

typedef uint16_t RuntimeTypeMask;

static const RuntimeTypeMask RuntimeTypeMaskAllTypes = TypeFunction | TypeUndefined | TypeNull | TypeBoolean | TypeAnyInt | TypeNumber | TypeString | TypeObject | TypeSymbol | TypeBigInt;

class JSValue;
RuntimeType runtimeTypeForValue(JSValue);
String runtimeTypeAsString(RuntimeType);

ALWAYS_INLINE bool runtimeTypeIsPrimitive(RuntimeTypeMask type)
{
    return type & ~(TypeFunction | TypeObject);
}

} // namespace JSC
