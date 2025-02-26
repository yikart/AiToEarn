/*
 * Copyright (C) 2009-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2019 the V8 project authors. All rights reserved.
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

#if ENABLE(YARR_JIT)

#include "MacroAssemblerCodeRef.h"
#include "MatchResult.h"
#include "VM.h"
#include "Yarr.h"
#include "YarrPattern.h"
#include <wtf/Atomics.h>
#include <wtf/BitSet.h>
#include <wtf/FixedVector.h>
#include <wtf/StackCheck.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

#define YARR_CALL

namespace JSC {

class CCallHelpers;
class ExecutablePool;
class MacroAssembler;
class VM;

namespace Yarr {

class MatchingContextHolder;
class YarrCodeBlock;

enum class JITFailureReason : uint8_t {
    DecodeSurrogatePair,
    BackReference,
    ForwardReference,
    Lookbehind,
    VariableCountedParenthesisWithNonZeroMinimum,
    ParenthesizedSubpattern,
    FixedCountParenthesizedSubpattern,
    ParenthesisNestedTooDeep,
    ExecutableMemoryAllocationFailure,
    OffsetTooLarge,
};

class BoyerMooreFastCandidates {
    WTF_MAKE_TZONE_ALLOCATED(BoyerMooreFastCandidates);
public:
    static constexpr unsigned maxSize = 2;
    using CharacterVector = Vector<char32_t, maxSize>;

    BoyerMooreFastCandidates() = default;

    bool isValid() const { return m_isValid; }
    void invalidate()
    {
        m_characters.clear();
        m_isValid = false;
    }

    bool isEmpty() const { return m_characters.isEmpty(); }
    unsigned size() const { return m_characters.size(); }
    char32_t at(unsigned index) const { return m_characters.at(index); }

    void add(char32_t character)
    {
        if (!isValid())
            return;
        if (!m_characters.contains(character)) {
            if (m_characters.size() < maxSize)
                m_characters.append(character);
            else
                invalidate();
        }
    }

    void merge(const BoyerMooreFastCandidates& other)
    {
        if (!isValid())
            return;
        if (!other.isValid()) {
            invalidate();
            return;
        }
        for (unsigned index = 0; index < other.size(); ++index)
            add(other.at(index));
    }

    void dump(PrintStream&) const;

private:
    CharacterVector m_characters;
    bool m_isValid { true };
};

class BoyerMooreBitmap {
    WTF_MAKE_NONCOPYABLE(BoyerMooreBitmap);
    WTF_MAKE_TZONE_ALLOCATED(BoyerMooreBitmap);
public:
    static constexpr unsigned mapSize = 128;
    static constexpr unsigned mapMask = 128 - 1;
    using Map = WTF::BitSet<mapSize>;

    BoyerMooreBitmap() = default;

    unsigned count() const { return m_count; }
    const Map& map() const { return m_map; }
    const BoyerMooreFastCandidates& charactersFastPath() const { return m_charactersFastPath; }

    bool add(CharSize charSize, char32_t character)
    {
        if (isAllSet())
            return false;
        if (charSize == CharSize::Char8 && character > 0xff)
            return true;
        m_charactersFastPath.add(character);
        unsigned position = character & mapMask;
        if (!m_map.get(position)) {
            m_map.set(position);
            ++m_count;
        }
        return !isAllSet();
    }

    void addCharacters(CharSize charSize, const Vector<char32_t>& characters)
    {
        if (isAllSet())
            return;
        ASSERT(std::is_sorted(characters.begin(), characters.end()));
        for (auto character : characters) {
            // Early return since characters are sorted.
            if (charSize == CharSize::Char8 && character > 0xff)
                return;
            if (!add(charSize, character))
                return;
        }
    }

    void addRanges(CharSize charSize, const Vector<CharacterRange>& ranges)
    {
        if (isAllSet())
            return;
        ASSERT(std::is_sorted(ranges.begin(), ranges.end(), [](CharacterRange lhs, CharacterRange rhs) {
                return lhs.begin < rhs.begin;
            }));
        for (CharacterRange range : ranges) {
            auto begin = range.begin;
            auto end = range.end;
            if (charSize == CharSize::Char8) {
                // Early return since ranges are sorted.
                if (begin > 0xff)
                    return;
                if (end > 0xff)
                    end = 0xff;
            }
            if (static_cast<unsigned>(end - begin + 1) >= mapSize) {
                setAll();
                return;
            }
            for (auto character = begin; character <= end; ++character) {
                if (!add(charSize, character))
                    return;
            }
        }
    }

    void setAll()
    {
        m_count = mapSize;
    }

    bool isAllSet() const { return m_count == mapSize; }

    void dump(PrintStream&) const;

private:
    Map m_map { };
    BoyerMooreFastCandidates m_charactersFastPath;
    unsigned m_count { 0 };
};

#if CPU(ARM64E)
extern "C" UGPRPair vmEntryToYarrJIT(const void* input, UCPURegister start, UCPURegister length, int* output, MatchingContextHolder* matchingContext, const void* codePtr);
extern "C" void vmEntryToYarrJITAfter(void);
#endif

class YarrBoyerMooreData {
    WTF_MAKE_TZONE_ALLOCATED(YarrBoyerMooreData);
    WTF_MAKE_NONCOPYABLE(YarrBoyerMooreData);

public:
    YarrBoyerMooreData() = default;

    void saveMaps(Vector<UniqueRef<BoyerMooreBitmap::Map>>&& maps)
    {
        m_maps.appendVector(WTFMove(maps));
    }

    void clearMaps()
    {
        m_maps.clear();
    }

    const BoyerMooreBitmap::Map::WordType* tryReuseBoyerMooreBitmap(const BoyerMooreBitmap::Map& map) const
    {
        for (auto& stored : m_maps) {
            if (stored.get() == map)
                return stored->storage();
        }
        return nullptr;
    }

private:
    Vector<UniqueRef<BoyerMooreBitmap::Map>> m_maps;
};

class YarrCodeBlock final : public YarrBoyerMooreData {
    struct InlineStats {
        InlineStats()
            : m_insnCount(0)
            , m_stackSize(0)
            , m_needsTemp2(false)
            , m_canInline(false)
        {
        }

        void set(unsigned insnCount, unsigned stackSize, bool canInline, bool needsTemp2)
        {
            m_insnCount= insnCount;
            m_stackSize = stackSize;
            m_needsTemp2 = needsTemp2;
            WTF::storeStoreFence();
            m_canInline = canInline;
        }

        void clear()
        {
        }

        unsigned codeSize() const { return m_insnCount; }
        unsigned stackSize() const { return m_stackSize; }
        bool canInline() const { return m_canInline; }
        bool needsTemp2() const { return m_needsTemp2; }

        unsigned m_insnCount;
        unsigned m_stackSize : 30;
        bool m_needsTemp2 : 1;
        bool m_canInline : 1;
    };

    WTF_MAKE_TZONE_ALLOCATED(YarrCodeBlock);
    WTF_MAKE_NONCOPYABLE(YarrCodeBlock);

public:
    using YarrJITCode8 = UGPRPair SYSV_ABI (*)(const LChar* input, UCPURegister start, UCPURegister length, int* output, MatchingContextHolder*) YARR_CALL;
    using YarrJITCode16 = UGPRPair SYSV_ABI (*)(const UChar* input, UCPURegister start, UCPURegister length, int* output, MatchingContextHolder*) YARR_CALL;
    using YarrJITCodeMatchOnly8 = UGPRPair SYSV_ABI (*)(const LChar* input, UCPURegister start, UCPURegister length, void*, MatchingContextHolder*) YARR_CALL;
    using YarrJITCodeMatchOnly16 = UGPRPair SYSV_ABI (*)(const UChar* input, UCPURegister start, UCPURegister length, void*, MatchingContextHolder*) YARR_CALL;

    YarrCodeBlock(RegExp* regExp)
        : m_regExp(regExp)
    { }

    void setFallBackWithFailureReason(JITFailureReason failureReason) { m_failureReason = failureReason; }
    std::optional<JITFailureReason> failureReason() { return m_failureReason; }

    bool has8BitCode() { return m_ref8.size(); }
    bool has16BitCode() { return m_ref16.size(); }
    void set8BitCode(MacroAssemblerCodeRef<Yarr8BitPtrTag> ref, Vector<UniqueRef<BoyerMooreBitmap::Map>> maps)
    {
        m_ref8 = ref;
        saveMaps(WTFMove(maps));
    }
    void set16BitCode(MacroAssemblerCodeRef<Yarr16BitPtrTag> ref, Vector<UniqueRef<BoyerMooreBitmap::Map>> maps)
    {
        m_ref16 = ref;
        saveMaps(WTFMove(maps));
    }

    bool has8BitCodeMatchOnly() { return m_matchOnly8.size(); }
    bool has16BitCodeMatchOnly() { return m_matchOnly16.size(); }
    void set8BitCodeMatchOnly(MacroAssemblerCodeRef<YarrMatchOnly8BitPtrTag> matchOnly, Vector<UniqueRef<BoyerMooreBitmap::Map>> maps)
    {
        m_matchOnly8 = matchOnly;
        saveMaps(WTFMove(maps));
    }
    void set16BitCodeMatchOnly(MacroAssemblerCodeRef<YarrMatchOnly16BitPtrTag> matchOnly, Vector<UniqueRef<BoyerMooreBitmap::Map>> maps)
    {
        m_matchOnly16 = matchOnly;
        saveMaps(WTFMove(maps));
    }

    bool usesPatternContextBuffer() { return m_usesPatternContextBuffer; }
#if ENABLE(YARR_JIT_ALL_PARENS_EXPRESSIONS)
    void setUsesPatternContextBuffer() { m_usesPatternContextBuffer = true; }
#endif

    void set8BitInlineStats(unsigned insnCount, unsigned stackSize, bool canInline, bool needsT2)
    {
        m_matchOnly8Stats.set(insnCount, stackSize, canInline, needsT2);
    }

    void set16BitInlineStats(unsigned insnCount, unsigned stackSize, bool canInline, bool needsT2)
    {
        m_matchOnly16Stats.set(insnCount, stackSize, canInline, needsT2);
    }

    InlineStats& get8BitInlineStats() { return m_matchOnly8Stats; }
    InlineStats& get16BitInlineStats() { return  m_matchOnly16Stats; }

    MatchResult execute(std::span<const LChar> input, unsigned start, int* output, MatchingContextHolder* matchingContext)
    {
        ASSERT(has8BitCode());
#if CPU(ARM64E)
        if (Options::useJITCage())
            return MatchResult(vmEntryToYarrJIT(input.data(), start, input.size(), output, matchingContext, retagCodePtr<Yarr8BitPtrTag, YarrEntryPtrTag>(m_ref8.code().taggedPtr())));
#endif
        return MatchResult(untagCFunctionPtr<YarrJITCode8, Yarr8BitPtrTag>(m_ref8.code().taggedPtr())(input.data(), start, input.size(), output, matchingContext));
    }

    MatchResult execute(std::span<const UChar> input, unsigned start, int* output, MatchingContextHolder* matchingContext)
    {
        ASSERT(has16BitCode());
#if CPU(ARM64E)
        if (Options::useJITCage())
            return MatchResult(vmEntryToYarrJIT(input.data(), start, input.size(), output, matchingContext, retagCodePtr<Yarr16BitPtrTag, YarrEntryPtrTag>(m_ref16.code().taggedPtr())));
#endif
        return MatchResult(untagCFunctionPtr<YarrJITCode16, Yarr16BitPtrTag>(m_ref16.code().taggedPtr())(input.data(), start, input.size(), output, matchingContext));
    }

    MatchResult execute(std::span<const LChar> input, unsigned start, MatchingContextHolder* matchingContext)
    {
        ASSERT(has8BitCodeMatchOnly());
#if CPU(ARM64E)
        if (Options::useJITCage())
            return MatchResult(vmEntryToYarrJIT(input.data(), start, input.size(), nullptr, matchingContext, retagCodePtr<YarrMatchOnly8BitPtrTag, YarrEntryPtrTag>(m_matchOnly8.code().taggedPtr())));
#endif
        return MatchResult(untagCFunctionPtr<YarrJITCodeMatchOnly8, YarrMatchOnly8BitPtrTag>(m_matchOnly8.code().taggedPtr())(input.data(), start, input.size(), nullptr, matchingContext));
    }

    MatchResult execute(std::span<const UChar> input, unsigned start, MatchingContextHolder* matchingContext)
    {
        ASSERT(has16BitCodeMatchOnly());
#if CPU(ARM64E)
        if (Options::useJITCage())
            return MatchResult(vmEntryToYarrJIT(input.data(), start, input.size(), nullptr, matchingContext, retagCodePtr<YarrMatchOnly16BitPtrTag, YarrEntryPtrTag>(m_matchOnly16.code().taggedPtr())));
#endif
        return MatchResult(untagCFunctionPtr<YarrJITCodeMatchOnly16, YarrMatchOnly16BitPtrTag>(m_matchOnly16.code().taggedPtr())(input.data(), start, input.size(), nullptr, matchingContext));
    }

#if ENABLE(REGEXP_TRACING)
    void *get8BitMatchOnlyAddr()
    {
        if (!has8BitCodeMatchOnly())
            return 0;

        return m_matchOnly8.code().taggedPtr();
    }

    void *get16BitMatchOnlyAddr()
    {
        if (!has16BitCodeMatchOnly())
            return 0;

        return m_matchOnly16.code().taggedPtr();
    }

    void *get8BitMatchAddr()
    {
        if (!has8BitCode())
            return 0;

        return m_ref8.code().taggedPtr();
    }

    void *get16BitMatchAddr()
    {
        if (!has16BitCode())
            return 0;

        return m_ref16.code().taggedPtr();
    }
#endif

    size_t size() const
    {
        return m_ref8.size() + m_ref16.size() + m_matchOnly8.size() + m_matchOnly16.size();
    }

    void clear(const AbstractLocker&)
    {
        m_ref8 = MacroAssemblerCodeRef<Yarr8BitPtrTag>();
        m_ref16 = MacroAssemblerCodeRef<Yarr16BitPtrTag>();
        m_matchOnly8 = MacroAssemblerCodeRef<YarrMatchOnly8BitPtrTag>();
        m_matchOnly16 = MacroAssemblerCodeRef<YarrMatchOnly16BitPtrTag>();
        m_failureReason = std::nullopt;
        clearMaps();
    }

    void dumpSimpleName(PrintStream&) const;

private:
    MacroAssemblerCodeRef<Yarr8BitPtrTag> m_ref8;
    MacroAssemblerCodeRef<Yarr16BitPtrTag> m_ref16;
    MacroAssemblerCodeRef<YarrMatchOnly8BitPtrTag> m_matchOnly8;
    MacroAssemblerCodeRef<YarrMatchOnly16BitPtrTag> m_matchOnly16;
    InlineStats m_matchOnly8Stats;
    InlineStats m_matchOnly16Stats;
    RegExp* m_regExp { nullptr };

    bool m_usesPatternContextBuffer { false };
    std::optional<JITFailureReason> m_failureReason;
};

enum class JITCompileMode : uint8_t {
    MatchOnly,
    IncludeSubpatterns,
    InlineTest
};
void jitCompile(YarrPattern&, StringView patternString, CharSize, std::optional<StringView> sampleString, VM*, YarrCodeBlock& jitObject, JITCompileMode);

#if ENABLE(YARR_JIT_REGEXP_TEST_INLINE)


class YarrJITRegisters;

void jitCompileInlinedTest(StackCheck*, StringView, OptionSet<Yarr::Flags>, CharSize, VM*, YarrBoyerMooreData&, CCallHelpers&, YarrJITRegisters&);
#endif

#if ENABLE(YARR_JIT_BACKREFERENCES_FOR_16BIT_EXPRS)
MacroAssemblerCodeRef<JITThunkPtrTag> areCanonicallyEquivalentThunkGenerator(VM&);
#endif

} } // namespace JSC::Yarr

#endif
