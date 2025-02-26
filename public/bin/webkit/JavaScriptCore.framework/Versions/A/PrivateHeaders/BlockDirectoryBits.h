/*
 * Copyright (C) 2019-2023 Apple Inc. All rights reserved.
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

#include <array>
#include <wtf/FastBitVector.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

#define FOR_EACH_BLOCK_DIRECTORY_BIT(macro) \
    macro(live, Live) /* The set of block indices that have actual blocks. */\
    macro(empty, Empty) /* The set of all blocks that have no live objects and are not free listed. */ \
    macro(allocated, Allocated) /* The set of all blocks that are full of live objects. */\
    macro(canAllocateButNotEmpty, CanAllocateButNotEmpty) /* The set of all blocks are neither empty nor retired (i.e. are more than minMarkedBlockUtilization full). */ \
    macro(destructible, Destructible) /* The set of all blocks that may have destructors to run. */\
    macro(eden, Eden) /* The set of all blocks that have new objects since the last GC. */\
    macro(unswept, Unswept) /* The set of all blocks that could be swept by the incremental sweeper. */\
    macro(inUse, InUse) /* This tells us if a block is currently being allocated from or swept. This acts like a lock bit. */\
    \
    /* These are computed during marking. */\
    macro(markingNotEmpty, MarkingNotEmpty) /* The set of all blocks that are not empty. */ \
    macro(markingRetired, MarkingRetired) /* The set of all blocks that are retired. */

// FIXME: We defined canAllocateButNotEmpty and empty to be exclusive:
//
//     canAllocateButNotEmpty & empty == 0
//
// Instead of calling it canAllocate and making it inclusive:
//
//     canAllocate & empty == empty
//
// The latter is probably better. I'll leave it to a future bug to fix that, since breathing on
// this code leads to regressions for days, and it's not clear that making this change would
// improve perf since it would not change the collector's behavior, and either way the directory
// has to look at both bitvectors.
// https://bugs.webkit.org/show_bug.cgi?id=162121

class BlockDirectoryBits {
    WTF_MAKE_TZONE_ALLOCATED(BlockDirectoryBits);
public:
    static constexpr unsigned bitsPerSegment = 32;
    static constexpr unsigned segmentShift = 5;
    static constexpr unsigned indexMask = (1U << segmentShift) - 1;
    static_assert((1 << segmentShift) == bitsPerSegment);

#define BLOCK_DIRECTORY_BIT_KIND_COUNT(lowerBitName, capitalBitName) + 1
    static constexpr unsigned numberOfBlockDirectoryBitKinds = 0 FOR_EACH_BLOCK_DIRECTORY_BIT(BLOCK_DIRECTORY_BIT_KIND_COUNT);
#undef BLOCK_DIRECTORY_BIT_KIND_COUNT

    enum class Kind {
#define BLOCK_DIRECTORY_BIT_KIND_DECLARATION(lowerBitName, capitalBitName) \
        capitalBitName,
        FOR_EACH_BLOCK_DIRECTORY_BIT(BLOCK_DIRECTORY_BIT_KIND_DECLARATION)
#undef BLOCK_DIRECTORY_BIT_KIND_DECLARATION
    };

    class Segment {
    public:
        Segment() = default;
        std::array<uint32_t, numberOfBlockDirectoryBitKinds> m_data { };
    };

    template<Kind kind>
    class BlockDirectoryBitVectorWordView {
        WTF_MAKE_TZONE_ALLOCATED(BlockDirectoryBitVectorWordView);
    public:
        using ViewType = BlockDirectoryBitVectorWordView;

        BlockDirectoryBitVectorWordView() = default;

        BlockDirectoryBitVectorWordView(const Segment* segments, size_t numBits)
            : m_segments(segments)
            , m_numBits(numBits)
        {
        }

        size_t numBits() const
        {
            return m_numBits;
        }

        uint32_t word(size_t index) const
        {
            ASSERT(index < WTF::fastBitVectorArrayLength(numBits()));
            return m_segments[index].m_data[static_cast<unsigned>(kind)];
        }

        uint32_t& word(size_t index)
        {
            ASSERT(index < WTF::fastBitVectorArrayLength(numBits()));
            return const_cast<Segment*>(m_segments)[index].m_data[static_cast<unsigned>(kind)];
        }

        void clearAll()
        {
            for (size_t index = 0; index < WTF::fastBitVectorArrayLength(numBits()); ++index)
                const_cast<Segment*>(m_segments)[index].m_data[static_cast<unsigned>(kind)] = 0;
        }

        BlockDirectoryBitVectorWordView view() const { return *this; }

    private:
        const Segment* m_segments { nullptr };
        size_t m_numBits { 0 };
    };

    template<Kind kind>
    using BlockDirectoryBitVectorView = WTF::FastBitVectorImpl<BlockDirectoryBitVectorWordView<kind>>;

    template<Kind kind>
    class BlockDirectoryBitVectorRef final : public BlockDirectoryBitVectorView<kind> {
    public:
        using Base = BlockDirectoryBitVectorView<kind>;

        explicit BlockDirectoryBitVectorRef(BlockDirectoryBitVectorWordView<kind> view)
            : Base(view)
        {
        }

        template<typename OtherWords>
        BlockDirectoryBitVectorRef& operator=(const WTF::FastBitVectorImpl<OtherWords>& other)
        {
            ASSERT(Base::numBits() == other.numBits());
            for (unsigned i = Base::arrayLength(); i--;)
                Base::unsafeWords().word(i) = other.unsafeWords().word(i);
            return *this;
        }

        template<typename OtherWords>
        BlockDirectoryBitVectorRef& operator|=(const WTF::FastBitVectorImpl<OtherWords>& other)
        {
            ASSERT(Base::numBits() == other.numBits());
            for (unsigned i = Base::arrayLength(); i--;)
                Base::unsafeWords().word(i) |= other.unsafeWords().word(i);
            return *this;
        }

        void clearAll()
        {
            Base::unsafeWords().clearAll();
        }

        WTF::FastBitReference at(size_t index)
        {
            ASSERT(index < Base::numBits());
            return WTF::FastBitReference(&Base::unsafeWords().word(index >> 5), 1 << (index & 31));
        }

        WTF::FastBitReference operator[](size_t index)
        {
            return at(index);
        }
    };

#define BLOCK_DIRECTORY_BIT_ACCESSORS(lowerBitName, capitalBitName)     \
    bool is ## capitalBitName(size_t index) const \
    { \
        return lowerBitName()[index]; \
    } \
    void setIs ## capitalBitName(size_t index, bool value) \
    { \
        lowerBitName()[index] = value; \
    } \
    BlockDirectoryBitVectorView<Kind::capitalBitName> lowerBitName() const \
    { \
        return BlockDirectoryBitVectorView<Kind::capitalBitName>(BlockDirectoryBitVectorWordView<Kind::capitalBitName>(m_segments.data(), m_numBits)); \
    } \
    BlockDirectoryBitVectorRef<Kind::capitalBitName> lowerBitName() \
    { \
        return BlockDirectoryBitVectorRef<Kind::capitalBitName>(BlockDirectoryBitVectorWordView<Kind::capitalBitName>(m_segments.data(), m_numBits)); \
    }
    FOR_EACH_BLOCK_DIRECTORY_BIT(BLOCK_DIRECTORY_BIT_ACCESSORS)
#undef BLOCK_DIRECTORY_BIT_ACCESSORS

    unsigned numBits() const { return m_numBits; }

    void resize(unsigned numBits)
    {
        unsigned oldNumBits = m_numBits;
        m_numBits = numBits;
        m_segments.resize(WTF::fastBitVectorArrayLength(numBits));
        unsigned usedBitsInLastSegment = numBits & indexMask; // This is 0 if all bits are used.
        if (numBits < oldNumBits && usedBitsInLastSegment) {
            // Clear the last segment.
            ASSERT(usedBitsInLastSegment < bitsPerSegment);
            auto& segment = m_segments.last();
            uint32_t mask = (1U << usedBitsInLastSegment) - 1;
            for (unsigned index = 0; index < numberOfBlockDirectoryBitKinds; ++index)
                segment.m_data[index] &= mask;
        }
    }

    template<typename Func>
    void forEachSegment(const Func& func)
    {
        unsigned index = 0;
        for (auto& segment : m_segments)
            func(index++, segment);
    }

private:
    Vector<Segment, 0, CrashOnOverflow, 2> m_segments;
    unsigned m_numBits { 0 };
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
