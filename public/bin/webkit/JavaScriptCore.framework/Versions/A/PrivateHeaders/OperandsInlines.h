/*
 * Copyright (C) 2013, 2016 Apple Inc. All rights reserved.
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

#include "Operands.h"
#include <wtf/CommaPrinter.h>

namespace JSC {

inline void Operand::dump(PrintStream& out) const
{
    if (isTmp())
        out.print("tmp", value());
    else
        out.print(virtualRegister());
}

template<typename T, typename U>
void Operands<T, U>::dumpInContext(PrintStream& out, DumpContext* context) const
{
    CommaPrinter comma(" "_s);
    for (size_t argumentIndex = numberOfArguments(); argumentIndex--;) {
        if (!argument(argumentIndex))
            continue;
        out.print(comma, "arg"_s, argumentIndex, ":"_s, inContext(argument(argumentIndex), context));
    }
    for (size_t localIndex = 0; localIndex < numberOfLocals(); ++localIndex) {
        if (!local(localIndex))
            continue;
        out.print(comma, "loc"_s, localIndex, ":"_s, inContext(local(localIndex), context));
    }
    for (size_t tmpIndex = 0; tmpIndex < numberOfTmps(); ++tmpIndex) {
        if (!tmp(tmpIndex))
            continue;
        out.print(comma, "tmp"_s, tmpIndex, ":"_s, inContext(tmp(tmpIndex), context));
    }
}

template<typename T, typename U>
void Operands<T, U>::dump(PrintStream& out) const
{
    CommaPrinter comma(" "_s);
    for (size_t argumentIndex = numberOfArguments(); argumentIndex--;) {
        if (!argument(argumentIndex))
            continue;
        out.print(comma, "arg"_s, argumentIndex, ":"_s, argument(argumentIndex));
    }
    for (size_t localIndex = 0; localIndex < numberOfLocals(); ++localIndex) {
        if (!local(localIndex))
            continue;
        out.print(comma, "loc"_s, localIndex, ":"_s, local(localIndex));
    }
    for (size_t tmpIndex = 0; tmpIndex < numberOfTmps(); ++tmpIndex) {
        if (!tmp(tmpIndex))
            continue;
        out.print(comma, "tmp"_s, tmpIndex, ":"_s, tmp(tmpIndex));
    }
}

} // namespace JSC
