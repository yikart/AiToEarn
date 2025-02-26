/*
 * Copyright (C) 2015-2020 Apple Inc. All rights reserved.
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

#include "ECMAMode.h"

namespace JSC {

class PutByIdFlags {
public:
    constexpr static PutByIdFlags create(ECMAMode ecmaMode)
    {
        return PutByIdFlags(false, ecmaMode);
    }

    // A direct put_by_id means that we store the property without checking if the
    // prototype chain has a setter.
    constexpr static PutByIdFlags createDirect(ECMAMode ecmaMode)
    {
        return PutByIdFlags(true, ecmaMode);
    }

    bool isDirect() const { return m_isDirect; }
    ECMAMode ecmaMode() const { return m_ecmaMode; }

private:
    constexpr PutByIdFlags(bool isDirect, ECMAMode ecmaMode)
        : m_isDirect(isDirect)
        , m_ecmaMode(ecmaMode)
    {
    }

    bool m_isDirect;
    ECMAMode m_ecmaMode;
};

} // namespace JSC

namespace WTF {

class PrintStream;

void printInternal(PrintStream&, JSC::PutByIdFlags);

} // namespace WTF
