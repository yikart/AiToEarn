/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

namespace WTF {
class PrintStream;
};

namespace JSC {

struct ECMAMode {
    static constexpr uint8_t StrictMode = 0;
    static constexpr uint8_t SloppyMode = 1;

public:
    static constexpr ECMAMode fromByte(uint8_t byte) { return ECMAMode(byte); }
    static constexpr ECMAMode fromBool(bool isStrict) { return isStrict ? strict() : sloppy(); }
    static constexpr ECMAMode strict() { return ECMAMode(StrictMode); }
    static constexpr ECMAMode sloppy() { return ECMAMode(SloppyMode); }

    ALWAYS_INLINE bool isStrict() const { return m_value == StrictMode; }
    ALWAYS_INLINE uint8_t value() const { return m_value; }

    void dump(WTF::PrintStream&) const;

private:
    constexpr ECMAMode(uint8_t value)
        : m_value(value)
    {
        ASSERT(m_value == StrictMode || m_value == SloppyMode, m_value);
    }

    uint8_t m_value;
};

} // namespace JSC
