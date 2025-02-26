/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2003-2017 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include "BidiContext.h"
#include "BidiRunList.h"
#include "WritingMode.h"
#include <wtf/HashMap.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/Vector.h>

namespace WebCore {

class RenderObject;

template<typename Iterator> class WhitespaceCollapsingState {
public:
    void reset()
    {
        m_transitions.clear();
        m_currentTransition = 0;
    }
    
    void startIgnoringSpaces(const Iterator& transition)
    {
        ASSERT(!(m_transitions.size() % 2));
        m_transitions.append(transition);
    }

    void stopIgnoringSpaces(const Iterator& transition)
    {
        ASSERT(m_transitions.size() % 2);
        m_transitions.append(transition);
    }

    // When ignoring spaces, this needs to be called for objects that need line boxes such as RenderInlines or
    // hard line breaks to ensure that they're not ignored.
    void ensureLineBoxInsideIgnoredSpaces(RenderObject& renderer)
    {
        Iterator transition(0, &renderer, 0);
        stopIgnoringSpaces(transition);
        startIgnoringSpaces(transition);
    }

    void decrementTransitionAt(size_t index)
    {
        m_transitions[index].fastDecrement();
    }

    const Vector<Iterator>& transitions() { return m_transitions; }
    size_t numTransitions() const { return m_transitions.size(); }
    size_t currentTransition() const { return m_currentTransition; }
    void setCurrentTransition(size_t currentTransition) { m_currentTransition = currentTransition; }
    void incrementCurrentTransition() { ++m_currentTransition; }
    void decrementNumTransitions() { m_transitions.shrink(m_transitions.size() - 1); }
    bool betweenTransitions() const { return m_currentTransition % 2; }
private:
    Vector<Iterator> m_transitions;
    size_t m_currentTransition { 0 };
};

// The BidiStatus at a given position (typically the end of a line) can
// be cached and then used to restart bidi resolution at that position.
struct BidiStatus {
    BidiStatus() = default;

    // Creates a BidiStatus representing a new paragraph root with a default direction.
    // Uses TextDirection as it only has two possibilities instead of UCharDirection which has at least 19.
    BidiStatus(TextDirection direction, bool isOverride)
        : eor(direction == TextDirection::LTR ? U_LEFT_TO_RIGHT : U_RIGHT_TO_LEFT)
        , lastStrong(eor)
        , last(eor)
        , context(BidiContext::create(direction == TextDirection::LTR ? 0 : 1, eor, isOverride))
    {
    }

    BidiStatus(UCharDirection eor, UCharDirection lastStrong, UCharDirection last, RefPtr<BidiContext>&& context)
        : eor(eor)
        , lastStrong(lastStrong)
        , last(last)
        , context(WTFMove(context))
    {
    }

    UCharDirection eor { U_OTHER_NEUTRAL };
    UCharDirection lastStrong { U_OTHER_NEUTRAL };
    UCharDirection last { U_OTHER_NEUTRAL };
    RefPtr<BidiContext> context;
};

struct BidiEmbedding {
    BidiEmbedding(UCharDirection direction, BidiEmbeddingSource source)
        : direction(direction)
        , source(source)
    {
    }

    UCharDirection direction;
    BidiEmbeddingSource source;
};

inline bool operator==(const BidiStatus& status1, const BidiStatus& status2)
{
    return status1.eor == status2.eor && status1.last == status2.last && status1.lastStrong == status2.lastStrong && *(status1.context) == *(status2.context);
}

struct BidiCharacterRun {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(BidiCharacterRun);
public:
    BidiCharacterRun(unsigned start, unsigned stop, BidiContext* context, UCharDirection direction)
        : m_start(start)
        , m_stop(stop)
        , m_override(context->override())
    {
        if (direction == U_OTHER_NEUTRAL)
            direction = context->dir();

        m_level = context->level();

        // add level of run (cases I1 & I2)
        if (m_level % 2) {
            if (direction == U_LEFT_TO_RIGHT || direction == U_ARABIC_NUMBER || direction == U_EUROPEAN_NUMBER)
                m_level++;
        } else {
            if (direction == U_RIGHT_TO_LEFT)
                m_level++;
            else if (direction == U_ARABIC_NUMBER || direction == U_EUROPEAN_NUMBER)
                m_level += 2;
        }
    }

    ~BidiCharacterRun()
    {
        // Delete the linked list in a loop to prevent destructor recursion.
        auto next = WTFMove(m_next);
        while (next)
            next = WTFMove(next->m_next);
    }

    unsigned start() const { return m_start; }
    unsigned stop() const { return m_stop; }
    unsigned char level() const { return m_level; }
    bool reversed(bool visuallyOrdered) { return m_level % 2 && !visuallyOrdered; }
    bool dirOverride(bool visuallyOrdered) { return m_override || visuallyOrdered; }

    BidiCharacterRun* next() const { return m_next.get(); }
    std::unique_ptr<BidiCharacterRun> takeNext() { return WTFMove(m_next); }
    void setNext(std::unique_ptr<BidiCharacterRun>&& next) { m_next = WTFMove(next); }

private:
    std::unique_ptr<BidiCharacterRun> m_next;

public:
    unsigned m_start;
    unsigned m_stop;
    unsigned char m_level;
    bool m_override : 1;
};

enum VisualDirectionOverride {
    NoVisualOverride,
    VisualLeftToRightOverride,
    VisualRightToLeftOverride
};

// BidiResolver is WebKit's implementation of the Unicode Bidi Algorithm
// http://unicode.org/reports/tr9
template<typename Iterator, typename Run, typename DerivedClass> class BidiResolverBase {
    WTF_MAKE_NONCOPYABLE(BidiResolverBase);
public:
    const Iterator& position() const { return m_current; }
    void setPositionIgnoringNestedIsolates(const Iterator& position) { m_current = position; }
    void setPosition(const Iterator& position, unsigned nestedIsolatedCount)
    {
        m_current = position;
        m_nestedIsolateCount = nestedIsolatedCount;
    }

    void increment() { static_cast<DerivedClass&>(*this).incrementInternal(); }

    BidiContext* context() const { return m_status.context.get(); }
    void setContext(RefPtr<BidiContext>&& context) { m_status.context = WTFMove(context); }

    void setLastDir(UCharDirection lastDir) { m_status.last = lastDir; }
    void setLastStrongDir(UCharDirection lastStrongDir) { m_status.lastStrong = lastStrongDir; }
    void setEorDir(UCharDirection eorDir) { m_status.eor = eorDir; }

    UCharDirection dir() const { return m_direction; }
    void setDir(UCharDirection direction) { m_direction = direction; }

    const BidiStatus& status() const { return m_status; }
    void setStatus(BidiStatus status) { m_status = status; }

    WhitespaceCollapsingState<Iterator>& whitespaceCollapsingState() { return m_whitespaceCollapsingState; }

    // The current algorithm handles nested isolates one layer of nesting at a time.
    // But when we layout each isolated span, we will walk into (and ignore) all
    // child isolated spans.
    void enterIsolate() { m_nestedIsolateCount++; }
    void exitIsolate() { ASSERT(m_nestedIsolateCount >= 1); m_nestedIsolateCount--; }
    bool inIsolate() const { return m_nestedIsolateCount; }

    void embed(UCharDirection, BidiEmbeddingSource);
    bool commitExplicitEmbedding();

    void createBidiRunsForLine(const Iterator& end, VisualDirectionOverride = NoVisualOverride, bool hardLineBreak = false);

    BidiRunList<Run>& runs() { return m_runs; }

    // FIXME: This used to be part of deleteRuns() but was a layering violation.
    // It's unclear if this is still needed.
    void markCurrentRunEmpty() { m_emptyRun = true; }

    void setWhitespaceCollapsingTransitionForIsolatedRun(Run&, size_t);
    unsigned whitespaceCollapsingTransitionForIsolatedRun(Run&);

protected:
    BidiResolverBase() = default;

    // FIXME: Instead of InlineBidiResolvers subclassing this method, we should
    // pass in some sort of Traits object which knows how to create runs for appending.
    void appendRun() { static_cast<DerivedClass&>(*this).appendRunInternal(); }
    bool needsContinuePastEnd() const { return static_cast<const DerivedClass&>(*this).needsContinuePastEndInternal(); }

    Iterator m_current;
    // sor and eor are "start of run" and "end of run" respectively and correpond
    // to abreviations used in UBA spec: http://unicode.org/reports/tr9/#BD7
    Iterator m_sor; // Points to the first character in the current run.
    Iterator m_eor; // Points to the last character in the current run.
    Iterator m_last;
    BidiStatus m_status;
    UCharDirection m_direction { U_OTHER_NEUTRAL };
    Iterator endOfLine;
    bool m_reachedEndOfLine { false };
    Iterator m_lastBeforeET; // Before a U_EUROPEAN_NUMBER_TERMINATOR
    bool m_emptyRun { true };

    // FIXME: This should not belong to the resolver, but rather be passed
    // into createBidiRunsForLine by the caller.
    BidiRunList<Run> m_runs;

    WhitespaceCollapsingState<Iterator> m_whitespaceCollapsingState;

    unsigned m_nestedIsolateCount { 0 };
    UncheckedKeyHashMap<Run*, unsigned> m_whitespaceCollapsingTransitionForIsolatedRun;

private:
    void raiseExplicitEmbeddingLevel(UCharDirection from, UCharDirection to);
    void lowerExplicitEmbeddingLevel(UCharDirection from);
    void checkDirectionInLowerRaiseEmbeddingLevel();

    void updateStatusLastFromCurrentDirection(UCharDirection);
    void reorderRunsFromLevels();
    void incrementInternal() { m_current.increment(); }
    void appendRunInternal();
    bool needsContinuePastEndInternal() const { return true; }

    Vector<BidiEmbedding, 8> m_currentExplicitEmbeddingSequence;
};

template<typename Iterator, typename Run>
class BidiResolver : public BidiResolverBase<Iterator, Run, BidiResolver<Iterator, Run>> {
};

template<typename Iterator, typename Run, typename IsolateRun>
class BidiResolverWithIsolate : public BidiResolverBase<Iterator, Run, BidiResolverWithIsolate<Iterator, Run, IsolateRun>> {
public:
    ~BidiResolverWithIsolate();

    void incrementInternal();
    void appendRunInternal();
    bool needsContinuePastEndInternal() const;
    Vector<IsolateRun>& isolatedRuns() { return m_isolatedRuns; }

private:
    Vector<IsolateRun> m_isolatedRuns;
};

template<typename Iterator, typename Run, typename IsolateRun>
inline BidiResolverWithIsolate<Iterator, Run, IsolateRun>::~BidiResolverWithIsolate()
{
    // The owner of this resolver should have handled the isolated runs.
    ASSERT(m_isolatedRuns.isEmpty());
}

template<typename Iterator, typename Run, typename DerivedClass>
void BidiResolverBase<Iterator, Run, DerivedClass>::appendRunInternal()
{
    if (!m_emptyRun && !m_eor.atEnd()) {
        unsigned startOffset = m_sor.offset();
        unsigned endOffset = m_eor.offset();

        if (!endOfLine.atEnd() && endOffset >= endOfLine.offset()) {
            m_reachedEndOfLine = true;
            endOffset = endOfLine.offset();
        }

        if (endOffset >= startOffset)
            m_runs.appendRun(makeUnique<Run>(startOffset, endOffset + 1, context(), m_direction));

        m_eor.increment();
        m_sor = m_eor;
    }

    m_direction = U_OTHER_NEUTRAL;
    m_status.eor = U_OTHER_NEUTRAL;
}

template<typename Iterator, typename Run, typename DerivedClass>
void BidiResolverBase<Iterator, Run, DerivedClass>::embed(UCharDirection dir, BidiEmbeddingSource source)
{
    // Isolated spans compute base directionality during their own UBA run.
    // Do not insert fake embed characters once we enter an isolated span.
    ASSERT(!inIsolate());

    ASSERT(dir == U_POP_DIRECTIONAL_FORMAT || dir == U_LEFT_TO_RIGHT_EMBEDDING || dir == U_LEFT_TO_RIGHT_OVERRIDE || dir == U_RIGHT_TO_LEFT_EMBEDDING || dir == U_RIGHT_TO_LEFT_OVERRIDE);
    m_currentExplicitEmbeddingSequence.append(BidiEmbedding(dir, source));
}

template<typename Iterator, typename Run, typename DerivedClass>
void BidiResolverBase<Iterator, Run, DerivedClass>::checkDirectionInLowerRaiseEmbeddingLevel()
{
    ASSERT(m_status.eor != U_OTHER_NEUTRAL || m_eor.atEnd());
    ASSERT(m_status.last != U_DIR_NON_SPACING_MARK
        && m_status.last != U_BOUNDARY_NEUTRAL
        && m_status.last != U_RIGHT_TO_LEFT_EMBEDDING
        && m_status.last != U_LEFT_TO_RIGHT_EMBEDDING
        && m_status.last != U_RIGHT_TO_LEFT_OVERRIDE 
        && m_status.last != U_LEFT_TO_RIGHT_OVERRIDE
        && m_status.last != U_POP_DIRECTIONAL_FORMAT);
    if (m_direction == U_OTHER_NEUTRAL)
        m_direction = m_status.lastStrong == U_LEFT_TO_RIGHT ? U_LEFT_TO_RIGHT : U_RIGHT_TO_LEFT;
}

template<typename Iterator, typename Run, typename DerivedClass>
void BidiResolverBase<Iterator, Run, DerivedClass>::lowerExplicitEmbeddingLevel(UCharDirection from)
{
    if (!m_emptyRun && m_eor != m_last) {
        checkDirectionInLowerRaiseEmbeddingLevel();
        // bidi.sor ... bidi.eor ... bidi.last eor; need to append the bidi.sor-bidi.eor run or extend it through bidi.last
        if (from == U_LEFT_TO_RIGHT) {
            // bidi.sor ... bidi.eor ... bidi.last L
            if (m_status.eor == U_EUROPEAN_NUMBER) {
                if (m_status.lastStrong != U_LEFT_TO_RIGHT) {
                    m_direction = U_EUROPEAN_NUMBER;
                    appendRun();
                }
            } else if (m_status.eor == U_ARABIC_NUMBER) {
                m_direction = U_ARABIC_NUMBER;
                appendRun();
            } else if (m_status.lastStrong != U_LEFT_TO_RIGHT) {
                appendRun();
                m_direction = U_LEFT_TO_RIGHT;
            }
        } else if (m_status.eor == U_EUROPEAN_NUMBER || m_status.eor == U_ARABIC_NUMBER || m_status.lastStrong == U_LEFT_TO_RIGHT) {
            appendRun();
            m_direction = U_RIGHT_TO_LEFT;
        }
        m_eor = m_last;
    }

    appendRun();
    m_emptyRun = true;

    // sor for the new run is determined by the higher level (rule X10)
    setLastDir(from);
    setLastStrongDir(from);
    m_eor = Iterator();
}

template<typename Iterator, typename Run, typename DerivedClass>
void BidiResolverBase<Iterator, Run, DerivedClass>::raiseExplicitEmbeddingLevel(UCharDirection from, UCharDirection to)
{
    if (!m_emptyRun && m_eor != m_last) {
        checkDirectionInLowerRaiseEmbeddingLevel();
        // bidi.sor ... bidi.eor ... bidi.last eor; need to append the bidi.sor-bidi.eor run or extend it through bidi.last
        if (to == U_LEFT_TO_RIGHT) {
            // bidi.sor ... bidi.eor ... bidi.last L
            if (m_status.eor == U_EUROPEAN_NUMBER) {
                if (m_status.lastStrong != U_LEFT_TO_RIGHT) {
                    m_direction = U_EUROPEAN_NUMBER;
                    appendRun();
                }
            } else if (m_status.eor == U_ARABIC_NUMBER) {
                m_direction = U_ARABIC_NUMBER;
                appendRun();
            } else if (m_status.lastStrong != U_LEFT_TO_RIGHT && from == U_LEFT_TO_RIGHT) {
                appendRun();
                m_direction = U_LEFT_TO_RIGHT;
            }
        } else if (m_status.eor == U_ARABIC_NUMBER
            || (m_status.eor == U_EUROPEAN_NUMBER && (m_status.lastStrong != U_LEFT_TO_RIGHT || from == U_RIGHT_TO_LEFT))
            || (m_status.eor != U_EUROPEAN_NUMBER && m_status.lastStrong == U_LEFT_TO_RIGHT && from == U_RIGHT_TO_LEFT)) {
            appendRun();
            m_direction = U_RIGHT_TO_LEFT;
        }
        m_eor = m_last;
    }

    appendRun();
    m_emptyRun = true;

    setLastDir(to);
    setLastStrongDir(to);
    m_eor = Iterator();
}

template<typename Iterator, typename Run, typename DerivedClass>
bool BidiResolverBase<Iterator, Run, DerivedClass>::commitExplicitEmbedding()
{
    // When we're "inIsolate()" we're resolving the parent context which
    // ignores (skips over) the isolated content, including embedding levels.
    // We should never accrue embedding levels while skipping over isolated content.
    ASSERT(!inIsolate() || m_currentExplicitEmbeddingSequence.isEmpty());

    auto fromLevel = context()->level();
    RefPtr<BidiContext> toContext = context();

    for (auto& embedding : m_currentExplicitEmbeddingSequence) {
        if (embedding.direction == U_POP_DIRECTIONAL_FORMAT) {
            if (auto* parentContext = toContext->parent())
                toContext = parentContext;
        } else {
            UCharDirection direction = (embedding.direction == U_RIGHT_TO_LEFT_EMBEDDING || embedding.direction == U_RIGHT_TO_LEFT_OVERRIDE) ? U_RIGHT_TO_LEFT : U_LEFT_TO_RIGHT;
            bool override = embedding.direction == U_LEFT_TO_RIGHT_OVERRIDE || embedding.direction == U_RIGHT_TO_LEFT_OVERRIDE;
            unsigned char level = toContext->level();
            if (direction == U_RIGHT_TO_LEFT)
                level = nextGreaterOddLevel(level);
            else
                level = nextGreaterEvenLevel(level);
            if (level < 61)
                toContext = BidiContext::create(level, direction, override, embedding.source, toContext.get());
        }
    }

    auto toLevel = toContext->level();

    if (toLevel > fromLevel)
        raiseExplicitEmbeddingLevel(fromLevel % 2 ? U_RIGHT_TO_LEFT : U_LEFT_TO_RIGHT, toLevel % 2 ? U_RIGHT_TO_LEFT : U_LEFT_TO_RIGHT);
    else if (toLevel < fromLevel)
        lowerExplicitEmbeddingLevel(fromLevel % 2 ? U_RIGHT_TO_LEFT : U_LEFT_TO_RIGHT);

    setContext(WTFMove(toContext));

    m_currentExplicitEmbeddingSequence.clear();

    return fromLevel != toLevel;
}

template<typename Iterator, typename Run, typename DerivedClass>
inline void BidiResolverBase<Iterator, Run, DerivedClass>::updateStatusLastFromCurrentDirection(UCharDirection dirCurrent)
{
    switch (dirCurrent) {
    case U_EUROPEAN_NUMBER_TERMINATOR:
        if (m_status.last != U_EUROPEAN_NUMBER)
            m_status.last = U_EUROPEAN_NUMBER_TERMINATOR;
        break;
    case U_EUROPEAN_NUMBER_SEPARATOR:
    case U_COMMON_NUMBER_SEPARATOR:
    case U_SEGMENT_SEPARATOR:
    case U_WHITE_SPACE_NEUTRAL:
    case U_OTHER_NEUTRAL:
        switch (m_status.last) {
        case U_LEFT_TO_RIGHT:
        case U_RIGHT_TO_LEFT:
        case U_RIGHT_TO_LEFT_ARABIC:
        case U_EUROPEAN_NUMBER:
        case U_ARABIC_NUMBER:
            m_status.last = dirCurrent;
            break;
        default:
            m_status.last = U_OTHER_NEUTRAL;
        }
        break;
    case U_DIR_NON_SPACING_MARK:
    case U_BOUNDARY_NEUTRAL:
    case U_RIGHT_TO_LEFT_EMBEDDING:
    case U_LEFT_TO_RIGHT_EMBEDDING:
    case U_RIGHT_TO_LEFT_OVERRIDE:
    case U_LEFT_TO_RIGHT_OVERRIDE:
    case U_POP_DIRECTIONAL_FORMAT:
        // ignore these
        break;
    case U_EUROPEAN_NUMBER:
        FALLTHROUGH;
    default:
        m_status.last = dirCurrent;
    }
}

template<typename Iterator, typename Run, typename DerivedClass>
inline void BidiResolverBase<Iterator, Run, DerivedClass>::reorderRunsFromLevels()
{
    unsigned char levelLow = 128;
    unsigned char levelHigh = 0;
    for (Run* run = m_runs.firstRun(); run; run = run->next()) {
        levelHigh = std::max(run->level(), levelHigh);
        levelLow = std::min(run->level(), levelLow);
    }

    // This implements reordering of the line (L2 according to Bidi spec):
    // http://unicode.org/reports/tr9/#L2
    // L2. From the highest level found in the text to the lowest odd level on each line,
    // reverse any contiguous sequence of characters that are at that level or higher.

    // Reversing is only done up to the lowest odd level.
    if (!(levelLow % 2))
        levelLow++;

    unsigned count = m_runs.runCount() - 1;

    while (levelHigh >= levelLow) {
        unsigned i = 0;
        Run* run = m_runs.firstRun();
        while (i < count) {
            for (;i < count && run && run->level() < levelHigh; i++)
                run = run->next();
            unsigned start = i;
            for (;i <= count && run && run->level() >= levelHigh; i++)
                run = run->next();
            unsigned end = i - 1;
            m_runs.reverseRuns(start, end);
        }
        levelHigh--;
    }
}

template<typename Iterator, typename Run, typename DerivedClass>
void BidiResolverBase<Iterator, Run, DerivedClass>::createBidiRunsForLine(const Iterator& end, VisualDirectionOverride override, bool hardLineBreak)
{
    ASSERT(m_direction == U_OTHER_NEUTRAL);

    if (override != NoVisualOverride) {
        m_emptyRun = false;
        m_sor = m_current;
        m_eor = Iterator();
        while (m_current != end && !m_current.atEnd()) {
            m_eor = m_current;
            increment();
        }
        m_direction = override == VisualLeftToRightOverride ? U_LEFT_TO_RIGHT : U_RIGHT_TO_LEFT;
        appendRun();
        m_runs.setLogicallyLastRun(m_runs.lastRun());
        if (override == VisualRightToLeftOverride && m_runs.runCount())
            m_runs.reverseRuns(0, m_runs.runCount() - 1);
        return;
    }

    m_emptyRun = true;

    m_eor = Iterator();

    m_last = m_current;
    bool pastEnd = false;
    BidiResolverBase<Iterator, Run, DerivedClass> stateAtEnd;

    while (true) {
        UCharDirection dirCurrent;
        if (pastEnd && (hardLineBreak || m_current.atEnd())) {
            BidiContext* c = context();
            if (hardLineBreak) {
                // A deviation from the Unicode Bidi Algorithm in order to match
                // WinIE and user expectations: hard line breaks reset bidi state
                // coming from unicode bidi control characters, but not those from
                // DOM nodes with specified directionality
                stateAtEnd.setContext(c->copyStackRemovingUnicodeEmbeddingContexts());

                dirCurrent = stateAtEnd.context()->dir();
                stateAtEnd.setEorDir(dirCurrent);
                stateAtEnd.setLastDir(dirCurrent);
                stateAtEnd.setLastStrongDir(dirCurrent);
            } else {
                while (c->parent())
                    c = c->parent();
                dirCurrent = c->dir();
            }
        } else {
            dirCurrent = m_current.direction();
            if (context()->override()
                    && dirCurrent != U_RIGHT_TO_LEFT_EMBEDDING
                    && dirCurrent != U_LEFT_TO_RIGHT_EMBEDDING
                    && dirCurrent != U_RIGHT_TO_LEFT_OVERRIDE
                    && dirCurrent != U_LEFT_TO_RIGHT_OVERRIDE
                    && dirCurrent != U_POP_DIRECTIONAL_FORMAT)
                dirCurrent = context()->dir();
            else if (dirCurrent == U_DIR_NON_SPACING_MARK)
                dirCurrent = m_status.last;
        }

#if PLATFORM(WIN)
        // Our Windows build hasn't updated its headers from ICU 6.1, which doesn't have these symbols.
        const UCharDirection U_FIRST_STRONG_ISOLATE = static_cast<UCharDirection>(19);
        const UCharDirection U_LEFT_TO_RIGHT_ISOLATE = static_cast<UCharDirection>(20);
        const UCharDirection U_RIGHT_TO_LEFT_ISOLATE = static_cast<UCharDirection>(21);
        const UCharDirection U_POP_DIRECTIONAL_ISOLATE = static_cast<UCharDirection>(22);
#endif
        // We ignore all character directionality while in unicode-bidi: isolate spans.
        // We'll handle ordering the isolated characters in a second pass.
        if (inIsolate() || dirCurrent == U_FIRST_STRONG_ISOLATE || dirCurrent == U_LEFT_TO_RIGHT_ISOLATE || dirCurrent == U_RIGHT_TO_LEFT_ISOLATE || dirCurrent == U_POP_DIRECTIONAL_ISOLATE)
            dirCurrent = U_OTHER_NEUTRAL;

        ASSERT(m_status.eor != U_OTHER_NEUTRAL || m_eor.atEnd());
        switch (dirCurrent) {

        // embedding and overrides (X1-X9 in the Bidi specs)
        case U_RIGHT_TO_LEFT_EMBEDDING:
        case U_LEFT_TO_RIGHT_EMBEDDING:
        case U_RIGHT_TO_LEFT_OVERRIDE:
        case U_LEFT_TO_RIGHT_OVERRIDE:
        case U_POP_DIRECTIONAL_FORMAT:
            embed(dirCurrent, FromUnicode);
            commitExplicitEmbedding();
            break;

        // strong types
        case U_LEFT_TO_RIGHT:
            switch(m_status.last) {
                case U_RIGHT_TO_LEFT:
                case U_RIGHT_TO_LEFT_ARABIC:
                case U_EUROPEAN_NUMBER:
                case U_ARABIC_NUMBER:
                    if (m_status.last != U_EUROPEAN_NUMBER || m_status.lastStrong != U_LEFT_TO_RIGHT)
                        appendRun();
                    break;
                case U_LEFT_TO_RIGHT:
                    break;
                case U_EUROPEAN_NUMBER_SEPARATOR:
                case U_EUROPEAN_NUMBER_TERMINATOR:
                case U_COMMON_NUMBER_SEPARATOR:
                case U_BOUNDARY_NEUTRAL:
                case U_BLOCK_SEPARATOR:
                case U_SEGMENT_SEPARATOR:
                case U_WHITE_SPACE_NEUTRAL:
                case U_OTHER_NEUTRAL:
                    if (m_status.eor == U_EUROPEAN_NUMBER) {
                        if (m_status.lastStrong != U_LEFT_TO_RIGHT) {
                            // the numbers need to be on a higher embedding level, so let's close that run
                            m_direction = U_EUROPEAN_NUMBER;
                            appendRun();
                            if (context()->dir() != U_LEFT_TO_RIGHT) {
                                // the neutrals take the embedding direction, which is R
                                m_eor = m_last;
                                m_direction = U_RIGHT_TO_LEFT;
                                appendRun();
                            }
                        }
                    } else if (m_status.eor == U_ARABIC_NUMBER) {
                        // Arabic numbers are always on a higher embedding level, so let's close that run
                        m_direction = U_ARABIC_NUMBER;
                        appendRun();
                        if (context()->dir() != U_LEFT_TO_RIGHT) {
                            // the neutrals take the embedding direction, which is R
                            m_eor = m_last;
                            m_direction = U_RIGHT_TO_LEFT;
                            appendRun();
                        }
                    } else if (m_status.lastStrong != U_LEFT_TO_RIGHT) {
                        //last stuff takes embedding dir
                        if (context()->dir() == U_RIGHT_TO_LEFT) {
                            m_eor = m_last; 
                            m_direction = U_RIGHT_TO_LEFT;
                        }
                        appendRun();
                    }
                    break;
                default:
                    break;
            }
            m_eor = m_current;
            m_status.eor = U_LEFT_TO_RIGHT;
            m_status.lastStrong = U_LEFT_TO_RIGHT;
            m_direction = U_LEFT_TO_RIGHT;
            break;
        case U_RIGHT_TO_LEFT_ARABIC:
        case U_RIGHT_TO_LEFT:
            switch (m_status.last) {
                case U_LEFT_TO_RIGHT:
                case U_EUROPEAN_NUMBER:
                case U_ARABIC_NUMBER:
                    appendRun();
                    FALLTHROUGH;
                case U_RIGHT_TO_LEFT:
                case U_RIGHT_TO_LEFT_ARABIC:
                    break;
                case U_EUROPEAN_NUMBER_SEPARATOR:
                case U_EUROPEAN_NUMBER_TERMINATOR:
                case U_COMMON_NUMBER_SEPARATOR:
                case U_BOUNDARY_NEUTRAL:
                case U_BLOCK_SEPARATOR:
                case U_SEGMENT_SEPARATOR:
                case U_WHITE_SPACE_NEUTRAL:
                case U_OTHER_NEUTRAL:
                    if (m_status.eor == U_EUROPEAN_NUMBER) {
                        if (m_status.lastStrong == U_LEFT_TO_RIGHT && context()->dir() == U_LEFT_TO_RIGHT)
                            m_eor = m_last;
                        appendRun();
                    } else if (m_status.eor == U_ARABIC_NUMBER)
                        appendRun();
                    else if (m_status.lastStrong == U_LEFT_TO_RIGHT) {
                        if (context()->dir() == U_LEFT_TO_RIGHT)
                            m_eor = m_last;
                        appendRun();
                    }
                    break;
                default:
                    break;
            }
            m_eor = m_current;
            m_status.eor = U_RIGHT_TO_LEFT;
            m_status.lastStrong = dirCurrent;
            m_direction = U_RIGHT_TO_LEFT;
            break;

            // weak types:

        case U_EUROPEAN_NUMBER:
            if (m_status.lastStrong != U_RIGHT_TO_LEFT_ARABIC) {
                // if last strong was AL change EN to AN
                switch (m_status.last) {
                    case U_EUROPEAN_NUMBER:
                    case U_LEFT_TO_RIGHT:
                        break;
                    case U_RIGHT_TO_LEFT:
                    case U_RIGHT_TO_LEFT_ARABIC:
                    case U_ARABIC_NUMBER:
                        m_eor = m_last;
                        appendRun();
                        m_direction = U_EUROPEAN_NUMBER;
                        break;
                    case U_EUROPEAN_NUMBER_SEPARATOR:
                    case U_COMMON_NUMBER_SEPARATOR:
                        if (m_status.eor == U_EUROPEAN_NUMBER)
                            break;
                        FALLTHROUGH;
                    case U_EUROPEAN_NUMBER_TERMINATOR:
                    case U_BOUNDARY_NEUTRAL:
                    case U_BLOCK_SEPARATOR:
                    case U_SEGMENT_SEPARATOR:
                    case U_WHITE_SPACE_NEUTRAL:
                    case U_OTHER_NEUTRAL:
                        if (m_status.eor == U_EUROPEAN_NUMBER) {
                            if (m_status.lastStrong == U_RIGHT_TO_LEFT) {
                                // ENs on both sides behave like Rs, so the neutrals should be R.
                                // Terminate the EN run.
                                appendRun();
                                // Make an R run.
                                m_eor = m_status.last == U_EUROPEAN_NUMBER_TERMINATOR ? m_lastBeforeET : m_last;
                                m_direction = U_RIGHT_TO_LEFT;
                                appendRun();
                                // Begin a new EN run.
                                m_direction = U_EUROPEAN_NUMBER;
                            }
                        } else if (m_status.eor == U_ARABIC_NUMBER) {
                            // Terminate the AN run.
                            appendRun();
                            if (m_status.lastStrong == U_RIGHT_TO_LEFT || context()->dir() == U_RIGHT_TO_LEFT) {
                                // Make an R run.
                                m_eor = m_status.last == U_EUROPEAN_NUMBER_TERMINATOR ? m_lastBeforeET : m_last;
                                m_direction = U_RIGHT_TO_LEFT;
                                appendRun();
                                // Begin a new EN run.
                                m_direction = U_EUROPEAN_NUMBER;
                            }
                        } else if (m_status.lastStrong == U_RIGHT_TO_LEFT) {
                            // Extend the R run to include the neutrals.
                            m_eor = m_status.last == U_EUROPEAN_NUMBER_TERMINATOR ? m_lastBeforeET : m_last;
                            m_direction = U_RIGHT_TO_LEFT;
                            appendRun();
                            // Begin a new EN run.
                            m_direction = U_EUROPEAN_NUMBER;
                        }
                        break;
                    default:
                        break;
                }
                m_eor = m_current;
                m_status.eor = U_EUROPEAN_NUMBER;
                if (m_direction == U_OTHER_NEUTRAL)
                    m_direction = U_LEFT_TO_RIGHT;
                break;
            }
            FALLTHROUGH;
        case U_ARABIC_NUMBER:
            dirCurrent = U_ARABIC_NUMBER;
            switch (m_status.last) {
                case U_LEFT_TO_RIGHT:
                    if (context()->dir() == U_LEFT_TO_RIGHT)
                        appendRun();
                    break;
                case U_ARABIC_NUMBER:
                    break;
                case U_RIGHT_TO_LEFT:
                case U_RIGHT_TO_LEFT_ARABIC:
                case U_EUROPEAN_NUMBER:
                    m_eor = m_last;
                    appendRun();
                    break;
                case U_COMMON_NUMBER_SEPARATOR:
                    if (m_status.eor == U_ARABIC_NUMBER)
                        break;
                    FALLTHROUGH;
                case U_EUROPEAN_NUMBER_SEPARATOR:
                case U_EUROPEAN_NUMBER_TERMINATOR:
                case U_BOUNDARY_NEUTRAL:
                case U_BLOCK_SEPARATOR:
                case U_SEGMENT_SEPARATOR:
                case U_WHITE_SPACE_NEUTRAL:
                case U_OTHER_NEUTRAL:
                    if (m_status.eor == U_ARABIC_NUMBER
                        || (m_status.eor == U_EUROPEAN_NUMBER && (m_status.lastStrong == U_RIGHT_TO_LEFT || context()->dir() == U_RIGHT_TO_LEFT))
                        || (m_status.eor != U_EUROPEAN_NUMBER && m_status.lastStrong == U_LEFT_TO_RIGHT && context()->dir() == U_RIGHT_TO_LEFT)) {
                        // Terminate the run before the neutrals.
                        appendRun();
                        // Begin an R run for the neutrals.
                        m_direction = U_RIGHT_TO_LEFT;
                    } else if (m_direction == U_OTHER_NEUTRAL)
                        m_direction = m_status.lastStrong == U_LEFT_TO_RIGHT ? U_LEFT_TO_RIGHT : U_RIGHT_TO_LEFT;
                    m_eor = m_last;
                    appendRun();
                    break;
                default:
                    break;
            }
            m_eor = m_current;
            m_status.eor = U_ARABIC_NUMBER;
            if (m_direction == U_OTHER_NEUTRAL)
                m_direction = U_ARABIC_NUMBER;
            break;
        case U_EUROPEAN_NUMBER_SEPARATOR:
        case U_COMMON_NUMBER_SEPARATOR:
            break;
        case U_EUROPEAN_NUMBER_TERMINATOR:
            if (m_status.last == U_EUROPEAN_NUMBER) {
                dirCurrent = U_EUROPEAN_NUMBER;
                m_eor = m_current;
                m_status.eor = dirCurrent;
            } else if (m_status.last != U_EUROPEAN_NUMBER_TERMINATOR)
                m_lastBeforeET = m_emptyRun ? m_eor : m_last;
            break;

        // boundary neutrals should be ignored
        case U_BOUNDARY_NEUTRAL:
            if (m_eor == m_last)
                m_eor = m_current;
            break;
            // neutrals
        case U_BLOCK_SEPARATOR:
            // FIXME: What do we do with newline and paragraph separators that come to here?
            break;
        case U_SEGMENT_SEPARATOR:
            // FIXME: Implement rule L1.
            break;
        case U_WHITE_SPACE_NEUTRAL:
            break;
        case U_OTHER_NEUTRAL:
            break;
        default:
            break;
        }

        if (pastEnd && (m_eor == m_current || !needsContinuePastEnd())) {
            if (!m_reachedEndOfLine) {
                m_eor = endOfLine;
                switch (m_status.eor) {
                    case U_LEFT_TO_RIGHT:
                    case U_RIGHT_TO_LEFT:
                    case U_ARABIC_NUMBER:
                        m_direction = m_status.eor;
                        break;
                    case U_EUROPEAN_NUMBER:
                        m_direction = m_status.lastStrong == U_LEFT_TO_RIGHT ? U_LEFT_TO_RIGHT : U_EUROPEAN_NUMBER;
                        break;
                    default:
                        // FIXME: handle neutrals in this case. See https://bugs.webkit.org/show_bug.cgi?id=204817
                        break;
                }
                appendRun();
            }
            m_current = end;
            m_status = stateAtEnd.m_status;
            m_sor = stateAtEnd.m_sor; 
            m_eor = stateAtEnd.m_eor;
            m_last = stateAtEnd.m_last;
            m_reachedEndOfLine = stateAtEnd.m_reachedEndOfLine;
            m_lastBeforeET = stateAtEnd.m_lastBeforeET;
            m_emptyRun = stateAtEnd.m_emptyRun;
            m_direction = U_OTHER_NEUTRAL;
            break;
        }

        updateStatusLastFromCurrentDirection(dirCurrent);
        m_last = m_current;

        if (m_emptyRun) {
            m_sor = m_current;
            m_emptyRun = false;
        }

        increment();
        if (!m_currentExplicitEmbeddingSequence.isEmpty()) {
            bool committed = commitExplicitEmbedding();
            if (committed && pastEnd) {
                m_current = end;
                m_status = stateAtEnd.m_status;
                m_sor = stateAtEnd.m_sor; 
                m_eor = stateAtEnd.m_eor;
                m_last = stateAtEnd.m_last;
                m_reachedEndOfLine = stateAtEnd.m_reachedEndOfLine;
                m_lastBeforeET = stateAtEnd.m_lastBeforeET;
                m_emptyRun = stateAtEnd.m_emptyRun;
                m_direction = U_OTHER_NEUTRAL;
                break;
            }
        }

        if (!pastEnd && (m_current == end || m_current.atEnd())) {
            if (m_emptyRun)
                break;
            stateAtEnd.m_status = m_status;
            stateAtEnd.m_sor = m_sor;
            stateAtEnd.m_eor = m_eor;
            stateAtEnd.m_last = m_last;
            stateAtEnd.m_reachedEndOfLine = m_reachedEndOfLine;
            stateAtEnd.m_lastBeforeET = m_lastBeforeET;
            stateAtEnd.m_emptyRun = m_emptyRun;
            endOfLine = m_last;
            pastEnd = true;
        }
    }

    m_runs.setLogicallyLastRun(m_runs.lastRun());
    reorderRunsFromLevels();
    endOfLine = Iterator();
}

template<typename Iterator, typename Run, typename DerivedClass>
void BidiResolverBase<Iterator, Run, DerivedClass>::setWhitespaceCollapsingTransitionForIsolatedRun(Run& run, size_t transition)
{
    ASSERT(!m_whitespaceCollapsingTransitionForIsolatedRun.contains(&run));
    m_whitespaceCollapsingTransitionForIsolatedRun.add(&run, transition);
}

template<typename Iterator, typename Run, typename DerivedClass>
unsigned BidiResolverBase<Iterator, Run, DerivedClass>::whitespaceCollapsingTransitionForIsolatedRun(Run& run)
{
    return m_whitespaceCollapsingTransitionForIsolatedRun.take(&run);
}

} // namespace WebCore
