/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(CONTENT_EXTENSIONS)

#include "ContentExtensionsDebugging.h"
#include "NFA.h"
#include <unicode/utypes.h>
#include <wtf/ASCIICType.h>
#include <wtf/Hasher.h>
#include <wtf/Vector.h>
#include <wtf/text/StringBuilder.h>

namespace WebCore {

namespace ContentExtensions {

enum class AtomQuantifier : uint8_t {
    One,
    ZeroOrOne,
    ZeroOrMore,
    OneOrMore
};

class Term {
public:
    Term();
    Term(char character, bool isCaseSensitive);

    enum UniversalTransitionTag { UniversalTransition };
    explicit Term(UniversalTransitionTag);

    enum CharacterSetTermTag { CharacterSetTerm };
    explicit Term(CharacterSetTermTag, bool isInverted);

    enum GroupTermTag { GroupTerm };
    explicit Term(GroupTermTag);

    enum EndOfLineAssertionTermTag { EndOfLineAssertionTerm };
    explicit Term(EndOfLineAssertionTermTag);

    Term(const Term& other);
    Term(Term&& other);

    enum EmptyValueTag { EmptyValue };
    Term(EmptyValueTag);

    ~Term();

    bool isValid() const;

    // CharacterSet terms only.
    void addCharacter(UChar character, bool isCaseSensitive);

    // Group terms only.
    void extendGroupSubpattern(const Term&);

    void quantify(const AtomQuantifier&);

    ImmutableCharNFANodeBuilder generateGraph(NFA&, ImmutableCharNFANodeBuilder& source, const ActionList& finalActions) const;
    void generateGraph(NFA&, ImmutableCharNFANodeBuilder& source, uint32_t destination) const;

    bool isEndOfLineAssertion() const;

    bool matchesAtLeastOneCharacter() const;

    // Matches any string, the empty string included.
    // This is very conservative. Patterns matching any string can return false here.
    bool isKnownToMatchAnyString() const;

    // Return true if the term can only match input of a single fixed length.
    bool hasFixedLength() const;

    Term& operator=(const Term& other);
    Term& operator=(Term&& other);

    bool operator==(const Term& other) const;

    bool isEmptyValue() const;

#if CONTENT_EXTENSIONS_STATE_MACHINE_DEBUGGING
    String toString() const;
#endif

#if CONTENT_EXTENSIONS_PERFORMANCE_REPORTING
    size_t memoryUsed() const;
#endif
    
private:
    friend void add(Hasher&, const Term&);

    // This is exact for character sets but conservative for groups.
    // The return value can be false for a group equivalent to a universal transition.
    bool isUniversalTransition() const;

    void generateSubgraphForAtom(NFA&, ImmutableCharNFANodeBuilder& source, const ImmutableCharNFANodeBuilder& destination) const;
    void generateSubgraphForAtom(NFA&, ImmutableCharNFANodeBuilder& source, uint32_t destination) const;

    void destroy();

    enum class TermType : uint8_t {
        Empty,
        CharacterSet,
        Group
    };

    TermType m_termType { TermType::Empty };
    AtomQuantifier m_quantifier { AtomQuantifier::One };

    class CharacterSet {
    public:
        void set(UChar character)
        {
            RELEASE_ASSERT(character < 128);
            m_characters[character / 64] |= (uint64_t(1) << (character % 64));
        }
        
        bool get(UChar character) const
        {
            RELEASE_ASSERT(character < 128);
            return m_characters[character / 64] & (uint64_t(1) << (character % 64));
        }
        
        void invert()
        {
            ASSERT(!m_inverted);
            m_inverted = true;
        }
        
        bool inverted() const { return m_inverted; }
        
        unsigned bitCount() const
        {
            return WTF::bitCount(m_characters[0]) + WTF::bitCount(m_characters[1]);
        }
        
        friend bool operator==(const CharacterSet&, const CharacterSet&) = default;

    private:
        friend void add(Hasher&, const CharacterSet&);

        bool m_inverted { false };
        std::array<uint64_t, 2> m_characters { 0, 0 };
    };
    friend void add(Hasher&, const Term::CharacterSet&);

    struct Group {
        Vector<Term> terms;

        friend bool operator==(const Group&, const Group&) = default;
    };
    friend void add(Hasher&, const Term::Group&);

    union AtomData {
        AtomData()
            : invalidTerm(0)
        {
        }
        ~AtomData()
        {
        }

        char invalidTerm;
        CharacterSet characterSet;
        Group group;
    } m_atomData;
};

inline void add(Hasher& hasher, const Term::CharacterSet& characterSet)
{
    add(hasher, characterSet.m_inverted, characterSet.m_characters);
}

inline void add(Hasher& hasher, const Term::Group& group)
{
    add(hasher, group.terms);
}

inline void add(Hasher& hasher, const Term& term)
{
    add(hasher, term.m_termType, term.m_quantifier);
    switch (term.m_termType) {
    case Term::TermType::Empty:
        break;
    case Term::TermType::CharacterSet:
        add(hasher, term.m_atomData.characterSet);
        break;
    case Term::TermType::Group:
        add(hasher, term.m_atomData.group);
        break;
    }
}

#if CONTENT_EXTENSIONS_STATE_MACHINE_DEBUGGING
inline String quantifierToString(AtomQuantifier quantifier)
{
    switch (quantifier) {
    case AtomQuantifier::One:
        return "";
    case AtomQuantifier::ZeroOrOne:
        return "?";
    case AtomQuantifier::ZeroOrMore:
        return "*";
    case AtomQuantifier::OneOrMore:
        return "+";
    }
}
    
inline String Term::toString() const
{
    switch (m_termType) {
    case TermType::Empty:
        return "(Empty)";
    case TermType::CharacterSet: {
        StringBuilder builder;
        builder.append('[');
        for (UChar c = 0; c < 128; c++) {
            if (m_atomData.characterSet.get(c)) {
                if (isASCIIPrintable(c) && !isUnicodeCompatibleASCIIWhitespace(c))
                    builder.append(c);
                else
                    builder.append("\\u"_s, c);
            }
        }
        builder.append(']');
        builder.append(quantifierToString(m_quantifier));
        return builder.toString();
    }
    case TermType::Group: {
        StringBuilder builder;
        builder.append('(');
        for (const Term& term : m_atomData.group.terms)
            builder.append(term.toString());
        builder.append(')');
        builder.append(quantifierToString(m_quantifier));
        return builder.toString();
    }
    }
}
#endif

inline Term::Term()
{
}

inline Term::Term(char character, bool isCaseSensitive)
    : m_termType(TermType::CharacterSet)
{
    new (NotNull, &m_atomData.characterSet) CharacterSet();
    addCharacter(character, isCaseSensitive);
}

inline Term::Term(UniversalTransitionTag)
    : m_termType(TermType::CharacterSet)
{
    new (NotNull, &m_atomData.characterSet) CharacterSet();
    for (UChar i = 1; i < 128; ++i)
        m_atomData.characterSet.set(i);
}

inline Term::Term(CharacterSetTermTag, bool isInverted)
    : m_termType(TermType::CharacterSet)
{
    new (NotNull, &m_atomData.characterSet) CharacterSet();
    if (isInverted)
        m_atomData.characterSet.invert();
}

inline Term::Term(GroupTermTag)
    : m_termType(TermType::Group)
{
    new (NotNull, &m_atomData.group) Group();
}

inline Term::Term(EndOfLineAssertionTermTag)
    : Term(CharacterSetTerm, false)
{
    m_atomData.characterSet.set(0);
}

inline Term::Term(const Term& other)
    : m_termType(other.m_termType)
    , m_quantifier(other.m_quantifier)
{
    switch (m_termType) {
    case TermType::Empty:
        break;
    case TermType::CharacterSet:
        new (NotNull, &m_atomData.characterSet) CharacterSet(other.m_atomData.characterSet);
        break;
    case TermType::Group:
        new (NotNull, &m_atomData.group) Group(other.m_atomData.group);
        break;
    }
}

inline Term::Term(Term&& other)
    : m_termType(WTFMove(other.m_termType))
    , m_quantifier(WTFMove(other.m_quantifier))
{
    switch (m_termType) {
    case TermType::Empty:
        break;
    case TermType::CharacterSet:
        new (NotNull, &m_atomData.characterSet) CharacterSet(WTFMove(other.m_atomData.characterSet));
        break;
    case TermType::Group:
        new (NotNull, &m_atomData.group) Group(WTFMove(other.m_atomData.group));
        break;
    }
    other.destroy();
}

inline Term::Term(EmptyValueTag)
    : m_termType(TermType::Empty)
{
}

inline Term::~Term()
{
    destroy();
}

inline bool Term::isValid() const
{
    return m_termType != TermType::Empty;
}

inline void Term::addCharacter(UChar character, bool isCaseSensitive)
{
    ASSERT(isASCII(character));

    ASSERT_WITH_SECURITY_IMPLICATION(m_termType == TermType::CharacterSet);
    if (m_termType != TermType::CharacterSet)
        return;

    if (isCaseSensitive || !isASCIIAlpha(character))
        m_atomData.characterSet.set(character);
    else {
        m_atomData.characterSet.set(toASCIIUpper(character));
        m_atomData.characterSet.set(toASCIILower(character));
    }
}

inline void Term::extendGroupSubpattern(const Term& term)
{
    ASSERT_WITH_SECURITY_IMPLICATION(m_termType == TermType::Group);
    if (m_termType != TermType::Group)
        return;
    m_atomData.group.terms.append(term);
}

inline void Term::quantify(const AtomQuantifier& quantifier)
{
    ASSERT_WITH_MESSAGE(m_quantifier == AtomQuantifier::One, "Transition to quantified term should only happen once.");
    m_quantifier = quantifier;
}

inline ImmutableCharNFANodeBuilder Term::generateGraph(NFA& nfa, ImmutableCharNFANodeBuilder& source, const ActionList& finalActions) const
{
    ImmutableCharNFANodeBuilder newEnd(nfa);
    generateGraph(nfa, source, newEnd.nodeId());
    newEnd.setActions(finalActions.begin(), finalActions.end());
    return newEnd;
}

inline void Term::generateGraph(NFA& nfa, ImmutableCharNFANodeBuilder& source, uint32_t destination) const
{
    ASSERT(isValid());

    switch (m_quantifier) {
    case AtomQuantifier::One: {
        generateSubgraphForAtom(nfa, source, destination);
        break;
    }
    case AtomQuantifier::ZeroOrOne: {
        generateSubgraphForAtom(nfa, source, destination);
        source.addEpsilonTransition(destination);
        break;
    }
    case AtomQuantifier::ZeroOrMore: {
        ImmutableCharNFANodeBuilder repeatStart(nfa);
        source.addEpsilonTransition(repeatStart);

        ImmutableCharNFANodeBuilder repeatEnd(nfa);
        generateSubgraphForAtom(nfa, repeatStart, repeatEnd);
        repeatEnd.addEpsilonTransition(repeatStart);

        repeatEnd.addEpsilonTransition(destination);
        source.addEpsilonTransition(destination);
        break;
    }
    case AtomQuantifier::OneOrMore: {
        ImmutableCharNFANodeBuilder repeatStart(nfa);
        source.addEpsilonTransition(repeatStart);

        ImmutableCharNFANodeBuilder repeatEnd(nfa);
        generateSubgraphForAtom(nfa, repeatStart, repeatEnd);
        repeatEnd.addEpsilonTransition(repeatStart);

        repeatEnd.addEpsilonTransition(destination);
        break;
    }
    }
}

inline bool Term::isEndOfLineAssertion() const
{
    return m_termType == TermType::CharacterSet && m_atomData.characterSet.bitCount() == 1 && m_atomData.characterSet.get(0);
}

inline bool Term::matchesAtLeastOneCharacter() const
{
    ASSERT(isValid());

    if (m_quantifier == AtomQuantifier::ZeroOrOne || m_quantifier == AtomQuantifier::ZeroOrMore)
        return false;
    if (isEndOfLineAssertion())
        return false;

    if (m_termType == TermType::Group) {
        for (const Term& term : m_atomData.group.terms) {
            if (term.matchesAtLeastOneCharacter())
                return true;
        }
        return false;
    }
    return true;
}

inline bool Term::isKnownToMatchAnyString() const
{
    ASSERT(isValid());

    switch (m_termType) {
    case TermType::Empty:
        ASSERT_NOT_REACHED();
        break;
    case TermType::CharacterSet:
        // ".*" is the only simple term matching any string.
        return isUniversalTransition() && m_quantifier == AtomQuantifier::ZeroOrMore;
        break;
    case TermType::Group: {
        // There are infinitely many ways to match anything with groups, we just handle simple cases
        if (m_atomData.group.terms.size() != 1)
            return false;

        const Term& firstTermInGroup = m_atomData.group.terms.first();
        // -(.*) with any quantifier.
        if (firstTermInGroup.isKnownToMatchAnyString())
            return true;

        if (firstTermInGroup.isUniversalTransition()) {
            // -(.)*, (.+)*, (.?)* etc.
            if (m_quantifier == AtomQuantifier::ZeroOrMore)
                return true;

            // -(.+)?.
            if (m_quantifier == AtomQuantifier::ZeroOrOne && firstTermInGroup.m_quantifier == AtomQuantifier::OneOrMore)
                return true;

            // -(.?)+.
            if (m_quantifier == AtomQuantifier::OneOrMore && firstTermInGroup.m_quantifier == AtomQuantifier::ZeroOrOne)
                return true;
        }
        break;
    }
    }
    return false;
}

inline bool Term::hasFixedLength() const
{
    ASSERT(isValid());

    switch (m_termType) {
    case TermType::Empty:
        ASSERT_NOT_REACHED();
        break;
    case TermType::CharacterSet:
        return m_quantifier == AtomQuantifier::One;
    case TermType::Group: {
        if (m_quantifier != AtomQuantifier::One)
            return false;
        for (const Term& term : m_atomData.group.terms) {
            if (!term.hasFixedLength())
                return false;
        }
        return true;
    }
    }
    return false;
}

inline Term& Term::operator=(const Term& other)
{
    destroy();
    new (NotNull, this) Term(other);
    return *this;
}

inline Term& Term::operator=(Term&& other)
{
    destroy();
    new (NotNull, this) Term(WTFMove(other));
    return *this;
}

inline bool Term::operator==(const Term& other) const
{
    if (other.m_termType != m_termType || other.m_quantifier != m_quantifier)
        return false;

    switch (m_termType) {
    case TermType::Empty:
        return true;
    case TermType::CharacterSet:
        return m_atomData.characterSet == other.m_atomData.characterSet;
    case TermType::Group:
        return m_atomData.group == other.m_atomData.group;
    }
    ASSERT_NOT_REACHED();
    return false;
}

inline bool Term::isEmptyValue() const
{
    return m_termType == TermType::Empty;
}

inline bool Term::isUniversalTransition() const
{
    ASSERT(isValid());

    switch (m_termType) {
    case TermType::Empty:
        ASSERT_NOT_REACHED();
        break;
    case TermType::CharacterSet:
        return (m_atomData.characterSet.inverted() && !m_atomData.characterSet.bitCount())
            || (!m_atomData.characterSet.inverted() && m_atomData.characterSet.bitCount() == 127 && !m_atomData.characterSet.get(0));
    case TermType::Group:
        return m_atomData.group.terms.size() == 1 && m_atomData.group.terms.first().isUniversalTransition();
    }
    return false;
}

inline void Term::generateSubgraphForAtom(NFA& nfa, ImmutableCharNFANodeBuilder& source, const ImmutableCharNFANodeBuilder& destination) const
{
    generateSubgraphForAtom(nfa, source, destination.nodeId());
}

inline void Term::generateSubgraphForAtom(NFA& nfa, ImmutableCharNFANodeBuilder& source, uint32_t destination) const
{
    switch (m_termType) {
    case TermType::Empty:
        ASSERT_NOT_REACHED();
        source.addEpsilonTransition(destination);
        break;
    case TermType::CharacterSet: {
        if (!m_atomData.characterSet.inverted()) {
            UChar i = 0;
            while (true) {
                while (i < 128 && !m_atomData.characterSet.get(i))
                    ++i;
                if (i == 128)
                    break;

                UChar start = i;
                ++i;
                while (i < 128 && m_atomData.characterSet.get(i))
                    ++i;
                source.addTransition(start, i - 1, destination);
            }
        } else {
            UChar i = 1;
            while (true) {
                while (i < 128 && m_atomData.characterSet.get(i))
                    ++i;
                if (i == 128)
                    break;

                UChar start = i;
                ++i;
                while (i < 128 && !m_atomData.characterSet.get(i))
                    ++i;
                source.addTransition(start, i - 1, destination);
            }
        }
        break;
    }
    case TermType::Group: {
        if (m_atomData.group.terms.isEmpty()) {
            // FIXME: any kind of empty term could be avoided in the parser. This case should turned into an assertion.
            source.addEpsilonTransition(destination);
            return;
        }

        if (m_atomData.group.terms.size() == 1) {
            m_atomData.group.terms.first().generateGraph(nfa, source, destination);
            return;
        }

        ImmutableCharNFANodeBuilder lastTarget = m_atomData.group.terms.first().generateGraph(nfa, source, ActionList());
        for (unsigned i = 1; i < m_atomData.group.terms.size() - 1; ++i) {
            const Term& currentTerm = m_atomData.group.terms[i];
            ImmutableCharNFANodeBuilder newNode = currentTerm.generateGraph(nfa, lastTarget, ActionList());
            lastTarget = WTFMove(newNode);
        }
        const Term& lastTerm = m_atomData.group.terms.last();
        lastTerm.generateGraph(nfa, lastTarget, destination);
        break;
    }
    }
}

inline void Term::destroy()
{
    switch (m_termType) {
    case TermType::Empty:
        break;
    case TermType::CharacterSet:
        m_atomData.characterSet.~CharacterSet();
        break;
    case TermType::Group:
        m_atomData.group.~Group();
        break;
    }
    m_termType = TermType::Empty;
}

#if CONTENT_EXTENSIONS_PERFORMANCE_REPORTING
inline size_t Term::memoryUsed() const
{
    size_t extraMemory = 0;
    if (m_termType == TermType::Group) {
        for (const Term& term : m_atomData.group.terms)
            extraMemory += term.memoryUsed();
    }
    return sizeof(Term) + extraMemory;
}
#endif

} // namespace ContentExtensions
} // namespace WebCore

#endif // ENABLE(CONTENT_EXTENSIONS)
