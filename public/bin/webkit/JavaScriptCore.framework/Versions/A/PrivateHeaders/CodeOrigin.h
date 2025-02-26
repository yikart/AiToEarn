/*
 * Copyright (C) 2011-2023 Apple Inc. All rights reserved.
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

#include "BytecodeIndex.h"

#include <limits.h>
#include <wtf/HashMap.h>
#include <wtf/MathExtras.h>
#include <wtf/PrintStream.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

#if OS(DARWIN)
#include <mach/vm_param.h>
#endif

namespace JSC {

class CodeBlock;
struct DumpContext;
struct InlineCallFrame;

class CodeOrigin {
public:
    CodeOrigin()
#if CPU(ADDRESS64)
        : m_compositeValue(buildCompositeValue(nullptr, BytecodeIndex()))
#else
        : m_inlineCallFrame(nullptr)
#endif
    {
    }

    CodeOrigin(WTF::HashTableDeletedValueType)
#if CPU(ADDRESS64)
        : m_compositeValue(buildCompositeValue(deletedMarker(), BytecodeIndex()))
#else
        : m_bytecodeIndex(WTF::HashTableDeletedValue)
        , m_inlineCallFrame(deletedMarker())
#endif
    {
    }
    
    explicit CodeOrigin(BytecodeIndex bytecodeIndex, InlineCallFrame* inlineCallFrame = nullptr)
#if CPU(ADDRESS64)
        : m_compositeValue(buildCompositeValue(inlineCallFrame, bytecodeIndex))
#else
        : m_bytecodeIndex(bytecodeIndex)
        , m_inlineCallFrame(inlineCallFrame)
#endif
    {
        ASSERT(!!bytecodeIndex);
#if CPU(ADDRESS64)
        ASSERT(!(std::bit_cast<uintptr_t>(inlineCallFrame) & ~s_maskCompositeValueForPointer));
#endif
    }
    
#if CPU(ADDRESS64)
    CodeOrigin& operator=(const CodeOrigin& other)
    {
        if (this != &other) {
            if (UNLIKELY(isOutOfLine()))
                delete outOfLineCodeOrigin();
            
            if (UNLIKELY(other.isOutOfLine()))
                m_compositeValue = buildCompositeValue(other.inlineCallFrame(), other.bytecodeIndex());
            else
                m_compositeValue = other.m_compositeValue;
        }
        return *this;
    }
    CodeOrigin& operator=(CodeOrigin&& other)
    {
        if (this != &other) {
            if (UNLIKELY(isOutOfLine()))
                delete outOfLineCodeOrigin();

            m_compositeValue = std::exchange(other.m_compositeValue, 0);
        }
        return *this;
    }

    CodeOrigin(const CodeOrigin& other)
    {
        // We don't use the member initializer list because it would not let us optimize the common case where there is no out-of-line storage
        // (in which case we don't have to extract the components of the composite value just to reassemble it).
        if (UNLIKELY(other.isOutOfLine()))
            m_compositeValue = buildCompositeValue(other.inlineCallFrame(), other.bytecodeIndex());
        else
            m_compositeValue = other.m_compositeValue;
    }
    CodeOrigin(CodeOrigin&& other)
        : m_compositeValue(std::exchange(other.m_compositeValue, 0))
    {
    }

    ~CodeOrigin()
    {
        if (UNLIKELY(isOutOfLine()))
            delete outOfLineCodeOrigin();
    }
#endif
    
    bool isSet() const
    {
#if CPU(ADDRESS64)
        return !(m_compositeValue & s_maskIsBytecodeIndexInvalid);
#else
        return !!m_bytecodeIndex;
#endif
    }
    explicit operator bool() const { return isSet(); }
    
    bool isHashTableDeletedValue() const
    {
#if CPU(ADDRESS64)
        return !isSet() && (m_compositeValue & s_maskCompositeValueForPointer);
#else
        return m_bytecodeIndex.isHashTableDeletedValue() && !!m_inlineCallFrame;
#endif
    }
    
    // The inline depth is the depth of the inline stack, so 1 = not inlined,
    // 2 = inlined one deep, etc.
    unsigned inlineDepth() const;
    
    // If the code origin corresponds to inlined code, gives you the heap object that
    // would have owned the code if it had not been inlined. Otherwise returns 0.
    CodeBlock* codeOriginOwner() const;
    
    int stackOffset() const;
    
    unsigned hash() const;
    bool operator==(const CodeOrigin&) const;

    // This checks if the two code origins correspond to the same stack trace snippets,
    // but ignore whether the InlineCallFrame's are identical.
    bool isApproximatelyEqualTo(const CodeOrigin& other, InlineCallFrame* terminal = nullptr) const;
    
    unsigned approximateHash(InlineCallFrame* terminal = nullptr) const;

    template <typename Function>
    void walkUpInlineStack(const Function&) const;

    inline bool inlineStackContainsActiveCheckpoint() const;
    
    // Get the inline stack. This is slow, and is intended for debugging only.
    Vector<CodeOrigin> inlineStack() const;
    
    JS_EXPORT_PRIVATE void dump(PrintStream&) const;
    void dumpInContext(PrintStream&, DumpContext*) const;

    BytecodeIndex bytecodeIndex() const
    {
#if CPU(ADDRESS64)
        if (!isSet())
            return BytecodeIndex();
        if (UNLIKELY(isOutOfLine()))
            return outOfLineCodeOrigin()->bytecodeIndex;
        return BytecodeIndex::fromBits(m_compositeValue >> (64 - s_freeBitsAtTop));
#else
        return m_bytecodeIndex;
#endif
    }

    InlineCallFrame* inlineCallFrame() const
    {
#if CPU(ADDRESS64)
        if (UNLIKELY(isOutOfLine()))
            return outOfLineCodeOrigin()->inlineCallFrame;
        return std::bit_cast<InlineCallFrame*>(m_compositeValue & s_maskCompositeValueForPointer);
#else
        return m_inlineCallFrame;
#endif
    }

private:
#if CPU(ADDRESS64)
    static constexpr uintptr_t s_maskIsOutOfLine = 1;
    static constexpr uintptr_t s_maskIsBytecodeIndexInvalid = 2;

    struct OutOfLineCodeOrigin {
        WTF_MAKE_TZONE_ALLOCATED(OutOfLineCodeOrigin);
    public:
        InlineCallFrame* inlineCallFrame;
        BytecodeIndex bytecodeIndex;
        
        OutOfLineCodeOrigin(InlineCallFrame* inlineCallFrame, BytecodeIndex bytecodeIndex)
            : inlineCallFrame(inlineCallFrame)
            , bytecodeIndex(bytecodeIndex)
        {
        }
    };
    
    bool isOutOfLine() const
    {
        return m_compositeValue & s_maskIsOutOfLine;
    }
    OutOfLineCodeOrigin* outOfLineCodeOrigin() const
    {
        ASSERT(isOutOfLine());
        return std::bit_cast<OutOfLineCodeOrigin*>(m_compositeValue & s_maskCompositeValueForOutOfLinePointer);
    }
#endif

    static InlineCallFrame* deletedMarker()
    {
        auto value = static_cast<uintptr_t>(1 << 3);
#if CPU(ADDRESS64)
        ASSERT(value & s_maskCompositeValueForPointer);
        ASSERT(!(value & ~s_maskCompositeValueForPointer));
#endif
        return std::bit_cast<InlineCallFrame*>(value);
    }

#if CPU(ADDRESS64)
    static constexpr unsigned s_freeBitsAtTop = 64 - OS_CONSTANT(EFFECTIVE_ADDRESS_WIDTH);
    static constexpr uintptr_t s_maskCompositeValueForOutOfLinePointer = ~7ULL;
    static constexpr uintptr_t s_maskCompositeValueForPointer = ((1ULL << OS_CONSTANT(EFFECTIVE_ADDRESS_WIDTH)) - 1) & s_maskCompositeValueForOutOfLinePointer;
    static uintptr_t buildCompositeValue(InlineCallFrame* inlineCallFrame, BytecodeIndex bytecodeIndex)
    {
        if (!bytecodeIndex)
            return std::bit_cast<uintptr_t>(inlineCallFrame) | s_maskIsBytecodeIndexInvalid;

        if (UNLIKELY(bytecodeIndex.asBits() >= 1 << s_freeBitsAtTop)) {
            auto* outOfLine = new OutOfLineCodeOrigin(inlineCallFrame, bytecodeIndex);
            return std::bit_cast<uintptr_t>(outOfLine) | s_maskIsOutOfLine;
        }

        uintptr_t encodedBytecodeIndex = static_cast<uintptr_t>(bytecodeIndex.asBits()) << (64 - s_freeBitsAtTop);
        ASSERT(!(encodedBytecodeIndex & std::bit_cast<uintptr_t>(inlineCallFrame)));
        return encodedBytecodeIndex | std::bit_cast<uintptr_t>(inlineCallFrame);
    }

    // The bottom bit indicates whether to look at an out-of-line implementation (because of a bytecode index which is too big for us to store).
    // The next bit indicates whether this is an invalid bytecode (which depending on the InlineCallFrame* can either indicate an unset CodeOrigin,
    // or a deletion marker for a hash table).
    // The next bit is free
    // The next 64-s_freeBitsAtTop-3 are the InlineCallFrame* or the OutOfLineCodeOrigin*
    // Finally the last s_freeBitsAtTop are the bytecodeIndex if it is inline
    uintptr_t m_compositeValue;
#else
    BytecodeIndex m_bytecodeIndex;
    InlineCallFrame* m_inlineCallFrame;
#endif
};

inline unsigned CodeOrigin::hash() const
{
    return WTF::IntHash<unsigned>::hash(bytecodeIndex().asBits()) +
        WTF::PtrHash<InlineCallFrame*>::hash(inlineCallFrame());
}

inline bool CodeOrigin::operator==(const CodeOrigin& other) const
{
#if CPU(ADDRESS64)
    if (m_compositeValue == other.m_compositeValue)
        return true;
#endif
    return bytecodeIndex() == other.bytecodeIndex()
        && inlineCallFrame() == other.inlineCallFrame();
}

struct CodeOriginHash {
    static unsigned hash(const CodeOrigin& key) { return key.hash(); }
    static bool equal(const CodeOrigin& a, const CodeOrigin& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

struct CodeOriginApproximateHash {
    static unsigned hash(const CodeOrigin& key) { return key.approximateHash(); }
    static bool equal(const CodeOrigin& a, const CodeOrigin& b) { return a.isApproximatelyEqualTo(b); }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::CodeOrigin> : JSC::CodeOriginHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::CodeOrigin> : SimpleClassHashTraits<JSC::CodeOrigin> {
    static constexpr bool emptyValueIsZero = false;
};

} // namespace WTF
