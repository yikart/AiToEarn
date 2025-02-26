/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

#include "JSCJSValue.h"
#include <wtf/text/SymbolImpl.h>

namespace JSC {

class CodeBlock;
class Identifier;
class JSCell;

class CacheableIdentifier {
public:
    CacheableIdentifier() = default;

    static inline CacheableIdentifier createFromCell(JSCell* identifier);
    template <typename CodeBlockType>
    static inline CacheableIdentifier createFromIdentifierOwnedByCodeBlock(CodeBlockType*, const Identifier&);
    template <typename CodeBlockType>
    static inline CacheableIdentifier createFromIdentifierOwnedByCodeBlock(CodeBlockType*, UniquedStringImpl*);
    static inline CacheableIdentifier createFromImmortalIdentifier(UniquedStringImpl*);
    static inline CacheableIdentifier createFromSharedStub(UniquedStringImpl*);
    static constexpr CacheableIdentifier createFromRawBits(uintptr_t rawBits) { return CacheableIdentifier(rawBits); }

    CacheableIdentifier(const CacheableIdentifier&) = default;
    CacheableIdentifier(CacheableIdentifier&&) = default;

    CacheableIdentifier(std::nullptr_t)
        : m_bits(0)
    { }

    bool isUid() const { return m_bits & s_uidTag; }
    bool isCell() const { return !isUid(); }
    inline bool isSymbolCell() const;
    inline bool isStringCell() const;
    inline void ensureIsCell(VM&);

    bool isSymbol() const { return m_bits && uid()->isSymbol(); }
    bool isPrivateName() const { return isSymbol() && static_cast<SymbolImpl&>(*uid()).isPrivate(); }

    inline JSCell* cell() const;
    UniquedStringImpl* uid() const;

    explicit operator bool() const { return m_bits; }

    unsigned hash() const { return uid()->symbolAwareHash(); }

    CacheableIdentifier& operator=(const CacheableIdentifier&) = default;
    CacheableIdentifier& operator=(CacheableIdentifier&&) = default;

    bool operator==(const CacheableIdentifier&) const;
    bool operator==(const Identifier&) const;

    static inline bool isCacheableIdentifierCell(JSCell*);
    static inline bool isCacheableIdentifierCell(JSValue);

    uintptr_t rawBits() const { return m_bits; }

    template<typename Visitor> inline void visitAggregate(Visitor&) const;

    JS_EXPORT_PRIVATE void dump(PrintStream&) const;

private:
    explicit inline CacheableIdentifier(UniquedStringImpl*);
    explicit inline CacheableIdentifier(JSCell* identifier);
    explicit constexpr CacheableIdentifier(uintptr_t rawBits)
        : m_bits(rawBits)
    { }

    inline void setCellBits(JSCell*);
    inline void setUidBits(UniquedStringImpl*);

    // CacheableIdentifier can either hold a cell pointer or a uid. To discern which
    // it is holding, we tag the low bit if we have a uid. We choose to tag the uid
    // instead of the cell because this keeps the bits of the cell pointer form
    // unpolluted, and therefore, it can be scanned by our conservative GC to keep the
    // cell alive when the CacheableIdentifier is on the stack.
    static constexpr uintptr_t s_uidTag = 1;
    uintptr_t m_bits { 0 };
};

} // namespace JSC
