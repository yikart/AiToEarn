/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "LineColumn.h"
#include <wtf/HashMap.h>
#include <wtf/HashTraits.h>
#include <wtf/IterationStatus.h>
#include <wtf/MallocPtr.h>
#include <wtf/PrintStream.h>
#include <wtf/StdLibExtras.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

// See comment at the top of ExpressionInfo.cpp on how ExpressionInfo works.

class ExpressionInfo {
    WTF_MAKE_NONCOPYABLE(ExpressionInfo);
    WTF_MAKE_FAST_ALLOCATED;
public:
    enum class FieldID : uint8_t { InstPC, Divot, Start, End, Line, Column };

    class Decoder;

    using InstPC = unsigned; // aka bytecode PC.

    static constexpr InstPC maxInstPC = std::numeric_limits<unsigned>::max();

    struct Chapter {
        InstPC startInstPC;
        unsigned startEncodedInfoIndex;
    };

    struct Entry {
        void reset()
        {
            instPC = 0;
            lineColumn = { 0, 0 };
            divot = 0;
            startOffset = 0;
            endOffset = 0;
        }

        InstPC instPC { 0 };
        LineColumn lineColumn;
        unsigned divot { 0 };
        unsigned startOffset { 0 }; // This value is relative to divot.
        unsigned endOffset { 0 }; // This value is relative to divot.
    };

    struct EncodedInfo {
        bool isAbsInstPC() const;
        bool isExtension() const;
        unsigned value;
    };

    struct Diff;

    class Encoder {
    public:
        void encode(InstPC, unsigned divot, unsigned startOffset, unsigned endOffset, LineColumn);

        template<typename RemapFunc>
        void remap(Vector<unsigned>&& adjustments, RemapFunc);

        Entry entry() const { return m_entry; }

        MallocPtr<ExpressionInfo> createExpressionInfo();

        void dumpEncodedInfo() // For debugging use only.
        {
            ExpressionInfo::dumpEncodedInfo(m_expressionInfoEncodedInfo.begin(), m_expressionInfoEncodedInfo.end());
        }

    private:
        struct Wide {
            enum class SortOrder : uint8_t { Single, Duo, Multi };

            unsigned value;
            FieldID fieldID;
            SortOrder order { SortOrder::Multi };
        };

        static EncodedInfo encodeAbsInstPC(InstPC absInstPC);
        static EncodedInfo encodeExtension(unsigned offset);
        static constexpr EncodedInfo encodeExtensionEnd();
        static EncodedInfo encodeSingle(FieldID, unsigned);
        static EncodedInfo encodeDuo(FieldID, unsigned value1, FieldID, unsigned value2);
        static EncodedInfo encodeMultiHeader(unsigned numWides, Wide*);
        static EncodedInfo encodeBasic(const Diff&);

        void adjustInstPC(EncodedInfo*, unsigned instPCDelta);

        template<unsigned bitCount> bool fits(Wide);
        template<typename T, unsigned bitCount> bool fits(T);

        Entry m_entry;

        unsigned m_currentChapterStartIndex { 0 };
        unsigned m_numberOfEncodedInfoExtensions { 0 };
        Vector<ExpressionInfo::Chapter> m_expressionInfoChapters;
        Vector<ExpressionInfo::EncodedInfo> m_expressionInfoEncodedInfo;
    };

    class Decoder {
    public:
        Decoder() = default;
        Decoder(const ExpressionInfo&);
        Decoder(Vector<ExpressionInfo::EncodedInfo>&);

        IterationStatus decode(std::optional<InstPC> targetInstPC = std::nullopt);

        void recacheInfo(Vector<ExpressionInfo::EncodedInfo>&);
        EncodedInfo* currentInfo() const { return m_currentInfo; }

        // This is meant to be used to jump to the start of a chapter, where the encoder
        // always start over with no historical Entry values to compute diffs from.
        // If you use this to point to any EncodedInfo other than the start of a chapter,
        // then you're responsible for setting up the initial conditions of m_entry correctly
        // apriori.
        void setNextInfo(EncodedInfo* info) { m_nextInfo = info; }

        Entry entry() const { return m_entry; }
        void setEntry(Entry entry) { m_entry = entry; } // For debugging use only.

        InstPC instPC() const { return m_entry.instPC; }
        unsigned divot() const { return m_entry.divot; }
        unsigned startOffset() const { return m_entry.startOffset; }
        unsigned endOffset() const { return m_entry.endOffset; }
        LineColumn lineColumn() const { return m_entry.lineColumn; }

    private:
        struct Wide {
            FieldID fieldID;
            unsigned value;
        };

        void appendWide(FieldID id, unsigned value)
        {
            m_wides[m_numWides++] = { id, value };
        }

        unsigned m_word { 0 };

        Entry m_entry;
        EncodedInfo* m_startInfo { nullptr };
        EncodedInfo* m_endInfo { nullptr };
        EncodedInfo* m_endExtensionInfo { nullptr };
        EncodedInfo* m_currentInfo { nullptr };
        EncodedInfo* m_nextInfo { nullptr };
        bool m_hasDecodedFirstEntry { false };

        unsigned m_numWides { 0 };
        std::array<Wide, 6> m_wides;
    };

    ~ExpressionInfo() = default;

    LineColumn lineColumnForInstPC(InstPC);
    Entry entryForInstPC(InstPC);

    bool isEmpty() const { return !m_numberOfEncodedInfo; };
    size_t byteSize() const;

    template<unsigned bitCount>
    static void print(PrintStream&, FieldID, unsigned value);
    static void dumpEncodedInfo(EncodedInfo* start, EncodedInfo* end); // For debugging use only.

private:
    ExpressionInfo(unsigned numberOfChapters, unsigned numberOfEncodedInfo, unsigned numberOfEncodedInfoExtensions);
    ExpressionInfo(Vector<Chapter>&&, Vector<EncodedInfo>&&, unsigned numberOfEncodedInfoExtensions);

    template<typename T, unsigned bitCount> static T cast(unsigned);

    static bool isSpecial(unsigned);
    static bool isWideOrSpecial(unsigned);

    static size_t payloadSizeInBytes(size_t numChapters, size_t numberOfEncodedInfo, size_t numberOfEncodedInfoExtensions)
    {
        size_t size = numChapters * sizeof(Chapter) + (numberOfEncodedInfo + numberOfEncodedInfoExtensions) * sizeof(EncodedInfo);
        return roundUpToMultipleOf<sizeof(unsigned)>(size);
    }

    static size_t totalSizeInBytes(size_t numChapters, size_t numberOfEncodedInfo, size_t numberOfEncodedInfoExtensions)
    {
        return sizeof(ExpressionInfo) + payloadSizeInBytes(numChapters, numberOfEncodedInfo, numberOfEncodedInfoExtensions);
    }

    EncodedInfo* findChapterEncodedInfoJustBelow(InstPC) const;

    Chapter* chapters() const
    {
        return std::bit_cast<Chapter*>(this + 1);
    }

    EncodedInfo* encodedInfo() const
    {
        return std::bit_cast<EncodedInfo*>(&chapters()[m_numberOfChapters]);
    }

    EncodedInfo* endEncodedInfo() const
    {
        return &encodedInfo()[m_numberOfEncodedInfo];
    }

    EncodedInfo* endExtensionEncodedInfo() const
    {
        return &encodedInfo()[m_numberOfEncodedInfo + m_numberOfEncodedInfoExtensions];
    }

    size_t payloadSize() const
    {
        return payloadSizeInBytes(m_numberOfChapters, m_numberOfEncodedInfo, m_numberOfEncodedInfoExtensions) / sizeof(unsigned);
    }

    unsigned* payload() const
    {
        return std::bit_cast<unsigned*>(this + 1);
    }

    static MallocPtr<ExpressionInfo> createUninitialized(unsigned numberOfChapters, unsigned numberOfEncodedInfo, unsigned numberOfEncodedInfoExtensions);

    static constexpr unsigned bitsPerWord = sizeof(unsigned) * CHAR_BIT;

    // Number of bits of each field in Basic encoding.
    static constexpr unsigned instPCBits = 5;
    static constexpr unsigned divotBits = 7;
    static constexpr unsigned startBits = 6;
    static constexpr unsigned endBits = 6;
    static constexpr unsigned lineBits = 3;
    static constexpr unsigned columnBits = 5;
    static_assert(instPCBits + divotBits + startBits + endBits + lineBits + columnBits == bitsPerWord);

    // Bias values used for the signed diff values which make it easier to do range checks on these.
    static constexpr unsigned divotBias = (1 << divotBits) / 2;
    static constexpr unsigned lineBias = (1 << lineBits) / 2;
    static constexpr unsigned columnBias = (1 << columnBits) / 2;

    static constexpr unsigned instPCShift = bitsPerWord - instPCBits;
    static constexpr unsigned divotShift = instPCShift - divotBits;
    static constexpr unsigned startShift = divotShift - startBits;
    static constexpr unsigned endShift = startShift - endBits;
    static constexpr unsigned lineShift = endShift - lineBits;
    static constexpr unsigned columnShift = lineShift - columnBits;

    static constexpr unsigned specialHeader = (1 << instPCBits) - 1;
    static constexpr unsigned wideHeader = specialHeader - 1;

    static constexpr unsigned maxInstPCValue = wideHeader - 1;
    static constexpr unsigned maxBiasedDivotValue = (1 << divotBits) - 1;
    static constexpr unsigned maxStartValue = (1 << startBits) - 1;
    static constexpr unsigned maxEndValue = (1 << endBits) - 1;
    static constexpr unsigned maxBiasedLineValue = (1 << lineBits) - 1;

    static constexpr unsigned sameAsDivotValue = (1 << columnBits) - 1;
    static constexpr unsigned maxBiasedColumnValue = sameAsDivotValue - 1;

    // Number of bits in Wide / Special encodings.
    static constexpr unsigned specialValueBits = 26;
    static constexpr unsigned singleValueBits = 23;
    static constexpr unsigned duoValueBits = 10;
    static constexpr unsigned fullValueBits = 32;
    static constexpr unsigned multiSizeBits = 5;
    static constexpr unsigned fieldIDBits = 3;

    static constexpr unsigned maxSpecialValue = (1 << specialValueBits) - 1;
    static constexpr unsigned maxSingleValue = (1 << singleValueBits) - 1;
    static constexpr unsigned maxDuoValue = (1 << duoValueBits) - 1;
    static constexpr unsigned invalidFieldID = (1 << fieldIDBits) - 1;

    static constexpr unsigned multiSizeMask = (1 << multiSizeBits) - 1;
    static constexpr unsigned fieldIDMask = (1 << fieldIDBits) - 1;

    static constexpr unsigned headerShift = bitsPerWord - instPCBits;
    static constexpr unsigned multiBitShift = headerShift - 1;
    static_assert(headerShift == 27);
    static_assert(multiBitShift == 26);

    static constexpr unsigned specialValueShift = multiBitShift - specialValueBits;
    static_assert(!specialValueShift);

    static constexpr unsigned firstFieldIDShift = multiBitShift - fieldIDBits;
    static constexpr unsigned singleValueShift = firstFieldIDShift - singleValueBits;
    static_assert(!singleValueShift);

    static constexpr unsigned duoFirstValueShift = firstFieldIDShift - duoValueBits;
    static constexpr unsigned duoSecondFieldIDShift = duoFirstValueShift - fieldIDBits;
    static constexpr unsigned duoSecondValueShift = duoSecondFieldIDShift - duoValueBits;
    static_assert(!duoSecondValueShift);

    static constexpr unsigned multiSizeShift = firstFieldIDShift - multiSizeBits;
    static constexpr unsigned multiFirstFieldShift = multiSizeShift - fieldIDBits;

    static constexpr unsigned numberOfWordsBetweenChapters = 10000;

    using LineColumnMap = UncheckedKeyHashMap<InstPC, LineColumn, WTF::IntHash<InstPC>, WTF::UnsignedWithZeroKeyHashTraits<InstPC>>;

    mutable LineColumnMap m_cachedLineColumns;
    unsigned m_numberOfChapters;
    unsigned m_numberOfEncodedInfo;
    unsigned m_numberOfEncodedInfoExtensions;
    // Followed by the following which are allocated but are dynamically sized.
    //   Chapter chapters[numberOfChapters];
    //   EncodedInfo encodedInfo[numberOfEncodedInfo + numberOfEncodedInfoExtensions];

    friend class CachedExpressionInfo;
};

static_assert(roundUpToMultipleOf<sizeof(unsigned)>(sizeof(ExpressionInfo)) == sizeof(ExpressionInfo), "CachedExpressionInfo relies on this invariant");

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
