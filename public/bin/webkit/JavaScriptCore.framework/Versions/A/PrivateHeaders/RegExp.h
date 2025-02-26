/*
 *  Copyright (C) 1999-2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2007-2022 Apple Inc. All rights reserved.
 *  Copyright (C) 2009 Torch Mobile, Inc.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 */

#pragma once

#include "ConcurrentJSLock.h"
#include "MatchResult.h"
#include "RegExpKey.h"
#include "Structure.h"
#include "Yarr.h"
#include <wtf/Forward.h>
#include <wtf/text/WTFString.h>

#if ENABLE(YARR_JIT)
#include "YarrJIT.h"
#endif

namespace JSC {

struct RegExpRepresentation;
class VM;

class RegExp final : public JSCell {
    friend class CachedRegExp;

public:
    using Base = JSCell;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;
    static constexpr bool needsDestruction = true;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.regExpSpace();
    }

    JS_EXPORT_PRIVATE static RegExp* create(VM&, const String& pattern, OptionSet<Yarr::Flags>);
    static void destroy(JSCell*);
    static size_t estimatedSize(JSCell*, VM&);
    JS_EXPORT_PRIVATE static void dumpToStream(const JSCell*, PrintStream&);
    void dumpSimpleName(PrintStream&) const;

    OptionSet<Yarr::Flags> flags() const { return m_flags; }
#define JSC_DEFINE_REGEXP_FLAG_ACCESSOR(key, name, lowerCaseName, index) bool lowerCaseName() const { return m_flags.contains(Yarr::Flags::name); }
    JSC_REGEXP_FLAGS(JSC_DEFINE_REGEXP_FLAG_ACCESSOR)
#undef JSC_DEFINE_REGEXP_FLAG_ACCESSOR
    bool globalOrSticky() const { return global() || sticky(); }
    bool eitherUnicode() const { return unicode() || unicodeSets(); }

    const String& pattern() const { return m_patternString; }

    bool isValid() const { return !Yarr::hasError(m_constructionErrorCode); }
    const char* errorMessage() const { return Yarr::errorMessage(m_constructionErrorCode); }
    JSObject* errorToThrow(JSGlobalObject* globalObject) { return Yarr::errorToThrow(globalObject, m_constructionErrorCode); }
    void reset()
    {
        m_state = NotCompiled;
        m_constructionErrorCode = Yarr::ErrorCode::NoError;
    }

    JS_EXPORT_PRIVATE int match(JSGlobalObject*, StringView, unsigned startOffset, Vector<int>& ovector);

    // Returns false if we couldn't run the regular expression for any reason.
    bool matchConcurrently(VM&, StringView, unsigned startOffset, int& position, Vector<int>& ovector);
    
    JS_EXPORT_PRIVATE MatchResult match(JSGlobalObject*, StringView, unsigned startOffset);

    bool matchConcurrently(VM&, StringView, unsigned startOffset, MatchResult&);

    // Call these versions of the match functions if you're desperate for performance.
    template<typename VectorType, Yarr::MatchFrom thread = Yarr::MatchFrom::VMThread>
    int matchInline(JSGlobalObject* nullOrGlobalObject, VM&, StringView, unsigned startOffset, VectorType& ovector);
    template<Yarr::MatchFrom thread = Yarr::MatchFrom::VMThread>
    MatchResult matchInline(JSGlobalObject* nullOrGlobalObject, VM&, StringView, unsigned startOffset);
    
    unsigned numSubpatterns() const { return m_numSubpatterns; }

    unsigned offsetVectorBaseForNamedCaptures() const
    {
        return (numSubpatterns() + 1) * 2;
    }

    int offsetVectorSize() const
    {
        if (!hasNamedCaptures())
            return offsetVectorBaseForNamedCaptures();
        return offsetVectorBaseForNamedCaptures() + m_rareData->m_numDuplicateNamedCaptureGroups;
    }

    bool hasNamedCaptures() const
    {
        return m_rareData && !m_rareData->m_captureGroupNames.isEmpty();
    }

    String getCaptureGroupNameForSubpatternId(unsigned i) const
    {
        if (!i || !m_rareData || m_rareData->m_captureGroupNames.isEmpty())
            return String();
        ASSERT(m_rareData);
        return m_rareData->m_captureGroupNames[i];
    }

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN
    template <typename Offsets>
    unsigned subpatternIdForGroupName(StringView groupName, const Offsets ovector) const
    {
        if (!m_rareData)
            return 0;
        auto it = m_rareData->m_namedGroupToParenIndices.find<StringViewHashTranslator>(groupName);
        if (it == m_rareData->m_namedGroupToParenIndices.end())
            return 0;
        if (it->value.size() == 1)
            return it->value[0];

        return ovector[offsetVectorBaseForNamedCaptures() + it->value[0] - 1];
    }
WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

    bool hasCode()
    {
        return m_state == JITCode || m_state == ByteCode;
    }

    bool hasCodeFor(Yarr::CharSize);
    bool hasMatchOnlyCodeFor(Yarr::CharSize);

    void deleteCode();

#if ENABLE(REGEXP_TRACING)
    constexpr static unsigned SameLineFormatedRegExpnWidth = 74;
    static void printTraceHeader();
    void printTraceData();
#endif

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_INFO;

    RegExpKey key() { return RegExpKey(m_flags, m_patternString); }

    String escapedPattern() const;

    String toSourceString() const;

#if ENABLE(YARR_JIT)
    Yarr::YarrCodeBlock* getRegExpJITCodeBlock()
    {
        if (m_state != JITCode)
            return nullptr;

        return m_regExpJITCode.get();
    }
#endif

    bool hasValidAtom() const { return !m_atom.isNull(); }
    const String& atom() const { return m_atom; }
    void setAtom(String&& atom) { m_atom = WTFMove(atom); }

private:
    friend class RegExpCache;
    RegExp(VM&, const String&, OptionSet<Yarr::Flags>);
    void finishCreation(VM&);

    static RegExp* createWithoutCaching(VM&, const String&, OptionSet<Yarr::Flags>);

    enum RegExpState : uint8_t {
        ParseError,
        JITCode,
        ByteCode,
        NotCompiled
    };

    void byteCodeCompileIfNecessary(VM*);

    void compile(VM*, Yarr::CharSize, std::optional<StringView> sampleString);
    void compileIfNecessary(VM&, Yarr::CharSize, std::optional<StringView> sampleString);

    void compileMatchOnly(VM*, Yarr::CharSize, std::optional<StringView> sampleString);
    void compileIfNecessaryMatchOnly(VM&, Yarr::CharSize, std::optional<StringView> sampleString);

#if ENABLE(YARR_JIT_DEBUG)
    void matchCompareWithInterpreter(StringView, int startOffset, int* offsetVector, int jitResult);
#endif

#if ENABLE(YARR_JIT)
    Yarr::YarrCodeBlock& ensureRegExpJITCode()
    {
        if (!m_regExpJITCode)
            m_regExpJITCode = makeUnique<Yarr::YarrCodeBlock>(this);
        return *m_regExpJITCode.get();
    }
#endif

    struct RareData {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;
        unsigned m_numDuplicateNamedCaptureGroups;
        Vector<String> m_captureGroupNames;

        // This first element of the RHS vector is the subpatternId in the non-duplicate case.
        // For the duplicate case, the first element is the namedCaptureGroupId.
        // The remaining elements are the subpatternIds for each of the duplicate groups.
        UncheckedKeyHashMap<String, Vector<unsigned>> m_namedGroupToParenIndices;
    };

    String m_patternString;
    String m_atom;
    RegExpState m_state { NotCompiled };
    OptionSet<Yarr::Flags> m_flags;
    Yarr::ErrorCode m_constructionErrorCode { Yarr::ErrorCode::NoError };
    unsigned m_numSubpatterns { 0 };
    std::unique_ptr<Yarr::BytecodePattern> m_regExpBytecode;
#if ENABLE(YARR_JIT)
    std::unique_ptr<Yarr::YarrCodeBlock> m_regExpJITCode;
#endif
    std::unique_ptr<RareData> m_rareData;
#if ENABLE(REGEXP_TRACING)
    double m_rtMatchOnlyTotalSubjectStringLen { 0.0 };
    double m_rtMatchTotalSubjectStringLen { 0.0 };
    unsigned m_rtMatchOnlyCallCount { 0 };
    unsigned m_rtMatchOnlyFoundCount { 0 };
    unsigned m_rtMatchCallCount { 0 };
    unsigned m_rtMatchFoundCount { 0 };
#endif
};

} // namespace JSC
